# Smile ID Environment Variables Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Smile ID Configuration
SMILE_ID_PARTNER_ID=your_partner_id_here
SMILE_ID_API_KEY=your_api_key_here
SMILE_ID_BASE_URL=https://testapi.smileidentity.com  # Use https://api.smileidentity.com for production
SMILE_ID_WEBHOOK_SECRET=your_webhook_secret_here

# App URL for webhook callbacks
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Or use VERCEL_URL for Vercel deployments
```

## Getting Smile ID Credentials

1. **Sign up for Smile ID**: Visit [Smile ID Portal](https://portal.usesmileid.com)
2. **Get Partner ID**: Found in your dashboard under API settings
3. **Get API Key**: Generate an API key in your dashboard
4. **Webhook Secret**: Optional but recommended for production security

## Environment Setup

### Development
```bash
SMILE_ID_BASE_URL=https://testapi.smileidentity.com
```

### Production
```bash
SMILE_ID_BASE_URL=https://api.smileidentity.com
```

## Webhook Configuration

The webhook URL will be automatically constructed as:
```
{NEXT_PUBLIC_APP_URL}/api/kyc/smile-id/webhook
```

Make sure to configure this URL in your Smile ID dashboard under webhook settings.

## Security Notes

- Never commit your API keys to version control
- Use different API keys for development and production
- Enable webhook signature verification in production
- Regularly rotate your API keys
