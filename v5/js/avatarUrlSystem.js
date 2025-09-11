/**
 * Avatar URL System
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
     * Update character portrait with URL-based avatar (no base64 conversion)
     * @param {string} heritage - Heritage name
     * @param {string} portraitElementId - ID of portrait display element
     * @param {boolean} preferSmooth - Prefer smooth version
     * @returns {Promise<string|null>} - Avatar URL used or null
     */
    async updateCharacterPortrait(heritage, portraitElementId = 'portrait-display', preferSmooth = true) {
        const portraitDisplay = document.getElementById(portraitElementId);
        if (!portraitDisplay) {
            console.warn(`⚠️ Portrait element ${portraitElementId} not found`);
            return null;
        }

        const avatarUrl = await this.getAvatarUrlForHeritage(heritage, preferSmooth);
        
        if (avatarUrl) {
            // Test if URL is accessible
            try {
                const testResponse = await fetch(avatarUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                    // Update portrait display with URL-based image
                    portraitDisplay.innerHTML = `<img src="${avatarUrl}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                    console.log(`✅ Portrait updated with URL avatar: ${heritage}`);
                    return avatarUrl;
                } else {
                    console.warn(`⚠️ Avatar URL not accessible: ${avatarUrl}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error testing avatar URL: ${error.message}`);
            }
        }

        // Fallback to local system with base64 conversion if available
        if (this.fallbackAssignmentSystem) {
            const localPath = await this.getFallbackAvatarPath(heritage, preferSmooth);
            if (localPath) {
                try {
                    const base64Data = await this.loadImageAsBase64(localPath);
                    if (base64Data) {
                        portraitDisplay.innerHTML = `<img src="${base64Data}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                        console.log(`✅ Portrait updated with local fallback: ${heritage}`);
                        return base64Data;
                    }
                } catch (error) {
                    console.warn(`⚠️ Error loading local fallback: ${error.message}`);
                }
            }
        }

        // Show default placeholder if no avatar found
        this.showDefaultPortraitPlaceholder(portraitDisplay);
        return null;
    }

    /**
     * Load image as base64 (for fallback compatibility)
     * @param {string} imagePath - Path to image
     * @returns {Promise<string|null>} - Base64 data or null
     */
    loadImageAsBase64(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL('image/png'));
                } catch (error) {
                    console.warn('Could not convert image to base64:', error);
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = imagePath;
        });
    }

    /**
     * Show default portrait placeholder
     * @param {HTMLElement} portraitDisplay - Portrait display element
     */
    showDefaultPortraitPlaceholder(portraitDisplay) {
        portraitDisplay.innerHTML = `
            <div class="portrait-placeholder">
                <i class="ra ra-hood"></i>
                <span>Tap to Upload</span>
            </div>
        `;
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
        // Try multiImageHost first, but use direct GitHub upload for avatars
        if (!window.multiImageHost || !window.multiImageHost.githubHost) {
            console.error('❌ GitHub Image Host not available for custom avatar upload');
            return null;
        }

        try {
            // Get file extension
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                throw new Error('Unsupported file format. Please use PNG, JPG, JPEG, GIF, or WebP.');
            }
            
            // Create clean filename: charactername.extension
            const cleanName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fileName = `${cleanName}.${fileExtension}`;
            
            // Use direct GitHub upload to avatars folder with exact filename
            const result = await window.multiImageHost.githubHost.uploadToGithub('avatars', file, {
                customFilename: fileName,
                commitMessage: `Upload custom avatar for character: ${characterName}`,
                overwrite: true
            });
            
            if (result && result.url) {
                console.log(`✅ Custom avatar uploaded for ${characterName}: ${result.url}`);
                return result.url;
            } else {
                throw new Error('Upload returned no URL');
            }
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

console.log('🎭 Avatar URL System initialized');
