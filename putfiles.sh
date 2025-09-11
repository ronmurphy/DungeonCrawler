#!/bin/bash

# ============================================
# PUT FILES - Simple Git Commit & Push Script
# ============================================
# This script uploads your changes to the Git repository
# Will ask you to describe your changes before uploading
# Double-click this file to run it!

echo "📤 Uploading your changes to Git repository..."
echo "================================================"

# Check if this is a Git repository
if [ ! -d ".git" ]; then
    echo "❌ ERROR: This is not a Git repository!"
    echo "Make sure this script is in the root folder of your project"
    echo "Press Enter to close..."
    read
    exit 1
fi

# Check if there are any changes to upload
echo "🔍 Checking for changes to upload..."
git add .

if git diff --cached --quiet; then
    echo "ℹ️  No changes found to upload"
    echo "All your files are already saved to Git"
    echo "Press Enter to close..."
    read
    exit 0
fi

# Show what files will be uploaded
echo "📋 Files that will be uploaded:"
git diff --cached --name-status

echo ""
echo "================================================"
echo "📝 Please describe your changes:"
echo "   Examples: 'Fixed chat bug', 'Added new NPC feature', etc."
echo "   (This helps everyone understand what you changed)"
echo ""
read -p "Your description: " COMMIT_MESSAGE

# Validate commit message
if [ -z "$COMMIT_MESSAGE" ]; then
    echo "❌ ERROR: You must provide a description of your changes"
    echo "Press Enter to close..."
    read
    exit 1
fi

echo ""
echo "🔄 Uploading changes..."

# Commit the changes
if git commit -m "$COMMIT_MESSAGE"; then
    echo "✅ Changes committed successfully!"
    
    # Push to GitHub
    echo "🌐 Uploading to GitHub..."
    if git push origin main; then
        echo "✅ SUCCESS: All changes uploaded to GitHub!"
        echo "🎉 Your teammates can now download your changes using getfiles.sh"
    else
        echo "❌ ERROR: Could not upload to GitHub"
        echo "Check your internet connection or ask for help"
    fi
else
    echo "❌ ERROR: Could not save changes"
    echo "Ask for help with this error"
fi

echo ""
echo "================================================"
echo "✅ PUT FILES COMPLETE"
echo "Press Enter to close..."
read
