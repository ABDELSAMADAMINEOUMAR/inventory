from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from .models import Company, User, AuditLog, Sale
from .serializers import CompanySerializer, UserSerializer, AuditLogSerializer
from .permissions import IsPlatformOwner
from .utils import on_password_changed, send_verification_email


class PlatformCompanyViewSet(viewsets.ModelViewSet):
    """
    Platform Owner management of tenant companies.
    """
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        admin_email = self.request.data.get('admin_email')
        if not admin_email:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"admin_email": "Admin email is required when creating a company."})

        clean_email = admin_email.strip().lower()
        domain = clean_email.split('@')[-1] if '@' in clean_email else ''
        blocked_domains = [
            'gmai.com', 'gamil.com', 'gmial.com', 'gmail.co', 'gmaill.com',
            'yahooo.com', 'yaho.com', 'outlok.com', 'hotmial.com',
            'example.com', 'test.com', 'company.com', 'domain.com', 'asdasd.com'
        ]

        if not clean_email or '@' not in clean_email or '.' not in domain or domain in blocked_domains:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"admin_email": "Refused: A valid, recognized recovery email address (e.g. @gmail.com) is required. Misspelled or dummy domains are rejected."})

        admin_username = (self.request.data.get('admin_username') or clean_email.split('@')[0]).strip()
        existing_email_user = User.objects.filter(email__iexact=clean_email).first()
        if existing_email_user:
            if existing_email_user.company is None and existing_email_user.role != 'platform_owner':
                existing_email_user.delete()
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"admin_email": "this email has already an account"})

        existing_username_user = User.objects.filter(username__iexact=admin_username).first()
        if existing_username_user:
            if existing_username_user.company is None and existing_username_user.role != 'platform_owner':
                existing_username_user.delete()
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"admin_username": "This username already exists."})

        req_currency = self.request.data.get('currency', 'RWF')
        company = serializer.save(currency=req_currency)
        import secrets
        admin_password = self.request.data.get('admin_password') or secrets.token_urlsafe(16)
        admin_name = self.request.data.get('admin_name') or f"{company.name} Admin"

        user = User.objects.create(
            username=admin_username,
            email=clean_email,
            name=admin_name,
            role='admin',
            company=company,
            currency=req_currency,
            status='active',
            is_active=True,
            must_change_password=False
        )
        user.set_password(admin_password)
        user.save()
        try:
            send_verification_email(user, request=self.request)
        except Exception as e:
            import logging
            logging.warning(f"Could not send email verification: {e}")

        actor = self.request.user if self.request.user and self.request.user.is_authenticated else user
        AuditLog.objects.create(
            actor=actor,
            action="create_company",
            target_type="Company",
            target_id=str(company.id)
        )

    def perform_destroy(self, instance):
        company_id = str(instance.id)
        User.objects.filter(company=instance).delete()
        if hasattr(instance, 'admin_email') and instance.admin_email:
            User.objects.filter(email__iexact=instance.admin_email).exclude(role='platform_owner').delete()
        instance.delete()
        AuditLog.objects.create(
            actor=self.request.user,
            action="delete_company",
            target_type="Company",
            target_id=company_id
        )

    @action(detail=False, methods=['delete', 'post'], url_path='delete_all')
    def delete_all(self, request):
        count, _ = Company.objects.all().delete()
        User.objects.exclude(role='platform_owner').delete()
        AuditLog.objects.create(
            actor=request.user,
            action="delete_all_companies",
            target_type="Company",
            target_id="ALL"
        )
        return Response({"success": True, "deleted_companies": count})

    @action(detail=True, methods=['patch'], url_path='status')
    def change_status(self, request, pk=None):
        company = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['active', 'suspended']:
            return Response({"detail": "Invalid status. Use 'active' or 'suspended'."}, status=status.HTTP_400_BAD_REQUEST)
        
        company.status = new_status
        company.save()
        
        if new_status == 'suspended':
            company.users.update(status='deactivated', is_active=False)
        elif new_status == 'active':
            company.users.update(status='active', is_active=True)

        AuditLog.objects.create(
            actor=request.user,
            action=f"status_change_{new_status}",
            target_type="Company",
            target_id=str(company.id)
        )
        return Response(CompanySerializer(company).data)

    @action(detail=True, methods=['patch'], url_path='subscription')
    def change_subscription(self, request, pk=None):
        company = self.get_object()
        new_plan = request.data.get('subscription_plan') or request.data.get('plan')
        if new_plan not in ['free', 'basic', 'pro', 'enterprise']:
            return Response({"detail": "Invalid plan. Use 'free', 'basic', 'pro', or 'enterprise'."}, status=status.HTTP_400_BAD_REQUEST)
        
        company.subscription_plan = new_plan
        company.save()

        AuditLog.objects.create(
            actor=request.user,
            action=f"plan_change_{new_plan}",
            target_type="Company",
            target_id=str(company.id)
        )
        return Response(CompanySerializer(company).data)

    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend_company(self, request, pk=None):
        company = self.get_object()
        company.status = 'suspended'
        company.save()
        company.users.update(status='deactivated', is_active=False)
        AuditLog.objects.create(
            actor=request.user,
            action="suspend_company",
            target_type="Company",
            target_id=str(company.id)
        )
        return Response({"detail": f"Company '{company.name}' suspended successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate_company(self, request, pk=None):
        company = self.get_object()
        company.status = 'active'
        company.save()
        company.users.update(status='active', is_active=True)
        AuditLog.objects.create(
            actor=request.user,
            action="activate_company",
            target_type="Company",
            target_id=str(company.id)
        )
        return Response({"detail": f"Company '{company.name}' activated successfully."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete', 'post'], url_path='delete_all')
    def delete_all_companies(self, request):
        company_count, _ = Company.objects.all().delete()
        user_count, _ = User.objects.exclude(role='platform_owner').exclude(email__iexact='abdouamine@gmail.com').delete()
        AuditLog.objects.create(
            actor=request.user,
            action="delete_all_companies",
            target_type="Company",
            target_id="all"
        )
        return Response({"detail": f"Successfully deleted {company_count} tenant companies and {user_count} tenant users."}, status=status.HTTP_200_OK)


class PlatformUserViewSet(viewsets.ModelViewSet):
    """
    Cross-tenant user management for Platform Owners.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsPlatformOwner]


class PlatformAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log stream across all tenants.
    """
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsPlatformOwner]


class PlatformStatsView(views.APIView):
    """
    Returns cross-company statistics for Platform Owners.
    """
    permission_classes = [IsPlatformOwner]

    def get(self, request):
        total_companies = Company.objects.count()
        active_companies = Company.objects.filter(status='active').count()
        suspended_companies = Company.objects.filter(status='suspended').count()

        plans = Company.objects.values('subscription_plan').annotate(count=Count('id'))
        plans_breakdown = {p['subscription_plan']: p['count'] for p in plans}

        recent_audit_logs = AuditLogSerializer(AuditLog.objects.order_by('-created_at')[:10], many=True).data

        return Response({
            "totalCompanies": total_companies,
            "activeCompanies": active_companies,
            "suspendedCompanies": suspended_companies,
            "companiesByPlan": plans_breakdown,
            "recentAuditLogs": recent_audit_logs
        })


class PlatformAnalyticsView(PlatformStatsView):
    pass


class PlatformResetPasswordView(views.APIView):
    """
    Allows Platform Owners to reset any user's password.
    """
    permission_classes = [IsPlatformOwner]

    def post(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        new_password = request.data.get('password') or 'resetpass123'
        user.set_password(new_password)
        user.must_change_password = True
        user.save()
        on_password_changed(user, request=request)

        AuditLog.objects.create(
            actor=request.user,
            action="reset_password",
            target_type="User",
            target_id=str(user.id)
        )
        return Response({"detail": f"Password reset successfully for user {user.email}."}, status=status.HTTP_200_OK)


import os
from pathlib import Path
from datetime import datetime
from django.conf import settings
from django.core.management import call_command
from django.http import FileResponse

class PlatformBackupView(views.APIView):
    """
    Allows Platform Owners to trigger, list, and download full database snapshot backups.
    """
    permission_classes = [IsPlatformOwner]

    def get(self, request):
        action_type = request.query_params.get('action', 'list')
        backup_dir = Path(settings.BASE_DIR) / 'backups'
        backup_dir.mkdir(parents=True, exist_ok=True)

        if action_type == 'download':
            filename = request.query_params.get('file', '')
            # Prevent path traversal vulnerabilities
            if not filename or '/' in filename or '\\' in filename or '..' in filename:
                return Response({"detail": "Invalid backup filename."}, status=status.HTTP_400_BAD_REQUEST)
            file_path = backup_dir / filename
            if not file_path.exists():
                return Response({"detail": "Backup file not found."}, status=status.HTTP_404_NOT_FOUND)
            return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)

        # List all available backups
        backups = []
        for f_path in sorted(backup_dir.glob('sims_backup_*.*'), key=os.path.getmtime, reverse=True):
            try:
                stat = f_path.stat()
                backups.append({
                    'filename': f_path.name,
                    'size_bytes': stat.st_size,
                    'size_human': f"{stat.st_size / 1024:.1f} KB" if stat.st_size < 1024*1024 else f"{stat.st_size / (1024*1024):.2f} MB",
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
            except Exception:
                pass

        return Response({"backups": backups, "backup_dir": str(backup_dir)}, status=status.HTTP_200_OK)

    def post(self, request):
        keep_days = int(request.data.get('keep', 14))
        compress = bool(request.data.get('compress', False))
        try:
            call_command('backup_db', keep=keep_days, compress=compress)
            AuditLog.objects.create(
                actor=request.user,
                action="create_backup",
                target_type="System",
                target_id="Database"
            )
            return Response({"detail": "Database backup created and pruned successfully."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": f"Backup failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


