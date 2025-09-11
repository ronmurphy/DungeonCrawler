#!/bin/bash
# build-apk.sh - Build V4-network APK (specifically APK format, not AAB)
# Run this from the V4-network directory after wwwcopy.sh: ./build-apk.sh

echo "🔨 Building V4-network APK (forcing APK format)..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/V4-network/Cordova/DCWorld"
BUILD_DIR="$CORDOVA_DIR/builds"
V4_APKS_DIR="/home/brad/Documents/DCC-custom/V4-network/APKs"

# Check if Cordova directory exists
if [ ! -d "$CORDOVA_DIR" ]; then
    echo "❌ Error: Cordova directory not found at $CORDOVA_DIR"
    exit 1
fi

# Create output directories if they don't exist
mkdir -p "$BUILD_DIR"
mkdir -p "$V4_APKS_DIR"

# Navigate to Cordova directory
cd "$CORDOVA_DIR" || exit 1

echo "📍 Building in: $(pwd)"

# Clean previous build
echo "🧹 Cleaning previous build..."
cordova clean android

# Build the APK using gradle directly to ensure APK format
echo "🔨 Building APK (using gradle assembleDebug)..."
cd platforms/android
./gradlew assembleDebug

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Go back to Cordova directory
cd "$CORDOVA_DIR"

# Find the generated APK
APK_SOURCE=$(find platforms/android -name "*-debug*.apk" -type f | head -1)

if [ -z "$APK_SOURCE" ]; then
    echo "❌ No APK file found after build!"
    echo "🔍 Looking for any APK files..."
    find platforms/android -name "*.apk" -type f
    exit 1
fi

# Create timestamped filename
TIMESTAMP=$(date +%Y%m%d-%H%M)
APK_DEST="$BUILD_DIR/dcc-sheet-$TIMESTAMP.apk"
V4_APK_DEST="$V4_APKS_DIR/dcc-sheet-$TIMESTAMP.apk"

# Copy APK to both locations
cp "$APK_SOURCE" "$APK_DEST"
cp "$APK_SOURCE" "$V4_APK_DEST"

# Get file size for display
APK_SIZE=$(du -h "$APK_DEST" | cut -f1)

echo ""
echo "✅ APK build completed successfully!"
echo "📱 APK copied to:"
echo "   📁 Cordova builds: builds/dcc-sheet-$TIMESTAMP.apk ($APK_SIZE)"
echo "   📁 V4-network APKs: APKs/dcc-sheet-$TIMESTAMP.apk ($APK_SIZE)"
echo "🎉 Build complete! APK ready for testing."

# List recent builds
echo ""
echo "📋 Recent APK builds in V4-network:"
ls -lah "$V4_APKS_DIR"/*.apk 2>/dev/null | head -3 | awk '{print "   " $5 " " $9}' | sed 's|.*/||'

echo ""
echo "🎯 Ready to install: adb install \"$V4_APK_DEST\""
