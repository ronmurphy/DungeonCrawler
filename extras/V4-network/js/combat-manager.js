// ========================================
// Combat Manager - Handle combat encounters and enemy management
// ========================================

function addCombatTab() {
    // Add tab button
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;
    
    const combatTabBtn = document.createElement('button');
    combatTabBtn.className = 'tab-btn';
    combatTabBtn.setAttribute('data-tab', 'combat');
    combatTabBtn.innerHTML = `
        <span class="tab-icon"><i class="ra ra-crossed-swords"></i></span>
        <span class="tab-label">Combat</span>
    `;
    tabNav.appendChild(combatTabBtn);
    
    // Add tab content
    const tabContainer = document.querySelector('.tab-container');
    if (!tabContainer) return;
    
    const combatTab = document.createElement('section');
    combatTab.className = 'tab-content';
    combatTab.id = 'combat';
    combatTab.innerHTML = createCombatTabContent();
    tabContainer.appendChild(combatTab);
    
    // Add event listener for tab switching
    combatTabBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        combatTabBtn.classList.add('active');
        combatTab.classList.add('active');
    });
}

// Combat Manager - Handle combat encounters and enemy management
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
    environment: null
};

let loadedEnemies = {};

// ========================================
// LOAD ENEMY DATA
// ========================================
async function loadEnemyData() {
    try {
        const response = await fetch('./data/enemies.json');
        loadedEnemies = await response.json();
        console.log('Enemy data loaded:', Object.keys(loadedEnemies).length, 'floors');
    } catch (error) {
        console.error('Failed to load enemy data:', error);
        // Fallback to empty object
        loadedEnemies = {};
    }
}

// ========================================
// COMBAT INITIALIZATION
// ========================================
function initializeCombatManager() {
    loadEnemyData();
    
    // Add combat tab to the main app if not exists
    addCombatTab();
    
    console.log('Combat manager initialized');
}

function addCombatTab() {
    // Check if combat tab already exists
    if (document.querySelector('[data-tab="combat"]')) return;
    
    // Add tab button
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;
    
    const combatTabBtn = document.createElement('button');
    combatTabBtn.className = 'tab-btn';
    combatTabBtn.setAttribute('data-tab', 'combat');
    combatTabBtn.innerHTML = `
        <span class="tab-icon"><i class="ra ra-crossed-swords"></i></span>
        <span class="tab-label">Combat</span>
    `;
    tabNav.appendChild(combatTabBtn);
    
    // Add tab content
    const tabContainer = document.querySelector('.tab-container');
    if (!tabContainer) return;
    
    const combatTab = document.createElement('section');
    combatTab.className = 'tab-content';
    combatTab.id = 'combat';
    combatTab.innerHTML = createCombatTabContent();
    tabContainer.appendChild(combatTab);
    
    // Add event listener
    combatTabBtn.addEventListener('click', () => {
        switchTab('combat');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        combatTabBtn.classList.add('active');
        refreshCombatDisplay();
    });
}

function createCombatTabContent() {
    return `
        <div class="content-wrapper">
            <!-- Combat Setup Card -->
            <div class="card combat-setup-card">
                <div class="card-header">
                    <i class="ra ra-crossed-swords"></i>
                    <h3>Combat Setup</h3>
                    <div class="combat-controls">
                        <select id="floor-select" class="type-select">
                            <option value="floor_1">Floor 1 - Tutorial</option>
                            <option value="floor_2">Floor 2 - Undead</option>
                            <option value="boss_encounters">Boss Encounters</option>
                        </select>
                        <button class="generate-btn" onclick="showAvailableEnemies()">
                            <i class="ra ra-monster-skull"></i>
                            Browse Enemies
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
                
                <!-- Player Attack Input -->
                <div class="player-attack-section">
                    <h4>Player Attack Resolution</h4>
                    <div class="attack-input-grid">
                        <div class="input-group">
                            <label>Player Name</label>
                            <input type="text" id="attacking-player" placeholder="Player name...">
                        </div>
                        <div class="input-group">
                            <label>Attack Roll (d20 + mods)</label>
                            <input type="number" id="attack-roll" placeholder="Total attack roll...">
                        </div>
                        <div class="input-group">
                            <label>Damage Roll</label>
                            <input type="text" id="damage-roll" placeholder="e.g. 8 or 2d6+3...">
                        </div>
                        <div class="input-group">
                            <button class="resolve-btn" onclick="resolvePlayerAttack()">
                                <i class="ra ra-sword"></i>
                                Resolve Attack
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Combat Log -->
                <div class="combat-log-section">
                    <h4>Combat Log</h4>
                    <div class="combat-log" id="combat-log">
                        <div class="log-entry">Combat ready - waiting for first attack...</div>
                    </div>
                </div>
            </div>
            
            <!-- Enemy Management -->
            <div class="card enemy-management-card">
                <div class="card-header">
                    <i class="ra ra-monster-skull"></i>
                    <h3>Enemy Quick Reference</h3>
                </div>
                <div class="enemy-quick-stats" id="enemy-quick-stats">
                    <p>Select an enemy from the combat setup to see quick reference stats.</p>
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
    const enemySelection = document.getElementById('enemy-selection');
    const enemyGrid = document.getElementById('enemy-grid');
    
    if (!loadedEnemies[selectedFloor]) {
        enemyGrid.innerHTML = '<p>No enemies available for this floor.</p>';
        enemySelection.style.display = 'block';
        return;
    }
    
    const enemies = loadedEnemies[selectedFloor].enemies || loadedEnemies[selectedFloor];
    enemyGrid.innerHTML = '';
    
    Object.entries(enemies).forEach(([enemyId, enemy]) => {
        const enemyCard = document.createElement('div');
        enemyCard.className = 'enemy-card';
        enemyCard.innerHTML = `
            <div class="enemy-card-header">
                <h5>${enemy.name}</h5>
                <span class="enemy-level">Level ${enemy.level}</span>
            </div>
            <div class="enemy-card-stats">
                <div class="stat-item">
                    <span class="stat-label">HP:</span>
                    <span class="stat-value">${enemy.hp}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">AC:</span>
                    <span class="stat-value">${enemy.ac}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Attacks:</span>
                    <span class="stat-value">${enemy.attacks?.length || 0}</span>
                </div>
            </div>
            <div class="enemy-card-actions">
                <button class="select-enemy-btn" onclick="selectEnemyForCombat('${selectedFloor}', '${enemyId}')">
                    <i class="ra ra-sword"></i>
                    Start Combat
                </button>
                <button class="view-enemy-btn" onclick="viewEnemyDetails('${selectedFloor}', '${enemyId}')">
                    <i class="material-icons">visibility</i>
                    View Details
                </button>
            </div>
        `;
        enemyGrid.appendChild(enemyCard);
    });
    
    enemySelection.style.display = 'block';
}

function selectEnemyForCombat(floor, enemyId) {
    const enemy = loadedEnemies[floor].enemies?.[enemyId] || loadedEnemies[floor][enemyId];
    if (!enemy) return;
    
    // Create a copy of the enemy with current HP
    currentCombat.currentEnemy = {
        ...enemy,
        currentHp: enemy.hp,
        maxHp: enemy.hp,
        floor: floor,
        id: enemyId
    };
    
    currentCombat.active = true;
    currentCombat.round = 1;
    
    // Update display
    updateCombatStatus();
    displayCurrentEnemy();
    showActiveCombat();
    
    // Add to combat log
    addToCombatLog(`Combat started with ${enemy.name}!`);
    
    // Hide enemy selection
    document.getElementById('enemy-selection').style.display = 'none';
}

function displayCurrentEnemy() {
    const enemy = currentCombat.currentEnemy;
    if (!enemy) return;
    
    const display = document.getElementById('current-enemy-display');
    display.innerHTML = `
        <div class="enemy-display-header">
            <h4>${enemy.name}</h4>
            <span class="enemy-level-badge">Level ${enemy.level}</span>
        </div>
        
        <div class="enemy-health-bar">
            <div class="health-bar-container">
                <div class="health-bar-fill" style="width: ${(enemy.currentHp / enemy.maxHp) * 100}%"></div>
                <div class="health-bar-text">${enemy.currentHp} / ${enemy.maxHp} HP</div>
            </div>
        </div>
        
        <div class="enemy-combat-stats">
            <div class="combat-stat">
                <span class="stat-label">Armor Class:</span>
                <span class="stat-value">${enemy.ac}</span>
            </div>
            <div class="combat-stat">
                <span class="stat-label">Attacks:</span>
                <div class="attack-list">
                    ${enemy.attacks.map(attack => `
                        <div class="attack-item">
                            <strong>${attack.name}:</strong> ${attack.hit} to hit, ${attack.damage} damage
                            ${attack.effect ? `<span class="attack-effect">(${attack.effect})</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ${enemy.special_abilities && enemy.special_abilities.length > 0 ? `
                <div class="combat-stat">
                    <span class="stat-label">Special Abilities:</span>
                    <div class="abilities-list">
                        ${enemy.special_abilities.map(ability => `<span class="ability-tag">${ability}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="enemy-ai-notes">
            <strong>AI Notes:</strong> ${enemy.ai_notes || 'No special tactics noted.'}
        </div>
    `;
}

// ========================================
// COMBAT RESOLUTION
// ========================================
function resolvePlayerAttack() {
    const player = document.getElementById('attacking-player').value;
    const attackRoll = parseInt(document.getElementById('attack-roll').value);
    const damageRoll = document.getElementById('damage-roll').value;
    
    if (!player || !attackRoll || !damageRoll) {
        showNotification('Please fill in all attack fields', 'error');
        return;
    }
    
    if (!currentCombat.currentEnemy) {
        showNotification('No enemy selected for combat', 'error');
        return;
    }
    
    const enemy = currentCombat.currentEnemy;
    const hit = attackRoll >= enemy.ac;
    
    let logEntry = `${player} attacks ${enemy.name} - Roll: ${attackRoll} vs AC ${enemy.ac}`;
    
    if (hit) {
        // Parse damage (simple implementation)
        const damage = parseDamage(damageRoll);
        enemy.currentHp = Math.max(0, enemy.currentHp - damage);
        
        logEntry += ` - HIT! ${damage} damage dealt. ${enemy.name} has ${enemy.currentHp}/${enemy.maxHp} HP remaining.`;
        
        if (enemy.currentHp <= 0) {
            logEntry += ` ${enemy.name} is defeated!`;
            handleEnemyDefeated();
        }
    } else {
        logEntry += ` - MISS!`;
    }
    
    addToCombatLog(logEntry);
    displayCurrentEnemy();
    
    // Clear input fields
    document.getElementById('attacking-player').value = '';
    document.getElementById('attack-roll').value = '';
    document.getElementById('damage-roll').value = '';
    
    // Check if combat should end
    if (enemy.currentHp <= 0) {
        setTimeout(endCombat, 2000); // End combat after 2 seconds
    }
}

function parseDamage(damageString) {
    // Simple damage parser - handles basic numbers and dice notation
    const numericMatch = damageString.match(/^(\d+)$/);
    if (numericMatch) {
        return parseInt(numericMatch[1]);
    }
    
    // For now, just extract numbers if it's complex dice notation
    const numbers = damageString.match(/\d+/g);
    if (numbers && numbers.length > 0) {
        return parseInt(numbers[0]); // Take the first number as damage
    }
    
    return 0;
}

function handleEnemyDefeated() {
    const enemy = currentCombat.currentEnemy;
    
    // Build a comprehensive single message
    let deathMessage = `💀 ${enemy.name} is defeated!`;
    
    // Add loot info if available
    if (enemy.loot && enemy.loot.length > 0) {
        deathMessage += ` 💰 Loot: ${enemy.loot.join(', ')}`;
        addToCombatLog(`Loot dropped: ${enemy.loot.join(', ')}`);
    }
    
    // Add viewer appeal in condensed form
    if (enemy.viewer_appeal) {
        const appealLevel = enemy.viewer_appeal.toLowerCase().includes('low') ? 'Low viewers' :
                           enemy.viewer_appeal.toLowerCase().includes('moderate') ? 'Moderate viewers' :
                           enemy.viewer_appeal.toLowerCase().includes('high') ? 'High viewers' : 
                           enemy.viewer_appeal;
        deathMessage += ` 📺 ${appealLevel}`;
        addToCombatLog(`Viewer Appeal: ${enemy.viewer_appeal}`);
    }
    
    // Add sponsor opportunities if available (bosses only)
    if (enemy.sponsor_opportunities && enemy.sponsor_opportunities.length > 0) {
        deathMessage += ` 💼 Sponsors: ${enemy.sponsor_opportunities.join(', ')}`;
        addToCombatLog(`Sponsor Opportunities: ${enemy.sponsor_opportunities.join(', ')}`);
    }
    
    // Send single comprehensive notification to chat
    if (typeof displayChatMessage === 'function') {
        const combinedMessage = {
            player_name: 'Combat System',
            message_text: deathMessage,
            message_type: 'enemy_death',
            is_storyteller: true,
            created_at: new Date().toISOString()
        };
        displayChatMessage(combinedMessage);
    }
}

// ========================================
// COMBAT UI HELPERS
// ========================================
function updateCombatStatus() {
    document.getElementById('combat-active-status').textContent = currentCombat.active ? 'Yes' : 'No';
    document.getElementById('combat-round').textContent = currentCombat.round;
    document.getElementById('current-enemy-name').textContent = 
        currentCombat.currentEnemy ? currentCombat.currentEnemy.name : 'None';
}

function showActiveCombat() {
    document.getElementById('active-combat-card').style.display = 'block';
}

function hideActiveCombat() {
    document.getElementById('active-combat-card').style.display = 'none';
}

function addToCombatLog(message) {
    const combatLog = document.getElementById('combat-log');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-timestamp">[Round ${currentCombat.round}]</span> ${message}`;
    combatLog.appendChild(logEntry);
    combatLog.scrollTop = combatLog.scrollHeight;
}

function endCombat() {
    currentCombat.active = false;
    currentCombat.round = 0;
    currentCombat.currentEnemy = null;
    
    updateCombatStatus();
    hideActiveCombat();
    addToCombatLog('Combat ended.');
    
    showNotification('Combat ended', 'success');
}

function refreshCombatDisplay() {
    updateCombatStatus();
    
    if (currentCombat.active && currentCombat.currentEnemy) {
        displayCurrentEnemy();
        showActiveCombat();
    } else {
        hideActiveCombat();
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function viewEnemyDetails(floor, enemyId) {
    const enemy = loadedEnemies[floor].enemies?.[enemyId] || loadedEnemies[floor][enemyId];
    if (!enemy) return;
    
    // Create a modal or detailed view
    const details = `
        <strong>${enemy.name}</strong> (Level ${enemy.level})<br>
        <strong>HP:</strong> ${enemy.hp} | <strong>AC:</strong> ${enemy.ac}<br>
        <strong>Stats:</strong> STR ${enemy.stats.str}, DEX ${enemy.stats.dex}, CON ${enemy.stats.con}, INT ${enemy.stats.int}, WIS ${enemy.stats.wis}, CHA ${enemy.stats.cha}<br>
        <strong>Attacks:</strong><br>
        ${enemy.attacks.map(attack => `• ${attack.name}: ${attack.hit} to hit, ${attack.damage} damage`).join('<br>')}<br>
        ${enemy.special_abilities ? `<strong>Special:</strong> ${enemy.special_abilities.join(', ')}<br>` : ''}
        ${enemy.ai_notes ? `<strong>Tactics:</strong> ${enemy.ai_notes}<br>` : ''}
        ${enemy.viewer_appeal ? `<strong>Viewer Appeal:</strong> ${enemy.viewer_appeal}` : ''}
    `;
    
    document.getElementById('enemy-quick-stats').innerHTML = details;
    showNotification(`${enemy.name} details loaded`, 'info');
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for main app to initialize
    setTimeout(initializeCombatManager, 500);
});
