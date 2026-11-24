import hashlib
import hmac
import json
import logging

from django.conf import settings
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Payment
from .services import PaymentService
from .gateways.razorpay import amount_covers_order

logger = logging.getLogger(__name__)
payment_service = PaymentService()


@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """
    Handle Razorpay Webhooks.

    Verifies signature and updates payment/booking status.
    Supports events:
    - payment.captured (updates status to SUCCESS/PAID)
    - payment.failed (updates status to FAILED)
    """
    logger.info("Received Razorpay webhook")

    # 1. Verify Signature
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None)
    if not webhook_secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET not configured")
        return Response({'message': 'Webhook secret not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    signature = request.headers.get('X-Razorpay-Signature')
    if not signature:
        logger.error("Missing X-Razorpay-Signature header")
        return Response({'message': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

    # Razorpay signs the raw request body
    try:
        if request.content_type != 'application/json':
            logger.warning(f"Unexpected content type: {request.content_type}")

        mac = hmac.new(webhook_secret.encode(), request.body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(mac, signature):
            logger.error("Invalid Webhook Signature")
            return Response({'message': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error verifying signature: {str(e)}")
        return Response({'message': 'Verification failed'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Process Event
    try:
        payload = json.loads(request.body)
        event = payload.get('event')
        entity = payload.get('payload', {}).get('payment', {}).get('entity', {})

        razorpay_order_id = entity.get('order_id')
        razorpay_payment_id = entity.get('id')

        if not razorpay_order_id:
            logger.warning("Webhook payload missing order_id. Ignoring.")
            return Response({'status': 'ok'})  # Acknowledge

        logger.info(f"Processing event {event} for order {razorpay_order_id}")

        if not Payment.objects.filter(order_id=razorpay_order_id).exists():
            logger.warning(f"Payment record not found for order {razorpay_order_id}")
            return Response({'status': 'ok'})

        emails_to_send = None
        with transaction.atomic():
            # Lock the payment row: the browser's /verify call can arrive at the
            # same moment, and only one of them may credit the booking.
            payment = Payment.objects.select_for_update().get(order_id=razorpay_order_id)

            if event == 'payment.captured':
                if payment.status == 'SUCCESS':
                    logger.info(f"Payment {razorpay_order_id} already marked SUCCESS. Skipping.")
                    return Response({'status': 'ok'})

                # Security: the captured amount must cover the order amount.
                # It can be higher when the customer pays Razorpay's convenience fee.
                amount_paise = entity.get('amount')
                if not amount_covers_order(amount_paise, payment.amount):
                    logger.critical(f"Webhook Amount Mismatch! Expected: {payment.amount * 100}, Got: {amount_paise}")
                    payment.mark_failed("Webhook Amount Mismatch")
                    return Response({'status': 'ok'})

                payment.mark_success(payment_id=razorpay_payment_id, provider_response=payload)

                booking = payment.get_booking()
                booking.paid_amount += payment.amount
                if booking.paid_amount >= booking.amount:
                    booking.payment_status = 'PAID'
                elif booking.paid_amount > 0:
                    booking.payment_status = 'PARTIAL'
                booking.save()
                emails_to_send = (booking, payment)
                logger.info(f"Booking {booking.id} updated via Webhook.")

            elif event == 'payment.failed':
                # Never downgrade a payment that already succeeded
                if payment.status != 'SUCCESS':
                    error_desc = entity.get('error_description', 'Payment Failed')
                    payment.mark_failed(error_desc)
                    logger.info(f"Payment {razorpay_order_id} marked FAILED via webhook.")

        # Send emails after the transaction has committed
        if emails_to_send:
            booking, payment = emails_to_send
            try:
                if booking.payment_status == 'PAID':
                    payment_service._send_payment_success_email(booking, payment)
                elif booking.payment_status == 'PARTIAL':
                    payment_service._send_partial_payment_email(booking, payment)
            except Exception as e:
                logger.error(f"Async email send failed: {e}")

    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        # 500 so Razorpay retries the webhook
        return Response({'error': 'Internal processing error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'status': 'ok'})
