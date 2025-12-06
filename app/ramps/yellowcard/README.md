# Yellow Card On-Ramp & Off-Ramp Integration

Complete implementation of Yellow Card Direct Settlement API for crypto on-ramp and off-ramp functionality.

## Overview

This integration enables NedaPay users to:
- **Buy Crypto (On-Ramp)**: Deposit local fiat currency and receive crypto directly to their wallet
- **Sell Crypto (Off-Ramp)**: Send crypto and receive local fiat in their bank/mobile money account

## Features

✅ **Multi-Country Support**: Nigeria, Kenya, Ghana, Uganda, Tanzania, South Africa, and more  
✅ **Multiple Payment Channels**: Bank transfers, Mobile Money  
✅ **Multiple Cryptocurrencies**: USDT, USDC, BTC, ETH  
✅ **Multiple Networks**: TRC20, ERC20, POLYGON, BASE, LIGHTNING  
✅ **Direct Settlement**: Crypto sent directly to user's wallet  
✅ **Real-time Rates**: Live exchange rates from Yellow Card  
✅ **Webhook Notifications**: Real-time status updates  
✅ **Secure Authentication**: HMAC-SHA256 signature generation  

## Architecture

### Directory Structure

```
app/ramps/yellowcard/
├── README.md                    # This file
├── components/
│   └── OnRampFlow.tsx          # On-ramp UI component
└── hooks/                       # React hooks (future)

app/utils/yellowcard/
├── index.ts                     # Main exports
├── types.ts                     # TypeScript types
├── config.ts                    # Configuration
├── signature.ts                 # HMAC authentication
└── service.ts                   # API service layer

app/api/yellowcard/
├── channels/route.ts            # GET payment channels
├── networks/route.ts            # GET networks (banks, mobile money)
├── rates/route.ts               # GET exchange rates
├── collection/route.ts          # POST/GET collection (on-ramp)
├── payment/route.ts             # POST/GET payment (off-ramp)
└── webhook/route.ts             # POST webhook handler
```

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
YELLOWCARD_API_KEY=your_api_key
YELLOWCARD_SECRET_KEY=your_secret_key
YELLOWCARD_ENV=sandbox  # or 'production'
```

See [YELLOWCARD_ENV_SETUP.md](../../../docs/YELLOWCARD_ENV_SETUP.md) for detailed setup instructions.

### 2. Database Setup (Optional)

Add to your Prisma schema for transaction persistence:

```prisma
model YellowCardTransaction {
  id              String   @id @default(cuid())
  privyUserId     String
  type            String   // "collection" or "payment"
  yellowCardId    String   @unique
  sequenceId      String   @unique
  status          String
  currency        String
  amount          Decimal
  cryptoCurrency  String
  cryptoAmount    Decimal?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [privyUserId], references: [privyUserId])
  
  @@index([privyUserId])
}
```

### 3. Usage in Your App

```tsx
import { OnRampFlow } from '@/ramps/yellowcard/components/OnRampFlow';

export default function OnRampPage() {
  return <OnRampFlow />;
}
```

## API Endpoints

### Public Endpoints

#### GET `/api/yellowcard/channels`
Get available payment channels.

**Query Parameters:**
- `country` (optional): ISO 3166-2 code (e.g., "NG", "KE")
- `type` (optional): "collection" or "payment"

**Example:**
```bash
curl http://localhost:3000/api/yellowcard/channels?country=NG&type=collection
```

#### GET `/api/yellowcard/networks`
Get available networks (banks, mobile money providers).

**Query Parameters:**
- `country` (optional): ISO 3166-2 code
- `channelId` (optional): Filter by channel

#### GET `/api/yellowcard/rates`
Get current exchange rates.

**Query Parameters:**
- `country` (optional): ISO 3166-2 code
- `currency` (optional): Currency code (e.g., "NGN")

### Authenticated Endpoints

These require `Authorization: Bearer {privy_jwt_token}` header.

#### POST `/api/yellowcard/collection`
Create on-ramp transaction (fiat → crypto).

**Request Body:**
```json
{
  "recipient": {
    "name": "John Doe",
    "country": "NG",
    "phone": "+2348012345678",
    "address": "123 Main St, Lagos",
    "dob": "01/15/1990",
    "idNumber": "A12345678",
    "idType": "passport"
  },
  "source": {
    "accountType": "bank",
    "accountNumber": "0123456789"
  },
  "channelId": "ch_123",
  "amount": 50000,
  "currency": "NGN",
  "country": "NG",
  "reason": "investment",
  "walletAddress": "0x...",
  "cryptoCurrency": "USDT",
  "cryptoNetwork": "TRC20"
}
```

#### POST `/api/yellowcard/payment`
Create off-ramp transaction (crypto → fiat).

**Request Body:**
```json
{
  "sender": {
    "name": "John Doe",
    "country": "NG",
    "address": "123 Main St",
    "dob": "01/15/1990",
    "email": "john@example.com",
    "idNumber": "A12345678",
    "idType": "passport"
  },
  "destination": {
    "accountName": "John Doe",
    "accountNumber": "0123456789",
    "accountType": "bank",
    "networkId": "net_456"
  },
  "channelId": "ch_123",
  "currency": "NGN",
  "country": "NG",
  "reason": "salary",
  "cryptoCurrency": "USDT",
  "cryptoNetwork": "TRC20",
  "cryptoAmount": 100
}
```

#### POST `/api/yellowcard/webhook`
Webhook endpoint for Yellow Card status updates.

**Note:** This endpoint validates webhook signatures and processes events automatically.

## User Flows

### On-Ramp (Buy Crypto)

1. **Select Country & Channel** → User chooses country and payment method
2. **Enter Amount** → User enters fiat amount, sees estimated crypto
3. **Select Network** → User chooses their bank/mobile money provider
4. **Enter Details** → User provides personal info and wallet address
5. **Review** → User confirms transaction details
6. **Make Deposit** → User transfers fiat to provided bank account
7. **Receive Crypto** → Yellow Card sends crypto to user's wallet

### Off-Ramp (Sell Crypto)

1. **Select Country & Channel** → User chooses country and payment method
2. **Enter Crypto Amount** → User enters crypto amount, sees estimated fiat
3. **Select Network** → User chooses destination bank/mobile money account
4. **Enter Details** → User provides sender and destination details
5. **Review** → User confirms transaction details
6. **Send Crypto** → User sends crypto to Yellow Card's wallet
7. **Receive Fiat** → Yellow Card sends fiat to user's account

## Webhook Events

Yellow Card sends webhooks for transaction status updates:

- `COLLECTION.CREATED` - Collection request created
- `COLLECTION.PROCESSING` - User deposit received, processing
- `COLLECTION.COMPLETE` - Crypto sent to user's wallet
- `COLLECTION.FAILED` - Transaction failed
- `COLLECTION.CANCELLED` - Transaction cancelled

- `PAYMENT.CREATED` - Payment request created
- `PAYMENT.PROCESSING` - Crypto received, processing payout
- `PAYMENT.COMPLETE` - Fiat sent to user's account
- `PAYMENT.FAILED` - Transaction failed
- `PAYMENT.CANCELLED` - Transaction cancelled

## Security

### Authentication
- All API requests use HMAC-SHA256 authentication
- Signatures generated with `YcHmacV1` scheme
- Timestamps in ISO8601 format

### Webhook Verification
- Signature verification via `X-YC-Signature` header
- Optional IP whitelisting for production
- Base64-encoded SHA256 HMAC

### Best Practices
- Never commit API keys to version control
- Use environment variables for credentials
- Separate sandbox and production keys
- Rotate keys regularly
- Use HTTPS for all requests

## Testing

### Sandbox Mode

```bash
# Set environment to sandbox
YELLOWCARD_ENV=sandbox

# Use sandbox credentials
YELLOWCARD_API_KEY=yk_sandbox_...
YELLOWCARD_SECRET_KEY=...
```

### Test Countries
- Nigeria (NG, NGN)
- Kenya (KE, KES)
- Ghana (GH, GHS)

### Test Transactions

```bash
# Test channels endpoint
curl http://localhost:3000/api/yellowcard/channels?country=NG

# Test collection (requires auth token)
curl -X POST http://localhost:3000/api/yellowcard/collection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": "Additional details (dev mode only)"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing auth token
- `MISSING_FIELDS` - Required fields missing
- `FETCH_CHANNELS_ERROR` - Failed to fetch channels
- `COLLECTION_ERROR` - Failed to create collection
- `PAYMENT_ERROR` - Failed to create payment
- `INTERNAL_ERROR` - Server error

## Supported Countries

| Country | Code | Currency |
|---------|------|----------|
| Nigeria | NG | NGN |
| Kenya | KE | KES |
| Ghana | GH | GHS |
| Uganda | UG | UGX |
| Tanzania | TZ | TZS |
| South Africa | ZA | ZAR |
| Zambia | ZM | ZMW |
| Rwanda | RW | RWF |
| Cameroon | CM | XAF |
| Côte d'Ivoire | CI | XOF |
| Senegal | SN | XOF |
| Botswana | BW | BWP |

## Documentation

- [Complete Integration Guide](../../../docs/YELLOWCARD_INTEGRATION.md)
- [Environment Setup Guide](../../../docs/YELLOWCARD_ENV_SETUP.md)
- [Yellow Card Official Docs](https://docs.yellowcard.engineering)

## Support

- **Yellow Card Support**: support@yellowcard.io
- **Yellow Card Documentation**: https://docs.yellowcard.engineering
- **API Status**: https://status.yellowcard.io

## Troubleshooting

See the [Integration Guide](../../../docs/YELLOWCARD_INTEGRATION.md#troubleshooting) for common issues and solutions.

## License

This integration is part of the NedaPay merchant portal. Contact your technical lead for licensing information.
