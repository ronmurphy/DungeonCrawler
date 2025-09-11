#!/bin/bash

# ============================================
# GET FILES - Simple Git Pull Script
# ============================================
# This script downloads the latest files from the Git repository
# Safe to run multiple times - will not overwrite your local changes
# Double-click this file to run it!

echo "🔄 Getting latest files from Git repository..."
echo "================================================"

# Check if this is a Git repository
if [ ! -d ".git" ]; then
    echo "❌ ERROR: This is not a Git repository!"
    echo "Make sure this script is in the root folder of your project"
    echo "Press Enter to close..."
    read
    exit 1
fi

# Show current status
echo "📍 Current repository status:"
git status --porcelain

echo ""
echo "🌐 Fetching latest changes from GitHub..."

# Fetch the latest changes
git fetch origin

# Check if there are any changes to pull
CHANGES=$(git rev-list HEAD..origin/main --count)

if [ "$CHANGES" -eq 0 ]; then
    echo "✅ You already have the latest files!"
else
    echo "📥 Found $CHANGES new changes to download"
    echo "🔄 Downloading latest files..."
    
    # Pull the latest changes
    if git pull origin main; then
        echo "✅ SUCCESS: Files updated successfully!"
        echo "📋 Changes downloaded:"
        git log --oneline -$CHANGES
    else
        echo "❌ ERROR: Could not download files"
        echo "You may have local changes that conflict"
        echo "Save your work and try again, or ask for help"
    fi
fi

echo ""
echo "================================================"
echo "✅ GET FILES COMPLETE"
echo "Press Enter to close..."
read
