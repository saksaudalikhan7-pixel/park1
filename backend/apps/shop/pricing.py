"""
Session pricing + voucher engine (single source of truth).

The public booking wizard, the voucher "Apply" button and the booking API all
use these functions, so the price a customer sees is exactly the price that is
stored on the booking and charged through Razorpay.

Price formula (mirrors frontend/components/BookingWizard.tsx calculateTotal):
    tickets    = adults x adult_price + kids x kid_price + spectators x spectator_price
    extra hour = (adults + kids) x EXTRA_HOUR_PRICE      (120 minute sessions only)
    grip socks = (adults + kids) x SOCKS_PRICE
    subtotal   = tickets + extra hour + grip socks
    discount   = voucher discount (taken off BEFORE GST)
    gst        = (subtotal - discount) x gst_rate%
    total      = subtotal - discount + gst, rounded to the nearest rupee (payable)

Buy X Get Y Free: for every complete group of (X + Y) eligible jumpers, Y of
them jump free. When jumpers have different prices, the cheapest ones are the
free ones. A free jumper's ticket (and extra hour on 120 min sessions) is free;
grip socks are still charged for every jumper and spectators never count.
"""

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone

# Not stored in SessionBookingConfig; the wizard uses these same fixed values.
SOCKS_PRICE = Decimal('100')
EXTRA_HOUR_PRICE = Decimal('500')

DEFAULT_PRICES = {
    'adult_price': Decimal('899'),
    'kid_price': Decimal('500'),
    'spectator_price': Decimal('150'),
    'gst_rate': Decimal('18'),
}

ADULT_LABEL = 'Ninja Warrior'
KID_LABEL = 'Little Ninjas'


class VoucherError(Exception):
    """Raised when a voucher cannot be applied. The message is customer-facing."""


def money(value) -> Decimal:
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def rupees(value) -> Decimal:
    return Decimal(value).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def _int(value, field):
    try:
        number = int(value or 0)
    except (TypeError, ValueError):
        raise VoucherError(f"Invalid number of {field}")
    if number < 0:
        raise VoucherError(f"Invalid number of {field}")
    return number


def get_session_prices():
    """Current session prices from the CMS config (same record the wizard loads)."""
    prices = dict(DEFAULT_PRICES)
    try:
        from apps.cms.models import SessionBookingConfig
        config = SessionBookingConfig.objects.filter(pk=1).first() or SessionBookingConfig.objects.first()
    except Exception:
        config = None
    if config:
        for key in prices:
            value = getattr(config, key, None)
            if value is not None:
                prices[key] = Decimal(str(value))
    return prices


def find_voucher(code):
    """Case-insensitive lookup. Returns None when no voucher has this code."""
    from .models import Voucher
    code = (code or '').strip()
    if not code:
        return None
    return Voucher.objects.filter(code__iexact=code).order_by('id').first()


def parse_booking_datetime(value):
    """Parse 'YYYY-MM-DDTHH:MM[:SS]' (park local time) into an aware datetime."""
    if not value:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except ValueError:
            raise VoucherError('Invalid booking time format')
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


def describe_offer(voucher):
    """Short human description, e.g. 'Buy 2 Get 1 Free', '20% off', 'Rs.200 off'."""
    if voucher.discount_type == 'BUY_X_GET_Y':
        who = {
            'ADULTS': f' ({ADULT_LABEL})',
            'KIDS': f' ({KID_LABEL})',
        }.get(voucher.applies_to, '')
        return f"Buy {voucher.buy_quantity} Get {voucher.free_quantity} Free{who}"
    if voucher.discount_type == 'PERCENTAGE':
        return f"{voucher.discount_value.normalize():f}% off"
    return f"₹{voucher.discount_value.normalize():f} off"


def check_voucher_usable(voucher, subtotal, booking_datetime=None, now=None):
    """Raise VoucherError if the voucher cannot be used for this order."""
    now = now or timezone.now()

    if not voucher.is_active:
        raise VoucherError('This voucher is no longer active')

    if voucher.expiry_date and voucher.expiry_date < now:
        raise VoucherError('This voucher has expired')

    if voucher.usage_limit and voucher.redemption_count() >= voucher.usage_limit:
        raise VoucherError('This voucher has reached its usage limit')

    if voucher.min_order_amount and subtotal < voucher.min_order_amount:
        raise VoucherError(f'Minimum order amount of ₹{voucher.min_order_amount.normalize():f} required')

    if voucher.min_hours_before_slot and voucher.min_hours_before_slot > 0:
        slot = parse_booking_datetime(booking_datetime)
        if slot is None:
            raise VoucherError('Please select a booking time to apply this voucher')
        hours_until = (slot - now).total_seconds() / 3600
        if hours_until < voucher.min_hours_before_slot:
            raise VoucherError(
                f'This voucher requires booking at least {voucher.min_hours_before_slot} hours '
                f'in advance. Please select a later time slot.'
            )


def _buy_x_get_y(voucher, adults, kids, adult_unit, kid_unit):
    buy = voucher.buy_quantity or 0
    free = voucher.free_quantity or 0
    if buy < 1 or free < 1:
        raise VoucherError('This voucher is not set up correctly')

    if voucher.applies_to == 'ADULTS':
        units = [('adult', adult_unit)] * adults
        noun = ADULT_LABEL
    elif voucher.applies_to == 'KIDS':
        units = [('kid', kid_unit)] * kids
        noun = KID_LABEL
    else:
        units = [('adult', adult_unit)] * adults + [('kid', kid_unit)] * kids
        noun = 'jumpers'

    group = buy + free
    eligible = len(units)
    free_count = (eligible // group) * free

    if free_count == 0:
        needed = group - eligible
        raise VoucherError(
            f'Buy {buy} Get {free} Free needs at least {group} {noun}. '
            f'Add {needed} more to use this offer.'
        )

    units.sort(key=lambda unit: unit[1])  # cheapest jumpers go free first
    free_units = units[:free_count]
    free_adults = sum(1 for kind, _ in free_units if kind == 'adult')
    free_kids = free_count - free_adults

    lines = []
    if free_adults:
        lines.append({
            'label': f'{ADULT_LABEL} free × {free_adults}',
            'quantity': free_adults,
            'unit_price': float(adult_unit),
            'amount': float(money(adult_unit * free_adults)),
        })
    if free_kids:
        lines.append({
            'label': f'{KID_LABEL} free × {free_kids}',
            'quantity': free_kids,
            'unit_price': float(kid_unit),
            'amount': float(money(kid_unit * free_kids)),
        })

    discount = money(sum(price for _, price in free_units))
    groups = eligible // group
    paying = eligible - free_count
    explanation = (
        f'{eligible} {noun} → {groups} × (Buy {buy} Get {free}) = '
        f'{paying} paid + {free_count} free'
    )
    return discount, lines, explanation


def build_session_quote(adults, kids, spectators, duration, voucher=None,
                        booking_datetime=None, prices=None, now=None):
    """
    Full price breakdown for a session booking.

    Raises VoucherError if a voucher is given but cannot be applied.
    """
    adults = _int(adults, 'Ninja Warriors')
    kids = _int(kids, 'Little Ninjas')
    spectators = _int(spectators, 'spectators')
    duration = str(duration or '60').strip()
    prices = prices or get_session_prices()

    jumpers = adults + kids
    extra = EXTRA_HOUR_PRICE if duration == '120' else Decimal('0')

    line_items = []
    if adults:
        line_items.append({'key': 'adults', 'label': ADULT_LABEL, 'quantity': adults,
                           'unit_price': float(prices['adult_price']),
                           'amount': float(money(prices['adult_price'] * adults))})
    if kids:
        line_items.append({'key': 'kids', 'label': KID_LABEL, 'quantity': kids,
                           'unit_price': float(prices['kid_price']),
                           'amount': float(money(prices['kid_price'] * kids))})
    if spectators:
        line_items.append({'key': 'spectators', 'label': 'Spectators', 'quantity': spectators,
                           'unit_price': float(prices['spectator_price']),
                           'amount': float(money(prices['spectator_price'] * spectators))})
    if jumpers:
        line_items.append({'key': 'socks', 'label': 'Grip Socks', 'quantity': jumpers,
                           'unit_price': float(SOCKS_PRICE),
                           'amount': float(money(SOCKS_PRICE * jumpers))})
    if extra and jumpers:
        line_items.append({'key': 'extra_hour', 'label': 'Extra Hour', 'quantity': jumpers,
                           'unit_price': float(extra),
                           'amount': float(money(extra * jumpers))})

    subtotal = money(
        prices['adult_price'] * adults
        + prices['kid_price'] * kids
        + prices['spectator_price'] * spectators
        + SOCKS_PRICE * jumpers
        + extra * jumpers
    )

    discount = Decimal('0.00')
    voucher_info = None
    if voucher is not None:
        check_voucher_usable(voucher, subtotal, booking_datetime, now=now)

        if voucher.discount_type == 'BUY_X_GET_Y':
            discount, discount_lines, explanation = _buy_x_get_y(
                voucher, adults, kids,
                adult_unit=prices['adult_price'] + extra,
                kid_unit=prices['kid_price'] + extra,
            )
        elif voucher.discount_type == 'PERCENTAGE':
            discount = money(subtotal * voucher.discount_value / Decimal('100'))
            discount_lines = []
            explanation = f'{voucher.discount_value.normalize():f}% off the subtotal of ₹{subtotal.normalize():f}'
        else:  # FLAT
            discount = money(voucher.discount_value)
            discount_lines = []
            explanation = f'₹{voucher.discount_value.normalize():f} off the subtotal'

        discount = min(discount, subtotal)
        if discount <= 0:
            raise VoucherError('This voucher gives no discount on this booking')

        voucher_info = {
            'id': voucher.id,
            'code': voucher.code,
            'discount_type': voucher.discount_type,
            'discount_value': float(voucher.discount_value),
            'buy_quantity': voucher.buy_quantity,
            'free_quantity': voucher.free_quantity,
            'applies_to': voucher.applies_to,
            'description': voucher.description,
            'offer': describe_offer(voucher),
            'explanation': explanation,
            'lines': discount_lines,
        }

    taxable = subtotal - discount
    gst = money(taxable * prices['gst_rate'] / Decimal('100'))
    total = money(taxable + gst)
    payable = rupees(total)

    return {
        'line_items': line_items,
        'subtotal': subtotal,
        'discount': discount,
        'taxable_amount': taxable,
        'gst_rate': prices['gst_rate'],
        'gst': gst,
        'total': total,
        'payable': payable,
        'voucher': voucher_info,
    }


def quote_to_json(quote):
    """Decimal → float for API responses."""
    out = dict(quote)
    for key in ('subtotal', 'discount', 'taxable_amount', 'gst_rate', 'gst', 'total', 'payable'):
        out[key] = float(quote[key])
    return out
