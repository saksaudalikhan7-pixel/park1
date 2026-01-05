from django.shortcuts import render
from django.http import HttpResponseBadRequest
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmailTemplate, MarketingCampaign
from .serializers import EmailTemplateSerializer, MarketingCampaignSerializer
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

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by('-created_at')
    serializer_class = EmailTemplateSerializer
    filterset_fields = ['is_active', 'type']

    def get_queryset(self):
        return EmailTemplate.objects.all().order_by('-created_at')

class MarketingCampaignViewSet(viewsets.ModelViewSet):
    queryset = MarketingCampaign.objects.all().order_by('-created_at')
    serializer_class = MarketingCampaignSerializer
    filterset_fields = ['status', 'recipient_type']

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        
        if campaign.status == 'SENT':
            return Response(
                {"error": "Campaign already sent."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Trigger sending logic
            marketing_service.send_campaign(campaign.id)
            
            # Refresh to get updated fields
            campaign.refresh_from_db()
            branding_serializer = self.get_serializer(campaign)
            
            return Response({
                "message": f"Campaign '{campaign.title}' successfully sent.",
                "data": branding_serializer.data
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

