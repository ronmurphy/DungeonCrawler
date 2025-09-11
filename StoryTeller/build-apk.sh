#!/bin/bash
# build-apk.sh - Build StoryTeller APK (specifically APK format, not AAB)
# Run this from the StoryTeller directory after wwwcopy.sh: ./build-apk.sh

echo "🔨 Building StoryTeller APK (forcing APK format)..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/StoryTeller/Cordova/StoryTellerApp"
APK_OUTPUT_DIR="/home/brad/Documents/DCC-custom/StoryTeller/APKs"

# Check if Cordova project exists
if [ ! -d "$CORDOVA_DIR" ]; then
    echo "❌ Error: Cordova project directory not found at $CORDOVA_DIR"
    exit 1
fi

# Ensure APK output directory exists
mkdir -p "$APK_OUTPUT_DIR"

# Change to Cordova project directory
cd "$CORDOVA_DIR"

echo "📁 Working in: $(pwd)"
echo ""

# Check if platform is added
if [ ! -d "platforms/android" ]; then
    echo "⚠️  Android platform not found, adding it..."
    cordova platform add android
    if [ $? -ne 0 ]; then
        echo "❌ Failed to add Android platform"
        exit 1
    fi
fi

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APP_VERSION=$(grep '<widget' config.xml | sed 's/.*version="\([^"]*\)".*/\1/' | head -1)
APK_FILENAME="StoryTeller_v${APP_VERSION}_${TIMESTAMP}.apk"

# Copy APK to output directory with timestamped name
cp "$APK_SOURCE" "$APK_OUTPUT_DIR/$APK_FILENAME"

# Also create a "latest" copy for convenience
cp "$APK_SOURCE" "$APK_OUTPUT_DIR/StoryTeller_latest.apk"

# Get file size
APK_SIZE=$(du -h "$APK_OUTPUT_DIR/$APK_FILENAME" | cut -f1)

echo ""
echo "✅ APK build completed successfully!"
echo "   📱 APK File: $APK_FILENAME"
echo "   📏 Size: $APK_SIZE"
echo "   📍 Location: $APK_OUTPUT_DIR"
echo "   🔗 Latest copy: StoryTeller_latest.apk"
echo ""

# Show all APKs in output directory
echo "📦 All StoryTeller APKs:"
ls -lah "$APK_OUTPUT_DIR"/*.apk 2>/dev/null | awk '{print "   " $5 " " $9}' | sed 's|.*/||'

echo ""
echo "🎯 Ready to install: adb install \"$APK_OUTPUT_DIR/$APK_FILENAME\""
