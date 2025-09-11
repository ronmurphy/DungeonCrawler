# 🎨 Sprite Sheet Integration Guide

## For Michelle - Custom Tile Integration

### 🚀 Quick Setup Instructions

**1. Add Your Sprite Sheet:**
Place your `dungeon_sprite_sheet_ordered.png` file in:
```
/StoryTeller/assets/dungeon_sprite_sheet_ordered.png
```

**2. Test the Integration:**
- Open StoryTeller
- Go to the Map Editor tab
- Look for the status indicator in bottom-right corner:
  - 🎨 **Green**: "Enhanced sprites active" - YOUR TILES ARE WORKING! ✅
  - 📝 **Orange**: "Using emoji tiles (sprites not found)" - Need to add sprite sheet

**3. Visual Confirmation:**
When working correctly, you should see your beautiful custom tiles instead of emojis in:
- The tile selector palette
- The map grid when placing tiles
- Saved maps when loaded

---

## 🎯 Current Sprite Sheet Integration

### **Sprite Order (Matches Your Design):**

| Index | Your Tile | Description | Map Editor Usage |
|-------|-----------|-------------|------------------|
| 0 | Mountain | Grey rocky texture | 🏔️ Mountain terrain |
| 1 | Water | Blue with waves | 💧 Water features |
| 2 | Grass | Green with details | 🌿 Grass/nature |
| 3 | Rock/Wall | Grey brick pattern | 🗻 Stone walls |
| 4 | Castle | Grey fortress | 🏰 Major buildings |
| 5 | House | Orange roof house | 🏠 Residential |
| 6 | Shop | Market with awnings | 🏪 Commercial |
| 7 | Temple | White columns | ⛪ Religious sites |
| 8 | Dragon | Orange dragon head | 🐉 Monster encounters |
| 9 | Sword | Silver sword | ⚔️ Weapons/combat |
| 10 | Skull | White skull | 💀 Danger/death |
| 11 | Warning | Orange triangle | ⚠️ Hazards |
| 12 | Tower | Grey stone tower | 🗼 Defensive structures |
| 13 | Road | Grey stone path | 🛤️ Travel routes |
| 14 | Door | Wooden door | 🚪 Entrances |
| 15 | Fire | Orange flame | 🔥 Fire hazards |

### **Sprite Sheet Specifications:**
- **File Format:** PNG with transparency
- **Total Size:** 256x256 pixels
- **Tile Size:** 64x64 pixels each
- **Grid:** 4x4 tiles (16 total)
- **Style:** Pixelated/retro-friendly

---

## 🛠️ Technical Details

### **Automatic Fallback System:**
If your sprite sheet isn't found, the map editor automatically falls back to emoji tiles. This means:
- ✅ **No breaking changes** if sprite sheet is missing
- ✅ **Seamless transition** between emoji and sprite modes
- ✅ **User-friendly feedback** with status indicator

### **Integration Code (Already Implemented):**
```javascript
// Sprite configuration
const SPRITE_CONFIG = {
    enabled: true,
    path: 'assets/dungeon_sprite_sheet_ordered.png',
    tileSize: 64,
    sheetSize: 256,
    tilesPerRow: 4
};

// Your tiles are automatically mapped to:
{ type: "sprite", spriteIndex: 0, emoji: "🏔️", name: "Mountain" }
{ type: "sprite", spriteIndex: 1, emoji: "💧", name: "Water" }
// ... etc for all 16 tiles
```

### **CSS Styling (Already Added):**
```css
.sprite-tile {
    width: 32px;
    height: 32px;
    background-repeat: no-repeat;
    image-rendering: pixelated; /* Keeps your pixel art crisp */
}
```

---

## 🎨 Artistic Notes

### **What Makes This Integration Special:**
1. **Pixel-Perfect Rendering:** Your tiles will display crisp and clear
2. **Consistent Style:** All tiles work together as a cohesive set
3. **Professional Look:** Transforms the map editor from basic to beautiful
4. **DM-Friendly:** Clear, recognizable icons that enhance gameplay

### **Future Expansion Ideas:**
- **Character tokens** (players, NPCs)
- **Weather effects** (rain, snow, fog)
- **Magic items** (scrolls, potions, artifacts)
- **Environmental hazards** (traps, lava, poison)

### **Feedback Welcome:**
- How do the tiles look in practice?
- Any adjustments needed for clarity?
- Ideas for additional tile sets?

---

## 🚀 Testing Your Integration

### **Step-by-Step Verification:**

1. **Place sprite sheet:** Add `dungeon_sprite_sheet_ordered.png` to `/StoryTeller/assets/`

2. **Open StoryTeller:** Launch the app in browser

3. **Go to Map Editor:** Click the Map tab in any panel

4. **Check status indicator:** Look for green "🎨 Enhanced sprites active" message

5. **Test tile selection:** Click tiles in the palette - should see your artwork

6. **Test map creation:** Place tiles on the grid - should render your sprites

7. **Test save/load:** Create a map, save it, reload - sprites should persist

### **If Something Goes Wrong:**
- Check browser console (F12) for error messages
- Verify sprite sheet path and filename match exactly
- Ensure sprite sheet is 256x256 pixels with 4x4 grid
- Orange status indicator means sprite sheet wasn't found

---

## 🎉 Success Metrics

**When everything works correctly, you'll see:**
- ✅ Green status indicator
- ✅ Your custom tiles in the selector palette
- ✅ Beautiful sprites rendering on the map grid
- ✅ Professional-looking battle maps that enhance D&D sessions
- ✅ Happy DMs using your artistic vision in their games!

**This integration transforms the map editor from functional to fantastic!** 🗺️✨

---

*Thank you for contributing your artistic talents to make D&D more visually engaging!*
