#!/bin/bash
# build.sh - Build Cordova Android APK and copy to builds folder
# Run this from the V3 directory: ./build.sh

echo "🏗️  Starting Cordova Android build..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/V4-network/Cordova/DCWorld"
BUILD_DIR="$CORDOVA_DIR/builds"
V4_APKS_DIR="/home/brad/Documents/DCC-custom/V4-network/APKs"

# Check if Cordova directory exists
if [ ! -d "$CORDOVA_DIR" ]; then
    echo "❌ Error: Cordova directory not found at $CORDOVA_DIR"
    exit 1
fi

# Create builds directory if it doesn't exist
mkdir -p "$BUILD_DIR"
mkdir -p "$V4_APKS_DIR"

# Navigate to Cordova directory
cd "$CORDOVA_DIR" || exit 1

echo "📍 Building in: $(pwd)"

# Clean and build
echo "🧹 Cleaning previous build..."
cordova clean android

echo "🔨 Building Android app..."
if cordova build android; then
    echo "✅ Build successful!"
    
    # Find the generated APK or AAB file
    APK_FILE=$(find platforms/android -name "*.apk" -type f | head -1)
    AAB_FILE=$(find platforms/android -name "*.aab" -type f | head -1)
    
    if [ -n "$APK_FILE" ]; then
        echo "📱 Found APK file: $APK_FILE"
        BUILD_SOURCE="$APK_FILE"
        FILE_EXT="apk"
        FILE_TYPE="APK"
    elif [ -n "$AAB_FILE" ]; then
        echo "📱 Found AAB file: $AAB_FILE"
        BUILD_SOURCE="$AAB_FILE"
        FILE_EXT="aab"
        FILE_TYPE="AAB"
    else
        echo "❌ Error: No APK or AAB file found after build!"
        echo "🔍 Looking for build outputs..."
        find platforms/android -name "*.apk" -o -name "*.aab" -type f
        exit 1
    fi
    
    # Create timestamped filename
    TIMESTAMP=$(date +%Y%m%d-%H%M)
    BUILD_DEST="$BUILD_DIR/dcc-sheet-$TIMESTAMP.$FILE_EXT"
    V4_BUILD_DEST="$V4_APKS_DIR/dcc-sheet-$TIMESTAMP.$FILE_EXT"
    
    # Copy build file to both locations
    cp "$BUILD_SOURCE" "$BUILD_DEST"
    cp "$BUILD_SOURCE" "$V4_BUILD_DEST"
    
    # Get file size for display
    BUILD_SIZE=$(du -h "$BUILD_DEST" | cut -f1)
    
    echo "📱 $FILE_TYPE copied to:"
    echo "   📁 Cordova builds: builds/dcc-sheet-$TIMESTAMP.$FILE_EXT ($BUILD_SIZE)"
    echo "   📁 V4-network APKs: APKs/dcc-sheet-$TIMESTAMP.$FILE_EXT ($BUILD_SIZE)"
    
    if [ "$FILE_EXT" = "apk" ]; then
        echo "🎉 Build complete! APK ready for testing."
    else
        echo "🎉 Build complete! AAB ready for Play Store upload."
        echo "   💡 For testing, consider using build-apk.sh to generate APK format"
    fi
    
    # List recent builds
    echo ""
    echo "📋 Recent builds in Cordova:"
    ls -lt "$BUILD_DIR"/*.{apk,aab} 2>/dev/null | head -3 | while read -r line; do
        echo "   $line"
    done
    
    echo ""
    echo "📋 Recent builds in V4-network:"
    ls -lt "$V4_APKS_DIR"/*.{apk,aab} 2>/dev/null | head -3 | while read -r line; do
        echo "   $line"
    done

else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi
