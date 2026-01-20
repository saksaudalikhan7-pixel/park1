#!/bin/bash
# Azure deployment script for backend
# This script is called by Azure after files are deployed

echo "=== Azure Backend Deployment ==="

# Navigate to the deployment directory
cd /home/site/wwwroot

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput || echo "Migration warning"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files warning"

# Create RBAC users
echo "Creating RBAC users..."
python manage.py create_rbac_users || echo "User creation warning"

echo "=== Deployment Complete ==="
