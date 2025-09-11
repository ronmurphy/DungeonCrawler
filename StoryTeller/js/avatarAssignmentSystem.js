/**
 * Avatar Assignment System
 * Automatically assigns avatars based on character heritage/race
 */

class AvatarAssignmentSystem {
    constructor() {
        // Map heritage/race names to avatar filenames
        this.avatarMap = {
            'bopca': 'race_bopca',
            'dragonborn': 'race_dragonborn', 
            'dwarf': 'race_dwarf',
            'elf': 'race_elf',
            'gnome': 'race_gnome',
            'halfling': 'race_halfling',
            'hellspawn': 'race_hellspawn',
            'human': 'race_human',
            'orc': 'race_orc',
            'primal': 'race_primal',
            'ratkin': 'race_ratkin',
            'skyfowl': 'race_skyfowl',
            'tiefling': 'race_tiefling',
            'werecreature': 'race_werecreature'
        };
        
        this.preferSmooth = true; // Prefer smooth versions by default
        this.avatarBasePath = './assets/avatars/';
    }

    /**
     * Get avatar filename for a heritage/race
     * @param {string} heritage - The heritage/race name
     * @param {boolean} forceSmooth - Force smooth version (default: use preference)
     * @returns {string|null} - Avatar filename or null if not found
     */
    getAvatarForHeritage(heritage, forceSmooth = null) {
        if (!heritage) return null;
        
        // Normalize heritage name (lowercase, trim)
        const normalizedHeritage = heritage.toLowerCase().trim();
        
        // Check if we have a mapping for this heritage
        if (!this.avatarMap[normalizedHeritage]) {
            console.log(`⚠️ No avatar mapping found for heritage: ${heritage}`);
            return null;
        }
        
        const baseFilename = this.avatarMap[normalizedHeritage];
        const useSmooth = forceSmooth !== null ? forceSmooth : this.preferSmooth;
        
        // Build filename with extension preference
        let filename;
        if (useSmooth) {
            filename = `${baseFilename}_smooth.png`;
        } else {
            // Check if we need (1) suffix for non-smooth versions
            const needsSuffix = this.needsNumberSuffix(baseFilename);
            filename = needsSuffix ? `${baseFilename}(1).png` : `${baseFilename}.png`;
        }
        
        return filename;
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
