// Helper function to clear old trade area data
// Run this in console to clear the stale data

async function clearOldTradeAreaData() {
    console.log("🧹 CLEARING OLD TRADE AREA DATA");
    
    const playerName = window.networkPlayerName || window.playerName;
    if (!playerName) {
        console.error("❌ No player name found");
        return;
    }
    
    const tradeAreaKey = `trade_area_${playerName}`;
    console.log("🔑 Clearing key:", tradeAreaKey);
    
    if (window.advancedStorageManager) {
        try {
            // Check current data
            const currentData = await window.advancedStorageManager.getItem(tradeAreaKey);
            console.log("📦 Current trade area data:", currentData);
            
            // Clear it
            await window.advancedStorageManager.removeItem(tradeAreaKey);
            console.log("✅ Trade area data cleared");
            
            // Verify it's gone
            const verifyData = await window.advancedStorageManager.getItem(tradeAreaKey);
            console.log("🔍 Verification - data after clear:", verifyData);
            
            // Force inventory re-render
            if (window.unifiedInventory) {
                window.unifiedInventory.renderInventory();
                console.log("🔄 Inventory re-rendered");
            }
            
        } catch (error) {
            console.error("❌ Failed to clear trade area:", error);
        }
    } else {
        console.error("❌ Advanced storage manager not found");
    }
}

// Run the clear
clearOldTradeAreaData();