# CLMP Tech - Self-Hosting Deployment Guide

This guide explains how to deploy CLMP Tech independently on your own hosting (GoDaddy, Hostinger, etc.).

## 📋 Prerequisites

- Node.js 18+ installed locally
- A new Supabase project (https://supabase.com)
- GoDaddy hosting account with FTP/File Manager access
- GitHub account (for version control)

---

## 🗄️ Step 1: Setup New Supabase Project

### 1.1 Create New Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Note your:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Found in Settings → API

### 1.2 Run Database Migrations

1. Go to SQL Editor in your new Supabase dashboard
2. Run all migration files from `supabase/migrations/` folder **in order** (by filename date)
3. Or use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your new project
supabase link --project-ref YOUR-PROJECT-ID

# Push all migrations
supabase db push
```

### 1.3 Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy ai-chat
supabase functions deploy ai-risk-analysis
supabase functions deploy bot-detection
supabase functions deploy delete-user
supabase functions deploy geocode-location
supabase functions deploy get-weather
supabase functions deploy quickbooks-export
supabase functions deploy quickbooks-oauth
supabase functions deploy scan-receipt
supabase functions deploy send-email
supabase functions deploy send-invitation
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-setup-products
supabase functions deploy stripe-webhook
```

### 1.4 Configure Supabase Secrets

Go to Supabase Dashboard → Settings → Edge Functions → Add these secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key | AI Risk Analysis, AI Chat |
| `RESEND_API_KEY` | Resend email API key | Email invitations |
| `SITE_URL` | Your production URL (e.g., `https://yourdomain.com`) | Email links |
| `OPENWEATHER_API_KEY` | OpenWeather API key | Weather widget |
| `MAPBOX_ACCESS_TOKEN` | Mapbox access token | Location autocomplete |
| `STRIPE_SECRET_KEY` | Stripe secret key | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Webhook verification |

### 1.5 Create Admin User

After creating your first user account:

```sql
-- Run in SQL Editor
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR-USER-ID-FROM-AUTH-USERS', 'admin');
```

---

## ⚙️ Step 2: Configure Environment

### 2.1 Update `.env` file

```env
VITE_SUPABASE_PROJECT_ID="YOUR-NEW-PROJECT-ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR-NEW-ANON-KEY"
VITE_SUPABASE_URL="https://YOUR-NEW-PROJECT-ID.supabase.co"
```

### 2.2 Update Supabase Client (if hardcoded)

Check `src/integrations/supabase/client.ts` and update if URLs are hardcoded.

### 2.3 Update PWA cache URL in `vite.config.ts`

Update the Supabase URL pattern:
```ts
urlPattern: /^https:\/\/YOUR-NEW-PROJECT-ID\.supabase\.co\/.*/i,
```

---

## 🏗️ Step 3: Build for Production

```bash
# Install dependencies
npm install

# Build production bundle
npm run build
```

This creates a `dist/` folder with all static files.

---

## 🚀 Step 4: Deploy to GoDaddy

### Option A: File Manager Upload

1. Log in to GoDaddy → My Products → Web Hosting → Manage
2. Open File Manager
3. Navigate to `public_html` folder
4. Delete existing files (backup first if needed)
5. Upload all contents from `dist/` folder

### Option B: FTP Upload

```bash
# Using any FTP client (FileZilla, Cyberduck, etc.)
Host: ftp.yourdomain.com
Username: Your GoDaddy FTP username
Password: Your GoDaddy FTP password
Port: 21

# Upload dist/* to /public_html/
```

### 4.1 Configure .htaccess for SPA Routing

Create or update `.htaccess` in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Handle Authorization Header
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

  # Redirect Trailing Slashes If Not A Folder
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} (.+)/$
  RewriteRule ^ %1 [L,R=301]

  # Send Requests To Front Controller
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
  AddOutputFilterByType DEFLATE application/javascript text/javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🔐 Step 5: Configure Supabase Auth Redirect

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com`
   - `https://yourdomain.com/*`
   - `https://www.yourdomain.com`
   - `https://www.yourdomain.com/*`

---

## ✅ Step 6: Verify Deployment

1. Visit `https://yourdomain.com`
2. Test user registration/login
3. Test all major features:
   - [ ] Dashboard loads
   - [ ] Projects CRUD
   - [ ] Team management
   - [ ] File uploads
   - [ ] Weather widget
   - [ ] Location search
   - [ ] AI Chat
   - [ ] Invoice management

---

## 🔄 Continuous Deployment (Optional)

### GitHub Actions Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GoDaddy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ftp.yourdomain.com
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: /public_html/
```

Add these secrets to your GitHub repo → Settings → Secrets:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `FTP_USERNAME`
- `FTP_PASSWORD`

---

## 🛠️ Troubleshooting

### Page shows 404 on refresh
→ Check `.htaccess` file is correctly configured

### API calls fail (CORS errors)
→ Check Supabase → Settings → API → Add your domain to allowed origins

### Auth redirects don't work
→ Update Supabase Auth redirect URLs (Step 5)

### Images/files don't load
→ Check storage bucket policies in Supabase

### Edge functions fail
→ Verify all secrets are configured in Supabase Functions settings

---

## 📞 Support

For technical issues:
- Supabase Docs: https://supabase.com/docs
- GoDaddy Support: https://www.godaddy.com/help

---

## 📝 License

Proprietary - All rights reserved by CLMP Tech Inc.
