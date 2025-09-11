#!/bin/bash
# combo.sh - Complete StoryTeller mobile build workflow
# Combines wwwcopy.sh and build.sh for one-step APK generation

echo "🚀 StoryTeller Complete Build Workflow"
echo "======================================"
echo ""

# Run file copy first
echo "Step 1: Copying web files to Cordova..."
./wwwcopy.sh

# Check if copy was successful
if [ $? -ne 0 ]; then
    echo "❌ File copy failed, aborting build"
    exit 1
fi

echo ""
echo "Step 2: Building APK..."
./build.sh

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ APK build failed"
    exit 1
fi

echo ""
echo "🎉 Complete workflow finished successfully!"
echo "   📱 Your StoryTeller APK is ready for testing"
