/**
 * TurnManager - Handles initiative, turn order, and combat flow
 * Manages the sequence of player and enemy actions
 */
export class TurnManager {
    constructor(partyMembers, enemies, combatManager) {
        this.partyMembers = partyMembers;
        this.enemies = enemies;
        this.combatManager = combatManager;
        
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.roundNumber = 1;
        this.isActive = false;
        
        this.initializeTurnOrder();
    }

    /**
     * Initialize turn order based on initiative rolls
     */
    initializeTurnOrder() {
        const allParticipants = [];
        
        // Add party members
        this.partyMembers.forEach(member => {
            allParticipants.push({
                id: member.name,
                name: member.name,
                type: 'player',
                initiative: this.rollInitiative(member),
                combatData: member,
                isActive: false
            });
        });
        
        // Add enemies
        this.enemies.forEach((enemy, index) => {
            console.log(`🏗️ TurnManager adding enemy ${index}:`, enemy.name);
            console.log('🔍 Enemy structure received:', enemy);
            console.log('🗡️ Enemy attacks received:', enemy.attacks);
            console.log('📦 Enemy data field received:', enemy.data);
            
            allParticipants.push({
                id: enemy.id,
                name: enemy.name,
                type: 'enemy',
                initiative: this.rollInitiative(enemy),
                combatData: enemy,
                isActive: false
            });
        });
        
        // Sort by initiative (highest first)
        this.turnOrder = allParticipants.sort((a, b) => b.initiative - a.initiative);
        
        console.log('🎲 Initiative Order:');
        this.turnOrder.forEach((participant, index) => {
            console.log(`  ${index + 1}. ${participant.name} (${participant.initiative}) - ${participant.type}`);
        });
    }

    /**
     * Roll initiative for a participant
     * Simple d20 + dex modifier system
     */
    rollInitiative(participant) {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const dexModifier = this.getDexModifier(participant);
        const total = d20 + dexModifier;
        
        console.log(`🎲 ${participant.name}: ${d20} + ${dexModifier} = ${total} initiative`);
        return total;
    }

    /**
     * Get dexterity modifier for initiative
     */
    getDexModifier(participant) {
        if (participant.stats && participant.stats.dex) {
            return Math.floor((participant.stats.dex - 10) / 2);
        }
        
        // Default modifier based on type
        return participant.type === 'enemy' ? 
            Math.floor(Math.random() * 4) : // 0-3 for enemies
            2; // +2 for players
    }

    /**
     * Start combat and begin first turn
     */
    startCombat() {
        if (this.turnOrder.length === 0) {
            console.error('❌ No participants in combat!');
            return;
        }
        
        this.isActive = true;
        this.currentTurnIndex = 0;
        this.roundNumber = 1;
        
        console.log(`⚔️ Combat Round ${this.roundNumber} begins!`);
        this.startCurrentTurn();
    }

    /**
     * Start the current participant's turn
     */
    startCurrentTurn() {
        if (!this.isActive || this.turnOrder.length === 0) return;
        
        // Clear previous active status
        this.turnOrder.forEach(p => p.isActive = false);
        
        // Set current participant as active
        const currentParticipant = this.turnOrder[this.currentTurnIndex];
        currentParticipant.isActive = true;
        
        console.log(`🎯 Turn ${this.currentTurnIndex + 1}: ${currentParticipant.name}'s turn`);
        
        // Notify combat manager
        this.combatManager.onTurnStart(currentParticipant);
    }

    /**
     * Advance to next turn
     */
    nextTurn() {
        if (!this.isActive) return;
        
        // Clear current active status
        if (this.turnOrder[this.currentTurnIndex]) {
            this.turnOrder[this.currentTurnIndex].isActive = false;
        }
        
        // Advance turn index
        this.currentTurnIndex++;
        
        // Check if round is complete
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.endRound();
            return;
        }
        
        // Check if current participant is still alive/valid
        const currentParticipant = this.turnOrder[this.currentTurnIndex];
        if (!this.isParticipantValid(currentParticipant)) {
            console.log(`⏭️ Skipping ${currentParticipant.name} (defeated/invalid)`);
            this.nextTurn();
            return;
        }
        
        // Start next participant's turn
        this.startCurrentTurn();
    }

    /**
     * End current round and start new round
     */
    endRound() {
        console.log(`🔄 Round ${this.roundNumber} complete!`);
        
        // Process end-of-round effects (status effects, etc.)
        this.processEndOfRoundEffects();
        
        // Remove defeated participants
        this.turnOrder = this.turnOrder.filter(p => this.isParticipantValid(p));
        
        // Check if combat should continue
        if (!this.shouldContinueCombat()) {
            this.endCombat();
            return;
        }
        
        // Start new round
        this.roundNumber++;
        this.currentTurnIndex = 0;
        
        console.log(`🆕 Round ${this.roundNumber} begins!`);
        this.startCurrentTurn();
    }

    /**
     * Check if participant is still valid for combat
     */
    isParticipantValid(participant) {
        if (participant.type === 'enemy') {
            return participant.combatData?.hp > 0;
        } else {
            // Player - check if alive and conscious
            return participant.combatData?.hp > 0 && participant.combatData?.status === 'alive';
        }
    }

    /**
     * Process end-of-round effects
     */
    processEndOfRoundEffects() {
        // Process status effects for party members
        if (this.combatManager.partyManager) {
            this.combatManager.partyManager.processStatusEffects();
        }
        
        // Process enemy status effects (if implemented)
        this.enemies.forEach(enemy => {
            if (enemy.statusEffects) {
                enemy.statusEffects = enemy.statusEffects.filter(effect => {
                    effect.duration--;
                    return effect.duration > 0;
                });
            }
        });
        
        console.log('✨ End-of-round effects processed');
    }

    /**
     * Check if combat should continue
     */
    shouldContinueCombat() {
        const alivePlayers = this.turnOrder.filter(p => 
            p.type === 'player' && this.isParticipantValid(p)
        );
        
        const aliveEnemies = this.turnOrder.filter(p => 
            p.type === 'enemy' && this.isParticipantValid(p)
        );
        
        return alivePlayers.length > 0 && aliveEnemies.length > 0;
    }

    /**
     * End combat
     */
    endCombat() {
        console.log('🏁 Combat turn management ended');
        this.isActive = false;
        
        // Let combat manager handle the actual end logic
        // (it will check win/loss conditions)
    }

    /**
     * Get current turn order for UI display
     */
    getTurnOrder() {
        return this.turnOrder.map((participant, index) => ({
            name: participant.name,
            type: participant.type,
            initiative: participant.initiative,
            isActive: participant.isActive,
            isCurrent: index === this.currentTurnIndex,
            hp: participant.combatData?.hp || participant.combatData?.currentHealthPoints || 20,
            maxHp: participant.combatData?.maxHp || participant.combatData?.healthPoints || participant.combatData?.hp || 20,
            status: participant.combatData?.status || 'alive',
            combatData: participant.combatData // PRESERVE THE COMBAT DATA!
        }));
    }

    /**
     * Get current participant
     */
    getCurrentParticipant() {
        return this.turnOrder[this.currentTurnIndex] || null;
    }

    /**
     * Get round information
     */
    getRoundInfo() {
        return {
            round: this.roundNumber,
            turn: this.currentTurnIndex + 1,
            totalParticipants: this.turnOrder.length,
            isActive: this.isActive
        };
    }

    /**
     * Force next turn (for testing or special abilities)
     */
    forceNextTurn() {
        console.log('⏩ Forcing next turn');
        this.nextTurn();
    }

    /**
     * Add new participant mid-combat (for summoning, etc.)
     */
    addParticipant(participantData, type) {
        const newParticipant = {
            id: participantData.id || participantData.name,
            name: participantData.name,
            type: type,
            initiative: this.rollInitiative(participantData),
            data: participantData,
            isActive: false
        };
        
        // Insert in appropriate position based on initiative
        let insertIndex = this.turnOrder.findIndex(p => p.initiative < newParticipant.initiative);
        if (insertIndex === -1) {
            insertIndex = this.turnOrder.length;
        }
        
        this.turnOrder.splice(insertIndex, 0, newParticipant);
        
        // Adjust current turn index if needed
        if (insertIndex <= this.currentTurnIndex) {
            this.currentTurnIndex++;
        }
        
        console.log(`➕ ${newParticipant.name} joined combat with initiative ${newParticipant.initiative}`);
        
        return newParticipant;
    }

    /**
     * Remove participant from combat
     */
    removeParticipant(participantId) {
        const removeIndex = this.turnOrder.findIndex(p => p.id === participantId);
        if (removeIndex === -1) return false;
        
        const participant = this.turnOrder[removeIndex];
        this.turnOrder.splice(removeIndex, 1);
        
        // Adjust current turn index if needed
        if (removeIndex < this.currentTurnIndex) {
            this.currentTurnIndex--;
        } else if (removeIndex === this.currentTurnIndex) {
            // Current participant was removed, advance turn
            this.currentTurnIndex--; // Will be incremented by nextTurn()
            this.nextTurn();
        }
        
        console.log(`➖ ${participant.name} removed from combat`);
        return true;
    }

    /**
     * Get combat statistics
     */
    getCombatStats() {
        const stats = {
            rounds: this.roundNumber,
            totalParticipants: this.turnOrder.length,
            activePlayers: this.turnOrder.filter(p => p.type === 'player' && this.isParticipantValid(p)).length,
            activeEnemies: this.turnOrder.filter(p => p.type === 'enemy' && this.isParticipantValid(p)).length,
            currentTurn: this.currentTurnIndex + 1
        };
        
        return stats;
    }
}