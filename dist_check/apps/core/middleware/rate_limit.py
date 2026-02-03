"""
Rate limiting middleware for API protection
"""
from django.core.cache import cache
from django.http import JsonResponse
import time


class RateLimitMiddleware:
    """
    Simple rate limiting middleware
    Limits requests per IP address
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip rate limiting for static files
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return self.get_response(request)
        
        # Get client IP
        ip = self.get_client_ip(request)
        
        # Check rate limit for login endpoint
        if request.path == '/api/v1/auth/login/' and request.method == 'POST':
            if not self.check_rate_limit(f'login_{ip}', limit=5, window=60):
                return JsonResponse({
                    'error': 'Too many login attempts. Please try again in 1 minute.'
                }, status=429)
        
        # Check rate limit for API endpoints
        if request.path.startswith('/api/'):
            if not self.check_rate_limit(f'api_{ip}', limit=100, window=60):
                return JsonResponse({
                    'error': 'Rate limit exceeded. Please slow down.'
                }, status=429)
        
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
    
    def check_rate_limit(self, key, limit, window):
        """
        Check if request is within rate limit
        Returns True if allowed, False if exceeded
        """
        cache_key = f'rate_limit_{key}'
        
        # Get current count and timestamp
        data = cache.get(cache_key, {'count': 0, 'start': time.time()})
        
        current_time = time.time()
        
        # Reset if window has passed
        if current_time - data['start'] > window:
            data = {'count': 1, 'start': current_time}
            cache.set(cache_key, data, window)
            return True
        
        # Increment count
        data['count'] += 1
        
        # Check if limit exceeded
        if data['count'] > limit:
            return False
        
        # Update cache
        cache.set(cache_key, data, window)
        return True
