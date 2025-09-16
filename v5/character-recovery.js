// Character Recovery Script
// Run this in browser console if characters are missing after storage cleanup

async function recoverCharacters() {
    console.log('🚑 CHARACTER RECOVERY ATTEMPT');
    console.log('==============================');
    
    try {
        // Step 1: Try to reload characters from storage
        console.log('🔄 Step 1: Reloading characters from storage...');
        if (typeof loadCharactersFromStorage === 'function') {
            await loadCharactersFromStorage();
            console.log(`✅ Loaded ${window.characterManager?.characters?.length || 0} characters`);
        }
        
        // Step 2: Force refresh the character grid
        console.log('🔄 Step 2: Refreshing character grid...');
        if (typeof renderCharacterGrid === 'function') {
            renderCharacterGrid();
            console.log('✅ Character grid refreshed');
        }
        
        // Step 3: If still on landing screen, refresh it
        console.log('🔄 Step 3: Refreshing landing screen...');
        if (typeof showLandingScreen === 'function') {
            showLandingScreen();
            console.log('✅ Landing screen refreshed');
        }
        
        // Step 4: Check final state
        const finalCount = window.characterManager?.characters?.length || 0;
        console.log(`🎯 RECOVERY RESULT: ${finalCount} characters now visible`);
        
        if (finalCount > 0) {
            console.log('✅ SUCCESS: Characters recovered!');
            window.characterManager.characters.forEach((char, i) => {
                console.log(`  ${i + 1}. ${char.name || 'Unnamed'} (Level ${char.level || 1})`);
            });
        } else {
            console.log('❌ No characters found. They may need to be restored from backup.');
        }
        
    } catch (error) {
        console.error('❌ Recovery failed:', error);
    }
}

// Run recovery
recoverCharacters();