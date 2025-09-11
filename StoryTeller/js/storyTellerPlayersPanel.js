/**
 * StoryTeller Players Panel Module
 * Manages character synchronization between V4-network and StoryTeller
 * Displays player characters, allows character management, and handles real-time updates
 */

class StoryTellerPlayersPanel {
    constructor() {
        this.characters = new Map(); // Store character data by ID
        this.storageKey = 'storyteller_player_characters';
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Extract display name from device-scoped character name
     * device_abc123_Testificate -> Testificate
     */
    getDisplayName(character) {
        // Check if character has explicit display name or original name
        if (character.displayName) return character.displayName;
        if (character.originalName) return character.originalName;
        
        // Extract from device-scoped name
        const name = character.name || '';
        if (name.startsWith('device_')) {
            const parts = name.split('_');
            if (parts.length >= 3) {
                return parts.slice(2).join('_'); // Handle names with underscores
            }
        }
        
        return name; // Fallback to full name
    }

    /**
     * Get device info from character for display purposes
     */
    getDeviceInfo(character) {
        if (character.deviceId) {
            return `(Device: ${character.deviceId})`;
        }
        
        const name = character.name || '';
        if (name.startsWith('device_')) {
            const parts = name.split('_');
            if (parts.length >= 2) {
                return `(Device: ${parts[1]})`;
            }
        }
        
        return '';
    }

    /**
     * Initialize the players panel system
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('🎭 Initializing StoryTeller Players Panel...');
        
        try {
            // Load stored characters from IndexedDB
            await this.loadStoredCharacters();
            
            // Set up event listeners for character updates
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ StoryTeller Players Panel initialized successfully');
            
            // Update the panel if it's currently displayed
            this.updatePlayersPanelDisplay();
            
            // Enable scrolling after a brief delay for dynamic content
            setTimeout(() => {
                this.enableScrollingForAllPanels();
            }, 100);
            
        } catch (error) {
            console.error('❌ Failed to initialize StoryTeller Players Panel:', error);
        }
    }

    /**
     * Load characters from IndexedDB storage
     */
    async loadStoredCharacters() {
        try {
            // Try to get stored characters from IndexedDB
            if (window.storageManager && window.storageManager.db) {
                const storedChars = await window.storageManager.getAllCharacters();
                
                if (storedChars && storedChars.length > 0) {
                    storedChars.forEach(char => {
                        const characterId = char.id || char.name || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        this.characters.set(characterId, {
                            ...char,
                            id: characterId
                        });
                    });
                    console.log(`📚 Loaded ${storedChars.length} characters from IndexedDB`);
                }
            }
            
            // Also try to load from sample data
            await this.loadSampleCharacters();
            
        } catch (error) {
            console.warn('⚠️ Could not load stored characters:', error);
            // Load sample data as fallback
            await this.loadSampleCharacters();
        }
    }

    /**
     * Load sample characters from data/characters folder
     */
    async loadSampleCharacters() {
        try {
            const response = await fetch('data/characters/testificate.json');
            if (response.ok) {
                const charData = await response.json();
                const characterId = charData.id || charData.name || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.characters.set(characterId, {
                    ...charData,
                    id: characterId
                });
                console.log('📄 Loaded sample character: Testificate');
            }
        } catch (error) {
            console.warn('⚠️ Could not load sample characters:', error);
        }
    }

    /**
     * Import character from file using comprehensive import profile
     * @param {File} file - Character file to import
     */
    async importCharacterFromFile(file) {
        try {
            // Initialize import profile if not available
            if (!window.CharacterImportProfile) {
                console.error('❌ CharacterImportProfile not loaded');
                this.showNotification('Import Failed', 'Character import system not available');
                return false;
            }

            const importProfile = new window.CharacterImportProfile();
            
            // Validate file format
            if (!importProfile.validateFileFormat(file)) {
                throw new Error('Unsupported file format. Please use .dcw or .json files.');
            }

            // Read file content
            const fileContent = await this.readFileAsText(file);
            
            // Parse character data
            const characters = importProfile.parseCharacterData(fileContent, file.name);
            
            if (characters.length === 0) {
                throw new Error('No valid characters found in file');
            }

            // Import characters
            let importedCount = 0;
            characters.forEach(character => {
                const characterId = character.id || character.name || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Ensure character has ID
                character.id = characterId;
                
                // Add to characters map
                this.characters.set(characterId, character);
                importedCount++;
                
                console.log(`✅ Imported character: ${character.name} (Level ${character.level})`);
            });

            // Get import statistics
            const stats = importProfile.getImportStatistics(characters);
            const summary = importProfile.generateImportSummary(characters, stats);

            // Update display
            this.updatePlayersPanelDisplay();
            
            // Save to storage if available
            await this.saveToStorage();
            
            // Show success notification with details
            this.showDetailedImportNotification(summary, stats);
            
            console.log(`🎉 Successfully imported ${importedCount} character(s) from ${file.name}`);
            return true;
            
        } catch (error) {
            console.error('❌ Character import failed:', error);
            this.showNotification('Import Failed', error.message);
            return false;
        }
    }

    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Save characters to storage if available
     */
    async saveToStorage() {
        try {
            if (window.storageManager && window.storageManager.db) {
                // Convert Map to Array for storage
                const charactersArray = Array.from(this.characters.values());
                
                // Save each character individually
                for (const character of charactersArray) {
                    await window.storageManager.saveCharacter(character);
                }
                
                console.log(`💾 Saved ${charactersArray.length} characters to IndexedDB`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to save to storage:', error);
        }
    }

    /**
     * Show detailed import notification
     * @param {string} summary - Import summary text
     * @param {Object} stats - Import statistics
     */
    showDetailedImportNotification(summary, stats) {
        // Create a detailed notification modal
        const modalHtml = `
            <div class="modal import-success-modal" id="import-success-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎉 Import Successful!</h3>
                        <span class="close" onclick="storyTellerPlayersPanel.closeModal('import-success-modal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="import-summary">
                            <pre>${summary}</pre>
                        </div>
                        <div class="import-actions">
                            <button class="btn btn-primary" onclick="storyTellerPlayersPanel.closeModal('import-success-modal')">Continue</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('import-success-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = document.getElementById('import-success-modal');
        modal.style.display = 'block';
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal && modal.style.display === 'block') {
                this.closeModal('import-success-modal');
            }
        }, 10000);
    }

    /**
     * Set up event listeners for character updates
     */
    setupEventListeners() {
        // Listen for character updates from network/sync systems
        window.addEventListener('characterUpdated', (event) => {
            this.handleCharacterUpdate(event.detail);
        });

        // Listen for new character creation
        window.addEventListener('characterCreated', (event) => {
            this.handleNewCharacter(event.detail);
        });

        // Listen for character deletion
        window.addEventListener('characterDeleted', (event) => {
            this.handleCharacterDeletion(event.detail);
        });
    }

    /**
     * Handle character update from external source
     */
    handleCharacterUpdate(characterData) {
        if (!characterData || !characterData.id) return;

        console.log(`🔄 Updating character: ${characterData.name}`);
        
        // Update stored character data
        this.characters.set(characterData.id, {
            ...characterData,
            lastModified: new Date().toISOString(),
            lastSync: new Date().toISOString()
        });

        // Update display if panel is active
        this.updatePlayersPanelDisplay();
        
        // Notify about the update
        this.showNotification(`Updated: ${characterData.name}`, 'Character data synchronized');
    }

    /**
     * Handle new character creation
     */
    async handleNewCharacter(characterData) {
        if (!characterData || !characterData.id) return;

        console.log(`➕ Adding new character: ${characterData.name}`);
        
        // Add new character
        this.characters.set(characterData.id, {
            ...characterData,
            lastModified: new Date().toISOString(),
            lastSync: new Date().toISOString()
        });

        // Save to IndexedDB
        await this.saveToStorage();

        // Update display immediately
        this.updatePlayersPanelDisplay();
        
        // Force a refresh after a short delay to ensure UI is updated and scrolling is enabled
        setTimeout(() => {
            this.updatePlayersPanelDisplay();
            console.log(`✅ Character panel refreshed with ${this.characters.size} characters - scrolling enabled`);
        }, 100);
        
        // Notify about new character
        this.showNotification(`New Character: ${characterData.name}`, 'Character joined the party');
    }

    /**
     * Handle character deletion
     */
    async handleCharacterDeletion(characterId) {
        if (!characterId) return;

        const character = this.characters.get(characterId);
        if (character) {
            console.log(`🗑️ Removing character: ${character.name}`);
            
            // Remove from memory
            this.characters.delete(characterId);
            
            // Remove from IndexedDB storage
            try {
                if (window.storageManager && window.storageManager.deleteCharacter) {
                    await window.storageManager.deleteCharacter(characterId);
                    console.log(`💾 Character deleted from storage: ${character.name}`);
                }
            } catch (error) {
                console.warn('⚠️ Failed to delete character from storage:', error);
            }
            
            // Close character modal if open
            this.closeCharacterModal();
            
            // Update display
            this.updatePlayersPanelDisplay();
            
            // Notify about deletion
            this.showNotification(`Removed: ${character.name}`, 'Character deleted from storage');
        }
    }

    /**
     * Update the players panel display with current character data
     */
    updatePlayersPanelDisplay() {
        // Check if the players panel is currently active
        const leftPanel = document.getElementById('left-panel-content');
        const rightPanel = document.getElementById('right-panel-content');
        
        if (leftPanel && leftPanel.querySelector('.player-manager')) {
            this.renderPlayersPanel(leftPanel);
            this.enablePlayerListScrolling(leftPanel);
        }
        
        if (rightPanel && rightPanel.querySelector('.player-manager')) {
            this.renderPlayersPanel(rightPanel);
            this.enablePlayerListScrolling(rightPanel);
        }
    }

    /**
     * Enable proper scrolling for player list (fix for touch and mouse wheel)
     */
    enablePlayerListScrolling(container) {
        const playerList = container.querySelector('#player-list');
        if (!playerList) return;

        // Apply the same scrolling fix used for private messages
        playerList.style.overflowY = 'auto';
        playerList.style.overflowX = 'hidden';
        playerList.style.webkitOverflowScrolling = 'touch'; // For iOS touch scrolling
        playerList.style.maxHeight = 'calc(100vh - 200px)'; // Ensure container has height limit
        
        // Force a reflow to ensure scrolling works
        playerList.scrollTop = playerList.scrollTop;
        
        console.log('📱 Scroll functionality enabled for player list');
        console.log('🔍 Player list scroll info:', {
            scrollHeight: playerList.scrollHeight,
            clientHeight: playerList.clientHeight,
            hasScroll: playerList.scrollHeight > playerList.clientHeight,
            itemCount: this.characters.size
        });
    }

    /**
     * Enable scrolling for all visible player panels
     */
    enableScrollingForAllPanels() {
        const leftPanel = document.getElementById('left-panel-content');
        const rightPanel = document.getElementById('right-panel-content');
        
        if (leftPanel && leftPanel.querySelector('.player-manager')) {
            this.enablePlayerListScrolling(leftPanel);
        }
        
        if (rightPanel && rightPanel.querySelector('.player-manager')) {
            this.enablePlayerListScrolling(rightPanel);
        }
        
        console.log('📱 Scrolling enabled for all active player panels');
    }

    /**
     * Render the players panel content
     */
    renderPlayersPanel(container) {
        const playerList = container.querySelector('#player-list');
        if (!playerList) return;

        if (this.characters.size === 0) {
            playerList.innerHTML = `
                <div class="player-item">
                    <div class="player-info">
                        <span class="player-name">No characters loaded</span>
                        <span class="player-status offline">Waiting for players...</span>
                    </div>
                </div>
            `;
            return;
        }

        // Generate character list
        const charactersArray = Array.from(this.characters.values());
        const charactersHtml = charactersArray.map(char => this.createCharacterListItem(char)).join('');
        
        playerList.innerHTML = charactersHtml;
    }

    /**
     * Create HTML for a character list item
     */
    createCharacterListItem(character) {
        const raceName = this.getRaceName(character);
        const className = this.getClassName(character);
        const jobName = this.getJobName(character);
        const isOnline = this.isCharacterOnline(character);
        const lastSeen = this.getLastSeenText(character);
        const characterId = character.id || character.name;
        const achievementCount = Array.isArray(character.achievements) ? character.achievements.length : 0;
        
        // Get clean display name and device info
        const displayName = this.getDisplayName(character);
        const deviceInfo = this.getDeviceInfo(character);
        
        return `
            <div class="player-item character-item" data-character-id="${characterId}">
                <div class="character-portrait-small">
                    ${this.getCharacterPortrait(character)}
                </div>
                <div class="player-info">
                    <div class="character-header">
                        <span class="player-name character-name">${displayName || 'Unnamed Character'}</span>
                        <span class="character-level">Lv.${character.level || 1}</span>
                        <span class="player-status ${isOnline ? 'online' : 'offline'}">${isOnline ? 'Online' : 'Offline'}</span>
                        ${deviceInfo ? `<span class="device-info" style="font-size: 0.7em; color: var(--text-secondary); margin-left: 4px;">${deviceInfo}</span>` : ''}
                    </div>
                    <div class="character-details">
                        <span class="character-identity">${raceName} ${jobName} ${className}</span>
                        <span class="character-stats">
                            ❤️${character.currentHealthPoints || 0}/${character.healthPoints || 0} 
                            💙${character.currentMagicPoints || 0}/${character.magicPoints || 0}
                            ${achievementCount > 0 ? `🏆${achievementCount}` : ''}
                        </span>
                    </div>
                    <div class="character-meta">
                        <span class="last-seen">${lastSeen}</span>
                        <div class="character-actions">
                            <button class="action-btn small" onclick="storyTellerPlayersPanel.viewCharacter('${characterId}')" title="View Details">
                                👁️
                            </button>
                            <button class="action-btn small" onclick="storyTellerPlayersPanel.editCharacter('${characterId}')" title="Edit Character">
                                ✏️
                            </button>
                            <button class="action-btn small" onclick="storyTellerPlayersPanel.exportCharacter('${characterId}')" title="Export Character">
                                📤
                            </button>
                            <button class="action-btn small danger" onclick="storyTellerPlayersPanel.kickCharacter('${characterId}')" title="Remove Character">
                                🚫
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get character portrait HTML
     */
    getCharacterPortrait(character) {
        if (character.personal?.avatarUrl) {
            return `<img src="${character.personal.avatarUrl}" alt="${character.name}" class="character-portrait">`;
        } else if (character.personal?.portrait) {
            return `<img src="${character.personal.portrait}" alt="${character.name}" class="character-portrait">`;
        } else {
            return `<div class="character-portrait-placeholder"><i class="ra ra-player"></i></div>`;
        }
    }

    /**
     * Get race/heritage name
     */
    getRaceName(character) {
        if (character.race && window.races && window.races[character.race]) {
            return window.races[character.race].name;
        }
        return character.customRace || character.race || 'Unknown';
    }

    /**
     * Get class name
     */
    getClassName(character) {
        if (character.class && window.classes && window.classes[character.class]) {
            return window.classes[character.class].name;
        }
        return character.customClass || character.class || 'Unknown';
    }

    /**
     * Get job/background name
     */
    getJobName(character) {
        if (character.job && window.jobs && window.jobs[character.job]) {
            return window.jobs[character.job].name;
        }
        return character.customJob || character.job || 'Unknown';
    }

    /**
     * Check if character is considered online (mock for now)
     */
    isCharacterOnline(character) {
        // For now, consider characters online if modified within last 5 minutes
        if (!character.lastModified) return false;
        
        const lastMod = new Date(character.lastModified);
        const now = new Date();
        const diffMinutes = (now - lastMod) / (1000 * 60);
        
        return diffMinutes < 5;
    }

    /**
     * Get last seen text
     */
    getLastSeenText(character) {
        if (!character.lastModified) return 'Never';
        
        const lastMod = new Date(character.lastModified);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastMod) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    /**
     * View character details
     */
    viewCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;

        // Create detailed character view modal
        this.showCharacterDetailsModal(character);
    }

    /**
     * Show character details in a modal (NPC-style layout)
     */
    showCharacterDetailsModal(character) {
        // Remove existing modal if present
        const existingModal = document.getElementById('character-details-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML with NPC-inspired layout
        const modalHtml = `
            <div class="character-modal" id="character-details-modal" onclick="storyTellerPlayersPanel.closeCharacterModal(event)">
                <div class="character-modal-content" onclick="event.stopPropagation()">
                    <div class="character-modal-header">
                        <h3 class="character-modal-title">
                            <i class="ra ra-user"></i>
                            ${character.name || 'Unnamed Character'}
                        </h3>
                        <div class="character-modal-controls">
                            <button class="btn-modal-edit" onclick="storyTellerPlayersPanel.editCharacter('${character.id}')" title="Edit Character">
                                <i class="ra ra-edit"></i>
                                <span>Edit</span>
                            </button>
                            <button class="btn-modal-close" onclick="storyTellerPlayersPanel.closeCharacterModal()">
                                <i class="ra ra-close"></i>
                            </button>
                        </div>
                    </div>
                    <div class="character-modal-body" id="character-modal-body">
                        ${this.generateCharacterModalContent(character)}
                    </div>
                    <div class="character-modal-footer">
                        <button class="btn-secondary" onclick="storyTellerPlayersPanel.exportCharacter('${character.id}')">
                            <i class="ra ra-download"></i> Export Character
                        </button>
                        <button class="btn-secondary" onclick="storyTellerPlayersPanel.kickCharacter('${character.id}')">
                            <i class="ra ra-sword"></i> Remove from Party
                        </button>
                        <button class="btn-secondary" onclick="storyTellerPlayersPanel.closeCharacterModal()">
                            <i class="ra ra-close"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body and show
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('character-details-modal');
        modal.style.display = 'flex';
    }

    /**
     * Generate character modal content in NPC-style layout
     */
    generateCharacterModalContent(character) {
        const raceName = this.getRaceName(character);
        const className = this.getClassName(character);
        const jobName = this.getJobName(character);
        const achievementCount = Array.isArray(character.achievements) ? character.achievements.length : 0;
        const skillCount = character.customSkills?.length || 0;
        const inventoryCount = character.inventory?.length || 0;
        
        // Get clean display name and device info
        const displayName = this.getDisplayName(character);
        const deviceInfo = this.getDeviceInfo(character);

        return `
            <div class="character-display modal-character-display">
                <div class="character-card">
                    <div class="character-header">
                        <div class="character-portrait-modal">
                            ${this.getCharacterPortrait(character)}
                        </div>
                        <div class="character-header-info">
                            <h4 class="character-name">${displayName}</h4>
                            ${deviceInfo ? `<div class="device-info" style="font-size: 0.8em; color: var(--text-secondary); margin-bottom: 4px;">${deviceInfo}</div>` : ''}
                            <span class="character-identity">${raceName} ${jobName} ${className}</span>
                            <div class="character-level-badge">Level ${character.level || 1}</div>
                        </div>
                        <div class="character-vital-stats">
                            <div class="vital-stat health">
                                <span class="vital-label">❤️ HP</span>
                                <span class="vital-value">${character.currentHealthPoints || 0}/${character.healthPoints || 0}</span>
                            </div>
                            <div class="vital-stat magic">
                                <span class="vital-label">💙 MP</span>
                                <span class="vital-value">${character.currentMagicPoints || 0}/${character.magicPoints || 0}</span>
                            </div>
                            <div class="vital-stat armor">
                                <span class="vital-label">🛡️ AC</span>
                                <span class="vital-value">${character.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="character-details">
                        <div class="character-info-sections">
                            
                            <!-- Attributes Section -->
                            <div class="info-section">
                                <div class="section-header collapsed" onclick="storyTellerPlayersPanel.toggleSection(this)">
                                    <i class="ra ra-muscle-up section-icon"></i>
                                    <span>Attributes</span>
                                    <i class="ra ra-arrow-down toggle-arrow"></i>
                                </div>
                                <div class="section-content">
                                    <div class="attribute-grid">
                                        <div class="attribute-item">
                                            <span class="attr-label">STR</span>
                                            <span class="attr-value">${character.stats?.strength || character.strength || 0}</span>
                                        </div>
                                        <div class="attribute-item">
                                            <span class="attr-label">DEX</span>
                                            <span class="attr-value">${character.stats?.dexterity || character.dexterity || 0}</span>
                                        </div>
                                        <div class="attribute-item">
                                            <span class="attr-label">CON</span>
                                            <span class="attr-value">${character.stats?.constitution || character.constitution || 0}</span>
                                        </div>
                                        <div class="attribute-item">
                                            <span class="attr-label">INT</span>
                                            <span class="attr-value">${character.stats?.intelligence || character.intelligence || 0}</span>
                                        </div>
                                        <div class="attribute-item">
                                            <span class="attr-label">WIS</span>
                                            <span class="attr-value">${character.stats?.wisdom || character.wisdom || 0}</span>
                                        </div>
                                        <div class="attribute-item">
                                            <span class="attr-label">CHA</span>
                                            <span class="attr-value">${character.stats?.charisma || character.charisma || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Skills Section -->
                            <div class="info-section">
                                <div class="section-header collapsed" onclick="storyTellerPlayersPanel.toggleSection(this)">
                                    <i class="ra ra-round-star section-icon"></i>
                                    <span>Skills (${skillCount})</span>
                                    <i class="ra ra-arrow-down toggle-arrow"></i>
                                </div>
                                <div class="section-content">
                                    <div class="skills-grid">
                                        ${this.getExpandedSkillsList(character)}
                                    </div>
                                </div>
                            </div>

                            <!-- Achievements Section -->
                            <div class="info-section">
                                <div class="section-header collapsed" onclick="storyTellerPlayersPanel.toggleSection(this)">
                                    <i class="ra ra-trophy section-icon"></i>
                                    <span>Achievements (${achievementCount})</span>
                                    <i class="ra ra-arrow-down toggle-arrow"></i>
                                </div>
                                <div class="section-content">
                                    <div class="achievements-grid">
                                        ${this.getExpandedAchievementsList(character)}
                                    </div>
                                </div>
                            </div>

                            <!-- Inventory Section -->
                            <div class="info-section">
                                <div class="section-header collapsed" onclick="storyTellerPlayersPanel.toggleSection(this)">
                                    <i class="ra ra-knapsack section-icon"></i>
                                    <span>Inventory (${inventoryCount})</span>
                                    <i class="ra ra-arrow-down toggle-arrow"></i>
                                </div>
                                <div class="section-content">
                                    <div class="inventory-grid">
                                        ${this.getExpandedInventoryList(character)}
                                    </div>
                                </div>
                            </div>

                            <!-- Character Details Section -->
                            <div class="info-section">
                                <div class="section-header collapsed" onclick="storyTellerPlayersPanel.toggleSection(this)">
                                    <i class="ra ra-scroll-unfurled section-icon"></i>
                                    <span>Character Details</span>
                                    <i class="ra ra-arrow-down toggle-arrow"></i>
                                </div>
                                <div class="section-content">
                                    <div class="character-meta-info">
                                        <div class="meta-item">
                                            <span class="meta-label">Character ID:</span>
                                            <span class="meta-value">${character.id || 'Unknown'}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="meta-label">Last Modified:</span>
                                            <span class="meta-value">${character.lastModified ? new Date(character.lastModified).toLocaleString() : 'Unknown'}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="meta-label">Last Sync:</span>
                                            <span class="meta-value">${character.lastSync ? new Date(character.lastSync).toLocaleString() : 'Never'}</span>
                                        </div>
                                        ${this.hasRelevantNotes(character) ? `
                                        <div class="meta-item full-width">
                                            <span class="meta-label">Public Notes:</span>
                                            <div class="character-notes">${this.formatCharacterNotes(character)}</div>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle collapsible sections in character modal
     */
    toggleSection(headerElement) {
        const section = headerElement.parentElement;
        const content = section.querySelector('.section-content');
        const arrow = headerElement.querySelector('.toggle-arrow');
        
        if (headerElement.classList.contains('collapsed')) {
            headerElement.classList.remove('collapsed');
            content.style.display = 'block';
            arrow.style.transform = 'rotate(180deg)';
        } else {
            headerElement.classList.add('collapsed');
            content.style.display = 'none';
            arrow.style.transform = 'rotate(0deg)';
        }
    }

    /**
     * Close character modal
     */
    closeCharacterModal(event) {
        if (event && event.target !== event.currentTarget) return;
        
        const modal = document.getElementById('character-details-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Get expanded skills list for modal
     */
    getExpandedSkillsList(character) {
        if (!character.customSkills || character.customSkills.length === 0) {
            return '<div class="no-content">No skills learned yet</div>';
        }

        return character.customSkills.map(skill => `
            <div class="skill-item">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-stat">[${skill.stat?.toUpperCase() || '?'}]</span>
                <span class="skill-source">(${skill.source || 'Unknown'})</span>
            </div>
        `).join('');
    }

    /**
     * Get expanded achievements list for modal
     */
    getExpandedAchievementsList(character) {
        if (!Array.isArray(character.achievements) || character.achievements.length === 0) {
            return '<div class="no-content">No achievements earned yet</div>';
        }

        return character.achievements.map(achievement => {
            const rarity = achievement.rarity || 'common';
            const rarityClass = `rarity-${rarity}`;
            const categoryIcon = this.getAchievementCategoryIcon(achievement.category);
            
            return `
                <div class="achievement-item ${rarityClass}">
                    <div class="achievement-icon">${categoryIcon}</div>
                    <div class="achievement-info">
                        <span class="achievement-name">${achievement.name}</span>
                        <span class="achievement-rarity">${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</span>
                        ${achievement.description ? `<p class="achievement-desc">${achievement.description}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get achievement category icon
     */
    getAchievementCategoryIcon(category) {
        const icons = {
            combat: '⚔️',
            exploration: '🗺️',
            social: '👥',
            crafting: '🔨',
            magic: '🔮',
            survival: '🏕️',
            knowledge: '📚',
            special: '⭐'
        };
        return icons[category] || '🏆';
    }

    /**
     * Get expanded inventory list for modal
     */
    getExpandedInventoryList(character) {
        if (!character.inventory || character.inventory.length === 0) {
            return '<div class="no-content">No items in inventory</div>';
        }

        return character.inventory.slice(0, 20).map(item => `
            <div class="inventory-item">
                <span class="item-name">${item.name}</span>
                ${item.quantity > 1 ? `<span class="item-quantity">x${item.quantity}</span>` : ''}
            </div>
        `).join('') + (character.inventory.length > 20 ? `<p class="more-items">...and ${character.inventory.length - 20} more items</p>` : '');
    }

    /**
     * Check if character has relevant notes for StoryTeller
     */
    hasRelevantNotes(character) {
        // If notes is undefined (filtered out), return false
        if (!character.notes) return false;
        
        // If notes is a string and not empty
        if (typeof character.notes === 'string') {
            return character.notes.trim().length > 0;
        }
        
        // If notes is an object, check for party/session notes (not personal)
        if (typeof character.notes === 'object') {
            const relevantNotes = character.notes.party || character.notes.session || character.notes.world;
            return relevantNotes && relevantNotes.trim().length > 0;
        }
        
        return false;
    }

    /**
     * Format character notes for display
     */
    formatCharacterNotes(character) {
        if (!character.notes) return '';
        
        // If notes is a simple string
        if (typeof character.notes === 'string') {
            return character.notes;
        }
        
        // If notes is an object, show only party/session/world notes
        if (typeof character.notes === 'object') {
            const sections = [];
            
            if (character.notes.party && character.notes.party.trim()) {
                sections.push(`<strong>Party:</strong> ${character.notes.party}`);
            }
            if (character.notes.session && character.notes.session.trim()) {
                sections.push(`<strong>Session:</strong> ${character.notes.session}`);
            }
            if (character.notes.world && character.notes.world.trim()) {
                sections.push(`<strong>World:</strong> ${character.notes.world}`);
            }
            
            return sections.join('<br><br>') || 'No public notes';
        }
        
        return 'Invalid notes format';
    }

    /**
     * Get achievements list HTML
     */
    getAchievementsList(character) {
        if (!Array.isArray(character.achievements) || character.achievements.length === 0) {
            return '<p class="no-items">No achievements earned</p>';
        }

        return character.achievements.map(achievement => {
            const rarityClass = achievement.rarity || 'common';
            const categoryIcon = this.getAchievementCategoryIcon(achievement.category);
            
            return `
                <div class="achievement-item ${rarityClass}">
                    <div class="achievement-icon">${categoryIcon}</div>
                    <div class="achievement-info">
                        <span class="achievement-name">${achievement.name}</span>
                        <span class="achievement-description">${achievement.description}</span>
                        ${achievement.effect ? `<span class="achievement-effect">Effect: ${achievement.effect}</span>` : ''}
                        <span class="achievement-earned">Earned: ${this.formatAchievementDate(achievement)}</span>
                    </div>
                    <div class="achievement-rarity ${rarityClass}">${achievement.rarity || 'common'}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get achievement category icon
     */
    getAchievementCategoryIcon(category) {
        const icons = {
            'race': '👥',
            'exploration': '🗺️',
            'progression': '📈',
            'survival': '💪',
            'skill': '🎯',
            'combat': '⚔️',
            'social': '🤝',
            'absurd': '🤪',
            'special': '⭐'
        };
        return icons[category] || '🏆';
    }

    /**
     * Format achievement earned date
     */
    formatAchievementDate(achievement) {
        const earnedDate = achievement.earnedDate || achievement.dateEarned;
        if (!earnedDate) return 'Unknown';
        
        try {
            const date = new Date(earnedDate);
            return date.toLocaleDateString();
        } catch (e) {
            return 'Unknown';
        }
    }

    /**
     * Get inventory summary HTML
     */
    getInventorySummary(character) {
        if (!character.inventory || character.inventory.length === 0) {
            return '<p class="no-items">No items</p>';
        }

        return character.inventory.slice(0, 5).map(item => `
            <div class="inventory-item">
                <span class="item-name">${item.name}</span>
                ${item.quantity > 1 ? `<span class="item-quantity">x${item.quantity}</span>` : ''}
            </div>
        `).join('') + (character.inventory.length > 5 ? `<p class="more-items">...and ${character.inventory.length - 5} more</p>` : '');
    }

    /**
     * Edit character (placeholder for future implementation)
     */
    editCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;

        console.log(`✏️ Edit character requested: ${character.name}`);
        // TODO: Implement character editing interface
        alert(`Character editing will be implemented in Phase 2.\n\nCharacter: ${character.name}\nLevel: ${character.level}\nLast Modified: ${character.lastModified || 'Unknown'}`);
    }

    /**
     * Remove/kick character
     */
    kickCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;

        if (confirm(`Remove ${character.name} from the party?`)) {
            this.handleCharacterDeletion(characterId);
            console.log(`🚫 Character removed: ${character.name}`);
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Show notification (placeholder)
     */
    showNotification(title, message) {
        console.log(`📢 ${title}: ${message}`);
        // TODO: Integrate with existing notification system
    }

    /**
     * Get character by ID
     */
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }

    /**
     * Get all characters
     */
    getAllCharacters() {
        return Array.from(this.characters.values());
    }

    /**
     * Import character from external source
     */
    async importCharacter(characterData) {
        if (!characterData || !characterData.id) {
            console.error('❌ Invalid character data for import');
            return false;
        }

        await this.handleNewCharacter(characterData);
        return true;
    }

    /**
     * Refresh characters from storage
     */
    async refreshCharacters() {
        console.log('🔄 Refreshing character data...');
        
        try {
            // Clear current characters
            this.characters.clear();
            
            // Reload from storage
            await this.loadStoredCharacters();
            
            // Update display
            this.updatePlayersPanelDisplay();
            
            console.log(`✅ Refreshed ${this.characters.size} characters`);
            this.showNotification('Characters Refreshed', `Loaded ${this.characters.size} characters`);
            
        } catch (error) {
            console.error('❌ Failed to refresh characters:', error);
            this.showNotification('Refresh Failed', 'Could not reload character data');
        }
    }

    /**
     * Export character to JSON file
     */
    exportCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) {
            console.error('❌ Character not found for export:', characterId);
            return;
        }

        try {
            // Create a clean copy of character data for export
            const exportData = {
                ...character,
                exportDate: new Date().toISOString(),
                exportSource: 'StoryTeller Players Panel'
            };

            // Convert to JSON
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${character.name}_character_export.json`;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`📤 Exported character: ${character.name}`);
            this.showNotification(`Exported: ${character.name}`, 'Character data saved to file');
            
        } catch (error) {
            console.error('❌ Failed to export character:', error);
            this.showNotification('Export Failed', 'Could not export character data');
        }
    }

    /**
     * Manually import character (show file picker or JSON input)
     */
    async showImportDialog() {
        const importHtml = `
            <div class="modal import-character-modal" id="import-character-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📥 Import Character</h3>
                        <span class="close" onclick="storyTellerPlayersPanel.closeModal('import-character-modal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="import-options">
                            <div class="import-option">
                                <h5>📁 Import from File</h5>
                                <input type="file" id="character-file-input" accept=".json,.dcw" onchange="storyTellerPlayersPanel.handleFileImport(event)">
                                <p class="import-description">Select a character .dcw or .json file from V4-network exports</p>
                                <div class="supported-formats">
                                    <small>Supported formats:</small>
                                    <ul>
                                        <li>🎯 .dcw files (V4-network character exports)</li>
                                        <li>📄 .json files (legacy character exports)</li>
                                        <li>📦 Multi-character backup files</li>
                                        <li>🔄 Legacy base64 avatar support</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="import-divider">OR</div>
                            <div class="import-option">
                                <h5>📝 Paste Character JSON</h5>
                                <textarea id="character-json-input" placeholder="Paste character JSON data here..." rows="8"></textarea>
                                <button class="action-btn primary" onclick="storyTellerPlayersPanel.handleJsonImport()">Import from JSON</button>
                                <p class="import-description">Paste raw JSON character data directly</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="action-btn secondary" onclick="storyTellerPlayersPanel.closeModal('import-character-modal')">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        const existingModal = document.getElementById('import-character-modal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', importHtml);
        
        // Show modal
        const modal = document.getElementById('import-character-modal');
        modal.style.display = 'block';
    }

    /**
     * Handle file import
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('📥 Starting file import:', file.name);
        
        // Show loading state
        const fileInput = event.target;
        const originalText = fileInput.parentElement.innerHTML;
        fileInput.parentElement.innerHTML = '<div class="loading">🔄 Importing character(s)...</div>';

        try {
            const success = await this.importCharacterFromFile(file);
            
            if (success) {
                // Close import modal on success
                this.closeModal('import-character-modal');
            } else {
                // Restore file input on failure
                fileInput.parentElement.innerHTML = originalText;
            }
        } catch (error) {
            console.error('❌ File import error:', error);
            // Restore file input on error
            fileInput.parentElement.innerHTML = originalText;
            this.showNotification('Import Failed', `Error importing file: ${error.message}`);
        }
    }

    /**
     * Handle JSON import
     */
    async handleJsonImport() {
        const textarea = document.getElementById('character-json-input');
        const jsonText = textarea.value.trim();
        
        if (!jsonText) {
            this.showNotification('Import Failed', 'Please paste character JSON data');
            return;
        }

        console.log('📝 Starting JSON import from textarea');
        
        // Show loading state
        const originalText = textarea.value;
        textarea.disabled = true;
        textarea.value = 'Processing character data...';

        try {
            // Create a virtual file for the import system
            const blob = new Blob([jsonText], { type: 'application/json' });
            const file = new File([blob], 'pasted_character.json', { type: 'application/json' });
            
            const success = await this.importCharacterFromFile(file);
            
            if (success) {
                // Close import modal on success
                this.closeModal('import-character-modal');
            } else {
                // Restore textarea on failure
                textarea.disabled = false;
                textarea.value = originalText;
            }
        } catch (error) {
            console.error('❌ JSON import error:', error);
            // Restore textarea on error
            textarea.disabled = false;
            textarea.value = originalText;
            this.showNotification('Import Failed', `Error importing JSON: ${error.message}`);
        }
    }
}

// Create global instance
window.storyTellerPlayersPanel = new StoryTellerPlayersPanel();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryTellerPlayersPanel;
}
