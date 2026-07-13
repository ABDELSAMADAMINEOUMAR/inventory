from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that uses select_related('company') to fetch the user
    and attach company and token claims directly, avoiding extra DB round-trips.
    """
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise AuthenticationFailed('Token contained no recognizable user identification')

        try:
            user = self.user_model.objects.select_related('company').get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed('User not found', code='user_not_found')

        if not user.is_active or user.status != 'active':
            raise AuthenticationFailed('User is inactive or deactivated', code='user_inactive')

        user.token_role = validated_token.get('role', user.role)
        user.token_company_id = validated_token.get('company_id', user.company_id)
        return user
