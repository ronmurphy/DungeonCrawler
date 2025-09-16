// Storage Diagnostic Script for Character Issues
// Run this in the browser console to debug the storage cleanup issue

console.log('🔍 STORAGE DIAGNOSTIC - Character Issue After Cleanup');
console.log('=====================================');

async function diagnoseProblem() {
    // Check localStorage
    console.log('\n📋 LOCAL STORAGE CHECK:');
    const localWasteland = localStorage.getItem('wasteland_characters');
    console.log('localStorage.wasteland_characters:', localWasteland ? `Found (${localWasteland.length} chars)` : 'Not found');
    
    const localCharData = localStorage.getItem('characterData');
    console.log('localStorage.characterData:', localCharData ? `Found (${localCharData.length} chars)` : 'Not found');
    
    const localSaved = localStorage.getItem('savedCharacters');
    console.log('localStorage.savedCharacters:', localSaved ? `Found (${localSaved.length} chars)` : 'Not found');
    
    // Check IndexedDB via advancedStorageManager
    if (window.advancedStorageManager) {
        console.log('\n💾 INDEXEDDB CHECK:');
        try {
            const indexedWasteland = await window.advancedStorageManager.getItem('wasteland_characters');
            console.log('IndexedDB.wasteland_characters:', indexedWasteland ? `Found (${indexedWasteland.length} characters)` : 'Not found');
            
            if (indexedWasteland && Array.isArray(indexedWasteland)) {
                console.log('📝 Characters in IndexedDB:');
                indexedWasteland.forEach((char, i) => {
                    console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id}`);
                });
            }
            
            const indexedCharData = await window.advancedStorageManager.getItem('characterData');
            console.log('IndexedDB.characterData:', indexedCharData ? 'Found' : 'Not found');
            
            const indexedSaved = await window.advancedStorageManager.getItem('savedCharacters');
            console.log('IndexedDB.savedCharacters:', indexedSaved ? 'Found' : 'Not found');
            
        } catch (error) {
            console.error('❌ Error checking IndexedDB:', error);
        }
    } else {
        console.log('\n❌ advancedStorageManager not available');
    }
    
    // Check character manager state
    console.log('\n🎭 CHARACTER MANAGER STATE:');
    if (window.characterManager) {
        console.log('characterManager.characters:', characterManager.characters ? `${characterManager.characters.length} characters` : 'Not found');
        console.log('characterManager.currentCharacterId:', characterManager.currentCharacterId || 'None');
        
        if (characterManager.characters && characterManager.characters.length > 0) {
            console.log('📝 Characters in manager:');
            characterManager.characters.forEach((char, i) => {
                console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1}) - ID: ${char.id}`);
            });
        }
    } else {
        console.log('❌ characterManager not available');
    }
    
    // Check DOM
    console.log('\n🖼️ DOM CHECK:');
    const grid = document.getElementById('characters-grid');
    if (grid) {
        const cards = grid.querySelectorAll('.character-card');
        console.log(`characters-grid contains ${cards.length} character cards`);
        console.log('Grid innerHTML length:', grid.innerHTML.length);
    } else {
        console.log('❌ characters-grid element not found');
    }
    
    // Recommend fix
    console.log('\n🔧 SUGGESTED FIXES:');
    console.log('1. Try refreshing the character grid: renderCharacterGrid()');
    console.log('2. Try reloading characters: await loadCharactersFromStorage()');
    console.log('3. Try reinitializing: await initializeCharacterManager()');
}

// Run the diagnostic
diagnoseProblem();