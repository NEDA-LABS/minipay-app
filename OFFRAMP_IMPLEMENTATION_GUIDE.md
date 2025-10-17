# Offramp Implementation Guide

## ✅ What Has Been Created

### 1. Architecture Documentation
- **File**: `OFFRAMP_ARCHITECTURE.md`
- **Purpose**: Complete architectural overview with design principles, data flow, and implementation strategy

### 2. Core Type Definitions
- **File**: `app/ramps/types/offramp.types.ts`
- **Purpose**: TypeScript interfaces for all offramp components
- **Key Interfaces**:
  - `IOfframpProvider` - Contract all providers must implement
  - `OfframpContext` - Shared state passed to providers
  - `Country`, `Currency` - Data structures
  - `ProviderCapabilities` - Provider metadata

### 3. Context Management
- **File**: `app/contexts/OfframpContext.tsx`
- **Purpose**: Centralized state management using React Context
- **Features**:
  - Single source of truth for selections
  - Auto-derives currency from country + provider
  - Prevents duplicate selections
  - Easy provider switching

### 4. Provider Registry
- **File**: `app/ramps/registry/OfframpProviderRegistry.ts`
- **Purpose**: Central registry for all providers
- **Features**:
  - Singleton pattern for global access
  - Provider registration with priorities
  - Smart provider selection
  - Support validation
  - Statistics and monitoring

### 5. Provider Implementations

#### Payramp Provider
- **File**: `app/ramps/payramp/PayrampProvider.tsx`
- **Supports**:
  - Countries: Tanzania, Kenya, Uganda, Nigeria
  - Chains: Base, Arbitrum, Polygon
  - Tokens: USDC, USDT, CNGN
- **Features**:
  - Auto-currency mapping (TZ→TZS, KE→KES, etc.)
  - Amount validation
  - Pre-selects currency in form

#### IDRX Provider
- **File**: `app/ramps/idrx/IDRXProvider.tsx`
- **Supports**:
  - Countries: Indonesia
  - Chains: Base
  - Tokens: USDC
- **Features**:
  - IDR currency support
  - Integration with RedeemForm

### 6. Provider Initialization
- **File**: `app/ramps/registry/initializeProviders.ts`
- **Purpose**: Bootstrap all providers at app startup
- **Features**:
  - Registers all providers
  - Sets priorities
  - Logs statistics

### 7. Enhanced OffRampForm
- **File**: `app/ramps/payramp/OffRampForm.tsx` (updated)
- **New Feature**: `preselectedCurrency` prop
- **Behavior**:
  - Auto-selects currency if provided
  - Shows read-only display for pre-selected currency
  - Falls back to dropdown if not pre-selected

## 🔄 Integration Steps

### Step 1: Initialize Providers at App Startup

Add to your root layout or providers file:

```typescript
// app/providers.tsx or app/layout.tsx
import { initializeOfframpProviders } from '@/app/ramps/registry/initializeProviders';

// Call once at app startup
useEffect(() => {
  initializeOfframpProviders();
}, []);
```

### Step 2: Wrap App with OfframpProvider

```typescript
// app/providers.tsx
import { OfframpProvider } from '@/app/contexts/OfframpContext';

export function Providers({ children }) {
  return (
    <OfframpProvider>
      {/* Other providers */}
      {children}
    </OfframpProvider>
  );
}
```

### Step 3: Update WithdrawTab to Use Registry

```typescript
// app/components/WithdrawTab.tsx
import { useOfframpContext } from '@/app/contexts/OfframpContext';
import { offrampRegistry } from '@/app/ramps/registry/OfframpProviderRegistry';

export default function WithdrawTab() {
  const offrampContext = useOfframpContext();
  
  // When country, chain, token are selected:
  const handleContinue = () => {
    // Set context
    offrampContext.setCountry(selectedCountry);
    offrampContext.setChain(selectedChain);
    offrampContext.setToken(selectedToken);
    offrampContext.setUserAddress(walletAddress);
    
    // Get appropriate provider
    const result = offrampRegistry.selectProvider(
      selectedCountry.id,
      selectedChain.id,
      selectedToken
    );
    
    if (result.provider) {
      offrampContext.setProvider(result.provider);
      setCurrentStep(2); // Move to form
    } else {
      // Show error: no provider supports this combination
      toast.error(result.reason);
    }
  };
  
  // In form step:
  const context = offrampContext.getContext();
  if (context && offrampContext.provider) {
    return offrampContext.provider.renderForm(context);
  }
}
```

## 📊 Data Flow Example

### User Journey: Tanzania → Base → USDC

```
1. User selects Tanzania
   ↓
2. User selects Base chain
   ↓
3. User selects USDC token
   ↓
4. Click "Continue to Withdrawal"
   ↓
5. Registry finds Payramp provider
   ↓
6. Context is populated:
   {
     country: { id: 'tanzania', name: 'Tanzania', ... },
     chain: { id: 8453, name: 'Base', ... },
     token: 'USDC',
     currencyCode: 'TZS' // Auto-derived
   }
   ↓
7. Payramp renders form with TZS pre-selected
   ↓
8. User enters amount and bank details
   ↓
9. Transaction submitted via Payramp
```

## 🎯 Benefits Achieved

### 1. No Duplicate Selections
✅ Country selected once → currency auto-populated
✅ Chain/token selected once → passed to provider
✅ User address captured once → reused

### 2. Scalability
✅ Add new provider: Create class implementing `IOfframpProvider`
✅ Register in `initializeProviders.ts`
✅ No changes to existing code

### 3. Maintainability
✅ Clear separation of concerns
✅ Provider-specific logic isolated
✅ Shared logic centralized

### 4. Type Safety
✅ TypeScript interfaces enforce contracts
✅ Compile-time validation
✅ IDE autocomplete support

### 5. Flexibility
✅ Multiple providers can support same country
✅ Priority-based selection
✅ Easy to add provider comparison UI

## 🚀 Adding a New Provider

### Example: Adding "FlutterwaveProvider"

```typescript
// 1. Create provider implementation
// app/ramps/flutterwave/FlutterwaveProvider.tsx

import { IOfframpProvider } from '../types/offramp.types';

class FlutterwaveProvider implements IOfframpProvider {
  id = 'flutterwave';
  name = 'Flutterwave';
  
  capabilities = {
    supportedCountries: ['nigeria', 'kenya', 'ghana'],
    supportedChains: [8453, 137], // Base, Polygon
    supportedTokens: ['USDC', 'USDT'],
  };
  
  supports(country, chain, token) {
    return (
      this.capabilities.supportedCountries.includes(country) &&
      this.capabilities.supportedChains.includes(chain) &&
      this.capabilities.supportedTokens.includes(token)
    );
  }
  
  getCurrencyCode(countryId) {
    const map = {
      nigeria: 'NGN',
      kenya: 'KES',
      ghana: 'GHS'
    };
    return map[countryId] || null;
  }
  
  getCurrencies(countryId) {
    // Return available currencies
  }
  
  renderForm(context) {
    return <FlutterwaveForm {...context} />;
  }
  
  validate(context) {
    // Validation logic
  }
}

export const flutterwaveProvider = new FlutterwaveProvider();
```

```typescript
// 2. Register in initializeProviders.ts

import { flutterwaveProvider } from '../flutterwave/FlutterwaveProvider';

export function initializeOfframpProviders() {
  // ... existing providers
  
  // Register Flutterwave (priority: 8)
  offrampRegistry.register(flutterwaveProvider, 8, true);
}
```

**That's it!** The new provider is now available and will be automatically selected for supported combinations.

## 🧪 Testing

### Unit Tests
```typescript
describe('FlutterwaveProvider', () => {
  it('should support Nigeria/Base/USDC', () => {
    expect(flutterwaveProvider.supports('nigeria', 8453, 'USDC')).toBe(true);
  });
  
  it('should return NGN for Nigeria', () => {
    expect(flutterwaveProvider.getCurrencyCode('nigeria')).toBe('NGN');
  });
});
```

### Integration Tests
```typescript
describe('Provider Registry', () => {
  it('should select Payramp for Tanzania', () => {
    const result = offrampRegistry.selectProvider('tanzania', 8453, 'USDC');
    expect(result.provider?.id).toBe('payramp');
  });
});
```

## 📝 Migration Checklist

- [x] Create type definitions
- [x] Create OfframpContext
- [x] Create Provider Registry
- [x] Implement Payramp Provider
- [x] Implement IDRX Provider
- [x] Create initialization script
- [x] Update OffRampForm to accept preselected currency
- [ ] Update WithdrawTab to use context and registry
- [ ] Add OfframpProvider to app providers
- [ ] Initialize providers at app startup
- [ ] Test full flow
- [ ] Remove old duplicate logic
- [ ] Add unit tests
- [ ] Update documentation

## 🎓 Key Principles Applied

1. **SOLID Principles**
   - Single Responsibility: Each component has one job
   - Open/Closed: Open for extension, closed for modification
   - Liskov Substitution: All providers are interchangeable
   - Interface Segregation: Clean, focused interfaces
   - Dependency Inversion: Depend on abstractions

2. **Design Patterns**
   - Registry Pattern: Central provider management
   - Strategy Pattern: Interchangeable provider implementations
   - Singleton Pattern: Single registry instance
   - Factory Pattern: Provider selection logic

3. **React Best Practices**
   - Context for state management
   - Custom hooks for logic reuse
   - Component composition
   - Props drilling prevention

## 🔮 Future Enhancements

1. **Provider Comparison UI**
   - Show multiple providers for same combination
   - Display fees, speed, limits
   - Let user choose

2. **Rate Comparison**
   - Fetch rates from all providers
   - Highlight best rate
   - Auto-select cheapest

3. **Provider Fallback**
   - If primary fails, try alternative
   - Automatic retry logic
   - User notification

4. **Analytics**
   - Track provider success rates
   - Monitor transaction times
   - Identify issues

5. **Dynamic Loading**
   - Load provider code on-demand
   - Reduce initial bundle size
   - Faster app startup

## 📞 Support

For questions or issues:
1. Check `OFFRAMP_ARCHITECTURE.md` for design details
2. Review type definitions in `offramp.types.ts`
3. Examine existing provider implementations
4. Test with provider registry utilities

---

**Status**: ✅ Core architecture complete and ready for integration
**Next Step**: Integrate with WithdrawTab component
