# Offramp System Flow Diagram

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                      (WithdrawTab Component)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ User Selections
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OFFRAMP CONTEXT                                │
│  ┌────────────┬────────────┬────────────┬────────────┬──────────┐  │
│  │  Country   │   Chain    │   Token    │   Amount   │  Address │  │
│  └────────────┴────────────┴────────────┴────────────┴──────────┘  │
│                     Single Source of Truth                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Provider Selection
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROVIDER REGISTRY                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  selectProvider(country, chain, token)                       │  │
│  │    ↓                                                         │  │
│  │  • Check all registered providers                           │  │
│  │  • Filter by capabilities                                   │  │
│  │  • Sort by priority                                         │  │
│  │  • Return best match                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐   ┌───────────────────────┐
        │  PAYRAMP PROVIDER     │   │   IDRX PROVIDER       │
        │  ┌─────────────────┐  │   │  ┌─────────────────┐  │
        │  │ • Tanzania      │  │   │  │ • Indonesia     │  │
        │  │ • Kenya         │  │   │  │ • Base Chain    │  │
        │  │ • Uganda        │  │   │  │ • USDC Only     │  │
        │  │ • Nigeria       │  │   │  │                 │  │
        │  │ • Base/Arb/Poly │  │   │  │ RedeemForm      │  │
        │  │ • USDC/USDT     │  │   │  │                 │  │
        │  │                 │  │   │  └─────────────────┘  │
        │  │ OffRampForm     │  │   │                       │
        │  │ (TZS/KES/UGX)   │  │   │                       │
        │  └─────────────────┘  │   └───────────────────────┘
        └───────────────────────┘
```

## 📋 Detailed User Flow

### Step 1: Selection Phase (Shared)

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: SELECTIONS                       │
└─────────────────────────────────────────────────────────────┘

User Action                     System Response
───────────                     ───────────────

1. Select Country              → Store in OfframpContext
   (Tanzania)                    context.setCountry(tanzania)
                                 
2. Select Chain                → Store in OfframpContext
   (Base)                        context.setChain(base)
                                 
3. Select Token                → Store in OfframpContext
   (USDC)                        context.setToken('USDC')
                                 
4. Click "Continue"            → Trigger Provider Selection
                                 
                                 registry.selectProvider(
                                   'tanzania',
                                   8453,
                                   'USDC'
                                 )
                                 
                                 Result: Payramp Provider
                                 
                                 context.setProvider(payramp)
                                 
                                 Auto-derive currency:
                                 currencyCode = 'TZS'
```

### Step 2: Provider Routing

```
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: PROVIDER SELECTION                     │
└─────────────────────────────────────────────────────────────┘

Registry Logic:
──────────────

Input: { country: 'tanzania', chain: 8453, token: 'USDC' }

1. Get all enabled providers
   → [Payramp, IDRX]

2. Filter by supports()
   → Payramp.supports('tanzania', 8453, 'USDC') = true ✓
   → IDRX.supports('tanzania', 8453, 'USDC') = false ✗
   
   Filtered: [Payramp]

3. Sort by priority
   → Payramp (priority: 10)
   
4. Select first (highest priority)
   → Selected: Payramp

5. Return result
   → {
       provider: Payramp,
       alternatives: [],
       reason: "Selected Payramp (highest priority)"
     }
```

### Step 3: Form Rendering

```
┌─────────────────────────────────────────────────────────────┐
│               STEP 3: FORM RENDERING                        │
└─────────────────────────────────────────────────────────────┘

Provider renders form with context:

OfframpContext:
  country: { id: 'tanzania', name: 'Tanzania', ... }
  chain: { id: 8453, name: 'Base', ... }
  token: 'USDC'
  amount: ''
  userAddress: '0x123...'
  currencyCode: 'TZS'  ← Auto-derived!

Payramp.renderForm(context):
  ↓
  <OffRampForm
    chain={context.chain}
    token={context.token}
    preselectedCurrency="TZS"  ← From context!
    onBack={context.onBack}
  />

Form displays:
  ✓ Chain: Base (from context)
  ✓ Token: USDC (from context)
  ✓ Currency: TZS (auto-selected, read-only)
  ✓ Amount: [User input]
  ✓ Bank details: [User input]
```

## 🔄 State Management Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    STATE TRANSITIONS                           │
└────────────────────────────────────────────────────────────────┘

Initial State:
  country: null
  chain: null
  token: null
  amount: ''
  provider: null
  currencyCode: null

After Country Selection (Tanzania):
  country: { id: 'tanzania', ... }
  chain: null
  token: null
  amount: ''
  provider: null
  currencyCode: null

After Chain Selection (Base):
  country: { id: 'tanzania', ... }
  chain: { id: 8453, ... }
  token: null
  amount: ''
  provider: null
  currencyCode: null

After Token Selection (USDC):
  country: { id: 'tanzania', ... }
  chain: { id: 8453, ... }
  token: 'USDC'
  amount: ''
  provider: null
  currencyCode: null

After Provider Selection:
  country: { id: 'tanzania', ... }
  chain: { id: 8453, ... }
  token: 'USDC'
  amount: ''
  provider: PayrampProvider
  currencyCode: 'TZS'  ← Auto-derived!

After Amount Input:
  country: { id: 'tanzania', ... }
  chain: { id: 8453, ... }
  token: 'USDC'
  amount: '100'
  provider: PayrampProvider
  currencyCode: 'TZS'
```

## 🌍 Multi-Country Support

```
┌────────────────────────────────────────────────────────────────┐
│              COUNTRY → CURRENCY MAPPING                        │
└────────────────────────────────────────────────────────────────┘

Payramp Provider:
  Tanzania  → TZS (Tanzanian Shilling)
  Kenya     → KES (Kenyan Shilling)
  Uganda    → UGX (Ugandan Shilling)
  Nigeria   → NGN (Nigerian Naira)

IDRX Provider:
  Indonesia → IDR (Indonesian Rupiah)

Future Provider (e.g., Flutterwave):
  Ghana     → GHS (Ghanaian Cedi)
  Rwanda    → RWF (Rwandan Franc)
```

## 🔀 Provider Priority System

```
┌────────────────────────────────────────────────────────────────┐
│                 PROVIDER PRIORITY LOGIC                        │
└────────────────────────────────────────────────────────────────┘

Scenario: Nigeria + Base + USDC

Registered Providers:
  1. Payramp (priority: 10)
     ✓ Supports Nigeria
     ✓ Supports Base
     ✓ Supports USDC
     
  2. Flutterwave (priority: 8)
     ✓ Supports Nigeria
     ✓ Supports Base
     ✓ Supports USDC

Selection Result:
  Primary: Payramp (higher priority)
  Alternatives: [Flutterwave]
  
User sees: Payramp form
Future: Could show "Also available: Flutterwave" with comparison
```

## 🚦 Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                             │
└────────────────────────────────────────────────────────────────┘

Scenario 1: Unsupported Combination
  Input: Rwanda + Base + USDC
  
  Registry Check:
    Payramp.supports('rwanda', 8453, 'USDC') = false
    IDRX.supports('rwanda', 8453, 'USDC') = false
    
  Result:
    provider: null
    reason: "No provider supports rwanda/8453/USDC"
    
  UI Action:
    Show error toast
    Disable continue button
    Suggest alternative combinations

Scenario 2: Provider Validation Failure
  Input: Amount = 0.5 USDC (below minimum)
  
  Provider Validation:
    payramp.validate(context)
    → { valid: false, error: "Minimum amount is 1 USDC" }
    
  UI Action:
    Show validation error
    Highlight amount field
    Prevent submission

Scenario 3: Transaction Failure
  Provider executes transaction
  → Network error / API failure
  
  Provider catches error
  → Calls context.onError(error)
  
  UI Action:
    Show error message
    Offer retry option
    Keep form data intact
```

## 📊 Component Hierarchy

```
App
 └─ Providers
     ├─ OfframpProvider (Context)
     └─ WithdrawTab
         ├─ Step 1: Selection
         │   ├─ CountrySelector
         │   ├─ ChainSelector
         │   └─ TokenSelector
         │
         └─ Step 2: Form
             └─ [Provider.renderForm()]
                 ├─ Payramp → OffRampForm
                 │   ├─ Currency (auto-selected)
                 │   ├─ Amount Input
                 │   ├─ Bank Details
                 │   └─ Submit Button
                 │
                 └─ IDRX → RedeemForm
                     ├─ Amount Input
                     ├─ Redemption Details
                     └─ Submit Button
```

## 🎨 Data Structure

```typescript
// Complete context structure
{
  // User selections
  country: {
    id: 'tanzania',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'Tanzanian Shilling',
    currencySymbol: 'TSh',
    currencyCode: 'TZS',
    providers: ['payramp']
  },
  
  chain: {
    id: 8453,
    name: 'Base',
    icon: '/base-icon.png',
    tokens: ['USDC', 'USDT']
  },
  
  token: 'USDC',
  
  amount: '100',
  
  userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  
  // Auto-derived
  currencyCode: 'TZS',
  
  // Provider
  provider: PayrampProvider {
    id: 'payramp',
    name: 'Payramp',
    capabilities: { ... }
  },
  
  // Callbacks
  onBack: () => { /* Reset to step 1 */ },
  onSuccess: (txHash) => { /* Show success */ },
  onError: (error) => { /* Show error */ }
}
```

## 🔧 Extension Points

```
┌────────────────────────────────────────────────────────────────┐
│              HOW TO EXTEND THE SYSTEM                          │
└────────────────────────────────────────────────────────────────┘

1. Add New Provider:
   ├─ Create provider class implementing IOfframpProvider
   ├─ Define capabilities (countries, chains, tokens)
   ├─ Implement support logic
   ├─ Implement currency mapping
   ├─ Create provider-specific form
   └─ Register in initializeProviders.ts

2. Add New Country:
   ├─ Add to countries list
   ├─ Add currency mapping in provider
   ├─ Update provider capabilities
   └─ Test provider selection

3. Add New Chain:
   ├─ Add to SUPPORTED_CHAINS
   ├─ Update provider capabilities
   ├─ Test chain selection
   └─ Verify token support

4. Add New Token:
   ├─ Add to token list
   ├─ Update provider capabilities
   ├─ Add token contract addresses
   └─ Test token selection

5. Add Provider Comparison:
   ├─ Modify selectProvider to return all matches
   ├─ Create comparison UI component
   ├─ Fetch rates from all providers
   ├─ Display side-by-side comparison
   └─ Allow user to choose
```

---

**Legend:**
- `→` Data flow
- `✓` Success/Supported
- `✗` Failure/Not supported
- `[ ]` User input
- `{ }` System state
