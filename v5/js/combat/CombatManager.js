/**
 * CombatManager - Main controller for the Hexagonal Dungeon Gauntlet System
 * Handles modal overlay, combat initialization, and coordination between subsystems
 */
export class CombatManager {
    constructor() {
        this.isActive = false;
        this.combatContainer = null;
        this.mapRenderer = null; // Reference to ThreeMapRenderer for pausing
        this.partyManager = null;
        this.combatRenderer = null;
        this.turnManager = null;
        
        // Combat state
        this.currentCombat = null;
        this.activeEnemies = [];
        this.combatLog = [];
        
        this.init();
    }

    init() {
        this.createCombatModal();
        this.setupEventListeners();
    }

    /**
     * Create the combat modal overlay
     * Positions above the 3D map but keeps chat FAB accessible
     */
    createCombatModal() {
        this.combatContainer = document.createElement('div');
        this.combatContainer.id = 'combat-modal';
        this.combatContainer.className = 'combat-modal hidden';
        this.combatContainer.innerHTML = `
            <div class="combat-content" onclick="event.stopPropagation()">
                <div class="combat-header">
                    <h3 class="combat-title">Combat Encounter</h3>
                    <button class="combat-close" style="display: none;">×</button>
                </div>
                <div class="combat-scene" id="combat-scene">
                    <!-- 3D combat renderer goes here -->
                    <div class="turn-order-overlay" id="turn-order-overlay">
                        <!-- Turn order portraits will go here -->
                    </div>
                </div>
                <div class="combat-ui">
                    <div class="combat-controls" id="combat-controls">
                        <!-- Attack menus and controls -->
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS for the modal
        this.addCombatCSS();
        
        // Append to body (above everything else)
        document.body.appendChild(this.combatContainer);
    }

    /**
     * Add CSS styles for combat modal
     */
    addCombatCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .combat-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.3s ease;
            }
            
            .combat-modal.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .combat-content {
                width: 95vw;
                height: 90vh;
                max-width: 1200px;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 15px;
                border: 2px solid #4a9eff;
                box-shadow: 0 20px 40px rgba(74, 158, 255, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .combat-header {
                padding: 15px 20px;
                background: rgba(74, 158, 255, 0.1);
                border-bottom: 1px solid #4a9eff;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .combat-title {
                color: #4a9eff;
                margin: 0;
                font-size: 1.2em;
                font-weight: bold;
            }
            
            .combat-scene {
                flex: 1;
                position: relative;
                background: radial-gradient(circle at center, #2a2a3e, #1a1a2e);
            }
            
            .turn-order-overlay {
                position: absolute;
                top: 15px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                z-index: 10;
                background: rgba(26, 26, 46, 0.8);
                padding: 10px 15px;
                border-radius: 25px;
                border: 2px solid #4a9eff;
                backdrop-filter: blur(5px);
            }
            
            .turn-portrait {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 3px solid #666;
                background-size: cover;
                background-position: center;
                position: relative;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .turn-portrait.active {
                border-color: #ffff00;
                box-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
                transform: scale(1.1);
            }
            
            .turn-portrait.enemy {
                border-color: #ff4444;
            }
            
            .turn-portrait.player {
                border-color: #4a9eff;
            }
            
            .turn-portrait::after {
                content: '';
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid #1a1a2e;
            }
            
            .turn-portrait.enemy::after {
                background: #ff4444;
            }
            
            .turn-portrait.player::after {
                background: #4a9eff;
            }
            
            .combat-ui {
                height: 80px;
                background: rgba(26, 26, 46, 0.9);
                border-top: 1px solid #4a9eff;
                display: flex;
                padding: 10px;
                gap: 15px;
            }
            
            .combat-controls {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .combat-content {
                    width: 98vw;
                    height: 95vh;
                    border-radius: 10px;
                }
                
                .combat-ui {
                    flex-direction: column;
                    height: auto;
                    max-height: 150px;
                }
                
                .initiative-tracker {
                    width: 100%;
                    height: 60px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // ESC key to close combat (for testing)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endCombat();
            }
        });
    }

    /**
     * Start a combat encounter
     * @param {Object} encounter - Combat encounter data
     * @param {Array} encounter.enemies - Array of enemy data from enemies.json
     * @param {Object} encounter.party - Party data
     * @param {Object} mapRenderer - Reference to ThreeMapRenderer to pause
     */
    async startCombat(encounter, mapRenderer) {
        if (this.isActive) {
            console.warn('Combat already active');
            return;
        }

        console.log('🔥 Starting Hexagonal Dungeon Gauntlet Combat!');
        
        this.isActive = true;
        this.mapRenderer = mapRenderer;
        this.currentCombat = encounter;
        
        // Pause the map renderer
        if (this.mapRenderer && this.mapRenderer.pauseRendering) {
            this.mapRenderer.pauseRendering();
        }
        
        // Show combat modal
        this.combatContainer.classList.remove('hidden');
        
        // Initialize combat subsystems
        await this.initializeCombatSystems();
        
        // Start the encounter
        this.processCombatStart();
    }

    /**
     * Initialize combat subsystems
     */
    async initializeCombatSystems() {
        // Import combat modules dynamically
        const { PartyManager } = await import('./PartyManager.js');
        const { CombatRenderer } = await import('./CombatRenderer.js');
        const { TurnManager } = await import('./TurnManager.js');
        
        // Initialize party manager
        this.partyManager = new PartyManager(this.currentCombat.party);
        
        // Initialize 3D combat renderer
        const sceneContainer = document.getElementById('combat-scene');
        this.combatRenderer = new CombatRenderer(sceneContainer);
        
        // Store TurnManager class for later initialization (after enemy data enhancement)
        this.TurnManager = TurnManager;
        
        console.log('✅ Combat subsystems initialized');
    }

    /**
     * Process combat start
     */
    processCombatStart() {
        // Ensure enemies have proper data structure for portrait system
        const enhancedEnemies = this.currentCombat.enemies.map(enemy => {
            // Make sure the enemy has the full data object for portraits
            if (enemy.data) {
                // If enemy already has data field, ensure spriteType is available
                enemy.data.spriteType = enemy.data.spriteType || enemy.spriteType || enemy.id || 'goblin';
            } else {
                // Create data field from enemy properties
                enemy.data = {
                    id: enemy.id,
                    name: enemy.name,
                    spriteType: enemy.spriteType || enemy.id || 'goblin',
                    hp: enemy.hp,
                    maxHp: enemy.maxHp,
                    level: enemy.level,
                    attacks: enemy.attacks
                };
            }
            return enemy;
        });
        
        // Update the current combat with enhanced enemies
        this.currentCombat.enemies = enhancedEnemies;
        
        // NOW initialize turn manager with enhanced enemy data
        this.turnManager = new this.TurnManager(
            this.partyManager.getPartyMembers(),
            enhancedEnemies,
            this
        );
        
        // Setup enemies in the 3D scene
        this.activeEnemies = enhancedEnemies.map((enemyData, index) => {
            return this.combatRenderer.addEnemy(enemyData, index);
        });
        
        // Update initiative tracker
        this.updateInitiativeDisplay();
        
        // Start first turn
        this.turnManager.startCombat();
        
        console.log(`⚔️ Combat started: ${this.partyManager.getPartySize()} vs ${this.activeEnemies.length}`);
        console.log('🎭 Enhanced enemies for portrait system:', enhancedEnemies);
    }

    /**
     * Update initiative tracker display with portraits
     */
    updateInitiativeDisplay() {
        const tracker = document.getElementById('turn-order-overlay');
        const turnOrder = this.turnManager.getTurnOrder();
        
        tracker.innerHTML = turnOrder.map((participant, index) => {
            const portraitUrl = this.getParticipantPortrait(participant);
            const activeClass = participant.isActive ? 'active' : '';
            const typeClass = participant.type === 'enemy' ? 'enemy' : 'player';
            
            return `
                <div class="turn-portrait ${activeClass} ${typeClass}" 
                     style="background-image: url('${portraitUrl}')"
                     title="${participant.name} (${participant.type})"
                     data-participant="${participant.name}">
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get portrait URL for participant
     */
    getParticipantPortrait(participant) {
        if (participant.type === 'enemy') {
            // Use enemy .jpeg files from assets/enemies/
            const enemyData = participant.combatData;
            if (!enemyData) {
                console.warn('⚠️ Enemy combat data is missing for participant:', participant.name);
                return 'assets/enemies/goblin.jpeg'; // fallback
            }
            
            // Look for spriteType in the enemy data or nested data field
            const spriteType = enemyData.spriteType || enemyData.data?.spriteType || enemyData.id || 'goblin';
            return `assets/enemies/${spriteType}.jpeg`;
        } else {
            // Use player's avatarUrl from character data
            const playerData = participant.combatData;
            const avatarUrl = playerData?.personal?.avatarUrl || playerData?.avatarUrl || 'assets/enemies/rat.jpeg';
            return avatarUrl;
        }
    }

    /**
     * Handle turn progression
     */
    onTurnStart(participant) {
        console.log(`🎯 ${participant.name}'s turn (${participant.type})`);
        
        if (participant.type === 'enemy') {
            // Enemy turn - AI controlled
            this.handleEnemyTurn(participant);
        } else {
            // Player turn - show attack options
            this.handlePlayerTurn(participant);
        }
        
        this.updateInitiativeDisplay();
    }

    /**
     * Handle enemy turn
     */
    handleEnemyTurn(enemy) {
        // Switch enemy to attack pose
        this.combatRenderer.setEnemyPose(enemy.id, 'attack');
        
        // AI selects action after a brief delay
        setTimeout(() => {
            const action = this.selectEnemyAction(enemy.combatData);
            console.log(`👹 ${enemy.name} uses ${action.name}`);
            
            // Process attack
            this.processEnemyAttack(enemy, action);
            
            // Switch back to ready pose
            setTimeout(() => {
                this.combatRenderer.setEnemyPose(enemy.id, 'ready');
                this.turnManager.nextTurn();
            }, 1500);
        }, 1000);
    }

    /**
     * Handle player turn
     */
    handlePlayerTurn(player) {
        console.log(`🛡️ ${player.name}'s turn - awaiting player input`);
        
        // Show attack options for each enemy
        this.activeEnemies.forEach(enemy => {
            this.combatRenderer.showEnemyAttackSelector(enemy.id, (attackType) => {
                this.handlePlayerAttack(player, enemy, attackType);
            });
        });
        
        // Also show a temporary UI with attack options
        this.showPlayerAttackMenu(player);
    }
    
    /**
     * Show attack menu with real character actions
     */
    showPlayerAttackMenu(player) {
        const controlsContainer = document.getElementById('combat-controls');
        
        // Get actual character data from combat participant
        const characterData = player.combatData || player;
        console.log('🎮 Player action menu for:', player.name, 'Character data:', characterData);
        
        // Get character's available actions
        const weaponActions = this.getCharacterWeaponActions(characterData);
        const magicActions = this.getCharacterMagicActions(characterData);
        const skillActions = this.getCharacterSkillActions(characterData);
        
        controlsContainer.innerHTML = `
            <div class="player-turn-menu" style="
                display: flex;
                gap: 15px;
                align-items: center;
                color: white;
                font-size: 1.1em;
                flex-wrap: wrap;
                justify-content: center;
            ">
                <span style="color: #4a9eff; font-weight: bold; min-width: 120px;">
                    ${player.name}'s Turn
                </span>
                
                <button class="attack-btn weapon-btn" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #ff6b35, #cc4422);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.9em;
                " onclick="window.combatManager.showActionMenu('weapon', ${JSON.stringify(weaponActions).replace(/"/g, '&quot;')})">
                    ⚔️ Weapon (${weaponActions.length})
                </button>
                
                <button class="attack-btn magic-btn" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #4a9eff, #2266cc);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.9em;
                " onclick="window.combatManager.showActionMenu('magic', ${JSON.stringify(magicActions).replace(/"/g, '&quot;')})">
                    ✨ Magic (${magicActions.length})
                </button>
                
                <button class="attack-btn skill-btn" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #40ff80, #22cc44);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 0.9em;
                " onclick="window.combatManager.showActionMenu('skill', ${JSON.stringify(skillActions).replace(/"/g, '&quot;')})">
                    🎯 Skill (${skillActions.length})
                </button>
                
                <span style="color: #ffff80; font-size: 0.8em; max-width: 200px; text-align: center;">
                    Click category to see options, or click red hexagon near enemy
                </span>
            </div>
        `;
    }
    
    /**
     * Get character's weapon actions
     */
    getCharacterWeaponActions(player) {
        const actions = [];
        
        // Check equipped weapons - new system stores weapon objects directly
        if (player.equipment) {
            if (player.equipment.mainHand) {
                const weapon = player.equipment.mainHand; // Weapon object stored directly
                if (weapon && weapon.type === 'weapon') {
                    actions.push({
                        name: weapon.name,
                        type: 'weapon',
                        description: weapon.description || 'Equipped weapon',
                        damage: this.calculateWeaponDamage(weapon, player)
                    });
                }
            }
            
            if (player.equipment.offHand) {
                const offhand = player.equipment.offHand; // Weapon object stored directly
                if (offhand && offhand.type === 'weapon') {
                    actions.push({
                        name: offhand.name + ' (Off-hand)',
                        type: 'weapon',
                        description: offhand.description || 'Off-hand weapon',
                        damage: this.calculateWeaponDamage(offhand, player, true)
                    });
                }
            }
        }
        
        // Default unarmed attack if no weapons
        if (actions.length === 0) {
            actions.push({
                name: 'Unarmed Strike',
                type: 'weapon',
                description: 'Basic unarmed attack',
                damage: '1d4+' + (player.stats?.strength || 2)
            });
        }
        
        return actions;
    }
    
    /**
     * Get character's magic actions
     */
    getCharacterMagicActions(player) {
        const actions = [];
        
        if (player.spells && player.spells.length > 0) {
            player.spells.forEach(spell => {
                if (player.mp >= spell.cost) {
                    // Calculate damage display based on damage type
                    let damageDisplay = '';
                    if (spell.damageType === 'fixed' && spell.damageAmount > 0) {
                        damageDisplay = `${spell.damageAmount} damage`;
                    } else if (spell.damageType === 'd6') {
                        damageDisplay = '1d6 damage';
                    } else if (spell.damageAmount > 0) {
                        damageDisplay = `${spell.damageAmount} damage`;
                    }
                    
                    actions.push({
                        name: spell.name,
                        type: 'magic',
                        description: spell.primaryEffect || 'Magic spell',
                        cost: spell.cost,
                        damageType: spell.damageType || 'fixed',
                        damageAmount: spell.damageAmount || 0,
                        damage: damageDisplay,
                        healing: spell.healingAmount || 0,
                        element: spell.element || 'arcane'
                    });
                }
            });
        }
        
        // Default cantrip if no spells or no MP
        if (actions.length === 0) {
            actions.push({
                name: 'Minor Cantrip',
                type: 'magic',
                description: 'Basic magical attack',
                cost: 0,
                damage: '1d3+' + (player.stats?.intelligence || 2)
            });
        }
        
        return actions;
    }
    
    /**
     * Get character's skill actions
     */
    getCharacterSkillActions(player) {
        const actions = [];
        
        if (player.skills && player.skills.length > 0) {
            // Convert skills to combat-usable actions
            player.skills.forEach(skill => {
                const combatSkill = this.convertSkillToCombatAction(skill, player);
                if (combatSkill) {
                    actions.push(combatSkill);
                }
            });
        }
        
        // Default basic skill
        if (actions.length === 0) {
            actions.push({
                name: 'Focused Strike',
                type: 'skill',
                description: 'Careful, precise attack',
                damage: '1d6+' + (player.stats?.dexterity || 2)
            });
        }
        
        return actions.slice(0, 3); // Limit to 3 for UI space
    }
    
    /**
     * Convert character skill to combat action
     */
    convertSkillToCombatAction(skill, player) {
        const skillName = skill.name.toLowerCase();
        
        // Combat-relevant skills
        if (skillName.includes('martial') || skillName.includes('pugilism')) {
            return {
                name: skill.name,
                type: 'skill',
                description: 'Combat skill attack',
                damage: '1d8+' + (player.stats?.[skill.stat] || 3)
            };
        }
        
        if (skillName.includes('magic') || skillName.includes('spell')) {
            return {
                name: skill.name,
                type: 'skill',
                description: 'Magical skill',
                damage: '1d6+' + (player.stats?.intelligence || 2),
                cost: 1
            };
        }
        
        // Generic skill-based attack
        return {
            name: skill.name,
            type: 'skill',
            description: 'Skill-based action',
            damage: '1d4+' + (player.stats?.[skill.stat] || 2)
        };
    }
    
    /**
     * Calculate weapon damage string
     */
    calculateWeaponDamage(weapon, player, isOffhand = false) {
        let baseDamage = '1d6'; // Default
        
        if (weapon.size === 'light') baseDamage = '1d4';
        if (weapon.size === 'heavy') baseDamage = '1d8';
        
        const statBonus = weapon.ranged ? 
            (player.stats?.dexterity || 2) : 
            (player.stats?.strength || 2);
        
        const finalBonus = isOffhand ? Math.floor(statBonus / 2) : statBonus;
        
        return `${baseDamage}+${finalBonus}`;
    }
    
    /**
     * Show detailed action menu
     */
    showActionMenu(actionType, actions) {
        const controlsContainer = document.getElementById('combat-controls');
        
        controlsContainer.innerHTML = `
            <div class="action-detail-menu" style="
                display: flex;
                flex-direction: column;
                gap: 8px;
                color: white;
                font-size: 0.9em;
                width: 100%;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #4a9eff; font-weight: bold;">
                        Choose ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}:
                    </span>
                    <button onclick="window.combatManager.showPlayerAttackMenu(window.combatManager.turnManager.getCurrentParticipant())" 
                            style="background: #666; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                        ← Back
                    </button>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${actions.map((action, index) => `
                        <button class="action-option" style="
                            padding: 6px 12px;
                            background: linear-gradient(135deg, ${this.getActionColor(actionType)});
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.85em;
                            max-width: 200px;
                            text-align: left;
                        " onclick="window.combatManager.useSpecificAction('${actionType}', ${index})" 
                           title="${action.description}">
                            <div style="font-weight: bold;">${action.name}</div>
                            <div style="font-size: 0.8em; opacity: 0.9;">
                                ${action.damage || action.healing || action.description}
                                ${action.cost ? ` (${action.cost} MP)` : ''}
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store actions for use
        this.currentActionMenu = { type: actionType, actions: actions };
    }
    
    /**
     * Get color scheme for action type
     */
    getActionColor(actionType) {
        switch(actionType) {
            case 'weapon': return '#ff6b35, #cc4422';
            case 'magic': return '#4a9eff, #2266cc';
            case 'skill': return '#40ff80, #22cc44';
            default: return '#666, #444';
        }
    }
    
    /**
     * Use specific action
     */
    useSpecificAction(actionType, actionIndex) {
        if (!this.currentActionMenu || this.currentActionMenu.type !== actionType) {
            console.warn('⚠️ No action menu available');
            return;
        }
        
        const action = this.currentActionMenu.actions[actionIndex];
        if (!action) {
            console.warn('⚠️ Action not found');
            return;
        }
        
        const currentParticipant = this.turnManager.getCurrentParticipant();
        if (!currentParticipant || currentParticipant.type !== 'player') {
            console.warn('⚠️ Not player turn');
            return;
        }
        
        // Attack first available enemy with chosen action
        const targetEnemy = this.activeEnemies[0];
        if (targetEnemy) {
            this.handlePlayerAttackWithAction(currentParticipant, targetEnemy, action);
        }
    }
    
    /**
     * Handle player attack with specific action
     */
    handlePlayerAttackWithAction(player, enemy, action) {
        console.log(`⚔️ ${player.name} uses ${action.name} against ${enemy.name}`);
        
        // Hide all attack selectors
        this.activeEnemies.forEach(e => {
            this.combatRenderer.hideEnemyAttackSelector(e.id);
        });
        
        // Calculate damage based on action type and damage type
        let damage = 0;
        if (action.type === 'magic') {
            // Handle magic damage types
            if (action.damageType === 'fixed' && action.damageAmount > 0) {
                damage = action.damageAmount;
                console.log(`✨ Fixed magic damage: ${damage}`);
            } else if (action.damageType === 'd6') {
                damage = Math.floor(Math.random() * 6) + 1;
                console.log(`🎲 d6 magic damage: ${damage}`);
            } else if (action.damage) {
                // Fallback to string-based damage
                damage = this.rollDamage(action.damage);
            }
        } else if (action.damage) {
            // Weapon or other action damage
            damage = this.rollDamage(action.damage);
        }
        
        // Apply MP cost if applicable
        if (action.cost && player.mp) {
            player.mp = Math.max(0, player.mp - action.cost);
            console.log(`💙 ${player.name} MP: ${player.mp}/${player.maxMp} (-${action.cost})`);
        }
        
        // Apply damage to enemy
        enemy.hp = Math.max(0, enemy.hp - damage);
        
        console.log(`💥 ${action.name}: ${damage} damage! ${enemy.name} HP: ${enemy.hp}/${enemy.maxHp}`);
        
        // Check if enemy defeated
        if (enemy.hp <= 0) {
            console.log(`💀 ${enemy.name} defeated!`);
            this.combatRenderer.removeEnemy(enemy.id);
            this.activeEnemies = this.activeEnemies.filter(e => e.id !== enemy.id);
        }
        
        // Check for combat end
        if (this.checkCombatEnd()) {
            return;
        }
        
        // Next turn
        this.turnManager.nextTurn();
    }
    
    /**
     * Roll damage from dice notation using existing DCC utilities
     */
    rollDamage(damageString) {
        // Ensure damageString is actually a string
        if (typeof damageString !== 'string') {
            console.warn('⚠️ Invalid damage string:', damageString, 'using fallback');
            return Math.floor(Math.random() * 6) + 1; // 1d6 fallback
        }
        
        // Use the existing dccUtilities parser if available
        if (window.dccUtilities && window.dccUtilities.parseDiceNotation) {
            const parsed = window.dccUtilities.parseDiceNotation(damageString);
            if (parsed) {
                let total = parsed.modifier;
                for (let i = 0; i < parsed.count; i++) {
                    total += Math.floor(Math.random() * parsed.sides) + 1;
                }
                return total;
            }
        }
        
        // Fallback to simple dice roller for damage strings like "1d6+3"
        const match = damageString.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (match) {
            const count = parseInt(match[1]);
            const sides = parseInt(match[2]);
            const bonus = parseInt(match[3]) || 0;
            
            let total = bonus;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            return total;
        }
        
        // Fallback for simple numbers
        return parseInt(damageString) || 1;
    }

    /**
     * Select random enemy action
     */
    selectEnemyAction(enemyData) {
        console.log('🎯 Selecting action for enemy data:', enemyData);
        console.log('🔍 Enemy data structure:', enemyData);
        console.log('🗡️ Enemy attacks:', enemyData?.attacks);
        
        // Look for attacks in the enemy data or nested data field
        const actions = enemyData?.attacks || enemyData?.data?.attacks || [];
        if (actions.length === 0) {
            console.warn('⚠️ No attacks found for enemy, using fallback');
            return { name: 'Basic Attack', damage: '1d4' };
        }
        
        const selectedAction = actions[Math.floor(Math.random() * actions.length)];
        console.log('✅ Selected action:', selectedAction);
        return selectedAction;
    }

    /**
     * Process enemy attack
     */
    processEnemyAttack(enemy, action) {
        // Target a random party member
        const targets = this.partyManager.getAliveMembers();
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        // Calculate damage (simplified for now)
        const damage = Math.floor(Math.random() * 10) + 1;
        
        console.log(`💥 ${enemy.name} attacks ${target.name} for ${damage} damage`);
        
        // Apply damage
        this.partyManager.applyDamage(target.name, damage);
        
        // Check for combat end
        this.checkCombatEnd();
    }

    /**
     * Handle player attack
     */
    handlePlayerAttack(player, enemy, attackType) {
        console.log(`⚔️ ${player.name} attacks ${enemy.name} with ${attackType}`);
        
        // Hide all attack selectors
        this.activeEnemies.forEach(e => {
            this.combatRenderer.hideEnemyAttackSelector(e.id);
        });
        
        // Calculate damage (simplified for now)
        const damage = Math.floor(Math.random() * 15) + 5;
        
        // Apply damage to enemy
        enemy.hp = Math.max(0, enemy.hp - damage);
        
        console.log(`💥 ${damage} damage! ${enemy.name} HP: ${enemy.hp}/${enemy.maxHp || enemy.hp + damage}`);
        
        // Check if enemy defeated
        if (enemy.hp <= 0) {
            console.log(`💀 ${enemy.name} defeated!`);
            this.combatRenderer.removeEnemy(enemy.id);
            this.activeEnemies = this.activeEnemies.filter(e => e.id !== enemy.id);
        }
        
        // Check for combat end
        if (this.checkCombatEnd()) {
            return;
        }
        
        // Next turn
        this.turnManager.nextTurn();
    }

    /**
     * Check if combat should end
     */
    checkCombatEnd() {
        const aliveParty = this.partyManager.getAliveMembers();
        const aliveEnemies = this.activeEnemies.filter(e => e.hp > 0);
        
        if (aliveParty.length === 0) {
            console.log('💀 Party defeated!');
            this.endCombat('defeat');
            return true;
        }
        
        if (aliveEnemies.length === 0) {
            console.log('🎉 Victory!');
            this.endCombat('victory');
            return true;
        }
        
        return false;
    }

    /**
     * End combat and return to map
     */
    endCombat(result = 'retreat') {
        console.log(`🏁 Combat ended: ${result}`);
        
        this.isActive = false;
        
        // Hide combat modal
        this.combatContainer.classList.add('hidden');
        
        // Resume map renderer
        if (this.mapRenderer && this.mapRenderer.resumeRendering) {
            this.mapRenderer.resumeRendering();
        }
        
        // Cleanup combat systems
        if (this.combatRenderer) {
            this.combatRenderer.cleanup();
        }
        
        // Reset state
        this.currentCombat = null;
        this.activeEnemies = [];
        this.combatLog = [];
        
        console.log('✅ Returned to map');
    }

    /**
     * Public method to trigger test combat with real character data
     */
    async triggerTestCombat(mapRenderer) {
        try {
            console.log('🎮 Starting test combat with real enemy data...');
            
            // Load real enemy data from JSON
            const goblinData = await window.enemyDataLoader.getEnemyByName('goblin_grunt');
            console.log('👹 Loaded goblin data:', goblinData);
            console.log('🔍 Goblin data keys:', Object.keys(goblinData || {}));
            console.log('🗡️ Goblin attacks:', goblinData?.attacks);
            
            if (!goblinData) {
                console.warn('⚠️ Could not load goblin data, using fallback');
                throw new Error('Failed to load enemy data from JSON');
            }
            
            // Try to get real character data first
            const realCharacterData = await this.getCurrentCharacterData();
            
            // Create proper encounter structure for new combat system
            const testEncounter = {
                enemies: [{
                    id: 'test_goblin_1',
                    name: goblinData.name,
                    level: goblinData.level || 1,
                    hp: goblinData.hp || goblinData.hitPoints || 6,
                    maxHp: goblinData.maxHp || goblinData.hitPoints || 6,
                    attacks: goblinData.attacks || [
                        { name: 'Club Attack', damage: '1d6+1' },
                        { name: 'Thrown Rock', damage: '1d4' }
                    ],
                    spriteType: goblinData.spriteType || goblinData.id || 'goblin',
                    data: goblinData // Store full enemy data for portrait system
                }],
                party: {
                    players: realCharacterData ? [realCharacterData] : [{ 
                        name: 'brad', 
                        type: 'player', 
                        level: 5, 
                        hp: 45, 
                        maxHp: 45,
                        avatarUrl: 'assets/enemies/rat.jpeg' // fallback
                    }],
                    averageLevel: realCharacterData ? realCharacterData.level : 5,
                    gold: 1200
                }
            };
            
            console.log('⚔️ Created encounter with enemy structure:');
            console.log('🏗️ Enemy in encounter:', testEncounter.enemies[0]);
            console.log('🔍 Enemy data field:', testEncounter.enemies[0].data);
            console.log('🗡️ Enemy attacks field:', testEncounter.enemies[0].attacks);
            console.log('⚔️ Starting combat with encounter:', testEncounter);
            this.startCombat(testEncounter, mapRenderer);
            
        } catch (error) {
            console.error('❌ Error starting combat:', error);
            alert('Failed to start combat: ' + error.message);
        }
    }
    
    /**
     * Get current character data from storage
     */
    async getCurrentCharacterData() {
        try {
            // Check if characterManager exists and has current character
            if (window.characterManager && window.characterManager.currentCharacterId) {
                const currentChar = window.characterManager.characters.find(
                    char => char.id === window.characterManager.currentCharacterId
                );
                
                if (currentChar) {
                    console.log('✅ Found current character:', currentChar.name);
                    return {
                        name: currentChar.name,
                        type: 'player',
                        level: currentChar.level,
                        hp: currentChar.currentHealthPoints,
                        maxHp: currentChar.healthPoints,
                        mp: currentChar.currentMagicPoints,
                        maxMp: currentChar.magicPoints,
                        stats: currentChar.stats,
                        equipment: currentChar.equipment,
                        inventory: currentChar.inventory,
                        spells: currentChar.spells,
                        skills: currentChar.customSkills,
                        avatarUrl: currentChar.personal?.avatarUrl || 'assets/enemies/rat.jpeg'
                    };
                }
            }
            
            console.warn('⚠️ No current character found, using fallback');
            return null;
        } catch (error) {
            console.error('❌ Error getting character data:', error);
            return null;
        }
    }
}

// Auto-initialize when loaded
window.combatManager = new CombatManager();
console.log('🎮 CombatManager loaded and ready!');