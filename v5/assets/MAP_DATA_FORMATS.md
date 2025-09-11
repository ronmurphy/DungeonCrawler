# Map Data Formats Documentation
*Last Updated: August 30, 2025*

## 📋 Overview
This document tracks the expected map data formats for the StoryTeller map system, discovered through code analysis to ensure proper data flow between components.

---

## 🎯 Key Map Data Formats

### 1. IndexedDB Local Format
**Used by:** Local storage, maps-manager.js internal storage  
**Rendered by:** `PlayerMapViewerLocal.js` → `renderLocalGridCanvas()`

```javascript
{
    mapData: {
        grid: [
            [
                { type: "sprite", value: "mountain" },  // Rich object format (preferred)
                "water",                                // Simple string format (supported)
                5,                                      // Numeric format (legacy support)
                null                                    // Empty tile
            ],
            // ... more rows (2D array structure)
        ],
        tileset: "default"  // Tileset name
    }
}
```

**Key Features:**
- 2D grid structure `[row][column]`
- Flexible cell data: objects, strings, numbers, or null
- Grid dimensions determined by array size
- Used for local IndexedDB storage

---

### 2. Network Format v1.2
**Used by:** Network transmission, player map viewer  
**Rendered by:** `PlayerMapViewerLocal.js` → `renderSpritesCanvas()`

```javascript
{
    width: 10,              // Map width in tiles
    height: 10,             // Map height in tiles
    spriteNames: [          // Flat array (width × height length)
        "mountain", 
        "water", 
        null,               // Empty tiles
        "grass", 
        // ... continues for width × height tiles
    ],
    tileset: "default",     // Tileset name
    backgroundColors: {     // Optional: per-sprite background colors
        "mountain": "#8B4513",
        "water": "#0077BE",
        "grass": "#228B22"
        // ... colors for each sprite type
    }
}
```

**Key Features:**
- Flat array structure with explicit dimensions
- Background colors included for visual enhancement
- Optimized for network transmission
- Used by player map viewers

---

## 🔄 Data Flow Requirements

### maps-manager.js Responsibilities:
1. **Store** maps in IndexedDB format (2D grid)
2. **Convert** to Network v1.2 format when transmitting to players  
3. **Handle** both formats when receiving data

### PlayerMapViewerLocal.js Format Detection:
```javascript
// Detection logic in renderCurrentMap()
if (this.currentMapData.mapData && this.currentMapData.mapData.grid) {
    // IndexedDB Local Format → renderLocalGridCanvas()
} else if (this.currentMapData.spriteNames) {
    // Network Format v1.2 → renderSpritesCanvas()
} else if (this.currentMapData.tiles) {
    // Legacy format (deprecated)
}
```

---

## 🎨 Tileset Integration

### Canvas Rendering Dependencies:
- **Sprite Sheet**: `assets/{tileset}.png`
- **Tileset Config**: `assets/{tileset}.json`
- **Background Colors**: From Network v1.2 format or tileset config

### Supported Cell Data Types:
1. **Rich Object**: `{ type: "sprite", value: "mountain" }` (IndexedDB)
2. **String**: `"mountain"` (both formats)
3. **Number**: `5` (legacy conversion)
4. **Empty**: `null` or `undefined`

---

## 🔍 Format Conversion Logic

### IndexedDB → Network v1.2:
```javascript
// 2D grid → flat array conversion needed
const spriteNames = [];
for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const spriteName = cell?.value || cell || null;
        spriteNames.push(spriteName);
    }
}
```

### Network v1.2 → IndexedDB:
```javascript
// Flat array → 2D grid conversion needed
const grid = [];
for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
        const index = y * width + x;
        row.push(spriteNames[index]);
    }
    grid.push(row);
}
```

---

## 📝 Next Investigation Points

- [x] Examine maps-manager.js conversion methods ✅
- [x] Identify v1_2map.json structure (the working format) ✅  
- [ ] Document current conversion bugs/issues
- [ ] Document player map viewer expected format
- [ ] Trace data flow from map editor → storage → transmission → rendering
- [ ] Test format compatibility between components

---

## 🔍 Working Format Analysis (v1_2map.json)

### Structure of v1_2map.json (WORKS):
```javascript
{
  "grid": [
    [
      {
        "type": "sprite",
        "value": "mountain",
        "name": "Mountain", 
        "category": "terrain",
        "emoji": "🏔️"
      },
      // ... more cells
    ],
    // ... more rows  
  ],
  "tileset": "default",
  "name": "v1.2Map",
  "size": 15,
  "type": "dungeon", 
  "created": "2025-08-28T22:09:04.095Z",
  "version": "1.2",
  "backgroundColors": {
    "mountain": "#8B4513",
    "water": "#0077BE",
    // ... more colors
  }
}
```

**Key Features of Working Format:**
- Direct `grid` property (not nested under `mapData`)
- Rich cell objects with `type`, `value`, `name`, `category`, `emoji`
- Top-level `tileset`, `size`, `backgroundColors` properties
- Metadata: `name`, `type`, `created`, `version`

---

## 🔄 Maps-Manager Conversion Logic

### convertToStandardFormat() Method:
```javascript
// Converts map data to PlayerMapViewerLocal expected format
convertToStandardFormat(mapData) {
    // INPUT: Raw map data from IndexedDB
    // OUTPUT: PlayerMapViewerLocal IndexedDB format
    
    return {
        version: '1.2',
        format: 'local-indexeddb', 
        metadata: {
            title: 'Local Map',
            tileset: tileset,
            size: grid.length
        },
        mapData: {           // ← Wraps in mapData object
            grid: grid,      // ← 2D array 
            tileset: tileset // ← Tileset name
        }
    };
}
```

### loadMapFormat() Method:
```javascript
// Converts different formats for map editor loading
async loadMapFormat(mapData, mapId) {
    // Handles multiple input formats:
    // 1. mapData.data.grid (nested format)
    // 2. mapData.grid (direct grid) ← v1_2map.json uses this
    // 3. mapData.mapData (flat array - converts to grid)
    
    // OUTPUT: Normalized editor format
    let normalizedData = {
        grid: ...,     // 2D array
        name: ...,
        size: ..., 
        tileset: ...,
        type: ...
    };
}
```

---

## 🐛 Potential Issue Identified

**Format Mismatch:**
- **v1_2map.json** (works): Has direct `grid` property
- **convertToStandardFormat()**: Wraps grid under `mapData.grid` 
- **PlayerMapViewerLocal**: Expects `mapData.grid` format

**Possible Problem:** 
Newer maps might be stored differently than v1_2map.json format, causing conversion issues in maps-manager.

---

## 🚫 Deprecated Formats

### Legacy Tiles Format (No Longer Used)
```javascript
{
    width: 10,
    height: 10,
    tiles: [1, 2, 0, 3, ...],  // Numeric tile IDs
    tileset: "default"
}
```
**Status:** Supported for backward compatibility but not actively used.

---

*This document will be updated as we discover more about the map system data flow.*

---

## 🧪 **Testing Plan - One Last Fix Attempt**

### Test Setup:
1. ✅ Remove all test maps from IndexedDB  
2. ✅ Create simple 10x10 map
3. ✅ Use "Transparent" tileset (known working)
4. ✅ Create a few sprites in sprite sheet editor
5. ✅ Test complete workflow

### Tileset Selector Fix:
**Issue:** Tileset selector loading full maps instead of tileset.json files

**Current System (Should Work):**
- `assets/tileset.list` defines available tilesets ✅
- `loadAvailableTilesets()` reads tileset.list ✅  
- Only loads tilesets with both .png and .json files ✅
- `populateTilesetDropdown()` populates from availableTilesets ✅

**Available in tileset.list:**
- default, forest, GreenTest, Gothic, **Transparent**, NewSet, SpriteSheetTestFile, btest2

### Potential Issue:
Maps might be accidentally loaded into tileset selector instead of actual tilesets.

### Test Plan:
1. Clean slate: Remove test maps ✅
2. Verify tileset selector shows only tilesets from tileset.list ✅
3. Select "Transparent" tileset ✅
4. Create 10x10 map with a few sprites ✅
5. Test save/load workflow ✅
6. Verify Canvas rendering works ✅

### 🐛 **Issue Found & Fixed:**
**Problem:** Background colors showing but no sprites in Canvas viewer

**Root Cause:** Case sensitivity mismatch
- Map data: `"tileset": "Transparent"` (capital T)
- Files exist: `assets/Transparent.png`, `assets/Transparent.json` 
- Canvas viewer: Was force-lowercasing to `transparent.png` ❌

**Solution:** Implemented cascading fallback in PlayerMapViewerLocal.js:
1. Try lowercase first: `transparent.png`  
2. Try original case: `Transparent.png` ✅
3. Final fallback: `default.png`

**Files Updated:**
- `loadSpriteSheet()` - Added 3-tier fallback for PNG loading
- `loadTilesetConfig()` - Added 3-tier fallback for JSON loading  
- `renderLocalGridCanvas()` - Removed force-lowercase conversion

**Expected Result:** transparentTest map should now show both background colors AND sprites!
