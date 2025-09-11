/**
 * IndexedDB Storage Manager for GitHub API Tokens
 * Handles secure storage of API tokens and configuration data
 */
class GitHubTokenStorage {
    constructor() {
        this.dbName = 'DCCImageHosting';
        this.dbVersion = 1;
        this.storeName = 'tokens';
        this.db = null;
    }

    /**
     * Initialize the IndexedDB database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ GitHub Token Storage initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for tokens
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    console.log('📦 Created tokens object store');
                }
            };
        });
    }

    /**
     * Store GitHub API token
     */
    async storeToken(token) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const tokenData = {
                key: 'github_api_token',
                value: token,
                timestamp: Date.now()
            };

            const request = store.put(tokenData);

            request.onsuccess = () => {
                console.log('🔑 GitHub API token stored in IndexedDB');
                resolve(token);
            };

            request.onerror = () => {
                console.error('Failed to store token:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Retrieve GitHub API token
     */
    async getToken() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('github_api_token');

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    console.log('🔑 GitHub API token retrieved from IndexedDB');
                    resolve(result.value);
                } else {
                    // Fallback to localStorage for migration
                    const localToken = localStorage.getItem('github_api_token');
                    if (localToken) {
                        console.log('🔄 Migrating token from localStorage to IndexedDB');
                        this.storeToken(localToken).then(() => {
                            localStorage.removeItem('github_api_token');
                            resolve(localToken);
                        });
                    } else {
                        resolve(null);
                    }
                }
            };

            request.onerror = () => {
                console.error('Failed to retrieve token:', request.error);
                // Fallback to localStorage
                const localToken = localStorage.getItem('github_api_token');
                if (localToken) {
                    console.log('🔄 Fallback to localStorage');
                    resolve(localToken);
                } else {
                    reject(request.error);
                }
            };
        });
    }

    /**
     * Remove GitHub API token
     */
    async removeToken() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete('github_api_token');

            request.onsuccess = () => {
                console.log('🗑️ GitHub API token removed from IndexedDB');
                localStorage.removeItem('github_api_token'); // Also clean localStorage
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to remove token:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Check if token exists
     */
    async hasToken() {
        try {
            const token = await this.getToken();
            return !!token;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
window.githubTokenStorage = new GitHubTokenStorage();

// Auto-initialize when script loads
window.githubTokenStorage.init().catch(error => {
    console.warn('⚠️ IndexedDB initialization failed, falling back to localStorage:', error);
});
