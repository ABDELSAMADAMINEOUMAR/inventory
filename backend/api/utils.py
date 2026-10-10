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
        # Do not re-raise so password changes / updates always succeed cleanly even if token tables are locked/missing



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


from urllib.parse import urlencode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.exceptions import ValidationError

token_generator = PasswordResetTokenGenerator()


def set_validated_password(user, password, field='password'):
    """Validate a password against AUTH_PASSWORD_VALIDATORS and set it (without saving)."""
    if not password:
        raise ValidationError({field: ["A password is required."]})
    try:
        validate_password(password, user=user)
    except DjangoValidationError as e:
        raise ValidationError({field: list(e.messages)})
    user.set_password(password)


def _frontend_base(request=None):
    """
    Pick the frontend base URL for emailed links. The request's Origin/Referer is only
    honoured when it matches an origin in CORS_ALLOWED_ORIGINS; otherwise FRONTEND_URL is used.
    This prevents attackers from making the server email links that point to their own site.
    """
    default = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if request is None:
        return default
    allowed = {o.rstrip('/') for o in getattr(settings, 'CORS_ALLOWED_ORIGINS', [])}
    referer = request.headers.get('Referer') or ''
    origin = request.headers.get('Origin') or ''
    candidates = []
    if referer:
        candidates.append(referer.split('?')[0].split('#')[0].rsplit('/', 1)[0])
    if origin and origin != 'null':
        candidates.append(origin)
    for cand in candidates:
        parts = cand.split('/')
        cand_origin = '/'.join(parts[:3])
        if cand_origin in allowed:
            if '.github.io' in cand_origin and '/inventory' not in cand:
                return f"{cand_origin}/inventory"
            return cand.rstrip('/')
    return default


def build_frontend_link(request, page, **params):
    return f"{_frontend_base(request)}/{page}?{urlencode(params)}"


def send_verification_email(user, request=None):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    link = build_frontend_link(request, 'verify-email.html', uid=uid, token=token, email=user.email)
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
