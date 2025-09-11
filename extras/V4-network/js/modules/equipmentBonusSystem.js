/**
 * Equipment Bonus System Module
 * Handles equipment bonuses from achievements, skills, and character features
 * Extracted from V4 for use in StoryTeller chat system
 */

class EquipmentBonusSystem {
    constructor() {
        // This will be expanded as the system grows
        this.bonusTypes = {
            DAMAGE: 'damage',
            TO_HIT: 'toHit',
            DEFENSE: 'defense',
            SKILL: 'skill'
        };
    }

    /**
     * Get equipment bonuses for a specific item
     * @param {string} itemName - Name of the item
     * @param {string} itemType - Type of item (weapon, armor, etc.)
     * @param {Object} character - Character data with achievements and skills
     * @returns {Object} Bonus data with damage, toHit, and sources
     */
    getEquipmentBonuses(itemName, itemType, character = null) {
        const bonuses = {
            damage: 0,
            toHit: 0,
            defense: 0,
            sources: []
        };

        if (!character) return bonuses;

        // Check achievements for equipment bonuses
        if (character.achievements && character.achievements.length > 0) {
            character.achievements.forEach(achievement => {
                const achievementBonuses = this.parseEquipmentBonuses(achievement.effect, itemName, itemType);
                if (achievementBonuses.damage > 0 || achievementBonuses.toHit > 0 || achievementBonuses.defense > 0) {
                    bonuses.damage += achievementBonuses.damage;
                    bonuses.toHit += achievementBonuses.toHit;
                    bonuses.defense += achievementBonuses.defense;
                    bonuses.sources.push({
                        type: 'achievement',
                        name: achievement.name,
                        damage: achievementBonuses.damage,
                        toHit: achievementBonuses.toHit,
                        defense: achievementBonuses.defense
                    });
                }
            });
        }

        // Check skills for equipment bonuses
        if (character.skills && character.skills.length > 0) {
            character.skills.forEach(skill => {
                const skillBonuses = this.parseEquipmentBonuses(skill.description || '', itemName, itemType);
                if (skillBonuses.damage > 0 || skillBonuses.toHit > 0 || skillBonuses.defense > 0) {
                    bonuses.damage += skillBonuses.damage;
                    bonuses.toHit += skillBonuses.toHit;
                    bonuses.defense += skillBonuses.defense;
                    bonuses.sources.push({
                        type: 'skill',
                        name: skill.name,
                        damage: skillBonuses.damage,
                        toHit: skillBonuses.toHit,
                        defense: skillBonuses.defense
                    });
                }
            });
        }

        return bonuses;
    }

    /**
     * Parse equipment bonuses from effect text
     * @param {string} effectText - Text describing the effect
     * @param {string} itemName - Name of the specific item
     * @param {string} itemType - Type of the item
     * @returns {Object} Parsed bonuses
     */
    parseEquipmentBonuses(effectText, itemName, itemType) {
        const bonuses = { damage: 0, toHit: 0, defense: 0 };
        if (!effectText) return bonuses;

        const itemNameLower = itemName.toLowerCase();
        const itemTypeLower = itemType.toLowerCase();
        const effectLower = effectText.toLowerCase();

        // Patterns for equipment bonuses
        const bonusPatterns = [
            // Specific weapon bonuses: "+2 damage with Rusty Sword"
            {
                pattern: new RegExp(`\\+(\\d+)\\s+damage\\s+with\\s+${this.escapeRegex(itemNameLower)}`, 'gi'),
                type: 'damage'
            },
            {
                pattern: new RegExp(`\\+(\\d+)\\s+(?:to hit|hit)\\s+with\\s+${this.escapeRegex(itemNameLower)}`, 'gi'),
                type: 'toHit'
            },
            // Weapon type bonuses: "+1 to hit with swords", "+2 damage with ranged weapons"
            {
                pattern: new RegExp(`\\+(\\d+)\\s+(?:to hit|hit)\\s+with\\s+.*${itemTypeLower}`, 'gi'),
                type: 'toHit'
            },
            {
                pattern: new RegExp(`\\+(\\d+)\\s+damage\\s+with\\s+.*${itemTypeLower}`, 'gi'),
                type: 'damage'
            },
            // General weapon bonuses: "+1 to all weapon attacks"
            {
                pattern: /\+(\d+)\s+(?:to hit|hit)\s+(?:with\s+)?(?:all\s+)?weapons?/gi,
                type: 'toHit'
            },
            {
                pattern: /\+(\d+)\s+damage\s+(?:with\s+)?(?:all\s+)?weapons?/gi,
                type: 'damage'
            },
            // Defense bonuses
            {
                pattern: /\+(\d+)\s+(?:to\s+)?(?:ac|armor|defense|protection)/gi,
                type: 'defense'
            }
        ];

        // Add shield-specific patterns if item is a shield
        if (itemNameLower.includes('shield')) {
            bonusPatterns.push(
                {
                    pattern: /\+(\d+)\s+(?:to\s+)?(?:ac|armor|protection)\s+(?:with\s+)?shields?/gi,
                    type: 'defense'
                },
                {
                    pattern: /\+(\d+)\s+(?:to\s+)?defense\s+(?:with\s+)?shields?/gi,
                    type: 'defense'
                }
            );
        }

        // Check for specific item name matches first
        if (effectLower.includes(itemNameLower)) {
            const damageMatch = effectText.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?damage\\s+.*${this.escapeRegex(itemNameLower)}`, 'gi'));
            const hitMatch = effectText.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?hit\\s+.*${this.escapeRegex(itemNameLower)}`, 'gi'));
            const defenseMatch = effectText.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?(?:ac|armor|defense)\\s+.*${this.escapeRegex(itemNameLower)}`, 'gi'));
            
            if (damageMatch) {
                const match = damageMatch[0].match(/\d+/);
                if (match) bonuses.damage += parseInt(match[0]);
            }
            if (hitMatch) {
                const match = hitMatch[0].match(/\d+/);
                if (match) bonuses.toHit += parseInt(match[0]);
            }
            if (defenseMatch) {
                const match = defenseMatch[0].match(/\d+/);
                if (match) bonuses.defense += parseInt(match[0]);
            }
        }

        // Check general patterns
        bonusPatterns.forEach(({ pattern, type }) => {
            let match;
            while ((match = pattern.exec(effectText)) !== null) {
                const bonus = parseInt(match[1]);
                if (bonus && !isNaN(bonus)) {
                    bonuses[type] += bonus;
                }
            }
        });

        return bonuses;
    }

    /**
     * Escape regex special characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Create a summary of equipment bonuses for display
     * @param {Object} bonuses - Bonus data from getEquipmentBonuses
     * @returns {string} Human-readable summary
     */
    formatBonusSummary(bonuses) {
        const parts = [];
        
        if (bonuses.damage > 0) {
            parts.push(`+${bonuses.damage} damage`);
        }
        if (bonuses.toHit > 0) {
            parts.push(`+${bonuses.toHit} to hit`);
        }
        if (bonuses.defense > 0) {
            parts.push(`+${bonuses.defense} defense`);
        }

        return parts.join(', ');
    }

    /**
     * Create a detailed breakdown of bonus sources
     * @param {Object} bonuses - Bonus data from getEquipmentBonuses
     * @returns {string} Detailed breakdown
     */
    formatBonusBreakdown(bonuses) {
        if (bonuses.sources.length === 0) return '';

        return bonuses.sources.map(source => {
            const parts = [];
            if (source.damage > 0) parts.push(`+${source.damage} dmg`);
            if (source.toHit > 0) parts.push(`+${source.toHit} hit`);
            if (source.defense > 0) parts.push(`+${source.defense} def`);
            
            return `${source.name} (${parts.join(', ')})`;
        }).join('\n');
    }

    /**
     * Check if an item has any bonuses
     * @param {Object} bonuses - Bonus data from getEquipmentBonuses
     * @returns {boolean} True if item has bonuses
     */
    hasBonuses(bonuses) {
        return bonuses.damage > 0 || bonuses.toHit > 0 || bonuses.defense > 0;
    }

    /**
     * Apply bonuses to a roll result
     * @param {Object} rollResult - Roll result object
     * @param {Object} bonuses - Equipment bonuses to apply
     * @returns {Object} Modified roll result
     */
    applyBonusesToRoll(rollResult, bonuses) {
        const modifiedResult = { ...rollResult };

        if (rollResult.type === 'To-Hit' && bonuses.toHit > 0) {
            modifiedResult.total += bonuses.toHit;
            modifiedResult.equipmentBonus = bonuses.toHit;
            modifiedResult.description += ` + Equipment(${bonuses.toHit})`;
        }

        if (rollResult.type === 'Weapon Damage' && bonuses.damage > 0) {
            modifiedResult.totalDamage += bonuses.damage;
            modifiedResult.equipmentBonus = bonuses.damage;
            modifiedResult.description += ` + Equipment(${bonuses.damage})`;
        }

        return modifiedResult;
    }
}

// Export for use in other modules
window.EquipmentBonusSystem = EquipmentBonusSystem;
