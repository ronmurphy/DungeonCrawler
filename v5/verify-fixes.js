// Quick verification for missing function fixes
// Run in browser console to verify fixes

console.log('🔧 VERIFYING FUNCTION FIXES');
console.log('============================');

// Test getItemIcon function
console.log('1. Testing getItemIcon function:');
try {
    const iconResult = getItemIcon('Test Sword', 'weapon');
    console.log(`   ✅ getItemIcon works: "${iconResult}"`);
} catch (error) {
    console.error(`   ❌ getItemIcon failed: ${error.message}`);
}

// Test calculateTotalDefense function
console.log('\n2. Testing calculateTotalDefense function:');
try {
    const defenseResult = calculateTotalDefense();
    console.log(`   ✅ calculateTotalDefense works: ${defenseResult}`);
} catch (error) {
    console.error(`   ❌ calculateTotalDefense failed: ${error.message}`);
}

// Test if unified inventory is still working
console.log('\n3. Testing UnifiedInventorySystem:');
if (window.unifiedInventory) {
    console.log(`   ✅ UnifiedInventorySystem loaded: ${window.unifiedInventory.initialized}`);
    console.log(`   ✅ DCC items: ${window.unifiedInventory.dccItems?.length || 0}`);
} else {
    console.error('   ❌ UnifiedInventorySystem not found');
}

// Test character access
console.log('\n4. Testing character access:');
if (window.character) {
    console.log(`   ✅ Global character: ${window.character.name || 'Unnamed'}`);
    console.log(`   ✅ Gold: ${window.character.gold || 0} GP`);
    console.log(`   ✅ Inventory: ${window.character.inventory?.length || 0} items`);
} else {
    console.warn('   ⚠️ No global character found');
}

// Test legacy function compatibility
console.log('\n5. Testing legacy function compatibility:');
const legacyFunctions = ['renderInventory', 'sellItem', 'removeItem', 'openDCCItemsModal'];
legacyFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`   ✅ ${funcName} is available`);
    } else {
        console.error(`   ❌ ${funcName} is missing`);
    }
});

console.log('\n✅ VERIFICATION COMPLETE');
console.log('========================');