// ThreeMapRenderer.js - Clean V5 3D Map Renderer
// Replaces 2D canvas with Three.js 3D renderer in the same container
// Author: GitHub Copilot + Brad
// Date: September 12, 2025

class ThreeMapRenderer {
    constructor(containerId, mapData = null) {
        // 🔍 DEBUG: Track when new ThreeMapRenderer instances are created
        console.log('🏗️ NEW ThreeMapRenderer instance created');
        console.log('📍 Container ID:', containerId);
        console.log('📊 Map data provided:', !!mapData);
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // DETAILED DEBUG: Log container state at constructor time
        console.log('🔍 THREEMAPRENDERER_CONSTRUCTOR_START:', {
            containerId: containerId,
            containerFound: !!this.container,
            containerDimensions: this.container ? {
                clientWidth: this.container.clientWidth,
                clientHeight: this.container.clientHeight,
                offsetWidth: this.container.offsetWidth,
                offsetHeight: this.container.offsetHeight,
                scrollWidth: this.container.scrollWidth,
                scrollHeight: this.container.scrollHeight
            } : null,
            containerStyle: this.container ? {
                position: this.container.style.position,
                width: this.container.style.width,
                height: this.container.style.height,
                display: this.container.style.display
            } : null,
            containerParent: this.container ? {
                nodeName: this.container.parentNode?.nodeName,
                id: this.container.parentNode?.id,
                className: this.container.parentNode?.className
            } : null
        });
        
        this.mapData = null;
        
        // Three.js core objects
        this.scene = null;
        this.camera = null;
        this.player = null;  // Player object that contains camera
        this.renderer = null;
        this.animationId = null;
        
        // Map rendering properties
        this.tileSize = 8.0; // Increased from 1.0 - Each tile represents a significant area for mobile exploration
        this.tileHeight = 0.2;
        this.currentTiles = [];
        
        // Player and camera system
        this.playerPosition = { x: 0, y: 0 };
        this.cameraHeight = 1.8; // Reduced from 2.0 for better scale (like dungeon game)
        this.isFirstPerson = true;
        
        // Time tracking for FPS-independent movement
        this.prevTime = performance.now();
        this.velocity = { x: 0, z: 0 };
        
        // Mobile performance detection and optimization
        // Enhanced detection for mobile devices AND responsive mode
        const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallScreen = window.innerWidth <= 768; // Typical mobile breakpoint
        this.isMobile = userAgentMobile || (touchCapable && smallScreen);
        
        this.grassDensityMultiplier = this.isMobile ? 0.25 : 1.0; // Reduce grass density on mobile
        this.renderDistance = this.isMobile ? 50 : 100; // Shorter render distance on mobile
        
        // Initialize ShapeForge model cache for performance optimization
        // This prevents re-loading and re-creating the same models hundreds of times
        this.shapeforgeCache = new Map();           // Stores parsed JSON data
        this.shapeforgeGeometryCache = new Map();   // Stores created ThreeJS geometry groups
        this.shapeforgeLoadingPromises = new Map(); // Prevents duplicate network requests
        
        // LOD (Level of Detail) and Frustum Culling system for performance
        this.lodEnabled = true;
        this.frustumCullingEnabled = true;
        this.lodDistances = {
            close: 30,    // Full detail within 30 units
            medium: 80,   // Simplified detail 30-80 units  
            far: 150      // Simple shapes 80-150 units, beyond = culled
        };
        
        // Track tiles for LOD updates
        this.activeTiles = new Map(); // Map of tile coordinates to tile objects
        this.lodUpdateCounter = 0;    // Throttle LOD updates
        
        // Performance monitoring for LOD system
        this.lodStats = {
            tilesRendered: 0,
            tilesCulled: 0,
            lodBreakdown: { close: 0, medium: 0, far: 0, culled: 0 }
        };
        
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

        // 🔍 DEBUG: Track when init() is called to catch unexpected re-initializations
        const initStack = new Error().stack;
        console.log('🎮 ThreeMapRenderer.init() called');
        console.log('📍 Call stack trace:', initStack.split('\n').slice(1, 4).join('\n'));
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        console.log('🎮 Initializing ThreeMapRenderer in container:', this.containerId);
        
        // Log mobile optimizations
        if (this.isMobile) {
            const detectionReasons = [];
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                detectionReasons.push('User Agent');
            }
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                detectionReasons.push('Touch Capable');
            }
            if (window.innerWidth <= 768) {
                detectionReasons.push('Small Screen');
            }
            
            console.log(`📱 Mobile/responsive mode detected (${detectionReasons.join(', ')}) - applying optimizations:`);
            console.log(`  • Grass density: ${Math.round(this.grassDensityMultiplier * 100)}% of desktop`);
            console.log(`  • Render distance: ${this.renderDistance} units`);
            console.log(`  • Tile size: ${this.tileSize} units (optimized for exploration)`);
        } else {
            console.log('💻 Desktop device - using full quality settings');
            console.log(`  • Tile size: ${this.tileSize} units (exploration scale)`);
        }
        
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
        
        // Get container dimensions - use fallback if not available yet
        const containerWidth = this.container.clientWidth || this.container.offsetWidth || 800;
        const containerHeight = this.container.clientHeight || this.container.offsetHeight || 600;
        
        console.log('🖼️ Container dimensions at init:', {
            clientWidth: this.container.clientWidth,
            clientHeight: this.container.clientHeight,
            offsetWidth: this.container.offsetWidth,
            offsetHeight: this.container.offsetHeight,
            using: { width: containerWidth, height: containerHeight }
        });
        
        this.renderer.setSize(containerWidth, containerHeight);
        this.renderer.setClearColor(0x222222);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer canvas to container - use exact container dimensions
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0px';
        this.renderer.domElement.style.left = '0px';
        this.renderer.domElement.style.margin = '0';
        this.renderer.domElement.style.padding = '0';
        this.renderer.domElement.style.border = 'none';
        this.renderer.domElement.style.width = containerWidth + 'px';
        this.renderer.domElement.style.height = containerHeight + 'px';
        this.renderer.domElement.style.zIndex = '10'; // Ensure it's above other elements
        
        // FORCE container to have proper overflow handling
        this.container.style.overflow = 'hidden';
        this.container.style.position = 'relative';
        
        this.container.appendChild(this.renderer.domElement);
        
        // FORCE IMMEDIATE RESIZE: Get current container dimensions and apply immediately
        const immediateWidth = this.container.clientWidth || this.container.offsetWidth || 800;
        const immediateHeight = this.container.clientHeight || this.container.offsetHeight || 600;
        
        console.log('🔧 IMMEDIATE_RESIZE_ATTEMPT:', {
            immediateWidth,
            immediateHeight,
            containerClient: { width: this.container.clientWidth, height: this.container.clientHeight },
            containerOffset: { width: this.container.offsetWidth, height: this.container.offsetHeight }
        });
        
        // Force resize right now
        this.renderer.setSize(immediateWidth, immediateHeight);
        this.renderer.domElement.style.width = immediateWidth + 'px';
        this.renderer.domElement.style.height = immediateHeight + 'px';
        this.camera.aspect = immediateWidth / immediateHeight;
        this.camera.updateProjectionMatrix();
        
        // DEBUG: Check canvas position after resize
        const canvasRect = this.renderer.domElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        console.log('📐 POSITION_DEBUG:', {
            canvasRect: {
                top: canvasRect.top,
                left: canvasRect.left,
                width: canvasRect.width,
                height: canvasRect.height,
                right: canvasRect.right,
                bottom: canvasRect.bottom
            },
            containerRect: {
                top: containerRect.top,
                left: containerRect.left,
                width: containerRect.width,
                height: containerRect.height,
                right: containerRect.right,
                bottom: containerRect.bottom
            },
            canvasStyle: {
                position: this.renderer.domElement.style.position,
                top: this.renderer.domElement.style.top,
                left: this.renderer.domElement.style.left,
                width: this.renderer.domElement.style.width,
                height: this.renderer.domElement.style.height,
                transform: this.renderer.domElement.style.transform
            },
            containerStyle: {
                position: this.container.style.position,
                width: this.container.style.width,
                height: this.container.style.height
            }
        });
        
        // Set up lighting
        this.setupLighting();
        
        // Set up controls
        this.setupControls();
        
        // Add resize handling
        this.setupResizeHandler();
        
        // Trigger initial resize to ensure proper sizing
        setTimeout(() => {
            const width = this.container.clientWidth || this.container.offsetWidth || 800;
            const height = this.container.clientHeight || this.container.offsetHeight || 600;
            console.log('🔄 Delayed resize check:', { width, height });
            this.handleResize(width, height);
        }, 100);
        
        // Additional resize check after a longer delay for slow layouts
        setTimeout(() => {
            const width = this.container.clientWidth || this.container.offsetWidth;
            const height = this.container.clientHeight || this.container.offsetHeight;
            if (width > 0 && height > 0) {
                console.log('🔄 Secondary resize check:', { width, height });
                this.handleResize(width, height);
            }
        }, 500);

        // SEARCHABLE LOG: ThreeMapRenderer initialization complete
        console.log('🎮 THREEMAPRENDERER_INIT_COMPLETE:', {
            containerId: this.containerId,
            containerDimensions: {
                clientWidth: this.container.clientWidth,
                clientHeight: this.container.clientHeight,
                offsetWidth: this.container.offsetWidth,
                offsetHeight: this.container.offsetHeight
            },
            rendererSize: {
                width: this.renderer.domElement.width,
                height: this.renderer.domElement.height
            },
            canvasStyle: {
                width: this.renderer.domElement.style.width,
                height: this.renderer.domElement.style.height
            },
            timestamp: new Date().toISOString()
        });
        
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
        
        // Ensure we have valid dimensions
        if (width <= 0 || height <= 0) {
            console.warn('⚠️ Invalid resize dimensions:', { width, height });
            return;
        }
        
        console.log('🔧 Resizing renderer:', { 
            width, 
            height,
            containerClient: { width: this.container.clientWidth, height: this.container.clientHeight },
            containerOffset: { width: this.container.offsetWidth, height: this.container.offsetHeight }
        });
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Ensure canvas matches container exactly
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0px';
        this.renderer.domElement.style.left = '0px';
        this.renderer.domElement.style.width = width + 'px';
        this.renderer.domElement.style.height = height + 'px';
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
        
        // 🎯 NEW: Update minimap when position is set
        this.updateMinimapPlayerDot();
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
        
        // Apply movement to velocity with speed boost
        let speed = controls.moveSpeed;
        if (this.rightMousePressed) {
            speed *= 2; // Double speed when right mouse is held
        }
        // Also apply speed boost for Shift + movement keys
        if (this.shiftPressed && (controls.keys.forward || controls.keys.backward || controls.keys.left || controls.keys.right)) {
            speed *= 2; // Double speed when shift is held with movement
        }
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
        
        // 🎯 NEW: Update tile position tracking after movement
        this.updatePlayerTilePosition();
        
        // 🎯 NEW: Update LOD for all models based on current camera position
        this.updateDynamicLOD();
        
        // TODO: Add collision detection here if needed
        // For now, basic bounds checking could be added
    }
    
    // 🎯 NEW: Convert world position to tile coordinates and update tracking
    updatePlayerTilePosition() {
        if (!this.player || !this.mapData) return;
        
        // Convert world position back to tile coordinates
        const worldX = this.player.position.x;
        const worldZ = this.player.position.z;
        
        // Calculate which tile the player is on
        // Note: Need to account for map centering offset
        const mapWidth = this.mapData.width || 0;
        const mapHeight = this.mapData.height || 0;
        
        if (mapWidth === 0 || mapHeight === 0) return;
        
        // Calculate the map's world offset (how it's centered in the scene)
        const mapWorldWidth = mapWidth * this.tileSize;
        const mapWorldHeight = mapHeight * this.tileSize;
        const mapOffsetX = -mapWorldWidth / 2;
        const mapOffsetZ = -mapWorldHeight / 2;
        
        // Convert world position to tile coordinates
        const tileX = Math.floor((worldX - mapOffsetX) / this.tileSize);
        const tileY = Math.floor((worldZ - mapOffsetZ) / this.tileSize);
        
        // Clamp to map bounds
        const clampedX = Math.max(0, Math.min(mapWidth - 1, tileX));
        const clampedY = Math.max(0, Math.min(mapHeight - 1, tileY));
        
        // Update player position if it changed
        if (this.playerPosition.x !== clampedX || this.playerPosition.y !== clampedY) {
            this.playerPosition.x = clampedX;
            this.playerPosition.y = clampedY;
            
            console.log('🎯 Player moved to tile:', this.playerPosition, 
                       'world pos:', { x: worldX.toFixed(2), z: worldZ.toFixed(2) });
            
            // Trigger minimap update if it exists
            this.updateMinimapPlayerDot();
        }
    }
    
    // 🎯 NEW: Update the minimap player dot without full re-render
    updateMinimapPlayerDot() {
        // Quick check if minimap canvas exists
        const canvas = document.getElementById('map-canvas');
        if (!canvas || !this.mapData) return;
        
        // For now, just trigger a full minimap re-render
        // Later we could optimize this to only redraw the player dot
        if (window.renderMinimapCanvas) {
            const rect = canvas.getBoundingClientRect();
            window.renderMinimapCanvas(this.mapData, rect.width, rect.height);
        }
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
        
        // Add dash properties to camera controls
        controls.dash = {
            distance: 2, // How far to dash (in movement units)
            cooldown: 1000, // Dash cooldown in milliseconds
            lastDashTime: 0 // Track when last dash occurred
        };
        
        // Track shift key state separately for reliable dash detection
        this.shiftPressed = false;
        
        // Track right mouse button state for speed boost
        this.rightMousePressed = false;
        
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
        
        const self = this; // Store reference for event handlers
        
        window.addEventListener('keydown', function(event) {
            // Track shift key state
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                self.shiftPressed = true;
                console.log(`🔄 Shift key pressed - shift state: ${self.shiftPressed}, moveSpeed: ${controls.moveSpeed} -> ${controls.moveSpeed * 2} (when moving)`);
                return;
            }
            
            // Debug logging for all key presses
            console.log(`🎮 Key pressed: ${event.code}, Shift state: ${self.shiftPressed}, Event shift: ${event.shiftKey}, Repeat: ${event.repeat}, RMB boost: ${self.rightMousePressed}`);
            
            if (keyMap[event.code] && !event.repeat) {
                // Check for dash (Shift + movement key) - use both tracked state AND event.shiftKey
                if ((self.shiftPressed || event.shiftKey) && ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
                    console.log(`⚡ Dash detected: ${event.code} + Shift (tracked: ${self.shiftPressed}, event: ${event.shiftKey}), moveSpeed: ${controls.moveSpeed}`);
                    self.handleKeyboardDash(event.code);
                    event.preventDefault();
                    return;
                }
                
                // Handle spacebar dash (dash in current facing direction)
                if (event.code === 'Space') {
                    console.log(`⚡ Spacebar dash detected`);
                    self.handleSpacebarDash();
                    event.preventDefault();
                    return;
                }
                
                // Regular movement
                controls.keys[keyMap[event.code]] = true;
                event.preventDefault();
            }
        });
        
        window.addEventListener('keyup', function(event) {
            // Track shift key release
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                self.shiftPressed = false;
                console.log(`🔄 Shift key released - shift state: ${self.shiftPressed}, moveSpeed: ${controls.moveSpeed} (boost deactivated)`);
                return;
            }
            
            if (keyMap[event.code]) {
                controls.keys[keyMap[event.code]] = false;
                event.preventDefault();
            }
        });
        
        // Mouse event listeners for speed boost
        window.addEventListener('mousedown', function(event) {
            if (event.button === 2) { // Right mouse button
                self.rightMousePressed = true;
                console.log(`🖱️ Right mouse pressed - speed boost activated, moveSpeed: ${controls.moveSpeed} -> ${controls.moveSpeed * 2}`);
                event.preventDefault();
            }
        });
        
        window.addEventListener('mouseup', function(event) {
            if (event.button === 2) { // Right mouse button
                self.rightMousePressed = false;
                console.log(`🖱️ Right mouse released - speed boost deactivated, moveSpeed: ${controls.moveSpeed}`);
                event.preventDefault();
            }
        });
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        });
        
        this.debugLog('⌨️ Keyboard controls setup (WASD/Arrows + Shift to dash, Spacebar to dash forward)');
    }
    
    // Handle keyboard dash (Shift + movement key)
    handleKeyboardDash(keyCode) {
        const now = Date.now();
        const dashData = this.cameraControls.dash;
        
        // Check cooldown
        if (now - dashData.lastDashTime < dashData.cooldown) {
            const remaining = Math.ceil((dashData.cooldown - (now - dashData.lastDashTime)) / 1000);
            console.log(`⚡ Dash on cooldown (${remaining}s remaining)`);
            return;
        }
        
        // Determine dash direction based on key
        let deltaX = 0, deltaZ = 0;
        switch (keyCode) {
            case 'KeyW':
            case 'ArrowUp':
                deltaZ = -dashData.distance;
                break;
            case 'KeyS':
            case 'ArrowDown':
                deltaZ = dashData.distance;
                break;
            case 'KeyA':
                deltaX = -dashData.distance;
                break;
            case 'KeyD':
                deltaX = dashData.distance;
                break;
        }
        
        this.executeDash(deltaX, deltaZ);
        dashData.lastDashTime = now;
        console.log(`⚡ Keyboard dash executed: direction (${deltaX}, ${deltaZ}), moveSpeed: ${this.cameraControls.moveSpeed}`);
    }
    
    // Handle spacebar dash (dash forward in current facing direction)
    handleSpacebarDash() {
        const now = Date.now();
        const dashData = this.cameraControls.dash;
        
        // Check cooldown
        if (now - dashData.lastDashTime < dashData.cooldown) {
            const remaining = Math.ceil((dashData.cooldown - (now - dashData.lastDashTime)) / 1000);
            console.log(`⚡ Dash on cooldown (${remaining}s remaining)`);
            return;
        }
        
        // Dash forward in current facing direction
        const deltaX = 0;
        const deltaZ = -dashData.distance; // Forward
        
        this.executeDash(deltaX, deltaZ);
        dashData.lastDashTime = now;
        console.log(`⚡ Spacebar dash executed: forward direction, moveSpeed: ${this.cameraControls.moveSpeed}`);
    }
    
    // Execute the actual dash movement
    executeDash(deltaX, deltaZ) {
        // Apply rotation to movement direction based on player's current rotation
        const playerRotationY = this.player.rotation.y;
        const cos = Math.cos(playerRotationY);
        const sin = Math.sin(playerRotationY);
        
        const rotatedX = deltaX * cos - deltaZ * sin;
        const rotatedZ = deltaX * sin + deltaZ * cos;
        
        // Apply dash movement to player position
        this.player.position.x += rotatedX;
        this.player.position.z += rotatedZ;
        
        // Update minimap if available
        if (this.minimapRenderer) {
            this.minimapRenderer.updatePlayerPosition(this.player.position.x, this.player.position.z);
        }
        
        console.log(`⚡ Dash movement applied: (${rotatedX.toFixed(2)}, ${rotatedZ.toFixed(2)}), current moveSpeed: ${this.cameraControls.moveSpeed}`);
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
            } 
            // Right-click disabled for planned "right-click to run" feature
            // } else if (event.button === 2) { // Right click for minimap drag
            //     this.handleRightClickDrag(event);
            // }
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
                
                // Rotate player (Y-axis) and camera (X-axis) based on touch movement - same as mouse controls
                this.player.rotation.y -= deltaX * 0.003;
                this.camera.rotation.x -= deltaY * 0.003;
                
                // Clamp vertical rotation to prevent ground tilting
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
                
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
        // 🔍 DEBUG: Track map data loading to catch unexpected reloads
        console.log('🗺️ ThreeMapRenderer.loadMapData called');
        console.log('📊 Data provided:', !!mapData);
        console.log('🔄 Current mapData exists:', !!this.mapData);
        console.log('⏰ Timestamp:', new Date().toISOString());
        if (mapData) {
            console.log('📏 Map dimensions:', mapData.width, 'x', mapData.height);
            console.log('🎨 Tileset:', mapData.tileset);
        }
        
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
        // 🔍 DEBUG: Track when tiles get cleared (causing "brand new" rendering)
        console.log('🧹 ThreeMapRenderer.clearTiles() called - THIS CAUSES FULL RE-RENDER');
        console.log('📊 Current tiles count:', this.currentTiles.length);
        console.log('📍 Call stack trace:', new Error().stack.split('\n').slice(1, 5).join('\n'));
        console.log('⏰ Timestamp:', new Date().toISOString());
        
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
        
        // Reset LOD stats for new grid rendering
        this.resetLODStats();
        
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
        
        // Log LOD performance stats after rendering
        setTimeout(() => {
            this.logLODStats();
        }, 3000); // Wait 3 seconds for async ShapeForge loading to complete
        
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
        
        // Determine if this tile should be flat (water, road) or billboard
        const flatTileTypes = ['water', 'road', 'stone', 'dirt', 'floor'];
        const shouldBeFlat = flatTileTypes.includes(tileName.toLowerCase());

        // Load ShapeForge files too replace billboards

        if (spriteData && !shouldBeFlat) {
            // Create billboard sprites for trees, mountains, buildings, etc.
            if (tileName === 'grass') {
                // Create multiple small grass sprites scattered across the tile
                billboardMesh = this.loadShapeForgeFile(spriteData, tileName, col, row);
            } else if (tileName === 'mountain') {
                // Use ShapeForge mountains instead of billboard sprites
                billboardMesh = this.loadShapeForgeFile(spriteData, tileName, col, row);
            } else if (tileName === 'castle') {
                // Use ShapeForge mountains instead of billboard sprites
                billboardMesh = this.loadShapeForgeFile(spriteData, tileName, col, row);
            } else {
                billboardMesh = this.createBillboardSprite(spriteData, tileName);
            }
        } else if (spriteData && shouldBeFlat) {
            // Create flat textured plane for water, roads, etc.
            billboardMesh = this.createFlatTexturedTile(spriteData, tileName);
        } else {
            // Create simple colored elements for tiles without sprites
            if (tileName === 'grass') {
                billboardMesh = this.loadShapeForgeFile(null, tileName, col, row);
            } else if (tileName === 'mountain') {
                // Use ShapeForge mountains even without sprite data
                billboardMesh = this.loadShapeForgeFile(null, tileName, col, row);
            } else if (tileName === 'castle') {
                // Use ShapeForge mountains instead of billboard sprites
                billboardMesh = this.loadShapeForgeFile(spriteData, tileName, col, row);
            } else if (!shouldBeFlat) {
                billboardMesh = this.createColorBillboard(tileName);
            }
            // Flat tiles without sprites just use the colored ground plane
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
    
    // Create flat textured tile for ground-level rendering (water, roads, etc.)
    createFlatTexturedTile(spriteData, tileName) {
        // Create geometry for a horizontal plane
        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal (facing up)
        
        let material;
        
        if (spriteData) {
            // Use the same sprite material creation as billboards
            material = this.createSpriteMaterial(spriteData);
        } else {
            // Fallback to solid color if no texture
            material = new THREE.MeshLambertMaterial({
                color: this.getTileColor(tileName),
                transparent: true,
                opacity: 0.8
            });
        }
        
        const flatTile = new THREE.Mesh(geometry, material);
        flatTile.position.y = 0.01; // Back to minimal height to avoid z-fighting
        
        flatTile.userData = {
            isFlatTile: true,
            tileName: tileName
        };
        
        return flatTile;
    }

    // Originally named createGrassField, made by Claude
    // Load ShapeForge models or create billboard sprites based on tile type
    loadShapeForgeFile(spriteData, tileName, tileCol = 0, tileRow = 0) {
        console.log('🔍 loadShapeForgeFile called with tileName:', tileName);
        
        // Check if tile should be culled (too far away)
        if (this.shouldCullTile(tileCol, tileRow)) {
            console.log(`🚫 Culling tile at ${tileCol},${tileRow} - too far away`);
            return new THREE.Group(); // Return empty group
        }
        
        // Check if we should use ShapeForge models for grass
        if (tileName === 'grass') {
            // Return a placeholder group immediately, load actual model asynchronously
            const placeholderGroup = new THREE.Group();
            this.loadSfGrass(tileCol, tileRow).then(grassGroup => {
                if (grassGroup && placeholderGroup.parent) {
                    // Copy children from loaded group to placeholder
                    while (grassGroup.children.length > 0) {
                        placeholderGroup.add(grassGroup.children[0]);
                    }
                }
            }).catch(error => {
                console.warn('Failed to load cached grass:', error);
            });
            return placeholderGroup;
        }
        
        // Check if we should use ShapeForge models for mountains
        if (tileName === 'mountain') {
            console.log('🏔️ Mountain Should Be Here - shapeforge');
            const placeholderGroup = new THREE.Group();
            this.loadSfMountain(tileCol, tileRow).then(mountainGroup => {
                if (mountainGroup && placeholderGroup.parent) {
                    // Copy children from loaded group to placeholder
                    while (mountainGroup.children.length > 0) {
                        placeholderGroup.add(mountainGroup.children[0]);
                    }
                }
            }).catch(error => {
                console.warn('Failed to load cached mountain:', error);
            });
            return placeholderGroup;
        }

        if (tileName === 'castle') {
            console.log('🏰 Castle Should Be Here - shapeforge');
            const placeholderGroup = new THREE.Group();
            this.loadSfCastle(tileCol, tileRow).then(castleGroup => {
                if (castleGroup && placeholderGroup.parent) {
                    // Copy children from loaded group to placeholder
                    while (castleGroup.children.length > 0) {
                        placeholderGroup.add(castleGroup.children[0]);
                    }
                }
            }).catch(error => {
                console.warn('Failed to load cached castle:', error);
            });
            return placeholderGroup;
        }
        
        const grassGroup = new THREE.Group();
        // Apply mobile density reduction - fewer grass sprites on mobile devices
        const baseGrassCount = 3 + Math.floor(Math.random() * 4); // 3-6 grass sprites per tile
        const grassCount = Math.ceil(baseGrassCount * this.grassDensityMultiplier);
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
    
    // ========================================
    // SHAPEFORGE INTEGRATION
    // ========================================
    
    // Cached loading method for ShapeForge models - prevents duplicate network requests and geometry creation
    // Now caches only FULL DETAIL models, LOD is applied dynamically in real-time
    async loadShapeForgeModelCached(modelName) {
        console.log(`🔄 Loading cached ShapeForge model: ${modelName} (FULL DETAIL)`);
        
        // Check if we already have this model in cache (always full detail)
        if (this.shapeforgeGeometryCache.has(modelName)) {
            console.log(`✅ Using cached FULL DETAIL geometry for ${modelName} (MAJOR PERFORMANCE BOOST!)`);
            return this.cloneShapeForgeModel(this.shapeforgeGeometryCache.get(modelName));
        }
        
        // Check if we're already loading this model to prevent duplicate requests
        const loadingKey = `${modelName}_loading`;
        if (this.shapeforgeLoadingPromises.has(loadingKey)) {
            console.log(`⏳ Waiting for existing ${modelName} load to complete`);
            const shapeforgeData = await this.shapeforgeLoadingPromises.get(loadingKey);
            const modelGroup = this.createShapeForgeModel(shapeforgeData); // Always full detail
            if (modelGroup) {
                this.shapeforgeGeometryCache.set(modelName, modelGroup);
                return this.cloneShapeForgeModel(modelGroup);
            }
            return null;
        }
        
        // Start new loading process (only load JSON once, create full detail model)
        console.log(`🌐 Fetching ${modelName}.shapeforge.json from network (FIRST TIME ONLY)`);
        const loadingPromise = fetch(`assets/shapeforge/${modelName}.shapeforge.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(shapeforgeData => {
                console.log(`📦 Parsed JSON data for ${modelName}:`, shapeforgeData);
                this.shapeforgeCache.set(modelName, shapeforgeData);
                return shapeforgeData;
            })
            .catch(error => {
                console.error(`❌ Failed to load ${modelName}:`, error);
                throw error;
            })
            .finally(() => {
                // Clean up the loading promise once complete
                this.shapeforgeLoadingPromises.delete(loadingKey);
            });
        
        // Store the promise to prevent duplicate requests
        this.shapeforgeLoadingPromises.set(loadingKey, loadingPromise);
        
        try {
            const shapeforgeData = await loadingPromise;
            
            // Create the FULL DETAIL model and cache it
            const modelGroup = this.createShapeForgeModel(shapeforgeData);
            if (modelGroup) {
                console.log(`🎯 Caching FULL DETAIL geometry for ${modelName} - LOD will be applied dynamically`);
                this.shapeforgeGeometryCache.set(modelName, modelGroup);
                
                // Return a clone for use
                return this.cloneShapeForgeModel(modelGroup);
            }
            return null;
        } catch (error) {
            console.warn(`⚠️ Failed to load ShapeForge model ${modelName}:`, error);
            return null;
        }
    }
    
    // Apply Level-of-Detail reduction to an existing full-detail model in real-time
    applyDynamicLOD(modelGroup, lodLevel) {
        if (!modelGroup || !modelGroup.children) return modelGroup;
        
        // Store the original LOD level to avoid redundant processing
        if (modelGroup.userData.currentLOD === lodLevel) {
            return modelGroup; // Already at this LOD level
        }
        
        console.log(`🎯 Applying dynamic LOD: ${lodLevel} to model`);
        
        switch (lodLevel) {
            case 'close':
                // Full detail - show all objects
                this.setModelVisibilityAndDetail(modelGroup, 1.0, 1.0, true);
                break;
                
            case 'medium':
                // Medium detail - hide some objects, reduce opacity
                this.setModelVisibilityAndDetail(modelGroup, 0.8, 0.7, true);
                this.simplifyModelGeometry(modelGroup, 0.5); // Hide every other object
                break;
                
            case 'far':
                // Far detail - very simple representation
                this.setModelVisibilityAndDetail(modelGroup, 0.6, 0.5, false);
                this.simplifyModelGeometry(modelGroup, 0.2); // Hide most objects, keep only main shapes
                break;
                
            case 'culled':
                // Completely hidden
                modelGroup.visible = false;
                break;
                
            default:
                console.warn(`Unknown LOD level: ${lodLevel}`);
        }
        
        // Store current LOD level to avoid redundant processing
        modelGroup.userData.currentLOD = lodLevel;
        return modelGroup;
    }
    
    // Helper method to adjust model visibility and detail
    setModelVisibilityAndDetail(modelGroup, scaleMultiplier, opacityMultiplier, showDetails) {
        modelGroup.visible = true;
        
        modelGroup.children.forEach((child, index) => {
            if (child.isMesh) {
                // Adjust material opacity
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = Math.min(1.0, (child.material.opacity || 1.0) * opacityMultiplier);
                    child.material.transparent = child.material.opacity < 1.0;
                }
                
                // For far LOD, simplify to basic material
                if (!showDetails && child.material) {
                    // Store original material if not already stored
                    if (!child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material.clone();
                    }
                    
                    // Use simplified material for far distances
                    child.material = new THREE.MeshBasicMaterial({
                        color: child.userData.originalMaterial.color || 0x888888,
                        transparent: true,
                        opacity: 0.5
                    });
                } else if (showDetails && child.userData.originalMaterial) {
                    // Restore original material for close/medium distances
                    child.material = child.userData.originalMaterial.clone();
                }
            } else if (child.isGroup) {
                // Recursively apply to child groups
                this.setModelVisibilityAndDetail(child, scaleMultiplier, opacityMultiplier, showDetails);
            }
        });
    }
    
    // Helper method to simplify geometry by hiding some objects
    simplifyModelGeometry(modelGroup, keepRatio) {
        modelGroup.children.forEach((child, index) => {
            if (child.isMesh) {
                // Hide objects based on keepRatio (0.5 = keep 50% of objects)
                const shouldKeep = Math.random() < keepRatio || index === 0; // Always keep first object
                child.visible = shouldKeep;
            } else if (child.isGroup) {
                // Recursively apply to child groups
                this.simplifyModelGeometry(child, keepRatio);
            }
        });
    }
    
    // Clone a cached ShapeForge model for reuse (much faster than re-creating geometry)
    cloneShapeForgeModel(originalGroup) {
        const clonedGroup = new THREE.Group();
        
        originalGroup.children.forEach(child => {
            if (child.isMesh) {
                // Clone the mesh with shared geometry but unique transforms
                const clonedMesh = new THREE.Mesh(
                    child.geometry, // Share the geometry (memory efficient)
                    child.material.clone() // Clone material for independent properties
                );
                
                // Copy transform properties
                clonedMesh.position.copy(child.position);
                clonedMesh.rotation.copy(child.rotation);
                clonedMesh.scale.copy(child.scale);
                
                // Copy user data if needed
                if (child.userData) {
                    clonedMesh.userData = { ...child.userData };
                }
                
                clonedGroup.add(clonedMesh);
            } else if (child.isGroup) {
                // Recursively clone groups
                const clonedChild = this.cloneShapeForgeModel(child);
                clonedGroup.add(clonedChild);
            }
        });
        
        return clonedGroup;
    }
    
    // Calculate distance from camera to tile for LOD determination
    calculateTileDistance(tileCol, tileRow) {
        if (!this.camera) return 0;
        
        // Convert tile coordinates to world position
        const tileWorldX = (tileCol - this.mapData.width / 2) * this.tileSize;
        const tileWorldZ = (tileRow - this.mapData.height / 2) * this.tileSize;
        
        // Calculate distance from camera position
        const cameraPos = this.camera.position;
        const distance = Math.sqrt(
            Math.pow(cameraPos.x - tileWorldX, 2) + 
            Math.pow(cameraPos.z - tileWorldZ, 2)
        );
        
        return distance;
    }
    
    // Determine appropriate LOD level based on distance
    getLODLevel(distance) {
        if (!this.lodEnabled) return 'close';
        
        if (distance <= this.lodDistances.close) {
            return 'close';
        } else if (distance <= this.lodDistances.medium) {
            return 'medium';
        } else if (distance <= this.lodDistances.far) {
            return 'far';
        } else {
            return 'culled'; // Too far away, don't render
        }
    }
    
    // Check if tile should be culled (not rendered) due to frustum or distance
    shouldCullTile(tileCol, tileRow) {
        if (!this.frustumCullingEnabled || !this.camera) return false;
        
        const distance = this.calculateTileDistance(tileCol, tileRow);
        
        // Distance culling
        if (distance > this.lodDistances.far) {
            return true;
        }
        
        // TODO: Add frustum culling calculation here
        // For now, just use distance culling
        
        return false;
    }
    
    // Performance monitoring - log LOD statistics
    logLODStats() {
        const total = this.lodStats.tilesRendered + this.lodStats.tilesCulled;
        if (total > 0) {
            console.log(`📊 LOD Performance Stats:
🎯 Total Tiles: ${total}
✅ Rendered: ${this.lodStats.tilesRendered} (${(this.lodStats.tilesRendered/total*100).toFixed(1)}%)
🚫 Culled: ${this.lodStats.tilesCulled} (${(this.lodStats.tilesCulled/total*100).toFixed(1)}%)
📍 Close LOD: ${this.lodStats.lodBreakdown.close}
📍 Medium LOD: ${this.lodStats.lodBreakdown.medium} 
📍 Far LOD: ${this.lodStats.lodBreakdown.far}
🔥 Performance Boost: ${this.lodStats.tilesCulled > 0 ? 'MASSIVE' : 'Good'} (${this.lodStats.tilesCulled} tiles not rendered)`);
        }
    }
    
    // Reset LOD statistics for new measurement
    resetLODStats() {
        this.lodStats = {
            tilesRendered: 0,
            tilesCulled: 0,
            lodBreakdown: { close: 0, medium: 0, far: 0, culled: 0 }
        };
    }
    
    // Get current LOD statistics (for external monitoring)
    getLODStats() {
        return { ...this.lodStats };
    }
    
    // Enable/disable LOD system
    setLODEnabled(enabled) {
        this.lodEnabled = enabled;
        console.log(`🎯 LOD System ${enabled ? 'ENABLED' : 'DISABLED'}`);
        if (!enabled) {
            console.log('⚠️ WARNING: Disabling LOD will hurt performance on large maps!');
        }
    }
    
    // Enable/disable frustum culling
    setFrustumCullingEnabled(enabled) {
        this.frustumCullingEnabled = enabled;
        console.log(`🎯 Frustum Culling ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    // Update LOD for all ShapeForge models based on current camera position
    updateDynamicLOD() {
        if (!this.lodEnabled || !this.camera) return;
        
        // Throttle LOD updates to avoid excessive processing
        this.lodUpdateCounter++;
        if (this.lodUpdateCounter % 10 !== 0) return; // Update every 10 frames (~6 times per second at 60fps)
        
        // Find all ShapeForge models in the scene and update their LOD
        this.scene.traverse((object) => {
            if (object.userData && object.userData.modelType && object.userData.tileCol !== undefined) {
                // This is a ShapeForge model with tile coordinates
                const distance = this.calculateTileDistance(object.userData.tileCol, object.userData.tileRow);
                const newLodLevel = this.getLODLevel(distance);
                
                // Only update if LOD level has changed
                if (object.userData.currentLOD !== newLodLevel) {
                    console.log(`🔄 DYNAMIC LOD: ${object.userData.modelType} at tile (${object.userData.tileCol},${object.userData.tileRow}) changed from ${object.userData.currentLOD || 'initial'} → ${newLodLevel} (distance: ${distance.toFixed(1)})`);
                    this.applyDynamicLOD(object, newLodLevel);
                }
            }
        });
    }
    
    // Load ShapeForge grass model instead of billboard sprites
    async loadSfGrass(tileCol = 0, tileRow = 0) {
        console.log('🌿 Loading cached grass model...');
        const grassGroup = new THREE.Group();
        
        // Calculate distance and LOD level
        const distance = this.calculateTileDistance(tileCol, tileRow);
        const lodLevel = this.getLODLevel(distance);
        
        // Skip grass entirely at far distances for performance
        if (lodLevel === 'culled' || lodLevel === 'far') {
            console.log(`🌿 Skipping grass at distance ${distance.toFixed(1)} (LOD: ${lodLevel})`);
            this.lodStats.lodBreakdown[lodLevel]++;
            if (lodLevel === 'culled') this.lodStats.tilesCulled++;
            return grassGroup; // Return empty group
        }
        
        this.lodStats.tilesRendered++;
        this.lodStats.lodBreakdown[lodLevel]++;
        
        try {
            // Load full detail grass model from cache
            const fullDetailGrass = await this.loadShapeForgeModelCached('grass');
            
            if (fullDetailGrass) {
                // Adjust grass density based on LOD level
                let patchCount;
                switch (lodLevel) {
                    case 'close':
                        patchCount = 2 + Math.floor(Math.random() * 3); // 2-4 patches
                        break;
                    case 'medium':
                        patchCount = 1 + Math.floor(Math.random() * 2); // 1-2 patches
                        break;
                    default:
                        patchCount = 1; // Single patch
                }
                
                console.log(`🌿 Creating ${patchCount} grass patches (LOD: ${lodLevel}, distance: ${distance.toFixed(1)})`);
                
                for (let i = 0; i < patchCount; i++) {
                    // Clone the full detail model
                    const grassMesh = this.cloneShapeForgeModel(fullDetailGrass);
                    
                    if (grassMesh) {
                        // Apply dynamic LOD to this instance
                        this.applyDynamicLOD(grassMesh, lodLevel);
                        
                        // Store tile coordinates for dynamic updates
                        grassMesh.userData.tileCol = tileCol;
                        grassMesh.userData.tileRow = tileRow;
                        grassMesh.userData.modelType = 'grass';
                        
                        // Random position within tile bounds
                        const randomX = (Math.random() - 0.5) * this.tileSize * 0.7;
                        const randomZ = (Math.random() - 0.5) * this.tileSize * 0.7;
                        
                        // Scale variation based on LOD
                        let scale;
                        switch (lodLevel) {
                            case 'close':
                                scale = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
                                break;
                            case 'medium':
                                scale = 0.6 + Math.random() * 0.3; // 0.6x to 0.9x (smaller)
                                break;
                            default:
                                scale = 0.5; // Fixed small size
                        }
                        
                        // Random rotation for variety (except for far LOD)
                        const rotation = lodLevel === 'far' ? 0 : Math.random() * Math.PI * 2;
                        
                        grassMesh.position.set(randomX, 0, randomZ);
                        grassMesh.scale.setScalar(scale);
                        grassMesh.rotation.y = rotation;
                        
                        grassGroup.add(grassMesh);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cached grass, falling back to billboard:', error);
            // Fallback to original billboard method
            return this.createGrassFieldFallback();
        }
        
        return grassGroup;
    }
    
    // Load ShapeForge mountain model instead of billboard sprites  
    async loadSfMountain(tileCol = 0, tileRow = 0) {
        console.log('🏔️ Loading cached mountain model...');
        const mountainGroup = new THREE.Group();
        
        // Calculate distance and LOD level
        const distance = this.calculateTileDistance(tileCol, tileRow);
        const lodLevel = this.getLODLevel(distance);
        
        // Skip mountains entirely if too far (culled)
        if (lodLevel === 'culled') {
            console.log(`🏔️ Culling mountain at distance ${distance.toFixed(1)}`);
            this.lodStats.tilesCulled++;
            this.lodStats.lodBreakdown.culled++;
            return mountainGroup; // Return empty group
        }
        
        this.lodStats.tilesRendered++;
        this.lodStats.lodBreakdown[lodLevel]++;
        
        console.log(`🏔️ Creating mountain (LOD: ${lodLevel}, distance: ${distance.toFixed(1)})`);
        
        try {
            // Load full detail mountain model from cache
            const fullDetailMountain = await this.loadShapeForgeModelCached('mountain');
            
            if (fullDetailMountain) {
                // Clone the full detail model
                const mountainMesh = this.cloneShapeForgeModel(fullDetailMountain);
                
                if (mountainMesh) {
                    console.log(`✅ Mountain mesh created from cache (will apply LOD: ${lodLevel}) - adding to scene`);
                    
                    // Apply dynamic LOD to this instance
                    this.applyDynamicLOD(mountainMesh, lodLevel);
                    
                    // Store tile coordinates for dynamic updates
                    mountainMesh.userData.tileCol = tileCol;
                    mountainMesh.userData.tileRow = tileRow;
                    mountainMesh.userData.modelType = 'mountain';
                    
                    // Mountains are already properly sized and positioned
                    // No random positioning needed - they're meant to dominate the tile
                    mountainGroup.add(mountainMesh);
                } else {
                    console.warn('⚠️ Failed to clone mountain mesh from cached data');
                    // Fallback to original billboard method
                    const fallbackMountain = this.createMountainFieldFallback();
                    if (fallbackMountain) {
                        mountainGroup.add(fallbackMountain);
                    }
                }
            } else {
                console.warn('⚠️ Failed to load mountain from cache');
                const fallbackMountain = this.createMountainFieldFallback();
                if (fallbackMountain) {
                    mountainGroup.add(fallbackMountain);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cached mountain, falling back to billboard:', error);
            // Fallback to original billboard method
            const fallbackMountain = this.createMountainFieldFallback();
            if (fallbackMountain) {
                mountainGroup.add(fallbackMountain);
            }
        }
        
        return mountainGroup;
    }

       // Load ShapeForge castle model instead of billboard sprites  
    async loadSfCastle(tileCol = 0, tileRow = 0) {
        console.log('🏰 Loading cached castle model...');
        const castleGroup = new THREE.Group();
        
        // Calculate distance and LOD level
        const distance = this.calculateTileDistance(tileCol, tileRow);
        const lodLevel = this.getLODLevel(distance);
        
        // Skip castles entirely if too far (culled)
        if (lodLevel === 'culled') {
            console.log(`🏰 Culling castle at distance ${distance.toFixed(1)}`);
            this.lodStats.tilesCulled++;
            this.lodStats.lodBreakdown.culled++;
            return castleGroup; // Return empty group
        }
        
        this.lodStats.tilesRendered++;
        this.lodStats.lodBreakdown[lodLevel]++;
        
        console.log(`🏰 Creating castle (LOD: ${lodLevel}, distance: ${distance.toFixed(1)})`);
        
        try {
            // Load full detail castle model from cache
            const fullDetailCastle = await this.loadShapeForgeModelCached('castle');

            if (fullDetailCastle) {
                // Clone the full detail model
                const castleMesh = this.cloneShapeForgeModel(fullDetailCastle);
                
                if (castleMesh) {
                    console.log(`✅ Castle mesh created from cache (will apply LOD: ${lodLevel}) - adding to scene`);
                    
                    // Apply dynamic LOD to this instance
                    this.applyDynamicLOD(castleMesh, lodLevel);
                    
                    // Store tile coordinates for dynamic updates
                    castleMesh.userData.tileCol = tileCol;
                    castleMesh.userData.tileRow = tileRow;
                    castleMesh.userData.modelType = 'castle';
                    
                    // Castles are already properly sized and positioned
                    // No random positioning needed - they're meant to dominate the tile
                    castleGroup.add(castleMesh);
                } else {
                    console.warn('⚠️ Failed to clone castle mesh from cached data');
                    // Fallback to original billboard method
                    const fallbackCastle = this.createCastleFieldFallback();
                    if (fallbackCastle) {
                        castleGroup.add(fallbackCastle);
                    }
                }
            } else {
                console.warn('⚠️ Failed to load castle from cache');
                const fallbackCastle = this.createCastleFieldFallback();
                if (fallbackCastle) {
                    castleGroup.add(fallbackCastle);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cached castle, falling back to billboard:', error);
            // Fallback to original billboard method
            const fallbackCastle = this.createCastleFieldFallback();
            if (fallbackCastle) {
                castleGroup.add(fallbackCastle);
            }
        }

        return castleGroup;
    }
    
    // Create a Three.js mesh from ShapeForge model data
    createShapeForgeModel(shapeforgeData) {
        if (!shapeforgeData.objects || shapeforgeData.objects.length === 0) {
            console.warn('⚠️ No objects found in ShapeForge data');
            return null;
        }
        
        // Check for workspace size (v1.3 support)
        let workspaceScale = 1.0;
        if (shapeforgeData.workspaceSize) {
            console.log(`🎯 Loading v1.3 ShapeForge with workspace: ${shapeforgeData.workspaceSize.x}x${shapeforgeData.workspaceSize.y}x${shapeforgeData.workspaceSize.z}`);
            // Scale based on workspace vs tile size ratio
            const maxWorkspaceDimension = Math.max(shapeforgeData.workspaceSize.x, shapeforgeData.workspaceSize.y, shapeforgeData.workspaceSize.z);
            workspaceScale = this.tileSize / maxWorkspaceDimension;
        }
        
        const modelGroup = new THREE.Group();
        
        shapeforgeData.objects.forEach(obj => {
            let geometry;
            
            if (obj.geometryData) {
                // Handle complex merged objects with geometryData
                geometry = new THREE.BufferGeometry();
                
                // Convert vertices to Three.js format
                const vertices = new Float32Array(obj.geometryData.vertices);
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                
                // Handle both indices and faces formats (v1.3 compatibility)
                if (obj.geometryData.indices && obj.geometryData.indices.length > 0) {
                    geometry.setIndex(obj.geometryData.indices);
                } else if (obj.geometryData.faces && obj.geometryData.faces.length > 0) {
                    // Convert faces format to indices format
                    const indices = [];
                    for (let i = 0; i < obj.geometryData.faces.length; i += 3) {
                        indices.push(obj.geometryData.faces[i]);
                        indices.push(obj.geometryData.faces[i + 1]);
                        indices.push(obj.geometryData.faces[i + 2]);
                    }
                    geometry.setIndex(indices);
                }
                
                // Add normals if available
                if (obj.geometryData.normals) {
                    const normals = new Float32Array(obj.geometryData.normals);
                    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                } else {
                    geometry.computeVertexNormals();
                }
                
                // Add UVs if available
                if (obj.geometryData.uvs) {
                    const uvs = new Float32Array(obj.geometryData.uvs);
                    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                }
            } else if (obj.type && obj.parameters) {
                // Handle primitive objects (cone, sphere, cube, etc.)
                switch (obj.type) {
                    case 'cone':
                        geometry = new THREE.ConeGeometry(
                            obj.parameters.radius || 0.5,
                            obj.parameters.height || 1,
                            obj.parameters.radialSegments || 8
                        );
                        break;
                    case 'cube':
                    case 'box':
                        geometry = new THREE.BoxGeometry(
                            obj.parameters.width || 1,
                            obj.parameters.height || 1,
                            obj.parameters.depth || 1
                        );
                        break;
                    case 'sphere':
                        geometry = new THREE.SphereGeometry(
                            obj.parameters.radius || 0.5,
                            obj.parameters.widthSegments || 16,
                            obj.parameters.heightSegments || 12
                        );
                        break;
                    case 'cylinder':
                        geometry = new THREE.CylinderGeometry(
                            obj.parameters.radiusTop || 0.5,
                            obj.parameters.radiusBottom || 0.5,
                            obj.parameters.height || 1,
                            obj.parameters.radialSegments || 8
                        );
                        break;
                    case 'plane':
                        geometry = new THREE.PlaneGeometry(
                            obj.parameters.width || 1,
                            obj.parameters.height || 1
                        );
                        break;
                    default:
                        console.warn(`Unsupported object type: ${obj.type}`);
                        geometry = new THREE.BoxGeometry(1, 1, 1); // fallback
                }
            } else {
                console.warn('Object has neither geometryData nor valid type/parameters');
                return; // skip this object
            }
            
            if (geometry) {
                // Create material from ShapeForge data
                const material = new THREE.MeshLambertMaterial({
                    color: obj.material?.color || 0x4a7c59,
                    transparent: obj.material?.transparent || false,
                    opacity: obj.material?.opacity || 1.0,
                    side: THREE.DoubleSide // Show both sides for grass blades
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                // Apply position, rotation, scale from ShapeForge data with workspace scaling
                if (obj.position) {
                    mesh.position.set(
                        obj.position.x * workspaceScale, 
                        obj.position.y * workspaceScale, 
                        obj.position.z * workspaceScale
                    );
                }
                if (obj.rotation) {
                    mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                }
                if (obj.scale) {
                    mesh.scale.set(
                        obj.scale.x * workspaceScale, 
                        obj.scale.y * workspaceScale, 
                        obj.scale.z * workspaceScale
                    );
                }
                
                modelGroup.add(mesh);
            }
        });
        
        console.log(`✅ Created ShapeForge model with ${shapeforgeData.objects.length} objects, workspace scale: ${workspaceScale.toFixed(2)}`);
        return modelGroup;
    }
    
    // Fallback method for grass if ShapeForge loading fails
    createGrassFieldFallback() {
        const grassGroup = new THREE.Group();
        
        // Simple fallback with fewer grass sprites
        const grassCount = 2 + Math.floor(Math.random() * 2);
        const size = this.getBillboardSize('grass');
        
        for (let i = 0; i < grassCount; i++) {
            const randomX = (Math.random() - 0.5) * this.tileSize * 0.8;
            const randomZ = (Math.random() - 0.5) * this.tileSize * 0.8;
            
            const geometry = new THREE.PlaneGeometry(size.width, size.height);
            const material = new THREE.MeshLambertMaterial({ 
                color: this.getTileColor('grass'),
                transparent: true,
                opacity: 0.8
            });
            
            const grassBillboard = new THREE.Mesh(geometry, material);
            grassBillboard.position.set(randomX, size.height / 2, randomZ);
            
            grassGroup.add(grassBillboard);
        }
        
        return grassGroup;
    }
    
    // Fallback method for mountains if ShapeForge loading fails
    createMountainFieldFallback() {
        const mountainGroup = new THREE.Group();
        
        // Simple fallback with single large mountain billboard
        const size = this.getBillboardSize('mountain');
        
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355,  // Mountain brown color
            transparent: true,
            opacity: 0.9
        });
        
        const mountainBillboard = new THREE.Mesh(geometry, material);
        mountainBillboard.position.set(0, size.height / 2, 0);
        
        mountainGroup.add(mountainBillboard);
        
        return mountainGroup;
    }
    
    // Fallback method for castles if ShapeForge loading fails
    createCastleFieldFallback() {
        const castleGroup = new THREE.Group();
        
        // Simple fallback with single large castle billboard
        const size = this.getBillboardSize('castle');
        
        const geometry = new THREE.PlaneGeometry(size.width, size.height);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x696969,  // Castle gray color
            transparent: true,
            opacity: 0.9
        });
        
        const castleBillboard = new THREE.Mesh(geometry, material);
        castleBillboard.position.set(0, size.height / 2, 0);
        
        castleGroup.add(castleBillboard);
        
        return castleGroup;
    }
}

// Export for global use
window.ThreeMapRenderer = ThreeMapRenderer;