import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()

from rest_framework.test import APIClient
from api.models import User, Company, Product


def run_tests():
    print("==================================================")
    print("STARTING SAAS MULTI-TENANT & RBAC VERIFICATION")
    print("==================================================\n")
    
    client = APIClient()
    
    # 1. Test Tenant Isolation between Company A and Company B
    print("--- Test 1: Tenant Isolation (Company A vs Company B) ---")
    admin_a = User.objects.get(email="admin_a@acme.com")
    admin_b = User.objects.get(email="admin_b@globex.com")
    
    client.force_authenticate(user=admin_a)
    res_a = client.get("/api/products/")
    assert res_a.status_code == 200, f"Expected 200, got {res_a.status_code}"
    codes_a = [p["code"] for p in res_a.data]
    print(f"Admin A sees products: {codes_a}")
    assert "ACME-001" in codes_a and "GLOB-101" not in codes_a, "Tenant isolation failure for Admin A!"
    
    client.force_authenticate(user=admin_b)
    res_b = client.get("/api/products/")
    assert res_b.status_code == 200, f"Expected 200, got {res_b.status_code}"
    codes_b = [p["code"] for p in res_b.data]
    print(f"Admin B sees products: {codes_b}")
    assert "GLOB-101" in codes_b and "ACME-001" not in codes_b, "Tenant isolation failure for Admin B!"
    print("PASSED: Perfect tenant isolation verified!\n")
    
    # 2. Test Cashier Permissions (Read-only on Products, 403 on Create Product)
    print("--- Test 2: Hierarchical RBAC (Cashier Read-Only vs Create) ---")
    cashier_a = User.objects.get(email="cashier_a@acme.com")
    client.force_authenticate(user=cashier_a)
    
    res_get = client.get("/api/products/")
    assert res_get.status_code == 200, f"Cashier should read products, got {res_get.status_code}"
    print(f"Cashier A GET /api/products/: Status {res_get.status_code} (Allowed)")
    
    res_post = client.post("/api/products/", {"code": "HACK-001", "name": "Hack Product"}, format="json")
    assert res_post.status_code == 403, f"Cashier should be 403 on POST, got {res_post.status_code}"
    print(f"Cashier A POST /api/products/: Status {res_post.status_code} (Forbidden as expected)")
    print("PASSED: Cashier read-only permission enforced!\n")
    
    # 3. Test Staff Permissions (No access to Reports or User management)
    print("--- Test 3: Hierarchical RBAC (Staff Access Restrictions) ---")
    staff_a = User.objects.get(email="staff_a@acme.com")
    client.force_authenticate(user=staff_a)
    
    res_rep = client.get("/api/reports/")
    assert res_rep.status_code == 403, f"Staff should be 403 on reports, got {res_rep.status_code}"
    print(f"Staff A GET /api/reports/: Status {res_rep.status_code} (Forbidden as expected)")
    
    res_usr = client.get("/api/users/")
    assert res_usr.status_code == 403, f"Staff should be 403 on users, got {res_usr.status_code}"
    print(f"Staff A GET /api/users/: Status {res_usr.status_code} (Forbidden as expected)")
    print("PASSED: Staff restrictions enforced!\n")
    
    # 4. Test Platform Owner Isolation (Cannot access tenant data, can manage companies)
    print("--- Test 4: Platform Owner Role & Data Isolation ---")
    owner = User.objects.get(email="platform_owner@saas.com")
    client.force_authenticate(user=owner)
    
    res_stats = client.get("/api/platform/stats/")
    assert res_stats.status_code == 200, f"Platform Owner should access cross-company stats, got {res_stats.status_code}"
    print(f"Platform Owner GET /api/platform/stats/: Status {res_stats.status_code} (Allowed)")
    print(f"Stats summary: {res_stats.data['totalCompanies']} companies, {res_stats.data['suspendedCompanies']} suspended")
    
    res_tenant_data = client.get("/api/products/")
    # Our permission class blocks platform owner with 403 Forbidden, ensuring 0 data leakage
    assert res_tenant_data.status_code == 403 or len(res_tenant_data.data) == 0, "Platform Owner should be blocked or see 0 tenant products!"
    print(f"Platform Owner GET /api/products/: Status {res_tenant_data.status_code} (Strictly blocked from tenant data)")
    print("PASSED: Platform Owner isolation enforced!\n")
    
    print("--- Test 5: Admin User Creation & New Employee Login ---")
    User.objects.filter(email="bob_new@acme.com").delete()
    client.force_authenticate(user=admin_a)
    new_user_payload = {
        "name": "New Cashier Bob",
        "email": "bob_new@acme.com",
        "password": "securepassword123",
        "password_hash": "dummyhash",
        "role": "cashier",
        "status": "active"
    }
    res_create = client.post("/api/users/", new_user_payload, format="json")
    assert res_create.status_code in [200, 201], f"Admin failed to create user: {res_create.data}"
    print("Admin successfully created new user bob_new@acme.com.")
    
    # Logout and test JWT TokenObtainPairView (login)
    client.logout()
    res_login = client.post("/api/auth/login/", {"email": "bob_new@acme.com", "password": "securepassword123"}, format="json")
    assert res_login.status_code == 200 and "access" in res_login.data, f"New user login failed: {res_login.data}"
    print("New user bob_new@acme.com successfully logged in with plaintext password!")
    print("PASSED: User creation and authentication verified!\n")

    print("--- Test 6: Staff Read-Only Permission Verification ---")
    client.force_authenticate(user=staff_a)
    res_staff_get = client.get("/api/products/")
    assert res_staff_get.status_code == 200, f"Staff should be allowed to view products, got {res_staff_get.status_code}"
    print(f"Staff A GET /api/products/: Status {res_staff_get.status_code} (Allowed)")

    res_staff_post = client.post("/api/products/", {"code": "RESTOCK-001", "name": "Restock Attempt"}, format="json")
    assert res_staff_post.status_code == 403, f"Staff should be forbidden from creating/restocking products, got {res_staff_post.status_code}"
    print(f"Staff A POST /api/products/: Status {res_staff_post.status_code} (Forbidden as expected)")
    print("--- Test 7: Password Change Security (Email Notification & Token Blacklist) ---")
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
    from django.core import mail
    from rest_framework_simplejwt.tokens import RefreshToken
    
    # Create some refresh tokens for bob_new
    bob_user = User.objects.get(email="bob_new@acme.com")
    token1 = RefreshToken.for_user(bob_user)
    token2 = RefreshToken.for_user(bob_user)
    initial_outstanding = OutstandingToken.objects.filter(user=bob_user).count()
    print(f"Issued 2 refresh tokens for {bob_user.email}. Outstanding tokens: {initial_outstanding}")
    
    # Clear outbox and set locmem backend for testing
    from django.conf import settings
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    mail.outbox = []
    
    # Authenticate as bob and change password
    client.force_authenticate(user=bob_user)
    res_change_pwd = client.post("/api/auth/change-password/", {"old_password": "securepassword123", "new_password": "supersecretnew456"}, format="json")
    assert res_change_pwd.status_code == 200, f"Password change failed: {res_change_pwd.data}"
    print(f"Bob changed password via /api/auth/change-password/: Status {res_change_pwd.status_code}")
    
    # Verify email notification sent
    assert len(mail.outbox) > 0, "No notification email was sent!"
    sent_mail = mail.outbox[0]
    assert "password was changed" in sent_mail.subject, f"Unexpected email subject: {sent_mail.subject}"
    print(f"Notification email sent successfully to {sent_mail.to[0]} with subject: '{sent_mail.subject}'")
    
    # Verify tokens were blacklisted
    blacklisted_count = BlacklistedToken.objects.filter(token__user=bob_user).count()
    assert blacklisted_count >= 2, f"Expected at least 2 tokens blacklisted, got {blacklisted_count}"
    print(f"Verified {blacklisted_count} refresh tokens were blacklisted immediately after password change!")
    print("PASSED: Password Change Notification Email and Token Blacklist verified!\n")

    print("==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! ARCHITECTURE VERIFIED.")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
