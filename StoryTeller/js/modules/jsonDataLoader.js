/**
 * JSON Data Loader Module
 * Loads character data from JSON files for easier management and expansion
 */

class JSONDataLoader {
    constructor() {
        this.dataCache = {
            races: null,
            classes: null,
            jobs: null,
            achievements: null,
            skills: null
        };
        
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * Load all JSON data files
     * @returns {Promise<boolean>} True if all files loaded successfully
     */
    async loadAllData() {
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this._loadAllDataInternal();
        
        try {
            const result = await this.loadPromise;
            this.isLoading = false;
            return result;
        } catch (error) {
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Internal method to load all data
     * @private
     */
    async _loadAllDataInternal() {
        try {
            console.log('🔄 Loading DCC JSON data files...');
            
            const loadPromises = [
                this.loadRaces(),
                this.loadClasses(),
                this.loadJobs(),
                this.loadAchievements(),
                this.loadSkills()
            ];

            const results = await Promise.allSettled(loadPromises);
            
            let successCount = 0;
            results.forEach((result, index) => {
                const fileNames = ['races', 'classes', 'jobs', 'achievements', 'skills'];
                if (result.status === 'fulfilled') {
                    successCount++;
                    console.log(`✅ ${fileNames[index]}.json loaded successfully`);
                } else {
                    console.error(`❌ Failed to load ${fileNames[index]}.json:`, result.reason);
                }
            });

            const allLoaded = successCount === results.length;
            console.log(`📊 Data loading complete: ${successCount}/${results.length} files loaded`);
            
            return allLoaded;
        } catch (error) {
            console.error('💥 Critical error loading JSON data:', error);
            return false;
        }
    }

    /**
     * Load races data from JSON
     * @returns {Promise<Object>} Races data
     */
    async loadRaces() {
        try {
            const response = await fetch('data/races.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            this.dataCache.races = this._flattenCategorizedData(data);
            return this.dataCache.races;
        } catch (error) {
            console.error('Failed to load races.json:', error);
            throw error;
        }
    }

    /**
     * Load classes data from JSON
     * @returns {Promise<Object>} Classes data
     */
    async loadClasses() {
        try {
            const response = await fetch('data/classes.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            this.dataCache.classes = this._flattenCategorizedData(data);
            return this.dataCache.classes;
        } catch (error) {
            console.error('Failed to load classes.json:', error);
            throw error;
        }
    }

    /**
     * Load jobs data from JSON
     * @returns {Promise<Object>} Jobs data
     */
    async loadJobs() {
        try {
            const response = await fetch('data/jobs.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            this.dataCache.jobs = this._flattenCategorizedData(data);
            return this.dataCache.jobs;
        } catch (error) {
            console.error('Failed to load jobs.json:', error);
            throw error;
        }
    }

    /**
     * Load achievements data from JSON
     * @returns {Promise<Object>} Achievements data
     */
    async loadAchievements() {
        try {
            const response = await fetch('data/achievements.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            this.dataCache.achievements = data;
            return this.dataCache.achievements;
        } catch (error) {
            console.error('Failed to load achievements.json:', error);
            throw error;
        }
    }

    /**
     * Load skills data from JSON
     * @returns {Promise<Object>} Skills data
     */
    async loadSkills() {
        try {
            const response = await fetch('data/skills.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            this.dataCache.skills = data;
            return this.dataCache.skills;
        } catch (error) {
            console.error('Failed to load skills.json:', error);
            throw error;
        }
    }

    /**
     * Flatten categorized data into key-value pairs
     * @param {Object} categorizedData - Data organized by categories
     * @returns {Object} Flattened data with keys
     * @private
     */
    _flattenCategorizedData(categorizedData) {
        const flattened = {};
        
        Object.values(categorizedData).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(item => {
                    flattened[item.id] = item;
                });
            }
        });
        
        return flattened;
    }

    /**
     * Get races data
     * @returns {Object|null} Races data
     */
    getRaces() {
        return this.dataCache.races;
    }

    /**
     * Get classes data
     * @returns {Object|null} Classes data
     */
    getClasses() {
        return this.dataCache.classes;
    }

    /**
     * Get jobs data
     * @returns {Object|null} Jobs data
     */
    getJobs() {
        return this.dataCache.jobs;
    }

    /**
     * Get achievements data
     * @returns {Object|null} Achievements data
     */
    getAchievements() {
        return this.dataCache.achievements;
    }

    /**
     * Get specific race by ID
     * @param {string} raceId - Race identifier
     * @returns {Object|null} Race data
     */
    getRace(raceId) {
        return this.dataCache.races ? this.dataCache.races[raceId] : null;
    }

    /**
     * Get specific class by ID
     * @param {string} classId - Class identifier
     * @returns {Object|null} Class data
     */
    getClass(classId) {
        return this.dataCache.classes ? this.dataCache.classes[classId] : null;
    }

    /**
     * Get specific job by ID
     * @param {string} jobId - Job identifier
     * @returns {Object|null} Job data
     */
    getJob(jobId) {
        return this.dataCache.jobs ? this.dataCache.jobs[jobId] : null;
    }

    /**
     * Get races as array for display
     * @returns {Array} Array of race objects
     */
    getRacesArray() {
        return this.dataCache.races ? Object.values(this.dataCache.races) : [];
    }

    /**
     * Get classes as array for display
     * @returns {Array} Array of class objects
     */
    getClassesArray() {
        return this.dataCache.classes ? Object.values(this.dataCache.classes) : [];
    }

    /**
     * Get jobs as array for display
     * @returns {Array} Array of job objects
     */
    getJobsArray() {
        return this.dataCache.jobs ? Object.values(this.dataCache.jobs) : [];
    }

    /**
     * Get skills data
     * @returns {Object|null} Skills data
     */
    getSkills() {
        return this.dataCache.skills;
    }

    /**
     * Get skill by name
     * @param {string} skillName - Name of the skill
     * @returns {Object|null} Skill data or null
     */
    getSkill(skillName) {
        if (!this.dataCache.skills) return null;
        
        // Search through all skill categories
        for (const category of Object.values(this.dataCache.skills.skills)) {
            if (category.skills && category.skills[skillName]) {
                return category.skills[skillName];
            }
        }
        return null;
    }

    /**
     * Get skills by category
     * @param {string} categoryKey - Category key (combat, survival, technical, etc.)
     * @returns {Object|null} Skills in category
     */
    getSkillsByCategory(categoryKey) {
        return this.dataCache.skills && this.dataCache.skills.skills[categoryKey] 
            ? this.dataCache.skills.skills[categoryKey].skills 
            : null;
    }

    /**
     * Get all skills as flat array
     * @returns {Array} Array of all skills
     */
    getSkillsArray() {
        if (!this.dataCache.skills) return [];
        
        const allSkills = [];
        Object.values(this.dataCache.skills.skills).forEach(category => {
            if (category.skills) {
                Object.values(category.skills).forEach(skill => {
                    allSkills.push(skill);
                });
            }
        });
        return allSkills;
    }

    /**
     * Get all skills as flat object (for compatibility)
     * @returns {Object} All skills keyed by name
     */
    getSkillsFlat() {
        if (!this.dataCache.skills) return {};
        
        const flatSkills = {};
        Object.values(this.dataCache.skills.skills).forEach(category => {
            if (category.skills) {
                Object.assign(flatSkills, category.skills);
            }
        });
        return flatSkills;
    }

    /**
     * Get achievements by category
     * @param {string} category - Achievement category
     * @returns {Array} Array of achievements in category
     */
    getAchievementsByCategory(category) {
        return this.dataCache.achievements && this.dataCache.achievements[category] 
            ? this.dataCache.achievements[category] 
            : [];
    }

    /**
     * Get all achievement categories
     * @returns {Array} Array of category names
     */
    getAchievementCategories() {
        return this.dataCache.achievements ? Object.keys(this.dataCache.achievements) : [];
    }

    /**
     * Search for items by name
     * @param {string} searchTerm - Search term
     * @param {string} dataType - Type of data to search ('races', 'classes', 'jobs')
     * @returns {Array} Array of matching items
     */
    search(searchTerm, dataType) {
        const data = this.dataCache[dataType];
        if (!data || !searchTerm) return [];
        
        const term = searchTerm.toLowerCase();
        return Object.values(data).filter(item => 
            item.name.toLowerCase().includes(term) ||
            (item.description && item.description.toLowerCase().includes(term))
        );
    }

    /**
     * Get data loading status
     * @returns {Object} Status information
     */
    getLoadingStatus() {
        return {
            isLoading: this.isLoading,
            racesLoaded: this.dataCache.races !== null,
            classesLoaded: this.dataCache.classes !== null,
            jobsLoaded: this.dataCache.jobs !== null,
            achievementsLoaded: this.dataCache.achievements !== null,
            skillsLoaded: this.dataCache.skills !== null,
            allLoaded: this.dataCache.races !== null && 
                      this.dataCache.classes !== null && 
                      this.dataCache.jobs !== null && 
                      this.dataCache.achievements !== null &&
                      this.dataCache.skills !== null
        };
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.dataCache = {
            races: null,
            classes: null,
            jobs: null,
            achievements: null,
            skills: null
        };
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * Reload specific data type
     * @param {string} dataType - Type to reload ('races', 'classes', 'jobs', 'achievements', 'skills')
     * @returns {Promise<Object>} Reloaded data
     */
    async reloadData(dataType) {
        this.dataCache[dataType] = null;
        
        switch (dataType) {
            case 'races':
                return await this.loadRaces();
            case 'classes':
                return await this.loadClasses();
            case 'jobs':
                return await this.loadJobs();
            case 'achievements':
                return await this.loadAchievements();
            case 'skills':
                return await this.loadSkills();
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }
    }
}

// Export for use in other modules
window.JSONDataLoader = JSONDataLoader;
