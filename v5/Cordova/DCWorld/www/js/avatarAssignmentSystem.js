/**
 * Avatar Assignment System
 * Automatically assigns avatars based on character heritage/race
 */

class AvatarAssignmentSystem {
    constructor() {
        // Map heritage/race names to avatar filenames (prefer smooth versions)
        this.avatarMap = {
            // Dungeon Crawler heritages
            'bopca': 'race_bopca',
            'skyfowl': 'race_skyfowl',
            'rat_kin': 'race_ratkin', // rat_kin maps to ratkin filename
            'hellspawn_familiar': 'race_hellspawn', // hellspawn_familiar maps to hellspawn
            'primal': 'race_primal',
            'were_creature': 'race_werecreature', // were_creature maps to werecreature
            
            // Classic Fantasy heritages
            'human': 'race_human',
            'elf': 'race_elf',
            'dwarf': 'race_dwarf',
            'orc': 'race_orc',
            'halfling': 'race_halfling',
            'dragonborn': 'race_dragonborn',
            'tiefling': 'race_tiefling',
            'gnome': 'race_gnome',
            'goblin': 'race_goblin', // Missing avatar - will fallback to placeholder
            'slime': 'race_slime', // Missing avatar - will fallback to placeholder
            
            // Sci-Fi heritages (all missing avatars - will fallback to placeholder)
            'cyborg': 'race_cyborg',
            'mutant': 'race_mutant',
            'android': 'race_android',
            'clone': 'race_clone',
            
            // Post-Apocalyptic heritages (all missing avatars - will fallback to placeholder)
            'ghoul': 'race_ghoul',
            'raider': 'race_raider',
            'vault_dweller': 'race_vault_dweller',
            'synth': 'race_synth',
            'beast_kin': 'race_beast_kin',
            'plant_hybrid': 'race_plant_hybrid',
            
            // Additional mappings for consistency
            'ratkin': 'race_ratkin', // Alternative spelling
            'werecreature': 'race_werecreature', // Alternative spelling
            'hellspawn': 'race_hellspawn' // Alternative spelling
        };
        
        // Track which avatars have smooth versions available
        this.smoothVersions = [
            'race_bopca', 'race_dragonborn', 'race_dwarf', 'race_elf', 'race_gnome',
            'race_halfling', 'race_hellspawn', 'race_human', 'race_orc', 'race_primal',
            'race_ratkin', 'race_tiefling', 'race_werecreature', 'race_skyfowl',
            'race_cyborg', 'race_slime', 'race_goblin'
            // Note: Missing avatars (goblin, slime, sci-fi, post-apocalyptic) are not listed here
            // so they will trigger the fallback to placeholder
        ];
        
        // Track which avatars only have regular versions (no smooth)
        // this.regularOnlyVersions = [
        //     'race_skyfowl' // only has .png, no _smooth version
        // ];
        
        this.preferSmooth = true; // Prefer smooth versions by default
        this.baseAvatarPath = 'assets/avatars/';
    }

        /**
     * Get avatar filename for a heritage
     * @param {string} heritage - The heritage name
     * @param {boolean} forceSmooth - Force smooth version (null = use preference)
     * @returns {string|null} Avatar filename or null if not found
     */
    getAvatarForHeritage(heritage, forceSmooth = null) {
        const normalizedHeritage = heritage.toLowerCase().trim();
        
        if (!this.avatarMap[normalizedHeritage]) {
            console.warn(`🚫 No avatar mapping found for heritage: ${heritage}`);
            return null;
        }
        
        const baseFilename = this.avatarMap[normalizedHeritage];
        const useSmooth = forceSmooth !== null ? forceSmooth : this.preferSmooth;
        
        // Check if smooth version is available and preferred
        if (useSmooth && this.smoothVersions.includes(baseFilename)) {
            return `${baseFilename}_smooth.png`;
        }
        
        // Check if this avatar only has regular version
        if (this.regularOnlyVersions.includes(baseFilename)) {
            return `${baseFilename}.png`;
        }
        
        // Check if this is a heritage with available files
        if (this.smoothVersions.includes(baseFilename) || this.regularOnlyVersions.includes(baseFilename)) {
            // For avatars with both versions, use regular with (1) suffix if needed
            const needsSuffix = this.needsNumberSuffix(baseFilename);
            return needsSuffix ? `${baseFilename}(1).png` : `${baseFilename}.png`;
        }
        
        // Avatar mapping exists but no files available - return null for placeholder fallback
        console.log(`ℹ️ Avatar files not available for ${heritage} (${baseFilename}), will use placeholder`);
        return null;
    }

    /**
     * Check if a race needs the (1) suffix for non-smooth version
     * @param {string} baseFilename - Base filename without extension
     * @returns {boolean}
     */
    needsNumberSuffix(baseFilename) {
        // These races have (1) suffix in their non-smooth versions
        const racesWithSuffix = [
            'race_bopca', 'race_dragonborn', 'race_dwarf', 'race_gnome', 
            'race_halfling', 'race_hellspawn', 'race_human', 'race_orc', 
            'race_primal', 'race_tiefling', 'race_werecreature'
        ];
        
        return racesWithSuffix.includes(baseFilename);
    }

    /**
     * Get full avatar path for a heritage
     * @param {string} heritage - The heritage/race name
     * @param {boolean} forceSmooth - Force smooth version
     * @returns {string|null} - Full path to avatar or null
     */
    getAvatarPath(heritage, forceSmooth = null) {
        const filename = this.getAvatarForHeritage(heritage, forceSmooth);
        if (!filename) return null;
        
        return `${this.avatarBasePath}${filename}`;
    }

    /**
     * Auto-assign avatar for character if none exists
     * @param {Object} characterData - Character data object
     * @returns {Object} - Updated character data with avatar if assigned
     */
    autoAssignAvatar(characterData) {
        // Don't override existing avatar
        if (characterData.avatar && characterData.avatar.trim() !== '') {
            console.log(`🎭 Character already has avatar: ${characterData.avatar}`);
            return characterData;
        }

        // Get heritage from character data
        const heritage = characterData.race || characterData.customRace || characterData.heritage;
        if (!heritage) {
            console.log('⚠️ No heritage found for character, cannot auto-assign avatar');
            return characterData;
        }

        const avatarPath = this.getAvatarPath(heritage);
        if (avatarPath) {
            characterData.avatar = avatarPath;
            console.log(`✅ Auto-assigned avatar for ${heritage}: ${avatarPath}`);
        } else {
            console.log(`❌ Could not find avatar for heritage: ${heritage}`);
        }

        return characterData;
    }

    /**
     * Check if avatar file exists (for validation)
     * @param {string} heritage - Heritage name
     * @param {boolean} forceSmooth - Force smooth version
     * @returns {Promise<boolean>} - True if avatar exists
     */
    async avatarExists(heritage, forceSmooth = null) {
        const avatarPath = this.getAvatarPath(heritage, forceSmooth);
        if (!avatarPath) return false;

        try {
            const response = await fetch(avatarPath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.log(`❌ Avatar not found: ${avatarPath}`);
            return false;
        }
    }

    /**
     * Get available heritage options with avatars
     * @returns {Array} - Array of heritage names that have avatars
     */
    getAvailableHeritages() {
        return Object.keys(this.avatarMap);
    }

    /**
     * Set avatar preference (smooth vs regular)
     * @param {boolean} preferSmooth - True for smooth avatars
     */
    setAvatarPreference(preferSmooth) {
        this.preferSmooth = preferSmooth;
        console.log(`🎨 Avatar preference set to: ${preferSmooth ? 'smooth' : 'regular'}`);
    }

    /**
     * Get all available heritage mappings
     * @returns {Object} Object with heritage keys and their avatar filenames
     */
    getHeritageMappings() {
        return { ...this.avatarMap };
    }

    /**
     * Get list of supported heritage names
     * @returns {Array} Array of heritage names
     */
    getSupportedHeritages() {
        return Object.keys(this.avatarMap);
    }
}

// Initialize global avatar system
window.avatarAssignmentSystem = new AvatarAssignmentSystem();

console.log('🎭 Avatar Assignment System initialized with', 
    window.avatarAssignmentSystem.getSupportedHeritages().length, 'heritage mappings');
