import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

# Patch ALLOWED_HOSTS for test client
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
client = APIClient()

# 1. Create a superuser to verify we have permissions (if needed)
# Although UserViewSet permission is IsAuthenticated, it checks for self.request.user.
# But wait, UserViewSet permission is [colors.IsAuthenticated]. 
# And get_queryset filters by ID unless superuser.
# Create is standard ModelViewSet create.

# Let's try to create a user from an Admin account perspective
try:
    admin = User.objects.filter(role='ADMIN').first()
    if not admin:
        print("No ADMIN user found via role='ADMIN', trying is_superuser=True")
        admin = User.objects.filter(is_superuser=True).first()
    
    if not admin:
        print("CRITICAL: No Admin user found at all. Cannot authenticate.")
    else:
        print(f"Authenticating as: {admin.email}")
        client.force_authenticate(user=admin)

        payload = {
            "name": "Test API User",
            "email": "test_api_create@example.com",
            "password": "TestPassword123!",
            "role": "EMPLOYEE",
            "is_active": True
        }

        print("Sending POST request to /api/v1/core/users/...")
        response = client.post('/api/v1/core/users/', payload, format='json')

        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("SUCCESS: User created.")
            User.objects.filter(email="test_api_create@example.com").delete()
        else:
            print("FAILURE: Could not create user.")
            if response.status_code >= 500:
                print("Server Error (500). Saving to error_debug.html")
                with open('error_debug.html', 'w', encoding='utf-8') as f:
                    f.write(response.content.decode())
            else:
                print(f"Validation Errors: {response.content.decode()}")

except Exception as e:
    print(f"EXCEPTION OCCURRED: {e}")
