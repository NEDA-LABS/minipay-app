# Memory Optimization Plan - NedaPay Merchant Portal

This document outlines the root causes of high RAM consumption during development and provides a step-by-step implementation plan to optimize memory usage.

---

## 🔍 Root Causes Identified

### 1. **Prisma Client Memory Leaks** (CRITICAL)
- **Issue**: Multiple API routes instantiate `new PrismaClient()` directly
- **Impact**: In development with HMR (Hot Module Replacement), each module reload creates a new Prisma client without closing the previous one, leading to connection leaks and memory bloat
- **Affected Files**: 40+ API routes and server components
  - `app/api/transactions/route.ts`
  - `app/api/settings/route.ts`
  - `app/api/kyc/*/route.ts`
  - `app/api/kyb/*/route.ts`
  - `app/api/referral/*/route.ts`
  - `app/invite/[code]/page.tsx`
  - And many more...

### 2. **Excessive Wagmi Chain Configuration** (HIGH)
- **Issue**: `app/providers.tsx` configures 8+ blockchain networks with 4-5 fallback RPC endpoints each
- **Impact**: Creates 30+ HTTP clients/watchers in memory, even when only testing on Base network in development
- **Current Config**:
  ```typescript
  chains: [base, polygon, bsc, arbitrum, celo, scroll, lisk, optimism]
  // Each with 4-5 fallback RPCs via fallback([http(...), http(...), ...])
  ```

### 3. **Large Transpilation Surface** (MEDIUM)
- **Issue**: `next.config.js` transpiles many large packages unnecessarily
- **Impact**: Turbopack must transpile all packages, increasing dev memory usage
- **Current Packages**:
  ```javascript
  transpilePackages: [
    'wagmi', 
    '@coinbase/onchainkit', 
    'viem', 
    'next-themes',
    'ethers',
    '@biconomy/abstractjs',
    '@biconomy/mexa'
  ]
  ```

### 4. **Excessive Node.js Polyfills** (MEDIUM)
- **Issue**: Webpack config injects multiple Node polyfills globally into client bundles
- **Impact**: Bloats client bundles and increases dev memory footprint
- **Current Polyfills**:
  - `crypto-browserify`
  - `stream-browserify`
  - `stream-http`
  - `https-browserify`
  - `os-browserify`
  - `path-browserify`
  - `buffer`

### 5. **Heavy UI Libraries Always Loaded** (MEDIUM)
- **Issue**: Large libraries loaded eagerly on every page navigation
- **Impact**: Increases initial bundle size and memory usage
- **Affected Components**:
  - **Recharts** (chart.js wrapper): Used in 5+ components
    - `app/analytics/Charts.tsx`
    - `app/dashboard/DailyRevenueChart.tsx`
    - `app/admin/components/OfframpTransactions.tsx`
    - `app/dashboard/referrals/components/Charts.tsx`
  - **OGL** (WebGL library): Used in `app/components/RippleGrid.tsx`
  - **jsPDF**: Used in `app/api/send-invoice/invoices/[id]/pdf/route.ts`

### 6. **Multiple Polling Intervals** (LOW)
- **Issue**: Several components use `setInterval` for polling
- **Impact**: Cumulative memory and CPU usage across multiple tabs/components
- **Examples**:
  - `app/components/pushNotificationsListener.tsx` - 30s interval
  - Various transaction status checkers with 5s intervals

---

## 🎯 Highest-Impact Fixes

### Fix #1: Implement Prisma Singleton Pattern ⭐⭐⭐
**Priority**: CRITICAL  
**Expected Impact**: 40-60% memory reduction in development

**Problem**: Every API route creates a new Prisma client, causing connection leaks during HMR.

**Solution**: Create a singleton instance that reuses the same client across HMR reloads.

**Implementation**:
1. Create `lib/prisma.ts` with dev-safe singleton
2. Replace all `new PrismaClient()` instances with singleton import
3. Ensure proper cleanup on process termination

---

### Fix #2: Optimize Wagmi Configuration for Development ⭐⭐⭐
**Priority**: HIGH  
**Expected Impact**: 20-30% memory reduction

**Problem**: Configuring 8 chains with 30+ RPC endpoints creates unnecessary HTTP clients in dev.

**Solution**: Keep all chains available but reduce fallback RPCs in development.

**Implementation**:
1. Detect environment in `app/providers.tsx`
2. Use all 8 chains with single RPC endpoint each in dev (8 connections)
3. Keep full fallback config for production (32+ connections)

---

### Fix #3: Reduce Transpilation Overhead ⭐⭐
**Priority**: MEDIUM  
**Expected Impact**: 10-15% memory reduction

**Problem**: Transpiling unnecessary packages increases Turbopack memory usage.

**Solution**: Only transpile packages that actually require transpilation.

**Implementation**:
1. Test build with minimal `transpilePackages` list
2. Add back only packages that cause build errors
3. Document why each package needs transpilation

---

### Fix #4: Minimize Node.js Polyfills ⭐⭐
**Priority**: MEDIUM  
**Expected Impact**: 5-10% memory reduction

**Problem**: Unnecessary polyfills bloat client bundles.

**Solution**: Only include polyfills that are actually needed by client code.

**Implementation**:
1. Audit which polyfills are actually used
2. Remove unused polyfills from webpack config
3. Test client-side functionality

---

### Fix #5: Lazy Load Heavy UI Components ⭐⭐
**Priority**: MEDIUM  
**Expected Impact**: 10-15% memory reduction on affected pages

**Problem**: Heavy libraries loaded on every page, even when not used.

**Solution**: Use Next.js dynamic imports with `ssr: false` for heavy components.

**Implementation**:
1. Wrap chart components with `next/dynamic`
2. Lazy load RippleGrid/OGL
3. Load only when component is visible

---

### Fix #6: Optimize Polling Intervals ⭐
**Priority**: LOW  
**Expected Impact**: 2-5% memory reduction

**Problem**: Multiple intervals running simultaneously consume memory and CPU.

**Solution**: Increase intervals, ensure proper cleanup, consider WebSockets.

**Implementation**:
1. Audit all `setInterval` usages
2. Increase durations where safe (30s → 60s)
3. Ensure cleanup in useEffect return functions

---

## 📋 Step-by-Step Implementation Plan

### Phase 1: Critical Fixes (Week 1)

#### Step 1.1: Create Prisma Singleton
**Files to Create/Modify**:
- Create: `lib/prisma.ts`

**Tasks**:
- [ ] Create singleton Prisma client with HMR-safe caching
- [ ] Add proper TypeScript types
- [ ] Add connection lifecycle logging
- [ ] Test with one API route first

**Estimated Time**: 30 minutes

---

#### Step 1.2: Refactor High-Traffic API Routes
**Files to Modify** (Priority Order):
1. `app/api/transactions/route.ts`
2. `app/api/settings/route.ts`
3. `app/api/payment-links/route.ts`
4. `app/api/payment-links/validate/[id]/route.ts`
5. `app/api/kyc/status/route.ts`
6. `app/api/kyb/status/route.ts`

**Tasks**:
- [ ] Replace `new PrismaClient()` with `import prisma from '@/lib/prisma'`
- [ ] Remove local PrismaClient imports
- [ ] Test each route after modification
- [ ] Monitor memory usage improvement

**Estimated Time**: 1-2 hours

---

#### Step 1.3: Refactor Remaining API Routes
**Files to Modify** (Batch Process):
- All files in `app/api/kyc/`
- All files in `app/api/kyb/`
- All files in `app/api/referral/`
- All files in `app/api/send-invoice/`
- All files in `app/api/notifications/`
- `app/invite/[code]/page.tsx`

**Tasks**:
- [ ] Create script to find all `new PrismaClient()` instances
- [ ] Batch replace with singleton import
- [ ] Run full test suite
- [ ] Verify no connection errors

**Estimated Time**: 2-3 hours

---

#### Step 1.4: Optimize Wagmi Configuration ✅
**Files to Modify**:
- `app/providers.tsx`

**Tasks**:
- [x] Add environment detection
- [x] Create dev config with all chains, single RPC each
- [x] Create production config with all chains and fallback RPCs
- [ ] Test wallet connections in both environments
- [x] Document configuration differences

**Implementation Details**:
- **Development**: All 8 chains with single RPC endpoint each (8 chains, 8 RPCs)
- **Production**: All 8 chains with 4-5 fallback RPCs each (8 chains, 32+ RPCs)
- **Memory Reduction**: 75% fewer HTTP clients/watchers in development (32 → 8 connections)
- **Impact**: All chains remain available for testing, but with reduced memory footprint

**Estimated Time**: 1 hour → **Completed**

---

### Phase 2: Medium-Impact Optimizations (Week 2)

#### Step 2.1: Reduce Transpilation Packages
**Files to Modify**:
- `next.config.js`

**Tasks**:
- [ ] Comment out all `transpilePackages`
- [ ] Add back one by one, testing build after each
- [ ] Document which packages require transpilation and why
- [ ] Update configuration

**Estimated Time**: 2 hours

---

#### Step 2.2: Minimize Node.js Polyfills
**Files to Modify**:
- `next.config.js`

**Tasks**:
- [ ] Audit client-side code for Node.js API usage
- [ ] Remove unused polyfills one by one
- [ ] Test client functionality after each removal
- [ ] Keep only essential polyfills
- [ ] Document why each remaining polyfill is needed

**Estimated Time**: 2 hours

---

#### Step 2.3: Lazy Load Chart Components
**Files to Modify**:
- `app/analytics/Charts.tsx`
- `app/dashboard/DailyRevenueChart.tsx`
- `app/admin/components/OfframpTransactions.tsx`
- `app/dashboard/referrals/components/Charts.tsx`

**Tasks**:
- [ ] Wrap each chart component with `next/dynamic`
- [ ] Add loading states
- [ ] Test chart rendering
- [ ] Verify memory improvement on dashboard pages

**Estimated Time**: 2 hours

---

#### Step 2.4: Lazy Load RippleGrid
**Files to Modify**:
- `app/components/HowItWorksSection.tsx`
- `app/components/RippleGrid.tsx`

**Tasks**:
- [ ] Convert RippleGrid to dynamic import
- [ ] Add fallback/loading state
- [ ] Test on landing page
- [ ] Verify OGL only loads when needed

**Estimated Time**: 30 minutes

---

### Phase 3: Fine-Tuning (Week 3)

#### Step 3.1: Optimize Polling Intervals
**Files to Audit**:
- `app/components/pushNotificationsListener.tsx`
- `app/(paymentLinks)/pay/[id]/OfframpPayment.tsx`
- `app/(paymentLinks)/pay/[id]/PayWithWallet.tsx`
- `app/components/StablecoinBalanceTracker.tsx`

**Tasks**:
- [ ] Audit all `setInterval` and `setTimeout` usages
- [ ] Increase intervals where safe (30s → 60s)
- [ ] Verify cleanup functions exist
- [ ] Consider WebSocket alternatives for real-time updates
- [ ] Add interval configuration via environment variables

**Estimated Time**: 2 hours

---

#### Step 3.2: Memory Profiling and Verification
**Tasks**:
- [ ] Establish baseline memory usage (before optimizations)
- [ ] Measure memory after each phase
- [ ] Document improvements
- [ ] Create memory monitoring script
- [ ] Add memory usage to CI/CD checks

**Estimated Time**: 2 hours

---

## 🧪 Testing Checklist

### After Each Fix:
- [ ] Development server starts without errors
- [ ] Hot Module Replacement works correctly
- [ ] No console errors in browser
- [ ] API routes respond correctly
- [ ] Wallet connections work
- [ ] Charts render properly
- [ ] Memory usage is reduced (measure with Activity Monitor/htop)

### Full Test Suite:
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` without errors
- [ ] Test all critical user flows:
  - [ ] User authentication
  - [ ] Payment link creation
  - [ ] Transaction viewing
  - [ ] Stablecoin swapping
  - [ ] Off-ramp functionality
  - [ ] KYC/KYB verification

---

## 📊 Expected Results

### Memory Usage Targets:

| Phase | Expected RAM Usage (Dev) | Improvement |
|-------|-------------------------|-------------|
| **Baseline** | ~2-3 GB | - |
| **After Phase 1** | ~1-1.5 GB | 40-50% |
| **After Phase 2** | ~800 MB - 1.2 GB | 60-65% |
| **After Phase 3** | ~700 MB - 1 GB | 65-70% |

### Build Time Targets:

| Phase | Expected Build Time | Improvement |
|-------|-------------------|-------------|
| **Baseline** | ~60-90s | - |
| **After Phase 2** | ~40-60s | 30-40% |

---

## 🛠️ Tools for Monitoring

### Memory Monitoring:
```bash
# Linux/Mac
htop
# or
top

# Node.js specific
node --inspect node_modules/.bin/next dev
# Then open chrome://inspect in Chrome
```

### Build Analysis:
```bash
# Analyze bundle size
npm run build
# Check .next/analyze/ folder

# Or use webpack-bundle-analyzer
ANALYZE=true npm run build
```

### Prisma Connection Monitoring:
```typescript
// Add to lib/prisma.ts
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Duration: ' + e.duration + 'ms')
})
```

---

## 📝 Notes

### Development vs Production:
- These optimizations primarily target **development** environment
- Production builds are already optimized by Next.js
- Some fixes (Prisma singleton, lazy loading) benefit both environments

### Turbopack vs Webpack:
- Current setup uses Turbopack: `next dev --turbopack`
- For comparison, try webpack: `next dev` (without --turbopack flag)
- Turbopack is generally faster but may use more memory initially

### Rollback Plan:
- Commit after each phase
- Tag stable versions
- Keep original code in comments during refactoring
- Document any breaking changes

---

## 🚀 Quick Start

To begin implementation:

1. **Create a new branch**:
   ```bash
   git checkout -b optimize/memory-usage
   ```

2. **Start with Phase 1, Step 1.1**:
   - Create `lib/prisma.ts`
   - Test with one API route
   - Measure memory improvement

3. **Proceed systematically**:
   - Complete each step before moving to next
   - Test thoroughly after each change
   - Document any issues or deviations

4. **Track progress**:
   - Check off completed tasks in this document
   - Note memory measurements
   - Document any unexpected findings

---

## 📞 Support

If you encounter issues during implementation:
- Check Next.js documentation: https://nextjs.org/docs
- Check Prisma best practices: https://www.prisma.io/docs/guides/performance-and-optimization
- Review Wagmi configuration: https://wagmi.sh/core/config

---

**Last Updated**: 2025-10-16  
**Status**: Ready for Implementation  
**Priority**: HIGH - Development experience significantly impacted
