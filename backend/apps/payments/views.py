"""
Payment API Views.

Provides REST API endpoints for payment operations:
- Create payment order
- Verify payment
- Process refund
- Get booking payment status
"""

import logging
from decimal import Decimal, InvalidOperation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .services import payment_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Frontend needs to create orders
def create_payment_order(request):
    """
    Create a payment order.
    
    POST /api/payments/create-order
    
    Body:
        {
            "booking_id": 123,
            "booking_type": "session" or "party",
            "amount": 5000.00  # Optional, defaults to remaining balance
        }
    
    Returns:
        {
            "success": true,
            "order_id": "MOCK_ORDER_...",
            "amount": 5000.00,
            "currency": "INR",
            "provider": "MOCK",
            ...
        }
    """
    try:
        booking_id = request.data.get('booking_id')
        booking_type = request.data.get('booking_type')
        amount = request.data.get('amount')
        
        # Validate required fields
        if not booking_id:
            return Response(
                {'error': 'booking_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not booking_type or booking_type not in ['session', 'party']:
            return Response(
                {'error': 'booking_type must be "session" or "party"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount if provided
        if amount is not None:
            try:
                amount = Decimal(str(amount))
            except (InvalidOperation, ValueError):
                return Response(
                    {'error': 'Invalid amount format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create order
        order_data = payment_service.create_payment_order(
            booking_id=int(booking_id),
            booking_type=booking_type,
            amount=amount
        )
        
        return Response({
            'success': True,
            **order_data
        })
        
    except ValueError as e:
        logger.error(f"Validation error creating payment order: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        return Response(
            {'error': f'Failed to create payment order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Frontend needs to verify payments
def verify_payment(request):
    """
    Verify a payment.
    
    POST /api/payments/verify
    
    Body (Mock):
        {
            "order_id": "MOCK_ORDER_...",
            "force_fail": false  # Optional, for testing
        }
    
    Body (Razorpay):
        {
            "razorpay_order_id": "order_...",
            "razorpay_payment_id": "pay_...",
            "razorpay_signature": "..."
        }
    
    Returns:
        {
            "success": true,
            "payment_id": "MOCK_PAY_...",
            "booking_id": 123,
            "booking_type": "session",
            "payment_status": "PAID",
            "paid_amount": 5000.00,
            "remaining_balance": 0.00
        }
    """
    try:
        # Get order_id (could be 'order_id' for mock or 'razorpay_order_id' for Razorpay)
        order_id = request.data.get('order_id') or request.data.get('razorpay_order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id or razorpay_order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify payment
        result = payment_service.verify_and_complete_payment(
            order_id=order_id,
            payment_data=request.data
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Validation error verifying payment: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        return Response(
            {'success': False, 'error': f'Failed to verify payment: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Only admins can refund
def process_refund(request):
    """
    Process a refund.
    
    POST /api/payments/refund
    
    Body:
        {
            "payment_id": 123,
            "amount": 2500.00,  # Optional, defaults to full refund
            "reason": "Customer requested refund"  # Optional
        }
    
    Returns:
        {
            "success": true,
            "refund_id": "MOCK_REFUND_...",
            "amount": 2500.00,
            "booking_id": 123,
            "payment_status": "PARTIAL"
        }
    """
    try:
        payment_id = request.data.get('payment_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason', '')
        
        if not payment_id:
            return Response(
                {'error': 'payment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount if provided
        if amount is not None:
            try:
                amount = Decimal(str(amount))
            except (InvalidOperation, ValueError):
                return Response(
                    {'error': 'Invalid amount format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Process refund
        result = payment_service.process_refund(
            payment_id=int(payment_id),
            amount=amount,
            reason=reason
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Validation error processing refund: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        return Response(
            {'success': False, 'error': f'Failed to process refund: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_booking_payment_status(request, booking_id, booking_type):
    """
    Get payment status for a booking.
    
    GET /api/payments/booking/{booking_id}/{booking_type}/status
    
    Returns:
        {
            "booking_id": 123,
            "booking_type": "session",
            "total_amount": 5000.00,
            "paid_amount": 2500.00,
            "remaining_balance": 2500.00,
            "payment_status": "PARTIAL",
            "payments": [...]
        }
    """
    try:
        if booking_type not in ['session', 'party']:
            return Response(
                {'error': 'booking_type must be "session" or "party"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = payment_service.get_booking_payment_status(
            booking_id=int(booking_id),
            booking_type=booking_type
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Error getting payment status: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        return Response(
            {'error': f'Failed to get payment status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
