// Test script to verify inventory/combat/shop integration
// Run this in browser console to check current state

async function testInventorySystem() {
    console.log('🧪 Testing Inventory System Integration...\n');
    
    // 1. Test character data consistency
    console.log('1. Character Data Sources:');
    const character = window.character;
    const characterManager = window.characterManager?.getCurrentCharacter();
    console.log('  - Global character:', character);
    console.log('  - CharacterManager:', characterManager);
    console.log('  - Player name:', window.networkPlayerName || window.playerName);
    
    // 2. Test trade area storage
    console.log('\n2. Trade Area Status:');
    const playerName = window.networkPlayerName || window.playerName;
    if (playerName && window.advancedStorageManager) {
        const tradeAreaKey = `trade_area_${playerName}`;
        const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
        console.log(`  - Trade area data:`, tradeArea);
        
        if (tradeArea) {
            console.log(`  - Gold in trade area: ${tradeArea.gold || 0}`);
            console.log(`  - Items in trade area: ${tradeArea.items?.length || 0}`);
        }
    }
    
    // 3. Test inventory display
    console.log('\n3. Inventory Display:');
    const inventoryGrid = document.querySelector('.inventory-grid');
    if (inventoryGrid) {
        const sellButtons = inventoryGrid.querySelectorAll('.sell-btn');
        const deleteButtons = inventoryGrid.querySelectorAll('.delete-btn');
        console.log(`  - Sell buttons found: ${sellButtons.length}`);
        console.log(`  - Delete buttons found: ${deleteButtons.length}`);
    }
    
    // 4. Test gold display consistency
    console.log('\n4. Gold Display Consistency:');
    const inventoryGold = document.getElementById('character-gold')?.textContent;
    const dccModal = document.getElementById('dcc-modal');
    console.log(`  - Inventory shows: ${inventoryGold} GP`);
    
    // 5. Test Recent Loot section
    console.log('\n5. Recent Loot Section:');
    const tradeSection = document.getElementById('trade-area-section');
    const tradeGrid = document.getElementById('trade-grid');
    console.log(`  - Trade section visible: ${tradeSection?.style.display !== 'none'}`);
    console.log(`  - Trade grid items: ${tradeGrid?.children.length || 0}`);
    
    // 6. Test DCC items with values
    console.log('\n6. DCC Items Data:');
    if (window.inventoryManager?.dccItems) {
        const itemsWithValues = window.inventoryManager.dccItems.filter(item => item.value);
        console.log(`  - DCC items loaded: ${window.inventoryManager.dccItems.length}`);
        console.log(`  - Items with values: ${itemsWithValues.length}`);
        if (itemsWithValues.length > 0) {
            console.log(`  - Sample item:`, itemsWithValues[0]);
        }
    }
    
    console.log('\n✅ Test completed! Check results above.');
}

// Run the test
testInventorySystem();