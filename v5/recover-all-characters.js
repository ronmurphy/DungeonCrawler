// Character Merger - Recover ALL Characters
// This will merge characters from all storage locations

async function recoverAllCharacters() {
    console.log('🚑 RECOVERING ALL CHARACTERS');
    console.log('=============================');
    
    const allCharacters = [];
    const seenIds = new Set();
    
    // Function to add character if not duplicate
    function addCharacter(char, source) {
        if (!char.id) {
            char.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!seenIds.has(char.id)) {
            seenIds.add(char.id);
            allCharacters.push(char);
            console.log(`✅ Added: ${char.name || 'Unnamed'} (Level ${char.level || 1}) from ${source}`);
        } else {
            console.log(`⚠️ Skipped duplicate: ${char.name || 'Unnamed'} (${char.id})`);
        }
    }
    
    // 1. Get characters from IndexedDB
    try {
        const indexedChars = await window.advancedStorageManager.getItem('wasteland_characters');
        if (indexedChars && Array.isArray(indexedChars)) {
            indexedChars.forEach(char => addCharacter(char, 'IndexedDB'));
        }
    } catch (error) {
        console.error('❌ Error reading IndexedDB:', error);
    }
    
    // 2. Get characters from raw localStorage
    const rawData = localStorage.getItem('wasteland_characters');
    if (rawData) {
        try {
            const parsedData = JSON.parse(rawData);
            if (Array.isArray(parsedData)) {
                parsedData.forEach(char => addCharacter(char, 'localStorage'));
            }
        } catch (error) {
            console.error('❌ Error parsing localStorage:', error);
        }
    }
    
    // 3. Get characters from compressed localStorage
    try {
        const compressedChars = window.advancedStorageManager.getLocalStorageItem('wasteland_characters');
        if (compressedChars && Array.isArray(compressedChars)) {
            compressedChars.forEach(char => addCharacter(char, 'compressed localStorage'));
        }
    } catch (error) {
        console.error('❌ Error reading compressed localStorage:', error);
    }
    
    // 4. Check old storage keys
    const oldKeys = ['characterData', 'savedCharacters', 'characters'];
    for (const key of oldKeys) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    parsed.forEach(char => addCharacter(char, `localStorage.${key}`));
                } else if (parsed && typeof parsed === 'object' && parsed.name) {
                    addCharacter(parsed, `localStorage.${key}`);
                }
            } catch (error) {
                console.log(`❌ Error parsing ${key}:`, error.message);
            }
        }
    }
    
    console.log(`\n📊 RECOVERY SUMMARY: Found ${allCharacters.length} unique characters`);
    
    if (allCharacters.length > 0) {
        // Save all characters to IndexedDB as the authoritative source
        console.log('\n💾 Saving all characters to IndexedDB...');
        await window.advancedStorageManager.setItem('wasteland_characters', allCharacters);
        
        // Update character manager
        console.log('🔄 Updating character manager...');
        window.characterManager.characters = allCharacters;
        
        // Refresh display
        console.log('🔄 Refreshing display...');
        renderCharacterGrid();
        showLandingScreen();
        
        console.log('\n✅ RECOVERY COMPLETE!');
        console.log('Characters now available:');
        allCharacters.forEach((char, i) => {
            console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1})`);
        });
        
        return allCharacters;
    } else {
        console.log('❌ No characters found to recover');
        return [];
    }
}

// Run the recovery
recoverAllCharacters();