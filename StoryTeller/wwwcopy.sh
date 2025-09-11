#!/bin/bash
# wwwcopy.sh - Copy StoryTeller development files to Cordova www directory
# Run this from the StoryTeller directory: ./wwwcopy.sh

echo "🔄 Copying StoryTeller development files to Cordova www..."

# Define source and destination directories
SOURCE_DIR="/home/brad/Documents/DCC-custom/StoryTeller"
DEST_DIR="/home/brad/Documents/DCC-custom/StoryTeller/Cordova/StoryTellerApp/www"

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
rm -f "$DEST_DIR"/*.ico 2>/dev/null
rm -f "$DEST_DIR"/*.md 2>/dev/null

# Remove old subdirectories to ensure clean copy
echo "🧹 Cleaning old subdirectories..."
rm -rf "$DEST_DIR"/assets 2>/dev/null
rm -rf "$DEST_DIR"/css 2>/dev/null
rm -rf "$DEST_DIR"/data 2>/dev/null
rm -rf "$DEST_DIR"/js 2>/dev/null
rm -rf "$DEST_DIR"/other 2>/dev/null
rm -rf "$DEST_DIR"/Other 2>/dev/null

# Copy individual files (not in subfolders) - excluding certain files
echo "📁 Copying main web files..."
cp "$SOURCE_DIR"/*.html "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.css "$DEST_DIR"/ 2>/dev/null  
cp "$SOURCE_DIR"/*.js "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.json "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.ico "$DEST_DIR"/ 2>/dev/null

# Copy specific important files
if [ -f "$SOURCE_DIR/supabase.key.md" ]; then
    cp "$SOURCE_DIR/supabase.key.md" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ Supabase key file copied"
fi

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
    echo "   ✅ JS directory copied"
else
    echo "   ⚠️  JS directory not found"
fi

echo "📁 Copying other directory..."
if [ -d "$SOURCE_DIR/other" ]; then
    cp -r "$SOURCE_DIR/other" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ other directory copied"
fi

echo "📁 Copying Other directory..."
if [ -d "$SOURCE_DIR/Other" ]; then
    cp -r "$SOURCE_DIR/Other" "$DEST_DIR"/ 2>/dev/null
    echo "   ✅ Other directory copied"
fi

# Copy shared modules (important for StoryTeller functionality)
echo "📁 Copying shared-modules directory..."
if [ -d "/home/brad/Documents/DCC-custom/shared-modules" ]; then
    cp -r "/home/brad/Documents/DCC-custom/shared-modules" "$DEST_DIR"/../ 2>/dev/null
    echo "   ✅ Shared-modules directory copied"
else
    echo "   ⚠️  Shared-modules directory not found"
fi

# Remove Cordova default files that might conflict
echo "🧹 Removing default Cordova files..."
rm -f "$DEST_DIR"/cordova.js 2>/dev/null
rm -f "$DEST_DIR"/cordova_plugins.js 2>/dev/null

# Count copied files
FILE_COUNT=$(find "$DEST_DIR" -type f | wc -l)
DIR_COUNT=$(find "$DEST_DIR" -type d | wc -l)

echo ""
echo "✅ Copy completed successfully!"
echo "   📄 Files copied: $FILE_COUNT"
echo "   📁 Directories: $DIR_COUNT"
echo "   📍 Destination: $DEST_DIR"
echo ""
echo "🔨 Ready for Cordova build!"
