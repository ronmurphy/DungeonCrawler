/**
 * ======================================================================
 * CLEAN COMBAT SYSTEM FOR STORYTELLER
 * ======================================================================
 * 
 * Simple, unified combat system with:
 * - Single source of truth for all combatants
 * - Lowest initiative goes first (low rolls are good!)
 * - Auto-advance after 2 seconds
 * - Clean turn progression with visual indicators
 * 
 * Created: 2025-09-07
 * ======================================================================
 */

// Inject enhanced combat styles (from working diff)
function injectCleanCombatStyles() {
    const styleId = 'clean-combat-styles';
    if (document.getElementById(styleId)) return; // Already injected
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .hp-container {
            margin: 8px 0;
            position: relative;
        }
        
        .hp-bar {
            width: 100%;
            height: 8px;
            background-color: #2c3e50;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
            border: 1px solid #34495e;
        }
        
        .hp-fill {
            height: 100%;
            transition: width 0.3s ease, background-color 0.3s ease;
            border-radius: 3px;
        }
        
        .hp-text {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-top: 4px;
            color: #7f8c8d;
        }
        
        .hp-percent.hp-healthy { color: #27ae60; font-weight: bold; }
        .hp-percent.hp-wounded { color: #f39c12; font-weight: bold; }
        .hp-percent.hp-critical { color: #e67e22; font-weight: bold; }
        .hp-percent.hp-dying { color: #e74c3c; font-weight: bold; animation: pulse 1s infinite; }
        
        .defeat-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(231, 76, 60, 0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border-radius: 4px;
        }
        
        .combatant-card.current-turn {
            border: 2px solid #3498db;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        .enemy-controls {
            margin-top: 8px;
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        
        .btn-enemy-action, .btn-enemy-remove {
            padding: 2px 6px;
            font-size: 10px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn-enemy-action {
            background-color: #e67e22;
            color: white;
        }
        
        .btn-enemy-action:hover {
            background-color: #d35400;
        }
        
        .btn-enemy-remove {
            background-color: #e74c3c;
            color: white;
        }
        
        .btn-enemy-remove:hover {
            background-color: #c0392b;
        }
        
        .status-indicators {
            margin-top: 4px;
            font-size: 10px;
        }
        
        .status-acted {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-ready {
            color: #f39c12;
            font-weight: bold;
        }
        
        .status-current {
            color: #3498db;
            font-weight: bold;
        }
        
        .status-defeated {
            color: #e74c3c;
            font-weight: bold;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.5); }
            100% { box-shadow: 0 0 15px rgba(52, 152, 219, 0.8); }
        }
    `;
    
    document.head.appendChild(style);
    console.log('💄 Clean combat styles injected');
}

// Inject styles when the script loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCleanCombatStyles);
    } else {
        injectCleanCombatStyles();
    }
}

// =============================================================================
// COMBAT STATE - SINGLE SOURCE OF TRUTH
// =============================================================================

window.CleanCombat = {
    // Core state
    isActive: false,
    turnInProgress: false,
    currentRound: 1,
    currentTurnIndex: 0,
    
    // All combatants in one array (players + enemies)
    participants: [],
    
    // Auto-advance timer
    autoAdvanceTimer: null,
    
    // Chat integration
    chatLog: []
};

// =============================================================================
// CORE COMBAT FLOW
// =============================================================================

/**
 * Step 1: Start combat and collect initiative
 */
function startCleanCombat() {
    console.log('🎯 CLEAN COMBAT: Starting...');
    
    CleanCombat.isActive = true;
    CleanCombat.turnInProgress = false;
    CleanCombat.currentRound = 1;
    CleanCombat.currentTurnIndex = 0;
    CleanCombat.participants = [];
    
    // Clear any existing timers
    if (CleanCombat.autoAdvanceTimer) {
        clearTimeout(CleanCombat.autoAdvanceTimer);
        CleanCombat.autoAdvanceTimer = null;
    }
    
    addCleanChatLog("📢 Combat has begun! All players, please roll initiative using your DEX attribute button.");
    addCleanChatLog("🎲 Remember: **LOWEST initiative goes FIRST!** Low rolls are good in this system!");
    
    updateCleanCombatDisplay();
    
    // Send V4-network combat start notification in the exact format from working system
    const broadcastMessage = "📢 Combat has begun! All players, please roll initiative using your DEX attribute button.";
    
    // Try sendChatMessageAsync first (most reliable)
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(broadcastMessage);
        console.log('� Combat message sent via sendChatMessageAsync');
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(broadcastMessage);
        console.log('� Combat message sent via sendChatMessage');
    } else if (window.supabaseChat && typeof window.supabaseChat.sendChatMessage === 'function') {
        window.supabaseChat.sendChatMessage(broadcastMessage);
        console.log('📡 Combat message sent via supabaseChat');
    } else {
        console.warn('📡 No chat methods available - combat message not sent');
    }
}

/**
 * Quick way to add enemies from existing enemy data
 */
function addEnemyToCombat(enemyName, enemyHp = 8, enemyDex = 1) {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    addCleanParticipant(enemyName, d20Roll, enemyDex, false);
    
    // Set custom HP if provided
    const enemy = CleanCombat.participants.find(p => p.name === enemyName);
    if (enemy) {
        enemy.hp = enemyHp;
        enemy.maxHp = enemyHp;
    }
    
    console.log(`🎯 ENEMY ADDED: ${enemyName} (HP: ${enemyHp}, Initiative: ${d20Roll + enemyDex})`);
}

/**
 * Step 2: Add participant to combat (from initiative rolls)
 */
function addCleanParticipant(name, initiativeRoll, dexModifier, isPlayer = true) {
    const participant = {
        name: name,
        isPlayer: isPlayer,
        initiative: initiativeRoll + dexModifier,
        d20Roll: initiativeRoll,
        dexMod: dexModifier,
        status: 'waiting', // waiting, active, acted, defeated
        hp: isPlayer ? 30 : 8, // Default HP values
        maxHp: isPlayer ? 30 : 8,
        hasActed: false
    };
    
    CleanCombat.participants.push(participant);
    
    console.log(`🎯 ADDED PARTICIPANT: ${name} (initiative: ${participant.initiative})`);
    addCleanChatLog(`🎲 **${name}** rolled initiative: **${participant.initiative}** (d20: ${initiativeRoll} + DEX: ${dexModifier})`);
    
    updateCleanCombatDisplay();
    
    // Check if we should auto-start turns
    checkAutoStartTurns();
}

/**
 * Apply damage to an enemy (for DM convenience)
 */
function enemyTakeDamage(enemyName, damage) {
    const enemy = CleanCombat.participants.find(p => !p.isPlayer && p.name === enemyName);
    if (enemy) {
        const oldHp = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - damage);
        
        addCleanChatLog(`💥 **${enemyName}** takes **${damage} damage**! (${oldHp} → ${enemy.hp} HP)`);
        
        if (enemy.hp <= 0 && enemy.status !== 'defeated') {
            enemy.status = 'defeated';
            addCleanChatLog(`💀 **${enemyName}** has been defeated!`);
            checkCleanCombatEnd();
        }
        
        updateCleanCombatDisplay();
    }
}

/**
 * Remove a participant from combat
 */
function removeCleanParticipant(name) {
    const index = CleanCombat.participants.findIndex(p => p.name === name);
    if (index !== -1) {
        console.log(`🗑️ REMOVING: ${name} from combat`);
        CleanCombat.participants.splice(index, 1);
        
        // Adjust current turn index if needed
        if (CleanCombat.currentTurnIndex >= index && CleanCombat.currentTurnIndex > 0) {
            CleanCombat.currentTurnIndex--;
        }
        
        // Check if combat should end
        const enemies = CleanCombat.participants.filter(p => !p.isPlayer);
        if (enemies.length === 0) {
            console.log('🏆 All enemies defeated - ending combat');
            endCleanCombat();
        } else {
            updateCleanCombatDisplay();
        }
        
        addCleanChatLog(`${name} removed from combat`);
    }
}

/**
 * End combat and reset state
 */
function endCleanCombat() {
    console.log('🏁 ENDING COMBAT');
    CleanCombat.isActive = false;
    CleanCombat.turnInProgress = false;
    CleanCombat.currentRound = 0;
    CleanCombat.currentTurnIndex = 0;
    CleanCombat.participants = [];
    
    updateCleanCombatDisplay();
    addCleanChatLog('Combat has ended');
}

/**
 * Step 3: Sort by initiative (LOWEST FIRST!) and start turns
 */
function startCleanTurns() {
    if (CleanCombat.participants.length === 0) {
        addCleanChatLog("⚠️ No participants in combat!");
        return;
    }
    
    // Sort by initiative - LOWEST GOES FIRST!
    CleanCombat.participants.sort((a, b) => a.initiative - b.initiative);
    
    CleanCombat.turnInProgress = true;
    CleanCombat.currentTurnIndex = 0;
    
    // Show turn order
    const turnOrder = CleanCombat.participants.map((p, i) => `${i + 1}. ${p.name} (${p.initiative})`).join(' ');
    addCleanChatLog(`⚔️ **Turn Order:** ${turnOrder} 🎯 ${CleanCombat.participants[0].name} goes first!`);
    
    console.log('🎯 TURN ORDER (lowest first):', CleanCombat.participants.map(p => `${p.name}(${p.initiative})`));
    
    // Start first turn
    startCurrentTurn();
}

/**
 * Step 4: Start the current participant's turn
 */
function startCurrentTurn() {
    if (!CleanCombat.turnInProgress || CleanCombat.currentTurnIndex >= CleanCombat.participants.length) {
        return;
    }
    
    const currentParticipant = CleanCombat.participants[CleanCombat.currentTurnIndex];
    
    // Clear all statuses and set current to active
    CleanCombat.participants.forEach(p => {
        if (p.status !== 'defeated') {
            p.status = p === currentParticipant ? 'active' : 'waiting';
        }
    });
    
    console.log(`🎯 TURN START: ${currentParticipant.name} (${currentParticipant.isPlayer ? 'player' : 'enemy'})`);
    addCleanChatLog(`⚡ **${currentParticipant.name}**, it's your turn! Use your attack, spell, or skill buttons.`);
    
    updateCleanCombatDisplay();
    
    // Auto-attack for enemies
    if (!currentParticipant.isPlayer) {
        setTimeout(() => autoEnemyAttack(currentParticipant), 1000);
    }
}

/**
 * Step 5: Process participant action and advance turn
 */
function processCleanAction(participantName, actionType, actionData) {
    const participant = CleanCombat.participants.find(p => p.name === participantName);
    if (!participant || participant.status !== 'active') {
        console.log(`⚠️ Invalid action from ${participantName}`);
        return;
    }
    
    // Mark as acted
    participant.status = 'acted';
    participant.hasActed = true;
    
    console.log(`🎯 ACTION PROCESSED: ${participantName} - ${actionType}`);
    
    // Process the action based on type
    if (actionType === 'ATTACK') {
        processCleanAttack(participant, actionData);
    } else if (actionType === 'SPELL') {
        processCleanSpell(participant, actionData);
    }
    
    updateCleanCombatDisplay();
    
    // Auto-advance after 2 seconds
    CleanCombat.autoAdvanceTimer = setTimeout(() => {
        advanceToNextTurn();
    }, 2000);
}

/**
 * Step 6: Advance to next turn or next round
 */
function advanceToNextTurn() {
    console.log('🔄 ADVANCING TURN...');
    
    // Clear auto-advance timer
    if (CleanCombat.autoAdvanceTimer) {
        clearTimeout(CleanCombat.autoAdvanceTimer);
        CleanCombat.autoAdvanceTimer = null;
    }
    
    CleanCombat.currentTurnIndex++;
    
    // Check if round is complete
    if (CleanCombat.currentTurnIndex >= CleanCombat.participants.length) {
        startNextRound();
        return;
    }
    
    // Skip defeated participants
    while (CleanCombat.currentTurnIndex < CleanCombat.participants.length && 
           CleanCombat.participants[CleanCombat.currentTurnIndex].status === 'defeated') {
        CleanCombat.currentTurnIndex++;
    }
    
    // Check if we've run out of participants
    if (CleanCombat.currentTurnIndex >= CleanCombat.participants.length) {
        startNextRound();
        return;
    }
    
    // Start next participant's turn
    startCurrentTurn();
}

/**
 * Step 7: Start next round
 */
function startNextRound() {
    console.log('🔄 STARTING NEXT ROUND...');
    
    CleanCombat.currentRound++;
    CleanCombat.currentTurnIndex = 0;
    
    // Reset all hasActed flags
    CleanCombat.participants.forEach(p => {
        if (p.status !== 'defeated') {
            p.hasActed = false;
            p.status = 'waiting';
        }
    });
    
    addCleanChatLog(`🔄 **Round ${CleanCombat.currentRound}** begins! All combatants can act again.`);
    
    // Check for combat end
    if (checkCleanCombatEnd()) {
        return;
    }
    
    // Re-sort by initiative (in case someone joined mid-combat)
    CleanCombat.participants.sort((a, b) => a.initiative - b.initiative);
    
    // Start first turn of new round
    startCurrentTurn();
}

// =============================================================================
// ACTION PROCESSING
// =============================================================================

/**
 * Process attack action
 */
function processCleanAttack(attacker, actionData) {
    const { weapon, attackRoll, damageRoll } = actionData;
    
    let chatMessage = `⚔️ **${attacker.name}** attacks with **${weapon}**`;
    
    // Find target (first alive enemy if player, first alive player if enemy)
    let target = null;
    if (attacker.isPlayer) {
        target = CleanCombat.participants.find(p => !p.isPlayer && p.status !== 'defeated');
    } else {
        target = CleanCombat.participants.find(p => p.isPlayer && p.status !== 'defeated');
    }
    
    if (!target) {
        chatMessage += ` but finds no valid target!`;
        addCleanChatLog(chatMessage);
        return;
    }
    
    // Apply damage
    const oldHp = target.hp;
    target.hp = Math.max(0, target.hp - damageRoll);
    
    chatMessage += ` and hits **${target.name}** for **${damageRoll} damage**! (${oldHp} → ${target.hp} HP)`;
    
    // Check if target is defeated
    if (target.hp <= 0) {
        target.status = 'defeated';
        chatMessage += ` 💀 **${target.name}** is defeated!`;
    }
    
    addCleanChatLog(chatMessage);
    console.log(`💥 ATTACK: ${attacker.name} → ${target.name} (${damageRoll} damage)`);
}

/**
 * Process spell action
 */
function processCleanSpell(caster, actionData) {
    const { spell, attackRoll, damageRoll, mpCost } = actionData;
    
    let chatMessage = `✨ **${caster.name}** casts **${spell}**`;
    
    // Find target (similar to attack)
    let target = null;
    if (caster.isPlayer) {
        target = CleanCombat.participants.find(p => !p.isPlayer && p.status !== 'defeated');
    } else {
        target = CleanCombat.participants.find(p => p.isPlayer && p.status !== 'defeated');
    }
    
    if (!target) {
        chatMessage += ` but finds no valid target!`;
        addCleanChatLog(chatMessage);
        return;
    }
    
    // Apply damage
    const oldHp = target.hp;
    target.hp = Math.max(0, target.hp - damageRoll);
    
    chatMessage += ` and hits **${target.name}** for **${damageRoll} magical damage**! (${oldHp} → ${target.hp} HP)`;
    
    // Check if target is defeated
    if (target.hp <= 0) {
        target.status = 'defeated';
        chatMessage += ` 💀 **${target.name}** is defeated!`;
    }
    
    addCleanChatLog(chatMessage);
    console.log(`✨ SPELL: ${caster.name} → ${target.name} (${damageRoll} damage)`);
}

/**
 * Auto-attack for enemies
 */
function autoEnemyAttack(enemy) {
    if (enemy.status !== 'active') return;
    
    // Find player target
    const playerTarget = CleanCombat.participants.find(p => p.isPlayer && p.status !== 'defeated');
    if (!playerTarget) {
        addCleanChatLog(`⚠️ **${enemy.name}** has no valid targets!`);
        // Still mark as acted and advance
        processCleanAction(enemy.name, 'ATTACK', { weapon: 'Claws', attackRoll: 10, damageRoll: 0 });
        return;
    }
    
    // Simple auto-attack
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const damageRoll = Math.floor(Math.random() * 6) + 1;
    
    processCleanAction(enemy.name, 'ATTACK', { 
        weapon: 'Claws', 
        attackRoll: attackRoll, 
        damageRoll: damageRoll 
    });
}

// =============================================================================
// V4-NETWORK INTEGRATION
// =============================================================================

/**
 * Handle incoming V4-network commands
 */
function handleCleanV4Command(commandData) {
    console.log(`🔗🔗🔗 V4 COMMAND RECEIVED: "${commandData}"`);
    
    const parts = commandData.split(':');
    const command = parts[0];
    const playerName = parts[1];
    
    console.log(`🔗 V4 COMMAND: ${command} from ${playerName} (${parts.length} parts)`);
    
    if (command === 'INITIATIVE') {
        // Parse using same format as working system
        const totalInitiative = parseInt(parts[2]);
        const details = parts[3] || '';
        
        let d20Roll = 10; // Default fallback
        let dexModifier = 0; // Default fallback
        
        // Parse details if available (format: "d20(12) + DEX(10) + luck(8) = 30")
        if (details) {
            const d20Match = details.match(/d20\((\d+)\)/);
            const dexMatch = details.match(/DEX\(([+-]?\d+)\)/);
            
            if (d20Match) d20Roll = parseInt(d20Match[1]);
            if (dexMatch) dexModifier = parseInt(dexMatch[1]);
        }
        
        console.log(`🎲 INITIATIVE PARSED: ${playerName} total=${totalInitiative} d20=${d20Roll} dex=${dexModifier}`);
        addCleanParticipant(playerName, d20Roll, dexModifier, true);
        
    } else if (command === 'ATTACK') {
        // V4 format: ATTACK:PlayerName:TotalDamage:AttackRoll:WeaponName
        const totalDamage = parseInt(parts[2]);
        const attackRoll = parseInt(parts[3]);
        const weapon = parts[4] || 'Weapon';
        
        processCleanAction(playerName, 'ATTACK', {
            weapon: weapon,
            attackRoll: attackRoll,
            damageRoll: totalDamage
        });
        
    } else if (command === 'SPELL') {
        // SPELL:PlayerName:SpellName:AttackRoll:DamageRoll:MPCost
        const spellName = parts[2];
        const attackRoll = parseInt(parts[3]);
        const damageRoll = parseInt(parts[4]);
        const mpCost = parseInt(parts[5]);
        
        processCleanAction(playerName, 'SPELL', {
            spell: spellName,
            attackRoll: attackRoll,
            damageRoll: damageRoll,
            mpCost: mpCost
        });
    }
    
    // Mark player as having acted this turn and auto-advance (from working diff)
    const participant = CleanCombat.participants.find(p => p.name === playerName);
    if (participant && CleanCombat.turnInProgress) {
        participant.hasActed = true;
        updateCleanCombatDisplay();
        
        // Auto-advance turn after player action (1.5 seconds like working diff)
        setTimeout(() => {
            if (CleanCombat.turnInProgress) {
                advanceToNextTurn();
            }
        }, 1500);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if we should auto-start turns
 */
function checkAutoStartTurns() {
    if (CleanCombat.turnInProgress) return;
    
    // Count players vs participants (exclude storyteller)
    const players = CleanCombat.participants.filter(p => p.isPlayer);
    
    // Get connected players, excluding storyteller
    let connectedPlayers = [];
    if (typeof getConnectedPlayersList === 'function') {
        connectedPlayers = getConnectedPlayersList().filter(p => {
            // Use existing isStorytellerName function if available, otherwise check manually
            if (typeof isStorytellerName === 'function') {
                return !isStorytellerName(p.name);
            } else {
                // Fallback check for storyteller names
                const name = p.name.toLowerCase();
                return !name.includes('storyteller') && !name.includes('dm') && !name.includes('gm');
            }
        });
    }
    
    console.log(`🎯 AUTO-START CHECK: ${players.length} players, ${connectedPlayers.length} connected`);
    
    // Auto-start if all connected players have rolled initiative
    if (connectedPlayers.length > 0 && players.length >= connectedPlayers.length) {
        addCleanChatLog(`🎯 All players ready! Starting combat...`);
        setTimeout(() => startCleanTurns(), 1000);
    }
}

/**
 * Check if combat should end
 */
function checkCleanCombatEnd() {
    const alivePlayers = CleanCombat.participants.filter(p => p.isPlayer && p.status !== 'defeated');
    const aliveEnemies = CleanCombat.participants.filter(p => !p.isPlayer && p.status !== 'defeated');
    
    if (alivePlayers.length === 0) {
        addCleanChatLog("💀 **All players defeated!** Combat ends...");
        endCleanCombat();
        return true;
    }
    
    if (aliveEnemies.length === 0) {
        addCleanChatLog("🎉 **All enemies defeated!** Victory!");
        endCleanCombat();
        return true;
    }
    
    return false;
}

/**
 * End combat
 */
function endCleanCombat() {
    console.log('🎯 CLEAN COMBAT: Ending...');
    
    CleanCombat.isActive = false;
    CleanCombat.turnInProgress = false;
    
    if (CleanCombat.autoAdvanceTimer) {
        clearTimeout(CleanCombat.autoAdvanceTimer);
        CleanCombat.autoAdvanceTimer = null;
    }
    
    updateCleanCombatDisplay();
}

/**
 * Gets HP bar color based on percentage (from working diff)
 */
function getHpBarColor(percentage) {
    if (percentage >= 75) return '#27ae60'; // Green
    if (percentage >= 50) return '#f39c12'; // Orange
    if (percentage >= 25) return '#e67e22'; // Dark orange
    return '#e74c3c'; // Red
}

/**
 * Gets HP status CSS class (from working diff)
 */
function getHpStatusClass(percentage) {
    if (percentage >= 75) return 'hp-healthy';
    if (percentage >= 50) return 'hp-wounded';
    if (percentage >= 25) return 'hp-critical';
    return 'hp-dying';
}

/**
 * Add message to combat chat log and integrate with existing systems
 */
function addCleanChatLog(message) {
    CleanCombat.chatLog.push({
        message: message,
        timestamp: Date.now()
    });
    
    console.log(`📢 COMBAT: ${message}`);
    
    // Use the SAME method as old combat system for V4-network compatibility
    // Try sendChatMessageAsync first (most reliable)
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(message);
        console.log('📡 Clean combat message sent via sendChatMessageAsync');
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(message);
        console.log('📡 Clean combat message sent via sendChatMessage');
    } else if (window.supabaseChat && typeof window.supabaseChat.sendChatMessage === 'function') {
        window.supabaseChat.sendChatMessage(message);
        console.log('📡 Clean combat message sent via supabaseChat');
    } else {
        console.warn('⚠️ No chat function available - combat message not sent to chat');
    }
}

/**
 * Update combat display and integrate with existing UI systems
 */
function updateCleanCombatDisplay() {
    console.log('🎨 UPDATE DISPLAY:', {
        isActive: CleanCombat.isActive,
        turnInProgress: CleanCombat.turnInProgress,
        currentRound: CleanCombat.currentRound,
        currentTurnIndex: CleanCombat.currentTurnIndex,
        participants: CleanCombat.participants.map(p => `${p.name}(${p.status})`)
    });
    
    // Update combat status UI elements
    try {
        // Update status bar elements
        const activeStatus = document.getElementById('combat-active-status');
        if (activeStatus) {
            activeStatus.textContent = CleanCombat.isActive ? 'Yes' : 'No';
        }
        
        const roundDisplay = document.getElementById('combat-round');
        if (roundDisplay) {
            roundDisplay.textContent = CleanCombat.currentRound;
        }
        
        const currentTurnDisplay = document.getElementById('current-turn-name');
        if (currentTurnDisplay) {
            if (CleanCombat.turnInProgress && CleanCombat.participants[CleanCombat.currentTurnIndex]) {
                currentTurnDisplay.textContent = CleanCombat.participants[CleanCombat.currentTurnIndex].name;
            } else {
                currentTurnDisplay.textContent = '-';
            }
        }
        
        // Update combat control buttons
        const startBtn = document.getElementById('start-combat-btn');
        const announceBtn = document.getElementById('announce-turn-btn');
        const nextBtn = document.getElementById('next-turn-btn');
        const clearBtn = document.getElementById('clear-initiative-btn');
        
        if (CleanCombat.isActive) {
            if (startBtn) startBtn.style.display = 'none';
            if (announceBtn) announceBtn.style.display = 'inline-block';
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (clearBtn) clearBtn.style.display = 'inline-block';
        } else {
            if (startBtn) {
                startBtn.style.display = 'inline-block';
                
                // Show auto-detection status like in working diff
                let connectedPlayers = [];
                if (typeof getConnectedPlayersList === 'function') {
                    connectedPlayers = getConnectedPlayersList().filter(p => {
                        if (typeof isStorytellerName === 'function') {
                            return !isStorytellerName(p.name);
                        } else {
                            const name = p.name.toLowerCase();
                            return !name.includes('storyteller') && !name.includes('dm') && !name.includes('gm');
                        }
                    });
                }
                
                const playersWithInitiative = CleanCombat.participants.filter(p => p.isPlayer);
                const autoStartReady = connectedPlayers.length > 0 && playersWithInitiative.length >= connectedPlayers.length;
                
                if (autoStartReady) {
                    startBtn.innerHTML = '<i class="material-icons">play_arrow</i>All Players Ready - Starting...';
                    startBtn.disabled = true;
                    startBtn.style.background = '#27ae60';
                } else {
                    startBtn.innerHTML = `<i class="material-icons">play_arrow</i>Start Turn Order (${playersWithInitiative.length}/${connectedPlayers.length} players ready)`;
                    startBtn.disabled = false;
                    startBtn.style.background = '';
                }
                startBtn.onclick = () => startCleanTurns();
            }
            if (announceBtn) announceBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
        }
        
        // Update current enemies display
        const currentEnemiesDiv = document.getElementById('current-enemies');
        if (currentEnemiesDiv) {
            const enemies = CleanCombat.participants.filter(p => !p.isPlayer);
            if (enemies.length > 0) {
                currentEnemiesDiv.innerHTML = enemies.map(enemy => `
                    <div class="enemy-chip ${enemy.hasActed ? 'acted' : ''} ${CleanCombat.participants[CleanCombat.currentTurnIndex] === enemy ? 'current-turn' : ''}">
                        <span class="enemy-name">${enemy.name}</span>
                        <span class="enemy-stats">HP: ${enemy.hp}/${enemy.maxHp}</span>
                        <span class="enemy-initiative">Init: ${enemy.initiative}</span>
                        <button class="enemy-remove" onclick="removeCleanParticipant('${enemy.name}')" title="Remove">×</button>
                    </div>
                `).join('');
            } else {
                currentEnemiesDiv.innerHTML = '';
            }
        }
        
        // Update initiative arena
        const arenaEmpty = document.getElementById('arena-empty');
        const combatantsGrid = document.getElementById('combatants-grid');
        
        if (CleanCombat.participants.length === 0) {
            if (arenaEmpty) arenaEmpty.style.display = 'block';
            if (combatantsGrid) combatantsGrid.style.display = 'none';
        } else {
            if (arenaEmpty) arenaEmpty.style.display = 'none';
            if (combatantsGrid) {
                combatantsGrid.style.display = 'grid';
                combatantsGrid.innerHTML = CleanCombat.participants.map(p => {
                    const hpPercent = (p.hp / p.maxHp) * 100;
                    const isCurrentTurn = CleanCombat.participants[CleanCombat.currentTurnIndex] === p;
                    
                    return `
                    <div class="combatant-card ${p.isPlayer ? 'player' : 'enemy'} ${isCurrentTurn ? 'current-turn' : ''} ${p.hasActed ? 'acted' : ''} ${p.status === 'defeated' ? 'defeated' : ''}">
                        <div class="combatant-header">
                            <span class="combatant-name">${p.name}</span>
                            <span class="initiative-badge">${p.initiative}</span>
                        </div>
                        <div class="combatant-stats">
                            <div class="hp-container">
                                <div class="hp-bar">
                                    <div class="hp-fill" style="width: ${hpPercent}%; background-color: ${getHpBarColor(hpPercent)}"></div>
                                </div>
                                <div class="hp-text">
                                    <span>HP: ${p.hp}/${p.maxHp}</span>
                                    <span class="hp-percent ${getHpStatusClass(hpPercent)}">${Math.round(hpPercent)}%</span>
                                </div>
                                ${p.status === 'defeated' ? '<div class="defeat-overlay">💀 DEFEATED</div>' : ''}
                            </div>
                            <div class="status-indicators">
                                ${p.hasActed ? '<span class="status-acted">✓ Acted</span>' : '<span class="status-ready">⏳ Ready</span>'}
                                ${isCurrentTurn ? '<span class="status-current">▶ Current Turn</span>' : ''}
                                ${p.status === 'defeated' ? '<span class="status-defeated">💀 Defeated</span>' : ''}
                            </div>
                            ${!p.isPlayer ? `
                            <div class="enemy-controls">
                                <button class="btn-enemy-action" onclick="enemyTakeDamage('${p.name}', 5)" title="Deal 5 damage">-5 HP</button>
                                <button class="btn-enemy-action" onclick="enemyTakeDamage('${p.name}', 10)" title="Deal 10 damage">-10 HP</button>
                                <button class="btn-enemy-remove" onclick="removeCleanParticipant('${p.name}')" title="Remove enemy">✕</button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    `;
                }).join('');
            }
        }
        
        console.log('🎨 UI UPDATED:', {
            activeStatus: activeStatus?.textContent,
            round: roundDisplay?.textContent,
            currentTurn: currentTurnDisplay?.textContent,
            enemiesCount: CleanCombat.participants.filter(p => !p.isPlayer).length
        });
        
    } catch (error) {
        console.warn('🎨 UI update error:', error);
    }
    
    // Legacy compatibility layer (simplified)
    try {
        // Initialize combat arrays if they don't exist
        if (typeof window.combatPlayers === 'undefined') {
            window.combatPlayers = [];
        }
        if (typeof window.combatEnemies === 'undefined') {
            window.combatEnemies = [];
        }
        
        // Update legacy CombatState for compatibility
        if (typeof window.CombatState === 'undefined') {
            window.CombatState = {};
        }
        
        window.CombatState.isActive = CleanCombat.isActive;
        window.CombatState.currentRound = CleanCombat.currentRound;
        window.CombatState.turnStarted = CleanCombat.turnInProgress;
        window.CombatState.currentTurnIndex = CleanCombat.currentTurnIndex;
        
        // Convert participants to legacy format
        window.CombatState.initiativeOrder = CleanCombat.participants.map(p => ({
            character: p.name,
            total: p.initiative,
            d20: p.d20Roll,
            dexModifier: p.dexMod,
            hasActed: p.hasActed
        }));
        
        // Clear and populate legacy combat arrays
        window.combatPlayers.length = 0;
        window.combatEnemies.length = 0;
        
        CleanCombat.participants.forEach((p, index) => {
            const combatant = {
                id: `clean-${index}`,
                name: p.name,
                hp: p.hp,
                maxHp: p.maxHp,
                status: p.status,
                isCurrentTurn: CleanCombat.turnInProgress && 
                              CleanCombat.participants[CleanCombat.currentTurnIndex] === p,
                hasActed: p.hasActed,
                initiative: p.initiative,
                type: p.isPlayer ? 'player' : 'enemy'
            };
            
            if (p.isPlayer) {
                window.combatPlayers.push(combatant);
            } else {
                window.combatEnemies.push(combatant);
            }
        });
        
        console.log('🎨 LEGACY ARRAYS POPULATED:', {
            players: window.combatPlayers.length,
            enemies: window.combatEnemies.length
        });
        
    } catch (error) {
        console.warn('🎨 Legacy integration error:', error);
    }
}

// =============================================================================
// MANUAL CONTROLS (for testing and storyteller intervention)
// =============================================================================

/**
 * Manual functions for storyteller control
 */
window.CleanCombatControls = {
    start: startCleanCombat,
    addPlayer: (name, init, dex) => addCleanParticipant(name, init, dex, true),
    addEnemy: (name, init, dex) => addCleanParticipant(name, init, dex, false),
    startTurns: startCleanTurns,
    nextTurn: advanceToNextTurn,
    end: endCleanCombat,
    status: () => CleanCombat
};

// =============================================================================
// EXPORT FOR INTEGRATION
// =============================================================================

// Make functions available globally for existing integrations
window.CleanCombat = CleanCombat;
window.handleCleanV4Command = handleCleanV4Command;
window.startCleanCombat = startCleanCombat;
window.processCleanAction = processCleanAction;
window.addEnemyToCombat = addEnemyToCombat;

// Legacy compatibility functions
window.startCombatInitiative = startCleanCombat;  // Map old function to new
window.addCleanParticipant = addCleanParticipant;  // Export participant adding
window.removeCleanParticipant = removeCleanParticipant;  // Export participant removal
window.endCleanCombat = endCleanCombat;  // Export combat ending
window.enemyTakeDamage = enemyTakeDamage;  // Export enemy damage function

// Export V4-network compatible functions for chat integration
window.processInitiativeCommand = handleCleanV4Command;  // V4-network expects this function
window.CombatSystem = {
    processInitiativeCommand: handleCleanV4Command,
    processAttackCommand: handleCleanV4Command,
    processSpellCommand: handleCleanV4Command,
    processRollCommand: handleCleanV4Command,
    startCombatInitiative: startCleanCombat,
    clearInitiative: endCleanCombat,
    getCombatState: () => CleanCombat
};

// =============================================================================
// TESTING INTERFACE
// =============================================================================

/**
 * Quick test functions for browser console
 */
window.CleanCombatTest = {
    // Quick start with test data
    quickTest: function() {
        console.log('🎯 STARTING QUICK COMBAT TEST...');
        startCleanCombat();
        
        // Add test participants
        setTimeout(() => {
            addCleanParticipant('bonusTest', 15, 2, true);   // Player: initiative 17
            addEnemyToCombat('Rat1', 8, 1);                  // Enemy with random initiative
            addEnemyToCombat('Rat2', 8, 1);                  // Enemy with random initiative
            
            console.log('🎯 Test participants added. Combat should auto-start when ready...');
        }, 500);
    },
    
    // Test V4 commands
    testV4Attack: function() {
        console.log('🎯 TESTING V4 ATTACK COMMAND...');
        handleCleanV4Command('ATTACK:bonusTest:15:12:Pistol');
    },
    
    testV4Initiative: function() {
        console.log('🎯 TESTING V4 INITIATIVE COMMAND...');
        handleCleanV4Command('INITIATIVE:TestPlayer:18:3');
    },
    
    // Manual controls with better integration
    start: () => startCleanCombat(),
    addPlayer: (name, d20, dex) => addCleanParticipant(name, d20, dex, true),
    addEnemy: (name, hp = 8, dex = 1) => addEnemyToCombat(name, hp, dex),
    startTurns: () => startCleanTurns(),
    nextTurn: () => advanceToNextTurn(),
    status: () => {
        console.table(CleanCombat.participants);
        return CleanCombat;
    },
    end: () => endCleanCombat(),
    
    // UI Integration helpers
    forceUIUpdate: () => updateCleanCombatDisplay(),
    
    // Combat scenario shortcuts
    ratFight: function() {
        console.log('🐀 RAT FIGHT: Starting test scenario');
        startCleanCombat();
        setTimeout(() => {
            addEnemyToCombat('Rat', 8, 1);
            addEnemyToCombat('Rat', 8, 1);
            console.log('🐀 RAT FIGHT: Added enemies, forcing UI update');
            updateCleanCombatDisplay();
            
            // Try multiple UI refresh methods
            setTimeout(() => {
                console.log('🐀 RAT FIGHT: Secondary refresh');
                if (typeof refreshPage === 'function') refreshPage();
                if (typeof updateGameState === 'function') updateGameState();
                if (typeof displayCombat === 'function') displayCombat();
                
                // Show current arrays
                console.log('🐀 FINAL STATE CHECK:', {
                    cleanParticipants: CleanCombat.participants.length,
                    combatEnemies: window.combatEnemies?.length || 'undefined',
                    combatPlayers: window.combatPlayers?.length || 'undefined'
                });
            }, 1000);
        }, 500);
    },
    
    bossFight: function() {
        startCleanCombat();
        setTimeout(() => {
            addEnemyToCombat('Orc Chieftain', 25, 2);
            addEnemyToCombat('Orc Warrior', 15, 1);
            addEnemyToCombat('Orc Warrior', 15, 1);
        }, 500);
    }
};

console.log('🎯 CLEAN COMBAT SYSTEM LOADED');
console.log('📋 Available controls: window.CleanCombatControls');
console.log('🧪 Testing interface: window.CleanCombatTest');
console.log('');
console.log('🚀 Quick Start:');
console.log('   CleanCombatTest.quickTest()    - Start test combat with sample data');
console.log('   CleanCombatTest.ratFight()     - Quick 2-rat combat scenario');
console.log('   CleanCombatTest.bossFight()    - Orc boss fight scenario');
console.log('   CleanCombatTest.status()       - Show current combat state');
console.log('   CleanCombatTest.testV4Attack() - Test V4 attack command');
console.log('');
console.log('🔧 Manual Controls:');
console.log('   CleanCombatTest.start()        - Start combat');
console.log('   CleanCombatTest.addEnemy("Orc", 15, 2) - Add enemy with HP and DEX');
console.log('   CleanCombatTest.forceUIUpdate() - Force UI refresh');
console.log('   CleanCombatTest.end()          - End combat');
