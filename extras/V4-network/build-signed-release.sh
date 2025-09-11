#!/bin/bash
# build-signed-release.sh - Build a properly signed V4-network APK for production
# This creates a self-signed release APK that can be installed on devices

echo "🔑 Building signed release APK for V4-network..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/V4-network/Cordova/DCWorld"
APK_OUTPUT_DIR="/home/brad/Documents/DCC-custom/V4-network/APKs"

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

# Create a keystore if it doesn't exist
KEYSTORE_PATH="$CORDOVA_DIR/v4network-release-key.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "🔑 Creating keystore for signing..."
    keytool -genkey -v -keystore "$KEYSTORE_PATH" -alias v4network -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=V4Network, OU=Development, O=Ron Murphy, L=Unknown, S=Unknown, C=US" \
        -storepass v4network123 -keypass v4network123
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create keystore"
        exit 1
    fi
    echo "✅ Keystore created successfully"
fi

# Build unsigned release APK first
echo "🔨 Building unsigned release APK..."
cordova build android --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Find the unsigned APK
UNSIGNED_APK=$(find platforms/android -name "*-release-unsigned.apk" -type f | head -1)

if [ -z "$UNSIGNED_APK" ]; then
    echo "❌ No unsigned APK found!"
    exit 1
fi

# Sign the APK
echo "🔑 Signing APK..."
TIMESTAMP=$(date +%Y%m%d-%H%M)
SIGNED_APK="$APK_OUTPUT_DIR/dcc-sheet-signed_${TIMESTAMP}.apk"

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
    -keystore "$KEYSTORE_PATH" \
    -storepass v4network123 \
    -keypass v4network123 \
    "$UNSIGNED_APK" v4network

if [ $? -ne 0 ]; then
    echo "❌ Failed to sign APK"
    exit 1
fi

# Copy signed APK to output directory
cp "$UNSIGNED_APK" "$SIGNED_APK"

# Also create a "latest" copy
cp "$SIGNED_APK" "$APK_OUTPUT_DIR/dcc-sheet-signed-latest.apk"

# Get file size
APK_SIZE=$(du -h "$SIGNED_APK" | cut -f1)

echo ""
echo "✅ Signed release APK created successfully!"
echo "   📱 APK File: $(basename "$SIGNED_APK")"
echo "   📏 Size: $APK_SIZE"
echo "   📍 Location: $APK_OUTPUT_DIR"
echo "   🔗 Latest copy: dcc-sheet-signed-latest.apk"
echo ""
echo "🎯 Ready to install: adb install \"$SIGNED_APK\""
echo "💡 This signed APK should install without 'invalid package' errors"
