import os
import sys
import django

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

try:
    c = Company.objects.get(id=4)
    print(f"Company 4: {c.name}, Created: {c.created_at}")
    users = User.objects.filter(company=c)
    print("Users in Company 4:")
    for u in users:
        print(f"  - {u.email} (ID: {u.id}, Role: {u.role})")
except Company.DoesNotExist:
    print("Company 4 does not exist.")
