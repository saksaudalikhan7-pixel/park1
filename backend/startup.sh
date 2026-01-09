#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput || echo "WARNING: Major migration failed, but continuing startup..."

echo "Running emails app migration explicitly..."
python manage.py migrate emails --noinput || echo "Email migration warning"

echo "Checking marketing migrations status..."
python manage.py showmigrations marketing || echo "Could not show marketing migrations"

echo "Running marketing app migration explicitly..."
python manage.py migrate marketing --noinput || echo "WARNING: Marketing migration failed, but continuing..."

echo "checking cms migrations..."
python manage.py showmigrations cms || echo "Could not show cms migrations"
python manage.py migrate cms --noinput || echo "CMS migration FAILED but continuing..."

echo "Ensuring admin and RBAC users exist..."
python create_superuser.py || echo "WARNING: User creation failed"

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 2 --access-logfile - --error-logfile - ninja_backend.wsgi:application
