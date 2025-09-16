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
        this.currentEnemies = []; // Store enemy data for revenge revival
        this.combatLog = [];
        this.isHandlingDeath = false; // Flag to prevent normal combat end during death sequence
        
        // Enemy looting system - track what enemies have taken from players
        this.lootedByEnemies = []; // Array of: { enemyType, gold, items[], timestamp, encounterChance }
        this.currentRevengeEncounter = null; // Set when current combat is a revenge encounter
        
        // Combat statistics tracking
        this.combatStats = {
            damageDealt: 0,
            damageTaken: 0,
            startTime: null,
            endTime: null
        };
        
        this.init();
    }

    init() {
        this.createCombatModal();
        this.setupEventListeners();
        this.loadLootedEnemies(); // Load any previously looted enemy data
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
                
                <!-- Combat Results Modal -->
                <div class="combat-results-modal hidden" id="combat-results-modal">
                    <div class="combat-results-content">
                        <div class="combat-results-header">
                            <h2 class="combat-results-title" id="combat-results-title">Victory!</h2>
                        </div>
                        <div class="combat-results-body">
                            <div class="combat-stats">
                                <div class="combat-stat">
                                    <span class="stat-label">Damage Dealt:</span>
                                    <span class="stat-value" id="damage-dealt">0</span>
                                </div>
                                <div class="combat-stat">
                                    <span class="stat-label">Damage Taken:</span>
                                    <span class="stat-value" id="damage-taken">0</span>
                                </div>
                                <div class="combat-stat">
                                    <span class="stat-label">Combat Duration:</span>
                                    <span class="stat-value" id="combat-duration">0s</span>
                                </div>
                            </div>
                            <div class="loot-section">
                                <h3>Loot Gained</h3>
                                <div class="loot-container" id="loot-container">
                                    <!-- Loot items will be added here -->
                                </div>
                            </div>
                        </div>
                        <div class="combat-results-footer">
                            <button class="btn-continue" id="continue-button" onclick="window.combatManager.closeCombatResults()">Continue</button>
                        </div>
                    </div>
                </div>
                
                <!-- Death/Revival Modal -->
                <div class="death-modal hidden" id="death-modal">
                    <div class="death-modal-content">
                        <div class="death-modal-header">
                            <h2 class="death-title">💀 You Have Died</h2>
                            <p class="death-subtitle">Your adventure comes to an end...</p>
                        </div>
                        <div class="death-modal-body">
                            <div class="death-choice">
                                <p class="choice-question">Choose your revival path:</p>
                                
                                <!-- Revenge Option -->
                                <div class="revival-option">
                                    <h3 class="option-title">⚔️ Return to Combat (Revenge)</h3>
                                    <div class="option-description">
                                        Face your killer again with determination! Less penalty but you must fight.
                                    </div>
                                    <div class="option-consequences">
                                        <div class="consequence-item">
                                            <span class="consequence-icon">💰</span>
                                            <span class="consequence-text">Lose <span id="revenge-gold-loss">0</span> gold (half of current)</span>
                                        </div>
                                        <div class="consequence-item">
                                            <span class="consequence-icon">🎒</span>
                                            <span class="consequence-text">Lose: <span id="revenge-item-loss">1 random item</span></span>
                                        </div>
                                    </div>
                                    <button class="btn-revive revenge-btn" onclick="window.combatManager.handleRevival('revenge')">
                                        ⚔️ Face My Killer Again
                                    </button>
                                </div>
                                
                                <!-- Retreat Option -->
                                <div class="revival-option">
                                    <h3 class="option-title">🏃 Retreat to Map (Safe Escape)</h3>
                                    <div class="option-description">
                                        Return safely to the overworld. Higher penalty but guaranteed safety.
                                    </div>
                                    <div class="option-consequences">
                                        <div class="consequence-item">
                                            <span class="consequence-icon">💰</span>
                                            <span class="consequence-text">Lose <span id="retreat-gold-loss">0</span> gold (2/3 of current)</span>
                                        </div>
                                        <div class="consequence-item">
                                            <span class="consequence-icon">🎒</span>
                                            <span class="consequence-text">Lose: <span id="retreat-item-loss">2 random items</span></span>
                                        </div>
                                    </div>
                                    <button class="btn-revive retreat-btn" onclick="window.combatManager.handleRevival('retreat')">
                                        🏃 Retreat to Safety
                                    </button>
                                </div>
                                
                                <!-- Stay Dead Option -->
                                <div class="revival-option stay-dead-option">
                                    <button class="btn-stay-dead" onclick="window.combatManager.handleRevival(false)">
                                        💀 Accept Death - Return to Character Selection
                                    </button>
                                </div>
                            </div>
                        </div>
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
            
            
            /* Combat Results Modal */
            .combat-results-modal {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }
            
            .combat-results-modal.hidden {
                display: none;
            }
            
            .combat-results-content {
                width: 500px;
                max-width: 90vw;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 15px;
                border: 2px solid #4a9eff;
                box-shadow: 0 20px 40px rgba(74, 158, 255, 0.5);
                overflow: hidden;
                animation: modalSlideIn 0.3s ease-out;
            }
            
            @keyframes modalSlideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .combat-results-header {
                padding: 20px;
                text-align: center;
                background: rgba(74, 158, 255, 0.1);
                border-bottom: 1px solid #4a9eff;
            }
            
            .combat-results-title {
                margin: 0;
                color: #4a9eff;
                font-size: 1.8em;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
            }
            
            .combat-results-title.victory {
                color: #4eff4a;
                text-shadow: 0 0 10px rgba(78, 255, 74, 0.5);
            }
            
            .combat-results-title.revenge-victory {
                color: #ff6b35;
                text-shadow: 0 0 15px rgba(255, 107, 53, 0.8);
                animation: revengePulse 2s ease-in-out infinite;
            }
            
            @keyframes revengePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .combat-results-title.defeat {
                color: #ff4a4a;
                text-shadow: 0 0 10px rgba(255, 74, 74, 0.5);
            }
            
            .combat-results-body {
                padding: 20px;
            }
            
            .combat-stats {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .combat-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(74, 158, 255, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(74, 158, 255, 0.3);
            }
            
            .stat-label {
                color: #cccccc;
                font-weight: 500;
            }
            
            .stat-value {
                color: #4a9eff;
                font-weight: bold;
            }
            
            .loot-section h3 {
                color: #4a9eff;
                margin: 0 0 15px 0;
                font-size: 1.2em;
            }
            
            .loot-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .loot-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(78, 255, 74, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(78, 255, 74, 0.3);
                transition: all 0.2s ease;
            }
            
            .loot-item:hover {
                background: rgba(78, 255, 74, 0.2);
                transform: translateY(-2px);
            }
            
            .loot-icon {
                font-size: 1.2em;
            }
            
            .loot-info {
                flex: 1;
            }
            
            .loot-name {
                color: #4eff4a;
                font-weight: bold;
                margin: 0;
            }
            
            .loot-value {
                color: #cccccc;
                font-size: 0.9em;
                margin: 0;
            }
            
            .combat-results-footer {
                padding: 20px;
                text-align: center;
                background: rgba(74, 158, 255, 0.05);
                border-top: 1px solid rgba(74, 158, 255, 0.3);
            }
            
            .btn-continue {
                background: linear-gradient(135deg, #4a9eff, #357abd);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 30px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 120px;
            }
            
            .btn-continue:hover {
                background: linear-gradient(135deg, #357abd, #2e6a9e);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(74, 158, 255, 0.4);
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .combat-results-content {
                    width: 95vw;
                }
                
                .loot-container {
                    grid-template-columns: 1fr;
                }
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
            
            /* Death Modal Styles */
            .death-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            }
            
            .death-modal.hidden {
                display: none;
            }
            
            .death-modal-content {
                background: linear-gradient(135deg, #2c1810, #1a0f0a);
                border: 2px solid #8b0000;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(139, 0, 0, 0.5);
                animation: deathModalSlide 0.5s ease-out;
            }
            
            @keyframes deathModalSlide {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .death-modal-header {
                padding: 25px;
                text-align: center;
                background: linear-gradient(135deg, #8b0000, #660000);
                border-radius: 13px 13px 0 0;
            }
            
            .death-title {
                color: #ffffff;
                font-size: 1.8em;
                margin: 0 0 10px 0;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .death-subtitle {
                color: #cccccc;
                margin: 0;
                font-style: italic;
            }
            
            .death-modal-body {
                padding: 25px;
            }
            
            .revival-option {
                background: rgba(30, 30, 50, 0.8);
                border: 2px solid #4a9eff;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                transition: all 0.3s ease;
            }
            
            .revival-option:hover {
                border-color: #6bb6ff;
                background: rgba(35, 35, 60, 0.9);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(74, 158, 255, 0.3);
            }
            
            .option-title {
                color: #6bb6ff;
                margin: 0 0 10px 0;
                font-size: 1.3em;
                font-weight: bold;
                text-align: center;
            }
            
            .option-description {
                color: #cccccc;
                margin-bottom: 15px;
                text-align: center;
                font-style: italic;
                line-height: 1.4;
            }
            
            .option-consequences {
                margin-bottom: 20px;
            }
            
            .consequence-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(139, 0, 0, 0.1);
                border-radius: 8px;
                margin-bottom: 8px;
                border: 1px solid rgba(139, 0, 0, 0.3);
            }
            
            .consequence-icon {
                font-size: 1.2em;
                min-width: 24px;
            }
            
            .consequence-text {
                color: #cccccc;
                flex: 1;
                font-size: 0.95em;
            }
            
            .death-choice {
                text-align: center;
            }
            
            .choice-question {
                color: #ffffff;
                font-size: 1.2em;
                margin: 0 0 25px 0;
                font-weight: bold;
            }
            
            .btn-revive {
                background: linear-gradient(135deg, #4a9eff, #357abd);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px 25px;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                margin-top: 10px;
            }
            
            .btn-revive:hover {
                background: linear-gradient(135deg, #357abd, #2e6a9e);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(74, 158, 255, 0.4);
            }
            
            .revenge-btn {
                background: linear-gradient(135deg, #ff6b35, #e55a2b);
            }
            
            .revenge-btn:hover {
                background: linear-gradient(135deg, #e55a2b, #cc4f24);
                box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
            }
            
            .retreat-btn {
                background: linear-gradient(135deg, #4ecdc4, #44a39e);
            }
            
            .retreat-btn:hover {
                background: linear-gradient(135deg, #44a39e, #3a8e89);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
            }
            
            .stay-dead-option {
                background: rgba(50, 20, 20, 0.8);
                border: 2px solid #8b0000;
                text-align: center;
            }
            
            .stay-dead-option:hover {
                border-color: #b30000;
                background: rgba(60, 25, 25, 0.9);
                box-shadow: 0 5px 15px rgba(139, 0, 0, 0.3);
            }
            
            .btn-stay-dead {
                background: linear-gradient(135deg, #8b0000, #660000);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 25px;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
            }
            
            .btn-stay-dead:hover {
                background: linear-gradient(135deg, #660000, #4d0000);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(139, 0, 0, 0.4);
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
        
        // Death modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'revive-yes') {
                console.log('🔘 YES button clicked');
                this.handleRevival(true);
            } else if (e.target.id === 'revive-no') {
                console.log('🔘 NO button clicked');
                this.handleRevival(false);
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
        this.currentEnemies = encounter; // Store for revenge revival
        
        // Reset death handling flag for new combat
        this.isHandlingDeath = false;
        
        // Initialize combat statistics
        this.combatStats = {
            damageDealt: 0,
            damageTaken: 0,
            startTime: Date.now(),
            endTime: null
        };
        
        // Check if this enemy previously looted the player for a revenge encounter
        this.checkForRevengeEncounterStart();
        
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
     * Load fresh character data from storage before combat starts
     */
    async loadFreshCharacterData() {
        console.log('📖 Loading fresh character data from storage...');
        
        try {
            // Get current character name (assuming single player for now)
            const playerName = this.currentCombat.party.players[0]?.name;
            if (!playerName) {
                console.warn('⚠️ No player name found in party data');
                return;
            }

            // Load character data from storage
            const characterData = await this.loadCharacterFromDB(playerName);
            if (!characterData) {
                console.warn(`⚠️ No character data found for ${playerName} in storage`);
                return;
            }

            // Update party data with fresh character stats
            // Map from .dcw character format to combat format
            this.currentCombat.party.players[0] = {
                ...this.currentCombat.party.players[0],
                ...characterData,
                id: characterData.id || playerName,
                name: playerName,
                // Map HP properties from .dcw format
                hp: characterData.currentHealthPoints || characterData.currentHp || characterData.hp || 0,
                maxHp: characterData.healthPoints || characterData.maxHp || characterData.hp || 100,
                // Map MP properties from .dcw format
                mp: characterData.currentMagicPoints || characterData.currentMp || characterData.mp || 0,
                maxMp: characterData.magicPoints || characterData.maxMp || characterData.mp || 0,
                spells: characterData.spells || [],
                avatarUrl: characterData.avatarUrl || characterData.avatar
            };

            console.log(`✅ Loaded fresh data for ${playerName}:`, {
                hp: `${this.currentCombat.party.players[0].hp}/${this.currentCombat.party.players[0].maxHp}`,
                mp: `${this.currentCombat.party.players[0].mp}/${this.currentCombat.party.players[0].maxMp}`,
                spells: this.currentCombat.party.players[0].spells?.length || 0
            });

        } catch (error) {
            console.error('❌ Error loading character data:', error);
        }
    }

    /**
     * Load character data from the AdvancedStorageManager (IndexedDB)
     */
    async loadCharacterFromDB(characterName) {
        try {
            // Use the AdvancedStorageManager to get all characters
            if (window.advancedStorageManager) {
                const characters = await window.advancedStorageManager.getItem('wasteland_characters');
                if (characters && Array.isArray(characters)) {
                    const character = characters.find(char => char.name === characterName);
                    return character || null;
                }
            }
            
            // Fallback to localStorage if AdvancedStorageManager not available
            const stored = localStorage.getItem('wasteland_characters');
            if (stored) {
                const characters = JSON.parse(stored);
                const character = characters.find(char => char.name === characterName);
                return character || null;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load character from storage:', error);
            return null;
        }
    }

    /**
     * Save character data back to storage using AdvancedStorageManager
     */
    async saveCharacterToIndexedDB(character) {
        try {
            // Get all characters from storage
            let characters = [];
            
            if (window.advancedStorageManager) {
                characters = await window.advancedStorageManager.getItem('wasteland_characters') || [];
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem('wasteland_characters');
                if (stored) {
                    characters = JSON.parse(stored);
                }
            }
            
            // Find and update the character
            const charIndex = characters.findIndex(char => char.name === character.name);
            if (charIndex !== -1) {
                // Update HP/MP values in the stored character using .dcw format
                characters[charIndex].currentHealthPoints = character.hp;
                characters[charIndex].currentMagicPoints = character.mp;
                // Also update legacy properties for compatibility
                characters[charIndex].hp = character.hp;
                characters[charIndex].mp = character.mp;
                characters[charIndex].currentHp = character.hp;
                characters[charIndex].currentMp = character.mp;
                
                // Save back to storage
                if (window.advancedStorageManager) {
                    await window.advancedStorageManager.setItem('wasteland_characters', characters);
                } else {
                    localStorage.setItem('wasteland_characters', JSON.stringify(characters));
                }
                
                console.log(`💾 Saved ${character.name} HP/MP to storage: ${character.hp}/${character.maxHp} HP, ${character.mp}/${character.maxMp} MP`);
            } else {
                console.warn(`⚠️ Character ${character.name} not found in storage for HP/MP update`);
            }
        } catch (error) {
            console.error('❌ Error saving character to storage:', error);
        }
    }

    /**
     * Initialize combat subsystems
     */
    async initializeCombatSystems() {
        // Import combat modules dynamically
        const { PartyManager } = await import('./PartyManager.js');
        const { CombatRenderer } = await import('./CombatRenderer.js');
        const { TurnManager } = await import('./TurnManager.js');
        
        // Read fresh character data from storage
        await this.loadFreshCharacterData();
        
        // Initialize party manager with fresh data
        this.partyManager = new PartyManager(this.currentCombat.party);
        
        // Initialize 3D combat renderer
        const sceneContainer = document.getElementById('combat-scene');
        this.combatRenderer = new CombatRenderer(sceneContainer);
        
        // Connect PartyManager to CombatRenderer for floating damage numbers
        this.partyManager.setCombatRenderer(this.combatRenderer);
        
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
        
        // Initialize player health bars
        this.combatRenderer.initializePlayerHealthBars(this.partyManager.getPartyMembers());
        
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
                // Check if player has enough MP for this spell
                const canCast = !spell.cost || (player.mp && player.mp >= spell.cost);
                
                // Create damage display string
                let damageDisplay = '';
                if (spell.damageAmount > 0) {
                    if (spell.damageType === '' || spell.damageType === 'fixed') {
                        damageDisplay = `${spell.damageAmount} damage`;
                    } else if (spell.damageType) {
                        damageDisplay = `${spell.damageType} damage`;
                    }
                }
                
                // Create healing display string
                let healingDisplay = '';
                if (spell.healingAmount > 0) {
                    if (spell.healingType === '' || spell.healingType === 'fixed') {
                        healingDisplay = `${spell.healingAmount} healing`;
                    } else if (spell.healingType) {
                        healingDisplay = `${spell.healingType} healing`;
                    }
                }
                
                // Create effect description
                let description = spell.primaryEffect || 'Magic spell';
                const effects = [];
                if (damageDisplay) effects.push(damageDisplay);
                if (healingDisplay) effects.push(healingDisplay);
                if (spell.primaryEffect && spell.primaryEffect !== description) effects.push(spell.primaryEffect);
                if (spell.secondaryEffect) effects.push(spell.secondaryEffect);
                
                if (effects.length > 0) {
                    description = effects.join(', ');
                }
                
                // Add spell to actions (even if can't cast, but mark it)
                actions.push({
                    ...spell, // Include all spell data
                    name: spell.name,
                    type: 'spell',
                    description: description,
                    cost: spell.cost || 0,
                    canCast: canCast,
                    mpCost: spell.cost || 0,
                    element: spell.element || 'arcane',
                    // For display purposes
                    damageDisplay: damageDisplay,
                    healingDisplay: healingDisplay
                });
            });
        }
        
        // Default cantrip if no spells or no MP for any spells
        const canCastAny = actions.some(action => action.canCast);
        if (actions.length === 0 || !canCastAny) {
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
                    ${actions.map((action, index) => {
                        const canUse = action.canCast !== false; // Default true for non-spells
                        const buttonStyle = canUse 
                            ? `background: linear-gradient(135deg, ${this.getActionColor(actionType)}); cursor: pointer;`
                            : `background: linear-gradient(135deg, #666, #444); cursor: not-allowed; opacity: 0.6;`;
                        
                        return `
                        <button class="action-option" style="
                            padding: 6px 12px;
                            ${buttonStyle}
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 0.85em;
                            max-width: 200px;
                            text-align: left;
                        " ${canUse ? `onclick="window.combatManager.useSpecificAction('${actionType}', ${index})"` : 'disabled'} 
                           title="${action.description}${!canUse ? ' (Not enough MP)' : ''}">
                            <div style="font-weight: bold;">${action.name}</div>
                            <div style="font-size: 0.8em; opacity: 0.9;">
                                ${action.damageDisplay || action.healingDisplay || action.damage || action.healing || action.description}
                                ${action.cost ? ` (${action.cost} MP)` : ''}
                                ${!canUse ? ' ⚠️' : ''}
                            </div>
                        </button>
                    `}).join('')}
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
        
        // Check if action can be used (for spells with MP cost)
        if (action.canCast === false) {
            console.warn(`⚠️ Cannot cast ${action.name} - not enough MP`);
            // TODO: Show UI message to player
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
        
        // Handle different action types
        if (action.type === 'spell' || action.element) {
            // This is a spell - use the new spell system
            this.handleSpellCast(player, enemy, action);
        } else {
            // Handle weapon/melee attacks
            this.handleWeaponAttack(player, enemy, action);
        }
    }

    /**
     * Handle spell casting with full spell mechanics
     */
    handleSpellCast(player, enemy, spell) {
        console.log(`🪄 ${player.name} casts ${spell.name} (${spell.element})`);
        
        // Check MP cost
        if (spell.cost && spell.cost > 0) {
            if (!player.mp || player.mp < spell.cost) {
                console.log(`❌ ${player.name} doesn't have enough MP for ${spell.name} (needs ${spell.cost}, has ${player.mp || 0})`);
                // TODO: Show UI message and allow different action
                return;
            }
            
            // Deduct MP cost
            player.mp = Math.max(0, player.mp - spell.cost);
            console.log(`💙 ${player.name} MP: ${player.mp}/${player.maxMp} (-${spell.cost})`);
            
            // Update player health bar
            this.combatRenderer.updatePlayerHealth(player.id || player.name, player.hp, player.mp);
            
            // Save MP change to storage
            this.saveCharacterToIndexedDB(player);
        }
        
        // Calculate spell damage
        let damage = 0;
        if (spell.damageAmount > 0) {
            if (spell.damageType === '' || spell.damageType === 'fixed') {
                // Fixed damage
                damage = spell.damageAmount;
                console.log(`⚡ Fixed spell damage: ${damage}`);
            } else if (spell.damageType) {
                // Dice-based damage
                damage = this.rollDamage(spell.damageType);
                console.log(`🎲 ${spell.damageType} spell damage: ${damage}`);
            }
        }
        
        // Apply damage to enemy
        if (damage > 0) {
            enemy.hp = Math.max(0, enemy.hp - damage);
            
            // Show floating damage number for spell damage
            if (this.combatRenderer && this.combatRenderer.showFloatingNumber) {
                this.combatRenderer.showFloatingNumber({
                    memberName: enemy.id,
                    amount: damage,
                    type: 'damage',
                    damageType: 'magical',
                    isMaxDamage: false, // Will calculate properly with damage history in future
                    isTopTier: damage >= 8, // Temporary: 8+ damage is top tier for magic
                    percentile: damage >= 8 ? 90 : damage * 10 // Rough approximation
                });
            }
            
            this.combatRenderer.updateEnemyHealth(enemy.id, enemy.hp, enemy.mp);
            this.combatStats.damageDealt += damage;
            console.log(`💥 ${spell.name}: ${damage} ${spell.element} damage! ${enemy.name} HP: ${enemy.hp}/${enemy.maxHp}`);
        }
        
        // Handle spell healing (self-heal or party heal)
        let healing = 0;
        if (spell.healingAmount > 0) {
            if (spell.healingType === '' || spell.healingType === 'fixed') {
                // Fixed healing
                healing = spell.healingAmount;
                console.log(`💚 Fixed spell healing: ${healing}`);
            } else if (spell.healingType) {
                // Dice-based healing
                healing = this.rollDamage(spell.healingType);
                console.log(`🎲 ${spell.healingType} spell healing: ${healing}`);
            }
            
            // Apply healing to caster (for now)
            if (healing > 0) {
                const oldHp = player.hp;
                
                // Use PartyManager for proper healing with floating numbers
                this.partyManager.applyHealing(player.name, healing, 'magical');
                
                // Update the player object from party manager
                const updatedPlayer = this.partyManager.getMember(player.name);
                if (updatedPlayer) {
                    player.hp = updatedPlayer.hp;
                    player.mp = updatedPlayer.mp;
                }
                
                const actualHealing = player.hp - oldHp;
                
                this.combatRenderer.updatePlayerHealth(player.id || player.name, player.hp, player.mp);
                this.saveCharacterToIndexedDB(player);
                
                console.log(`💚 ${player.name} healed for ${actualHealing} HP (${oldHp} → ${player.hp})`);
            }
        }
        
        // Handle spell effects (TODO: implement visual effects and status effects)
        if (spell.primaryEffect) {
            console.log(`✨ Primary effect: ${spell.primaryEffect}`);
        }
        if (spell.secondaryEffect) {
            console.log(`✨ Secondary effect: ${spell.secondaryEffect}`);
        }
        
        // Check for rage mode (HP < 20%)
        const hpPercent = enemy.hp / enemy.maxHp;
        if (hpPercent > 0 && hpPercent <= 0.2 && !enemy.inRageMode) {
            console.log(`😡 ${enemy.name} enters rage mode! (${Math.round(hpPercent * 100)}% HP)`);
            enemy.inRageMode = true;
            this.combatRenderer.playRageAnimation(enemy.id, 1000);
        }
        
        // Check if enemy defeated
        if (enemy.hp <= 0) {
            console.log(`💀 ${enemy.name} defeated by ${spell.name}!`);
            this.handleEnemyDefeat(enemy);
            return;
        }
        
        // Check for combat end
        if (this.checkCombatEnd()) {
            return;
        }
        
        // Next turn
        this.turnManager.nextTurn();
    }

    /**
     * Handle weapon/melee attacks
     */
    handleWeaponAttack(player, enemy, action) {
        // Calculate damage based on action type and damage type
        let damage = 0;
        if (action.type === 'magic') {
            // Handle old magic damage types
            if (action.damageType === 'fixed' && action.damageAmount > 0) {
                damage = action.damageAmount;
                console.log(`✨ Fixed magic damage: ${damage}`);
            } else if (action.damageType === 'd6') {
                damage = Math.floor(Math.random() * 6) + 1;
                console.log(`🎲 d6 magic damage: ${damage}`);
            } else if (action.damage) {
                damage = this.rollDamage(action.damage);
            }
        } else if (action.damage) {
            damage = this.rollDamage(action.damage);
        }
        
        // Apply MP cost if applicable
        if (action.cost && player.mp) {
            player.mp = Math.max(0, player.mp - action.cost);
            console.log(`💙 ${player.name} MP: ${player.mp}/${player.maxMp} (-${action.cost})`);
            this.combatRenderer.updatePlayerHealth(player.id || player.name, player.hp, player.mp);
            this.saveCharacterToIndexedDB(player);
        }
        
        // Apply damage to enemy
        enemy.hp = Math.max(0, enemy.hp - damage);
        
        // Show floating damage number for enemy
        if (this.combatRenderer && this.combatRenderer.showFloatingNumber) {
            const damageType = action.type === 'magic' ? 'magical' : 'physical';
            this.combatRenderer.showFloatingNumber({
                memberName: enemy.id,
                amount: damage,
                type: 'damage',
                damageType: damageType,
                isMaxDamage: false, // Will calculate properly with damage history in future
                isTopTier: damage >= 8, // Temporary: 8+ damage is top tier
                percentile: damage >= 8 ? 90 : damage * 10 // Rough approximation
            });
        }
        
        this.combatRenderer.updateEnemyHealth(enemy.id, enemy.hp, enemy.mp);
        this.combatStats.damageDealt += damage;
        
        console.log(`💥 ${action.name}: ${damage} damage! ${enemy.name} HP: ${enemy.hp}/${enemy.maxHp}`);
        
        // Check for rage mode (HP < 20%)
        const hpPercent = enemy.hp / enemy.maxHp;
        if (hpPercent > 0 && hpPercent <= 0.2 && !enemy.inRageMode) {
            console.log(`😡 ${enemy.name} enters rage mode! (${Math.round(hpPercent * 100)}% HP)`);
            enemy.inRageMode = true; // Flag to prevent multiple rage triggers
            this.combatRenderer.playRageAnimation(enemy.id, 1000);
        }
        
        // Check if enemy defeated
        if (enemy.hp <= 0) {
            console.log(`💀 ${enemy.name} defeated!`);
            // Use async defeat with animation instead of immediate removal
            this.handleEnemyDefeat(enemy);
            return; // Exit early - combat end check will happen after animation
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
        
        // Safety check: if no alive members, skip this attack (death is being handled)
        if (targets.length === 0) {
            console.log('⚰️ No alive targets for enemy attack - party is defeated');
            return;
        }
        
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        // Calculate damage (simplified for now)
        const damage = Math.floor(Math.random() * 10) + 1;
        
        console.log(`💥 ${enemy.name} attacks ${target.name} for ${damage} damage`);
        
        // Track damage taken by party
        this.combatStats.damageTaken += damage;
        
        // Apply damage
        this.partyManager.applyDamage(target.name, damage, 'physical'); // Most enemy attacks are physical
        
        // Update player health bar
        const updatedTarget = this.partyManager.getMember(target.name);
        if (updatedTarget) {
            this.combatRenderer.updatePlayerHealth(updatedTarget.id || target.name, updatedTarget.hp, updatedTarget.mp);
        }
        
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
        
        // Update enemy health bar
        this.combatRenderer.updateEnemyHealth(enemy.id, enemy.hp, enemy.mp);
        
        // Track damage dealt to enemies
        this.combatStats.damageDealt += damage;
        
        console.log(`💥 ${damage} damage! ${enemy.name} HP: ${enemy.hp}/${enemy.maxHp || enemy.hp + damage}`);
        
        // Check for rage mode (HP < 20%)
        const hpPercent = enemy.hp / (enemy.maxHp || enemy.hp + damage);
        if (hpPercent > 0 && hpPercent <= 0.2 && !enemy.inRageMode) {
            console.log(`😡 ${enemy.name} enters rage mode! (${Math.round(hpPercent * 100)}% HP)`);
            enemy.inRageMode = true; // Flag to prevent multiple rage triggers
            this.combatRenderer.playRageAnimation(enemy.id, 1000);
        }
        
        // Check if enemy defeated
        if (enemy.hp <= 0) {
            console.log(`💀 ${enemy.name} defeated!`);
            // Use async defeat with animation instead of immediate removal
            this.handleEnemyDefeat(enemy);
            return; // Exit early - combat end check will happen after animation
        }
        
        // Check for combat end
        if (this.checkCombatEnd()) {
            return;
        }
        
        // Next turn
        this.turnManager.nextTurn();
    }

    /**
     * Handle enemy defeat with animation and delayed victory check
     */
    async handleEnemyDefeat(enemy) {
        console.log(`🎬 Starting defeat sequence for ${enemy.name}`);
        
        // Remove enemy from active list immediately (but keep visual in renderer until animation completes)
        this.activeEnemies = this.activeEnemies.filter(e => e.id !== enemy.id);
        
        // Play defeat animation (2 seconds with fade to greyscale)
        await this.combatRenderer.defeatEnemy(enemy.id, 2000);
        
        // After animation completes, check if combat should end
        console.log(`✅ Defeat animation complete for ${enemy.name}, checking combat end...`);
        if (this.checkCombatEnd()) {
            return; // Combat ended
        }
        
        // If combat continues, proceed with next turn
        this.turnManager.nextTurn();
    }

    /**
     * Handle party defeat with delay for death animation/feedback
     */
    async handlePartyDefeat() {
        console.log(`🎬 Starting party defeat sequence`);
        
        // Mark that we're handling death (prevent normal combat end)
        this.isHandlingDeath = true;
        
        // Add a delay to let the final damage animation complete and give player feedback
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // After delay, show death modal
        console.log(`💀 Defeat sequence complete, showing death modal...`);
        this.handlePlayerDeath();
    }

    /**
     * Check if combat should end
     */
    checkCombatEnd() {
        const aliveParty = this.partyManager.getAliveMembers();
        const aliveEnemies = this.activeEnemies.filter(e => e.hp > 0);
        
        if (aliveParty.length === 0) {
            console.log('💀 Party defeated!');
            this.handlePartyDefeat();
            return true;
        }
        
        if (aliveEnemies.length === 0) {
            console.log('🎉 Victory!');
            console.log(`🔍 Victory check - isHandlingDeath: ${this.isHandlingDeath}`);
            this.endCombat('victory');
            return true;
        }
        
        return false;
    }

    /**
     * End combat and show results
     */
    endCombat(result = 'retreat') {
        console.log(`🏁 Combat ended: ${result}, isHandlingDeath: ${this.isHandlingDeath}`);
        
        // If we're handling death, don't do normal combat end
        if (this.isHandlingDeath && result === 'defeat') {
            console.log('💀 Skipping normal combat end - death sequence in progress');
            return;
        }
        
        console.log(`✅ Proceeding with normal combat end: ${result}`);
        
        // Set end time for duration calculation
        this.combatStats.endTime = Date.now();
        
        // Show combat results modal instead of immediately closing
        this.showCombatResults(result);
    }
    
    /**
     * Show combat results modal with loot and statistics
     */
    showCombatResults(result) {
        const modal = document.getElementById('combat-results-modal');
        const titleElement = document.getElementById('combat-results-title');
        
        // Set title and styling based on result
        if (result === 'victory') {
            titleElement.textContent = '🎉 Victory!';
            titleElement.className = 'combat-results-title victory';
            
            // Check if this was a revenge encounter (enemy that previously looted player)
            this.checkAndHandleRevengeVictory();
        } else if (result === 'defeat') {
            // Handle player death with revival system
            this.handlePlayerDeath();
            return; // Don't show normal combat results for death
        } else {
            titleElement.textContent = '🏃 Retreat!';
            titleElement.className = 'combat-results-title';
        }
        
        // Update combat statistics
        const duration = this.combatStats.endTime - this.combatStats.startTime;
        document.getElementById('damage-dealt').textContent = this.combatStats.damageDealt;
        document.getElementById('damage-taken').textContent = this.combatStats.damageTaken;
        document.getElementById('combat-duration').textContent = `${Math.round(duration / 1000)}s`;
        
        // Generate and display loot (only on victory)
        const lootContainer = document.getElementById('loot-container');
        if (result === 'victory') {
            this.generateAndDisplayLoot(lootContainer);
        } else {
            lootContainer.innerHTML = '<div class="no-loot">No loot gained</div>';
        }
        
        // Show the modal
        modal.classList.remove('hidden');
    }
    
    /**
     * Generate loot and add to player inventory
     */
    generateAndDisplayLoot(lootContainer) {
        const lootItems = this.generateLoot();
        lootContainer.innerHTML = '';
        
        if (lootItems.length === 0) {
            lootContainer.innerHTML = '<div class="no-loot">No loot found</div>';
            return;
        }
        
        lootItems.forEach(loot => {
            const lootElement = document.createElement('div');
            lootElement.className = 'loot-item';
            lootElement.innerHTML = `
                <div class="loot-icon">${loot.icon}</div>
                <div class="loot-info">
                    <div class="loot-name">${loot.name}</div>
                    <div class="loot-value">${loot.value > 0 ? loot.value + ' GP' : ''}</div>
                </div>
            `;
            lootContainer.appendChild(lootElement);
        });
        
        // CRITICAL FIX: Add all loot in a single batch operation to prevent race conditions
        this.addAllLootToTradeArea(lootItems);
    }
    
    /**
     * Generate random loot based on defeated enemies
     */
    generateLoot() {
        const loot = [];
        
        // Base gold for defeating enemies
        const baseGold = 10 + Math.floor(Math.random() * 20); // 10-29 gold
        loot.push({
            type: 'gold',
            name: `${baseGold} Gold`,
            value: baseGold,
            icon: '💰'
        });
        
        // Chance for additional items
        if (Math.random() < 0.3) { // 30% chance
            const items = [
                { name: 'Health Potion', value: 25, icon: '🧪', itemType: 'consumable' },
                { name: 'Magic Scroll', value: 15, icon: '📜', itemType: 'consumable' },
                { name: 'Iron Dagger', value: 30, icon: '🗡️', itemType: 'weapon', damage: '1d4' },
                { name: 'Leather Boots', value: 20, icon: '👢', itemType: 'armor', defense: 1 }
            ];
            const randomItem = items[Math.floor(Math.random() * items.length)];
            loot.push({
                type: 'item',
                ...randomItem
            });
        }
        
        return loot;
    }
    
    /**
     * Add multiple loot items to player trade area in a single batch operation
     */
    async addAllLootToTradeArea(lootItems) {
        const playerName = window.networkPlayerName || window.playerName || 'Player';
        
        if (!window.advancedStorageManager) {
            console.warn('No advanced storage manager available');
            return;
        }
        
        // Get existing trade area
        const tradeAreaKey = `trade_area_${playerName}`;
        let tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey) || {
            gold: 0,
            items: [],
            lastUpdated: new Date().toISOString()
        };
        
        // Process all loot items in a single operation
        lootItems.forEach(loot => {
            if (loot.type === 'gold') {
                // Add gold to trade area
                tradeArea.gold = (tradeArea.gold || 0) + loot.value;
                console.log(`💰 Added ${loot.value} gold to trade area! Total: ${tradeArea.gold}`);
            } else if (loot.type === 'item') {
                // Add item to trade area
                if (!tradeArea.items) tradeArea.items = [];
                
                const tradeItem = {
                    id: Date.now() + Math.random(),
                    name: loot.name || 'Unknown Item',
                    type: loot.itemType || 'misc',
                    value: loot.value || 0,
                    quantity: 1,
                    source: 'combat_loot',
                    dateAdded: new Date().toISOString(),
                    // Add any specific properties from loot
                    ...(loot.damage && { damage: loot.damage }),
                    ...(loot.defense && { defense: loot.defense }),
                    ...(loot.properties && { properties: loot.properties })
                };
                
                tradeArea.items.push(tradeItem);
                console.log(`📦 Added ${loot.name} to trade area`);
            }
        });
        
        // Update timestamp and save once
        tradeArea.lastUpdated = new Date().toISOString();
        await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea); // Save to both localStorage and IndexedDB
        
        // Update trade area display using unified system with fresh data
        if (window.unifiedInventory) {
            window.unifiedInventory.updateTradeAreaDisplay(tradeArea);
        } else if (window.inventoryManager) {
            window.inventoryManager.updateTradeAreaDisplay();
        }
    }

    /**
     * Add loot to player trade area (not directly to inventory)
     */
    async addLootToTradeArea(loot) {
        const playerName = window.networkPlayerName || window.playerName || 'Player';
        
        if (!window.advancedStorageManager) {
            console.warn('No advanced storage manager available');
            return;
        }
        
        // Get existing trade area
        const tradeAreaKey = `trade_area_${playerName}`;
        let tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey) || {
            gold: 0,
            items: [],
            lastUpdated: new Date().toISOString()
        };
        
        if (loot.type === 'gold') {
            // Add gold to trade area
            tradeArea.gold = (tradeArea.gold || 0) + loot.value;
            console.log(`💰 Added ${loot.value} gold to trade area! Total: ${tradeArea.gold}`);
        } else if (loot.type === 'item') {
            // Add item to trade area
            if (!tradeArea.items) tradeArea.items = [];
            
            const tradeItem = {
                id: Date.now() + Math.random(),
                name: loot.name || 'Unknown Item',
                type: loot.itemType || 'misc',
                value: loot.value || 0,
                quantity: 1,
                source: 'combat_loot',
                dateAdded: new Date().toISOString(),
                // Add any specific properties from loot
                ...(loot.damage && { damage: loot.damage }),
                ...(loot.defense && { defense: loot.defense }),
                ...(loot.properties && { properties: loot.properties })
            };
            
            tradeArea.items.push(tradeItem);
            console.log(`📦 Added ${loot.name} to trade area`);
        }
        
        // Update timestamp and save to BOTH storage methods to prevent cache issues
        tradeArea.lastUpdated = new Date().toISOString();
        await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea); // Save to both localStorage and IndexedDB
        
        // Update trade area display using unified system - CRITICAL FIX: Pass fresh data
        if (window.unifiedInventory) {
            window.unifiedInventory.updateTradeAreaDisplay(tradeArea);
        } else if (window.inventoryManager) {
            window.inventoryManager.updateTradeAreaDisplay();
        }
    }
    
    /**
     * Close combat results modal and return to map
     */
    closeCombatResults() {
        const modal = document.getElementById('combat-results-modal');
        modal.classList.add('hidden');
        
        // Now actually end combat and return to map
        this.isActive = false;
        
        // Hide combat modal
        this.combatContainer.classList.add('hidden');
        
        // CRITICAL: Refresh character sheet with updated HP/MP from combat
        this.refreshCharacterSheetAfterCombat();
        
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
        this.combatStats = {
            damageDealt: 0,
            damageTaken: 0,
            startTime: null,
            endTime: null
        };
        
        console.log('✅ Returned to map');
    }
    
    /**
     * Cleanup combat state and return to map
     */
    cleanup() {
        // Don't cleanup during death handling - wait for player choice
        if (this.isHandlingDeath) {
            console.log('💀 Skipping cleanup - death sequence in progress');
            return;
        }
        
        console.log('🧹 Cleaning up combat state...');
        
        // Reset death handling flag
        this.isHandlingDeath = false;
        
        // End combat state
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
        this.combatStats = {
            damageDealt: 0,
            damageTaken: 0,
            startTime: null,
            endTime: null
        };
        
        console.log('✅ Combat cleanup complete');
    }
    
    /**
     * Force end combat completely (for revival/death situations)
     */
    forceEndCombat() {
        console.log('🛑 Force ending combat...');
        
        // Stop turn manager completely
        if (this.turnManager) {
            this.turnManager.isActive = false;
            console.log('🛑 Turn manager force stopped');
        }
        
        // Reset death handling flag
        this.isHandlingDeath = false;
        
        // End combat state
        this.isActive = false;
        
        // Hide combat modal
        this.combatContainer.classList.add('hidden');
        
        // Resume map renderer
        if (this.mapRenderer && this.mapRenderer.resumeRendering) {
            this.mapRenderer.resumeRendering();
            console.log('🗺️ Map renderer resumed');
        }
        
        // Cleanup combat systems
        if (this.combatRenderer) {
            this.combatRenderer.cleanup();
        }
        
        // Reset ALL combat state
        this.currentCombat = null;
        this.activeEnemies = [];
        this.combatLog = [];
        this.combatStats = {
            damageDealt: 0,
            damageTaken: 0,
            startTime: null,
            endTime: null
        };
        
        // Clear any pending timeouts or intervals that might restart combat
        if (this.combatTimeout) {
            clearTimeout(this.combatTimeout);
            this.combatTimeout = null;
        }
        
        console.log('✅ Combat force ended completely');
    }

    /**
     * Refresh character sheet after combat to show updated HP/MP
     */
    async refreshCharacterSheetAfterCombat() {
        try {
            console.log('🔄 Refreshing character sheet after combat...');
            
            // Get the current player name from combat
            const playerName = this.currentCombat?.party?.players?.[0]?.name;
            if (!playerName) {
                console.warn('⚠️ No player name found for character refresh');
                return;
            }
            
            // SAFE APPROACH: Try unified storage first, then fall back to existing system
            let updatedCharacterData = null;
            
            // CRITICAL FIX: Force save the updated character data FIRST before loading
            console.log('💾 Forcing character save before refresh...');
            // DON'T use saveCurrentCharacterToStorage() - it overwrites with stale global character data
            // Instead, save the characterManager array directly since PartyManager updated it correctly
            try {
                await saveCharactersToStorage();
                console.log('✅ Forced character save completed');
            } catch (error) {
                console.warn('⚠️ Forced save failed:', error);
            }
            
            // TEMPORARILY DISABLED: Try the new unified storage system
            // (Database schema issues - will re-enable once fixed)
            /*
            if (window.unifiedStorage) {
                try {
                    const characters = await window.unifiedStorage.loadCharacters();
                    updatedCharacterData = characters.find(char => char.name === playerName);
                    if (updatedCharacterData) {
                        console.log('✅ Loaded character from unified storage');
                    }
                } catch (error) {
                    console.warn('⚠️ Unified storage failed, using fallback:', error);
                }
            }
            */
            
            // Use existing advancedStorageManager (SAFE - WORKS)
            updatedCharacterData = await this.loadCharacterFromDB(playerName);
            if (updatedCharacterData) {
                console.log('✅ Loaded character from advanced storage');
            }
            
            // FALLBACK: If storage has stale data, use characterManager array (where PartyManager saved the updates)
            if (window.characterManager && window.characterManager.characters) {
                const freshCharData = window.characterManager.characters.find(char => char.name === playerName);
                if (freshCharData && freshCharData.currentHealthPoints !== updatedCharacterData?.currentHealthPoints) {
                    console.log(`🔄 Storage data is stale (${updatedCharacterData?.currentHealthPoints} HP), using fresh characterManager data (${freshCharData.currentHealthPoints} HP)`);
                    updatedCharacterData = freshCharData;
                }
            }
            
            if (!updatedCharacterData) {
                console.warn('⚠️ Could not reload character data for refresh');
                return;
            }
            
            console.log('🔍 Updated character data:', updatedCharacterData);
            console.log('🔍 Current window.character:', window.character);
            
            // ALWAYS update/create the global character object (don't rely on it existing)
            if (updatedCharacterData) {
                if (typeof character === 'object' && character !== null && !character.tagName) {
                    console.log('🔍 Before Object.assign - character HP:', character.currentHealthPoints);
                    Object.assign(character, updatedCharacterData);
                    console.log('🔍 After Object.assign - character HP:', character.currentHealthPoints);
                    console.log(`✅ Updated existing character object: ${character.currentHealthPoints}/${character.healthPoints} HP`);
                } else {
                    // Character object doesn't exist or is invalid (might be DOM element), create it
                    window.character = { ...updatedCharacterData };
                    // Also ensure global character variable exists
                    if (typeof character === 'undefined' || character.tagName) {
                        // Use eval to assign to global scope (careful approach)
                        globalThis.character = { ...updatedCharacterData };
                    }
                    console.log(`✅ Created new character object: ${updatedCharacterData.currentHealthPoints}/${updatedCharacterData.healthPoints} HP`);
                }
            } else {
                console.error('❌ No updated character data available');
                return;
            }
            
            // Update the characterManager's stored data too (so it saves correctly)
            if (window.characterManager && window.characterManager.currentCharacterId) {
                const charIndex = window.characterManager.characters.findIndex(char => char.id === window.characterManager.currentCharacterId);
                if (charIndex !== -1) {
                    Object.assign(window.characterManager.characters[charIndex], updatedCharacterData);
                    console.log('✅ Updated characterManager stored data');
                    
                    // CRITICAL FIX: Force save immediately to prevent auto-save from overwriting
                    if (typeof saveCurrentCharacterToStorage === 'function') {
                        await saveCurrentCharacterToStorage();
                        console.log('💾 Forced immediate save to prevent auto-save conflict');
                    }
                }
            }
            
            // Trigger character sheet refresh functions (same way as loadCharacterFromManager)
            if (typeof window.updateCharacterSelections === 'function') {
                window.updateCharacterSelections();
            }
            
            if (typeof window.refreshCharacterSheet === 'function') {
                window.refreshCharacterSheet();
            }
            
            // CRITICAL: This is what updates the HP/MP display on the character sheet!
            if (typeof window.updateHealthMagicDisplay === 'function') {
                window.updateHealthMagicDisplay();
                console.log('✅ Updated HP/MP display on character sheet');
            }
            
            // ADDITIONAL: Update the character sheet specific HP/MP elements
            this.updateCharacterSheetVitals();
            
            // Also trigger the tab switch refresh behavior
            if (typeof window.updateCharacterDisplay === 'function') {
                window.updateCharacterDisplay();
            }
            
            console.log('✅ Character sheet refreshed with post-combat HP/MP');
            
        } catch (error) {
            console.error('❌ Error refreshing character sheet after combat:', error);
        }
    }

    /**
     * Update the character sheet specific HP/MP elements
     */
    updateCharacterSheetVitals() {
        if (!window.character) {
            console.warn('⚠️ No character object available for vitals update');
            return;
        }

        // Update character sheet HP display (char-current-hp, char-total-hp)
        const currentHpElement = document.getElementById('char-current-hp');
        const totalHpElement = document.getElementById('char-total-hp');
        const currentMpElement = document.getElementById('char-current-mp');
        const totalMpElement = document.getElementById('char-total-mp');

        if (currentHpElement) {
            currentHpElement.textContent = window.character.currentHealthPoints || 0;
        }
        if (totalHpElement) {
            totalHpElement.textContent = window.character.healthPoints || 0;
        }
        if (currentMpElement) {
            currentMpElement.textContent = window.character.currentMagicPoints || 0;
        }
        if (totalMpElement) {
            totalMpElement.textContent = window.character.magicPoints || 0;
        }

        console.log(`✅ Updated character sheet vitals: ${window.character.currentHealthPoints}/${window.character.healthPoints} HP, ${window.character.currentMagicPoints}/${window.character.magicPoints} MP`);
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
                    console.log('🔍 Character gold property:', currentChar.gold);
                    console.log('🔍 Full character data:', currentChar);
                    return {
                        name: currentChar.name,
                        type: 'player',
                        level: currentChar.level,
                        hp: currentChar.currentHealthPoints,
                        maxHp: currentChar.healthPoints,
                        mp: currentChar.currentMagicPoints,
                        maxMp: currentChar.magicPoints,
                        gold: currentChar.gold || 0,
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

    /**
     * Handle player death with revival mechanics
     */
    async handlePlayerDeath() {
        console.log('💀 Handling player death...');
        
        try {
            // Get current character data for calculating losses
            const currentPlayer = this.getCurrentCharacterData();
            if (!currentPlayer) {
                console.error('❌ No player data for death handling');
                return;
            }
            
            // Calculate consequences for both revival options
            const currentGold = currentPlayer.gold || 0;
            
            // Revenge penalties: 1/2 gold + 1 item
            const revengeGoldLoss = Math.floor(currentGold / 2);
            const revengeItems = this.selectItemsToLose(currentPlayer, 1);
            
            // Retreat penalties: 2/3 gold + 2 items
            const retreatGoldLoss = Math.floor(currentGold * 2 / 3);
            const retreatItems = this.selectItemsToLose(currentPlayer, 2);
            
            console.log(`💰 Player current gold: ${currentGold}`);
            console.log(`⚔️ Revenge loss: ${revengeGoldLoss} gold + ${revengeItems.length} items`);
            console.log(`🏃 Retreat loss: ${retreatGoldLoss} gold + ${retreatItems.length} items`);
            
            // Update the death modal with consequences
            const revengeGoldElement = document.getElementById('revenge-gold-loss');
            const revengeItemElement = document.getElementById('revenge-item-loss');
            const retreatGoldElement = document.getElementById('retreat-gold-loss');
            const retreatItemElement = document.getElementById('retreat-item-loss');
            
            if (revengeGoldElement) {
                revengeGoldElement.textContent = revengeGoldLoss;
            }
            
            if (revengeItemElement) {
                const revengeItemText = revengeItems.length > 0 ? 
                    revengeItems.map(item => item.name).join(', ') : 
                    'None (no items available)';
                revengeItemElement.textContent = revengeItemText;
            }
            
            if (retreatGoldElement) {
                retreatGoldElement.textContent = retreatGoldLoss;
            }
            
            if (retreatItemElement) {
                const retreatItemText = retreatItems.length > 0 ? 
                    retreatItems.map(item => item.name).join(', ') : 
                    'None (no items available)';
                retreatItemElement.textContent = retreatItemText;
            }
            
            // Show death modal
            const deathModal = document.getElementById('death-modal');
            const combatModal = document.getElementById('combat-modal');
            
            console.log('🔍 Death modal element:', deathModal);
            console.log('🔍 Combat modal element:', combatModal);
            
            if (!deathModal) {
                console.error('❌ Death modal element not found!');
                this.endCombat('defeat');
                return;
            }
            
            // Don't hide combat modal during death - keep it as background
            deathModal.classList.remove('hidden');
            
            // EXTREME DEBUG: Force visibility with inline styles
            deathModal.style.display = 'flex';
            deathModal.style.visibility = 'visible';
            deathModal.style.zIndex = '9999';
            deathModal.style.position = 'fixed';
            deathModal.style.top = '0';
            deathModal.style.left = '0';
            deathModal.style.width = '100vw';
            deathModal.style.height = '100vh';
            deathModal.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            
            console.log(` Death modal should now be visible with dual revival options`);
            console.log('🔍 Death modal classes:', deathModal.className);
            console.log('🔍 Death modal computed display:', window.getComputedStyle(deathModal).display);
            console.log('🔍 Death modal computed visibility:', window.getComputedStyle(deathModal).visibility);
            
            // Force focus on death modal to ensure it stays visible
            deathModal.focus();
            
            // Add a small delay and check again
            setTimeout(() => {
                console.log('🕐 After 100ms - Death modal still visible:', !deathModal.classList.contains('hidden'));
                console.log('🕐 After 100ms - Death modal display:', window.getComputedStyle(deathModal).display);
            }, 100);
            
        } catch (error) {
            console.error('❌ Error handling player death:', error);
            // Fallback: just end combat normally
            this.endCombat('defeat');
        }
    }
    
    /**
     * Select a random item to lose on death (including equipped items)
     */
    selectRandomItemToLose(playerData) {
        const allItems = [];
        
        // Add inventory items
        if (playerData.inventory && Array.isArray(playerData.inventory)) {
            allItems.push(...playerData.inventory.filter(item => item && item.name));
        }
        
        // Add equipped items
        if (playerData.equipment) {
            Object.entries(playerData.equipment).forEach(([slot, item]) => {
                if (item && item.name && item.name !== 'None') {
                    allItems.push({ ...item, slot: slot, equipped: true });
                }
            });
        }
        
        if (allItems.length === 0) {
            return null;
        }
        
        // Select random item
        const randomIndex = Math.floor(Math.random() * allItems.length);
        return allItems[randomIndex];
    }
    
    /**
     * Handle revival choice
     */
    async handleRevival(revivalType) {
        console.log(`💀 Revival choice: ${revivalType}`);
        console.log('🔘 handleRevival called - button click working!');
        
        try {
            if (revivalType === 'revenge' || revivalType === 'retreat') {
                // Apply death penalties based on revival type
                await this.applyDeathPenalties(revivalType);
                
                // Heal to half HP for revival (more fair than 1 HP)
                const maxHP = window.character.maxHealthPoints || 100;
                const revivalHP = Math.floor(maxHP / 2);
                
                if (window.character) {
                    window.character.currentHealthPoints = revivalHP;
                    
                    // Update characterManager array too
                    if (window.characterManager && window.characterManager.currentCharacterId) {
                        const charIndex = window.characterManager.characters.findIndex(
                            char => char.id === window.characterManager.currentCharacterId
                        );
                        if (charIndex !== -1) {
                            window.characterManager.characters[charIndex].currentHealthPoints = revivalHP;
                        }
                    }
                    
                    // Save the changes
                    await saveCharactersToStorage();
                }
                
                // Hide death modal
                const deathModal = document.getElementById('death-modal');
                deathModal.classList.add('hidden');
                console.log('💀 Death modal hidden:', deathModal.classList.contains('hidden'));
                
                // Reset death modal inline styles
                deathModal.style.display = '';
                deathModal.style.visibility = '';
                deathModal.style.zIndex = '';
                deathModal.style.position = '';
                deathModal.style.top = '';
                deathModal.style.left = '';
                deathModal.style.width = '';
                deathModal.style.height = '';
                deathModal.style.backgroundColor = '';
                console.log('💀 Death modal styles reset');
                
                if (revivalType === 'revenge') {
                    // Continue existing combat - player gets up from the ground!
                    console.log('⚔️ Revenge revival - continuing current combat');
                    if (window.addChatMessage) {
                        window.addChatMessage('⚔️ You rise from the ground, determined for revenge! Combat continues...', 'system');
                    }
                    
                    // Reset death handling flag to allow combat to continue normally
                    this.isHandlingDeath = false;
                    
                    // Update party manager to reflect the player is alive again with half HP
                    if (this.partyManager && this.partyManager.members && Array.isArray(this.partyManager.members)) {
                        const playerMember = this.partyManager.members.find(member => member.isPlayer);
                        if (playerMember) {
                            const maxHP = playerMember.maxHealthPoints || 100;
                            playerMember.currentHealthPoints = Math.floor(maxHP / 2);
                            // Sync the revival to persistent storage
                            this.partyManager.syncMemberToPersistentCharacter(playerMember);
                        }
                    } else {
                        console.warn('⚠️ PartyManager not available for revenge revival HP update');
                    }
                    
                    // Continue combat - no restart needed, enemy keeps their current state!
                    console.log('⚔️ Combat continues with enemy at current health, player at half HP');
                    
                } else if (revivalType === 'retreat') {
                    // Retreat to map - end combat and return to overworld
                    console.log('🏃 Retreat revival - returning to map');
                    
                    // Check if we have a map to return to
                    if (this.mapRenderer && this.mapRenderer.resumeRendering) {
                        // Return to map
                        this.forceEndCombat();
                        
                        // Show retreat notification
                        if (window.addChatMessage) {
                            window.addChatMessage('🏃 You retreat to safety! You return to the overworld with half health.', 'system');
                        }
                        
                        console.log('✨ Player retreated to overworld');
                    } else {
                        // No map available - just close combat
                        this.forceEndCombat();
                        
                        // Show retreat notification
                        if (window.addChatMessage) {
                            window.addChatMessage('🏃 You retreat to safety with half health!', 'system');
                        }
                        
                        console.log('✨ Player retreated - no map to return to, staying in current view');
                    }
                }
                
            } else if (revivalType === true) {
                // Legacy support for old revival system
                await this.applyDeathPenalties('retreat');
                
                // Heal to half HP for revival (more fair than 1 HP)
                const maxHP = window.character.maxHealthPoints || 100;
                const revivalHP = Math.floor(maxHP / 2);
                
                if (window.character) {
                    window.character.currentHealthPoints = revivalHP;
                    
                    // Update characterManager array too
                    if (window.characterManager && window.characterManager.currentCharacterId) {
                        const charIndex = window.characterManager.characters.findIndex(
                            char => char.id === window.characterManager.currentCharacterId
                        );
                        if (charIndex !== -1) {
                            window.characterManager.characters[charIndex].currentHealthPoints = revivalHP;
                        }
                    }
                    
                    // Save the changes
                    await saveCharactersToStorage();
                }
                
                // Hide death modal and close combat
                const deathModal = document.getElementById('death-modal');
                deathModal.classList.add('hidden');
                console.log('💀 Death modal hidden:', deathModal.classList.contains('hidden'));
                
                // Reset death modal inline styles
                deathModal.style.display = '';
                deathModal.style.visibility = '';
                deathModal.style.zIndex = '';
                deathModal.style.position = '';
                deathModal.style.top = '';
                deathModal.style.left = '';
                deathModal.style.width = '';
                deathModal.style.height = '';
                deathModal.style.backgroundColor = '';
                console.log('💀 Death modal styles reset');
                
                // Check if we have a map to return to
                if (this.mapRenderer && this.mapRenderer.resumeRendering) {
                    // Return to map
                    this.forceEndCombat();
                    
                    // Show revival notification
                    if (window.addChatMessage) {
                        window.addChatMessage('✨ You have been revived! You return to the overworld with half health.', 'system');
                    }
                    
                    console.log('✨ Player revived and returned to overworld');
                } else {
                    // No map available - just close death modal and end combat
                    this.forceEndCombat();
                    
                    // Show revival notification
                    if (window.addChatMessage) {
                        window.addChatMessage('✨ You have been revived with half health!', 'system');
                    }
                    
                    console.log('✨ Player revived - no map to return to, staying in current view');
                }
                
            } else {
                // Player chose to stay dead - return to landing screen
                const deathModal = document.getElementById('death-modal');
                deathModal.classList.add('hidden');
                console.log('💀 Death modal hidden (permanent death):', deathModal.classList.contains('hidden'));
                
                // Reset death modal inline styles
                deathModal.style.display = '';
                deathModal.style.visibility = '';
                deathModal.style.zIndex = '';
                deathModal.style.position = '';
                deathModal.style.top = '';
                deathModal.style.left = '';
                deathModal.style.width = '';
                deathModal.style.height = '';
                deathModal.style.backgroundColor = '';
                console.log('💀 Death modal styles reset (permanent death)');
                
                this.forceEndCombat();
                
                // Clear character data and return to landing screen
                if (window.characterManager) {
                    window.characterManager.currentCharacterId = null;
                }
                
                // Show landing screen
                if (typeof showLandingScreen === 'function') {
                    showLandingScreen();
                } else if (typeof switchTab === 'function') {
                    switchTab('creation');
                }
                
                console.log('💀 Player chose permanent death - returned to character selection');
            }
            
        } catch (error) {
            console.error('❌ Error handling revival:', error);
            // Fallback: just close combat
            this.cleanup();
        }
    }
    
    /**
     * Apply death penalties (lose gold and items based on revival type)
     */
    async applyDeathPenalties(revivalType = 'retreat') {
        try {
            const currentPlayer = this.getCurrentCharacterData();
            if (!currentPlayer) return;
            
            let goldLoss, itemsToLose;
            
            if (revivalType === 'revenge') {
                // Revenge: lose 1/2 gold + 1 item
                goldLoss = Math.floor(currentPlayer.gold / 2);
                itemsToLose = 1;
            } else {
                // Retreat: lose 2/3 gold + 2 items
                goldLoss = Math.floor(currentPlayer.gold * 2 / 3);
                itemsToLose = 2;
            }
            
            const newGold = currentPlayer.gold - goldLoss;
            
            // Select items to lose based on smart priority
            const lostItems = this.selectItemsToLose(currentPlayer, itemsToLose);
            
            // Apply gold penalty to character
            if (window.character) {
                window.character.gold = newGold;
            }
            
            // Apply penalties to characterManager array
            if (window.characterManager && window.characterManager.currentCharacterId) {
                const charIndex = window.characterManager.characters.findIndex(
                    char => char.id === window.characterManager.currentCharacterId
                );
                if (charIndex !== -1) {
                    window.characterManager.characters[charIndex].gold = newGold;
                    
                    // Remove the lost items
                    lostItems.forEach(lostItem => {
                        if (lostItem.equipped) {
                            // Remove equipped item
                            if (window.characterManager.characters[charIndex].equipment) {
                                window.characterManager.characters[charIndex].equipment[lostItem.slot] = { name: 'None' };
                            }
                        } else {
                            // Remove from inventory
                            if (window.characterManager.characters[charIndex].inventory) {
                                const itemIndex = window.characterManager.characters[charIndex].inventory.findIndex(
                                    item => item.name === lostItem.name
                                );
                                if (itemIndex !== -1) {
                                    window.characterManager.characters[charIndex].inventory.splice(itemIndex, 1);
                                }
                            }
                        }
                    });
                }
            }
            
            // Also update global character object
            if (window.character) {
                lostItems.forEach(lostItem => {
                    if (lostItem.equipped) {
                        if (window.character.equipment) {
                            window.character.equipment[lostItem.slot] = { name: 'None' };
                        }
                    } else {
                        if (window.character.inventory) {
                            const itemIndex = window.character.inventory.findIndex(item => item.name === lostItem.name);
                            if (itemIndex !== -1) {
                                window.character.inventory.splice(itemIndex, 1);
                            }
                        }
                    }
                });
            }
            
            const lostItemNames = lostItems.map(item => item.name).join(', ') || 'none';
            console.log(`💰 Applied ${revivalType} death penalties: -${goldLoss} gold (${newGold} remaining), lost items: ${lostItemNames}`);
            
            // Track what the enemy looted for potential recovery
            if (revivalType === 'retreat') {
                // Only track loot for retreat - revenge means fighting same enemy so no loot tracking needed
                this.trackEnemyLoot(goldLoss, lostItems);
            }
            
        } catch (error) {
            console.error('❌ Error applying death penalties:', error);
        }
    }
    
    /**
     * Track what an enemy has looted from the player for potential recovery
     */
    trackEnemyLoot(goldLoss, lostItems) {
        try {
            // Determine enemy type from current combat
            let enemyType = 'Unknown Enemy';
            if (this.currentCombat && this.currentCombat.enemies && this.currentCombat.enemies.length > 0) {
                enemyType = this.currentCombat.enemies[0].name || this.currentCombat.enemies[0].type || 'Unknown Enemy';
            }
            
            // Create loot record
            const lootRecord = {
                enemyType: enemyType,
                gold: goldLoss,
                items: lostItems.map(item => ({
                    name: item.name,
                    equipped: item.equipped,
                    slot: item.slot
                })),
                timestamp: Date.now(),
                encounterChance: 1.5 // Base 1.5% chance to encounter this enemy
            };
            
            // Add to looted enemies list
            this.lootedByEnemies.push(lootRecord);
            
            // Save to localStorage for persistence
            this.saveLootedEnemies();
            
            console.log(`📦 Enemy "${enemyType}" has looted: ${goldLoss} gold + ${lostItems.length} items`);
            console.log(`🎯 Current encounter chance: ${lootRecord.encounterChance}%`);
            
        } catch (error) {
            console.error('❌ Error tracking enemy loot:', error);
        }
    }
    
    /**
     * Save looted enemies data to localStorage
     */
    saveLootedEnemies() {
        try {
            localStorage.setItem('dungeonCrawler_lootedEnemies', JSON.stringify(this.lootedByEnemies));
        } catch (error) {
            console.error('❌ Error saving looted enemies:', error);
        }
    }
    
    /**
     * Load looted enemies data from localStorage
     */
    loadLootedEnemies() {
        try {
            const saved = localStorage.getItem('dungeonCrawler_lootedEnemies');
            if (saved) {
                this.lootedByEnemies = JSON.parse(saved);
                console.log(`📦 Loaded ${this.lootedByEnemies.length} looted enemy records`);
            }
        } catch (error) {
            console.error('❌ Error loading looted enemies:', error);
            this.lootedByEnemies = [];
        }
    }
    
    /**
     * Check if current enemy encounter should be a revenge encounter
     */
    checkForRevengeEncounter(enemyType) {
        try {
            // Find any looted records for this enemy type
            const lootRecord = this.lootedByEnemies.find(record => record.enemyType === enemyType);
            if (!lootRecord) return false;
            
            // Roll for encounter chance
            const roll = Math.random() * 100;
            const success = roll < lootRecord.encounterChance;
            
            if (success) {
                console.log(`🎯 REVENGE ENCOUNTER! Found the "${enemyType}" that looted you!`);
                console.log(`📦 They have: ${lootRecord.gold} gold + ${lootRecord.items.length} items`);
                return lootRecord;
            } else {
                // Increase encounter chance for next time
                lootRecord.encounterChance += 1.5; // Compound by 1.5% each time
                this.saveLootedEnemies();
                console.log(`🎯 Missed revenge encounter. New chance: ${lootRecord.encounterChance}%`);
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error checking revenge encounter:', error);
            return false;
        }
    }
    
    /**
     * Select items to lose based on smart priority system
     */
    selectItemsToLose(player, count) {
        const allItems = [];
        
        // Collect all items with priority scores
        // Priority: 1 = healing items (lose first), 2 = accessories, 3 = offhand, 4 = weapons/armor (lose last)
        
        // Check inventory for healing items and accessories
        if (player.inventory) {
            player.inventory.forEach(item => {
                let priority = 2; // Default: accessories
                
                if (item.name && (
                    item.name.toLowerCase().includes('potion') ||
                    item.name.toLowerCase().includes('heal') ||
                    item.name.toLowerCase().includes('remedy') ||
                    item.name.toLowerCase().includes('elixir')
                )) {
                    priority = 1; // Healing items go first
                }
                
                allItems.push({
                    name: item.name,
                    priority: priority,
                    equipped: false,
                    slot: null,
                    source: 'inventory'
                });
            });
        }
        
        // Check equipped items
        if (player.equipment) {
            Object.entries(player.equipment).forEach(([slot, item]) => {
                if (item && item.name && item.name !== 'None') {
                    let priority = 4; // Default: weapons/armor (protect last)
                    
                    if (slot === 'accessory1' || slot === 'accessory2' || slot === 'ring') {
                        priority = 2; // Accessories
                    } else if (slot === 'offhand' || slot === 'shield') {
                        priority = 3; // Offhand/shield
                    }
                    
                    allItems.push({
                        name: item.name,
                        priority: priority,
                        equipped: true,
                        slot: slot,
                        source: 'equipment'
                    });
                }
            });
        }
        
        // If no items available, return empty array
        if (allItems.length === 0) {
            return [];
        }
        
        // Sort by priority (lower number = lost first), then randomly
        allItems.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return Math.random() - 0.5; // Random for same priority
        });
        
        // Return up to 'count' items, but don't exceed available items
        return allItems.slice(0, Math.min(count, allItems.length));
    }
    
    /**
     * Check if current enemy encounter should be a revenge encounter at combat start
     */
    checkForRevengeEncounterStart() {
        console.log('🔍 checkForRevengeEncounterStart() called!');
        try {
            // Determine enemy type from current combat
            let enemyType = 'Unknown Enemy';
            if (this.currentCombat && this.currentCombat.enemies && this.currentCombat.enemies.length > 0) {
                enemyType = this.currentCombat.enemies[0].name || this.currentCombat.enemies[0].type || 'Unknown Enemy';
            }
            
            console.log(`🔍 Checking revenge encounter for enemy: "${enemyType}"`);
            console.log(`🔍 Current looted enemies count: ${this.lootedByEnemies.length}`);
            this.lootedByEnemies.forEach((record, index) => {
                console.log(`   ${index + 1}. "${record.enemyType}" - ${record.encounterChance}% chance`);
            });
            
            // Find if this enemy type had looted the player before
            const lootRecord = this.lootedByEnemies.find(record => record.enemyType === enemyType);
            
            if (lootRecord) {
                console.log(`📦 Found loot record for "${enemyType}" with ${lootRecord.encounterChance}% chance`);
                
                // Roll for encounter chance
                const roll = Math.random() * 100;
                const success = roll < lootRecord.encounterChance;
                
                console.log(`🎲 Rolling for revenge encounter: ${roll.toFixed(1)}% vs ${lootRecord.encounterChance}% threshold = ${success ? 'SUCCESS' : 'FAILED'}`);
                
                if (success) {
                    // This is THE enemy that looted us! Mark as revenge encounter
                    this.currentRevengeEncounter = lootRecord;
                    
                    // Show special start message
                    if (window.addChatMessage) {
                        window.addChatMessage(`😡 Wait... that ${enemyType} looks familiar! They have your stolen gear!`, 'system');
                        window.addChatMessage(`💰 If you defeat them, you can recover ${lootRecord.gold} gold and ${lootRecord.items.length} items!`, 'system');
                    }
                    
                    console.log(`😡 REVENGE ENCOUNTER! This ${enemyType} has our stolen loot!`);
                    console.log(`💰 Can recover: ${lootRecord.gold} gold + ${lootRecord.items.length} items`);
                } else {
                    // Failed the roll, increase encounter chance for next time
                    const oldChance = lootRecord.encounterChance;
                    lootRecord.encounterChance += 1.5;
                    this.saveLootedEnemies();
                    console.log(`🎯 Missed revenge encounter. Chance increased: ${oldChance}% -> ${lootRecord.encounterChance}%`);
                    
                    // Not a revenge encounter
                    this.currentRevengeEncounter = null;
                }
            } else {
                console.log(`❌ No loot record found for enemy type: "${enemyType}"`);
                // No loot record for this enemy type
                this.currentRevengeEncounter = null;
            }
            
        } catch (error) {
            console.error('❌ Error checking revenge encounter start:', error);
            this.currentRevengeEncounter = null;
        }
    }
    
    /**
     * Check if the defeated enemy was one that previously looted the player
     */
    checkAndHandleRevengeVictory() {
        try {
            // Determine enemy type from current combat
            let enemyType = 'Unknown Enemy';
            if (this.currentCombat && this.currentCombat.enemies && this.currentCombat.enemies.length > 0) {
                enemyType = this.currentCombat.enemies[0].name || this.currentCombat.enemies[0].type || 'Unknown Enemy';
            }
            
            // Find if this enemy type had looted the player before
            const lootRecordIndex = this.lootedByEnemies.findIndex(record => record.enemyType === enemyType);
            
            if (lootRecordIndex !== -1) {
                const lootRecord = this.lootedByEnemies[lootRecordIndex];
                
                // REVENGE COMPLETE! Recover the stolen goods
                this.recoverStolenGoods(lootRecord);
                
                // Remove the loot record since we got our stuff back
                this.lootedByEnemies.splice(lootRecordIndex, 1);
                this.saveLootedEnemies();
                
                // Show special revenge victory message
                const titleElement = document.getElementById('combat-results-title');
                titleElement.textContent = '⚔️ REVENGE COMPLETE! 💰';
                titleElement.className = 'combat-results-title revenge-victory';
                
                // Add special message to chat
                if (window.addChatMessage) {
                    window.addChatMessage(`⚔️ Hey, this guy had your gear! No wonder he looked familiar...`, 'system');
                    window.addChatMessage(`💰 You recovered ${lootRecord.gold} gold and ${lootRecord.items.length} stolen items!`, 'system');
                }
                
                console.log(`⚔️ REVENGE COMPLETE! Defeated "${enemyType}" and recovered stolen goods!`);
            }
            
        } catch (error) {
            console.error('❌ Error checking revenge victory:', error);
        }
    }
    
    /**
     * Recover stolen goods from defeated enemy
     */
    recoverStolenGoods(lootRecord) {
        try {
            const currentPlayer = this.getCurrentCharacterData();
            if (!currentPlayer) return;
            
            // Recover gold
            const newGold = (currentPlayer.gold || 0) + lootRecord.gold;
            
            // Update gold in all character storage locations
            if (window.character) {
                window.character.gold = newGold;
            }
            
            if (window.characterManager && window.characterManager.currentCharacterId) {
                const charIndex = window.characterManager.characters.findIndex(
                    char => char.id === window.characterManager.currentCharacterId
                );
                if (charIndex !== -1) {
                    window.characterManager.characters[charIndex].gold = newGold;
                }
            }
            
            // Recover items
            lootRecord.items.forEach(stolenItem => {
                if (stolenItem.equipped) {
                    // Re-equip the item
                    if (window.character && window.character.equipment) {
                        window.character.equipment[stolenItem.slot] = { name: stolenItem.name };
                    }
                    
                    if (window.characterManager && window.characterManager.currentCharacterId) {
                        const charIndex = window.characterManager.characters.findIndex(
                            char => char.id === window.characterManager.currentCharacterId
                        );
                        if (charIndex !== -1 && window.characterManager.characters[charIndex].equipment) {
                            window.characterManager.characters[charIndex].equipment[stolenItem.slot] = { name: stolenItem.name };
                        }
                    }
                } else {
                    // Add back to inventory
                    if (window.character && window.character.inventory) {
                        window.character.inventory.push({ name: stolenItem.name });
                    }
                    
                    if (window.characterManager && window.characterManager.currentCharacterId) {
                        const charIndex = window.characterManager.characters.findIndex(
                            char => char.id === window.characterManager.currentCharacterId
                        );
                        if (charIndex !== -1 && window.characterManager.characters[charIndex].inventory) {
                            window.characterManager.characters[charIndex].inventory.push({ name: stolenItem.name });
                        }
                    }
                }
            });
            
            // Save the recovered data
            saveCharactersToStorage();
            
            console.log(`💰 Recovered: ${lootRecord.gold} gold + ${lootRecord.items.length} items`);
            
        } catch (error) {
            console.error('❌ Error recovering stolen goods:', error);
        }
    }
    
    /**
     * DEBUG: Create a test revenge encounter for console testing
     * Usage: window.combatManager.createTestRevengeEncounter()
     */
    createTestRevengeEncounter(enemyType = 'Goblin Grunt', gold = 100, items = ['Health Potion', 'Iron Sword'], encounterChance = 90) {
        try {
            // Create a test loot record
            const testLootRecord = {
                enemyType: enemyType,
                gold: gold,
                items: items.map(itemName => ({
                    name: itemName,
                    equipped: false,
                    slot: null
                })),
                timestamp: Date.now(),
                encounterChance: encounterChance
            };
            
            // Remove any existing record for this enemy type
            this.lootedByEnemies = this.lootedByEnemies.filter(record => record.enemyType !== enemyType);
            
            // Add the test record
            this.lootedByEnemies.push(testLootRecord);
            this.saveLootedEnemies();
            
            console.log(`🧪 TEST REVENGE ENCOUNTER CREATED:`);
            console.log(`   Enemy: ${enemyType}`);
            console.log(`   Stolen Gold: ${gold}`);
            console.log(`   Stolen Items: ${items.join(', ')}`);
            console.log(`   Encounter Chance: ${encounterChance}%`);
            console.log(`📝 Next time you fight a ${enemyType}, you have a ${encounterChance}% chance for revenge!`);
            
            if (window.addChatMessage) {
                window.addChatMessage(`🧪 DEBUG: Set up test revenge encounter with ${enemyType} (${encounterChance}% chance)`, 'system');
            }
            
            return testLootRecord;
            
        } catch (error) {
            console.error('❌ Error creating test revenge encounter:', error);
        }
    }
    
    /**
     * DEBUG: Check current looted enemies list
     * Usage: window.combatManager.showLootedEnemies()
     */
    showLootedEnemies() {
        console.log(`📦 CURRENT LOOTED ENEMIES (${this.lootedByEnemies.length}):`);
        this.lootedByEnemies.forEach((record, index) => {
            console.log(`${index + 1}. ${record.enemyType}:`);
            console.log(`   Gold: ${record.gold}`);
            console.log(`   Items: ${record.items.map(item => item.name).join(', ')}`);
            console.log(`   Encounter Chance: ${record.encounterChance}%`);
            console.log(`   Date: ${new Date(record.timestamp).toLocaleString()}`);
        });
        
        if (this.lootedByEnemies.length === 0) {
            console.log('   (No enemies have looted you yet)');
        }
    }
    
    /**
     * DEBUG: Clear all looted enemies
     * Usage: window.combatManager.clearLootedEnemies()
     */
    clearLootedEnemies() {
        this.lootedByEnemies = [];
        this.saveLootedEnemies();
        console.log('🧹 Cleared all looted enemies');
        
        if (window.addChatMessage) {
            window.addChatMessage('🧹 DEBUG: Cleared all revenge encounters', 'system');
        }
    }
    
    /**
     * DEBUG: Manually test revenge encounter check
     * Usage: window.combatManager.testRevengeCheck()
     */
    testRevengeCheck() {
        console.log('🧪 Manually testing revenge encounter check...');
        this.checkForRevengeEncounterStart();
    }
}

// Auto-initialize when loaded
window.combatManager = new CombatManager();
console.log('🎮 CombatManager loaded and ready!');