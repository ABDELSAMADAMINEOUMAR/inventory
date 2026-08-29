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

from django.apps import apps
from api.models import User

user_id = 15

try:
    user = User.objects.get(id=user_id)
except User.DoesNotExist:
    print(f"User ID {user_id} does not exist.")
    sys.exit(0)

print(f"Checking references for User ID {user_id} ({user.email})...")
has_references = False

# Check standard related objects (ForeignKeys to User)
for rel in user._meta.related_objects:
    rel_model = rel.related_model
    accessor = rel.get_accessor_name()
    # Check if there are any related instances
    if hasattr(user, accessor):
        manager = getattr(user, accessor)
        if hasattr(manager, 'count'):
            count = manager.count()
            if count > 0:
                print(f"  FOUND: {count} {rel_model.__name__} (ForeignKey)")
                if rel_model.__name__ not in ['OutstandingToken', 'LogEntry']:
                    has_references = True
                else:
                    print(f"    -> Ignored (Ephemeral auth/log data)")

# Also check any model that has a 'user_id' IntegerField
app_models = apps.get_app_config('api').get_models()
for model in app_models:
    # Skip the User model itself
    if model == User:
        continue
    
    # Check if model has user_id field
    has_user_id = any(f.name == 'user_id' for f in model._meta.fields)
    if has_user_id:
        count = model.objects.filter(user_id=user_id).count()
        if count > 0:
            print(f"  FOUND: {count} {model.__name__} (user_id field)")
            has_references = True

if has_references:
    print("\nActual data references found! Aborting deletion.")
    sys.exit(1)
else:
    print("\nNo meaningful data references found. Proceeding with deletion.")
    user.delete()
    print(f"Successfully deleted User ID {user_id}.")

