#!/bin/bash
# Azure deploys backend files directly to /home/site/wwwroot
# No need to cd to backend directory

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Start gunicorn
gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 4 ninja_backend.wsgi
