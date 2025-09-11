// IndexedDB Maps Storage Manager
// Replaces localStorage for better capacity and mobile app compatibility

class MapsStorageDB {
    constructor() {
        this.dbName = 'StoryTellerMaps';
        this.version = 1;
        this.storeName = 'maps';
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                    store.createIndex('modified', 'modified', { unique: false });
                    console.log('🏗️ Created maps object store');
                }
            };
        });
    }

    // Save a map to IndexedDB
    async saveMap(mapData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(mapData);

            request.onerror = () => {
                console.error('❌ Failed to save map:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('💾 Map saved to IndexedDB:', mapData.id);
                resolve(mapData.id);
            };
        });
    }

    // Get a specific map from IndexedDB
    async getMap(mapId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(mapId);

            request.onerror = () => {
                console.error('❌ Failed to get map:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    // Get all maps from IndexedDB
    async getAllMaps() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error('❌ Failed to get all maps:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('📋 Retrieved all maps from IndexedDB:', request.result.length);
                resolve(request.result);
            };
        });
    }

    // Delete a map from IndexedDB
    async deleteMap(mapId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(mapId);

            request.onerror = () => {
                console.error('❌ Failed to delete map:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('🗑️ Map deleted from IndexedDB:', mapId);
                resolve();
            };
        });
    }

    // Clear all maps (for testing/reset)
    async clearAllMaps() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => {
                console.error('❌ Failed to clear maps:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('🧹 All maps cleared from IndexedDB');
                resolve();
            };
        });
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
                quotaBytes: estimate.quota || 0
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

// Export for use in maps manager
window.MapsStorageDB = MapsStorageDB;
