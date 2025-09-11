// ========================================
// COMBAT HANDLER MODULE
// Portable combat processing and enemy management
// ========================================

class CombatHandler {
    constructor() {
        this.enemies = new Map();
        this.combatLog = [];
        this.onEnemyDefeated = null; // Callback for when enemy is defeated
        this.onCombatEvent = null;   // Callback for combat events
    }

    // Set callback functions for events
    setEventHandlers(onEnemyDefeated, onCombatEvent) {
        this.onEnemyDefeated = onEnemyDefeated;
        this.onCombatEvent = onCombatEvent;
    }

    addEnemy(enemyData) {
        if (!enemyData.id || !enemyData.name) {
            throw new Error('Enemy must have id and name');
        }

        this.enemies.set(enemyData.id, {
            id: enemyData.id,
            name: enemyData.name,
            maxHp: enemyData.hp || 10,
            currentHp: enemyData.hp || 10,
            ac: enemyData.ac || 10,
            isActive: true,
            damage_taken: 0
        });

        console.log(`➕ Added enemy: ${enemyData.name} (HP: ${enemyData.hp})`);
        return this.enemies.get(enemyData.id);
    }

    processAttack(attackData) {
        if (!attackData || !attackData.isValid) {
            throw new Error('Invalid attack data');
        }

        const result = {
            playerName: attackData.playerName,
            roll: attackData.roll,
            damage: attackData.damage,
            weapon: attackData.weapon,
            hits: [],
            kills: [],
            message: ''
        };

        // Process attack against all active enemies
        for (const [enemyId, enemy] of this.enemies) {
            if (!enemy.isActive) continue;

            const hit = attackData.roll >= enemy.ac;
            if (hit) {
                const oldHp = enemy.currentHp;
                enemy.currentHp = Math.max(0, enemy.currentHp - attackData.damage);
                enemy.damage_taken += attackData.damage;

                const hitInfo = {
                    enemyId: enemyId,
                    enemyName: enemy.name,
                    damage: attackData.damage,
                    remainingHp: enemy.currentHp,
                    wasKilled: enemy.currentHp === 0
                };

                result.hits.push(hitInfo);

                if (enemy.currentHp === 0 && enemy.isActive) {
                    enemy.isActive = false;
                    result.kills.push(hitInfo);
                    
                    // Trigger enemy defeated callback
                    if (this.onEnemyDefeated) {
                        this.onEnemyDefeated(enemy, attackData.playerName);
                    }
                }

                console.log(`🎯 ${attackData.playerName} hit ${enemy.name} for ${attackData.damage} damage (${enemy.currentHp}/${enemy.maxHp} HP remaining)`);
            }
        }

        // Generate result message
        result.message = this.formatAttackResult(result);

        // Log the combat event
        this.combatLog.push({
            timestamp: new Date(),
            type: 'attack',
            data: result
        });

        // Trigger combat event callback
        if (this.onCombatEvent) {
            this.onCombatEvent('attack', result);
        }

        return result;
    }

    formatAttackResult(result) {
        if (result.hits.length === 0) {
            return `💥 ${result.playerName} attacks with ${result.weapon} (rolled ${result.roll}) but misses all enemies!`;
        }

        let message = `💥 ${result.playerName} attacks with ${result.weapon} (rolled ${result.roll}):\\n`;
        
        result.hits.forEach(hit => {
            if (hit.wasKilled) {
                message += `💀 KILLED ${hit.enemyName} with ${hit.damage} damage!\\n`;
            } else {
                message += `🎯 Hit ${hit.enemyName} for ${hit.damage} damage (${hit.remainingHp} HP left)\\n`;
            }
        });

        return message.trim();
    }

    getActiveEnemies() {
        return Array.from(this.enemies.values()).filter(enemy => enemy.isActive);
    }

    getAllEnemies() {
        return Array.from(this.enemies.values());
    }

    getEnemy(id) {
        return this.enemies.get(id);
    }

    removeEnemy(id) {
        const removed = this.enemies.delete(id);
        if (removed) {
            console.log(`➖ Removed enemy: ${id}`);
        }
        return removed;
    }

    clearAllEnemies() {
        this.enemies.clear();
        this.combatLog = [];
        console.log('🧹 Cleared all enemies and combat log');
    }

    getCombatLog() {
        return [...this.combatLog];
    }

    // Generate death message with loot and opportunities
    generateDeathMessage(enemy, killerName, useRichText = true) {
        if (useRichText) {
            return this.generateRichDeathMessage(enemy, killerName);
        } else {
            return this.generateDataDeathMessage(enemy, killerName);
        }
    }

    // Rich text version (for StoryTeller)
    generateRichDeathMessage(enemy, killerName) {
        const lootOptions = [
            "a handful of copper coins",
            "a rusty dagger", 
            "some dried rations",
            "a mysterious potion",
            "a small gemstone",
            "ancient trinket",
            "tattered map fragment"
        ];

        const sponsorOpportunities = [
            "This death brought to you by Dave's Discount Dungeon Gear!",
            "Remember: Carl's Survival Crackers - Now with 30% more survival!",
            "Sponsored by Murderface's Weapon Emporium - When you absolutely need to kill something!",
            "This kill made possible by viewers like you!",
            "Dave's Discount Dungeon Gear reminds you: Always loot responsibly!"
        ];

        const viewerAppeal = [
            "Viewers, what should they loot first?",
            "Chat, should they check for traps?",
            "Viewers, rate this kill 1-10!",
            "Chat, what's in the enemy's pockets?",
            "Viewers, should they take a trophy?"
        ];

        const randomLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)];
        const randomSponsor = sponsorOpportunities[Math.floor(Math.random() * sponsorOpportunities.length)];
        const randomAppeal = viewerAppeal[Math.floor(Math.random() * viewerAppeal.length)];

        return `💀 ${enemy.name} has been defeated by ${killerName}!\\n🎁 Found: ${randomLoot}\\n📺 ${randomAppeal}\\n📢 ${randomSponsor}`;
    }

    // Data version (for V4 distributed computing)
    generateDataDeathMessage(enemy, killerName) {
        const lootTypes = [
            { id: "coins_handful", description: "handful of coins", rarity: "common" },
            { id: "weapon_damaged", description: "damaged weapon", rarity: "common" },
            { id: "rations_dried", description: "dried rations", rarity: "common" },
            { id: "potion_mysterious", description: "mysterious potion", rarity: "uncommon" },
            { id: "gem_small", description: "small gemstone", rarity: "uncommon" },
            { id: "trinket_ancient", description: "ancient trinket", rarity: "rare" },
            { id: "map_fragment", description: "map fragment", rarity: "rare" }
        ];

        const randomLoot = lootTypes[Math.floor(Math.random() * lootTypes.length)];

        // Each player's V4 can interpret "handful of coins" differently!
        // One player might get 12 copper, another might get 8 copper + 1 silver
        return {
            type: 'enemy_defeated',
            enemy: {
                id: enemy.id,
                name: enemy.name,
                maxHp: enemy.maxHp
            },
            killer: killerName,
            loot: {
                id: randomLoot.id,
                description: randomLoot.description,
                rarity: randomLoot.rarity,
                // V4 will generate actual quantities/values based on player's luck stats
                personalizable: true
            },
            // Room for viewer interaction
            viewer_prompt: "What should they check for next?",
            sponsor_opportunity: true,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatHandler;
} else {
    window.CombatHandler = CombatHandler;
}
