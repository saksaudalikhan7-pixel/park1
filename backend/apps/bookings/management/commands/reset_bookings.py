from django.core.management.base import BaseCommand
from django.db import connection, transaction

class Command(BaseCommand):
    help = 'Resets the booking system by clearing all bookings, customers, and related data, and resetting IDs to start from 1.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force execution without confirmation prompt',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('WARNING: This will DELETE ALL DATA from the booking system!'))
        self.stdout.write(self.style.WARNING('This includes:'))
        self.stdout.write(self.style.WARNING('- All Session Bookings and Party Bookings'))
        self.stdout.write(self.style.WARNING('- All Customers and Waivers'))
        self.stdout.write(self.style.WARNING('- All Transactions and History logs'))
        self.stdout.write(self.style.WARNING('And it will RESET all IDs back to 1.'))
        
        if not options['force']:
            confirm = input('\nAre you sure you want to proceed? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Operation cancelled.'))
                return

        self.stdout.write('Resetting booking system...')

        tables_to_reset = [
            'bookings_transaction',
            'bookings_waiver',
            'bookings_sessionbookinghistory',
            'bookings_partybookinghistory',
            'bookings_booking',
            'bookings_partybooking',
            'bookings_customer',
            'bookings_bookingblock', # Optional: Clear blocks? Maybe better to keep configuration. Let's keep blocks.
            # 'bookings_bookingblock', 
        ]

        # Using CASCADE to handle foreign keys automatically
        # RESTART IDENTITY resets the sequences
        
        with connection.cursor() as cursor:
            try:
                # We need to construct the TRUNCATE command dynamically or just list them
                # Ideally, truncate specific tables.
                # Note: 'bookings_bookingblock' is NOT included to preserve configurations like blocked dates/holidays.
                # However, if we want a *complete* clean slate, include it. 
                # The user asked to "clear the booking management system", usually implies transactional data, not config.
                
                # Order matters less with CASCADE, but good practice to list dependents first roughly
                
                sql = f"""
                TRUNCATE TABLE 
                    bookings_transaction, 
                    bookings_waiver, 
                    bookings_sessionbookinghistory, 
                    bookings_partybookinghistory, 
                    bookings_booking, 
                    bookings_partybooking, 
                    bookings_customer
                RESTART IDENTITY CASCADE;
                """
                
                cursor.execute(sql)
                self.stdout.write(self.style.SUCCESS('Successfully truncated tables and reset sequences.'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error occurred: {str(e)}'))
                return

        self.stdout.write(self.style.SUCCESS('Booking system reset complete. Next booking ID will be 1.'))
