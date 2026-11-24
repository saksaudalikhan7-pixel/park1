"""
Voucher + session pricing tests.

Run: python manage.py test apps.shop
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.bookings.models import Booking
from apps.cms.models import SessionBookingConfig
from apps.shop.models import Voucher
from apps.shop.pricing import VoucherError, build_session_quote
from apps.shop.serializers import VoucherSerializer

D = Decimal
VALIDATE_URL = '/api/v1/shop/vouchers/validate/'
QUOTE_URL = '/api/v1/shop/vouchers/quote/'
LIST_URL = '/api/v1/shop/vouchers/'
BOOKINGS_URL = '/api/v1/bookings/bookings/'


def make_voucher(**kwargs):
    defaults = dict(code='TEST', discount_type='PERCENTAGE', discount_value=D('10'), is_active=True)
    defaults.update(kwargs)
    return Voucher.objects.create(**defaults)


def bogo(code='B2G1', buy=2, free=1, applies_to='ALL_JUMPERS', **kwargs):
    return make_voucher(code=code, discount_type='BUY_X_GET_Y', discount_value=D('0'),
                        buy_quantity=buy, free_quantity=free, applies_to=applies_to, **kwargs)


class PricingBase(TestCase):
    def setUp(self):
        # Same prices as the live CMS config
        SessionBookingConfig.objects.create(pk=1, adult_price=D('899'), kid_price=D('500'),
                                            spectator_price=D('100'), gst_rate=D('18'))


class SessionQuoteTests(PricingBase):
    def test_no_voucher_matches_wizard_formula(self):
        # 2 adults + 1 kid + 3 spectators, 60 min
        q = build_session_quote(2, 1, 3, '60')
        subtotal = 2 * 899 + 500 + 3 * 100 + 3 * 100  # tickets + socks for 3 jumpers
        self.assertEqual(q['subtotal'], D(subtotal))
        self.assertEqual(q['discount'], D('0'))
        self.assertEqual(q['payable'], D(round(subtotal * 1.18)))

    def test_120_minutes_adds_extra_hour_per_jumper(self):
        q = build_session_quote(1, 1, 1, '120')
        self.assertEqual(q['subtotal'], D(899 + 500 + 100 + 2 * 100 + 2 * 500))

    def test_buy2get1_three_adults_one_free(self):
        q = build_session_quote(3, 0, 0, '60', voucher=bogo())
        self.assertEqual(q['subtotal'], D('2997.00'))   # 3x899 + 3x100 socks
        self.assertEqual(q['discount'], D('899.00'))    # 1 ticket free
        self.assertEqual(q['taxable_amount'], D('2098.00'))
        self.assertEqual(q['gst'], D('377.64'))         # GST only on what is paid
        self.assertEqual(q['payable'], D('2476'))
        self.assertEqual(q['voucher']['lines'][0]['quantity'], 1)

    def test_buy2get1_six_people_four_pay_two_free(self):
        q = build_session_quote(6, 0, 0, '60', voucher=bogo())
        self.assertEqual(q['discount'], D('1798.00'))   # 2 x 899
        self.assertEqual(q['payable'], D(round((6 * 999 - 1798) * 1.18)))
        self.assertIn('4 paid + 2 free', q['voucher']['explanation'])

    def test_buy2get1_partial_groups(self):
        v = bogo()
        self.assertEqual(build_session_quote(4, 0, 0, '60', voucher=v)['discount'], D('899.00'))
        self.assertEqual(build_session_quote(5, 0, 0, '60', voucher=v)['discount'], D('899.00'))
        self.assertEqual(build_session_quote(8, 0, 0, '60', voucher=v)['discount'], D('1798.00'))
        self.assertEqual(build_session_quote(9, 0, 0, '60', voucher=v)['discount'], D('2697.00'))

    def test_buy1get1(self):
        q = build_session_quote(4, 0, 0, '60', voucher=bogo(code='B1G1', buy=1, free=1))
        self.assertEqual(q['discount'], D('1798.00'))  # 2 of 4 free

    def test_not_enough_jumpers_is_rejected_with_hint(self):
        with self.assertRaisesMessage(VoucherError, 'Add 1 more'):
            build_session_quote(2, 0, 3, '60', voucher=bogo())  # spectators never count

    def test_mixed_group_cheapest_jumper_is_free(self):
        q = build_session_quote(2, 1, 0, '60', voucher=bogo())
        self.assertEqual(q['discount'], D('500.00'))
        self.assertEqual(q['voucher']['lines'][0]['label'], 'Little Ninjas free × 1')

    def test_free_jumper_includes_extra_hour_on_120_minutes(self):
        q = build_session_quote(3, 0, 0, '120', voucher=bogo())
        self.assertEqual(q['discount'], D('1399.00'))  # 899 ticket + 500 extra hour

    def test_applies_to_adults_only(self):
        v = bogo(code='ADULTB2G1', applies_to='ADULTS')
        q = build_session_quote(3, 3, 0, '60', voucher=v)
        self.assertEqual(q['discount'], D('899.00'))  # kids ignored, 1 adult free
        with self.assertRaises(VoucherError):
            build_session_quote(2, 5, 0, '60', voucher=v)

    def test_applies_to_kids_only(self):
        v = bogo(code='KIDB2G1', applies_to='KIDS')
        q = build_session_quote(4, 3, 0, '60', voucher=v)
        self.assertEqual(q['discount'], D('500.00'))

    def test_percentage_is_taken_before_gst(self):
        q = build_session_quote(1, 0, 0, '60', voucher=make_voucher(discount_value=D('20')))
        self.assertEqual(q['subtotal'], D('999.00'))
        self.assertEqual(q['discount'], D('199.80'))
        self.assertEqual(q['payable'], D(round((999 - 199.80) * 1.18)))

    def test_flat_is_capped_at_subtotal(self):
        q = build_session_quote(0, 0, 1, '60', voucher=make_voucher(code='BIG', discount_type='FLAT',
                                                                     discount_value=D('5000')))
        self.assertEqual(q['discount'], q['subtotal'])
        self.assertEqual(q['payable'], D('0'))

    def test_inactive_expired_min_order(self):
        with self.assertRaisesMessage(VoucherError, 'no longer active'):
            build_session_quote(1, 0, 0, '60', voucher=make_voucher(code='OFF', is_active=False))
        with self.assertRaisesMessage(VoucherError, 'expired'):
            build_session_quote(1, 0, 0, '60', voucher=make_voucher(
                code='OLD', expiry_date=timezone.now() - timedelta(minutes=1)))
        with self.assertRaisesMessage(VoucherError, 'Minimum order'):
            build_session_quote(1, 0, 0, '60', voucher=make_voucher(code='MIN', min_order_amount=D('5000')))

    def test_min_hours_before_slot(self):
        v = make_voucher(code='EARLY', min_hours_before_slot=24)
        soon = (timezone.localtime() + timedelta(hours=3)).replace(tzinfo=None).isoformat()
        later = (timezone.localtime() + timedelta(hours=30)).replace(tzinfo=None).isoformat()
        with self.assertRaisesMessage(VoucherError, '24 hours'):
            build_session_quote(1, 0, 0, '60', voucher=v, booking_datetime=soon)
        build_session_quote(1, 0, 0, '60', voucher=v, booking_datetime=later)
        with self.assertRaisesMessage(VoucherError, 'select a booking time'):
            build_session_quote(1, 0, 0, '60', voucher=v)

    def test_usage_limit_counts_only_paid_bookings(self):
        v = make_voucher(code='ONCE', usage_limit=1)
        base = dict(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                    time='12:00', duration=60, adults=1, amount=D('1000'), voucher=v)
        Booking.objects.create(payment_status='PENDING', **base)  # abandoned → does not use it up
        build_session_quote(1, 0, 0, '60', voucher=v)
        Booking.objects.create(payment_status='PAID', **base)
        with self.assertRaisesMessage(VoucherError, 'usage limit'):
            build_session_quote(1, 0, 0, '60', voucher=v)


class VoucherSerializerTests(TestCase):
    def test_code_is_case_insensitive_unique_and_uppercased(self):
        make_voucher(code='SUMMER')
        s = VoucherSerializer(data={'code': 'summer', 'discount_type': 'FLAT', 'discount_value': '100'})
        self.assertFalse(s.is_valid())
        self.assertIn('code', s.errors)
        s = VoucherSerializer(data={'code': ' winter ', 'discount_type': 'FLAT', 'discount_value': '100'})
        self.assertTrue(s.is_valid(), s.errors)
        self.assertEqual(s.save().code, 'WINTER')

    def test_bogo_requires_quantities(self):
        s = VoucherSerializer(data={'code': 'X', 'discount_type': 'BUY_X_GET_Y'})
        self.assertFalse(s.is_valid())
        self.assertIn('buy_quantity', s.errors)
        s = VoucherSerializer(data={'code': 'X', 'discount_type': 'BUY_X_GET_Y',
                                    'buy_quantity': 2, 'free_quantity': 1})
        self.assertTrue(s.is_valid(), s.errors)
        v = s.save()
        self.assertEqual(v.discount_value, D('0'))
        self.assertEqual(VoucherSerializer(v).data['offer_summary'], 'Buy 2 Get 1 Free')

    def test_percentage_over_100_rejected(self):
        s = VoucherSerializer(data={'code': 'P', 'discount_type': 'PERCENTAGE', 'discount_value': '150'})
        self.assertFalse(s.is_valid())

    def test_status_field(self):
        self.assertEqual(VoucherSerializer(make_voucher(code='A1')).data['status'], 'ACTIVE')
        self.assertEqual(VoucherSerializer(make_voucher(code='A2', is_active=False)).data['status'], 'INACTIVE')
        expired = make_voucher(code='A3', expiry_date=timezone.now() - timedelta(days=1))
        self.assertEqual(VoucherSerializer(expired).data['status'], 'EXPIRED')


@override_settings(RATELIMIT_ENABLE=False)
class VoucherApiTests(PricingBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_voucher_list_is_not_public(self):
        make_voucher(code='SECRET')
        res = self.client.get(LIST_URL)
        self.assertIn(res.status_code, (401, 403))
        self.assertNotIn(b'SECRET', res.content)

    def test_admin_can_list_with_status(self):
        make_voucher(code='SEEME')
        admin = get_user_model().objects.create_superuser('admin', 'admin@example.com', 'pw-123456')
        self.client.force_authenticate(admin)
        res = self.client.get(LIST_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()[0]['status'], 'ACTIVE')

    def test_validate_with_guests_returns_breakdown(self):
        bogo()
        res = self.client.post(VALIDATE_URL, {'code': 'b2g1', 'adults': 6, 'kids': 0,
                                              'spectators': 0, 'duration': '60'}, format='json')
        body = res.json()
        self.assertTrue(body['valid'], body)
        self.assertEqual(body['discount_amount'], 1798.0)
        self.assertEqual(body['quote']['payable'], float(round((6 * 999 - 1798) * 1.18)))
        self.assertEqual(body['quote']['voucher']['offer'], 'Buy 2 Get 1 Free')

    def test_validate_legacy_amount_only(self):
        make_voucher(code='TEN')
        body = self.client.post(VALIDATE_URL, {'code': 'TEN', 'order_amount': 1000}, format='json').json()
        self.assertTrue(body['valid'])
        self.assertEqual(body['discount_amount'], 100.0)

    def test_validate_bogo_without_guests_is_rejected(self):
        bogo()
        body = self.client.post(VALIDATE_URL, {'code': 'B2G1', 'order_amount': 3000}, format='json').json()
        self.assertFalse(body['valid'])

    def test_validate_unknown_code(self):
        body = self.client.post(VALIDATE_URL, {'code': 'NOPE', 'adults': 1}, format='json').json()
        self.assertFalse(body['valid'])

    def test_quote_without_voucher(self):
        body = self.client.post(QUOTE_URL, {'adults': 1, 'kids': 0, 'spectators': 3,
                                           'duration': '60'}, format='json').json()
        self.assertTrue(body['valid'])
        self.assertEqual(body['quote']['payable'], float(round((899 + 100 + 300) * 1.18)))


@override_settings(RATELIMIT_ENABLE=False)
class BookingVoucherTests(PricingBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.day = (timezone.localdate() + timedelta(days=5)).isoformat()

    def payload(self, **extra):
        data = dict(name='Test User', email='test@example.com', phone='9876543210', date=self.day,
                    time='15:00', duration=60, adults=3, kids=0, spectators=0,
                    subtotal=1, amount=1, discount_amount=0, status='CONFIRMED',
                    booking_status='CONFIRMED', payment_status='PENDING', waiver_status='PENDING',
                    type='SESSION')
        data.update(extra)
        return data

    def test_server_recalculates_voucher_booking(self):
        v = bogo()
        other = make_voucher(code='OTHER', discount_type='FLAT', discount_value=D('2000'))
        res = self.client.post(BOOKINGS_URL, self.payload(voucher_code='b2g1', voucher=other.id,
                                                          discount_amount=99999), format='json')
        self.assertEqual(res.status_code, 201, res.content)
        b = Booking.objects.get(pk=res.json()['id'])
        self.assertEqual(b.voucher_id, v.id)              # client voucher id ignored
        self.assertEqual(b.voucher_code, 'B2G1')
        self.assertEqual(b.discount_amount, D('899.00'))  # client discount ignored
        self.assertEqual(b.subtotal, D('2997.00'))
        self.assertEqual(b.amount, D('2476.00'))

    def test_invalid_voucher_returns_400_with_message(self):
        res = self.client.post(BOOKINGS_URL, self.payload(voucher_code='NOPE'), format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid voucher code', res.content.decode())
        self.assertEqual(Booking.objects.count(), 0)

    def test_bogo_not_enough_guests_rejected(self):
        bogo()
        res = self.client.post(BOOKINGS_URL, self.payload(voucher_code='B2G1', adults=2), format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Add 1 more', res.content.decode())

    def test_new_booking_cannot_be_created_as_paid(self):
        res = self.client.post(BOOKINGS_URL, self.payload(payment_status='PAID'), format='json')
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(Booking.objects.get(pk=res.json()['id']).payment_status, 'PENDING')

    def test_booking_without_voucher_keeps_client_amount(self):
        res = self.client.post(BOOKINGS_URL, self.payload(amount=3537, subtotal=2997), format='json')
        self.assertEqual(res.status_code, 201, res.content)
        b = Booking.objects.get(pk=res.json()['id'])
        self.assertEqual(b.amount, D('3537'))
        self.assertIsNone(b.voucher_id)


class PaymentGuardTests(TestCase):
    def test_no_new_payment_for_fully_paid_booking(self):
        from apps.payments.services import PaymentService
        b = Booking.objects.create(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                                   time='12:00', duration=60, adults=1, amount=D('1000'),
                                   paid_amount=D('1000'), payment_status='PAID')
        with self.assertRaisesMessage(ValueError, 'already fully paid'):
            PaymentService().create_payment_order(b.id, 'session')

    def test_partial_booking_can_still_pay_balance(self):
        from apps.payments.services import PaymentService
        b = Booking.objects.create(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                                   time='12:00', duration=60, adults=1, amount=D('1000'),
                                   paid_amount=D('500'), payment_status='PARTIAL')
        order = PaymentService().create_payment_order(b.id, 'session')  # mock gateway in tests
        self.assertEqual(Decimal(str(order['amount'])), D('500'))


@override_settings(RAZORPAY_WEBHOOK_SECRET='whsec_test')
class WebhookTests(TestCase):
    def _send(self, event, order_id, amount_paise, payment_id='pay_1'):
        import hashlib, hmac, json
        body = json.dumps({'event': event, 'payload': {'payment': {'entity': {
            'order_id': order_id, 'id': payment_id, 'amount': amount_paise,
            'error_description': 'card declined'}}}}).encode()
        sig = hmac.new(b'whsec_test', body, hashlib.sha256).hexdigest()
        return self.client.post('/api/v1/payments/webhook/razorpay/', body, content_type='application/json',
                                HTTP_X_RAZORPAY_SIGNATURE=sig)

    def setUp(self):
        from apps.payments.models import Payment
        self.booking = Booking.objects.create(name='A', email='a@example.com', phone='9876543210',
                                              date=date.today(), time='12:00', duration=60, adults=1,
                                              amount=D('1179'))
        self.payment = Payment.objects.create(provider='RAZORPAY', order_id='order_1', amount=D('1179'),
                                              booking=self.booking)

    def test_captured_twice_credits_once(self):
        self.assertEqual(self._send('payment.captured', 'order_1', 117900).status_code, 200)
        self.assertEqual(self._send('payment.captured', 'order_1', 117900).status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.paid_amount, D('1179'))
        self.assertEqual(self.booking.payment_status, 'PAID')

    def test_failed_event_does_not_undo_success(self):
        self._send('payment.captured', 'order_1', 117900)
        self._send('payment.failed', 'order_1', 117900, payment_id='pay_0')
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'SUCCESS')

    def test_bad_signature_rejected(self):
        res = self.client.post('/api/v1/payments/webhook/razorpay/', b'{}', content_type='application/json',
                               HTTP_X_RAZORPAY_SIGNATURE='nope')
        self.assertEqual(res.status_code, 400)


class DashboardStatsTests(TestCase):
    def test_dashboard_counts_only_paid_bookings_and_real_money(self):
        from apps.payments.models import Payment
        from apps.bookings.models import Customer, Waiver
        today = timezone.localdate()
        c1 = Customer.objects.create(name='A', email='a@example.com')
        c2 = Customer.objects.create(name='B', email='b@example.com')
        base = dict(name='A', email='a@example.com', phone='9876543210', time='12:00', duration=60, adults=1)
        paid1 = Booking.objects.create(date=today, amount=D('1000'), paid_amount=D('1000'),
                                       payment_status='PAID', customer=c1, waiver_status='SIGNED', **base)
        paid2 = Booking.objects.create(date=today + timedelta(days=2), amount=D('500'), paid_amount=D('500'),
                                       payment_status='PAID', customer=c1, **base)
        Booking.objects.create(date=today, amount=D('900'), payment_status='PENDING', customer=c2, **base)  # abandoned
        Booking.objects.create(date=today, amount=D('900'), paid_amount=D('900'), payment_status='PAID',
                               booking_status='CANCELLED', customer=c2, **base)  # cancelled
        Payment.objects.create(provider='RAZORPAY', order_id='o1', amount=D('1000'), status='SUCCESS', booking=paid1)
        Payment.objects.create(provider='RAZORPAY', order_id='o2', amount=D('500'), status='SUCCESS', booking=paid2)
        Payment.objects.create(provider='MOCK', order_id='o3', amount=D('777'), status='SUCCESS', booking=paid2)  # test money
        Payment.objects.create(provider='RAZORPAY', order_id='o4', amount=D('900'), status='CREATED')  # never paid

        admin = get_user_model().objects.create_superuser('admin', 'admin@example.com', 'pw-123456')
        client = APIClient()
        client.force_authenticate(admin)
        res = client.get('/api/v1/core/dashboard/stats/')
        self.assertEqual(res.status_code, 200, res.content)
        s = res.json()
        self.assertEqual(s['totalBookings'], 2)
        self.assertEqual(s['totalRevenue'], 1500.0)       # mock + unpaid excluded
        self.assertEqual(s['todayRevenue'], 1500.0)
        self.assertEqual(s['paymentsToday'], 2)
        self.assertEqual(s['avgBookingValue'], 750)
        self.assertEqual(s['bookingsToday'], 1)            # paid visit today
        self.assertEqual(s['totalCustomers'], 1)           # only c1 paid
        self.assertEqual(s['repeatCustomers'], 1)
        self.assertEqual(s['waiverCompletionRate'], 50)    # 1 of 2 paid bookings signed
        self.assertEqual(s['pendingWaivers'], 1)           # paid2 upcoming without waiver
        self.assertEqual(s['thisWeekBookings'], 2)
        self.assertEqual(s['monthlyRevenue'][-1]['total'], 1500.0)


class ReconcileTests(TestCase):
    def test_reconcile_is_read_only_and_reports_paid_orders(self):
        from unittest import mock
        from apps.payments.models import Payment
        from apps.payments import views as pay_views
        b = Booking.objects.create(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                                   time='12:00', duration=60, adults=1, amount=D('1000'))
        Payment.objects.create(provider='RAZORPAY', order_id='order_paid', amount=D('1000'), status='CREATED', booking=b)
        Payment.objects.create(provider='RAZORPAY', order_id='order_open', amount=D('1000'), status='CREATED', booking=b)

        fake_client = mock.Mock()
        fake_client.order.payments.side_effect = lambda oid: {'items': (
            [{'id': 'pay_x', 'status': 'captured', 'amount': 100000}] if oid == 'order_paid'
            else [{'id': 'pay_y', 'status': 'failed', 'amount': 100000}])}
        fake_gateway = mock.Mock(client=fake_client)
        fake_gateway.get_provider_name.return_value = 'RAZORPAY'

        admin = get_user_model().objects.create_superuser('admin', 'admin@example.com', 'pw-123456')
        client = APIClient()
        self.assertIn(client.get('/api/v1/payments/reconcile/').status_code, (401, 403))  # admin only
        client.force_authenticate(admin)
        with mock.patch.object(pay_views.payment_service, 'gateway', fake_gateway):
            body = client.get('/api/v1/payments/reconcile/').json()
        self.assertEqual(body['total_to_check'], 2)
        self.assertEqual([m['order_id'] for m in body['paid_on_razorpay']], ['order_paid'])
        # nothing changed
        self.assertEqual(Payment.objects.filter(status='CREATED').count(), 2)
        b.refresh_from_db()
        self.assertEqual(b.payment_status, 'PENDING')


class ConvenienceFeeTests(TestCase):
    """Razorpay may capture order amount + convenience fee; that is a valid payment."""

    def test_amount_covers_order(self):
        from apps.payments.gateways.razorpay import amount_covers_order
        self.assertTrue(amount_covers_order(471500, D('4715.00')))   # exact
        self.assertTrue(amount_covers_order(481238, D('4715.00')))   # + 2.06% fee
        self.assertFalse(amount_covers_order(471499, D('4715.00')))  # less than order
        self.assertFalse(amount_covers_order(None, D('4715.00')))

    def _gateway(self, captured_paise, order_id='order_fee'):
        from unittest import mock
        from apps.payments.gateways.razorpay import RazorpayGateway
        gw = RazorpayGateway.__new__(RazorpayGateway)
        gw.provider_name = 'RAZORPAY'
        gw.client = mock.Mock()
        gw.client.utility.verify_payment_signature.return_value = True
        gw.client.payment.fetch.return_value = {'id': 'pay_fee', 'order_id': order_id,
                                                'amount': captured_paise, 'status': 'captured'}
        return gw

    def _booking_and_payment(self):
        from apps.payments.models import Payment
        b = Booking.objects.create(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                                   time='12:00', duration=60, adults=4, amount=D('4715.00'))
        p = Payment.objects.create(provider='RAZORPAY', order_id='order_fee', amount=D('4715.00'), booking=b)
        return b, p

    def test_verify_accepts_payment_with_fee(self):
        b, p = self._booking_and_payment()
        ok, pid, _ = self._gateway(481238).verify_payment(
            {'razorpay_order_id': 'order_fee', 'razorpay_payment_id': 'pay_fee', 'razorpay_signature': 'sig'})
        self.assertTrue(ok)
        b.refresh_from_db(); p.refresh_from_db()
        self.assertEqual(p.status, 'SUCCESS')
        self.assertEqual(b.payment_status, 'PAID')
        self.assertEqual(b.paid_amount, D('4715.00'))  # revenue = order amount, fee belongs to Razorpay

    def test_verify_rejects_lower_amount(self):
        b, p = self._booking_and_payment()
        ok, _, _ = self._gateway(400000).verify_payment(
            {'razorpay_order_id': 'order_fee', 'razorpay_payment_id': 'pay_fee', 'razorpay_signature': 'sig'})
        self.assertFalse(ok)
        b.refresh_from_db()
        self.assertEqual(b.payment_status, 'PENDING')


class ReconcileApplyTests(TestCase):
    def test_recover_then_flag_duplicate(self):
        from unittest import mock
        from apps.payments.models import Payment
        from apps.payments import views as pay_views
        b = Booking.objects.create(name='A', email='a@example.com', phone='9876543210', date=date.today(),
                                   time='12:00', duration=60, adults=4, amount=D('4244.00'))
        p1 = Payment.objects.create(provider='RAZORPAY', order_id='order_1', amount=D('4244.00'),
                                    status='FAILED', booking=b)
        p2 = Payment.objects.create(provider='RAZORPAY', order_id='order_2', amount=D('4244.00'),
                                    status='FAILED', booking=b)
        p3 = Payment.objects.create(provider='RAZORPAY', order_id='order_3', amount=D('4244.00'),
                                    status='CREATED', booking=b)  # customer closed checkout
        fake_client = mock.Mock()
        fake_client.order.payments.side_effect = lambda oid: {'items': {
            'order_1': [{'id': 'pay_a', 'status': 'captured', 'amount': 433163}],
            'order_2': [{'id': 'pay_b', 'status': 'captured', 'amount': 433163}],
            'order_3': [],
        }[oid]}
        gw = mock.Mock(client=fake_client); gw.get_provider_name.return_value = 'RAZORPAY'
        admin = get_user_model().objects.create_superuser('admin', 'admin@example.com', 'pw-123456')
        client = APIClient(); client.force_authenticate(admin)
        url = '/api/v1/payments/reconcile/apply/'
        with mock.patch.object(pay_views.payment_service, 'gateway', gw):
            dry = client.post(url, {'order_ids': ['order_1', 'order_2', 'order_3']}, format='json').json()
            # dry run changes nothing
            self.assertTrue(dry['dry_run'])
            p1.refresh_from_db(); self.assertEqual(p1.status, 'FAILED')
            res = client.post(url, {'order_ids': ['order_2', 'order_1', 'order_3'], 'dry_run': False},
                              format='json').json()
            again = client.post(url, {'order_ids': ['order_1'], 'dry_run': False}, format='json').json()
        outcome = {r['order_id']: r['result'] for r in res['results']}
        self.assertEqual(outcome, {'order_1': 'recovered', 'order_2': 'duplicate_refund_needed',
                                   'order_3': 'not_paid_on_razorpay'})
        self.assertEqual(again['results'][0]['result'], 'already_recorded')
        b.refresh_from_db(); p1.refresh_from_db(); p2.refresh_from_db(); p3.refresh_from_db()
        self.assertEqual((p1.status, p1.payment_id), ('SUCCESS', 'pay_a'))
        self.assertEqual(p2.status, 'FAILED')
        self.assertIn('DUPLICATE CHARGE', p2.notes)
        self.assertIn('pay_b', p2.notes)
        self.assertEqual(p3.status, 'CREATED')
        self.assertEqual(b.payment_status, 'PAID')
        self.assertEqual(b.paid_amount, D('4244.00'))  # duplicate not counted
