# DCC Custom StoryTeller - Code Analysis & Hierarchy

## Function Call Hierarchy Analysis
*Generated on August 30, 2025*

### Core Architecture Files

#### 1. **main.js** - Core utilities and initialization
- `window.toggleMapDebug()` - Debug mode toggle
- `window.testNetworkTileset()` - Network transmission test function
- `enableDebugForMaps()` - Auto-enable debug mode

#### 2. **MapDataFormatter.js** - Data format conversion
- `formatForSharing(mapData, mapName, options)` → calls `enrichWithTilesetConfig()`
- `enrichWithTilesetConfig(mapData)` → calls `loadTilesetConfig()`
- `loadTilesetConfig(tilesetName)` - Loads tileset configs for network transmission
- `detectFormat(mapData)` - Identifies map data format
- `convertToStandardFormat()` - Converts various formats to standard

#### 3. **MapSyncManager.js** - Network synchronization
- `shareMap(mapData, mapName, options)` → calls `prepareMapForSharing()`
- `prepareMapForSharing(mapData, mapName, options)` → calls `MapDataFormatter.formatForSharing()`
- `notifyPlayersMapUpdate()` - Sends real-time notifications
- `subscribeToPlayerPositions()` - Real-time position tracking

#### 4. **MapClientManager.js** - Player-side map receiving
- `initialize(supabaseClient, sessionCode, mapContainerId)` - Setup
- `initializeViewer()` → creates `new PlayerMapViewer()`
- `loadMap(mapRecord)` → calls `renderMap()`
- `renderMap(mapData)` → calls `PlayerMapViewer.renderMap()`
- `handleMapUpdate(payload)` → calls `loadMap()`

#### 5. **PlayerMapViewer.js** - Canvas-based map rendering (Player side)
- `constructor(containerId, canvasId)` → calls `initializeEventHandlers()`, `addZoomControls()`
- `renderMap(mapData)` → calls `renderCurrentMap()`
- `renderSpritesCanvas(mapData)` → calls `loadSpriteSheet()`, `loadTilesetConfig()`
- `loadTilesetConfig(tilesetName, networkTilesetConfig)` - Uses network config first
- Pan/zoom event handlers

#### 6. **PlayerMapViewerCanvas.js** - Canvas-based map rendering (StoryTeller side)
- Similar structure to PlayerMapViewer.js
- Used by StoryTeller's index.html for local map viewing

### Network Transmission Flow
```
StoryTeller → MapDataFormatter.formatForSharing()
           → MapSyncManager.shareMap()
           → Database Storage
           → Real-time notification
           → MapClientManager.handleMapUpdate()
           → PlayerMapViewer.renderMap()
```

### Potential Dead/Orphaned Code Candidates

#### Debug Code (Already Commented Out):
- ✅ PlayerMapViewer.js - Debug border drawing (lines 472-476)
- ✅ PlayerMapViewerCanvas.js - Debug border drawing (lines 487-491)

#### Potential Candidates for Removal:
1. **Duplicate functionality** between PlayerMapViewer.js and PlayerMapViewerCanvas.js
2. **Legacy format conversion** in MapDataFormatter if no longer used
3. **Unused sprite mapping functions** (numberToSprite, spriteToNumber)
4. **Redundant error handling** in multiple files
5. **Old CSS-based rendering code** if any remains

### Next Steps for Code Cleanup:
1. Identify which PlayerMapViewer file is actually needed in each context
2. Remove unused format conversion methods
3. Consolidate duplicate sprite mapping functions
4. Remove redundant error handling
5. Comment out unused event handlers

Would you like me to analyze any specific files for dead code removal?
