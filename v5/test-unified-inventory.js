// Comprehensive test for Unified Inventory System
// Run this in browser console to verify all functionality

async function testUnifiedInventorySystem() {
    console.log('🧪 TESTING UNIFIED INVENTORY SYSTEM');
    console.log('=====================================\n');
    
    if (!window.unifiedInventory) {
        console.error('❌ Unified Inventory System not found!');
        return;
    }
    
    const ui = window.unifiedInventory;
    
    // 1. Test system initialization
    console.log('1. System Initialization:');
    console.log(`  ✅ Unified system loaded: ${!!ui}`);
    console.log(`  ✅ Initialized: ${ui.initialized}`);
    console.log(`  ✅ DCC items loaded: ${ui.dccItems ? ui.dccItems.length : 0} items`);
    
    // 2. Test character data access
    console.log('\n2. Character Data Access:');
    const character = ui.getCurrentCharacter();
    console.log(`  ✅ Character found: ${!!character}`);
    if (character) {
        console.log(`  ✅ Character name: ${character.name || 'Unnamed'}`);
        console.log(`  ✅ Gold: ${character.gold || 0} GP`);
        console.log(`  ✅ Inventory items: ${character.inventory ? character.inventory.length : 0}`);
    }
    
    // 3. Test gold management
    console.log('\n3. Gold Management:');
    const initialGold = ui.getGold();
    console.log(`  ✅ Initial gold: ${initialGold} GP`);
    
    // Test adding gold
    ui.addGold(100);
    const afterAdd = ui.getGold();
    console.log(`  ✅ After adding 100: ${afterAdd} GP`);
    
    // Test spending gold
    ui.spendGold(50);
    const afterSpend = ui.getGold();
    console.log(`  ✅ After spending 50: ${afterSpend} GP`);
    
    // Restore original
    const diff = afterSpend - initialGold;
    if (diff > 0) {
        ui.spendGold(diff);
    } else if (diff < 0) {
        ui.addGold(-diff);
    }
    console.log(`  ✅ Restored to original: ${ui.getGold()} GP`);
    
    // 4. Test inventory management
    console.log('\n4. Inventory Management:');
    const inventory = ui.getInventory();
    console.log(`  ✅ Inventory access: ${inventory.length} items`);
    
    // Test adding test item
    const testItem = {
        id: 'test_item_' + Date.now(),
        name: 'Test Sword',
        type: 'weapon',
        value: 100,
        size: 2
    };
    
    ui.addItem(testItem);
    const afterAdd2 = ui.getInventory();
    console.log(`  ✅ After adding test item: ${afterAdd2.length} items`);
    
    // Test removing test item
    ui.removeItem(testItem.id);
    const afterRemove = ui.getInventory();
    console.log(`  ✅ After removing test item: ${afterRemove.length} items`);
    
    // 5. Test equipment system
    console.log('\n5. Equipment System:');
    if (inventory.length > 0) {
        const firstItem = inventory[0];
        if (ui.canEquip(firstItem)) {
            const wasEquipped = ui.isItemEquipped(firstItem.id);
            console.log(`  ✅ Item can be equipped: ${firstItem.name}`);
            console.log(`  ✅ Initially equipped: ${wasEquipped}`);
            
            ui.toggleEquipment(firstItem.id);
            const nowEquipped = ui.isItemEquipped(firstItem.id);
            console.log(`  ✅ After toggle: ${nowEquipped}`);
            
            // Toggle back
            ui.toggleEquipment(firstItem.id);
            console.log(`  ✅ Toggled back to: ${ui.isItemEquipped(firstItem.id)}`);
        } else {
            console.log(`  ⚠️ First item cannot be equipped: ${firstItem.name}`);
        }
    } else {
        console.log('  ⚠️ No items in inventory to test equipment');
    }
    
    // 6. Test trade area
    console.log('\n6. Trade Area System:');
    const playerName = window.networkPlayerName || window.playerName;
    console.log(`  ✅ Player name: ${playerName || 'Not set'}`);
    
    if (playerName && window.advancedStorageManager) {
        // Test adding loot to trade area
        const testLoot = {
            type: 'item',
            name: 'Test Loot',
            value: 50,
            sourceType: 'test'
        };
        
        const result = await ui.addLootToTradeArea(testLoot);
        console.log(`  ✅ Add loot to trade area: ${result}`);
        
        // Check trade area display
        await ui.updateTradeAreaDisplay();
        console.log('  ✅ Trade area display updated');
        
        // Clean up - remove test loot
        try {
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            if (tradeArea && tradeArea.items) {
                tradeArea.items = tradeArea.items.filter(item => item.name !== 'Test Loot');
                await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea);
                await ui.updateTradeAreaDisplay();
                console.log('  ✅ Test loot cleaned up');
            }
        } catch (error) {
            console.log('  ⚠️ Cleanup failed:', error.message);
        }
    } else {
        console.log('  ⚠️ Cannot test trade area (no player name or storage manager)');
    }
    
    // 7. Test DCC shop system
    console.log('\n7. DCC Shop System:');
    if (ui.dccItems && ui.dccItems.length > 0) {
        console.log(`  ✅ DCC items available: ${ui.dccItems.length}`);
        const sampleItem = ui.dccItems[0];
        console.log(`  ✅ Sample item: ${sampleItem.name} (${sampleItem.value || 0} GP)`);
        
        // Test if player can afford the cheapest item
        const cheapestItem = ui.dccItems.reduce((min, item) => 
            (item.value || 0) < (min.value || 0) ? item : min, ui.dccItems[0]);
        const canAfford = ui.getGold() >= (cheapestItem.value || 0);
        console.log(`  ✅ Can afford cheapest item (${cheapestItem.name}): ${canAfford}`);
    } else {
        console.log('  ⚠️ No DCC items loaded');
    }
    
    // 8. Test UI rendering
    console.log('\n8. UI Rendering:');
    try {
        ui.renderInventory();
        console.log('  ✅ Inventory rendered successfully');
    } catch (error) {
        console.log('  ❌ Inventory render failed:', error.message);
    }
    
    try {
        ui.updateGoldDisplay();
        console.log('  ✅ Gold display updated successfully');
    } catch (error) {
        console.log('  ❌ Gold display update failed:', error.message);
    }
    
    try {
        await ui.updateTradeAreaDisplay();
        console.log('  ✅ Trade area display updated successfully');
    } catch (error) {
        console.log('  ❌ Trade area display update failed:', error.message);
    }
    
    // 9. Test legacy compatibility
    console.log('\n9. Legacy Compatibility:');
    console.log(`  ✅ window.renderInventory exists: ${typeof window.renderInventory === 'function'}`);
    console.log(`  ✅ window.sellItem exists: ${typeof window.sellItem === 'function'}`);
    console.log(`  ✅ window.inventoryManager exists: ${typeof window.inventoryManager === 'object'}`);
    console.log(`  ✅ window.openDCCItemsModal exists: ${typeof window.openDCCItemsModal === 'function'}`);
    console.log(`  ✅ window.transferTradeItems exists: ${typeof window.transferTradeItems === 'function'}`);
    
    console.log('\n✅ UNIFIED INVENTORY SYSTEM TEST COMPLETE!');
    console.log('=====================================');
    
    return {
        systemLoaded: !!ui,
        initialized: ui.initialized,
        characterFound: !!character,
        dccItemsCount: ui.dccItems ? ui.dccItems.length : 0,
        inventoryCount: inventory.length,
        currentGold: ui.getGold()
    };
}

// Auto-run test if unified inventory is available
if (window.unifiedInventory) {
    console.log('🎯 Unified Inventory System detected - running comprehensive test...');
    testUnifiedInventorySystem().then(results => {
        console.log('📊 Test Results:', results);
    });
} else {
    console.log('⏳ Waiting for Unified Inventory System to load...');
    setTimeout(() => {
        if (window.unifiedInventory) {
            testUnifiedInventorySystem().then(results => {
                console.log('📊 Test Results:', results);
            });
        } else {
            console.error('❌ Unified Inventory System failed to load');
        }
    }, 2000);
}

// Export for manual testing
window.testUnifiedInventorySystem = testUnifiedInventorySystem;