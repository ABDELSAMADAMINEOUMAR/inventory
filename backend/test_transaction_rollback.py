import os
import sys
import django
from unittest.mock import patch
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
from io import BytesIO

print("--- Testing Mid-Registration Crash and Rollback ---")

initial_company_count = Company.objects.count()
initial_user_count = User.objects.count()

print(f"Initial Company count: {initial_company_count}")
print(f"Initial User count: {initial_user_count}")

factory = RequestFactory()
data = {
    'name': 'Crash Test Company',
    'admin_email': 'crashtest@gmail.com',
    'admin_password': 'supersecurepassword',
    'admin_name': 'Crash Tester',
}

request = factory.post('/api/platform/companies/', data=json.dumps(data), content_type='application/json')
drf_request = Request(request, parsers=[JSONParser()])

admin_user = User.objects.filter(role='platform_owner').first()
if not admin_user:
    admin_user = User.objects.create(email='test_owner@gmail.com', role='platform_owner')
drf_request.user = admin_user

viewset = PlatformCompanyViewSet()
viewset.request = drf_request
viewset.format_kwarg = None

serializer = CompanySerializer(data=data)
serializer.is_valid(raise_exception=True)

class SimulatedCrashException(Exception):
    pass

def mocked_user_create(*args, **kwargs):
    print("User.objects.create called! Simulating a crash now...")
    raise SimulatedCrashException("Simulated crash mid-registration!")

print("\nExecuting PlatformCompanyViewSet.perform_create with mocked User.objects.create...")
try:
    with patch('api.platform_views.User.objects.create', side_effect=mocked_user_create):
        viewset.perform_create(serializer)
except SimulatedCrashException as e:
    print(f"Caught Simulated Crash: {e}")
except Exception as e:
    print(f"Caught unexpected Exception: {e}")

print("\n--- Verifying Rollback ---")
final_company_count = Company.objects.count()
final_user_count = User.objects.count()
print(f"Final Company count: {final_company_count}")
print(f"Final User count: {final_user_count}")

if final_company_count == initial_company_count and final_user_count == initial_user_count:
    print("\nSUCCESS: The rollback worked perfectly! No orphaned records were left.")
else:
    print("\nFAILURE: Rollback failed! Data was persisted to the database.")
    Company.objects.filter(name='Crash Test Company').delete()
    print("Cleaned up orphaned test data.")
