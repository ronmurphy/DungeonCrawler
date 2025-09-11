/**
 * DCC Chat Integration Module
 * Integrates DCC mechanics with the chat system
 */

class DCCChatIntegration {
    constructor() {
        this.dccMechanics = new DCCMechanics();
        this.rollCalculator = new RollCalculator(this.dccMechanics);
        this.characterData = new CharacterData();
        this.skillsManager = new SkillsManager();
        this.equipmentBonusSystem = new EquipmentBonusSystem();
        this.utilities = new DCCUtilities();
        this.commandParser = new ChatCommandParser();
        
        // Initialize command parser
        this.initializeCommandParser();
        
        // Default player data (can be overridden)
        this.defaultPlayer = {
            name: 'Player',
            level: 1,
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            }
        };
        
        // Player registry
        this.players = new Map();
        
        // Event callbacks
        this.onRollComplete = null;
        this.onCombatAction = null;
    }

    /**
     * Initialize command parser with DCC systems
     */
    async initializeCommandParser() {
        // Wait a bit for other systems to initialize
        setTimeout(() => {
            this.commandParser.initialize(this, this.skillsManager, this.characterData);
        }, 100);
    }

    /**
     * Set event handlers for roll and combat events
     * @param {Function} onRollComplete - Called when a roll is completed
     * @param {Function} onCombatAction - Called when combat action occurs
     */
    setEventHandlers(onRollComplete, onCombatAction) {
        this.onRollComplete = onRollComplete;
        this.onCombatAction = onCombatAction;
    }

    /**
     * Register a player with their character data
     * @param {Object} playerData - Player character data
     */
    registerPlayer(playerData) {
        if (!playerData.name) {
            throw new Error('Player must have a name');
        }

        this.players.set(playerData.name, {
            name: playerData.name,
            level: playerData.level || 1,
            attributes: {
                strength: playerData.attributes?.strength || 10,
                dexterity: playerData.attributes?.dexterity || 10,
                constitution: playerData.attributes?.constitution || 10,
                intelligence: playerData.attributes?.intelligence || 10,
                wisdom: playerData.attributes?.wisdom || 10,
                charisma: playerData.attributes?.charisma || 10,
                ...playerData.attributes
            },
            skills: playerData.skills || [],
            equipment: playerData.equipment || {}
        });

        // Also register with command parser
        this.commandParser.registerPlayer(playerData.name, this.players.get(playerData.name));

        console.log(`✅ Registered player: ${playerData.name} (Level ${playerData.level || 1})`);
    }

    /**
     * Get player data or use default
     * @param {string} playerName - Name of the player
     * @returns {Object} Player data
     */
    getPlayer(playerName) {
        return this.players.get(playerName) || {
            ...this.defaultPlayer,
            name: playerName
        };
    }

    /**
     * Process a roll command with DCC mechanics
     * @param {string} playerName - Name of the player
     * @param {string} rollType - Type of roll (attribute name, skill name, or 'custom')
     * @param {string} customDice - Custom dice specification (e.g., "3d6", "1d20")
     * @returns {Object} Roll result data
     */
    processRoll(playerName, rollType, customDice = null) {
        const player = this.getPlayer(playerName);
        let rollResult;

        if (customDice) {
            // Handle custom dice rolls (e.g., "3d6", "1d20+5")
            rollResult = this.processCustomRoll(playerName, customDice, rollType);
        } else if (this.isAttribute(rollType)) {
            // Attribute roll using DCC level-based dice
            const attributeName = this.characterData.getFullAttributeName(rollType);
            const attributeValue = player.attributes[attributeName] || 10;
            rollResult = this.rollCalculator.rollAttribute(attributeName, attributeValue, player.level);
        } else if (this.characterData.isStandardSkill(rollType)) {
            // Standard skill roll
            const governingAttribute = this.characterData.getSkillAttribute(rollType);
            const attributeValue = player.attributes[governingAttribute] || 10;
            rollResult = this.rollCalculator.rollSkill(rollType, governingAttribute, attributeValue, player.level);
        } else {
            // Treat as custom skill or saving throw
            const attributeName = this.guessAttributeForSkill(rollType);
            const attributeValue = player.attributes[attributeName] || 10;
            rollResult = this.rollCalculator.rollSkill(rollType, attributeName, attributeValue, player.level);
        }

        // Add player context
        rollResult.playerName = playerName;
        rollResult.playerLevel = player.level;

        // Trigger callback
        if (this.onRollComplete) {
            this.onRollComplete(rollResult);
        }

        return rollResult;
    }

    /**
     * Process a custom dice roll (e.g., "3d6", "1d20+5")
     * @param {string} playerName - Name of the player
     * @param {string} diceString - Dice specification
     * @param {string} purpose - Purpose of the roll
     * @returns {Object} Roll result data
     */
    processCustomRoll(playerName, diceString, purpose = 'Custom Roll') {
        const player = this.getPlayer(playerName);
        
        // Parse dice string (e.g., "3d6", "1d20+5", "2d8-1")
        const diceMatch = diceString.match(/(\d+)?d(\d+)([+-]\d+)?/i);
        if (!diceMatch) {
            throw new Error(`Invalid dice format: ${diceString}. Use format like "3d6" or "1d20+5"`);
        }

        const diceCount = parseInt(diceMatch[1]) || 1;
        const diceType = parseInt(diceMatch[2]);
        const modifier = diceMatch[3] ? parseInt(diceMatch[3]) : 0;

        const diceRolls = this.dccMechanics.rollDice(diceCount, diceType);
        const diceTotal = this.dccMechanics.sumDiceRolls(diceRolls);
        const finalTotal = diceTotal + modifier;

        const rollResult = {
            id: this.dccMechanics.generateId(),
            type: 'Custom Roll',
            name: purpose,
            diceRolls: diceRolls,
            diceTotal: diceTotal,
            modifier: modifier,
            finalTotal: finalTotal,
            diceString: diceString,
            playerName: playerName,
            playerLevel: player.level,
            timestamp: this.dccMechanics.getTimestamp(),
            description: `${purpose} - ${diceCount}d${diceType}${modifier !== 0 ? (modifier > 0 ? '+' + modifier : modifier) : ''} = ${finalTotal}`
        };

        if (this.onRollComplete) {
            this.onRollComplete(rollResult);
        }

        return rollResult;
    }

    /**
     * Process an attack roll with weapon
     * @param {string} playerName - Name of the attacking player
     * @param {Object} weaponData - Weapon information
     * @returns {Object} Attack result with to-hit and damage
     */
    processAttack(playerName, weaponData) {
        const player = this.getPlayer(playerName);
        const attackAttribute = weaponData.ranged ? 'dexterity' : 'strength';
        const attributeValue = player.attributes[attackAttribute];

        // Get equipment bonuses for this weapon
        const equipmentBonuses = this.equipmentBonusSystem.getEquipmentBonuses(
            weaponData.name || 'weapon',
            weaponData.type || (weaponData.ranged ? 'ranged weapon' : 'melee weapon'),
            player
        );

        // Roll to hit
        let toHitRoll = this.rollCalculator.rollToHit(attackAttribute, attributeValue, player.level);
        
        // Apply equipment bonuses to hit roll
        if (equipmentBonuses.toHit > 0) {
            toHitRoll = this.equipmentBonusSystem.applyBonusesToRoll(toHitRoll, equipmentBonuses);
        }
        
        // Roll damage if provided weapon data
        let damageRoll = null;
        if (weaponData.size) {
            damageRoll = this.rollCalculator.rollWeaponDamage(
                weaponData, 
                attackAttribute, 
                attributeValue, 
                player.level, 
                toHitRoll.isCrit
            );
            
            // Apply equipment bonuses to damage roll
            if (equipmentBonuses.damage > 0) {
                damageRoll = this.equipmentBonusSystem.applyBonusesToRoll(damageRoll, equipmentBonuses);
            }
        }

        const attackResult = {
            id: this.utilities.generateId(),
            type: 'Attack',
            playerName: playerName,
            weaponName: weaponData.name || 'Unknown Weapon',
            toHit: toHitRoll,
            damage: damageRoll,
            equipmentBonuses: equipmentBonuses,
            bonusSummary: this.equipmentBonusSystem.formatBonusSummary(equipmentBonuses),
            formattedToHit: this.utilities.formatRollResult(toHitRoll),
            formattedDamage: damageRoll ? this.utilities.formatDamageResult(damageRoll) : null,
            timestamp: this.utilities.getTimestamp()
        };

        // Trigger combat callback
        if (this.onCombatAction) {
            this.onCombatAction(attackResult);
        }

        return attackResult;
    }

    /**
     * Process a saving throw
     * @param {string} playerName - Name of the player
     * @param {string} saveType - Type of save (str, dex, con, int, wis, cha)
     * @returns {Object} Saving throw result
     */
    processSavingThrow(playerName, saveType) {
        const player = this.getPlayer(playerName);
        const attributeName = this.characterData.getFullAttributeName(saveType);
        const attributeValue = player.attributes[attributeName] || 10;

        const saveResult = this.rollCalculator.rollSavingThrow(saveType, attributeValue, player.level);
        saveResult.playerName = playerName;
        saveResult.playerLevel = player.level;

        if (this.onRollComplete) {
            this.onRollComplete(saveResult);
        }

        return saveResult;
    }

    /**
     * Get roll history for display
     * @param {number} count - Number of recent rolls
     * @returns {Array} Recent roll data
     */
    getRecentRolls(count = 10) {
        return this.rollCalculator.getRecentRolls(count);
    }

    /**
     * Clear all roll history
     */
    clearRollHistory() {
        this.rollCalculator.clearHistory();
    }

    /**
     * Check if a string represents an attribute
     * @param {string} name - Name to check
     * @returns {boolean} True if it's an attribute
     */
    isAttribute(name) {
        return this.characterData.isValidAttribute(name);
    }

    /**
     * Guess the governing attribute for a custom skill
     * @param {string} skillName - Name of the skill
     * @returns {string} Best guess attribute name
     */
    guessAttributeForSkill(skillName) {
        const name = skillName.toLowerCase();
        
        // Physical skills
        if (name.includes('climb') || name.includes('jump') || name.includes('swim') || 
            name.includes('lift') || name.includes('push') || name.includes('strength')) {
            return 'strength';
        }
        
        // Dexterity skills
        if (name.includes('dodge') || name.includes('stealth') || name.includes('acrobat') ||
            name.includes('balance') || name.includes('reflex') || name.includes('aim')) {
            return 'dexterity';
        }
        
        // Constitution skills
        if (name.includes('endur') || name.includes('resist') || name.includes('tough') ||
            name.includes('stamina') || name.includes('fortitude')) {
            return 'constitution';
        }
        
        // Intelligence skills
        if (name.includes('know') || name.includes('recall') || name.includes('research') ||
            name.includes('logic') || name.includes('reason') || name.includes('tech')) {
            return 'intelligence';
        }
        
        // Wisdom skills
        if (name.includes('perceiv') || name.includes('sense') || name.includes('insight') ||
            name.includes('spot') || name.includes('listen') || name.includes('survival')) {
            return 'wisdom';
        }
        
        // Charisma skills
        if (name.includes('persuad') || name.includes('intimidat') || name.includes('deceiv') ||
            name.includes('bluff') || name.includes('charm') || name.includes('lead')) {
            return 'charisma';
        }
        
        // Default to intelligence for unknown skills
        return 'intelligence';
    }

    /**
     * Create a weapon object from basic parameters
     * @param {string} name - Weapon name
     * @param {string} size - Weapon size (light, medium, heavy)
     * @param {boolean} ranged - Whether weapon is ranged
     * @returns {Object} Weapon data object
     */
    createWeapon(name, size = 'medium', ranged = false) {
        return {
            name: name,
            size: size,
            ranged: ranged
        };
    }

    /**
     * Process a chat message for hidden commands
     * @param {string} message - Chat message text
     * @param {string} senderName - Name of person sending message
     * @returns {Object|null} Command result or null if no command
     */
    async processChatMessage(message, senderName = 'StoryTeller') {
        // Check if message contains a hidden command
        if (this.commandParser.isCommand(message)) {
            try {
                const result = await this.commandParser.processMessage(message, senderName);
                
                if (result && result.success) {
                    // Broadcast command result to chat (but not the original command)
                    if (result.message) {
                        this.broadcastMessage(result.message, 'System');
                    }
                    
                    // Log the successful command
                    console.log(`🎯 Command executed: ${result.command} for ${result.targetPlayer}`);
                }
                
                return result;
            } catch (error) {
                console.error('❌ Command processing failed:', error);
                return {
                    success: false,
                    error: error.message,
                    originalMessage: message
                };
            }
        }

        return null; // Not a command
    }

    /**
     * Broadcast a message to the chat (placeholder for actual chat integration)
     * @param {string} message - Message to broadcast
     * @param {string} sender - Sender name
     */
    broadcastMessage(message, sender = 'System') {
        // This would integrate with your actual chat system
        console.log(`💬 [${sender}]: ${message}`);
        
        // If you have a chat display function, call it here
        if (window.displayChatMessage) {
            window.displayChatMessage(message, sender, 'system');
        }
    }

    /**
     * Get available command help
     * @returns {Array} Array of command descriptions
     */
    getCommandHelp() {
        return this.commandParser.getAvailableCommands();
    }

    /**
     * Get available loot types
     * @returns {Array} Array of loot type names
     */
    getAvailableLootTypes() {
        return this.commandParser.getAvailableLootTypes();
    }
}

// Export for use in other modules
window.DCCChatIntegration = DCCChatIntegration;
