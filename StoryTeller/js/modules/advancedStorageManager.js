/**
 * Advanced Storage Manager for DCC StoryTeller
 * Handles localStorage, IndexedDB, and Cordova storage
 * Includes compression and quota management
 */

class AdvancedStorageManager {
    constructor() {
        this.dbName = 'DCCStoryTeller';
        this.dbVersion = 1;
        this.db = null;
        this.isIndexedDBAvailable = false;
        this.isCordova = false;
        this.compressionEnabled = true;
        
        this.init();
    }

    async init() {
        // Detect environment
        this.isCordova = !!(window.cordova || window.PhoneGap || window.phonegap);
        
        // Check IndexedDB availability
        this.isIndexedDBAvailable = !!(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
        
        console.log('🗄️ Storage Manager initialized:', {
            isCordova: this.isCordova,
            isIndexedDBAvailable: this.isIndexedDBAvailable,
            compressionEnabled: this.compressionEnabled
        });

        // Initialize IndexedDB if available
        if (this.isIndexedDBAvailable) {
            await this.initIndexedDB();
        }

        // Monitor storage usage
        this.monitorStorageUsage();
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ IndexedDB initialization failed:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores for different data types
                if (!db.objectStoreNames.contains('notes')) {
                    db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('npcs')) {
                    db.createObjectStore('npcs', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('rollHistory')) {
                    db.createObjectStore('rollHistory', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('largeData')) {
                    db.createObjectStore('largeData', { keyPath: 'key' });
                }
                
                console.log('🏗️ IndexedDB object stores created');
            };
        });
    }

    // Compression utilities
    compress(text) {
        if (!this.compressionEnabled || typeof text !== 'string') return text;
        
        try {
            // Simple LZ-string style compression
            const compressed = this.lzCompress(text);
            const compressionRatio = compressed.length / text.length;
            
            // Only use compressed version if it's significantly smaller
            if (compressionRatio < 0.8) {
                console.log(`📦 Compressed data: ${text.length} → ${compressed.length} bytes (${Math.round(compressionRatio * 100)}%)`);
                return { compressed: true, data: compressed };
            }
        } catch (error) {
            console.warn('⚠️ Compression failed, using original data:', error);
        }
        
        return { compressed: false, data: text };
    }

    decompress(data) {
        if (!data || typeof data !== 'object') return data;
        if (!data.compressed) return data.data;
        
        try {
            return this.lzDecompress(data.data);
        } catch (error) {
            console.error('❌ Decompression failed:', error);
            return data.data; // Return compressed data as fallback
        }
    }

    // Simple LZ-style compression (you could use a library like LZ-string for better compression)
    lzCompress(str) {
        const dictionary = {};
        let data = (str + "").split("");
        let out = [];
        let currChar;
        let phrase = data[0];
        let code = 256;
        
        for (let i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dictionary[phrase + currChar] != null) {
                phrase += currChar;
            } else {
                out.push(phrase.length > 1 ? dictionary[phrase] : phrase.charCodeAt(0));
                dictionary[phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dictionary[phrase] : phrase.charCodeAt(0));
        
        return out.join(',');
    }

    lzDecompress(str) {
        const dictionary = {};
        let data = str.split(',').map(Number);
        let currChar = String.fromCharCode(data[0]);
        let oldPhrase = currChar;
        let out = [currChar];
        let code = 256;
        let phrase;
        
        for (let i = 1; i < data.length; i++) {
            let currCode = data[i];
            if (currCode < 256) {
                phrase = String.fromCharCode(data[i]);
            } else {
                phrase = dictionary[currCode] ? dictionary[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dictionary[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        
        return out.join("");
    }

    // Storage method selection
    getStorageMethod(key, dataSize = 0) {
        // Large data (>100KB) goes to IndexedDB
        if (dataSize > 100000 && this.isIndexedDBAvailable) {
            return 'indexeddb';
        }
        
        // Check localStorage availability and space
        try {
            const currentUsage = this.getLocalStorageUsage();
            if (currentUsage.percentage > 80) {
                if (this.isIndexedDBAvailable) {
                    return 'indexeddb';
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not check localStorage usage:', error);
        }
        
        return 'localstorage';
    }

    // Universal storage methods
    async setItem(key, value, options = {}) {
        const dataString = JSON.stringify(value);
        const dataSize = new Blob([dataString]).size;
        const storageMethod = options.forceMethod || this.getStorageMethod(key, dataSize);
        
        console.log(`💾 Storing ${key} (${dataSize} bytes) using ${storageMethod}`);
        
        try {
            if (storageMethod === 'indexeddb' && this.isIndexedDBAvailable) {
                return await this.setIndexedDBItem(key, value);
            } else {
                return this.setLocalStorageItem(key, value);
            }
        } catch (error) {
            console.error(`❌ Failed to store ${key}:`, error);
            
            // Fallback: try the other method
            if (storageMethod === 'indexeddb') {
                console.log('🔄 Falling back to localStorage...');
                return this.setLocalStorageItem(key, value);
            } else if (this.isIndexedDBAvailable) {
                console.log('🔄 Falling back to IndexedDB...');
                return await this.setIndexedDBItem(key, value);
            }
            
            throw error;
        }
    }

    async getItem(key) {
        try {
            // Try localStorage first (faster)
            const localValue = this.getLocalStorageItem(key);
            if (localValue !== null) {
                return localValue;
            }
            
            // Try IndexedDB
            if (this.isIndexedDBAvailable) {
                return await this.getIndexedDBItem(key);
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Failed to retrieve ${key}:`, error);
            return null;
        }
    }

    // localStorage methods
    setLocalStorageItem(key, value) {
        const compressed = this.compress(JSON.stringify(value));
        localStorage.setItem(key, JSON.stringify(compressed));
        return true;
    }

    getLocalStorageItem(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            const decompressed = this.decompress(parsed);
            return JSON.parse(decompressed);
        } catch (error) {
            console.warn(`⚠️ Failed to parse localStorage item ${key}:`, error);
            return null;
        }
    }

    // IndexedDB methods
    async setIndexedDBItem(key, value) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['largeData'], 'readwrite');
            const store = transaction.objectStore('largeData');
            
            const compressed = this.compress(JSON.stringify(value));
            const request = store.put({ 
                key: key, 
                value: compressed,
                timestamp: Date.now()
            });
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getIndexedDBItem(key) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['largeData'], 'readonly');
            const store = transaction.objectStore('largeData');
            const request = store.get(key);
            
            request.onsuccess = () => {
                if (request.result) {
                    try {
                        const decompressed = this.decompress(request.result.value);
                        resolve(JSON.parse(decompressed));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Storage monitoring and cleanup
    getLocalStorageUsage() {
        if (!window.localStorage) return { used: 0, total: 0, percentage: 0 };
        
        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }
        
        // Estimate total available (browsers vary, but ~5-10MB is common)
        const estimated = 5 * 1024 * 1024; // 5MB estimate
        
        return {
            used: used,
            total: estimated,
            percentage: Math.round((used / estimated) * 100),
            usedMB: (used / (1024 * 1024)).toFixed(2),
            totalMB: (estimated / (1024 * 1024)).toFixed(2)
        };
    }

    monitorStorageUsage() {
        const usage = this.getLocalStorageUsage();
        
        console.log(`📊 Storage Usage: ${usage.usedMB}MB / ${usage.totalMB}MB (${usage.percentage}%)`);
        
        if (usage.percentage > 80) {
            console.warn(`⚠️ Storage usage high: ${usage.percentage}%`);
            this.suggestCleanup();
        }
        
        if (usage.percentage > 95) {
            console.error(`🚨 Storage critically full: ${usage.percentage}%`);
            this.emergencyCleanup();
        }
    }

    suggestCleanup() {
        console.log('💡 Consider cleaning up old data or moving to IndexedDB');
        
        // Could show user notification here
        if (window.addChatMessage) {
            window.addChatMessage('⚠️ Storage getting full. Consider cleaning up old notes or NPCs.', 'system');
        }
    }

    async emergencyCleanup() {
        console.log('🧹 Performing emergency cleanup...');
        
        // Move large items to IndexedDB
        const largKeys = [];
        for (let key in localStorage) {
            if (localStorage[key].length > 50000) { // >50KB
                largKeys.push(key);
            }
        }
        
        for (const key of largKeys) {
            try {
                const value = this.getLocalStorageItem(key);
                await this.setIndexedDBItem(key, value);
                localStorage.removeItem(key);
                console.log(`📦 Moved ${key} to IndexedDB`);
            } catch (error) {
                console.error(`❌ Failed to move ${key}:`, error);
            }
        }
    }

    // Utility methods
    async removeItem(key) {
        localStorage.removeItem(key);
        
        if (this.isIndexedDBAvailable && this.db) {
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['largeData'], 'readwrite');
                const store = transaction.objectStore('largeData');
                const request = store.delete(key);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        }
    }

    async clear() {
        localStorage.clear();
        
        if (this.isIndexedDBAvailable && this.db) {
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['largeData'], 'readwrite');
                const store = transaction.objectStore('largeData');
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        }
    }

    // Get storage statistics
    async getStorageStats() {
        const localStorage = this.getLocalStorageUsage();
        const stats = {
            localStorage: localStorage,
            indexedDB: { supported: this.isIndexedDBAvailable },
            cordova: { detected: this.isCordova }
        };

        if (this.isIndexedDBAvailable && this.db) {
            // Count IndexedDB items
            try {
                const transaction = this.db.transaction(['largeData'], 'readonly');
                const store = transaction.objectStore('largeData');
                const countRequest = store.count();
                
                stats.indexedDB.itemCount = await new Promise((resolve) => {
                    countRequest.onsuccess = () => resolve(countRequest.result);
                    countRequest.onerror = () => resolve(0);
                });
            } catch (error) {
                stats.indexedDB.itemCount = 0;
            }
        }

        return stats;
    }
}

// Create global instance
window.advancedStorageManager = new AdvancedStorageManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedStorageManager;
}
