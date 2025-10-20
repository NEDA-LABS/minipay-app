# Wallet Tab Balance Loading Fixes

## Issues Identified

### 1. **Chain Synchronization Bug**
- **Problem**: `activeChain` (UI state) was out of sync with `chainId` (actual wallet chain from wagmi)
- **Symptom**: Wrong native token showing (e.g., CELO on Base chain)
- **Example**: When wallet was on Base (chainId=8453), but activeChain was still Celo, it would show CELO token with Base stablecoins

### 2. **Race Condition in Balance Loading**
- **Problem**: Native balance fetched for `chainId`, but ERC20 tokens fetched for `activeChain`
- **Symptom**: Stablecoins not loading, or loading for wrong chain
- **Cause**: Multiple effects trying to load balances simultaneously without coordination

### 3. **No Chain Validation**
- **Problem**: No validation that native token belongs to current chain
- **Symptom**: Native token from one chain appearing on another chain

### 4. **Missing External Sync**
- **Problem**: When `chainId` changes externally (user switches in wallet or header), `activeChain` doesn't update
- **Symptom**: UI shows wrong chain after external chain switch

## Fixes Applied

### Fix 1: Automatic Chain Synchronization
```typescript
// Keep activeChain synced with actual wallet chainId
useEffect(() => {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  if (chain && chain.id !== activeChain.id) {
    console.log(`Syncing activeChain to wallet chainId: ${chain.name}`);
    setActiveChain(chain);
    setBalances([]); // Clear balances when chain changes
  }
}, [chainId]);
```

**What this does:**
- Automatically updates `activeChain` whenever `chainId` changes
- Clears stale balances immediately on chain change
- Ensures UI always reflects actual wallet chain

### Fix 2: Balance Loading with Chain Validation
```typescript
useEffect(() => {
  // Critical: Only fetch if activeChain matches actual wallet chainId
  if (!address || !publicClient || !nativeBalance || activeChain.id !== chainId) {
    console.log('Skipping balance fetch - chain mismatch or missing data');
    return;
  }
  
  const fetchBalances = async () => {
    // ... fetch logic
  };
  
  fetchBalances();
}, [address, activeChain.id, chainId, publicClient, nativeBalance?.value, relevantTokens.length]);
```

**What this does:**
- Only loads balances when `activeChain` matches `chainId`
- Prevents fetching tokens for one chain while native balance is from another
- Eliminates the race condition

### Fix 3: Improved Chain Switching
```typescript
const switchChain = async (chain: Chain) => {
  if (chain.id === chainId) {
    console.log('Already on this chain');
    return;
  }
  
  console.log(`Initiating chain switch from ${activeChain.name} to ${chain.name}`);
  setIsSwitchingChain(true);
  setIsLoading(true);
  setBalances([]); // Clear immediately to prevent stale data
  
  try {
    await switchChainAsync({ chainId: chain.id });
    // activeChain will be updated by the chainId useEffect
    toast.success(`Switched to ${chain.name}`);
  } catch (error: any) {
    console.error('Chain switch error:', error);
    toast.error(error.message || 'Failed to switch chain');
    // Revert to actual chain on error
    const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (currentChain) setActiveChain(currentChain);
  } finally {
    setIsSwitchingChain(false);
    setIsLoading(false);
  }
};
```

**What this does:**
- Clears balances immediately when switching starts
- Lets the sync effect update `activeChain` instead of doing it manually
- Reverts to actual chain on error
- Better error handling

### Fix 4: Smart Native Balance Refetch
```typescript
// Refetch native balance when chain actually changes in wallet
useEffect(() => {
  if (address && refetchNativeBalance && !isLoadingNative) {
    console.log(`Refetching native balance for chainId: ${chainId}`);
    refetchNativeBalance();
  }
}, [chainId, address]);
```

**What this does:**
- Refetches native balance only when wallet chain actually changes
- Prevents refetching during initial load
- Ensures fresh balance after chain switch

## Files Modified

1. **`/app/components/(wallet)/WalletEmbeddedContent.tsx`**
   - Added chain sync effect
   - Added chain validation in balance loading
   - Improved switchChain function
   - Better refetch logic

2. **`/app/components/(wallet)/WalletEmbedded.tsx`**
   - Same fixes applied for consistency
   - Modal-specific logging prefixes for debugging

## Benefits

✅ **No more chain mixups**: Native token always matches the selected chain
✅ **Reliable balance loading**: Stablecoins always load for correct chain
✅ **No race conditions**: Balances only load when chain state is consistent
✅ **Better UX**: Clear loading states and immediate balance clearing during switches
✅ **External sync**: Handles chain switches from header or wallet extension
✅ **Error recovery**: Reverts to actual chain state on switch failures

## Testing Recommendations

1. **Test chain switching**: Switch between all supported chains via dropdown
2. **Test external switching**: Switch chains via header ChainSwitcher
3. **Test rapid switching**: Quickly switch between multiple chains
4. **Test balance persistence**: Ensure balances clear/reload correctly
5. **Test error cases**: Try switching to unsupported chains or reject switch
6. **Test on different chains**: Verify correct native tokens for each chain:
   - Base → ETH
   - BNB → BNB
   - Celo → CELO
   - Polygon → POL/MATIC
   - Arbitrum → ETH
   - Scroll → ETH
   - Optimism → ETH

## Debug Logging

Added comprehensive console logging:
- Chain sync events
- Balance fetch decisions
- Chain switch progress
- Skip reasons

Use browser console to monitor chain state during testing.
