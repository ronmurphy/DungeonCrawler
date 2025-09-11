/**
 * PlayerMapViewer - Proven pan/zoom map viewer for player-test.html
 * Uses the same reliable pan/zoom code from maps-manager.js
 */
class PlayerMapViewer {
    constructor(containerId, canvasId) {
        this.containerId = containerId;
        this.canvasId = canvasId;
        
        this.container = document.getElementById(containerId);
        this.canvas = document.getElementById(canvasId);
        
        if (!this.container || !this.canvas) {
            throw new Error(`PlayerMapViewer: Required elements not found - container: ${!!this.container}, canvas: ${!!this.canvas}`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Pan/zoom state
        this.viewerZoom = 1;
        this.viewerPanX = 0;
        this.viewerPanY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMultiTouch = false;
        this.lastTouchDistance = 0;
        
        // Current map data
        this.currentMapData = null;
        this.tileSize = 64;
        
        this.initializeEventHandlers();
        this.addZoomControls();
        
        console.log('PlayerMapViewer initialized');
    }
    
    // Initialize proven pan/zoom event handlers from maps-manager.js
    initializeEventHandlers() {
        const container = this.container;
        
        // Update canvas transform
        const updateViewerTransform = () => {
            // Apply transform to both canvas and grid container
            const transform = `scale(${this.viewerZoom}) translate(${this.viewerPanX}px, ${this.viewerPanY}px)`;
            this.canvas.style.transform = transform;
            
            const gridContainer = this.container.querySelector('.tile-grid-container');
            if (gridContainer) {
                gridContainer.style.transform = transform;
            }
        };

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const oldZoom = this.viewerZoom;
            this.viewerZoom = Math.max(0.2, Math.min(5, this.viewerZoom * zoomFactor));
            
            // Adjust pan to zoom towards mouse position
            const zoomChange = this.viewerZoom / oldZoom;
            this.viewerPanX = mouseX - (mouseX - this.viewerPanX) * zoomChange;
            this.viewerPanY = mouseY - (mouseY - this.viewerPanY) * zoomChange;
            
            updateViewerTransform();
        });

        // Mouse pan
        container.addEventListener('mousedown', (e) => {
            if (e.button === 2 || e.button === 1) { // Right or middle mouse button
                this.isPanning = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.viewerPanX += deltaX / this.viewerZoom;
                this.viewerPanY += deltaY / this.viewerZoom;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                updateViewerTransform();
            }
        });

        container.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                container.style.cursor = 'grab';
            }
        });

        container.addEventListener('mouseleave', () => {
            this.isPanning = false;
            container.style.cursor = 'grab';
        });

        // Touch support
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isPanning = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                this.isMultiTouch = true;
                this.isPanning = false;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                this.lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
            e.preventDefault();
        });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isPanning && !this.isMultiTouch) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.viewerPanX += deltaX / this.viewerZoom;
                this.viewerPanY += deltaY / this.viewerZoom;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                
                updateViewerTransform();
            } else if (e.touches.length === 2 && this.isMultiTouch) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                if (this.lastTouchDistance > 0) {
                    const scale = distance / this.lastTouchDistance;
                    this.viewerZoom = Math.max(0.2, Math.min(5, this.viewerZoom * scale));
                    updateViewerTransform();
                }
                this.lastTouchDistance = distance;
            }
            e.preventDefault();
        });

        container.addEventListener('touchend', () => {
            this.isPanning = false;
            this.isMultiTouch = false;
            this.lastTouchDistance = 0;
        });

        // Disable context menu for right-click panning
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Set initial cursor
        container.style.cursor = 'grab';
    }
    
    // Add zoom controls overlay
    addZoomControls() {
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
                border: 1px solid #ccc;
                background: rgba(255, 255, 255, 0.9);
                cursor: pointer;
                border-radius: 4px;
                font-weight: bold;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            btn.onclick = onclick;
            return btn;
        };

        const zoomInBtn = createZoomButton('+', () => {
            this.viewerZoom = Math.min(5, this.viewerZoom * 1.2);
            this.updateTransforms();
        });

        const zoomOutBtn = createZoomButton('-', () => {
            this.viewerZoom = Math.max(0.2, this.viewerZoom / 1.2);
            this.updateTransforms();
        });

        const resetBtn = createZoomButton('⌂', () => {
            this.viewerZoom = 1;
            this.viewerPanX = 0;
            this.viewerPanY = 0;
            this.updateTransforms();
        });

        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(resetBtn);
        
        this.container.appendChild(zoomControls);
    }
    
    // Helper method to update all transforms
    updateTransforms() {
        const transform = `scale(${this.viewerZoom}) translate(${this.viewerPanX}px, ${this.viewerPanY}px)`;
        this.canvas.style.transform = transform;
        
        const gridContainer = this.container.querySelector('.tile-grid-container');
        if (gridContainer) {
            gridContainer.style.transform = transform;
        }
    }
    
    // Render map using canvas (more reliable than CSS grid for complex maps)
    renderMap(mapData) {
        console.log('PlayerMapViewer: Rendering map', mapData);
        this.currentMapData = mapData;
        
        // Check if we have sprite names or numeric tiles
        if (mapData.spriteNames) {
            // New sprite name format
            const { width, height, spriteNames, tileset, backgroundColors } = mapData;
            console.log(`PlayerMapViewer: Map dimensions ${width}x${height}, sprites count: ${spriteNames.length}`);
            console.log('PlayerMapViewer: Background colors:', backgroundColors);
            
            if (tileset && tileset !== 'default') {
                console.log('PlayerMapViewer: Loading tileset:', tileset);
                this.loadTilesetAndRenderSprites(tileset, spriteNames, width, height, backgroundColors);
            } else {
                console.log('PlayerMapViewer: Using default tileset');
                this.loadTilesetAndRenderSprites('default', spriteNames, width, height, backgroundColors);
            }
        } else if (mapData.tiles) {
            // Legacy numeric tiles format
            const { width, height, tiles, tileset } = mapData;
            console.log(`PlayerMapViewer: Map dimensions ${width}x${height}, tiles count: ${tiles.length}`);
            
            if (tileset && tileset !== 'default') {
                console.log('PlayerMapViewer: Loading tileset:', tileset);
                this.loadTilesetAndRender(tileset, tiles, width, height);
            } else {
                console.log('PlayerMapViewer: Using default tileset');
                this.loadTilesetAndRender('default', tiles, width, height);
            }
        } else {
            console.log('PlayerMapViewer: No map data to render - mapData:', !!mapData, 'spriteNames:', mapData?.spriteNames, 'tiles:', mapData?.tiles);
            return;
        }
    }
    
    loadTilesetAndRender(tilesetName, tiles, width, height) {
        console.log('PlayerMapViewer: Loading tileset using CSS sprites:', tilesetName);
        
        // Normalize tileset name (lowercase)
        const normalizedTilesetName = (tilesetName || 'default').toLowerCase();
        
        // Load tileset configuration first
        fetch(`assets/${normalizedTilesetName}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Tileset config not found: ${normalizedTilesetName}.json`);
                }
                return response.json();
            })
            .then(tilesetConfig => {
                console.log('PlayerMapViewer: Tileset config loaded:', tilesetConfig);
                this.renderTilesWithCSS(tilesetConfig, normalizedTilesetName, tiles, width, height);
            })
            .catch(error => {
                console.log('PlayerMapViewer: Failed to load tileset config:', error);
                console.log('PlayerMapViewer: Falling back to colored squares');
                this.renderWithoutTileset(tiles, width, height);
            });
    }
    
    loadTilesetAndRenderSprites(tilesetName, spriteNames, width, height, backgroundColors = {}) {
        console.log('PlayerMapViewer: Loading tileset for sprite names:', tilesetName);
        
        // Normalize tileset name (lowercase)
        const normalizedTilesetName = (tilesetName || 'default').toLowerCase();
        
        // Load tileset configuration first
        fetch(`assets/${normalizedTilesetName}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Tileset config not found: ${normalizedTilesetName}.json`);
                }
                return response.json();
            })
            .then(tilesetConfig => {
                console.log('PlayerMapViewer: Tileset config loaded:', tilesetConfig);
                this.renderSpritesWithCSS(tilesetConfig, normalizedTilesetName, spriteNames, width, height, backgroundColors);
            })
            .catch(error => {
                console.log('PlayerMapViewer: Failed to load tileset config:', error);
                console.log('PlayerMapViewer: Falling back to colored squares');
                this.renderSpritesWithoutTileset(spriteNames, width, height);
            });
    }
    
    renderTilesWithCSS(tilesetConfig, tilesetName, tiles, width, height) {
        console.log('PlayerMapViewer: Rendering tiles with CSS sprites');
        
        // Clear canvas and create CSS grid container instead
        this.canvas.style.display = 'none';
        
        // Create CSS grid container
        let gridContainer = this.container.querySelector('.tile-grid-container');
        if (!gridContainer) {
            gridContainer = document.createElement('div');
            gridContainer.className = 'tile-grid-container';
            this.container.appendChild(gridContainer);
        }
        
        // Set up CSS grid
        gridContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(${width}, 64px);
            grid-template-rows: repeat(${height}, 64px);
            gap: 1px;
            padding: 1px;
            background: #ddd;
            transform-origin: 0 0;
            transform: scale(${this.viewerZoom}) translate(${this.viewerPanX}px, ${this.viewerPanY}px);
        `;
        
        // Clear existing tiles
        gridContainer.innerHTML = '';
        
        // Create individual tile elements using StoryTeller sprite system
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = y * width + x;
                const gid = tiles[tileIndex];
                
                const tileElement = document.createElement('div');
                tileElement.className = 'map-tile';
                tileElement.style.cssText = `
                    width: 64px;
                    height: 64px;
                    background-color: #f9f9f9;
                    position: relative;
                `;
                
                if (gid > 0) {
                    // Convert numeric GID back to sprite name using the mapping
                    const spriteName = this.numberToSprite(gid);
                    
                    if (spriteName) {
                        // Create sprite div using StoryTeller CSS classes
                        const spriteDiv = document.createElement('div');
                        spriteDiv.className = `sprite ${spriteName}`;
                        spriteDiv.style.cssText = `
                            width: 64px;
                            height: 64px;
                            background-image: url(assets/${tilesetName}.png);
                            background-size: 256px 256px;
                            background-repeat: no-repeat;
                        `;
                        
                        tileElement.appendChild(spriteDiv);
                        console.log(`Rendered tile: GID ${gid} -> sprite ${spriteName}`);
                    }
                }
                
                gridContainer.appendChild(tileElement);
            }
        }
        
        console.log('PlayerMapViewer: Finished rendering CSS sprite tiles');
    }
    
    renderSpritesWithCSS(tilesetConfig, tilesetName, spriteNames, width, height, backgroundColors = {}) {
        console.log('PlayerMapViewer: Rendering sprites with CSS (direct sprite names + background colors)');
        
        // Clear canvas and create CSS grid container instead
        this.canvas.style.display = 'none';
        
        // Create CSS grid container
        let gridContainer = this.container.querySelector('.tile-grid-container');
        if (!gridContainer) {
            gridContainer = document.createElement('div');
            gridContainer.className = 'tile-grid-container';
            this.container.appendChild(gridContainer);
        }
        
        // Set up CSS grid
        gridContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(${width}, 64px);
            grid-template-rows: repeat(${height}, 64px);
            gap: 1px;
            padding: 1px;
            background: #ddd;
            transform-origin: 0 0;
            transform: scale(${this.viewerZoom}) translate(${this.viewerPanX}px, ${this.viewerPanY}px);
        `;
        
        // Clear existing tiles
        gridContainer.innerHTML = '';
        
        // Create individual tile elements using sprite names directly
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = y * width + x;
                const spriteName = spriteNames[tileIndex];
                
                const tileElement = document.createElement('div');
                tileElement.className = 'map-tile';
                
                // Apply background color from v1.2 format!
                const backgroundColor = spriteName && backgroundColors[spriteName] 
                    ? backgroundColors[spriteName] 
                    : '#f9f9f9';
                
                tileElement.style.cssText = `
                    width: 64px;
                    height: 64px;
                    background-color: ${backgroundColor} !important;
                    position: relative;
                    border: 1px solid #ddd;
                `;
                
                console.log(`Setting background for ${spriteName}: ${backgroundColor}`);
                
                if (spriteName) {
                    // Create sprite div using StoryTeller CSS classes
                    const spriteDiv = document.createElement('div');
                    spriteDiv.className = `sprite ${spriteName}`;
                    spriteDiv.style.cssText = `
                        width: 100%;
                        height: 100%;
                        background-image: url(assets/${tilesetName}.png);
                        background-size: 256px 256px;
                        background-repeat: no-repeat;
                        position: absolute;
                        top: 0;
                        left: 0;
                    `;
                    
                    tileElement.appendChild(spriteDiv);
                    console.log(`Rendered sprite: ${spriteName} with bg color ${backgroundColor} at position ${x},${y}`);
                } else {
                    // Empty cell - just show the background color
                    console.log(`Empty cell with bg color ${backgroundColor} at position ${x},${y}`);
                }
                
                gridContainer.appendChild(tileElement);
            }
        }
        
        console.log('PlayerMapViewer: Finished rendering sprite names with CSS and background colors');
    }
    
    renderSpritesWithoutTileset(spriteNames, width, height) {
        console.log('PlayerMapViewer: Rendering sprites without tileset (fallback)');
        
        // Create simple colored squares for each sprite type
        const spriteColors = {
            'mountain': '#8B4513',
            'water': '#4682B4', 
            'grass': '#228B22',
            'forest': '#006400',
            'rock': '#808080',
            'door': '#8B4513',
            'default': '#DDD'
        };
        
        // This would be the canvas fallback - for now just log
        for (let i = 0; i < spriteNames.length; i++) {
            const spriteName = spriteNames[i];
            if (spriteName) {
                console.log(`Fallback: ${spriteName} -> ${spriteColors[spriteName] || spriteColors.default}`);
            }
        }
    }
    
    // Helper method to convert numeric GID back to sprite name
    numberToSprite(gid) {
        // Reverse mapping of the spriteToNumber function in MapClientManager
        const numberToSpriteMap = {
            1: 'mountain',
            2: 'forest',
            3: 'water',
            4: 'grass',
            5: 'stone',
            6: 'desert',
            7: 'snow',
            8: 'lava',
            9: 'swamp',
            10: 'city',
            11: 'village',
            12: 'road',
            13: 'bridge',
            14: 'door',
            15: 'chest',
            16: 'treasure',
            17: 'monster',
            18: 'npc',
            19: 'player',
            20: 'stairs'
        };
        
        return numberToSpriteMap[gid] || 'mountain'; // Default to mountain if not found
    }
    
    renderWithoutTileset(tiles, width, height) {
        console.log('PlayerMapViewer: Rendering without tileset, tiles:', tiles);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = y * width + x;
                const gid = tiles[tileIndex];
                
                if (gid > 0) {
                    // Use different colors for different tile IDs
                    const colors = ['#8B4513', '#228B22', '#4682B4', '#CD853F', '#808080'];
                    const color = colors[(gid - 1) % colors.length];
                    
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize, 
                        this.tileSize
                    );
                    
                    // Draw border
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize, 
                        this.tileSize
                    );
                }
            }
        }
        
        console.log('PlayerMapViewer: Finished rendering tiles');
    }
    
    // Reset view to center
    resetView() {
        this.viewerZoom = 1;
        this.viewerPanX = 0;
        this.viewerPanY = 0;
        this.updateTransforms();
    }
    
    // Get current view state
    getViewState() {
        return {
            zoom: this.viewerZoom,
            panX: this.viewerPanX,
            panY: this.viewerPanY
        };
    }
    
    // Set view state
    setViewState(state) {
        this.viewerZoom = state.zoom || 1;
        this.viewerPanX = state.panX || 0;
        this.viewerPanY = state.panY || 0;
        this.updateTransforms();
    }
}
