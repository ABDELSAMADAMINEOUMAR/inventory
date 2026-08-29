import os
import sys
import django
from datetime import timedelta
import datetime

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

from api.models import AuditLog

target_time = datetime.datetime(2026, 8, 19, 14, 52, 47, tzinfo=datetime.timezone.utc)
time_margin = timedelta(minutes=5)

logs = AuditLog.objects.filter(
    created_at__gte=target_time - time_margin,
    created_at__lte=target_time + time_margin
)

print(f"Found {logs.count()} AuditLogs around {target_time}:")
for log in logs:
    actor_email = log.actor.email if log.actor else "System"
    print(f"[{log.created_at}] {actor_email} performed {log.action} on {log.target_type} ({log.target_id})")

# Also search for '15' in target_id where target_type is 'User'
user_15_logs = AuditLog.objects.filter(target_type='User', target_id='15')
print(f"\nFound {user_15_logs.count()} AuditLogs for User 15:")
for log in user_15_logs:
    actor_email = log.actor.email if log.actor else "System"
    print(f"[{log.created_at}] {actor_email} performed {log.action} on {log.target_type} ({log.target_id})")
