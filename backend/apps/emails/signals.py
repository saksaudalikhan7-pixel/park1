"""
Django signals for triggering emails on booking creation.
Uses post-save signals to send confirmation emails automatically.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender='bookings.Booking')
def send_booking_confirmation_on_create(sender, instance, created, **kwargs):
    """
    Send confirmation email when a new session booking is created.
    
    Only sends if:
    - Booking was just created (not updated)
    - EMAIL_BOOKING_ENABLED is True
    - Runs after transaction commits (ensures booking is saved)
    """
    if not created:
        return
    
    # Check if booking emails are enabled
    if not getattr(settings, 'EMAIL_BOOKING_ENABLED', False):
        logger.info(f"Booking emails disabled, skipping confirmation for booking {instance.id}")
        return
    
    # Send email after transaction commits (ensures booking is fully saved)
    def send_email():
        from .tasks import send_booking_confirmation_email
        try:
            send_booking_confirmation_email(instance.id)
        except Exception as e:
            logger.error(f"Failed to trigger booking confirmation email: {str(e)}")
    
    transaction.on_commit(send_email)


@receiver(post_save, sender='bookings.PartyBooking')
def send_party_booking_confirmation_on_create(sender, instance, created, **kwargs):
    """
    Send confirmation email when a new party booking is created.
    
    Only sends if:
    - Party booking was just created (not updated)
    - EMAIL_BOOKING_ENABLED is True
    - Runs after transaction commits (ensures booking is saved)
    """
    if not created:
        return
    
    # Check if booking emails are enabled
    if not getattr(settings, 'EMAIL_BOOKING_ENABLED', False):
        logger.info(f"Booking emails disabled, skipping confirmation for party booking {instance.id}")
        return
    
    # Send email after transaction commits (ensures booking is fully saved)
    def send_email():
        from .tasks import send_party_booking_confirmation_email
        try:
            send_party_booking_confirmation_email(instance.id)
        except Exception as e:
            logger.error(f"Failed to trigger party booking confirmation email: {str(e)}")
    
    transaction.on_commit(send_email)

