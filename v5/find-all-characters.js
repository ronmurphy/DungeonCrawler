// Character Recovery - Find ALL Characters
// This will check BOTH localStorage AND IndexedDB to find all your characters

async function findAllCharacters() {
    console.log('🔍 SEARCHING FOR ALL CHARACTERS');
    console.log('================================');
    
    const allCharacters = [];
    
    // 1. Check IndexedDB via advancedStorageManager
    console.log('\n💾 CHECKING INDEXEDDB...');
    try {
        const indexedChars = await window.advancedStorageManager.getItem('wasteland_characters');
        if (indexedChars && Array.isArray(indexedChars)) {
            console.log(`✅ Found ${indexedChars.length} characters in IndexedDB:`);
            indexedChars.forEach((char, i) => {
                console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id}`);
                allCharacters.push({...char, source: 'IndexedDB'});
            });
        } else {
            console.log('❌ No characters in IndexedDB');
        }
    } catch (error) {
        console.error('❌ Error checking IndexedDB:', error);
    }
    
    // 2. Check raw localStorage
    console.log('\n📦 CHECKING RAW LOCALSTORAGE...');
    const rawData = localStorage.getItem('wasteland_characters');
    if (rawData) {
        try {
            const parsedData = JSON.parse(rawData);
            if (Array.isArray(parsedData)) {
                console.log(`✅ Found ${parsedData.length} characters in raw localStorage:`);
                parsedData.forEach((char, i) => {
                    console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id}`);
                    // Only add if not already in IndexedDB
                    if (!allCharacters.find(c => c.id === char.id)) {
                        allCharacters.push({...char, source: 'localStorage'});
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error parsing localStorage data:', error);
        }
    } else {
        console.log('❌ No characters in raw localStorage');
    }
    
    // 3. Check compressed localStorage via advancedStorageManager
    console.log('\n🗜️ CHECKING COMPRESSED LOCALSTORAGE...');
    try {
        const compressedChars = window.advancedStorageManager.getLocalStorageItem('wasteland_characters');
        if (compressedChars && Array.isArray(compressedChars)) {
            console.log(`✅ Found ${compressedChars.length} characters in compressed localStorage:`);
            compressedChars.forEach((char, i) => {
                console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id}`);
                // Only add if not already found
                if (!allCharacters.find(c => c.id === char.id)) {
                    allCharacters.push({...char, source: 'compressed localStorage'});
                }
            });
        } else {
            console.log('❌ No characters in compressed localStorage');
        }
    } catch (error) {
        console.error('❌ Error checking compressed localStorage:', error);
    }
    
    // 4. Check old storage keys
    console.log('\n🔍 CHECKING OTHER STORAGE KEYS...');
    const oldKeys = ['characterData', 'savedCharacters', 'characters'];
    for (const key of oldKeys) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    console.log(`✅ Found ${parsed.length} characters in localStorage.${key}:`);
                    parsed.forEach((char, i) => {
                        console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id || 'no-id'}`);
                        if (!allCharacters.find(c => c.id === char.id)) {
                            allCharacters.push({...char, source: key});
                        }
                    });
                } else if (parsed && typeof parsed === 'object') {
                    console.log(`✅ Found single character in localStorage.${key}: ${parsed.name || 'Unnamed'}`);
                    if (!allCharacters.find(c => c.id === parsed.id)) {
                        allCharacters.push({...parsed, source: key});
                    }
                }
            } catch (error) {
                console.log(`❌ Error parsing ${key}:`, error.message);
            }
        }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total unique characters found: ${allCharacters.length}`);
    
    if (allCharacters.length > 1) {
        console.log('\n🔧 RECOVERY NEEDED! Multiple characters found but only 1 showing.');
        console.log('Characters found:');
        allCharacters.forEach((char, i) => {
            console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - Source: ${char.source}`);
        });
        
        console.log('\n💡 RECOVERY PLAN:');
        console.log('1. Merge all characters into one array');
        console.log('2. Save merged array to IndexedDB');
        console.log('3. Refresh character display');
        
        return allCharacters;
    } else {
        console.log('✅ Only 1 character found - this may be correct');
        return allCharacters;
    }
}

// Run the search
findAllCharacters();