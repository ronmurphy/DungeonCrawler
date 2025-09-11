// Maps Panel Manager
// Handles the Notes-style layout for saved maps with left sidebar list and right viewer
// Uses IndexedDB for better storage capacity (mobile/Cordova friendly)

class MapsManager {
    constructor() {
        this.savedMaps = new Map();
        this.currentMapId = null;
        this.storageDB = new UnifiedStorageDB();
        this.initialized = false;
    }

    // Initialize the maps panel
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize IndexedDB
            await this.storageDB.init();
            
            // Migrate from localStorage if needed
            await this.storageDB.migrateFromLocalStorage();
            
            // Load saved maps from IndexedDB
            await this.loadSavedMaps();
            
            this.refreshMapsList();
            this.setupEventListeners();
            
            // Add debug logging
            console.log('🚀 Maps Manager initialized with IndexedDB');
            console.log('📋 Current maps in memory:', Array.from(this.savedMaps.keys()));
            
            // Add sample map if no maps exist (for testing)
            if (this.savedMaps.size === 0) {
                console.log('📝 No maps found, adding samples...');
                await this.addSampleMaps();
            }
            
            this.initialized = true;
            
            // Add debug function to window for console testing
            window.debugMaps = () => {
                console.log('=== MAPS DEBUG INFO ===');
                console.log('Maps in memory:', this.savedMaps);
                console.log('Current map ID:', this.currentMapId);
                console.log('StorageDB:', this.storageDB);
                this.storageDB.getStorageStats().then(stats => {
                    console.log('Storage stats:', stats);
                });
                const viewerContent = document.getElementById('map-viewer-content');
                console.log('Viewer element:', viewerContent);
                console.log('=======================');
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize Maps Manager:', error);
            // Fallback to memory-only mode
            this.refreshMapsList();
            this.setupEventListeners();
        }
    }

    // Add some sample maps for testing
    async addSampleMaps() {
        // Sample small dungeon map
        const dungeonGrid = [
            [0, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 2, 2, 2, 1, 0, 0],
            [1, 1, 2, 3, 2, 1, 1, 0],
            [1, 2, 2, 2, 2, 2, 1, 0],
            [1, 2, 3, 2, 3, 2, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 2, 2, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ];

        const sampleDungeon = {
            grid: dungeonGrid,
            tileset: 'default',
            name: 'Sample Dungeon',
            size: 8,
            type: 'dungeon',
            created: new Date().toISOString(),
            version: "1.0"
        };

        // Sample forest map
        const forestGrid = [
            [5, 5, 6, 6, 5, 5],
            [5, 6, 7, 7, 6, 5],
            [6, 7, 8, 8, 7, 6],
            [6, 7, 8, 8, 7, 6],
            [5, 6, 7, 7, 6, 5],
            [5, 5, 6, 6, 5, 5]
        ];

        const sampleForest = {
            grid: forestGrid,
            tileset: 'forest',
            name: 'Forest Clearing',
            size: 6,
            type: 'outdoor',
            created: new Date().toISOString(),
            version: "1.0"
        };

        await this.addMap(sampleDungeon, 'Sample Dungeon');
        await this.addMap(sampleForest, 'Forest Clearing');
        
        console.log('📚 Added sample maps for testing');
    }

    // Setup event listeners
    setupEventListeners() {
        // Map list selection handling
        document.addEventListener('click', (e) => {
            if (e.target.closest('.map-item')) {
                const mapItem = e.target.closest('.map-item');
                const mapId = mapItem.dataset.mapId;
                console.log('🖱️ Map item clicked:', { mapId, mapItem });
                if (mapId) {
                    console.log('📖 Selecting map:', mapId);
                    this.selectMap(mapId);
                } else {
                    console.error('❌ No mapId found on map item');
                }
            }
        });
    }

    // Load saved maps from IndexedDB
    async loadSavedMaps() {
        try {
            console.log('🔍 DIAGNOSTIC: Attempting to load maps from IndexedDB...');
            const maps = await this.storageDB.getAllMaps();
            console.log('💾 DIAGNOSTIC: Raw maps from IndexedDB:', maps);
            console.log('💾 DIAGNOSTIC: Maps count:', maps?.length || 0);
            
            this.savedMaps.clear();
            if (maps && Array.isArray(maps)) {
                maps.forEach(map => {
                    console.log('📝 DIAGNOSTIC: Processing map:', { id: map.id, name: map.name, hasData: !!map.data });
                    this.savedMaps.set(map.id, map);
                });
            } else {
                console.warn('⚠️ DIAGNOSTIC: Maps is not an array:', typeof maps);
            }
            
            console.log('✅ DIAGNOSTIC: Final loaded maps:', Array.from(this.savedMaps.keys()));
            console.log('🔢 DIAGNOSTIC: Total maps in memory:', this.savedMaps.size);
        } catch (error) {
            console.error('❌ DIAGNOSTIC: Failed to load saved maps from IndexedDB:', error);
            console.error('❌ DIAGNOSTIC: Error details:', error.message, error.stack);
            this.savedMaps = new Map();
        }
    }

    // Save maps to IndexedDB
    async saveMapsToStorage() {
        // Individual maps are saved directly via storageDB.saveMap()
        // This method is kept for compatibility but not needed with IndexedDB
        console.log('ℹ️ Using IndexedDB - individual save operations');
    }

    // Add a new map to saved maps
    async addMap(mapData, mapName = null) {
        const mapId = this.generateMapId();
        const timestamp = new Date().toISOString();
        
        const mapInfo = {
            id: mapId,
            name: mapName || `Map ${mapId.slice(-4)}`,
            data: mapData,
            created: timestamp,
            modified: timestamp,
            size: this.getMapSize(mapData),
            tileset: this.getMapTileset(mapData)
        };

        this.savedMaps.set(mapId, mapInfo);
        
        try {
            await this.storageDB.saveMap(mapInfo);
            console.log('💾 Map saved to IndexedDB:', mapId);
        } catch (error) {
            console.error('❌ Failed to save map to IndexedDB:', error);
        }
        
        this.refreshMapsList();
        this.selectMap(mapId);
        
        return mapId;
    }

    // Update an existing map
    async updateMap(mapId, mapData, mapName = null) {
        const existingMap = this.savedMaps.get(mapId);
        if (existingMap) {
            existingMap.data = mapData;
            existingMap.modified = new Date().toISOString();
            existingMap.size = this.getMapSize(mapData);
            existingMap.tileset = this.getMapTileset(mapData);
            
            if (mapName) {
                existingMap.name = mapName;
            }
            
            try {
                await this.storageDB.saveMap(existingMap);
                console.log('🔄 Map updated in IndexedDB:', mapId);
            } catch (error) {
                console.error('❌ Failed to update map in IndexedDB:', error);
            }
            
            this.refreshMapsList();
            if (this.currentMapId === mapId) {
                this.selectMap(mapId);
            }
        }
    }

    // Delete a map
    async deleteMap(mapId) {
        console.log('🗑️ Attempting to delete map:', mapId);
        
        if (this.savedMaps.has(mapId)) {
            console.log('📋 Map found in memory, deleting...');
            this.savedMaps.delete(mapId);
            
            try {
                await this.storageDB.deleteMap(mapId);
                console.log('✅ Map deleted from IndexedDB:', mapId);
            } catch (error) {
                console.error('❌ Failed to delete map from IndexedDB:', error);
                // Re-add to memory if DB deletion failed
                this.loadSavedMaps();
                return;
            }
            
            this.refreshMapsList();
            
            if (this.currentMapId === mapId) {
                this.currentMapId = null;
                this.showEmptyViewer();
            }
            
            console.log('🔄 Map deletion complete. Remaining maps:', Array.from(this.savedMaps.keys()));
        } else {
            console.warn('⚠️ Map not found in memory:', mapId);
        }
    }

    // Generate a unique map ID
    generateMapId() {
        return 'map_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get map size from map data
    getMapSize(mapData) {
        if (mapData && mapData.grid) {
            return `${mapData.grid.length}×${mapData.grid[0]?.length || 0}`;
        } else if (mapData && mapData.size) {
            // Legacy format
            return `${mapData.size}×${mapData.size}`;
        }
        return 'Unknown';
    }

    // Get map tileset from map data
    getMapTileset(mapData) {
        if (mapData && mapData.tileset) {
            return mapData.tileset.charAt(0).toUpperCase() + mapData.tileset.slice(1);
        }
        return 'Default';
    }

    // Refresh the maps list in the sidebar
    refreshMapsList() {
        const mapsList = document.getElementById('maps-list');
        if (!mapsList) return;

        if (this.savedMaps.size === 0) {
            mapsList.innerHTML = `
                <div class="maps-empty-state">
                    <i class="material-icons">map</i>
                    <h3>No Maps Yet</h3>
                    <p>Create your first battle map to get started.</p>
                    <button class="maps-btn new" onclick="openMapEditor()">
                        <i class="material-icons">add</i>Create Map
                    </button>
                </div>
            `;
            return;
        }

        const mapsArray = Array.from(this.savedMaps.values()).sort((a, b) => 
            new Date(b.modified) - new Date(a.modified)
        );

        mapsList.innerHTML = mapsArray.map(map => this.createMapListItem(map)).join('');
    }

    // Create a map list item HTML
    createMapListItem(map) {
        const isActive = this.currentMapId === map.id;
        const modifiedDate = new Date(map.modified).toLocaleDateString();
        
        return `
            <div class="map-item ${isActive ? 'active' : ''}" data-map-id="${map.id}">
                <div class="map-title">${this.escapeHtml(map.name)}</div>
                <div class="map-info">${map.size} • ${map.tileset}</div>
                <div class="map-meta">
                    <span class="map-date">${modifiedDate}</span>
                    <div class="map-actions">
                        <button class="map-action-btn" onclick="event.stopPropagation(); window.mapsManager.editMap('${map.id}')" title="Edit">
                            <i class="material-icons" style="font-size: 12px;">edit</i>
                        </button>
                        <button class="map-action-btn" onclick="event.stopPropagation(); window.mapsManager.shareMap('${map.id}')" title="Share with Players">
                            <i class="material-icons" style="font-size: 12px;">share</i>
                        </button>
                        <button class="map-action-btn" onclick="event.stopPropagation(); window.mapsManager.duplicateMap('${map.id}')" title="Duplicate">
                            <i class="material-icons" style="font-size: 12px;">content_copy</i>
                        </button>
                        <button class="map-action-btn" onclick="event.stopPropagation(); window.mapsManager.exportMapById('${map.id}')" title="Export">
                            <i class="material-icons" style="font-size: 12px;">download</i>
                        </button>
                                                <button class="map-action-btn" onclick="event.stopPropagation(); window.mapsManager.confirmDeleteMap('${map.id}').catch(console.error)" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Select and display a map
    selectMap(mapId) {
        console.log('🔍 selectMap called with:', mapId);
        const map = this.savedMaps.get(mapId);
        console.log('📋 Found map data:', map);
        
        // DEBUG: Show complete map structure when loading
        if (map && map.data) {
            console.log('🔍 COMPLETE MAP DATA STRUCTURE:', JSON.stringify(map.data, null, 2));
            console.log('🗺️ Map data keys:', Object.keys(map.data));
            if (map.data.backgroundColors) {
                console.log('🎨 Background colors found in map:', map.data.backgroundColors);
            } else {
                console.warn('❌ NO backgroundColors property in map data!');
            }
            if (map.data.version) {
                console.log('📊 Map version:', map.data.version);
            }
        }
        
        if (!map) {
            console.error('❌ Map not found in savedMaps:', mapId);
            console.log('📚 Available maps:', Array.from(this.savedMaps.keys()));
            return;
        }

        this.currentMapId = mapId;
        console.log('✅ Setting currentMapId to:', mapId);
        this.updateMapViewer(map);
        this.refreshMapsList(); // Refresh to update active state
    }

    // Update the map viewer with the selected map
    updateMapViewer(map) {
        console.log('🖼️ updateMapViewer called with:', map);
        
        // Update title
        const titleDisplay = document.getElementById('map-title-display');
        if (titleDisplay) {
            titleDisplay.textContent = map.name;
            console.log('📝 Updated title to:', map.name);
        }

        // Show control buttons
        this.showViewerControls();

        // Update stats
        this.updateMapStats(map);

        // Display the map
        console.log('🎨 About to display map in viewer...');
        this.displayMapInViewer(map);
    }

    // Display map in the viewer
    displayMapInViewer(map) {
        // Auto-enable debug mode for map operations
        if (typeof enableDebugForMaps === 'function') {
            enableDebugForMaps();
        }
        
        if (window.showDebug) {
            console.log('🖼️ displayMapInViewer called with map:', map);
        }
        
        const viewerContent = document.getElementById('map-viewer-content');
        if (!viewerContent) {
            console.error('❌ map-viewer-content element not found');
            return;
        }

        // CRITICAL: Debug the actual map data structure
        console.log('📊 Map data analysis:', {
            hasData: !!map.data,
            hasGrid: !!map.data?.grid,
            gridSize: map.data?.grid?.length,
            tileset: map.data?.tileset,
            sampleGridData: map.data?.grid ? map.data.grid.slice(0, 3) : 'N/A'
        });

        // Use the same rendering approach as the map editor
        if (window.showDebug) {
            console.log('🎨 Using Canvas rendering with PlayerMapViewerLocal...');
        }
        // OLD CSS Grid rendering (commented out for Canvas experiment)
        // this.renderMapWithCSSGrid(viewerContent, map.data);
        
        // NEW Canvas rendering
        this.renderMapWithCanvas(viewerContent, map.data);
        this.updateMapStats(map);
    }

    // NEW Canvas rendering method using PlayerMapViewerLocal
    renderMapWithCanvas(container, mapData) {
        console.log('🎨 renderMapWithCanvas called with:', mapData);
        
        if (!mapData) {
            console.error('❌ No mapData provided');
            this.renderErrorMessage(container, 'No map data');
            return;
        }

        // Create canvas container structure
        container.innerHTML = `
            <div id="map-viewer-container" style="
                width: 100%;
                height: 400px;
                position: relative;
                background: var(--bg-primary, white);
                border: 2px solid var(--border-color, #ccc);
                border-radius: 8px;
                overflow: hidden;
            ">
                <canvas id="map-viewer-canvas" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    cursor: grab;
                "></canvas>
            </div>
        `;

        // Convert local map data to PlayerMapViewerLocal format
        const standardMapData = this.convertToStandardFormat(mapData);
        
        // Initialize PlayerMapViewerLocal
        try {
            if (typeof PlayerMapViewerLocal === 'undefined') {
                console.error('❌ PlayerMapViewerLocal class not loaded!');
                this.renderErrorMessage(container, 'Canvas renderer not available');
                return;
            }

            const viewer = new PlayerMapViewerLocal('map-viewer-container', 'map-viewer-canvas');
            viewer.renderMap(standardMapData);
            console.log('✅ Map rendered with Canvas successfully');
            
        } catch (error) {
            console.error('❌ Failed to render with Canvas:', error);
            this.renderErrorMessage(container, 'Canvas rendering failed: ' + error.message);
        }
    }

    // Convert local IndexedDB map format to PlayerMapViewerLocal standard format
    convertToStandardFormat(mapData) {
        console.log('🔄 Converting map data format:', mapData);
        
        let grid = null;
        let tileset = 'default';

        // Handle different map data formats
        if (mapData.grid) {
            // New format from maps manager
            grid = mapData.grid;
            tileset = mapData.tileset || 'default';
        } else if (mapData.mapData && mapData.size) {
            // Legacy format - convert to grid
            const size = mapData.size;
            grid = [];
            for (let row = 0; row < size; row++) {
                const rowData = [];
                for (let col = 0; col < size; col++) {
                    const index = row * size + col;
                    rowData.push(mapData.mapData[index] || 0);
                }
                grid.push(rowData);
            }
        }

        // Convert to standard format that PlayerMapViewerLocal expects
        const standardFormat = {
            version: '1.2',
            format: 'local-indexeddb',
            metadata: {
                title: 'Local Map',
                tileset: tileset,
                size: grid ? grid.length : 0
            },
            mapData: {
                grid: grid,
                tileset: tileset
            }
        };

        console.log('✅ Converted to standard format:', standardFormat);
        return standardFormat;
    }

    // NEW CSS Grid rendering method (like map editor) - COMMENTED OUT FOR CANVAS EXPERIMENT
    renderMapWithCSSGrid(container, mapData) {
        console.log('🎨 renderMapWithCSSGrid called with:', mapData);
        
        if (!mapData) {
            console.error('❌ No mapData provided');
            this.renderErrorMessage(container, 'No map data');
            return;
        }

        let grid = null;
        let tileset = 'default';
        let size = 0;

        // Handle different map data formats
        if (mapData.grid) {
            // New format from maps manager
            grid = mapData.grid;
            tileset = mapData.tileset || 'default';
            size = mapData.size || grid.length;
            console.log('📋 Using grid format:', { gridSize: grid.length, tileset, size });
        } else if (mapData.mapData && mapData.size) {
            // Legacy format from exported files - convert to grid
            console.log('📋 Converting legacy format:', { size: mapData.size, mapDataLength: mapData.mapData.length });
            size = mapData.size;
            grid = this.convertLegacyToGrid(mapData.mapData, size);
            tileset = 'default';
        } else {
            console.error('❌ Invalid map data structure:', mapData);
            this.renderErrorMessage(container, 'Invalid map data structure');
            return;
        }

        if (!grid || grid.length === 0) {
            console.error('❌ Empty or invalid grid');
            this.renderErrorMessage(container, 'Empty map grid');
            return;
        }

        // Create the viewer HTML structure (like map editor)
        container.innerHTML = `
            <div class="map-viewer-wrapper" style="
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
                background: var(--bg-primary, white);
                border: 2px solid var(--border-color, #ccc);
                border-radius: 8px;
                cursor: grab;
            ">
                <div class="map-viewer-canvas" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1);
                    transform-origin: center;
                    transition: transform 0.1s ease;
                ">
                    <div class="map-viewer-grid" style="
                        display: grid;
                        grid-template-columns: repeat(${size}, 1fr);
                        gap: 1px;
                        background: #ddd;
                        padding: 1px;
                        border-radius: 4px;
                    "></div>
                </div>
            </div>
        `;

        const mapGrid = container.querySelector('.map-viewer-grid');
        const canvasDiv = container.querySelector('.map-viewer-canvas');
        const wrapper = container.querySelector('.map-viewer-wrapper');

        // Load tileset and render tiles
        this.loadTilesetForGridViewer(mapGrid, grid, tileset, canvasDiv, wrapper);
    }

    // Convert legacy flat array to 2D grid for CSS grid rendering
    convertLegacyToGrid(flatArray, size) {
        const grid = [];
        
        for (let row = 0; row < size; row++) {
            const rowData = [];
            for (let col = 0; col < size; col++) {
                const index = row * size + col;
                const cellData = flatArray[index];
                
                // Keep original data format for CSS rendering
                rowData.push(cellData || null);
            }
            grid.push(rowData);
        }
        
        return grid;
    }

    // Load tileset and render tiles for CSS grid viewer (borrow tileset loading from editor)
    async loadTilesetForGridViewer(mapGrid, grid, tilesetName, canvasDiv, wrapper) {
        try {
            // FIRST: Try to load tileset with unified renderer if available
            if (window.unifiedMapRenderer) {
                if (window.showDebug) {
                    console.log(`🎨 Loading tileset ${tilesetName} with unified renderer...`);
                }
                await window.unifiedMapRenderer.loadTileset(tilesetName);
            }
            
            // ONLY borrow the tileset loading from map editor (not the map loading)
            // Set the current tileset like the editor does
            window.currentTileset = tilesetName;
            
            // Use map editor's proven tileset loading functions
            if (window.loadTilesetData) {
                await window.loadTilesetData(tilesetName);
            }
            
            // CRITICAL: Generate sprite CSS like the map editor does
            await this.generateSpriteCSS(tilesetName);
            
            if (window.checkSprites) {
                await window.checkSprites();
            }
            
            // Keep using our WORKING viewer map rendering with editor's tileset data
            this.createGridTiles(mapGrid, grid, window.tilesetData, tilesetName);
            
            // Initialize pan/zoom
            this.initializeViewerPanZoom(wrapper, canvasDiv);
            
        } catch (error) {
            console.warn(`⚠️ Failed to load tileset: ${error.message}`);
            this.createGridTilesFallback(mapGrid, grid);
            this.initializeViewerPanZoom(wrapper, canvasDiv);
        }
    }

    // Generate sprite CSS like the map editor does (ESSENTIAL for sprite display)
    async generateSpriteCSS(tilesetName) {
        // Remove any existing tileset styles to prevent conflicts
        const existingStyles = document.querySelectorAll('style[data-viewer-tileset-style]');
        existingStyles.forEach(style => style.remove());
        
        // Load tileset config for background colors (handle case sensitivity)
        let tilesetConfig = null;
        try {
            // Try lowercase first (like default.json)
            let response = await fetch(`assets/${tilesetName.toLowerCase()}.json`);
            if (!response.ok) {
                // Try original case (like Default.json)
                response = await fetch(`assets/${tilesetName}.json`);
            }
            if (response.ok) {
                tilesetConfig = await response.json();
                console.log(`📋 Loaded tileset config: ${tilesetName}`, tilesetConfig);
                
                // Store background colors in window.tilesetData for renderViewerTile
                if (!window.tilesetData) {
                    window.tilesetData = {};
                }
                window.tilesetData.backgroundColors = tilesetConfig.backgroundColors;
            }
        } catch (error) {
            console.warn(`⚠️ Could not load tileset config for ${tilesetName}:`, error);
        }
        
        // Create the same CSS rules as the map editor
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-viewer-tileset-style', 'true'); // Mark for easy removal
        const imageUrl = (window.tilesetData && window.tilesetData.imageUrl) ? 
            window.tilesetData.imageUrl : 
            `assets/${tilesetName.toLowerCase()}.png?v=${Date.now()}`; // Add cache buster, use lowercase
        
        // Create specific CSS rules for each sprite type to ensure override
        const spriteClasses = [
            'mountain', 'water', 'grass', 'rock', 'castle', 'house', 'shop', 'temple',
            'dragon', 'sword', 'skull', 'danger', 'tower', 'road', 'door', 'fire'
        ];
        
        let cssRules = `
            /* Base sprite rule for viewer AND editor - sprites fill their container */
            .viewer-tile .sprite,
            .map-tile .sprite {
                background-image: url('${imageUrl}') !important;
                width: 100% !important;
                height: 100% !important;
                background-size: 400% 400% !important;
                background-repeat: no-repeat !important;
                display: block !important;
            }
            /* Specific sprite rules with percentage positions for 4x4 grid */
        `;
        
        // Use percentage positioning for responsive sizing
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
            .viewer-tile .sprite.${sprite},
            .map-tile .sprite.${sprite},
            .sprite.${sprite} {
                background-image: url('${imageUrl}') !important;
                background-position: ${position} !important;
                background-size: 400% 400% !important;
            }`;
        });
        
        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
        
        console.log(`🎨 Generated viewer sprite CSS for: ${imageUrl}`);
        if (tilesetConfig && tilesetConfig.backgroundColors) {
            console.log(`🎨 Loaded background colors:`, tilesetConfig.backgroundColors);
        }
    }

    // Keep the working tile creation but use editor's tileset data
    createGridTiles(mapGrid, grid, tilesetConfig, tilesetName) {
        if (window.showDebug) {
            console.log(`🎨 MapsManager: createGridTiles called with grid size: ${grid.length}`);
            console.log(`🎨 MapsManager: Unified renderer available:`, !!window.unifiedMapRenderer);
        }
        
        mapGrid.innerHTML = '';
        
        const size = grid.length;
        let nonEmptyTiles = 0;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const tile = document.createElement('div');
                tile.className = 'map-tile viewer-tile';
                tile.style.cssText = `
                    width: 64px;
                    height: 64px;
                    position: relative;
                    border: 1px solid #ddd;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                `;
                
                // Get the tile data
                const tileData = grid[row][col];
                if (tileData && tileData !== 0) {
                    nonEmptyTiles++;
                    if (window.showDebug) {
                        console.log(`🎨 Non-empty tile [${row},${col}]:`, tileData);
                    }
                }
                
                // Render the tile using editor's sprite system but viewer's logic
                this.renderViewerTile(tile, tileData, tilesetConfig, tilesetName);
                
                mapGrid.appendChild(tile);
            }
        }
        
        console.log(`✅ MapsManager: Created ${size * size} tiles (${nonEmptyTiles} non-empty)`);
        if (nonEmptyTiles === 0) {
            console.warn('⚠️ Map appears to be empty - all tiles are 0 or null');
        }
    }

    // Validate that both .json and .png files exist for the tileset
    // Render tiles using editor's sprite system but keeping viewer's working logic
    renderViewerTile(tile, tileData, tilesetConfig, tilesetName) {
        // Use the unified renderer for consistent sprite handling
        if (window.UnifiedMapRenderer && window.unifiedMapRenderer) {
            window.unifiedMapRenderer.renderTile(tile, tileData, null, 'viewer'); // Pass 'viewer' context
        } else {
            // Fallback to original viewer rendering
            tile.innerHTML = '';
            
            if (!tileData) {
                tile.style.backgroundColor = '#f9f9f9';
                return;
            }
            
            // Handle different data formats
            if (typeof tileData === 'object' && tileData.type === 'sprite') {
                // Use editor's sprite rendering approach
                const spriteDiv = document.createElement('div');
                spriteDiv.className = `sprite ${tileData.value}`;
                
                // Use editor's background color system
                if (window.tilesetData && window.tilesetData.backgroundColors && window.tilesetData.backgroundColors[tileData.value]) {
                    tile.style.backgroundColor = window.tilesetData.backgroundColors[tileData.value];
                }
                
                tile.appendChild(spriteDiv);
            } else if (typeof tileData === 'number' && tileData > 0) {
                // Convert tile number to sprite using editor's tile mapping
                const spriteId = this.getTileNumberSpriteId(tileData);
                if (spriteId) {
                    const spriteDiv = document.createElement('div');
                    spriteDiv.className = `sprite ${spriteId}`;
                    
                    // Apply background color from editor's system
                    if (window.tilesetData && window.tilesetData.backgroundColors && window.tilesetData.backgroundColors[spriteId]) {
                        tile.style.backgroundColor = window.tilesetData.backgroundColors[spriteId];
                    }
                    
                    tile.appendChild(spriteDiv);
                } else {
                    // Fallback to number display
                    tile.textContent = tileData;
                }
            } else if (typeof tileData === 'object' && tileData.emoji) {
                tile.textContent = tileData.emoji;
            } else if (typeof tileData === 'string') {
                tile.textContent = tileData;
            }
        }
    }

    // Convert tile number to sprite ID using the map editor's tile options order
    getTileNumberSpriteId(tileNumber) {
        // Use the map editor's tileOptions array for consistent mapping
        if (window.tileOptions && window.tileOptions[tileNumber - 1]) {
            const tileOption = window.tileOptions[tileNumber - 1];
            return tileOption.value;
        }
        return null;
    }

    // Get sprite info from tile number (must match map editor logic exactly)
    getTileNumberSprite(tileNumber, tilesetConfig) {
        if (!tilesetConfig || !tilesetConfig.sprites) return null;
        
        // This must match the exact logic from map-editor.js line 1000:
        // tileValue = sprite.position[1] * cols + sprite.position[0] + 1;
        
        const cols = tilesetConfig.gridSize === '4x4' ? 4 : 10;
        
        // Find the sprite that would generate this tile number
        const matchingSprite = tilesetConfig.sprites.find(sprite => {
            if (!sprite.position) return false;
            const calculatedTileValue = sprite.position[1] * cols + sprite.position[0] + 1;
            return calculatedTileValue === tileNumber;
        });
        
        if (matchingSprite) {
            console.log(`🎯 Found sprite for tile ${tileNumber}:`, matchingSprite.id);
            return {
                id: matchingSprite.id,
                backgroundColor: tilesetConfig.backgroundColors?.[matchingSprite.id]
            };
        }
        
        console.warn(`⚠️ No sprite found for tile number ${tileNumber} in tileset config`);
        return null;
    }

    // Fallback tile creation without tileset
    createGridTilesFallback(mapGrid, grid) {
        mapGrid.innerHTML = '';
        
        const size = grid.length;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const tile = document.createElement('div');
                tile.className = 'map-tile viewer-tile';
                tile.style.cssText = `
                    width: 64px;
                    height: 64px;
                    border: 1px solid #ddd;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                `;
                
                const tileData = grid[row][col];
                
                if (tileData) {
                    if (typeof tileData === 'object' && tileData.emoji) {
                        tile.textContent = tileData.emoji;
                    } else if (typeof tileData === 'object' && tileData.value) {
                        tile.textContent = tileData.value;
                    } else if (typeof tileData === 'number') {
                        tile.textContent = tileData.toString();
                        tile.style.backgroundColor = '#e3f2fd';
                    }
                }
                
                mapGrid.appendChild(tile);
            }
        }
    }

    // Show error message in viewer
    renderErrorMessage(container, message) {
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                flex-direction: column;
                color: #666;
                font-size: 16px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div>${message}</div>
            </div>
        `;
    }

    // Convert flat array to 2D grid (for legacy exported maps)
    async convertFlatArrayToGrid(flatArray, size, tilesetName = 'default') {
        console.log('🔄 Converting flat array to grid:', { arrayLength: flatArray.length, size, tileset: tilesetName });
        const grid = [];
        
        for (let row = 0; row < size; row++) {
            const rowData = [];
            for (let col = 0; col < size; col++) {
                const index = row * size + col;
                const cellData = flatArray[index];
                
                // Convert sprite objects to tile numbers
                let tileValue = 0;
                if (cellData && typeof cellData === 'object') {
                    // Handle sprite object format
                    if (cellData.type === 'sprite' && cellData.value) {
                        tileValue = await this.spriteNameToTileNumber(cellData.value, tilesetName);
                    }
                } else if (typeof cellData === 'number') {
                    // Handle direct number format
                    tileValue = cellData;
                } else if (cellData === null || cellData === undefined) {
                    tileValue = 0;
                }
                
                rowData.push(tileValue);
            }
            grid.push(rowData);
        }
        
        console.log('✅ Converted grid sample (first few rows):', grid.slice(0, 3));
        return grid;
    }

    // Convert sprite names to tile numbers for rendering
    async spriteNameToTileNumber(spriteName, tilesetName = 'default') {
        try {
            // Load tileset configuration to get proper mapping
            const response = await fetch(`assets/${tilesetName}.json`);
            const tilesetConfig = await response.json();
            
            if (tilesetConfig.sprites) {
                const sprite = tilesetConfig.sprites.find(s => s.id === spriteName);
                if (sprite && sprite.position) {
                    // Convert 2D position to 1D tile number
                    const cols = tilesetConfig.gridSize === '4x4' ? 4 : 10; // Default fallback
                    const tileNumber = sprite.position[1] * cols + sprite.position[0] + 1; // +1 because 0 is empty
                    console.log(`🎨 Sprite ${spriteName} -> tile ${tileNumber} at position [${sprite.position}]`);
                    return tileNumber;
                }
            }
        } catch (error) {
            console.warn(`Failed to load tileset config for ${tilesetName}:`, error);
        }
        
        // Fallback to simple mapping
        const spriteMap = {
            'empty': 0,
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
        
        const result = spriteMap[spriteName] || 1;
        console.log(`🎨 Fallback sprite ${spriteName} -> tile ${result}`);
        return result;
    }

    // Render error message on canvas
    renderErrorCanvas(canvas, message) {
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#dc3545';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        console.error('🔴 Rendered error canvas:', message);
    }

    // Load tileset and render map
    loadTilesetForViewer(ctx, grid, cellSize, tilesetName) {
        // First try to load tileset configuration
        fetch(`assets/${tilesetName}.json`)
            .then(response => {
                if (!response.ok) throw new Error('Config not found');
                return response.json();
            })
            .then(tilesetConfig => {
                // Load the sprite image
                const img = new Image();
                img.onload = () => {
                    this.renderGridWithTileset(ctx, grid, cellSize, img, tilesetConfig);
                };
                img.onerror = () => {
                    console.log(`Failed to load tileset image: ${tilesetName}.png`);
                    this.renderGridFallback(ctx, grid, cellSize);
                };
                img.src = `assets/${tilesetName}.png`;
            })
            .catch(error => {
                console.log(`Failed to load tileset config: ${tilesetName}.json`);
                this.renderGridFallback(ctx, grid, cellSize);
            });
    }

    // Render grid with tileset and background colors
    renderGridWithTileset(ctx, grid, cellSize, tilesetImg, tilesetConfig) {
        const spriteSize = tilesetConfig.spriteSize || 32;
        const cols = tilesetConfig.cols || 10;
        const backgroundColors = tilesetConfig.backgroundColors || {};
        
        // First pass: render background colors
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cellValue = grid[row][col];
                if (cellValue > 0) {
                    const backgroundColor = backgroundColors[cellValue];
                    if (backgroundColor) {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
        
        // Second pass: render sprites
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cellValue = grid[row][col];
                if (cellValue > 0) {
                    const spriteIndex = cellValue - 1;
                    const spriteRow = Math.floor(spriteIndex / cols);
                    const spriteCol = spriteIndex % cols;
                    
                    const sx = spriteCol * spriteSize;
                    const sy = spriteRow * spriteSize;
                    
                    const dx = col * cellSize;
                    const dy = row * cellSize;
                    
                    ctx.drawImage(tilesetImg, sx, sy, spriteSize, spriteSize,
                                dx, dy, cellSize, cellSize);
                }
            }
        }
        
        // Draw grid lines
        this.drawGridLines(ctx, grid, cellSize);
    }

    // Fallback rendering without tileset
    renderGridFallback(ctx, grid, cellSize) {
        const colors = ['#e9ecef', '#6c757d', '#495057', '#343a40', '#212529'];
        
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cellValue = grid[row][col];
                const colorIndex = Math.min(cellValue, colors.length - 1);
                
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
        
        this.drawGridLines(ctx, grid, cellSize);
    }

    // Draw grid lines
    drawGridLines(ctx, grid, cellSize) {
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let col = 0; col <= grid[0].length; col++) {
            ctx.beginPath();
            ctx.moveTo(col * cellSize, 0);
            ctx.lineTo(col * cellSize, grid.length * cellSize);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= grid.length; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * cellSize);
            ctx.lineTo(grid[0].length * cellSize, row * cellSize);
            ctx.stroke();
        }
    }

    // Show viewer controls
    showViewerControls() {
        const controls = ['edit-map-btn', 'duplicate-map-btn', 'export-map-btn'];
        controls.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = '';
        });
    }

    // Show empty viewer
    showEmptyViewer() {
        const viewerContent = document.getElementById('map-viewer-content');
        const titleDisplay = document.getElementById('map-title-display');
        const mapStats = document.getElementById('map-stats');
        
        if (viewerContent) {
            viewerContent.innerHTML = `
                <div class="map-viewer-placeholder">
                    <i class="material-icons">map</i>
                    <h3>Select a Map</h3>
                    <p>Choose a map from the list to view it here, or create a new one to get started.</p>
                </div>
            `;
        }
        
        if (titleDisplay) {
            titleDisplay.textContent = 'No map selected';
        }
        
        if (mapStats) {
            mapStats.style.display = 'none';
        }
        
        // Hide control buttons
        const controls = ['edit-map-btn', 'duplicate-map-btn', 'export-map-btn'];
        controls.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }

    // Update map stats display
    updateMapStats(map) {
        const mapStats = document.getElementById('map-stats');
        const sizeDisplay = document.getElementById('map-size-display');
        const tilesetDisplay = document.getElementById('map-tileset-display');
        const modifiedDisplay = document.getElementById('map-modified-display');
        
        if (mapStats) mapStats.style.display = 'flex';
        if (sizeDisplay) sizeDisplay.textContent = `Size: ${map.size}`;
        if (tilesetDisplay) tilesetDisplay.textContent = `Tileset: ${map.tileset}`;
        if (modifiedDisplay) {
            const modifiedDate = new Date(map.modified).toLocaleDateString();
            modifiedDisplay.textContent = `Modified: ${modifiedDate}`;
        }
    }

    // Edit current map - Handle different map formats and load into editor
    editMap(mapId) {
        console.log('🎯 editMap called with mapId:', mapId);
        console.log('🔍 this.currentMapId:', this.currentMapId);
        
        const map = this.savedMaps.get(mapId);
        console.log('📋 Found map:', map?.name || 'NOT FOUND');
        
        if (map) {
            // Store the map data to load after modal initialization
            window.pendingMapToLoad = {
                mapData: map.data,
                mapId: mapId
            };
            
            console.log('🗺️ Set pending map to load:', map.name || 'Unnamed Map');
            
            if (window.openMapModal) {
                window.openMapModal();
            } else if (window.openMapEditor) {
                window.openMapEditor();
            }
        } else {
            console.error('❌ No map found for ID:', mapId);
            console.log('📚 Available map IDs:', Array.from(this.savedMaps.keys()));
        }
    }

    // LoadMapFormat - Convert different map data formats to what the editor expects
    async loadMapFormat(mapData, mapId = null) {
        console.log('🗺️ Loading map format:', mapData);
        console.log('🆔 Map ID:', mapId);
        
        // Normalize the map data to the expected editor format
        let normalizedData = {
            grid: null,
            name: mapData.name || "Untitled Map",
            size: 15,
            tileset: "default",
            type: mapData.type || "dungeon"
        };

        // Handle different format types
        if (mapData.data && mapData.data.grid) {
            // New format with nested data (like Smile map)
            console.log('📋 Detected new nested grid format');
            normalizedData.grid = mapData.data.grid;
            normalizedData.size = mapData.data.size || mapData.data.grid.length;
            normalizedData.tileset = mapData.data.tileset || normalizedData.tileset;
            normalizedData.name = mapData.data.name || mapData.name || normalizedData.name;
            normalizedData.type = mapData.data.type || mapData.type || normalizedData.type;
        } else if (mapData.grid) {
            // Direct grid format
            console.log('📋 Detected direct grid format');
            normalizedData.grid = mapData.grid;
            normalizedData.size = mapData.size || mapData.grid.length;
            normalizedData.tileset = mapData.tileset || normalizedData.tileset;
        } else if (mapData.mapData && Array.isArray(mapData.mapData)) {
            // Flat array format (like Untitled map) - convert to grid
            console.log('📋 Detected flat array format, converting to grid');
            const size = mapData.size || 15;
            const grid = [];
            
            for (let row = 0; row < size; row++) {
                const gridRow = [];
                for (let col = 0; col < size; col++) {
                    const index = row * size + col;
                    gridRow.push(mapData.mapData[index] || null);
                }
                grid.push(gridRow);
            }
            
            normalizedData.grid = grid;
            normalizedData.size = size;
            normalizedData.tileset = mapData.tileset || normalizedData.tileset;
        } else {
            console.warn('⚠️ Unknown map format, creating empty grid');
            console.log('🔍 Raw mapData structure:', Object.keys(mapData));
            // Create empty grid as fallback
            const size = mapData.size || 15;
            const grid = Array(size).fill(null).map(() => Array(size).fill(null));
            normalizedData.grid = grid;
            normalizedData.size = size;
        }

        console.log('✅ Normalized map data:', normalizedData);
        console.log('🎯 Grid size:', normalizedData.grid ? normalizedData.grid.length : 'No grid');
        console.log('🎯 First few grid cells:', normalizedData.grid ? normalizedData.grid[0]?.slice(0, 3) : 'No grid');

        // Load into the map editor
        if (window.loadMapFromData) {
            console.log('📤 Calling window.loadMapFromData...');
            await window.loadMapFromData(normalizedData, mapId);
            console.log('✅ Called window.loadMapFromData');
        } else {
            console.error('❌ loadMapFromData function not available');
        }
    }

    // Duplicate a map
    async duplicateMap(mapId) {
        const originalMap = this.savedMaps.get(mapId);
        if (originalMap) {
            const newMapId = await this.addMap(originalMap.data, `${originalMap.name} (Copy)`);
            return newMapId;
        }
    }

    // Share map with players via real-time sync
    async shareMap(mapId) {
        console.log('🔗 Attempting to share map:', mapId);
        const map = this.savedMaps.get(mapId);
        
        if (!map) {
            console.error('❌ Map not found:', mapId);
            return;
        }

        console.log('🔍 Checking map sync system availability...');
        console.log('window.mapSync exists:', !!window.mapSync);
        console.log('window.mapSync.getAdapter exists:', !!(window.mapSync && window.mapSync.getAdapter));
        
        if (window.mapSync && window.mapSync.getAdapter) {
            const adapter = window.mapSync.getAdapter();
            console.log('Adapter available:', !!adapter);
            console.log('Adapter details:', adapter);
        }

        // Check if we have the global map sync adapter
        if (!window.mapSync || !window.mapSync.getAdapter() || !window.mapSync.getAdapter()) {
            console.error('❌ Map sync system not initialized. Please connect to Supabase first.');
            console.log('Available window.mapSync:', window.mapSync);
            alert('Map sharing requires Supabase connection. Please connect first.');
            return;
        }

        try {
            const adapter = window.mapSync.getAdapter();
            console.log('🚀 Using adapter to share map:', map.name);
            
            // Share the map using the adapter directly
            const result = await adapter.shareMap(map, map.name, {
                allowPlayerMovement: true,
                showPlayerPositions: true,
                gridSize: map.size || 15
            });

            if (result.success) {
                console.log('✅ Map shared successfully:', map.name);
                
                // Visual feedback - highlight the shared map
                const mapElement = document.querySelector(`[data-map-id="${mapId}"]`);
                if (mapElement) {
                    mapElement.style.border = '2px solid #4CAF50';
                    mapElement.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.3)';
                    
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        mapElement.style.border = '';
                        mapElement.style.boxShadow = '';
                    }, 3000);
                }
                
                // Show success message
                if (typeof showNotification === 'function') {
                    showNotification(`Map "${map.name}" shared with players!`, 'success');
                } else {
                    alert(`Map "${map.name}" shared with players!`);
                }
            } else {
                console.error('❌ Failed to share map:', result.error);
                alert(`Failed to share map: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ Error sharing map:', error);
            alert(`Error sharing map: ${error.message}`);
        }
    }

    // Confirm delete map
    async confirmDeleteMap(mapId) {
        console.log('❓ Confirm delete called for map:', mapId);
        const map = this.savedMaps.get(mapId);
        console.log('📋 Map data:', map);
        
        if (map && confirm(`Are you sure you want to delete "${map.name}"?`)) {
            console.log('✅ User confirmed deletion');
            await this.deleteMap(mapId);
        } else {
            console.log('❌ Deletion cancelled or map not found');
        }
    }

    // Export current map
    exportCurrentMap() {
        if (this.currentMapId) {
            const map = this.savedMaps.get(this.currentMapId);
            if (map) {
                this.exportMap(map);
            }
        }
    }

    // Export a specific map
    exportMap(map) {
        const dataStr = JSON.stringify(map.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${map.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    // Export map by ID
    exportMapById(mapId) {
        const map = this.savedMaps.get(mapId);
        if (map) {
            this.exportMap(map);
        }
    }

    // Export all maps
    exportAllMaps() {
        const allMaps = Object.fromEntries(this.savedMaps);
        const dataStr = JSON.stringify(allMaps, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `storyteller_maps_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    // Import map from file
    importMapFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const fileData = JSON.parse(e.target.result);
                        console.log('📂 Imported file data:', fileData);
                        
                        let mapData;
                        let mapName;
                        
                        // Handle different file formats
                        if (fileData.grid) {
                            // New format from maps manager
                            mapData = fileData;
                            mapName = fileData.name || file.name.replace('.json', '').replace(/_/g, ' ');
                        } else if (fileData.mapData && fileData.size) {
                            // Legacy format from exported files - detect tileset
                            const detectedTileset = 'default'; // For now, assume default since exported maps don't save tileset
                            
                            mapData = {
                                grid: await this.convertFlatArrayToGrid(fileData.mapData, fileData.size, detectedTileset),
                                tileset: detectedTileset,
                                name: fileData.name,
                                size: fileData.size,
                                type: fileData.type,
                                created: fileData.created || new Date().toISOString(),
                                version: fileData.version || "1.0"
                            };
                            mapName = fileData.name || file.name.replace('.json', '').replace(/_/g, ' ');
                        } else {
                            throw new Error('Unknown map file format');
                        }
                        
                        console.log('✅ Processed map data:', mapData);
                        await this.addMap(mapData, mapName);
                        console.log('📚 Successfully imported map:', mapName);
                    } catch (error) {
                        console.error('❌ Failed to import map:', error);
                        alert('Failed to import map: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize pan/zoom functionality for the map viewer
    initializeViewerPanZoom(container, canvas) {
        let viewerZoom = 1;
        let viewerPanX = 0;
        let viewerPanY = 0;
        let isPanning = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let isMultiTouch = false;
        let lastTouchDistance = 0;

        // Update canvas transform
        const updateViewerTransform = () => {
            canvas.style.transform = `scale(${viewerZoom}) translate(${viewerPanX}px, ${viewerPanY}px)`;
        };

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const oldZoom = viewerZoom;
            viewerZoom = Math.max(0.2, Math.min(5, viewerZoom * zoomFactor));
            
            // Adjust pan to zoom towards mouse position
            const zoomChange = viewerZoom / oldZoom;
            viewerPanX = mouseX - (mouseX - viewerPanX) * zoomChange;
            viewerPanY = mouseY - (mouseY - viewerPanY) * zoomChange;
            
            updateViewerTransform();
        });

        // Mouse pan
        container.addEventListener('mousedown', (e) => {
            if (e.button === 2 || e.button === 1) { // Right or middle mouse button
                isPanning = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                viewerPanX += deltaX / viewerZoom;
                viewerPanY += deltaY / viewerZoom;
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                updateViewerTransform();
            }
        });

        container.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                container.style.cursor = 'grab';
            }
        });

        container.addEventListener('mouseleave', () => {
            isPanning = false;
            container.style.cursor = 'grab';
        });

        // Touch support
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isPanning = true;
                lastMouseX = e.touches[0].clientX;
                lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                isMultiTouch = true;
                isPanning = false;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
            e.preventDefault();
        });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isPanning && !isMultiTouch) {
                const deltaX = e.touches[0].clientX - lastMouseX;
                const deltaY = e.touches[0].clientY - lastMouseY;
                
                viewerPanX += deltaX / viewerZoom;
                viewerPanY += deltaY / viewerZoom;
                
                lastMouseX = e.touches[0].clientX;
                lastMouseY = e.touches[0].clientY;
                
                updateViewerTransform();
            } else if (e.touches.length === 2 && isMultiTouch) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                if (lastTouchDistance > 0) {
                    const scale = distance / lastTouchDistance;
                    viewerZoom = Math.max(0.2, Math.min(5, viewerZoom * scale));
                    updateViewerTransform();
                }
                lastTouchDistance = distance;
            }
            e.preventDefault();
        });

        container.addEventListener('touchend', () => {
            isPanning = false;
            isMultiTouch = false;
            lastTouchDistance = 0;
        });

        // Disable context menu for right-click panning
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Add zoom controls overlay
        const zoomControls = document.createElement('div');
        zoomControls.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 10;
        `;

        const createZoomButton = (text, onclick) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                width: 32px;
                height: 32px;
                border: 1px solid var(--border-color);
                background: var(--bg-primary);
                color: var(--text-primary);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            btn.addEventListener('click', onclick);
            return btn;
        };

        const zoomInBtn = createZoomButton('+', () => {
            viewerZoom = Math.min(5, viewerZoom * 1.2);
            updateViewerTransform();
        });

        const zoomOutBtn = createZoomButton('−', () => {
            viewerZoom = Math.max(0.2, viewerZoom / 1.2);
            updateViewerTransform();
        });

        const resetBtn = createZoomButton('⌂', () => {
            viewerZoom = 1;
            viewerPanX = 0;
            viewerPanY = 0;
            updateViewerTransform();
        });

        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(resetBtn);
        container.appendChild(zoomControls);

        console.log('✅ Map viewer pan/zoom initialized');
    }
}

// Global functions for HTML onclick handlers
window.openMapEditor = function() {
    if (window.openMapModal) {
        window.openMapModal();
    }
};

window.refreshMapsList = function() {
    if (window.mapsManager) {
        window.mapsManager.refreshMapsList();
    }
};

window.editCurrentMap = function() {
    if (window.mapsManager) {
        window.mapsManager.editMap(window.mapsManager.currentMapId);
    }
};

window.duplicateCurrentMap = function() {
    if (window.mapsManager) {
        window.mapsManager.duplicateMap(window.mapsManager.currentMapId);
    }
};

window.exportCurrentMap = function() {
    if (window.mapsManager) {
        window.mapsManager.exportCurrentMap();
    }
};

window.exportAllMaps = function() {
    if (window.mapsManager) {
        window.mapsManager.exportAllMaps();
    }
};

window.importMapFromFile = function() {
    if (window.mapsManager) {
        window.mapsManager.importMapFromFile();
    }
};

// Initialize maps manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.mapsManager = new MapsManager();
});

// Initialize maps panel when it's shown
window.initializeMapsPanel = async function() {
    if (window.mapsManager) {
        await window.mapsManager.initialize();
    }
};
