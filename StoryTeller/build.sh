#!/bin/bash
# build.sh - Build StoryTeller APK using Cordova
# Run this from the StoryTeller directory after wwwcopy.sh: ./build.sh

echo "🔨 Building StoryTeller APK..."

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

# Build the APK
echo "🔨 Building Android APK..."
cordova build android

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Find the generated APK or AAB file
APK_SOURCE=$(find platforms/android -name "*.apk" -type f | head -1)
AAB_SOURCE=$(find platforms/android -name "*.aab" -type f | head -1)

if [ -n "$APK_SOURCE" ]; then
    echo "📱 Found APK file: $APK_SOURCE"
    BUILD_FILE="$APK_SOURCE"
    FILE_EXT="apk"
elif [ -n "$AAB_SOURCE" ]; then
    echo "📱 Found AAB file: $AAB_SOURCE"
    BUILD_FILE="$AAB_SOURCE"
    FILE_EXT="aab"
else
    echo "❌ No APK or AAB file found after build!"
    exit 1
fi

# Create timestamped filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APP_VERSION=$(grep '<widget' config.xml | sed 's/.*version="\([^"]*\)".*/\1/' | head -1)
OUTPUT_FILENAME="StoryTeller_v${APP_VERSION}_${TIMESTAMP}.${FILE_EXT}"

# Copy build file to output directory with timestamped name
cp "$BUILD_FILE" "$APK_OUTPUT_DIR/$OUTPUT_FILENAME"

# Also create a "latest" copy for convenience
cp "$BUILD_FILE" "$APK_OUTPUT_DIR/StoryTeller_latest.${FILE_EXT}"

# Get file size
FILE_SIZE=$(du -h "$APK_OUTPUT_DIR/$OUTPUT_FILENAME" | cut -f1)

echo ""
echo "✅ Build completed successfully!"
echo "   📱 ${FILE_EXT^^} File: $OUTPUT_FILENAME"
echo "   📏 Size: $FILE_SIZE"
echo "   📍 Location: $APK_OUTPUT_DIR"
echo "   🔗 Latest copy: StoryTeller_latest.${FILE_EXT}"
echo ""

# Show all build files in output directory
echo "📦 All StoryTeller build files:"
ls -lah "$APK_OUTPUT_DIR"/StoryTeller*.{apk,aab} 2>/dev/null | awk '{print "   " $5 " " $9}' | sed 's|.*/||'

echo ""
if [ "$FILE_EXT" = "apk" ]; then
    echo "🎯 Ready to install: adb install \"$APK_OUTPUT_DIR/$OUTPUT_FILENAME\""
else
    echo "🎯 AAB file created for Google Play Store upload"
    echo "   To generate APK for testing, you may need to use bundletool"
fi
