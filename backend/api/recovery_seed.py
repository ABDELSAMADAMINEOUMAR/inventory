import os
from django.db import transaction

# Automated recovery data for resilient tenant persistence across ephemeral database restarts
RECOVERY_COMPANIES = [
  {
    "id": 24,
    "name": "abdou",
    "subscription_plan": "free",
    "status": "active",
    "currency": "FCFA"
  },
  {
    "id": 25,
    "name": "Express Amine oumar",
    "subscription_plan": "free",
    "status": "active",
    "currency": "FCFA"
  },
  {
    "id": 26,
    "name": "Haggar",
    "subscription_plan": "free",
    "status": "active",
    "currency": "RWF"
  },
  {
    "id": 27,
    "name": "Manal import",
    "subscription_plan": "free",
    "status": "active",
    "currency": "RWF"
  },
  {
    "id": 29,
    "name": "Hadil Shop",
    "subscription_plan": "free",
    "status": "active",
    "currency": "FCFA"
  }
]

RECOVERY_USERS = [
  {
    "id": 19,
    "username": "abdouamine",
    "email": "abdouamine@gmail.com",
    "name": "Platform Super Owner",
    "role": "platform_owner",
    "status": "active",
    "phone": "",
    "business": "SmartIMS Platform",
    "currency": "USD",
    "company_id": None,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": True,
    "is_staff": True,
    "must_change_password": False
  },
  {
    "id": 26,
    "username": "abdou_admin",
    "email": "abdelsamadamineoumar@gmail.com",
    "name": "abdou Admin",
    "role": "admin",
    "status": "active",
    "phone": "",
    "business": "abdou",
    "currency": "FCFA",
    "company_id": 24,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 27,
    "username": "amineoumarexpress_admin",
    "email": "abdelsamadamine003@gmail.com",
    "name": "amineoumarexpress_admin",
    "role": "admin",
    "status": "active",
    "phone": "",
    "business": "Express Amine oumar",
    "currency": "FCFA",
    "company_id": 25,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 28,
    "username": "koulthoum",
    "email": "koulthoum@Madiha.local",
    "name": "Khoulthoum HAmza",
    "role": "cashier",
    "status": "active",
    "phone": "",
    "business": "Express Amine oumar",
    "currency": "FCFA",
    "company_id": 25,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 29,
    "username": "haggar",
    "email": "hisseinidriss81@gmail.com",
    "name": "Haggar Terap",
    "role": "admin",
    "status": "active",
    "phone": "",
    "business": "Haggar",
    "currency": "RWF",
    "company_id": 26,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 30,
    "username": "manal",
    "email": "raouda.amine@gmail.com",
    "name": "Manal import",
    "role": "admin",
    "status": "active",
    "phone": "",
    "business": "Manal import",
    "currency": "RWF",
    "company_id": 27,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 31,
    "username": "mohamed",
    "email": "mohamed@abdou.local",
    "name": "mohamed",
    "role": "cashier",
    "status": "active",
    "phone": "",
    "business": "abdou",
    "currency": "FCFA",
    "company_id": 24,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
    "is_active": True,
    "is_superuser": False,
    "is_staff": False,
    "must_change_password": False
  },
  {
    "id": 43,
    "username": "hadil",
    "email": "madihaamine73@gmail.com",
    "name": "Hadil Shop Admin",
    "role": "admin",
    "status": "active",
    "phone": "",
    "business": "Hadil Shop",
    "currency": "FCFA",
    "company_id": 29,
    "password": "pbkdf2_sha256$1200000$8X04BqTcsYdVjs3n2jRLDa$7tlF9+iOMN2J8YvlYFB2o0WUUkZCwVuY1kN5PBUY67k=",
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
