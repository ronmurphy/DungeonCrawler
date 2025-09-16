/**
 * CombatRenderer - 3D rendering system for the Hexagonal Dungeon Gauntlet
 * Handles rotating sprite cylinders, hex bases, and 3D combat scene with dynamic textures
 */
export class CombatRenderer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.enemies = new Map(); // enemyId -> enemy object
        this.hexBases = new Map(); // enemyId -> hex base
        this.attackSelectors = new Map(); // enemyId -> attack selector
        
        // Animation
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        // Dynamic texture system
        this.currentEnvironment = null;
        this.textureLoader = new THREE.TextureLoader();
        
        // Debug mode for backdrop positioning
        this.debugMode = false;
        
        this.init();
    }

    /**
     * Select random environment textures for combat arena
     * Returns paired floor and backdrop wall textures
     */
    selectEnvironmentTextures() {
        // Available environment themes (pairs of floor + wall)
        const environments = [
            // Floor 1 - Starting dungeon areas
            'floor1_castle',
            'floor1_mall', 
            'floor1_suburban',
            // Floor 2 - Wilderness
            'floor2_wilderness', 
            // Floor 3 - Corporate
            'floor3_corporate',
            // Floor 4 - Carnival and Industrial
            'floor4_carnival',
            'floor4_iron_tangle',
            // Floor 5 - Elemental quadrants and school
            'floor5_air_quadrant',
            'floor5_bubbles',
            'floor5_land_quadrant',
            'floor5_school',
            'floor5_subterranean_quadrant',
            'floor5_water_quadrant',
            // Special environments
            'ocean'
        ];
        
        // Randomly select an environment
        const selectedEnv = environments[Math.floor(Math.random() * environments.length)];
        
        const environment = {
            name: selectedEnv,
            floorTexture: `assets/textures/${selectedEnv}_floor_texture.png`,
            wallTexture: `assets/textures/${selectedEnv}_backdrop_wall.png`
        };
        
        console.log(`🏛️ Selected combat environment: ${selectedEnv}`);
        return environment;
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        // Select environment textures for this combat
        this.currentEnvironment = this.selectEnvironmentTextures();
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        
        // Camera setup - "eye-level dungeon corridor" perspective
        this.camera = new THREE.PerspectiveCamera(
            50, // Slightly wider FOV for better immersion
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100
        );
        
        // Position camera for "eye-level dungeon perspective"
        // More forward, less high = more face-to-face with enemies
        this.camera.position.set(0, 3.5, -3);
        this.camera.lookAt(0, 1.5, 2); // Look slightly up at enemy eye level
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add to container
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting setup
        this.setupLighting();
        
        // Create dungeon floor
        this.createDungeonFloor();
        
        // Start animation loop
        this.animate();
        
        // Setup click detection
        this.setupClickDetection();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Setup backdrop positioning controls
        this.setupBackdropControls();
        
        console.log('🎨 CombatRenderer initialized');
    }

    /**
     * Setup keyboard controls for backdrop positioning (debug mode)
     */
    setupBackdropControls() {
        // Create coordinate display (hidden by default)
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            z-index: 1000;
            display: none;
        `;
        this.container.appendChild(this.coordDisplay);
        
        // Keyboard event listener
        this.keyHandler = (event) => {
            // Toggle debug mode with 'D' key
            if (event.key.toLowerCase() === 'd') {
                this.debugMode = !this.debugMode;
                this.coordDisplay.style.display = this.debugMode ? 'block' : 'none';
                console.log(`🐛 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
                if (this.debugMode) this.updateCoordDisplay();
                return;
            }
            
            // Test attack animation with 'A' key (works in both debug and normal mode)
            if (event.key.toLowerCase() === 'a') {
                if (this.enemies.size > 0) {
                    console.log('🎬 Testing attack animations for all enemies...');
                    this.enemies.forEach((enemy, enemyId) => {
                        this.playAttackAnimation(enemyId, 1200);
                    });
                } else {
                    console.log('📭 No enemies to animate');
                }
                return;
            }
            
            // Test rage animation with 'X' key (when HP < 20%)
            if (event.key.toLowerCase() === 'x') {
                if (this.enemies.size > 0) {
                    console.log('😡 Testing rage animation for first enemy...');
                    const firstEnemyId = this.enemies.keys().next().value;
                    if (firstEnemyId) {
                        this.playRageAnimation(firstEnemyId, 1000);
                    }
                } else {
                    console.log('📭 No enemies for rage animation');
                }
                return;
            }
            
            // Test defeat animation with 'C' key (fade to grey only, no removal)
            if (event.key.toLowerCase() === 'c') {
                if (this.enemies.size > 0) {
                    console.log('💀 Testing defeat animation for first enemy...');
                    const firstEnemyId = this.enemies.keys().next().value;
                    if (firstEnemyId) {
                        this.playDefeatAnimation(firstEnemyId, 2000);
                    }
                } else {
                    console.log('📭 No enemies to defeat');
                }
                return;
            }
            
            // Test full defeat (animation + removal) with 'Z' key
            if (event.key.toLowerCase() === 'z') {
                if (this.enemies.size > 0) {
                    console.log('⚰️ Testing full defeat for first enemy...');
                    const firstEnemyId = this.enemies.keys().next().value;
                    if (firstEnemyId) {
                        this.defeatEnemy(firstEnemyId, 2000);
                    }
                } else {
                    console.log('📭 No enemies to defeat');
                }
                return;
            }
            
            // Only allow backdrop controls in debug mode
            if (!this.debugMode || !this.backdrop) return;
            
            const step = 0.5;
            const rotStep = 0.1;
            const xStep = 0.25; // Smaller steps for fine X positioning
            
            switch(event.key) {
                case 'ArrowLeft':
                    this.backdrop.rotation.y -= rotStep;
                    break;
                case 'ArrowRight':
                    this.backdrop.rotation.y += rotStep;
                    break;
                case 'ArrowUp':
                    this.backdrop.position.z += step;
                    break;
                case 'ArrowDown':
                    this.backdrop.position.z -= step;
                    break;
                case 'q':
                case 'Q':
                    this.backdrop.position.x -= xStep;
                    break;
                case 'e':
                case 'E':
                    this.backdrop.position.x += xStep;
                    break;
                default:
                    return; // Don't update display for other keys
            }
            
            // Update coordinate display
            this.updateCoordDisplay();
        };
        
        window.addEventListener('keydown', this.keyHandler);
        
        console.log('🎮 Debug controls: Press "D" to toggle backdrop positioning mode');
        console.log('⚔️ Animation test: Press "A" to trigger attack animations for all enemies');
        console.log('� Rage test: Press "X" for rage animation (HP < 20%)');
        console.log('💀 Defeat test: Press "C" for fade-to-grey only, "Z" for defeat + removal');
    }

    /**
     * Update coordinate display
     */
    updateCoordDisplay() {
        if (!this.backdrop || !this.coordDisplay || !this.debugMode) return;
        
        this.coordDisplay.innerHTML = `
            <strong>🐛 DEBUG MODE</strong><br>
            <strong>Backdrop Position:</strong><br>
            X: ${this.backdrop.position.x.toFixed(2)}<br>
            Y: ${this.backdrop.position.y.toFixed(2)}<br>
            Z: ${this.backdrop.position.z.toFixed(2)}<br>
            <strong>Rotation:</strong><br>
            Y: ${this.backdrop.rotation.y.toFixed(2)}<br>
            <br>
            <small>↑↓ = Z position | ←→ = Y rotation</small><br>
            <small>Q/E = X position | Press D to toggle</small>
        `;
    }

    /**
     * Setup dramatic dungeon lighting
     */
    setupLighting() {
        // Ambient light (subtle)
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light (torchlight feel)
        const directionalLight = new THREE.DirectionalLight(0xff9040, 1.0);
        directionalLight.position.set(-5, 10, -2);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Blue mystical light from behind
        const backLight = new THREE.DirectionalLight(0x4080ff, 0.5);
        backLight.position.set(5, 5, 8);
        this.scene.add(backLight);
        
        // Point light for hex bases
        const hexLight = new THREE.PointLight(0x40ff80, 0.8, 20);
        hexLight.position.set(0, 5, 0);
        this.scene.add(hexLight);
    }

    /**
     * Create textured dungeon floor with selected environment theme
     */
    createDungeonFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        
        // Load the selected floor texture
        const floorTexture = this.textureLoader.load(
            this.currentEnvironment.floorTexture,
            () => console.log(`✅ Loaded floor texture: ${this.currentEnvironment.name}`),
            undefined,
            (err) => {
                console.warn(`⚠️ Failed to load floor texture: ${this.currentEnvironment.floorTexture}`, err);
                // Fallback to solid color if texture fails
            }
        );
        
        // Configure texture tiling for seamless floor - flip it to face the right direction
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(4, -4); // Negative Y to flip the texture orientation
        
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            map: floorTexture,
            transparent: false
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        
        this.scene.add(floor);
        
        // Now create the curved backdrop wall
        this.createCurvedBackdrop();
    }

    /**
     * Create curved backdrop wall with selected environment theme
     * Creates an arena-like depth effect behind enemies
     */
    createCurvedBackdrop() {
        // Create a cylindrical section for the backdrop (120° arc - less stretching)
        const backdropGeometry = new THREE.CylinderGeometry(
            12, 12,     // radius (top, bottom) 
            6,          // height 
            24,         // radial segments 
            1,          // height segments
            false,      // open ended
            Math.PI * 0.4,  // theta start - position arc behind enemies
            Math.PI * 0.6   // theta length - 108° arc (smaller = less stretching)
        );
        
        // Load the selected backdrop wall texture
        const wallTexture = this.textureLoader.load(
            this.currentEnvironment.wallTexture,
            () => console.log(`✅ Loaded wall texture: ${this.currentEnvironment.name}`),
            undefined,
            (err) => {
                console.warn(`⚠️ Failed to load wall texture: ${this.currentEnvironment.wallTexture}`, err);
            }
        );
        
        // Configure texture to prevent stretching - images are now pre-mirrored
        wallTexture.wrapS = THREE.ClampToEdgeWrapping;  // No horizontal repeat
        wallTexture.wrapT = THREE.ClampToEdgeWrapping;  // No vertical repeat
        wallTexture.repeat.set(1, 1);  // Single image, no additional mirroring needed
        wallTexture.offset.set(0, 0);  // Reset any offset
        
        const backdropMaterial = new THREE.MeshLambertMaterial({
            map: wallTexture,
            side: THREE.BackSide, // Only show on inside of cylinder (facing camera)
            transparent: false
        });
        
        this.backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
        
        // Set to the optimal position found through testing
        this.backdrop.position.set(0, 2, -1.5);  // Your latest tested coordinates
        this.backdrop.rotation.y = 4.10;         // Your latest tested rotation
        
        this.scene.add(this.backdrop);
        
        console.log(`🏛️ Created curved backdrop for ${this.currentEnvironment.name} environment`);
    }

    /**
     * Add enemy to the combat scene
     * @param {Object} enemyData - Enemy data from enemies.json
     * @param {number} index - Enemy index for positioning
     */
    addEnemy(enemyData, index) {
        const enemyId = enemyData.id;
        
        // Calculate position with depth scaling
        const position = this.calculateEnemyPosition(index, 1); // 1 enemy for now
        
        // Create hex base platform
        const hexBase = this.createHexBase(enemyId, position);
        this.hexBases.set(enemyId, hexBase);
        
        // Create rotating sprite cylinder
        const spriteCylinder = this.createSpriteCylinder(enemyData, position);
        this.enemies.set(enemyId, spriteCylinder);
        
        // Create attack selector
        const attackSelector = this.createAttackSelector(enemyId, position);
        this.attackSelectors.set(enemyId, attackSelector);
        
        console.log(`👹 Added enemy: ${enemyData.name} at position`, position);
        
        return {
            id: enemyId,
            name: enemyData.name,
            hp: enemyData.hp,
            maxHp: enemyData.maxHp || enemyData.hp,
            attacks: enemyData.attacks,
            mesh: spriteCylinder,
            hexBase: hexBase,
            attackSelector: attackSelector
        };
    }

    /**
     * Calculate enemy position with depth perspective
     */
    calculateEnemyPosition(index, totalEnemies) {
        // For now, single enemy in center
        // Later: spread enemies across corridor width with depth
        const baseDepth = 3; // Distance from player
        const depthVariation = index * 1.5; // Stagger depth for perspective
        
        return {
            x: 0, // Center for single enemy
            y: 0,
            z: baseDepth + depthVariation,
            scale: 1.0 - (depthVariation * 0.15) // Smaller = further away
        };
    }

    /**
     * Create hexagonal base platform
     */
    createHexBase(enemyId, position) {
        // Hexagon geometry
        const hexGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 6);
        
        // Glowing hex material
        const hexMaterial = new THREE.MeshPhongMaterial({
            color: 0x40ff80,
            emissive: 0x002020,
            transparent: true,
            opacity: 0.8
        });
        
        const hexBase = new THREE.Mesh(hexGeometry, hexMaterial);
        hexBase.position.set(position.x, position.y, position.z);
        hexBase.scale.setScalar(position.scale);
        hexBase.castShadow = false;
        hexBase.receiveShadow = true;
        
        // Add subtle glow animation data
        hexBase.userData = {
            enemyId: enemyId,
            baseIntensity: 0.002,
            pulseSpeed: 1.5,
            currentIntensity: 0.002
        };
        
        this.scene.add(hexBase);
        
        return hexBase;
    }

    /**
     * Create rotating sprite cylinder with your goblin textures
     */
    createSpriteCylinder(enemyData, position) {
        const spriteType = enemyData.spriteType || 'goblin';
        
        // Load ready pose texture first to get dimensions
        const textureLoader = new THREE.TextureLoader();
        const readyTexture = textureLoader.load(
            `assets/enemies/${spriteType}_ready_pose_enhanced.png`,
            (texture) => {
                console.log(`✅ Loaded ready texture for ${spriteType}`);
                // Update geometry based on texture aspect ratio
                this.updateSpriteGeometry(spriteCylinder, texture);
            },
            undefined,
            (err) => console.warn(`⚠️ Failed to load ready texture for ${spriteType}:`, err)
        );
        
        // Load attack pose texture
        const attackTexture = textureLoader.load(
            `assets/enemies/${spriteType}_attack_pose_enhanced.png`,
            () => console.log(`✅ Loaded attack texture for ${spriteType}`),
            undefined,
            (err) => console.warn(`⚠️ Failed to load attack texture for ${spriteType}:`, err)
        );
        
        // Create billboard plane geometry - simple flat sprite
        // const cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12);
        // cylinderGeometry.scale(1.0, 1, 0.5); // Oval approach - commented out
        
        // const boxGeometry = new THREE.BoxGeometry(1.6, 2.0, 0.2); // Box approach - commented out
        
        // Billboard plane approach - flat sprite that faces camera
        const planeGeometry = new THREE.PlaneGeometry(1.6, 2.0); // Will adjust width based on aspect ratio
        
        // Configure textures for box geometry - no wrapping needed
        [readyTexture, attackTexture].forEach(texture => {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, 1); // Single image, no repeating
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });
        
        // Create material for plane geometry - simple single-sided sprite
        const planeMaterial = new THREE.MeshLambertMaterial({
            map: readyTexture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide // Visible from both sides
        });
        
        // Create plane mesh - clean billboard sprite
        const spriteCylinder = new THREE.Mesh(planeGeometry, planeMaterial);
        spriteCylinder.position.set(position.x, position.y + 1.0, position.z);
        spriteCylinder.scale.setScalar(position.scale);
        spriteCylinder.castShadow = true;
        
        // Add animation and texture data
        spriteCylinder.userData = {
            enemyId: enemyData.id,
            enemyName: enemyData.name,
            readyTexture: readyTexture,
            attackTexture: attackTexture,
            currentPose: 'ready',
            shuffleSpeed: 0.5,
            shuffleAmount: 0.15, // ±15 degrees
            baseRotation: 0,
            position: position,
            materials: planeMaterial // Store reference for texture swapping
        };
        
        this.scene.add(spriteCylinder);
        
        return spriteCylinder;
    }

    /**
     * Update sprite geometry based on texture aspect ratio (for plane geometry)
     */
    updateSpriteGeometry(spriteMesh, texture) {
        if (!texture.image || !spriteMesh) return;
        
        const imageWidth = texture.image.width;
        const imageHeight = texture.image.height;
        const aspectRatio = imageWidth / imageHeight;
        
        console.log(`📐 Texture dimensions: ${imageWidth}x${imageHeight}, aspect ratio: ${aspectRatio.toFixed(2)}`);
        
        // For plane geometry, adjust the width to match aspect ratio
        const baseHeight = 2.0;
        const newWidth = baseHeight * aspectRatio;
        
        // Scale the plane to match texture aspect ratio
        spriteMesh.scale.x = (newWidth / 1.6) * spriteMesh.scale.x; // 1.6 was the initial width
        
        console.log(`🎪 Updated plane scaling: width=${newWidth.toFixed(2)}, height=${baseHeight}`);
    }

    /**
     * Create attack selector hexagon
     */
    createAttackSelector(enemyId, position) {
        // Small flat hexagon for attack selection
        const selectorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 6);
        const selectorMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4040,
            emissive: 0x200000,
            transparent: true,
            opacity: 0.9
        });
        
        const selector = new THREE.Mesh(selectorGeometry, selectorMaterial);
        
        // Position bottom-left of hex base
        selector.position.set(
            position.x - 0.8 * position.scale,
            position.y + 0.1,
            position.z - 0.8 * position.scale
        );
        selector.scale.setScalar(position.scale);
        
        // Initially hidden
        selector.visible = false;
        
        // Add click detection data
        selector.userData = {
            enemyId: enemyId,
            type: 'attackSelector',
            clickCallback: null
        };
        
        this.scene.add(selector);
        
        return selector;
    }

    /**
     * Show attack selector for enemy
     */
    showEnemyAttackSelector(enemyId, clickCallback) {
        const selector = this.attackSelectors.get(enemyId);
        if (selector) {
            selector.visible = true;
            selector.userData.clickCallback = clickCallback;
            console.log(`🎯 Attack selector shown for ${enemyId}`, selector.position);
            console.log(`📏 Selector scale: ${selector.scale.x}, visible: ${selector.visible}`);
        } else {
            console.warn(`⚠️ No attack selector found for ${enemyId}`);
        }
    }

    /**
     * Hide attack selector for enemy
     */
    hideEnemyAttackSelector(enemyId) {
        const selector = this.attackSelectors.get(enemyId);
        if (selector) {
            selector.visible = false;
            selector.userData.clickCallback = null;
            console.log(`🚫 Attack selector hidden for ${enemyId}`);
        }
    }

    /**
     * Set enemy pose (ready/attack)
     */
    setEnemyPose(enemyId, pose) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        const texture = pose === 'attack' 
            ? enemy.userData.attackTexture 
            : enemy.userData.readyTexture;
        
        // Update the material with new texture (billboard plane uses single material)
        if (enemy.userData.materials) {
            enemy.userData.materials.map = texture;
            enemy.userData.materials.needsUpdate = true;
        }
        enemy.userData.currentPose = pose;
        
        console.log(`🎭 ${enemyId} pose set to: ${pose}`);
    }

    /**
     * Play attack animation for enemy
     */
    playAttackAnimation(enemyId, duration = 1000) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) {
            console.warn(`⚠️ Cannot animate attack: enemy ${enemyId} not found`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            console.log(`⚔️ Playing attack animation for ${enemyId}`);
            
            // Store original values
            const originalPosition = {...enemy.position};
            const originalScale = {...enemy.scale};
            
            // Switch to attack pose
            this.setEnemyPose(enemyId, 'attack');
            
            // Animation timeline
            const startTime = Date.now();
            const phases = {
                windup: duration * 0.2,      // 20% - pull back and scale up
                strike: duration * 0.3,      // 30% - lunge forward
                recovery: duration * 0.5     // 50% - return to position
            };
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < phases.windup / duration) {
                    // Windup phase: pull back slightly, scale up
                    const windupProgress = progress / (phases.windup / duration);
                    const easeOut = 1 - Math.pow(1 - windupProgress, 3);
                    
                    enemy.position.z = originalPosition.z + 0.1 * easeOut;
                    enemy.scale.setScalar(originalScale.x * (1 + 0.15 * easeOut));
                    
                } else if (progress < (phases.windup + phases.strike) / duration) {
                    // Strike phase: lunge forward, slight scale down
                    const strikeProgress = (progress - phases.windup / duration) / (phases.strike / duration);
                    const easeInOut = 0.5 * (1 - Math.cos(strikeProgress * Math.PI));
                    
                    enemy.position.z = originalPosition.z + 0.1 - 0.4 * easeInOut;
                    enemy.scale.setScalar(originalScale.x * (1.15 - 0.05 * easeInOut));
                    
                } else {
                    // Recovery phase: return to original position and scale
                    const recoveryProgress = (progress - (phases.windup + phases.strike) / duration) / (phases.recovery / duration);
                    const easeOut = 1 - Math.pow(1 - recoveryProgress, 2);
                    
                    enemy.position.z = originalPosition.z + (0.1 - 0.4) * (1 - easeOut);
                    enemy.scale.setScalar(originalScale.x * (1.1 + (1 - 1.1) * easeOut));
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    // Animation complete - restore original state
                    enemy.position.copy(originalPosition);
                    enemy.scale.copy(originalScale);
                    this.setEnemyPose(enemyId, 'ready');
                    console.log(`✅ Attack animation complete for ${enemyId}`);
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Play rage animation for enemy (when HP < 20%)
     */
    playRageAnimation(enemyId, duration = 1000) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) {
            console.warn(`⚠️ Cannot animate rage: enemy ${enemyId} not found`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            console.log(`� Playing rage animation for ${enemyId}`);
            
            // Store original values
            const originalPosition = {...enemy.position};
            const originalScale = {...enemy.scale};
            
            // Switch to attack pose (rage mode)
            this.setEnemyPose(enemyId, 'attack');
            
            // Animation timeline - pure rage/struggle
            const startTime = Date.now();
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Continuous rage shake and scale pulsing
                const shakeIntensity = 0.08 * (1 - progress * 0.3); // Gradually reduce
                const pulseSpeed = 12; // Fast pulsing
                const scaleSpeed = 8; // Scale pulsing
                
                // Multi-directional shake
                const shakeX = Math.sin(progress * Math.PI * pulseSpeed) * shakeIntensity;
                const shakeY = Math.cos(progress * Math.PI * pulseSpeed * 1.3) * shakeIntensity * 0.5;
                const shakeZ = Math.sin(progress * Math.PI * pulseSpeed * 0.7) * shakeIntensity * 0.3;
                
                enemy.position.x = originalPosition.x + shakeX;
                enemy.position.y = originalPosition.y + shakeY;
                enemy.position.z = originalPosition.z + shakeZ;
                
                // Scale pulsing (rage breathing)
                const scalePulse = 1 + 0.15 * Math.sin(progress * Math.PI * scaleSpeed);
                enemy.scale.setScalar(originalScale.x * scalePulse);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    // Return to original position but keep attack pose
                    enemy.position.copy(originalPosition);
                    enemy.scale.copy(originalScale);
                    console.log(`😤 Rage animation complete for ${enemyId} - staying in attack pose`);
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Play defeat animation for enemy (fade to greyscale)
     */
    playDefeatAnimation(enemyId, duration = 2000) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) {
            console.warn(`⚠️ Cannot animate defeat: enemy ${enemyId} not found`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            console.log(`💀 Playing defeat animation for ${enemyId}`);
            
            // Store original values
            const originalMaterial = enemy.userData.materials;
            const originalTexture = originalMaterial.map;
            
            // Create a greyscale version using a shader material
            const greyMaterial = new THREE.MeshBasicMaterial({
                map: originalTexture,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            // Store original color for interpolation
            let originalColor = new THREE.Color(1, 1, 1);
            let greyColor = new THREE.Color(0.5, 0.5, 0.5);
            
            // Animation timeline
            const startTime = Date.now();
            const phases = {
                pause: duration * 0.2,      // 20% - brief pause
                greyFade: duration * 0.5,   // 50% - fade to grey
                finalFade: duration * 0.3   // 30% - fade to transparent
            };
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < phases.pause / duration) {
                    // Pause phase: brief moment before death
                    // Enemy becomes still, returns to ready pose
                    this.setEnemyPose(enemyId, 'ready');
                    
                } else if (progress < (phases.pause + phases.greyFade) / duration) {
                    // Grey fade phase: color drains away
                    const fadeProgress = (progress - phases.pause / duration) / (phases.greyFade / duration);
                    const easeInOut = 0.5 * (1 - Math.cos(fadeProgress * Math.PI));
                    
                    // Interpolate between original color and grey
                    const currentColor = new THREE.Color().lerpColors(originalColor, greyColor, easeInOut);
                    greyMaterial.color.copy(currentColor);
                    
                    // Apply the greying material
                    enemy.material = greyMaterial;
                    
                } else {
                    // Final fade phase: fade to transparent
                    const finalProgress = (progress - (phases.pause + phases.greyFade) / duration) / (phases.finalFade / duration);
                    const easeOut = 1 - Math.pow(1 - finalProgress, 3);
                    
                    // Fade opacity and scale down slightly
                    greyMaterial.opacity = 1 - (0.9 * easeOut);
                    const scaleReduction = 1 - (0.1 * easeOut);
                    enemy.scale.setScalar(enemy.scale.x * scaleReduction / (enemy.scale.x || 1) + scaleReduction - 1);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    console.log(`💀 Defeat animation complete for ${enemyId}`);
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Remove enemy from scene
     */
    removeEnemy(enemyId) {
        // Remove sprite cylinder
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            this.scene.remove(enemy);
            this.enemies.delete(enemyId);
        }
        
        // Remove hex base
        const hexBase = this.hexBases.get(enemyId);
        if (hexBase) {
            this.scene.remove(hexBase);
            this.hexBases.delete(enemyId);
        }
        
        // Remove attack selector
        const selector = this.attackSelectors.get(enemyId);
        if (selector) {
            this.scene.remove(selector);
            this.attackSelectors.delete(enemyId);
        }
        
        console.log(`💀 Removed enemy: ${enemyId}`);
    }

    /**
     * Defeat enemy with animation then remove from scene
     */
    async defeatEnemy(enemyId, animationDuration = 2000) {
        console.log(`⚰️ Defeating enemy: ${enemyId}`);
        
        // Play defeat animation (fade to greyscale)
        await this.playDefeatAnimation(enemyId, animationDuration);
        
        // Remove enemy after animation completes (including hex base and selector)
        this.removeEnemy(enemyId);
        
        console.log(`✅ Enemy ${enemyId} defeated and removed`);
        
        // Return a promise that can be used by combat system to delay victory screen
        return Promise.resolve();
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Animate sprite cylinders (subtle shuffle)
        this.enemies.forEach(enemy => {
            const userData = enemy.userData;
            
            // Shuffle rotation
            const shuffleOffset = Math.sin(elapsedTime * userData.shuffleSpeed) * userData.shuffleAmount;
            enemy.rotation.y = userData.baseRotation + shuffleOffset;
            
            // Slight vertical bob
            const bobOffset = Math.sin(elapsedTime * 0.8) * 0.05;
            enemy.position.y = userData.position.y + 1.3 + bobOffset; // Match new base position
        });
        
        // Animate hex bases (pulsing glow)
        this.hexBases.forEach(hexBase => {
            const userData = hexBase.userData;
            
            // Pulse the emissive intensity
            const pulse = Math.sin(elapsedTime * userData.pulseSpeed) * 0.5 + 0.5;
            const intensity = userData.baseIntensity + (pulse * userData.baseIntensity * 2);
            
            hexBase.material.emissive.setRGB(0, intensity, intensity);
            userData.currentIntensity = intensity;
        });
        
        // Animate attack selectors (when visible)
        this.attackSelectors.forEach(selector => {
            if (selector.visible) {
                // Spinning animation to draw attention
                selector.rotation.y += deltaTime * 2;
                
                // Pulsing color
                const pulse = Math.sin(elapsedTime * 3) * 0.3 + 0.7;
                selector.material.opacity = pulse;
            }
        });
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (!this.container.clientWidth || !this.container.clientHeight) return;
        
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    /**
     * Add click detection (simplified for Phase 1)
     */
    setupClickDetection() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (event) => {
            console.log('🖱️ Click detected in combat scene');
            
            // Prevent event bubbling to combat modal background
            event.stopPropagation();
            
            // Calculate mouse position
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            console.log(`🎯 Mouse position: ${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)}`);
            
            // Raycast
            raycaster.setFromCamera(mouse, this.camera);
            
            // Check attack selectors
            const selectorArray = Array.from(this.attackSelectors.values()).filter(s => s.visible);
            console.log(`🔍 Checking ${selectorArray.length} visible attack selectors`);
            
            const intersects = raycaster.intersectObjects(selectorArray);
            console.log(`💥 Found ${intersects.length} intersections`);
            
            if (intersects.length > 0) {
                const selectedSelector = intersects[0].object;
                const callback = selectedSelector.userData.clickCallback;
                
                console.log(`✅ Attack selector clicked for enemy: ${selectedSelector.userData.enemyId}`);
                
                if (callback) {
                    console.log('🎯 Triggering attack callback');
                    // Prevent further event propagation
                    event.preventDefault();
                    // For Phase 1, just trigger basic attack
                    callback('weapon');
                } else {
                    console.warn('⚠️ No callback found for attack selector');
                }
            } else {
                console.log('❌ No attack selectors hit');
            }
        });
        
        console.log('👆 Click detection setup complete');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove renderer from DOM
        if (this.renderer && this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Dispose of resources
        this.enemies.clear();
        this.hexBases.clear();
        this.attackSelectors.clear();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('🧹 CombatRenderer cleaned up');
    }
}