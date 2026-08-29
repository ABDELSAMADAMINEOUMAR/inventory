import os
import sys
import django
from datetime import timedelta
import datetime

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

# Search for any logs regarding Company 4
logs = AuditLog.objects.filter(target_type='Company', target_id='4').order_by('created_at')
print(f"Found {logs.count()} AuditLogs for Company 4:")
for log in logs:
    actor_email = log.actor.email if log.actor else "System"
    print(f"[{log.created_at}] {actor_email} performed {log.action} on {log.target_type} ({log.target_id})")
