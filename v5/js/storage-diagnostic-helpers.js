/**
 * Storage Diagnostic Helper Functions
 * Run these in the browser console to inspect storage contents
 */

// Simple functions you can call from browser console to check storage

window.storageHelpers = {
    
    // Check localStorage for character data
    checkLocalStorage() {
        console.log('🔍 LOCALSTORAGE CHARACTER INSPECTION:');
        console.log('='.repeat(50));
        
        const potentialKeys = [
            'wasteland_characters',
            'characterData', 
            'savedCharacters',
            'characters',
            'currentCharacter'
        ];
        
        let found = 0;
        
        potentialKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        console.log(`📋 ${key}: ${parsed.length} characters found`);
                        parsed.forEach((char, i) => {
                            console.log(`  ${i+1}. ${char.name || 'Unnamed'} (Level ${char.level || '?'}) ID: ${char.id || 'No ID'}`);
                        });
                        found += parsed.length;
                    } else if (parsed && parsed.name) {
                        console.log(`👤 ${key}: Single character - ${parsed.name} (Level ${parsed.level || '?'})`);
                        found++;
                    } else {
                        console.log(`❓ ${key}: Data exists but unrecognized format`);
                    }
                } catch (e) {
                    console.log(`❌ ${key}: Invalid JSON`);
                }
            }
        });
        
        if (found === 0) {
            console.log('🚫 No character data found in localStorage');
        } else {
            console.log(`\n📊 Total characters found in localStorage: ${found}`);
        }
        
        console.log('\n🔍 ALL LOCALSTORAGE KEYS (containing "char"):');
        Object.keys(localStorage).filter(key => 
            key.toLowerCase().includes('char') || 
            key.toLowerCase().includes('wasteland')
        ).forEach(key => {
            const size = localStorage.getItem(key).length;
            console.log(`  ${key}: ${(size/1024).toFixed(1)}KB`);
        });
    },
    
    // Check IndexedDB for character data
    async checkIndexedDB() {
        console.log('🔍 INDEXEDDB CHARACTER INSPECTION:');
        console.log('='.repeat(50));
        
        if (!window.advancedStorageManager) {
            console.log('❌ advancedStorageManager not available');
            return;
        }
        
        try {
            const characters = await window.advancedStorageManager.getItem('wasteland_characters');
            
            if (characters && Array.isArray(characters)) {
                console.log(`📋 wasteland_characters: ${characters.length} characters found`);
                characters.forEach((char, i) => {
                    console.log(`  ${i+1}. ${char.name || 'Unnamed'} (Level ${char.level || '?'}) ID: ${char.id || 'No ID'}`);
                });
            } else if (characters) {
                console.log('❓ wasteland_characters exists but is not an array');
                console.log(characters);
            } else {
                console.log('🚫 No wasteland_characters found in IndexedDB');
            }
            
            // Check for other character-related keys
            const allKeys = await window.advancedStorageManager.getAllKeys();
            const charKeys = allKeys.filter(key => 
                key.toLowerCase().includes('char') || 
                key.toLowerCase().includes('wasteland')
            );
            
            if (charKeys.length > 0) {
                console.log('\n🔍 Other character-related keys in IndexedDB:');
                for (const key of charKeys) {
                    if (key !== 'wasteland_characters') {
                        const data = await window.advancedStorageManager.getItem(key);
                        console.log(`  ${key}: ${typeof data} (${Array.isArray(data) ? data.length + ' items' : 'single item'})`);
                    }
                }
            }
            
        } catch (error) {
            console.log('❌ Error checking IndexedDB:', error);
        }
    },
    
    // Check character manager state
    checkCharacterManager() {
        console.log('🔍 CHARACTER MANAGER STATE:');
        console.log('='.repeat(50));
        
        if (!window.characterManager) {
            console.log('❌ characterManager not available');
            return;
        }
        
        if (window.characterManager.characters) {
            console.log(`📋 In memory: ${window.characterManager.characters.length} characters`);
            window.characterManager.characters.forEach((char, i) => {
                console.log(`  ${i+1}. ${char.name || 'Unnamed'} (Level ${char.level || '?'}) ID: ${char.id || 'No ID'}`);
            });
        } else {
            console.log('🚫 No characters array in character manager');
        }
        
        if (window.characterManager.currentCharacter) {
            const current = window.characterManager.currentCharacter;
            console.log(`\n👤 Current character: ${current.name || 'Unnamed'} (Level ${current.level || '?'})`);
        } else {
            console.log('\n🚫 No current character loaded');
        }
    },
    
    // Full diagnostic - run all checks
    async fullDiagnostic() {
        console.clear();
        console.log('🏥 FULL STORAGE DIAGNOSTIC');
        console.log('='.repeat(60));
        
        this.checkLocalStorage();
        console.log('\n');
        await this.checkIndexedDB();
        console.log('\n');
        this.checkCharacterManager();
        
        console.log('\n' + '='.repeat(60));
        console.log('🏥 DIAGNOSTIC COMPLETE');
        console.log('\n💡 To run individual checks:');
        console.log('   storageHelpers.checkLocalStorage()');
        console.log('   storageHelpers.checkIndexedDB()');
        console.log('   storageHelpers.checkCharacterManager()');
    },
    
    // Emergency: Show raw localStorage character data
    showRawLocalStorage() {
        console.log('🔍 RAW LOCALSTORAGE CHARACTER DATA:');
        console.log('='.repeat(50));
        
        const data = localStorage.getItem('wasteland_characters');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log('📋 Raw wasteland_characters data:');
                console.log(parsed);
            } catch (e) {
                console.log('❌ Could not parse wasteland_characters as JSON');
                console.log('Raw string:', data.substring(0, 200) + '...');
            }
        } else {
            console.log('🚫 No wasteland_characters in localStorage');
        }
    }
};

// Quick shortcuts
window.checkStorage = window.storageHelpers.fullDiagnostic.bind(window.storageHelpers);
window.checkLocal = window.storageHelpers.checkLocalStorage.bind(window.storageHelpers);
window.checkIndexed = window.storageHelpers.checkIndexedDB.bind(window.storageHelpers);

console.log('🔧 Storage diagnostic helpers loaded!');
console.log('💡 Quick commands:');
console.log('   checkStorage()     - Full diagnostic');
console.log('   checkLocal()       - Check localStorage only'); 
console.log('   checkIndexed()     - Check IndexedDB only');
console.log('   storageHelpers.checkCharacterManager() - Check memory');