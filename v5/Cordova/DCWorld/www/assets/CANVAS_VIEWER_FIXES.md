# Map Canvas Viewer Issues - Diagnostic Report
*Created: August 30, 2025*

## 🐛 **Current Problem**
Map shows background colors but NO sprites in local Canvas viewer.

## 🔍 **Root Cause Analysis**

### Issue: Case Sensitivity in File Loading
**The Problem:**
```
Map data: "tileset": "Gothic" (capital G)
System tries to load: gothic.json, gothic.png (lowercase)
Actual files: Gothic.json, Gothic.png (capital G)
Result: 404 Not Found errors → No sprites rendered
```

**Error Log Evidence:**
```
GET http://127.0.0.1:5500/StoryTeller/assets/gothic.json [404 Not Found]
GET http://127.0.0.1:5500/StoryTeller/assets/gothic.png [404 Not Found]
Canvas: Failed to load tileset config gothic: Error: HTTP 404
Canvas: Error rendering local grid: Error: HTTP 404
```

**Files Actually Available:**
```
✅ assets/Gothic.json (capital G)
✅ assets/Gothic.png (capital G)
❌ assets/gothic.json (lowercase - doesn't exist)
❌ assets/gothic.png (lowercase - doesn't exist)
```

## 🛠️ **Required Fixes**

### Fix 1: Restore Cascading Fallback in PlayerMapViewerLocal.js
The rollback removed the cascading fallback system. Need to restore it in:

**File:** `/StoryTeller/js/PlayerMapViewerLocal.js`
**Methods to fix:**
1. `loadSpriteSheet()` - Add 3-tier fallback for PNG loading
2. `loadTilesetConfig()` - Add 3-tier fallback for JSON loading
3. `renderLocalGridCanvas()` - Remove force-lowercase conversion

**Required Logic:**
```javascript
// Try loading in this order:
1. tilesetName.toLowerCase() (current convention)
2. tilesetName (original case - user-friendly)  
3. 'default' (final fallback)
```

### Fix 2: Update Maps-Manager Conversion
Ensure the conversion doesn't force-lowercase the tileset name.

**File:** `/StoryTeller/js/maps-manager.js`
**Method:** `convertToStandardFormat()`

## 📋 **Implementation Plan**

### Step 1: Fix PlayerMapViewerLocal.js loadSpriteSheet()
```javascript
async loadSpriteSheet(tilesetName) {
    if (this.spriteSheets.has(tilesetName)) {
        return this.spriteSheets.get(tilesetName);
    }
    
    const attempts = [
        tilesetName.toLowerCase(),  // Try lowercase first
        tilesetName,               // Try original case
        'default'                  // Final fallback
    ];
    
    for (const attempt of attempts) {
        try {
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load ${attempt}.png`));
                image.src = `assets/${attempt}.png`;
            });
            
            this.spriteSheets.set(tilesetName, img);
            console.log(`✅ Canvas: Loaded sprite sheet ${tilesetName} using ${attempt}.png`);
            return img;
            
        } catch (error) {
            console.warn(`⚠️ Failed to load sprite sheet as ${attempt}.png:`, error.message);
        }
    }
    
    throw new Error(`Failed to load sprite sheet for ${tilesetName} - tried all fallbacks`);
}
```

### Step 2: Fix PlayerMapViewerLocal.js loadTilesetConfig()
```javascript
async loadTilesetConfig(tilesetName) {
    if (this.tilesetConfigs.has(tilesetName)) {
        return this.tilesetConfigs.get(tilesetName);
    }
    
    const attempts = [
        tilesetName.toLowerCase(),  // Try lowercase first
        tilesetName,               // Try original case
        'default'                  // Final fallback
    ];
    
    for (const attempt of attempts) {
        try {
            const response = await fetch(`assets/${attempt}.json`);
            if (response.ok) {
                const config = await response.json();
                this.tilesetConfigs.set(tilesetName, config);
                console.log(`✅ Canvas: Loaded tileset config ${tilesetName} using ${attempt}.json`);
                return config;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to load tileset config as ${attempt}.json:`, error.message);
        }
    }
    
    // Return empty config if all fail
    const emptyConfig = { backgroundColors: {}, sprites: [], gridSize: "4x4" };
    this.tilesetConfigs.set(tilesetName, emptyConfig);
    return emptyConfig;
}
```

### Step 3: Fix renderLocalGridCanvas()
Remove force-lowercase conversion:
```javascript
// BEFORE (broken):
const normalizedTilesetName = tileset.toLowerCase();

// AFTER (fixed):
// Use original case, let cascading fallback handle it
const [spriteSheet, tilesetConfig] = await Promise.all([
    this.loadSpriteSheet(tileset),      // Use original case
    this.loadTilesetConfig(tileset)     // Use original case
]);
```

## ✅ **Expected Result After Fix**
```
Map data: "tileset": "Gothic"
System tries: gothic.json (404) → Gothic.json (✅ SUCCESS!)
System tries: gothic.png (404) → Gothic.png (✅ SUCCESS!)
Result: Background colors AND sprites both render correctly
```

## 🧪 **Test Plan**
1. Apply the fixes above
2. Load the Gothic map with mountain sprites
3. Verify console shows: `✅ Canvas: Loaded sprite sheet Gothic using Gothic.png`
4. Verify console shows: `✅ Canvas: Loaded tileset config Gothic using Gothic.json`
5. Verify both background colors AND sprites render in Canvas viewer

---

**Priority:** HIGH - This completely breaks the Canvas map viewer for any non-lowercase tileset names.
