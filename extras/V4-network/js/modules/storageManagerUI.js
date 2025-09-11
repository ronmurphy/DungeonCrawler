/**
 * Storage Management UI
 * Provides user interface for monitoring and managing storage
 */

class StorageManagerUI {
    constructor() {
        this.isOpen = false;
    }

    showStorageManager() {
        if (this.isOpen) return;
        this.isOpen = true;

        this.createStorageModal();
    }

    async createStorageModal() {
        const modal = document.createElement('div');
        modal.className = 'storage-manager-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background: var(--bg-primary);
            border-radius: 8px;
            padding: 20px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
        `;

        // Get storage statistics
        const stats = await this.getStorageStatistics();
        
        container.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: var(--text-primary);">🗄️ Storage Manager</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-secondary); margin: 0 0 10px 0;">📊 Storage Usage</h4>
                
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>localStorage:</span>
                        <span>${stats.localStorage.usedMB}MB / ${stats.localStorage.totalMB}MB</span>
                    </div>
                    <div style="width: 100%; height: 20px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden;">
                        <div style="height: 100%; background: ${this.getUsageColor(stats.localStorage.percentage)}; width: ${Math.min(stats.localStorage.percentage, 100)}%; transition: width 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-tertiary); margin-top: 2px;">${stats.localStorage.percentage}% used</div>
                </div>

                ${stats.indexedDB.supported ? `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>IndexedDB:</span>
                            <span>${stats.indexedDB.itemCount || 0} items stored</span>
                        </div>
                        <div style="font-size: 0.8em; color: var(--text-tertiary);">✅ Available for large data storage</div>
                    </div>
                ` : `
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--warning); font-size: 0.9em;">⚠️ IndexedDB not available</div>
                    </div>
                `}

                ${stats.cordova.detected ? `
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--success); font-size: 0.9em;">📱 Cordova app detected</div>
                    </div>
                ` : ''}
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-secondary); margin: 0 0 10px 0;">🧹 Storage Actions</h4>
                
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <button onclick="window.storageManagerUI.migrateToIndexedDB()" 
                            style="background: var(--primary); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                        📦 Move Large Data to IndexedDB
                    </button>
                    
                    <button onclick="window.storageManagerUI.cleanupOldData()" 
                            style="background: var(--warning); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                        🧹 Clean Old Data
                    </button>
                    
                    <button onclick="window.storageManagerUI.exportData()" 
                            style="background: var(--success); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                        💾 Export Data
                    </button>
                    
                    <button onclick="window.storageManagerUI.refreshStats()" 
                            style="background: var(--secondary); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                        🔄 Refresh Stats
                    </button>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-secondary); margin: 0 0 10px 0;">📋 Data Items</h4>
                <div id="storage-items-list" style="max-height: 200px; overflow-y: auto; font-size: 0.85em;">
                    ${this.generateItemsList(stats)}
                </div>
            </div>

            <div style="text-align: right;">
                <button onclick="window.storageManagerUI.closeModal()" 
                        style="background: var(--accent-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Close
                </button>
            </div>
        `;

        modal.appendChild(container);
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async getStorageStatistics() {
        if (window.advancedStorageManager) {
            return await window.advancedStorageManager.getStorageStats();
        } else {
            // Fallback for basic localStorage stats
            const localStorage = this.getBasicLocalStorageStats();
            return {
                localStorage: localStorage,
                indexedDB: { supported: false },
                cordova: { detected: false }
            };
        }
    }

    getBasicLocalStorageStats() {
        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }
        
        const estimated = 5 * 1024 * 1024; // 5MB estimate
        
        return {
            used: used,
            total: estimated,
            percentage: Math.round((used / estimated) * 100),
            usedMB: (used / (1024 * 1024)).toFixed(2),
            totalMB: (estimated / (1024 * 1024)).toFixed(2)
        };
    }

    getUsageColor(percentage) {
        if (percentage < 50) return '#4CAF50'; // Green
        if (percentage < 80) return '#FF9800'; // Orange
        return '#F44336'; // Red
    }

    generateItemsList(stats) {
        let html = '<div style="display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center;">';
        
        // List localStorage items
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length;
                const sizeMB = (size / (1024 * 1024)).toFixed(3);
                const isLarge = size > 50000;
                
                html += `
                    <span style="color: var(--text-primary);">${key}</span>
                    <span style="color: var(--text-secondary); font-size: 0.8em;">${sizeMB}MB</span>
                    <span style="color: ${isLarge ? 'var(--warning)' : 'var(--text-tertiary)'}; font-size: 0.8em;">
                        ${isLarge ? '⚠️ Large' : '✓'}
                    </span>
                `;
            }
        }
        
        html += '</div>';
        return html;
    }

    async migrateToIndexedDB() {
        if (!window.advancedStorageManager) {
            alert('❌ Advanced storage manager not available');
            return;
        }

        if (window.storageMigration) {
            await window.storageMigration.runMigration();
            this.refreshStats();
            if (window.addChatMessage) {
                window.addChatMessage('📦 Migration to IndexedDB completed', 'system');
            }
        }
    }

    async cleanupOldData() {
        if (!confirm('🧹 This will remove old roll history and compress large data. Continue?')) {
            return;
        }

        if (window.storageMigration) {
            await window.storageMigration.emergencyCleanup();
            this.refreshStats();
            if (window.addChatMessage) {
                window.addChatMessage('🧹 Data cleanup completed', 'system');
            }
        }
    }

    async exportData() {
        try {
            const data = {};
            
            // Export localStorage data
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    try {
                        data[key] = JSON.parse(localStorage[key]);
                    } catch (e) {
                        data[key] = localStorage[key];
                    }
                }
            }

            // Create download
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `dcc-storyteller-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            if (window.addChatMessage) {
                window.addChatMessage('💾 Data exported successfully', 'system');
            }
        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('❌ Export failed: ' + error.message);
        }
    }

    async refreshStats() {
        const itemsList = document.getElementById('storage-items-list');
        if (itemsList) {
            const stats = await this.getStorageStatistics();
            itemsList.innerHTML = this.generateItemsList(stats);
        }
        
        // Re-create the modal with updated stats
        this.closeModal();
        setTimeout(() => this.showStorageManager(), 100);
    }

    closeModal() {
        const modal = document.querySelector('.storage-manager-modal');
        if (modal) {
            modal.remove();
        }
        this.isOpen = false;
    }
}

// Create global instance
window.storageManagerUI = new StorageManagerUI();

// Add to settings menu or create shortcut
document.addEventListener('DOMContentLoaded', () => {
    // Add storage manager button to UI after a delay
    setTimeout(() => {
        // You can add this to your existing settings panel
        if (window.addChatMessage) {
            window.addChatMessage('🗄️ Storage Manager loaded. Type "storage" to access.', 'system');
        }
    }, 2000);
});

// Command to open storage manager
if (window.addEventListener) {
    window.addEventListener('keydown', (e) => {
        // Ctrl+Shift+S to open storage manager
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            window.storageManagerUI.showStorageManager();
        }
    });
}
