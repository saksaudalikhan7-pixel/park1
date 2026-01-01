"""
Django signals for triggering emails on booking creation.
Uses post-save signals to send confirmation emails automatically.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings

# Import models
from apps.bookings.models import Booking, PartyBooking

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Booking)
def send_booking_confirmation_on_create(sender, instance, created, **kwargs):
    """
    Send confirmation email when a new session booking is created.
    
    Only sends if:
    - Booking was just created (not updated)
    - Runs after transaction commits (ensures booking is saved)
    """
    if not created:
        return
    
    # PRODUCTION HOTFIX: Call email task directly (no transaction.on_commit)
    # Azure App Service kills background threads and discards ORM writes in on_commit callbacks
    from .tasks import send_booking_confirmation_email
    try:
        logger.info(f"[SIGNAL] Calling send_booking_confirmation_email for booking {instance.id}")
        send_booking_confirmation_email(instance.id)
        logger.info(f"[SIGNAL] Email task completed for booking {instance.id}")
    except Exception as e:
        logger.error(f"[SIGNAL] Failed to trigger booking confirmation email: {str(e)}")
        # DO NOT raise - booking creation must succeed even if email fails


@receiver(post_save, sender=PartyBooking)
def send_party_booking_confirmation_on_create(sender, instance, created, **kwargs):
    """
    Send confirmation email when a new party booking is created.
    
    Only sends if:
    - Party booking was just created (not updated)
    - Runs after transaction commits (ensures booking is saved)
    """
    if not created:
        return
    
    # PRODUCTION HOTFIX: Call email task directly (no transaction.on_commit)
    from .tasks import send_party_booking_confirmation_email
    try:
        logger.info(f"[SIGNAL] Calling send_party_booking_confirmation_email for party booking {instance.id}")
        send_party_booking_confirmation_email(instance.id)
        logger.info(f"[SIGNAL] Email task completed for party booking {instance.id}")
    except Exception as e:
        logger.error(f"[SIGNAL] Failed to trigger party booking confirmation email: {str(e)}")
        # DO NOT raise - booking creation must succeed even if email fails
"""
