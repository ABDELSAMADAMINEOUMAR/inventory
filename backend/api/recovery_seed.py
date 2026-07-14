import os
from django.db import transaction

# Automated recovery data for resilient tenant persistence across ephemeral database restarts
RECOVERY_COMPANIES = []

RECOVERY_USERS = [
    {
        "id": 10,
        "username": "abdouamine@gmail.com",
        "email": "abdouamine@gmail.com",
        "name": "Platform Super Owner",
        "role": "platform_owner",
        "status": "active",
        "phone": "",
        "business": "SmartIMS Platform",
        "currency": "USD",
        "company_id": None,
        "password": "pbkdf2_sha256$1200000$7axRBlvwfwZHFIlHbiMXJx$Up7EAKM/sjZoSRHgylH8AeLLfhsuenI5OMFCXgS8EUU=",
        "is_active": True,
        "is_superuser": True,
        "is_staff": True,
        "must_change_password": False
    }
]


def ensure_recovered():
    from .models import Company, User
    try:
        with transaction.atomic():
            for comp_data in RECOVERY_COMPANIES:
                comp, created = Company.objects.get_or_create(
                    id=comp_data["id"],
                    defaults={
                        "name": comp_data["name"],
                        "subscription_plan": comp_data["subscription_plan"],
                        "status": comp_data["status"],
                        "currency": comp_data.get("currency", "USD")
                    }
                )
                if not created and not comp.currency and comp_data.get("currency"):
                    comp.currency = comp_data["currency"]
                    comp.save()

            for u_data in RECOVERY_USERS:
                user = User.objects.filter(email__iexact=u_data["email"]).first()
                if not user:
                    user = User.objects.filter(username__iexact=u_data["username"]).first()
                if not user and u_data.get("id"):
                    user = User.objects.filter(pk=u_data["id"]).first()

                comp = None
                if u_data["company_id"]:
                    comp = Company.objects.filter(id=u_data["company_id"]).first()

                if not user:
                    user = User(
                        id=u_data["id"] if not User.objects.filter(pk=u_data["id"]).exists() else None,
                        username=u_data["username"],
                        email=u_data["email"],
                        name=u_data["name"],
                        role=u_data["role"],
                        status=u_data["status"],
                        phone=u_data["phone"],
                        business=u_data["business"],
                        currency=u_data["currency"],
                        company=comp,
                        password=u_data["password"],
                        is_active=u_data["is_active"],
                        is_superuser=u_data["is_superuser"],
                        is_staff=u_data["is_staff"],
                        must_change_password=u_data["must_change_password"]
                    )
                    user.save()
                else:
                    updated = False
                    if not user.password or not user.password.startswith('pbkdf2_sha256$'):
                        user.password = u_data["password"]
                        updated = True
                    if not user.company and comp:
                        user.company = comp
                        updated = True
                    if not user.currency and u_data["currency"]:
                        user.currency = u_data["currency"]
                        updated = True
                    if updated:
                        user.save()
    except Exception as e:
        pass
