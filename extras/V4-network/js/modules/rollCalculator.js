/**
 * Roll Calculator Module
 * Handles all DCC roll calculations including attributes, skills, weapons, and to-hit
 * Uses DCCMechanics for dice rolling and character data for bonuses
 */

class RollCalculator {
    constructor(dccMechanics) {
        this.mechanics = dccMechanics;
        this.rollHistory = [];
    }

    /**
     * Perform an attribute roll
     * @param {string} attributeName - Name of the attribute (str, dex, con, etc.)
     * @param {number} attributeValue - Current value of the attribute
     * @param {number} characterLevel - Character's level
     * @returns {Object} Complete roll data
     */
    rollAttribute(attributeName, attributeValue, characterLevel) {
        const config = this.mechanics.getDiceConfiguration(characterLevel);
        const diceRolls = this.mechanics.rollDice(config.diceCount, config.diceType);
        const diceTotal = this.mechanics.sumDiceRolls(diceRolls);
        const finalTotal = diceTotal + config.levelBonus + attributeValue;

        const rollData = {
            id: this.mechanics.generateId(),
            type: 'Attribute',
            name: this._capitalizeFirst(attributeName),
            diceRolls: diceRolls,
            diceTotal: diceTotal,
            levelBonus: config.levelBonus,
            attributeBonus: attributeValue,
            finalTotal: finalTotal,
            config: config,
            timestamp: this.mechanics.getTimestamp(),
            description: `${config.description} + ${attributeName.toUpperCase()}(${attributeValue})`
        };

        this._addToHistory(rollData);
        return rollData;
    }

    /**
     * Perform a skill roll
     * @param {string} skillName - Name of the skill
     * @param {string} attributeName - Governing attribute
     * @param {number} attributeValue - Value of governing attribute
     * @param {number} characterLevel - Character's level
     * @returns {Object} Complete roll data
     */
    rollSkill(skillName, attributeName, attributeValue, characterLevel) {
        const config = this.mechanics.getDiceConfiguration(characterLevel);
        const diceRolls = this.mechanics.rollDice(config.diceCount, config.diceType);
        const diceTotal = this.mechanics.sumDiceRolls(diceRolls);
        const finalTotal = diceTotal + config.levelBonus + attributeValue;

        const rollData = {
            id: this.mechanics.generateId(),
            type: 'Skill',
            name: skillName,
            attribute: attributeName,
            diceRolls: diceRolls,
            diceTotal: diceTotal,
            levelBonus: config.levelBonus,
            attributeBonus: attributeValue,
            finalTotal: finalTotal,
            config: config,
            timestamp: this.mechanics.getTimestamp(),
            description: `${skillName} [${attributeName.toUpperCase()}] - ${config.description} + ${attributeName.toUpperCase()}(${attributeValue})`
        };

        this._addToHistory(rollData);
        return rollData;
    }

    /**
     * Perform a to-hit roll
     * @param {string} attackAttribute - Attribute used for attack (str for melee, dex for ranged)
     * @param {number} attributeValue - Value of the attack attribute
     * @param {number} characterLevel - Character's level
     * @returns {Object} To-hit roll data
     */
    rollToHit(attackAttribute, attributeValue, characterLevel) {
        const d10Result = this.mechanics.rollD10ToHit();
        const total = d10Result.roll + attributeValue + characterLevel;

        const rollData = {
            id: this.mechanics.generateId(),
            type: 'To-Hit',
            d10Roll: d10Result.roll,
            isCrit: d10Result.isCrit,
            attributeBonus: attributeValue,
            levelBonus: characterLevel,
            total: total,
            attributeUsed: attackAttribute,
            timestamp: this.mechanics.getTimestamp(),
            description: `d10(${d10Result.roll}) + ${attackAttribute.toUpperCase()}(${attributeValue}) + Level(${characterLevel}) = ${total}${d10Result.isCrit ? ' [CRIT!]' : ''}`
        };

        this._addToHistory(rollData);
        return rollData;
    }

    /**
     * Perform a weapon damage roll
     * @param {Object} weapon - Weapon object with size and properties
     * @param {string} attackAttribute - Attribute used for damage (str/dex)
     * @param {number} attributeValue - Value of the attack attribute
     * @param {number} characterLevel - Character's level
     * @param {boolean} isCriticalHit - Whether this is a critical hit
     * @returns {Object} Weapon damage roll data
     */
    rollWeaponDamage(weapon, attackAttribute, attributeValue, characterLevel, isCriticalHit = false) {
        const weaponSize = this.mechanics.getWeaponSize(weapon.size);
        const damageRoll = this.mechanics.rollSingleDie(weaponSize.dice);
        
        // Calculate total damage
        let totalDamage = damageRoll + attributeValue;
        
        // Apply critical hit bonus
        if (isCriticalHit) {
            totalDamage += 5;
        }

        const rollData = {
            id: this.mechanics.generateId(),
            type: 'Weapon Damage',
            weaponName: weapon.name,
            weaponSize: weaponSize.name,
            damageRoll: damageRoll,
            diceType: weaponSize.dice,
            attributeBonus: attributeValue,
            attributeUsed: attackAttribute,
            criticalBonus: isCriticalHit ? 5 : 0,
            totalDamage: totalDamage,
            isRanged: weapon.ranged || false,
            isCritical: isCriticalHit,
            timestamp: this.mechanics.getTimestamp(),
            description: `${weapon.name} - d${weaponSize.dice}(${damageRoll}) + ${attackAttribute.toUpperCase()}(${attributeValue})${isCriticalHit ? ' + Crit(5)' : ''} = ${totalDamage}`
        };

        this._addToHistory(rollData);
        return rollData;
    }

    /**
     * Perform a saving throw
     * @param {string} saveType - Type of save (str, dex, con, int, wis, cha)
     * @param {number} attributeValue - Value of the save attribute
     * @param {number} characterLevel - Character's level
     * @returns {Object} Saving throw roll data
     */
    rollSavingThrow(saveType, attributeValue, characterLevel) {
        const config = this.mechanics.getDiceConfiguration(characterLevel);
        const diceRolls = this.mechanics.rollDice(config.diceCount, config.diceType);
        const diceTotal = this.mechanics.sumDiceRolls(diceRolls);
        const finalTotal = diceTotal + config.levelBonus + attributeValue;

        const rollData = {
            id: this.mechanics.generateId(),
            type: 'Saving Throw',
            name: `${this._capitalizeFirst(saveType)} Save`,
            saveType: saveType,
            diceRolls: diceRolls,
            diceTotal: diceTotal,
            levelBonus: config.levelBonus,
            attributeBonus: attributeValue,
            finalTotal: finalTotal,
            config: config,
            timestamp: this.mechanics.getTimestamp(),
            description: `${saveType.toUpperCase()} Save - ${config.description} + ${saveType.toUpperCase()}(${attributeValue})`
        };

        this._addToHistory(rollData);
        return rollData;
    }

    /**
     * Get recent roll history
     * @param {number} count - Number of recent rolls to return
     * @returns {Array} Array of recent roll data
     */
    getRecentRolls(count = 10) {
        return this.rollHistory.slice(0, count);
    }

    /**
     * Clear roll history
     */
    clearHistory() {
        this.rollHistory = [];
    }

    /**
     * Get roll by ID
     * @param {string} rollId - ID of the roll to retrieve
     * @returns {Object|null} Roll data or null if not found
     */
    getRollById(rollId) {
        return this.rollHistory.find(roll => roll.id === rollId) || null;
    }

    /**
     * Add roll to history (private method)
     * @param {Object} rollData - Roll data to add
     */
    _addToHistory(rollData) {
        this.rollHistory.unshift(rollData);
        // Keep only last 50 rolls
        if (this.rollHistory.length > 50) {
            this.rollHistory = this.rollHistory.slice(0, 50);
        }
    }

    /**
     * Capitalize first letter (private method)
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    _capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for use in other modules
window.RollCalculator = RollCalculator;
