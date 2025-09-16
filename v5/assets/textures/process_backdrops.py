#!/usr/bin/env python3
"""
Backdrop Texture Processor
Backs up and processes backdrop wall textures for better cylinder mapping:
- Creates backup copies with _original suffix
- Resizes images to larger dimensions (better for cylinder wrapping)
- Mirrors images horizontally (fixes orientation in 3D)

Requirements: pip install Pillow
Usage: python3 process_backdrops.py
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ Pillow not installed. Please run:")
    print("   pip install Pillow")
    print("   or: sudo pacman -S python-pillow")
    sys.exit(1)

def process_backdrops():
    """Process all backdrop wall textures in current directory"""
    current_dir = Path('.')
    backdrop_files = list(current_dir.glob('*_backdrop_wall.png'))
    
    if not backdrop_files:
        print("❌ No backdrop wall files found (*_backdrop_wall.png)")
        return
    
    print(f"🎨 Found {len(backdrop_files)} backdrop files to process")
    
    for file_path in backdrop_files:
        print(f"\n📁 Processing: {file_path.name}")
        
        # Create backup filename
        backup_name = file_path.stem + '_original' + file_path.suffix
        backup_path = file_path.parent / backup_name
        
        # Step 1: Create backup if it doesn't exist
        if backup_path.exists():
            print(f"   ⚠️  Backup already exists: {backup_name}")
        else:
            print(f"   💾 Creating backup: {backup_name}")
            import shutil
            shutil.copy2(file_path, backup_path)
        
        try:
            # Step 2: Load image
            print(f"   🖼️  Loading image...")
            img = Image.open(file_path)
            original_size = img.size
            print(f"   📏 Original size: {original_size[0]}x{original_size[1]}")
            
            # Step 3: Resize to larger dimensions (good for cylinder mapping)
            # Make it wider and taller for better cylinder texture coverage
            new_width = max(2048, original_size[0] * 2)  # At least 2048px wide
            new_height = max(1024, original_size[1] * 2)  # At least 1024px tall
            
            print(f"   🔄 Resizing to: {new_width}x{new_height}")
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Step 4: Mirror horizontally (flip left-right)
            print(f"   🪞 Mirroring horizontally...")
            img_mirrored = img_resized.transpose(Image.FLIP_LEFT_RIGHT)
            
            # Step 5: Save processed image
            print(f"   💾 Saving processed image...")
            img_mirrored.save(file_path, 'PNG', optimize=True)
            
            print(f"   ✅ Successfully processed {file_path.name}")
            
        except Exception as e:
            print(f"   ❌ Error processing {file_path.name}: {e}")
            continue
    
    print(f"\n🎉 Processing complete!")
    print(f"📋 Summary:")
    print(f"   - Backup files created with '_original' suffix")
    print(f"   - Images resized to larger dimensions for better cylinder mapping")
    print(f"   - Images mirrored horizontally for correct 3D orientation")

def restore_backdrops():
    """Restore original backdrop files from backups"""
    current_dir = Path('.')
    backup_files = list(current_dir.glob('*_backdrop_wall_original.png'))
    
    if not backup_files:
        print("❌ No backup files found (*_backdrop_wall_original.png)")
        return
    
    print(f"🔄 Found {len(backup_files)} backup files to restore")
    
    for backup_path in backup_files:
        # Determine original filename
        original_name = backup_path.name.replace('_original', '')
        original_path = backup_path.parent / original_name
        
        print(f"   📁 Restoring: {original_name}")
        
        try:
            import shutil
            shutil.copy2(backup_path, original_path)
            print(f"   ✅ Restored {original_name}")
        except Exception as e:
            print(f"   ❌ Error restoring {original_name}: {e}")
    
    print(f"🎉 Restore complete!")

if __name__ == "__main__":
    print("🎨 Backdrop Texture Processor")
    print("=" * 40)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--restore":
        restore_backdrops()
    else:
        print("This will:")
        print("1. Backup all *_backdrop_wall.png files")
        print("2. Resize them to larger dimensions")
        print("3. Mirror them horizontally")
        print("\nUse --restore to restore from backups")
        
        response = input("\nProceed? (y/N): ").lower().strip()
        if response in ['y', 'yes']:
            process_backdrops()
        else:
            print("Cancelled.")