#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Running emails app migration explicitly..."
python manage.py migrate emails --noinput

echo "Running marketing app migration explicitly..."
python manage.py migrate marketing --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 2 --access-logfile - --error-logfile - ninja_backend.wsgi:application
