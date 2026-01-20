"""
Management command to clean up ALL test/demo data from the database.
This removes all bookings, customers, waivers, and transactions.
USE WITH CAUTION - This will delete ALL booking data!
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.bookings.models import Booking, PartyBooking, Waiver, Transaction, Customer


class Command(BaseCommand):
    help = 'Delete ALL test data (bookings, customers, waivers, transactions)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm you want to delete ALL data',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        confirmed = options['confirm']
        
        # Count all data
        session_count = Booking.objects.count()
        party_count = PartyBooking.objects.count()
        waiver_count = Waiver.objects.count()
        transaction_count = Transaction.objects.count()
        customer_count = Customer.objects.count()
        
        total = session_count + party_count + waiver_count + transaction_count + customer_count
        
        # Display summary
        self.stdout.write(self.style.WARNING('\n=== COMPLETE DATABASE CLEANUP ===\n'))
        self.stdout.write(self.style.ERROR('⚠️  WARNING: This will delete ALL booking data!\n'))
        self.stdout.write(f'Session Bookings: {session_count}')
        self.stdout.write(f'Party Bookings: {party_count}')
        self.stdout.write(f'Waivers: {waiver_count}')
        self.stdout.write(f'Transactions: {transaction_count}')
        self.stdout.write(f'Customers: {customer_count}')
        self.stdout.write(self.style.ERROR(f'\nTotal items to delete: {total}\n'))
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS('DRY RUN COMPLETE - No data was deleted'))
            return
        
        if not confirmed:
            self.stdout.write(self.style.ERROR('\n❌ ABORTED: You must use --confirm flag to proceed'))
            self.stdout.write(self.style.WARNING('Run with --confirm to actually delete the data'))
            self.stdout.write(self.style.WARNING('Example: python manage.py cleanup_all --confirm\n'))
            return
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS('\nDatabase is already clean!'))
            return
        
        self.stdout.write(self.style.WARNING('\nProceeding with deletion in 3 seconds...'))
        import time
        time.sleep(3)
        
        try:
            with transaction.atomic():
                # Delete in correct order (related objects first)
                deleted_waivers = Waiver.objects.all().delete()[0]
                deleted_transactions = Transaction.objects.all().delete()[0]
                deleted_session = Booking.objects.all().delete()[0]
                deleted_party = PartyBooking.objects.all().delete()[0]
                deleted_customers = Customer.objects.all().delete()[0]
                
                self.stdout.write(self.style.SUCCESS(f'\n✓ Deleted {deleted_waivers} waivers'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_transactions} transactions'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_session} session bookings'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_party} party bookings'))
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted {deleted_customers} customers'))
                
                self.stdout.write(self.style.SUCCESS('\n=== CLEANUP COMPLETE ==='))
                self.stdout.write(self.style.SUCCESS('All booking data has been removed from the database.'))
                self.stdout.write(self.style.SUCCESS('Your database is now clean and ready for production!\n'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nERROR during deletion: {str(e)}'))
            raise
