from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that inspects incoming JWT tokens and attaches request.tenant_company_id
    and request.tenant_role directly to the request object without extra DB queries.
    """
    def process_request(self, request):
        request.tenant_company_id = None
        request.tenant_role = None

        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token_str = auth_header.split(' ')[1]
            try:
                token = AccessToken(token_str)
                company_id = token.get('company_id')
                role = token.get('role')
                request.tenant_company_id = company_id
                request.tenant_role = role
                if hasattr(request, 'user') and request.user.is_authenticated:
                    request.user.token_company_id = company_id
                    request.user.token_role = role
            except Exception:
                pass
