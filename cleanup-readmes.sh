#!/bin/bash

# DCC-Custom README Cleanup Script
# Removes consolidated README files from August 23 - September 2, 2025
# Run this after confirming the archive file contains all needed information

echo "🗂️  DCC-Custom README Cleanup Utility"
echo "======================================="
echo ""
echo "This script will remove the following consolidated files:"
echo ""

# List files to be removed
files_to_remove=(
    "2025-08-23.md"
    "2025-08-24.md" 
    "2025-08-25.md"
    "2025-08-25_MORNING.md"
    "2025-08-25_NIGHT.md"
    "2025-08-26_MORNING.md"
    "2025-08-26_NIGHT.md"
    "2025-08-27_MORNING.md"
    "2025-08-27_NIGHT.md"
    "2025-08-28_MORNING.md"
    "2025-08-28_NIGHT.md"
    "2025-08-29_MORNING.md"
    "2025-08-29_NIGHTLY.md"
    "2025-08-31_MORNING.md"
    "2025-08-31_NIGHT.md"
    "2025-08-31_early_morning.md"
    "2025-09-01_AVATAR_URL_SYSTEM.md"
    "2025-09-01_MORNING.md"
    "2025-09-01_NIGHT.md"
    "2025-09-02_MORNING.md"
    "2025-09-02_NIGHT.md"
)

# Count existing files
existing_count=0
total_size=0

for file in "${files_to_remove[@]}"; do
    if [[ -f "READMEs/$file" ]]; then
        existing_count=$((existing_count + 1))
        size=$(stat -f%z "READMEs/$file" 2>/dev/null || stat -c%s "READMEs/$file" 2>/dev/null || echo "0")
        total_size=$((total_size + size))
        echo "  📄 $file ($(echo "scale=1; $size/1024" | bc 2>/dev/null || echo "$(($size/1024))")KB)"
    fi
done

echo ""
echo "📊 Summary:"
echo "  • Files to remove: $existing_count"
echo "  • Total space to free: $(echo "scale=1; $total_size/1024" | bc 2>/dev/null || echo "$(($total_size/1024))")KB"
echo ""
echo "📋 Archive created: ARCHIVE_2025-08-09_EARLY_DEVELOPMENT.md"
echo "💡 IDEAS file updated: README_TODO.md → Comprehensive IDEAS & ROADMAP"
echo ""

# Confirmation prompt
read -p "❓ Proceed with cleanup? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧹 Cleaning up consolidated files..."
    
    removed_count=0
    for file in "${files_to_remove[@]}"; do
        if [[ -f "READMEs/$file" ]]; then
            rm "READMEs/$file"
            echo "  ✅ Removed: $file"
            removed_count=$((removed_count + 1))
        fi
    done
    
    echo ""
    echo "🎉 Cleanup complete!"
    echo "  • $removed_count files removed"
    echo "  • Archive preserved in: ARCHIVE_2025-08-09_EARLY_DEVELOPMENT.md"
    echo "  • Future ideas consolidated in: README_TODO.md"
    echo ""
    echo "📁 Remaining README structure:"
    ls -la READMEs/ | grep -E "\.(md)$" | wc -l | xargs echo "  • Total README files:"
    echo ""
    echo "🚀 Ready for continued development!"
    
else
    echo ""
    echo "❌ Cleanup cancelled. Files preserved."
    echo "💡 You can run this script again anytime to clean up."
fi

echo ""
echo "📚 Next steps:"
echo "  1. Review ARCHIVE_2025-08-09_EARLY_DEVELOPMENT.md for completeness"
echo "  2. Check README_TODO.md for consolidated ideas and roadmap"
echo "  3. Begin GRIND system implementation when ready!"
echo ""
