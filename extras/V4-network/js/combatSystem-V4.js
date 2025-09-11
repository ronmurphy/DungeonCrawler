/**
 * DCC COMBAT SYSTEM - V4-network (Player App)
 * ===========================================
 * 
 * This file contains all combat-related functionality for the V4-network player app.
 * Combat functionality is integrated with existing character sheet buttons for mobile optimization.
 * 
 * INTEGRATION POINTS WITH EXISTING FILES:
 * ======================================
 * 
 * 1. V4-network/js/core/main.js:
 *    - rollAttribute() function: Modified to detect combat mode and trigger initiative
 *    - rollWeaponDamage() function: Modified to send ATTACK commands in combat
 *    - castSpell() function: Modified to send SPELL commands in combat
 *    - rollSkill() function: Modified to send ROLL commands in combat
 *    - isInCombatMode() function: NEW - detects if connected to game session
 *    - rollInitiativeForDexterity() function: NEW - handles initiative rolling
 * 
 * 2. V4-network/js/supabase-chat.js:
 *    - processInitiativeCommand() function: NEW - formats initiative results
 *    - processAttackCommand() function: NEW - formats attack results  
 *    - processSpellCommand() function: NEW - formats spell casting results
 *    - processRollCommand() function: NEW - formats skill roll results
 * 
 * COMBAT WORKFLOW:
 * ===============
 * 1. Player clicks DEX attribute → rolls initiative → sends INITIATIVE command
 * 2. Player clicks weapon button → rolls attack → sends ATTACK command
 * 3. Player clicks spell button → casts spell → sends SPELL command
 * 4. Player clicks skill button → rolls skill → sends ROLL command
 * 
 */

// =============================================================================
// COMBAT MODE DETECTION
// =============================================================================

/**
 * Detects if player is connected to a game session (combat mode)
 * Used by attribute/weapon/spell/skill buttons to determine behavior
 * 
 * @returns {boolean} True if connected to game session
 */
function isInCombatMode() {
    // Check if connected to Supabase chat
    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
        return false;
    }
    
    // Check if connected to a specific channel/room
    if (typeof window.currentChannel === 'undefined' || !window.currentChannel) {
        return false;
    }
    
    // Check if character is loaded (required for combat)
    if (typeof window.currentCharacter === 'undefined' || !window.currentCharacter) {
        return false;
    }
    
    return true;
}

// =============================================================================
// INITIATIVE SYSTEM
// =============================================================================

/**
 * Rolls initiative using d20 + DEX + luck dice
 * Called when DEX attribute is clicked in combat mode
 * 
 * @param {Object} character - Current character object
 * @param {number} dexModifier - DEX attribute modifier
 * @returns {Object} Initiative roll results
 */
function rollInitiativeForDexterity(character, dexModifier) {
    // Roll d20 for base initiative
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    
    // Calculate luck dice (1d10 per 10 levels, rounded up)
    const characterLevel = character.level || 1;
    const luckDiceCount = Math.ceil(characterLevel / 10);
    
    let luckTotal = 0;
    let luckRolls = [];
    
    for (let i = 0; i < luckDiceCount; i++) {
        const luckRoll = Math.floor(Math.random() * 10) + 1;
        luckRolls.push(luckRoll);
        luckTotal += luckRoll;
    }
    
    // Calculate total initiative
    const totalInitiative = d20Roll + dexModifier + luckTotal;
    
    const result = {
        d20: d20Roll,
        dexModifier: dexModifier,
        luckDice: luckRolls,
        luckTotal: luckTotal,
        total: totalInitiative,
        characterName: character.name || 'Unknown'
    };
    
    // Send INITIATIVE command to chat
    if (isInCombatMode()) {
        sendInitiativeCommand(result);
    }
    
    return result;
}

// =============================================================================
// CHAT COMMAND SYSTEM
// =============================================================================

/**
 * Sends INITIATIVE command to StoryTeller
 * Format: INITIATIVE|CharacterName|Total|d20|DEX|LuckDice
 * 
 * @param {Object} initiativeResult - Result from rollInitiativeForDexterity()
 */
function sendInitiativeCommand(initiativeResult) {
    const command = `INITIATIVE|${initiativeResult.characterName}|${initiativeResult.total}|${initiativeResult.d20}|${initiativeResult.dexModifier}|${initiativeResult.luckDice.join(',')}`;
    
    if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage(command);
    }
}

/**
 * Sends ATTACK command to StoryTeller
 * Format: ATTACK|CharacterName|WeaponName|AttackRoll|DamageRoll
 * 
 * @param {string} characterName - Name of attacking character
 * @param {string} weaponName - Name of weapon used
 * @param {number} attackRoll - Attack roll result
 * @param {number} damageRoll - Damage roll result
 */
function sendAttackCommand(characterName, weaponName, attackRoll, damageRoll) {
    const command = `ATTACK|${characterName}|${weaponName}|${attackRoll}|${damageRoll}`;
    
    if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage(command);
    }
}

/**
 * Sends SPELL command to StoryTeller
 * Format: SPELL|CharacterName|SpellName|CastingRoll|Effect
 * 
 * @param {string} characterName - Name of casting character
 * @param {string} spellName - Name of spell cast
 * @param {number} castingRoll - Spell casting roll result
 * @param {string} effect - Spell effect description
 */
function sendSpellCommand(characterName, spellName, castingRoll, effect) {
    const command = `SPELL|${characterName}|${spellName}|${castingRoll}|${effect}`;
    
    if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage(command);
    }
}

/**
 * Sends ROLL command to StoryTeller
 * Format: ROLL|CharacterName|SkillName|RollResult|Modifier
 * 
 * @param {string} characterName - Name of character making roll
 * @param {string} skillName - Name of skill being rolled
 * @param {number} rollResult - Skill roll result
 * @param {number} modifier - Skill modifier applied
 */
function sendRollCommand(characterName, skillName, rollResult, modifier) {
    const command = `ROLL|${characterName}|${skillName}|${rollResult}|${modifier}`;
    
    if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage(command);
    }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Enhanced attribute rolling with combat mode detection
 * This replaces the rollAttribute() logic in main.js
 * 
 * @param {string} attributeName - Name of attribute (STR, DEX, etc.)
 * @param {number} modifier - Attribute modifier
 * @param {Object} character - Current character object
 */
function rollAttributeWithCombat(attributeName, modifier, character) {
    // If DEX attribute and in combat mode, roll initiative
    if (attributeName === 'DEX' && isInCombatMode()) {
        return rollInitiativeForDexterity(character, modifier);
    }
    
    // Otherwise, perform normal attribute roll
    const roll = Math.floor(Math.random() * 20) + 1 + modifier;
    return {
        attribute: attributeName,
        d20: roll - modifier,
        modifier: modifier,
        total: roll
    };
}

/**
 * Enhanced weapon damage rolling with combat mode detection
 * This replaces the rollWeaponDamage() logic in main.js
 * 
 * @param {Object} weapon - Weapon object with damage dice
 * @param {Object} character - Current character object
 */
function rollWeaponDamageWithCombat(weapon, character) {
    // Roll attack and damage
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const damageRoll = rollDice(weapon.damage); // Assumes rollDice function exists
    
    // If in combat mode, send ATTACK command
    if (isInCombatMode()) {
        sendAttackCommand(
            character.name || 'Unknown',
            weapon.name || 'Weapon',
            attackRoll,
            damageRoll
        );
    }
    
    return {
        weapon: weapon.name,
        attack: attackRoll,
        damage: damageRoll
    };
}

/**
 * Enhanced spell casting with combat mode detection
 * This replaces the castSpell() logic in main.js
 * 
 * @param {Object} spell - Spell object
 * @param {Object} character - Current character object
 */
function castSpellWithCombat(spell, character) {
    // Roll spell casting check
    const castingRoll = Math.floor(Math.random() * 20) + 1;
    
    // If in combat mode, send SPELL command
    if (isInCombatMode()) {
        sendSpellCommand(
            character.name || 'Unknown',
            spell.name || 'Spell',
            castingRoll,
            spell.effect || 'Unknown effect'
        );
    }
    
    return {
        spell: spell.name,
        castingRoll: castingRoll,
        effect: spell.effect
    };
}

/**
 * Enhanced skill rolling with combat mode detection
 * This replaces the rollSkill() logic in main.js
 * 
 * @param {string} skillName - Name of skill
 * @param {number} modifier - Skill modifier
 * @param {Object} character - Current character object
 */
function rollSkillWithCombat(skillName, modifier, character) {
    // Roll skill check
    const skillRoll = Math.floor(Math.random() * 20) + 1 + modifier;
    
    // If in combat mode, send ROLL command
    if (isInCombatMode()) {
        sendRollCommand(
            character.name || 'Unknown',
            skillName,
            skillRoll,
            modifier
        );
    }
    
    return {
        skill: skillName,
        d20: skillRoll - modifier,
        modifier: modifier,
        total: skillRoll
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generic dice rolling function
 * Supports standard RPG dice notation (e.g., "2d6+3")
 * 
 * @param {string} diceString - Dice notation string
 * @returns {number} Total of dice roll
 */
function rollDice(diceString) {
    // Simple implementation - can be enhanced
    if (!diceString || typeof diceString !== 'string') {
        return 1;
    }
    
    // Parse "XdY+Z" format
    const match = diceString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) {
        return 1;
    }
    
    const numDice = parseInt(match[1]) || 1;
    const dieSize = parseInt(match[2]) || 6;
    const modifier = parseInt(match[3]) || 0;
    
    let total = modifier;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * dieSize) + 1;
    }
    
    return total;
}

// =============================================================================
// EXPORTS FOR GLOBAL ACCESS
// =============================================================================

// Make functions available globally for integration with existing code
if (typeof window !== 'undefined') {
    window.CombatSystemV4 = {
        isInCombatMode,
        rollInitiativeForDexterity,
        rollAttributeWithCombat,
        rollWeaponDamageWithCombat,
        castSpellWithCombat,
        rollSkillWithCombat,
        sendInitiativeCommand,
        sendAttackCommand,
        sendSpellCommand,
        sendRollCommand,
        rollDice
    };
}
