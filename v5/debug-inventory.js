// Debug helper to check trade area and inventory state
// Add this to browser console to debug the loot/gold issue

async function debugInventoryState() {
    console.log("🔍 DEBUGGING INVENTORY STATE");
    console.log("=".repeat(50));
    
    // Check player name - CRITICAL CHECK
    const playerName = window.networkPlayerName || window.playerName;
    console.log("👤 Player name:", playerName);
    console.log("👤 window.playerName:", window.playerName);
    console.log("👤 window.networkPlayerName:", window.networkPlayerName);
    
    // ENHANCED: Check for local networkPlayerName variable in index.html
    if (typeof networkPlayerName !== 'undefined') {
        console.log("🏠 Local networkPlayerName variable:", networkPlayerName);
        if (playerName) {
            console.log("✅ FIXED: Global window properties are now set correctly!");
        } else {
            console.log("⚠️ MISMATCH DETECTED: Local variable exists but global window properties are not set!");
        }
    }
    
    if (!playerName) {
        console.error("❌ NO PLAYER NAME SET! This is the root cause of trade area issues.");
        console.log("💡 Solution: Check if setNetworkPlayerName is setting global window properties");
        return;
    }
    
    // Check if unified inventory exists
    console.log("📦 Unified inventory exists:", !!window.unifiedInventory);
    
    // Check current character
    const character = window.unifiedInventory?.getCurrentCharacter();
    console.log("🎭 Current character:", character?.name, "Gold:", character?.gold);
    
    // Check character manager
    console.log("👥 Character manager exists:", !!window.characterManager);
    if (window.characterManager) {
        console.log("👥 Current character ID:", window.characterManager.currentCharacterId);
        console.log("👥 Characters count:", window.characterManager.characters?.length || 0);
    }
    
    // Check advanced storage manager
    console.log("💾 Advanced storage manager exists:", !!window.advancedStorageManager);
    
    // Check save functions
    console.log("💾 Save functions available:", {
        saveCurrentCharacterToStorage: typeof saveCurrentCharacterToStorage !== 'undefined',
        saveCharacterToStorage: typeof saveCharacterToStorage !== 'undefined',
        characterManagerSave: !!(window.characterManager?.saveCharacter),
        setNetworkPlayerName: typeof window.setNetworkPlayerName !== 'undefined'
    });
    
    if (window.advancedStorageManager && playerName) {
        // Check trade area in storage
        const tradeAreaKey = `trade_area_${playerName}`;
        console.log("🔑 Trade area key:", tradeAreaKey);
        const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
        console.log("🎁 Trade area data:", tradeArea);
        
        // Check if trade area elements exist in DOM
        const tradeGrid = document.getElementById('trade-grid');
        const tradeSection = document.getElementById('trade-area-section');
        console.log("🏗️ Trade DOM elements exist:", {
            tradeGrid: !!tradeGrid,
            tradeSection: !!tradeSection
        });
        
        if (tradeSection) {
            console.log("👁️ Trade section display:", tradeSection.style.display);
            console.log("👁️ Trade section content:", tradeSection.innerHTML.substring(0, 200));
            
            // Check if it's in the current tab
            const inventoryContent = document.getElementById('inventory-content');
            if (inventoryContent) {
                const isVisible = inventoryContent.style.display !== 'none';
                console.log("📋 Inventory tab is active:", isVisible);
            }
            
            // Force show trade area for testing
            if (tradeSection.style.display === 'none') {
                console.log("🔧 FORCING trade area to show for debugging...");
                tradeSection.style.display = 'block';
                setTimeout(() => {
                    console.log("👁️ After forcing display:", tradeSection.style.display);
                }, 100);
            }
        }
    }
    
    console.log("\n🧪 TESTING: Adding fake loot...");
    if (window.unifiedInventory && playerName) {
        try {
            const testLoot = {
                type: 'gold',
                name: '25 Test Gold',
                value: 25,
                icon: '💰'
            };
            await window.unifiedInventory.addLootToTradeArea(testLoot);
            console.log("✅ Test loot added successfully");
            
            // Try to add an item too
            const testItem = {
                type: 'item',
                name: 'Test Sword',
                value: 50,
                icon: '⚔️',
                itemType: 'weapon'
            };
            await window.unifiedInventory.addLootToTradeArea(testItem);
            console.log("✅ Test item added successfully");
            
        } catch (error) {
            console.error("❌ Failed to add test loot:", error);
        }
    } else {
        console.warn("⚠️ Skipping loot test - missing unified inventory or player name");
    }
    
    console.log("\n🔄 Forcing inventory re-render...");
    if (window.unifiedInventory) {
        window.unifiedInventory.renderInventory();
    }
}

// Run the debug
debugInventoryState();