# NedaPay Merchant Portal - System Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        A1[Mobile Browser]
    end

    subgraph "Frontend - Next.js 15 App Router"
        B[Landing Page]
        C[Dashboard]
        D[Payment Links]
        E[Invoice Management]
        F[Ramps/Off-Ramp]
        G[Compliance/KYC-KYB]
        H[Analytics]
        I[Settings]
    end

    subgraph "Authentication & State Management"
        J[Privy Auth Provider]
        J1[Wagmi Provider]
        J2[React Query Client]
        J3[Theme Provider]
        J4[Middleware - Route Protection]
    end

    subgraph "API Layer - Next.js API Routes"
        K[/api/user]
        L[/api/payment-links]
        M[/api/send-invoice]
        N[/api/transactions]
        O[/api/kyc]
        P[/api/kyb]
        Q[/api/idrxco]
        R[/api/paycrest]
        S[/api/notifications]
        T[/api/referral]
        U[/api/settings]
        V[/api/sumsub]
        W[/api/ens]
        X[/api/cookie-consent]
    end

    subgraph "Database Layer"
        Y[(PostgreSQL Database)]
        Z[Prisma ORM]
        Z1[Upstash Redis Cache]
        Z2[Supabase Real-time]
    end

    subgraph "Blockchain Layer"
        AA[Wagmi/Viem Client]
        AB[Ethers.js Provider]
        AC[Multi-Chain RPC Config]
        AD[Smart Contracts]
    end

    subgraph "Supported Networks"
        AE[Base Mainnet]
        AF[Arbitrum One]
        AG[Polygon]
        AH[BNB Chain]
        AI[Celo]
        AJ[Scroll]
        AK[Optimism]
    end

    subgraph "Smart Contract Ecosystem"
        AL[NedaPay Protocol Contract]
        AM[ERC-20 Token Contracts]
        AN[Aerodrome DEX]
        AO[Account Abstraction]
    end

    subgraph "External Services"
        AP[Sumsub KYC/KYB]
        AQ[IDRX Off-Ramp]
        AR[Paycrest Off-Ramp]
        AS[EmailJS/Resend/Mailtrap]
        AT[Coinbase OnchainKit]
        AU[Across Protocol Bridge]
        AV[Biconomy Gasless]
    end

    subgraph "Deployment & Infrastructure"
        AW[Vercel Platform]
        AX[GitHub Integration]
        AY[Edge Functions]
        AZ[Vercel Analytics]
    end

    A --> B
    A1 --> B
    B --> J
    J --> J1
    J --> J2
    J --> J3
    J4 --> C
    J4 --> D
    J4 --> E
    J4 --> F
    J4 --> G
    J4 --> H
    J4 --> I

    C --> K
    C --> N
    C --> S
    D --> L
    E --> M
    F --> Q
    F --> R
    G --> O
    G --> P
    G --> V
    H --> N
    I --> U
    I --> X

    K --> Z
    L --> Z
    M --> Z
    N --> Z
    O --> Z
    P --> Z
    Q --> Z
    R --> Z
    S --> Z
    T --> Z
    U --> Z
    V --> Z
    W --> AA
    X --> Z

    Z --> Y
    Z --> Z1
    Z --> Z2

    J1 --> AA
    AA --> AB
    AB --> AC
    AC --> AE
    AC --> AF
    AC --> AG
    AC --> AH
    AC --> AI
    AC --> AJ
    AC --> AK

    AE --> AD
    AF --> AD
    AG --> AD
    AH --> AD
    AI --> AD
    AJ --> AD
    AK --> AD

    AD --> AL
    AD --> AM
    AD --> AN
    AD --> AO

    O --> AP
    P --> AP
    V --> AP
    Q --> AQ
    R --> AR
    M --> AS
    AA --> AT
    AA --> AU
    AA --> AV

    AX --> AW
    B --> AW
    C --> AW
    AW --> AY
    AW --> AZ

    style A fill:#e1f5ff
    style A1 fill:#e1f5ff
    style J fill:#fff3e0
    style Y fill:#f3e5f5
    style AA fill:#e8f5e9
    style AL fill:#fff9c4
    style AP fill:#fce4ec
    style AW fill:#e0f2f1
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph "User Actions"
        UA[Connect Wallet]
        UB[Create Payment Link]
        UC[Send Invoice]
        UD[Off-Ramp to Fiat]
        UE[Complete KYC/KYB]
    end

    subgraph "Authentication Flow"
        AF1[Privy Login]
        AF2[Wallet Connection]
        AF3[Session Cookie]
        AF4[Middleware Check]
    end

    subgraph "Payment Processing"
        PP1[Generate Payment Link]
        PP2[Calculate Protocol Fee]
        PP3[Execute Blockchain Tx]
        PP4[Store Transaction]
        PP5[Send Notification]
    end

    subgraph "Off-Ramp Flow"
        OR1[Select Provider]
        OR2[Verify KYC Status]
        OR3[Submit Off-Ramp Request]
        OR4[Process via IDRX/Paycrest]
        OR5[Update Status]
    end

    subgraph "Compliance Flow"
        CF1[Start KYC/KYB]
        CF2[Upload Documents]
        CF3[Sumsub Verification]
        CF4[Webhook Processing]
        CF5[Update User Status]
    end

    UA --> AF1
    AF1 --> AF2
    AF2 --> AF3
    AF3 --> AF4
    AF4 --> UB
    AF4 --> UC
    AF4 --> UD
    AF4 --> UE

    UB --> PP1
    PP1 --> PP2
    PP2 --> PP3
    PP3 --> PP4
    PP4 --> PP5

    UC --> PP1

    UD --> OR1
    OR1 --> OR2
    OR2 --> OR3
    OR3 --> OR4
    OR4 --> OR5

    UE --> CF1
    CF1 --> CF2
    CF2 --> CF3
    CF3 --> CF4
    CF4 --> CF5

    style UA fill:#bbdefb
    style PP3 fill:#c8e6c9
    style OR4 fill:#fff9c4
    style CF3 fill:#f8bbd0
```

## Database Schema Architecture

```mermaid
erDiagram
    User ||--o{ ApiKey : has
    User ||--|| MerchantSettings : has
    User ||--o{ SumsubApplication : has
    User ||--o{ Referral : has
    User ||--o| InfluencerProfile : has
    User ||--o| CookieConsent : has
    User ||--o| IdrxOnboarded : has

    Transaction ||--o| Notification : triggers
    
    PaymentLink ||--o| Invoice : links
    
    Invoice ||--o{ InvoiceLineItem : contains
    
    SumsubApplication ||--o{ SumsubWebhookEvent : receives
    SumsubApplication ||--o{ SumsubReviewHistory : tracks
    
    BroadcastNotification ||--o{ Notification : creates

    User {
        string id PK
        string email UK
        string wallet UK
        string privyUserId UK
        datetime createdAt
        datetime updatedAt
        boolean isActive
        string name
    }

    MerchantSettings {
        string id PK
        string userId FK
        string businessName
        string businessEmail
        boolean autoSettlement
        float settlementThreshold
        boolean twoFactorEnabled
        string webhookUrl
    }

    ApiKey {
        string id PK
        string userId FK
        string keyId UK
        string hashedKey
        string environment
        boolean isActive
        datetime lastUsed
    }

    Transaction {
        string id PK
        string merchantId
        string wallet
        float amount
        string currency
        string status
        string txHash
        datetime createdAt
    }

    PaymentLink {
        string id PK
        string merchantId
        string url UK
        float amount
        string currency
        string status
        datetime createdAt
        datetime expiresAt
        string linkType
        string offRampType
    }

    Invoice {
        string id PK
        string merchantId
        string recipient
        string email
        datetime dueDate
        string currency
        float totalAmount
        string status
        datetime createdAt
    }

    InvoiceLineItem {
        string id PK
        string invoiceId FK
        string description
        float amount
    }

    SumsubApplication {
        string id PK
        string userId FK
        string applicantId UK
        string inspectionId UK
        string levelName
        string verificationStatus
        string reviewAnswer
        datetime createdAt
    }

    SumsubWebhookEvent {
        string id PK
        string sumsubApplicationId FK
        string correlationId UK
        string eventType
        json payload
        boolean processed
    }

    Notification {
        string id PK
        string message
        string recipient
        string type
        string status
        datetime createdAt
    }

    InfluencerProfile {
        string id PK
        string userId FK
        string displayName
        string customCode UK
        int totalReferrals
    }

    Referral {
        string id PK
        string privyUserId FK
        string influencerCode
        datetime createdAt
    }

    IdrxOnboarded {
        string id PK
        string userId FK
        int idrxId
        string apiKeyEnc
        string apiSecretEnc
    }

    CookieConsent {
        string id PK
        string privyUserId FK
        string region
        json preferences
        datetime consentedAt
    }
```

## Multi-Chain Stablecoin Architecture

```mermaid
graph TB
    subgraph "Stablecoin Support Matrix"
        SC1[USDC - 7 Chains]
        SC2[USDT - 7 Chains]
        SC3[cNGN - 3 Chains]
        SC4[ZARP - 2 Chains]
        SC5[IDRX - 3 Chains]
        SC6[EURC - 1 Chain]
        SC7[CADC - 1 Chain]
        SC8[BRL - 1 Chain]
        SC9[TRYB - 1 Chain]
        SC10[NZDD - 1 Chain]
        SC11[MXNe - 1 Chain]
    end

    subgraph "Chain Distribution"
        CH1[Base: 11 Tokens]
        CH2[Arbitrum: 2 Tokens]
        CH3[Polygon: 5 Tokens]
        CH4[BNB Chain: 4 Tokens]
        CH5[Celo: 2 Tokens]
        CH6[Scroll: 2 Tokens]
        CH7[Optimism: 2 Tokens]
    end

    subgraph "Token Operations"
        OP1[Balance Tracking]
        OP2[Token Swapping]
        OP3[Cross-Chain Bridge]
        OP4[Fee Calculation]
    end

    SC1 --> CH1
    SC1 --> CH2
    SC1 --> CH3
    SC1 --> CH4
    SC1 --> CH5
    SC1 --> CH6
    SC1 --> CH7

    SC2 --> CH1
    SC2 --> CH2
    SC2 --> CH3
    SC2 --> CH4
    SC2 --> CH5
    SC2 --> CH6
    SC2 --> CH7

    SC3 --> CH1
    SC3 --> CH3
    SC3 --> CH4

    SC4 --> CH1
    SC4 --> CH3

    SC5 --> CH1
    SC5 --> CH3
    SC5 --> CH4

    SC6 --> CH1
    SC7 --> CH1
    SC8 --> CH1
    SC9 --> CH1
    SC10 --> CH1
    SC11 --> CH1

    CH1 --> OP1
    CH1 --> OP2
    CH1 --> OP3
    CH1 --> OP4

    style SC1 fill:#e3f2fd
    style SC2 fill:#e3f2fd
    style CH1 fill:#fff3e0
    style OP2 fill:#c8e6c9
```

## Security & Compliance Architecture

```mermaid
flowchart TB
    subgraph "Security Layers"
        SL1[Route Middleware Protection]
        SL2[JWT Token Authentication]
        SL3[API Key Management]
        SL4[2FA Support]
        SL5[Cookie-Based Sessions]
    end

    subgraph "Compliance System"
        CS1[KYC Individual]
        CS2[KYB Business]
        CS3[Document Upload]
        CS4[Sumsub Integration]
        CS5[Webhook Processing]
        CS6[Status Tracking]
    end

    subgraph "Data Protection"
        DP1[AES-GCM Encryption]
        DP2[Bcrypt Hashing]
        DP3[Secure API Keys]
        DP4[GDPR Cookie Consent]
        DP5[Audit Trails]
    end

    subgraph "Smart Contract Security"
        SC1[ReentrancyGuard]
        SC2[Pausable]
        SC3[Ownable]
        SC4[Input Validation]
        SC5[Safe Transfers]
    end

    SL1 --> SL2
    SL2 --> SL3
    SL3 --> SL4
    SL4 --> SL5

    CS1 --> CS3
    CS2 --> CS3
    CS3 --> CS4
    CS4 --> CS5
    CS5 --> CS6

    SL3 --> DP2
    CS3 --> DP1
    SL5 --> DP4
    CS6 --> DP5

    SC1 --> SC2
    SC2 --> SC3
    SC3 --> SC4
    SC4 --> SC5

    style SL1 fill:#ffebee
    style CS4 fill:#f3e5f5
    style DP1 fill:#e8f5e9
    style SC1 fill:#fff3e0
```

## Payment Link Types & Features

```mermaid
graph TB
    subgraph "Payment Link Types"
        PL[Payment Link System]
    end

    subgraph "NORMAL Payment Links"
        N1[Flexible Amount]
        N2[Optional Currency]
        N3[Optional Chain Selection]
        N4[Open or Fixed Amount]
        N5[QR Code Generation]
        N6[Expiration Date]
        N7[Multi-Chain Support]
    end

    subgraph "OFF_RAMP Payment Links"
        O1[Fixed Amount Required]
        O2[Fixed Currency Required]
        O3[Off-Ramp Type Selection]
        O4[PHONE Number]
        O5[BANK_ACCOUNT Details]
        O6[Provider Selection]
        O7[Account Name Required]
        O8[Auto Fiat Conversion]
    end

    subgraph "Common Features"
        C1[HMAC Signature Security]
        C2[Rate Limiting]
        C3[Link Validation]
        C4[Dynamic Fee Calculation]
        C5[Transaction Tracking]
        C6[Status Management]
    end

    PL --> N1
    PL --> O1

    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7

    O1 --> O2
    O2 --> O3
    O3 --> O4
    O3 --> O5
    O4 --> O6
    O5 --> O6
    O6 --> O7
    O7 --> O8

    N7 --> C1
    O8 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6

    style PL fill:#e3f2fd
    style N1 fill:#c8e6c9
    style O1 fill:#fff9c4
    style C1 fill:#f3e5f5
```

## Payment Processing Flow

```mermaid
sequenceDiagram
    participant Merchant
    participant Frontend
    participant API
    participant Redis
    participant Protocol
    participant Blockchain
    participant Database
    participant Payer

    Note over Merchant,Database: Payment Link Creation Flow

    Merchant->>Frontend: Create Payment Link
    Frontend->>Frontend: Select Link Type<br/>(NORMAL or OFF_RAMP)
    
    alt NORMAL Payment Link
        Frontend->>Frontend: Optional: Set Amount/Currency/Chain
        Frontend->>Frontend: Set Expiration Date
    else OFF_RAMP Payment Link
        Frontend->>Frontend: Set Amount (Required)
        Frontend->>Frontend: Set Currency (Required)
        Frontend->>Frontend: Select Off-Ramp Type<br/>(PHONE or BANK_ACCOUNT)
        Frontend->>Frontend: Enter Off-Ramp Details
    end

    Frontend->>API: POST /api/payment-links
    API->>Redis: Check Rate Limit
    Redis-->>API: Rate Limit OK
    API->>API: Validate Input<br/>(merchantId, amount, linkType)
    API->>API: Generate HMAC Signature
    API->>Database: Store Payment Link
    Database-->>API: Link Created
    API-->>Frontend: Payment Link URL + QR Code
    Frontend-->>Merchant: Display Link & QR

    Note over Payer,Database: Payment Execution Flow

    Payer->>Frontend: Access Payment Link
    Frontend->>API: GET /api/payment-links/validate/[id]
    API->>Redis: Check Rate Limit
    API->>Database: Fetch Payment Link
    Database-->>API: Link Data
    API->>API: Validate Link Status
    API->>API: Check Expiration
    API->>API: Verify HMAC Signature
    
    alt Link Type: OFF_RAMP
        API->>API: Validate Off-Ramp Config<br/>(type, value, provider)
        API-->>Frontend: Valid OFF_RAMP Link
        Frontend->>Payer: Show Off-Ramp Details
        Payer->>Frontend: Review & Confirm
        Frontend->>Protocol: Calculate Dynamic Fee<br/>(0.2%-1.0% based on amount)
        Protocol-->>Frontend: Fee Breakdown
        Frontend->>Blockchain: Approve Token Spend
        Blockchain-->>Frontend: Approval Confirmed
        Frontend->>Blockchain: Execute Transfer via Protocol
        Blockchain->>Protocol: Process Payment + Fee
        Protocol->>Blockchain: Transfer to Merchant
        Protocol->>Blockchain: Transfer Fee to Treasury
        Blockchain-->>Frontend: Transaction Hash
        Frontend->>API: POST /api/transactions
        API->>Database: Store Transaction
        Frontend->>API: Trigger Off-Ramp Order
        API-->>Frontend: Off-Ramp Initiated
    else Link Type: NORMAL
        API-->>Frontend: Valid NORMAL Link
        Frontend->>Payer: Show Payment Details
        Payer->>Frontend: Select Chain/Token<br/>(if not pre-set)
        Payer->>Frontend: Enter Amount<br/>(if open amount)
        Payer->>Frontend: Confirm Payment
        Frontend->>Protocol: Calculate Dynamic Fee
        Protocol-->>Frontend: Fee Breakdown
        Frontend->>Blockchain: Approve Token Spend
        Blockchain-->>Frontend: Approval Confirmed
        Frontend->>Blockchain: Execute Transfer via Protocol
        Blockchain->>Protocol: Process Payment + Fee
        Protocol->>Blockchain: Transfer to Merchant
        Protocol->>Blockchain: Transfer Fee to Treasury
        Blockchain-->>Frontend: Transaction Hash
        Frontend->>API: POST /api/transactions
        API->>Database: Store Transaction
    end

    API->>Database: Update Link Status
    Database-->>API: Status Updated
    API-->>Frontend: Payment Confirmed
    Frontend-->>Payer: Success Message
    Frontend-->>Merchant: Notification Sent
```

## Off-Ramp Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant KYC
    participant Provider
    participant Database

    User->>Frontend: Request Off-Ramp
    Frontend->>API: Check KYC Status
    API->>KYC: Verify Compliance
    KYC-->>API: Status OK
    API-->>Frontend: Proceed

    Frontend->>API: Submit Off-Ramp Request
    API->>Provider: IDRX/Paycrest API
    Provider-->>API: Order Created
    API->>Database: Store Transaction
    Database-->>API: Confirmed
    API-->>Frontend: Order Status

    Provider->>API: Webhook Update
    API->>Database: Update Status
    API->>Frontend: Real-time Update
    Frontend-->>User: Funds Received
```

## Technology Stack Layers

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph subGraph0["Presentation Layer"]
        PL1["Next.js App Router"]
        PL2["React + TypeScript"]
        PL3["Tailwind CSS"]
        PL4["shadcn/ui Components"]
    end
    
    subgraph subGraph1["State Management"]
        SM1["React Query/TanStack"]
        SM2["Wagmi Hooks"]
        SM3["Privy Context"]
        SM4["Custom Hooks"]
    end
    
    subgraph subGraph2["Blockchain Layer"]
        BL1["Privy Authentication"]
        BL2["Wagmi"]
        BL3["Viem"]
        BL4["Coinbase OnchainKit"]
        BL5["Biconomy AA"]
    end
    
    subgraph subGraph3["Backend Services"]
        BS1["Next.js API Routes"]
        BS2["Prisma ORM"]
        BS3["PostgreSQL Database"]
        BS4["Upstash Redis Cache"]
    end
    
    subgraph subGraph4["External Integrations"]
        EI1["Sumsub KYC/KYB"]
        EI2["IDRX Off-Ramp"]
        EI3["Paycrest Off-Ramp"]
        EI4["Email Services"]
        EI5["Across Protocol Bridge"]
        EI6["ENS Service"]
    end
    
    subgraph subGraph5["Deployment & CI/CD"]
        DP1["GitHub Repository"]
        DP2["Vercel Platform"]
        DP3["Vercel Analytics"]
        DP4["Environment Branches"]
    end
    
    %% Vertical architectural flow
    subGraph0 --> subGraph1
    subGraph1 --> subGraph2
    subGraph1 --> subGraph3
    subGraph2 --> subGraph3
    subGraph3 --> subGraph4
    
    %% CI/CD pipeline
    DP1 --> DP2
    DP2 --> subGraph0
    
    style PL1 fill:#e3f2fd
    style BL1 fill:#e8f5e9
    style BS1 fill:#fff3e0
    style EI1 fill:#f3e5f5
    style DP2 fill:#e0f2f1
```

## API Endpoint Structure

```mermaid
graph LR
    subgraph "API Routes"
        API[/api]
    end

    subgraph "User Management"
        API --> U1[/user]
        API --> U2[/settings]
        API --> U3[/cookie-consent]
    end

    subgraph "Payment Operations"
        API --> P1[/payment-links]
        API --> P2[/send-invoice]
        API --> P3[/transactions]
    end

    subgraph "Compliance"
        API --> C1[/kyc - 11 endpoints]
        API --> C2[/kyb - 6 endpoints]
        API --> C3[/sumsub - 3 endpoints]
    end

    subgraph "Off-Ramp Providers"
        API --> O1[/idrxco - 10 endpoints]
        API --> O2[/paycrest - 3 endpoints]
    end

    subgraph "Utilities"
        API --> UT1[/ens]
        API --> UT2[/notifications - 3 endpoints]
        API --> UT3[/referral - 5 endpoints]
        API --> UT4[/admin]
    end

    style API fill:#e1f5ff
    style C1 fill:#fff3e0
    style O1 fill:#f3e5f5
```

---

## Architecture Highlights

### Core Capabilities
- **Multi-Chain Support**: 7 blockchain networks with automatic failover
- **11 Stablecoins**: Global and regional currency support
- **Dynamic Fee Structure**: 0.2% - 1.0% based on transaction size
- **Real-Time Processing**: WebSocket notifications and live updates
- **Enterprise Security**: Multi-layer authentication and encryption

### Deployment Strategy

**Vercel Deployment**
- GitHub integration with automatic deployments
- Environment branches (development, staging, production)
- Serverless function deployment
- Edge computing optimization
- CDN distribution

### Scalability Features
- **Database Optimization**: Connection pooling and Redis caching
- **Microservices Ready**: Modular API structure

### Compliance & Security
- **KYC/KYB Integration**: Sumsub-powered verification
- **Audit Trails**: Complete transaction history
- **2FA Support**: Enhanced account security
- **Smart Contract Security**: OpenZeppelin standards

### Integration Ecosystem
- **Wallet Support**: MetaMask, Coinbase, WalletConnect, Embedded Wallets
- **DEX Integration**: Aerodrome for token swapping
- **Cross-Chain Bridge**: Across Protocol integration
- **Account Abstraction**: Biconomy gasless transactions
- **Off-Ramp Partners**: IDRX (Indonesia), Paycrest (Africa)
