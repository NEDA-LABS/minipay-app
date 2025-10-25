# Swap Debug Guide - CALL_EXCEPTION Error

## Error Details

```
call revert exception [See: https://links.ethers.org/v5-errors-CALL_EXCEPTION]
(method="getAmountsOut(uint256,address[])", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)
```

**What it means:** The router contract call returned empty data (`data="0x"`), indicating the call failed at the contract level.

## Root Causes (In Order of Likelihood)

### 1. ❌ Token Pair Doesn't Exist (Most Common)
**Symptoms:**
- Direct swap fails
- Multi-hop also fails
- No liquidity pool for the pair

**How to check:**
1. Open PancakeSwap/Uniswap website
2. Try the same swap manually
3. If it fails there too, the pair doesn't exist

**Solution:**
- Try a different token pair
- Use a token that has more liquidity
- Check if both tokens are on the chain

### 2. ❌ Wrong Token Address
**Symptoms:**
- Error shows invalid token address
- Console logs show malformed address

**How to check:**
1. Open browser console (F12)
2. Look for: `Invalid token addresses: from=..., to=...`
3. Verify addresses match official sources

**Solution:**
- Double-check token addresses in `stablecoins.ts`
- Verify on block explorer (BSCscan, Etherscan, etc.)
- Use official token addresses only

### 3. ❌ Wrong Router Address
**Symptoms:**
- All swaps fail on a specific chain
- Error happens immediately

**How to check:**
1. Check `dex-config.ts` for router address
2. Verify on block explorer
3. Ensure address is for correct DEX

**Solution:**
- Verify router address is correct
- Check it's not a proxy address
- Ensure it's the V2 router (not V3)

### 4. ❌ Insufficient Liquidity
**Symptoms:**
- Large amounts fail
- Small amounts might work
- Multi-hop fails too

**How to check:**
1. Try with smaller amount (e.g., 0.01 instead of 100)
2. Check pool liquidity on DEX website
3. Look at trading volume

**Solution:**
- Use smaller amounts
- Try different token pairs
- Wait for more liquidity

### 5. ❌ Wrong ABI
**Symptoms:**
- Function signature doesn't match
- Contract doesn't recognize method

**How to check:**
1. Verify router ABI matches DEX
2. Check function signature: `getAmountsOut(uint256,address[])`
3. Ensure it's not a different version

**Solution:**
- Update ABI if DEX changed
- Verify function signature
- Check DEX documentation

## Debugging Steps

### Step 1: Check Console Logs
Open browser console (F12) and look for detailed logs:

```
[PancakeSwap] Trying direct swap: 0x55d3... → 0x8AC7..., amount: 1000000000000000000
[PancakeSwap] Direct swap failed: No liquidity pool
[PancakeSwap] Trying multi-hop route: 0x55d3... → 0xbb4C... → 0x8AC7...
[PancakeSwap] Multi-hop swap succeeded, output: 999700000000000000
```

**What to look for:**
- Which DEX is being used
- Which tokens are being swapped
- Whether direct or multi-hop succeeded
- Exact error message

### Step 2: Verify Token Addresses

Check if token addresses are valid:

```javascript
// In browser console:
console.log('From Token:', fromTokenAddress);
console.log('To Token:', toTokenAddress);
console.log('Router:', routerAddress);
console.log('Chain ID:', chainId);
```

**Expected format:** `0x` followed by 40 hex characters

### Step 3: Test on DEX Website

1. Go to PancakeSwap (for BSC), Uniswap (for Ethereum), etc.
2. Try the exact same swap
3. If it fails there, the pair doesn't exist
4. If it works there, there's an issue with our implementation

### Step 4: Check Router Address

Verify the router address is correct:

```javascript
// In browser console:
// For BSC PancakeSwap V2:
// Should be: 0x10ED43C718714eb63d5aA57B78B54704E256024E

// Check on BSCscan:
// https://bscscan.com/address/0x10ED43C718714eb63d5aA57B78B54704E256024E
```

### Step 5: Verify Token Exists on Chain

```javascript
// Check token contract exists:
// https://bscscan.com/address/0x55d398326f99059fF775485246999027B3197955
// (USDT on BSC)

// Look for:
// - Contract name matches token
// - Has balanceOf function
// - Has approve function
```

## Common Error Messages Explained

### "Invalid token addresses: from=..."
**Cause:** Token address format is wrong
**Fix:** Ensure address is `0x` + 40 hex chars

### "Cannot swap token to itself"
**Cause:** From and To tokens are the same
**Fix:** Select different tokens

### "Amount must be greater than 0"
**Cause:** Amount is 0 or empty
**Fix:** Enter a valid amount

### "Token addresses are required"
**Cause:** One or both tokens not selected
**Fix:** Select both tokens

### "Swap not supported on chain..."
**Cause:** Chain not in DEX_CONFIG
**Fix:** Verify chain is supported

### "Direct swap failed" + "Multi-hop swap also failed"
**Cause:** No liquidity in any route
**Fix:** Try different tokens or smaller amount

## Quick Checklist

- [ ] Both tokens selected
- [ ] Amount entered and > 0
- [ ] Connected to correct chain
- [ ] Token addresses are valid (0x + 40 hex)
- [ ] Tokens exist on current chain
- [ ] Pair has liquidity (check DEX website)
- [ ] Router address is correct
- [ ] Using correct DEX for chain
- [ ] Console shows detailed logs
- [ ] Tried smaller amount
- [ ] Tried different token pair

## Testing Procedure

### For BSC (PancakeSwap):
```
1. Connect wallet to BSC
2. Select USDT (0x55d398326f99059fF775485246999027B3197955)
3. Select BUSD (0xe9e7cea3dedca5984780bafc599bd69add087d56)
4. Enter amount: 1 USDT
5. Check console for logs
6. Click Swap
7. Verify success
```

### For Ethereum (Uniswap V2):
```
1. Connect wallet to Ethereum
2. Select USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
3. Select DAI (0x6B175474E89094C44Da98b954EedeAC495271d0F)
4. Enter amount: 1 USDC
5. Check console for logs
6. Click Swap
7. Verify success
```

## Console Log Interpretation

### Successful Direct Swap:
```
[PancakeSwap] Trying direct swap: 0x55d3... → 0x8AC7..., amount: 1000000000000000000
[PancakeSwap] Direct swap succeeded, output: 999700000000000000
```
✅ Direct pool exists, swap will work

### Successful Multi-Hop Swap:
```
[PancakeSwap] Trying direct swap: 0x55d3... → 0x8AC7..., amount: 1000000000000000000
[PancakeSwap] Direct swap failed: No liquidity pool
[PancakeSwap] Trying multi-hop route: 0x55d3... → 0xbb4C... → 0x8AC7...
[PancakeSwap] Multi-hop swap succeeded, output: 999400000000000000
```
✅ No direct pool, but multi-hop works

### Failed Swap:
```
[PancakeSwap] Trying direct swap: 0x55d3... → 0x8AC7..., amount: 1000000000000000000
[PancakeSwap] Direct swap failed: No liquidity pool
[PancakeSwap] Trying multi-hop route: 0x55d3... → 0xbb4C... → 0x8AC7...
[PancakeSwap] Multi-hop swap also failed: No liquidity pool
```
❌ No liquidity in any route

## Next Steps If Still Failing

1. **Check DEX status** - Is the DEX operational?
2. **Try different pair** - Some pairs have better liquidity
3. **Reduce amount** - Try 10% of current amount
4. **Check gas** - Ensure enough native token for gas
5. **Update RPC** - Try different RPC endpoint
6. **Verify chain** - Ensure correct chain selected
7. **Check balance** - Ensure you have the token
8. **Contact support** - Report with transaction hash

## Verified Working Pairs

### BSC (PancakeSwap):
- BUSD ↔ USDT
- BUSD ↔ USDC
- WBNB ↔ BUSD
- WBNB ↔ USDT

### Ethereum (Uniswap V2):
- USDC ↔ DAI
- USDC ↔ USDT
- WETH ↔ USDC
- WETH ↔ DAI

## Support Resources

- **PancakeSwap Docs:** https://docs.pancakeswap.finance
- **Uniswap Docs:** https://docs.uniswap.org
- **BSCscan:** https://bscscan.com
- **Etherscan:** https://etherscan.io
- **Aerodrome Docs:** https://aerodrome.finance

---

**Last Updated:** Oct 25, 2025
**Status:** Enhanced logging enabled ✅
**Ready for debugging:** Yes ✅
