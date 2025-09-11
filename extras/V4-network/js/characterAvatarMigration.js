/**
 * Character Avatar Migration System
 * Detects characters with old base64 avatars and prompts users to upgrade
 * to the new GitHub URL-based avatar system
 */

class CharacterAvatarMigration {
    constructor() {
        this.modalId = 'avatar-migration-modal';
        this.currentCharacterData = null;
        this.availableHeritageAvatars = [];
        this.selectedHeritageAvatar = null;
        this.init();
    }

    async init() {
        this.createMigrationModal();
        await this.loadAvailableHeritageAvatars();
        console.log('🔄 Character Avatar Migration System initialized');
    }

    /**
     * Check if character needs avatar migration
     * @param {Object} characterData - Character data to check
     * @returns {boolean} - True if migration needed
     */
    needsMigration(characterData) {
        // Has old base64 portrait but no new avatar URL
        return !!(characterData.personal?.portrait && 
                 characterData.personal.portrait.startsWith('data:image/') && 
                 !characterData.personal?.avatarUrl);
    }

    /**
     * Show migration prompt for character
     * @param {Object} characterData - Character data needing migration
     * @returns {Promise<boolean>} - True if user wants to migrate
     */
    async promptMigration(characterData) {
        this.currentCharacterData = characterData;
        
        // Update modal content with character info
        this.updateModalContent(characterData);
        
        // Show the modal
        this.showModal();
        
        // Return promise that resolves when user makes choice
        return new Promise((resolve) => {
            this.migrationResolve = resolve;
        });
    }

    /**
     * Load available heritage avatars from avatars.json
     */
    async loadAvailableHeritageAvatars() {
        try {
            // Load directly from avatars.json
            const response = await fetch('assets/avatars.json');
            const avatarData = await response.json();
            const avatars = avatarData.avatars || {};
            
            this.availableHeritageAvatars = Object.entries(avatars).map(([heritage, url]) => ({
                name: heritage,
                displayName: heritage.replace('_', ' ').charAt(0).toUpperCase() + heritage.replace('_', ' ').slice(1),
                url: url
            }));
            
            console.log('✅ Loaded', this.availableHeritageAvatars.length, 'heritage avatars for migration');
        } catch (error) {
            console.warn('⚠️ Could not load heritage avatars:', error);
            // Fallback to empty array
            this.availableHeritageAvatars = [];
        }
    }

    /**
     * Create the migration modal HTML
     */
    createMigrationModal() {
        const modalHTML = `
            <div id="${this.modalId}" class="modal avatar-migration-modal" style="display: none;">
                <div class="modal-content avatar-migration-content">
                    <div class="modal-header">
                        <h3>🎭 Avatar System Upgrade</h3>
                        <p class="upgrade-description">
                            This character uses the old avatar storage system. 
                            Upgrade to the new system for faster loading and sharing!
                        </p>
                    </div>
                    
                    <div class="modal-body">
                        <div class="character-info">
                            <h4 id="migration-char-name">Character Name</h4>
                            <p id="migration-char-heritage">Heritage: Unknown</p>
                            <div class="current-avatar">
                                <strong>Current Avatar:</strong>
                                <div id="migration-current-avatar" class="current-avatar-display"></div>
                            </div>
                        </div>
                        
                        <div class="migration-options">
                            <h4>Choose New Avatar:</h4>
                            
                            <!-- Heritage Avatar Option -->
                            <div class="migration-option heritage-option">
                                <h5>📜 Use Heritage Default Avatar</h5>
                                <p>Choose from available heritage-themed avatars:</p>
                                <div id="heritage-avatar-grid" class="heritage-avatar-grid">
                                    <!-- Heritage avatars will be populated here -->
                                </div>
                                <button id="use-heritage-btn" class="migration-btn primary-btn" disabled>
                                    Use Selected Heritage Avatar
                                </button>
                            </div>
                            
                            <!-- Custom Avatar Option -->
                            <div class="migration-option custom-option">
                                <h5>📁 Upload Custom Avatar</h5>
                                <p>Upload your own image (will be stored on GitHub):</p>
                                <input type="file" id="custom-avatar-upload" accept="image/*" style="margin: 10px 0;">
                                <div id="custom-preview" class="custom-avatar-preview"></div>
                                <button id="use-custom-btn" class="migration-btn primary-btn" disabled>
                                    Upload Custom Avatar
                                </button>
                            </div>
                        </div>
                        
                        <div class="migration-backup">
                            <h4>💾 Backup Recommendation</h4>
                            <p>As a test user, consider downloading a backup before upgrading:</p>
                            <button id="download-backup-btn" class="migration-btn secondary-btn">
                                📥 Download Character Backup
                            </button>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button id="skip-migration-btn" class="migration-btn secondary-btn">
                            Skip (Keep Old System)
                        </button>
                        <button id="cancel-migration-btn" class="migration-btn tertiary-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add CSS styles
        this.addMigrationStyles();
        
        // Bind event listeners
        this.bindEventListeners();
    }

    /**
     * Add CSS styles for migration modal
     */
    addMigrationStyles() {
        const styles = `
            <style id="avatar-migration-styles">
                .avatar-migration-modal {
                    z-index: 10000;
                    background: rgba(0,0,0,0.8);
                }
                
                .avatar-migration-content {
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #ff6b35;
                    border-radius: 12px;
                    color: #ffffff;
                }
                
                .upgrade-description {
                    color: #ffffff;
                    background: rgba(255, 215, 0, 0.1);
                    padding: 10px;
                    border-radius: 6px;
                    margin-top: 10px;
                }
                
                .character-info {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .current-avatar-display {
                    width: 80px;
                    height: 80px;
                    border: 2px solid #ff6b35;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-top: 10px;
                    display: inline-block;
                }
                
                .current-avatar-display img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .migration-option {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                }
                
                .heritage-avatar-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 6px;
                }
                
                .heritage-avatar-item {
                    text-align: center;
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                }
                
                .heritage-avatar-item:hover {
                    background: rgba(255, 107, 53, 0.1);
                    border-color: rgba(255, 107, 53, 0.5);
                }
                
                .heritage-avatar-item.selected {
                    background: rgba(255, 107, 53, 0.2);
                    border-color: #ff6b35;
                }
                
                .heritage-avatar-item.recommended {
                    border-color: #ffd700;
                    background: rgba(255, 215, 0, 0.1);
                }
                
                .heritage-avatar-item img {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .heritage-avatar-item .heritage-name {
                    font-size: 12px;
                    color: #ffffff;
                    text-transform: capitalize;
                }
                
                .custom-avatar-preview {
                    width: 100px;
                    height: 100px;
                    border: 2px dashed #ff6b35;
                    border-radius: 8px;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    margin: 10px 0;
                    overflow: hidden;
                }
                
                .custom-avatar-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .migration-backup {
                    background: rgba(255, 215, 0, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    margin-top: 20px;
                }
                
                .migration-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    margin: 5px;
                    transition: all 0.3s ease;
                }
                
                .migration-btn.primary-btn {
                    background: #ff6b35;
                    color: white;
                }
                
                .migration-btn.primary-btn:hover {
                    background: #e55a2b;
                }
                
                .migration-btn.primary-btn:disabled {
                    background: #666;
                    cursor: not-allowed;
                }
                
                .migration-btn.secondary-btn {
                    background: #4a90e2;
                    color: white;
                }
                
                .migration-btn.secondary-btn:hover {
                    background: #3a7bc8;
                }
                
                .migration-btn.tertiary-btn {
                    background: #666;
                    color: white;
                }
                
                .migration-btn.tertiary-btn:hover {
                    background: #555;
                }
                
                /* Migration badge for character cards */
                .character-card {
                    position: relative;
                }
                
                .migration-badge {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ffd700;
                    color: #333;
                    font-size: 14px;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    animation: pulse 2s infinite;
                    cursor: help;
                    z-index: 10;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Bind event listeners for modal interactions
     */
    bindEventListeners() {
        // Heritage avatar selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.heritage-avatar-item')) {
                this.selectHeritageAvatar(e.target.closest('.heritage-avatar-item'));
            }
        });
        
        // Custom file upload
        document.getElementById('custom-avatar-upload').addEventListener('change', (e) => {
            this.handleCustomFileUpload(e);
        });
        
        // Button actions
        document.getElementById('use-heritage-btn').addEventListener('click', () => {
            this.useHeritageAvatar();
        });
        
        document.getElementById('use-custom-btn').addEventListener('click', () => {
            this.useCustomAvatar();
        });
        
        document.getElementById('download-backup-btn').addEventListener('click', () => {
            this.downloadCharacterBackup();
        });
        
        document.getElementById('skip-migration-btn').addEventListener('click', () => {
            this.skipMigration();
        });
        
        document.getElementById('cancel-migration-btn').addEventListener('click', () => {
            this.cancelMigration();
        });
    }

    /**
     * Update modal content with character information
     */
    updateModalContent(characterData) {
        // Character name and heritage
        document.getElementById('migration-char-name').textContent = 
            characterData.name || 'Unnamed Character';
        
        const heritage = characterData.race || characterData.heritage || 'Unknown';
        document.getElementById('migration-char-heritage').textContent = 
            `Heritage: ${heritage.charAt(0).toUpperCase() + heritage.slice(1)}`;
        
        // Current avatar
        const currentAvatarDiv = document.getElementById('migration-current-avatar');
        if (characterData.personal?.portrait) {
            currentAvatarDiv.innerHTML = 
                `<img src="${characterData.personal.portrait}" alt="Current Avatar">`;
        } else {
            currentAvatarDiv.innerHTML = '<div style="color: #666;">No avatar</div>';
        }
        
        // Populate heritage avatars
        this.populateHeritageAvatars(heritage);
    }

    /**
     * Populate heritage avatar grid
     */
    populateHeritageAvatars(currentHeritage) {
        const grid = document.getElementById('heritage-avatar-grid');
        grid.innerHTML = '';
        
        this.availableHeritageAvatars.forEach(avatar => {
            const isRecommended = avatar.name.toLowerCase() === currentHeritage.toLowerCase();
            
            const item = document.createElement('div');
            item.className = `heritage-avatar-item ${isRecommended ? 'recommended' : ''}`;
            item.dataset.heritage = avatar.name;
            item.dataset.url = avatar.url;
            
            item.innerHTML = `
                <img src="${avatar.url}" alt="${avatar.displayName}" loading="lazy">
                <div class="heritage-name">${avatar.displayName}</div>
                ${isRecommended ? '<div style="color: #ffd700; font-size: 10px;">⭐ Recommended</div>' : ''}
            `;
            
            item.addEventListener('click', () => {
                this.selectHeritageAvatar(item);
            });
            
            grid.appendChild(item);
        });
        
        // Auto-select recommended heritage if available
        const recommended = grid.querySelector('.recommended');
        if (recommended) {
            this.selectHeritageAvatar(recommended);
        }
    }

    /**
     * Select heritage avatar
     */
    selectHeritageAvatar(item) {
        // Remove previous selection
        document.querySelectorAll('.heritage-avatar-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select new item
        item.classList.add('selected');
        this.selectedHeritageAvatar = {
            heritage: item.dataset.heritage,
            url: item.dataset.url
        };
        
        // Enable heritage button
        document.getElementById('use-heritage-btn').disabled = false;
    }

    /**
     * Handle custom file upload
     */
    handleCustomFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('custom-preview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Custom Avatar">`;
                preview.style.display = 'flex';
                
                // Enable custom button
                document.getElementById('use-custom-btn').disabled = false;
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Use selected heritage avatar
     */
    async useHeritageAvatar() {
        if (!this.selectedHeritageAvatar) return;
        
        try {
            const btn = document.getElementById('use-heritage-btn');
            btn.disabled = true;
            btn.textContent = 'Updating...';
            
            // Update character data
            this.currentCharacterData.personal.avatarUrl = this.selectedHeritageAvatar.url;
            delete this.currentCharacterData.personal.portrait; // Remove base64
            
            // Save to storage
            await this.saveUpdatedCharacter();
            
            this.resolveMigration(true);
            
        } catch (error) {
            console.error('❌ Error using heritage avatar:', error);
            alert('Error updating avatar. Please try again.');
        }
    }

    /**
     * Use custom uploaded avatar
     */
    async useCustomAvatar() {
        const fileInput = document.getElementById('custom-avatar-upload');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        try {
            const btn = document.getElementById('use-custom-btn');
            btn.disabled = true;
            btn.textContent = 'Uploading...';
            
            // Upload to GitHub
            const result = await window.avatarUrlSystem.uploadCustomAvatar(file, this.currentCharacterData.name);
            
            if (result) {
                // Update character data
                this.currentCharacterData.personal.avatarUrl = result;
                delete this.currentCharacterData.personal.portrait; // Remove base64
                
                // Save to storage
                await this.saveUpdatedCharacter();
                
                this.resolveMigration(true);
            } else {
                throw new Error('Upload failed');
            }
            
        } catch (error) {
            console.error('❌ Error uploading custom avatar:', error);
            alert('Error uploading avatar. Please try again.');
        }
    }

    /**
     * Download character backup
     */
    downloadCharacterBackup() {
        if (!this.currentCharacterData) return;
        
        const dataStr = JSON.stringify(this.currentCharacterData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.currentCharacterData.name || 'character'}_backup_${Date.now()}.json`;
        link.click();
        
        console.log('💾 Character backup downloaded');
    }

    /**
     * Save updated character to storage
     */
    async saveUpdatedCharacter() {
        if (window.characterManager && typeof window.characterManager.saveCharacter === 'function') {
            await window.characterManager.saveCharacter(this.currentCharacterData);
            console.log('✅ Character avatar updated and saved');
        } else {
            console.warn('⚠️ Character manager not available for saving');
        }
    }

    /**
     * Skip migration (keep old system)
     */
    skipMigration() {
        this.resolveMigration(false);
    }

    /**
     * Cancel migration
     */
    cancelMigration() {
        this.resolveMigration(null);
    }

    /**
     * Resolve migration promise and hide modal
     */
    resolveMigration(result) {
        this.hideModal();
        if (this.migrationResolve) {
            this.migrationResolve(result);
        }
    }

    /**
     * Show migration modal
     */
    showModal() {
        document.getElementById(this.modalId).style.display = 'flex';
    }

    /**
     * Hide migration modal
     */
    hideModal() {
        document.getElementById(this.modalId).style.display = 'none';
        
        // Reset form
        document.getElementById('custom-avatar-upload').value = '';
        document.getElementById('custom-preview').style.display = 'none';
        document.getElementById('use-heritage-btn').disabled = true;
        document.getElementById('use-custom-btn').disabled = true;
        
        // Reset selected heritage
        document.querySelectorAll('.heritage-avatar-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedHeritageAvatar = null;
    }
}

// Initialize global migration system
window.characterAvatarMigration = new CharacterAvatarMigration();

console.log('🔄 Character Avatar Migration System loaded');
