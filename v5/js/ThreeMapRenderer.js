// ThreeMapRenderer.js - Clean V5 3D Map Renderer
// Replaces 2D canvas with Three.js 3D renderer in the same container
// Author: GitHub Copilot + Brad
// Date: September 12, 2025

class ThreeMapRenderer {
    constructor(containerId, mapData = null) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.mapData = null;
        
        // Three.js core objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        
        // Map rendering properties
        this.tileSize = 1.0;
        this.tileHeight = 0.2;
        this.currentTiles = [];
        
        // Sprite/Tileset handling
        this.spriteTexture = null;
        this.tilesetConfig = null;
        this.fallbackColors = {
            // Default tile colors when sprites aren't available
            'wall': 0x8B4513,
            'floor': 0xDEB887,
            'door': 0x654321,
            'water': 0x4169E1,
            'grass': 0x228B22,
            'stone': 0x708090,
            'dirt': 0x8B7355,
            'wood': 0xD2691E,
            'default': 0x666666
        };
        
        this.init();
        
        // Load initial data if provided
        if (mapData) {
            this.loadMapData(mapData);
        }
    }
    
    // Debug logging helper - checks global debug flag
    debugLog(...args) {
        if (typeof window !== 'undefined' && window.debugConsoleEnabled !== false) {
            console.log(...args);
        }
    }
    
    init() {
        if (!this.container) {
            console.error('❌ ThreeMapRenderer: Container not found:', this.containerId);
            return;
        }
        
        console.log('🎮 Initializing ThreeMapRenderer in container:', this.containerId);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);
        
        // Create camera with proper aspect ratio
        const aspect = this.container.clientWidth / this.container.clientHeight || 1;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Create WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x222222);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer canvas to container
        this.container.appendChild(this.renderer.domElement);
        
        // Set up lighting
        this.setupLighting();
        
        // Add resize handling
        this.setupResizeHandler();
        
        // Start render loop
        this.startRenderLoop();
        
        // Create demo tiles after delay if no real data is loaded
        this.demoTileTimeout = setTimeout(() => {
            if (this.currentTiles.length === 0) {
                console.log('🎮 No map data loaded yet, showing demo tiles');
                this.createDemoTiles();
            }
        }, 1000);
        
        console.log('✅ ThreeMapRenderer initialized successfully');
    }
    
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light for shadows and depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    setupResizeHandler() {
        // Modern ResizeObserver for container size changes
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    this.handleResize(width, height);
                }
            }
        });
        
        if (this.container) {
            resizeObserver.observe(this.container);
        }
        
        // Backup window resize handler
        window.addEventListener('resize', () => {
            if (this.container) {
                this.handleResize(this.container.clientWidth, this.container.clientHeight);
            }
        });
    }
    
    handleResize(width, height) {
        if (!this.renderer || !this.camera) return;
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
    
    // Main method to load new map data from transmission
    loadMapData(mapData) {
        console.log('🗺️ ThreeMapRenderer.loadMapData called with:', mapData);
        console.log('🔍 Map data details:', {
            hasWidth: !!mapData.width,
            width: mapData.width,
            hasHeight: !!mapData.height, 
            height: mapData.height,
            hasSpriteNames: !!mapData.spriteNames,
            spriteNamesLength: mapData.spriteNames?.length,
            hasTileset: !!mapData.tileset,
            tileset: mapData.tileset,
            hasTilesetConfig: !!mapData.tilesetConfig,
            hasGrid: !!mapData.grid
        });
        
        if (!mapData) {
            console.warn('⚠️ No map data provided to ThreeMapRenderer');
            return;
        }
        
        this.mapData = mapData;
        
        // Cancel demo tile timeout if real data arrives
        if (this.demoTileTimeout) {
            clearTimeout(this.demoTileTimeout);
            this.demoTileTimeout = null;
            console.log('🚫 Demo tile timeout cancelled - real map data received');
        }
        
        // Clear existing tiles
        this.clearTiles();
        
        // Extract grid from map data
        const grid = this.extractGrid(mapData);
        console.log('🔍 Extracted grid size:', grid.length, 'x', grid[0]?.length || 0);
        console.log('🔍 First few grid items:', grid.slice(0, 3).map(row => row.slice(0, 3)));
        
        if (!grid || grid.length === 0) {
            console.warn('⚠️ No valid grid data found, will show demo tiles');
            return;
        }
        
        // Load tileset configuration if available
        this.tilesetConfig = mapData.tilesetConfig || null;
        console.log('🎨 Tileset config:', this.tilesetConfig);
        
        // Update background color if specified
        if (mapData.bgColor) {
            const bgColor = new THREE.Color(mapData.bgColor);
            this.scene.background = bgColor;
            this.renderer.setClearColor(bgColor);
            console.log('🎨 Background color set to:', mapData.bgColor);
        }
        
        // Determine sprite sheet path from tileset name
        let spriteSheetPath = null;
        if (mapData.tileset) {
            // Handle "Default" vs "default" and construct path
            const tilesetName = mapData.tileset.toLowerCase().replace(/\s+/g, '');
            spriteSheetPath = `assets/${tilesetName}.png`;
            console.log('🔄 Tileset path construction:');
            console.log('  - Original tileset:', mapData.tileset);
            console.log('  - Normalized name:', tilesetName);
            console.log('  - Final path:', spriteSheetPath);
        } else if (this.tilesetConfig && this.tilesetConfig.spriteSheetPath) {
            spriteSheetPath = this.tilesetConfig.spriteSheetPath;
            console.log('🔄 Using sprite path from config:', spriteSheetPath);
        }
        
        // Load sprite texture if we have a path
        if (spriteSheetPath) {
            console.log('🔄 Loading sprite texture from:', spriteSheetPath);
            this.loadSpriteTexture(spriteSheetPath)
                .then(() => {
                    console.log('✅ Sprite texture loaded, rendering grid');
                    this.renderGrid(grid);
                })
                .catch((error) => {
                    console.warn('⚠️ Failed to load sprite texture, using colors:', error);
                    this.renderGrid(grid);
                });
        } else {
            // Render without sprites using colors only
            console.log('🎨 No sprite texture, rendering with colors only');
            this.renderGrid(grid);
        }
    }
    
    extractGrid(mapData) {
        this.debugLog('🔍 Extracting grid from map data:', {
            hasGrid: !!mapData.grid,
            gridType: Array.isArray(mapData.grid) ? 'Array' : typeof mapData.grid,
            hasSpriteNames: !!mapData.spriteNames,
            spriteNamesLength: mapData.spriteNames?.length,
            width: mapData.width,
            height: mapData.height
        });
        
        // Handle different map data formats from transmission
        if (mapData.grid && Array.isArray(mapData.grid)) {
            this.debugLog('✅ Using existing 2D grid array');
            return mapData.grid;
        }
        
        if (mapData.spriteNames && mapData.width && mapData.height) {
            this.debugLog('🔄 Converting flat spriteNames array to 2D grid');
            // Convert flat spriteNames array to 2D grid
            const grid = [];
            let index = 0;
            
            for (let y = 0; y < mapData.height; y++) {
                const row = [];
                for (let x = 0; x < mapData.width; x++) {
                    row.push(mapData.spriteNames[index] || 'default');
                    index++;
                }
                grid.push(row);
            }
            this.debugLog('✅ Grid conversion complete:', grid.length, 'rows');
            return grid;
        }
        
        console.warn('⚠️ No valid grid data found in map data');
        return [];
    }
    
    loadSpriteTexture(spritePath) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            
                    // Try the original path first
            console.log('🔍 Attempting to load sprite texture:', spritePath);
            
            loader.load(
                spritePath,
                (texture) => {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    this.spriteTexture = texture;
                    console.log('✅ Sprite texture loaded successfully:', spritePath);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn('⚠️ Failed to load sprite texture from:', spritePath, error);                    // Generate case-insensitive fallback paths
                    const fallbackPaths = this.generateFallbackPaths(spritePath);
                    
                    this.tryFallbackTextures(loader, fallbackPaths, 0, resolve, reject);
                }
            );
        });
    }
    
    generateFallbackPaths(originalPath) {
        const fallbackPaths = [];
        
        // Extract base name and extension
        const pathParts = originalPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const baseName = fileName.replace(/\.(png|jpg|jpeg)$/i, '');
        const extension = fileName.match(/\.(png|jpg|jpeg)$/i)?.[0] || '.png';
        
        // Create variations for common sprite names
        const variations = [
            // Case variations for the base name
            baseName.toLowerCase(),     // gothic
            baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase(), // Gothic
            baseName.toUpperCase(),     // GOTHIC
            
            // Common fallbacks
            'Gothic',
            'gothic', 
            'GOTHIC',
            'default',
            'Default',
            'DEFAULT'
        ];
        
        // Generate full paths for each variation
        variations.forEach(variation => {
            if (variation !== baseName) { // Don't duplicate the original
                fallbackPaths.push(`./assets/${variation}${extension}`);
            }
        });
        
        // Add some specific known good assets
        const knownAssets = [
            './assets/Gothic.png',
            './assets/default.png',
            './assets/NewSet.png',
            './assets/forest.png'
        ];
        
        knownAssets.forEach(asset => {
            if (!fallbackPaths.includes(asset)) {
                fallbackPaths.push(asset);
            }
        });
        
        console.log('🔄 Generated fallback paths:', fallbackPaths);
        return fallbackPaths;
    }
    
    tryFallbackTextures(loader, fallbackPaths, index, resolve, reject) {
        if (index >= fallbackPaths.length) {
            console.error('❌ All sprite texture fallbacks failed');
            reject(new Error('All sprite texture paths failed'));
            return;
        }
        
        const currentPath = fallbackPaths[index];
        console.log('🔄 Trying fallback texture:', currentPath);
        
        loader.load(
            currentPath,
            (texture) => {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                this.spriteTexture = texture;
                console.log('✅ Fallback sprite texture loaded:', currentPath);
                resolve(texture);
            },
            undefined,
            (error) => {
                console.warn('⚠️ Fallback failed:', currentPath);
                this.tryFallbackTextures(loader, fallbackPaths, index + 1, resolve, reject);
            }
        );
    }
    
    clearTiles() {
        // Remove existing tile meshes from scene and dispose resources
        this.currentTiles.forEach(tile => {
            this.scene.remove(tile);
            if (tile.geometry) tile.geometry.dispose();
            if (tile.material) {
                if (tile.material.map) tile.material.map.dispose();
                tile.material.dispose();
            }
        });
        this.currentTiles = [];
    }
    
    renderGrid(grid) {
        console.log('🎨 Rendering grid:', grid.length, 'x', grid[0]?.length || 0);
        
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        
        if (rows === 0 || cols === 0) {
            console.warn('⚠️ Empty grid, creating demo tiles');
            this.createDemoTiles();
            return;
        }
        
        // Center the grid in the scene
        const offsetX = -(cols * this.tileSize) / 2;
        const offsetZ = -(rows * this.tileSize) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileData = grid[row][col];
                if (tileData) {
                    const tileMesh = this.createTileMesh(tileData, col, row);
                    if (tileMesh) {
                        tileMesh.position.set(
                            offsetX + col * this.tileSize,
                            0,
                            offsetZ + row * this.tileSize
                        );
                        this.scene.add(tileMesh);
                        this.currentTiles.push(tileMesh);
                    }
                }
            }
        }
        
        console.log('✅ Rendered', this.currentTiles.length, 'tiles');
        
        // Adjust camera to view the entire grid
        this.centerCameraOnGrid(cols, rows);
    }
    
    createDemoTiles() {
        console.log('🎮 Creating demo tiles for testing');
        
        // Create a simple 3x3 demo grid
        const demoGrid = [
            ['mountain', 'grass', 'water'],
            ['grass', 'mountain', 'grass'],
            ['water', 'grass', 'mountain']
        ];
        
        const rows = 3;
        const cols = 3;
        const offsetX = -(cols * this.tileSize) / 2;
        const offsetZ = -(rows * this.tileSize) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileName = demoGrid[row][col];
                const tileMesh = this.createTileMesh(tileName, col, row);
                if (tileMesh) {
                    tileMesh.position.set(
                        offsetX + col * this.tileSize,
                        0,
                        offsetZ + row * this.tileSize
                    );
                    this.scene.add(tileMesh);
                    this.currentTiles.push(tileMesh);
                }
            }
        }
        
        console.log('✅ Created', this.currentTiles.length, 'demo tiles');
        this.centerCameraOnGrid(cols, rows);
    }
    
    createTileMesh(tileData, col, row) {
        const geometry = new THREE.BoxGeometry(this.tileSize, this.tileHeight, this.tileSize);
        let material;
        
        // Get tile name/type from data
        const tileName = typeof tileData === 'string' ? tileData : (tileData.name || 'default');
        
        // Look for sprite data in tileset config
        let spriteData = null;
        if (this.spriteTexture && this.tilesetConfig && this.tilesetConfig.sprites) {
            if (Array.isArray(this.tilesetConfig.sprites)) {
                // Handle array format: find sprite by id
                spriteData = this.tilesetConfig.sprites.find(sprite => sprite.id === tileName);
            } else {
                // Handle object format: direct access
                spriteData = this.tilesetConfig.sprites[tileName];
            }
        }
        
        if (spriteData) {
            // Use sprite texture from tileset
            console.log('🎨 Creating sprite material for:', tileName, 'at position:', spriteData.position);
            material = this.createSpriteMaterial(spriteData);
        } else {
            // Use solid color fallback
            const color = this.getTileColor(tileName);
            console.log('🎨 Using color fallback for:', tileName, 'color:', color.toString(16));
            material = new THREE.MeshLambertMaterial({ color });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }
    
    createSpriteMaterial(spriteData) {
        const texture = this.spriteTexture.clone();
        texture.needsUpdate = true;
        
        // Handle position array format: [x, y] grid coordinates
        const gridX = spriteData.position[0];
        const gridY = spriteData.position[1];
        
        // Get sprite sheet dimensions from tileset config
        const spriteSize = this.tilesetConfig.spriteSize || 64; // Size of each sprite in pixels
        const gridSize = this.tilesetConfig.gridSize || "4x4"; // Grid dimensions
        const [gridCols, gridRows] = gridSize.split('x').map(Number);
        
        // Calculate sheet dimensions
        const sheetWidth = gridCols * spriteSize;
        const sheetHeight = gridRows * spriteSize;
        
        // Calculate UV coordinates
        const u = gridX / gridCols;
        const v = gridY / gridRows;
        const uSize = 1 / gridCols;
        const vSize = 1 / gridRows;
        
        // Set texture repeat and offset for sprite
        texture.repeat.set(uSize, vSize);
        texture.offset.set(u, 1 - v - vSize); // Flip Y coordinate for WebGL
        
        console.log('🎨 Sprite UV mapping:', {
            gridPos: [gridX, gridY],
            gridSize: `${gridCols}x${gridRows}`,
            uv: [u, v],
            size: [uSize, vSize]
        });
        
        return new THREE.MeshLambertMaterial({ map: texture });
    }
    
    getTileColor(tileName) {
        // Check transmitted background colors from tileset config
        if (this.tilesetConfig && this.tilesetConfig.backgroundColors && this.tilesetConfig.backgroundColors[tileName]) {
            const colorHex = this.tilesetConfig.backgroundColors[tileName];
            console.log('🎨 Using tileset background color for', tileName, ':', colorHex);
            return new THREE.Color(colorHex);
        }
        
        // Check if we have transmitted background colors in map data
        if (this.mapData && this.mapData.backgroundColors && this.mapData.backgroundColors[tileName]) {
            const colorHex = this.mapData.backgroundColors[tileName];
            console.log('🎨 Using map background color for', tileName, ':', colorHex);
            return new THREE.Color(colorHex);
        }
        
        // Use fallback colors
        const fallbackColor = this.fallbackColors[tileName] || this.fallbackColors.default;
        console.log('🎨 Using fallback color for', tileName, ':', fallbackColor.toString(16));
        return new THREE.Color(fallbackColor);
    }
    
    centerCameraOnGrid(cols, rows) {
        // Position camera to view the entire grid nicely
        const maxDimension = Math.max(cols, rows);
        const distance = maxDimension * this.tileSize * 1.5;
        
        this.camera.position.set(distance * 0.7, distance, distance * 0.7);
        this.camera.lookAt(0, 0, 0);
    }
    
    // Public method to update with new map data
    updateMapData(newMapData) {
        this.loadMapData(newMapData);
    }
    
    // Cleanup method for proper disposal
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.clearTiles();
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        if (this.spriteTexture) {
            this.spriteTexture.dispose();
        }
        
        console.log('🧹 ThreeMapRenderer cleaned up');
    }
}

// Export for global use
window.ThreeMapRenderer = ThreeMapRenderer;