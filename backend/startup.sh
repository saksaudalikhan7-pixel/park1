#!/bin/bash
set -e

echo "Starting Django application..."

# Run migrations
python manage.py migrate --noinput || echo "Migration failed, continuing..."

# Collect static files
python manage.py collectstatic --noinput || echo "Collectstatic failed, continuing..."

# Start gunicorn on port 8000 (Azure default)
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 2 --access-logfile - --error-logfile - ninja_backend.wsgi:application

