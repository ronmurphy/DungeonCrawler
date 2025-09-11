/**
 * DCC Mechanics Module
 * Core dice rolling and game mechanics extracted from V4
 * Provides level-based dice configuration and rolling functions
 */

class DCCMechanics {
    constructor() {
        this.weaponSizes = {
            light: { dice: 4, name: 'Light' },
            medium: { dice: 6, name: 'Medium' },
            heavy: { dice: 8, name: 'Heavy' }
        };
    }

    /**
     * Get dice configuration based on character level
     * @param {number} level - Character level
     * @returns {Object} Dice configuration with count, type, and bonus
     */
    getDiceConfiguration(level) {
        const tensDigit = Math.floor(level / 10);
        const onesDigit = level % 10;

        let diceCount = Math.max(1, tensDigit);
        let diceType = 10;

        if (level >= 80) {
            diceCount = 8;
            diceType = 10;
        } else if (level >= 11 && level <= 20) {
            diceCount = 1;
            diceType = 20;
        } else if (level >= 21) {
            diceCount = Math.min(8, tensDigit);
            diceType = 10;
        }

        return {
            diceCount: diceCount,
            diceType: diceType,
            levelBonus: onesDigit,
            description: `${diceCount}d${diceType} + ${onesDigit} (Level ${level})`
        };
    }

    /**
     * Roll multiple dice of specified type
     * @param {number} diceCount - Number of dice to roll
     * @param {number} diceType - Type of dice (sides)
     * @returns {Array} Array of individual roll results
     */
    rollDice(diceCount, diceType) {
        const rolls = [];
        for (let i = 0; i < diceCount; i++) {
            rolls.push(Math.floor(Math.random() * diceType) + 1);
        }
        return rolls;
    }

    /**
     * Roll a single die
     * @param {number} sides - Number of sides on the die
     * @returns {number} Roll result
     */
    rollSingleDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Roll a d10 for to-hit calculations
     * @returns {Object} Roll result with crit information
     */
    rollD10ToHit() {
        const roll = this.rollSingleDie(10);
        return {
            roll: roll,
            isCrit: roll === 10
        };
    }

    /**
     * Calculate total from dice rolls
     * @param {Array} rolls - Array of individual dice rolls
     * @returns {number} Sum of all rolls
     */
    sumDiceRolls(rolls) {
        return rolls.reduce((sum, roll) => sum + roll, 0);
    }

    /**
     * Format dice rolls for display
     * @param {Array} rolls - Array of dice roll results
     * @returns {string} Formatted string showing individual rolls
     */
    formatDiceRolls(rolls) {
        return rolls.map(roll => `<span class="dice-roll">${roll}</span>`).join(' + ');
    }

    /**
     * Generate a unique ID for tracking rolls
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get current timestamp for roll tracking
     * @returns {string} Formatted time string
     */
    getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    /**
     * Get weapon size information
     * @param {string} size - Weapon size (light, medium, heavy)
     * @returns {Object} Weapon size data
     */
    getWeaponSize(size) {
        return this.weaponSizes[size] || this.weaponSizes.medium;
    }
}

// Export for use in other modules
window.DCCMechanics = DCCMechanics;
