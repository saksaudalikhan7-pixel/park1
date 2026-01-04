from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import unsubscribe_view, EmailTemplateViewSet, MarketingCampaignViewSet

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet)
router.register(r'marketing-campaigns', MarketingCampaignViewSet)

urlpatterns = [
    path('unsubscribe/', unsubscribe_view, name='marketing_unsubscribe'),
    path('', include(router.urls)),
]
