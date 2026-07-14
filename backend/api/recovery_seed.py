import os
from django.db import transaction

# Automated recovery data for resilient tenant persistence across ephemeral database restarts
RECOVERY_COMPANIES = [
    {
        "id": 13,
        "name": "kawre import",
        "subscription_plan": "basic",
        "status": "active",
        "currency": "FCFA"
    },
    {
        "id": 14,
        "name": "Awladjamaan",
        "subscription_plan": "basic",
        "status": "active",
        "currency": "USD"
    },
    {
        "id": 15,
        "name": "Hadil import",
        "subscription_plan": "basic",
        "status": "suspended",
        "currency": "FCFA"
    },
    {
        "id": 16,
        "name": "GAGGA",
        "subscription_plan": "basic",
        "status": "active",
        "currency": "USD"
    },
    {
        "id": 17,
        "name": "Maouloud import",
        "subscription_plan": "free",
        "status": "active",
        "currency": "USD"
    }
]

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
    },
    {
        "id": 49,
        "username": "kawre_import_admin",
        "email": "abdelsamadamine003@gmail.com",
        "name": "kawre import Admin",
        "role": "admin",
        "status": "active",
        "phone": "",
        "business": "kawre import",
        "currency": "FCFA",
        "company_id": 13,
        "password": "pbkdf2_sha256$1200000$YTsb1ajAGDqXIA0auY6nGU$DCJLpK4v6EoXZOHSdN2gXhwE/lfM0bAzP37pGxSTMZU=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 50,
        "username": "awladjamaan_admin",
        "email": "abdelsamadamineoumar@gmail.com",
        "name": "Awladjamaan Admin",
        "role": "admin",
        "status": "active",
        "phone": "",
        "business": "Awladjamaan",
        "currency": "USD",
        "company_id": 14,
        "password": "pbkdf2_sha256$1200000$U62z1C9l9UT6RunnpZ56g1$OG0TmEG/lr7H7H4WQp6mA7GmnN0pVojkKWYyEQa+DTA=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 51,
        "username": "amineoumar003@gmail.com",
        "email": "amineoumar003@gmail.com",
        "name": "staff",
        "role": "staff",
        "status": "active",
        "phone": "",
        "business": "Awladjamaan",
        "currency": "USD",
        "company_id": 14,
        "password": "pbkdf2_sha256$1200000$sMIJlaEXgQ9ggiAc6qs5go$nacfcTML0/gFm5ozoHUpxd49f5+FYMjBYempwJ+9VO0=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 52,
        "username": "ali",
        "email": "ali@gmail.com",
        "name": "ali",
        "role": "cashier",
        "status": "active",
        "phone": "",
        "business": "Awladjamaan",
        "currency": "USD",
        "company_id": 14,
        "password": "pbkdf2_sha256$1200000$PuUS2tMUAmjzeLQy2y7Yp1$eCRKb/aVC/l/bt60qQGBgYygIm/nNDM0lNekZaE9T40=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 53,
        "username": "madiha_amine",
        "email": "abdelsamadamine03@gmail.com",
        "name": "Madiha Amine",
        "role": "admin",
        "status": "deactivated",
        "phone": "",
        "business": "Hadil import",
        "currency": "FCFA",
        "company_id": 15,
        "password": "pbkdf2_sha256$1200000$RtPwbbn9kxXEYDPqpRKv7a$3cnV8EOwIefqOEcuwZpXi5eOqktWygbmIdN/SjVeD68=",
        "is_active": False,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 54,
        "username": "gagga_admin",
        "email": "ousamagaga89@gmail.com",
        "name": "GAGGA Admin",
        "role": "admin",
        "status": "active",
        "phone": "",
        "business": "GAGGA",
        "currency": "USD",
        "company_id": 16,
        "password": "pbkdf2_sha256$1200000$ccYSXKnosTBMmgyxxQhf3Y$3c1X32PP6X0V70CfX9VioUeCMKOvqBQ3y9cZpiGA+SY=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 55,
        "username": "ziad",
        "email": "ziad@gmail.com",
        "name": "Ziad",
        "role": "cashier",
        "status": "active",
        "phone": "",
        "business": "GAGGA",
        "currency": "USD",
        "company_id": 16,
        "password": "pbkdf2_sha256$1200000$2RWHYOS2XIhYH7xVWfL2UB$9/4JKUmXaDxV0Yky2BLOMTS9F93cv2DbvF89YyV52vY=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
        "must_change_password": False
    },
    {
        "id": 56,
        "username": "maouloud_import_admin",
        "email": "msadickmaouloud@gmail.com",
        "name": "Maouloud import Admin",
        "role": "admin",
        "status": "active",
        "phone": "",
        "business": "Maouloud import",
        "currency": "USD",
        "company_id": 17,
        "password": "pbkdf2_sha256$1200000$bkYU5QL05eqzLo7YJDb8QT$BZ0ohDMjmjlebJhQgF9JudbLhV3evc0VDkcZToH5AOk=",
        "is_active": True,
        "is_superuser": False,
        "is_staff": False,
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
