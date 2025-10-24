#!/bin/bash

# Smile ID Environment Setup Script for NedaPay
echo "🚀 Setting up Smile ID environment variables for sandbox testing..."

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Add Smile ID environment variables
echo "" >> .env.local
echo "# Smile ID KYC Configuration (Sandbox)" >> .env.local
echo "SMILE_ID_PARTNER_ID=your_partner_id_here" >> .env.local
echo "SMILE_ID_API_KEY=your_api_key_here" >> .env.local
echo "SMILE_ID_BASE_URL=https://testapi.smileidentity.com" >> .env.local
echo "SMILE_ID_WEBHOOK_SECRET=your_webhook_secret_here" >> .env.local
echo "" >> .env.local
echo "# App URL for webhook callbacks (update with your domain)" >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local

echo "✅ Environment variables added to .env.local"
echo ""
echo "📝 Next steps:"
echo "1. Get your Smile ID credentials from: https://portal.usesmileid.com"
echo "2. Replace 'your_partner_id_here' with your actual Partner ID"
echo "3. Replace 'your_api_key_here' with your actual API Key"
echo "4. Replace 'your_webhook_secret_here' with your webhook secret (optional for testing)"
echo "5. Update NEXT_PUBLIC_APP_URL with your actual domain when deploying"
echo ""
echo "🔧 For sandbox testing, you can use test credentials provided by Smile ID"
echo "📚 Check SMILE_ID_ENV_SETUP.md for detailed setup instructions"
