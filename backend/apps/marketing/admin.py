from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .models import EmailUnsubscribe, EmailTemplate, MarketingCampaign, BirthdayEmailTracker
from .services import marketing_service

@admin.register(EmailUnsubscribe)
class EmailUnsubscribeAdmin(admin.ModelAdmin):
    list_display = ('email', 'reason', 'created_at')
    search_fields = ('email', 'reason')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'subject', 'is_active', 'updated_at')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'subject')

@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'recipient_type', 'status', 'sent_at', 'sent_count')
    list_filter = ('status', 'recipient_type', 'created_at')
    search_fields = ('title', 'subject')
    readonly_fields = ('sent_at', 'sent_count', 'failed_count', 'recipient_count')
    
    actions = ['send_campaign_action']
    
    def send_campaign_action(self, request, queryset):
        """Action to send selected campaigns."""
        processed = 0
        for campaign in queryset:
            if campaign.status == 'SENT':
                self.message_user(request, f"Campaign '{campaign.title}' already sent.", messages.WARNING)
                continue
                
            # Trigger sending (Sync for now, should be Async task in future)
            # In a real Azure setup, we would trigger a function or queue here.
            # But per "ZERO BREAKS", we keep it simple sync or pseudo-async.
            
            # Update status to sending
            campaign.status = 'SCHEDULED' # Or Processing
            campaign.save()
            
            try:
                marketing_service.send_campaign(campaign.id)
                processed += 1
                self.message_user(request, f"Campaign '{campaign.title}' sent successfully.", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending '{campaign.title}': {str(e)}", messages.ERROR)
                
        if processed == 0:
            self.message_user(request, "No eligible campaigns processed.", messages.INFO)
            
    send_campaign_action.short_description = "Send Selected Campaigns"
    
@admin.register(BirthdayEmailTracker)
class BirthdayEmailTrackerAdmin(admin.ModelAdmin):
    list_display = ('email', 'year', 'sent_at')
    search_fields = ('email',)
    list_filter = ('year',)
    readonly_fields = ('sent_at',)
