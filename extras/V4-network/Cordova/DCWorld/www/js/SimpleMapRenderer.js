// Simple Map Renderer for Player Test
// Uses the proven rendering logic from MapsManager without storage dependencies

class SimpleMapRenderer {
    constructor() {
        console.log('🎨 SimpleMapRenderer initialized for player interface');
    }

    // Main rendering function - copied from MapsManager.renderMapWithCSSGrid
    renderMapWithCSSGrid(container, mapData) {
        console.log('🎨 SimpleMapRenderer: renderMapWithCSSGrid called with:', mapData);
        
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
                height: 600px;
                overflow: auto;
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
                    min-width: ${size * 65}px;
                    min-height: ${size * 65}px;
                ">
                    <div class="map-viewer-grid" style="
                        display: grid;
                        grid-template-columns: repeat(${size}, 64px);
                        grid-template-rows: repeat(${size}, 64px);
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

    // Simplified tileset loading for player interface
    async loadTilesetForGridViewer(mapGrid, grid, tilesetName, canvasDiv, wrapper) {
        try {
            // Generate sprite CSS
            await this.generateSpriteCSS(tilesetName);
            
            // Create tiles
            this.createGridTiles(mapGrid, grid, null, tilesetName);
            
            // Initialize basic pan/zoom
            this.initializeViewerPanZoom(wrapper, canvasDiv);
            
        } catch (error) {
            console.warn(`⚠️ Failed to load tileset: ${error.message}`);
            this.createGridTilesFallback(mapGrid, grid);
            this.initializeViewerPanZoom(wrapper, canvasDiv);
        }
    }

    // Generate sprite CSS - simplified version
    async generateSpriteCSS(tilesetName) {
        // Remove any existing tileset styles to prevent conflicts
        const existingStyles = document.querySelectorAll('style[data-viewer-tileset-style]');
        existingStyles.forEach(style => style.remove());
        
        // Create the same CSS rules as the map editor
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-viewer-tileset-style', 'true');
        const imageUrl = `assets/${tilesetName.toLowerCase()}.png?v=${Date.now()}`;
        
        // Use percentage positioning for responsive sizing
        const spritePositions = {
            'mountain': '0% 0%',           'water': '33.333% 0%',         'grass': '66.666% 0%',         'rock': '100% 0%',
            'castle': '0% 33.333%',       'house': '33.333% 33.333%',    'shop': '66.666% 33.333%',     'temple': '100% 33.333%',
            'dragon': '0% 66.666%',       'sword': '33.333% 66.666%',    'skull': '66.666% 66.666%',    'danger': '100% 66.666%',
            'tower': '0% 100%',           'road': '33.333% 100%',        'door': '66.666% 100%',        'fire': '100% 100%'
        };
        
        let cssRules = `
            .viewer-tile .sprite,
            .map-tile .sprite {
                background-image: url('${imageUrl}') !important;
                width: 100% !important;
                height: 100% !important;
                background-size: 400% 400% !important;
                background-repeat: no-repeat !important;
                display: block !important;
            }
        `;
        
        Object.entries(spritePositions).forEach(([sprite, position]) => {
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
    }

    // Create tiles - simplified version
    createGridTiles(mapGrid, grid, tilesetConfig, tilesetName) {
        console.log(`🎨 SimpleMapRenderer: createGridTiles called with grid size: ${grid.length}`);
        
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
                
                const tileData = grid[row][col];
                if (tileData && tileData !== 0) {
                    nonEmptyTiles++;
                }
                
                // Render the tile
                this.renderViewerTile(tile, tileData, tilesetConfig, tilesetName);
                
                mapGrid.appendChild(tile);
            }
        }
        
        console.log(`✅ SimpleMapRenderer: Created ${size * size} tiles (${nonEmptyTiles} non-empty)`);
    }

    // Render individual tiles
    renderViewerTile(tile, tileData, tilesetConfig, tilesetName) {
        if (!tileData) return;
        
        if (typeof tileData === 'object' && tileData.type === 'sprite' && tileData.value) {
            // Sprite object format (v1_2map.json)
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${tileData.value}`;
            spriteDiv.title = tileData.name || tileData.value;
            tile.appendChild(spriteDiv);
            console.log(`🎨 Rendered sprite: ${tileData.value}`);
        } else if (typeof tileData === 'number' && tileData > 0) {
            // Numeric tile format
            tile.style.background = this.getTileColor(tileData);
            tile.textContent = tileData;
        }
    }

    // Fallback tile creation
    createGridTilesFallback(mapGrid, grid) {
        console.log('🎨 Using fallback tile rendering');
        this.createGridTiles(mapGrid, grid, null, 'default');
    }

    // Simple pan/zoom functionality
    initializeViewerPanZoom(wrapper, canvas) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let scale = 1;

        // Mouse events for pan
        wrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const transform = window.getComputedStyle(canvas).transform;
            if (transform !== 'none') {
                const matrix = new WebKitCSSMatrix(transform);
                initialX = matrix.m41;
                initialY = matrix.m42;
            } else {
                initialX = 0;
                initialY = 0;
            }
            wrapper.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            canvas.style.transform = `translate(calc(-50% + ${initialX + deltaX}px), calc(-50% + ${initialY + deltaY}px)) scale(${scale})`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            wrapper.style.cursor = 'grab';
        });

        // Mouse wheel for zoom
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            scale *= zoomFactor;
            scale = Math.max(0.1, Math.min(3, scale));
            
            const currentTransform = window.getComputedStyle(canvas).transform;
            let translateX = 0, translateY = 0;
            if (currentTransform !== 'none') {
                const matrix = new WebKitCSSMatrix(currentTransform);
                translateX = matrix.m41;
                translateY = matrix.m42;
            }
            
            canvas.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
        });
    }

    // Error message rendering
    renderErrorMessage(container, message) {
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #666;
                font-size: 14px;
                border: 2px dashed #ccc;
                border-radius: 8px;
                background: #f9f9f9;
            ">
                ❌ ${message}
            </div>
        `;
    }

    // Tile color fallback
    getTileColor(tileValue) {
        const colors = {
            0: '#f8f9fa', 1: '#6c757d', 2: '#fff3cd', 3: '#d4edda', 4: '#f8d7da',
            5: '#d1ecf1', 6: '#d4edda', 7: '#e2e3e5', 8: '#fff3cd'
        };
        return colors[tileValue] || '#f8f9fa';
    }
}

// Make it globally available
window.SimpleMapRenderer = SimpleMapRenderer;

console.log('🎨 SimpleMapRenderer module loaded for player interface');
