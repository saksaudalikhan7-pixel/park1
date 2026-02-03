"""
Security middleware for input validation and logging
"""
import logging

logger = logging.getLogger('security')


class SecurityMiddleware:
    """
    Security middleware for request validation and logging
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Validate request size (max 10MB)
        if request.META.get('CONTENT_LENGTH'):
            content_length = int(request.META.get('CONTENT_LENGTH', 0))
            if content_length > 10 * 1024 * 1024:  # 10MB
                logger.warning(f'Large request blocked: {content_length} bytes from {self.get_client_ip(request)}')
                from django.http import JsonResponse
                return JsonResponse({
                    'error': 'Request too large. Maximum size is 10MB.'
                }, status=413)
        
        # Log authentication attempts
        if request.path == '/api/v1/auth/login/':
            logger.info(f'Login attempt from {self.get_client_ip(request)}')
        
        # Log admin access
        if request.path.startswith('/api/v1/') and request.user.is_authenticated:
            if hasattr(request.user, 'role') and request.user.role in ['ADMIN', 'MANAGER']:
                logger.info(f'Admin access: {request.user.username} - {request.method} {request.path}')
        
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
