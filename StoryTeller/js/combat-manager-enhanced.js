// ========================================
// ENHANCED COMBAT MANAGER
// Ported from StoryTeller.mobile.old with improvements
// Handles combat encounters, enemy management, and player attacks
// ========================================

// ========================================
// COMBAT STATE
// ========================================
let currentCombat = {
    active: false,
    round: 0,
    turn: 0,
    participants: [],
    currentEnemy: null,
    environment: null,
    combatLog: []
};

let loadedEnemies = {};
let combatHandler = null;

// ========================================
// COMBAT HANDLER CLASS (from old system)
// ========================================
class CombatHandler {
    constructor() {
        this.enemies = new Map();
        this.combatLog = [];
        this.onEnemyDefeated = null;
        this.onCombatEvent = null;
    }

    setEventHandlers(onEnemyDefeated, onCombatEvent) {
        this.onEnemyDefeated = onEnemyDefeated;
        this.onCombatEvent = onCombatEvent;
    }

    addEnemy(enemyData) {
        if (!enemyData.id || !enemyData.name) {
            throw new Error('Enemy must have id and name');
        }

        this.enemies.set(enemyData.id, {
            id: enemyData.id,
            name: enemyData.name,
            maxHp: enemyData.hp || 10,
            currentHp: enemyData.hp || 10,
            ac: enemyData.ac || 10,
            isActive: true,
            damage_taken: 0
        });

        console.log(`➕ Added enemy: ${enemyData.name} (HP: ${enemyData.hp})`);
        return this.enemies.get(enemyData.id);
    }

    processAttack(attackData) {
        if (!attackData || !attackData.isValid) {
            throw new Error('Invalid attack data');
        }

        const result = {
            playerName: attackData.playerName,
            roll: attackData.roll,
            damage: attackData.damage,
            weapon: attackData.weapon,
            hits: [],
            kills: [],
            message: ''
        };

        // Process attack against current enemy
        const enemy = currentCombat.currentEnemy;
        if (!enemy || !enemy.isActive) {
            result.message = `No active enemy to attack!`;
            return result;
        }

        const hit = attackData.roll >= enemy.ac;
        if (hit) {
            const oldHp = enemy.currentHp;
            enemy.currentHp = Math.max(0, enemy.currentHp - attackData.damage);
            enemy.damage_taken = (enemy.damage_taken || 0) + attackData.damage;

            const hitInfo = {
                enemyId: enemy.id,
                enemyName: enemy.name,
                damage: attackData.damage,
                remainingHp: enemy.currentHp,
                wasKilled: enemy.currentHp === 0
            };

            result.hits.push(hitInfo);

            if (enemy.currentHp === 0 && enemy.isActive) {
                enemy.isActive = false;
                result.kills.push(hitInfo);
                
                if (this.onEnemyDefeated) {
                    this.onEnemyDefeated(enemy, attackData.playerName);
                }
            }

            console.log(`🎯 ${attackData.playerName} hit ${enemy.name} for ${attackData.damage} damage (${enemy.currentHp}/${enemy.maxHp} HP remaining)`);
        }

        result.message = this.formatAttackResult(result);
        this.combatLog.push({
            timestamp: new Date(),
            type: 'attack',
            data: result
        });

        if (this.onCombatEvent) {
            this.onCombatEvent('attack', result);
        }

        return result;
    }

    formatAttackResult(result) {
        if (result.hits.length === 0) {
            return `${result.playerName} missed!`;
        }

        let message = `${result.playerName} hit for ${result.damage} damage!`;
        if (result.kills.length > 0) {
            message += ` ${result.kills[0].enemyName} is defeated!`;
        }
        return message;
    }
}

// ========================================
// LOAD ENEMY DATA
// ========================================
async function loadEnemyData() {
    try {
        const response = await fetch('./data/enemies.json');
        loadedEnemies = await response.json();
        console.log('🗂️ Enemy data loaded:', Object.keys(loadedEnemies).length, 'floors');
        
        // Populate floor selection dropdown
        populateFloorSelect();
    } catch (error) {
        console.error('❌ Failed to load enemy data:', error);
        loadedEnemies = {};
    }
}

function populateFloorSelect() {
    const floorSelect = document.getElementById('floor-select');
    if (!floorSelect || !loadedEnemies) return;

    // Clear existing options
    floorSelect.innerHTML = '';

    // Add floor options
    Object.entries(loadedEnemies).forEach(([floorId, floorData]) => {
        const option = document.createElement('option');
        option.value = floorId;
        option.textContent = `${floorData.name || floorId}`;
        floorSelect.appendChild(option);
    });
}

// ========================================
// COMBAT INITIALIZATION
// ========================================
function initializeCombatManager() {
    // Initialize combat handler
    if (!combatHandler) {
        combatHandler = new CombatHandler();
        combatHandler.setEventHandlers(handleEnemyDefeated, handleCombatEvent);
    }
    
    // Load enemy data
    loadEnemyData();
    
    console.log('⚔️ Enhanced Combat Manager initialized');
}

// Panel-based initialization (called when combat panel loads)
function initializeCombatPanel() {
    initializeCombatManager();
    
    // Refresh display if combat is already active
    if (currentCombat.active) {
        refreshCombatDisplay();
    }
}

// ========================================
// INITIALIZATION
// ========================================
// Auto-initialize when script loads (for compatibility)
if (typeof window !== 'undefined') {
    // Browser environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('⚔️ Combat Manager Enhanced script loaded');
            // Don't auto-initialize - wait for panel to load
        });
    } else {
        console.log('⚔️ Combat Manager Enhanced script loaded');
        // Don't auto-initialize - wait for panel to load
    }
} else {
    // Node.js environment (for testing)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CombatHandler,
            initializeCombatManager,
            currentCombat,
            loadedEnemies
        };
    }
}

function createEnhancedCombatTabContent() {
    return `
        <div class="content-wrapper">
            <!-- Combat Setup Card -->
            <div class="card combat-setup-card">
                <div class="card-header">
                    <i class="ra ra-crossed-swords"></i>
                    <h3>Combat Setup</h3>
                    <div class="combat-controls">
                        <select id="floor-select" class="type-select">
                            <option value="">Loading floors...</option>
                        </select>
                        <button class="generate-btn" onclick="showAvailableEnemies()">
                            <i class="ra ra-monster-skull"></i>
                            Browse Enemies
                        </button>
                        <button class="generate-btn" onclick="showEncounterNPCs()" style="background: #8b5cf6;">
                            <i class="ra ra-player"></i>
                            Encounter NPCs
                        </button>
                    </div>
                </div>
                
                <!-- Enemy Selection -->
                <div class="enemy-selection" id="enemy-selection" style="display: none;">
                    <h4>Available Enemies:</h4>
                    <div class="enemy-grid" id="enemy-grid"></div>
                </div>
                
                <!-- Combat Status -->
                <div class="combat-status" id="combat-status">
                    <div class="status-item">
                        <span class="status-label">Combat Active:</span>
                        <span class="status-value" id="combat-active-status">No</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Round:</span>
                        <span class="status-value" id="combat-round">0</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Current Enemy:</span>
                        <span class="status-value" id="current-enemy-name">None</span>
                    </div>
                </div>
            </div>
            
            <!-- Active Combat Card -->
            <div class="card active-combat-card" id="active-combat-card" style="display: none;">
                <div class="card-header">
                    <i class="ra ra-battle"></i>
                    <h3>Active Combat</h3>
                    <div class="combat-actions">
                        <button class="action-btn end-combat-btn" onclick="endCombat()">
                            <i class="material-icons">stop</i>
                            End Combat
                        </button>
                    </div>
                </div>
                
                <!-- Current Enemy Display -->
                <div class="current-enemy-display" id="current-enemy-display"></div>
                
                <!-- Player Attack Input (Enhanced) -->
                <div class="player-attack-section">
                    <h4>🎯 Player Attack Resolution</h4>
                    <div class="attack-input-grid">
                        <div class="input-group">
                            <label>Player Name</label>
                            <input type="text" id="attacking-player" placeholder="Player name..." list="player-names">
                            <datalist id="player-names"></datalist>
                        </div>
                        <div class="input-group">
                            <label>Attack Roll (d20 + mods)</label>
                            <input type="number" id="attack-roll" placeholder="Total attack roll..." min="1" max="50">
                        </div>
                        <div class="input-group">
                            <label>Damage Roll</label>
                            <input type="number" id="damage-roll" placeholder="Total damage..." min="0">
                        </div>
                        <div class="input-group">
                            <button class="resolve-btn" onclick="resolvePlayerAttack()">
                                <i class="ra ra-sword"></i>
                                Resolve Attack
                            </button>
                        </div>
                    </div>
                    <div class="quick-help">
                        💡 <strong>Quick Help:</strong> Enter player name, their total attack roll, and total damage. The system will compare vs enemy AC.
                    </div>
                </div>
                
                <!-- Combat Log (Enhanced) -->
                <div class="combat-log-section">
                    <h4>📜 Combat Log</h4>
                    <div class="combat-log" id="combat-log">
                        <div class="log-entry">⚔️ Combat ready - waiting for first attack...</div>
                    </div>
                    <div class="log-controls">
                        <button class="small-btn" onclick="clearCombatLog()">Clear Log</button>
                        <button class="small-btn" onclick="exportCombatLog()">Export Log</button>
                    </div>
                </div>
            </div>
            
            <!-- Enemy Quick Reference -->
            <div class="card enemy-management-card">
                <div class="card-header">
                    <i class="ra ra-monster-skull"></i>
                    <h3>Enemy Quick Reference</h3>
                </div>
                <div class="enemy-quick-stats" id="enemy-quick-stats">
                    <p>Select an enemy from the combat setup to see quick reference stats.</p>
                </div>
            </div>
            
            <!-- Network Status (for future) -->
            <div class="card network-status-card" style="display: none;" id="network-status-card">
                <div class="card-header">
                    <i class="material-icons">wifi</i>
                    <h3>Network Combat</h3>
                </div>
                <div class="network-status">
                    <div class="status-indicator offline" id="network-indicator">
                        <span class="indicator-dot"></span>
                        <span>Offline - Manual Mode</span>
                    </div>
                    <p>When network combat is enabled, player attacks will appear here automatically.</p>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// ENEMY MANAGEMENT
// ========================================
function showAvailableEnemies() {
    const floorSelect = document.getElementById('floor-select');
    const selectedFloor = floorSelect.value;
    const enemyGrid = document.getElementById('enemy-grid');
    
    if (!selectedFloor) {
        enemyGrid.innerHTML = `
            <div class="enemy-placeholder">
                <i class="ra ra-monster-skull"></i>
                <p>Select a floor above to see available enemies</p>
            </div>
        `;
        return;
    }
    
    if (!loadedEnemies[selectedFloor]) {
        enemyGrid.innerHTML = `
            <div class="enemy-placeholder">
                <i class="ra ra-monster-skull"></i>
                <p>No enemies available for this floor</p>
            </div>
        `;
        return;
    }
    
    const floorData = loadedEnemies[selectedFloor];
    const enemies = floorData.enemies || floorData;
    enemyGrid.innerHTML = '';
    
    Object.entries(enemies).forEach(([enemyId, enemy]) => {
        if (enemy.name) { // Skip non-enemy entries
            const enemyCard = createEnemyCard(selectedFloor, enemyId, enemy);
            enemyGrid.appendChild(enemyCard);
        }
    });
    
    // If no enemies were added, show message
    if (enemyGrid.children.length === 0) {
        enemyGrid.innerHTML = `
            <div class="enemy-placeholder">
                <i class="ra ra-monster-skull"></i>
                <p>No valid enemies found for this floor</p>
            </div>
        `;
    }
}

function createEnemyCard(floor, enemyId, enemy) {
    const enemyCard = document.createElement('div');
    enemyCard.className = 'enemy-card';
    
    enemyCard.innerHTML = `
        <h6>${enemy.name}</h6>
        <div class="enemy-stats">
            <div class="enemy-stat">
                <span>HP:</span>
                <span>${enemy.hp || 10}</span>
            </div>
            <div class="enemy-stat">
                <span>AC:</span>
                <span>${enemy.ac || 10}</span>
            </div>
            <div class="enemy-stat">
                <span>Level:</span>
                <span>${enemy.level || 1}</span>
            </div>
            <div class="enemy-stat">
                <span>Attacks:</span>
                <span>${enemy.attacks?.length || 0}</span>
            </div>
        </div>
    `;
    
    enemyCard.onclick = () => selectEnemyForCombat(floor, enemyId);
    return enemyCard;
}

function showEncounterNPCs() {
    // Placeholder for NPC encounters - will integrate with NPC manager
    const enemyGrid = document.getElementById('enemy-grid');
    const enemySelection = document.getElementById('enemy-selection');
    
    enemyGrid.innerHTML = `
        <div class="encounter-npc-info">
            <h4>🎭 Encounter NPCs</h4>
            <p>This feature will integrate with the NPC Manager to allow selecting NPCs as combat encounters.</p>
            <p><strong>Coming Soon:</strong> Select any NPC from your collection and use them in combat!</p>
            <button class="action-btn" onclick="document.getElementById('enemy-selection').style.display='none'">
                Close
            </button>
        </div>
    `;
    
    enemySelection.style.display = 'block';
}

// ========================================
// COMBAT FLOW MANAGEMENT
// ========================================
function selectEnemyForCombat(floor, enemyId) {
    const floorData = loadedEnemies[floor];
    const enemy = floorData.enemies?.[enemyId] || floorData[enemyId];
    if (!enemy) return;
    
    // Clear previous selection
    document.querySelectorAll('.enemy-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Mark current selection
    event.target.closest('.enemy-card').classList.add('selected');
    
    // Create enhanced enemy instance
    currentCombat.currentEnemy = {
        ...enemy,
        id: enemyId,
        floor: floor,
        currentHp: enemy.hp,
        maxHp: enemy.hp,
        isActive: true,
        damage_taken: 0
    };
    
    currentCombat.active = true;
    currentCombat.round = 1;
    currentCombat.combatLog = [];
    
    // Update displays
    updateCombatStatus();
    displayCurrentEnemy();
    populatePlayerNames();
    
    // Add to combat log
    addToCombatLog(`⚔️ Combat started with ${enemy.name}! (HP: ${enemy.hp}, AC: ${enemy.ac})`);
    
    console.log(`🎯 Combat started with ${enemy.name}`);
}

function displayCurrentEnemy() {
    const enemy = currentCombat.currentEnemy;
    if (!enemy) return;
    
    const section = document.getElementById('current-enemy-section');
    const display = document.getElementById('current-enemy-display');
    const healthPercentage = (enemy.currentHp / enemy.maxHp) * 100;
    
    display.innerHTML = `
        <h6>${enemy.name} <span style="font-size: 0.8em; color: var(--text-secondary);">Level ${enemy.level || 1}</span></h6>
        <div class="enemy-stats">
            <div class="enemy-stat">
                <span>HP:</span>
                <span>${enemy.currentHp} / ${enemy.maxHp}</span>
            </div>
            <div class="enemy-stat">
                <span>AC:</span>
                <span>${enemy.ac || 10}</span>
            </div>
            <div class="enemy-stat">
                <span>Attacks:</span>
                <span>${enemy.attacks?.length || 0}</span>
            </div>
            <div class="enemy-stat">
                <span>Health:</span>
                <span style="color: ${healthPercentage > 50 ? 'var(--success-color)' : healthPercentage > 25 ? 'var(--warning-color)' : 'var(--error-color)'}">${Math.round(healthPercentage)}%</span>
            </div>
        </div>
    `;
    
    section.style.display = 'block';
}

function updateCombatStatus() {
    document.getElementById('combat-active-status').textContent = currentCombat.active ? 'Yes' : 'No';
    document.getElementById('combat-round').textContent = currentCombat.round;
    document.getElementById('current-enemy-name').textContent = 
        currentCombat.currentEnemy ? currentCombat.currentEnemy.name : 'None';
        
    // Show/hide end combat button
    const endCombatBtn = document.querySelector('.end-combat-btn');
    if (endCombatBtn) {
        endCombatBtn.style.display = currentCombat.active ? 'block' : 'none';
    }
}

function populatePlayerNames() {
    // Get player names from character sync or previous entries
    const datalist = document.getElementById('player-names');
    
    // Handle case where datalist doesn't exist in streamlined UI
    if (!datalist) {
        console.log('Player names datalist not found - using streamlined combat UI');
        return;
    }
    
    datalist.innerHTML = '';
    
    // Add names from recent combat log
    const recentNames = [...new Set(
        currentCombat.combatLog
            .filter(entry => entry.playerName)
            .map(entry => entry.playerName)
    )];
    
    recentNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}

// ========================================
// COMBAT RESOLUTION
// ========================================
function resolvePlayerAttack() {
    const playerName = document.getElementById('attacking-player').value.trim();
    const attackRoll = parseInt(document.getElementById('attack-roll').value);
    const damageRoll = parseInt(document.getElementById('damage-roll').value);
    
    if (!playerName || !attackRoll || isNaN(damageRoll)) {
        alert('⚠️ Please enter player name, attack roll, and damage.');
        return;
    }
    
    const enemy = currentCombat.currentEnemy;
    if (!enemy || !enemy.isActive) {
        alert('⚠️ No active enemy to attack!');
        return;
    }
    
    // Determine hit/miss
    const hit = attackRoll >= enemy.ac;
    let logEntry = `🎲 ${playerName} rolls ${attackRoll} to hit (AC ${enemy.ac})`;
    
    if (hit) {
        // Apply damage
        const actualDamage = Math.max(0, damageRoll);
        enemy.currentHp = Math.max(0, enemy.currentHp - actualDamage);
        enemy.damage_taken = (enemy.damage_taken || 0) + actualDamage;
        
        logEntry += ` - ✅ HIT! ${actualDamage} damage dealt. ${enemy.name} has ${enemy.currentHp}/${enemy.maxHp} HP remaining.`;
        
        if (enemy.currentHp <= 0) {
            enemy.isActive = false;
            logEntry += ` 💀 ${enemy.name} is defeated!`;
            handleEnemyDefeated(enemy, playerName);
        }
    } else {
        logEntry += ` - ❌ MISS!`;
    }
    
    // Update displays
    addToCombatLog(logEntry);
    displayCurrentEnemy();
    updateCombatStatus();
    populatePlayerNames();
    
    // Clear input fields
    document.getElementById('attacking-player').value = '';
    document.getElementById('attack-roll').value = '';
    document.getElementById('damage-roll').value = '';
    
    // Auto-end combat if enemy defeated
    if (enemy.currentHp <= 0) {
        setTimeout(() => {
            if (confirm('Enemy defeated! End combat?')) {
                endCombat();
            }
        }, 1500);
    }
    
    // Advance round
    currentCombat.round++;
    updateCombatStatus();
}

function handleEnemyDefeated(enemy, playerName) {
    let defeatMessage = `🏆 ${enemy.name} defeated by ${playerName}!`;
    
    // Add loot info
    if (enemy.loot && enemy.loot.length > 0) {
        defeatMessage += ` 💰 Loot: ${enemy.loot.join(', ')}`;
    }
    
    // Add viewer appeal info
    if (enemy.viewer_appeal) {
        defeatMessage += ` 📺 Appeal: ${enemy.viewer_appeal}`;
    }
    
    addToCombatLog(defeatMessage);
    
    // Update quick stats
    updateEnemyQuickStats(enemy);
}

function handleCombatEvent(eventType, eventData) {
    console.log(`🎭 Combat Event: ${eventType}`, eventData);
    // Hook for future network integration
}

function endCombat() {
    if (currentCombat.active) {
        addToCombatLog(`🏁 Combat ended after ${currentCombat.round - 1} rounds.`);
    }
    
    currentCombat.active = false;
    currentCombat.round = 0;
    currentCombat.currentEnemy = null;
    
    updateCombatStatus();
    
    // Hide current enemy section
    document.getElementById('current-enemy-section').style.display = 'none';
    
    // Hide end combat button
    document.querySelector('.end-combat-btn').style.display = 'none';
    
    // Clear enemy selection
    document.querySelectorAll('.enemy-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Clear input fields
    document.getElementById('attacking-player').value = '';
    document.getElementById('attack-roll').value = '';
    document.getElementById('damage-roll').value = '';
    
    console.log('⚡ Combat ended');
}

// ========================================
// COMBAT LOG MANAGEMENT
// ========================================
function addToCombatLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp: timestamp,
        message: message
    };
    
    currentCombat.combatLog.push(logEntry);
    
    const logContainer = document.getElementById('combat-log');
    if (logContainer) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'log-entry';
        entryDiv.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        logContainer.appendChild(entryDiv);
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Limit log entries (keep last 50)
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }
}

function clearCombatLog() {
    if (confirm('Clear the combat log?')) {
        currentCombat.combatLog = [];
        const logContainer = document.getElementById('combat-log');
        logContainer.innerHTML = '<div class="log-entry">📜 Combat log cleared</div>';
    }
}

function exportCombatLog() {
    const logText = currentCombat.combatLog
        .map(entry => `[${entry.timestamp}] ${entry.message}`)
        .join('\n');
        
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function refreshCombatDisplay() {
    updateCombatStatus();
    if (currentCombat.currentEnemy) {
        displayCurrentEnemy();
        showActiveCombat();
    }
    populatePlayerNames();
}

function viewEnemyDetails(floor, enemyId) {
    const floorData = loadedEnemies[floor];
    const enemy = floorData.enemies?.[enemyId] || floorData[enemyId];
    if (!enemy) return;
    
    updateEnemyQuickStats(enemy);
}

function updateEnemyQuickStats(enemy) {
    const quickStats = document.getElementById('enemy-quick-stats');
    
    const statsHtml = enemy.stats ? Object.entries(enemy.stats)
        .map(([stat, value]) => `<strong>${stat.toUpperCase()}:</strong> ${value}`)
        .join(' | ') : 'No stats available';
    
    const attacksHtml = enemy.attacks ? enemy.attacks.map(attack => 
        `<li><strong>${attack.name}:</strong> ${attack.hit} to hit, ${attack.damage} damage ${attack.effect ? `(${attack.effect})` : ''}</li>`
    ).join('') : '<li>No attacks defined</li>';
    
    quickStats.innerHTML = `
        <div class="enemy-detail-view">
            <h4>${enemy.name} (Level ${enemy.level || 1})</h4>
            <div class="basic-stats">
                <strong>HP:</strong> ${enemy.hp} | <strong>AC:</strong> ${enemy.ac}
            </div>
            <div class="attribute-stats">
                ${statsHtml}
            </div>
            <div class="attacks-section">
                <strong>Attacks:</strong>
                <ul>${attacksHtml}</ul>
            </div>
            ${enemy.special_abilities ? `
                <div class="abilities-section">
                    <strong>Special Abilities:</strong> ${enemy.special_abilities.join(', ')}
                </div>
            ` : ''}
            ${enemy.loot ? `
                <div class="loot-section">
                    <strong>Loot:</strong> ${enemy.loot.join(', ')}
                </div>
            ` : ''}
            ${enemy.ai_notes ? `
                <div class="notes-section">
                    <strong>AI Notes:</strong> ${enemy.ai_notes}
                </div>
            ` : ''}
        </div>
    `;
}

// ========================================
// INITIALIZATION
// ========================================
// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    // Browser environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCombatManager);
    } else {
        initializeCombatManager();
    }
} else {
    // Node.js environment (for testing)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CombatHandler,
            initializeCombatManager,
            currentCombat,
            loadedEnemies
        };
    }
}
