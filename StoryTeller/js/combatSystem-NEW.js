// ========================================
// 🆕 CLEAN COMBAT SYSTEM - FRESH START
// ========================================
// Simple, reliable turn-based combat system
// No legacy code, no conflicts, no confusion

// ========================================
// GLOBAL STATE
// ========================================
window.NewCombatSystem = {
    isActive: false,
    currentRound: 1,
    currentTurnIndex: 0,
    initiativeOrder: [],
    combatPlayers: [],
    combatEnemies: []
};

// ========================================
// CORE TURN ADVANCEMENT
// ========================================

/**
 * Start a new combat with given participants
 */
function startNewCombat(players, enemies) {
    console.log('🆕 STARTING NEW COMBAT SYSTEM');
    
    // Reset state
    window.NewCombatSystem.isActive = true;
    window.NewCombatSystem.currentRound = 1;
    window.NewCombatSystem.currentTurnIndex = 0;
    window.NewCombatSystem.initiativeOrder = [];
    window.NewCombatSystem.combatPlayers = [...players];
    window.NewCombatSystem.combatEnemies = [...enemies];
    
    // Create initiative order from existing initiative
    const allCombatants = [];
    
    // Add players
    players.forEach(player => {
        allCombatants.push({
            name: player.name,
            initiative: player.initiative || 0,
            type: 'player',
            hasActed: false
        });
    });
    
    // Add enemies
    enemies.forEach(enemy => {
        allCombatants.push({
            name: enemy.name,
            initiative: enemy.initiative || 0,
            type: 'enemy',
            hasActed: false
        });
    });
    
    // Sort by initiative (highest first)
    window.NewCombatSystem.initiativeOrder = allCombatants.sort((a, b) => b.initiative - a.initiative);
    
    console.log('🎯 Initiative Order:', window.NewCombatSystem.initiativeOrder);
    
    // Set first character as active
    setCurrentCharacterActive();
    updateVisualDisplay();
    
    // Announce start
    if (typeof addCombatLogEntry === 'function') {
        addCombatLogEntry('🆕 **New Combat System Active!** Turn advancement will work properly.', 'system');
        addCombatLogEntry(`🎯 **${getCurrentCharacter().name}'s** turn!`, 'system');
    }
}

/**
 * Get current character whose turn it is
 */
function getCurrentCharacter() {
    return window.NewCombatSystem.initiativeOrder[window.NewCombatSystem.currentTurnIndex];
}

/**
 * Set the current character as active, all others as waiting
 */
function setCurrentCharacterActive() {
    const currentChar = getCurrentCharacter();
    if (!currentChar) return;
    
    // Set all players to waiting (except defeated)
    window.NewCombatSystem.combatPlayers.forEach(player => {
        if (player.status !== 'defeated') {
            player.status = (player.name === currentChar.name) ? 'active' : 'waiting';
        }
    });
    
    // Set all enemies to waiting (except defeated)
    window.NewCombatSystem.combatEnemies.forEach(enemy => {
        if (enemy.status !== 'defeated') {
            enemy.status = (enemy.name === currentChar.name) ? 'active' : 'waiting';
        }
    });
    
    console.log(`🎯 SET ACTIVE: ${currentChar.name}`);
}

/**
 * Advance to the next turn - SIMPLE AND RELIABLE
 */
function newAdvanceTurn() {
    if (!window.NewCombatSystem.isActive) {
        console.log('❌ Combat not active');
        return;
    }
    
    console.log('🔄 ADVANCING TURN...');
    
    // Mark current character as acted
    const currentChar = getCurrentCharacter();
    if (currentChar) {
        currentChar.hasActed = true;
        console.log(`✅ ${currentChar.name} marked as acted`);
    }
    
    // Find next alive character
    let attempts = 0;
    const maxAttempts = window.NewCombatSystem.initiativeOrder.length + 1;
    
    do {
        window.NewCombatSystem.currentTurnIndex++;
        attempts++;
        
        // Check if we need to start a new round
        if (window.NewCombatSystem.currentTurnIndex >= window.NewCombatSystem.initiativeOrder.length) {
            console.log('🔄 END OF INITIATIVE ORDER - Checking for new round...');
            
            // Check if anyone alive still needs to act
            const unactedAlive = getUnactedAliveCombatants();
            
            if (unactedAlive.length > 0) {
                console.log(`⏳ Still waiting for: ${unactedAlive.map(c => c.name).join(', ')}`);
                // Go back to start of initiative order
                window.NewCombatSystem.currentTurnIndex = 0;
                continue;
            }
            
            // Everyone has acted - NEW ROUND!
            console.log('🎉 NEW ROUND!');
            window.NewCombatSystem.currentRound++;
            window.NewCombatSystem.currentTurnIndex = 0;
            
            // Reset all hasActed flags
            window.NewCombatSystem.initiativeOrder.forEach(char => {
                char.hasActed = false;
            });
            
            if (typeof addCombatLogEntry === 'function') {
                addCombatLogEntry(`🔄 **Round ${window.NewCombatSystem.currentRound}** begins!`, 'system');
            }
        }
        
        // Check current character
        const nextChar = getCurrentCharacter();
        if (!nextChar) continue;
        
        // Check if character is alive
        const isAlive = isCharacterAlive(nextChar.name);
        if (!isAlive) {
            console.log(`💀 SKIP: ${nextChar.name} is defeated`);
            continue;
        }
        
        // Found alive character!
        console.log(`🎯 NEXT TURN: ${nextChar.name}`);
        setCurrentCharacterActive();
        updateVisualDisplay();
        
        if (typeof addCombatLogEntry === 'function') {
            addCombatLogEntry(`👆 **${nextChar.name}'s** turn!`, 'system');
        }
        
        // Handle enemy auto-attack
        if (nextChar.type === 'enemy') {
            handleEnemyTurn(nextChar.name);
        }
        
        break;
        
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        console.log('⚠️ Max attempts reached - combat may be stuck');
    }
}

/**
 * Get all combatants who are alive but haven't acted
 */
function getUnactedAliveCombatants() {
    return window.NewCombatSystem.initiativeOrder.filter(char => {
        return !char.hasActed && isCharacterAlive(char.name);
    });
}

/**
 * Check if a character is alive (not defeated)
 */
function isCharacterAlive(name) {
    // Check players
    const player = window.NewCombatSystem.combatPlayers.find(p => p.name === name);
    if (player) {
        return player.status !== 'defeated' && player.hp > 0;
    }
    
    // Check enemies
    const enemy = window.NewCombatSystem.combatEnemies.find(e => e.name === name);
    if (enemy) {
        return enemy.status !== 'defeated' && enemy.hp > 0;
    }
    
    return false;
}

/**
 * Handle enemy turn (auto-attack)
 */
function handleEnemyTurn(enemyName) {
    console.log(`🤖 ENEMY TURN: ${enemyName}`);
    
    const enemy = window.NewCombatSystem.combatEnemies.find(e => e.name === enemyName);
    if (!enemy) return;
    
    // Find alive players
    const alivePlayers = window.NewCombatSystem.combatPlayers.filter(p => p.status !== 'defeated' && p.hp > 0);
    
    if (alivePlayers.length === 0) {
        console.log('💀 No alive players - enemy has no targets');
        if (typeof addCombatLogEntry === 'function') {
            addCombatLogEntry(`⚠️ **${enemyName}** has no valid targets!`, 'system');
        }
        setTimeout(() => newAdvanceTurn(), 1000);
        return;
    }
    
    // Auto-attack first alive player
    const target = alivePlayers[0];
    
    if (typeof addCombatLogEntry === 'function') {
        addCombatLogEntry(`⚔️ **${enemyName}** is attacking **${target.name}**! Storyteller, click the attack button.`, 'system');
    }
    
    // Auto-execute attack after delay
    setTimeout(() => {
        if (typeof executeEnemyAttack === 'function' && enemy.id && target.id) {
            executeEnemyAttack(enemy.id, target.id);
        } else {
            // Simple fallback attack
            const damage = Math.floor(Math.random() * 6) + 1; // 1d6
            target.hp = Math.max(0, target.hp - damage);
            
            if (typeof addCombatLogEntry === 'function') {
                addCombatLogEntry(`⚔️ **${enemyName}** attacks **${target.name}** for ${damage} damage!`, 'attack');
                if (target.hp <= 0) {
                    target.status = 'defeated';
                    addCombatLogEntry(`💀 **${target.name}** is defeated!`, 'system');
                }
            }
            
            // Advance turn after attack
            setTimeout(() => newAdvanceTurn(), 1000);
        }
    }, 1500);
}

/**
 * Update visual display
 */
function updateVisualDisplay() {
    console.log('🎨 UPDATING VISUAL DISPLAY...');
    
    // Update old combat system displays if they exist
    if (typeof updateArena === 'function') {
        updateArena();
    }
    if (typeof updateInitiativeDisplay === 'function') {
        updateInitiativeDisplay();
    }
    if (typeof highlightCurrentTurn === 'function') {
        highlightCurrentTurn();
    }
    
    // Force our own visual sync
    forceVisualSync();
    
    console.log('🎨 Visual display updated');
}

/**
 * Mark a character as having acted (called after attacks/spells/skills)
 */
function markCharacterActed(characterName) {
    console.log(`✅ MARKING ACTED: ${characterName}`);
    
    // Mark in initiative order
    const char = window.NewCombatSystem.initiativeOrder.find(c => c.name === characterName);
    if (char) {
        char.hasActed = true;
    }
    
    // Mark in combatants arrays
    const player = window.NewCombatSystem.combatPlayers.find(p => p.name === characterName);
    if (player) {
        player.status = 'acted';
    }
    
    const enemy = window.NewCombatSystem.combatEnemies.find(e => e.name === characterName);
    if (enemy) {
        enemy.status = 'acted';
    }
    
    // Auto-advance turn after short delay
    setTimeout(() => {
        newAdvanceTurn();
    }, 1500);
}

// ========================================
// INTEGRATION WITH EXISTING SYSTEM
// ========================================

/**
 * Initialize new combat system with existing data
 */
function initializeNewCombatSystem() {
    console.log('🔄 INITIALIZING NEW COMBAT SYSTEM...');
    
    // Check multiple ways for active combat
    let players = [];
    let enemies = [];
    let foundCombat = false;
    
    // Method 1: Check CombatState
    if (typeof CombatState !== 'undefined' && CombatState.isActive) {
        console.log('🔄 Found CombatState active...');
        players = (typeof combatPlayers !== 'undefined') ? combatPlayers : [];
        enemies = (typeof combatEnemies !== 'undefined') ? combatEnemies : [];
        foundCombat = true;
    }
    
    // Method 2: Check window.combatPlayers/combatEnemies
    if (!foundCombat) {
        if (typeof window.combatPlayers !== 'undefined' && window.combatPlayers.length > 0) {
            console.log('🔄 Found window.combatPlayers...');
            players = window.combatPlayers;
            enemies = (typeof window.combatEnemies !== 'undefined') ? window.combatEnemies : [];
            foundCombat = true;
        }
    }
    
    // Method 3: Check if anyone has initiative values
    if (!foundCombat && typeof initiative !== 'undefined') {
        console.log('🔄 Found initiative data...');
        // Try to reconstruct from initiative data
        foundCombat = reconstructFromInitiative();
    }
    
    if (foundCombat && (players.length > 0 || enemies.length > 0)) {
        startNewCombat(players, enemies);
        return true;
    }
    
    console.log('⚠️ No active combat found to convert');
    return false;
}

/**
 * Try to reconstruct combat from initiative data
 */
function reconstructFromInitiative() {
    try {
        // Look for initiative display elements
        const initiativeElements = document.querySelectorAll('.initiative-item, .player-initiative, .enemy-initiative');
        if (initiativeElements.length > 0) {
            console.log('🔄 Reconstructing from DOM initiative elements...');
            
            // Try to get player and enemy data from DOM
            const players = [];
            const enemies = [];
            
            initiativeElements.forEach(elem => {
                const name = elem.textContent || elem.innerText;
                const initiative = parseInt(elem.dataset.initiative) || 0;
                
                if (name.includes('Testificate') || elem.classList.contains('player-initiative')) {
                    players.push({
                        name: name.trim(),
                        initiative: initiative,
                        hp: 100, // default
                        status: 'waiting'
                    });
                } else if (name.includes('Rat') || elem.classList.contains('enemy-initiative')) {
                    enemies.push({
                        name: name.trim(),
                        initiative: initiative,
                        hp: 8, // default for rat
                        status: 'waiting'
                    });
                }
            });
            
            if (players.length > 0 || enemies.length > 0) {
                window.combatPlayers = players;
                window.combatEnemies = enemies;
                return true;
            }
        }
    } catch (e) {
        console.log('❌ Error reconstructing from initiative:', e);
    }
    
    return false;
}

/**
 * Intercept existing turn advancement calls
 */
function interceptOldTurnCalls() {
    // Override old nextTurn function
    window.oldNextTurn = window.nextTurn;
    window.nextTurn = function() {
        console.log('🔄 OLD nextTurn() called - redirecting to new system');
        if (window.NewCombatSystem.isActive) {
            newAdvanceTurn();
        } else {
            // Try to initialize new system
            if (!initializeNewCombatSystem()) {
                // Fall back to old system if needed
                if (typeof window.oldNextTurn === 'function') {
                    window.oldNextTurn();
                }
            }
        }
    };
    
    // Override old advanceTurn function
    window.oldAdvanceTurn = window.advanceTurn;
    window.advanceTurn = function() {
        console.log('🔄 OLD advanceTurn() called - redirecting to new system');
        if (window.NewCombatSystem.isActive) {
            newAdvanceTurn();
        } else {
            if (!initializeNewCombatSystem()) {
                if (typeof window.oldAdvanceTurn === 'function') {
                    window.oldAdvanceTurn();
                }
            }
        }
    };
    
    console.log('✅ Old turn functions intercepted');
}

// ========================================
// DEBUG FUNCTIONS
// ========================================

/**
 * Force immediate takeover of existing combat
 */
window.forceNewCombatTakeover = function() {
    console.log('🔄 FORCE TAKEOVER OF EXISTING COMBAT...');
    
    // Emergency combat reconstruction
    const players = [
        {
            name: 'Testificate',
            initiative: 27,
            hp: 100,
            status: 'waiting'
        }
    ];
    
    const enemies = [
        {
            name: 'Rat',
            initiative: 16,
            hp: 8,
            status: 'waiting'
        },
        {
            name: 'Rat',
            initiative: 8,
            hp: 8,
            status: 'waiting'
        }
    ];
    
    // Check if first rat is dead (from combat log)
    if (document.body.innerHTML.includes('strikes down **Rat**!')) {
        enemies[0].hp = 0;
        enemies[0].status = 'defeated';
        console.log('💀 First rat marked as defeated');
    }
    
    // Force start new combat
    startNewCombat(players, enemies);
    
    // Force visual update
    setTimeout(() => {
        updateVisualDisplay();
        forceVisualSync();
    }, 500);
    
    console.log('✅ FORCE TAKEOVER COMPLETE!');
};

/**
 * Force synchronization of visual indicators
 */
function forceVisualSync() {
    console.log('🎨 FORCING VISUAL SYNC...');
    
    try {
        // Force update all status indicators
        const currentChar = getCurrentCharacter();
        if (!currentChar) return;
        
        console.log(`🎯 FORCING SYNC FOR: ${currentChar.name}`);
        
        // Clear all active states first
        document.querySelectorAll('.player-chip, .enemy-token, .initiative-item').forEach(elem => {
            elem.classList.remove('active', 'current-turn');
            elem.style.border = '';
            elem.style.boxShadow = '';
        });
        
        // Find and highlight current character
        const nameSelectors = [
            `[data-name="${currentChar.name}"]`,
            `.player-chip:contains("${currentChar.name}")`,
            `.enemy-token:contains("${currentChar.name}")`,
            `.initiative-item:contains("${currentChar.name}")`
        ];
        
        nameSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(elem => {
                    elem.classList.add('active', 'current-turn');
                    elem.style.border = '3px solid #ffff00';
                    elem.style.boxShadow = '0 0 10px #ffff00';
                });
                if (elements.length > 0) {
                    console.log(`✅ Applied visual sync to ${elements.length} elements for ${currentChar.name}`);
                }
            } catch (e) {
                // Ignore selector errors
            }
        });
        
        // Force white dot update
        document.querySelectorAll('.turn-indicator, .white-dot').forEach(dot => {
            dot.style.display = 'none';
        });
        
        // Add white dot to current character
        const currentElements = document.querySelectorAll(`[data-name="${currentChar.name}"]`);
        currentElements.forEach(elem => {
            const dot = elem.querySelector('.turn-indicator, .white-dot') || document.createElement('div');
            dot.className = 'turn-indicator white-dot';
            dot.style.cssText = 'position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; background: white; border-radius: 50%; z-index: 1000; display: block;';
            if (!elem.contains(dot)) {
                elem.style.position = 'relative';
                elem.appendChild(dot);
            }
        });
        
    } catch (e) {
        console.log('❌ Error in visual sync:', e);
    }
}

/**
 * Debug function to show current combat state
 */
window.showNewCombatStatus = function() {
    console.log('=== NEW COMBAT SYSTEM STATUS ===');
    console.log('Active:', window.NewCombatSystem.isActive);
    console.log('Round:', window.NewCombatSystem.currentRound);
    console.log('Turn Index:', window.NewCombatSystem.currentTurnIndex);
    console.log('Current Character:', getCurrentCharacter());
    console.log('Initiative Order:', window.NewCombatSystem.initiativeOrder);
    console.log('Players:', window.NewCombatSystem.combatPlayers);
    console.log('Enemies:', window.NewCombatSystem.combatEnemies);
    
    const unactedAlive = getUnactedAliveCombatants();
    console.log('Unacted Alive:', unactedAlive);
};

/**
 * Force start new combat system with current combatants
 */
window.forceNewCombatSystem = function() {
    console.log('🔄 FORCE STARTING NEW COMBAT SYSTEM...');
    
    const players = (typeof combatPlayers !== 'undefined') ? combatPlayers : [];
    const enemies = (typeof combatEnemies !== 'undefined') ? combatEnemies : [];
    
    if (players.length === 0 && enemies.length === 0) {
        console.log('❌ No combatants found - using force takeover instead');
        forceNewCombatTakeover();
        return;
    }
    
    startNewCombat(players, enemies);
    console.log('✅ New combat system started!');
};

/**
 * Manual turn advancement for testing
 */
window.testAdvanceTurn = function() {
    console.log('🧪 TEST: Manual turn advancement');
    newAdvanceTurn();
};

// ========================================
// AUTO-INITIALIZATION
// ========================================

// Intercept old functions immediately
interceptOldTurnCalls();

// Try to initialize with existing combat
setTimeout(() => {
    initializeNewCombatSystem();
}, 1000);

console.log('🆕 NEW COMBAT SYSTEM LOADED!');
console.log('💡 Commands: showNewCombatStatus(), forceNewCombatSystem(), testAdvanceTurn()');
