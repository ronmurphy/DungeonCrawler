/**
 * CombatRenderer - 3D rendering system for the Hexagonal Dungeon Gauntlet
 * Handles rotating sprite cylinders, hex bases, and 3D combat scene
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
        
        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
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
        
        console.log('🎨 CombatRenderer initialized');
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
     * Create dungeon floor
     */
    createDungeonFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333366,
            transparent: true,
            opacity: 0.8
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        
        this.scene.add(floor);
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
        // Cylinder geometry - tall and thin for sprite
        const cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 8);
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const spriteType = enemyData.spriteType || 'goblin';
        
        // Ready pose texture (default)
        const readyTexture = textureLoader.load(
            `assets/enemies/${spriteType}_ready_pose_enhanced.png`,
            () => console.log(`✅ Loaded ready texture for ${spriteType}`),
            undefined,
            (err) => console.warn(`⚠️ Failed to load ready texture for ${spriteType}:`, err)
        );
        
        // Attack pose texture
        const attackTexture = textureLoader.load(
            `assets/enemies/${spriteType}_attack_pose_enhanced.png`,
            () => console.log(`✅ Loaded attack texture for ${spriteType}`),
            undefined,
            (err) => console.warn(`⚠️ Failed to load attack texture for ${spriteType}:`, err)
        );
        
        // Configure textures
        [readyTexture, attackTexture].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.x = 1; // Single wrap around cylinder
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });
        
        // Create materials array - transparent for top/bottom, textured for sides
        const cylinderMaterials = [
            // Side material with sprite texture
            new THREE.MeshLambertMaterial({
                map: readyTexture,
                transparent: true,
                alphaTest: 0.1
            }),
            // Top face material (invisible)
            new THREE.MeshLambertMaterial({
                transparent: true,
                opacity: 0
            }),
            // Bottom face material (invisible)
            new THREE.MeshLambertMaterial({
                transparent: true,
                opacity: 0
            })
        ];
        
        // Create cylinder mesh with material array
        const spriteCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterials);
        spriteCylinder.position.set(position.x, position.y + 1.3, position.z); // Raised by 0.3 to hide top
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
            materials: cylinderMaterials // Store reference for texture swapping
        };
        
        this.scene.add(spriteCylinder);
        
        return spriteCylinder;
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
        
        // Update the side material (index 0) with new texture
        if (enemy.userData.materials && enemy.userData.materials[0]) {
            enemy.userData.materials[0].map = texture;
            enemy.userData.materials[0].needsUpdate = true;
        }
        enemy.userData.currentPose = pose;
        
        console.log(`🎭 ${enemyId} pose set to: ${pose}`);
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