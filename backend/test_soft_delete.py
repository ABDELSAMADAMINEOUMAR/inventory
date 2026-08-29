import os
import sys
import django
import json

# Manually load .env
with open('.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key] = val

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()

from api.models import Company, User
from api.platform_views import PlatformCompanyViewSet
from api.serializers import CompanySerializer
from rest_framework.request import Request
from django.test import RequestFactory
from rest_framework.parsers import JSONParser

print("--- Testing Soft Delete and Purge Flow ---")

User.objects.filter(email='softdelete@gmail.com').delete()
Company.objects.filter(name='Soft Delete Test Company').delete()

factory = RequestFactory()

admin_user = User.objects.filter(role='platform_owner').first()
if not admin_user:
    admin_user = User.objects.create(email='test_owner@gmail.com', role='platform_owner')

# 1. Create a Company to test with
data = {
    'name': 'Soft Delete Test Company',
    'admin_email': 'softdelete@gmail.com',
    'admin_password': 'supersecurepassword',
    'admin_name': 'Soft Delete Tester',
}

request = factory.post('/api/platform/companies/', data=json.dumps(data), content_type='application/json')
drf_request = Request(request, parsers=[JSONParser()])
drf_request.user = admin_user

viewset = PlatformCompanyViewSet()
viewset.request = drf_request
viewset.format_kwarg = None
viewset.action = 'create'

serializer = CompanySerializer(data=data)
serializer.is_valid(raise_exception=True)
viewset.perform_create(serializer)

company = Company.objects.get(name='Soft Delete Test Company')
company_id = company.id
print(f"Created Test Company with ID: {company_id}")

user = User.objects.get(email='softdelete@gmail.com')
print(f"Verified User created. ID: {user.id}, Company ID: {user.company_id}")

# 2. Test Soft Delete
print("\n[Soft Delete Test]")
del_request = factory.delete(f'/api/platform/companies/{company_id}/')
drf_del_request = Request(del_request)
drf_del_request.user = admin_user
viewset.request = drf_del_request
viewset.kwargs = {'pk': company_id}
viewset.action = 'destroy'
viewset.destroy(drf_del_request, pk=company_id)

# Verify it was soft deleted
c = Company.objects.get(id=company_id)
u = User.objects.get(id=user.id)
print(f"Company status: {c.status}, is_deleted: {c.is_deleted}")
print(f"User status: {u.status}, is_active: {u.is_active}, company_id: {u.company_id}")

if c.is_deleted and u.company_id == c.id:
    print("SUCCESS: Soft Delete worked! Company is marked deleted but User is NOT orphaned.")
else:
    print("FAILURE: Soft Delete did not work as expected.")

# 3. Test Restore
print("\n[Restore Test]")
restore_request = factory.patch(f'/api/platform/companies/{company_id}/restore/')
drf_restore_request = Request(restore_request)
drf_restore_request.user = admin_user
viewset.request = drf_restore_request
viewset.action = 'restore'
viewset.restore(drf_restore_request, pk=company_id)

c.refresh_from_db()
u.refresh_from_db()
print(f"Company status: {c.status}, is_deleted: {c.is_deleted}")
print(f"User status: {u.status}, is_active: {u.is_active}")

# 4. Test Purge
print("\n[Purge Test]")
# We must soft-delete it first before purge
viewset.request = drf_del_request
viewset.action = 'destroy'
viewset.destroy(drf_del_request, pk=company_id)

purge_request = factory.delete(f'/api/platform/companies/{company_id}/purge/')
drf_purge_request = Request(purge_request)
drf_purge_request.user = admin_user
viewset.request = drf_purge_request
viewset.action = 'purge'
viewset.purge(drf_purge_request, pk=company_id)

# Verify Company and User are completely gone
company_exists = Company.objects.filter(id=company_id).exists()
user_exists = User.objects.filter(id=user.id).exists()

print(f"Company still exists? {company_exists}")
print(f"User still exists? {user_exists}")

if not company_exists and not user_exists:
    print("SUCCESS: Purge worked! Company and its User were CASCADE deleted.")
else:
    print("FAILURE: Purge failed to delete everything.")
    
# Cleanup just in case
User.objects.filter(email='softdelete@gmail.com').delete()
Company.objects.filter(name='Soft Delete Test Company').delete()
