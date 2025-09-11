// ========================================
// ITEM GENERATOR
// Generate and manage items and rewards
// ========================================

// ========================================
// ITEM DATA DEFINITIONS
// ========================================
const itemCategories = {
    weapons: {
        name: 'Weapons',
        icon: '⚔️',
        items: [
            // Common (1-2 stars)
            { name: 'Rusty Dagger', rarity: 1, damage: '1d4', properties: ['Light', 'Finesse'], price: 15 },
            { name: 'Wooden Club', rarity: 1, damage: '1d4', properties: ['Simple'], price: 10 },
            { name: 'Hunting Knife', rarity: 1, damage: '1d4', properties: ['Light'], price: 20 },
            { name: 'Simple Bow', rarity: 1, damage: '1d6', properties: ['Ranged'], price: 25 },
            { name: 'Iron Sword', rarity: 2, damage: '1d6', properties: ['Versatile'], price: 45 },
            { name: 'Steel Spear', rarity: 2, damage: '1d6', properties: ['Reach', 'Thrown'], price: 40 },
            
            // Uncommon (3 stars)
            { name: 'Silver Blade', rarity: 3, damage: '1d8', properties: ['Magical', 'Anti-Undead'], price: 120 },
            { name: 'Composite Bow', rarity: 3, damage: '1d8', properties: ['Ranged', 'Long Range'], price: 150 },
            { name: 'War Hammer', rarity: 3, damage: '1d8', properties: ['Heavy', 'Crushing'], price: 100 },
            
            // Rare (4 stars)
            { name: 'Flaming Sword', rarity: 4, damage: '1d8+1d4 fire', properties: ['Magical', 'Fire'], price: 500 },
            { name: 'Frost Axe', rarity: 4, damage: '1d10+1d4 cold', properties: ['Magical', 'Ice', 'Heavy'], price: 600 },
            { name: 'Energy Pistol', rarity: 4, damage: '2d6', properties: ['Tech', 'Ranged', 'Recharge'], price: 800 },
            
            // Legendary (5 stars)
            { name: 'Dragonbane Greatsword', rarity: 5, damage: '2d6+2d6 vs dragons', properties: ['Legendary', 'Dragon Slayer'], price: 5000 },
            { name: 'Void Rifle', rarity: 5, damage: '3d8', properties: ['Legendary', 'Tech', 'Piercing'], price: 8000 },
            { name: 'Staff of Infinite Power', rarity: 5, damage: '1d6+spell level', properties: ['Legendary', 'Spellcasting'], price: 10000 }
        ]
    },
    
    armor: {
        name: 'Armor',
        icon: '🛡️',
        items: [
            // Common (1-2 stars)
            { name: 'Leather Armor', rarity: 1, defense: '+2 AC', properties: ['Light'], price: 25 },
            { name: 'Padded Vest', rarity: 1, defense: '+1 AC', properties: ['Light', 'Stealth'], price: 15 },
            { name: 'Chain Shirt', rarity: 2, defense: '+3 AC', properties: ['Medium'], price: 75 },
            { name: 'Scale Mail', rarity: 2, defense: '+4 AC', properties: ['Medium', 'Noisy'], price: 100 },
            
            // Uncommon (3 stars)
            { name: 'Studded Leather+', rarity: 3, defense: '+3 AC', properties: ['Light', 'Enhanced'], price: 200 },
            { name: 'Chain Mail', rarity: 3, defense: '+5 AC', properties: ['Heavy'], price: 300 },
            { name: 'Kevlar Vest', rarity: 3, defense: '+4 AC vs ranged', properties: ['Modern', 'Ballistic'], price: 400 },
            
            // Rare (4 stars)
            { name: 'Mithril Chainmail', rarity: 4, defense: '+5 AC', properties: ['Magical', 'Light', 'Silent'], price: 2000 },
            { name: 'Plate of Warding', rarity: 4, defense: '+6 AC', properties: ['Magical', 'Spell Resist'], price: 3000 },
            { name: 'Power Armor Mk1', rarity: 4, defense: '+7 AC', properties: ['Tech', 'Powered', 'Heavy'], price: 5000 },
            
            // Legendary (5 stars)
            { name: 'Dragonscale Armor', rarity: 5, defense: '+8 AC', properties: ['Legendary', 'Fire Immunity'], price: 15000 },
            { name: 'Void Plate', rarity: 5, defense: '+9 AC', properties: ['Legendary', 'Phase Shift'], price: 20000 }
        ]
    },
    
    consumables: {
        name: 'Consumables',
        icon: '🧪',
        items: [
            // Common (1-2 stars)
            { name: 'Health Potion', rarity: 1, effect: 'Heal 1d4+1 HP', properties: ['Healing'], price: 25 },
            { name: 'Rations (1 day)', rarity: 1, effect: 'Sustenance', properties: ['Food'], price: 5 },
            { name: 'Antidote', rarity: 1, effect: 'Cure poison', properties: ['Medicine'], price: 30 },
            { name: 'Energy Drink', rarity: 2, effect: '+2 to next roll', properties: ['Buff'], price: 15 },
            { name: 'Bandages', rarity: 1, effect: 'Stop bleeding', properties: ['Medical'], price: 10 },
            
            // Uncommon (3 stars)
            { name: 'Greater Health Potion', rarity: 3, effect: 'Heal 2d4+2 HP', properties: ['Healing'], price: 100 },
            { name: 'Magic Scroll', rarity: 3, effect: 'Cast 1st level spell', properties: ['Magic'], price: 150 },
            { name: 'Stimpack', rarity: 3, effect: 'Heal 3d4 HP instantly', properties: ['Tech', 'Medical'], price: 200 },
            
            // Rare (4 stars)
            { name: 'Potion of Giant Strength', rarity: 4, effect: '+4 STR for 1 hour', properties: ['Enhancement'], price: 500 },
            { name: 'Elixir of Invisibility', rarity: 4, effect: 'Invisible for 10 minutes', properties: ['Stealth'], price: 800 },
            { name: 'Nano-healers', rarity: 4, effect: 'Heal 4d4+4 HP over time', properties: ['Tech'], price: 600 },
            
            // Legendary (5 stars)
            { name: 'Elixir of Life', rarity: 5, effect: 'Restore all HP and remove all conditions', properties: ['Legendary'], price: 5000 },
            { name: 'Potion of Godlike Power', rarity: 5, effect: '+10 to all stats for 1 hour', properties: ['Legendary'], price: 10000 }
        ]
    },
    
    magic: {
        name: 'Magic Items',
        icon: '✨',
        items: [
            // Common (1-2 stars)
            { name: 'Glowing Stone', rarity: 1, effect: 'Light source', properties: ['Utility'], price: 20 },
            { name: 'Lucky Coin', rarity: 2, effect: 'Reroll one die per day', properties: ['Luck'], price: 50 },
            { name: 'Sending Stone', rarity: 2, effect: 'Communicate over distance', properties: ['Communication'], price: 100 },
            
            // Uncommon (3 stars)
            { name: 'Ring of Protection', rarity: 3, effect: '+1 AC and saves', properties: ['Protection'], price: 500 },
            { name: 'Cloak of Elvenkind', rarity: 3, effect: '+2 to stealth', properties: ['Stealth'], price: 400 },
            { name: 'Bag of Holding', rarity: 3, effect: 'Store extra items', properties: ['Utility'], price: 1000 },
            
            // Rare (4 stars)
            { name: 'Boots of Speed', rarity: 4, effect: 'Double movement speed', properties: ['Movement'], price: 2000 },
            { name: 'Amulet of Health', rarity: 4, effect: '+2 CON permanently', properties: ['Enhancement'], price: 3000 },
            { name: 'Crystal of Power', rarity: 4, effect: '+2 spell levels', properties: ['Spellcasting'], price: 4000 },
            
            // Legendary (5 stars)
            { name: 'Crown of Command', rarity: 5, effect: 'Dominate person at will', properties: ['Legendary', 'Mind Control'], price: 50000 },
            { name: 'Orb of Dragonkind', rarity: 5, effect: 'Control dragons', properties: ['Legendary', 'Dragon Control'], price: 100000 }
        ]
    },
    
    tech: {
        name: 'Tech Items',
        icon: '🔧',
        items: [
            // Common (1-2 stars)
            { name: 'Flashlight', rarity: 1, effect: 'Bright light', properties: ['Utility'], price: 15 },
            { name: 'Radio', rarity: 1, effect: 'Short range communication', properties: ['Communication'], price: 40 },
            { name: 'Multitool', rarity: 2, effect: '+2 to repair checks', properties: ['Tool'], price: 60 },
            { name: 'Scanner', rarity: 2, effect: 'Detect electronics', properties: ['Detection'], price: 100 },
            
            // Uncommon (3 stars)
            { name: 'Holo-projector', rarity: 3, effect: 'Create illusions', properties: ['Illusion'], price: 500 },
            { name: 'Energy Shield', rarity: 3, effect: '+3 AC vs energy', properties: ['Defense'], price: 800 },
            { name: 'Jet Pack', rarity: 3, effect: 'Short-range flight', properties: ['Movement'], price: 1200 },
            
            // Rare (4 stars)
            { name: 'Cloaking Device', rarity: 4, effect: 'Invisibility to tech', properties: ['Stealth'], price: 5000 },
            { name: 'Neural Interface', rarity: 4, effect: 'Mind-machine link', properties: ['Cybernetic'], price: 8000 },
            { name: 'Teleporter', rarity: 4, effect: 'Short-range teleport', properties: ['Transport'], price: 10000 },
            
            // Legendary (5 stars)
            { name: 'AI Companion', rarity: 5, effect: 'Sentient AI assistant', properties: ['Legendary', 'AI'], price: 100000 },
            { name: 'Matter Compiler', rarity: 5, effect: 'Create any item', properties: ['Legendary', 'Creation'], price: 500000 }
        ]
    },
    
    misc: {
        name: 'Miscellaneous',
        icon: '📦',
        items: [
            // Common (1-2 stars)
            { name: 'Rope (50ft)', rarity: 1, effect: 'Climbing utility', properties: ['Utility'], price: 10 },
            { name: 'Lantern', rarity: 1, effect: 'Light source', properties: ['Utility'], price: 15 },
            { name: 'Lockpicks', rarity: 2, effect: '+2 to lockpicking', properties: ['Tools'], price: 25 },
            { name: 'Spy Glass', rarity: 2, effect: 'See distant objects', properties: ['Utility'], price: 100 },
            { name: 'Map', rarity: 1, effect: 'Navigation aid', properties: ['Navigation'], price: 20 },
            
            // Uncommon (3 stars)
            { name: 'Grappling Hook', rarity: 3, effect: 'Advanced climbing', properties: ['Utility'], price: 200 },
            { name: 'Disguise Kit', rarity: 3, effect: '+4 to disguise', properties: ['Stealth'], price: 300 },
            { name: 'Portable Shelter', rarity: 3, effect: 'Instant camp setup', properties: ['Survival'], price: 500 },
            
            // Rare (4 stars)
            { name: 'Universal Key', rarity: 4, effect: 'Opens any mundane lock', properties: ['Utility'], price: 2000 },
            { name: 'Dimensional Anchor', rarity: 4, effect: 'Prevent teleportation', properties: ['Control'], price: 3000 },
            
            // Legendary (5 stars)
            { name: 'Philosopher\'s Stone', rarity: 5, effect: 'Transform materials', properties: ['Legendary', 'Alchemy'], price: 1000000 }
        ]
    }
};

const rarityData = {
    1: { name: 'Common', stars: '⭐', color: '#9ca3af', weight: 50 },
    2: { name: 'Common+', stars: '⭐⭐', color: '#6b7280', weight: 30 },
    3: { name: 'Uncommon', stars: '⭐⭐⭐', color: '#10b981', weight: 15 },
    4: { name: 'Rare', stars: '⭐⭐⭐⭐', color: '#3b82f6', weight: 4 },
    5: { name: 'Legendary', stars: '⭐⭐⭐⭐⭐', color: '#f59e0b', weight: 1 }
};

// ========================================
// CURRENT GENERATED LOOT
// ========================================
let currentLootTable = null;

// ========================================
// LOOT GENERATION
// ========================================
function generateLootTable() {
    const lootType = document.getElementById('loot-type-select').value;
    const partySize = parseInt(document.getElementById('party-size').value);
    const difficulty = parseInt(document.getElementById('loot-difficulty').value);
    const categories = document.getElementById('item-categories').value;
    const specialItemCount = parseInt(document.getElementById('special-item-count').value);
    
    // Generate loot based on type
    const lootTable = {
        id: generateId(),
        type: lootType,
        partySize: partySize,
        difficulty: difficulty,
        categories: categories,
        specialItemCount: specialItemCount,
        items: [],
        created: new Date().toISOString()
    };
    
    // Generate items based on type
    switch (lootType) {
        case 'shop':
            lootTable.items = generateShopInventory(partySize, difficulty, categories, specialItemCount);
            lootTable.title = `${getLootTypeIcon(lootType)} ${capitalize(lootType)} Inventory`;
            break;
        case 'encounter':
            lootTable.items = generateEncounterLoot(partySize, difficulty, categories);
            lootTable.title = `${getLootTypeIcon(lootType)} Encounter Loot (${rarityData[difficulty].stars})`;
            break;
        case 'quest':
            lootTable.items = generateQuestReward(partySize, difficulty, categories);
            lootTable.title = `${getLootTypeIcon(lootType)} Quest Reward (${rarityData[difficulty].stars})`;
            break;
        case 'treasure':
            lootTable.items = generateTreasureHoard(partySize, difficulty, categories);
            lootTable.title = `${getLootTypeIcon(lootType)} Treasure Hoard (${rarityData[difficulty].stars})`;
            break;
        case 'single':
            lootTable.items = [generateSingleItem(difficulty, categories)];
            lootTable.title = `${getLootTypeIcon(lootType)} Random Item`;
            break;
    }
    
    currentLootTable = lootTable;
    displayLootTable(currentLootTable);
    
    // Show action buttons
    document.getElementById('loot-actions').style.display = 'flex';
}

function generateShopInventory(partySize, difficulty, categories, specialItemCount) {
    const items = [];
    const itemCount = Math.max(5, partySize * 2 + rollDice(4)); // 5-14 items typically
    
    // Generate mostly common items
    const commonCount = itemCount - specialItemCount;
    for (let i = 0; i < commonCount; i++) {
        const item = generateItemByRarity([1, 2], categories);
        if (item) items.push({ ...item, isSpecial: false });
    }
    
    // Add special items
    for (let i = 0; i < specialItemCount; i++) {
        const specialRarity = Math.min(5, difficulty + rollDice(2));
        const item = generateItemByRarity([specialRarity], categories);
        if (item) items.push({ ...item, isSpecial: true });
    }
    
    return items;
}

function generateEncounterLoot(partySize, difficulty, categories) {
    const items = [];
    const itemCount = Math.max(1, Math.floor(partySize / 2) + rollDice(2));
    
    for (let i = 0; i < itemCount; i++) {
        const item = generateItemByDifficulty(difficulty, categories);
        if (item) items.push(item);
    }
    
    return items;
}

function generateQuestReward(partySize, difficulty, categories) {
    const items = [];
    const guaranteedRarity = Math.max(difficulty - 1, 1);
    
    // Guaranteed item of appropriate rarity
    const mainReward = generateItemByRarity([guaranteedRarity, difficulty], categories);
    if (mainReward) items.push(mainReward);
    
    // Possible bonus items for higher difficulties
    if (difficulty >= 4 && rollDice(6) >= 4) {
        const bonusItem = generateItemByRarity([1, 2, 3], categories);
        if (bonusItem) items.push(bonusItem);
    }
    
    return items;
}

function generateTreasureHoard(partySize, difficulty, categories) {
    const items = [];
    const itemCount = partySize + rollDice(difficulty);
    
    for (let i = 0; i < itemCount; i++) {
        const item = generateItemByDifficulty(difficulty, categories);
        if (item) items.push(item);
    }
    
    return items;
}

function generateSingleItem(difficulty, categories) {
    return generateItemByDifficulty(difficulty, categories);
}

function generateItemByDifficulty(difficulty, categories) {
    // Create weighted rarity array based on difficulty
    const rarityWeights = [];
    
    for (let rarity = 1; rarity <= 5; rarity++) {
        const baseWeight = rarityData[rarity].weight;
        let adjustedWeight = baseWeight;
        
        // Boost weights based on difficulty
        if (rarity <= difficulty) {
            adjustedWeight *= (1 + (difficulty - rarity) * 0.5);
        } else {
            adjustedWeight *= Math.max(0.1, 1 - (rarity - difficulty) * 0.3);
        }
        
        for (let i = 0; i < Math.round(adjustedWeight); i++) {
            rarityWeights.push(rarity);
        }
    }
    
    const selectedRarity = getRandomElement(rarityWeights);
    return generateItemByRarity([selectedRarity], categories);
}

function generateItemByRarity(allowedRarities, categories) {
    const availableItems = [];
    
    // Get all items from specified categories and rarities
    const categoriesToSearch = categories === 'all' ? Object.keys(itemCategories) : [categories];
    
    categoriesToSearch.forEach(category => {
        if (itemCategories[category]) {
            itemCategories[category].items.forEach(item => {
                if (allowedRarities.includes(item.rarity)) {
                    availableItems.push({
                        ...item,
                        category: category,
                        categoryName: itemCategories[category].name,
                        categoryIcon: itemCategories[category].icon
                    });
                }
            });
        }
    });
    
    if (availableItems.length === 0) return null;
    
    return getRandomElement(availableItems);
}

// ========================================
// LOOT DISPLAY
// ========================================
function displayLootTable(lootTable) {
    const display = document.getElementById('generated-loot');
    
    const totalValue = lootTable.items.reduce((sum, item) => sum + (item.price || 0), 0);
    const rarityDistribution = getRarityDistribution(lootTable.items);
    
    display.innerHTML = `
        <div class="loot-table-card">
            <div class="loot-header">
                <div class="loot-title">${lootTable.title}</div>
                <div class="loot-summary">
                    <span class="item-count">${lootTable.items.length} items</span>
                    <span class="total-value">💰 ${totalValue.toLocaleString()} gold</span>
                </div>
            </div>
            
            <div class="loot-items">
                ${lootTable.items.map(item => createItemCard(item)).join('')}
            </div>
            
            <div class="loot-footer">
                <div class="rarity-breakdown">
                    <h4>Rarity Breakdown:</h4>
                    ${Object.entries(rarityDistribution).map(([rarity, count]) => `
                        <span class="rarity-stat" style="color: ${rarityData[rarity].color}">
                            ${rarityData[rarity].stars} ${count}
                        </span>
                    `).join(' | ')}
                </div>
            </div>
        </div>
    `;
}

function createItemCard(item) {
    const rarity = rarityData[item.rarity];
    const specialBadge = item.isSpecial ? '<span class="special-badge">⭐ SPECIAL</span>' : '';
    
    return `
        <div class="item-card rarity-${item.rarity}">
            <div class="item-header">
                <div class="item-name">
                    ${item.categoryIcon} ${item.name}
                    ${specialBadge}
                </div>
                <div class="item-rarity" style="color: ${rarity.color}">
                    ${rarity.stars}
                </div>
            </div>
            
            <div class="item-details">
                <div class="item-category">${item.categoryName}</div>
                ${item.damage ? `<div class="item-stat">⚔️ ${item.damage}</div>` : ''}
                ${item.defense ? `<div class="item-stat">🛡️ ${item.defense}</div>` : ''}
                ${item.effect ? `<div class="item-effect">✨ ${item.effect}</div>` : ''}
                ${item.properties ? `<div class="item-properties">${item.properties.join(', ')}</div>` : ''}
            </div>
            
            <div class="item-footer">
                <div class="item-price">💰 ${item.price?.toLocaleString() || 'Priceless'}</div>
            </div>
        </div>
    `;
}

function getRarityDistribution(items) {
    const distribution = {};
    items.forEach(item => {
        distribution[item.rarity] = (distribution[item.rarity] || 0) + 1;
    });
    return distribution;
}

// ========================================
// LOOT ACTIONS
// ========================================
function saveCurrentLoot() {
    if (!currentLootTable) return;
    
    currentSession.items.push({ ...currentLootTable });
    refreshSavedLoot();
    updateLootStats();
    
    showNotification('success', 'Loot Table Saved', 
        `Saved "${currentLootTable.title}"`, 
        `Added to ${currentSession.name}`);
}

function copyLootToClipboard() {
    if (!currentLootTable) return;
    
    const lootText = formatLootForText(currentLootTable);
    
    copyToClipboard(lootText).then(() => {
        showNotification('success', 'Loot Copied', 
            'Loot table copied to clipboard', 
            'Ready to paste into your notes');
    }).catch(error => {
        console.error('Copy failed:', error);
        showNotification('error', 'Copy Failed', 
            'Could not copy to clipboard', 
            'Try manually selecting the text');
    });
}

function rerollLootTable() {
    generateLootTable();
    showNotification('info', 'Loot Rerolled', 
        'Generated new loot table', 
        'Same settings, different results!');
}

function formatLootForText(lootTable) {
    const totalValue = lootTable.items.reduce((sum, item) => sum + (item.price || 0), 0);
    
    let text = `${lootTable.title}\n`;
    text += `${lootTable.items.length} items | Total Value: ${totalValue.toLocaleString()} gold\n\n`;
    
    lootTable.items.forEach((item, index) => {
        const rarity = rarityData[item.rarity];
        text += `${index + 1}. ${item.name} ${rarity.stars}\n`;
        text += `   Category: ${item.categoryName}\n`;
        if (item.damage) text += `   Damage: ${item.damage}\n`;
        if (item.defense) text += `   Defense: ${item.defense}\n`;
        if (item.effect) text += `   Effect: ${item.effect}\n`;
        if (item.properties) text += `   Properties: ${item.properties.join(', ')}\n`;
        text += `   Price: ${item.price?.toLocaleString() || 'Priceless'} gold\n\n`;
    });
    
    return text;
}

// ========================================
// SAVED LOOT MANAGEMENT
// ========================================
function refreshSavedLoot() {
    const container = document.getElementById('saved-loot-container');
    if (!container) return;
    
    const filterElement = document.getElementById('loot-filter');
    const filter = filterElement ? filterElement.value : 'all';
    
    let lootToShow = currentSession.items || [];
    if (filter !== 'all') {
        lootToShow = lootToShow.filter(loot => loot.type === filter);
    }
    
    if (lootToShow.length === 0) {
        container.innerHTML = `
            <div class="no-loot">
                <i class="ra ra-gem" style="font-size: 3em; margin-bottom: 15px; color: #6b7280;"></i>
                <p>No saved loot tables yet. Generate and save some items to build your treasure vault!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lootToShow.map(loot => createSavedLootCard(loot)).join('');
}

function createSavedLootCard(loot) {
    const totalValue = loot.items.reduce((sum, item) => sum + (item.price || 0), 0);
    const legendaryCount = loot.items.filter(item => item.rarity === 5).length;
    
    return `
        <div class="saved-loot-card" onclick="loadSavedLoot('${loot.id}')">
            <div class="saved-loot-header">
                <div class="saved-loot-title">${loot.title}</div>
                <div class="saved-loot-value">💰 ${totalValue.toLocaleString()}</div>
            </div>
            
            <div class="saved-loot-details">
                ${loot.items.length} items | ${capitalize(loot.type)} | ${rarityData[loot.difficulty].stars}
                ${legendaryCount > 0 ? `| ${legendaryCount} Legendary` : ''}
            </div>
            
            <div class="saved-loot-actions">
                <button class="saved-action-btn" onclick="event.stopPropagation(); copySavedLoot('${loot.id}')" title="Copy">
                    📋
                </button>
                <button class="saved-action-btn delete-saved-btn" onclick="event.stopPropagation(); deleteSavedLoot('${loot.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function loadSavedLoot(lootId) {
    const loot = currentSession.items.find(l => l.id === lootId);
    if (loot) {
        currentLootTable = { ...loot };
        displayLootTable(currentLootTable);
        document.getElementById('loot-actions').style.display = 'flex';
        
        showNotification('info', 'Loot Table Loaded', 
            `Loaded "${loot.title}"`, 
            'You can now copy or modify this loot table');
    }
}

function copySavedLoot(lootId) {
    const loot = currentSession.items.find(l => l.id === lootId);
    if (loot) {
        const lootText = formatLootForText(loot);
        copyToClipboard(lootText).then(() => {
            showNotification('success', 'Loot Copied', 
                `"${loot.title}" copied to clipboard`, 
                'Ready to paste into your notes');
        });
    }
}

function deleteSavedLoot(lootId) {
    const loot = currentSession.items.find(l => l.id === lootId);
    if (loot && confirm(`Delete "${loot.title}"?\n\nThis action cannot be undone.`)) {
        currentSession.items = currentSession.items.filter(l => l.id !== lootId);
        refreshSavedLoot();
        updateLootStats();
        
        showNotification('success', 'Loot Table Deleted', 
            `Deleted "${loot.title}"`, 
            'Loot table removed from session');
    }
}

function clearAllLoot() {
    if (!currentSession.items || currentSession.items.length === 0) return;
    
    if (confirm(`Clear all loot tables from ${currentSession.name}?\n\nThis will remove ${currentSession.items.length} loot tables and cannot be undone.`)) {
        currentSession.items = [];
        refreshSavedLoot();
        updateLootStats();
        
        showNotification('success', 'Loot Tables Cleared', 
            'All loot tables removed', 
            'Session cleared successfully');
    }
}

function updateLootStats() {
    const allItems = [];
    (currentSession.items || []).forEach(loot => {
        allItems.push(...loot.items);
    });
    
    // Update total items
    const totalElement = document.getElementById('total-items');
    if (totalElement) {
        totalElement.textContent = allItems.length;
    }
    
    if (allItems.length === 0) {
        const avgElement = document.getElementById('avg-rarity');
        const categoryElement = document.getElementById('most-common-category');
        const legendaryElement = document.getElementById('legendary-count');
        if (avgElement) avgElement.textContent = '0';
        if (categoryElement) categoryElement.textContent = 'None';
        if (legendaryElement) legendaryElement.textContent = '0';
        return;
    }
    
    // Calculate average rarity
    const avgRarity = allItems.reduce((sum, item) => sum + item.rarity, 0) / allItems.length;
    const avgElement = document.getElementById('avg-rarity');
    if (avgElement) {
        avgElement.textContent = Math.round(avgRarity * 10) / 10;
    }
    
    // Find most common category
    const categoryCounts = {};
    allItems.forEach(item => {
        categoryCounts[item.categoryName] = (categoryCounts[item.categoryName] || 0) + 1;
    });
    
    const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b, 'None'
    );
    
    const categoryElement = document.getElementById('most-common-category');
    if (categoryElement) {
        categoryElement.textContent = mostCommonCategory;
    }
    
    // Count legendary items
    const legendaryCount = allItems.filter(item => item.rarity === 5).length;
    const legendaryElement = document.getElementById('legendary-count');
    if (legendaryElement) {
        legendaryElement.textContent = legendaryCount;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function getLootTypeIcon(type) {
    const icons = {
        shop: '🏪',
        encounter: '⚔️',
        quest: '🎯',
        treasure: '💰',
        single: '🎲'
    };
    return icons[type] || '📦';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// EVENT LISTENERS & INITIALIZATION
// ========================================
function initializeItemGenerator() {
    // Loot type change listener
    const lootTypeSelect = document.getElementById('loot-type-select');
    const lootFilter = document.getElementById('loot-filter');
    
    if (lootTypeSelect) {
        lootTypeSelect.addEventListener('change', updateLootOptions);
    }
    if (lootFilter) {
        lootFilter.addEventListener('change', refreshSavedLoot);
    }
    
    // Initialize options visibility
    updateLootOptions();
    refreshSavedLoot();
    updateLootStats();
}

function updateLootOptions() {
    const lootTypeElement = document.getElementById('loot-type-select');
    const lootType = lootTypeElement ? lootTypeElement.value : 'treasure';
    const specialItemsGroup = document.getElementById('special-items-group');
    
    // Show/hide special items option based on loot type
    if (lootType === 'shop' && specialItemsGroup) {
        specialItemsGroup.style.display = 'block';
    } else if (specialItemsGroup) {
        specialItemsGroup.style.display = 'none';
    }
}

function refreshItemsDisplay() {
    refreshSavedLoot();
    updateLootStats();
}

// ========================================
// GLOBAL EXPORTS
// ========================================
window.generateLootTable = generateLootTable;
window.saveCurrentLoot = saveCurrentLoot;
window.copyLootToClipboard = copyLootToClipboard;
window.rerollLootTable = rerollLootTable;
window.loadSavedLoot = loadSavedLoot;
window.copySavedLoot = copySavedLoot;
window.deleteSavedLoot = deleteSavedLoot;
window.clearAllLoot = clearAllLoot;
window.refreshItemsDisplay = refreshItemsDisplay;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeItemGenerator, 100);
});