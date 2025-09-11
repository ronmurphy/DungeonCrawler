// ========================================
// DUNGEON CRAWLER CARL - LEVEL UP SYSTEM
// ========================================
// Clean, streamlined level up system with:
// - 3 attribute points to assign
// - Smart achievement selection
// - Skill selection on levels divisible by 3
// - Unified visual design with rarity medals

// ========================================
// LEVEL UP STATE
// ========================================
let levelUpState = {
    newLevel: 0,
    attributePoints: 3,
    originalStats: {},
    tempStats: {},
    selectedAchievement: null,
    selectedSkill: null,
    isSkillLevel: false,
    availableAchievements: [],
    availableSkills: []
};

// ========================================
// MAIN LEVEL UP FUNCTION
// ========================================
async function showLevelUpModal(newLevel) {
    console.log(`🆙 Starting level up to level ${newLevel}`);
    
    // Initialize state
    levelUpState.newLevel = newLevel;
    levelUpState.attributePoints = 3;
    levelUpState.isSkillLevel = (newLevel % 3 === 0);
    levelUpState.originalStats = { ...character.stats };
    levelUpState.tempStats = { ...character.stats };
    levelUpState.selectedAchievement = null;
    levelUpState.selectedSkill = null;
    levelUpState.availableAchievements = [];
    levelUpState.availableSkills = [];
    
    console.log(`🆙 Level ${newLevel}, Skill Level: ${levelUpState.isSkillLevel}`);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = createLevelUpModalHTML();
    
    // Add to page
    document.body.appendChild(modal);
    
    // Initialize interactions (pass modal directly to avoid timing issues)
    initializeLevelUpInteractions(modal);
    
    // Load achievements and skills asynchronously
    await loadLevelUpAchievements();
    if (levelUpState.isSkillLevel) {
        await loadLevelUpSkills();
    }
    
    // Update displays
    updateAttributeDisplay();
    updatePreviewDisplay();
}

// ========================================
// MODAL HTML GENERATION
// ========================================
function createLevelUpModalHTML() {
    return `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🆙 Level Up to ${levelUpState.newLevel}</h3>
                <button class="modal-close" onclick="cancelLevelUp()">×</button>
            </div>
            
            <div class="modal-body">
                <!-- Attribute Assignment Section -->
                <div class="level-up-section attribute-section">
                    <h4>📈 Assign Attribute Points</h4>
                    <div class="points-remaining">
                        Points Remaining: <span id="points-remaining">${levelUpState.attributePoints}</span>
                    </div>
                    <div class="attribute-grid">
                        ${createAttributeControls()}
                    </div>
                </div>
                
                <!-- Achievement Selection Section -->
                <div class="level-up-section achievement-section">
                    <h4>🏆 Choose Your Achievement</h4>
                    <div id="achievement-options" class="options-grid">
                        <div class="loading-indicator">Loading achievements...</div>
                    </div>
                </div>
                
                <!-- Skill Selection Section (only if skill level) -->
                ${levelUpState.isSkillLevel ? `
                <div class="level-up-section skill-section">
                    <h4>⚡ Choose a New Skill</h4>
                    <div id="skill-options" class="options-grid">
                        <div class="loading-indicator">Loading skills...</div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Preview Section -->
                <div class="level-up-section preview-section">
                    <h4>👁️ Preview</h4>
                    <div class="preview-grid">
                        <div class="preview-item">
                            <span class="preview-label">HP:</span>
                            <span id="preview-hp" class="preview-value">-</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">MP:</span>
                            <span id="preview-mp" class="preview-value">-</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Achievement:</span>
                            <span id="preview-achievement" class="preview-value">None selected</span>
                        </div>
                        ${levelUpState.isSkillLevel ? `
                        <div class="preview-item">
                            <span class="preview-label">New Skill:</span>
                            <span id="preview-skill" class="preview-value">None selected</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" onclick="cancelLevelUp()">Cancel</button>
                <button class="btn-primary" id="confirm-level-up" onclick="confirmLevelUp()" disabled>
                    Confirm Level Up
                </button>
            </div>
        </div>
    `;
}

// ========================================
// ATTRIBUTE CONTROLS
// ========================================
function createAttributeControls() {
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    return stats.map(stat => `
        <div class="attribute-control" data-stat="${stat}">
            <div class="attribute-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
            <div class="attribute-controls">
                <button class="btn-minus" onclick="adjustAttribute('${stat}', -1)">-</button>
                <div class="attribute-display">
                    <span class="original-value">${levelUpState.originalStats[stat]}</span>
                    <span class="arrow">→</span>
                    <span class="current-value" id="temp-${stat}">${levelUpState.tempStats[stat]}</span>
                </div>
                <button class="btn-plus" onclick="adjustAttribute('${stat}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// ATTRIBUTE ADJUSTMENT
// ========================================
function adjustAttribute(stat, change) {
    const newValue = levelUpState.tempStats[stat] + change;
    const maxStat = character.statMaximums[stat] || 18;
    const minStat = levelUpState.originalStats[stat];
    
    // Validate change
    if (change > 0 && (levelUpState.attributePoints <= 0 || newValue > maxStat)) {
        return;
    }
    if (change < 0 && newValue < minStat) {
        return;
    }
    
    // Apply change
    levelUpState.tempStats[stat] = newValue;
    levelUpState.attributePoints -= change;
    
    // Update display
    updateAttributeDisplay();
    updatePreviewDisplay();
    updateConfirmButton();
}

function updateAttributeDisplay() {
    // Update points remaining
    document.getElementById('points-remaining').textContent = levelUpState.attributePoints;
    
    // Update attribute values and button states
    Object.keys(levelUpState.tempStats).forEach(stat => {
        const currentValueEl = document.getElementById(`temp-${stat}`);
        if (currentValueEl) {
            currentValueEl.textContent = levelUpState.tempStats[stat];
        }
        
        // Update button states
        const control = document.querySelector(`[data-stat="${stat}"]`);
        if (control) {
            const minusBtn = control.querySelector('.btn-minus');
            const plusBtn = control.querySelector('.btn-plus');
            
            const maxStat = character.statMaximums[stat] || 18;
            const minStat = levelUpState.originalStats[stat];
            
            minusBtn.disabled = levelUpState.tempStats[stat] <= minStat;
            plusBtn.disabled = levelUpState.attributePoints <= 0 || levelUpState.tempStats[stat] >= maxStat;
        }
    });
}

// ========================================
// ACHIEVEMENT LOADING AND SELECTION
// ========================================
async function loadLevelUpAchievements() {
    try {
        console.log('🔍 Loading achievements for level up...');
        console.log('Achievement system available:', !!window.selectAchievementsForLevelUp);
        console.log('Achievements data loaded:', !!window.achievementsData);
        
        // Ensure achievements are loaded first
        if (window.loadAchievements) {
            await window.loadAchievements();
        }
        
        // Use the existing achievement system to get relevant achievements
        if (window.selectAchievementsForLevelUp) {
            const achievements = window.selectAchievementsForLevelUp(character);
            console.log('🎯 Retrieved achievements:', achievements.length);
            
            // Store achievements in our level up state for selection
            levelUpState.availableAchievements = achievements;
            displayAchievementOptions(achievements);
        } else {
            console.warn('Achievement system not loaded');
            document.getElementById('achievement-options').innerHTML = 
                '<div class="error-message">Achievement system not available</div>';
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
        document.getElementById('achievement-options').innerHTML = 
            '<div class="error-message">Failed to load achievements</div>';
    }
}

function displayAchievementOptions(achievements) {
    const container = document.getElementById('achievement-options');
    
    if (!achievements || achievements.length === 0) {
        container.innerHTML = '<div class="no-options">No achievements available</div>';
        return;
    }
    
    container.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ffd700 rgba(255,255,255,0.1);">
            ${achievements.map((achievement, index) => `
                <div class="achievement-card" onclick="selectAchievement(${index})" data-index="${index}" 
                     style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid ${getRarityColor(achievement.rarity)}; cursor: pointer; transition: all 0.3s ease;">
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
                    <div style="font-size: 11px; color: #4fc3f7;">
                        <strong>Effect:</strong> ${achievement.effect}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function selectAchievement(index) {
    // Remove previous selection
    document.querySelectorAll('.achievement-card').forEach(el => el.classList.remove('selected'));
    
    // Select new achievement
    const achievementEl = document.querySelector(`.achievement-card[data-index="${index}"]`);
    if (achievementEl) {
        achievementEl.classList.add('selected');
        
        // Get achievement data from our stored achievements
        if (levelUpState.availableAchievements && levelUpState.availableAchievements[index]) {
            levelUpState.selectedAchievement = levelUpState.availableAchievements[index];
            console.log('🏆 Selected achievement:', levelUpState.selectedAchievement.name);
            
            // Update preview
            updatePreviewDisplay();
            updateConfirmButton();
        } else {
            console.error('Achievement not found at index:', index);
        }
    }
}

function selectSkill(index) {
    // Remove previous selection
    document.querySelectorAll('.skill-option').forEach(el => el.classList.remove('selected'));
    
    // Select new skill
    const skillEl = document.querySelector(`.skill-option[data-index="${index}"]`);
    if (skillEl) {
        skillEl.classList.add('selected');
        
        // Get skill data from our stored skills
        if (levelUpState.availableSkills && levelUpState.availableSkills[index]) {
            levelUpState.selectedSkill = levelUpState.availableSkills[index];
            console.log('⚡ Selected skill:', levelUpState.selectedSkill.name);
            
            // Update preview
            updatePreviewDisplay();
            updateConfirmButton();
        } else {
            console.error('Skill not found at index:', index);
        }
    }
}

// ========================================
// SKILL LOADING AND SELECTION
// ========================================
async function loadLevelUpSkills() {
    try {
        // Ensure skills are loaded
        if (window.skillSystem?.loadSkills) {
            await window.skillSystem.loadSkills();
        } else if (window.loadSkills) {
            await window.loadSkills();
        }
        
        const availableSkills = getAvailableSkills();
        levelUpState.availableSkills = availableSkills;  // Store in our state
        displaySkillOptions(availableSkills);
    } catch (error) {
        console.error('Error loading skills:', error);
        document.getElementById('skill-options').innerHTML = 
            '<div class="error-message">Failed to load skills</div>';
    }
}

function getAvailableSkills() {
    // Get skills that the character doesn't already have
    const allSkillsObj = window.skillSystem?.allSkills || {};
    const allSkillsArray = Object.entries(allSkillsObj).map(([name, data]) => ({
        name: name,
        ...data
    }));
    
    const characterSkills = character.customSkills || [];
    const characterSkillNames = characterSkills.map(s => s.name.toLowerCase());
    
    console.log('🔍 Skills debug:', {
        allSkillsCount: allSkillsArray.length,
        characterSkillsCount: characterSkills.length,
        skillSystem: window.skillSystem ? 'loaded' : 'not loaded'
    });
    
    const availableSkills = allSkillsArray.filter(skill => 
        !characterSkillNames.includes(skill.name.toLowerCase())
    ).slice(0, 3); // Limit to 3 options per game design
    
    console.log('🎯 Available skills for selection:', availableSkills.length);
    
    return availableSkills;
}

function displaySkillOptions(skills) {
    const container = document.getElementById('skill-options');
    
    if (!skills || skills.length === 0) {
        container.innerHTML = '<div class="no-options">No new skills available</div>';
        return;
    }

    container.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #4fc3f7 rgba(255,255,255,0.1);">
            ${skills.map((skill, index) => `
                <div class="skill-card" onclick="selectSkill(${index})" data-index="${index}" 
                     style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid #4fc3f7; cursor: pointer; transition: all 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h4 style="color: #4fc3f7; margin: 0; font-size: 14px;">
                            <i class="ra ra-lightning-bolt"></i> ${skill.name}
                        </h4>
                        <div style="display: flex; align-items: center;">
                            <span style="color: #8a8a8a; font-size: 12px; margin-right: 5px;">${skill.stat || 'STR'}</span>
                            <span class="material-icons" style="font-size: 16px; color: #4fc3f7;">flash_on</span>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 5px;">
                        ${skill.description || 'A useful skill for your adventures.'}
                    </div>
                    <div style="font-size: 11px; color: #4fc3f7;">
                        <strong>Stat:</strong> ${skill.stat || 'Strength'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function selectSkill(index) {
    // Remove previous selection
    document.querySelectorAll('.skill-card').forEach(el => el.classList.remove('selected'));
    
    // Select new skill
    const skillEl = document.querySelector(`.skill-card[data-index="${index}"]`);
    if (skillEl) {
        skillEl.classList.add('selected');
        
        // Get skill data from our stored skills
        if (levelUpState.availableSkills && levelUpState.availableSkills[index]) {
            levelUpState.selectedSkill = levelUpState.availableSkills[index];
            console.log('⚡ Selected skill:', levelUpState.selectedSkill.name);
            
            // Update preview
            updatePreviewDisplay();
            updateConfirmButton();
        } else {
            console.error('Skill not found at index:', index);
        }
    }
}

// ========================================
// PREVIEW AND VALIDATION
// ========================================
function updatePreviewDisplay() {
    // Calculate HP and MP with temp stats
    const newHP = levelUpState.tempStats.constitution + levelUpState.newLevel;
    const newMP = levelUpState.tempStats.wisdom + levelUpState.tempStats.intelligence;
    
    document.getElementById('preview-hp').textContent = newHP;
    document.getElementById('preview-mp').textContent = newMP;
    
    // Update achievement preview
    const achievementPreview = document.getElementById('preview-achievement');
    if (levelUpState.selectedAchievement) {
        achievementPreview.textContent = `${getRarityEmoji(levelUpState.selectedAchievement.rarity)} ${levelUpState.selectedAchievement.name}`;
        achievementPreview.className = 'preview-value selected';
    } else {
        achievementPreview.textContent = 'None selected';
        achievementPreview.className = 'preview-value';
    }
    
    // Update skill preview (if skill level)
    if (levelUpState.isSkillLevel) {
        const skillPreview = document.getElementById('preview-skill');
        if (levelUpState.selectedSkill) {
            skillPreview.textContent = `⚡ ${levelUpState.selectedSkill.name}`;
            skillPreview.className = 'preview-value selected';
        } else {
            skillPreview.textContent = 'None selected';
            skillPreview.className = 'preview-value';
        }
    }
}

function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirm-level-up');
    
    // Check if all required selections are made
    const hasAchievement = levelUpState.selectedAchievement !== null;
    const hasSkill = !levelUpState.isSkillLevel || levelUpState.selectedSkill !== null;
    const allPointsSpent = levelUpState.attributePoints === 0;
    
    const canConfirm = hasAchievement && hasSkill && allPointsSpent;
    
    confirmBtn.disabled = !canConfirm;
    
    // Update button text to show what's missing
    if (!allPointsSpent) {
        confirmBtn.textContent = `Spend ${levelUpState.attributePoints} more points`;
    } else if (!hasAchievement) {
        confirmBtn.textContent = 'Choose an achievement';
    } else if (!hasSkill) {
        confirmBtn.textContent = 'Choose a skill';
    } else {
        confirmBtn.textContent = 'Confirm Level Up';
    }
}

// ========================================
// INITIALIZATION
// ========================================
function initializeLevelUpInteractions(modal) {
    // Add click handler to close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cancelLevelUp();
            }
        });
    } else {
        // Fallback to querySelector if modal not passed
        const modalElement = document.querySelector('.modal-overlay');
        if (modalElement) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    cancelLevelUp();
                }
            });
        } else {
            console.error('Modal not found for event initialization');
        }
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
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

// ========================================
// LEVEL UP COMPLETION
// ========================================
function confirmLevelUp() {
    console.log('🎯 Confirming level up...');
    
    // Apply changes to character
    character.level = levelUpState.newLevel;
    character.stats = { ...levelUpState.tempStats };
    
    // Add achievement
    if (!character.achievements) character.achievements = [];
    character.achievements.push({
        ...levelUpState.selectedAchievement,
        earnedAt: levelUpState.newLevel,
        earnedDate: new Date().toISOString()
    });
    
    // Apply achievement effects
    if (window.applyAchievementEffects) {
        applyAchievementEffects(character, levelUpState.selectedAchievement);
    }
    
    // Add skill if selected
    if (levelUpState.selectedSkill) {
        if (!character.customSkills) character.customSkills = [];
        character.customSkills.push({
            name: levelUpState.selectedSkill.name,
            stat: levelUpState.selectedSkill.stat,
            source: 'levelup'
        });
    }
    
    // Update displays
    updateHealthMagicDisplay();
    renderStats();
    renderCharacterSkills();
    updateCharacterDisplay();
    updateDiceSystemInfo();
    
    // Save character
    if (window.saveCurrentCharacterToStorage) {
        saveCurrentCharacterToStorage();
    }
    
    // Show success notification
    const skillMsg = levelUpState.selectedSkill ? ` | New Skill: ${levelUpState.selectedSkill.name}` : '';
    const achievementMsg = ` | Achievement: ${levelUpState.selectedAchievement.name}`;
    
    showNotification('level', 
        `Level ${levelUpState.newLevel}! ${character.characterName || 'Character'} is stronger!`,
        `HP: ${character.healthPoints} | MP: ${character.magicPoints}${skillMsg}${achievementMsg}`
    );
    
    // Close modal
    closeLevelUpModal();
}

function cancelLevelUp() {
    console.log('❌ Level up cancelled');
    closeLevelUpModal();
}

function closeLevelUpModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    
    // Clear state
    levelUpState = {
        newLevel: 0,
        attributePoints: 3,
        originalStats: {},
        tempStats: {},
        selectedAchievement: null,
        selectedSkill: null,
        isSkillLevel: false,
        availableAchievements: [],
        availableSkills: []
    };
}

// ========================================
// GLOBAL EXPORTS
// ========================================
window.showLevelUpModal = showLevelUpModal;
window.adjustAttribute = adjustAttribute;
window.selectAchievement = selectAchievement;
window.selectSkill = selectSkill;
window.confirmLevelUp = confirmLevelUp;
window.cancelLevelUp = cancelLevelUp;

console.log('🆙 Level System loaded successfully!');
