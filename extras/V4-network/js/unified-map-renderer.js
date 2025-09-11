// ========================================
// UNIFIED MAP RENDERER
// Single system for both viewer and editor
// ========================================

class UnifiedMapRenderer {
    constructor() {
        this.currentTileset = 'default';
        this.spritePositions = {
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
        this.spriteClasses = Object.keys(this.spritePositions);
    }

    // ========================================
    // TILESET MANAGEMENT
    // ========================================

    async loadTileset(tilesetName = 'default') {
        if (window.showDebug) {
            console.log(`🎨 UnifiedMapRenderer: Loading tileset ${tilesetName}...`);
        }
        
        try {
            // Load tileset configuration
            let response = await fetch(`assets/${tilesetName.toLowerCase()}.json`);
            if (!response.ok) {
                response = await fetch(`assets/${tilesetName}.json`);
            }
            
            let tilesetData = null;
            if (response.ok) {
                tilesetData = await response.json();
                if (window.showDebug) {
                    console.log(`📋 Loaded tileset config: ${tilesetName}`, tilesetData);
                }
            }
            
            this.currentTileset = tilesetName;
            this.tilesetData = tilesetData;
            
            // Generate CSS for this tileset
            await this.generateTilesetCSS(tilesetName);
            
            if (window.showDebug) {
                console.log(`✅ UnifiedMapRenderer: Loaded tileset: ${tilesetName}`);
            }
            return tilesetData;
        } catch (error) {
            console.warn(`⚠️ UnifiedMapRenderer: Could not load tileset ${tilesetName}:`, error);
            // Still generate basic CSS even if config fails
            await this.generateTilesetCSS(tilesetName);
            return null;
        }
    }

    async generateTilesetCSS(tilesetName) {
        // Remove old CSS for this tileset
        const oldStyles = document.querySelectorAll(`style[data-tileset="${tilesetName}"]`);
        oldStyles.forEach(style => style.remove());

        // Determine image URL
        const imageUrl = (this.tilesetData && this.tilesetData.imageUrl) ? 
            this.tilesetData.imageUrl : 
            `assets/${tilesetName}.png`;

        // Create CSS for sprites - covers both viewer and editor
        const css = `
            /* Universal sprite base for all contexts */
            .map-tile .sprite,
            .viewer-tile .sprite,
            .selector-tile .sprite {
                background-image: url('${imageUrl}') !important;
                background-size: 400% 400% !important;
                background-repeat: no-repeat !important;
                width: 100% !important;
                height: 100% !important;
                display: block !important;
            }

            /* Specific sprite positions for 4x4 grid */
            .sprite.mountain { background-position: 0% 0% !important; }
            .sprite.water { background-position: 33.333% 0% !important; }
            .sprite.grass { background-position: 66.666% 0% !important; }
            .sprite.rock { background-position: 100% 0% !important; }
            .sprite.castle { background-position: 0% 33.333% !important; }
            .sprite.house { background-position: 33.333% 33.333% !important; }
            .sprite.shop { background-position: 66.666% 33.333% !important; }
            .sprite.temple { background-position: 100% 33.333% !important; }
            .sprite.dragon { background-position: 0% 66.666% !important; }
            .sprite.sword { background-position: 33.333% 66.666% !important; }
            .sprite.skull { background-position: 66.666% 66.666% !important; }
            .sprite.danger { background-position: 100% 66.666% !important; }
            .sprite.tower { background-position: 0% 100% !important; }
            .sprite.road { background-position: 33.333% 100% !important; }
            .sprite.door { background-position: 66.666% 100% !important; }
            .sprite.fire { background-position: 100% 100% !important; }
        `;

        // Inject CSS
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-tileset', tilesetName);
        styleElement.textContent = css;
        document.head.appendChild(styleElement);

        console.log(`🎨 Generated CSS for tileset: ${tilesetName}`);
    }

    // ========================================
    // MAP RENDERING
    // ========================================

    renderTile(tileElement, tileData, playerData = null, context = 'editor') {
        // Update tileset data if available globally (for tileset switching)
        if (window.tilesetData && window.tilesetData.backgroundColors) {
            this.tilesetData = window.tilesetData;
        }
        
        // Set this.mapData if available from global context for v1.2 support
        if (!this.mapData && window.currentLoadedMap) {
            this.mapData = window.currentLoadedMap;
        }
        
        // Clear and set up tile
        tileElement.innerHTML = '';
        tileElement.className = context === 'editor' ? 'map-tile' : 'viewer-tile';
        
        // Set basic tile styles
        tileElement.style.cssText = `
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

        if (!tileData) {
            // Empty tile
            tileElement.style.backgroundColor = context === 'editor' ? '#f5f5f5' : '#ffffff';
            return;
        }

        // Handle different data formats
        let spriteType = null;
        let backgroundColor = null;

        // Normalize data format - EXPANDED to handle more cases
        if (typeof tileData === 'object') {
            if (tileData.type === 'sprite') {
                spriteType = tileData.value;
            } else if (tileData.emoji) {
                // Legacy emoji format
                tileElement.textContent = tileData.emoji;
                return;
            }
        } else if (typeof tileData === 'string' && tileData.trim()) {
            // Direct sprite name or emoji
            if (this.spriteClasses.includes(tileData)) {
                spriteType = tileData;
            } else {
                // Assume it's emoji or text
                tileElement.textContent = tileData;
                return;
            }
        } else if (typeof tileData === 'number' && tileData > 0) {
            // Convert tile number to sprite using map editor's tile mapping
            spriteType = this.getTileNumberSpriteId(tileData);
            if (!spriteType) {
                // Fallback to number display
                tileElement.textContent = tileData.toString();
                tileElement.style.backgroundColor = '#e3f2fd';
                return;
            }
        }

        if (spriteType) {
            // Create sprite element
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${spriteType}`;
            
            // ENHANCED: Multi-version background color support
            if (typeof tileData === 'object' && tileData.background) {
                // v1.1 format with embedded background color (backward compatibility)
                backgroundColor = tileData.background;
            } else if (this.mapData && this.mapData.backgroundColors && this.mapData.backgroundColors[spriteType]) {
                // v1.2 format - lookup from map's color dictionary
                backgroundColor = this.mapData.backgroundColors[spriteType];
            } else if (this.tilesetData && this.tilesetData.backgroundColors) {
                // v1.0 format - lookup from tileset
                backgroundColor = this.tilesetData.backgroundColors[spriteType];
            } else if (window.tilesetData && window.tilesetData.backgroundColors) {
                // v1.0 format - fallback to global tileset data
                backgroundColor = window.tilesetData.backgroundColors[spriteType];
            }
            
            if (backgroundColor) {
                tileElement.style.backgroundColor = backgroundColor;
                if (window.showDebug && (context === 'editor' || context === 'viewer')) {
                    let source = 'tileset';
                    if (typeof tileData === 'object' && tileData.background) source = 'embedded';
                    else if (this.mapData && this.mapData.backgroundColors) source = 'dictionary';
                    console.log(`🎨 Applied ${source} background color for ${spriteType}: ${backgroundColor} in ${context}`);
                }
            }

            tileElement.appendChild(spriteDiv);
            if (window.showDebug) {
                console.log(`🎨 Rendered sprite: ${spriteType} in ${context}`);
            }
        } else {
            if (window.showDebug) {
                console.warn(`⚠️ Could not render tile data:`, tileData);
            }
            tileElement.textContent = '?';
            tileElement.style.backgroundColor = '#ffcccc';
        }

        // Render player data (overlay) for editor
        if (playerData && context === 'editor') {
            const player = document.createElement('div');
            player.classList.add('player-overlay');
            player.textContent = playerData.value || playerData;
            tileElement.appendChild(player);
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

    // ========================================
    // GRID RENDERING
    // ========================================

    renderGrid(container, mapData, size, context = 'editor') {
        // Clear container
        container.innerHTML = '';
        
        // Create grid
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        container.style.gap = '1px';
        container.style.width = '100%';
        container.style.height = '100%';

        // Convert data to flat array if needed
        let flatData = mapData;
        if (Array.isArray(mapData) && Array.isArray(mapData[0])) {
            // 2D array - flatten it
            flatData = mapData.flat();
        }

        // Create tiles
        for (let i = 0; i < size * size; i++) {
            const tile = document.createElement('div');
            tile.dataset.index = i;
            
            // Add interaction for editor
            if (context === 'editor') {
                tile.addEventListener('click', () => this.onTileClick?.(i, tile));
            }
            
            this.renderTile(tile, flatData[i], context);
            container.appendChild(tile);
        }
    }

    // ========================================
    // MAP LOADING
    // ========================================

    async loadAndDisplayMap(mapData, container, context = 'viewer') {
        // Extract map information
        const size = mapData.size || 15;
        const tileset = mapData.tileset || 'default';
        const grid = mapData.data || mapData.grid || mapData.mapData || [];

        console.log(`🗺️ Loading map: ${size}x${size}, tileset: ${tileset}, context: ${context}`);

        // Load tileset
        await this.loadTileset(tileset);

        // Render grid
        this.renderGrid(container, grid, size, context);

        console.log(`✅ Map displayed in ${context}`);
    }
}

// ========================================
// GLOBAL INSTANCE
// ========================================
window.unifiedMapRenderer = new UnifiedMapRenderer();

console.log('🗺️ Unified Map Renderer loaded');
