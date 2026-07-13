from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import (
    Company, User, Category, Supplier, Product,
    ProductExpense, Sale, BusinessExpense, InventoryEntry
)


class Command(BaseCommand):
    help = 'Seed the database with Multi-Tenant SaaS demo data (1 platform owner, 2 companies, 4 roles each)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting SaaS Multi-Tenant database seeding..."))

        # Clear existing data
        Sale.objects.all().delete()
        ProductExpense.objects.all().delete()
        InventoryEntry.objects.all().delete()
        Product.objects.all().delete()
        Supplier.objects.all().delete()
        Category.objects.all().delete()
        BusinessExpense.objects.all().delete()
        User.objects.all().delete()
        Company.objects.all().delete()

        # 1. Create Platform Owner
        owner = User.objects.create_user(
            username='platform_owner@saas.com',
            email='platform_owner@saas.com',
            password='platform123',
            name='Platform Super Owner',
            role='platform_owner',
            company=None,
            status='active',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        self.stdout.write(self.style.SUCCESS(f"Created Platform Owner: {owner.email} (pass: platform123)"))

        # 2. Create Companies
        comp_a = Company.objects.create(name="Acme Imports RW", subscription_plan="pro", status="active")
        comp_b = Company.objects.create(name="Globex Trading EG", subscription_plan="basic", status="active")
        self.stdout.write(self.style.SUCCESS(f"Created Companies: '{comp_a.name}' and '{comp_b.name}'"))

        # 3. Create Users for Company A
        roles = [
            ('admin', 'Admin (Owner)', 'admin_a@acme.com', 'acme123'),
            ('manager', 'Manager', 'manager_a@acme.com', 'acme123'),
            ('cashier', 'Cashier', 'cashier_a@acme.com', 'acme123'),
            ('staff', 'Warehouse Staff', 'staff_a@acme.com', 'acme123'),
        ]
        users_a = {}
        for role_key, role_label, email, pw in roles:
            u = User.objects.create_user(
                username=email, email=email, password=pw, name=f"Acme {role_label}",
                role=role_key, company=comp_a, status='active', is_active=True, currency='RWF'
            )
            users_a[role_key] = u
            self.stdout.write(f"  [{comp_a.name}] Created {role_key}: {email} (pass: {pw})")

        # 4. Create Users for Company B
        users_b = {}
        for role_key, role_label, email, pw in [
            ('admin', 'Admin (Owner)', 'admin_b@globex.com', 'globex123'),
            ('manager', 'Manager', 'manager_b@globex.com', 'globex123'),
            ('cashier', 'Cashier', 'cashier_b@globex.com', 'globex123'),
            ('staff', 'Warehouse Staff', 'staff_b@globex.com', 'globex123'),
        ]:
            u = User.objects.create_user(
                username=email, email=email, password=pw, name=f"Globex {role_label}",
                role=role_key, company=comp_b, status='active', is_active=True, currency='EGP'
            )
            users_b[role_key] = u
            self.stdout.write(f"  [{comp_b.name}] Created {role_key}: {email} (pass: {pw})")

        # 5. Seed Data for Company A
        cat_a1 = Category.objects.create(company=comp_a, user_id=users_a['admin'].id, name="Electronics (Acme)", description="Acme devices")
        cat_a2 = Category.objects.create(company=comp_a, user_id=users_a['admin'].id, name="Clothing (Acme)", description="Acme fashion")
        supp_a = Supplier.objects.create(company=comp_a, user_id=users_a['admin'].id, name="Kigali Distributors", phone="+250788111111", country="Rwanda")
        
        prod_a1 = Product.objects.create(
            company=comp_a, user_id=users_a['admin'].id, code="ACME-001", name="4K TV 55 Inch",
            category=cat_a1, supplier=supp_a, purchase_price=300000, currency="RWF", quantity=10, status="available"
        )
        prod_a2 = Product.objects.create(
            company=comp_a, user_id=users_a['admin'].id, code="ACME-002", name="Silk Shirts (Pack of 20)",
            category=cat_a2, supplier=supp_a, purchase_price=100000, currency="RWF", quantity=20, status="available"
        )
        ProductExpense.objects.create(company=comp_a, product=prod_a1, expense_type="Freight", amount=20000, note="Air shipping")
        Sale.objects.create(company=comp_a, product=prod_a1, quantity=2, selling_price=450000, customer="Hotel Kigali")
        BusinessExpense.objects.create(company=comp_a, title="Acme Rent", amount=150000, category="Rent")
        InventoryEntry.objects.create(company=comp_a, product=prod_a1, entry_type="in", quantity=10, notes="Initial stock")

        # 6. Seed Data for Company B
        cat_b1 = Category.objects.create(company=comp_b, user_id=users_b['admin'].id, name="Cosmetics (Globex)", description="Globex beauty")
        supp_b = Supplier.objects.create(company=comp_b, user_id=users_b['admin'].id, name="Cairo Perfumes", phone="+201000222222", country="Egypt")
        
        prod_b1 = Product.objects.create(
            company=comp_b, user_id=users_b['admin'].id, code="GLOB-101", name="Perfume Gift Set",
            category=cat_b1, supplier=supp_b, purchase_price=500, currency="EGP", quantity=50, status="available"
        )
        ProductExpense.objects.create(company=comp_b, product=prod_b1, expense_type="Customs", amount=50, note="Import taxes")
        Sale.objects.create(company=comp_b, product=prod_b1, quantity=5, selling_price=900, customer="Cairo Mall Store")
        BusinessExpense.objects.create(company=comp_b, title="Globex Electricity", amount=1000, category="Utilities")
        InventoryEntry.objects.create(company=comp_b, product=prod_b1, entry_type="in", quantity=50, notes="Initial batch")

        self.stdout.write(self.style.SUCCESS("\nSuccessfully seeded database with multi-tenant SaaS test data!"))
        self.stdout.write(self.style.NOTICE("Test Accounts Summary:"))
        self.stdout.write("  Platform Owner : platform_owner@saas.com / platform123")
        self.stdout.write("  Company A Admin: admin_a@acme.com / acme123")
        self.stdout.write("  Company B Admin: admin_b@globex.com / globex123")
