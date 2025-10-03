#!/bin/bash

# Corkboard Production Deployment Script
# This script deploys the latest code from the main branch to production
#
# Usage: ./deploy.sh
#
# GitHub Actions Integration:
# This script is designed to be triggered by GitHub Actions on push to main.
# See DEPLOYMENT.md for full GitHub Actions setup instructions.
#
# Quick setup:
# 1. Add SSH secrets to GitHub: SSH_PRIVATE_KEY, SSH_HOST, SSH_USER, DEPLOY_PATH
# 2. Create .github/workflows/deploy.yml with ssh-action that runs this script
# 3. Push to main branch - deployment happens automatically!

set -e  # Exit on any error

echo "🚀 Starting Corkboard deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if required files exist
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Please create .env.production with required environment variables."
    echo "See .env.production.example for reference."
    exit 1
fi

# Pull latest code from main branch
print_status "Pulling latest code from main branch..."
git fetch origin
git reset --hard origin/main
print_success "Code updated to latest commit"

# Install/update dependencies
print_status "Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Run database migrations
print_status "Running database migrations..."
export $(cat .env.production | grep -v '^#' | xargs)
npx drizzle-kit push --config=drizzle.config.ts
print_success "Database migrations complete"

# Check if this is first deployment (no existing build)
if [ ! -d ".next" ]; then
    print_status "First deployment detected - seeding database..."
    npm run db:seed
    print_success "Database seeded with admin user"
fi

# Build the application
print_status "Building application..."
npm run build
print_success "Build complete"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed!"
    echo "Install with: npm install -g pm2"
    exit 1
fi

# Start or reload with PM2
print_status "Deploying with PM2..."

# Check if app is already running
if pm2 describe corkboard &> /dev/null; then
    print_status "Reloading existing PM2 process..."
    pm2 reload corkboard --update-env
else
    print_status "Starting new PM2 process..."
    pm2 start npm --name "corkboard" -- start
    pm2 save
fi

print_success "PM2 deployment complete"

# Show PM2 status
echo ""
print_status "Application status:"
pm2 status corkboard

# Show recent logs
echo ""
print_status "Recent logs:"
pm2 logs corkboard --lines 10 --nostream

echo ""
print_success "Deployment complete! 🎉"
echo ""
echo "Useful commands:"
echo "  pm2 logs corkboard       - View logs"
echo "  pm2 restart corkboard    - Restart app"
echo "  pm2 monit                - Monitor dashboard"
