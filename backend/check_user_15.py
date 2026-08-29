import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

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

from api.models import User, Company

user_email = 'amineoumar003@gmail.com'
try:
    user = User.objects.get(email=user_email)
    print(f"User: {user.email} (ID: {user.id})")
    print(f"Created At: {user.created_at}")
    
    # Check if created_at falls within outage window
    # Note: timezone is important. Assuming created_at is UTC.
    import datetime
    start_window = datetime.datetime(2026, 8, 18, 19, 54, tzinfo=datetime.timezone.utc)
    end_window = datetime.datetime(2026, 8, 19, 15, 7, tzinfo=datetime.timezone.utc)
    
    if getattr(user, 'date_joined', None):
        user_created_at = user.date_joined
        print(f"date_joined: {user.date_joined}")
    else:
        user_created_at = user.created_at
    
    if start_window <= user_created_at <= end_window:
        print("YES, created_at falls within the DEBUG-crash outage window.")
    else:
        print("NO, created_at does NOT fall within the DEBUG-crash outage window.")
        
    print("\n--- Checking for potential intended Companies ---")
    
    # Check for companies created within +/- 1 hour of the user's registration
    time_margin = timedelta(hours=1)
    companies_around_time = Company.objects.filter(
        created_at__gte=user_created_at - time_margin,
        created_at__lte=user_created_at + time_margin
    )
    print(f"\nCompanies created within +/- 1 hour of user registration ({user_created_at}):")
    if companies_around_time.exists():
        for comp in companies_around_time:
            print(f"  - ID: {comp.id}, Name: {comp.name}, Created: {comp.created_at}")
            users_in_comp = User.objects.filter(company=comp)
            print(f"    Users in this company: {[u.email for u in users_in_comp]}")
    else:
        print("  None found.")

    # Check for companies that have NO users assigned (orphaned companies)
    orphaned_companies = Company.objects.filter(users__isnull=True)
    print(f"\nCompanies with NO users assigned:")
    if orphaned_companies.exists():
        for comp in orphaned_companies:
            print(f"  - ID: {comp.id}, Name: {comp.name}, Created: {comp.created_at}")
    else:
        print("  None found.")
        
except User.DoesNotExist:
    print(f"User with email {user_email} not found.")

