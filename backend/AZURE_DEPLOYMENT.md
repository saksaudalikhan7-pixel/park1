# Azure Deployment Guide for Ninja Park

## Prerequisites
- Azure CLI installed and configured
- Azure subscription active
- PostgreSQL database already configured (✅ Done)

## Backend Configuration Summary

### ✅ Completed Steps

1. **Created startup.sh**
   - Location: `backend/startup.sh`
   - Runs migrations, collects static files, and starts Gunicorn

2. **Updated requirements.txt**
   - Added `gunicorn>=21.2.0`
   - Added `whitenoise>=6.6.0`
   - Already includes `psycopg2-binary>=2.9.9`

3. **Updated Django Settings**
   - Added whitenoise middleware for static file serving
   - Configured ALLOWED_HOSTS to auto-detect Azure hostname
   - Added Azure domains to CSRF_TRUSTED_ORIGINS
   - Configured static files with whitenoise compression

## Deployment Commands

### Step 1: Create Resource Group (if not exists)
```bash
az group create --name Ninja --location canadacentral
```

### Step 2: Create App Service Plan
```bash
az appservice plan create \
  --name ninja-park-plan \
  --resource-group Ninja \
  --sku B1 \
  --is-linux
```

### Step 3: Create Web App
```bash
az webapp create \
  --resource-group Ninja \
  --plan ninja-park-plan \
  --name ninja-park-backend \
  --runtime "PYTHON:3.11"
```

### Step 4: Configure Environment Variables
```bash
# Set database configuration
az webapp config appsettings set \
  --resource-group Ninja \
  --name ninja-park-backend \
  --settings \
    DB_ENGINE="django.db.backends.postgresql" \
    DB_NAME="postgres" \
    DB_USER="your_db_user" \
    DB_PASSWORD="your_db_password" \
    DB_HOST="your-server.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_SSL_MODE="require" \
    SECRET_KEY="your-production-secret-key-here" \
    DEBUG="False" \
    ALLOWED_HOSTS="ninja-park-backend.azurewebsites.net" \
    CORS_ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

### Step 5: Configure Startup Command
```bash
az webapp config set \
  --resource-group Ninja \
  --name ninja-park-backend \
  --startup-file "startup.sh"
```

### Step 6: Deploy from Local Directory
```bash
cd backend
az webapp up \
  --name ninja-park-backend \
  --resource-group Ninja \
  --runtime "PYTHON:3.11"
```

### Alternative: Deploy from GitHub
```bash
az webapp deployment source config \
  --name ninja-park-backend \
  --resource-group Ninja \
  --repo-url https://github.com/Asrar2244/Ninja_Park.git \
  --branch main \
  --manual-integration
```

## Post-Deployment Steps

### 1. Create Superuser
```bash
az webapp ssh --name ninja-park-backend --resource-group Ninja
# Then run:
python manage.py createsuperuser
```

### 2. Verify Deployment
- Visit: `https://ninja-park-backend.azurewebsites.net`
- Admin: `https://ninja-park-backend.azurewebsites.net/admin`
- API Docs: `https://ninja-park-backend.azurewebsites.net/api/schema/swagger-ui/`

### 3. Configure PostgreSQL Firewall
```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group Ninja \
  --name ninja-park \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Important Notes

⚠️ **Before Deploying:**
1. Generate a strong SECRET_KEY for production
2. Update CORS_ALLOWED_ORIGINS with your actual frontend domain
3. Set DEBUG=False in production
4. Review and restrict ALLOWED_HOSTS

⚠️ **Security Checklist:**
- [ ] Strong SECRET_KEY set
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS properly configured
- [ ] CSRF_TRUSTED_ORIGINS includes only trusted domains
- [ ] Database password is secure
- [ ] SSL/HTTPS enabled (automatic on Azure)

## Monitoring & Logs

### View Application Logs
```bash
az webapp log tail \
  --name ninja-park-backend \
  --resource-group Ninja
```

### Enable Application Insights (Optional)
```bash
az monitor app-insights component create \
  --app ninja-park-insights \
  --location canadacentral \
  --resource-group Ninja
```

## Troubleshooting

### Check Deployment Status
```bash
az webapp show \
  --name ninja-park-backend \
  --resource-group Ninja \
  --query state
```

### Restart Web App
```bash
az webapp restart \
  --name ninja-park-backend \
  --resource-group Ninja
```

### SSH into Container
```bash
az webapp ssh \
  --name ninja-park-backend \
  --resource-group Ninja
```

## Cost Optimization

Current configuration:
- **App Service Plan**: B1 (Basic) - ~$13/month
- **PostgreSQL**: B2s (Burstable) - ~$30/month
- **Total**: ~$43/month

To reduce costs:
- Use F1 (Free) tier for testing: `--sku F1`
- Scale down PostgreSQL to B1ms
- Use Azure for Students credits if eligible
