#!/bin/bash
# Azure App Service startup script for Django

# Run database migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn server
gunicorn ninja_backend.wsgi:application --bind=0.0.0.0:8000 --workers=4 --timeout=120
