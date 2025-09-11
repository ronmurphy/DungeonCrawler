/**
 * Character Storage Diagnostic Tool
 * Run this in the browser console to diagnose character storage issues
 */

async function diagnoseCharacterStorage() {
    console.log('🔍 DIAGNOSING CHARACTER STORAGE...');
    console.log('=====================================');
    
    // Check localStorage
    console.log('\n📱 LOCALSTORAGE:');
    const localData = localStorage.getItem('wasteland_characters');
    if (localData) {
        try {
            const localChars = JSON.parse(localData);
            console.log(`✅ Found ${localChars ? (Array.isArray(localChars) ? localChars.length : 'non-array') : 'null'} characters in localStorage`);
            console.log('📋 Raw data type:', typeof localChars);
            console.log('📋 Is Array:', Array.isArray(localChars));
            
            if (Array.isArray(localChars)) {
                localChars.forEach((char, index) => {
                    console.log(`  ${index + 1}. ${char.name || 'Unnamed'} (ID: ${char.id})`);
                });
            } else {
                console.log('⚠️ localStorage data is not an array:', localChars);
            }
            console.log(`📊 Data size: ${(localData.length / 1024).toFixed(2)}KB`);
        } catch (e) {
            console.error('❌ Error parsing localStorage data:', e);
            console.log('📋 Raw localStorage data:', localData.substring(0, 200) + '...');
        }
    } else {
        console.log('❌ No characters found in localStorage');
    }
    
    // Check IndexedDB
    console.log('\n💾 INDEXEDDB:');
    if (window.advancedStorageManager) {
        try {
            const indexedData = await window.advancedStorageManager.getItem('wasteland_characters');
            if (indexedData) {
                console.log(`✅ Found ${indexedData.length} characters in IndexedDB`);
                indexedData.forEach((char, index) => {
                    console.log(`  ${index + 1}. ${char.name || 'Unnamed'} (ID: ${char.id})`);
                });
            } else {
                console.log('❌ No characters found in IndexedDB');
            }
        } catch (e) {
            console.error('❌ Error accessing IndexedDB:', e);
        }
    } else {
        console.log('❌ AdvancedStorageManager not available');
    }
    
    // Check character manager
    console.log('\n🎮 CHARACTER MANAGER:');
    if (window.characterManager) {
        console.log(`✅ CharacterManager loaded with ${characterManager.characters.length} characters`);
        characterManager.characters.forEach((char, index) => {
            console.log(`  ${index + 1}. ${char.name || 'Unnamed'} (ID: ${char.id})`);
        });
    } else {
        console.log('⚠️ CharacterManager not available (this is normal if run before initialization)');
        console.log('💡 Available character-related objects:', Object.keys(window).filter(key => 
            key.toLowerCase().includes('character')).join(', '));
    }
    
    // Check migration status
    console.log('\n🔄 MIGRATION STATUS:');
    const migrationStatus = localStorage.getItem('dcc-storage-migration-v1');
    if (migrationStatus) {
        try {
            const status = JSON.parse(migrationStatus);
            console.log('✅ Migration completed:', new Date(status.timestamp).toLocaleString());
        } catch (e) {
            console.log('⚠️ Migration status corrupted');
        }
    } else {
        console.log('❌ Migration not completed yet');
    }
    
    // Storage size analysis
    console.log('\n📊 STORAGE ANALYSIS:');
    if (window.advancedStorageManager) {
        const usage = window.advancedStorageManager.getLocalStorageUsage();
        console.log(`localStorage: ${usage.usedMB}MB / ${usage.limitMB}MB (${usage.percentage}%)`);
    }
    
    console.log('\n=====================================');
    console.log('🔍 DIAGNOSIS COMPLETE');
}

// Test function to manually save and load characters
async function testCharacterSaveLoad() {
    console.log('🧪 TESTING CHARACTER SAVE/LOAD...');
    
    // Backup current characters
    const backup = characterManager.characters.slice();
    
    // Add a test character
    const testChar = {
        id: Date.now().toString(),
        name: 'Test Character',
        level: 1,
        created: new Date().toISOString()
    };
    
    characterManager.characters.push(testChar);
    console.log('➕ Added test character');
    
    // Save
    try {
        await saveCharactersToStorage();
        console.log('✅ Save successful');
    } catch (e) {
        console.error('❌ Save failed:', e);
        return;
    }
    
    // Clear memory
    characterManager.characters = [];
    console.log('🗑️ Cleared character manager');
    
    // Load
    try {
        await loadCharactersFromStorage();
        console.log(`✅ Load successful: ${characterManager.characters.length} characters`);
        
        // Check if test character exists
        const testExists = characterManager.characters.find(c => c.id === testChar.id);
        if (testExists) {
            console.log('✅ Test character found after reload');
        } else {
            console.error('❌ Test character missing after reload');
        }
        
        // Remove test character
        characterManager.characters = characterManager.characters.filter(c => c.id !== testChar.id);
        await saveCharactersToStorage();
        console.log('🗑️ Removed test character');
        
    } catch (e) {
        console.error('❌ Load failed:', e);
    }
    
    console.log('🧪 TEST COMPLETE');
}

// Clean up corrupted localStorage data
function cleanupCorruptedLocalStorage() {
    console.log('🧹 CLEANING UP CORRUPTED LOCALSTORAGE...');
    
    const localData = localStorage.getItem('wasteland_characters');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            if (!Array.isArray(parsed)) {
                console.log('⚠️ Found non-array data in localStorage, removing...');
                localStorage.removeItem('wasteland_characters');
                console.log('✅ Corrupted localStorage data removed');
                return true;
            } else {
                console.log('✅ localStorage data is valid array');
                return false;
            }
        } catch (e) {
            console.log('⚠️ Found unparseable data in localStorage, removing...');
            localStorage.removeItem('wasteland_characters');
            console.log('✅ Corrupted localStorage data removed');
            return true;
        }
    } else {
        console.log('ℹ️ No wasteland_characters in localStorage');
        return false;
    }
}

// Export functions to window for console access
window.diagnoseCharacterStorage = diagnoseCharacterStorage;
window.testCharacterSaveLoad = testCharacterSaveLoad;
window.cleanupCorruptedLocalStorage = cleanupCorruptedLocalStorage;

console.log('🔧 Character Storage Diagnostic Tools Loaded');
console.log('Run diagnoseCharacterStorage() to check current state');
console.log('Run testCharacterSaveLoad() to test save/load functionality');
console.log('Run cleanupCorruptedLocalStorage() to clean up corrupted data');
