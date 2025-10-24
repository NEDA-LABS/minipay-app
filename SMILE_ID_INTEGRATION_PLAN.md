# Smile ID KYC Integration Plan for NedaPay Merchant Portal

## Executive Summary

This document outlines the integration plan for implementing Smile ID KYC services in the NedaPay merchant portal, based on the existing implementation in the NEDA aggregator service and Smile ID's official documentation.

## Current State Analysis

### Existing Aggregator Implementation

The NEDA aggregator service already has a comprehensive Smile ID integration located at `/services/kyc/smile/` with the following components:

- **Service Implementation**: `index.go` - Complete KYC provider interface
- **ID Types Configuration**: `id_types.json` - 138KB configuration file with supported countries and verification methods
- **Schema Validation**: `id_types_schema.json` - JSON schema for ID types
- **Comprehensive Tests**: `index_test.go` and `id_types_test.go`

### Verification Types Supported

The aggregator supports two main verification methods:

1. **Document Verification** (`doc_verification`)
   - Used for most ID types across all countries
   - Verifies document authenticity and extracts information
   - No biometric matching required

2. **Biometric KYC** (`biometric_kyc`)
   - Currently supported for Nigerian documents:
     - BVN (Bank Verification Number)
     - NIN_SLIP (National Identity Number Slip)
     - V_NIN (Virtual National Identity Number)
   - Includes facial biometric matching with ID authority photos
   - Requires SmartSelfie™ capture

### Key Features in Aggregator

- **Smile Links Integration**: Creates verification URLs for users
- **Webhook Handling**: Processes verification results asynchronously
- **Signature Verification**: HMAC-SHA256 signature validation
- **Status Management**: Tracks verification states (pending, success, failed, expired)
- **Result Code Processing**: Comprehensive handling of 20+ result codes
- **Database Integration**: Uses Ent ORM with PostgreSQL

## Integration Architecture for NedaPay

### 1. Service Layer Architecture

```
NedaPay Merchant Portal
├── app/lib/kyc/
│   ├── smile-id/
│   │   ├── service.ts          # Main Smile ID service
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── config.ts           # Configuration management
│   │   ├── webhook-handler.ts  # Webhook processing
│   │   └── id-types.json       # Supported ID types
│   ├── providers/
│   │   ├── base-provider.ts    # Abstract KYC provider
│   │   └── smile-id-provider.ts # Smile ID implementation
│   └── index.ts                # KYC service factory
```

### 2. Database Schema Extensions

Extend existing Prisma schema to support KYC verification:

```prisma
model KYCVerification {
  id                String   @id @default(cuid())
  userId            String
  walletAddress     String   @unique
  platform          String   // "smile_id"
  platformRef       String   // Smile ID reference
  verificationUrl   String
  status            KYCStatus @default(PENDING)
  resultCode        String?
  resultText        String?
  documentType      String?
  country           String?
  verificationMethod String? // "doc_verification" | "biometric_kyc"
  expiresAt         DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id])
  
  @@map("kyc_verifications")
}

enum KYCStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
}
```

### 3. API Endpoints

#### REST API Routes

```typescript
// app/api/kyc/
├── request/route.ts           # POST /api/kyc/request
├── status/[address]/route.ts  # GET /api/kyc/status/[address]
├── webhook/route.ts           # POST /api/kyc/webhook
└── supported-types/route.ts   # GET /api/kyc/supported-types
```

#### Endpoint Specifications

1. **POST /api/kyc/request**
   - Initiates KYC verification
   - Creates Smile Link for user
   - Returns verification URL and expiry

2. **GET /api/kyc/status/[address]**
   - Checks verification status
   - Returns current state and results

3. **POST /api/kyc/webhook**
   - Receives Smile ID callbacks
   - Updates verification status
   - Validates webhook signatures

4. **GET /api/kyc/supported-types**
   - Returns available ID types by country
   - Filters by verification method

### 4. Frontend Integration

#### React Components

```typescript
// app/components/kyc/
├── KYCVerificationFlow.tsx    # Main verification flow
├── CountrySelector.tsx        # Country selection
├── IDTypeSelector.tsx         # ID type selection
├── VerificationStatus.tsx     # Status display
├── DocumentUpload.tsx         # Document capture (if needed)
└── BiometricCapture.tsx       # Selfie capture (for biometric KYC)
```

#### User Flow

1. **Initiation**: User clicks "Verify Identity"
2. **Country Selection**: Choose country of residence
3. **ID Type Selection**: Select from supported ID types
4. **Verification Method**: Automatic based on ID type
5. **Smile Link Redirect**: User completes verification on Smile ID
6. **Status Monitoring**: Real-time status updates
7. **Completion**: Success/failure notification

### 5. Configuration Management

#### Environment Variables

```env
# Smile ID Configuration
SMILE_ID_PARTNER_ID=your_partner_id
SMILE_ID_API_KEY=your_api_key
SMILE_ID_BASE_URL=https://api.smileidentity.com  # Production
SMILE_ID_SANDBOX_URL=https://testapi.smileidentity.com  # Sandbox

# Webhook Configuration
SMILE_ID_WEBHOOK_URL=https://your-domain.com/api/kyc/webhook
SMILE_ID_WEBHOOK_SECRET=your_webhook_secret

# KYC Settings
KYC_VERIFICATION_EXPIRY_HOURS=1
KYC_RETRY_LIMIT=3
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

1. **Database Schema Setup**
   - Add KYC tables to Prisma schema
   - Run migrations
   - Update seed data

2. **Service Layer Implementation**
   - Port Go service logic to TypeScript
   - Implement signature generation/validation
   - Create configuration management

3. **Basic API Endpoints**
   - Implement request and status endpoints
   - Add webhook handler
   - Set up error handling

### Phase 2: Frontend Integration (Week 3)

1. **React Components**
   - Build verification flow components
   - Implement country/ID type selectors
   - Create status monitoring UI

2. **User Experience**
   - Integrate with existing auth flow
   - Add verification requirements to onboarding
   - Implement responsive design

### Phase 3: Advanced Features (Week 4)

1. **Enhanced Verification**
   - Support for biometric KYC
   - Document quality validation
   - Retry mechanisms

2. **Admin Dashboard**
   - KYC verification management
   - Analytics and reporting
   - Manual review capabilities

### Phase 4: Testing & Deployment (Week 5)

1. **Comprehensive Testing**
   - Unit tests for all services
   - Integration tests for API endpoints
   - E2E tests for user flows

2. **Security Audit**
   - Webhook signature validation
   - Data encryption at rest
   - PII handling compliance

3. **Production Deployment**
   - Environment configuration
   - Monitoring and alerting
   - Performance optimization

## Technical Specifications

### Verification Methods Supported

#### Document Verification
- **Countries**: 50+ African countries
- **ID Types**: Passport, National ID, Driver's License, Voter ID, etc.
- **Process**: Document capture → OCR → Authority validation
- **Response Time**: 2-30 seconds (synchronous)

#### Biometric KYC (Nigeria Focus)
- **Supported IDs**: BVN, NIN, V_NIN
- **Process**: Document + Selfie → Biometric matching
- **Features**: Liveness detection, face matching
- **Response Time**: 30-60 seconds

### Result Codes Handling

#### Success Codes
- `0810`: Document Verified
- `1020`: Exact Match (Basic/Enhanced KYC)
- `1012`: Valid ID Number
- `0820`: Authentication Pass
- `0840`: Enrollment Pass

#### Failure Codes
- `0811`: No Face Match
- `0812`: Security Features Failed
- `1022`: No Match Found
- `1011`: Invalid ID Number
- `0921`: Face Not Found

### Security Considerations

1. **Signature Validation**
   - HMAC-SHA256 with timestamp
   - Prevents replay attacks
   - Validates webhook authenticity

2. **Data Protection**
   - PII encryption at rest
   - Secure transmission (HTTPS)
   - GDPR compliance measures

3. **Access Control**
   - Role-based permissions
   - Audit logging
   - Rate limiting

## Integration with Existing Systems

### Sumsub Migration Strategy

Since NedaPay currently uses Sumsub for KYC, the integration should:

1. **Parallel Operation**
   - Run both systems during transition
   - Allow users to choose verification method
   - Maintain existing Sumsub verifications

2. **Data Migration**
   - Map existing verification statuses
   - Preserve compliance records
   - Maintain audit trails

3. **Gradual Rollout**
   - Start with new users
   - Migrate existing users optionally
   - Monitor success rates

### Compliance Integration

1. **AML Screening**
   - Integrate with existing AML providers
   - Cross-reference verification results
   - Maintain compliance workflows

2. **Regulatory Reporting**
   - Generate compliance reports
   - Track verification metrics
   - Support regulatory audits

## Success Metrics

### Technical Metrics
- **Verification Success Rate**: >95%
- **API Response Time**: <2 seconds
- **Webhook Processing**: <1 second
- **System Uptime**: >99.9%

### Business Metrics
- **User Completion Rate**: >80%
- **Time to Verification**: <5 minutes
- **Customer Satisfaction**: >4.5/5
- **Compliance Score**: 100%

## Risk Mitigation

### Technical Risks
1. **API Downtime**: Implement retry mechanisms and fallback options
2. **Webhook Failures**: Queue-based processing with dead letter handling
3. **Performance Issues**: Caching and rate limiting strategies

### Business Risks
1. **Regulatory Changes**: Modular design for easy updates
2. **Provider Changes**: Abstract provider interface for easy switching
3. **Data Breaches**: End-to-end encryption and minimal data retention

## Conclusion

This integration plan leverages the proven implementation from the NEDA aggregator while adapting it to the NedaPay merchant portal's TypeScript/Next.js architecture. The phased approach ensures minimal disruption while providing comprehensive KYC capabilities that meet regulatory requirements and enhance user experience.

The implementation will support both document verification and biometric KYC, with particular strength in African markets, aligning with NedaPay's target demographic and regulatory environment.
