"""
Razorpay Payment Gateway Implementation.

This gateway integrates with Razorpay for real payment processing.
DISABLED BY DEFAULT - only activates when PAYMENT_MODE='razorpay' in settings.

Features:
- Real payment processing via Razorpay API
- Signature verification for security
- Webhook support for payment notifications
- Refund support (full and partial)
- Production-ready error handling
"""

import hashlib
import hmac
import logging
from decimal import Decimal
from typing import Dict, Any, Tuple, Optional
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from .base import BasePaymentGateway
from apps.payments.models import Payment

try:
    from razorpay.errors import SignatureVerificationError
except ImportError:  # SDK missing: __init__ raises a clear error anyway
    class SignatureVerificationError(Exception):
        pass

logger = logging.getLogger(__name__)


def to_paise(amount) -> int:
    """Rupees (Decimal) → paise (int), rounded the same way the order was created."""
    return int(Decimal(str(amount)) * 100)


def amount_covers_order(paid_paise, order_amount) -> bool:
    """
    True when a Razorpay payment covers our order amount.

    Razorpay can add a convenience fee paid by the customer (fee-bearer mode),
    so the captured amount may be HIGHER than the order amount (e.g. order
    ₹4715.00, captured ₹4812.38). That is a valid, complete payment. Only a
    lower amount is a real mismatch. (Earlier an exact match was required,
    which rejected genuine payments and left bookings unpaid.)
    """
    try:
        return int(paid_paise) >= to_paise(order_amount)
    except (TypeError, ValueError):
        return False


class RazorpayGateway(BasePaymentGateway):
    """
    Razorpay payment gateway for production use.
    
    Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in settings.
    Only used when PAYMENT_MODE='razorpay'.
    """
    
    def __init__(self):
        """Initialize Razorpay gateway"""
        self.provider_name = 'RAZORPAY'
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        
        if not self.key_id or not self.key_secret:
            raise ValueError(
                "Razorpay credentials not configured. "
                "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment."
            )
        
        # Initialize Razorpay client
        try:
            import razorpay
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            logger.info("RazorpayGateway initialized successfully")

        except ImportError:
            raise ImportError(
                "Razorpay SDK not installed. "
                "Run: pip install razorpay"
            )
    
    def create_order(self, booking, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Create a Razorpay order.
        
        Args:
            booking: Booking or PartyBooking instance
            amount: Payment amount (defaults to full booking amount)
        
        Returns:
            Dict with order details
        """
        # Determine booking type
        from apps.bookings.models import Booking, PartyBooking
        is_party = isinstance(booking, PartyBooking)
        
        # Calculate amount
        if amount is None:
            amount = booking.amount
        else:
            amount = Decimal(str(amount))
        
        # Convert to paise (Razorpay uses smallest currency unit)
        amount_paise = int(amount * 100)
        
        logger.info(f"Creating Razorpay order for ₹{amount}")
        
        # Create Razorpay order
        try:
            razorpay_order = self.client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': f"{'party' if is_party else 'session'}_{booking.id}_{int(timezone.now().timestamp())}",
                'notes': {
                    'booking_type': 'party' if is_party else 'session',
                    'booking_id': booking.id,
                    'customer_name': booking.name,
                    'customer_email': booking.email,
                }
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            raise Exception(f"Failed to create Razorpay order: {str(e)}")
        
        order_id = razorpay_order['id']
        
        # Create Payment record
        payment_data = {
            'provider': self.provider_name,
            'order_id': order_id,
            'amount': amount,
            'currency': 'INR',
            'status': 'CREATED',
            'provider_response': razorpay_order,
        }
        
        if is_party:
            payment_data['party_booking'] = booking
        else:
            payment_data['booking'] = booking
        
        payment = Payment.objects.create(**payment_data)
        
        logger.info(f"Razorpay order created: {order_id} (Payment ID: {payment.id})")
        
        return {
            'order_id': order_id,
            'amount': float(amount),
            'currency': 'INR',
            'provider': self.provider_name,
            'payment_id': payment.id,
            'key_id': self.key_id,  # Frontend needs this
            'razorpay_order': razorpay_order,
        }
    
    @transaction.atomic
    def verify_payment(self, data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Verify Razorpay payment signature.
        
        Args:
            data: Dict containing:
                - razorpay_order_id
                - razorpay_payment_id
                - razorpay_signature
        
        Returns:
            Tuple of (success, payment_id, response)
        """
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            raise ValueError("Missing required Razorpay verification parameters")
        
        # Get payment record with lock to prevent race conditions (Audit #13)
        try:
            payment = Payment.objects.select_for_update().get(order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            raise ValueError(f"Payment with order_id {razorpay_order_id} not found")
        
        # Check if already processed (Idempotency)
        if payment.status == 'SUCCESS':
            logger.warning(f"Payment {razorpay_order_id} already processed")
            return (True, payment.payment_id, {'message': 'Payment already processed'})
        
        # Verify signature
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except SignatureVerificationError:
            logger.error(f"Razorpay signature verification failed for order {razorpay_order_id}")
            payment.mark_failed("Signature verification failed: Invalid signature")
            return (False, '', {'error': 'Invalid payment signature'})
        except Exception as e:
            logger.error(f"Razorpay signature verification error: {str(e)}")
            payment.mark_failed(f"Verification error: {str(e)}")
            return (False, '', {'error': 'Payment verification failed'})
        
        # Fetch payment details from Razorpay
        try:
            razorpay_payment = self.client.payment.fetch(razorpay_payment_id)
            
            # Security Check: the payment must belong to this order and cover its amount.
            # Razorpay returns amount in paise (100 paise = 1 INR).
            if razorpay_payment.get('order_id') and razorpay_payment.get('order_id') != razorpay_order_id:
                logger.critical(f"Payment {razorpay_payment_id} belongs to another order {razorpay_payment.get('order_id')}")
                payment.mark_failed("Payment does not belong to this order")
                return (False, '', {'error': 'Payment does not match this order'})

            fetched_amount_paise = int(razorpay_payment.get('amount', 0))
            if not amount_covers_order(fetched_amount_paise, payment.amount):
                logger.critical(f"Payment amount too low! Expected: {payment.amount}, Got: {fetched_amount_paise / 100}")
                payment.mark_failed(f"Amount mismatch: Expected {payment.amount}, Paid {fetched_amount_paise / 100}")
                return (False, '', {'error': 'Payment amount mismatch'})
            if fetched_amount_paise != to_paise(payment.amount):
                # Customer paid Razorpay's convenience fee on top (fee-bearer mode)
                logger.info(f"Payment {razorpay_payment_id} includes convenience fee: "
                            f"order ₹{payment.amount}, captured ₹{fetched_amount_paise / 100}")

        except Exception as e:
            logger.error(f"Failed to fetch Razorpay payment: {str(e)}")
            payment.mark_failed(f"Failed to fetch payment details: {str(e)}")
            return (False, '', {'error': 'Failed to fetch payment details'})
        
        # Mark payment as successful
        payment.mark_success(
            payment_id=razorpay_payment_id,
            provider_response=razorpay_payment
        )
        
        # Update booking paid_amount and payment_status
        booking = payment.get_booking()
        booking.paid_amount += payment.amount
        
        # Update payment status based on paid amount
        if booking.paid_amount >= booking.amount:
            booking.payment_status = 'PAID'
        elif booking.paid_amount > 0:
            booking.payment_status = 'PARTIAL'
        
        booking.save()
        
        logger.info(f"Razorpay payment verified: {razorpay_order_id} → {razorpay_payment_id}")
        logger.info(f"Booking {booking.id} paid_amount: ₹{booking.paid_amount}/₹{booking.amount} ({booking.payment_status})")
        
        response = {
            'payment_id': razorpay_payment_id,
            'order_id': razorpay_order_id,
            'amount': float(payment.amount),
            'status': 'success',
            'booking_payment_status': booking.payment_status,
            'booking_paid_amount': float(booking.paid_amount),
            'booking_remaining': float(booking.remaining_balance),
        }
        
        return (True, razorpay_payment_id, response)
    
    @transaction.atomic
    def refund(self, payment, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Process a Razorpay refund.
        
        Args:
            payment: Payment instance to refund
            amount: Refund amount (defaults to full payment amount)
        
        Returns:
            Dict with refund details
        """
        # Calculate refund amount
        if amount is None:
            refund_amount = payment.amount
        else:
            refund_amount = Decimal(str(amount))
        
        # Validate refund amount
        if refund_amount > payment.amount:
            raise ValueError(f"Refund amount (₹{refund_amount}) cannot exceed payment amount (₹{payment.amount})")
        
        if refund_amount <= 0:
            raise ValueError("Refund amount must be positive")
        
        # Convert to paise
        refund_amount_paise = int(refund_amount * 100)
        
        logger.info(f"Processing Razorpay refund for ₹{refund_amount}")
        
        # Process refund via Razorpay API
        try:
            razorpay_refund = self.client.payment.refund(
                payment.payment_id,
                {
                    'amount': refund_amount_paise,
                    'speed': 'normal',  # or 'optimum'
                }
            )
        except Exception as e:
            logger.error(f"Razorpay refund failed: {str(e)}")
            raise Exception(f"Failed to process Razorpay refund: {str(e)}")
        
        refund_id = razorpay_refund['id']
        
        # Create refund payment record (negative amount)
        booking = payment.get_booking()
        from apps.bookings.models import PartyBooking
        is_party = isinstance(booking, PartyBooking)
        
        refund_payment_data = {
            'provider': self.provider_name,
            'order_id': refund_id,
            'payment_id': refund_id,
            'amount': -refund_amount,  # Negative for refund
            'currency': 'INR',
            'status': 'SUCCESS',
            'provider_response': razorpay_refund,
            'notes': f"Refund for payment {payment.payment_id}",
        }
        
        if is_party:
            refund_payment_data['party_booking'] = booking
        else:
            refund_payment_data['booking'] = booking
        
        refund_payment = Payment.objects.create(**refund_payment_data)
        
        # Update booking paid_amount
        booking.paid_amount -= refund_amount
        
        # Update payment status
        if booking.paid_amount <= 0:
            booking.payment_status = 'REFUNDED'
        elif booking.paid_amount < booking.amount:
            booking.payment_status = 'PARTIAL'
        
        booking.save()
        
        # Mark original payment as refunded if full refund
        if refund_amount == payment.amount:
            payment.status = 'REFUNDED'
            payment.save()
        
        logger.info(f"Razorpay refund processed: {refund_id}")
        logger.info(f"Booking {booking.id} paid_amount after refund: ₹{booking.paid_amount} ({booking.payment_status})")
        
        return {
            'refund_id': refund_id,
            'amount': float(refund_amount),
            'status': razorpay_refund['status'],
            'booking_payment_status': booking.payment_status,
            'booking_paid_amount': float(booking.paid_amount),
            'razorpay_refund': razorpay_refund,
        }
    
    def get_provider_name(self) -> str:
        """Get provider name"""
        return self.provider_name
