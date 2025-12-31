"""
Async email tasks using threading (simplified approach).
No Celery required - emails send in background threads.
"""

import logging
import threading
from django.utils import timezone
from .models import EmailLog
from .services import email_service

logger = logging.getLogger(__name__)


def send_email_async(email_log_id):
    """
    Send email in background thread.
    
    Args:
        email_log_id: ID of the EmailLog entry to process
    """
    try:
        email_log = EmailLog.objects.get(id=email_log_id)
        
        # Check if already sent
        if email_log.status == 'SENT':
            logger.info(f"Email {email_log_id} already sent, skipping")
            return
        
        # Check if emails are enabled
        if not email_service.enabled:
            logger.info(f"Emails disabled, marking {email_log_id} as failed")
            email_log.mark_failed("Email sending disabled by EMAIL_ENABLED flag")
            return
        
        # Debug mode
        if email_service.debug_mode:
            logger.info(f"[DEBUG] Would send email {email_log_id}: {email_log.email_type} to {email_log.recipient_email}")
            email_log.mark_failed("Debug mode enabled - email not sent")
            return
        
        # Send email
        message_id = email_service._send_via_azure(
            recipient_email=email_log.recipient_email,
            subject=email_log.subject,
            html_content=email_service._render_template(
                email_log.template_name,
                email_log.context_data
            )
        )
        
        # Mark as sent
        email_log.mark_sent(message_id=message_id)
        logger.info(f"Email {email_log_id} sent successfully (Message ID: {message_id})")
        
    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog {email_log_id} not found")
    except Exception as e:
        logger.error(f"Failed to send email {email_log_id}: {str(e)}")
        try:
            email_log = EmailLog.objects.get(id=email_log_id)
            email_log.mark_failed(str(e))
        except:
            pass


def send_booking_confirmation_email(booking_id):
    """
    Send session booking confirmation email (async via thread).
    
    Args:
        booking_id: ID of the Booking instance
    """
    logger.info(f"=== send_booking_confirmation_email called for booking {booking_id} ===")
    try:
        from apps.bookings.models import Booking
        
        booking = Booking.objects.get(id=booking_id)
        logger.info(f"Retrieved booking {booking_id}: {booking.name} ({booking.email})")
        
        # Create EmailLog entry
        logger.info(f"Calling email_service.send_booking_confirmation...")
        email_log = email_service.send_booking_confirmation(booking)
        logger.info(f"EmailLog created! ID: {email_log.id}, Status: {email_log.status}")
        
        # Send in background thread
        if email_log.status == 'PENDING':
            logger.info(f"Starting background thread for EmailLog {email_log.id}")
            thread = threading.Thread(target=send_email_async, args=(email_log.id,))
            thread.daemon = True
            thread.start()
        else:
            logger.warning(f"EmailLog {email_log.id} status is {email_log.status}, not starting thread")
        
        logger.info(f"✅ Successfully queued booking confirmation email for booking {booking_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to queue booking confirmation for {booking_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


def send_party_booking_confirmation_email(party_booking_id):
    """
    Send party booking confirmation email (async via thread).
    
    Args:
        party_booking_id: ID of the PartyBooking instance
    """
    try:
        from apps.bookings.models import PartyBooking
        
        party_booking = PartyBooking.objects.get(id=party_booking_id)
        
        # Create EmailLog entry
        email_log = email_service.send_party_booking_confirmation(party_booking)
        
        # Send in background thread
        if email_log.status == 'PENDING':
            thread = threading.Thread(target=send_email_async, args=(email_log.id,))
            thread.daemon = True
            thread.start()
        
        logger.info(f"Queued party booking confirmation email for booking {party_booking_id}")
        
    except Exception as e:
        logger.error(f"Failed to queue party booking confirmation for {party_booking_id}: {str(e)}")

