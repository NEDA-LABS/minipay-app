# NedaPay Merchant Portal - Technical Architecture Overview

## Executive Summary

NedaPay is an enterprise-grade, multi-chain stablecoin payment platform built on Next.js 15 with comprehensive blockchain integration. The platform enables businesses and individuals to send, receive, manage, and convert cryptocurrency payments across multiple networks with integrated KYC/KYB compliance, fiat off-ramping, and advanced analytics.

## Architecture Overview

### Core Technology Stack

**Frontend Framework**
- **Next.js 15.3.0** with App Router architecture
- **React 19.0.0** with TypeScript for type safety
- **Tailwind CSS 4.1.8** for responsive design system
- **Framer Motion 12.16.0** for animations and micro-interactions

**Blockchain Integration Layer**
- **Wagmi 2.14.16** for wallet connection management
- **Viem 2.31.4** for modern Ethereum interactions
- **Ethers.js 5.8.0** for contract interactions
- **Coinbase OnchainKit 0.38.7** for enhanced Web3 functionality
- **Privy 3.0.1** for authentication and embedded wallets

**Database & ORM**
- **Prisma 6.14.0** ORM with PostgreSQL backend
- **Supabase** for real-time database operations
- **Upstash Redis 1.35.0** for caching and session management

**Security & Compliance**
- **Sumsub 2.3.19** for KYC/KYB verification
- **JWT authentication** with API key management
- **2FA support** with Speakeasy integration
- **Cookie consent management** for GDPR compliance

## System Architecture

### Multi-Chain Network Support

The platform supports 7 major blockchain networks with fallback RPC configurations:

```typescript
Supported Networks:
├── Base Mainnet (Primary)
├── Arbitrum One
├── Polygon Mainnet
├── BNB Smart Chain
├── Celo Mainnet
├── Scroll Mainnet
└── Optimism
```

**RPC Configuration Strategy:**
- Primary RPC endpoints with multiple fallbacks
- Automatic failover for network resilience
- Load balancing across providers (Alchemy, Infura, LlamaRPC, 1RPC)

### Database Schema Architecture

The system employs a comprehensive relational database schema with 15+ core entities:

#### Core Entities

**User Management**
- `User` - Core user profiles with Privy integration
- `MerchantSettings` - Business configuration and preferences
- `ApiKey` - API key management with environment separation

**Payment Processing**
- `PaymentLink` - Dynamic payment link generation
- `Invoice` - Professional invoicing system
- `Transaction` - Multi-chain transaction tracking
- `OffRampTransaction` - Fiat conversion tracking

**Compliance & Verification**
- `SumsubApplication` - KYC/KYB application tracking
- `SumsubWebhookEvent` - Webhook event processing
- `SumsubReviewHistory` - Compliance audit trail

**Notification System**
- `Notification` - User notifications
- `BroadcastNotification` - System-wide announcements

**Referral System**
- `InfluencerProfile` - Referral program management
- `Referral` - Referral tracking and rewards

### API Architecture

The platform implements a comprehensive RESTful API with 15+ endpoint categories:

```
/api/
├── admin/           # Administrative functions
├── cookie-consent/  # GDPR compliance
├── ens/            # ENS resolution
├── idrxco/         # IDRX integration (10 endpoints)
├── kyb/            # Business verification (6 endpoints)
├── kyc/            # Identity verification (11 endpoints)
├── notifications/  # Notification management (3 endpoints)
├── paycrest/       # Paycrest integration (3 endpoints)
├── payment-links/  # Payment link management (3 endpoints)
├── referral/       # Referral system (5 endpoints)
├── send-invoice/   # Invoice management (5 endpoints)
├── settings/       # User preferences (2 endpoints)
├── sumsub/         # Compliance integration (3 endpoints)
├── transactions/   # Transaction tracking
└── user/           # User management
```

### Authentication & Security

**Multi-Modal Authentication**
- Privy-powered wallet authentication
- Social login (Farcaster, email)
- Embedded wallet creation for new users
- External wallet support (MetaMask, Coinbase, WalletConnect)

**Security Features**
- JWT token-based authentication
- API key management with bcrypt hashing
- 2FA with TOTP support
- Wallet-based session management
- Cookie-based authentication state

**Middleware Protection**
```typescript
Protected Routes:
├── /dashboard/*
├── /payments/*
├── /payment-link/*
└── /stablecoins/*
```

## Core Features & Modules

### 1. Payment Processing Engine

**Payment Link Generation**
- Dynamic amount and currency specification
- QR code generation for mobile payments
- Expiration date management
- Multi-network support

**Invoice Management**
- Professional invoice creation
- Automated payment tracking
- Line item management
- Email delivery system

### 2. Multi-Chain Stablecoin Support

**Supported Stablecoins**
```
Global Stablecoins:
├── USDC (USD Coin)
├── USDT (Tether USD)
└── EURC (Euro Coin)

Regional Stablecoins:
├── cNGN (Nigerian Naira)
├── ZARP (South African Rand)
├── IDRX (Indonesian Rupiah)
├── CADC (Canadian Dollar)
├── BRL (Brazilian Real)
├── TRYB (Turkish Lira)
├── NZDD (New Zealand Dollar)
└── MXNe (Mexican Peso)
```

**DEX Integration**
- Aerodrome DEX integration for token swapping
- Real-time balance tracking across networks
- Automatic network detection and switching

### 3. Fiat Off-Ramping System

**Regional Providers**
- IDRX integration for Indonesian market
- Paycrest for African markets
- Bank account and mobile money support
- Competitive exchange rates with transparent fees

### 4. Compliance & Verification

**KYC/KYB Integration**
- Sumsub-powered verification
- Document upload and processing
- Real-time status tracking
- Webhook-based status updates

**Audit & Compliance**
- Transaction audit trails
- Compliance status tracking
- Document management
- Regulatory reporting capabilities

### 5. Analytics & Reporting

**Dashboard Analytics**
- Real-time transaction monitoring
- Revenue and spending tracking
- Payment link performance metrics
- Growth analytics and insights

**Export Capabilities**
- Transaction data export
- PDF report generation
- CSV data downloads

## Development & Deployment

### Build Configuration

**Next.js Configuration**
```javascript
Features:
├── TypeScript error bypassing for rapid development
├── ESLint error bypassing for builds
├── Webpack polyfills for crypto libraries
├── Package transpilation for Web3 libraries
├── Netlify deployment optimization
└── SVG and static asset handling
```

**Environment Management**
- Development/production environment separation
- Secure environment variable handling
- API key management
- Database connection configuration

### Deployment Strategy

**Netlify Deployment**
- Static site generation
- Serverless function deployment
- Edge computing optimization
- CDN distribution

**Docker Support**
- Multi-stage build configuration
- Container orchestration ready
- Health check implementation

## Integration Ecosystem

### Third-Party Integrations

**Blockchain Services**
- Coinbase OnchainKit for enhanced functionality
- Biconomy for gasless transactions
- Across Protocol for cross-chain bridging
- Rhinestone Module SDK for account abstraction

**Communication Services**
- EmailJS for client-side email
- Mailtrap for email testing
- Resend for production email delivery
- Nodemailer for server-side email

**Analytics & Monitoring**
- Vercel Analytics for performance monitoring
- Custom notification system
- Real-time transaction tracking

**UI/UX Libraries**
- Radix UI for accessible components
- Lucide React for icons
- React Hook Form for form management
- Recharts for data visualization

## Performance & Scalability

### Optimization Strategies

**Frontend Optimization**
- React 19 concurrent features
- Next.js App Router for optimal loading
- Image optimization and lazy loading
- Code splitting and dynamic imports

**Database Optimization**
- Prisma query optimization
- Database indexing strategy
- Connection pooling
- Caching layer with Redis

**Network Optimization**
- Multi-RPC fallback configuration
- Request batching for blockchain calls
- Efficient state management
- Optimistic UI updates

### Monitoring & Observability

**Error Tracking**
- Comprehensive error handling
- Custom error classes
- Audit logging for sensitive operations
- Performance monitoring

**Health Checks**
- Database connectivity monitoring
- RPC endpoint health checks
- Service availability monitoring

## Security Architecture

### Data Protection

**Encryption**
- AES-GCM encryption for sensitive data
- Secure API key storage
- JWT token management
- Cookie security configuration

**Access Control**
- Role-based access control
- API key-based authentication
- Wallet-based authorization
- Route protection middleware

### Compliance Features

**GDPR Compliance**
- Cookie consent management
- Data retention policies
- User data export capabilities
- Right to deletion implementation

**Financial Compliance**
- KYC/KYB verification workflows
- Transaction monitoring
- Audit trail maintenance
- Regulatory reporting capabilities

## Development Workflow

### Code Quality

**TypeScript Configuration**
- Strict mode enabled
- Comprehensive type definitions
- Path mapping for clean imports
- Modern ES2020 target

**Linting & Formatting**
- ESLint configuration
- Prettier code formatting
- Consistent code style enforcement

### Testing Strategy

**Testing Framework**
- Jest for unit testing
- Supertest for API testing
- Component testing setup
- Integration test structure

## Future Scalability Considerations

### Architecture Extensibility

**Microservices Ready**
- Modular API structure
- Service separation capabilities
- Independent scaling potential

**Multi-Tenant Support**
- User isolation
- Resource partitioning
- Scalable database design

**Global Expansion**
- Multi-region deployment ready
- Localization support
- Regional compliance adaptation

## Conclusion

NedaPay represents a sophisticated, production-ready stablecoin payment platform with enterprise-grade architecture. The system demonstrates advanced blockchain integration, comprehensive compliance features, and scalable design patterns suitable for global financial services deployment.

The platform's modular architecture, extensive security measures, and multi-chain support position it as a leading solution in the decentralized finance ecosystem, capable of serving both individual users and enterprise clients with professional-grade payment processing capabilities.

---

*This technical overview reflects the current state of the NedaPay merchant portal codebase as of the analysis date. The platform continues to evolve with new features and optimizations.*
