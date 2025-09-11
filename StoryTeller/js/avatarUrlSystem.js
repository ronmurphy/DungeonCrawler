/**
 * Avatar URL System for StoryTeller
 * Integrates GitHub URL-based avatars with the existing avatar assignment system
 * Replaces base64 avatar loading with GitHub URLs for 95%+ file size reduction
 */

class AvatarUrlSystem {
    constructor() {
        this.avatarBaseUrl = 'https://raw.githubusercontent.com/ronmurphy/dcc-image-storage/main/avatars';
        this.fallbackAssignmentSystem = window.avatarAssignmentSystem;
        this.avatarsMapping = null;
        this.loadAvatarsMapping();
    }

    /**
     * Load avatars.json mapping file
     */
    async loadAvatarsMapping() {
        try {
            const response = await fetch('./assets/avatars.json');
            if (response.ok) {
                this.avatarsMapping = await response.json();
                console.log('✅ Avatar URL mapping loaded:', Object.keys(this.avatarsMapping.avatars || {}).length, 'heritage avatars');
            } else {
                console.warn('⚠️ Could not load avatars.json mapping, falling back to local avatar assignment');
            }
        } catch (error) {
            console.warn('⚠️ Error loading avatar mapping:', error.message);
        }
    }

    /**
     * Get avatar URL for a heritage/race
     * @param {string} heritage - The heritage/race name
     * @param {boolean} preferSmooth - Prefer smooth version if available
     * @returns {Promise<string|null>} - Avatar URL or null if not found
     */
    async getAvatarUrlForHeritage(heritage, preferSmooth = true) {
        if (!heritage || heritage === 'custom') {
            return null;
        }

        // Ensure mapping is loaded
        if (!this.avatarsMapping) {
            await this.loadAvatarsMapping();
        }

        if (!this.avatarsMapping || !this.avatarsMapping.avatars) {
            console.warn('⚠️ Avatar mapping not available, using fallback system');
            return await this.getFallbackAvatarPath(heritage, preferSmooth);
        }

        const normalizedHeritage = heritage.toLowerCase().trim();
        const heritageData = this.avatarsMapping.avatars[normalizedHeritage];

        if (!heritageData) {
            console.log(`ℹ️ No GitHub avatar URL available for ${heritage}, checking fallback`);
            return await this.getFallbackAvatarPath(heritage, preferSmooth);
        }

        // Choose avatar URL based on preference and availability
        let avatarUrl = null;

        if (preferSmooth && heritageData.smooth) {
            avatarUrl = heritageData.smooth;
        } else if (heritageData.fallback) {
            avatarUrl = heritageData.fallback;
        }

        if (avatarUrl) {
            console.log(`✅ GitHub avatar URL found for ${heritage}: ${avatarUrl.split('/').pop()}`);
            return avatarUrl;
        }

        console.log(`ℹ️ No suitable GitHub avatar for ${heritage}, using fallback system`);
        return await this.getFallbackAvatarPath(heritage, preferSmooth);
    }

    /**
     * Fallback to local avatar assignment system
     * @param {string} heritage - Heritage name
     * @param {boolean} preferSmooth - Prefer smooth version
     * @returns {string|null} - Local avatar path or null
     */
    async getFallbackAvatarPath(heritage, preferSmooth) {
        if (!this.fallbackAssignmentSystem) {
            return null;
        }

        const avatarPath = this.fallbackAssignmentSystem.getAvatarPath(heritage, preferSmooth);
        if (avatarPath) {
            console.log(`📁 Using local fallback avatar: ${avatarPath}`);
        }
        return avatarPath;
    }

    /**
     * Get character data with URL-based avatar instead of base64
     * @param {Object} characterData - Character data object
     * @returns {Promise<Object>} - Character data with avatar URL
     */
    async getCharacterDataWithAvatarUrl(characterData) {
        if (!characterData.race && !characterData.heritage) {
            return characterData;
        }

        const heritage = characterData.race || characterData.heritage;
        const avatarUrl = await this.getAvatarUrlForHeritage(heritage);
        
        if (avatarUrl) {
            // Create optimized character data
            const optimizedData = { ...characterData };
            
            // Replace base64 portrait with URL
            if (optimizedData.personal) {
                optimizedData.personal = { ...optimizedData.personal };
                optimizedData.personal.avatarUrl = avatarUrl;
                
                // Keep base64 as fallback if it exists, but mark it for removal in sync
                if (optimizedData.personal.portrait) {
                    optimizedData.personal.portraitBase64Fallback = optimizedData.personal.portrait;
                    delete optimizedData.personal.portrait; // Remove heavy base64 data
                }
            }
            
            console.log(`✅ Character data optimized with avatar URL: ${heritage}`);
            return optimizedData;
        }

        return characterData;
    }

    /**
     * Upload custom character avatar and get URL
     * @param {File} file - Image file
     * @param {string} characterName - Character name
     * @returns {Promise<string|null>} - Avatar URL or null
     */
    async uploadCustomAvatar(file, characterName) {
        if (!window.githubImageHost) {
            console.error('❌ GitHub Image Host not available for custom avatar upload');
            return null;
        }

        try {
            const result = await window.githubImageHost.uploadCharacterAvatar(file, characterName);
            console.log(`✅ Custom avatar uploaded for ${characterName}: ${result.url}`);
            return result.url;
        } catch (error) {
            console.error('❌ Error uploading custom avatar:', error);
            return null;
        }
    }

    /**
     * Get available heritage options with avatars
     * @returns {Array} - Array of heritage names with avatar URLs
     */
    getAvailableHeritages() {
        const available = [];
        
        if (this.avatarsMapping && this.avatarsMapping.avatars) {
            available.push(...Object.keys(this.avatarsMapping.avatars));
        }
        
        if (this.fallbackAssignmentSystem) {
            const fallbackHeritages = this.fallbackAssignmentSystem.getAvailableHeritages();
            fallbackHeritages.forEach(heritage => {
                if (!available.includes(heritage)) {
                    available.push(heritage);
                }
            });
        }
        
        return available.sort();
    }

    /**
     * Get avatar statistics
     * @returns {Object} - Statistics about available avatars
     */
    getAvatarStats() {
        const stats = {
            githubAvatars: 0,
            localAvatars: 0,
            smoothVersions: 0,
            fallbackVersions: 0,
            totalHeritages: 0
        };

        if (this.avatarsMapping && this.avatarsMapping.avatars) {
            const avatars = this.avatarsMapping.avatars;
            stats.githubAvatars = Object.keys(avatars).length;
            
            Object.values(avatars).forEach(avatar => {
                if (avatar.smooth) stats.smoothVersions++;
                if (avatar.fallback) stats.fallbackVersions++;
            });
        }

        if (this.fallbackAssignmentSystem) {
            stats.localAvatars = this.fallbackAssignmentSystem.getAvailableHeritages().length;
        }

        stats.totalHeritages = this.getAvailableHeritages().length;
        
        return stats;
    }
}

// Initialize global avatar URL system
window.avatarUrlSystem = new AvatarUrlSystem();

console.log('🎭 StoryTeller Avatar URL System initialized');
