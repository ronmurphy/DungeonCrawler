// ========================================
// CHARACTER MANAGER - Landing Screen & Storage
// ========================================

// Character Manager State
characterManager = {
    characters: [],
    currentCharacterId: null,
    
    /**
     * Save a specific character (used by migration system)
     * @param {Object} characterData - Character data to save
     */
    async saveCharacter(characterData) {
        if (!characterData || !characterData.id) {
            throw new Error('Invalid character data for saving');
        }
        
        // Find and update the character in the array
        const index = this.characters.findIndex(char => char.id === characterData.id);
        if (index !== -1) {
            this.characters[index] = { ...characterData };
            console.log('💾 Updated character in array:', characterData.name);
        } else {
            // Character not found, add it (shouldn't happen in migration)
            this.characters.push({ ...characterData });
            console.log('💾 Added new character to array:', characterData.name);
        }
        
        // Save to storage
        const saveSuccess = await saveCharactersToStorage();
        if (!saveSuccess) {
            throw new Error('Failed to save character to storage');
        }
        
        console.log('✅ Character saved successfully:', characterData.name);
        return true;
    }
};

// ========================================
// LOCAL STORAGE FUNCTIONS
// ========================================
async function saveCharactersToStorage() {
    try {
        console.log('💾 Attempting to save characters to storage');
        console.log('📊 Characters array length:', characterManager.characters.length);
        
        // Log character names for debugging
        if (characterManager.characters.length > 0) {
            console.log('📝 Character names:', characterManager.characters.map(c => c.name || 'Unnamed').join(', '));
        }
        
        // Use advanced storage manager if available
        if (window.advancedStorageManager) {
            await window.advancedStorageManager.setItem('wasteland_characters', characterManager.characters);
            console.log('✅ Successfully saved to advanced storage (IndexedDB)');
        } else {
            // Fallback to localStorage
            const dataToSave = JSON.stringify(characterManager.characters);
            console.log('📏 Data size to save:', dataToSave.length, 'characters');
            localStorage.setItem('wasteland_characters', dataToSave);
            console.log('✅ Successfully saved to localStorage');
        }
        return true;
    } catch (error) {
        console.error('❌ Failed to save characters:', error);
        console.error('📛 Error name:', error.name);
        console.error('📛 Error message:', error.message);
        
        // Check if it's a quota exceeded error
        if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded! Please use the Storage Manager to free up space.');
        }
        return false;
    }
}

async function loadCharactersFromStorage() {
    try {
        let characters = null;
        
        // Try advanced storage manager first
        if (window.advancedStorageManager) {
            characters = await window.advancedStorageManager.getItem('wasteland_characters');
            console.log('Loaded characters from advanced storage:', characters ? characters.length : 0);
        }
        
        // Fallback to localStorage if no data found
        if (!characters) {
            const stored = localStorage.getItem('wasteland_characters');
            if (stored) {
                characters = JSON.parse(stored);
                console.log('Loaded characters from localStorage:', characters.length);
                
                // Migrate to advanced storage if available
                if (window.advancedStorageManager && characters.length > 0) {
                    console.log('🔄 Migrating characters to advanced storage...');
                    await window.advancedStorageManager.setItem('wasteland_characters', characters);
                    localStorage.removeItem('wasteland_characters');
                    console.log('✅ Characters migrated to advanced storage');
                }
            }
        }
        
        if (characters) {
            characterManager.characters = characters;
        } else {
            characterManager.characters = [];
        }
        
        return true;
    } catch (error) {
        console.error('Failed to load characters:', error);
        characterManager.characters = [];
        return false;
    }
}

function saveCurrentCharacterToStorage() {
    if (!characterManager.currentCharacterId) return false;
    
    // Ensure notes are saved before storing (call silent version directly)
    saveNotesToCharacterSilent();
    
    // Update the character in storage
    const characterIndex = characterManager.characters.findIndex(
        char => char.id === characterManager.currentCharacterId
    );
    
    if (characterIndex !== -1) {
        // Character exists, update it
        characterManager.characters[characterIndex] = {
            ...character,
            id: characterManager.currentCharacterId,
            lastModified: new Date().toISOString()
        };
    } else {
        // Character doesn't exist yet, add it (new character case)
        const newChar = {
            ...character,
            id: characterManager.currentCharacterId,
            lastModified: new Date().toISOString()
        };
        characterManager.characters.push(newChar);
    }
    
    return saveCharactersToStorage();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function getCharacterDisplayInfo(charData) {
    // Safely get display names with fallbacks
    const raceName = charData.race && typeof races !== 'undefined' ? 
        (races[charData.race]?.name || charData.race) : 
        charData.customRace || 'Unknown';
    const jobName = charData.job && typeof jobs !== 'undefined' ? 
        (jobs[charData.job]?.name || charData.job) : 
        charData.customJob || 'Unknown';
    const className = charData.class && typeof classes !== 'undefined' ? 
        (classes[charData.class]?.name || charData.class) : 
        charData.customClass || 'Unknown';
    const lastModified = charData.lastModified ? 
        new Date(charData.lastModified).toLocaleDateString() : 
        'Unknown';
    
    return { raceName, jobName, className, lastModified };
}

// ========================================
// CHARACTER CARD CREATION
// ========================================
// STORAGE UTILITIES
// ========================================
async function getCharacterStorageLocation(charData) {
    // Check if character exists in localStorage
    const localData = localStorage.getItem('wasteland_characters');
    let isInLocalStorage = false;
    if (localData) {
        try {
            const localChars = JSON.parse(localData);
            isInLocalStorage = localChars.some(char => char.id === charData.id);
        } catch (e) {
            isInLocalStorage = false;
        }
    }
    
    // Check if character exists in IndexedDB
    let isInIndexedDB = false;
    if (window.advancedStorageManager) {
        try {
            const indexedData = await window.advancedStorageManager.getItem('wasteland_characters');
            if (indexedData) {
                isInIndexedDB = indexedData.some(char => char.id === charData.id);
            }
        } catch (e) {
            isInIndexedDB = false;
        }
    }
    
    // Return storage location
    if (isInIndexedDB) return 'indexeddb';
    if (isInLocalStorage) return 'localstorage';
    return 'unknown';
}

function getStorageIcon(storageLocation) {
    switch (storageLocation) {
        case 'indexeddb':
            return '💾'; // Database icon
        case 'localstorage':
            return '🌐'; // Web icon
        default:
            return '❓'; // Unknown
    }
}

async function updateStorageIndicator(charData) {
    console.log('Updating storage indicator for character:', charData.id);
    const indicator = document.getElementById(`storage-${charData.id}`);
    if (!indicator) {
        console.warn('Storage indicator element not found for:', charData.id);
        return;
    }
    
    try {
        const storageLocation = await getCharacterStorageLocation(charData);
        console.log('Storage location for', charData.id, ':', storageLocation);
        const icon = getStorageIcon(storageLocation);
        
        let title;
        switch (storageLocation) {
            case 'indexeddb':
                title = 'Stored in IndexedDB (optimized storage)';
                break;
            case 'localstorage':
                title = 'Stored in localStorage (browser storage)';
                break;
            default:
                title = 'Storage location unknown';
        }
        
        indicator.textContent = icon;
        indicator.title = title;
        console.log('Updated indicator for', charData.id, 'with icon:', icon);
    } catch (error) {
        console.error('Failed to update storage indicator:', error);
        indicator.textContent = '❓';
        indicator.title = 'Storage check failed';
    }
}

// Function to count skills properly for a character
function getCharacterSkillCount(charData) {
    try {
        // Count custom skills that have been acquired
        let totalSkills = 0;
        
        // Count custom skills
        if (charData.customSkills && Array.isArray(charData.customSkills)) {
            totalSkills += charData.customSkills.length;
        }
        
        // Try to estimate skills from race/job/class if we have access to the data
        if (window.races && charData.heritage) {
            const raceData = window.races.find(r => r.name === charData.heritage);
            if (raceData && raceData.skills) {
                totalSkills += raceData.skills.length;
            }
        }
        
        if (window.jobs && charData.background) {
            const jobData = window.jobs.find(j => j.name === charData.background);
            if (jobData && jobData.skills) {
                totalSkills += jobData.skills.length;
            }
        }
        
        if (window.classes && charData.className) {
            const classData = window.classes.find(c => c.name === charData.className);
            if (classData && classData.skills) {
                totalSkills += classData.skills.length;
            }
        }
        
        // If we can't calculate properly, try to get a reasonable estimate
        if (totalSkills === 0 && charData.level > 1) {
            // Estimate based on level (most characters get some skills)
            totalSkills = Math.max(1, Math.floor(charData.level / 2));
        }
        
        return totalSkills;
    } catch (error) {
        console.warn('Error calculating skill count:', error);
        // Final fallback based on level
        return Math.max(0, Math.floor((charData.level || 1) / 2));
    }
}

// ========================================
function createCharacterCard(charData) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.onclick = () => loadCharacterFromManager(charData.id);
    
    const { raceName, jobName, className, lastModified } = getCharacterDisplayInfo(charData);
    
    // Portrait handling - support both URL and base64 avatars
    let portraitContent;
    let needsMigrationBadge = false;
    
    if (charData.personal?.avatarUrl) {
        // URL-based avatar (new system)
        portraitContent = `<img src="${charData.personal.avatarUrl}" alt="${charData.name || 'Character'}" class="character-portrait">`;
    } else if (charData.personal?.portrait) {
        // Base64 avatar (legacy system) - show migration badge
        portraitContent = `<img src="${charData.personal.portrait}" alt="${charData.name || 'Character'}" class="character-portrait">`;
        needsMigrationBadge = true;
    } else {
        // No avatar, show placeholder
        portraitContent = `<div class="character-portrait-placeholder"><i class="ra ra-player"></i></div>`;
    }
    
    // Calculate additional stats for more info
    const totalStats = (charData.strength || 0) + (charData.agility || 0) + (charData.intellect || 0) + (charData.stamina || 0);
    const skillCount = getCharacterSkillCount(charData);
    const spellCount = Object.keys(charData.spells || {}).length;
    const itemCount = (charData.inventory || []).length;

    card.innerHTML = `
        ${needsMigrationBadge ? '<div class="migration-badge" title="This character can be upgraded to the new avatar system">🔄</div>' : ''}
        <div class="character-card-portrait">
            ${portraitContent}
            <div class="character-level-container">
                <div class="character-level">Lv.${charData.level || 1}</div>
                <div class="character-storage-indicator" id="storage-${charData.id}" title="Loading storage info...">⏳</div>
            </div>
        </div>
        <div class="character-card-info">
            <h3 class="character-name">${charData.name || 'Unnamed Character'}</h3>
            <div class="character-identity">
                <span class="identity-item heritage">${raceName}</span>
                <span class="identity-item background">${jobName}</span>
                <span class="identity-item class">${className}</span>
            </div>
            <div class="character-stats-grid">
                <div class="stat-group">
                    <span class="stat-item hp">❤️ ${charData.currentHealthPoints || 0}/${charData.healthPoints || 0}</span>
                    <span class="stat-item mp">💙 ${charData.currentMagicPoints || 0}/${charData.magicPoints || 0}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-item stats">📊 ${totalStats} total</span>
                    <span class="stat-item skills">🎯 ${skillCount} skills</span>
                </div>
                ${spellCount > 0 ? `<div class="stat-group">
                    <span class="stat-item spells">✨ ${spellCount} spells</span>
                    <span class="stat-item items">🎒 ${itemCount} items</span>
                </div>` : `<div class="stat-group">
                    <span class="stat-item items">🎒 ${itemCount} items</span>
                    <span class="stat-item played">🕒 ${lastModified}</span>
                </div>`}
            </div>
        </div>
        <div class="character-card-actions">
            <button class="card-action-btn delete-btn" onclick="event.stopPropagation(); deleteCharacterConfirm('${charData.id}')" title="Delete Character">
                <span class="material-icons">delete</span>
            </button>
            <button class="card-action-btn chat-btn" onclick="event.stopPropagation(); loadCharacterAndConnect('${charData.id}')" title="Load Character & Connect to Chat">
                💬
            </button>
            <button class="card-action-btn export-btn" onclick="event.stopPropagation(); exportCharacterFromManager('${charData.id}')" title="Export Character">
                <span class="material-icons">download</span>
            </button>
        </div>
    `;
    
    // Asynchronously update storage indicator after DOM insertion
    setTimeout(() => updateStorageIndicator(charData), 100);
    
    return card;
}

// ========================================
// LANDING SCREEN MANAGEMENT
// ========================================
function showLandingScreen() {
    characterManager.isLandingScreenActive = true;
    
    // Hide main character sheet
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    // Show or create landing screen
    let landingScreen = document.getElementById('character-landing');
    if (!landingScreen) {
        landingScreen = createLandingScreen();
        document.body.appendChild(landingScreen);
    } else {
        landingScreen.style.display = 'block';
    }
    
    renderCharacterGrid();
}

function hideLandingScreen() {
    characterManager.isLandingScreenActive = false;
    
    // Hide landing screen
    const landingScreen = document.getElementById('character-landing');
    if (landingScreen) {
        landingScreen.style.display = 'none';
    }
    
    // Show main character sheet
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
}

function createLandingScreen() {
    const landingScreen = document.createElement('div');
    landingScreen.id = 'character-landing';
    landingScreen.className = 'character-landing';
    
    landingScreen.innerHTML = `
        <div class="landing-header">
            <h1><i class="ra ra-knight-helmet"></i> Wasteland Chronicles</h1>
            <p>Choose your survivor or create a new character</p>
        </div>
        
        <div class="landing-actions">
            <button class="landing-btn primary-btn" onclick="createNewCharacter()">
                <span class="material-icons">person_add</span>
                New Character
            </button>
            <button class="landing-btn secondary-btn" onclick="importCharacterToManager()">
                <span class="material-icons">upload</span>
                Import Character
            </button>
            <button class="landing-btn secondary-btn" onclick="exportAllCharacters()">
                <span class="material-icons">download</span>
                Export All
            </button>
        </div>
        
        <div class="characters-grid" id="characters-grid">
            <!-- Character cards will be populated here -->
        </div>
        
        <div class="landing-footer">
            <p>Characters are saved locally in your browser. Use Export to backup your characters.</p>
        </div>
    `;
    
    return landingScreen;
}

function renderCharacterGrid() {
    const grid = document.getElementById('characters-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Update character stats in modern landing
    updateCharacterStats();
    
    if (characterManager.characters.length === 0) {
        grid.innerHTML = `
            <div class="no-characters">
                <i class="ra ra-player" style="font-size: 4em; color: #4a4a6a; margin-bottom: 20px;"></i>
                <h3>No Characters Yet</h3>
                <p>Create your first wasteland survivor to begin your journey!</p>
            </div>
        `;
        return;
    }
    
    // Sort characters by last modified (most recent first)
    const sortedCharacters = [...characterManager.characters].sort((a, b) => {
        const dateA = new Date(a.lastModified || 0);
        const dateB = new Date(b.lastModified || 0);
        return dateB - dateA;
    });
    
    sortedCharacters.forEach(charData => {
        const card = createCharacterCard(charData);
        grid.appendChild(card);
    });
}

// Function to update character statistics in modern landing
function updateCharacterStats() {
    const statsElement = document.getElementById('character-stats');
    if (!statsElement) return;
    
    const totalChars = characterManager.characters.length;
    const maxLevel = totalChars > 0 ? Math.max(...characterManager.characters.map(c => c.level || 1)) : 0;
    const recentPlayed = characterManager.characters.filter(c => {
        const lastMod = new Date(c.lastModified || 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastMod > weekAgo;
    }).length;
    
    if (totalChars === 0) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <i class="material-icons">person_add</i>
                Ready to create your first character
            </div>
        `;
    } else {
        statsElement.innerHTML = `
            <div class="stat-item">
                <i class="material-icons">people</i>
                ${totalChars} character${totalChars !== 1 ? 's' : ''}
            </div>
            <div class="stat-item">
                <i class="material-icons">trending_up</i>
                Max level: ${maxLevel}
            </div>
            ${recentPlayed > 0 ? `
            <div class="stat-item">
                <i class="material-icons">schedule</i>
                ${recentPlayed} played recently
            </div>
            ` : ''}
        `;
    }
}

// Function to show storage information modal
function showStorageInfo() {
    // Create and show a modal with storage information
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="material-icons">storage</i> Storage Information</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="storage-info">
                    <div class="info-section">
                        <h4><i class="material-icons">folder</i> Local Storage</h4>
                        <p>Your characters are saved directly in your browser's local storage. This means:</p>
                        <ul>
                            <li>✅ Fast access and offline availability</li>
                            <li>✅ No internet connection required</li>
                            <li>⚠️ Data is device-specific</li>
                            <li>⚠️ Clearing browser data will remove characters</li>
                        </ul>
                    </div>
                    <div class="info-section">
                        <h4><i class="material-icons">backup</i> Backup Recommendations</h4>
                        <p>To keep your characters safe:</p>
                        <ul>
                            <li>🔄 Export characters regularly</li>
                            <li>💾 Save exported files to cloud storage</li>
                            <li>📱 Share files between devices</li>
                            <li>🛡️ Keep backups before browser updates</li>
                        </ul>
                    </div>
                    <div class="info-section">
                        <h4><i class="material-icons">info</i> Current Status</h4>
                        <div class="storage-stats">
                            <div class="stat">
                                <span class="stat-label">Characters:</span>
                                <span class="storage-stat-value">${characterManager.characters.length}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Storage Type:</span>
                                <span class="storage-stat-value">IndexedDB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn secondary-btn" onclick="exportAllCharacters()">
                    <i class="material-icons">download</i>
                    Export All Characters
                </button>
                <button class="btn primary-btn" onclick="this.closest('.modal').remove()">
                    Got it
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========================================
// CHARACTER OPERATIONS
// ========================================
function createNewCharacter() {
    // Generate new character ID
    const newCharacterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    characterManager.currentCharacterId = newCharacterId;
    
    // Reset character object to defaults
    if (typeof character !== 'undefined') {
        resetCharacterToDefaults();
        
        // Show creation tab and switch to it
        if (typeof window.showCreationTab === 'function') {
            window.showCreationTab();
        }
        
        // Re-render character sheet components
        const renderFunctions = [
            'renderStats', 'updateHealthMagicDisplay', 'renderCharacterSkills'
        ];
        
        renderFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                } catch (error) {
                    console.warn(`Error calling ${funcName}:`, error);
                }
            }
        });
    }
    
    hideLandingScreen();
    
    // Switch to creation tab when creating a new character
    if (typeof switchTab === 'function') {
        switchTab('creation');
    }
    
    // Auto-save periodically
    startAutoSave();
}

function resetCharacterToDefaults() {
    Object.assign(character, {
        name: '',
        level: 1,
        availablePoints: 3,
        stats: {
            strength: 2, dexterity: 2, constitution: 2,
            intelligence: 2, wisdom: 2, charisma: 2
        },
        statMaximums: {
            strength: 15, dexterity: 15, constitution: 15,
            intelligence: 15, wisdom: 15, charisma: 15
        },
        healthPoints: 3,
        currentHealthPoints: 3,
        magicPoints: 4,
        currentMagicPoints: 4,
        customSkills: [],
        personal: { age: '', backstory: '', portrait: null },
        race: '', customRace: '', raceBonuses: [],
        customRaceData: { selectedStats: [], skills: [], maximums: {} },
        job: '', customJob: '', class: '', customClass: '',
        jobBonuses: [], classBonuses: [],
        customJobData: { selectedStats: [], skills: [] },
        customClassData: { selectedStats: [], skills: [] },
        rollHistory: [], spells: [], inventory: [],
        equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
        statusEffects: [],
        notes: { personal: '', party: '', session: '', barter: '', world: '', combat: '' }
    });
}

function loadCharacterFromManager(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) {
        alert('Character not found!');
        return;
    }
    
    characterManager.currentCharacterId = characterId;
    
    // Load character data into global character object
    if (typeof character !== 'undefined') {
        Object.assign(character, charData);
        
        // Load received notes from character data
        if (character.notes && character.notes.receivedNotes && Array.isArray(character.notes.receivedNotes)) {
            if (typeof receivedNotes !== 'undefined') {
                receivedNotes.length = 0; // Clear current array
                receivedNotes.push(...character.notes.receivedNotes); // Load saved notes
                console.log('📥 Loaded', receivedNotes.length, 'private notes from character data');
                
                // Update the private messages display
                if (typeof updatePrivateMessagesPanel === 'function') {
                    updatePrivateMessagesPanel();
                }
                if (typeof updateNotificationIcon === 'function') {
                    updateNotificationIcon();
                }
            }
        }
        
        // Set network player name for chat
        if (typeof window.setNetworkPlayerName === 'function') {
            window.setNetworkPlayerName(character.name || 'Unknown Player');
        }
        
        // Update UI elements
        updateUIElements();
        
        // Handle portrait - support both URL-based and base64 avatars
        const portraitDisplay = document.getElementById('portrait-display');
        if (portraitDisplay) {
            if (character.personal?.avatarUrl) {
                // URL-based avatar (new system)
                portraitDisplay.innerHTML = `<img src="${character.personal.avatarUrl}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                console.log('✅ Loaded character with URL-based avatar');
            } else if (character.personal?.portrait) {
                // Base64 avatar (legacy system) - check for migration
                portraitDisplay.innerHTML = `<img src="${character.personal.portrait}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                console.log('✅ Loaded character with base64 avatar');
                
                // Check if character needs avatar migration
                if (window.characterAvatarMigration && window.characterAvatarMigration.needsMigration(character)) {
                    // Delay migration prompt slightly to let UI settle
                    setTimeout(() => {
                        promptAvatarMigration(character);
                    }, 1000);
                }
            } else {
                // No avatar, show placeholder
                portraitDisplay.innerHTML = `
                    <div class="portrait-placeholder">
                        <i class="ra ra-hood"></i>
                        <span>Tap to Upload</span>
                    </div>
                `;
            }
        }
        
        // Handle job and class selections
        updateCharacterSelections();
        
        // Re-render all components
        refreshCharacterSheet();
    }
    
    hideLandingScreen();
    
    // Switch to character tab when loading an existing character (character overview)
    if (typeof switchTab === 'function') {
        switchTab('character');
    }
    
    // Re-render everything AFTER switching tabs to ensure character content is visible
    setTimeout(() => {
        refreshCharacterSheet();
    }, 100);
    
    startAutoSave();
}

/**
 * Prompt user for avatar migration if character has old base64 avatar
 * @param {Object} characterData - Character data to potentially migrate
 */
async function promptAvatarMigration(characterData) {
    if (!window.characterAvatarMigration) {
        console.warn('⚠️ Avatar migration system not available');
        return;
    }
    
    try {
        console.log('🔄 Prompting avatar migration for:', characterData.name);
        
        const userChoice = await window.characterAvatarMigration.promptMigration(characterData);
        
        if (userChoice === true) {
            // User completed migration - refresh display
            console.log('✅ Avatar migration completed successfully');
            
            // Update the global character object with the migrated data
            if (typeof character !== 'undefined' && character.id === characterData.id) {
                Object.assign(character, characterData);
                
                // Refresh portrait display
                const portraitDisplay = document.getElementById('portrait-display');
                if (portraitDisplay && character.personal?.avatarUrl) {
                    portraitDisplay.innerHTML = `<img src="${character.personal.avatarUrl}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                }
                
                // Refresh character display
                if (typeof updateCharacterDisplay === 'function') {
                    updateCharacterDisplay();
                }
            }
            
            // Refresh character grid to show updated avatar
            renderCharacterGrid();
            
            // Show success message
            showNotification('success', 'Avatar Updated', 'Character avatar has been upgraded to the new system!', 'Your character now uses the faster, shareable avatar system.');
            
        } else if (userChoice === false) {
            console.log('ℹ️ User chose to skip avatar migration');
        } else {
            console.log('ℹ️ User cancelled avatar migration');
        }
        
    } catch (error) {
        console.error('❌ Error during avatar migration:', error);
    }
}

function updateUIElements() {
    const elements = {
        'char-name': character.name || '',
        'char-level': character.level || 1,
        'char-age': character.personal?.age || '',
        'char-backstory': character.personal?.backstory || ''
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
}

function updateCharacterSelections() {
    // Handle race selection
    updateSelection('race', 'race-select', 'custom-race', 'custom-race-bonuses');
    
    // Handle job selection
    updateSelection('job', 'job-select', 'custom-job', 'custom-job-bonuses');
    
    // Handle class selection
    updateSelection('class', 'class-select', 'custom-class', 'custom-class-bonuses', 'custom_class');
}

function updateSelection(type, selectId, customInputId, customBonusesId, customValue = 'custom') {
    const select = document.getElementById(selectId);
    const customInput = document.getElementById(customInputId);
    const customBonuses = document.getElementById(customBonusesId);
    
    if (character[type]) {
        if (select) select.value = character[type];
    } else if (character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}`]) {
        if (select) select.value = customValue;
        if (customInput) {
            customInput.style.display = 'block';
            customInput.value = character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}`];
        }
        if (customBonuses) {
            customBonuses.style.display = 'block';
        }
    }
}

function refreshCharacterSheet() {
    // Call all the render functions to update the UI
    const renderFunctions = [
        'renderStats', 'renderCharacterSkills', 'renderCharacterSpells', 
        'renderCharacterWeapons', 'renderInventory', 'renderEquipment',
        'updateHealthMagicDisplay', 'updateCharacterDisplay', 'updateBonusesDisplay',
        'renderSpells', 'updateMagicTabDisplay', 'renderStatusEffects'
    ];
    
    renderFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            try {
                window[funcName]();
            } catch (error) {
                console.warn(`Error calling ${funcName}:`, error);
            }
        }
    });
}

function deleteCharacterConfirm(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) return;
    
    if (confirm(`Are you sure you want to delete "${charData.name || 'Unnamed Character'}"?\n\nThis action cannot be undone.`)) {
        deleteCharacter(characterId);
    }
}

function deleteCharacter(characterId) {
    characterManager.characters = characterManager.characters.filter(char => char.id !== characterId);
    saveCharactersToStorage().catch(err => console.error('Save failed:', err));
    renderCharacterGrid();
    
    // If we deleted the currently loaded character, go back to landing
    if (characterManager.currentCharacterId === characterId) {
        characterManager.currentCharacterId = null;
        showLandingScreen();
    }
}

// ========================================
// IMPORT/EXPORT FUNCTIONS
// ========================================
function exportCharacterFromManager(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) {
        alert('Character not found!');
        return;
    }
    
    // Create a clean copy without the manager ID
    const exportData = { ...charData };
    delete exportData.id;
    delete exportData.lastModified;
    
    downloadJSON(exportData, `${charData.name || 'character'}_dcw_character.dcw`);
}

function exportAllCharacters() {
    if (characterManager.characters.length === 0) {
        alert('No characters to export!');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        characterCount: characterManager.characters.length,
        characters: characterManager.characters.map(char => {
            const cleanChar = { ...char };
            delete cleanChar.id;
            delete cleanChar.lastModified;
            return cleanChar;
        })
    };
    
    downloadJSON(exportData, `wasteland_characters_backup_${new Date().toISOString().split('T')[0]}.json`);
}

// ========================================
// LOAD CHARACTER AND CONNECT TO CHAT
// ========================================
async function loadCharacterAndConnect(characterId) {
    console.log('🎮 Loading character and connecting to chat:', characterId);
    
    try {
        // First, load the character using the existing function
        loadCharacterFromManager(characterId);
        
        // Switch to the character sheet view
        hideLandingScreen();
        
        // Get the saved connection URL with IndexedDB fallback
        const lastUrl = await (window.getConnectionUrl ? window.getConnectionUrl() : localStorage.getItem('lastConnectionUrl'));
        console.log('🔍 Retrieved connection URL:', lastUrl);
        console.log('🔍 URL type:', typeof lastUrl);
        console.log('🔍 URL length:', lastUrl ? lastUrl.length : 'null');
        
        if (!lastUrl) {
            // No saved connection URL, just show the chat tab
            console.log('📡 No saved connection URL found. Opening chat tab for manual connection.');
            setTimeout(() => {
                const chatTab = document.querySelector('[data-tab="chat"]');
                if (chatTab) {
                    chatTab.click();
                }
            }, 100);
            return;
        }
        
        // Populate both connection input fields
        const sessionInput = document.getElementById('session-code-input');
        const sheetSessionInput = document.getElementById('sheet-session-input');
        
        console.log('🔍 Before setting - session input value:', sessionInput ? sessionInput.value : 'null');
        console.log('🔍 Before setting - sheet session input value:', sheetSessionInput ? sheetSessionInput.value : 'null');
        
        if (sessionInput) {
            sessionInput.value = lastUrl;
            console.log('🔍 After setting - session input value:', sessionInput.value);
        }
        if (sheetSessionInput) {
            sheetSessionInput.value = lastUrl;
            console.log('🔍 After setting - sheet session input value:', sheetSessionInput.value);
        }
        
        console.log('📡 Connection URL loaded:', lastUrl);
        
        // Switch to chat tab
        setTimeout(() => {
            const chatTab = document.querySelector('[data-tab="chat"]');
            if (chatTab) {
                chatTab.click();
                
                // Auto-connect after a short delay to allow tab switch
                setTimeout(() => {
                    if (typeof joinGameSessionFromSheet === 'function') {
                        console.log('🔗 Auto-connecting to saved session...');
                        joinGameSessionFromSheet();
                    }
                }, 500);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error loading character and connecting to chat:', error);
        alert('Error loading character: ' + error.message);
    }
}

function downloadJSON(data, filename) {
    // Convert .json extension to .dcw for better user experience
    const dcwFilename = filename.replace('.json', '.dcw');
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dcwFilename;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show helpful notification about the DCW format
    showNotification('save', 'Character Exported', `Character saved as ${dcwFilename}`, 'DCW files can be imported back into the app. Share this file with other players!');
}

function importCharacterToManager() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dcw,.json'; // Accept both new DCW format and legacy JSON
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Check if it's a single character or multiple characters export
                    if (data.characters && Array.isArray(data.characters)) {
                        // Multiple characters export
                        let importedCount = 0;
                        data.characters.forEach(charData => {
                            if (addCharacterToManager(charData)) {
                                importedCount++;
                            }
                        });
                        alert(`Successfully imported ${importedCount} character(s)!`);
                    } else {
                        // Single character export
                        if (addCharacterToManager(data)) {
                            alert('Character imported successfully!');
                        } else {
                            alert('Failed to import character!');
                        }
                    }
                    
                    renderCharacterGrid();
                } catch (error) {
                    alert('Error importing character file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function addCharacterToManager(charData) {
    try {
        // Ensure all required properties exist with defaults
        const defaults = {
            id: 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            lastModified: new Date().toISOString(),
            personal: { age: '', backstory: '', portrait: null },
            notes: { personal: '', party: '', session: '', barter: '', world: '', combat: '' },
            statusEffects: [],
            customSkills: [],
            statMaximums: {
                strength: 15, dexterity: 15, constitution: 15,
                intelligence: 15, wisdom: 15, charisma: 15
            },
            race: '',
            customRace: '',
            raceBonuses: [],
            customRaceData: { selectedStats: [], skills: [], maximums: {} }
        };
        
        const newChar = Object.assign({}, defaults, charData, {
            id: defaults.id,
            lastModified: defaults.lastModified
        });
        
        // Deep merge for nested objects
        Object.keys(defaults).forEach(key => {
            if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
                newChar[key] = Object.assign({}, defaults[key], charData[key] || {});
            }
        });
        
        characterManager.characters.push(newChar);
        saveCharactersToStorage();
        return true;
    } catch (error) {
        console.error('Error adding character:', error);
        return false;
    }
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================
let autoSaveInterval = null;

function startAutoSave() {
    // Clear existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Auto-save every 30 seconds if a character is loaded
    autoSaveInterval = setInterval(() => {
        if (characterManager.currentCharacterId && !characterManager.isLandingScreenActive) {
            saveCurrentCharacterToStorage();
        }
    }, 30000);
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// ========================================
// PAGE LIFECYCLE MANAGEMENT
// ========================================
async function initializeCharacterManager() {
    // Load characters from storage
    await loadCharactersFromStorage();
    
    // Show landing screen on startup
    showLandingScreen();
    
    // Set up auto-save for notes (override the main.js version)
    setTimeout(() => {
        if (typeof autoSaveNotes === 'function') {
            autoSaveNotes();
        }
    }, 500);
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
        if (characterManager.currentCharacterId) {
            saveCurrentCharacterToStorage();
        }
    });
    
    // Handle visibility change (mobile apps switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && characterManager.currentCharacterId) {
            saveCurrentCharacterToStorage();
        }
    });
}

// Add back to landing screen function for main character sheet
function backToCharacterSelect() {
    if (characterManager.currentCharacterId) {
        saveCurrentCharacterToStorage();
    }
    stopAutoSave();
    showLandingScreen();
}

// ========================================
// INTEGRATION WITH MAIN CHARACTER SHEET
// ========================================

// Silent notes save function
function saveNotesToCharacterSilent() {
    if (typeof character !== 'undefined' && character.notes) {
        const noteFields = {
            'personal-notes': 'personal',
            'party-notes': 'party',
            'session-notes': 'session',
            'barter-notes': 'barter',
            'world-notes': 'world',
            'combat-notes': 'combat'
        };
        
        Object.entries(noteFields).forEach(([fieldId, noteType]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                character.notes[noteType] = element.value || '';
            }
        });
        
        // Save received private notes to character data
        if (typeof receivedNotes !== 'undefined' && Array.isArray(receivedNotes)) {
            character.notes.receivedNotes = receivedNotes;
            console.log('💾 Saved', receivedNotes.length, 'private notes to character data');
        }
    }
}

// Main save function - saves current character to browser storage
function saveCharacterToStorage() {
    console.log('saveCharacterToStorage called');
    console.log('currentCharacterId:', characterManager.currentCharacterId);
    console.log('character object exists:', typeof character !== 'undefined');
    
    if (!characterManager.currentCharacterId) {
        console.log('No current character ID, creating new one');
        // If no current character, create new one
        createNewCharacterInStorage();
        return;
    }
    
    // Save notes silently first
    saveNotesToCharacterSilent();
    
    // Get current form data
    if (typeof character !== 'undefined') {
        console.log('Updating character from form');
        updateCharacterFromForm();
        
        // Save to storage using the existing function
        const saveResult = saveCurrentCharacterToStorage();
        console.log('Save result:', saveResult);
        
        if (saveResult) {
            if (typeof showNotification === 'function') {
                showNotification('save', 'Character Saved', 
                    'Character saved to browser storage!', 
                    'Your character is automatically backed up locally.');
            } else {
                alert('Character saved successfully!');
            }
        } else {
            console.error('Failed to save character - saveCurrentCharacterToStorage returned false');
            alert('Failed to save character!');
        }
    } else {
        console.error('Character object is undefined');
        alert('Failed to save character! Character data not found.');
    }
}

function updateCharacterFromForm() {
    character.name = document.getElementById('char-name')?.value || '';
    character.level = parseInt(document.getElementById('char-level')?.value) || 1;
    character.personal.age = document.getElementById('char-age')?.value || '';
    character.personal.backstory = document.getElementById('char-backstory')?.value || '';
}

// Create new character in storage
function createNewCharacterInStorage() {
    // Generate new character ID
    const newCharacterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    characterManager.currentCharacterId = newCharacterId;
    
    // Get current character data
    if (typeof character !== 'undefined') {
        updateCharacterFromForm();
        
        // Save notes
        saveNotesToCharacterSilent();
        
        // Add to storage
        const newChar = {
            ...character,
            id: newCharacterId,
            lastModified: new Date().toISOString()
        };
        
        characterManager.characters.push(newChar);
        if (saveCharactersToStorage()) {
            if (typeof showNotification === 'function') {
                showNotification('save', 'Character Created', 
                    'New character saved to browser storage!', 
                    'You can now access this character from the Character Select screen.');
            } else {
                alert('Character created and saved successfully!');
            }
            startAutoSave();
        } else {
            alert('Failed to save character!');
        }
    }
}

// Load character from storage (shows modal)
function loadCharacterFromStorage() {
    if (characterManager.characters.length === 0) {
        alert('No saved characters found! Create a character first or import from JSON.');
        return;
    }
    
    // Show character selection modal
    showCharacterSelectionModal();
}

// Export character to JSON file
function exportCharacterToJSON() {
    // Save current form data first
    if (typeof character !== 'undefined') {
        updateCharacterFromForm();
        
        // Save notes
        saveNotesToCharacterSilent();
        
        // Create clean export data
        const exportData = { ...character };
        delete exportData.id;
        delete exportData.lastModified;
        
        downloadJSON(exportData, `${character.name || 'character'}_dcw_character.dcw`);
    }
}

function showCharacterSelectionModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'character-modal-overlay';
    modal.onclick = (e) => {
        if (e.target === modal) closeCharacterModal();
    };
    
    const modalContent = document.createElement('div');
    modalContent.className = 'character-modal-content';
    
    const modalCharacters = characterManager.characters.map(char => {
        const { raceName, jobName, className } = getCharacterDisplayInfo(char);
        
        const portraitHTML = char.personal?.portrait ? 
            `<img src="${char.personal.portrait}" alt="${char.name}" class="modal-portrait-img">` :
            `<div class="modal-portrait-placeholder"><i class="ra ra-player"></i></div>`;
        
        return `
            <div class="modal-character-card" onclick="loadCharacterFromModal('${char.id}')">
                <div class="modal-char-portrait">
                    ${portraitHTML}
                    <div class="modal-char-level">Lv.${char.level || 1}</div>
                </div>
                <div class="modal-char-info">
                    <div class="modal-char-name">${char.name || 'Unnamed'}</div>
                    <div class="modal-char-details">
                        ${raceName} • ${jobName} • ${className}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Load Character</h3>
            <button class="modal-close" onclick="closeCharacterModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="modal-characters-grid" id="modal-characters-grid">
                ${modalCharacters}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeCharacterModal()">Cancel</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add modal styles if not already added
    addModalStyles();
}

function addModalStyles() {
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .character-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .character-modal-content {
                background: rgba(60, 60, 80, 0.95);
                border-radius: 12px;
                border: 2px solid #4a4a6a;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                color: #e0e0e0;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #4a4a6a;
            }
            .modal-header h3 {
                color: #f4d03f;
                margin: 0;
            }
            .modal-close {
                background: none;
                border: none;
                color: #8a8a8a;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            .modal-close:hover {
                color: #ff6b6b;
            }
            .modal-body {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .modal-characters-grid {
                display: grid;
                gap: 12px;
            }
            .modal-character-card {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px;
                background: rgba(40, 40, 60, 0.8);
                border: 1px solid #4a4a6a;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .modal-character-card:hover {
                border-color: #f4d03f;
                background: rgba(244, 208, 63, 0.1);
            }
            .modal-char-portrait {
                position: relative;
                flex-shrink: 0;
            }
            .modal-portrait-img {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #f4d03f;
            }
            .modal-portrait-placeholder {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(40, 40, 60, 0.8);
                border: 1px dashed #4a4a6a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #4a4a6a;
                font-size: 1.5em;
            }
            .modal-char-level {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f4d03f;
                color: #2a2a4a;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 8px;
                min-width: 20px;
                text-align: center;
            }
            .modal-char-info {
                flex: 1;
            }
            .modal-char-name {
                color: #f4d03f;
                font-weight: 600;
                margin-bottom: 4px;
            }
            .modal-char-details {
                color: #8a8a8a;
                font-size: 0.9em;
            }
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #4a4a6a;
                text-align: right;
            }
        `;
        document.head.appendChild(styles);
    }
}

function loadCharacterFromModal(characterId) {
    closeCharacterModal();
    loadCharacterFromManager(characterId);
}

function closeCharacterModal() {
    const modal = document.querySelector('.character-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Auto-save functionality for notes
function autoSaveNotes() {
    // Auto-save notes when user types (silently)
    const noteFields = ['personal-notes', 'party-notes', 'session-notes', 'barter-notes', 'world-notes', 'combat-notes'];
    
    noteFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', debounce(() => {
                saveNotesToCharacterSilent(); // Silent auto-save
            }, 5000)); // Increased to 5 seconds
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make sure functions are globally available
window.saveCharacterToStorage = saveCharacterToStorage;
window.loadCharacterFromStorage = loadCharacterFromStorage;
window.exportCharacterToJSON = exportCharacterToJSON;
window.saveNotesToCharacterSilent = saveNotesToCharacterSilent;
window.createNewCharacterInStorage = createNewCharacterInStorage;
window.backToCharacterSelect = backToCharacterSelect;
window.showCharacterSelectionModal = showCharacterSelectionModal;
window.loadCharacterFromModal = loadCharacterFromModal;
window.closeCharacterModal = closeCharacterModal;
window.createNewCharacter = createNewCharacter;
window.importCharacterToManager = importCharacterToManager;
window.exportAllCharacters = exportAllCharacters;
window.exportCharacterFromManager = exportCharacterFromManager;
window.deleteCharacterConfirm = deleteCharacterConfirm;
window.loadCharacterAndConnect = loadCharacterAndConnect;
window.showLandingScreen = showLandingScreen;
window.hideLandingScreen = hideLandingScreen;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load and check migration status
    setTimeout(async () => {
        console.log('🔄 Checking migration status before character manager init...');
        
        // Check if migration is needed and wait for it
        if (window.storageMigration) {
            const migrationKey = 'dcc-storage-migration-v1';
            const migrationCompleted = localStorage.getItem(migrationKey);
            
            if (!migrationCompleted) {
                console.log('⏳ Migration needed, waiting for completion...');
                await window.storageMigration.runMigration();
                console.log('✅ Migration completed, proceeding with character manager init');
            } else {
                console.log('✅ Migration already completed');
            }
        }
        
        // Now safely initialize character manager
        await initializeCharacterManager();
    }, 200); // Give scripts time to load
});