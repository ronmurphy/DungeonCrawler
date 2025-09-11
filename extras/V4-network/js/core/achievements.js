// ========================================
// DUNGEON CRAWLER CARL ACHIEVEMENTS SYSTEM
// ========================================
// This file handles the achievement system for the DCC character sheet
// Achievements are offered on level up with character-relevant options

// ========================================
// ACHIEVEMENT SYSTEM STATE
// ========================================
let achievementsData = null;
let characterAchievements = [];

// ========================================
// ACHIEVEMENT LOADING AND INITIALIZATION
// ========================================
async function loadAchievements() {
    try {
        const response = await fetch('data/achievements.json');
        achievementsData = await response.json();
        console.log('📜 Achievements loaded successfully!');
        console.log(`📊 Total achievements available: ${getTotalAchievementCount()}`);
        return true;
    } catch (error) {
        console.error('Failed to load achievements:', error);
        // Fallback to embedded achievements if file fails to load
        achievementsData = getEmbeddedAchievements();
        return false;
    }
}

// Get total count of all achievements
function getTotalAchievementCount() {
    if (!achievementsData) return 0;
    return Object.values(achievementsData).reduce((total, category) => total + category.length, 0);
}

// ========================================
// CHARACTER RELEVANCE FILTERING
// ========================================
function getRelevantAchievements(character) {
    if (!achievementsData || !character) return [];
    
    const relevant = [];
    
    // Skill-based achievements
    if (character.customSkills) {
        character.customSkills.forEach(skill => {
            const skillAchievements = achievementsData.skill_based.filter(ach => 
                ach.requiredSkill === skill.name &&
                (!ach.skillLevel || getCharacterSkillLevel(character, skill.name) >= ach.skillLevel)
            );
            relevant.push(...skillAchievements);
        });
    }
    
    // Race-based achievements
    if (character.race) {
        const raceAchievements = achievementsData.race_based.filter(ach => 
            ach.requiredRace === character.race
        );
        relevant.push(...raceAchievements);
    }
    
    // Class-based achievements
    if (character.job) {
        const classAchievements = achievementsData.class_based.filter(ach => 
            ach.requiredClass === character.job
        );
        relevant.push(...classAchievements);
    }
    
    // Additional class check for character.class if it exists
    if (character.class) {
        const classAchievements = achievementsData.class_based.filter(ach => 
            ach.requiredClass === character.class
        );
        relevant.push(...classAchievements);
    }
    
    // Weapon-based achievements (check inventory for weapons)
    if (character.inventory) {
        character.inventory.forEach(item => {
            if (item.type === 'weapon') {
                const weaponKey = getWeaponKey(item.name);
                const weaponAchievements = achievementsData.weapon_based.filter(ach => 
                    ach.requiredWeapon === weaponKey
                );
                relevant.push(...weaponAchievements);
            }
        });
    }
    
    // Filter out achievements already earned
    return relevant.filter(ach => !hasAchievement(character, ach.id));
}

// Get character's skill level
function getCharacterSkillLevel(character, skillName) {
    if (!character.skillLevels || !character.skillLevels[skillName]) return 1;
    return character.skillLevels[skillName].level || 1;
}

// Convert weapon name to key for matching
function getWeaponKey(weaponName) {
    return weaponName.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

// Check if character has achievement
function hasAchievement(character, achievementId) {
    if (!character.achievements) character.achievements = [];
    return character.achievements.some(ach => ach.id === achievementId);
}

// ========================================
// ACHIEVEMENT SELECTION LOGIC
// ========================================
function selectAchievementsForLevelUp(character) {
    if (!achievementsData) return [];
    
    const level = character.level + 1; // The level we're becoming
    console.log(`🎯 Selecting achievements for level ${level}`);
    
    // Calculate rarity percentages based on game design mathematics
    const rarityChances = calculateRarityChances(level);
    console.log(`📊 Rarity chances for level ${level}:`, rarityChances);
    
    // Get all available achievements by rarity
    const availableByRarity = {
        common: getAllAchievementsByRarity('common').filter(ach => !hasAchievement(character, ach.id)),
        uncommon: getAllAchievementsByRarity('uncommon').filter(ach => !hasAchievement(character, ach.id)),
        rare: getAllAchievementsByRarity('rare').filter(ach => !hasAchievement(character, ach.id)),
        epic: getAllAchievementsByRarity('epic').filter(ach => !hasAchievement(character, ach.id)),
        legendary: getAllAchievementsByRarity('legendary').filter(ach => !hasAchievement(character, ach.id))
    };
    
    const selected = [];
    
    // Select 3 achievements based on rarity chances
    for (let i = 0; i < 3; i++) {
        const rarity = selectRarityByChance(rarityChances);
        const availableInRarity = availableByRarity[rarity];
        
        if (availableInRarity.length > 0) {
            // Try to get a relevant achievement first
            const relevant = availableInRarity.filter(ach => isAchievementRelevant(character, ach));
            const pool = relevant.length > 0 ? relevant : availableInRarity;
            
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selectedAchievement = pool[randomIndex];
            selected.push(selectedAchievement);
            
            // Remove from all pools to avoid duplicates
            Object.values(availableByRarity).forEach(pool => {
                const index = pool.findIndex(ach => ach.id === selectedAchievement.id);
                if (index !== -1) pool.splice(index, 1);
            });
            
            console.log(`🏆 Selected ${rarity} achievement: ${selectedAchievement.name}`);
        } else {
            // Fallback to any available achievement if the rarity pool is empty
            const allAvailable = Object.values(availableByRarity).flat();
            if (allAvailable.length > 0) {
                const randomIndex = Math.floor(Math.random() * allAvailable.length);
                const selectedAchievement = allAvailable[randomIndex];
                selected.push(selectedAchievement);
                console.log(`🔄 Fallback selection: ${selectedAchievement.name} (${selectedAchievement.rarity})`);
            }
        }
    }
    
    return selected;
}

// Calculate rarity chances based on game design mathematics
function calculateRarityChances(level) {
    const chances = {};
    
    if (level <= 10) {
        // Level 1-10: Learning Phase
        chances.common = 50;
        chances.uncommon = 20;
        chances.rare = 5;
        chances.epic = 0;
        chances.legendary = 0;
    } else if (level <= 30) {
        // Level 11-30: Adventuring Phase
        chances.common = 30;
        chances.uncommon = 35;
        chances.rare = 20;
        chances.epic = 10;
        chances.legendary = 0;
    } else {
        // Level 31-50: Heroic Phase
        chances.common = 20;
        chances.uncommon = 35;
        chances.rare = 25;
        chances.epic = 15;
        chances.legendary = 5;
    }
    
    // Normalize to ensure they add up to 100
    const total = Object.values(chances).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
        const adjustment = 100 - total;
        chances.uncommon += adjustment; // Adjust uncommon to make it exactly 100
    }
    
    return chances;
}

// Select a rarity based on weighted chances
function selectRarityByChance(chances) {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(chances)) {
        cumulative += chance;
        if (random <= cumulative) {
            return rarity;
        }
    }
    
    return 'common'; // Fallback
}

// Get all achievements of a specific rarity from all categories
function getAllAchievementsByRarity(rarity) {
    if (!achievementsData) return [];
    
    const allAchievements = [];
    Object.values(achievementsData).forEach(category => {
        if (Array.isArray(category)) {
            allAchievements.push(...category.filter(ach => ach.rarity === rarity));
        }
    });
    
    return allAchievements;
}

// Check if an achievement is relevant to the character
function isAchievementRelevant(character, achievement) {
    // Use the existing getRelevantAchievements logic but for a single achievement
    const relevant = getRelevantAchievements(character);
    return relevant.some(rel => rel.id === achievement.id);
}

// ========================================
// ACHIEVEMENT MODAL DISPLAY
// ========================================
function showAchievementSelectionModal(character, achievements) {
    if (!achievements || achievements.length === 0) {
        console.log('No achievements available for selection');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal achievement-modal level-up-modal-overlay';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content" style="max-width: 900px;">
            <div class="modal-header level-up-header">
                <h3><i class="ra ra-trophy"></i> Level Up Bonus: Choose Achievement!</h3>
                <div class="level-display">Level ${character.level} Achievement Bonus</div>
            </div>
            <div class="modal-body">
                <p>As part of leveling up, choose one achievement to unlock. Each provides permanent benefits to your character:</p>
                <div class="achievement-selection-grid" style="max-height: 400px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ffd700 rgba(255,255,255,0.1);">
                    ${achievements.map((ach, index) => `
                        <div class="achievement-card" onclick="selectAchievement('${ach.id}', ${index})" data-index="${index}"
                             style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid ${getRarityColor(ach.rarity)}; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h4 style="color: #ffd700; margin: 0; font-size: 14px;">
                                    <i class="ra ra-trophy"></i> ${ach.name}
                                </h4>
                                <div style="display: flex; align-items: center;">
                                    <span style="color: #8a8a8a; font-size: 12px; margin-right: 5px;">${ach.rarity}</span>
                                    <span class="material-icons rarity-icon rarity-${ach.rarity}" style="font-size: 16px; color: ${getRarityColor(ach.rarity)};">military_tech</span>
                                </div>
                            </div>
                            <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 5px;">
                                ${ach.description}
                            </div>
                            <div style="font-size: 11px; color: #4fc3f7; margin-bottom: 5px;">
                                <strong>Effect:</strong> ${ach.effect}
                            </div>
                            <div style="font-size: 10px; color: #8a8a8a;">
                                <strong>Category:</strong> ${ach.category}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeAchievementModal()" class="btn-secondary">Skip (No Achievement)</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store achievements for selection
    window.currentAchievementOptions = achievements;
}

// Get emoji for rarity
function getRarityEmoji(rarity) {
    const emojis = {
        'common': '🥉',
        'uncommon': '🥈',
        'rare': '🥇',
        'epic': '💎',
        'legendary': '👑'
    };
    return emojis[rarity] || '🏆';
}

// Get color for rarity
function getRarityColor(rarity) {
    const colors = {
        'common': '#8B4513',
        'uncommon': '#228B22',
        'rare': '#1E90FF',
        'epic': '#8A2BE2',
        'legendary': '#FFD700'
    };
    return colors[rarity] || '#ffd700';
}

// ========================================
// ACHIEVEMENT SELECTION AND APPLICATION
// ========================================
function selectAchievement(achievementId, optionIndex) {
    if (!window.currentAchievementOptions || !character) return;
    
    const achievement = window.currentAchievementOptions[optionIndex];
    if (!achievement || achievement.id !== achievementId) {
        console.error('Achievement mismatch!');
        return;
    }
    
    // Add achievement to character
    if (!character.achievements) character.achievements = [];
    character.achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        effect: achievement.effect,
        rarity: achievement.rarity,
        category: achievement.category,
        dateEarned: new Date().toISOString()
    });
    
    // Apply achievement effects
    applyAchievementEffects(character, achievement);
    
    // Show notification
    if (window.showNotification) {
        showNotification('level', `Achievement Unlocked: ${achievement.name}`, achievement.effect);
    }
    
    // Update character display
    if (window.updateCharacterDisplay) {
        updateCharacterDisplay();
    }
    
    // Save character
    if (window.saveCurrentCharacterToStorage) {
        saveCurrentCharacterToStorage();
    }
    
    closeAchievementModal();
    
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
}

// Apply achievement effects to character
function applyAchievementEffects(character, achievement) {
    const effect = achievement.effect.toLowerCase();
    
    // Parse stat bonuses
    const statRegex = /\+(\d+) to (strength|dexterity|constitution|intelligence|wisdom|charisma)/g;
    let match;
    while ((match = statRegex.exec(effect)) !== null) {
        const bonus = parseInt(match[1]);
        const stat = match[2];
        if (character.stats && character.stats[stat] !== undefined) {
            character.stats[stat] += bonus;
            console.log(`Applied +${bonus} to ${stat}`);
        }
    }
    
    // Parse "all stats" bonuses
    const allStatsRegex = /\+(\d+) to all stats/g;
    while ((match = allStatsRegex.exec(effect)) !== null) {
        const bonus = parseInt(match[1]);
        Object.keys(character.stats).forEach(stat => {
            character.stats[stat] += bonus;
        });
        console.log(`Applied +${bonus} to all stats`);
    }
    
    // Parse magic points bonuses
    const mpRegex = /\+(\d+) to magic points/g;
    while ((match = mpRegex.exec(effect)) !== null) {
        const bonus = parseInt(match[1]);
        character.magicPoints += bonus;
        console.log(`Applied +${bonus} to magic points`);
    }
    
    // Parse inventory slots
    const inventoryRegex = /\+(\d+) inventory slots/g;
    while ((match = inventoryRegex.exec(effect)) !== null) {
        const bonus = parseInt(match[1]);
        if (!character.inventorySlots) character.inventorySlots = 20; // Default
        character.inventorySlots += bonus;
        console.log(`Applied +${bonus} inventory slots`);
    }
    
    // Parse skill bonuses
    const skillRegex = /\+(\d+) to ([^,]+) skill/g;
    while ((match = skillRegex.exec(effect)) !== null) {
        const bonus = parseInt(match[1]);
        const skillName = match[2].trim();
        
        if (!character.skillBonuses) character.skillBonuses = {};
        if (!character.skillBonuses[skillName]) character.skillBonuses[skillName] = 0;
        character.skillBonuses[skillName] += bonus;
        console.log(`Applied +${bonus} to ${skillName} skill`);
    }
    
    // Store special effects for later reference
    if (!character.specialEffects) character.specialEffects = [];
    
    // Parse special abilities
    if (effect.includes('immunity')) {
        character.specialEffects.push(`Immunity: ${achievement.effect}`);
    }
    if (effect.includes('resistance')) {
        character.specialEffects.push(`Resistance: ${achievement.effect}`);
    }
    if (effect.includes('can ') || effect.includes('ability')) {
        character.specialEffects.push(`Special Ability: ${achievement.effect}`);
    }
}

// Close achievement modal
function closeAchievementModal() {
    const modal = document.querySelector('.achievement-modal');
    if (modal) {
        modal.remove();
    }
    window.currentAchievementOptions = null;
}

// Show all character achievements modal
function showAchievementsModal() {
    if (!character || !character.achievements || character.achievements.length === 0) {
        // Show empty state
        const modal = document.createElement('div');
        modal.className = 'modal achievement-modal level-up-modal-overlay';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content level-up-modal-content" style="max-width: 600px;">
                <div class="modal-header level-up-header">
                    <h3><i class="ra ra-trophy"></i> Achievements</h3>
                    <div class="level-display">No achievements yet</div>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 4em; opacity: 0.3;">🏆</div>
                        <h4>No Achievements Yet</h4>
                        <p>Level up to unlock achievements based on your character's skills, race, class, and equipment!</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeAchievementModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }

    // Group achievements by rarity
    const groupedAchievements = character.achievements.reduce((groups, achievement) => {
        const rarity = achievement.rarity || 'common';
        if (!groups[rarity]) groups[rarity] = [];
        groups[rarity].push(achievement);
        return groups;
    }, {});

    // Sort rarities from common to legendary
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    const modal = document.createElement('div');
    modal.className = 'modal achievement-modal level-up-modal-overlay';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content" style="max-width: 900px;">
            <div class="modal-header level-up-header">
                <h3><i class="ra ra-trophy"></i> Achievements</h3>
                <div class="level-display">${character.achievements.length} earned</div>
            </div>
            <div class="modal-body">
                <div class="achievements-display">
                    ${rarityOrder.map(rarity => {
                        const achievements = groupedAchievements[rarity];
                        if (!achievements || achievements.length === 0) return '';
                        
                        return `
                            <div class="achievement-rarity-section">
                                <h4 class="rarity-header ${rarity}">
                                    ${getRarityEmoji(rarity)} ${rarity.toUpperCase()} (${achievements.length})
                                </h4>
                                <div class="achievements-grid">
                                    ${achievements.map(achievement => `
                                        <div class="achievement-card" 
                                             style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid ${getRarityColor(achievement.rarity)}; transition: all 0.3s ease;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                                <h4 style="color: #ffd700; margin: 0; font-size: 14px;">
                                                    <i class="ra ra-trophy"></i> ${achievement.name}
                                                </h4>
                                                <div style="display: flex; align-items: center;">
                                                    <span style="color: #8a8a8a; font-size: 12px; margin-right: 5px;">${achievement.rarity}</span>
                                                    <span class="material-icons rarity-icon rarity-${achievement.rarity}" style="font-size: 16px; color: ${getRarityColor(achievement.rarity)};">military_tech</span>
                                                </div>
                                            </div>
                                            <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 5px;">
                                                ${achievement.description}
                                            </div>
                                            <div style="font-size: 11px; color: #4fc3f7; margin-bottom: 5px;">
                                                <strong>Effect:</strong> ${achievement.effect}
                                            </div>
                                            <div style="font-size: 10px; color: #8a8a8a;">
                                                <strong>Earned:</strong> ${achievement.dateEarned ? new Date(achievement.dateEarned).toLocaleDateString() : 'Unknown date'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAchievementModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========================================
// ACHIEVEMENT DISPLAY FUNCTIONS
// ========================================
function displayCharacterAchievements(character) {
    if (!character.achievements || character.achievements.length === 0) {
        return '<p style="text-align: center; color: #8a8a8a;">No achievements earned yet.</p>';
    }
    
    return character.achievements.map(ach => `
        <div class="achievement-display ${ach.rarity}">
            <div class="achievement-header">
                <h4>${getRarityEmoji(ach.rarity)} ${ach.name}</h4>
                <span class="achievement-rarity">${ach.rarity}</span>
            </div>
            <p>${ach.description}</p>
            <div class="achievement-effect"><strong>Effect:</strong> ${ach.effect}</div>
            <small>Earned: ${new Date(ach.dateEarned).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Add achievements tab to character sheet
function addAchievementsTab() {
    // This will be called when the character sheet is rendered
    const tabsContainer = document.querySelector('.character-tabs');
    if (!tabsContainer || tabsContainer.querySelector('[data-tab="achievements"]')) return;
    
    // Add achievements tab
    const achievementsTab = document.createElement('button');
    achievementsTab.className = 'tab-button';
    achievementsTab.setAttribute('data-tab', 'achievements');
    achievementsTab.innerHTML = '🏆 Achievements';
    achievementsTab.onclick = () => showTab('achievements');
    
    tabsContainer.appendChild(achievementsTab);
    
    // Add achievements content area
    const contentArea = document.querySelector('.character-content');
    if (!contentArea) return;
    
    const achievementsContent = document.createElement('div');
    achievementsContent.id = 'achievements-content';
    achievementsContent.className = 'tab-content';
    achievementsContent.style.display = 'none';
    achievementsContent.innerHTML = `
        <h3>🏆 Character Achievements</h3>
        <div id="achievements-list">
            ${displayCharacterAchievements(character)}
        </div>
        <div class="achievements-stats">
            <p><strong>Total Achievements:</strong> ${character.achievements ? character.achievements.length : 0}</p>
            <p><strong>Rarity Breakdown:</strong></p>
            <div id="rarity-breakdown"></div>
        </div>
    `;
    
    contentArea.appendChild(achievementsContent);
    
    // Update rarity breakdown
    updateRarityBreakdown();
}

// Update rarity breakdown display
function updateRarityBreakdown() {
    const breakdown = document.getElementById('rarity-breakdown');
    if (!breakdown || !character.achievements) return;
    
    const rarities = {};
    character.achievements.forEach(ach => {
        rarities[ach.rarity] = (rarities[ach.rarity] || 0) + 1;
    });
    
    breakdown.innerHTML = Object.entries(rarities).map(([rarity, count]) => 
        `<span class="rarity-count ${rarity}">${getRarityEmoji(rarity)} ${rarity}: ${count}</span>`
    ).join(' ');
}

// ========================================
// INTEGRATION WITH LEVEL UP SYSTEM
// ========================================
function triggerAchievementSelection(character) {
    if (!achievementsData) {
        console.log('Achievements not loaded, skipping achievement selection');
        return;
    }
    
    const availableAchievements = selectAchievementsForLevelUp(character);
    
    if (availableAchievements.length > 0) {
        showAchievementSelectionModal(character, availableAchievements);
    } else {
        console.log('No achievements available for this level up');
    }
}

// Hook into existing level up system
// COMMENTED OUT: Now using integrated achievement system in main.js Level Up modal
/*
function enhanceLevelUpWithAchievements() {
    // Override the existing confirmLevelUp function to include achievements
    const originalConfirmLevelUp = window.confirmLevelUp;
    if (originalConfirmLevelUp) {
        window.confirmLevelUp = function(newLevel, isSkillLevel) {
            // Call original confirm level up
            originalConfirmLevelUp(newLevel, isSkillLevel);
            
            // Trigger achievement selection immediately after level up is confirmed
            setTimeout(() => {
                triggerAchievementSelection(character);
            }, 100);
        };
    }
}
*/

// ========================================
// ACHIEVEMENT STYLES
// ========================================
function addAchievementStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .achievement-modal .modal-content {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #ff6b35;
        }
        
        .achievement-selection-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            margin: 20px 0;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .achievement-option {
            padding: 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .achievement-option:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .achievement-option.common {
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, rgba(160, 82, 45, 0.2) 100%);
            border-color: #8B4513;
        }
        
        .achievement-option.uncommon {
            background: linear-gradient(135deg, rgba(34, 139, 34, 0.2) 0%, rgba(50, 205, 50, 0.2) 100%);
            border-color: #228B22;
        }
        
        .achievement-option.rare {
            background: linear-gradient(135deg, rgba(30, 144, 255, 0.2) 0%, rgba(65, 105, 225, 0.2) 100%);
            border-color: #1E90FF;
        }
        
        .achievement-option.epic {
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(147, 112, 219, 0.2) 100%);
            border-color: #8A2BE2;
        }
        
        .achievement-option.legendary {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%);
            border-color: #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
        
        .achievement-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .achievement-header h3 {
            margin: 0;
            color: #fff;
        }
        
        .achievement-rarity {
            font-size: 0.8em;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .achievement-description {
            color: #ccc;
            margin: 10px 0;
            font-style: italic;
        }
        
        .achievement-effect {
            color: #ff6b35;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .achievement-category {
            color: #888;
        }
        
        .achievement-display {
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ff6b35;
        }
        
        .achievement-display.common { border-left-color: #8B4513; }
        .achievement-display.uncommon { border-left-color: #228B22; }
        .achievement-display.rare { border-left-color: #1E90FF; }
        .achievement-display.epic { border-left-color: #8A2BE2; }
        .achievement-display.legendary { border-left-color: #FFD700; }
        
        .rarity-count {
            display: inline-block;
            margin: 5px;
            padding: 5px 10px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .secondary-btn {
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .secondary-btn:hover {
            background: #777;
        }
        
        /* Achievement display modal styling */
        .achievements-display {
            max-height: 500px;
            overflow-y: auto;
        }
        
        .achievement-rarity-section {
            margin-bottom: 1.5rem;
        }
        
        .rarity-header {
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--border-color);
        }
        
        .rarity-header.common { border-color: #8B4513; }
        .rarity-header.uncommon { border-color: #228B22; }
        .rarity-header.rare { border-color: #1E90FF; }
        .rarity-header.epic { border-color: #8A2BE2; }
        .rarity-header.legendary { border-color: #FFD700; }
        
        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 0.75rem;
        }
        
        .achievement-display .achievement-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }
        
        .achievement-display h5 {
            margin: 0;
            font-size: 1em;
        }
        
        .achievement-date {
            opacity: 0.6;
            font-size: 0.8em;
        }
        
        .achievement-display .achievement-description {
            margin: 0.5rem 0;
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .achievement-display .achievement-effect {
            background: rgba(255, 107, 53, 0.1);
            padding: 0.4rem;
            border-radius: 4px;
            font-size: 0.85em;
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// FALLBACK EMBEDDED ACHIEVEMENTS
// ========================================
function getEmbeddedAchievements() {
    // Fallback achievements in case JSON file fails to load
    return {
        general: [
            {
                id: "first_steps",
                name: "First Steps",
                description: "Survive your first day in the dungeon",
                effect: "+1 to Constitution",
                rarity: "common",
                category: "survival"
            },
            {
                id: "crowd_pleaser",
                name: "Crowd Pleaser",
                description: "Gain 1000 viewers in a single episode",
                effect: "+1 to Charisma, +10% experience from social interactions",
                rarity: "common",
                category: "social"
            }
        ],
        skill_based: [],
        race_based: [],
        class_based: [],
        weapon_based: [],
        absurd: [],
        legendary: []
    };
}

// ========================================
// INITIALIZATION
// ========================================
async function initializeAchievementSystem() {
    console.log('🏆 Initializing Achievement System...');
    
    await loadAchievements();
    addAchievementStyles();
    // enhanceLevelUpWithAchievements(); // COMMENTED OUT: Now using integrated achievement system in main.js
    
    // Add achievements tab when character is loaded
    if (character) {
        addAchievementsTab();
    }
    
    console.log('✅ Achievement system initialized successfully!');
}

// Make functions globally available
window.achievementSystem = {
    triggerAchievementSelection,
    selectAchievement,
    closeAchievementModal,
    displayCharacterAchievements,
    addAchievementsTab,
    initializeAchievementSystem
};

// Also make individual functions global for onclick handlers
window.selectAchievement = selectAchievement;
window.closeAchievementModal = closeAchievementModal;
window.triggerAchievementSelection = triggerAchievementSelection;
window.showAchievementsModal = showAchievementsModal;
window.applyAchievementEffects = applyAchievementEffects;

// Auto-initialize when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAchievementSystem);
} else {
    initializeAchievementSystem();
}

