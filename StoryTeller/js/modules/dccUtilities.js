/**
 * DCC Utilities Module
 * Common utility functions extracted from V4 for use in StoryTeller
 */

class DCCUtilities {
    constructor() {
        this.statMap = {
            'str': 'strength', 
            'dex': 'dexterity', 
            'con': 'constitution',
            'int': 'intelligence', 
            'wis': 'wisdom', 
            'cha': 'charisma'
        };

        this.elementEmojis = {
            fire: '🔥', ice: '❄️', lightning: '⚡', earth: '🌍',
            air: '💨', water: '💧', light: '☀️', dark: '🌑',
            arcane: '🔮', divine: '✨', nature: '🌿', psychic: '🧠',
            shadow: '👤', force: '💥'
        };

        this.rollTypeIcons = {
            'roll': 'perspective-dice-six',
            'weapon': 'sword',
            'spell': 'lightning',
            'rest': 'heart-plus',
            'status': 'lightning-bolt',
            'save': 'save',
            'level': 'trophy',
            'default': 'sword'
        };
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get full stat name from abbreviation
     * @param {string} shortName - Abbreviated stat name (str, dex, etc.)
     * @returns {string} Full stat name
     */
    getFullStatName(shortName) {
        return this.statMap[shortName] || shortName;
    }

    /**
     * Get emoji for element type
     * @param {string} element - Element name
     * @returns {string} Element emoji
     */
    getElementEmoji(element) {
        return this.elementEmojis[element] || '✨';
    }

    /**
     * Get icon class for roll type
     * @param {string} type - Roll type
     * @returns {string} Icon class name
     */
    getRollTypeIcon(type) {
        return this.rollTypeIcons[type] || this.rollTypeIcons.default;
    }

    /**
     * Create a notification for display
     * @param {string} type - Notification type (roll, weapon, spell, etc.)
     * @param {string} title - Notification title
     * @param {string} result - Main result text
     * @param {string} details - Detailed information
     * @returns {Object} Notification data
     */
    createNotificationData(type, title, result, details) {
        return {
            id: this.generateId(),
            type: type,
            title: title,
            result: result,
            details: details,
            icon: this.getRollTypeIcon(type),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format a roll result for display
     * @param {Object} rollResult - Roll result object
     * @returns {string} Formatted roll text
     */
    formatRollResult(rollResult) {
        let formatted = `${rollResult.type}: ${rollResult.total}`;
        
        if (rollResult.dice && rollResult.dice.length > 0) {
            const diceText = rollResult.dice.map(d => `${d.die}=${d.result}`).join(', ');
            formatted += ` (${diceText})`;
        }

        if (rollResult.modifier !== 0) {
            formatted += ` ${rollResult.modifier >= 0 ? '+' : ''}${rollResult.modifier}`;
        }

        if (rollResult.equipmentBonus && rollResult.equipmentBonus > 0) {
            formatted += ` +${rollResult.equipmentBonus} Equipment`;
        }

        return formatted;
    }

    /**
     * Format damage result for display
     * @param {Object} damageResult - Damage result object
     * @returns {string} Formatted damage text
     */
    formatDamageResult(damageResult) {
        let formatted = `${damageResult.totalDamage} damage`;
        
        if (damageResult.dice && damageResult.dice.length > 0) {
            const diceText = damageResult.dice.map(d => `${d.die}=${d.result}`).join(', ');
            formatted += ` (${diceText})`;
        }

        if (damageResult.modifier !== 0) {
            formatted += ` ${damageResult.modifier >= 0 ? '+' : ''}${damageResult.modifier}`;
        }

        if (damageResult.equipmentBonus && damageResult.equipmentBonus > 0) {
            formatted += ` +${damageResult.equipmentBonus} Equipment`;
        }

        if (damageResult.isCrit) {
            formatted += ' (CRITICAL!)';
        }

        return formatted;
    }

    /**
     * Format attribute modifier for display
     * @param {number} attributeValue - Attribute value (3-18+)
     * @returns {string} Formatted modifier (+1, -2, etc.)
     */
    formatAttributeModifier(attributeValue) {
        const modifier = Math.floor((attributeValue - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    /**
     * Get character level description
     * @param {number} level - Character level
     * @returns {string} Level description
     */
    getLevelDescription(level) {
        if (level <= 0) return "Level 0 (Funnel Character)";
        if (level === 1) return "Level 1 (Novice)";
        if (level <= 3) return `Level ${level} (Apprentice)`;
        if (level <= 6) return `Level ${level} (Journeyman)`;
        if (level <= 9) return `Level ${level} (Expert)`;
        if (level <= 12) return `Level ${level} (Master)`;
        return `Level ${level} (Grandmaster)`;
    }

    /**
     * Parse dice notation (e.g., "2d6+3", "1d20")
     * @param {string} diceString - Dice notation string
     * @returns {Object} Parsed dice data
     */
    parseDiceNotation(diceString) {
        const dicePattern = /^(\d*)d(\d+)([+-]\d+)?$/i;
        const match = diceString.trim().match(dicePattern);
        
        if (!match) return null;

        return {
            count: parseInt(match[1]) || 1,
            sides: parseInt(match[2]),
            modifier: parseInt(match[3]) || 0,
            original: diceString
        };
    }

    /**
     * Validate dice notation
     * @param {string} diceString - Dice notation to validate
     * @returns {boolean} True if valid dice notation
     */
    isValidDiceNotation(diceString) {
        return this.parseDiceNotation(diceString) !== null;
    }

    /**
     * Capitalize first letter of each word
     * @param {string} text - Text to capitalize
     * @returns {string} Capitalized text
     */
    capitalizeWords(text) {
        return text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    /**
     * Create a time stamp for current time
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    /**
     * Get current date/time in ISO format
     * @returns {string} ISO timestamp
     */
    getISOTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format time difference for display
     * @param {Date|string} timestamp - Timestamp to compare
     * @returns {string} Human readable time difference
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    /**
     * Generate random element from array
     * @param {Array} array - Array to pick from
     * @returns {*} Random element
     */
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Clamp a number between min and max values
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

// Export for use in other modules
window.DCCUtilities = DCCUtilities;
