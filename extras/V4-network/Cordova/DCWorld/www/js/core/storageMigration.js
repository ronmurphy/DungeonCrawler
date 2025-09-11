/**
 * Storage Migration Helper
 * Migrates existing localStorage data to the new AdvancedStorageManager
 */

class StorageMigration {
    constructor() {
        this.migrationKey = 'dcc-storage-migration-v1';
        this.largeDataKeys = [
            'storyteller_notes',
            'storyteller_saved_npcs', 
            'storyteller_roll_history',
            'storyteller_saved_rolls'
        ];
    }

    async runMigration() {
        // Check if migration already completed
        if (localStorage.getItem(this.migrationKey)) {
            console.log('✅ Storage migration already completed');
            return;
        }

        console.log('🔄 Starting storage migration...');

        try {
            await this.migrateToAdvancedStorage();
            localStorage.setItem(this.migrationKey, JSON.stringify({
                completed: true,
                timestamp: Date.now(),
                version: 1
            }));
            console.log('✅ Storage migration completed successfully');
        } catch (error) {
            console.error('❌ Storage migration failed:', error);
        }
    }

    async migrateToAdvancedStorage() {
        if (!window.advancedStorageManager) {
            console.warn('⚠️ AdvancedStorageManager not available, skipping migration');
            return;
        }

        let migratedCount = 0;
        let errorCount = 0;

        // Get storage usage before migration
        const beforeUsage = window.advancedStorageManager.getLocalStorageUsage();
        console.log(`📊 Before migration: ${beforeUsage.usedMB}MB used (${beforeUsage.percentage}%)`);

        // Migrate large data items first
        for (const key of this.largeDataKeys) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    const parsed = JSON.parse(value);
                    await window.advancedStorageManager.setItem(key, parsed, { forceMethod: 'indexeddb' });
                    
                    // Remove from localStorage after successful migration
                    localStorage.removeItem(key);
                    migratedCount++;
                    console.log(`📦 Migrated ${key} to IndexedDB`);
                }
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
                errorCount++;
            }
        }

        // Check for other large items in localStorage
        const otherLargeKeys = [];
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && 
                !this.largeDataKeys.includes(key) && 
                localStorage[key].length > 10000) { // >10KB
                otherLargeKeys.push(key);
            }
        }

        // Migrate other large items
        for (const key of otherLargeKeys) {
            try {
                const value = JSON.parse(localStorage.getItem(key));
                await window.advancedStorageManager.setItem(key, value, { forceMethod: 'indexeddb' });
                localStorage.removeItem(key);
                migratedCount++;
                console.log(`📦 Migrated large item ${key} to IndexedDB`);
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
                errorCount++;
            }
        }

        // Get storage usage after migration
        const afterUsage = window.advancedStorageManager.getLocalStorageUsage();
        const savedMB = (beforeUsage.used - afterUsage.used) / (1024 * 1024);
        
        console.log(`📊 After migration: ${afterUsage.usedMB}MB used (${afterUsage.percentage}%)`);
        console.log(`💾 Freed up ${savedMB.toFixed(2)}MB in localStorage`);
        console.log(`✅ Migration summary: ${migratedCount} items migrated, ${errorCount} errors`);

        // Show user notification
        if (window.addChatMessage && migratedCount > 0) {
            window.addChatMessage(`📦 Migrated ${migratedCount} large data items to improve storage efficiency`, 'system');
        }
    }

    // Manual cleanup for emergency situations
    async emergencyCleanup() {
        console.log('🚨 Running emergency cleanup...');
        
        let cleanedItems = 0;
        
        // Define items to migrate to IndexedDB or clean up
        const itemsToMigrate = [
            'wasteland_characters',
            'storyteller_notes',
            'storyteller_roll_history',
            'storyteller_saved_npcs',
            'storyteller_saved_rolls',
            'characterData',
            'savedCharacters',
            'campaign_data',
            'session_notes'
        ];

        // Migrate large items to IndexedDB
        for (const key of itemsToMigrate) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const size = data.length;
                    console.log(`📋 Found ${key}: ${(size / 1024).toFixed(1)}KB`);
                    
                    if (size > 10000) { // >10KB items
                        if (window.advancedStorageManager) {
                            const parsed = JSON.parse(data);
                            await window.advancedStorageManager.setItem(key, parsed, { forceMethod: 'indexeddb' });
                            localStorage.removeItem(key);
                            console.log(`📦 Migrated ${key} to IndexedDB (${(size / 1024).toFixed(1)}KB)`);
                            cleanedItems++;
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
            }
        }

        // Clean up old roll history (keep only last 20 entries)
        try {
            const rollHistory = JSON.parse(localStorage.getItem('storyteller_roll_history') || '[]');
            if (rollHistory.length > 20) {
                const trimmed = rollHistory.slice(-20);
                if (window.advancedStorageManager) {
                    await window.advancedStorageManager.setItem('storyteller_roll_history', trimmed);
                } else {
                    localStorage.setItem('storyteller_roll_history', JSON.stringify(trimmed));
                }
                console.log(`🧹 Trimmed roll history from ${rollHistory.length} to ${trimmed.length} entries`);
                cleanedItems++;
            }
        } catch (error) {
            console.error('❌ Failed to trim roll history:', error);
        }

        // Remove temporary/cache items
        const tempKeys = Object.keys(localStorage).filter(key => 
            key.includes('temp_') || 
            key.includes('cache_') || 
            key.includes('_backup') ||
            key.startsWith('debug_')
        );
        
        for (const key of tempKeys) {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed temporary item: ${key}`);
            cleanedItems++;
        }

        console.log(`✅ Emergency cleanup completed: ${cleanedItems} items processed`);

        // Show updated usage
        if (window.advancedStorageManager) {
            window.advancedStorageManager.monitorStorageUsage();
        }

        return cleanedItems;
    }

    // Get migration status
    getMigrationStatus() {
        const migrationData = localStorage.getItem(this.migrationKey);
        if (!migrationData) {
            return { completed: false };
        }

        try {
            return JSON.parse(migrationData);
        } catch (error) {
            return { completed: false, error: error.message };
        }
    }

    // Reset migration (for testing)
    resetMigration() {
        localStorage.removeItem(this.migrationKey);
        console.log('🔄 Migration reset - will run again on next load');
    }
}

// Create global instance
window.storageMigration = new StorageMigration();

// Auto-run migration when script loads (but only once)
document.addEventListener('DOMContentLoaded', () => {
    // Don't auto-run migration here since character manager will handle it
    // This prevents double-execution
    console.log('📦 StorageMigration ready, waiting for character manager');
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageMigration;
}
