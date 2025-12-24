from django.contrib import admin
from .models import Customer, Booking, PartyBooking, Waiver, Transaction, BookingBlock, SessionBookingHistory, PartyBookingHistory

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'phone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'email', 'phone']
    ordering = ['-created_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'uuid', 'name', 'email', 'date', 'time', 'adults', 'kids', 'amount', 'booking_status', 'payment_status', 'waiver_status', 'created_at']
    list_filter = ['booking_status', 'payment_status', 'waiver_status', 'type', 'date', 'created_at']
    search_fields = ['name', 'email', 'phone', 'uuid']
    readonly_fields = ['uuid', 'created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone', 'customer')
        }),
        ('Booking Details', {
            'fields': ('date', 'time', 'duration', 'type', 'adults', 'kids', 'spectators')
        }),
        ('Payment', {
            'fields': ('amount', 'subtotal', 'discount_amount', 'voucher_code', 'voucher')
        }),
        ('Status', {
            'fields': ('booking_status', 'payment_status', 'waiver_status', 'status')
        }),
        ('QR Code', {
            'fields': ('qr_code',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(PartyBooking)
class PartyBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'uuid', 'name', 'email', 'date', 'time', 'package_name', 'kids', 'adults', 'amount', 'status', 'waiver_signed', 'created_at']
    list_filter = ['status', 'waiver_signed', 'date', 'created_at']
    search_fields = ['name', 'email', 'phone', 'uuid', 'package_name', 'birthday_child_name']
    readonly_fields = ['uuid', 'created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone', 'customer')
        }),
        ('Party Details', {
            'fields': ('date', 'time', 'package_name', 'kids', 'adults', 'amount')
        }),
        ('Birthday Child', {
            'fields': ('birthday_child_name', 'birthday_child_age')
        }),
        ('Participants & Waiver', {
            'fields': ('participants', 'waiver_signed', 'waiver_signed_at', 'waiver_ip_address')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(Waiver)
class WaiverAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'participant_type', 'is_primary_signer', 'signed_at', 'booking_type', 'created_at']
    list_filter = ['participant_type', 'is_primary_signer', 'signed_at', 'created_at']
    search_fields = ['name', 'email', 'phone', 'emergency_contact']
    readonly_fields = ['signed_at', 'created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Participant Information', {
            'fields': ('name', 'email', 'phone', 'dob', 'participant_type', 'is_primary_signer')
        }),
        ('Waiver Details', {
            'fields': ('version', 'emergency_contact', 'ip_address', 'signed_at')
        }),
        ('Booking Association', {
            'fields': ('booking', 'party_booking', 'customer')
        }),
        ('Legacy Fields', {
            'fields': ('minors', 'adults'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def booking_type(self, obj):
        if obj.booking:
            return f'Session #{obj.booking.id}'
        elif obj.party_booking:
            return f'Party #{obj.party_booking.id}'
        return 'Walk-in'
    booking_type.short_description = 'Booking Type'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction_id', 'booking', 'amount', 'currency', 'payment_method', 'status', 'created_at']
    list_filter = ['payment_method', 'status', 'currency', 'created_at']
    search_fields = ['transaction_id', 'booking__name', 'booking__email']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(BookingBlock)
class BookingBlockAdmin(admin.ModelAdmin):
    list_display = ['id', 'reason', 'type', 'start_date', 'end_date', 'recurring', 'created_at']
    list_filter = ['type', 'recurring', 'created_at']
    search_fields = ['reason']
    ordering = ['-start_date']
    fieldsets = (
        ('Block Details', {
            'fields': ('reason', 'type', 'recurring')
        }),
        ('Date Range', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(SessionBookingHistory)
class SessionBookingHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'date', 'time', 'amount', 'restored', 'restored_at', 'restored_by', 'created_at']
    list_filter = ['restored', 'date', 'created_at', 'restored_at']
    search_fields = ['name', 'email', 'phone', 'failure_reason']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'restored', 'restored_at', 'restored_by', 'restored_booking_id']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone')
        }),
        ('Booking Details', {
            'fields': ('date', 'time', 'duration', 'adults', 'kids', 'spectators')
        }),
        ('Payment', {
            'fields': ('amount', 'subtotal', 'discount_amount', 'voucher_code', 'payment_amount', 'payment_transaction_id')
        }),
        ('History Information', {
            'fields': ('original_booking_id', 'failure_reason')
        }),
        ('Restore Status', {
            'fields': ('restored', 'restored_at', 'restored_by', 'restored_booking_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(PartyBookingHistory)
class PartyBookingHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'date', 'time', 'package_name', 'amount', 'restored', 'restored_at', 'restored_by', 'created_at']
    list_filter = ['restored', 'date', 'created_at', 'restored_at']
    search_fields = ['name', 'email', 'phone', 'package_name', 'birthday_child_name', 'failure_reason']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'restored', 'restored_at', 'restored_by', 'restored_booking_id']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone')
        }),
        ('Party Details', {
            'fields': ('date', 'time', 'package_name', 'kids', 'adults', 'amount')
        }),
        ('Birthday Child', {
            'fields': ('birthday_child_name', 'birthday_child_age')
        }),
        ('Participants', {
            'fields': ('participants',)
        }),
        ('Payment', {
            'fields': ('payment_amount', 'payment_transaction_id')
        }),
        ('History Information', {
            'fields': ('original_booking_id', 'failure_reason')
        }),
        ('Restore Status', {
            'fields': ('restored', 'restored_at', 'restored_by', 'restored_booking_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

