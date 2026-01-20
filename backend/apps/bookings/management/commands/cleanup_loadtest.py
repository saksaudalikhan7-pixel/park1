"""
Management command to clean up load test data from the database.
This removes all bookings created during load testing.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.bookings.models import Booking, PartyBooking, Waiver, Transaction, Customer


class Command(BaseCommand):
    help = 'Delete all load test bookings and related data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted'))
        
        # Find all load test bookings
        session_bookings = Booking.objects.filter(name__istartswith='LoadTest')
        party_bookings = PartyBooking.objects.filter(name__istartswith='LoadTest')
        
        # Count related data
        session_count = session_bookings.count()
        party_count = party_bookings.count()
        
        # Get related waivers and transactions (only session bookings have these)
        session_waivers = Waiver.objects.filter(booking__in=session_bookings)
        session_transactions = Transaction.objects.filter(booking__in=session_bookings)
        
        waiver_count = session_waivers.count()
        transaction_count = session_transactions.count()
        
        # Get load test customers (those only associated with load test bookings)
        load_test_customers = Customer.objects.filter(
            email__icontains='loadtest'
        )
        customer_count = load_test_customers.count()
        
        # Display summary
        self.stdout.write(self.style.WARNING('\n=== LOAD TEST DATA CLEANUP ===\n'))
        self.stdout.write(f'Session Bookings to delete: {session_count}')
        self.stdout.write(f'Party Bookings to delete: {party_count}')
        self.stdout.write(f'Waivers to delete: {waiver_count}')
        self.stdout.write(f'Transactions to delete: {transaction_count}')
        self.stdout.write(f'Load Test Customers to delete: {customer_count}')
        self.stdout.write(f'\nTotal items to delete: {session_count + party_count + waiver_count + transaction_count + customer_count}')
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS('\nDRY RUN COMPLETE - No data was deleted'))
            return
        
        # Confirm deletion
        if session_count + party_count == 0:
            self.stdout.write(self.style.SUCCESS('\nNo load test bookings found. Database is clean!'))
            return
        
        self.stdout.write(self.style.WARNING('\nProceeding with deletion...'))
        
        try:
            with transaction.atomic():
                # Delete in correct order (related objects first)
                deleted_waivers = session_waivers.delete()[0]
                deleted_transactions = session_transactions.delete()[0]
                deleted_session = session_bookings.delete()[0]
                deleted_party = party_bookings.delete()[0]
                deleted_customers = load_test_customers.delete()[0]
                
                self.stdout.write(self.style.SUCCESS(f'\n✓ Deleted {deleted_waivers} waivers'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_transactions} transactions'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_session} session bookings'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_party} party bookings'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_customers} load test customers'))
                
                self.stdout.write(self.style.SUCCESS('\n=== CLEANUP COMPLETE ==='))
                self.stdout.write(self.style.SUCCESS('All load test data has been removed from the database.'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nERROR during deletion: {str(e)}'))
            raise
