# Adding New Tilesets to the Map Editor

## Quick Steps:
1. **Add your sprite sheet** → Copy your PNG file to this `/assets/` folder
2. **Create config file** → Copy `template.json`, rename it to match your PNG, and customize the colors
3. **Update tileset list** → Add your tileset name to `tileset.list`
4. **Restart map editor** → Refresh browser to see your new tileset

## Detailed Instructions:

### Step 1: Prepare Your Sprite Sheet
- Your PNG should be a 4x4 grid of 64x64 pixel sprites (total size: 256x256)
- Sprites should have transparent backgrounds
- Save as `YourTilesetName.png` in this folder

### Step 2: Create Configuration File
- Copy `template.json` to `YourTilesetName.json`
- Edit the JSON file:
  - Change "name" and "description" 
  - Customize the "backgroundColors" with colors that match your sprites
  - Update sprite positions if your layout differs from the 4x4 standard

### Step 3: Register Your Tileset
- Open `tileset.list` in a text editor
- Add a new line with your tileset name (without .png/.json extension)
- Save the file

### Step 4: Test
- Refresh the map editor
- Your new tileset should appear in the dropdown
- Test switching between tilesets to verify everything works

## Example:
If you want to add a "mystical" tileset:
- Save sprite sheet as: `mystical.png`
- Copy template.json to: `mystical.json` (edit colors and metadata)
- Add line to tileset.list: `mystical`
- Refresh map editor → "Mystical" appears in dropdown

## Color Customization:
The background colors in the JSON file appear behind your transparent sprites. Choose colors that complement your artwork:
- Use hex colors like `#FF5722` or `#8B7355`
- Consider the theme (forest = greens, dungeon = grays/browns, mystical = purples, etc.)
- Test different colors to see what looks best with your sprites
