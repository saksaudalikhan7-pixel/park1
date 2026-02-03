from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.bookings.models import Booking, PartyBooking
from .models import Notification

@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """Create notification when a new booking is created"""
    if created:
        Notification.objects.create(
            type='BOOKING',
            title='New Session Booking',
            message=f'New booking from {instance.name} for {instance.date}',
            link=f'/admin/bookings/{instance.id}',
            booking_id=instance.id
        )

@receiver(post_save, sender=PartyBooking)
def create_party_booking_notification(sender, instance, created, **kwargs):
    """Create notification when a new party booking is created"""
    if created:
        Notification.objects.create(
            type='PARTY_BOOKING',
            title='New Party Booking',
            message=f'New party booking from {instance.name} for {instance.date}',
            link=f'/admin/party-bookings/{instance.id}',
            party_booking_id=instance.id
        )

# Check if ContactMessage model exists before creating signal
try:
    from apps.cms.models import ContactMessage
    
    @receiver(post_save, sender=ContactMessage)
    def create_contact_message_notification(sender, instance, created, **kwargs):
        """Create notification when a new contact message is received"""
        if created:
            # Truncate message for notification preview
            message_preview = instance.message[:50] + '...' if len(instance.message) > 50 else instance.message
            Notification.objects.create(
                type='CONTACT_MESSAGE',
                title='New Contact Message',
                message=f'Message from {instance.name} ({instance.email}): {message_preview}',
                link=f'/admin/cms/contact-messages/{instance.id}',
                contact_message_id=instance.id
            )
except ImportError:
    # ContactMessage model doesn't exist yet
    pass

# Security Logging Signals (Audit Finding #14)
from django.contrib.auth.signals import user_logged_in, user_login_failed
import logging

logger = logging.getLogger('django.security')

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful logins"""
    ip = request.META.get('REMOTE_ADDR')
    logger.info(f"Security Event: Successful login for user {user.email} (ID: {user.id}) from IP {ip}")

@receiver(user_login_failed)
def log_login_failed(sender, credentials, request, **kwargs):
    """Log failed login attempts"""
    ip = request.META.get('REMOTE_ADDR') if request else 'Unknown'
    email = credentials.get('email') or credentials.get('username') or 'Unknown'
    logger.warning(f"Security Event: Failed login attempt for {email} from IP {ip}")
