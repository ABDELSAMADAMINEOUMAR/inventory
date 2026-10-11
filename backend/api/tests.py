import base64
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Company, User, Category, Product, Sale, Invoice, InventoryEntry

STRONG_PW = 'Correct-Horse-Battery-9'


def make_user(company, role='admin', email=None, password=STRONG_PW):
    email = email or f'{role}{User.objects.count()}@example.org'
    user = User(username=email, email=email, name=role.title(), role=role, company=company,
                status='active', is_active=True)
    user.set_password(password)
    user.save()
    return user


def client_for(user):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(user).access_token}')
    return client


class TenantFixture(TestCase):
    def setUp(self):
        self.company_a = Company.objects.create(name='Alpha')
        self.company_b = Company.objects.create(name='Beta')
        self.admin_a = make_user(self.company_a, 'admin', 'admin_a@example.org')
        self.cashier_a = make_user(self.company_a, 'cashier', 'cashier_a@example.org')
        self.admin_b = make_user(self.company_b, 'admin', 'admin_b@example.org')
        self.owner = make_user(None, 'platform_owner', 'owner@example.org')
        self.product_a = Product.objects.create(company=self.company_a, code='A1', name='Widget', purchase_price=100, quantity=10)
        self.product_b = Product.objects.create(company=self.company_b, code='B1', name='Secret B', purchase_price=50, quantity=10)


class PrivilegeEscalationTests(TenantFixture):
    def test_admin_cannot_become_platform_owner(self):
        res = client_for(self.admin_a).patch(f'/api/users/{self.admin_a.id}/', {'role': 'platform_owner'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.admin_a.refresh_from_db()
        self.assertEqual(self.admin_a.role, 'admin')

    def test_admin_cannot_grant_platform_owner_to_others(self):
        res = client_for(self.admin_a).patch(f'/api/users/{self.cashier_a.id}/', {'role': 'platform_owner'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_admin_cannot_move_user_to_another_company(self):
        client_for(self.admin_a).patch(f'/api/users/{self.admin_a.id}/', {'company': self.company_b.id}, format='json')
        self.admin_a.refresh_from_db()
        self.assertEqual(self.admin_a.company_id, self.company_a.id)

    def test_cashier_cannot_edit_company(self):
        res = client_for(self.cashier_a).patch(
            f'/api/platform/companies/{self.company_a.id}/', {'subscription_plan': 'enterprise', 'name': '<img src=x>'}, format='json')
        self.assertEqual(res.status_code, 403)

    def test_tenant_admin_can_only_edit_name_and_currency(self):
        res = client_for(self.admin_a).patch(
            f'/api/platform/companies/{self.company_a.id}/',
            {'name': 'Alpha Ltd', 'currency': 'EUR', 'subscription_plan': 'enterprise', 'monthly_fee': '0', 'status': 'active'},
            format='json')
        self.assertEqual(res.status_code, 200)
        self.company_a.refresh_from_db()
        self.assertEqual(self.company_a.name, 'Alpha Ltd')
        self.assertEqual(self.company_a.currency, 'EUR')
        self.assertEqual(self.company_a.subscription_plan, 'free')

    def test_settings_endpoint_cannot_change_plan(self):
        client_for(self.admin_a).patch('/api/settings/', {'subscription_plan': 'pro', 'monthly_fee': '0'}, format='json')
        self.company_a.refresh_from_db()
        self.assertEqual(self.company_a.subscription_plan, 'free')

    def test_tenant_admin_cannot_edit_other_company(self):
        res = client_for(self.admin_a).patch(f'/api/platform/companies/{self.company_b.id}/', {'name': 'pwned'}, format='json')
        self.assertEqual(res.status_code, 404)

    def test_platform_owner_can_change_plan(self):
        res = client_for(self.owner).patch(f'/api/platform/companies/{self.company_a.id}/', {'subscription_plan': 'pro'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.company_a.refresh_from_db()
        self.assertEqual(self.company_a.subscription_plan, 'pro')


class CrossTenantTests(TenantFixture):
    def test_cannot_sell_other_tenants_product(self):
        res = client_for(self.admin_a).post('/api/sales/', {'product': self.product_b.id, 'quantity': 1, 'selling_price': 1}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertNotIn('Secret B', str(res.content))
        self.assertFalse(Sale.objects.filter(product=self.product_b).exists())

    def test_cannot_invoice_other_tenants_product(self):
        res = client_for(self.admin_a).post('/api/invoices/', {
            'invoice_number': 'INV-1', 'items': [{'productId': self.product_b.id, 'quantity': 1, 'sellingPrice': 1}]
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Sale.objects.filter(product=self.product_b).exists())

    def test_cannot_use_other_tenants_category(self):
        cat_b = Category.objects.create(company=self.company_b, name='B cat')
        res = client_for(self.admin_a).post('/api/products/', {'code': 'A2', 'name': 'x', 'category': cat_b.id}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_cannot_read_other_tenants_products(self):
        res = client_for(self.admin_a).get('/api/products/')
        names = [p['name'] for p in res.json()]
        self.assertEqual(names, ['Widget'])

    def test_same_invoice_number_allowed_in_different_companies(self):
        for user, product in [(self.admin_a, self.product_a), (self.admin_b, self.product_b)]:
            res = client_for(user).post('/api/invoices/', {
                'invoice_number': 'INV-100', 'items': [{'productId': product.id, 'quantity': 1, 'sellingPrice': 5}]
            }, format='json')
            self.assertEqual(res.status_code, 201, res.content)

    def test_duplicate_invoice_number_in_same_company_rejected(self):
        payload = {'invoice_number': 'INV-7', 'items': [{'productId': self.product_a.id, 'quantity': 1, 'sellingPrice': 5}]}
        client = client_for(self.admin_a)
        self.assertEqual(client.post('/api/invoices/', payload, format='json').status_code, 201)
        self.assertEqual(client.post('/api/invoices/', payload, format='json').status_code, 400)


class StockAndInvoiceTests(TenantFixture):
    def test_oversell_rejected(self):
        res = client_for(self.cashier_a).post('/api/invoices/', {
            'invoice_number': 'INV-2', 'items': [{'productId': self.product_a.id, 'quantity': 11, 'sellingPrice': 5}]
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_negative_quantity_rejected(self):
        res = client_for(self.admin_a).post('/api/sales/', {'product': self.product_a.id, 'quantity': -5, 'selling_price': 1}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_inventory_entries_change_stock(self):
        client = client_for(self.admin_a)
        client.post('/api/inventory/', {'product': self.product_a.id, 'entry_type': 'in', 'quantity': 5}, format='json')
        client.post('/api/inventory/', {'product': self.product_a.id, 'entry_type': 'out', 'quantity': 2}, format='json')
        product = client.get(f'/api/products/{self.product_a.id}/').json()
        self.assertEqual(product['current_stock'], 13)
        res = client.post('/api/inventory/', {'product': self.product_a.id, 'entry_type': 'out', 'quantity': 50}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_invoice_totals_computed_by_server_from_camel_case_payload(self):
        res = client_for(self.admin_a).post('/api/invoices/', {
            'invoice_number': 'INV-3', 'saleDate': '2026-10-01', 'customerPhone': '123',
            'totalRevenue': 999999, 'amountPaid': 10, 'paymentStatus': 'paid',
            'items': [{'productId': self.product_a.id, 'quantity': 2, 'sellingPrice': 25, 'revenue': 1, 'profit': 1}],
        }, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        data = res.json()
        self.assertEqual(data['total_revenue'], 50)
        self.assertEqual(data['amount_paid'], 10)
        self.assertEqual(data['payment_status'], 'credit')
        self.assertEqual(data['sale_date'], '2026-10-01')
        self.assertEqual(data['customer_phone'], '123')
        self.assertEqual(data['items'][0]['revenue'], 50)

    def test_record_payment_persists(self):
        client = client_for(self.admin_a)
        inv = client.post('/api/invoices/', {
            'invoice_number': 'INV-4', 'amountPaid': 0,
            'items': [{'productId': self.product_a.id, 'quantity': 1, 'sellingPrice': 40}],
        }, format='json').json()
        res = client.patch(f"/api/invoices/{inv['id']}/", {'amountPaid': 40, 'paymentStatus': 'paid', 'paidAt': '2026-10-02'}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        invoice = Invoice.objects.get(pk=inv['id'])
        self.assertEqual(invoice.amount_paid, 40)
        self.assertEqual(invoice.payment_status, 'paid')

    def test_editing_invoice_items_does_not_double_count_stock(self):
        client = client_for(self.admin_a)
        inv = client.post('/api/invoices/', {
            'invoice_number': 'INV-5', 'items': [{'productId': self.product_a.id, 'quantity': 8, 'sellingPrice': 1}],
        }, format='json').json()
        res = client.patch(f"/api/invoices/{inv['id']}/", {
            'items': [{'productId': self.product_a.id, 'quantity': 10, 'sellingPrice': 1}]
        }, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(Sale.objects.filter(invoice_id=inv['id']).count(), 1)
        self.assertEqual(Sale.objects.get(invoice_id=inv['id']).quantity, 10)

    def test_dashboard_and_reports(self):
        client = client_for(self.admin_a)
        client.post('/api/invoices/', {
            'invoice_number': 'INV-6', 'items': [{'productId': self.product_a.id, 'quantity': 2, 'sellingPrice': 30}],
        }, format='json')
        dash = client.get('/api/dashboard/').json()
        self.assertEqual(dash['totalRevenue'], 60)
        self.assertEqual(dash['totalProducts'], 1)
        report = client.get('/api/reports/').json()
        self.assertEqual(report['totalRevenue'], 60)
        self.assertEqual(report['costOfGoodsSold'], 20)


class AuthenticationTests(TenantFixture):
    def test_login_works(self):
        res = APIClient().post('/api/auth/login/', {'email': 'admin_a@example.org', 'password': STRONG_PW}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.json())

    def test_login_error_does_not_reveal_whether_account_exists(self):
        client = APIClient()
        unknown = client.post('/api/auth/login/', {'email': 'nobody@example.org', 'password': 'x'}, format='json')
        wrong = client.post('/api/auth/login/', {'email': 'admin_a@example.org', 'password': 'x'}, format='json')
        self.assertEqual(unknown.json()['detail'], wrong.json()['detail'])

    def test_login_does_not_recreate_seed_accounts(self):
        APIClient().post('/api/auth/login/', {'email': 'abdouamine@gmail.com', 'password': '123456'}, format='json')
        self.assertFalse(User.objects.filter(email__iexact='abdouamine@gmail.com').exists())

    def test_backdoor_email_is_not_promoted(self):
        user = make_user(self.company_a, 'cashier', 'abdouamine@gmail.com')
        APIClient().post('/api/auth/login/', {'email': 'abdouamine@gmail.com', 'password': STRONG_PW}, format='json')
        user.refresh_from_db()
        self.assertEqual(user.role, 'cashier')
        self.assertFalse(user.is_superuser)

    def test_suspended_company_token_rejected(self):
        client = client_for(self.admin_a)
        self.company_a.status = 'suspended'
        self.company_a.save()
        self.assertEqual(client.get('/api/products/').status_code, 401)

    def test_basic_auth_disabled(self):
        client = APIClient()
        creds = base64.b64encode(f'admin_a@example.org:{STRONG_PW}'.encode()).decode()
        client.credentials(HTTP_AUTHORIZATION=f'Basic {creds}')
        self.assertIn(client.get('/api/products/').status_code, (401, 403))

    def test_weak_password_rejected_on_user_create(self):
        res = client_for(self.admin_a).post('/api/users/', {'username': 'bob', 'name': 'Bob', 'role': 'staff', 'password': '123456'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(username='bob').exists())

    def test_user_create_requires_password(self):
        res = client_for(self.admin_a).post('/api/users/', {'username': 'bob', 'name': 'Bob', 'role': 'staff'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_user_create_with_strong_password(self):
        res = client_for(self.admin_a).post('/api/users/', {'username': 'bob', 'name': 'Bob', 'role': 'staff', 'password': STRONG_PW}, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        bob = User.objects.get(username='bob')
        self.assertEqual(bob.company_id, self.company_a.id)
        self.assertTrue(bob.check_password(STRONG_PW))

    def test_client_side_hash_never_becomes_password(self):
        # auth.js sends this after a successful password change
        res = client_for(self.admin_a).patch(f'/api/users/{self.admin_a.id}/', {'password_hash': 'a' * 64, 'password': None}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.admin_a.refresh_from_db()
        self.assertTrue(self.admin_a.check_password(STRONG_PW))

    def test_platform_reset_requires_password(self):
        res = client_for(self.owner).post(f'/api/platform/users/{self.cashier_a.id}/reset-password/', {}, format='json')
        self.assertEqual(res.status_code, 400)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', FRONTEND_URL='https://app.example.org')
class PasswordResetLinkTests(TenantFixture):
    def test_reset_link_ignores_untrusted_referer(self):
        APIClient().post('/api/auth/password-reset/', {'email': 'admin_a@example.org'}, format='json', HTTP_REFERER='https://evil.example/x')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('https://app.example.org/verify-email.html?', mail.outbox[0].body)
        self.assertNotIn('evil.example', mail.outbox[0].body)

    @override_settings(CORS_ALLOWED_ORIGINS=['https://shop.example.org'])
    def test_reset_link_uses_allowed_origin(self):
        APIClient().post('/api/auth/password-reset/', {'email': 'admin_a@example.org'}, format='json', HTTP_ORIGIN='https://shop.example.org')
        self.assertIn('https://shop.example.org/verify-email.html?', mail.outbox[0].body)


class PlatformTests(TenantFixture):
    def test_delete_all_requires_confirmation(self):
        res = client_for(self.owner).delete('/api/platform/companies/delete_all/')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Company.objects.count(), 2)

    def test_delete_all_with_confirmation(self):
        res = client_for(self.owner).delete('/api/platform/companies/delete_all/', {'confirm': 'DELETE ALL COMPANIES'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Company.objects.count(), 0)
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())

    def test_soft_delete_then_purge(self):
        client = client_for(self.owner)
        client_for(self.admin_a).post('/api/invoices/', {
            'invoice_number': 'INV-9', 'items': [{'productId': self.product_a.id, 'quantity': 1, 'sellingPrice': 5}]
        }, format='json')
        self.assertEqual(client.delete(f'/api/platform/companies/{self.company_a.id}/').status_code, 204)
        self.assertEqual(client_for(self.admin_a).get('/api/products/').status_code, 401)
        self.assertEqual(client.delete(f'/api/platform/companies/{self.company_a.id}/purge/').status_code, 204)
        self.assertFalse(Company.objects.filter(pk=self.company_a.id).exists())
        self.assertFalse(User.objects.filter(company_id=self.company_a.id).exists())

    def test_tenant_cannot_delete_company(self):
        res = client_for(self.admin_a).delete(f'/api/platform/companies/{self.company_a.id}/')
        self.assertEqual(res.status_code, 403)


class StaticServingTests(TestCase):
    def test_backend_source_not_served(self):
        for path in ['/backend/api/models.py', '/backend/sims_backend/settings.py', '/backend/db.sqlite3',
                     '/backend/.env', '/DOCUMENTATION.md', '/.git/config']:
            self.assertEqual(self.client.get(path).status_code, 404, path)

    def test_frontend_served(self):
        for path in ['/index.html', '/app.html', '/js/app.js', '/css/style.css']:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, path)
            if hasattr(res, 'streaming_content'):
                b''.join(res.streaming_content)


class AuditLogTests(TenantFixture):
    def test_audit_log_records_company(self):
        client_for(self.admin_a).post('/api/categories/', {'name': 'New'}, format='json')
        from .models import AuditLog
        log = AuditLog.objects.filter(target_type='Category').latest('created_at')
        self.assertEqual(log.company_id, self.company_a.id)
