#!/bin/bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
# Create superuser if it doesn't exist (using environment variables)
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='admin@example.com').exists() or User.objects.create_superuser('admin@example.com', 'admin')"
gunicorn --bind=0.0.0.0 --timeout 600 ninja_backend.wsgi
