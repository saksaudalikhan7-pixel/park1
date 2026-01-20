"""
Quick cleanup script for load test data.
Run this locally - it will connect to your Azure production database.
"""

import os
import sys

# Add the backend directory to Python path
backend_dir = r'c:\Users\saksa\OneDrive\Desktop\yoyopark\ninjainflatablepark11\park1\backend'
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')

import django
django.setup()

from django.db import transaction
from apps.bookings.models import Booking, PartyBooking, Customer

print("\n" + "="*50)
print("LOAD TEST DATA CLEANUP")
print("="*50 + "\n")

# Count first
session_bookings = Booking.objects.filter(name__istartswith='LoadTest')
party_bookings = PartyBooking.objects.filter(name__istartswith='LoadTest')
load_test_customers = Customer.objects.filter(email__icontains='loadtest')

session_count = session_bookings.count()
party_count = party_bookings.count()
customer_count = load_test_customers.count()

print(f"📊 Found:")
print(f"   - Session Bookings: {session_count}")
print(f"   - Party Bookings: {party_count}")
print(f"   - Load Test Customers: {customer_count}")
print(f"\n   Total items to delete: {session_count + party_count + customer_count}")

if session_count + party_count == 0:
    print("\n✅ No load test bookings found. Database is already clean!")
    sys.exit(0)

# Confirm deletion
print("\n⚠️  This will DELETE all load test data from the PRODUCTION database!")
confirm = input("\nType 'DELETE' to confirm: ")

if confirm != 'DELETE':
    print("\n❌ Cancelled. No data was deleted.")
    sys.exit(0)

print("\n🗑️  Deleting...")

try:
    with transaction.atomic():
        # Django will cascade delete related waivers and transactions automatically
        s_deleted = session_bookings.delete()
        p_deleted = party_bookings.delete()
        c_deleted = load_test_customers.delete()
        
        print(f"\n✅ Successfully deleted:")
        print(f"   - {s_deleted[0]} session bookings (+ related waivers/transactions)")
        print(f"   - {p_deleted[0]} party bookings (+ related waivers/transactions)")
        print(f"   - {c_deleted[0]} load test customers")
        
        print("\n" + "="*50)
        print("✅ CLEANUP COMPLETE!")
        print("="*50)
        print("\n💡 Next steps:")
        print("   1. Restart Backend App Service in Azure Portal")
        print("   2. Restart Frontend App Service in Azure Portal")
        print("   3. Test the admin portal - it should load instantly now!")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("Transaction rolled back - no data was deleted.")
    sys.exit(1)
