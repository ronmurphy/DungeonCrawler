// Debug breakpoint helper
// Call this in console right before clicking gold to create a clear marker

function debugBreakpoint(message = "🔴 DEBUG BREAKPOINT") {
    console.error("=".repeat(80));
    console.error(`🔴 ${message} - ${new Date().toLocaleTimeString()}`);
    console.error("=".repeat(80));
    
    // Show current character state
    if (window.unifiedInventory) {
        const character = window.unifiedInventory.getCurrentCharacter();
        if (character) {
            console.error(`👤 Current Character: ${character.name}`);
            console.error(`💰 Current Gold: ${character.gold || 0}`);
            console.error(`🆔 Character ID: ${character.id}`);
        } else {
            console.error("❌ No character found!");
        }
    }
    
    // Show character manager state
    if (window.characterManager) {
        console.error(`👥 Character Manager Current ID: ${window.characterManager.currentCharacterId}`);
        const managerChar = window.characterManager.characters?.find(c => c.id === window.characterManager.currentCharacterId);
        if (managerChar) {
            console.error(`👥 Manager Character Gold: ${managerChar.gold || 0}`);
        }
    }
    
    // Show global character
    if (window.character) {
        console.error(`🌍 Global Character: ${window.character.name}, Gold: ${window.character.gold || 0}`);
    }
    
    console.error("=".repeat(80));
}

// Make it globally available
window.debugBreakpoint = debugBreakpoint;

console.log("🔧 Debug breakpoint function loaded. Call debugBreakpoint() before clicking gold!");