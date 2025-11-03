#!/bin/bash

# Fix: Remove secrets from git history
# This will rewrite git history to remove the Stripe API key

echo "🔒 Removing secrets from git history..."
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "   Make sure you have a backup before proceeding."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Installing BFG Repo-Cleaner (if needed)..."

# Check if bfg is installed
if ! command -v bfg &> /dev/null
then
    echo "BFG not found. Installing via brew..."
    brew install bfg
fi

echo ""
echo "Step 2: Creating backup..."
cd ..
cp -r miniapp miniapp-backup
cd miniapp

echo ""
echo "Step 3: Removing secrets from history..."
echo "This may take a few minutes..."

# Use BFG to remove secrets
bfg --replace-text <(echo 'sk_test_****REMOVED****') --no-blob-protection

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Secrets removed from git history!"
echo ""
echo "Next steps:"
echo "1. Verify the changes: git log --oneline"
echo "2. Force push: git push -u origin master:main --force"
echo ""
echo "⚠️  Note: Force push will overwrite remote history!"
echo "   Make sure no one else is working on this branch."
