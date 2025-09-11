// ========================================
// SKILLS MANAGEMENT SYSTEM
// ========================================
// This file handles all skill-related functionality for the DCC character sheet

// ========================================
// SKILLS DATA AND STATE
// ========================================
let skillsData = null;
let allSkills = {};

// ========================================
// SKILL LOADING AND INITIALIZATION
// ========================================
async function loadSkills() {
    try {
        const response = await fetch('data/skills.json');
        skillsData = await response.json();
        
        // Flatten skills into a single object for compatibility
        Object.values(skillsData.skills).forEach(category => {
            Object.assign(allSkills, category.skills);
        });
        
        console.log('📚 Skills loaded successfully!');
        console.log(`📊 Total skills available: ${Object.keys(allSkills).length}`);
        return true;
    } catch (error) {
        console.error('Failed to load skills:', error);
        // Fallback to embedded skills
        allSkills = getEmbeddedSkills();
        return false;
    }
}

// ========================================
// SKILL LEVEL SYSTEM
// ========================================
const skillLevelSystem = {
    maxLevel: 20,
    primalMaxLevel: 25,
    
    getRequiredExperience: function(level) {
        return level * 100; // Simple progression
    },
    
    getSkillModifier: function(character, skillName) {
        const skillLevel = this.getSkillLevel(character, skillName);
        const isProficient = this.isProficient(character, skillName);
        const attributeModifier = this.getAttributeModifier(character, skillName);
        
        let totalModifier = attributeModifier + skillLevel;
        
        if (isProficient) {
            totalModifier += character.level;
        }
        
        return totalModifier;
    },
    
    getSkillLevel: function(character, skillName) {
        if (!character.skillLevels || !character.skillLevels[skillName]) return 1;
        return character.skillLevels[skillName].level || 1;
    },
    
    isProficient: function(character, skillName) {
        if (!character.proficientSkills) return false;
        return character.proficientSkills.includes(skillName);
    },
    
    getAttributeModifier: function(character, skillName) {
        const skill = allSkills[skillName];
        if (!skill) return 0;
        
        const attributeValue = character.stats[skill.stat] || 10;
        return Math.floor((attributeValue - 10) / 2);
    },
    
    trainSkill: function(character, skillName, experienceGained) {
        if (!character.skillLevels) {
            character.skillLevels = {};
        }
        
        if (!character.skillLevels[skillName]) {
            character.skillLevels[skillName] = { level: 1, experience: 0 };
        }
        
        const skill = character.skillLevels[skillName];
        skill.experience += experienceGained;
        
        const requiredExp = this.getRequiredExperience(skill.level);
        if (skill.experience >= requiredExp) {
            const maxLevel = this.getMaxSkillLevel(character, skillName);
            if (skill.level < maxLevel) {
                skill.level++;
                skill.experience -= requiredExp;
                return true; // Level up occurred
            }
        }
        
        return false;
    },
    
    getMaxSkillLevel: function(character, skillName) {
        let maxLevel = this.maxLevel;
        
        // Primal race gets +5 to all skills
        if (character.race === 'primal') {
            maxLevel = this.primalMaxLevel;
        }
        
        return maxLevel;
    }
};

// ========================================
// SKILL SELECTION FUNCTIONS
// ========================================
function showSkillSelectionModal(character) {
    const modal = document.createElement('div');
    modal.className = 'modal level-up-modal-overlay';
    modal.style.display = 'block';
    
    const skillCategories = skillsData ? skillsData.skills : getSkillCategoriesFromEmbedded();
    
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content" style="max-width: 1000px;">
            <div class="modal-header level-up-header">
                <h3><i class="ra ra-gear"></i> Choose Starting Skills</h3>
                <div class="level-display">Select 5 skills, mark 3 as proficient</div>
            </div>
            <div class="modal-body">
                <div class="skill-selection-info">
                    <p><strong>Instructions:</strong></p>
                    <ul>
                        <li>Choose <strong>5 skills</strong> to start at level 1</li>
                        <li>Of those 5, choose <strong>3 to be proficient</strong> in (gain +level bonus)</li>
                        <li>Skill modifier = Attribute modifier + Skill level + (Proficiency bonus if applicable)</li>
                    </ul>
                </div>
                
                <div class="selected-skills-display">
                    <h4>Selected Skills: <span id="selected-count">0</span>/5</h4>
                    <h4>Proficient Skills: <span id="proficient-count">0</span>/3</h4>
                </div>
                
                <div class="skill-categories">
                    ${Object.entries(skillCategories).map(([categoryKey, category]) => `
                        <div class="skill-category">
                            <h4 class="category-header">${category.category}</h4>
                            <div class="skills-grid">
                                ${Object.entries(category.skills).map(([skillKey, skill]) => `
                                    <div class="skill-selection-item">
                                        <label class="skill-checkbox">
                                            <input type="checkbox" 
                                                   data-skill="${skill.name}" 
                                                   data-stat="${skill.stat}"
                                                   onchange="updateSkillSelection()">
                                            <span class="skill-name">${skill.name}</span>
                                        </label>
                                        <div class="skill-info">
                                            <span class="skill-stat">${skill.stat.charAt(0).toUpperCase() + skill.stat.slice(1)}</span>
                                            <span class="skill-description">${skill.description}</span>
                                        </div>
                                        <label class="proficiency-checkbox" style="display: none;">
                                            <input type="checkbox" 
                                                   data-proficient="${skill.name}"
                                                   onchange="updateProficiencySelection()">
                                            <span>Proficient</span>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="confirmSkillSelection()" id="confirm-skills-btn" disabled>
                    <i class="ra ra-check"></i> Confirm Selection
                </button>
                <button class="btn-secondary" onclick="closeSkillModal()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function updateSkillSelection() {
    const checkboxes = document.querySelectorAll('input[data-skill]:checked');
    const proficiencyCheckboxes = document.querySelectorAll('.proficiency-checkbox');
    
    // Show/hide proficiency checkboxes based on skill selection
    proficiencyCheckboxes.forEach(checkbox => {
        const skillName = checkbox.querySelector('input').dataset.proficient;
        const isSkillSelected = Array.from(checkboxes).some(cb => cb.dataset.skill === skillName);
        checkbox.style.display = isSkillSelected ? 'block' : 'none';
        
        if (!isSkillSelected) {
            checkbox.querySelector('input').checked = false;
        }
    });
    
    // Update counters
    document.getElementById('selected-count').textContent = checkboxes.length;
    
    // Enable/disable skills if at limit
    const allSkillCheckboxes = document.querySelectorAll('input[data-skill]');
    allSkillCheckboxes.forEach(checkbox => {
        if (!checkbox.checked && checkboxes.length >= 5) {
            checkbox.disabled = true;
        } else {
            checkbox.disabled = false;
        }
    });
    
    updateProficiencySelection();
}

function updateProficiencySelection() {
    const proficientCheckboxes = document.querySelectorAll('input[data-proficient]:checked');
    
    document.getElementById('proficient-count').textContent = proficientCheckboxes.length;
    
    // Enable/disable proficiency if at limit
    const allProficiencyCheckboxes = document.querySelectorAll('input[data-proficient]');
    allProficiencyCheckboxes.forEach(checkbox => {
        if (!checkbox.checked && proficientCheckboxes.length >= 3) {
            checkbox.disabled = true;
        } else {
            checkbox.disabled = false;
        }
    });
    
    // Enable confirm button only if we have exactly 5 skills and 3 proficiencies
    const selectedSkills = document.querySelectorAll('input[data-skill]:checked').length;
    const selectedProficiencies = proficientCheckboxes.length;
    
    document.getElementById('confirm-skills-btn').disabled = 
        selectedSkills !== 5 || selectedProficiencies !== 3;
}

function confirmSkillSelection() {
    const selectedSkills = document.querySelectorAll('input[data-skill]:checked');
    const proficientSkills = document.querySelectorAll('input[data-proficient]:checked');
    
    // Clear existing skills
    character.customSkills = [];
    character.skillLevels = {};
    character.proficientSkills = [];
    
    // Add selected skills
    selectedSkills.forEach(checkbox => {
        const skillName = checkbox.dataset.skill;
        const skillStat = checkbox.dataset.stat;
        
        character.customSkills.push({
            name: skillName,
            stat: skillStat,
            source: 'starting'
        });
        
        character.skillLevels[skillName] = { level: 1, experience: 0 };
    });
    
    // Add proficient skills
    proficientSkills.forEach(checkbox => {
        character.proficientSkills.push(checkbox.dataset.proficient);
    });
    
    closeSkillModal();
    
    // Update character display
    if (window.updateCharacterDisplay) {
        updateCharacterDisplay();
    }
    
    if (window.renderCharacterSkills) {
        renderCharacterSkills();
    }
    
    // Show notification
    if (window.showNotification) {
        showNotification('level', 'Skills Selected!', 
            `Selected ${selectedSkills.length} skills with ${proficientSkills.length} proficiencies`);
    }
}

function closeSkillModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// ========================================
// FALLBACK EMBEDDED SKILLS
// ========================================
function getEmbeddedSkills() {
    // Basic fallback skills if JSON fails to load
    return {
        'Athletics': { name: 'Athletics', stat: 'strength', description: 'Physical fitness and athletic ability', source: 'standard' },
        'Acrobatics': { name: 'Acrobatics', stat: 'dexterity', description: 'Agility and complex maneuvers', source: 'standard' },
        'Stealth': { name: 'Stealth', stat: 'dexterity', description: 'Moving silently and hiding', source: 'standard' },
        'Perception': { name: 'Perception', stat: 'wisdom', description: 'Noticing hidden details', source: 'standard' },
        'Investigation': { name: 'Investigation', stat: 'intelligence', description: 'Logical deduction and searching', source: 'standard' },
        'Persuasion': { name: 'Persuasion', stat: 'charisma', description: 'Convincing others', source: 'standard' },
        'Intimidation': { name: 'Intimidation', stat: 'charisma', description: 'Using fear to influence', source: 'standard' },
        'Medicine': { name: 'Medicine', stat: 'wisdom', description: 'Healing and medical knowledge', source: 'standard' }
    };
}

function getSkillCategoriesFromEmbedded() {
    return {
        standard: {
            category: 'Standard',
            skills: getEmbeddedSkills()
        }
    };
}

// ========================================
// INTEGRATION FUNCTIONS
// ========================================
function enhanceCharacterCreationWithSkills() {
    // Hook into character creation to add skill selection
    const originalShowCharacterCreation = window.showCharacterCreation;
    if (originalShowCharacterCreation) {
        window.showCharacterCreation = function() {
            // Show normal character creation first
            originalShowCharacterCreation();
            
            // Add skill selection button to character creation
            setTimeout(addSkillSelectionToCreation, 100);
        };
    }
}

function addSkillSelectionToCreation() {
    const creationSection = document.querySelector('#creation .content-wrapper');
    if (!creationSection || creationSection.querySelector('.skill-selection-section')) return;
    
    const skillSection = document.createElement('div');
    skillSection.className = 'skill-selection-section card';
    skillSection.innerHTML = `
        <div class="card-header">
            <i class="ra ra-gear"></i>
            <h3>Starting Skills</h3>
        </div>
        <div class="card-body">
            <p>Choose your character's starting skills (5 total, 3 proficient)</p>
            <button class="btn-primary" onclick="showSkillSelectionModal(character)">
                <i class="ra ra-gear"></i> Select Starting Skills
            </button>
            <div id="selected-skills-preview" style="margin-top: 1rem;"></div>
        </div>
    `;
    
    // Insert after basic info
    const basicInfo = creationSection.querySelector('.hero-card');
    if (basicInfo && basicInfo.nextSibling) {
        creationSection.insertBefore(skillSection, basicInfo.nextSibling);
    } else {
        creationSection.appendChild(skillSection);
    }
}

// ========================================
// INITIALIZATION
// ========================================
async function initializeSkillSystem() {
    console.log('📚 Initializing Skills System...');
    
    await loadSkills();
    enhanceCharacterCreationWithSkills();
    
    console.log('✅ Skills system initialized successfully!');
}

// Make functions globally available
window.skillSystem = {
    skillLevelSystem,
    showSkillSelectionModal,
    updateSkillSelection,
    updateProficiencySelection,
    confirmSkillSelection,
    closeSkillModal,
    allSkills,
    loadSkills,
    initializeSkillSystem
};

// Global functions for onclick handlers
window.showSkillSelectionModal = showSkillSelectionModal;
window.updateSkillSelection = updateSkillSelection;
window.updateProficiencySelection = updateProficiencySelection;
window.confirmSkillSelection = confirmSkillSelection;
window.closeSkillModal = closeSkillModal;
window.loadSkills = loadSkills;

// Auto-initialize when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSkillSystem);
} else {
    initializeSkillSystem();
}
