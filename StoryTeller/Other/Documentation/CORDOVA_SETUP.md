# StoryTeller Cordova Setup - Copy V4 Structure

## 🎯 Quick Answer: YES, you can copy and modify!

Based on your V4/Cordova/DCWorld structure, here's exactly how to create a StoryTeller Cordova build:

---

## 📋 **Step-by-Step Process**

### **Step 1: Copy the Cordova Structure**
```bash
# Navigate to StoryTeller directory
cd /home/brad/Documents/DCC-custom/StoryTeller

# Copy the entire Cordova structure from V4
cp -r ../V4/Cordova ./

# Rename to StoryTeller-specific name
mv Cordova/DCWorld Cordova/StoryTeller
```

### **Step 2: Modify config.xml**
Edit `StoryTeller/Cordova/StoryTeller/config.xml`:

```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.ronmurphy.storyteller" version="1.0.0"
        xmlns="http://www.w3.org/ns/widgets"
        xmlns:cdv="http://cordova.apache.org/ns/1.0">

    <name>DCC StoryTeller</name>
    <description>A tabletop RPG storytelling app for Dungeon Crawl Classics</description>
    <author email="dev@cordova.apache.org" href="https://cordova.apache.org">
        Ron Murphy
    </author>

    <content src="index.html" />

    <!-- Allow navigation -->
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />

    <!-- Android platform assets -->
    <platform name="android">
        <!-- App icons (reuse or replace with StoryTeller icons) -->
        <icon src="res/android/icon-36.png" density="ldpi" />
        <icon src="res/android/icon-48.png" density="mdpi" />
        <icon src="res/android/icon-72.png" density="hdpi" />
        <icon src="res/android/icon-96.png" density="xhdpi" />
        <icon src="res/android/icon-144.png" density="xxhdpi" />
        <icon src="res/android/icon-192.png" density="xxxhdpi" />

        <!-- Splash screen -->
        <preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/android/splash.png" />
        <preference name="AndroidWindowSplashScreenBackground" value="#141414" />
        
        <!-- Modern Android API -->
        <preference name="android-targetSdkVersion" value="33" />
        <preference name="android-compileSdkVersion" value="35" />
    </platform>

</widget>
```

### **Step 3: Update package.json**
Edit `StoryTeller/Cordova/StoryTeller/package.json`:

```json
{
  "name": "com.storyteller.app",
  "displayName": "DCC StoryTeller",
  "version": "1.0.0",
  "description": "A tabletop RPG storytelling application for DCC campaigns.",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "ecosystem:cordova",
    "dcc",
    "rpg",
    "storytelling"
  ],
  "author": "Ron Murphy",
  "license": "Apache-2.0",
  "cordova": {
    "platforms": [
      "android"
    ]
  },
  "devDependencies": {
    "cordova-android": "^14.0.1"
  }
}
```

### **Step 4: Copy StoryTeller Web App to www**
```bash
# Navigate to the Cordova StoryTeller directory
cd StoryTeller/Cordova/StoryTeller

# Remove existing www content
rm -rf www/*

# Copy StoryTeller web app files
cp -r ../../index.html www/
cp -r ../../css www/
cp -r ../../js www/

# Copy any additional assets
# (icons, images, etc.)
```

### **Step 5: Create Build Script**
Create `StoryTeller/build-cordova.sh`:

```bash
#!/bin/bash
# build-cordova.sh - Build StoryTeller Cordova Android APK
# Run this from the StoryTeller directory: ./build-cordova.sh

echo "📱 Starting StoryTeller Cordova Android build..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/StoryTeller/Cordova/StoryTeller"
BUILD_DIR="$CORDOVA_DIR/builds"
APK_SOURCE="$CORDOVA_DIR/platforms/android/app/build/outputs/apk/debug/app-debug.apk"

# Check if Cordova directory exists
if [ ! -d "$CORDOVA_DIR" ]; then
    echo "❌ Error: Cordova directory not found at $CORDOVA_DIR"
    exit 1
fi

# Create builds directory if it doesn't exist
mkdir -p "$BUILD_DIR"

# Copy latest web app files to www
echo "📋 Copying latest StoryTeller files to www..."
cp -r index.html "$CORDOVA_DIR/www/"
cp -r css "$CORDOVA_DIR/www/"
cp -r js "$CORDOVA_DIR/www/"

# Navigate to Cordova directory
cd "$CORDOVA_DIR" || exit 1

echo "📍 Building in: $(pwd)"

# Clean and build
echo "🧹 Cleaning previous build..."
cordova clean android

echo "🔨 Building Android APK..."
cordova build android

# Check if build was successful
if [ -f "$APK_SOURCE" ]; then
    # Copy APK to builds folder with timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    APK_NAME="storyteller_${TIMESTAMP}.apk"
    cp "$APK_SOURCE" "$BUILD_DIR/$APK_NAME"
    
    echo "✅ Build successful!"
    echo "📱 APK saved as: $BUILD_DIR/$APK_NAME"
    echo "📊 APK size: $(du -h "$BUILD_DIR/$APK_NAME" | cut -f1)"
else
    echo "❌ Build failed! APK not found at $APK_SOURCE"
    exit 1
fi
```

### **Step 6: Make Build Script Executable**
```bash
chmod +x StoryTeller/build-cordova.sh
```

---

## 🚀 **Build Commands**

### **Initial Setup (One Time)**
```bash
cd StoryTeller/Cordova/StoryTeller

# Add Android platform
cordova platform add android

# Install any needed plugins (optional)
# cordova plugin add cordova-plugin-network-information
# cordova plugin add cordova-plugin-device
```

### **Build APK**
```bash
# From StoryTeller directory
./build-cordova.sh

# Or manually:
cd Cordova/StoryTeller
cordova build android
```

---

## 📂 **Directory Structure After Setup**

```
StoryTeller/
├── index.html                 (web app)
├── css/                       (web app styles)
├── js/                        (web app scripts)
├── build-cordova.sh           (build script)
└── Cordova/
    └── StoryTeller/
        ├── config.xml         (modified for StoryTeller)
        ├── package.json       (modified for StoryTeller)
        ├── res/               (icons, splash screens)
        ├── www/               (web app copied here)
        ├── builds/            (output APKs)
        └── platforms/         (generated by Cordova)
```

---

## 🎨 **Icon Customization (Optional)**

To use StoryTeller-specific icons:

1. Replace icon files in `Cordova/StoryTeller/res/android/`
2. Use same sizes as existing icons:
   - icon-36.png (36x36)
   - icon-48.png (48x48)  
   - icon-72.png (72x72)
   - icon-96.png (96x96)
   - icon-144.png (144x144)
   - icon-192.png (192x192)
   - splash.png (for splash screen)

---

## ✅ **Testing Your Build**

### **Install APK on Android Device**
```bash
# Enable USB debugging on your Android device
# Connect device via USB

# Install APK
adb install StoryTeller/Cordova/StoryTeller/builds/storyteller_YYYYMMDD_HHMMSS.apk

# Or transfer APK file and install manually
```

### **Test Cordova Features**
Your enhanced supabase-chat.js will automatically detect:
- ✅ Cordova environment (`window.cordova`)
- ✅ Native pause/resume events
- ✅ Enhanced background connection handling
- ✅ Network state monitoring

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

**Build fails with "cordova: command not found"**
```bash
npm install -g cordova
```

**Android build fails**
```bash
# Make sure you have Android SDK installed
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**APK won't install**
```bash
# Enable "Install from unknown sources" on Android device
# Check APK is not corrupted
```

**StoryTeller features not working in app**
- ✅ Make sure all files copied to www/
- ✅ Check browser console in app (enable USB debugging)
- ✅ Verify network permissions in config.xml

---

## 🎯 **Final Answer**

**YES!** You can absolutely copy the V4 Cordova structure, modify the config.xml and package.json, then build. The process is:

1. Copy `V4/Cordova/DCWorld` → `StoryTeller/Cordova/StoryTeller`
2. Edit config.xml (change name, ID, description)
3. Edit package.json (change name, displayName)
4. Copy StoryTeller web files to www/
5. Run `cordova platform add android`
6. Run `cordova build android`

Your cross-platform enhanced chat system will work perfectly in the Cordova app! 🚀📱
