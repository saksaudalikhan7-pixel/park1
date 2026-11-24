from decimal import Decimal, InvalidOperation

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import Product, Voucher
from .serializers import ProductSerializer, VoucherSerializer
from .pricing import (
    VoucherError, build_session_quote, check_voucher_usable, describe_offer,
    find_voucher, money, quote_to_json,
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_authenticators(self):
        # Disable authentication for read actions to allow public access even with invalid/expired tokens
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


# Actions customers may call without logging in. Listing/reading vouchers is
# admin-only so voucher codes are never exposed publicly.
PUBLIC_VOUCHER_ACTIONS = ['validate', 'quote']


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by('-created_at')
    serializer_class = VoucherSerializer

    def get_authenticators(self):
        # Public actions ignore auth so expired admin cookies never break checkout
        if getattr(self, 'action', None) in PUBLIC_VOUCHER_ACTIONS:
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if getattr(self, 'action', None) in PUBLIC_VOUCHER_ACTIONS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @staticmethod
    def _has_quantities(data):
        return any(data.get(key) not in (None, '') for key in ('adults', 'kids', 'spectators'))

    @action(detail=False, methods=['post'])
    @method_decorator(ratelimit(key='ip', rate='60/m', method='POST', block=True))
    def validate(self, request):
        """
        Validate a voucher code and calculate the discount.

        Body: code, booking_datetime (optional, "YYYY-MM-DDTHH:MM:SS"), and either
          - adults, kids, spectators, duration  → full price breakdown (all voucher types)
          - order_amount                        → legacy amount-only check (% and flat only)
        """
        code = (request.data.get('code') or '').strip().upper()
        if not code:
            return Response({'valid': False, 'error': 'Voucher code is required'},
                            status=http_status.HTTP_400_BAD_REQUEST)

        voucher = find_voucher(code)
        if voucher is None:
            return Response({'valid': False, 'error': 'Invalid voucher code'})

        booking_datetime = request.data.get('booking_datetime')

        try:
            if self._has_quantities(request.data):
                quote = build_session_quote(
                    adults=request.data.get('adults'),
                    kids=request.data.get('kids'),
                    spectators=request.data.get('spectators'),
                    duration=request.data.get('duration'),
                    voucher=voucher,
                    booking_datetime=booking_datetime,
                )
                data = quote_to_json(quote)
                return Response({
                    'valid': True,
                    'voucher': data['voucher'],
                    'discount_amount': data['discount'],
                    'final_amount': float(money(quote['subtotal'] - quote['discount'])),
                    'quote': data,
                })

            # Legacy: amount only (no guest counts available)
            if voucher.discount_type == 'BUY_X_GET_Y':
                raise VoucherError('Please select your guests before applying this voucher')
            try:
                order_amount = money(Decimal(str(request.data.get('order_amount', 0))))
            except (InvalidOperation, ValueError):
                raise VoucherError('Invalid order amount')
            check_voucher_usable(voucher, order_amount, booking_datetime)
            if voucher.discount_type == 'PERCENTAGE':
                discount = money(order_amount * voucher.discount_value / Decimal('100'))
            else:
                discount = money(voucher.discount_value)
            discount = min(discount, order_amount)
        except VoucherError as exc:
            return Response({'valid': False, 'error': str(exc)})

        return Response({
            'valid': True,
            'voucher': {
                'code': voucher.code,
                'discount_type': voucher.discount_type,
                'discount_value': float(voucher.discount_value),
                'description': voucher.description,
                'offer': describe_offer(voucher),
            },
            'discount_amount': float(discount),
            'final_amount': float(order_amount - discount),
        })

    @action(detail=False, methods=['post'])
    @method_decorator(ratelimit(key='ip', rate='60/m', method='POST', block=True))
    def quote(self, request):
        """
        Server-side price for a session booking (optionally with a voucher).
        Used when creating bookings so the stored amount matches what is charged.
        """
        code = (request.data.get('code') or request.data.get('voucher_code') or '').strip()
        voucher = None
        if code:
            voucher = find_voucher(code)
            if voucher is None:
                return Response({'valid': False, 'error': 'Invalid voucher code'})
        try:
            quote = build_session_quote(
                adults=request.data.get('adults'),
                kids=request.data.get('kids'),
                spectators=request.data.get('spectators'),
                duration=request.data.get('duration'),
                voucher=voucher,
                booking_datetime=request.data.get('booking_datetime'),
            )
        except VoucherError as exc:
            return Response({'valid': False, 'error': str(exc)})
        return Response({'valid': True, 'quote': quote_to_json(quote)})
