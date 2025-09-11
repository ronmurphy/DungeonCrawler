// ========================================
// MAP EDITOR - Modal Version
// Based on StoryTeller.mobile.old with Michelle's sprites
// ========================================

// ========================================
// TILE DEFINITIONS
// ========================================
const tileOptions = [
    // Terrain with Michelle's sprites
    { type: "sprite", value: "mountain", name: "Mountain", category: "terrain", emoji: "🏔️" },
    { type: "sprite", value: "water", name: "Water", category: "terrain", emoji: "🌊" },
    { type: "sprite", value: "grass", name: "Grass", category: "terrain", emoji: "🌿" },
    { type: "sprite", value: "rock", name: "Rock", category: "terrain", emoji: "🪨" },
    
    // Buildings with Michelle's sprites
    { type: "sprite", value: "castle", name: "Castle", category: "buildings", emoji: "🏰" },
    { type: "sprite", value: "house", name: "House", category: "buildings", emoji: "🏠" },
    { type: "sprite", value: "shop", name: "Shop", category: "buildings", emoji: "🏪" },
    { type: "sprite", value: "temple", name: "Temple", category: "buildings", emoji: "🏛️" },
    
    // RPG Elements with Michelle's sprites
    { type: "sprite", value: "dragon", name: "Dragon", category: "monsters", emoji: "🐉" },
    { type: "sprite", value: "sword", name: "Sword", category: "items", emoji: "⚔️" },
    { type: "sprite", value: "skull", name: "Skull", category: "hazards", emoji: "💀" },
    { type: "sprite", value: "danger", name: "Danger", category: "hazards", emoji: "⚠️" },
    
    // Special with Michelle's sprites
    { type: "sprite", value: "tower", name: "Tower", category: "buildings", emoji: "🗼" },
    { type: "sprite", value: "road", name: "Road", category: "paths", emoji: "🛣️" },
    { type: "sprite", value: "door", name: "Door", category: "features", emoji: "🚪" },
    { type: "sprite", value: "fire", name: "Fire", category: "hazards", emoji: "🔥" },
    
    // Tools (always emoji)
    { type: "player", value: "👤", name: "Player", category: "tokens", emoji: "👤" },
    { type: "clear", value: "", name: "Clear", category: "tools", emoji: "❌" }
];

// ========================================
// MAP STATE
// ========================================
let currentMap = {
    size: 15,
    mapData: [],
    playerLayer: [],
    name: "Untitled Map",
    type: "dungeon"
};

let currentSelection = tileOptions[0];
let isDragging = false;
let spritesEnabled = false;

// ========================================
// TILESET SYSTEM
// ========================================
let currentTileset = 'default';
let availableTilesets = [];
let tilesetData = null;

async function loadAvailableTilesets() {
    // Load tileset list from external file
    let knownTilesets = ['default']; // Fallback
    
    try {
        const response = await fetch('assets/tileset.list');
        if (response.ok) {
            const tilesetListText = await response.text();
            // Parse the file - split by lines, remove comments and empty lines
            knownTilesets = tilesetListText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .filter(line => line.length > 0);
            console.log('📋 Loaded tileset list from file:', knownTilesets);
        } else {
            console.log('⚠️ Could not load tileset.list, using fallback');
        }
    } catch (error) {
        console.log('⚠️ Error loading tileset.list:', error, 'using fallback');
    }
    
    availableTilesets = {};
    
    for (const tileset of knownTilesets) {
        try {
            // Check if both PNG and JSON exist by trying to load the JSON
            const response = await fetch(`assets/${tileset}.json`);
            if (response.ok) {
                const config = await response.json();
                availableTilesets[tileset] = config;
                console.log(`✅ Found tileset: ${tileset}`);
            }
        } catch (error) {
            console.log(`⚠️ Tileset ${tileset} not available`);
        }
    }
    
    // Load custom tilesets from IndexedDB
    await loadCustomTilesetsOnInit();
    
    // Ensure default is always available as fallback
    if (!availableTilesets.default) {
        availableTilesets.default = {
            name: "Default",
            description: "Default dungeon tileset",
            backgroundColors: {},
            sprites: {}
        };
    }
    
    console.log('📁 Available tilesets:', Object.keys(availableTilesets));
    return availableTilesets;
}

async function loadTilesetData(tilesetName) {
    try {
        // Check if it's a custom tileset first
        if (availableTilesets[tilesetName] && availableTilesets[tilesetName].imageUrl) {
            // Custom tileset from IndexedDB
            tilesetData = availableTilesets[tilesetName];
            console.log(`✅ Loaded custom tileset data: ${tilesetData.name}`);
        } else {
            // Regular tileset from assets folder
            const response = await fetch(`assets/${tilesetName}.json`);
            tilesetData = await response.json();
            console.log(`✅ Loaded tileset data: ${tilesetData.name}`);
        }
        
        // COPY VIEWER'S APPROACH: Store background colors globally like the viewer does
        if (!window.tilesetData) {
            window.tilesetData = {};
        }
        window.tilesetData.backgroundColors = tilesetData.backgroundColors;
        
        if (window.showDebug) {
            console.log(`🎨 Map Editor: Set global background colors like viewer:`, window.tilesetData.backgroundColors);
        }
        
        return tilesetData;
        
    } catch (error) {
        console.error(`❌ Failed to load tileset data for ${tilesetName}:`, error);
        return null;
    }
}

async function switchTileset(tilesetName) {
    currentTileset = tilesetName;
    
    // Load tileset data
    await loadTilesetData(tilesetName);
    
    // Remove any existing tileset styles to prevent conflicts
    const existingStyles = document.querySelectorAll('style[data-tileset-style]');
    existingStyles.forEach(style => style.remove());
    
    // Update CSS to use new sprite sheet - inject specific rules for each sprite
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-tileset-style', 'true'); // Mark for easy removal
    const imageUrl = (tilesetData && tilesetData.imageUrl) ? 
        tilesetData.imageUrl : 
        `assets/${tilesetName}.png?v=${Date.now()}`; // Add cache buster
    
    // Create specific CSS rules for each sprite type to ensure override
    const spriteClasses = [
        'mountain', 'water', 'grass', 'rock', 'castle', 'house', 'shop', 'temple',
        'dragon', 'sword', 'skull', 'danger', 'tower', 'road', 'door', 'fire'
    ];
    
    let cssRules = `
        /* Base sprite rule - sprites fill their container */
        .sprite {
            background-image: url('${imageUrl}') !important;
            width: 100% !important;
            height: 100% !important;
            background-size: 400% 400% !important;
            background-repeat: no-repeat !important;
            display: block !important;
        }
        /* Specific sprite rules with exact positions for 4x4 grid */
    `;
    
    // Position each sprite in the 4x4 grid (each sprite is 25% of the sheet)
    const spritePositions = {
        'mountain': '0% 0%',           // Row 1, Col 1
        'water': '33.333% 0%',         // Row 1, Col 2  
        'grass': '66.666% 0%',         // Row 1, Col 3
        'rock': '100% 0%',             // Row 1, Col 4
        'castle': '0% 33.333%',        // Row 2, Col 1
        'house': '33.333% 33.333%',    // Row 2, Col 2
        'shop': '66.666% 33.333%',     // Row 2, Col 3
        'temple': '100% 33.333%',      // Row 2, Col 4
        'dragon': '0% 66.666%',        // Row 3, Col 1
        'sword': '33.333% 66.666%',    // Row 3, Col 2
        'skull': '66.666% 66.666%',    // Row 3, Col 3
        'danger': '100% 66.666%',      // Row 3, Col 4
        'tower': '0% 100%',            // Row 4, Col 1
        'road': '33.333% 100%',        // Row 4, Col 2
        'door': '66.666% 100%',        // Row 4, Col 3
        'fire': '100% 100%'            // Row 4, Col 4
    };
    
    spriteClasses.forEach(sprite => {
        const position = spritePositions[sprite] || '0% 0%';
        cssRules += `
        .selector-tile .sprite.${sprite},
        .map-tile .sprite.${sprite},
        .sprite.${sprite} {
            background-image: url('${imageUrl}') !important;
            background-position: ${position} !important;
            background-size: 400% 400% !important;
        }`;
    });
    
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
    
    console.log(`🎨 Updated sprite CSS with specific rules for: ${imageUrl}`);
    
    // Check if sprites are available and update status
    await checkSprites();
    updateSpriteStatus();
    
    // Force refresh the tile selector to apply new styles
    const modal = document.getElementById('map-editor-modal');
    if (modal && modal.style.display === 'flex') {
        // Small delay to ensure CSS is applied before recreating elements
        setTimeout(() => {
            createModalTileSelector();
            // PRESERVE MAP DATA: Don't call resizeModalMap() which might clear data
            // Instead, just re-render the existing map with the new tileset
            renderCurrentMap();
        }, 100);
    }
    
    console.log(`🔄 Switched to tileset: ${tilesetName}, sprites enabled: ${spritesEnabled}`);
}

// ========================================
// MODAL MANAGEMENT
// ========================================
function openMapModal() {
    // Auto-enable debug mode for map operations
    if (typeof enableDebugForMaps === 'function') {
        enableDebugForMaps();
    }
    
    console.log('🗺️ openMapModal called!');
    
    const modal = document.getElementById('map-editor-modal');
    if (modal) {
        modal.remove();
    }
    
    // Create a new full-screen modal from scratch
    const newModal = document.createElement('div');
    newModal.id = 'map-editor-modal';
    newModal.className = 'map-editor-modal';
    newModal.onclick = function(event) { closeMapModal(event); };
    
    newModal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important;
        z-index: 999999 !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        padding: 20px !important;
        box-sizing: border-box !important;
    `;
    
    newModal.innerHTML = `
        <div class="modal-content map-editor-modal-content" onclick="event.stopPropagation()" style="
            background: var(--bg-primary, #ffffff) !important;
            border: 2px solid var(--border-color, #ccc) !important;
            width: 98vw !important;
            height: 95vh !important;
            display: flex !important;
            flex-direction: column !important;
            visibility: visible !important;
            opacity: 1 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        ">
            <!-- Modal Header -->
            <div class="modal-header" style="
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 16px 24px !important;
                background: var(--bg-secondary, #f8f9fa) !important;
                border-bottom: 2px solid var(--border-color, #ccc) !important;
                min-height: 60px !important;
            ">
                <h2 style="margin: 0 !important; color: var(--text-primary, #333) !important; font-size: 1.5rem !important;">🗺️ Map Editor</h2>
                <div style="display: flex !important; align-items: center !important; gap: 16px !important;">
                    <div class="tileset-dropdown">
                        <select id="tileset-selector" onchange="switchTileset(this.value)">
                            <option value="default">Default Tileset</option>
                        </select>
                    </div>
                    <button class="import-tileset-btn" onclick="importCustomTileset()">
                        📁 Import Tileset
                    </button>
                    <input type="file" class="import-tileset-input" id="tileset-file-input" accept=".png,.json" multiple onchange="handleTilesetFiles(this.files)">
                    <div id="modal-sprite-status" style="
                        padding: 4px 8px !important;
                        background: #28a745 !important;
                        color: white !important;
                        border-radius: 4px !important;
                        font-size: 0.8rem !important;
                    ">Sprites Ready</div>
                    <button onclick="closeMapModal()" style="
                        background: #dc3545 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 12px !important;
                        font-size: 18px !important;
                        border-radius: 4px !important;
                        cursor: pointer !important;
                        width: 32px !important;
                        height: 32px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">×</button>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="modal-body" style="
                flex: 1 !important;
                display: flex !important;
                padding: 16px !important;
                gap: 16px !important;
                overflow: hidden !important;
            ">
                <!-- Left Panel - Controls -->
                <div style="
                    width: 300px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 16px !important;
                    overflow-y: auto !important;
                ">
                    <!-- Map Size Controls -->
                    <div style="
                        background: var(--bg-secondary, #f8f9fa) !important;
                        padding: 16px !important;
                        border-radius: 8px !important;
                        border: 1px solid var(--border-color, #ccc) !important;
                    ">
                        <h4 style="margin: 0 0 12px 0 !important; color: var(--text-primary, #333) !important;">Map Size:</h4>
                        
                        <!-- Size Slider -->
                        <div style="margin-bottom: 12px !important;">
                            <input type="range" id="map-size-slider" min="10" max="50" step="5" value="20" 
                                   onchange="setMapSizeFromSlider(this.value)" style="
                                width: 100% !important;
                                margin-bottom: 8px !important;
                            ">
                            <div style="display: flex !important; justify-content: space-between !important; font-size: 0.8rem !important; color: var(--text-secondary, #666) !important;">
                                <span>10x10</span>
                                <span id="current-size-display">20x20</span>
                                <span>50x50</span>
                            </div>
                        </div>
                        
                        <div style="display: flex !important; gap: 8px !important; flex-wrap: wrap !important;">
                            <button class="size-btn" data-size="small" onclick="setMapSize('small')" style="
                                padding: 8px 12px !important;
                                background: #007bff !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">10</button>
                            <button class="size-btn active" data-size="medium" onclick="setMapSize('medium')" style="
                                padding: 8px 12px !important;
                                background: #28a745 !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">20</button>
                            <button class="size-btn" data-size="large" onclick="setMapSize('large')" style="
                                padding: 8px 12px !important;
                                background: #dcc149ff !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">30</button>
                            <button class="size-btn" data-size="extra" onclick="setMapSize('extra')" style="
                                padding: 8px 12px !important;
                                background: #17a2b8 !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">40</button>
                            <button class="size-btn" data-size="biggest" onclick="setMapSize('biggest')" style="
                                padding: 8px 12px !important;
                                background: #6f42c1 !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">50</button>
                        </div>
                        <button onclick="clearMap()" style="
                            margin-top: 12px !important;
                            padding: 8px 16px !important;
                            background: #ffc107 !important;
                            color: #000 !important;
                            border: none !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            width: 100% !important;
                        ">🗑️ Clear Map</button>
                    </div>
                    
                    <!-- Tile Selector -->
                    <div style="
                        background: var(--bg-secondary, #f8f9fa) !important;
                        padding: 16px !important;
                        border-radius: 8px !important;
                        border: 1px solid var(--border-color, #ccc) !important;
                        flex: 1 !important;
                    ">
                        <h4 style="margin: 0 0 12px 0 !important; color: var(--text-primary, #333) !important;">Select Tile:</h4>
                        <div id="modal-tile-selector" style="
                            display: grid !important;
                            grid-template-columns: repeat(3, 1fr) !important;
                            gap: 4px !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        "></div>
                    </div>
                </div>
                
                <!-- Right Panel - Map Grid -->
                <div style="
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    background: var(--bg-secondary, #f8f9fa) !important;
                    border-radius: 8px !important;
                    border: 1px solid var(--border-color, #ccc) !important;
                    padding: 16px !important;
                ">
                    <div style="
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        margin-bottom: 16px !important;
                    ">
                        <input type="text" id="modal-map-name" placeholder="Enter map name..." value="Untitled Map" style="
                            padding: 8px 12px !important;
                            border: 1px solid var(--border-color, #ccc) !important;
                            border-radius: 4px !important;
                            font-size: 14px !important;
                            background: var(--bg-primary, white) !important;
                            color: var(--text-primary, #333) !important;
                            flex: 1 !important;
                            margin-right: 12px !important;
                        ">
                        <button onclick="saveMapToLibrary().catch(console.error)" style="
                            padding: 8px 16px !important;
                            background: var(--accent-color, #007bff) !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            margin-right: 8px !important;
                        ">📚 Save to Library</button>
                        <button onclick="saveMapAsFile().catch(console.error)" style="
                            padding: 8px 16px !important;
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">💾 Save as File</button>
                    </div>
                    
                    <!-- Map Display Area with Pan/Zoom -->
                    <div style="
                        flex: 1 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        overflow: hidden !important;
                    ">
                        <!-- Zoom Controls -->
                        <div style="
                            display: flex !important;
                            gap: 8px !important;
                            align-items: center !important;
                            padding: 8px !important;
                            background: var(--bg-secondary, #f8f9fa) !important;
                            border-radius: 4px !important;
                            margin-bottom: 8px !important;
                        ">
                            <button onclick="zoomOut()" style="
                                padding: 4px 8px !important;
                                background: var(--bg-primary, white) !important;
                                border: 1px solid var(--border-color, #ccc) !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                            ">🔍−</button>
                            <span id="zoom-level" style="
                                font-size: 0.9rem !important;
                                color: var(--text-primary, #333) !important;
                                min-width: 50px !important;
                                text-align: center !important;
                            ">100%</span>
                            <button onclick="zoomIn()" style="
                                padding: 4px 8px !important;
                                background: var(--bg-primary, white) !important;
                                border: 1px solid var(--border-color, #ccc) !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                            ">🔍+</button>
                            <button onclick="resetZoom()" style="
                                padding: 4px 8px !important;
                                background: var(--bg-primary, white) !important;
                                border: 1px solid var(--border-color, #ccc) !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                margin-left: 8px !important;
                            ">Reset</button>
                            <span style="
                                font-size: 0.8rem !important;
                                color: var(--text-secondary, #666) !important;
                                margin-left: 12px !important;
                            ">Right-click + drag to pan</span>
                        </div>
                        
                        <!-- Pannable Map Container -->
                        <div id="map-viewport" style="
                            flex: 1 !important;
                            overflow: hidden !important;
                            position: relative !important;
                            background: var(--bg-primary, white) !important;
                            border: 2px solid var(--border-color, #ccc) !important;
                            border-radius: 8px !important;
                            cursor: grab !important;
                        ">
                            <div id="map-canvas" style="
                                position: absolute !important;
                                top: 50% !important;
                                left: 50% !important;
                                transform: translate(-50%, -50%) scale(1) !important;
                                transform-origin: center !important;
                                transition: transform 0.1s ease !important;
                            ">
                                <div id="modal-map-grid" style="
                                    display: grid !important;
                                    gap: 1px !important;
                                    background: #ddd !important;
                                    padding: 1px !important;
                                    border-radius: 4px !important;
                                "></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(newModal);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Full-screen map editor modal created');
    
    // Initialize the map editor components
    initializeModalMapEditor();
}

function closeMapModal(event) {
    // If clicking on modal content, don't close
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('map-editor-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// ========================================
// SPRITE SYSTEM
// ========================================
async function checkSprites() {
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            
            // Use custom tileset URL if available, otherwise default to assets folder
            const imageUrl = (tilesetData && tilesetData.imageUrl) ? 
                tilesetData.imageUrl : 
                `assets/${currentTileset}.png`;
            img.src = imageUrl;
        });
        spritesEnabled = true;
        console.log(`✅ Sprites loaded successfully: ${currentTileset}`);
        return true;
    } catch (error) {
        spritesEnabled = false;
        console.log(`❌ Sprites not found for ${currentTileset}, using emoji fallback`);
        return false;
    }
}

function updateSpriteStatus() {
    const statusElement = document.getElementById('modal-sprite-status');
    if (statusElement) {
        statusElement.textContent = spritesEnabled ? 
            '🎨 Enhanced sprites active' : 
            '📝 Using emoji fallback';
        statusElement.className = spritesEnabled ? 
            'sprite-status-active' : 
            'sprite-status-fallback';
    }
}

// ========================================
// MAP INITIALIZATION
// ========================================
async function initializeModalMapEditor() {
    console.log('🗺️ Initializing Modal Map Editor...');
    
    // Load available tilesets and populate dropdown
    await loadAvailableTilesets();
    populateTilesetDropdown();
    
    // Load current tileset data
    await loadTilesetData(currentTileset);
    
    // Check for sprites first
    await checkSprites();
    updateSpriteStatus();
    
    // Initialize components
    createModalTileSelector();
    resizeModalMap();
    
    // Initialize pan/zoom functionality
    initializePanZoom();
    
    console.log('✅ Modal Map editor initialized successfully!');
    
    // Check if there's a pending map to load from the Maps Manager
    if (window.pendingMapToLoad) {
        console.log('📋 Found pending map to load, loading now...');
        
        // Use the Maps Manager's LoadMapFormat function
        if (window.mapsManager && window.mapsManager.loadMapFormat) {
            await window.mapsManager.loadMapFormat(window.pendingMapToLoad.mapData, window.pendingMapToLoad.mapId);
        } else {
            // Fallback - call loadMapFromData directly
            console.log('⚠️ Maps Manager not available, using direct load');
            await loadMapFromData(window.pendingMapToLoad.mapData, window.pendingMapToLoad.mapId);
        }
        
        // Clear the pending flag
        window.pendingMapToLoad = null;
        console.log('✅ Pending map loaded and cleared');
    } else {
        // No pending map - this is a new map, ensure sprites are properly initialized
        console.log('🆕 No pending map - initializing for new map creation');
        
        // Force sprite CSS regeneration for new maps
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-modal-tileset-style', 'true');
        const imageUrl = `assets/${currentTileset}.png?v=${Date.now()}`;
        
        const spriteClasses = [
            'mountain', 'water', 'grass', 'rock', 'castle', 'house', 'shop', 'temple',
            'dragon', 'sword', 'skull', 'danger', 'tower', 'road', 'door', 'fire'
        ];
        
        let cssRules = `
            .sprite {
                background-image: url('${imageUrl}') !important;
                width: 100% !important;
                height: 100% !important;
                background-size: 400% 400% !important;
                background-repeat: no-repeat !important;
                display: block !important;
            }
        `;
        
        const spritePositions = {
            'mountain': '0% 0%', 'water': '33.333% 0%', 'grass': '66.666% 0%', 'rock': '100% 0%',
            'castle': '0% 33.333%', 'house': '33.333% 33.333%', 'shop': '66.666% 33.333%', 'temple': '100% 33.333%',
            'dragon': '0% 66.666%', 'sword': '33.333% 66.666%', 'skull': '66.666% 66.666%', 'danger': '100% 66.666%',
            'tower': '0% 100%', 'road': '33.333% 100%', 'door': '66.666% 100%', 'fire': '100% 100%'
        };
        
        spriteClasses.forEach(sprite => {
            const position = spritePositions[sprite] || '0% 0%';
            cssRules += `
            .sprite.${sprite} {
                background-image: url('${imageUrl}') !important;
                background-position: ${position} !important;
                background-size: 400% 400% !important;
            }`;
        });
        
        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
        
        console.log('🎨 Regenerated sprite CSS for new map');
        
        // Refresh the tile selector to show correct sprites
        createModalTileSelector();
    }
}

function populateTilesetDropdown() {
    const dropdown = document.getElementById('tileset-selector');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    for (const [tilesetKey, tilesetConfig] of Object.entries(availableTilesets)) {
        const option = document.createElement('option');
        option.value = tilesetKey;
        option.textContent = tilesetConfig.name || (tilesetKey.charAt(0).toUpperCase() + tilesetKey.slice(1) + ' Tileset');
        if (tilesetKey === currentTileset) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    }
}

function createModalTileSelector() {
    const selector = document.getElementById('modal-tile-selector');
    if (!selector) {
        console.error('❌ modal-tile-selector element not found!');
        return;
    }
    
    selector.innerHTML = '';
    
    tileOptions.forEach((opt, i) => {
        const tile = document.createElement('div');
        tile.className = 'selector-tile';
        if (i === 0) tile.classList.add('selected');
        
        // Create tile display
        if (opt.type === "sprite" && spritesEnabled) {
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${opt.value}`;
            
            // Apply background color from tileset data
            if (tilesetData && tilesetData.backgroundColors && tilesetData.backgroundColors[opt.value]) {
                tile.style.backgroundColor = tilesetData.backgroundColors[opt.value];
            }
            
            // Debug: Log the sprite element creation
            console.log(`🔍 Created sprite element for ${opt.value}:`, {
                className: spriteDiv.className,
                spritesEnabled: spritesEnabled,
                currentTileset: currentTileset,
                backgroundImage: getComputedStyle(spriteDiv).backgroundImage
            });
            
            tile.appendChild(spriteDiv);
        } else if (opt.type === "player") {
            const player = document.createElement('div');
            player.classList.add('player-icon');
            player.textContent = opt.value;
            tile.appendChild(player);
        } else if (opt.type === "clear") {
            tile.innerHTML = '🗑️';
            tile.style.background = 'var(--danger)';
        } else {
            // Fallback to emoji
            tile.textContent = opt.emoji || opt.value;
        }
        
        tile.title = opt.name;
        tile.onclick = () => selectTile(opt, tile);
        
        selector.appendChild(tile);
    });
    
    console.log(`✅ Created ${tileOptions.length} modal selector tiles`);
}

function selectTile(option, element) {
    document.querySelectorAll('.selector-tile').forEach(t => t.classList.remove('selected'));
    element.classList.add('selected');
    currentSelection = option;
    
    console.log(`Selected tile: ${option.name}`);
}

// ========================================
// MAP GRID MANAGEMENT
// ========================================
function resizeModalMap() {
    const size = currentMap.size;
    const totalTiles = size * size;
    
    // PRESERVE existing data when resizing
    const oldMapData = currentMap.mapData || [];
    const oldPlayerLayer = currentMap.playerLayer || [];
    
    // Create new arrays with preserved data
    currentMap.mapData = Array(totalTiles).fill(null);
    currentMap.playerLayer = Array(totalTiles).fill(null);
    
    // Copy existing data to new arrays (up to the smaller size)
    const copyLimit = Math.min(oldMapData.length, totalTiles);
    for (let i = 0; i < copyLimit; i++) {
        if (oldMapData[i] !== undefined) {
            currentMap.mapData[i] = oldMapData[i];
        }
        if (oldPlayerLayer[i] !== undefined) {
            currentMap.playerLayer[i] = oldPlayerLayer[i];
        }
    }
    
    console.log('🔄 Resized map arrays:', {
        newSize: totalTiles,
        preservedData: copyLimit,
        nonNullTiles: currentMap.mapData.filter(tile => tile !== null).length
    });
    
    // Update grid
    const grid = document.getElementById('modal-map-grid');
    if (!grid) {
        console.error('❌ modal-map-grid element not found!');
        return;
    }
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    
    // Create tiles
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'map-tile';
        tile.dataset.idx = i;
        
        // Mouse events for drawing (left-click only)
        tile.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !isPanning) { // Left click only, not during pan
                isDragging = true;
                placeTile(i);
                e.stopPropagation(); // Prevent event bubbling to viewport
            }
        });
        
        tile.addEventListener('mouseenter', (e) => {
            if (isDragging && !isPanning) placeTile(i);
        });
        
        tile.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click only
                isDragging = false;
            }
        });
        
        // Touch events for mobile (single touch only, not during pinch)
        tile.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && !isPanning && !isMultiTouch) {
                isDragging = true;
                placeTile(i);
                e.stopPropagation();
            }
        });
        
        tile.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging && !isPanning && !isMultiTouch) {
                // Find which tile we're over
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.classList.contains('map-tile')) {
                    const idx = parseInt(element.dataset.idx);
                    if (!isNaN(idx)) placeTile(idx);
                }
                e.preventDefault();
            }
        });
        
        tile.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                isDragging = false;
            }
        });
        
        renderTile(tile, null, null);
        grid.appendChild(tile);
    }
    
    // Global mouse up to stop dragging (left-click only)
    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isDragging = false;
        }
    });
    
    console.log(`✅ Created ${size}x${size} modal map grid (${totalTiles} tiles)`);
}

function placeTile(index) {
    const tile = document.querySelector(`[data-idx="${index}"]`);
    
    if (currentSelection.type === "clear") {
        currentMap.mapData[index] = null;
        currentMap.playerLayer[index] = null;
    } else if (currentSelection.type === "player") {
        currentMap.playerLayer[index] = currentSelection;
    } else {
        currentMap.mapData[index] = currentSelection;
        currentMap.playerLayer[index] = null; // Clear player when placing terrain
    }
    
    renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
}

function renderTile(tile, mapData, playerData) {
    // Use the unified renderer for consistent sprite handling
    if (window.UnifiedMapRenderer && window.unifiedMapRenderer) {
        window.unifiedMapRenderer.renderTile(tile, mapData, playerData, 'editor'); // Pass 'editor' context like viewer passes 'viewer'
    } else {
        // Fallback to basic rendering - COPY VIEWER'S BACKGROUND COLOR APPROACH
        tile.innerHTML = '';
        tile.className = 'map-tile';
        
        if (!mapData) {
            tile.style.backgroundColor = '#f9f9f9';
            return;
        }
        
        // Handle sprite data - ENHANCED: Multi-version background color support
        if (typeof mapData === 'object' && mapData.type === 'sprite') {
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${mapData.value}`;
            
            // COMPATIBILITY: Check multiple sources for background color
            let backgroundColor = mapData.background; // v1.1 embedded color (backward compatibility)
            if (!backgroundColor && window.currentLoadedMap && window.currentLoadedMap.backgroundColors) {
                backgroundColor = window.currentLoadedMap.backgroundColors[mapData.value]; // v1.2 dictionary
            }
            if (!backgroundColor && window.tilesetData && window.tilesetData.backgroundColors) {
                backgroundColor = window.tilesetData.backgroundColors[mapData.value]; // v1.0 fallback
            }
            
            if (backgroundColor) {
                tile.style.backgroundColor = backgroundColor;
            }
            
            tile.appendChild(spriteDiv);
        } else if (typeof mapData === 'object' && mapData.emoji) {
            tile.textContent = mapData.emoji;
        }
        
        // Render player data (overlay)
        if (playerData) {
            const player = document.createElement('div');
            player.classList.add('player-overlay');
            player.textContent = playerData.value;
            tile.appendChild(player);
        }
    }
}

// Helper function to re-render the current map with the new tileset
function renderCurrentMap() {
    console.log('🎨 renderCurrentMap: Re-rendering map with new tileset');
    
    const grid = document.getElementById('modal-map-grid');
    if (grid && currentMap.mapData) {
        const tiles = grid.querySelectorAll('.map-tile');
        console.log('🎨 Found', tiles.length, 'tiles to render');
        tiles.forEach((tile, index) => {
            renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
        });
        console.log('✅ Re-rendered all tiles with new tileset');
    } else {
        console.warn('⚠️ Could not find modal-map-grid element or no map data to render');
    }
}

// ========================================
// MAP CONTROLS
// ========================================
function setMapSize(size) {
    const sizeMap = { small: 10, medium: 20, large: 30, extra: 40, biggest: 50 };
    currentMap.size = sizeMap[size] || 15;
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
    
    resizeModalMap();
    console.log(`Map size set to ${currentMap.size}x${currentMap.size}`);
}

function setMapSizeFromSlider(value) {
    currentMap.size = parseInt(value);
    
    // Update slider display
    const display = document.getElementById('current-size-display');
    if (display) {
        display.textContent = `${value}x${value}`;
    }
    
    // Update button states (find closest match)
    const sizeMap = { 10: 'small', 20: 'medium', 30: 'large', 40: 'extra', 50: 'biggest' };
    const closestSize = Object.keys(sizeMap).reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === sizeMap[closestSize]);
    });
    
    resizeModalMap();
    console.log(`Map size set to ${currentMap.size}x${currentMap.size} via slider`);
}

function clearMap() {
    currentMap.mapData.fill(null);
    currentMap.playerLayer.fill(null);
    
    document.querySelectorAll('.map-tile').forEach(tile => {
        renderTile(tile, null, null);
    });
    
    console.log('Map cleared');
}

// ========================================
// FILE OPERATIONS
// ========================================
async function saveMapAsFile() {
    const mapName = document.getElementById('modal-map-name').value || 'untitled-map';
    currentMap.name = mapName;
    
    // Create map data structure using v1.2 format with color dictionary
    const mapData = {
        grid: await gridToArray(currentMap.mapData, currentMap.size),
        tileset: currentTileset || 'default',
        name: currentMap.name,
        size: currentMap.size,
        type: currentMap.type,
        created: new Date().toISOString(),
        version: "1.2",  // v1.2 format with background color dictionary
        backgroundColors: window.tilesetData?.backgroundColors || {}  // Include color dictionary
    };
    
    // Create and download file
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    link.click();
    
    console.log(`💾 Saved map: ${mapName}`);
    
    // Update current map display in panel
    updateCurrentMapDisplay(mapData);
}

async function saveMapToLibrary() {
    const mapName = document.getElementById('modal-map-name').value || 'untitled-map';
    currentMap.name = mapName;
    
    // CRITICAL DEBUG: Check what we're actually saving
    console.log('🔍 SAVE DEBUG - currentMap.mapData sample:', {
        totalLength: currentMap.mapData.length,
        sample: currentMap.mapData.slice(0, 10),
        nonNullCount: currentMap.mapData.filter(cell => cell !== null && cell !== undefined).length,
        sampleNonNull: currentMap.mapData.filter(cell => cell !== null && cell !== undefined).slice(0, 3)
    });
    
    // Create map data structure compatible with the maps manager
    const mapData = {
        grid: await gridToArray(currentMap.mapData, currentMap.size),
        tileset: currentTileset || 'default',
        name: currentMap.name,
        size: currentMap.size,
        type: currentMap.type,
        created: new Date().toISOString(),
        version: "1.2",  // v1.2 format with background color dictionary
        backgroundColors: window.tilesetData?.backgroundColors || {}  // Include color dictionary
    };
    
    // Save to maps manager if available
    if (window.mapsManager) {
        const mapId = window.currentEditingMapId || null;
        const originalMapName = window.originalMapName || null;
        
        // Check if user changed the map name - if so, create NEW map instead of updating
        if (mapId && originalMapName && mapName === originalMapName) {
            // Same name - update existing map
            await window.mapsManager.updateMap(mapId, mapData, mapName);
            console.log(`📚 Updated existing map: ${mapName}`);
        } else {
            // Different name or no original - create NEW map
            const newMapId = await window.mapsManager.addMap(mapData, mapName);
            window.currentEditingMapId = newMapId;
            window.originalMapName = mapName; // Store for future reference
            console.log(`📚 Created new map: ${mapName}`);
        }
        
        // Close the modal
        window.closeMapModal();
    } else {
        console.warn('Maps manager not available, falling back to file save');
        await saveMapAsFile();
    }
}

// Helper function to convert map data to grid array
async function gridToArray(mapData, size) {
    console.log('🔄 GRID CONVERSION DEBUG:', { 
        inputSize: size, 
        mapDataLength: mapData.length,
        sampleData: mapData.slice(0, 5),
        nonNullCount: mapData.filter(cell => cell !== null && cell !== undefined).length
    });
    
    const grid = [];
    
    // Load the current tileset configuration for proper sprite mapping
    const tilesetName = currentTileset || 'default';
    let tilesetConfig = null;
    
    try {
        const response = await fetch(`assets/${tilesetName}.json`);
        tilesetConfig = await response.json();
        console.log('📋 Loaded tileset config for conversion:', tilesetName);
    } catch (error) {
        console.warn('⚠️ Failed to load tileset config, using fallback mapping');
    }
    
    for (let row = 0; row < size; row++) {
        const rowData = [];
        for (let col = 0; col < size; col++) {
            const index = row * size + col;
            const cellData = mapData[index];
            
            let tileValue = null; // Use null for empty instead of 0
            
            if (cellData && typeof cellData === 'object') {
                if (cellData.type === 'sprite' && cellData.value) {
                    // v1.2 format - NO embedded background colors (use dictionary lookup)
                    tileValue = {
                        type: cellData.type,
                        value: cellData.value,
                        name: cellData.name || cellData.value,
                        category: cellData.category || 'terrain',
                        emoji: cellData.emoji || '🎯'
                    };
                    // Background colors are now in the map's backgroundColors dictionary
                } else if (cellData.type === 'player') {
                    tileValue = null; // Players are not saved in static maps
                } else if (cellData.type === 'clear') {
                    tileValue = null;
                }
            } else if (typeof cellData === 'number' && cellData > 0) {
                // Convert number back to object (for backward compatibility)
                const spriteValue = getSpriteName(cellData) || 'mountain';
                
                tileValue = {
                    type: 'sprite',
                    value: spriteValue,
                    name: spriteValue.charAt(0).toUpperCase() + spriteValue.slice(1),
                    category: 'terrain',
                    emoji: '🎯'
                };
                // v1.2: Background colors are in the dictionary, not embedded
            } else {
                tileValue = null; // Empty cell
            }
            
            rowData.push(tileValue);
        }
        grid.push(rowData);
    }
    
    console.log('✅ Converted grid sample:', grid.slice(0, 3));
    return grid;
}

// Helper function for fallback sprite name to number mapping
function getSpriteNumber(spriteName) {
    const spriteMap = {
        'mountain': 1,
        'water': 2,
        'grass': 3,
        'rock': 4,
        'castle': 5,
        'house': 6,
        'shop': 7,
        'temple': 8,
        'dragon': 9,
        'sword': 10,
        'skull': 11,
        'danger': 12,
        'tower': 13,
        'road': 14,
        'door': 15,
        'fire': 16
    };
    return spriteMap[spriteName] || 1;
}

// Helper function for reverse mapping (number to sprite name)
function getSpriteName(spriteNumber) {
    const numberMap = {
        1: 'mountain',
        2: 'water', 
        3: 'grass',
        4: 'rock',
        5: 'castle',
        6: 'house',
        7: 'shop',
        8: 'temple',
        9: 'dragon',
        10: 'sword',
        11: 'skull',
        12: 'danger',
        13: 'tower',
        14: 'road',
        15: 'door',
        16: 'fire'
    };
    return numberMap[spriteNumber] || 'mountain';
}

function updateCurrentMapDisplay(mapData) {
    const display = document.getElementById('current-map-display');
    if (display) {
        const placedTiles = mapData.mapData.filter(t => t !== null).length + 
                           mapData.playerLayer.filter(t => t !== null).length;
        
        display.innerHTML = `
            <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">${mapData.name}</h4>
            <p style="margin: 0; color: var(--text-secondary);">
                ${mapData.size}×${mapData.size} grid • ${placedTiles} tiles placed<br>
                Created: ${new Date(mapData.created).toLocaleDateString()}
            </p>
        `;
    }
}

// ========================================
// PANEL INTEGRATION
// ========================================
function initializeMapEditor() {
    console.log('🗺️ Map editor panel initialization started...');
    
    // Set up the "Open Map Editor" button
    setTimeout(() => {
        const openButton = document.getElementById('open-map-modal');
        console.log('🔍 Looking for open-map-modal button:', !!openButton);
        
        if (openButton) {
            openButton.onclick = openMapModal;
            console.log('✅ Map editor panel button initialized');
        } else {
            console.log('✅ Map editor uses direct onclick handlers - no button setup needed');
        }
        
        // Set up modal close button
        const closeButton = document.getElementById('close-map-modal');
        console.log('🔍 Looking for close-map-modal button:', !!closeButton);
        
        if (closeButton) {
            closeButton.onclick = closeMapModal;
            console.log('✅ Close button initialized');
        }
        
        // Check if modal exists
        const modal = document.getElementById('map-editor-modal');
        console.log('🔍 Looking for map-editor-modal:', !!modal);
        
    }, 500); // Increased delay to ensure DOM is ready
}

// ========================================
// CUSTOM TILESET IMPORT SYSTEM
// ========================================

// IndexedDB setup for storing custom tilesets
let tilesetDB;

function initTilesetDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MapEditorTilesets', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            tilesetDB = request.result;
            resolve(tilesetDB);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('tilesets')) {
                const store = db.createObjectStore('tilesets', { keyPath: 'name' });
                store.createIndex('name', 'name', { unique: true });
            }
        };
    });
}

function saveCustomTileset(name, imageBlob, configData) {
    return new Promise((resolve, reject) => {
        if (!tilesetDB) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = tilesetDB.transaction(['tilesets'], 'readwrite');
        const store = transaction.objectStore('tilesets');
        
        const tilesetData = {
            name: name,
            image: imageBlob,
            config: configData,
            dateAdded: new Date().toISOString()
        };
        
        const request = store.put(tilesetData);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(tilesetData);
    });
}

function loadCustomTilesets() {
    return new Promise((resolve, reject) => {
        if (!tilesetDB) {
            resolve([]);
            return;
        }
        
        const transaction = tilesetDB.transaction(['tilesets'], 'readonly');
        const store = transaction.objectStore('tilesets');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

function importCustomTileset() {
    const fileInput = document.getElementById('tileset-file-input');
    fileInput.click();
}

async function handleTilesetFiles(files) {
    if (!files || files.length === 0) return;
    
    try {
        // Initialize DB if needed
        if (!tilesetDB) {
            await initTilesetDB();
        }
        
        let pngFile = null;
        let jsonFile = null;
        
        // Find PNG and JSON files
        for (const file of files) {
            if (file.type === 'image/png') {
                pngFile = file;
            } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                jsonFile = file;
            }
        }
        
        if (!pngFile) {
            alert('Please select a PNG image file for the tileset.');
            return;
        }
        
        // Generate tileset name from PNG filename
        const tilesetName = pngFile.name.replace('.png', '');
        
        let configData = null;
        if (jsonFile) {
            // Read JSON config
            const jsonText = await readFileAsText(jsonFile);
            try {
                configData = JSON.parse(jsonText);
            } catch (e) {
                console.warn('Invalid JSON config file, using default sprite layout');
            }
        }
        
        // If no JSON config, create a default one
        if (!configData) {
            configData = generateDefaultTilesetConfig(tilesetName);
        }
        
        // Save to IndexedDB
        await saveCustomTileset(tilesetName, pngFile, configData);
        
        // Add to available tilesets
        availableTilesets[tilesetName] = configData;
        
        // Update dropdown
        populateTilesetDropdown();
        
        // Switch to the new tileset
        await switchTileset(tilesetName);
        
        console.log(`✅ Custom tileset "${tilesetName}" imported successfully`);
        
        // Show success message
        const statusDiv = document.getElementById('modal-sprite-status');
        if (statusDiv) {
            const originalText = statusDiv.textContent;
            statusDiv.textContent = 'Tileset Imported!';
            statusDiv.style.background = '#28a745';
            setTimeout(() => {
                statusDiv.textContent = originalText;
                statusDiv.style.background = '#28a745';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error importing tileset:', error);
        alert('Error importing tileset: ' + error.message);
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function generateDefaultTilesetConfig(name) {
    return {
        name: name,
        description: "Custom imported tileset",
        backgroundColors: {},
        sprites: {}
    };
}

// Load custom tilesets on initialization
async function loadCustomTilesetsOnInit() {
    try {
        await initTilesetDB();
        const customTilesets = await loadCustomTilesets();
        
        for (const tileset of customTilesets) {
            // Create blob URL for the image
            const imageUrl = URL.createObjectURL(tileset.image);
            
            // Add to available tilesets with the blob URL
            availableTilesets[tileset.name] = {
                ...tileset.config,
                imageUrl: imageUrl
            };
        }
        
        console.log(`📁 Loaded ${customTilesets.length} custom tilesets from storage`);
    } catch (error) {
        console.warn('Could not load custom tilesets:', error);
    }
}

// ========================================
// PAN/ZOOM FUNCTIONALITY
// ========================================
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let isMultiTouch = false;
let startX = 0;
let startY = 0;
let tileClickTimeout = null;

function zoomIn() {
    currentZoom = Math.min(currentZoom * 1.2, 3); // Max 300%
    updateMapTransform();
    updateZoomDisplay();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom / 1.2, 0.2); // Min 20%
    updateMapTransform();
    updateZoomDisplay();
}

function resetZoom() {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    updateMapTransform();
    updateZoomDisplay();
}

function updateMapTransform() {
    const canvas = document.getElementById('map-canvas');
    if (canvas) {
        canvas.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${currentZoom})`;
    }
}

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level');
    if (display) {
        display.textContent = `${Math.round(currentZoom * 100)}%`;
    }
}

function initializePanZoom() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;
    
    // Mouse events for desktop
    viewport.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right click
            isPanning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            viewport.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    viewport.addEventListener('mousemove', (e) => {
        if (isPanning) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            updateMapTransform();
            e.preventDefault();
        }
    });
    
    viewport.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            isPanning = false;
            viewport.style.cursor = 'grab';
        }
    });
    
    // Prevent context menu on right click
    viewport.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    });
    
    // Touch events for mobile
    let lastTouchDistance = 0;
    
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Single touch - pan
            isPanning = true;
            isMultiTouch = false;
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
        } else if (e.touches.length === 2) {
            // Two finger pinch - zoom
            isPanning = false;
            isMultiTouch = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastTouchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
        }
        e.preventDefault();
    });
    
    viewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isPanning) {
            // Pan
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            updateMapTransform();
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            if (lastTouchDistance > 0) {
                const scale = distance / lastTouchDistance;
                currentZoom = Math.max(0.2, Math.min(3, currentZoom * scale));
                updateMapTransform();
                updateZoomDisplay();
            }
            lastTouchDistance = distance;
        }
        e.preventDefault();
    });
    
    viewport.addEventListener('touchend', (e) => {
        isPanning = false;
        isMultiTouch = false;
        lastTouchDistance = 0;
    });
    
    console.log('✅ Pan/Zoom initialized');
}

// ========================================
// GLOBAL FUNCTIONS
// ========================================
window.openMapModal = openMapModal;
window.closeMapModal = closeMapModal;
window.setMapSize = setMapSize;
window.clearMap = clearMap;
window.saveMapAsFile = saveMapAsFile;
window.saveMapToLibrary = saveMapToLibrary;
window.loadMapFromData = loadMapFromData;
window.initializeMapEditor = initializeMapEditor;
window.importCustomTileset = importCustomTileset;
window.handleTilesetFiles = handleTilesetFiles;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;

// Function to load map data into the editor
async function loadMapFromData(mapData, mapId = null) {
    if (window.showDebug) {
        console.log('📥 loadMapFromData called with:', mapData);
        console.log('🆔 Map ID:', mapId);
    }
    
    if (!mapData || !mapData.grid) {
        console.error('❌ Invalid map data provided - missing grid');
        console.log('🔍 mapData keys:', mapData ? Object.keys(mapData) : 'mapData is null');
        if (mapData) {
            console.log('🔍 Full mapData structure:', mapData);
        }
        return;
    }
    
    console.log('✅ Valid map data with grid, proceeding...');
    console.log('📊 Grid analysis:', {
        gridLength: mapData.grid.length,
        firstRow: mapData.grid[0],
        hasNonZero: mapData.grid.some(row => row.some(cell => cell && cell !== 0))
    });
    
    // Store the map ID for editing
    window.currentEditingMapId = mapId;
    if (window.showDebug) {
        console.log('💾 Stored editing map ID:', mapId);
    }
    
    // Set map size based on grid
    const size = mapData.grid.length;
    currentMap.size = size;
    console.log('📏 Set map size to:', size);
    
    // Store background colors for v1.2 format support
    if (mapData.backgroundColors) {
        window.currentLoadedMap = { backgroundColors: mapData.backgroundColors };
        console.log('🎨 Stored v1.2 background colors dictionary:', Object.keys(mapData.backgroundColors).length, 'colors');
    } else {
        window.currentLoadedMap = null;
        console.log('🎨 No background colors dictionary found (v1.0/v1.1 format)');
    }
    
    // Set tileset and generate CSS like the working viewer does
    if (mapData.tileset && mapData.tileset !== 'default') {
        currentTileset = mapData.tileset;
    } else {
        currentTileset = 'default';
    }
    
    // Use the WORKING viewer approach for tileset loading
    if (window.mapsManager && window.mapsManager.generateSpriteCSS) {
        await window.mapsManager.generateSpriteCSS(currentTileset);
    } else {
        await switchTileset(currentTileset);
    }
    
    // Convert grid array back to flat array
    const flatMapData = [];
    let nonEmptyCount = 0;
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cellData = mapData.grid[row][col] || null;
            flatMapData.push(cellData);
            if (cellData && cellData !== 0) {
                nonEmptyCount++;
            }
        }
    }
    console.log('🔄 Converted grid to flat array:', {
        totalTiles: flatMapData.length,
        nonEmptyTiles: nonEmptyCount,
        firstFewTiles: flatMapData.slice(0, 10),
        sampleNonEmpty: flatMapData.filter(tile => tile && tile !== 0).slice(0, 5)
    });
    
    // Load the map data
    currentMap.mapData = flatMapData;
    currentMap.playerLayer = new Array(size * size).fill(null); // Reset player layer
    console.log('💾 Set currentMap.mapData and playerLayer');
    
    // Set map name
    if (mapData.name) {
        currentMap.name = mapData.name;
        window.originalMapName = mapData.name; // Store original name for comparison
        const nameInput = document.getElementById('modal-map-name');
        if (nameInput) {
            nameInput.value = mapData.name;
            console.log('📝 Set map name input to:', mapData.name);
        }
    }
    
    // Update size buttons
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => btn.classList.remove('active'));
    
    let sizeType = 'medium'; // default
    if (size <= 10) sizeType = 'small';
    else if (size >= 20) sizeType = 'large';
    
    const activeBtn = document.querySelector(`[data-size="${sizeType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        console.log('🎯 Activated size button:', sizeType);
    }
    
    console.log('🔄 About to rebuild map grid...');
    // CRITICAL: Rebuild the map grid and re-render all tiles
    resizeModalMap();
    console.log('✅ Called resizeModalMap()');
    
    // Re-render all tiles with the loaded data
    const grid = document.getElementById('modal-map-grid');
    if (grid) {
        const tiles = grid.querySelectorAll('.map-tile');
        console.log('🎨 Found', tiles.length, 'tiles to render');
        tiles.forEach((tile, index) => {
            renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
        });
        console.log('✅ Re-rendered all tiles');
    } else {
        console.error('❌ Could not find modal-map-grid element');
    }
    
    // Redraw the canvas only if we're in the modal editor
    if (typeof mapCanvas !== 'undefined' && mapCanvas) {
        drawCanvas();
        console.log('🎨 Called drawCanvas()');
    }
    
    console.log(`📖 ✅ SUCCESSFULLY loaded map: ${mapData.name || 'Unnamed'} (${size}×${size})`);
}

console.log('🗺️ Map Editor loaded (modal version)');