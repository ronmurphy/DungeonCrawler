// Unified IndexedDB Storage Manager
// Handles maps, notes, and other StoryTeller data in one database

class UnifiedStorageDB {
    constructor() {
        this.dbName = 'StoryTellerData';
        this.version = 2; // Increased version to handle existing databases
        this.stores = {
            maps: 'maps',
            notes: 'notes',
            settings: 'settings',
            characters: 'characters'
        };
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ Failed to open Unified IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Unified IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create maps store
                if (!db.objectStoreNames.contains(this.stores.maps)) {
                    const mapsStore = db.createObjectStore(this.stores.maps, { keyPath: 'id' });
                    mapsStore.createIndex('name', 'name', { unique: false });
                    mapsStore.createIndex('created', 'created', { unique: false });
                    mapsStore.createIndex('modified', 'modified', { unique: false });
                    mapsStore.createIndex('tileset', 'tileset', { unique: false });
                    console.log('🗺️ Created maps object store');
                }
                
                // Create notes store
                if (!db.objectStoreNames.contains(this.stores.notes)) {
                    const notesStore = db.createObjectStore(this.stores.notes, { keyPath: 'id' });
                    notesStore.createIndex('title', 'title', { unique: false });
                    notesStore.createIndex('created', 'created', { unique: false });
                    notesStore.createIndex('modified', 'modified', { unique: false });
                    notesStore.createIndex('priority', 'priority', { unique: false });
                    console.log('📝 Created notes object store');
                }
                
                // Create settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    const settingsStore = db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                    console.log('⚙️ Created settings object store');
                }
                
                // Create characters store
                if (!db.objectStoreNames.contains(this.stores.characters)) {
                    const charactersStore = db.createObjectStore(this.stores.characters, { keyPath: 'id' });
                    charactersStore.createIndex('name', 'name', { unique: false });
                    charactersStore.createIndex('lastModified', 'lastModified', { unique: false });
                    console.log('👤 Created characters object store');
                }
            };
        });
    }

    // Generic save method
    async save(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onerror = () => {
                console.error(`❌ Failed to save to ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log(`💾 Saved to ${storeName}:`, data.id || data.key);
                resolve(data.id || data.key);
            };
        });
    }

    // Generic get method
    async get(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onerror = () => {
                console.error(`❌ Failed to get from ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    // Generic get all method
    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error(`❌ Failed to get all from ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result || []);
            };
        });
    }

    // Generic getAll method
    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error(`❌ Failed to get all from ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log(`📋 Retrieved all from ${storeName}:`, request.result.length);
                resolve(request.result);
            };
        });
    }

    // Generic delete method
    async delete(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onerror = () => {
                console.error(`❌ Failed to delete from ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log(`🗑️ Deleted from ${storeName}:`, id);
                resolve();
            };
        });
    }

    // Clear all data from a store
    async clear(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => {
                console.error(`❌ Failed to clear ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log(`🧹 Cleared all from ${storeName}`);
                resolve();
            };
        });
    }

    // Map-specific methods
    async saveMap(mapData) {
        return this.save(this.stores.maps, mapData);
    }

    async getMap(mapId) {
        return this.get(this.stores.maps, mapId);
    }

    async getAllMaps() {
        return this.getAll(this.stores.maps);
    }

    async deleteMap(mapId) {
        return this.delete(this.stores.maps, mapId);
    }

    // Note-specific methods
    async saveNote(noteData) {
        return this.save(this.stores.notes, noteData);
    }

    async getNote(noteId) {
        return this.get(this.stores.notes, noteId);
    }

    async getAllNotes() {
        return this.getAll(this.stores.notes);
    }

    async deleteNote(noteId) {
        return this.delete(this.stores.notes, noteId);
    }

    // Settings-specific methods
    async saveSetting(key, value) {
        return this.save(this.stores.settings, { key, value });
    }

    async getSetting(key) {
        const result = await this.get(this.stores.settings, key);
        return result ? result.value : null;
    }

    // Migration from localStorage
    async migrateFromLocalStorage() {
        console.log('🔄 Starting migration from localStorage...');
        
        // Migrate maps
        try {
            const mapsData = localStorage.getItem('storyteller_saved_maps');
            if (mapsData) {
                const maps = JSON.parse(mapsData);
                for (const [id, mapData] of Object.entries(maps)) {
                    await this.saveMap({ id, ...mapData });
                }
                console.log('✅ Migrated maps from localStorage');
                // localStorage.removeItem('storyteller_saved_maps'); // Uncomment to remove after migration
            }
        } catch (error) {
            console.error('❌ Failed to migrate maps:', error);
        }
        
        // Migrate notes (if notes manager exists)
        try {
            const notesData = localStorage.getItem('storyteller_notes');
            if (notesData) {
                const notes = JSON.parse(notesData);
                for (const [id, noteData] of Object.entries(notes)) {
                    await this.saveNote({ id, ...noteData });
                }
                console.log('✅ Migrated notes from localStorage');
                // localStorage.removeItem('storyteller_notes'); // Uncomment to remove after migration
            }
        } catch (error) {
            console.error('❌ Failed to migrate notes:', error);
        }
    }

    // Get storage usage stats
    async getStorageStats() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return { used: 'Unknown', quota: 'Unknown' };
        }

        try {
            const estimate = await navigator.storage.estimate();
            return {
                used: this.formatBytes(estimate.usage || 0),
                quota: this.formatBytes(estimate.quota || 0),
                usedBytes: estimate.usage || 0,
                quotaBytes: estimate.quota || 0,
                percentUsed: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
            };
        } catch (error) {
            console.error('Failed to get storage estimate:', error);
            return { used: 'Error', quota: 'Error' };
        }
    }

    // Format bytes for display
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // CHARACTER-SPECIFIC METHODS (SAFE - WON'T INTERFERE WITH EXISTING SYSTEM)
    
    /**
     * Save all characters array (compatible with existing wasteland_characters format)
     * This is ADDITIVE - existing advancedStorageManager still works
     */
    async saveCharacters(charactersArray) {
        if (!Array.isArray(charactersArray)) {
            throw new Error('Characters must be an array');
        }
        
        try {
            // Save each character individually to the characters store
            for (const character of charactersArray) {
                if (character.id) {
                    await this.save(this.stores.characters, {
                        ...character,
                        lastModified: new Date().toISOString()
                    });
                }
            }
            
            // ALSO save to settings store as 'wasteland_characters' for compatibility
            await this.save(this.stores.settings, {
                key: 'wasteland_characters',
                value: charactersArray,
                lastModified: new Date().toISOString()
            });
            
            console.log(`✅ Saved ${charactersArray.length} characters to unified storage`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save characters to unified storage:', error);
            return false;
        }
    }

    /**
     * Load all characters array (compatible with existing wasteland_characters format)
     * This provides a fallback/alternative to advancedStorageManager
     */
    async loadCharacters() {
        try {
            // Try to get from settings store first (wasteland_characters key)
            const settingsData = await this.get(this.stores.settings, 'wasteland_characters');
            if (settingsData && Array.isArray(settingsData.value)) {
                console.log(`📥 Loaded ${settingsData.value.length} characters from unified storage (settings)`);
                return settingsData.value;
            }
            
            // Fallback: get all from characters store
            const allCharacters = await this.getAll(this.stores.characters);
            if (allCharacters && allCharacters.length > 0) {
                console.log(`📥 Loaded ${allCharacters.length} characters from unified storage (characters store)`);
                return allCharacters;
            }
            
            console.log('📥 No characters found in unified storage');
            return [];
        } catch (error) {
            console.error('❌ Failed to load characters from unified storage:', error);
            return [];
        }
    }
}

// Export for use globally
window.UnifiedStorageDB = UnifiedStorageDB;

// Create global instance for character storage (SAFE - DOESN'T INTERFERE WITH EXISTING)
window.unifiedStorage = new UnifiedStorageDB();

// Initialize when DOM is ready (SAFE)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unifiedStorage.init().catch(console.error);
    });
} else {
    window.unifiedStorage.init().catch(console.error);
}
