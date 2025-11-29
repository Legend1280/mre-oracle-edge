#!/bin/bash
# MRE Oracle - Vercel Deployment Script

set -e

echo "============================================"
echo "MRE Oracle - Vercel Edge Deployment"
echo "============================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔑 Your MRE API Key (save this!):"
echo "87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c"
echo ""
echo "⚠️  IMPORTANT: Save this key! You'll need it to:"
echo "   1. Configure Vercel environment variables"
echo "   2. Update your local frontend .env file"
echo ""

read -p "Press Enter to continue with deployment..."

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure Environment Variables in Vercel:"
echo "   Go to: https://vercel.com/dashboard"
echo "   → Select your project"
echo "   → Settings → Environment Variables"
echo "   → Add the following:"
echo ""
echo "   OPENAI_API_KEY = <your-openai-api-key>"
echo "   MRE_API_KEY = 87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c"
echo ""
echo "2. Redeploy to apply environment variables:"
echo "   vercel --prod"
echo ""
echo "3. Update local frontend .env file:"
echo "   Add to /home/ubuntu/Mirror/.env:"
echo "   VITE_ORACLE_API_URL=https://YOUR-DEPLOYMENT-URL.vercel.app/api/oracle/eval"
echo "   VITE_ORACLE_API_KEY=87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c"
echo ""
echo "4. Test the deployment:"
echo "   See README.md for curl test command"
echo ""
echo "============================================"
