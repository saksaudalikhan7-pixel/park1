from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import Product, Voucher
from .pricing import describe_offer


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class VoucherSerializer(serializers.ModelSerializer):
    # used_count is derived from paid bookings (see Voucher.redemption_count),
    # so it can never drift and cannot be edited by hand.
    used_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    total_discount_given = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    offer_summary = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'buy_quantity', 'free_quantity', 'applies_to',
            'min_order_amount', 'expiry_date', 'usage_limit', 'used_count',
            'is_active', 'description', 'min_hours_before_slot',
            'pending_count', 'total_discount_given', 'status', 'offer_summary',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    # ----- computed fields -------------------------------------------------
    def get_used_count(self, obj):
        return obj.redemption_count()

    def get_pending_count(self, obj):
        """Unpaid bookings that applied this voucher (customer has not paid yet)."""
        return obj.bookings.filter(payment_status='PENDING').exclude(booking_status='CANCELLED').count()

    def get_total_discount_given(self, obj):
        from django.db.models import Sum
        total = obj.bookings.filter(payment_status__in=['PAID', 'PARTIAL']).aggregate(
            total=Sum('discount_amount'))['total']
        return float(total or 0)

    def get_status(self, obj):
        if not obj.is_active:
            return 'INACTIVE'
        if obj.expiry_date and obj.expiry_date < timezone.now():
            return 'EXPIRED'
        if obj.usage_limit and obj.redemption_count() >= obj.usage_limit:
            return 'USED_UP'
        return 'ACTIVE'

    def get_offer_summary(self, obj):
        try:
            return describe_offer(obj)
        except Exception:
            return ''

    # ----- validation ------------------------------------------------------
    def validate_code(self, value):
        code = (value or '').strip().upper()
        if not code:
            raise serializers.ValidationError('Voucher code is required.')
        if not all(ch.isalnum() or ch in '-_' for ch in code):
            raise serializers.ValidationError('Use only letters, numbers, - and _ in the code.')
        duplicates = Voucher.objects.filter(code__iexact=code)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(f'A voucher with code {code} already exists.')
        return code

    def validate(self, attrs):
        def current(field):
            if field in attrs:
                return attrs[field]
            return getattr(self.instance, field, None) if self.instance is not None else None

        discount_type = current('discount_type')
        if discount_type not in dict(Voucher.DISCOUNT_TYPES):
            raise serializers.ValidationError({'discount_type': 'Choose a valid discount type.'})

        if discount_type == 'BUY_X_GET_Y':
            buy, free = current('buy_quantity'), current('free_quantity')
            errors = {}
            if not buy or buy < 1:
                errors['buy_quantity'] = 'Enter how many jumpers must be paid for (at least 1).'
            if not free or free < 1:
                errors['free_quantity'] = 'Enter how many jumpers go free (at least 1).'
            if not errors and buy + free > 50:
                errors['free_quantity'] = 'Buy + Free must be 50 or less.'
            if errors:
                raise serializers.ValidationError(errors)
            attrs['discount_value'] = Decimal('0')
            if current('applies_to') not in dict(Voucher.APPLIES_TO_CHOICES):
                attrs['applies_to'] = 'ALL_JUMPERS'
        else:
            value = current('discount_value')
            if value is None or value <= 0:
                raise serializers.ValidationError({'discount_value': 'Discount value must be greater than 0.'})
            if discount_type == 'PERCENTAGE' and value > 100:
                raise serializers.ValidationError({'discount_value': 'A percentage discount cannot be more than 100.'})
            # Buy/free quantities only make sense for BUY_X_GET_Y
            attrs['buy_quantity'] = None
            attrs['free_quantity'] = None

        for field in ('usage_limit', 'min_hours_before_slot'):
            value = current(field)
            if value is not None and value < 0:
                raise serializers.ValidationError({field: 'Cannot be negative.'})
        min_order = current('min_order_amount')
        if min_order is not None and min_order < 0:
            raise serializers.ValidationError({'min_order_amount': 'Cannot be negative.'})

        return attrs
