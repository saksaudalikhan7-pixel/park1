from django.db import models
from django.utils import timezone
import uuid

class EmailUnsubscribe(models.Model):
    """
    Mandatory unsubscribe list.
    Checked before sending ANY marketing email.
    """
    email = models.EmailField(unique=True, db_index=True)
    reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.email

class EmailTemplate(models.Model):
    """
    Reusable email templates for campaigns.
    """
    TYPE_CHOICES = [
        ('BIRTHDAY', 'Birthday'),
        ('PROMOTION', 'Promotion'),
        ('HOLIDAY', 'Holiday'),
        ('GENERAL', 'General'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='GENERAL')
    subject = models.CharField(max_length=255, help_text="Default subject line")
    html_content = models.TextField(help_text="HTML content with optional {{ placeholders }}")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class MarketingCampaign(models.Model):
    """
    Admin-controlled marketing campaigns.
    """
    RECIPIENT_CHOICES = [
        ('ALL_ADULTS', 'All Adult Participants'),
        ('ALL_GUARDIANS', 'All Guardians'),
        ('CUSTOM_LIST', 'Custom Email List'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField(help_text="Campaign specific content to inject into template")
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_CHOICES, default='ALL_ADULTS')
    custom_email_list = models.TextField(blank=True, null=True, help_text="Comma-separated list of emails for CUSTOM_LIST recipient type")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    sent_at = models.DateTimeField(null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    
    recipient_count = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class BirthdayEmailTracker(models.Model):
    """
    Tracks yearly birthday emails to prevent duplicates.
    """
    email = models.EmailField(db_index=True)
    year = models.IntegerField()
    sent_at = models.DateTimeField(auto_now_add=True)
    
    # Optional links for reference
    waiver = models.ForeignKey('bookings.Waiver', on_delete=models.SET_NULL, null=True, blank=True)
    customer = models.ForeignKey('bookings.Customer', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['email', 'year']
        indexes = [
            models.Index(fields=['email', 'year']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.year}"
