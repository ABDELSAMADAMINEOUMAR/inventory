import os
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
from rest_framework.test import APIClient

print("--- Testing Restore and Purge Isolation for Regular Tenant User ---")

# Setup: Find a regular tenant user
regular_user = User.objects.exclude(role='platform_owner').filter(company__isnull=False).first()
if not regular_user:
    print("No regular tenant user found in the DB. Exiting.")
    exit(1)

company_id = regular_user.company.id

print(f"Logged in User: {regular_user.email} (Role: {regular_user.role})")
print(f"Attempting to manage Company ID: {company_id} ({regular_user.company.name})\n")

# Test the API
client = APIClient(SERVER_NAME='localhost')
client.force_authenticate(user=regular_user)

# 1. Test Restore
print(f"Testing PATCH /api/platform/companies/{company_id}/restore/")
restore_response = client.patch(f'/api/platform/companies/{company_id}/restore/')
print(f"Response Status Code: {restore_response.status_code}")
print("Response JSON:")
print(json.dumps(restore_response.json(), indent=2))

print("\n------------------------------------------------------------\n")

# 2. Test Purge
print(f"Testing DELETE /api/platform/companies/{company_id}/purge/")
purge_response = client.delete(f'/api/platform/companies/{company_id}/purge/')
print(f"Response Status Code: {purge_response.status_code}")
try:
    print("Response JSON:")
    print(json.dumps(purge_response.json(), indent=2))
except Exception:
    # DELETE might not return JSON
    print(f"Response Content: {purge_response.content}")
