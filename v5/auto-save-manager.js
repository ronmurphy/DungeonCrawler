// Auto-save management for inventory conflicts
// This script manages auto-save pausing during inventory operations

// Global flag to pause auto-save during inventory operations
window.inventoryOperationInProgress = false;

// Function to pause auto-save during inventory operations
function pauseAutoSaveForInventory() {
    window.inventoryOperationInProgress = true;
    console.log('⏸️ Auto-save paused for inventory operation');
    
    // Auto-resume after 10 seconds as safety fallback
    setTimeout(() => {
        if (window.inventoryOperationInProgress) {
            console.log('⏸️ Auto-resuming auto-save after timeout');
            resumeAutoSaveForInventory();
        }
    }, 10000);
}

// Function to resume auto-save after inventory operations
function resumeAutoSaveForInventory() {
    window.inventoryOperationInProgress = false;
    console.log('▶️ Auto-save resumed after inventory operation');
}

// Function to check if auto-save should be blocked
function shouldBlockAutoSave() {
    return window.inventoryOperationInProgress || isOnInventoryTab();
}

// Function to check if user is currently on inventory tab
function isOnInventoryTab() {
    const inventoryContent = document.getElementById('inventory-content');
    return inventoryContent && inventoryContent.style.display !== 'none';
}

// Enhanced auto-save function that respects inventory operations
function smartAutoSave() {
    if (shouldBlockAutoSave()) {
        console.log('⏸️ Skipping auto-save - inventory operation in progress or on inventory tab');
        return;
    }
    
    // Proceed with normal auto-save
    if (window.characterManager && window.characterManager.currentCharacterId && !window.characterManager.isLandingScreenActive) {
        if (typeof saveCurrentCharacterToStorage === 'function') {
            console.log('💾 Smart auto-save executing...');
            saveCurrentCharacterToStorage();
        }
    }
}

// Make functions globally available
window.pauseAutoSaveForInventory = pauseAutoSaveForInventory;
window.resumeAutoSaveForInventory = resumeAutoSaveForInventory;
window.shouldBlockAutoSave = shouldBlockAutoSave;
window.smartAutoSave = smartAutoSave;

console.log('🎯 Auto-save management system loaded');