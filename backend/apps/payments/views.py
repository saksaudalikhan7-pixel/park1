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
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .services import payment_service
from django_ratelimit.decorators import ratelimit

logger = logging.getLogger(__name__)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', method='POST')  # Max 10 payment orders per minute per IP
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
@ratelimit(key='ip', rate='10/m', method='POST')  # Max 10 verifications per minute per IP
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Only admins can view stats
def get_payment_stats(request):
    """
    Get payment statistics and analytics.
    
    GET /api/payments/stats
    
    Returns comprehensive payment analytics including:
    - Total payments, successful, failed, refunds
    - Revenue metrics (total, today, week, month)
    - Average transaction value
    - Success rate
    - Recent payments
    - Payment methods breakdown
    - Daily revenue trend
    """
    try:
        from .models import Payment
        from apps.bookings.models import Booking, PartyBooking
        from django.db.models import Sum, Count, Q, Avg
        from django.utils import timezone
        from datetime import timedelta
        
        # Real payments only: the mock gateway was used for testing (no real money)
        all_payments = Payment.objects.exclude(provider='MOCK')
        
        # Basic counts
        total_payments = all_payments.count()
        successful_payments = all_payments.filter(status='SUCCESS', amount__gt=0).count()
        failed_payments = all_payments.filter(status='FAILED').count()
        total_refunds = all_payments.filter(amount__lt=0).count()
        
        # Revenue calculations (only successful payments with positive amounts)
        successful_payment_qs = all_payments.filter(status='SUCCESS', amount__gt=0)
        total_revenue = successful_payment_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Time-based revenue (park local time, Asia/Kolkata)
        now = timezone.localtime()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        
        today_revenue = successful_payment_qs.filter(
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        this_week_revenue = successful_payment_qs.filter(
            created_at__gte=week_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        this_month_revenue = successful_payment_qs.filter(
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Average transaction value
        avg_transaction = successful_payment_qs.aggregate(avg=Avg('amount'))['avg'] or 0
        
        # Success rate
        success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
        
        # Payment methods breakdown
        payment_methods = {
            'MOCK': all_payments.filter(provider='MOCK').count(),
            'RAZORPAY': all_payments.filter(provider='RAZORPAY').count()
        }
        
        # Recent payments (last 10)
        recent_payments_qs = all_payments.select_related(
            'booking', 'party_booking'
        ).order_by('-created_at')[:10]
        
        recent_payments = []
        for payment in recent_payments_qs:
            booking_info = None
            if payment.booking:
                booking_info = {
                    'id': payment.booking.id,
                    'type': 'session',
                    'name': payment.booking.name,
                    'email': payment.booking.email,
                    'date': payment.booking.date.isoformat() if payment.booking.date else None,
                }
            elif payment.party_booking:
                booking_info = {
                    'id': payment.party_booking.id,
                    'type': 'party',
                    'name': payment.party_booking.name,
                    'email': payment.party_booking.email,
                    'date': payment.party_booking.date.isoformat() if payment.party_booking.date else None,
                }
            
            recent_payments.append({
                'id': payment.id,
                'order_id': payment.order_id,
                'payment_id': payment.payment_id,
                'amount': float(payment.amount),
                'status': payment.status,
                'provider': payment.provider,
                'created_at': payment.created_at.isoformat(),
                'booking': booking_info
            })
        
        # Daily revenue for last 7 days
        daily_revenue = []
        for i in range(6, -1, -1):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_revenue = successful_payment_qs.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            daily_revenue.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'revenue': float(day_revenue)
            })
        
        return Response({
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'total_refunds': total_refunds,
            'total_revenue': float(total_revenue),
            'today_revenue': float(today_revenue),
            'this_week_revenue': float(this_week_revenue),
            'this_month_revenue': float(this_month_revenue),
            'avg_transaction_value': float(avg_transaction),
            'success_rate': round(success_rate, 2),
            'payment_methods': payment_methods,
            'recent_payments': recent_payments,
            'daily_revenue': daily_revenue
        })
        
    except Exception as e:
        logger.error(f"Error getting payment stats: {str(e)}")
        return Response(
            {'error': f'Failed to get payment stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_payments(request):
    """
    List all payments with optional filtering.
    
    GET /api/payments/
    
    Query params:
        - status: Filter by status (SUCCESS, FAILED, CREATED, REFUNDED)
        - provider: Filter by provider (MOCK, RAZORPAY)
        - limit: Number of results (default: 100)
        - offset: Pagination offset (default: 0)
    
    Returns:
        {
            "count": 10,
            "results": [...]
        }
    """
    try:
        from .models import Payment
        from .serializers import PaymentSerializer
        
        # Get query parameters
        status_filter = request.query_params.get('status')
        provider_filter = request.query_params.get('provider')
        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        
        # Build query
        queryset = Payment.objects.all().select_related('booking', 'party_booking')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if provider_filter:
            queryset = queryset.filter(provider=provider_filter)
        
        # Order by most recent first
        queryset = queryset.order_by('-created_at')
        
        # Get total count
        total_count = queryset.count()
        
        # Apply pagination
        payments = queryset[offset:offset + limit]
        
        # Serialize
        serializer = PaymentSerializer(payments, many=True)
        
        return Response({
            'count': total_count,
            'results': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error listing payments: {str(e)}")
        return Response(
            {'error': f'Failed to list payments: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def reconcile_payments(request):
    """
    READ-ONLY check: ask Razorpay whether any order that we still have as
    CREATED (customer opened checkout) or FAILED was actually paid.
    Nothing is changed in the database.

    GET /api/v1/payments/reconcile/?offset=0&limit=10

    Small batches only: the server runs a single worker, so each call is kept
    to a few seconds.
    """
    from .models import Payment

    if payment_service.gateway.get_provider_name() != 'RAZORPAY':
        return Response({'error': 'Razorpay is not the active gateway'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        offset = max(0, int(request.query_params.get('offset', 0)))
        limit = min(10, max(1, int(request.query_params.get('limit', 10))))
    except ValueError:
        return Response({'error': 'offset/limit must be numbers'}, status=status.HTTP_400_BAD_REQUEST)

    order_ids = [o.strip() for o in request.query_params.get('order_ids', '').split(',') if o.strip()]
    if order_ids:
        # Check specific orders (any status), e.g. to confirm a booking was really paid
        qs = Payment.objects.filter(provider='RAZORPAY', order_id__in=order_ids[:10]).order_by('id')
    else:
        qs = Payment.objects.filter(provider='RAZORPAY', status__in=['CREATED', 'FAILED']).order_by('id')
    total = qs.count()
    batch = list(qs.select_related('booking', 'party_booking')[offset:offset + limit])

    client = payment_service.gateway.client
    missed, errors = [], []
    for payment in batch:
        try:
            items = client.order.payments(payment.order_id).get('items', [])
        except Exception as exc:  # keep going; report the problem
            errors.append({'payment': payment.id, 'order_id': payment.order_id, 'error': str(exc)[:200]})
            continue
        paid = [i for i in items if i.get('status') in ('captured', 'authorized')]
        if paid:
            booking = payment.get_booking()
            missed.append({
                'payment': payment.id,
                'order_id': payment.order_id,
                'our_status': payment.status,
                'amount': float(payment.amount),
                'booking_id': booking.id if booking else None,
                'booking_type': 'party' if payment.party_booking_id else 'session',
                'booking_payment_status': getattr(booking, 'payment_status', None),
                'razorpay_payments': [
                    {'id': i.get('id'), 'status': i.get('status'), 'amount': (i.get('amount') or 0) / 100}
                    for i in paid
                ],
            })

    next_offset = offset + len(batch)
    return Response({
        'total_to_check': total,
        'checked': f'{offset + 1}-{next_offset}' if batch else 'none',
        'next_offset': next_offset if next_offset < total else None,
        # For CREATED/FAILED orders (default mode) every entry here is a payment we missed
        'mode': 'specific_orders' if order_ids else 'unfinished_orders',
        'paid_on_razorpay': missed,
        'errors': errors,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reconcile_apply(request):
    """
    Repair payments that Razorpay captured but our system did not record
    (e.g. rejected earlier because Razorpay added a convenience fee).

    POST /api/v1/payments/reconcile/apply/
    Body: {"order_ids": ["order_..", ...] (max 10), "dry_run": true|false}

    For each order (oldest payment first), re-checked live with Razorpay:
      - booking not yet covered by other successful payments → payment marked
        SUCCESS and booking paid_amount / payment_status recalculated
      - booking already paid by another payment → NOT counted as revenue; the
        payment gets a "DUPLICATE CHARGE - refund" note with the Razorpay id
    Never charges or refunds anything and sends no emails.
    """
    from django.db import transaction
    from django.db.models import Sum
    from .models import Payment
    from .gateways.razorpay import amount_covers_order

    if payment_service.gateway.get_provider_name() != 'RAZORPAY':
        return Response({'error': 'Razorpay is not the active gateway'}, status=status.HTTP_400_BAD_REQUEST)

    order_ids = request.data.get('order_ids') or []
    if not isinstance(order_ids, list) or not order_ids or len(order_ids) > 10:
        return Response({'error': 'order_ids must be a list of 1-10 order ids'}, status=status.HTTP_400_BAD_REQUEST)
    dry_run = bool(request.data.get('dry_run', True))
    client = payment_service.gateway.client

    payments = list(Payment.objects.filter(provider='RAZORPAY', order_id__in=order_ids).order_by('id'))
    results = []
    for p in payments:
        try:
            items = client.order.payments(p.order_id).get('items', [])
        except Exception as exc:
            results.append({'order_id': p.order_id, 'result': 'error', 'detail': str(exc)[:200]})
            continue
        captured = [i for i in items if i.get('status') == 'captured' and amount_covers_order(i.get('amount'), p.amount)]

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=p.pk)
            booking = payment.get_booking()
            entry = {'order_id': payment.order_id, 'payment': payment.id, 'amount': float(payment.amount),
                     'booking_id': getattr(booking, 'id', None),
                     'booking_type': 'party' if payment.party_booking_id else 'session'}
            if payment.status == 'SUCCESS':
                results.append({**entry, 'result': 'already_recorded'})
                continue
            if not captured or booking is None:
                results.append({**entry, 'result': 'not_paid_on_razorpay'})
                continue
            rp = captured[0]
            entry['razorpay_payment_id'] = rp.get('id')
            entry['captured'] = (rp.get('amount') or 0) / 100

            booking = type(booking).objects.select_for_update().get(pk=booking.pk)
            other_paid = booking.payments.filter(status='SUCCESS').exclude(pk=payment.pk) \
                .aggregate(t=Sum('amount'))['t'] or 0

            if other_paid > 0 and other_paid >= booking.amount:
                entry['result'] = 'duplicate_refund_needed'
                if not dry_run:
                    payment.payment_id = rp.get('id')
                    payment.notes = (f"DUPLICATE CHARGE - refund in Razorpay: payment {rp.get('id')} "
                                     f"captured ₹{entry['captured']} but booking was already paid by another payment.")
                    payment.save(update_fields=['payment_id', 'notes', 'updated_at'])
            else:
                entry['result'] = 'recovered'
                new_paid = other_paid + payment.amount
                entry['booking_status_after'] = 'PAID' if new_paid >= booking.amount else 'PARTIAL'
                if not dry_run:
                    payment.mark_success(payment_id=rp.get('id'), provider_response=rp)
                    payment.notes = (f"Recovered from Razorpay (captured ₹{entry['captured']} incl. convenience fee); "
                                     f"was wrongly rejected earlier.")
                    payment.save(update_fields=['notes', 'updated_at'])
                    booking.paid_amount = new_paid
                    booking.payment_status = entry['booking_status_after']
                    booking.save()
            results.append(entry)

    return Response({'dry_run': dry_run, 'results': results})
