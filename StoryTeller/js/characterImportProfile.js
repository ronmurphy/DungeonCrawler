/**
 * Character Import Profile System
 * Handles importing characters from various sources and formats
 * Supports V4-network exports, legacy formats, and multi-character files
 */

class CharacterImportProfile {
    constructor() {
        this.supportedFormats = ['.dcw', '.json'];
        this.fieldMappings = this.initializeFieldMappings();
        this.defaultCharacterStructure = this.initializeDefaultStructure();
    }

    /**
     * Initialize field mappings for different character formats
     */
    initializeFieldMappings() {
        return {
            // Core identity fields
            identity: ['name', 'level', 'id'],
            
            // Stats and attributes
            stats: ['stats', 'statMaximums', 'availablePoints'],
            vitals: ['healthPoints', 'currentHealthPoints', 'magicPoints', 'currentMagicPoints'],
            
            // Character background
            background: ['race', 'customRace', 'job', 'customJob', 'class', 'customClass'],
            bonuses: ['raceBonuses', 'jobBonuses', 'classBonuses'],
            customData: ['customRaceData', 'customJobData', 'customClassData'],
            
            // Skills and abilities
            skills: ['customSkills', 'skillLevels'],
            
            // Personal information
            personal: ['personal', 'notes'],
            
            // Game mechanics
            mechanics: ['rollHistory', 'spells', 'inventory', 'equipment', 'statusEffects'],
            
            // Achievements and progression
            progression: ['achievements', 'specialEffects'],
            
            // Metadata
            metadata: ['lastModified', 'id', 'exportDate', 'exportSource']
        };
    }

    /**
     * Initialize default character structure based on V4-network format
     */
    initializeDefaultStructure() {
        return {
            // Basic identity
            name: '',
            level: 1,
            id: null, // Will be generated if missing
            availablePoints: 3,
            
            // Stats
            stats: {
                strength: 2, dexterity: 2, constitution: 2,
                intelligence: 2, wisdom: 2, charisma: 2
            },
            statMaximums: {
                strength: 15, dexterity: 15, constitution: 15,
                intelligence: 15, wisdom: 15, charisma: 15
            },
            
            // Vitals
            healthPoints: 3,
            currentHealthPoints: 3,
            magicPoints: 4,
            currentMagicPoints: 4,
            
            // Skills
            customSkills: [],
            skillLevels: {},
            
            // Personal information
            personal: {
                age: '',
                backstory: '',
                avatarUrl: null,
                portrait: null // Legacy base64 support
            },
            
            // Character background
            race: '',
            customRace: '',
            raceBonuses: [],
            customRaceData: {
                selectedStats: [],
                skills: [],
                maximums: {}
            },
            
            job: '',
            customJob: '',
            jobBonuses: [],
            customJobData: {
                selectedStats: [],
                skills: []
            },
            
            class: '',
            customClass: '',
            classBonuses: [],
            customClassData: {
                selectedStats: [],
                skills: []
            },
            
            // Game mechanics
            rollHistory: [],
            spells: [],
            inventory: [],
            equipment: {
                mainHand: null,
                offHand: null,
                armor: null,
                accessory: null
            },
            statusEffects: [],
            
            // Notes
            notes: {
                personal: '',
                party: '',
                session: '',
                barter: '',
                world: '',
                combat: ''
            },
            
            // Progression (newer features)
            achievements: [],
            specialEffects: [],
            
            // Metadata
            lastModified: null,
            exportDate: null,
            exportSource: null
        };
    }

    /**
     * Parse and import character data from various formats
     * @param {string} jsonString - JSON string to parse
     * @param {string} filename - Original filename for context
     * @returns {Array} Array of normalized character objects
     */
    parseCharacterData(jsonString, filename = 'unknown') {
        try {
            const data = JSON.parse(jsonString);
            console.log('📥 Parsing character data from:', filename);
            
            // Determine data format and extract characters
            const characters = this.extractCharacters(data, filename);
            
            // Normalize each character
            const normalizedCharacters = characters.map(char => 
                this.normalizeCharacter(char, filename)
            );
            
            console.log(`✅ Successfully parsed ${normalizedCharacters.length} character(s)`);
            return normalizedCharacters;
            
        } catch (error) {
            console.error('❌ Failed to parse character data:', error);
            throw new Error(`Invalid character data format: ${error.message}`);
        }
    }

    /**
     * Extract character objects from various file formats
     * @param {Object} data - Parsed JSON data
     * @param {string} filename - Source filename
     * @returns {Array} Array of raw character objects
     */
    extractCharacters(data, filename) {
        // Multi-character export (V4-network all characters backup)
        if (data.characters && Array.isArray(data.characters)) {
            console.log(`📦 Multi-character export detected: ${data.characters.length} characters`);
            return data.characters;
        }
        
        // Single character export
        if (data.name || data.level || data.stats) {
            console.log('👤 Single character export detected');
            return [data];
        }
        
        // Legacy format detection
        if (data.exportDate && data.characterCount) {
            console.log('🗃️ Legacy export format detected');
            return data.characters || [];
        }
        
        // Unknown format - try to treat as single character
        console.warn('⚠️ Unknown format, attempting single character import');
        return [data];
    }

    /**
     * Normalize character data to standard format
     * @param {Object} rawCharacter - Raw character data
     * @param {string} source - Source identifier
     * @returns {Object} Normalized character object
     */
    normalizeCharacter(rawCharacter, source = 'unknown') {
        const normalized = { ...this.defaultCharacterStructure };
        
        // Generate ID if missing
        if (!rawCharacter.id && !rawCharacter.name) {
            console.warn('⚠️ Character missing both ID and name, generating defaults');
        }
        
        const characterId = rawCharacter.id || 
                           (rawCharacter.name ? `char_${rawCharacter.name}_imported` : 
                            `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        
        // Copy all available fields
        Object.keys(rawCharacter).forEach(key => {
            if (key in normalized) {
                if (typeof normalized[key] === 'object' && normalized[key] !== null && !Array.isArray(normalized[key])) {
                    // Deep merge for objects
                    normalized[key] = { ...normalized[key], ...rawCharacter[key] };
                } else {
                    // Direct copy for primitives and arrays
                    normalized[key] = rawCharacter[key];
                }
            }
        });

        // Set metadata
        normalized.id = characterId;
        normalized.lastModified = rawCharacter.lastModified || new Date().toISOString();
        normalized.exportSource = source;
        
        // Handle avatar migration
        normalized.personal = this.normalizePersonalData(rawCharacter.personal || {});
        
        // Validate and fix common issues
        this.validateAndRepair(normalized);
        
        console.log(`✨ Normalized character: ${normalized.name} (Level ${normalized.level})`);
        return normalized;
    }

    /**
     * Normalize personal data including avatar handling
     * @param {Object} personalData - Raw personal data
     * @returns {Object} Normalized personal data
     */
    normalizePersonalData(personalData) {
        const normalized = {
            age: personalData.age || '',
            backstory: personalData.backstory || '',
            avatarUrl: null,
            portrait: null
        };

        // Handle different avatar formats
        if (personalData.avatarUrl) {
            // New URL-based system
            normalized.avatarUrl = personalData.avatarUrl;
        } else if (personalData.portrait) {
            // Legacy base64 system - keep for migration
            normalized.portrait = personalData.portrait;
            // Note: Could trigger avatar migration here if needed
        }

        return normalized;
    }

    /**
     * Validate and repair common character data issues
     * @param {Object} character - Character to validate
     */
    validateAndRepair(character) {
        // Ensure name exists
        if (!character.name || character.name.trim() === '') {
            character.name = 'Imported Character';
        }

        // Ensure level is valid
        if (!character.level || character.level < 1) {
            character.level = 1;
        }

        // Ensure stats are valid
        Object.keys(character.stats).forEach(stat => {
            if (typeof character.stats[stat] !== 'number' || character.stats[stat] < 0) {
                character.stats[stat] = 2; // Default minimum
            }
        });

        // Ensure arrays exist
        const arrayFields = ['customSkills', 'rollHistory', 'spells', 'inventory', 'statusEffects', 'achievements', 'specialEffects'];
        arrayFields.forEach(field => {
            if (!Array.isArray(character[field])) {
                character[field] = [];
            }
        });

        // Ensure objects exist
        const objectFields = ['equipment', 'notes', 'skillLevels'];
        objectFields.forEach(field => {
            if (typeof character[field] !== 'object' || character[field] === null) {
                character[field] = this.defaultCharacterStructure[field];
            }
        });

        // Fix achievements format inconsistencies
        if (Array.isArray(character.achievements)) {
            character.achievements = character.achievements.map(achievement => {
                if (typeof achievement === 'string') {
                    // Convert string achievements to objects
                    return {
                        id: achievement.toLowerCase().replace(/\s+/g, '_'),
                        name: achievement,
                        description: 'Legacy achievement',
                        effect: '',
                        rarity: 'common',
                        category: 'unknown',
                        dateEarned: character.lastModified || new Date().toISOString()
                    };
                }
                return achievement;
            });
        }
    }

    /**
     * Get import statistics for a set of characters
     * @param {Array} characters - Normalized characters
     * @returns {Object} Import statistics
     */
    getImportStatistics(characters) {
        const stats = {
            total: characters.length,
            byLevel: {},
            byRace: {},
            byClass: {},
            withAchievements: 0,
            withAvatars: 0,
            avgLevel: 0
        };

        characters.forEach(char => {
            // Level distribution
            stats.byLevel[char.level] = (stats.byLevel[char.level] || 0) + 1;
            
            // Race distribution
            const race = char.race || 'unknown';
            stats.byRace[race] = (stats.byRace[race] || 0) + 1;
            
            // Class distribution
            const charClass = char.class || 'unknown';
            stats.byClass[charClass] = (stats.byClass[charClass] || 0) + 1;
            
            // Achievement count
            if (Array.isArray(char.achievements) && char.achievements.length > 0) {
                stats.withAchievements++;
            }
            
            // Avatar count
            if (char.personal?.avatarUrl || char.personal?.portrait) {
                stats.withAvatars++;
            }
        });

        // Calculate average level
        if (stats.total > 0) {
            stats.avgLevel = Math.round(
                characters.reduce((sum, char) => sum + char.level, 0) / stats.total * 10
            ) / 10;
        }

        return stats;
    }

    /**
     * Validate file format before processing
     * @param {File} file - File object to validate
     * @returns {boolean} Whether file is supported
     */
    validateFileFormat(file) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    /**
     * Generate import summary for user display
     * @param {Array} characters - Imported characters
     * @param {Object} stats - Import statistics
     * @returns {string} Human-readable summary
     */
    generateImportSummary(characters, stats) {
        let summary = `Successfully imported ${stats.total} character(s):\n\n`;
        
        characters.forEach((char, index) => {
            const achievementCount = Array.isArray(char.achievements) ? char.achievements.length : 0;
            const hasAvatar = char.personal?.avatarUrl || char.personal?.portrait ? '🖼️' : '';
            const achievementBadge = achievementCount > 0 ? `🏆${achievementCount}` : '';
            
            summary += `${index + 1}. ${char.name} (Level ${char.level}) ${hasAvatar} ${achievementBadge}\n`;
            summary += `   ${char.race} ${char.job} ${char.class}\n\n`;
        });
        
        if (stats.withAchievements > 0) {
            summary += `🏆 ${stats.withAchievements} characters have achievements\n`;
        }
        
        if (stats.withAvatars > 0) {
            summary += `🖼️ ${stats.withAvatars} characters have custom avatars\n`;
        }
        
        summary += `📊 Average level: ${stats.avgLevel}`;
        
        return summary;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CharacterImportProfile = CharacterImportProfile;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterImportProfile;
}
