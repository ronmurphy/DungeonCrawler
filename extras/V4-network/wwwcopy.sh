#!/bin/bash
# wwwcopy.sh - Copy development files to Cordova www directory
# Run this from the V4-network directory: ./wwwcopy.sh

echo "🔄 Copying development files to Cordova www..."

# Define source and destination directories
SOURCE_DIR="/home/brad/Documents/DCC-custom/V4-network"
DEST_DIR="/home/brad/Documents/DCC-custom/V4-network/Cordova/DCWorld/www"

# Check if destination exists
if [ ! -d "$DEST_DIR" ]; then
    echo "❌ Error: Cordova www directory not found at $DEST_DIR"
    exit 1
fi

# Clean up old versions (preserving subdirectories structure)
echo "🧹 Cleaning old web files..."
rm -f "$DEST_DIR"/*.html 2>/dev/null
rm -f "$DEST_DIR"/*.css 2>/dev/null  
rm -f "$DEST_DIR"/*.js 2>/dev/null
rm -f "$DEST_DIR"/*.json 2>/dev/null

# Remove old subdirectories to ensure clean copy
echo "🧹 Cleaning old subdirectories..."
rm -rf "$DEST_DIR"/assets 2>/dev/null
rm -rf "$DEST_DIR"/css 2>/dev/null
rm -rf "$DEST_DIR"/data 2>/dev/null
rm -rf "$DEST_DIR"/js 2>/dev/null
rm -rf "$DEST_DIR"/temp 2>/dev/null

# Copy individual files (not in subfolders) - excluding certain files
echo "📁 Copying main web files..."
cp "$SOURCE_DIR"/*.html "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.css "$DEST_DIR"/ 2>/dev/null  
cp "$SOURCE_DIR"/*.js "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.json "$DEST_DIR"/ 2>/dev/null

# Copy subdirectories with all their contents
echo "📁 Copying assets directory..."
if [ -d "$SOURCE_DIR/assets" ]; then
    cp -r "$SOURCE_DIR/assets" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ Assets directory copied"
else
    echo "   ⚠️  Assets directory not found"
fi

echo "📁 Copying css directory..."
if [ -d "$SOURCE_DIR/css" ]; then
    cp -r "$SOURCE_DIR/css" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ CSS directory copied"
else
    echo "   ⚠️  CSS directory not found"
fi

echo "📁 Copying data directory..."
if [ -d "$SOURCE_DIR/data" ]; then
    cp -r "$SOURCE_DIR/data" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ Data directory copied"
else
    echo "   ⚠️  Data directory not found"
fi

echo "📁 Copying js directory..."
if [ -d "$SOURCE_DIR/js" ]; then
    cp -r "$SOURCE_DIR/js" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ JS directory copied (including core/ and modules/ subfolders)"
else
    echo "   ⚠️  JS directory not found"
fi

echo "📁 Copying temp directory..."
if [ -d "$SOURCE_DIR/temp" ]; then
    cp -r "$SOURCE_DIR/temp" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ Temp directory copied"
else
    echo "   ⚠️  Temp directory not found"
fi

# Copy icon files if they exist (only if not already there)
echo "🖼️  Copying icon files..."
cp "$SOURCE_DIR"/icon-*.png "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/favicon.ico "$DEST_DIR"/ 2>/dev/null
echo "   📱 Icon and favicon files copied"

# Don't copy these files to www (they belong elsewhere or not needed)
echo "🚫 Removing files that don't belong in www..."
rm -f "$DEST_DIR"/package.json 2>/dev/null
rm -f "$DEST_DIR"/package-lock.json 2>/dev/null
rm -f "$DEST_DIR"/game-reference.md 2>/dev/null
rm -f "$DEST_DIR"/wwwcopy.sh 2>/dev/null
rm -f "$DEST_DIR"/build.sh 2>/dev/null
rm -f "$DEST_DIR"/combo.sh 2>/dev/null
rm -f "$DEST_DIR"/REORGANIZATION_SUMMARY.md 2>/dev/null
rm -f "$DEST_DIR"/integration.md 2>/dev/null
rm -f "$DEST_DIR"/supabase.key.md 2>/dev/null

# Show summary of what was copied
echo "✅ Copy complete! Directory structure:"
echo "   📄 Main files: $(ls "$DEST_DIR"/*.html "$DEST_DIR"/*.css "$DEST_DIR"/*.js "$DEST_DIR"/*.json 2>/dev/null | wc -l)"
echo "   📁 Subdirectories:"
[ -d "$DEST_DIR/assets" ] && echo "      ✅ assets/ ($(find "$DEST_DIR/assets" -type f | wc -l) files)"
[ -d "$DEST_DIR/css" ] && echo "      ✅ css/ ($(find "$DEST_DIR/css" -type f | wc -l) files)"
[ -d "$DEST_DIR/data" ] && echo "      ✅ data/ ($(find "$DEST_DIR/data" -type f | wc -l) files)"
[ -d "$DEST_DIR/js" ] && echo "      ✅ js/ ($(find "$DEST_DIR/js" -type f | wc -l) files)"
[ -d "$DEST_DIR/js/core" ] && echo "         ├── core/ ($(find "$DEST_DIR/js/core" -type f | wc -l) files)"
[ -d "$DEST_DIR/js/modules" ] && echo "         └── modules/ ($(find "$DEST_DIR/js/modules" -type f | wc -l) files)"
[ -d "$DEST_DIR/temp" ] && echo "      ✅ temp/ ($(find "$DEST_DIR/temp" -type f | wc -l) files)"

echo "🎯 Ready to build! Run ./build.sh to create APK"
