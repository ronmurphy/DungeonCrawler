/**
 * Unified Inventory System for DungeonCrawler v5
 * Combines functionality from main.js and inventoryManager.js
 * 
 * Features:
 * - Character inventory management (from main.js)
 * - DCC item catalog and shop (from inventoryManager.js)
 * - Trade area / recent loot system
 * - Gold management and persistence
 * - Equipment system
 * - Robust error handling and data consistency
 */

class UnifiedInventorySystem {
    constructor() {
        this.dccItems = null;
        this.initialized = false;
        this.playerGold = 0;
        this.renderCount = 0; // Add render counter to detect loops
        this.lastRenderTime = 0; // Track when last render happened
        
        console.log('🎒 Initializing Unified Inventory System...');
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // =====================================
    // INITIALIZATION & DATA LOADING
    // =====================================

    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🔄 Loading DCC items and setting up inventory system...');
            await this.loadDCCItems();
            this.setupEventListeners();
            this.updateDisplays();
            this.initialized = true;
            console.log('✅ Unified Inventory System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize inventory system:', error);
        }
    }

    async loadDCCItems() {
        try {
            const response = await fetch('data/dcc-items.json');
            if (!response.ok) throw new Error(`Failed to load DCC items: ${response.status}`);
            
            this.dccItems = await response.json();
            const totalItems = Object.values(this.dccItems).reduce((sum, items) => sum + items.length, 0);
            console.log(`📦 Loaded ${totalItems} DCC items across ${Object.keys(this.dccItems).length} categories`);
        } catch (error) {
            console.error('❌ Error loading DCC items:', error);
            this.dccItems = {};
        }
    }

    setupEventListeners() {
        // Listen for character changes
        document.addEventListener('characterLoaded', () => {
            console.log('👤 Character loaded, updating inventory displays');
            this.updateDisplays();
        });
        
        // Listen for inventory changes
        document.addEventListener('inventoryChanged', () => {
            console.log('🔄 Inventory changed, updating displays');
            this.updateDisplays();
        });
    }

    // =====================================
    // CHARACTER DATA MANAGEMENT
    // =====================================

    /**
     * Get current character with robust fallback logic
     */
    getCurrentCharacter() {
        // Try character manager first (preferred)
        if (window.characterManager && window.characterManager.currentCharacterId) {
            const char = window.characterManager.characters.find(
                c => c.id === window.characterManager.currentCharacterId
            );
            if (char) {
                console.log(`🔍 DEBUG getCurrentCharacter - Found character via manager: ${char.name}, Gold: ${char.gold}, ID: ${char.id}`);
                return char;
            }
        }
        
        // Fall back to global character object
        if (window.character) {
            console.log(`🔍 DEBUG getCurrentCharacter - Using global character: ${window.character.name}, Gold: ${window.character.gold}`);
            return window.character;
        }

        console.warn('⚠️ No character found in either system');
        return null;
    }

    /**
     * Save character data using available storage methods
     */
    async saveCharacter() {
        try {
            const character = this.getCurrentCharacter();
            if (character) {
                console.log(`💾 Saving character "${character.name}" with ${character.gold || 0} gold`);
            }
            
            if (typeof saveCurrentCharacterToStorage === 'function') {
                await saveCurrentCharacterToStorage();
                console.log('💾 Used saveCurrentCharacterToStorage');
            } else if (typeof saveCharacterToStorage === 'function') {
                await saveCharacterToStorage();
                console.log('💾 Used saveCharacterToStorage');
            } else if (window.characterManager && typeof window.characterManager.saveCharacter === 'function') {
                window.characterManager.saveCharacter(character);
                console.log('💾 Used characterManager.saveCharacter');
            } else {
                console.warn('⚠️ No character save function available');
                return false;
            }
            console.log('✅ Character saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save character:', error);
            return false;
        }
    }

    // =====================================
    // INVENTORY MANAGEMENT
    // =====================================

    /**
     * Get character's inventory with safety checks
     */
    getInventory() {
        const character = this.getCurrentCharacter();
        if (!character) return [];
        
        if (!character.inventory) {
            character.inventory = [];
        }
        
        return character.inventory;
    }

    /**
     * Add item to character inventory
     */
    addItem(item) {
        const character = this.getCurrentCharacter();
        if (!character) {
            console.error('❌ Cannot add item: No character found');
            return false;
        }

        if (!character.inventory) character.inventory = [];
        
        // Create unique ID if not present
        const newItem = {
            ...item,
            id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        character.inventory.push(newItem);
        console.log(`📦 Added ${newItem.name} to inventory`);
        
        this.saveCharacter();
        this.renderInventory();
        this.updateGoldDisplay();
        
        return true;
    }

    /**
     * Remove item from inventory by ID
     */
    removeItem(itemId) {
        const character = this.getCurrentCharacter();
        if (!character) return false;

        const item = this.getItemById(itemId);
        if (!item) return false;

        character.inventory = character.inventory.filter(inv => inv.id !== itemId);
        console.log(`🗑️ Removed ${item.name} from inventory`);
        
        this.saveCharacter();
        this.renderInventory();
        
        return true;
    }

    /**
     * Get item by ID from inventory
     */
    getItemById(itemId) {
        const inventory = this.getInventory();
        console.log(`🔍 Looking for item with ID: "${itemId}" (type: ${typeof itemId})`);
        console.log(`📦 Inventory items:`, inventory.map(item => `${item.name} (ID: "${item.id}", type: ${typeof item.id})`));
        
        // Convert to string for comparison since HTML might pass numbers
        const targetId = String(itemId);
        const found = inventory.find(item => String(item.id) === targetId);
        
        if (!found) {
            console.error(`❌ Item not found. Looking for: "${targetId}"`);
            console.error(`🔎 Available IDs:`, inventory.map(item => String(item.id)));
        }
        
        return found;
    }

    /**
     * Sell item for half its value
     */
    async sellItem(itemId) {
        const item = this.getItemById(itemId);
        if (!item) {
            console.error('❌ Item not found for selling:', itemId);
            return false;
        }

        const sellValue = Math.floor((item.value || 0) / 2);
        if (sellValue <= 0) {
            alert('This item has no value and cannot be sold.');
            return false;
        }

        if (!confirm(`Sell "${item.name}" for ${sellValue} GP?`)) {
            return false;
        }

        // Remove from inventory
        this.removeItem(itemId);
        
        // Add gold to character
        await this.addGold(sellValue);
        
        console.log(`💰 Sold ${item.name} for ${sellValue} GP`);
        
        // Show notification
        if (window.addChatMessage) {
            window.addChatMessage(`💰 Sold ${item.name} for ${sellValue} GP! Total: ${this.getGold()} GP`, 'system');
        }

        return true;
    }

    // =====================================
    // EQUIPMENT SYSTEM
    // =====================================

    /**
     * Check if item is equipped
     */
    isItemEquipped(itemId) {
        const character = this.getCurrentCharacter();
        if (!character || !character.equipment) return false;

        return Object.values(character.equipment).some(equippedItem => 
            equippedItem && equippedItem.id === itemId
        );
    }

    /**
     * Check if item can be equipped
     */
    canEquip(item) {
        return item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'shield');
    }

    /**
     * Equip or unequip an item
     */
    toggleEquipment(itemId) {
        console.log(`⚔️ toggleEquipment called with ID: "${itemId}" (type: ${typeof itemId})`);
        
        const item = this.getItemById(itemId);
        if (!item) {
            console.error('❌ toggleEquipment: Item not found');
            return false;
        }

        console.log(`🔍 Found item for equipment: ${item.name}`);

        if (!this.canEquip(item)) {
            console.warn('⚠️ Item cannot be equipped:', item.name);
            return false;
        }

        if (this.isItemEquipped(itemId)) {
            console.log(`🔓 Unequipping: ${item.name}`);
            return this.unequipItem(itemId);
        } else {
            console.log(`🔒 Equipping: ${item.name}`);
            return this.equipItem(itemId);
        }
    }

    equipItem(itemId) {
        const character = this.getCurrentCharacter();
        const item = this.getItemById(itemId);
        
        if (!character || !item) return false;
        if (!character.equipment) character.equipment = {};

        // Determine equipment slot
        let slot = null;
        if (item.type === 'weapon') {
            slot = item.ranged ? 'offHand' : 'mainHand'; // Map to HTML slot names
        } else if (item.type === 'armor') {
            slot = 'armor';
        } else if (item.type === 'shield') {
            slot = 'offHand';
        } else if (item.category === 'accessories') {
            slot = 'accessory';
        }

        if (slot) {
            character.equipment[slot] = item;
            console.log(`⚔️ Equipped ${item.name} in ${slot} slot`);
            this.saveCharacter();
            this.renderInventory();
            this.updateEquipmentDisplay(); // Add equipment display update
            return true;
        }

        return false;
    }

    unequipItem(itemId) {
        const character = this.getCurrentCharacter();
        if (!character || !character.equipment) return false;

        for (const [slot, equippedItem] of Object.entries(character.equipment)) {
            if (equippedItem && equippedItem.id === itemId) {
                character.equipment[slot] = null;
                console.log(`🛡️ Unequipped item from ${slot} slot`);
                this.saveCharacter();
                this.renderInventory();
                this.updateEquipmentDisplay(); // Add equipment display update
                return true;
            }
        }

        return false;
    }

    /**
     * Update the equipment display slots at the top of inventory
     */
    updateEquipmentDisplay() {
        const character = this.getCurrentCharacter();
        if (!character) return;

        const equipment = character.equipment || {};
        const slots = ['mainHand', 'offHand', 'armor', 'accessory'];

        slots.forEach(slot => {
            const itemElement = document.getElementById(`${slot}-item`);
            const statsElement = document.getElementById(`${slot}-stats`);
            
            if (!itemElement || !statsElement) return;

            const equippedItem = equipment[slot];
            
            if (equippedItem) {
                // Show item name
                itemElement.textContent = equippedItem.name;
                itemElement.style.color = '#4CAF50'; // Green for equipped
                
                // Show item stats
                const stats = [];
                if (equippedItem.damage) stats.push(`${equippedItem.damage} DMG`);
                if (equippedItem.ac_bonus !== undefined) stats.push(`+${equippedItem.ac_bonus} AC`);
                if (equippedItem.defense > 0) stats.push(`+${equippedItem.defense} DEF`);
                if (equippedItem.properties && equippedItem.properties.length > 0) {
                    stats.push(equippedItem.properties.slice(0, 2).join(', ')); // Show first 2 properties
                }
                if (equippedItem.effect) stats.push(equippedItem.effect.substring(0, 30) + '...');
                
                statsElement.textContent = stats.join(' • ');
                statsElement.style.display = 'block';
            } else {
                // Show empty slot
                itemElement.textContent = 'Empty';
                itemElement.style.color = '#666';
                statsElement.textContent = '';
                statsElement.style.display = 'none';
            }
        });

        console.log('⚔️ Updated equipment display slots');
    }

    // =====================================
    // GOLD MANAGEMENT
    // =====================================

    /**
     * Get current gold amount
     */
    getGold() {
        const character = this.getCurrentCharacter();
        return character ? (character.gold || 0) : 0;
    }

    /**
     * Add gold to character
     */
    async addGold(amount) {
        // Pause auto-save during this critical operation
        if (typeof window.pauseAutoSaveForInventory === 'function') {
            window.pauseAutoSaveForInventory();
        }
        
        const character = this.getCurrentCharacter();
        if (!character) {
            console.error('❌ Cannot add gold: No character found');
            if (typeof window.resumeAutoSaveForInventory === 'function') {
                window.resumeAutoSaveForInventory();
            }
            return false;
        }

        const oldGold = character.gold || 0;
        character.gold = oldGold + amount;
        console.log(`💰 Added ${amount} gold. Old: ${oldGold}, New: ${character.gold}`);
        
        // CRITICAL FIX: Update ALL character references to prevent overwrites
        // Update the global character object if it exists
        if (window.character && window.character.id === character.id) {
            window.character.gold = character.gold;
            console.log(`🔄 Updated global character gold: ${window.character.gold}`);
        }
        
        // Update the character manager array to prevent overwrites
        if (window.characterManager && window.characterManager.characters) {
            const charIndex = window.characterManager.characters.findIndex(c => c.id === character.id);
            if (charIndex !== -1) {
                window.characterManager.characters[charIndex].gold = character.gold;
                console.log(`🔄 Updated character manager array gold: ${window.characterManager.characters[charIndex].gold}`);
            }
        }
        
        await this.saveCharacter();
        
        // CRITICAL FIX: Force a final character manager save with our updated data
        if (window.characterManager && typeof window.characterManager.saveCharacter === 'function') {
            console.log('🔄 Forcing character manager save with updated gold...');
            await window.characterManager.saveCharacter(character);
        }
        
        // CRITICAL FIX: Store the expected gold value and restore it if character manager overwrites it
        const expectedGold = character.gold;
        const characterId = character.id;
        
        setTimeout(() => {
            console.log('🔄 Checking if character gold was overwritten...');
            const currentChar = this.getCurrentCharacter();
            if (currentChar && currentChar.id === characterId && currentChar.gold !== expectedGold) {
                console.log(`⚠️ Character gold was overwritten! Restoring ${expectedGold} from ${currentChar.gold}`);
                currentChar.gold = expectedGold;
                
                // Update all character references again
                if (window.character && window.character.id === characterId) {
                    window.character.gold = expectedGold;
                }
                if (window.characterManager && window.characterManager.characters) {
                    const charIndex = window.characterManager.characters.findIndex(c => c.id === characterId);
                    if (charIndex !== -1) {
                        window.characterManager.characters[charIndex].gold = expectedGold;
                    }
                }
                
                // Force another character manager save with corrected data
                if (window.characterManager && typeof window.characterManager.saveCharacter === 'function') {
                    console.log('🔄 Final character manager save with corrected gold...');
                    window.characterManager.saveCharacter(currentChar);
                }
            }
            this.updateGoldDisplay();
            
            // Resume auto-save after operation completes
            if (typeof window.resumeAutoSaveForInventory === 'function') {
                window.resumeAutoSaveForInventory();
            }
        }, 500);
        
        return true;
    }

    /**
     * Remove gold from character
     */
    spendGold(amount) {
        const character = this.getCurrentCharacter();
        if (!character) return false;

        const currentGold = character.gold || 0;
        if (currentGold < amount) {
            console.warn(`⚠️ Insufficient gold. Have: ${currentGold}, Need: ${amount}`);
            return false;
        }

        character.gold = currentGold - amount;
        console.log(`💸 Spent ${amount} gold. Remaining: ${character.gold}`);
        
        this.saveCharacter();
        this.updateGoldDisplay();
        
        return true;
    }

    /**
     * Update gold display in UI
     */
    updateGoldDisplay() {
        const character = this.getCurrentCharacter();
        const gold = this.getGold();
        this.playerGold = gold;

        console.log(`🔍 DEBUG updateGoldDisplay - Character:`, character?.name, `Gold:`, character?.gold, `getGold():`, gold);

        // Update main inventory gold display
        const goldElement = document.getElementById('character-gold');
        if (goldElement) {
            goldElement.textContent = gold.toLocaleString();
            console.log(`🔍 DEBUG - Updated character-gold element to: ${gold}`);
        } else {
            console.warn(`⚠️ DEBUG - character-gold element not found!`);
        }

        // Update DCC modal gold display
        const dccGoldElement = document.getElementById('dcc-modal-player-gold');
        if (dccGoldElement) {
            dccGoldElement.textContent = gold.toLocaleString();
            console.log(`🔍 DEBUG - Updated dcc-modal-player-gold element to: ${gold}`);
        }

        console.log(`💰 Updated gold displays: ${gold} GP`);
    }

    // =====================================
    // TRADE AREA / RECENT LOOT SYSTEM
    // =====================================

    /**
     * Add loot to trade area (used by combat system)
     */
    async addLootToTradeArea(loot) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) {
            console.error('❌ No player name found for trade area');
            return false;
        }

        try {
            const tradeAreaKey = `trade_area_${playerName}`;
            let tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey) || {
                items: [],
                gold: 0
            };

            if (loot.type === 'gold') {
                tradeArea.gold = (tradeArea.gold || 0) + loot.value;
                console.log(`💰 Added ${loot.value} gold to trade area! Total: ${tradeArea.gold}`);
            } else {
                if (!tradeArea.items) tradeArea.items = [];
                
                const tradeItem = {
                    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: loot.name,
                    type: loot.type || 'item',
                    value: loot.value || 0,
                    quantity: loot.quantity || 1,
                    sourceType: loot.sourceType || 'combat',
                    timestamp: new Date().toISOString()
                };

                tradeArea.items.push(tradeItem);
                console.log(`📦 Added ${loot.name} to trade area`);
            }

            tradeArea.lastUpdated = new Date().toISOString();
            await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea, { forceMethod: 'indexeddb' });

            // CRITICAL FIX: Pass the updated data directly instead of re-reading from storage
            this.updateTradeAreaDisplay(tradeArea);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to add loot to trade area:', error);
            return false;
        }
    }

    /**
     * Update trade area display
     * @param {Object} tradeAreaData - Optional pre-loaded trade area data to avoid race conditions
     */
    async updateTradeAreaDisplay(tradeAreaData = null) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) {
            console.warn('⚠️ Cannot update trade area: No player name found');
            return;
        }

        console.log(`🔍 Updating trade area display for player: ${playerName}`);

        try {
            // Use provided data or fetch from storage
            let tradeArea = tradeAreaData;
            if (!tradeArea) {
                const tradeAreaKey = `trade_area_${playerName}`;
                tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
                console.log(`📦 Trade area data retrieved from storage (lastUpdated: ${tradeArea?.lastUpdated}):`, tradeArea);
                
                // DEBUGGING: Check if we're getting stale data
                if (tradeArea?.lastUpdated) {
                    const dataAge = new Date() - new Date(tradeArea.lastUpdated);
                    const ageInMinutes = Math.floor(dataAge / (1000 * 60));
                    console.log(`⏰ Trade area data age: ${ageInMinutes} minutes old`);
                    if (ageInMinutes > 60) {
                        console.warn("⚠️ Trade area data is very old - possible caching issue");
                    }
                }
            } else {
                console.log(`📦 Trade area data provided directly (lastUpdated: ${tradeArea?.lastUpdated}):`, tradeArea);
            }
            
            const tradeGrid = document.getElementById('trade-grid');
            const tradeSection = document.getElementById('trade-area-section');
            
            if (!tradeGrid || !tradeSection) {
                console.warn('⚠️ Trade area DOM elements not found:', { tradeGrid: !!tradeGrid, tradeSection: !!tradeSection });
                return;
            }

            // FIXED: Always show trade area section for visibility, but clear content if no loot
            tradeSection.style.display = 'block';
            
            // Hide section if no loot
            if (!tradeArea || (!tradeArea.gold && (!tradeArea.items || tradeArea.items.length === 0))) {
                console.log('🔸 No trade area data found, clearing content but keeping section visible');
                tradeGrid.innerHTML = '<div class="empty-state"><i class="ra ra-gem-pendant"></i><p>No recent loot</p></div>';
                return;
            }

            // Show section and populate
            console.log(`✅ Showing trade area with ${tradeArea.gold || 0} gold and ${tradeArea.items?.length || 0} items`);
            tradeGrid.innerHTML = '';

            // Add gold if present
            if (tradeArea.gold && tradeArea.gold > 0) {
                const goldItem = document.createElement('div');
                goldItem.className = 'trade-item';
                goldItem.innerHTML = `
                    <div class="trade-item-name">💰 ${tradeArea.gold} Gold</div>
                    <div class="trade-item-type">Currency</div>
                `;
                goldItem.onclick = () => this.transferGoldFromTradeArea(tradeArea.gold);
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
                    itemElement.onclick = () => this.transferItemFromTradeArea(item, index);
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
    async transferGoldFromTradeArea(amount) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) return false;

        try {
            await this.addGold(amount);

            // Remove gold from trade area
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            if (tradeArea) {
                tradeArea.gold = 0;
                tradeArea.lastUpdated = new Date().toISOString();
                await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea);
                
                // CRITICAL FIX: Pass the updated trade area data directly to avoid race condition
                this.updateTradeAreaDisplay(tradeArea);
            } else {
                // No trade area exists, clear display
                this.updateTradeAreaDisplay(null);
            }

            console.log(`💰 Transferred ${amount} gold from trade area to character`);
            return true;

        } catch (error) {
            console.error('❌ Failed to transfer gold from trade area:', error);
            return false;
        }
    }

    /**
     * Transfer item from trade area to inventory
     */
    async transferItemFromTradeArea(item, index) {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) return false;

        try {
            // Add to inventory
            this.addItem(item);

            // Remove from trade area
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            if (tradeArea && tradeArea.items) {
                tradeArea.items.splice(index, 1);
                tradeArea.lastUpdated = new Date().toISOString();
                await window.advancedStorageManager.setItem(tradeAreaKey, tradeArea);
                
                // CRITICAL FIX: Pass the updated trade area data directly to avoid race condition
                this.updateTradeAreaDisplay(tradeArea);
            } else {
                // No trade area exists, clear display
                this.updateTradeAreaDisplay(null);
            }

            console.log(`📦 Transferred ${item.name} from trade area to inventory`);
            return true;

        } catch (error) {
            console.error('❌ Failed to transfer item from trade area:', error);
            return false;
        }
    }

    /**
     * Transfer all items from trade area to inventory
     */
    async transferAllTradeItems() {
        const playerName = window.networkPlayerName || window.playerName;
        if (!playerName) return false;

        try {
            const tradeAreaKey = `trade_area_${playerName}`;
            const tradeArea = await window.advancedStorageManager.getItem(tradeAreaKey);
            
            if (!tradeArea) return true;

            // Transfer gold
            if (tradeArea.gold && tradeArea.gold > 0) {
                await this.addGold(tradeArea.gold);
            }

            // Transfer items
            if (tradeArea.items && tradeArea.items.length > 0) {
                tradeArea.items.forEach(item => {
                    this.addItem(item);
                });
            }

            // Clear trade area
            await window.advancedStorageManager.setItem(tradeAreaKey, {
                items: [],
                gold: 0,
                lastUpdated: new Date().toISOString()
            });

            this.updateTradeAreaDisplay();
            console.log('📦 Transferred all items from trade area to inventory');
            return true;

        } catch (error) {
            console.error('❌ Failed to transfer all trade items:', error);
            return false;
        }
    }

    // =====================================
    // DCC SHOP SYSTEM
    // =====================================

    /**
     * Buy item from DCC shop
     */
    buyDCCItem(itemId) {
        if (!this.dccItems) {
            console.error('❌ DCC items not loaded');
            return false;
        }

        const item = this.dccItems.find(i => i.id === itemId);
        if (!item) {
            console.error('❌ DCC item not found:', itemId);
            return false;
        }

        const currentGold = this.getGold();
        if (currentGold < item.value) {
            alert(`Insufficient gold! You need ${item.value} GP but only have ${currentGold} GP.`);
            return false;
        }

        if (!confirm(`Buy "${item.name}" for ${item.value} GP?`)) {
            return false;
        }

        // Spend gold and add item
        if (this.spendGold(item.value)) {
            this.addItem(item);
            console.log(`🛒 Bought ${item.name} for ${item.value} GP`);
            
            if (window.addChatMessage) {
                window.addChatMessage(`🛒 Bought ${item.name} for ${item.value} GP! Remaining: ${this.getGold()} GP`, 'system');
            }
            
            this.renderDCCItemsModal();
            return true;
        }

        return false;
    }

    /**
     * Open DCC items modal
     */
    openDCCItemsModal() {
        console.log('🚪 openDCCItemsModal() called');
        console.trace('Call stack for openDCCItemsModal');
        
        const modal = document.getElementById('dcc-items-modal');
        if (modal) {
            console.log('📱 Setting modal display to block');
            modal.style.display = 'block';
            this.renderDCCItemsModal();
        } else {
            console.error('❌ DCC modal not found in DOM');
        }
    }

    /**
     * Close DCC items modal
     */
    closeDCCItemsModal() {
        const modal = document.getElementById('dcc-items-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Render DCC items in modal
     */
    renderDCCItemsModal() {
        const now = Date.now();
        this.renderCount++;
        
        // Detect potential infinite loop
        if (now - this.lastRenderTime < 100) { // If called within 100ms
            console.warn(`⚠️ renderDCCItemsModal() called ${this.renderCount} times rapidly! Potential loop detected.`);
            if (this.renderCount > 10) {
                console.error(`🚨 INFINITE LOOP DETECTED! Stopping renderDCCItemsModal after ${this.renderCount} calls`);
                return;
            }
        } else {
            this.renderCount = 1; // Reset counter if enough time has passed
        }
        this.lastRenderTime = now;
        
        console.log(`🏪 renderDCCItemsModal() called (count: ${this.renderCount})`);
        console.trace('Call stack for renderDCCItemsModal');
        
        this.updateGoldDisplay();

        const container = document.getElementById('dcc-items-modal-grid');
        if (!container) {
            console.error('❌ DCC items modal grid not found');
            return;
        }
        
        if (!this.dccItems) {
            console.error('❌ No DCC items loaded');
            return;
        }

        console.log('📦 DCC Items structure:', Object.keys(this.dccItems));
        const currentGold = this.getGold();
        console.log('💰 Current gold:', currentGold);
        
        // Clear loading state immediately
        container.innerHTML = '';
        console.log('🧹 Cleared container, starting item rendering...');

        // Flatten all categories into a single array of items
        const allItems = [];
        Object.entries(this.dccItems).forEach(([category, items]) => {
            console.log(`📋 Processing category: ${category} with ${items.length} items`);
            items.forEach(item => {
                // Add category and unique ID to each item
                allItems.push({
                    ...item,
                    category: category,
                    id: `${category}-${allItems.length}`
                });
            });
        });

        console.log(`🔢 Total flattened items: ${allItems.length}`);

        allItems.forEach((item, index) => {
            const canAfford = currentGold >= (item.value || 0);
            const itemElement = document.createElement('div');
            itemElement.className = 'dcc-modal-item';
            itemElement.dataset.category = item.category; // For filtering
            itemElement.dataset.name = item.name.toLowerCase(); // For search

            const icon = this.getItemIcon(item.type);
            
            // Build additional info based on item type and available fields
            let additionalInfo = '';
            
            // Description always takes priority if available
            if (item.description) {
                additionalInfo = `<div class="dcc-modal-item-description">${item.description}</div>`;
            }
            // Otherwise, show type-specific info
            else if (item.effect && (item.category === 'accessories' || item.category === 'consumables')) {
                additionalInfo = `<div class="dcc-modal-item-effect"><strong>Effect:</strong> ${item.effect}</div>`;
            }
            else if (item.damage && item.category === 'weapons') {
                let weaponInfo = `<strong>Damage:</strong> ${item.damage}`;
                if (item.properties && item.properties.length > 0) {
                    weaponInfo += ` <br><strong>Properties:</strong> ${item.properties.join(', ')}`;
                }
                additionalInfo = `<div class="dcc-modal-item-weapon-info">${weaponInfo}</div>`;
            }
            else if (item.ac_bonus !== undefined && item.category === 'armor') {
                let armorInfo = `<strong>AC Bonus:</strong> +${item.ac_bonus}`;
                if (item.properties && item.properties.length > 0) {
                    armorInfo += ` <br><strong>Properties:</strong> ${item.properties.join(', ')}`;
                }
                additionalInfo = `<div class="dcc-modal-item-armor-info">${armorInfo}</div>`;
            }
            
            itemElement.innerHTML = `
                <div class="dcc-modal-item-header">
                    <span class="dcc-modal-item-icon">${icon}</span>
                    <span class="dcc-modal-item-name">${item.name}</span>
                </div>
                <div class="dcc-modal-item-type">${item.type}</div>
                ${additionalInfo}
                <div class="dcc-modal-item-value ${!canAfford ? 'insufficient-gold' : 'clickable-price'}" 
                     onclick="${canAfford ? `window.unifiedInventory.buyDCCItem('${item.id}')` : ''}"
                     title="${canAfford ? 'Click to buy' : 'Insufficient gold'}">
                    ${item.value || 0} GP
                </div>
            `;

            container.appendChild(itemElement);
            
            if (index < 5) {
                const infoType = item.description ? 'description' : 
                               item.effect ? 'effect' : 
                               item.damage ? 'weapon stats' : 
                               item.ac_bonus !== undefined ? 'armor stats' : 'basic';
                console.log(`🛍️ Added item ${index + 1}: ${item.name} (${item.value} GP) - ${infoType}`);
            }
        });

        console.log(`✅ Finished rendering ${allItems.length} DCC items in shop modal`);
        console.log('📏 Container children count:', container.children.length);
        
        // Setup filtering and search if not already done
        this.setupDCCModalFiltering();
    }

    /**
     * Setup filtering and search for DCC modal
     */
    setupDCCModalFiltering() {
        const categoryFilter = document.getElementById('dcc-modal-category-filter');
        const searchInput = document.getElementById('dcc-items-search');
        
        if (!categoryFilter || !searchInput) return;
        
        // Remove existing listeners to prevent duplicates
        categoryFilter.removeEventListener('change', this.filterDCCItems);
        searchInput.removeEventListener('input', this.filterDCCItems);
        
        // Add new listeners
        categoryFilter.addEventListener('change', () => this.filterDCCItems());
        searchInput.addEventListener('input', () => this.filterDCCItems());
        
        console.log('🔍 DCC modal filtering setup complete');
    }

    /**
     * Filter DCC items based on category and search
     */
    filterDCCItems() {
        const categoryFilter = document.getElementById('dcc-modal-category-filter');
        const searchInput = document.getElementById('dcc-items-search');
        const container = document.getElementById('dcc-items-modal-grid');
        
        if (!categoryFilter || !searchInput || !container) return;
        
        const selectedCategory = categoryFilter.value.toLowerCase();
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const items = container.querySelectorAll('.dcc-modal-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const itemCategory = item.dataset.category;
            const itemName = item.dataset.name;
            
            const categoryMatch = selectedCategory === 'all' || itemCategory === selectedCategory;
            const searchMatch = !searchTerm || itemName.includes(searchTerm);
            
            if (categoryMatch && searchMatch) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        console.log(`🔍 Filtered items: ${visibleCount} visible out of ${items.length} total`);
    }

    // =====================================
    // RENDERING & DISPLAY
    // =====================================

    /**
     * Get appropriate icon for item type
     */
    getItemIcon(itemType) {
        const icons = {
            weapon: '⚔️',
            armor: '🛡️',
            shield: '🛡️',
            consumable: '🧪',
            misc: '📦',
            miscellaneous: '📦',
            accessory: '💍',
            currency: '💰',
            scroll: '📜',
            book: '📚',
            tool: '🔧',
            jewelry: '💍'
        };
        // Normalize to lowercase for lookup
        const normalizedType = (itemType || '').toLowerCase();
        return icons[normalizedType] || '📦';
    }

    /**
     * Render main inventory grid
     */
    renderInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;

        const character = this.getCurrentCharacter();
        if (!character) {
            inventoryGrid.innerHTML = '<div class="no-character">No character selected</div>';
            return;
        }

        // Update trade area display when rendering inventory (now safe from cache issues)
        this.updateTradeAreaDisplay();

        const inventory = this.getInventory();
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
            
            if (this.isItemEquipped(item.id)) {
                itemElement.classList.add('equipped');
            }

            const icon = this.getItemIcon(item.type);
            const quantity = item.quantity > 1 ? ` (${item.quantity})` : '';
            const sellValue = Math.floor((item.value || 0) / 2);

            // Build stats display
            const stats = [];
            if (item.type === 'weapon' && item.size) {
                const weaponSizes = {
                    1: { name: 'Light', dice: 4 },
                    2: { name: 'Medium', dice: 6 },
                    3: { name: 'Heavy', dice: 8 },
                    4: { name: 'Great', dice: 10 }
                };
                const weaponSize = weaponSizes[item.size];
                if (weaponSize) stats.push(`d${weaponSize.dice}`);
            }
            if (item.defense > 0) stats.push(`+${item.defense} DEF`);
            if (item.twoHanded) stats.push('2H');
            if (item.ranged) stats.push('RNG');

            itemElement.innerHTML = `
                <div class="item-header">
                    <div class="item-icon-name">
                        <span class="item-icon">${icon}</span>
                        <span class="item-name">${item.name}${quantity}</span>
                    </div>
                    <div class="item-actions">
                        ${this.canEquip(item) ? `<button class="item-action-btn equip-btn" onclick="window.unifiedInventory.toggleEquipment('${item.id}')" title="${this.isItemEquipped(item.id) ? 'Unequip' : 'Equip'}">⚔️</button>` : ''}
                        ${(item.value || 0) > 0 ? `<button class="item-action-btn sell-btn" onclick="window.unifiedInventory.sellItem('${item.id}')" title="Sell for ${sellValue} GP">💰</button>` : ''}
                        <button class="item-action-btn remove-btn" onclick="window.unifiedInventory.removeItem('${item.id}')" title="Remove">🗑️</button>
                    </div>
                </div>
                <div class="item-type">${item.type}${item.size ? ` (${item.size})` : ''}</div>
                ${stats.length > 0 ? `<div class="item-stats">${stats.map(stat => `<span class="item-stat">${stat}</span>`).join('')}</div>` : ''}
            `;

            inventoryGrid.appendChild(itemElement);
        });

        console.log(`🎒 Rendered inventory with ${inventory.length} items`);
    }

    /**
     * Update all displays
     */
    updateDisplays() {
        this.updateGoldDisplay();
        this.renderInventory();
        this.updateEquipmentDisplay(); // Add equipment display update
        this.updateTradeAreaDisplay();
    }

    // =====================================
    // CONSUMABLE SYSTEM
    // =====================================

    /**
     * Use a consumable item
     */
    useConsumable(itemId) {
        const item = this.getItemById(itemId);
        if (!item || item.type !== 'consumable') return false;

        if (!confirm(`Use "${item.name}"?`)) return false;

        // Apply consumable effects (basic implementation)
        const character = this.getCurrentCharacter();
        if (character && item.effects) {
            if (item.effects.healing) {
                character.hitPoints = Math.min(
                    (character.hitPoints || 0) + item.effects.healing,
                    character.maxHitPoints || 100
                );
                console.log(`❤️ Healed ${item.effects.healing} HP`);
            }
        }

        // Remove item from inventory
        this.removeItem(itemId);
        
        console.log(`🧪 Used consumable: ${item.name}`);
        return true;
    }
}

// =====================================
// GLOBAL INITIALIZATION & EXPORTS
// =====================================

// Create global instance
window.unifiedInventory = new UnifiedInventorySystem();

// Export legacy function names for compatibility
window.renderInventory = () => window.unifiedInventory.renderInventory();
window.sellItem = (itemId) => window.unifiedInventory.sellItem(itemId);
window.removeItem = (itemId) => window.unifiedInventory.removeItem(itemId);
window.selectItem = (itemId) => window.unifiedInventory.toggleEquipment(itemId);
window.toggleEquipment = (itemId) => window.unifiedInventory.toggleEquipment(itemId);
window.useConsumable = (itemId) => window.unifiedInventory.useConsumable(itemId);

// DCC Modal functions
window.openDCCItemsModal = () => window.unifiedInventory.openDCCItemsModal();
window.closeDCCItemsModal = () => window.unifiedInventory.closeDCCItemsModal();

// Trade area functions
window.transferTradeItems = () => window.unifiedInventory.transferAllTradeItems();

// Legacy inventoryManager compatibility
window.inventoryManager = {
    updateGoldDisplay: () => window.unifiedInventory.updateGoldDisplay(),
    updateTradeAreaDisplay: () => window.unifiedInventory.updateTradeAreaDisplay(),
    renderInventory: () => window.unifiedInventory.renderInventory(),
    addLootToTradeArea: (loot) => window.unifiedInventory.addLootToTradeArea(loot)
};

console.log('🎯 Unified Inventory System loaded and ready!');