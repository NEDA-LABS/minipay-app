# Fix GitHub Push Protection - Stripe API Key Detected

## 🔒 Issue
GitHub detected a Stripe API key in your git history and blocked the push.

**Detected in:** `app/settings/page.tsx` (git history)

## ✅ Solution Options

### Option 1: Allow the Secret (Quickest - If Test Key)

If this is a **test key** (starts with `sk_test_`), you can allow it:

1. Click the GitHub link provided in the error:
   ```
   https://github.com/NEDA-LABS/minipay-app/security/secret-scanning/unblock-secret/34kwXYKEC3S6UhnLTF8XT1VLATr
   ```

2. Click "Allow secret" button

3. Push again:
   ```bash
   git push -u origin master:main
   ```

**⚠️ Only do this if it's a test key that's not sensitive!**

---

### Option 2: Remove from Git History (Recommended for Production Keys)

If this is a **production key** (starts with `sk_live_`), you MUST remove it:

#### Step 1: Find the file with the secret
```bash
# Already identified: app/settings/page.tsx
```

#### Step 2: Check if secret is in current code
```bash
grep -r "sk_test_" app/
grep -r "sk_live_" app/
```

If found, remove it and use environment variables instead.

#### Step 3: Remove from git history

**Using git filter-repo (Recommended):**
```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS
# or
pip install git-filter-repo    # Python

# Remove the file from history
git filter-repo --path app/settings/page.tsx --invert-paths

# Or replace the secret
git filter-repo --replace-text <(echo 'sk_test_****REMOVED****')
```

**Using BFG (Alternative):**
```bash
# Install BFG
brew install bfg

# Remove secrets
bfg --replace-text <(echo 'sk_test_****REMOVED****')

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

#### Step 4: Force push
```bash
git push -u origin master:main --force
```

**⚠️ Warning:** Force push will rewrite remote history!

---

### Option 3: Start Fresh (Easiest)

Create a new repository without the secret:

```bash
# 1. Remove the problematic file from history
git rm --cached app/settings/page.tsx
git commit -m "Remove file with secrets"

# 2. Create new file without secrets
# (Make sure to use environment variables)

# 3. Push
git push -u origin master:main
```

---

## 🔐 Best Practices Going Forward

### 1. Use Environment Variables

**Never commit:**
- API keys
- Passwords
- Private keys
- Access tokens

**Instead, use `.env` files:**

```bash
# .env.local (already in .gitignore)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

**In code:**
```typescript
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

### 2. Check .gitignore

Verify `.env*` files are ignored:
```bash
# .gitignore
.env*
!.env.example
```

### 3. Create .env.example

```bash
# .env.example (safe to commit)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
```

### 4. Use git-secrets

Prevent committing secrets:
```bash
# Install
brew install git-secrets

# Set up
git secrets --install
git secrets --register-aws
```

---

## 🚀 Quick Fix (If Test Key)

**Fastest solution if it's just a test key:**

1. Go to: https://github.com/NEDA-LABS/minipay-app/security/secret-scanning/unblock-secret/34kwXYKEC3S6UhnLTF8XT1VLATr

2. Click "Allow secret"

3. Run:
   ```bash
   git push -u origin master:main
   ```

4. **Then immediately:**
   - Rotate the key in Stripe dashboard
   - Move to environment variables
   - Never commit keys again

---

## ❓ Need Help?

**Check what's in the file:**
```bash
git show 2db1da361c68190543f4f21152359f435153e007
```

**Search for secrets:**
```bash
grep -r "sk_test_" .
grep -r "sk_live_" .
```

**Verify .gitignore:**
```bash
cat .gitignore | grep env
```

---

## ✅ Recommended Action

1. **If test key:** Use Option 1 (allow on GitHub)
2. **If production key:** Use Option 2 (remove from history)
3. **Always:** Move to environment variables
4. **Always:** Rotate the exposed key

**After fixing, update your code to use environment variables!**
