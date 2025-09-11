// ========================================
// CHARACTER SYNC SYSTEM
// Real-time character synchronization via Supabase chat
// ========================================

class CharacterSyncManager {
    constructor() {
        this.localCharacters = new Map(); // character_name -> { hash, data, lastSync }
        this.syncRequests = new Map(); // character_name -> pending request
        this.isStoryTeller = false;
        this.playerName = '';
        this.sessionCode = '';
        
        // Enable debug mode for testing
        this.debugMode = true;
        
        console.log('🔄 CharacterSyncManager initialized');
    }

    /**
     * Initialize character sync when joining chat
     */
    initialize(playerName, sessionCode, isStoryTeller = false) {
        this.playerName = playerName;
        this.sessionCode = sessionCode;
        this.isStoryTeller = isStoryTeller;
        
        console.log(`🔄 Character sync initialized for ${playerName} (${isStoryTeller ? 'StoryTeller' : 'Player'})`);
        
        // Show connection notification for StoryTeller
        if (isStoryTeller && typeof showNotification === 'function') {
            showNotification('success', 'Character Sync Ready', 
                'Auto-import from players enabled', 
                'Player characters will automatically appear here');
        }
        
        // Auto-sync current character when joining
        if (!isStoryTeller) {
            this.announcePlayerCharacter();
        }
    }

    /**
     * Generate hash for character data (for change detection)
     */
    generateCharacterHash(character) {
        // Create a normalized version for hashing
        const normalized = {
            name: character.name,
            level: character.level || 1,
            class: character.class,
            race: character.race,
            stats: character.stats || {},
            skills: character.skills || [],
            equipment: character.equipment || [],
            achievements: character.achievements || [],
            hitPoints: character.hitPoints || character.hp || 0,
            lastModified: character.lastModified
        };
        
        // Simple hash function (could use crypto.subtle.digest for better hashing)
        const str = JSON.stringify(normalized, Object.keys(normalized).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Announce current character when joining session
     */
    async announcePlayerCharacter() {
        try {
            // Get current character from V4-network
            if (typeof getCurrentCharacter === 'function') {
                const character = getCurrentCharacter();
                if (character && character.name) {
                    const hash = this.generateCharacterHash(character);
                    
                    await this.sendCharacterAnnouncement(character.name, hash);
                    this.localCharacters.set(character.name, {
                        hash,
                        data: character,
                        lastSync: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('❌ Failed to announce character:', error);
        }
    }

    /**
     * Send character announcement via Supabase
     */
    async sendCharacterAnnouncement(characterName, characterHash) {
        const message = {
            type: 'character_announcement',
            character_name: characterName,
            character_hash: characterHash,
            player_name: this.playerName,
            timestamp: Date.now()
        };

        await this.sendSystemMessage(`CHAR_ANNOUNCE:${JSON.stringify(message)}`);
        console.log(`📢 Announced character: ${characterName} (${characterHash})`);
    }

    /**
     * Request character data from specific player
     */
    async requestCharacterData(characterName, fromPlayer) {
        const message = {
            type: 'character_request',
            character_name: characterName,
            from_player: this.playerName,
            to_player: fromPlayer,
            timestamp: Date.now()
        };

        await this.sendSystemMessage(`CHAR_REQUEST:${JSON.stringify(message)}`);
        
        // Track pending request
        this.syncRequests.set(characterName, {
            fromPlayer,
            timestamp: Date.now()
        });
        
        console.log(`📨 Requested character data: ${characterName} from ${fromPlayer}`);
    }

    /**
     * Send character data to requesting player
     */
    async sendCharacterData(characterName, toPlayer) {
        try {
            let character = null;
            
            // Get character data from V4-network or StoryTeller
            if (typeof getCurrentCharacter === 'function') {
                const current = getCurrentCharacter();
                if (current && current.name === characterName) {
                    character = current;
                }
            }
            
            // Fallback: get from character manager
            if (!character && typeof getCharacterById === 'function') {
                // Try to find by name in character list
                const characters = getAllCharacters ? getAllCharacters() : [];
                character = characters.find(c => c.name === characterName);
            }

            if (!character) {
                console.warn(`⚠️ Character not found: ${characterName}`);
                return;
            }

            // Prepare character for transmission
            const cleanCharacter = {
                ...character,
                id: undefined, // Remove ID to prevent conflicts
                lastModified: new Date().toISOString()
            };

            const message = {
                type: 'character_data',
                character_name: characterName,
                character_data: cleanCharacter,
                to_player: toPlayer,
                from_player: this.playerName,
                timestamp: Date.now()
            };

            await this.sendSystemMessage(`CHAR_DATA:${JSON.stringify(message)}`);
            console.log(`📤 Sent character data: ${characterName} to ${toPlayer}`);

        } catch (error) {
            console.error(`❌ Failed to send character data for ${characterName}:`, error);
        }
    }

    /**
     * Handle incoming character sync messages
     */
    async handleCharacterSyncMessage(messageText, senderName) {
        try {
            if (!messageText.includes('CHAR_')) return false;

            let message;
            if (messageText.startsWith('CHAR_ANNOUNCE:')) {
                message = JSON.parse(messageText.replace('CHAR_ANNOUNCE:', ''));
                await this.handleCharacterAnnouncement(message, senderName);
                return true;
            }
            
            if (messageText.startsWith('CHAR_REQUEST:')) {
                message = JSON.parse(messageText.replace('CHAR_REQUEST:', ''));
                await this.handleCharacterRequest(message, senderName);
                return true;
            }
            
            if (messageText.startsWith('CHAR_DATA:')) {
                message = JSON.parse(messageText.replace('CHAR_DATA:', ''));
                await this.handleCharacterData(message, senderName);
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Failed to handle character sync message:', error);
            return false;
        }
    }

    /**
     * Handle character announcement from another player
     */
    async handleCharacterAnnouncement(message, senderName) {
        const { character_name, character_hash, player_name, original_name, device_id } = message;
        
        // Use original name for display if available
        const displayName = original_name || character_name;
        const uniqueName = character_name; // This is already the unique device-scoped name
        
        console.log(`📢 Character announced: ${displayName} by ${player_name} (device: ${device_id || 'unknown'}) as ${uniqueName} (${character_hash})`);

        // Only StoryTeller processes character announcements
        if (!this.isStoryTeller) return;

        // Check if we already have this unique character (device-scoped)
        const existingCharacter = await this.getStoredCharacter(uniqueName);
        
        if (!existingCharacter) {
            // We don't have this character, request it
            console.log(`📥 New character detected: ${displayName} from device ${device_id || 'unknown'}, requesting data`);
            await this.requestCharacterData(uniqueName, player_name);
        } else {
            // Check if our version is up to date
            const existingHash = this.generateCharacterHash(existingCharacter);
            
            if (existingHash !== character_hash) {
                console.log(`🔄 Character update detected: ${displayName}, requesting latest data`);
                await this.requestCharacterData(uniqueName, player_name);
            } else {
                console.log(`✅ Character up to date: ${displayName} (${uniqueName})`);
            }
        }
    }

    /**
     * Handle character data request
     */
    async handleCharacterRequest(message, senderName) {
        const { character_name, from_player, to_player } = message;
        
        // Only respond if the request is for us
        if (to_player !== this.playerName) return;
        
        console.log(`📨 Character data requested: ${character_name} by ${from_player}`);
        await this.sendCharacterData(character_name, from_player);
    }

    /**
     * Handle incoming character data
     */
    async handleCharacterData(message, senderName) {
        const { character_name, character_data, to_player, from_player, original_name, device_id } = message;
        
        // Only process if the data is for us
        if (to_player !== this.playerName) return;
        
        const displayName = original_name || character_name;
        const uniqueName = character_name; // This is the device-scoped unique name
        
        console.log(`📥 Received character data: ${displayName} (${uniqueName}) from ${from_player} (device: ${device_id || 'unknown'})`);

        try {
            // Import character using existing system
            if (window.CharacterImportProfile) {
                const importProfile = new window.CharacterImportProfile();
                
                // Use the unique name for storage but preserve original name for display
                const characterToImport = {
                    ...character_data,
                    name: uniqueName, // Store with unique name to prevent conflicts
                    displayName: displayName, // Keep original name for UI display
                    originalName: original_name, // Preserve original
                    deviceId: device_id, // Track source device
                    syncedFrom: from_player, // Track source player
                    syncTimestamp: Date.now()
                };
                
                const normalized = importProfile.normalizeCharacter(characterToImport);
                
                // Import to StoryTeller
                if (window.storyTellerPlayersPanel) {
                    const success = window.storyTellerPlayersPanel.importCharacter(normalized);
                    
                    if (success) {
                        // Store for future hash comparisons using unique name
                        const hash = this.generateCharacterHash(normalized);
                        this.localCharacters.set(uniqueName, {
                            hash,
                            data: normalized,
                            lastSync: Date.now(),
                            originalName: displayName,
                            deviceId: device_id
                        });

                        // Show success notification with display name
                        this.showCharacterSyncNotification(normalized, from_player, displayName);
                        
                        // Clear pending request
                        this.syncRequests.delete(uniqueName);
                        
                        console.log(`✅ Character imported: ${displayName} as ${uniqueName} from device ${device_id || 'unknown'}`);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Failed to import character ${displayName}:`, error);
        }
    }

    /**
     * Get stored character (from StoryTeller's storage)
     */
    async getStoredCharacter(characterName) {
        try {
            if (window.storageManager && window.storageManager.getAllCharacters) {
                const characters = await window.storageManager.getAllCharacters();
                return characters.find(c => c.name === characterName);
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to get stored character:', error);
            return null;
        }
    }

    /**
     * Send system message via Supabase
     */
    async sendSystemMessage(messageText) {
        if (typeof sendSystemMessage === 'function') {
            await sendSystemMessage(messageText);
        } else if (typeof sendChatMessageAsync === 'function') {
            await sendChatMessageAsync(messageText);
        } else {
            console.warn('⚠️ No message sending function available');
        }
    }

    /**
     * Show character sync notification
     */
    showCharacterSyncNotification(character, fromPlayer, displayName = null) {
        const level = character.level || 1;
        const className = character.class || 'Unknown';
        const race = character.race || 'Unknown';
        const charName = displayName || character.displayName || character.originalName || character.name;

        if (typeof showNotification === 'function') {
            showNotification('success', 'Character Synced', 
                `${charName} (Level ${level} ${race} ${className})`,
                `Automatically received from ${fromPlayer}${character.deviceId ? ' (device: ' + character.deviceId + ')' : ''}`);
        }

        // Also add to chat if available
        if (typeof window.addMessage === 'function') {
            window.addMessage('System', 
                `📥 Character synced: ${charName} from ${fromPlayer}${character.deviceId ? ' (device: ' + character.deviceId + ')' : ''}`, 
                'system');
        }
    }

    /**
     * Trigger character sync when character changes in V4-network
     */
    async onCharacterUpdate(character) {
        if (!character || !character.name) return;

        const hash = this.generateCharacterHash(character);
        const stored = this.localCharacters.get(character.name);

        // If hash changed, announce the update
        if (!stored || stored.hash !== hash) {
            console.log(`🔄 Character changed: ${character.name}, announcing update`);
            
            await this.sendCharacterAnnouncement(character.name, hash);
            this.localCharacters.set(character.name, {
                hash,
                data: character,
                lastSync: Date.now()
            });
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            playerName: this.playerName,
            sessionCode: this.sessionCode,
            isStoryTeller: this.isStoryTeller,
            localCharacters: this.localCharacters.size,
            pendingRequests: this.syncRequests.size,
            characterList: Array.from(this.localCharacters.keys()),
            debugMode: this.debugMode
        };
    }

    /**
     * Manual test functions for debugging
     */
    testConnection() {
        console.log('🧪 Testing Character Sync Manager');
        console.log('Status:', this.getStatus());
        
        if (this.sessionCode) {
            console.log('✅ Connected to session:', this.sessionCode);
        } else {
            console.log('❌ Not connected to any session');
        }
        
        if (this.isStoryTeller) {
            console.log('👑 Running as StoryTeller (will receive characters)');
        } else {
            console.log('🎭 Running as Player (will send characters)');
        }
    }
}

// ========================================
// GLOBAL INITIALIZATION
// ========================================
window.characterSyncManager = new CharacterSyncManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterSyncManager;
}
