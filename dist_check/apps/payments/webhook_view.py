
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
    import hmac
    import hashlib
    import json
    from django.conf import settings
    
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
        
    # Razorpay uses request body for signature verification
    # We must use the raw body bytes
    try:
        # Verify content type
        if request.content_type != 'application/json':
             logger.warning(f"Unexpected content type: {request.content_type}")
             # Proceed anyway as Razorpay sends JSON
        
        # Verify MAC
        msg = request.body
        mac = hmac.new(
            webhook_secret.encode(), 
            msg, 
            hashlib.sha256
        ).hexdigest()
        
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
            return Response({'status': 'ok'}) # Return 200 to acknowledge
            
        logger.info(f"Processing event {event} for order {razorpay_order_id}")
        
        # Find local payment record
        try:
            payment = Payment.objects.get(order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            logger.warning(f"Payment record not found for order {razorpay_order_id}")
            return Response({'status': 'ok'})
            
        if event == 'payment.captured':
            # Check if already processed
            if payment.status == 'SUCCESS':
                logger.info(f"Payment {razorpay_order_id} already marked SUCCESS. Skipping.")
                return Response({'status': 'ok'})
                
            # Use PaymentService to verify/complete
            # Since it's captured, we trust the webhook and don't need to re-verify with API if we verified signature
            # But consistent flow is better. Let's manually complete it.
            
            # Security: Verify amount again
            amount_paise = entity.get('amount')
            if amount_paise != int(payment.amount * 100):
                logger.critical(f"Webhook Amount Mismatch! Expected: {payment.amount * 100}, Got: {amount_paise}")
                payment.mark_failed("Webhook Amount Mismatch")
                return Response({'status': 'ok'})

            # Mark as success
            payment.mark_success(
                payment_id=razorpay_payment_id,
                provider_response=payload
            )
            
            # Update booking
            booking = payment.get_booking()
            booking.paid_amount += payment.amount
            if booking.paid_amount >= booking.amount:
                booking.payment_status = 'PAID'
            elif booking.paid_amount > 0:
                booking.payment_status = 'PARTIAL'
            booking.save()
            
            # Send Emails (via service)
            try:
                if booking.payment_status == 'PAID':
                    payment_service._send_payment_success_email(booking, payment)
                elif booking.payment_status == 'PARTIAL':
                    payment_service._send_partial_payment_email(booking, payment)
            except Exception as e:
                logger.error(f"Async email send failed: {e}")

            logger.info(f"Booking {booking.id} updated via Webhook.")

        elif event == 'payment.failed':
             error_desc = entity.get('error_description', 'Payment Failed')
             payment.mark_failed(error_desc)
             logger.info(f"Payment {razorpay_order_id} marked FAILED via webhook.")
             
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        # Return 500 so Razorpay retries? Actually better to return 200 if it's our bug to avoid spam
        # But for now return 500 to see alerts
        return Response({'error': 'Internal processing error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'status': 'ok'})
