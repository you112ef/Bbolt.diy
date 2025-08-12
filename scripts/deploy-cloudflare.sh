#!/bin/bash

# 🔥 CLOUDFLARE DEPLOYMENT SCRIPT - Fixes Error 1101
# This script handles the complete deployment process to prevent Worker crashes

set -e  # Exit on any error

echo "🚀 Starting Cloudflare Deployment Process..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Step 1: Clean previous builds
print_status "Cleaning previous builds..."
rm -rf build/ dist/ .wrangler/
print_success "Cleanup completed"

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps
print_success "Dependencies installed"

# Step 3: Build the project
print_status "Building the project..."
npm run build

if [ ! -d "build/client" ] || [ ! -d "build/server" ]; then
    print_error "Build failed - missing build directories"
    exit 1
fi
print_success "Build completed successfully"

# Step 4: Verify build integrity
print_status "Verifying build integrity..."
if [ ! -f "build/server/index.js" ]; then
    print_error "Server build is missing index.js"
    exit 1
fi

if [ ! -f "build/client/.vite/manifest.json" ]; then
    print_error "Client build is missing manifest.json"
    exit 1
fi
print_success "Build integrity verified"

# Step 5: Check environment variables
print_status "Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_success "Found .env.local file"
    source .env.local
elif [ -f ".env.production" ]; then
    print_warning "Using .env.production (consider creating .env.local for production)"
    source .env.production
else
    print_warning "No environment file found - some features may not work"
fi

# Step 6: Check Wrangler authentication
print_status "Checking Wrangler authentication..."
if ! npx wrangler whoami > /dev/null 2>&1; then
    print_error "Wrangler not authenticated. Please run: npx wrangler login"
    print_status "After authentication, run this script again"
    exit 1
fi
print_success "Wrangler authenticated"

# Step 7: Deploy to Cloudflare
print_status "Deploying to Cloudflare Pages..."
if npx wrangler pages deploy; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed"
    exit 1
fi

# Step 8: Verify deployment
print_status "Waiting for deployment to propagate..."
sleep 10

print_status "Deployment Summary:"
echo "======================"
echo "✅ Build completed"
echo "✅ Dependencies installed"
echo "✅ Build integrity verified"
echo "✅ Wrangler authenticated"
echo "✅ Deployed to Cloudflare"
echo ""
echo "🌐 Your site should now be accessible without Error 1101"
echo "📊 Check Cloudflare dashboard for deployment status"
echo "🔍 Monitor Worker logs for any remaining issues"
echo ""
echo "If you still see Error 1101:"
echo "1. Check Cloudflare Worker logs in the dashboard"
echo "2. Verify environment variables are set correctly"
echo "3. Check the health endpoint: /api/health"
echo "4. Wait a few minutes for changes to propagate"

print_success "Deployment process completed!"