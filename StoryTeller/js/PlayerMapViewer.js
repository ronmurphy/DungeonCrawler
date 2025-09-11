/**
 * PlayerMapViewerCanvas - High-performance canvas-based map viewer for player-test.html
 * Converts CSS grid rendering to canvas for better performance and advanced effects
 */
class PlayerMapViewer {
    constructor(containerId, canvasId) {
        this.containerId = containerId;
        this.canvasId = canvasId;
        
        this.container = document.getElementById(containerId);
        this.canvas = document.getElementById(canvasId);
        
        if (!this.container || !this.canvas) {
            throw new Error(`PlayerMapViewerCanvas: Required elements not found - container: ${!!this.container}, canvas: ${!!this.canvas}`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas setup
        this.setupCanvas();
        
        // Pan/zoom state
        this.viewerZoom = 1;
        this.viewerPanX = 0;
        this.viewerPanY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMultiTouch = false;
        this.lastTouchDistance = 0;
        
        // Map data and rendering
        this.currentMapData = null;
        this.tileSize = 64;
        this.spriteSheets = new Map(); // Cache loaded sprite sheets
        this.tilesetConfigs = new Map(); // Cache tileset configurations
        
        this.initializeEventHandlers();
        this.addZoomControls();
        
        console.log('PlayerMapViewerCanvas initialized (Canvas rendering)');
    }
    
    // Setup canvas for high-DPI displays
    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas size (for high-DPI)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Set CSS size (displayed size)
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale canvas context for high-DPI
        this.ctx.scale(dpr, dpr);
        
        // Set canvas style for positioning
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        
        console.log(`Canvas setup: ${rect.width}x${rect.height} (DPR: ${dpr})`);
    }
    
    // Initialize canvas-based pan/zoom event handlers
    initializeEventHandlers() {
        const container = this.container;
        
        // Update canvas rendering instead of CSS transforms
        const updateViewerTransform = () => {
            this.renderCurrentMap(); // Re-render with new transform
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
            this.renderCurrentMap();
        });

        const zoomOutBtn = createZoomButton('-', () => {
            this.viewerZoom = Math.max(0.2, this.viewerZoom / 1.2);
            this.renderCurrentMap();
        });

        const resetBtn = createZoomButton('⌂', () => {
            this.viewerZoom = 1;
            this.viewerPanX = 0;
            this.viewerPanY = 0;
            this.renderCurrentMap();
        });

        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(resetBtn);
        
        this.container.appendChild(zoomControls);
    }
    
    // Canvas rendering methods
    renderCurrentMap() {
        if (!this.currentMapData) {
            this.clearCanvas();
            return;
        }
        
        this.clearCanvas();
        this.setupCanvasTransform();
        
        // Render based on data format
        if (this.currentMapData.spriteNames) {
            this.renderSpritesCanvas(this.currentMapData);
        } else if (this.currentMapData.tiles) {
            this.renderTilesCanvas(this.currentMapData);
        }
    }
    
    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    setupCanvasTransform() {
        this.ctx.save();
        this.ctx.translate(this.viewerPanX, this.viewerPanY);
        this.ctx.scale(this.viewerZoom, this.viewerZoom);
    }
    
    // Load and cache sprite sheet
    async loadSpriteSheet(tilesetName) {
        if (this.spriteSheets.has(tilesetName)) {
            return this.spriteSheets.get(tilesetName);
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.spriteSheets.set(tilesetName, img);
                console.log(`Canvas: Loaded sprite sheet ${tilesetName}`);
                resolve(img);
            };
            img.onerror = () => {
                // Try original case if lowercase failed
                const imgFallback = new Image();
                imgFallback.onload = () => {
                    this.spriteSheets.set(tilesetName, imgFallback);
                    console.log(`Canvas: Loaded sprite sheet ${tilesetName} (fallback)`);
                    resolve(imgFallback);
                };
                imgFallback.onerror = () => {
                    console.error(`Canvas: Failed to load sprite sheet ${tilesetName}`);
                    reject(new Error(`Failed to load ${tilesetName}.png`));
                };
                imgFallback.src = `assets/${tilesetName}.png`;
            };
            // Try lowercase first
            img.src = `assets/${tilesetName.toLowerCase()}.png`;
        });
    }
    
    // Load and cache tileset configuration
    async loadTilesetConfig(tilesetName, networkTilesetConfig = null) {
        if (this.tilesetConfigs.has(tilesetName)) {
            return this.tilesetConfigs.get(tilesetName);
        }
        
        // If network config is provided, use it first
        if (networkTilesetConfig) {
            console.log(`PlayerMapViewer: Using network-transmitted tileset config for ${tilesetName}`);
            this.tilesetConfigs.set(tilesetName, networkTilesetConfig);
            return networkTilesetConfig;
        }
        
        // Fallback to local loading (smart fallback for case sensitivity)
        try {
            // Try lowercase first (like default.json)
            let response = await fetch(`assets/${tilesetName.toLowerCase()}.json`);
            if (!response.ok) {
                // Try original case (like Gothic.json)
                response = await fetch(`assets/${tilesetName}.json`);
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const config = await response.json();
            this.tilesetConfigs.set(tilesetName, config);
            console.log(`PlayerMapViewer: Loaded tileset config ${tilesetName} (local fallback)`);
            return config;
        } catch (error) {
            console.error(`PlayerMapViewer: Failed to load tileset config ${tilesetName}:`, error);
            throw error;
        }
    }
    
    // Main render method - stores data and triggers canvas rendering
    renderMap(mapData) {
        console.log('PlayerMapViewerCanvas: Rendering map with canvas', mapData);
        this.currentMapData = mapData;
        
        // Trigger canvas rendering
        this.renderCurrentMap();
    }
    
    // Canvas-based sprite rendering for new format (v1.2)
    async renderSpritesCanvas(mapData) {
        const { width, height, spriteNames, tileset, backgroundColors, tilesetConfig } = mapData;
        console.log(`PlayerMapViewer: Rendering ${width}x${height} sprites with tileset: ${tileset}`);
        
        const tilesetName = tileset || 'default'; // Respect user's naming convention
        
        try {
            // Load both sprite sheet and config (use network config if available)
            const [spriteSheet, tilesetConfigData] = await Promise.all([
                this.loadSpriteSheet(tilesetName),
                this.loadTilesetConfig(tilesetName, tilesetConfig)
            ]);
            
            // Render each tile
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tileIndex = y * width + x;
                    const spriteName = spriteNames[tileIndex];
                    
                    if (spriteName) {
                        this.renderTileCanvas(x, y, spriteName, spriteSheet, tilesetConfigData, backgroundColors);
                    } else {
                        // Empty tile - just background color
                        this.ctx.fillStyle = '#f9f9f9';
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            }
            
            this.ctx.restore(); // Restore transform
            console.log('PlayerMapViewer: Finished rendering sprites with network config');
            
        } catch (error) {
            console.error('PlayerMapViewer: Error rendering sprites:', error);
            this.renderFallbackGrid(width, height, spriteNames);
        }
    }
    
    // Canvas-based tile rendering for legacy format
    async renderTilesCanvas(mapData) {
        const { width, height, tiles, tileset, tilesetConfig } = mapData;
        console.log(`PlayerMapViewer: Rendering ${width}x${height} tiles with tileset: ${tileset}`);
        
        const tilesetName = tileset || 'default'; // Respect user's naming convention
        
        try {
            const [spriteSheet, tilesetConfigData] = await Promise.all([
                this.loadSpriteSheet(tilesetName),
                this.loadTilesetConfig(tilesetName, tilesetConfig)
            ]);
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tileIndex = y * width + x;
                    const gid = tiles[tileIndex];
                    
                    if (gid > 0) {
                        const spriteName = this.numberToSprite(gid);
                        if (spriteName) {
                            this.renderTileCanvas(x, y, spriteName, spriteSheet, tilesetConfigData);
                        }
                    } else {
                        // Empty tile
                        this.ctx.fillStyle = '#f9f9f9';
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            }
            
            this.ctx.restore();
            console.log('PlayerMapViewer: Finished rendering tiles with network config');
            
        } catch (error) {
            console.error('PlayerMapViewer: Error rendering tiles:', error);
            this.renderFallbackGrid(width, height, tiles.map(gid => this.numberToSprite(gid)));
        }
    }
    
    // Core tile rendering method
    renderTileCanvas(x, y, spriteName, spriteSheet, tilesetConfig, backgroundColors = null) {
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;
        
        // Draw background color first (v1.2 format support)
        if (backgroundColors && backgroundColors[spriteName]) {
            this.ctx.fillStyle = backgroundColors[spriteName];
            this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
        } else if (tilesetConfig.backgroundColors && tilesetConfig.backgroundColors[spriteName]) {
            // Fallback to tileset config colors
            this.ctx.fillStyle = tilesetConfig.backgroundColors[spriteName];
            this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
        } else {
            // Default background
            this.ctx.fillStyle = '#f9f9f9';
            this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
        }
        
        // Get sprite position in the sprite sheet (4x4 grid)
        const spritePos = this.getSpritePosition(spriteName);
        if (spritePos) {
            const spriteSize = spriteSheet.width / 4; // Assuming 4x4 grid
            
            // Draw sprite from sprite sheet
            this.ctx.drawImage(
                spriteSheet,
                spritePos.x * spriteSize, spritePos.y * spriteSize, spriteSize, spriteSize, // Source
                tileX, tileY, this.tileSize, this.tileSize // Destination
            );
        }
        
        // Optional: Draw border for debugging
        // if (window.showDebug) {
        //     this.ctx.strokeStyle = '#ddd';
        //     this.ctx.lineWidth = 1;
        //     this.ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
        // }
    }
    
    // Get sprite position in 4x4 grid (same as CSS positioning)
    getSpritePosition(spriteName) {
        const spritePositions = {
            'mountain': { x: 0, y: 0 },     // Row 1, Col 1
            'water': { x: 1, y: 0 },        // Row 1, Col 2  
            'grass': { x: 2, y: 0 },        // Row 1, Col 3
            'rock': { x: 3, y: 0 },         // Row 1, Col 4
            'castle': { x: 0, y: 1 },       // Row 2, Col 1
            'house': { x: 1, y: 1 },        // Row 2, Col 2
            'shop': { x: 2, y: 1 },         // Row 2, Col 3
            'temple': { x: 3, y: 1 },       // Row 2, Col 4
            'dragon': { x: 0, y: 2 },       // Row 3, Col 1
            'sword': { x: 1, y: 2 },        // Row 3, Col 2
            'skull': { x: 2, y: 2 },        // Row 3, Col 3
            'danger': { x: 3, y: 2 },       // Row 3, Col 4
            'tower': { x: 0, y: 3 },        // Row 4, Col 1
            'road': { x: 1, y: 3 },         // Row 4, Col 2
            'door': { x: 2, y: 3 },         // Row 4, Col 3
            'fire': { x: 3, y: 3 }          // Row 4, Col 4
        };
        
        return spritePositions[spriteName] || spritePositions['mountain']; // Default fallback
    }
    
    // Fallback rendering when sprite sheets fail
    renderFallbackGrid(width, height, spriteNames) {
        console.log('Canvas: Rendering fallback colored grid');
        
        const spriteColors = {
            'mountain': '#8B4513',
            'water': '#4682B4', 
            'grass': '#228B22',
            'forest': '#006400',
            'rock': '#808080',
            'door': '#8B4513',
            'castle': '#E0E0E0',
            'house': '#FFAB40',
            'shop': '#FF7043',
            'temple': '#F5F5F5',
            'dragon': '#FF5722',
            'sword': '#CFD8DC',
            'skull': '#424242',
            'danger': '#FF9800',
            'tower': '#9E9E9E',
            'road': '#BCAAA4',
            'fire': '#FF5722',
            'default': '#DDD'
        };
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = y * width + x;
                const spriteName = spriteNames[tileIndex];
                
                if (spriteName) {
                    this.ctx.fillStyle = spriteColors[spriteName] || spriteColors.default;
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    
                    // Add text label
                    this.ctx.fillStyle = '#000';
                    this.ctx.font = '10px Arial';
                    this.ctx.fillText(spriteName.slice(0, 3), x * this.tileSize + 5, y * this.tileSize + 15);
                }
            }
        }
        
        this.ctx.restore();
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
    
    // Reset view to center
    resetView() {
        this.viewerZoom = 1;
        this.viewerPanX = 0;
        this.viewerPanY = 0;
        this.renderCurrentMap();
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
        this.renderCurrentMap();
    }
}
