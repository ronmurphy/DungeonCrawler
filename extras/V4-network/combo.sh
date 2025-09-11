#!/bin/bash
# combo.sh - Copy files and build APK in one command
# Run this from the V3 directory: ./combo.sh

echo "🚀 Starting copy + build workflow..."
echo ""

# Step 1: Copy files
echo "STEP 1: Copying development files..."
./wwwcopy.sh
if [ $? -ne 0 ]; then
    echo "❌ Copy failed, aborting build"
    exit 1
fi

echo ""
echo "STEP 2: Building APK..."
./build.sh

echo ""
echo "🎊 Workflow complete!"
