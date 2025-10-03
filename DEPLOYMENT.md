# Corkboard Production Deployment Guide

## Prerequisites

Your Ubuntu server should have:
- **Node.js 18+** installed
- **PostgreSQL** running
- **Nginx** running
- **PM2** installed globally (`npm install -g pm2`)
- **Git** installed

## Initial Server Setup (One-Time)

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE corkboard_production;
CREATE USER corkboard_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE corkboard_production TO corkboard_user;

# Grant schema permissions (PostgreSQL 15+)
\c corkboard_production
GRANT ALL ON SCHEMA public TO corkboard_user;
\q
```

### 2. Clone Repository

```bash
# Clone to your deployment directory
cd /var/www  # or your preferred location
sudo git clone https://github.com/yourusername/corkboard.git
sudo chown -R $USER:$USER corkboard
cd corkboard
```

### 3. Configure Environment

```bash
# Copy example production environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

Required environment variables:
```bash
DATABASE_URL=postgresql://corkboard_user:your_secure_password@localhost:5432/corkboard_production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_generated_secret  # Generate with: openssl rand -base64 32
NODE_ENV=production
```

### 4. Initial Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run first deployment
./deploy.sh
```

This will:
- Install dependencies
- Build the Next.js app
- Run database migrations
- Seed the database with admin user
- Start the app with PM2
- Save PM2 configuration

### 5. Configure Nginx

Create Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/corkboard
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/corkboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Configure PM2 to Start on Boot

```bash
pm2 startup systemd
# Run the command it outputs
pm2 save
```

## Subsequent Deployments

For all future deployments, simply run:

```bash
./deploy.sh
```

This single command will:
1. Pull latest code from `main` branch
2. Install/update dependencies
3. Run database migrations
4. Build the application
5. Reload PM2 without downtime

## GitHub Actions Integration

The `deploy.sh` script is designed to work with GitHub Actions. To set up automatic deployments:

### Option A: SSH Deploy (Recommended)

1. **Generate SSH key on your server** (if not already done):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   ```

2. **Add secrets to GitHub repository**:
   - Go to Settings → Secrets and variables → Actions
   - Add these secrets:
     - `SSH_PRIVATE_KEY`: Contents of `~/.ssh/id_ed25519` from your server
     - `SSH_HOST`: Your server IP/domain
     - `SSH_USER`: Your server username
     - `DEPLOY_PATH`: Path to corkboard (e.g., `/var/www/corkboard`)

3. **Create `.github/workflows/deploy.yml`**:
   ```yaml
   name: Deploy to Production

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Deploy to server
           uses: appleboy/ssh-action@v1.0.0
           with:
             host: ${{ secrets.SSH_HOST }}
             username: ${{ secrets.SSH_USER }}
             key: ${{ secrets.SSH_PRIVATE_KEY }}
             script: |
               cd ${{ secrets.DEPLOY_PATH }}
               ./deploy.sh
   ```

### Option B: Webhook Deploy

1. **Install webhook listener on server**:
   ```bash
   npm install -g webhook
   ```

2. **Create webhook configuration** at `/var/www/corkboard/webhook.json`:
   ```json
   [
     {
       "id": "corkboard-deploy",
       "execute-command": "/var/www/corkboard/deploy.sh",
       "command-working-directory": "/var/www/corkboard",
       "pass-arguments-to-command": [],
       "trigger-rule": {
         "match": {
           "type": "payload-hash-sha256",
           "secret": "your-webhook-secret",
           "parameter": {
             "source": "header",
             "name": "X-Hub-Signature-256"
           }
         }
       }
     }
   ]
   ```

3. **Run webhook as systemd service** and configure GitHub webhook to POST to your server.

## Monitoring & Management

### PM2 Commands

```bash
# View app status
pm2 status

# View logs
pm2 logs corkboard

# View real-time logs
pm2 logs corkboard --lines 100

# Restart app
pm2 restart corkboard

# Stop app
pm2 stop corkboard

# View monitoring dashboard
pm2 monit
```

### Database Backup

```bash
# Create backup
pg_dump -U corkboard_user corkboard_production > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U corkboard_user corkboard_production < backup_20250103.sql
```

### Update Deployment

```bash
# Pull latest changes and deploy
cd /var/www/corkboard
./deploy.sh
```

## Troubleshooting

### App won't start
```bash
pm2 logs corkboard --lines 50
```

### Database connection issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env.production`
- Verify user permissions in PostgreSQL

### Nginx issues
```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Port already in use
```bash
# Find process on port 3000
sudo lsof -i :3000
# Kill if needed
pm2 delete corkboard
```

## Security Checklist

- [ ] PostgreSQL user has minimal required permissions
- [ ] `.env.production` has secure passwords and secrets
- [ ] Nginx is configured with SSL/TLS (HTTPS)
- [ ] Firewall allows only necessary ports (22, 80, 443)
- [ ] Regular database backups are scheduled
- [ ] PM2 logs are rotated to prevent disk fill
- [ ] Server packages are kept up to date

## Default Admin Access

After first deployment and database seed:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Change this immediately after first login!**
