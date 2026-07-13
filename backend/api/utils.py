import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

logger = logging.getLogger(__name__)


def invalidate_all_sessions(user):
    """
    Revokes all valid, non-expired refresh tokens for the given user.
    Executes in a single bulk query to prevent SQLite database lock/latency.
    """
    try:
        # Only fetch tokens that are currently valid and not yet blacklisted
        active_tokens = OutstandingToken.objects.filter(
            user=user,
            expires_at__gt=timezone.now()
        ).exclude(
            blacklistedtoken__isnull=False
        )
        
        # Bulk create blacklist entries
        blacklist_entries = [BlacklistedToken(token=token) for token in active_tokens]
        if blacklist_entries:
            BlacklistedToken.objects.bulk_create(blacklist_entries, ignore_conflicts=True)
            logger.info("Successfully blacklisted %d active session tokens for user %s.", len(blacklist_entries), user.email)
    except Exception as e:
        logger.error("Error blacklisting sessions for user %s: %s", user.email, e, exc_info=True)
        raise e  # Re-raise to ensure transaction atomicity if DB fails


def on_password_changed(user, request=None):
    """
    Orchestrates critical security actions following a password update:
    1. Invalidates all active refresh tokens for the user in an atomic transaction.
    2. Sends a non-blocking notification email to the user.
    Must be called after user.set_password(new_pwd) and user.save().
    """
    # 1. Critical Security Boundary: Execute inside atomic transaction
    with transaction.atomic():
        invalidate_all_sessions(user)
        
    # 2. Non-blocking Side-Effect: Send email notification after DB commit
    try:
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S %Z')
        support_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@smartims.com')
        subject = "Your SmartIMS password was changed"
        message = (
            f"Hello {getattr(user, 'name', user.email)},\n\n"
            f"Your password was just changed on {timestamp}. If this wasn't you, "
            f"contact support immediately at {support_email}.\n\n"
            f"— The SmartIMS Security Team"
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=support_email,
            recipient_list=[user.email],
            fail_silently=False
        )
        logger.info("Sent password change notification email to %s.", user.email)
    except Exception as e:
        logger.error("Password notification email failed for %s: %s", user.email, e, exc_info=True)


from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

token_generator = PasswordResetTokenGenerator()


def send_verification_email(user, request=None):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    origin = "http://127.0.0.1:8000"
    if request:
        referer = request.headers.get('Referer') or request.META.get('HTTP_REFERER')
        req_origin = request.headers.get('Origin') or request.META.get('HTTP_ORIGIN')
        if referer and "verify-email.html" not in referer:
            origin = referer.rsplit('/', 1)[0]
        elif req_origin and req_origin != "null":
            origin = req_origin
    link = f"{origin}/verify-email.html?uid={uid}&token={token}&email={user.email}"
    try:
        send_mail(
            subject="SmartIMS: Activate Your Account & Set Password",
            message=f"Welcome to SmartIMS!\n\nYour company admin account ({user.email}) has been created.\n\nPlease click the secure link below to verify your email address and set your permanent account password:\n\n{link}\n\nThank you,\nSmartIMS Team",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@smartims.com'),
            recipient_list=[user.email],
            fail_silently=False
        )
        logger.info("Sent account verification email to %s.", user.email)
        return True
    except Exception as e:
        logger.error("Failed to send account verification email to %s: %s", user.email, e, exc_info=True)
        raise e

