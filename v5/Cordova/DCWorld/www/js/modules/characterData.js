/**
 * Character Data Module
 * Contains DCC character races, classes, jobs, skills, and bonus calculations
 * Now uses JSON data loader for easier management
 */

class CharacterData {
    constructor() {
        this.jsonLoader = new JSONDataLoader();
        this.dataLoaded = false;
        
        this.standardSkills = {
            'Acrobatics': 'dexterity',
            'Animal Handling': 'wisdom',
            'Arcana': 'intelligence',
            'Athletics': 'strength',
            'Deception': 'charisma',
            'History': 'intelligence',
            'Insight': 'wisdom',
            'Intimidation': 'charisma',
            'Investigation': 'intelligence',
            'Medicine': 'wisdom',
            'Nature': 'intelligence',
            'Perception': 'wisdom',
            'Performance': 'charisma',
            'Persuasion': 'charisma',
            'Religion': 'intelligence',
            'Sleight of Hand': 'dexterity',
            'Stealth': 'dexterity',
            'Survival': 'wisdom',
            
            // DCC-Specific Skills
            'Powerful Strike': 'strength',
            'Iron Punch': 'strength',
            'Pugilism': 'strength',
            'Aiming': 'dexterity',
            'Cat-like Reflexes': 'dexterity',
            'Light on Your Feet': 'dexterity',
            'Iron Stomach': 'constitution',
            'Regeneration': 'constitution',
            'Nine Lives': 'constitution',
            'Night Vision': 'wisdom',
            'Character Actor': 'charisma',
            'Negotiation': 'charisma',
            'Crowd Blast': 'charisma',
            'Basic Electrical Repair': 'intelligence',
            'IED': 'intelligence',
            'Bomb Surgeon': 'intelligence',
            'Alien Technology': 'intelligence',
            'Diplomatic Immunity': 'charisma',
            'Flight': 'dexterity',
            'Scavenging': 'wisdom',
            'Shape Shifting': 'constitution',
            'Enhanced Senses': 'wisdom'
        };

        // Initialize JSON data loading
        this.initializeData();
    }

    /**
     * Initialize data loading from JSON files
     */
    async initializeData() {
        try {
            await this.jsonLoader.loadAllData();
            this.dataLoaded = true;
            console.log('✅ Character data loaded from JSON files');
        } catch (error) {
            console.error('❌ Failed to load character data from JSON:', error);
            console.log('🔄 Falling back to embedded data...');
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

    /**
     * Get skill governing attribute
     * @param {string} skillName - Name of the skill
     * @returns {string} Governing attribute name
     */
    getSkillAttribute(skillName) {
        return this.standardSkills[skillName] || 'intelligence';
    }

    /**
     * Check if a skill is a standard DCC skill
     * @param {string} skillName - Name of the skill
     * @returns {boolean} True if standard skill
     */
    isStandardSkill(skillName) {
        return skillName in this.standardSkills;
    }

    /**
     * Get race data by key
     * @param {string} raceKey - Race identifier
     * @returns {Object|null} Race data or null
     */
    async getRace(raceKey) {
        await this._ensureDataLoaded();
        return this.jsonLoader.getRace(raceKey);
    }

    /**
     * Get class data by key
     * @param {string} classKey - Class identifier
     * @returns {Object|null} Class data or null
     */
    async getClass(classKey) {
        await this._ensureDataLoaded();
        return this.jsonLoader.getClass(classKey);
    }

    /**
     * Get job data by key
     * @param {string} jobKey - Job identifier
     * @returns {Object|null} Job data or null
     */
    async getJob(jobKey) {
        await this._ensureDataLoaded();
        return this.jsonLoader.getJob(jobKey);
    }

    /**
     * Get all available races as array
     * @returns {Array} Array of race objects with names
     */
    async getRaces() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getRacesArray();
    }

    /**
     * Get all available classes as array
     * @returns {Array} Array of class objects with names
     */
    async getClasses() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getClassesArray();
    }

    /**
     * Get all available jobs as array
     * @returns {Array} Array of job objects with names
     */
    async getJobs() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getJobsArray();
    }

    /**
     * Get all available races as object
     * @returns {Object} All race data
     */
    async getAllRaces() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getRaces();
    }

    /**
     * Get all available classes as object
     * @returns {Object} All class data
     */
    async getAllClasses() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getClasses();
    }

    /**
     * Get all available jobs as object
     * @returns {Object} All job data
     */
    async getAllJobs() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getJobs();
    }

    /**
     * Get skill data by name
     * @param {string} skillName - Skill name
     * @returns {Object|null} Skill data or null
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
    async getSkills() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkillsArray();
    }

    /**
     * Get all skills as flat object
     * @returns {Object} All skills keyed by name
     */
    async getAllSkills() {
        await this._ensureDataLoaded();
        return this.jsonLoader.getSkillsFlat();
    }

    /**
     * Get all standard skills
     * @returns {Object} All standard skills with governing attributes
     */
    getAllStandardSkills() {
        return this.standardSkills;
    }

    /**
     * Convert attribute short names to full names
     * @param {string} shortName - Short attribute name (str, dex, etc.)
     * @returns {string} Full attribute name
     */
    getFullAttributeName(shortName) {
        const attributeMap = {
            'str': 'strength',
            'dex': 'dexterity', 
            'con': 'constitution',
            'int': 'intelligence',
            'wis': 'wisdom',
            'cha': 'charisma'
        };
        return attributeMap[shortName] || shortName;
    }

    /**
     * Get short attribute name from full name
     * @param {string} fullName - Full attribute name
     * @returns {string} Short attribute name
     */
    getShortAttributeName(fullName) {
        const reverseMap = {
            'strength': 'str',
            'dexterity': 'dex',
            'constitution': 'con',
            'intelligence': 'int',
            'wisdom': 'wis',
            'charisma': 'cha'
        };
        return reverseMap[fullName] || fullName;
    }

    /**
     * Validate attribute name
     * @param {string} attributeName - Attribute name to validate
     * @returns {boolean} True if valid attribute
     */
    isValidAttribute(attributeName) {
        const validAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'str', 'dex', 'con', 'int', 'wis', 'cha'];
        return validAttributes.includes(attributeName.toLowerCase());
    }

    /**
     * Get achievements by category
     * @param {string} category - Achievement category
     * @returns {Array} Array of achievements
     */
    async getAchievements(category = null) {
        await this._ensureDataLoaded();
        if (category) {
            return this.jsonLoader.getAchievementsByCategory(category);
        }
        return this.jsonLoader.getAchievements();
    }

    /**
     * Search for character data
     * @param {string} searchTerm - Search term
     * @param {string} dataType - Type of data ('races', 'classes', 'jobs')
     * @returns {Array} Array of matching items
     */
    async search(searchTerm, dataType) {
        await this._ensureDataLoaded();
        return this.jsonLoader.search(searchTerm, dataType);
    }

    /**
     * Get data loading status
     * @returns {Object} Loading status information
     */
    getLoadingStatus() {
        return this.jsonLoader.getLoadingStatus();
    }
}

// Export for use in other modules
window.CharacterData = CharacterData;
