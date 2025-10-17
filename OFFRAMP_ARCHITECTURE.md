# Offramp Architecture - Multi-Provider Support

## Overview
This document outlines the scalable architecture for supporting multiple offramp providers (Payramp, IDRX, future providers) with shared selection logic and provider-specific implementations.

## Design Principles

### 1. **Separation of Concerns**
- Selection logic (country, chain, token, amount) is separated from provider-specific logic
- Each provider has its own implementation while sharing common interfaces

### 2. **Single Responsibility Principle**
- Each component has one clear responsibility
- Selection components don't know about provider details
- Provider components don't handle selection logic

### 3. **Open/Closed Principle**
- System is open for extension (new providers) but closed for modification
- Adding new providers doesn't require changing existing code

### 4. **Dependency Inversion**
- High-level modules depend on abstractions (interfaces)
- Provider implementations depend on the same abstractions

### 5. **DRY (Don't Repeat Yourself)**
- Common selection logic is centralized
- Provider-specific logic is isolated

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    WithdrawTab (Orchestrator)                │
│  - Manages overall flow                                      │
│  - Handles country/chain/token selection                     │
│  - Routes to appropriate provider                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              ▼                                 ▼
┌─────────────────────────────────────┐   ┌──────────────────────────────────┐
│     OfframpContext (State)          │   │   OfframpProviderRegistry        │
│  - Selected country                 │   │  - Available providers           │
│  - Selected chain                   │   │  - Provider capabilities         │
│  - Selected token                   │   │  - Provider routing logic        │
│  - Amount                           │   │                                  │
└─────────────────────────────────────┘   └──────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              ▼                                 ▼
┌─────────────────────────────────────┐   ┌──────────────────────────────────┐
│     PayrampProvider                 │   │     IDRXProvider                 │
│  - Implements IOfframpProvider      │   │  - Implements IOfframpProvider   │
│  - Payramp-specific logic           │   │  - IDRX-specific logic           │
│  - Supported countries: TZ, KE, etc │   │  - Supported countries: ID       │
│  - Supported tokens: USDC, USDT     │   │  - Supported tokens: USDC        │
└─────────────────────────────────────┘   └──────────────────────────────────┘
```

## Data Flow

### Step 1: Selection Phase (Shared)
```
User → Country Selection → Chain Selection → Token Selection → Amount Input
                                                                      │
                                                                      ▼
                                                          OfframpContext (State)
```

### Step 2: Provider Routing
```
OfframpContext → ProviderRegistry.getProvider(country, chain, token)
                                                │
                                                ▼
                                    Appropriate Provider Component
```

### Step 3: Provider Execution
```
Provider Component → Uses OfframpContext data → Provider-specific API calls
```

## File Structure

```
app/
├── components/
│   └── WithdrawTab.tsx                    # Main orchestrator
├── contexts/
│   └── OfframpContext.tsx                 # Shared state management
├── ramps/
│   ├── types/
│   │   └── offramp.types.ts              # Shared interfaces
│   ├── registry/
│   │   └── OfframpProviderRegistry.ts    # Provider registry
│   ├── payramp/
│   │   ├── PayrampProvider.tsx           # Payramp implementation
│   │   ├── PayrampForm.tsx               # Payramp-specific form
│   │   └── offrampHooks/                 # Payramp hooks
│   ├── idrx/
│   │   ├── IDRXProvider.tsx              # IDRX implementation
│   │   └── IDRXForm.tsx                  # IDRX-specific form
│   └── shared/
│       ├── CountrySelector.tsx           # Reusable country selector
│       ├── ChainSelector.tsx             # Reusable chain selector
│       └── AmountInput.tsx               # Reusable amount input
└── data/
    └── offramp-providers.ts              # Provider configurations
```

## Core Interfaces

### IOfframpProvider
```typescript
interface IOfframpProvider {
  id: string;
  name: string;
  supportedCountries: string[];
  supportedChains: number[];
  supportedTokens: string[];
  
  // Check if provider supports the combination
  supports(country: string, chain: number, token: string): boolean;
  
  // Get provider-specific currencies for a country
  getCurrencies(country: string): Currency[];
  
  // Render provider-specific form
  renderForm(context: OfframpContext): React.ReactNode;
}
```

### OfframpContext
```typescript
interface OfframpContext {
  // Selection data
  country: Country;
  chain: ChainConfig;
  token: string;
  amount: string;
  
  // Provider info
  provider: IOfframpProvider;
  
  // Actions
  updateAmount: (amount: string) => void;
  reset: () => void;
}
```

### Country
```typescript
interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  providers: string[]; // List of provider IDs that support this country
}
```

## Implementation Strategy

### Phase 1: Create Abstractions
1. Define `IOfframpProvider` interface
2. Create `OfframpContext` for shared state
3. Define `OfframpProviderRegistry` for provider management

### Phase 2: Refactor Existing Code
1. Extract Payramp logic into `PayrampProvider`
2. Extract IDRX logic into `IDRXProvider`
3. Update `WithdrawTab` to use registry

### Phase 3: Implement Provider Registry
1. Register all providers with their capabilities
2. Implement provider selection logic
3. Add provider validation

### Phase 4: Update UI Components
1. Pass `OfframpContext` to provider forms
2. Remove duplicate selection logic from providers
3. Auto-populate currency based on selected country

## Provider Registration Example

```typescript
// app/data/offramp-providers.ts
export const OFFRAMP_PROVIDERS = {
  payramp: {
    id: 'payramp',
    name: 'Payramp',
    supportedCountries: ['tanzania', 'kenya', 'uganda', 'nigeria'],
    supportedChains: [8453, 42161, 137], // Base, Arbitrum, Polygon
    supportedTokens: ['USDC', 'USDT', 'CNGN'],
    currencyMap: {
      tanzania: 'TZS',
      kenya: 'KES',
      uganda: 'UGX',
      nigeria: 'NGN'
    }
  },
  idrx: {
    id: 'idrx',
    name: 'IDRX',
    supportedCountries: ['indonesia'],
    supportedChains: [8453], // Base only
    supportedTokens: ['USDC'],
    currencyMap: {
      indonesia: 'IDR'
    }
  }
};
```

## Benefits

### 1. **Scalability**
- Add new providers by implementing `IOfframpProvider`
- No changes to existing code required

### 2. **Maintainability**
- Clear separation of concerns
- Easy to debug and test
- Provider-specific code is isolated

### 3. **Reusability**
- Selection components are reused across providers
- Common logic is centralized

### 4. **Type Safety**
- TypeScript interfaces ensure consistency
- Compile-time checks for provider implementations

### 5. **User Experience**
- No duplicate selections
- Seamless flow between selection and provider form
- Auto-population of known data

## Future Enhancements

1. **Provider Comparison**: Show multiple providers for same country/chain/token
2. **Best Rate Selection**: Automatically select provider with best rate
3. **Provider Fallback**: If one provider fails, try another
4. **Provider Analytics**: Track success rates per provider
5. **Dynamic Provider Loading**: Load provider code on-demand

## Migration Path

### Current State
- Selection logic mixed with provider logic
- Duplicate country/currency selection
- Hard to add new providers

### Target State
- Clean separation of selection and provider logic
- Single source of truth for selections
- Easy to add new providers via registry

### Migration Steps
1. Create new architecture files (no breaking changes)
2. Implement provider registry
3. Refactor one provider at a time
4. Remove old code once all providers migrated
5. Add tests for provider registry

## Testing Strategy

### Unit Tests
- Test each provider's `supports()` method
- Test provider registry routing logic
- Test context state management

### Integration Tests
- Test full flow from selection to provider form
- Test provider switching
- Test data persistence across steps

### E2E Tests
- Test complete withdrawal flow for each provider
- Test edge cases (unsupported combinations)
- Test error handling

## Conclusion

This architecture provides a solid foundation for supporting multiple offramp providers while maintaining code quality, scalability, and user experience. The separation of concerns ensures that adding new providers is straightforward and doesn't impact existing functionality.
