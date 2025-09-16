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
        
        // FIRST: Comprehensive character migration (regardless of size)
        console.log('🎭 MIGRATING ALL CHARACTERS...');
        const allCharacters = await this.migrateAllCharacters();
        if (allCharacters.length > 0) {
            cleanedItems++;
        }
        
        // Define other items to migrate to IndexedDB or clean up
        const itemsToMigrate = [
            'storyteller_notes',
            'storyteller_roll_history',
            'storyteller_saved_npcs',
            'storyteller_saved_rolls',
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

    // Comprehensive character migration from all storage locations
    async migrateAllCharacters() {
        console.log('🎭 Migrating ALL characters from all storage locations...');
        
        const allCharacters = [];
        const seenIds = new Set();
        
        // Function to safely add character (avoid duplicates)
        function addCharacter(char, source) {
            if (!char || typeof char !== 'object') return;
            
            // Ensure character has an ID
            if (!char.id) {
                char.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            if (!seenIds.has(char.id)) {
                seenIds.add(char.id);
                allCharacters.push(char);
                console.log(`✅ Found character: ${char.name || 'Unnamed'} (Level ${char.level || 1}) from ${source}`);
            }
        }
        
        // 1. Check current character manager state
        if (window.characterManager && window.characterManager.characters) {
            console.log('📋 Checking character manager...');
            window.characterManager.characters.forEach(char => {
                addCharacter(char, 'character manager');
            });
        }
        
        // 2. Check IndexedDB (existing migrated characters)
        try {
            console.log('📋 Checking IndexedDB...');
            const indexedChars = await window.advancedStorageManager.getItem('wasteland_characters');
            if (indexedChars && Array.isArray(indexedChars)) {
                indexedChars.forEach(char => addCharacter(char, 'IndexedDB'));
            }
        } catch (error) {
            console.error('❌ Error checking IndexedDB:', error);
        }
        
        // 3. Check raw localStorage
        console.log('📋 Checking raw localStorage...');
        const rawData = localStorage.getItem('wasteland_characters');
        if (rawData) {
            try {
                const parsedData = JSON.parse(rawData);
                if (Array.isArray(parsedData)) {
                    parsedData.forEach(char => addCharacter(char, 'localStorage'));
                }
            } catch (error) {
                console.error('❌ Error parsing localStorage wasteland_characters:', error);
            }
        }
        
        // 4. Check compressed localStorage via advancedStorageManager
        try {
            console.log('📋 Checking compressed localStorage...');
            const compressedChars = window.advancedStorageManager.getLocalStorageItem('wasteland_characters');
            if (compressedChars && Array.isArray(compressedChars)) {
                compressedChars.forEach(char => addCharacter(char, 'compressed localStorage'));
            }
        } catch (error) {
            console.error('❌ Error checking compressed localStorage:', error);
        }
        
        // 5. Check alternative character storage keys
        console.log('📋 Checking alternative storage keys...');
        const alternativeKeys = ['characterData', 'savedCharacters', 'characters'];
        for (const key of alternativeKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(char => addCharacter(char, `localStorage.${key}`));
                    } else if (parsed && typeof parsed === 'object' && parsed.name) {
                        addCharacter(parsed, `localStorage.${key} (single)`);
                    }
                } catch (error) {
                    console.error(`❌ Error parsing ${key}:`, error);
                }
            }
        }
        
        console.log(`🎭 Migration summary: Found ${allCharacters.length} unique characters`);
        
        // Save all characters to IndexedDB as the authoritative source
        if (allCharacters.length > 0) {
            console.log('💾 Saving all characters to IndexedDB...');
            await window.advancedStorageManager.setItem('wasteland_characters', allCharacters, { forceMethod: 'indexeddb' });
            
            // Clean up old localStorage character data
            localStorage.removeItem('wasteland_characters');
            localStorage.removeItem('characterData');
            localStorage.removeItem('savedCharacters');
            localStorage.removeItem('characters');
            
            console.log('🧹 Cleaned up old character storage locations');
            console.log('✅ All characters now stored in IndexedDB');
            
            // Update character manager
            if (window.characterManager) {
                window.characterManager.characters = allCharacters;
            }
        }
        
        return allCharacters;
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
