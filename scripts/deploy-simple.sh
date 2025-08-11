#!/bin/bash

# 🚀 Simple Cloudflare Deployment Script
# This script deploys without OAuth authentication issues

set -e

echo "🚀 Starting Simple Cloudflare Deployment..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Clean and build
print_status "Cleaning and building project..."
rm -rf build/ dist/
npm run build

if [ ! -d "build/server" ] || [ ! -d "build/client" ]; then
    echo "❌ Build failed - missing build directories"
    exit 1
fi
print_success "Build completed"

# Step 2: Create environment bindings
print_status "Creating environment bindings..."
bindings=""

# Read from .env.local and create bindings
if [ -f ".env.local" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
            name=$(echo "$line" | cut -d '=' -f 1)
            value=$(echo "$line" | cut -d '=' -f 2-)
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/')
            bindings+="--binding ${name}=${value} "
        fi
    done < .env.local
    print_success "Environment bindings created from .env.local"
else
    print_warning "No .env.local found - using default bindings"
    # Create minimal safe bindings
    bindings="--binding RUNNING_IN_DOCKER=false --binding DEFAULT_NUM_CTX=4096"
fi

# Step 3: Deploy with bindings
print_status "Deploying to Cloudflare Pages..."
print_status "Using bindings: $bindings"

# Deploy using wrangler with bindings
if npx wrangler pages deploy --project-name=8a965697.yousef-bdp.pages.dev $bindings; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🌐 Your site should now be accessible at:"
    echo "   https://8a965697.yousef-bdp.pages.dev"
    echo ""
    echo "🔍 Test the health endpoint:"
    echo "   https://8a965697.yousef-bdp.pages.dev/api/health"
    echo ""
    echo "📊 Check Cloudflare dashboard for deployment status"
else
    echo "❌ Deployment failed"
    echo ""
    echo "💡 Alternative deployment methods:"
    echo "1. Use Cloudflare Dashboard:"
    echo "   - Go to Workers & Pages → Your project"
    echo "   - Click 'Deploy' and upload your build files"
    echo ""
    echo "2. Use GitHub Actions (recommended):"
    echo "   - Push your code to GitHub"
    echo "   - Set up GitHub Actions for automatic deployment"
    echo ""
    echo "3. Manual deployment:"
    echo "   - Run 'npx wrangler login' on your local machine"
    echo "   - Then run this script again"
    exit 1
fi

print_success "Deployment process completed!"