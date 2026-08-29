import os
import sys
import django
from django.conf import settings

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

from api.models import User, Company, Sale

try:
    company = Company.objects.get(id=25)
    print(f"Users for Company: {company.name} (ID: {company.id})")
    for u in User.objects.filter(company=company):
        print(f"  - {u.email} (Role: {u.role})")
except Company.DoesNotExist:
    pass

# Search for the user with email amineoumar003@gmail.com again
print("\nUser search for amineoumar003@gmail.com:")
users = User.objects.filter(email='amineoumar003@gmail.com')
for u in users:
    print(f"User ID: {u.id}, Email: {u.email}, Company ID: {u.company_id}")

print("\n--- Check all sales in the DB for amineoumar003@gmail.com without company ---")
# If they have a user ID, maybe they created sales with that user ID but company is null?
for u in users:
    sales = Sale.objects.filter(user_id=u.id)
    print(f"Sales for user ID {u.id}: {sales.count()}")
    if sales.exists():
        print(f"  Sample: {sales.first().id} (Company ID: {sales.first().company_id})")

# Let's also check if there is any company named similar to amineoumar003@gmail.com
print("\n--- Search companies for amine ---")
companies = Company.objects.filter(name__icontains='amine')
for c in companies:
    print(f"Company ID: {c.id}, Name: {c.name}")
    print(f"  Sales count: {Sale.objects.filter(company=c).count()}")

