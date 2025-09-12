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
        this.player = null;  // Player object that contains camera
        this.renderer = null;
        this.animationId = null;
        
        // Map rendering properties
        this.tileSize = 1.0;
        this.tileHeight = 0.2;
        this.currentTiles = [];
        
        // Player and camera system
        this.playerPosition = { x: 0, y: 0 };
        this.cameraHeight = 1.8; // Reduced from 2.0 for better scale (like dungeon game)
        this.isFirstPerson = true;
        
        // Time tracking for FPS-independent movement
        this.prevTime = performance.now();
        this.velocity = { x: 0, z: 0 };
        
        this.cameraControls = {
            moveSpeed: 8.0, // Base movement speed (similar to dungeon game)
            rotateSpeed: 0.002,
            keys: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                turnLeft: false,
                turnRight: false
            }
        };
        
        // Touch and mobile controls
        this.virtualStick = null;
        this.touchStartPos = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
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
        
        // Create player object (container for camera)
        this.player = new THREE.Object3D();
        this.player.position.set(0, this.cameraHeight, 0);
        this.scene.add(this.player);
        
        // Create camera as child of player
        const aspect = this.container.clientWidth / this.container.clientHeight || 1;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 0); // Relative to player
        this.player.add(this.camera);
        
        // Set initial player position
        this.updatePlayerFromPosition();
        
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
        
        // Set up controls
        this.setupControls();
        
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
            
            // Calculate delta time for FPS-independent movement
            const time = performance.now();
            const delta = (time - this.prevTime) / 1000;
            this.prevTime = time;
            
            // Update systems with delta time
            this.updateCameraMovement(delta);
            this.updateBillboards();
            this.updateBillboardScaling();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
    
    // ========================================
    // CAMERA AND PLAYER POSITION SYSTEM  
    // ========================================
    
    // Update player position based on grid coordinates (first-person POV)
    updatePlayerFromPosition() {
        if (!this.player) return;
        
        // Convert grid position to world position
        const worldX = this.playerPosition.x * this.tileSize;
        const worldZ = this.playerPosition.y * this.tileSize;
        
        // Set player position (camera follows as child)
        this.player.position.set(worldX, this.cameraHeight, worldZ);
        
        this.debugLog('� Player updated to position:', {
            player: this.playerPosition,
            world: { x: worldX, z: worldZ },
            playerObj: this.player.position
        });
    }
    
    // Set player position and update world position
    setPlayerPosition(x, y) {
        this.playerPosition = { x, y };
        this.updatePlayerFromPosition();
        this.debugLog('� Player position set to:', this.playerPosition);
    }
    
    // Get current player position from global system
    updatePlayerPositionFromGlobal() {
        try {
            // Try to get position from global MapSyncAdapter
            if (window.globalMapSyncAdapter && typeof window.globalMapSyncAdapter.getCurrentPosition === 'function') {
                const pos = window.globalMapSyncAdapter.getCurrentPosition();
                if (pos) {
                    this.setPlayerPosition(pos.x, pos.y);
                    return true;
                }
            }
            
            // Fallback to other global position sources if available
            if (window.currentPlayerPosition) {
                this.setPlayerPosition(window.currentPlayerPosition.x, window.currentPlayerPosition.y);
                return true;
            }
        } catch (error) {
            this.debugLog('⚠️ Could not get player position from global system:', error);
        }
        
        return false;
    }
    
    // Update player movement with delta time (FPS independent)
    updateCameraMovement(delta) {
        if (!this.isFirstPerson || !this.player) return;
        
        const controls = this.cameraControls;
        
        // Apply velocity damping (like dungeon game)
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        
        // Calculate movement direction
        let direction = { x: 0, z: 0 };
        
        if (controls.keys.forward) direction.z -= 1;
        if (controls.keys.backward) direction.z += 1;
        if (controls.keys.left) direction.x -= 1;
        if (controls.keys.right) direction.x += 1;
        
        // Normalize diagonal movement
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        // Apply movement to velocity
        const speed = controls.moveSpeed;
        if (direction.z !== 0) this.velocity.z += direction.z * speed * delta;
        if (direction.x !== 0) this.velocity.x += direction.x * speed * delta;
        
        // Store old position for collision detection
        const oldPosition = this.player.position.clone();
        
        // Apply movement (relative to player rotation)
        this.player.translateX(this.velocity.x * delta);
        this.player.translateZ(this.velocity.z * delta);
        
        // Handle rotation
        if (controls.keys.turnLeft) {
            this.player.rotation.y += controls.rotateSpeed * 50 * delta; // Scale for smooth rotation
        }
        if (controls.keys.turnRight) {
            this.player.rotation.y -= controls.rotateSpeed * 50 * delta;
        }
        
        // Keep player at proper height (in case of any drift)
        this.player.position.y = this.cameraHeight;
        
        // TODO: Add collision detection here if needed
        // For now, basic bounds checking could be added
    }
    
    // Setup all control systems
    setupControls() {
        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupTouchControls();
        
        if (this.isMobile) {
            this.createVirtualStick();
        }
    }
    
    // Setup keyboard controls
    setupKeyboardControls() {
        const controls = this.cameraControls;
        
        const keyMap = {
            'KeyW': 'forward',
            'KeyS': 'backward', 
            'KeyA': 'left',
            'KeyD': 'right',
            'ArrowUp': 'forward',
            'ArrowDown': 'backward',
            'ArrowLeft': 'turnLeft',
            'ArrowRight': 'turnRight',
            'KeyQ': 'turnLeft',
            'KeyE': 'turnRight'
        };
        
        window.addEventListener('keydown', (event) => {
            if (keyMap[event.code] && !event.repeat) {
                controls.keys[keyMap[event.code]] = true;
                event.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            if (keyMap[event.code]) {
                controls.keys[keyMap[event.code]] = false;
                event.preventDefault();
            }
        });
        
        this.debugLog('⌨️ Keyboard controls setup');
    }
    
    // Setup mouse controls for camera rotation
    setupMouseControls() {
        let isMouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left click
                isMouseDown = true;
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
                this.renderer.domElement.style.cursor = 'grabbing';
                event.preventDefault();
            } else if (event.button === 2) { // Right click for minimap drag
                this.handleRightClickDrag(event);
            }
        });
        
        window.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - lastMouseX;
                const deltaY = event.clientY - lastMouseY;
                
                // Rotate player (Y-axis) and camera (X-axis) based on mouse movement
                this.player.rotation.y -= deltaX * 0.003;
                this.camera.rotation.x -= deltaY * 0.003;
                
                // Clamp vertical rotation to prevent flipping
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
                
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
            }
        });
        
        window.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                isMouseDown = false;
                this.renderer.domElement.style.cursor = 'grab';
            }
        });
        
        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        this.renderer.domElement.style.cursor = 'grab';
        this.debugLog('🖱️ Mouse controls setup');
    }
    
    // Handle right-click drag for minimap movement
    handleRightClickDrag(event) {
        console.log('🖱️ Right-click detected on 3D renderer - initiating minimap drag mode');
        
        let isRightDragging = false;
        let lastRightX = event.clientX;
        let lastRightY = event.clientY;
        
        // Try to find the minimap canvas to manipulate
        const minimapCanvas = this.findMinimapCanvas();
        
        if (!minimapCanvas) {
            console.warn('⚠️ No minimap canvas found for right-click drag');
            return;
        }
        
        console.log('🎯 Found minimap canvas:', minimapCanvas.id || minimapCanvas.className);
        
        const handleRightDrag = (moveEvent) => {
            if (!isRightDragging) return;
            
            const deltaX = moveEvent.clientX - lastRightX;
            const deltaY = moveEvent.clientY - lastRightY;
            
            // Apply movement to the minimap canvas
            this.moveMinimapCanvas(minimapCanvas, deltaX, deltaY);
            
            lastRightX = moveEvent.clientX;
            lastRightY = moveEvent.clientY;
            moveEvent.preventDefault();
        };
        
        const stopRightDrag = () => {
            isRightDragging = false;
            window.removeEventListener('mousemove', handleRightDrag);
            window.removeEventListener('mouseup', stopRightDrag);
            console.log('🖱️ Right-click drag ended');
        };
        
        isRightDragging = true;
        window.addEventListener('mousemove', handleRightDrag);
        window.addEventListener('mouseup', stopRightDrag);
        
        event.preventDefault();
    }
    
    // Find the minimap canvas element
    findMinimapCanvas() {
        // Try multiple methods to find the canvas
        const candidates = [
            // Direct access through global adapter
            () => {
                try {
                    return window.globalMapSyncAdapter?.mapClientManager?.mapViewer?.canvas;
                } catch (e) {
                    return null;
                }
            },
            // Search by common canvas IDs
            () => document.getElementById('player-map-canvas'),
            () => document.getElementById('map-viewer-canvas'),
            () => document.getElementById('minimap-canvas'),
            // Search by class name
            () => document.querySelector('.map-viewer-canvas canvas'),
            () => document.querySelector('.map-canvas'),
            // Search all canvases and find the likely minimap
            () => {
                const canvases = document.querySelectorAll('canvas');
                for (const canvas of canvases) {
                    // Skip the 3D renderer canvas
                    if (canvas === this.renderer.domElement) continue;
                    
                    // Look for smaller canvases that might be minimaps
                    const rect = canvas.getBoundingClientRect();
                    if (rect.width < window.innerWidth * 0.8 && rect.height < window.innerHeight * 0.8) {
                        return canvas;
                    }
                }
                return null;
            }
        ];
        
        for (const candidate of candidates) {
            const canvas = typeof candidate === 'function' ? candidate() : candidate;
            if (canvas && canvas.tagName === 'CANVAS') {
                return canvas;
            }
        }
        
        return null;
    }
    
    // Move the minimap canvas position
    moveMinimapCanvas(canvas, deltaX, deltaY) {
        // Get current transform
        const computedStyle = getComputedStyle(canvas);
        const currentTransform = computedStyle.transform;
        
        let translateX = 0;
        let translateY = 0;
        let scale = 1;
        
        // Parse existing transform
        if (currentTransform && currentTransform !== 'none') {
            const matrixMatch = currentTransform.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
                const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
                translateX = values[4] || 0;
                translateY = values[5] || 0;
                scale = values[0] || 1;
            }
        }
        
        // Apply delta movement
        translateX += deltaX;
        translateY += deltaY;
        
        // Apply new transform
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        
        console.log('🎯 Moved minimap canvas:', { deltaX, deltaY, newX: translateX, newY: translateY });
        
        // Also try to update any associated player position if available
        this.updatePlayerPositionFromCanvasMovement(deltaX, deltaY);
    }
    
    // Update player position based on canvas movement (optional)
    updatePlayerPositionFromCanvasMovement(deltaX, deltaY) {
        // This could convert canvas pixel movement to grid movement
        // and update the global player position system
        try {
            if (window.globalMapSyncAdapter && typeof window.globalMapSyncAdapter.moveRelative === 'function') {
                // Convert pixel delta to grid delta (rough approximation)
                const gridDeltaX = Math.round(deltaX / 32); // Assuming ~32px per grid cell
                const gridDeltaY = Math.round(deltaY / 32);
                
                if (gridDeltaX !== 0 || gridDeltaY !== 0) {
                    window.globalMapSyncAdapter.moveRelative(gridDeltaX, gridDeltaY)
                        .then(result => {
                            if (result.success) {
                                console.log('🎯 Updated player position via canvas movement');
                            }
                        })
                        .catch(error => {
                            // Ignore errors - player movement might not be enabled
                        });
                }
            }
        } catch (error) {
            // Ignore errors in player position updating
        }
    }
    
    // Setup touch controls for mobile devices
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchRotating = false;
        
        this.renderer.domElement.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                isTouchRotating = true;
                event.preventDefault();
            }
        });
        
        this.renderer.domElement.addEventListener('touchmove', (event) => {
            if (isTouchRotating && event.touches.length === 1) {
                const deltaX = event.touches[0].clientX - touchStartX;
                const deltaY = event.touches[0].clientY - touchStartY;
                
                // Rotate camera based on touch movement
                this.camera.rotateY(-deltaX * 0.005);
                this.camera.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -deltaY * 0.005);
                
                // Clamp vertical rotation
                const rotation = this.camera.rotation;
                rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));
                
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                event.preventDefault();
            }
        });
        
        this.renderer.domElement.addEventListener('touchend', (event) => {
            isTouchRotating = false;
        });
        
        this.debugLog('📱 Touch controls setup');
    }
    
    // Create virtual thumbstick for mobile
    createVirtualStick() {
        const stickContainer = document.createElement('div');
        stickContainer.id = 'virtual-stick-container';
        stickContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            touch-action: none;
            user-select: none;
            z-index: 1000;
        `;
        
        const stick = document.createElement('div');
        stick.id = 'virtual-stick';
        stick.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
        `;
        
        stickContainer.appendChild(stick);
        this.container.appendChild(stickContainer);
        
        let isDragging = false;
        let centerX = 60; // Half of container width
        let centerY = 60; // Half of container height
        
        const updateStickPosition = (clientX, clientY) => {
            const rect = stickContainer.getBoundingClientRect();
            const x = clientX - rect.left - centerX;
            const y = clientY - rect.top - centerY;
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 40; // Max stick movement
            
            let finalX = x;
            let finalY = y;
            
            if (distance > maxDistance) {
                finalX = (x / distance) * maxDistance;
                finalY = (y / distance) * maxDistance;
            }
            
            stick.style.transform = `translate(${finalX - 20}px, ${finalY - 20}px)`;
            
            // Convert to movement input
            const normalizedX = finalX / maxDistance;
            const normalizedY = finalY / maxDistance;
            
            // Update movement controls based on stick position
            const threshold = 0.3;
            const controls = this.cameraControls;
            
            controls.keys.forward = normalizedY < -threshold;
            controls.keys.backward = normalizedY > threshold;
            controls.keys.left = normalizedX < -threshold;
            controls.keys.right = normalizedX > threshold;
            
            return { x: normalizedX, y: normalizedY };
        };
        
        const resetStick = () => {
            stick.style.transform = 'translate(-50%, -50%)';
            const controls = this.cameraControls;
            controls.keys.forward = false;
            controls.keys.backward = false;
            controls.keys.left = false;
            controls.keys.right = false;
        };
        
        // Touch events for virtual stick
        stickContainer.addEventListener('touchstart', (event) => {
            isDragging = true;
            updateStickPosition(event.touches[0].clientX, event.touches[0].clientY);
            event.preventDefault();
        });
        
        stickContainer.addEventListener('touchmove', (event) => {
            if (isDragging) {
                updateStickPosition(event.touches[0].clientX, event.touches[0].clientY);
                event.preventDefault();
            }
        });
        
        stickContainer.addEventListener('touchend', (event) => {
            isDragging = false;
            resetStick();
            event.preventDefault();
        });
        
        // Mouse events for desktop testing
        stickContainer.addEventListener('mousedown', (event) => {
            isDragging = true;
            updateStickPosition(event.clientX, event.clientY);
            event.preventDefault();
        });
        
        window.addEventListener('mousemove', (event) => {
            if (isDragging) {
                updateStickPosition(event.clientX, event.clientY);
            }
        });
        
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resetStick();
            }
        });
        
        this.virtualStick = stickContainer;
        this.debugLog('🕹️ Virtual thumbstick created');
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
        
        // Clear billboards
        this.clearBillboards();
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
        
        // Initialize player position and camera for first-person view
        this.initializePlayerPosition(cols, rows);
    }
    
    // Initialize player position from global system or center of map
    initializePlayerPosition(cols, rows) {
        // Try to get current player position from global system
        const gotGlobalPosition = this.updatePlayerPositionFromGlobal();
        
        if (!gotGlobalPosition) {
            // Default to center of map if no player position found
            const centerX = Math.floor(cols / 2);
            const centerY = Math.floor(rows / 2);
            this.setPlayerPosition(centerX, centerY);
            console.log('🎯 Player position defaulted to map center:', this.playerPosition);
        } else {
            console.log('🎯 Player position loaded from global system:', this.playerPosition);
        }
        
        // Set up periodic position sync with global system
        this.setupPositionSync();
    }
    
    // Setup periodic sync with global player position system
    setupPositionSync() {
        // Update player position every 500ms from global system
        setInterval(() => {
            this.updatePlayerPositionFromGlobal();
        }, 500);
        
        this.debugLog('🔄 Position sync with global system enabled');
    }
    
    // ========================================
    // BILLBOARD SYSTEM
    // ========================================
    
    // Update all billboards to face the camera
    updateBillboards() {
        if (!this.billboards || !this.camera) return;
        
        this.billboards.forEach(billboard => {
            if (billboard.userData.isBillboard) {
                billboard.lookAt(this.camera.position);
            }
        });
    }
    
    // Update billboard scaling based on distance and type
    updateBillboardScaling() {
        if (!this.billboards || !this.camera) return;
        
        this.billboards.forEach(billboard => {
            const userData = billboard.userData;
            if (userData.isBillboard && userData.baseSize) {
                // Calculate distance from camera to billboard
                const distance = billboard.getWorldPosition(new THREE.Vector3()).distanceTo(this.camera.position);
                
                // Calculate scale based on tile type and distance
                let scale = 1.0;
                const tileName = userData.tileName;
                
                if (tileName === 'mountain' || tileName === 'town' || tileName === 'city' || tileName === 'castle') {
                    // These get bigger as you approach
                    scale = Math.max(0.5, Math.min(2.0, 2.0 - (distance * 0.2)));
                } else if (tileName === 'grass') {
                    // Grass stays small and consistent
                    scale = 0.8 + Math.random() * 0.4; // Random slight variation
                } else {
                    // Default scaling
                    scale = Math.max(0.7, Math.min(1.3, 1.3 - (distance * 0.1)));
                }
                
                billboard.scale.set(scale, scale, scale);
            }
        });
    }
    
    // Clear billboards when clearing tiles
    clearBillboards() {
        if (this.billboards) {
            this.billboards.length = 0;
        }
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
        // Get tile name/type from data
        const tileName = typeof tileData === 'string' ? tileData : (tileData.name || 'default');
        
        // Create a flat plane on the ground for the tile base
        const groundGeometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: this.getTileColor(tileName),
            transparent: true,
            opacity: 0.8
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2; // Lay flat on ground
        groundMesh.position.y = 0.01; // Slightly above ground to prevent z-fighting
        
        // Look for sprite data in tileset config for billboard
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
        
        // Create billboard sprite above the ground tile
        let billboardMesh = null;
        if (spriteData) {
            if (tileName === 'grass') {
                // Create multiple small grass sprites scattered across the tile
                billboardMesh = this.createGrassField(spriteData, tileName);
            } else {
                billboardMesh = this.createBillboardSprite(spriteData, tileName);
            }
        } else {
            // Create a simple colored billboard for tiles without sprites
            if (tileName === 'grass') {
                billboardMesh = this.createGrassField(null, tileName);
            } else {
                billboardMesh = this.createColorBillboard(tileName);
            }
        }
        
        // Create a group to hold both ground and billboard
        const tileGroup = new THREE.Group();
        tileGroup.add(groundMesh);
        if (billboardMesh) {
            tileGroup.add(billboardMesh);
        }
        
        // Store tile metadata
        tileGroup.userData = {
            tileName: tileName,
            gridPosition: { x: col, y: row },
            hasSprite: !!spriteData
        };
        
        return tileGroup;
    }
    
    // Create a billboard sprite that always faces the camera
    createBillboardSprite(spriteData, tileName) {
        // Calculate billboard size based on tile type
        const size = this.getBillboardSize(tileName);
        
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = this.createSpriteMaterial(spriteData);
        
        const billboard = new THREE.Mesh(geometry, material);
        billboard.position.y = size.height / 2; // Position at bottom edge on ground
        
        // Store reference for billboard behavior
        billboard.userData = {
            isBillboard: true,
            tileName: tileName,
            baseSize: size
        };
        
        // Add to billboards array for camera-facing updates
        if (!this.billboards) {
            this.billboards = [];
        }
        this.billboards.push(billboard);
        
        return billboard;
    }
    
    // Create a simple colored billboard for tiles without sprites
    createColorBillboard(tileName) {
        const size = this.getBillboardSize(tileName);
        
        // Only create billboards for certain tile types
        if (tileName === 'grass' || tileName === 'floor') {
            return null; // These stay as ground tiles only
        }
        
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getTileColor(tileName),
            transparent: true,
            opacity: 0.7
        });
        
        const billboard = new THREE.Mesh(geometry, material);
        billboard.position.y = size.height / 2;
        
        billboard.userData = {
            isBillboard: true,
            tileName: tileName,
            baseSize: size
        };
        
        if (!this.billboards) {
            this.billboards = [];
        }
        this.billboards.push(billboard);
        
        return billboard;
    }
    
    // Get billboard size based on tile type
    getBillboardSize(tileName) {
        const sizeMap = {
            'mountain': { width: 1.2, height: 1.5 },
            'tree': { width: 0.8, height: 1.2 },
            'wall': { width: 1.0, height: 1.0 },
            'door': { width: 1.0, height: 1.2 },
            'town': { width: 1.5, height: 1.8 },
            'city': { width: 2.0, height: 2.5 },
            'castle': { width: 2.5, height: 3.0 },
            'grass': { width: 0.3, height: 0.3 }, // Small grass sprites
            'default': { width: 0.8, height: 1.0 }
        };
        
        return sizeMap[tileName] || sizeMap['default'];
    }
    
    // Create multiple grass sprites scattered across a tile
    createGrassField(spriteData, tileName) {
        const grassGroup = new THREE.Group();
        const grassCount = 3 + Math.floor(Math.random() * 4); // 3-6 grass sprites per tile
        const size = this.getBillboardSize(tileName);
        
        for (let i = 0; i < grassCount; i++) {
            // Random position within the tile bounds
            const randomX = (Math.random() - 0.5) * this.tileSize * 0.8;
            const randomZ = (Math.random() - 0.5) * this.tileSize * 0.8;
            
            // Random size variation
            const sizeVariation = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x size
            const grassWidth = size.width * sizeVariation;
            const grassHeight = size.height * sizeVariation;
            
            const geometry = new THREE.PlaneGeometry(grassWidth, grassHeight);
            let material;
            
            if (spriteData) {
                material = this.createSpriteMaterial(spriteData);
            } else {
                material = new THREE.MeshLambertMaterial({ 
                    color: this.getTileColor(tileName),
                    transparent: true,
                    opacity: 0.8
                });
            }
            
            const grassBillboard = new THREE.Mesh(geometry, material);
            grassBillboard.position.set(randomX, grassHeight / 2, randomZ);
            
            grassBillboard.userData = {
                isBillboard: true,
                tileName: tileName,
                baseSize: { width: grassWidth, height: grassHeight }
            };
            
            if (!this.billboards) {
                this.billboards = [];
            }
            this.billboards.push(grassBillboard);
            
            grassGroup.add(grassBillboard);
        }
        
        return grassGroup;
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
        
        return new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1, // Discard pixels with alpha < 0.1
            side: THREE.DoubleSide // Ensure sprite is visible from both sides
        });
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
        // In first-person mode, position player at center of grid
        if (this.isFirstPerson && this.player) {
            const centerX = (cols - 1) * 0.5;
            const centerY = (rows - 1) * 0.5;
            this.setPlayerPosition(centerX, centerY);
            this.debugLog('🎯 Centered player on grid:', { centerX, centerY });
        } else {
            // Fallback for overhead view (though we're focused on first-person)
            const maxDimension = Math.max(cols, rows);
            const distance = maxDimension * this.tileSize * 1.5;
            this.camera.position.set(distance * 0.7, distance, distance * 0.7);
            this.camera.lookAt(0, 0, 0);
        }
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