/**
 * Skills Manager Module
 * Handles DCC skill system including levels, proficiency, training, and bonuses
 * Based on V4 skills system but modularized for easier management
 */

class SkillsManager {
    constructor() {
        this.jsonLoader = new JSONDataLoader();
        this.dataLoaded = false;
        this.allSkills = {};
        this.skillsData = null;
        
        // Skill level system configuration
        this.config = {
            maxLevel: 20,
            primalMaxLevel: 25,
            baseExperienceMultiplier: 100
        };
        
        this.initializeData();
    }

    /**
     * Initialize skills data loading
     */
    async initializeData() {
        try {
            await this.jsonLoader.loadAllData();
            this.skillsData = this.jsonLoader.getSkills();
            this.allSkills = this.jsonLoader.getSkillsFlat();
            this.dataLoaded = true;
            console.log('✅ Skills system initialized');
            console.log(`📊 Total skills available: ${Object.keys(this.allSkills).length}`);
        } catch (error) {
            console.error('❌ Failed to load skills data:', error);
            console.log('🔄 Falling back to basic skills...');
            this.dataLoaded = false;
        }
    }

    /**
     * Ensure data is loaded before accessing
     * @private
     */
    async _ensureDataLoaded() {
        if (!this.dataLoaded) {
            await this.initializeData();
        }
    }

    // ========================================
    // SKILL LEVEL SYSTEM
    // ========================================

    /**
     * Get required experience for a skill level
     * @param {number} level - Target level
     * @returns {number} Required experience
     */
    getRequiredExperience(level) {
        return level * this.config.baseExperienceMultiplier;
    }

    /**
     * Get total skill modifier for a character
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {number} Total skill modifier
     */
    getSkillModifier(character, skillName) {
        const skillLevel = this.getSkillLevel(character, skillName);
        const isProficient = this.isProficient(character, skillName);
        const attributeModifier = this.getAttributeModifier(character, skillName);
        
        let totalModifier = attributeModifier + skillLevel;
        
        if (isProficient) {
            totalModifier += character.level || 1;
        }
        
        return totalModifier;
    }

    /**
     * Get character's level in a specific skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {number} Skill level (default 1)
     */
    getSkillLevel(character, skillName) {
        if (!character.skillLevels || !character.skillLevels[skillName]) return 1;
        return character.skillLevels[skillName].level || 1;
    }

    /**
     * Check if character is proficient in a skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {boolean} True if proficient
     */
    isProficient(character, skillName) {
        if (!character.proficientSkills) return false;
        return character.proficientSkills.includes(skillName);
    }

    /**
     * Get attribute modifier for a skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {number} Attribute modifier
     */
    getAttributeModifier(character, skillName) {
        const skill = this.allSkills[skillName];
        if (!skill) return 0;
        
        const attributeValue = character.stats[skill.stat] || 10;
        return Math.floor((attributeValue - 10) / 2);
    }

    /**
     * Train a skill and possibly level it up
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @param {number} experienceGained - Experience points gained
     * @returns {boolean} True if skill leveled up
     */
    trainSkill(character, skillName, experienceGained) {
        if (!character.skillLevels) {
            character.skillLevels = {};
        }
        
        if (!character.skillLevels[skillName]) {
            character.skillLevels[skillName] = { level: 1, experience: 0 };
        }
        
        const skill = character.skillLevels[skillName];
        skill.experience += experienceGained;
        
        const requiredExp = this.getRequiredExperience(skill.level);
        if (skill.experience >= requiredExp) {
            const maxLevel = this.getMaxSkillLevel(character, skillName);
            if (skill.level < maxLevel) {
                skill.level++;
                skill.experience -= requiredExp;
                console.log(`🎓 ${skillName} leveled up to ${skill.level}!`);
                return true; // Level up occurred
            }
        }
        
        return false; // No level up
    }

    /**
     * Get maximum skill level for character (based on race/class)
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {number} Maximum skill level
     */
    getMaxSkillLevel(character, skillName) {
        // Primal race gets higher skill caps
        if (character.race === 'primal') {
            return this.config.primalMaxLevel;
        }
        
        // Check for class-specific skill bonuses
        if (this.hasClassSkillBonus(character, skillName)) {
            return this.config.maxLevel + 5;
        }
        
        return this.config.maxLevel;
    }

    /**
     * Check if character's class gives bonus to specific skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {boolean} True if class provides bonus
     */
    hasClassSkillBonus(character, skillName) {
        // This would need to be implemented based on class skill bonuses
        // For now, return false
        return false;
    }

    // ========================================
    // SKILL DATA ACCESS
    // ========================================

    /**
     * Get skill data by name
     * @param {string} skillName - Skill name
     * @returns {Object|null} Skill data
     */
    async getSkill(skillName) {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkill(skillName);
    }

    /**
     * Get skills by category
     * @param {string} category - Category key (combat, survival, etc.)
     * @returns {Object|null} Skills in category
     */
    async getSkillsByCategory(category) {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkillsByCategory(category);
    }

    /**
     * Get all skills as array
     * @returns {Array} Array of all skills
     */
    async getAllSkills() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkillsArray();
    }

    /**
     * Get all skills as flat object
     * @returns {Object} All skills keyed by name
     */
    async getAllSkillsFlat() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkillsFlat();
    }

    /**
     * Get skill categories
     * @returns {Array} Array of category names
     */
    async getSkillCategories() {
        await this._ensureDataLoaded();
        if (!this.skillsData || !this.skillsData.skills) return [];
        
        return Object.keys(this.skillsData.skills).map(key => ({
            key: key,
            name: this.skillsData.skills[key].category
        }));
    }

    /**
     * Search skills by name or description
     * @param {string} searchTerm - Search term
     * @returns {Array} Array of matching skills
     */
    async searchSkills(searchTerm) {
        await this._ensureDataLoaded();
        return this.jsonLoader.search(searchTerm, 'skills');
    }

    // ========================================
    // CHARACTER SKILL MANAGEMENT
    // ========================================

    /**
     * Initialize starting skills for a new character
     * @param {Object} character - Character object
     */
    initializeCharacterSkills(character) {
        if (!this.skillsData || !this.skillsData.startingSkills) {
            console.warn('⚠️ Starting skills data not available');
            return;
        }

        const startingConfig = this.skillsData.startingSkills.level1;
        
        character.skillLevels = {};
        character.proficientSkills = [];
        character.availableSkillPoints = startingConfig.total || 5;
        character.availableProficiencies = startingConfig.proficient || 3;
        
        console.log(`🎯 Character initialized with ${character.availableSkillPoints} skill points and ${character.availableProficiencies} proficiencies`);
    }

    /**
     * Add proficiency to a skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {boolean} True if proficiency added successfully
     */
    addProficiency(character, skillName) {
        if (!character.proficientSkills) {
            character.proficientSkills = [];
        }
        
        if (character.proficientSkills.includes(skillName)) {
            console.warn(`⚠️ Character is already proficient in ${skillName}`);
            return false;
        }
        
        if (character.availableProficiencies > 0) {
            character.proficientSkills.push(skillName);
            character.availableProficiencies--;
            console.log(`✅ Added proficiency in ${skillName}`);
            return true;
        }
        
        console.warn(`⚠️ No proficiency slots available`);
        return false;
    }

    /**
     * Remove proficiency from a skill
     * @param {Object} character - Character object
     * @param {string} skillName - Skill name
     * @returns {boolean} True if proficiency removed successfully
     */
    removeProficiency(character, skillName) {
        if (!character.proficientSkills) return false;
        
        const index = character.proficientSkills.indexOf(skillName);
        if (index > -1) {
            character.proficientSkills.splice(index, 1);
            character.availableProficiencies++;
            console.log(`❌ Removed proficiency in ${skillName}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get character's skill summary
     * @param {Object} character - Character object
     * @returns {Object} Skill summary data
     */
    getCharacterSkillSummary(character) {
        const summary = {
            totalSkills: Object.keys(this.allSkills).length,
            trainedSkills: character.skillLevels ? Object.keys(character.skillLevels).length : 0,
            proficientSkills: character.proficientSkills ? character.proficientSkills.length : 0,
            availableSkillPoints: character.availableSkillPoints || 0,
            availableProficiencies: character.availableProficiencies || 0,
            highestSkillLevel: 1
        };
        
        if (character.skillLevels) {
            summary.highestSkillLevel = Math.max(...Object.values(character.skillLevels).map(s => s.level));
        }
        
        return summary;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Get loading status
     * @returns {Object} Loading status information
     */
    getLoadingStatus() {
        return {
            dataLoaded: this.dataLoaded,
            skillCount: Object.keys(this.allSkills).length,
            ...this.jsonLoader.getLoadingStatus()
        };
    }

    /**
     * Format skill modifier for display
     * @param {number} modifier - Skill modifier
     * @returns {string} Formatted modifier string
     */
    formatModifier(modifier) {
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    /**
     * Get skill description with enhanced information
     * @param {string} skillName - Skill name
     * @returns {Object|null} Enhanced skill information
     */
    async getSkillInfo(skillName) {
        const skill = await this.getSkill(skillName);
        if (!skill) return null;
        
        return {
            ...skill,
            attributeShort: this.getAttributeShort(skill.stat),
            category: this.getSkillCategory(skillName),
            isDCCUnique: skill.source === 'dcc'
        };
    }

    /**
     * Get short attribute name
     * @param {string} attribute - Full attribute name
     * @returns {string} Short attribute name
     */
    getAttributeShort(attribute) {
        const shortMap = {
            'strength': 'STR',
            'dexterity': 'DEX',
            'constitution': 'CON',
            'intelligence': 'INT',
            'wisdom': 'WIS',
            'charisma': 'CHA'
        };
        return shortMap[attribute] || attribute.toUpperCase();
    }

    /**
     * Get skill category name
     * @param {string} skillName - Skill name
     * @returns {string|null} Category name
     */
    getSkillCategory(skillName) {
        if (!this.skillsData || !this.skillsData.skills) return null;
        
        for (const [categoryKey, categoryData] of Object.entries(this.skillsData.skills)) {
            if (categoryData.skills && categoryData.skills[skillName]) {
                return categoryData.category;
            }
        }
        return null;
    }
}

// Export for use in other modules
window.SkillsManager = SkillsManager;
