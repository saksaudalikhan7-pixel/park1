from django.shortcuts import render
from django.http import HttpResponseBadRequest
from .services import marketing_service

def unsubscribe_view(request):
    """
    Public unsubscribe view.
    Zero auth required, but requires strict token validation.
    """
    token = request.GET.get('token')
    
    if not token:
        return HttpResponseBadRequest("Missing token")
        
    email = marketing_service.verify_unsubscribe_token(token)
    
    if not email:
        return HttpResponseBadRequest("Invalid or expired token")
        
    if request.method == 'POST':
        # Confirm unsubscribe
        marketing_service.unsubscribe_email(email, reason="User confirmed via web link")
        return render(request, 'marketing/unsubscribe_success.html', {'email': email, 'success': True})
        
    return render(request, 'marketing/unsubscribe_confirm.html', {'email': email})
