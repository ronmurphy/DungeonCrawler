/**
 * PartyManager - Handles party data structure and member management
 * Future-proof design supporting multiple players and NPCs
 */
export class PartyManager {
    constructor(partyData) {
        this.partyData = partyData || this.createDefaultParty();
        this.members = new Map(); // name -> member data
        this.formation = 'standard';
        
        this.initializeMembers();
    }

    /**
     * Create default single-player party
     */
    createDefaultParty() {
        return {
            players: [{
                name: 'brad',
                type: 'player',
                level: 5,
                hp: 45,
                maxHp: 45
            }],
            averageLevel: 5,
            gold: 1200,
            formation: 'standard'
        };
    }

    /**
     * Initialize party members from party data
     */
    initializeMembers() {
        this.partyData.players.forEach(playerData => {
            this.members.set(playerData.name, {
                ...playerData,
                status: 'alive',
                statusEffects: [],
                equipment: playerData.equipment || {},
                stats: playerData.stats || this.getDefaultStats(playerData.level),
                actions: playerData.actions || this.getDefaultActions(playerData.type)
            });
        });

        console.log(`👥 Party initialized: ${this.members.size} members`);
    }

    /**
     * Get default stats based on level
     */
    getDefaultStats(level) {
        const baseStats = {
            str: 10 + level,
            dex: 10 + level,
            con: 10 + level,
            int: 10 + level,
            wis: 10 + level,
            cha: 10 + level
        };
        return baseStats;
    }

    /**
     * Get default actions based on member type
     */
    getDefaultActions(type) {
        if (type === 'npc') {
            return {
                weapon: [{ name: 'Basic Attack', damage: '1d6+2' }],
                magic: [{ name: 'Heal', effect: 'heal_1d4+1' }],
                skill: [{ name: 'Guard', effect: 'defense_boost' }]
            };
        }
        
        // Player actions - will be fetched from Storyteller in Phase 3
        return {
            weapon: [
                { name: 'Sword Strike', damage: '1d8+3' },
                { name: 'Power Attack', damage: '1d12+1' }
            ],
            magic: [
                { name: 'Magic Missile', damage: '1d4+1' },
                { name: 'Heal', effect: 'heal_1d4+2' }
            ],
            skill: [
                { name: 'Defensive Stance', effect: 'ac_bonus_2' },
                { name: 'Battle Cry', effect: 'party_attack_bonus' }
            ]
        };
    }

    /**
     * Get all party members
     */
    getPartyMembers() {
        return Array.from(this.members.values());
    }

    /**
     * Get alive party members
     */
    getAliveMembers() {
        return this.getPartyMembers().filter(member => 
            member.status === 'alive' && member.hp > 0
        );
    }

    /**
     * Get party size
     */
    getPartySize() {
        return this.members.size;
    }

    /**
     * Get member by name
     */
    getMember(name) {
        return this.members.get(name);
    }

    /**
     * Apply damage to a party member
     */
    applyDamage(memberName, damage, damageType = 'physical') {
        const member = this.members.get(memberName);
        if (!member) {
            console.warn(`Party member ${memberName} not found`);
            return;
        }

        const oldHp = member.hp;
        member.hp = Math.max(0, member.hp - damage);
        
        console.log(`💔 ${memberName}: ${oldHp} → ${member.hp} HP (-${damage})`);

        // Trigger floating damage number
        this.triggerFloatingNumber(memberName, damage, 'damage', damageType);

        // CRITICAL FIX: Sync combat HP back to persistent character data
        console.log(`🔄 About to sync ${memberName} with HP: ${member.hp}`);
        this.syncMemberToPersistentCharacter(memberName, member);

        // Check if member is knocked out
        if (member.hp === 0 && member.status === 'alive') {
            member.status = 'unconscious';
            console.log(`😵 ${memberName} is unconscious!`);
        }

        return member.hp;
    }

    /**
     * Apply healing to a party member
     */
    applyHealing(memberName, healing, healingType = 'magical') {
        const member = this.members.get(memberName);
        if (!member) {
            console.warn(`Party member ${memberName} not found`);
            return;
        }

        const oldHp = member.hp;
        member.hp = Math.min(member.maxHp, member.hp + healing);
        
        console.log(`💚 ${memberName}: ${oldHp} → ${member.hp} HP (+${healing})`);

        // Trigger floating healing number
        this.triggerFloatingNumber(memberName, healing, 'healing', healingType);

        // CRITICAL FIX: Sync combat HP back to persistent character data
        this.syncMemberToPersistentCharacter(memberName, member);

        // Revive if healed from 0 HP
        if (oldHp === 0 && member.hp > 0) {
            member.status = 'alive';
            console.log(`✨ ${memberName} is revived!`);
        }

        return member.hp;
    }

    /**
     * Add status effect to member
     */
    addStatusEffect(memberName, effect) {
        const member = this.members.get(memberName);
        if (!member) return;

        member.statusEffects.push({
            name: effect.name,
            duration: effect.duration || 3,
            effect: effect.effect
        });

        console.log(`🌟 ${memberName} gains ${effect.name}`);
    }

    /**
     * Set the combat renderer for floating damage numbers
     */
    setCombatRenderer(renderer) {
        this.combatRenderer = renderer;
        this.damageHistory = []; // Track damage for progressive scaling
    }

    /**
     * Trigger floating damage/healing number with progressive scaling
     */
    triggerFloatingNumber(memberName, amount, type, damageType = 'physical') {
        if (!this.combatRenderer || !this.combatRenderer.showFloatingNumber) {
            return; // No renderer available
        }

        // Track damage amounts for scaling (keep last 50 for memory)
        if (type === 'damage') {
            this.damageHistory.push(amount);
            if (this.damageHistory.length > 50) {
                this.damageHistory.shift();
            }
        }

        // Calculate scaling parameters
        const maxDamage = Math.max(...this.damageHistory, amount);
        const isMaxDamage = amount === maxDamage;
        const damagePercentile = this.calculateDamagePercentile(amount);
        const isTopTier = damagePercentile >= 90; // Top 10%

        // Determine critical hit (max damage gets 1.5x multiplier)
        const displayAmount = isMaxDamage && type === 'damage' ? Math.floor(amount * 1.5) : amount;

        console.log(`✨ Floating ${type}: ${amount} → ${displayAmount} (${damagePercentile.toFixed(1)}% percentile, max: ${maxDamage})`);

        this.combatRenderer.showFloatingNumber({
            memberName,
            amount: displayAmount,
            type, // 'damage' or 'healing'
            damageType, // 'physical' or 'magical'
            isMaxDamage,
            isTopTier,
            percentile: damagePercentile
        });
    }

    /**
     * Calculate damage percentile for progressive scaling
     */
    calculateDamagePercentile(amount) {
        if (this.damageHistory.length === 0) return 50;
        
        const sortedDamage = [...this.damageHistory].sort((a, b) => a - b);
        const rank = sortedDamage.findIndex(dmg => dmg >= amount);
        
        if (rank === -1) return 100; // Highest damage yet
        
        return (rank / sortedDamage.length) * 100;
    }

    /**
     * Remove status effect from member
     */
    removeStatusEffect(memberName, effectName) {
        const member = this.members.get(memberName);
        if (!member) return;

        member.statusEffects = member.statusEffects.filter(e => e.name !== effectName);
        console.log(`🚫 ${memberName} loses ${effectName}`);
    }

    /**
     * Process end of turn status effects
     */
    processStatusEffects() {
        this.members.forEach((member, memberName) => {
            member.statusEffects = member.statusEffects.filter(effect => {
                effect.duration--;
                
                if (effect.duration <= 0) {
                    console.log(`⏰ ${memberName}'s ${effect.name} expires`);
                    return false;
                }
                
                return true;
            });
        });
    }

    /**
     * Get member actions for combat UI
     */
    getMemberActions(memberName) {
        const member = this.members.get(memberName);
        if (!member) return null;

        return member.actions;
    }

    /**
     * Add new party member (for future expansion)
     */
    addMember(memberData) {
        const member = {
            ...memberData,
            status: 'alive',
            statusEffects: [],
            equipment: memberData.equipment || {},
            stats: memberData.stats || this.getDefaultStats(memberData.level),
            actions: memberData.actions || this.getDefaultActions(memberData.type)
        };

        this.members.set(memberData.name, member);
        console.log(`➕ ${memberData.name} joined the party!`);
        
        return member;
    }

    /**
     * Remove party member (for future expansion)
     */
    removeMember(memberName) {
        if (this.members.delete(memberName)) {
            console.log(`➖ ${memberName} left the party`);
            return true;
        }
        return false;
    }

    /**
     * Get party formation data (for future positioning)
     */
    getFormation() {
        const partySize = this.getPartySize();
        
        const formations = {
            'standard': this.getStandardFormation(partySize),
            'defensive': this.getDefensiveFormation(partySize),
            'aggressive': this.getAggressiveFormation(partySize),
            'line': this.getLineFormation(partySize)
        };

        return formations[this.formation] || formations.standard;
    }

    /**
     * Standard formation positions
     */
    getStandardFormation(size) {
        const positions = [
            { x: 0, z: -2, role: 'leader' },      // Front center
            { x: -1, z: -3, role: 'flanker' },   // Back left
            { x: 1, z: -3, role: 'flanker' },    // Back right
            { x: 0, z: -4, role: 'support' }     // Back center
        ];
        
        return positions.slice(0, size);
    }

    /**
     * Defensive formation positions
     */
    getDefensiveFormation(size) {
        const positions = [
            { x: 0, z: -3, role: 'tank' },       // Center back
            { x: -0.5, z: -2, role: 'defender' }, // Left front
            { x: 0.5, z: -2, role: 'defender' },  // Right front
            { x: 0, z: -4, role: 'healer' }      // Far back
        ];
        
        return positions.slice(0, size);
    }

    /**
     * Aggressive formation positions
     */
    getAggressiveFormation(size) {
        const positions = [
            { x: 0, z: -1, role: 'striker' },    // Front center
            { x: -1, z: -1.5, role: 'flanker' }, // Front left
            { x: 1, z: -1.5, role: 'flanker' },  // Front right
            { x: 0, z: -2.5, role: 'support' }   // Support back
        ];
        
        return positions.slice(0, size);
    }

    /**
     * Line formation positions
     */
    getLineFormation(size) {
        const positions = [];
        const spacing = 1.5;
        const startX = -(size - 1) * spacing / 2;
        
        for (let i = 0; i < size; i++) {
            positions.push({
                x: startX + (i * spacing),
                z: -2,
                role: i === 0 ? 'leader' : 'member'
            });
        }
        
        return positions;
    }

    /**
     * Set party formation
     */
    setFormation(formationType) {
        this.formation = formationType;
        console.log(`🏗️ Party formation set to: ${formationType}`);
    }

    /**
     * Get party summary for UI display
     */
    getPartySummary() {
        const alive = this.getAliveMembers().length;
        const total = this.getPartySize();
        
        return {
            size: total,
            alive: alive,
            averageLevel: this.partyData.averageLevel,
            gold: this.partyData.gold,
            formation: this.formation,
            status: alive === 0 ? 'defeated' : alive === total ? 'healthy' : 'injured'
        };
    }

    /**
     * Save party state (for future persistence)
     */
    savePartyState() {
        const state = {
            partyData: this.partyData,
            members: Object.fromEntries(this.members),
            formation: this.formation
        };
        
        // Could save to localStorage or send to server
        console.log('💾 Party state saved', state);
        return state;
    }

    /**
     * Load party state (for future persistence)
     */
    loadPartyState(state) {
        this.partyData = state.partyData;
        this.members = new Map(Object.entries(state.members));
        this.formation = state.formation;
        
        console.log('📂 Party state loaded');
    }

    /**
     * Sync combat member data back to persistent character storage
     * This ensures HP/MP changes in combat are saved to IndexedDB
     */
    async syncMemberToPersistentCharacter(memberName, member) {
        try {
            console.log(`🔍 Syncing ${memberName} - window.character:`, window.character);
            console.log(`🔍 Character name check: window.character?.name = "${window.character?.name}", memberName = "${memberName}"`);
            
            // Update global character object if this is the active character
            if (window.character && window.character.name === memberName) {
                window.character.currentHealthPoints = member.hp;
                window.character.currentMagicPoints = member.mp;
                console.log(`🔄 Synced ${memberName} to global character: ${member.hp}/${member.maxHp} HP`);
            } else {
                console.log(`⚠️ Skipping global character sync - window.character=${!!window.character}, name match=${window.character?.name === memberName}`);
            }

            // Update characterManager array
            if (window.characterManager && window.characterManager.characters) {
                const charIndex = window.characterManager.characters.findIndex(char => char.name === memberName);
                if (charIndex !== -1) {
                    window.characterManager.characters[charIndex].currentHealthPoints = member.hp;
                    window.characterManager.characters[charIndex].currentMagicPoints = member.mp;
                    console.log(`🔄 Synced ${memberName} to characterManager array`);
                }
            }

            console.log(`✅ Character data synced for ${memberName}: ${member.hp}/${member.maxHp} HP, ${member.mp}/${member.maxMp} MP`);
        } catch (error) {
            console.error(`❌ Failed to sync character data for ${memberName}:`, error);
        }
    }
}