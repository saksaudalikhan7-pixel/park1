from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from datetime import timedelta

from .models import User, GlobalSettings, Logo, Notification
from .serializers import UserSerializer, GlobalSettingsSerializer, LogoSerializer, NotificationSerializer

from apps.bookings.models import Booking, Waiver, Customer, PartyBooking
from apps.bookings.serializers import BookingSerializer, PartyBookingSerializer
from apps.shop.models import Voucher
from apps.cms.models import Activity, Faq, Banner


import logging

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow Superusers and Staff (Managers/Employees) to view all users
        if self.request.user.is_superuser or self.request.user.is_staff:
            return User.objects.all()
        # Regular users can only see themselves
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = User.objects.count()
        active = User.objects.filter(is_active=True).count()
        inactive = total - active
        
        # Mock recent logins for now if not tracked, or use last_login
        # Assuming last_login is standard Django field
        today = timezone.now().date()
        recent_logins = User.objects.filter(last_login__date=today).count()

        # Role distribution
        roles = User.objects.values('role').annotate(count=Count('id'))
        role_distribution = [
            {'role': r['role'] or 'No Role', 'count': r['count']} 
            for r in roles
        ]

        return Response({
            'totalUsers': total,
            'activeUsers': active,
            'inactiveUsers': inactive,
            'recentLogins': recent_logins,
            'roleDistribution': role_distribution
        })

    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        limit = int(request.query_params.get('limit', 5))
        users = User.objects.order_by('-last_login')[:limit]
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reset_password(self, request, pk=None):
        """Reset user password - Super Admin only"""
        # Check if requester is ADMIN (super admin)
        if request.user.role != 'ADMIN':
            return Response(
                {"detail": "Only super admins can reset passwords"},
                status=403
            )
        
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {"detail": "new_password is required"},
                status=400
            )
        
        # Validate password length
        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters long"},
                status=400
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            "detail": "Password reset successfully",
            "new_password": new_password  # Return for display (one-time only)
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_role(self, request, pk=None):
        """Remove role from user - Super Admin only"""
        if request.user.role != 'ADMIN':
            return Response(
                {"detail": "Only super admins can remove roles"},
                status=403
            )
        
        user = self.get_object()
        
        # Prevent removing role from yourself
        if user.id == request.user.id:
            return Response(
                {"detail": "You cannot remove your own role"},
                status=400
            )
        
        # Set to default EMPLOYEE role instead of None
        user.role = 'EMPLOYEE'
        user.save()
        
        return Response({
            "detail": "Role removed successfully. User set to EMPLOYEE role.",
            "new_role": "EMPLOYEE"
        })

class GlobalSettingsViewSet(viewsets.ModelViewSet):
    queryset = GlobalSettings.objects.all()
    serializer_class = GlobalSettingsSerializer
    
    def get_authenticators(self):
        # Disable authentication for read actions to allow public access even with invalid/expired tokens
        if getattr(self, 'request', None) and self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return []
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if getattr(self, 'request', None) and self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [permissions.AllowAny()]
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post', 'get'])
    def fix_db_schema(self, request):
        """Force run bookings migration manually"""
        from django.core.management import call_command
        try:
            # Force migration for bookings app
            call_command('migrate', 'bookings')
            return Response({'status': 'success', 'message': 'Bookings migration applied successfully'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)

class LogoViewSet(viewsets.ModelViewSet):
    queryset = Logo.objects.all()
    serializer_class = LogoSerializer
    # Trigger deployment for missing endpoints
    
    def get_authenticators(self):
        # Disable authentication for read actions to allow public access even with invalid/expired tokens
        if getattr(self, 'request', None) and self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return []
        if getattr(self, 'action', None) in ['list', 'retrieve', 'active']:
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if getattr(self, 'request', None) and self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [permissions.AllowAny()]
        if getattr(self, 'action', None) in ['list', 'retrieve', 'active']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active logo"""
        try:
            active_logo = Logo.objects.get(is_active=True)
            serializer = self.get_serializer(active_logo, context={'request': request})
            return Response(serializer.data)
        except Logo.DoesNotExist:
            return Response({'error': 'No active logo found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set a logo as active"""
        logo = self.get_object()
        logo.is_active = True
        logo.save()
        serializer = self.get_serializer(logo, context={'request': request})
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can modify global settings
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread = Notification.objects.filter(is_read=False)
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'success', 'message': 'All notifications marked as read'})



from apps.bookings.permissions import IsStaffUser

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsStaffUser]  # Allow employees to access dashboard

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Dashboard analytics. Every figure uses the same definitions:
          - a "booking" counts only when it is paid (PAID or PARTIAL) and not cancelled
            (unpaid = customer never completed payment, those are not real bookings)
          - "revenue" is real money received through Razorpay (successful payments,
            minus refunds); test payments from the mock gateway are excluded
          - all dates are in park local time (Asia/Kolkata)
        """
        from apps.payments.models import Payment

        PAID = ['PAID', 'PARTIAL']
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        first_day_of_month = today.replace(day=1)

        paid_sessions = Booking.objects.filter(payment_status__in=PAID).exclude(booking_status='CANCELLED')
        paid_parties = PartyBooking.objects.filter(payment_status__in=PAID).exclude(status='CANCELLED')

        # ----- bookings -----
        total_session_bookings = paid_sessions.count()
        total_party_bookings = paid_parties.count()
        total_bookings = total_session_bookings + total_party_bookings

        # Paid bookings whose visit is today (used for staff planning)
        bookings_today = paid_sessions.filter(date=today).count() + paid_parties.filter(date=today).count()

        # ----- revenue (money actually received) -----
        # A fully refunded payment is marked REFUNDED and its refund is a separate
        # negative SUCCESS row, so: received (positive SUCCESS/REFUNDED) + refunds (negative)
        received = Payment.objects.filter(status__in=['SUCCESS', 'REFUNDED'], amount__gt=0).exclude(provider='MOCK')
        refunds = Payment.objects.filter(status='SUCCESS', amount__lt=0).exclude(provider='MOCK')

        def net_amount(received_qs, refunds_qs):
            gross = received_qs.aggregate(t=Sum('amount'))['t'] or 0
            refunded = refunds_qs.aggregate(t=Sum('amount'))['t'] or 0  # negative
            return float(gross + refunded)

        def money_on(day):
            """Net money received on one local date."""
            return net_amount(received.filter(created_at__date=day), refunds.filter(created_at__date=day))

        total_revenue = net_amount(received, refunds)
        today_revenue = money_on(today)
        yesterday_revenue = money_on(yesterday)
        payments_today = received.filter(created_at__date=today).count()

        # Revenue chart (money received per day, last 7 days)
        monthly_revenue = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            monthly_revenue.append({
                "name": d.strftime('%a'),
                "date": d.isoformat(),
                "total": money_on(d),
            })

        avg_booking_value = round(total_revenue / total_bookings) if total_bookings else 0

        # ----- booking trend: paid bookings made in the last 7 days vs the 7 before -----
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)

        def paid_created_between(start, end):
            return (paid_sessions.filter(created_at__date__gt=start, created_at__date__lte=end).count()
                    + paid_parties.filter(created_at__date__gt=start, created_at__date__lte=end).count())

        this_week_bookings = paid_created_between(week_ago, today)
        last_week_bookings = paid_created_between(two_weeks_ago, week_ago)
        booking_growth = 0
        if last_week_bookings > 0:
            booking_growth = round(((this_week_bookings - last_week_bookings) / last_week_bookings) * 100, 1)
        elif this_week_bookings > 0:
            booking_growth = 100

        # ----- waivers (paid, non-cancelled bookings) -----
        signed_q = Q(waiver_status='SIGNED') | Q(waivers__isnull=False)
        signed_sessions = paid_sessions.filter(signed_q).distinct().count()
        signed_parties = paid_parties.filter(waiver_signed=True).count()
        signed_waivers = signed_sessions + signed_parties
        waiver_completion_rate = round(signed_waivers / total_bookings * 100) if total_bookings else 100
        # Upcoming paid visits that still need a waiver
        unsigned_upcoming_sessions = paid_sessions.filter(date__gte=today).exclude(
            id__in=paid_sessions.filter(signed_q).values('id')).count()
        total_pending_waivers = (
            unsigned_upcoming_sessions
            + paid_parties.filter(date__gte=today, waiver_signed=False).count()
        )
        total_waivers = Waiver.objects.count()

        # ----- customers (people with at least one paid booking) -----
        session_customer_ids = list(paid_sessions.exclude(customer__isnull=True).values_list('customer_id', flat=True))
        party_customer_ids = list(paid_parties.exclude(customer__isnull=True).values_list('customer_id', flat=True))
        paid_counts = {}
        for cid in session_customer_ids + party_customer_ids:
            paid_counts[cid] = paid_counts.get(cid, 0) + 1
        total_customers = len(paid_counts)
        new_customers_month = Customer.objects.filter(
            id__in=list(paid_counts.keys()), created_at__date__gte=first_day_of_month).count()
        repeat_customers = sum(1 for n in paid_counts.values() if n > 1)

        # ----- vouchers -----
        now = timezone.now()
        active_vouchers = Voucher.objects.filter(is_active=True).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=now)).count()
        total_voucher_redemptions = paid_sessions.filter(voucher__isnull=False).count()

        # ----- content -----
        total_activities = Activity.objects.filter(active=True).count()
        total_faqs = Faq.objects.filter(active=True).count()
        total_banners = Banner.objects.filter(active=True).count()

        # ----- recent bookings (all, shown with their payment status) -----
        recent_sessions = Booking.objects.select_related('customer').order_by('-created_at')[:5]
        recent_parties = PartyBooking.objects.select_related('customer').order_by('-created_at')[:5]
        recent_sessions_data = [{
            'id': b.id, 'uuid': str(b.uuid), 'name': b.name, 'email': b.email, 'type': 'SESSION',
            'amount': b.amount, 'date': b.date.isoformat() if b.date else None,
            'time': str(b.time) if b.time else None, 'status': b.booking_status,
            'payment_status': b.payment_status, 'created_at': b.created_at.isoformat()
        } for b in recent_sessions]
        recent_parties_data = [{
            'id': b.id, 'uuid': str(b.uuid), 'name': b.name, 'email': b.email, 'type': 'PARTY',
            'amount': b.amount, 'date': b.date.isoformat() if b.date else None,
            'time': str(b.time) if b.time else None, 'status': b.status,
            'payment_status': b.payment_status, 'created_at': b.created_at.isoformat()
        } for b in recent_parties]
        all_recent = sorted(recent_sessions_data + recent_parties_data,
                            key=lambda x: x.get('created_at', ''), reverse=True)[:5]

        # ----- messages -----
        from apps.cms.models import ContactMessage
        unread_messages = ContactMessage.objects.filter(is_read=False).count()
        latest_message = ContactMessage.objects.filter(is_read=False).order_by('-created_at').first()
        latest_message_preview = None
        if latest_message:
            text = latest_message.message or ''
            latest_message_preview = f"{latest_message.name}: {text[:50]}..." if len(text) > 50 else f"{latest_message.name}: {text}"

        return Response({
            "bookingsToday": bookings_today,
            "totalBookings": total_bookings,
            "totalRevenue": total_revenue,
            "pendingWaivers": total_pending_waivers,
            "recentBookings": all_recent,
            "monthlyRevenue": monthly_revenue,
            "sessionBookings": total_session_bookings,
            "partyBookings": total_party_bookings,
            "totalCustomers": total_customers,
            "newCustomersMonth": new_customers_month,
            "repeatCustomers": repeat_customers,
            "activeVouchers": active_vouchers,
            "redeemedVouchers": total_voucher_redemptions,
            "totalActivities": total_activities,
            "totalFaqs": total_faqs,
            "totalBanners": total_banners,
            "avgBookingValue": avg_booking_value,
            "waiverCompletionRate": waiver_completion_rate,
            "totalWaivers": total_waivers,
            "signedWaivers": signed_waivers,
            "unreadMessages": unread_messages,
            "latestMessagePreview": latest_message_preview,
            "todayRevenue": today_revenue,
            "yesterdayRevenue": yesterday_revenue,
            "paymentsToday": payments_today,
            "thisWeekBookings": this_week_bookings,
            "lastWeekBookings": last_week_bookings,
            "bookingGrowth": booking_growth,
        })

    @action(detail=False, methods=['get'])
    def all_bookings(self, request):
        """
        Unified endpoint that returns both session and party bookings combined with customer data
        """
        booking_type = request.query_params.get('type', None)
        status = request.query_params.get('status', None)
        search = request.query_params.get('search', None)
        
        all_bookings_data = []
        
        try:
            # Fetch session bookings
            if booking_type != 'party':
                session_bookings = Booking.objects.select_related('customer').all()
                if status:
                    session_bookings = session_bookings.filter(booking_status=status)
                if search:
                    session_bookings = session_bookings.filter(
                        Q(name__icontains=search) | Q(email__icontains=search)
                    )
                
                for booking in session_bookings:
                    try:
                        all_bookings_data.append({
                            'id': booking.id,
                            'uuid': str(booking.uuid),
                            'type': 'SESSION',
                            'name': booking.name,
                            'email': booking.email,
                            'phone': booking.phone,
                            'date': str(booking.date) if booking.date else None,
                            'time': str(booking.time) if booking.time else None,
                            'duration': booking.duration,
                            'adults': booking.adults,
                            'kids': booking.kids,
                            'spectators': booking.spectators,
                            'amount': float(booking.amount) if booking.amount else 0,
                            'booking_status': booking.booking_status,
                            'payment_status': booking.payment_status,
                            'waiver_status': booking.waiver_status,
                            'created_at': booking.created_at.isoformat() if booking.created_at else None,
                            'customer': {
                                'id': booking.customer.id if booking.customer else None,
                                'name': booking.customer.name if booking.customer else booking.name,
                                'email': booking.customer.email if booking.customer else booking.email,
                                'phone': booking.customer.phone if booking.customer else booking.phone,
                            } if booking.customer or booking.name else None
                        })

                    except Exception as e:
                        logger.error(f"Error serializing session booking {booking.id}: {e}")
            
            # Fetch party bookings
            if booking_type != 'session':
                party_bookings = PartyBooking.objects.select_related('customer').all()
                if status:
                    party_bookings = party_bookings.filter(status=status)
                if search:
                    party_bookings = party_bookings.filter(
                        Q(name__icontains=search) | Q(email__icontains=search)
                    )
                
                for booking in party_bookings:
                    try:
                        all_bookings_data.append({
                            'id': booking.id,
                            'uuid': str(booking.uuid),
                            'type': 'PARTY',
                            'name': booking.name,
                            'email': booking.email,
                            'phone': booking.phone,
                            'date': str(booking.date) if booking.date else None,
                            'time': str(booking.time) if booking.time else None,
                            'duration': 120,  # Default party duration
                            'adults': booking.adults,
                            'kids': booking.kids,
                            'spectators': 0,  # Not tracked for party bookings
                            'amount': float(booking.amount) if booking.amount else 0,
                            'booking_status': booking.status,
                            'payment_status': booking.payment_status,
                            'paid_amount': float(booking.paid_amount) if booking.paid_amount else 0,
                            'waiver_status': 'SIGNED' if booking.waiver_signed else 'PENDING',
                            'created_at': booking.created_at.isoformat() if booking.created_at else None,
                            'birthday_child_name': booking.birthday_child_name,
                            'birthday_child_age': booking.birthday_child_age,
                            'package_name': booking.package_name,
                            'customer': {
                                'id': booking.customer.id if booking.customer else None,
                                'name': booking.customer.name if booking.customer else booking.name,
                                'email': booking.customer.email if booking.customer else booking.email,
                                'phone': booking.customer.phone if booking.customer else booking.phone,
                            } if booking.customer or booking.name else None
                        })
                    except Exception as e:
                        logger.error(f"Error serializing party booking {booking.id}: {e}")
            
            # Sort by created_at (most recent first)
            all_bookings_data.sort(key=lambda x: x['created_at'] or '', reverse=True)
            
            return Response({
                'count': len(all_bookings_data),
                'results': all_bookings_data
            })
        except Exception as e:
            logger.error(f"Error in all_bookings: {e}", exc_info=True)
            return Response({'error': 'Internal server error'}, status=500)
