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
        
        // Setup HP/MP UI overlay
        this.setupHealthBars();
        
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
     * Setup HP/MP bars overlay for players and enemies
     */
    setupHealthBars() {
        // Create main health bars container
        this.healthBarsContainer = document.createElement('div');
        this.healthBarsContainer.id = 'combat-health-bars';
        this.healthBarsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        this.container.appendChild(this.healthBarsContainer);

        // Create unified combat tracker (players + enemies)
        this.combatTrackerContainer = document.createElement('div');
        this.combatTrackerContainer.id = 'party-health-container';
        this.combatTrackerContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            pointer-events: auto;
            max-height: 40%;
            overflow-y: auto;
            padding: 12px;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 12px;
            border: 2px solid rgba(100, 149, 237, 0.6);
            backdrop-filter: blur(8px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        `;
        this.healthBarsContainer.appendChild(this.combatTrackerContainer);

        // Legacy reference for compatibility
        this.partyHealthContainer = this.combatTrackerContainer;

        // Create floating numbers container (for damage/healing numbers)
        this.floatingNumbersContainer = document.createElement('div');
        this.floatingNumbersContainer.id = 'floating-numbers-container';
        this.floatingNumbersContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 110;
        `;
        this.healthBarsContainer.appendChild(this.floatingNumbersContainer);

        console.log('💊 Unified combat tracker initialized');
    }

    /**
     * Create player health bar
     */
    createPlayerHealthBar(characterData) {
        const playerId = characterData.id || 'player';
        
        // Remove existing bar if present
        const existing = document.getElementById(`player-health-${playerId}`);
        if (existing) existing.remove();

        // Create player health bar container
        const playerBar = document.createElement('div');
        playerBar.id = `player-health-${playerId}`;
        playerBar.className = 'player-health-bar';
        playerBar.style.cssText = `
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid rgba(100, 149, 237, 0.8);
            border-radius: 8px;
            padding: 8px 12px;
            min-width: 280px;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        // Avatar image
        const avatar = document.createElement('img');
        // Match the avatar URL logic used in turn order
        const avatarUrl = characterData.personal?.avatarUrl || characterData.avatarUrl || characterData.avatar || '/assets/avatars/default.png';
        avatar.src = avatarUrl;
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 12px;
            border: 2px solid rgba(100, 149, 237, 0.6);
            object-fit: cover;
        `;
        avatar.onerror = () => avatar.src = '/assets/avatars/default.png';

        // Character info container
        const infoContainer = document.createElement('div');
        infoContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        // Character name
        const nameLabel = document.createElement('div');
        nameLabel.textContent = characterData.name || 'Player';
        nameLabel.style.cssText = `
            color: #e6f3ff;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;

        // HP Bar
        const hpContainer = this.createBarContainer('HP', '#e74c3c', '#c0392b');
        const hpBar = hpContainer.querySelector('.bar-fill');
        const hpText = hpContainer.querySelector('.bar-text');
        
        // MP Bar (if character has MP)
        let mpContainer = null;
        if (characterData.maxMp && characterData.maxMp > 0) {
            mpContainer = this.createBarContainer('MP', '#3498db', '#2980b9');
        }

        // Assemble the player bar
        infoContainer.appendChild(nameLabel);
        infoContainer.appendChild(hpContainer);
        if (mpContainer) infoContainer.appendChild(mpContainer);
        
        playerBar.appendChild(avatar);
        playerBar.appendChild(infoContainer);
        
        // Store references for updates
        playerBar._hpBar = hpBar;
        playerBar._hpText = hpText;
        if (mpContainer) {
            playerBar._mpBar = mpContainer.querySelector('.bar-fill');
            playerBar._mpText = mpContainer.querySelector('.bar-text');
        }

        this.partyHealthContainer.appendChild(playerBar);
        
        // Update with current values
        this.updatePlayerHealthBar(playerId, characterData);
        
        console.log(`💚 Created player health bar for ${characterData.name}`);
        return playerBar;
    }

    /**
     * Create a generic bar container (HP or MP)
     */
    createBarContainer(label, fillColor, borderColor) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        // Label
        const labelElement = document.createElement('span');
        labelElement.textContent = label;
        labelElement.style.cssText = `
            color: #e6f3ff;
            font-size: 12px;
            font-weight: bold;
            min-width: 24px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;

        // Bar background
        const barBg = document.createElement('div');
        barBg.style.cssText = `
            flex: 1;
            height: 16px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid ${borderColor};
            border-radius: 8px;
            position: relative;
            overflow: hidden;
        `;

        // Bar fill
        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        barFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, ${fillColor}, ${borderColor});
            border-radius: 7px;
            transition: width 0.3s ease;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
            width: 100%;
        `;

        // Bar text
        const barText = document.createElement('span');
        barText.className = 'bar-text';
        barText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 11px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            z-index: 1;
        `;

        barBg.appendChild(barFill);
        barBg.appendChild(barText);
        container.appendChild(labelElement);
        container.appendChild(barBg);

        return container;
    }

    /**
     * Update player health bar values
     */
    updatePlayerHealthBar(playerId, characterData) {
        const playerBar = document.getElementById(`player-health-${playerId}`);
        if (!playerBar) return;

        const currentHp = characterData.hp || characterData.currentHp || 0;
        const maxHp = characterData.maxHp || 100;
        const currentMp = characterData.mp || characterData.currentMp || 0;
        const maxMp = characterData.maxMp || 0;

        // Update HP
        if (playerBar._hpBar && playerBar._hpText) {
            const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
            playerBar._hpBar.style.width = `${hpPercent}%`;
            playerBar._hpText.textContent = `${currentHp}/${maxHp}`;
            
            // Color coding for low health
            if (hpPercent <= 25) {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            } else if (hpPercent <= 50) {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            } else {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #27ae60, #229954)';
            }
        }

        // Update MP (if exists)
        if (playerBar._mpBar && playerBar._mpText && maxMp > 0) {
            const mpPercent = Math.max(0, Math.min(100, (currentMp / maxMp) * 100));
            playerBar._mpBar.style.width = `${mpPercent}%`;
            playerBar._mpText.textContent = `${currentMp}/${maxMp}`;
        }
    }

    /**
     * Create enemy health bar in unified combat tracker
     */
    createEnemyHealthBar(enemyData, position) {
        const enemyId = enemyData.id;
        
        // Remove existing bar if present
        const existing = document.getElementById(`enemy-health-${enemyId}`);
        if (existing) existing.remove();

        // Create enemy tracker card
        const enemyCard = document.createElement('div');
        enemyCard.id = `enemy-health-${enemyId}`;
        enemyCard.className = 'enemy-health-bar combat-tracker-card';
        enemyCard.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(139, 0, 0, 0.9);
            border: 2px solid rgba(255, 107, 107, 0.8);
            border-radius: 10px;
            padding: 8px 10px;
            min-width: 120px;
            max-width: 160px;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 12px rgba(139, 0, 0, 0.5);
            transition: all 0.3s ease;
            position: relative;
        `;

        // Enemy name with revenge indicator
        const nameContainer = document.createElement('div');
        nameContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            width: 100%;
            justify-content: center;
            position: relative;
            margin-bottom: 6px;
        `;
        
        const nameLabel = document.createElement('div');
        nameLabel.textContent = enemyData.name;
        nameLabel.style.cssText = `
            color: #ffdddd;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            text-align: center;
        `;
        
        // Check if this enemy has the player's stolen loot
        let hasPlayerLoot = false;
        if (window.combatManager && window.combatManager.currentRevengeEncounter) {
            const revengeEnemy = window.combatManager.currentRevengeEncounter.enemyType;
            hasPlayerLoot = (revengeEnemy === enemyData.name || revengeEnemy === enemyData.type);
        }
        
        nameContainer.appendChild(nameLabel);
        
        // Add revenge indicator if this enemy has player's loot
        if (hasPlayerLoot) {
            const revengeIndicator = document.createElement('div');
            revengeIndicator.innerHTML = '💰';
            revengeIndicator.style.cssText = `
                position: absolute;
                top: -6px;
                right: -6px;
                font-size: 16px;
                filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
                animation: pulse 1.5s ease-in-out infinite;
            `;
            
            // Add pulsing animation CSS if not already added
            if (!document.getElementById('revenge-indicator-animation')) {
                const style = document.createElement('style');
                style.id = 'revenge-indicator-animation';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.8; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            nameContainer.appendChild(revengeIndicator);
            console.log(`💰 Added revenge indicator to ${enemyData.name} - they have your loot!`);
        }

        // Enemy avatar/icon (using default enemy icon for now)
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-bottom: 6px;
            border: 2px solid rgba(255, 107, 107, 0.6);
            background: linear-gradient(135deg, #8b0000, #dc143c);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        avatar.textContent = '👹'; // Default enemy icon

        // HP Bar Container
        const hpContainer = document.createElement('div');
        hpContainer.style.cssText = `
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        // HP Bar
        const hpBarBg = document.createElement('div');
        hpBarBg.style.cssText = `
            width: 100%;
            height: 14px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #8b0000;
            border-radius: 7px;
            position: relative;
            overflow: hidden;
        `;

        const hpBarFill = document.createElement('div');
        hpBarFill.className = 'bar-fill';
        hpBarFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #dc143c, #8b0000);
            border-radius: 6px;
            transition: width 0.3s ease;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
            width: 100%;
        `;

        const hpBarText = document.createElement('span');
        hpBarText.className = 'bar-text';
        hpBarText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            z-index: 1;
        `;

        // Assemble the enemy card
        hpBarBg.appendChild(hpBarFill);
        hpBarBg.appendChild(hpBarText);
        hpContainer.appendChild(hpBarBg);
        
        enemyCard.appendChild(nameContainer);
        enemyCard.appendChild(avatar);
        enemyCard.appendChild(hpContainer);
        
        // Store references for updates
        enemyCard._hpBar = hpBarFill;
        enemyCard._hpText = hpBarText;
        enemyCard._enemyData = enemyData;

        // Add to unified tracker
        this.combatTrackerContainer.appendChild(enemyCard);
        
        // Update with current values
        this.updateEnemyHealthBar(enemyId, enemyData);
        
        console.log(`💀 Added enemy ${enemyData.name} to unified combat tracker`);
        return enemyCard;
    }

    /**
     * Update enemy health bar values
     */
    updateEnemyHealthBar(enemyId, enemyData) {
        const enemyCard = document.getElementById(`enemy-health-${enemyId}`);
        if (!enemyCard) return;

        const currentHp = enemyData.hp || 0;
        const maxHp = enemyData.maxHp || enemyData.hp || 1;

        // Update HP bar
        if (enemyCard._hpBar && enemyCard._hpText) {
            const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
            enemyCard._hpBar.style.width = `${hpPercent}%`;
            enemyCard._hpText.textContent = `${currentHp}/${maxHp}`;
            
            // Color coding for enemy health
            if (hpPercent <= 20) {
                enemyCard._hpBar.style.background = 'linear-gradient(90deg, #8b0000, #660000)';
            } else if (hpPercent <= 50) {
                enemyCard._hpBar.style.background = 'linear-gradient(90deg, #ff4500, #cc3300)';
            } else {
                enemyCard._hpBar.style.background = 'linear-gradient(90deg, #dc143c, #8b0000)';
            }
        }

        console.log(`🩸 Updated enemy health: ${enemyData.name} ${currentHp}/${maxHp} HP`);
    }

    /**
     * Convert 3D world position to 2D screen coordinates
     */
    worldToScreen(x, y, z) {
        const vector = new THREE.Vector3(x, y, z);
        vector.project(this.camera);
        
        const widthHalf = this.container.clientWidth / 2;
        const heightHalf = this.container.clientHeight / 2;
        
        return {
            x: (vector.x * widthHalf) + widthHalf,
            y: -(vector.y * heightHalf) + heightHalf
        };
    }

    /**
     * Remove enemy health bar
     */
    removeEnemyHealthBar(enemyId) {
        const enemyBar = document.getElementById(`enemy-health-${enemyId}`);
        if (enemyBar) {
            enemyBar.remove();
            console.log(`🗑️ Removed health bar for enemy ${enemyId}`);
        }
    }

    /**
     * Show floating damage/healing number with progressive scaling
     */
    showFloatingNumber({ memberName, amount, type, damageType, isMaxDamage, isTopTier, percentile }) {
        // Get position for the floating number
        const position = this.getFloatingNumberPosition(memberName);
        if (!position) return;

        // Create floating number element
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-combat-number';
        
        // Calculate font size based on damage percentile (12px to 32px)
        const baseFontSize = 12;
        const maxFontSize = 32;
        const fontScale = (percentile / 100) * (maxFontSize - baseFontSize) + baseFontSize;
        const fontSize = Math.max(baseFontSize, Math.min(maxFontSize, fontScale));

        // Determine styling
        const isHealing = type === 'healing';
        const isMagical = damageType === 'magical';
        
        let color = isHealing ? '#22c55e' : '#ef4444'; // Green for healing, red for damage
        let fontWeight = 'normal';
        let textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        let prefix = isHealing ? '+' : '-';

        // Top 10% damage gets bold styling
        if (isTopTier && !isHealing) {
            fontWeight = 'bold';
        }

        // Magical damage gets bold in top 10%
        if (isMagical && isTopTier) {
            fontWeight = 'bold';
            textShadow = '2px 2px 6px rgba(138, 43, 226, 0.8)'; // Purple shadow for magic
        }

        // Critical hit (max damage) gets special styling
        if (isMaxDamage) {
            color = '#ffd700'; // Gold for critical hits
            fontWeight = 'bold';
            textShadow = '3px 3px 8px rgba(255, 215, 0, 0.6)';
            prefix = 'CRIT -';
        }

        floatingNumber.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            color: ${color};
            text-shadow: ${textShadow};
            font-family: 'Segoe UI', sans-serif;
            pointer-events: none;
            z-index: 200;
            animation: floatUp 2s ease-out forwards;
            transform-origin: center;
        `;

        floatingNumber.textContent = `${prefix}${amount}`;
        
        // Add animation keyframes if not already present
        this.ensureFloatingNumberStyles();
        
        this.floatingNumbersContainer.appendChild(floatingNumber);

        // Remove after animation
        setTimeout(() => {
            if (floatingNumber.parentNode) {
                floatingNumber.remove();
            }
        }, 2000);

        console.log(`💥 Floating ${type}: ${amount} (${fontSize.toFixed(1)}px, ${percentile.toFixed(1)}%)`);
    }

    /**
     * Get position for floating number based on member
     */
    getFloatingNumberPosition(memberName) {
        // Check if it's a player
        const playerBar = document.getElementById(`player-health-${memberName}`);
        if (playerBar) {
            const rect = playerBar.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 20
            };
        }

        // Check if it's an enemy
        const enemyBar = document.getElementById(`enemy-health-${memberName}`);
        if (enemyBar) {
            const rect = enemyBar.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 30
            };
        }

        // If enemy health bar not found, try to use 3D enemy position
        const enemy = this.enemies.get(memberName);
        if (enemy) {
            const enemyPosition = enemy.position;
            const screenPosition = this.worldToScreen(
                enemyPosition.x, 
                enemyPosition.y + 2, // Slightly above enemy
                enemyPosition.z
            );
            console.log(`📍 Using 3D position for floating number: ${memberName} at (${screenPosition.x}, ${screenPosition.y})`);
            return {
                x: screenPosition.x,
                y: screenPosition.y
            };
        }

        // Final fallback to center if member not found at all
        console.warn(`⚠️ No position found for floating number: ${memberName}, using center fallback`);
        return {
            x: this.container.clientWidth / 2,
            y: this.container.clientHeight / 2
        };
    }

    /**
     * Ensure floating number CSS animations are available
     */
    ensureFloatingNumberStyles() {
        if (document.getElementById('floating-number-styles')) return;

        const style = document.createElement('style');
        style.id = 'floating-number-styles';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                20% {
                    transform: translateY(-10px) scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-80px) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
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
        
        // Create enemy health bar
        this.createEnemyHealthBar(enemyData, position);
        
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
        console.log(`💀 Starting removal of enemy: ${enemyId}`);
        
        // Remove health bar immediately to prevent confusion
        this.removeEnemyHealthBar(enemyId);
        
        // Remove sprite cylinder
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            this.scene.remove(enemy);
            // Delay removal from enemies map to allow floating numbers to find position
            setTimeout(() => {
                this.enemies.delete(enemyId);
                console.log(`🗑️ Delayed removal of enemy from map: ${enemyId}`);
            }, 3000); // 3 seconds should be enough for floating numbers
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
        
        console.log(`💀 Removed enemy from scene: ${enemyId}`);
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
        
        // Update enemy health bar positions (in case camera moves)
        this.enemies.forEach((enemy, enemyId) => {
            const healthBar = document.getElementById(`enemy-health-${enemyId}`);
            if (healthBar && healthBar._position) {
                const screenPosition = this.worldToScreen(
                    healthBar._position.x, 
                    healthBar._position.y + 3, 
                    healthBar._position.z
                );
                healthBar.style.left = `${screenPosition.x}px`;
                healthBar.style.top = `${screenPosition.y}px`;
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
     * Initialize player health bars for the party
     */
    initializePlayerHealthBars(partyMembers) {
        // Clear existing player bars
        this.partyHealthContainer.innerHTML = '';
        
        partyMembers.forEach(member => {
            this.createPlayerHealthBar(member);
        });
        
        console.log(`💚 Initialized health bars for ${partyMembers.length} party members`);
    }

    /**
     * Update player health bar by character ID
     */
    updatePlayerHealth(characterId, hp, mp = null) {
        const playerBar = document.getElementById(`player-health-${characterId}`);
        if (!playerBar) return;

        // Update HP
        if (playerBar._hpBar && playerBar._hpText) {
            const hpText = playerBar._hpText.textContent;
            const maxHp = parseInt(hpText.split('/')[1]) || 100;
            const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
            
            playerBar._hpBar.style.width = `${hpPercent}%`;
            playerBar._hpText.textContent = `${hp}/${maxHp}`;
            
            // Color coding for low health
            if (hpPercent <= 25) {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            } else if (hpPercent <= 50) {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            } else {
                playerBar._hpBar.style.background = 'linear-gradient(90deg, #27ae60, #229954)';
            }
        }

        // Update MP if provided
        if (mp !== null && playerBar._mpBar && playerBar._mpText) {
            const mpText = playerBar._mpText.textContent;
            const maxMp = parseInt(mpText.split('/')[1]) || 100;
            const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));
            
            playerBar._mpBar.style.width = `${mpPercent}%`;
            playerBar._mpText.textContent = `${mp}/${maxMp}`;
        }
    }

    /**
     * Update enemy health bar by enemy ID
     */
    updateEnemyHealth(enemyId, hp, mp = null) {
        const enemyBar = document.getElementById(`enemy-health-${enemyId}`);
        if (!enemyBar) return;

        // Update HP bar
        if (enemyBar._hpBar) {
            // Try to get max HP from the bar or default to current HP as max
            const enemyData = { hp: hp, maxHp: enemyBar._maxHp || hp };
            const hpPercent = Math.max(0, Math.min(100, (hp / enemyData.maxHp) * 100));
            enemyBar._hpBar.style.width = `${hpPercent}%`;
            
            // Color coding for enemy health
            if (hpPercent <= 20) {
                enemyBar._hpBar.style.background = 'linear-gradient(90deg, #8b0000, #660000)';
            } else if (hpPercent <= 50) {
                enemyBar._hpBar.style.background = 'linear-gradient(90deg, #ff4500, #cc3300)';
            } else {
                enemyBar._hpBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            }
        }

        // Update MP bar (if exists and provided)
        if (mp !== null && enemyBar._mpBar) {
            const maxMp = enemyBar._maxMp || mp;
            const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));
            enemyBar._mpBar.style.width = `${mpPercent}%`;
        }
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