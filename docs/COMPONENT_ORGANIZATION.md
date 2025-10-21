# Component Organization Guide

## 🎯 Organizational Principles

### 1. **Feature-Based Structure**
Components are organized by feature/domain, not by type. This follows the principle of **colocation** - keeping related files together.

### 2. **Separation of Concerns**
- **Shared/Common components** → `app/components/` (UI primitives, layout)
- **Feature-specific components** → Within feature directory (e.g., `app/invoice/components/`)
- **Domain logic** → Colocated with components that use them

### 3. **Scalability**
Each feature is self-contained, making it easy to:
- Find related files
- Understand dependencies
- Refactor or remove features
- Onboard new developers

## 📁 New Directory Structure

```
app/
├── components/                          # Shared/Common Components Only
│   ├── ui/                             # Shadcn UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── layout/                         # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardTabs.tsx          # Main tab orchestrator
│   ├── animations/                     # Reusable animations
│   │   ├── AnimatedStat.tsx
│   │   ├── RippleGrid.tsx
│   │   └── EmptyDashboardAnimation.tsx
│   └── shared/                         # Truly shared business components
│       ├── ChainSwitcher.tsx
│       ├── WalletSelector.tsx
│       └── NotificationTab.tsx
│
├── invoice/                            # Invoice Feature
│   ├── components/                     # Invoice-specific components
│   │   ├── InvoiceTab.tsx             # Main tab component
│   │   ├── CreateInvoiceModal.tsx
│   │   ├── InvoiceTable.tsx           # Could extract table
│   │   ├── InvoiceStats.tsx           # Could extract stats
│   │   └── InvoiceFilters.tsx         # Could extract filters
│   ├── hooks/                          # Invoice-specific hooks
│   │   ├── useInvoices.ts
│   │   └── useInvoiceActions.ts
│   ├── types/                          # Invoice types
│   │   └── invoice.types.ts
│   ├── utils/                          # Invoice utilities
│   │   └── invoiceHelpers.ts
│   ├── [id]/                           # Invoice detail page
│   │   └── page.tsx
│   └── page.tsx                        # Invoice page (legacy, can deprecate)
│
├── ramps/                              # Offramp/Withdraw Feature
│   ├── components/                     # Ramp-specific components
│   │   ├── WithdrawTab.tsx            # Main tab component
│   │   ├── ChainSelector.tsx          # Chain selection UI
│   │   └── CountrySelector.tsx        # Country selection UI
│   ├── payramp/                        # Payramp provider
│   │   ├── components/
│   │   │   ├── OffRampForm.tsx
│   │   │   ├── FeeInfoPanel.tsx
│   │   │   ├── VerificationStep.tsx
│   │   │   └── SuccessMessage.tsx
│   │   ├── offrampHooks/
│   │   │   ├── useOfframp.ts
│   │   │   ├── constants.ts
│   │   │   └── tokenConfig.ts
│   │   └── PayrampProvider.tsx
│   ├── idrx/                           # IDRX provider
│   │   ├── components/
│   │   │   └── RedeemForm.tsx
│   │   └── IDRXProvider.tsx
│   ├── registry/                       # Provider registry
│   │   ├── OfframpProviderRegistry.ts
│   │   └── initializeProviders.ts
│   └── types/
│       └── offramp.types.ts
│
├── wallet/                             # Wallet Feature
│   ├── components/                     # Wallet-specific components
│   │   ├── WalletTab.tsx              # Main tab component
│   │   ├── WalletEmbeddedContent.tsx
│   │   ├── StablecoinBalanceTracker.tsx
│   │   └── WalletLoadingModel.tsx
│   ├── hooks/                          # Wallet-specific hooks
│   │   └── useWalletBalance.ts
│   └── utils/
│       └── walletHelpers.ts
│
├── payment-link/                       # Payment Link Feature
│   ├── components/
│   │   └── PaymentLinkTab.tsx         # To be created
│   └── page.tsx
│
├── bridge/                             # Bridge Feature
│   ├── components/
│   │   └── BridgeTab.tsx              # To be created
│   └── page.tsx
│
├── contexts/                           # Global contexts
│   ├── ChainContext.tsx
│   ├── OfframpContext.tsx
│   └── WalletContext.tsx
│
└── utils/                              # Global utilities
    ├── ensUtils.ts
    ├── paycrest.ts
    └── withDashboardLayout.tsx
```

## 🔄 Migration Plan

### Phase 1: Move Invoice Components ✅
```bash
# Move InvoiceTab to invoice feature
app/components/InvoiceTab.tsx → app/invoice/components/InvoiceTab.tsx

# Already exists:
app/invoice/components/CreateInvoiceModal.tsx
```

### Phase 2: Move Ramp Components ✅
```bash
# Move WithdrawTab to ramps feature
app/components/WithdrawTab.tsx → app/ramps/components/WithdrawTab.tsx

# Move ChainSelector to ramps feature
app/components/(wallet)/ChainSelector.tsx → app/ramps/components/ChainSelector.tsx

# Payramp components already organized:
app/ramps/payramp/components/OffRampForm.tsx
app/ramps/payramp/components/FeeInfoPanel.tsx
app/ramps/payramp/components/VerificationStep.tsx
app/ramps/payramp/components/SuccessMessage.tsx

# IDRX components:
app/ramps/idrxco/components/RedeemForm.tsx → app/ramps/idrx/components/RedeemForm.tsx
```

### Phase 3: Move Wallet Components ✅
```bash
# Create wallet feature directory
mkdir -p app/wallet/components

# Move wallet components
app/components/WalletTab.tsx → app/wallet/components/WalletTab.tsx
app/components/(wallet)/WalletEmbeddedContent.tsx → app/wallet/components/WalletEmbeddedContent.tsx
app/components/StablecoinBalanceTracker.tsx → app/wallet/components/StablecoinBalanceTracker.tsx
app/components/WalletLoadingModel.tsx → app/wallet/components/WalletLoadingModel.tsx
```

### Phase 4: Organize Shared Components ✅
```bash
# Create organized structure
mkdir -p app/components/layout
mkdir -p app/components/animations
mkdir -p app/components/shared

# Move layout components
app/components/Header.tsx → app/components/layout/Header.tsx
app/components/Footer.tsx → app/components/layout/Footer.tsx
app/components/DashboardTabs.tsx → app/components/layout/DashboardTabs.tsx

# Move animations
app/components/AnimatedStat.tsx → app/components/animations/AnimatedStat.tsx
app/components/RippleGrid.tsx → app/components/animations/RippleGrid.tsx
app/components/EmptyDashboardAnimation.tsx → app/components/animations/EmptyDashboardAnimation.tsx

# Move shared business components
app/components/ChainSwitcher.tsx → app/components/shared/ChainSwitcher.tsx
app/components/WalletSelector.tsx → app/components/shared/WalletSelector.tsx
app/components/NotificationTab.tsx → app/components/shared/NotificationTab.tsx
```

## 📋 Import Path Updates

### Before:
```typescript
import InvoiceTab from "@/components/InvoiceTab";
import WithdrawTab from "@/components/WithdrawTab";
import WalletTab from "@/components/WalletTab";
```

### After:
```typescript
import InvoiceTab from "@/invoice/components/InvoiceTab";
import WithdrawTab from "@/ramps/components/WithdrawTab";
import WalletTab from "@/wallet/components/WalletTab";
```

## 🎯 Benefits

### 1. **Better Organization**
- Features are self-contained
- Easy to find related files
- Clear ownership and boundaries

### 2. **Improved Maintainability**
- Changes to one feature don't affect others
- Easy to refactor or remove features
- Clear dependency graph

### 3. **Enhanced Scalability**
- Add new features without cluttering shared components
- Each feature can have its own structure
- Easy to split into micro-frontends later

### 4. **Better Developer Experience**
- Faster file navigation
- Clear mental model
- Easy onboarding for new developers

### 5. **Code Reusability**
- Truly shared components in `app/components/`
- Feature-specific components stay within feature
- Clear distinction between shared and specific

## 🔍 Decision Rules

### When to put a component in `app/components/`?
✅ **YES** if:
- Used by 3+ different features
- Pure UI component (buttons, cards, inputs)
- Layout component (header, footer)
- Animation/effect component

❌ **NO** if:
- Specific to one feature
- Contains feature-specific logic
- Only used within one domain

### When to create a new feature directory?
✅ **Create** when:
- Feature has its own page/route
- Feature has multiple related components
- Feature has specific business logic
- Feature might be extracted later

## 📊 Current vs New Structure

### Current (Flat):
```
app/components/
├── InvoiceTab.tsx              ❌ Feature-specific
├── WithdrawTab.tsx             ❌ Feature-specific
├── WalletTab.tsx               ❌ Feature-specific
├── ChainSelector.tsx           ❌ Feature-specific
├── Header.tsx                  ✅ Shared
├── Button.tsx                  ✅ Shared
└── ... (50+ files mixed)       😵 Hard to navigate
```

### New (Organized):
```
app/
├── components/                 ✅ Only shared components
│   ├── ui/                    ✅ UI primitives
│   ├── layout/                ✅ Layout components
│   ├── animations/            ✅ Reusable animations
│   └── shared/                ✅ Shared business components
├── invoice/components/         ✅ Invoice feature
├── ramps/components/           ✅ Ramp feature
└── wallet/components/          ✅ Wallet feature
```

## 🚀 Next Steps

1. ✅ Create feature directories
2. ✅ Move components to appropriate locations
3. ✅ Update all import paths
4. ✅ Test all features
5. ✅ Update documentation
6. ✅ Remove old files

## 📝 Notes

- Keep `app/components/ui/` for Shadcn components
- Keep backward compatibility during migration
- Update imports gradually
- Test after each move
- Document any breaking changes

---

**Status**: Ready for implementation
**Impact**: Low risk, high reward
**Effort**: Medium (mostly file moves and import updates)
