// Unified IndexedDB Storage Manager
// Handles maps, notes, and other StoryTeller data in one database

class UnifiedStorageDB {
    constructor() {
        this.dbName = 'StoryTellerData';
        this.version = 2; // Increment version to add private messages store
        this.stores = {
            maps: 'maps',
            notes: 'notes',
            settings: 'settings',
            privateMessages: 'privateMessages'
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
                
                // Create private messages store
                if (!db.objectStoreNames.contains(this.stores.privateMessages)) {
                    const privateMessagesStore = db.createObjectStore(this.stores.privateMessages, { keyPath: 'id' });
                    privateMessagesStore.createIndex('sender', 'sender', { unique: false });
                    privateMessagesStore.createIndex('recipient', 'recipient', { unique: false });
                    privateMessagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    privateMessagesStore.createIndex('session', 'session', { unique: false });
                    console.log('💬 Created private messages object store');
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

    // Private Messages methods
    async savePrivateMessage(messageData) {
        // Ensure the message has an ID and timestamp
        if (!messageData.id) {
            messageData.id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        if (!messageData.timestamp) {
            messageData.timestamp = new Date().toISOString();
        }
        return this.save(this.stores.privateMessages, messageData);
    }

    async getPrivateMessage(id) {
        return this.get(this.stores.privateMessages, id);
    }

    async getAllPrivateMessages() {
        return this.getAll(this.stores.privateMessages);
    }

    async deletePrivateMessage(id) {
        return this.delete(this.stores.privateMessages, id);
    }

    async getPrivateMessagesByRecipient(recipient) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.privateMessages], 'readonly');
            const store = transaction.objectStore(this.stores.privateMessages);
            const index = store.index('recipient');
            const request = index.getAll(recipient);

            request.onerror = () => {
                console.error('❌ Failed to get private messages by recipient:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async getPrivateMessagesBySession(sessionCode) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.privateMessages], 'readonly');
            const store = transaction.objectStore(this.stores.privateMessages);
            const index = store.index('session');
            const request = index.getAll(sessionCode);

            request.onerror = () => {
                console.error('❌ Failed to get private messages by session:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
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
        
        // Migrate private messages
        try {
            const privateMessagesData = localStorage.getItem('storyteller_private_messages');
            if (privateMessagesData) {
                const messages = JSON.parse(privateMessagesData);
                for (const message of messages) {
                    await this.savePrivateMessage(message);
                }
                console.log('✅ Migrated private messages from localStorage');
                // localStorage.removeItem('storyteller_private_messages'); // Uncomment to remove after migration
            }
        } catch (error) {
            console.error('❌ Failed to migrate private messages:', error);
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
}

// Export for use globally
window.UnifiedStorageDB = UnifiedStorageDB;
