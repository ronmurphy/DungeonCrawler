/**
 * Modern Inventory Manager for V4-network
 * Handles DCC items loading, trade area, and inventory grid
 */

class InventoryManager {
    constructor() {
        this.dccItems = null;
        this.playerInventory = [];
        this.tradeAreaItems = [];
        this.playerGold = 0;
        this.initialized = false;
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM is already ready
            this.init();
        }
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadDCCItems();
            this.setupEventListeners();
            this.initialized = true;
            console.log('✅ Inventory Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Inventory Manager:', error);
        }
    }

    /**
     * Load DCC items from dcc-items.json
     */
    async loadDCCItems() {
        try {
            const response = await fetch('data/dcc-items.json');
            this.dccItems = await response.json();
            console.log('✅ DCC Items loaded:', Object.keys(this.dccItems).length, 'categories');
        } catch (error) {
            console.error('❌ Failed to load DCC items:', error);
            this.dccItems = { weapons: [], armor: [], equipment: [], adventuring_gear: [] };
        }
    }

    /**
     * Setup event listeners for inventory interactions
     */
    setupEventListeners() {
        // Update gold display when character loads
        document.addEventListener('characterLoaded', () => {
            this.updateGoldDisplay();
            this.updateTradeAreaDisplay();
            this.renderInventory();
        });

        // Listen for loot storage events
        window.addEventListener('lootStored', (event) => {
            this.updateTradeAreaDisplay();
        });

        // Close modal when clicking outside
        document.addEventListener('click', (event) => {
            const modal = document.getElementById('dcc-items-modal');
            if (event.target === modal) {
                this.closeDCCItemsModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeDCCItemsModal();
            }
        });
    }

    /**
     * Update the gold display in inventory header
     */
    updateGoldDisplay() {
        const goldElement = document.getElementById('character-gold');
        if (goldElement && window.character) {
            this.playerGold = window.character.gold || 0;
            goldElement.textContent = this.playerGold.toLocaleString();
        }
    }

    /**
     * Update trade area display with loot from storage
     */
    async updateTradeAreaDisplay() {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) return;

        try {
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            
            const tradeGrid = document.getElementById('trade-grid');
            const tradeSection = document.getElementById('trade-area-section');
            
            if (!tradeGrid || !tradeSection) return;

            // Hide section if no loot
            if (!tradeArea || (!tradeArea.gold && (!tradeArea.items || tradeArea.items.length === 0))) {
                tradeSection.style.display = 'none';
                return;
            }

            // Show section and populate
            tradeSection.style.display = 'block';
            tradeGrid.innerHTML = '';

            // Add gold if present
            if (tradeArea.gold && tradeArea.gold > 0) {
                const goldItem = document.createElement('div');
                goldItem.className = 'trade-item';
                goldItem.innerHTML = `
                    <div class="trade-item-name">💰 ${tradeArea.gold} Gold</div>
                    <div class="trade-item-type">Currency</div>
                `;
                goldItem.onclick = () => this.transferGoldToCharacter(tradeArea.gold);
                tradeGrid.appendChild(goldItem);
            }

            // Add items if present
            if (tradeArea.items && tradeArea.items.length > 0) {
                tradeArea.items.forEach((item, index) => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'trade-item';
                    
                    const quantity = item.quantity > 1 ? ` (${item.quantity})` : '';
                    const icon = this.getItemIcon(item.type);
                    
                    itemElement.innerHTML = `
                        <div class="trade-item-name">${icon} ${item.name}${quantity}</div>
                        <div class="trade-item-type">${item.type || 'Item'}</div>
                    `;
                    itemElement.onclick = () => this.transferItemToInventory(item, index);
                    tradeGrid.appendChild(itemElement);
                });
            }

        } catch (error) {
            console.error('❌ Failed to update trade area display:', error);
        }
    }

    /**
     * Transfer gold from trade area to character
     */
    async transferGoldToCharacter(amount) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName || !window.character) return;

        try {
            // Add gold to character
            window.character.gold = (window.character.gold || 0) + amount;
            
            // Remove gold from trade area
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            if (tradeArea) {
                tradeArea.gold = 0;
                await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea);
            }

            // Update displays
            this.updateGoldDisplay();
            this.updateTradeAreaDisplay();
            
            // Save character
            if (typeof saveCharacterData === 'function') {
                saveCharacterData();
            }

            console.log(`✅ Transferred ${amount} gold to character`);
        } catch (error) {
            console.error('❌ Failed to transfer gold:', error);
        }
    }

    /**
     * Transfer item from trade area to inventory
     */
    async transferItemToInventory(item, itemIndex) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName || !window.character) return;

        try {
            // Add item to character inventory
            if (!window.character.inventory) {
                window.character.inventory = [];
            }
            
            // Create inventory item
            const inventoryItem = {
                id: Date.now() + Math.random(),
                name: item.name,
                type: item.type || 'misc',
                quantity: item.quantity || 1,
                source: 'loot',
                dateAdded: new Date().toISOString()
            };
            
            window.character.inventory.push(inventoryItem);

            // Remove item from trade area
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            if (tradeArea && tradeArea.items) {
                tradeArea.items.splice(itemIndex, 1);
                await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea);
            }

            // Update displays
            this.updateTradeAreaDisplay();
            this.renderInventory();
            
            // Save character
            if (typeof saveCharacterData === 'function') {
                saveCharacterData();
            }

            console.log(`✅ Transferred ${item.name} to inventory`);
        } catch (error) {
            console.error('❌ Failed to transfer item:', error);
        }
    }

    /**
     * Render the main inventory grid
     */
    renderInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid || !window.character) return;

        const inventory = window.character.inventory || [];
        
        if (inventory.length === 0) {
            inventoryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="ra ra-backpack"></i>
                    <p>Your inventory is empty</p>
                </div>
            `;
            return;
        }

        inventoryGrid.innerHTML = '';
        inventory.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            
            const icon = this.getItemIcon(item.type);
            const quantity = item.quantity > 1 ? ` (${item.quantity})` : '';
            
            // Create equipment-style card
            itemElement.innerHTML = `
                <div class="item-header">
                    <div class="item-icon-name">
                        <span class="item-icon">${icon}</span>
                        <span class="item-name">${item.name}${quantity}</span>
                    </div>
                    <div class="item-actions">
                        ${this.canEquip(item) ? `<button class="item-action-btn equip-btn" onclick="window.inventoryManager.equipItem(${index})" title="Equip">⚔️</button>` : ''}
                        <button class="item-action-btn remove-btn" onclick="window.inventoryManager.removeItem(${index})" title="Remove">🗑️</button>
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-type-badge">${item.type}</div>
                    ${item.damage ? `<div class="item-stat">⚔️ Damage: ${item.damage}</div>` : ''}
                    ${item.defense ? `<div class="item-stat">🛡️ Defense: +${item.defense}</div>` : ''}
                    ${item.value ? `<div class="item-value">💰 ${item.value} GP</div>` : ''}
                    ${item.properties && item.properties.length > 0 ? `
                        <div class="item-properties">
                            ${item.properties.map(prop => `<span class="item-property">${prop}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            
            itemElement.onclick = () => this.showItemDetails(item, index);
            inventoryGrid.appendChild(itemElement);
        });
    }

    /**
     * Check if an item can be equipped
     */
    canEquip(item) {
        const equipableTypes = ['weapon', 'armor', 'accessory'];
        return equipableTypes.includes(item.type?.toLowerCase());
    }

    /**
     * Equip an item from inventory
     */
    equipItem(itemIndex) {
        if (!window.character || !window.character.inventory) return;
        
        const item = window.character.inventory[itemIndex];
        if (!item || !this.canEquip(item)) return;

        // Determine equipment slot
        let slot = '';
        switch (item.type?.toLowerCase()) {
            case 'weapon':
                slot = 'mainHand';
                break;
            case 'armor':
                slot = 'armor';
                break;
            case 'accessory':
                slot = 'accessory';
                break;
            default:
                console.warn('Cannot determine equipment slot for:', item);
                return;
        }

        // Unequip current item if any
        if (window.character.equipment[slot]) {
            this.unequipItem(slot);
        }

        // Equip the new item
        window.character.equipment[slot] = { ...item };
        
        // Remove from inventory
        window.character.inventory.splice(itemIndex, 1);

        // Update displays
        this.renderInventory();
        if (typeof updateEquipmentDisplay === 'function') {
            updateEquipmentDisplay();
        }

        // Save character
        if (typeof saveCharacterData === 'function') {
            saveCharacterData();
        }

        console.log(`✅ Equipped ${item.name} to ${slot}`);
    }

    /**
     * Unequip an item and return it to inventory
     */
    unequipItem(slot) {
        if (!window.character || !window.character.equipment[slot]) return;

        const item = window.character.equipment[slot];
        
        // Add to inventory
        if (!window.character.inventory) {
            window.character.inventory = [];
        }
        window.character.inventory.push({ ...item });

        // Remove from equipment
        window.character.equipment[slot] = null;

        console.log(`✅ Unequipped ${item.name} from ${slot}`);
    }

    /**
     * Remove an item from inventory
     */
    removeItem(itemIndex) {
        if (!window.character || !window.character.inventory) return;
        
        const item = window.character.inventory[itemIndex];
        if (!item) return;

        const confirmDelete = confirm(`Are you sure you want to remove "${item.name}" from your inventory?`);
        if (!confirmDelete) return;

        window.character.inventory.splice(itemIndex, 1);
        this.renderInventory();

        // Save character
        if (typeof saveCharacterData === 'function') {
            saveCharacterData();
        }

        console.log(`🗑️ Removed ${item.name} from inventory`);
    }

    /**
     * Get appropriate icon for item type
     */
    getItemIcon(type) {
        const icons = {
            weapon: '⚔️',
            armor: '🛡️',
            accessory: '💍',
            consumable: '🧪',
            misc: '📦',
            crafting: '🔧',
            quest: '📜',
            currency: '💰'
        };
        return icons[type] || icons.misc;
    }

    /**
     * Show item details modal/popup
     */
    showItemDetails(item, index) {
        // For now, show an alert with item details
        let details = `${item.name}\n\n`;
        details += `Type: ${item.type}\n`;
        if (item.quantity > 1) details += `Quantity: ${item.quantity}\n`;
        if (item.damage) details += `Damage: ${item.damage}\n`;
        if (item.defense) details += `Defense: +${item.defense}\n`;
        if (item.value) details += `Value: ${item.value} GP\n`;
        if (item.properties && item.properties.length > 0) {
            details += `Properties: ${item.properties.join(', ')}\n`;
        }
        if (item.source) details += `Source: ${item.source}\n`;
        
        alert(details);
    }

    /**
     * Open DCC Items Modal
     */
    openDCCItemsModal() {
        const modal = document.getElementById('dcc-items-modal');
        if (!modal) return;

        modal.style.display = 'block';
        this.renderDCCItemsModal();
    }

    /**
     * Close DCC Items Modal
     */
    closeDCCItemsModal() {
        const modal = document.getElementById('dcc-items-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Render DCC items in the modal
     */
    renderDCCItemsModal() {
        const grid = document.getElementById('dcc-items-modal-grid');
        const categoryFilter = document.getElementById('dcc-modal-category-filter');
        const searchInput = document.getElementById('dcc-items-search');
        
        if (!grid || !this.dccItems) {
            if (grid) {
                grid.innerHTML = `
                    <div class="loading-state">
                        <i class="ra ra-spinning-sword"></i>
                        <p>Loading DCC items...</p>
                    </div>
                `;
            }
            return;
        }

        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        grid.innerHTML = '';

        // Get items based on category filter
        let itemsToShow = [];
        if (selectedCategory === 'all') {
            Object.values(this.dccItems).forEach(category => {
                if (Array.isArray(category)) {
                    itemsToShow.push(...category);
                }
            });
        } else {
            itemsToShow = this.dccItems[selectedCategory] || [];
        }

        // Apply search filter
        if (searchTerm) {
            itemsToShow = itemsToShow.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                (item.properties && item.properties.some(prop => prop.toLowerCase().includes(searchTerm)))
            );
        }

        if (itemsToShow.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="ra ra-cancel"></i>
                    <p>No items found</p>
                </div>
            `;
            return;
        }

        // Render items
        itemsToShow.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'dcc-modal-item';
            
            const icon = this.getItemIcon(item.type?.toLowerCase());
            
            itemElement.innerHTML = `
                <button class="dcc-modal-item-add-btn" onclick="window.inventoryManager.addDCCItemToInventory(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Add to Inventory">
                    <span class="material-icons">add</span>
                </button>
                
                <div class="dcc-modal-item-header">
                    <span class="dcc-modal-item-icon">${icon}</span>
                    <div class="dcc-modal-item-name">${item.name}</div>
                    <div class="dcc-modal-item-type">${item.type || 'Item'}</div>
                </div>
                
                <div class="dcc-modal-item-stats">
                    ${item.damage ? `
                        <div class="dcc-modal-item-stat">
                            <span class="dcc-modal-item-stat-label">Damage:</span>
                            <span class="dcc-modal-item-stat-value">${item.damage}</span>
                        </div>
                    ` : ''}
                    ${item.defense ? `
                        <div class="dcc-modal-item-stat">
                            <span class="dcc-modal-item-stat-label">Defense:</span>
                            <span class="dcc-modal-item-stat-value">+${item.defense}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${item.properties && item.properties.length > 0 ? `
                    <div class="dcc-modal-item-properties">
                        ${item.properties.map(prop => `<span class="dcc-modal-item-property">${prop}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="dcc-modal-item-value">💰 ${item.value || 0} GP</div>
            `;
            
            grid.appendChild(itemElement);
        });

        // Setup filter event listeners
        if (categoryFilter && !categoryFilter.hasAttribute('data-listener-added')) {
            categoryFilter.addEventListener('change', () => this.renderDCCItemsModal());
            categoryFilter.setAttribute('data-listener-added', 'true');
        }

        if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
            searchInput.addEventListener('input', () => this.renderDCCItemsModal());
            searchInput.setAttribute('data-listener-added', 'true');
        }
    }

    /**
     * Toggle DCC items browser visibility (deprecated - use modal instead)
     */
    toggleDCCItemsBrowser() {
        // Redirect to modal
        this.openDCCItemsModal();
    }

    /**
     * Render DCC items in the browser (deprecated - use modal instead)
     */
    renderDCCItems() {
        // Redirect to modal
        this.renderDCCItemsModal();
    }

    /**
     * Add a DCC item to player inventory (updated for modal use)
     */
    addDCCItemToInventory(dccItem) {
        if (!window.character) return;

        if (!window.character.inventory) {
            window.character.inventory = [];
        }

        const inventoryItem = {
            id: Date.now() + Math.random(),
            name: dccItem.name,
            type: dccItem.type?.toLowerCase() || 'misc',
            damage: dccItem.damage,
            defense: dccItem.defense,
            properties: dccItem.properties || [],
            value: dccItem.value || 0,
            quantity: 1,
            source: 'dcc_catalog',
            dateAdded: new Date().toISOString()
        };

        window.character.inventory.push(inventoryItem);
        this.renderInventory();

        // Save character
        if (typeof saveCharacterData === 'function') {
            saveCharacterData();
        }

        // Close modal after adding
        this.closeDCCItemsModal();

        console.log(`✅ Added ${dccItem.name} to inventory`);
        
        // Show success notification
        if (window.addChatMessage) {
            window.addChatMessage(`📦 Added "${dccItem.name}" to inventory`, 'system');
        }
    }

    /**
     * Transfer all trade items to inventory
     */
    async transferTradeItems() {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) return;

        try {
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            
            if (!tradeArea) return;

            // Transfer gold
            if (tradeArea.gold > 0) {
                await this.transferGoldToCharacter(tradeArea.gold);
            }

            // Transfer all items
            if (tradeArea.items && tradeArea.items.length > 0) {
                for (let i = tradeArea.items.length - 1; i >= 0; i--) {
                    await this.transferItemToInventory(tradeArea.items[i], i);
                }
            }

            console.log('✅ Transferred all trade items to inventory');
        } catch (error) {
            console.error('❌ Failed to transfer trade items:', error);
        }
    }
}

// Global functions for HTML onclick handlers
window.openDCCItemsModal = function() {
    if (window.inventoryManager) {
        window.inventoryManager.openDCCItemsModal();
    }
};

window.closeDCCItemsModal = function() {
    if (window.inventoryManager) {
        window.inventoryManager.closeDCCItemsModal();
    }
};

window.toggleDCCItemsBrowser = function() {
    if (window.inventoryManager) {
        window.inventoryManager.toggleDCCItemsBrowser();
    }
};

window.transferTradeItems = function() {
    if (window.inventoryManager) {
        window.inventoryManager.transferTradeItems();
    }
};

// Setup category filter change listener
document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('dcc-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            if (window.inventoryManager) {
                window.inventoryManager.renderDCCItems();
            }
        });
    }
});

// Create global instance when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.inventoryManager) {
            window.inventoryManager = new InventoryManager();
        }
    });
} else {
    if (!window.inventoryManager) {
        window.inventoryManager = new InventoryManager();
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManager;
}
