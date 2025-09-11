// ========================================
// NPC GENERATOR
// Generate and manage NPCs and encounters
// ========================================

// ========================================
// NPC DATA DEFINITIONS
// ========================================
const npcRaces = {
    human: { name: 'Human', icon: '👤', statBonus: { charisma: 1 } },
    elf: { name: 'Elf', icon: '🧝', statBonus: { dexterity: 1 } },
    dwarf: { name: 'Dwarf', icon: '⛏️', statBonus: { constitution: 1 } },
    orc: { name: 'Orc', icon: '💪', statBonus: { strength: 1 } },
    halfling: { name: 'Halfling', icon: '🍄', statBonus: { dexterity: 1 } },
    dragonborn: { name: 'Dragonborn', icon: '🐲', statBonus: { strength: 1 } },
    tiefling: { name: 'Tiefling', icon: '😈', statBonus: { charisma: 1 } },
    gnome: { name: 'Gnome', icon: '🧙', statBonus: { intelligence: 1 } },
    goblin: { name: 'Goblin', icon: '👺', statBonus: { dexterity: 1 } },
    ghoul: { name: 'Ghoul', icon: '☠️', statBonus: { constitution: 1 } },
    cyborg: { name: 'Cyborg', icon: '🤖', statBonus: { intelligence: 1 } },
    mutant: { name: 'Mutant', icon: '☢️', statBonus: { constitution: 1 } }
};

const npcBackgrounds = {
    merchant: { name: 'Merchant', skills: ['Persuasion', 'Appraisal'] },
    guard: { name: 'Guard', skills: ['Intimidation', 'Combat Training'] },
    scholar: { name: 'Scholar', skills: ['Research', 'Ancient Lore'] },
    farmer: { name: 'Farmer', skills: ['Animal Handling', 'Survival'] },
    thief: { name: 'Thief', skills: ['Stealth', 'Lockpicking'] },
    noble: { name: 'Noble', skills: ['Persuasion', 'Etiquette'] },
    sailor: { name: 'Sailor', skills: ['Navigation', 'Weather Sense'] },
    craftsman: { name: 'Craftsman', skills: ['Crafting', 'Tool Mastery'] },
    entertainer: { name: 'Entertainer', skills: ['Performance', 'Storytelling'] },
    hermit: { name: 'Hermit', skills: ['Survival', 'Herb Lore'] },
    soldier: { name: 'Soldier', skills: ['Combat Tactics', 'Leadership'] },
    priest: { name: 'Priest', skills: ['Divine Knowledge', 'Healing'] },
    spy: { name: 'Spy', skills: ['Deception', 'Information Gathering'] },
    wasteland_scavenger: { name: 'Wasteland Scavenger', skills: ['Salvaging', 'Radiation Resistance'] }
};

const npcClasses = {
    warrior: { name: 'Warrior', skills: ['Weapon Mastery', 'Shield Bash'] },
    rogue: { name: 'Rogue', skills: ['Sneak Attack', 'Poison Knowledge'] },
    mage: { name: 'Mage', skills: ['Spellcasting', 'Mana Manipulation'] },
    ranger: { name: 'Ranger', skills: ['Tracking', 'Archery'] },
    cleric: { name: 'Cleric', skills: ['Divine Healing', 'Turn Undead'] },
    barbarian: { name: 'Barbarian', skills: ['Rage', 'Intimidating Roar'] },
    bard: { name: 'Bard', skills: ['Bardic Inspiration', 'Charm'] },
    paladin: { name: 'Paladin', skills: ['Divine Smite', 'Aura of Protection'] },
    sorcerer: { name: 'Sorcerer', skills: ['Raw Magic', 'Metamagic'] },
    monk: { name: 'Monk', skills: ['Martial Arts', 'Ki Focus'] },
    gunslinger: { name: 'Gunslinger', skills: ['Quick Draw', 'Trick Shot'] },
    hacker: { name: 'Hacker', skills: ['System Breach', 'Data Mining'] },
    medic: { name: 'Medic', skills: ['Field Surgery', 'Pharmaceutical Knowledge'] },
    engineer: { name: 'Engineer', skills: ['Repair', 'Invention'] }
};

const npcWeapons = [
    { name: 'Rusty Sword', type: 'sword', damage: 'd6', properties: ['Melee'] },
    { name: 'Wooden Club', type: 'club', damage: 'd4', properties: ['Melee', 'Simple'] },
    { name: 'Hunting Knife', type: 'dagger', damage: 'd4', properties: ['Melee', 'Light'] },
    { name: 'Crossbow', type: 'crossbow', damage: 'd6', properties: ['Ranged'] },
    { name: 'Staff', type: 'staff', damage: 'd4', properties: ['Melee', 'Magic Focus'] },
    { name: 'War Hammer', type: 'hammer', damage: 'd8', properties: ['Melee', 'Heavy'] },
    { name: 'Short Bow', type: 'bow', damage: 'd6', properties: ['Ranged'] },
    { name: 'Spear', type: 'spear', damage: 'd6', properties: ['Melee', 'Reach'] },
    { name: 'Pistol', type: 'firearm', damage: 'd6', properties: ['Ranged', 'Loud'] },
    { name: 'Energy Blade', type: 'energy', damage: 'd8', properties: ['Melee', 'Tech'] }
];

const npcItems = [
    'Health Potion', 'Rope (50ft)', 'Rations (3 days)', 'Gold Coins (2d6)',
    'Lockpicks', 'Healing Herbs', 'Map Fragment', 'Strange Crystal',
    'Old Key', 'Mysterious Letter', 'Silver Pendant', 'Worn Book',
    'Trade Goods', 'Tools of Trade', 'Lucky Charm', 'Family Heirloom',
    'Radiation Detector', 'Scrap Metal', 'Water Purifier', 'Old Photo'
];

const firstNames = [
    // Fantasy
    'Aiden', 'Sera', 'Gareth', 'Luna', 'Thane', 'Zara', 'Kael', 'Mira',
    'Dorian', 'Lyra', 'Magnus', 'Nyx', 'Orion', 'Vera', 'Cassius', 'Iris',
    // Modern/Sci-fi
    'Marcus', 'Nova', 'Raven', 'Zeke', 'Echo', 'Sage', 'Phoenix', 'Storm',
    'Cipher', 'Vex', 'Axel', 'Neo', 'Jet', 'Skye', 'Rex', 'Zara',
    // Post-apocalyptic
    'Rust', 'Ash', 'Scrap', 'Dust', 'Wire', 'Smoke', 'Steel', 'Ember',
    'Scar', 'Fade', 'Grit', 'Spike', 'Volt', 'Grave', 'Shard', 'Blaze'
];

const lastNames = [
    // Fantasy
    'Stormwind', 'Nightfall', 'Ironforge', 'Goldleaf', 'Starweaver', 'Shadowbane',
    'Moonwhisper', 'Dragonheart', 'Thornfield', 'Brightblade', 'Darkwood', 'Frostborn',
    // Modern
    'Steel', 'Cross', 'Hunter', 'Stone', 'Black', 'Grey', 'White', 'Fox',
    'Wolf', 'Hawk', 'Storm', 'Knight', 'King', 'Sharp', 'Quick', 'Brave',
    // Post-apocalyptic
    'Wasteland', 'Ruins', 'Scavenger', 'Survivor', 'Raider', 'Drifter',
    'Outcast', 'Nomad', 'Refugee', 'Pioneer', 'Settler', 'Wanderer'
];

// ========================================
// CURRENT GENERATED NPC
// ========================================
let currentNPC = null;

// ========================================
// NPC GENERATION
// ========================================
function generateRandomNPC() {
    const npcType = document.getElementById('npc-type-select').value;
    const level = rollDice(10); // Random level 1-10 for basic NPCs
    
    // Generate basic info
    const race = getRandomElement(Object.keys(npcRaces));
    const background = getRandomElement(Object.keys(npcBackgrounds));
    const characterClass = getRandomElement(Object.keys(npcClasses));
    const name = generateNPCName();
    
    // Generate stats (2-5 range for NPCs, simpler than player characters)
    const baseStats = {
        strength: rollDice(4) + level,      // 2-5
        dexterity: rollDice(4) + level,     // 2-5
        constitution: rollDice(4) + level,   // 2-5
        intelligence: rollDice(4) + level,   // 2-5
        wisdom: rollDice(4) + level,        // 2-5
        charisma: rollDice(4) + level       // 2-5
    };
    
    // Apply racial bonus
    const raceData = npcRaces[race];
    if (raceData.statBonus) {
        Object.entries(raceData.statBonus).forEach(([stat, bonus]) => {
            baseStats[stat] += bonus;
        });
    }
    
    // Calculate derived stats
    const healthPoints = baseStats.constitution + level;
    const magicPoints = baseStats.wisdom + baseStats.intelligence;
    
    // Generate skills (2 special skills from background and class)
    const skills = [];
    const backgroundSkills = npcBackgrounds[background].skills;
    const classSkills = npcClasses[characterClass].skills;
    
    skills.push({
        name: getRandomElement(backgroundSkills),
        source: 'background',
        stat: getSkillStat(backgroundSkills[0])
    });
    
    skills.push({
        name: getRandomElement(classSkills),
        source: 'class',
        stat: getSkillStat(classSkills[0])
    });
    
    // Generate equipment
    const weapon = getRandomElement(npcWeapons);
    const item = getRandomElement(npcItems);
    
    // Create NPC object
    currentNPC = {
        id: generateId(),
        type: npcType,
        name: name,
        level: level,
        race: race,
        background: background,
        class: characterClass,
        stats: baseStats,
        healthPoints: healthPoints,
        currentHealthPoints: healthPoints,
        magicPoints: magicPoints,
        currentMagicPoints: magicPoints,
        skills: skills,
        weapon: weapon,
        item: item,
        created: new Date().toISOString()
    };
    
    // Display the generated NPC
    displayNPC(currentNPC);
    
    // Show action buttons
    document.getElementById('npc-actions').style.display = 'flex';
}

function generateNPCName() {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    return `${firstName} ${lastName}`;
}

function getSkillStat(skillName) {
    // Simple mapping of skills to stats
    const skillStatMap = {
        'Persuasion': 'charisma',
        'Intimidation': 'charisma',
        'Stealth': 'dexterity',
        'Athletics': 'strength',
        'Arcana': 'intelligence',
        'Medicine': 'wisdom',
        'Perception': 'wisdom',
        'Investigation': 'intelligence'
    };
    
    return skillStatMap[skillName] || 'wisdom'; // Default to wisdom
}

// ========================================
// NPC DISPLAY
// ========================================
function displayNPC(npc) {
    const display = document.getElementById('generated-npc');
    const raceData = npcRaces[npc.race];
    const backgroundData = npcBackgrounds[npc.background];
    const classData = npcClasses[npc.class];
    
    const typeIcon = npc.type === 'encounter' ? '⚔️' : '🤝';
    const portraitIcon = npc.type === 'encounter' ? '💀' : raceData.icon;
    
    display.innerHTML = `
        <div class="npc-card">
            <div class="npc-portrait ${npc.type}">
                ${portraitIcon}
            </div>
            
            <div class="npc-info">
                <div class="npc-header">
                    <div class="npc-name">${npc.name}</div>
                    <div class="npc-type-badge ${npc.type}">
                        ${typeIcon} ${npc.type === 'encounter' ? 'Encounter' : 'NPC'}
                    </div>
                </div>
                
                <div class="npc-details">
                    <div class="npc-detail-group">
                        <div class="detail-label">Heritage</div>
                        <div class="detail-value">${raceData.name}</div>
                        <div class="detail-sub">${raceData.icon} ${Object.keys(raceData.statBonus)[0] || 'None'} bonus</div>
                    </div>
                    
                    <div class="npc-detail-group">
                        <div class="detail-label">Background</div>
                        <div class="detail-value">${backgroundData.name}</div>
                        <div class="detail-sub">Level ${npc.level}</div>
                    </div>
                    
                    <div class="npc-detail-group">
                        <div class="detail-label">Class</div>
                        <div class="detail-value">${classData.name}</div>
                        <div class="detail-sub">Combat focused</div>
                    </div>
                </div>
                
                <div class="npc-stats">
                    <div class="stats-grid">
                        ${Object.entries(npc.stats).map(([stat, value]) => `
                            <div class="stat-item">
                                <div class="stat-name">${stat.substring(0, 3).toUpperCase()}</div>
                                <div class="stat-value">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="vitals-row">
                        <div class="vital-stat hp-stat">
                            <div class="vital-label">Health</div>
                            <div class="vital-value">${npc.currentHealthPoints}/${npc.healthPoints}</div>
                        </div>
                        <div class="vital-stat mp-stat">
                            <div class="vital-label">Magic</div>
                            <div class="vital-value">${npc.currentMagicPoints}/${npc.magicPoints}</div>
                        </div>
                    </div>
                </div>
                
                <div class="npc-abilities">
                    <div class="abilities-title">
                        <i class="ra ra-gear"></i>
                        Special Abilities
                    </div>
                    <div class="abilities-list">
                        ${npc.skills.map(skill => `
                            <div class="ability-item">
                                <span class="ability-name">${skill.name}</span>
                                <span class="ability-stat">[${skill.stat.substring(0, 3).toUpperCase()}] from ${skill.source}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="npc-equipment">
                <div class="equipment-item">
                    <div class="equipment-name">${npc.weapon.name}</div>
                    <div class="equipment-stats">${npc.weapon.damage} damage | ${npc.weapon.properties.join(', ')}</div>
                </div>
                
                <div class="equipment-item">
                    <div class="equipment-name">${npc.item}</div>
                    <div class="equipment-stats">Special item</div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// MANUAL EDITING
// ========================================
function showManualControls() {
    if (!currentNPC) return;
    
    const controls = document.getElementById('manual-controls');
    
    // Populate form fields
    document.getElementById('manual-name').value = currentNPC.name;
    document.getElementById('manual-level').value = currentNPC.level;
    
    // Populate select options
    populateSelect('manual-heritage', npcRaces, currentNPC.race);
    populateSelect('manual-background', npcBackgrounds, currentNPC.background);
    populateSelect('manual-class', npcClasses, currentNPC.class);
    
    controls.style.display = 'block';
}

function hideManualControls() {
    document.getElementById('manual-controls').style.display = 'none';
}

function populateSelect(selectId, dataObject, selectedValue) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    
    Object.entries(dataObject).forEach(([key, data]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = data.name;
        if (key === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function applyManualChanges() {
    if (!currentNPC) return;
    
    // Get form values
    const name = document.getElementById('manual-name').value.trim();
    const level = parseInt(document.getElementById('manual-level').value);
    const heritage = document.getElementById('manual-heritage').value;
    const background = document.getElementById('manual-background').value;
    const characterClass = document.getElementById('manual-class').value;
    
    // Update NPC
    currentNPC.name = name || currentNPC.name;
    currentNPC.level = level || currentNPC.level;
    currentNPC.race = heritage;
    currentNPC.background = background;
    currentNPC.class = characterClass;
    
    // Recalculate derived stats if level changed
    currentNPC.healthPoints = currentNPC.stats.constitution + currentNPC.level;
    currentNPC.currentHealthPoints = Math.min(currentNPC.currentHealthPoints, currentNPC.healthPoints);
    
    // Re-display the NPC
    displayNPC(currentNPC);
    hideManualControls();
    
    showNotification('success', 'NPC Updated', 
        `Updated ${currentNPC.name}`, 
        'Manual changes applied successfully');
}

// ========================================
// NPC ACTIONS
// ========================================
function saveCurrentNPC() {
    if (!currentNPC) return;
    
    // Add to current session
    currentSession.npcs.push({ ...currentNPC });
    
    // Refresh the saved NPCs display
    refreshSavedNPCs();
    
    showNotification('success', 'NPC Saved', 
        `Saved ${currentNPC.name}`, 
        `Added to ${currentSession.name}`);
}

function copyNPCToClipboard() {
    if (!currentNPC) return;
    
    const npcText = formatNPCForText(currentNPC);
    
    copyToClipboard(npcText).then(() => {
        showNotification('success', 'NPC Copied', 
            'NPC details copied to clipboard', 
            'Ready to paste into your notes');
    }).catch(error => {
        console.error('Copy failed:', error);
        showNotification('error', 'Copy Failed', 
            'Could not copy to clipboard', 
            'Try manually selecting the text');
    });
}

function formatNPCForText(npc) {
    const raceData = npcRaces[npc.race];
    const backgroundData = npcBackgrounds[npc.background];
    const classData = npcClasses[npc.class];
    
    return `${npc.name} (Level ${npc.level} ${npc.type})
Heritage: ${raceData.name}
Background: ${backgroundData.name}
Class: ${classData.name}

Stats: STR ${npc.stats.strength}, DEX ${npc.stats.dexterity}, CON ${npc.stats.constitution}, INT ${npc.stats.intelligence}, WIS ${npc.stats.wisdom}, CHA ${npc.stats.charisma}
Health: ${npc.currentHealthPoints}/${npc.healthPoints}
Magic: ${npc.currentMagicPoints}/${npc.magicPoints}

Special Abilities:
${npc.skills.map(skill => `- ${skill.name} [${skill.stat.toUpperCase()}]`).join('\n')}

Equipment:
- ${npc.weapon.name} (${npc.weapon.damage} damage, ${npc.weapon.properties.join(', ')})
- ${npc.item}`;
}

// ========================================
// SAVED NPCS MANAGEMENT
// ========================================
function refreshSavedNPCs() {
    const grid = document.getElementById('saved-npcs-grid');
    if (!grid) return;
    
    const filterElement = document.getElementById('npc-filter');
    const filter = filterElement ? filterElement.value : 'all';
    
    // Filter NPCs based on selected filter
    let npcsToShow = currentSession.npcs;
    if (filter !== 'all') {
        npcsToShow = currentSession.npcs.filter(npc => npc.type === filter);
    }
    
    if (npcsToShow.length === 0) {
        grid.innerHTML = `
            <div class="no-npcs">
                <i class="ra ra-player" style="font-size: 3em; margin-bottom: 15px; color: #6b7280;"></i>
                <p>No ${filter === 'all' ? '' : filter + ' '}NPCs found. Generate and save some NPCs to build your cast!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = npcsToShow.map(npc => createSavedNPCCard(npc)).join('');
}

function createSavedNPCCard(npc) {
    const raceData = npcRaces[npc.race];
    const backgroundData = npcBackgrounds[npc.background];
    const classData = npcClasses[npc.class];
    
    return `
        <div class="saved-npc-card ${npc.type}" onclick="loadSavedNPC('${npc.id}')">
            <div class="saved-npc-header">
                <div class="saved-npc-name">${npc.name}</div>
                <div class="saved-npc-level">Lv.${npc.level}</div>
            </div>
            
            <div class="saved-npc-details">
                ${raceData.icon} ${raceData.name} ${backgroundData.name}<br>
                ${classData.name} | HP: ${npc.currentHealthPoints}/${npc.healthPoints}
            </div>
            
            <div class="saved-npc-actions">
                <button class="saved-action-btn" onclick="event.stopPropagation(); copySavedNPC('${npc.id}')" title="Copy">
                    📋
                </button>
                <button class="saved-action-btn delete-saved-btn" onclick="event.stopPropagation(); deleteSavedNPC('${npc.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function loadSavedNPC(npcId) {
    const npc = currentSession.npcs.find(n => n.id === npcId);
    if (npc) {
        currentNPC = { ...npc }; // Create a copy
        document.getElementById('npc-type-select').value = npc.type;
        displayNPC(currentNPC);
        document.getElementById('npc-actions').style.display = 'flex';
        
        showNotification('info', 'NPC Loaded', 
            `Loaded ${npc.name}`, 
            'You can now edit or regenerate from this NPC');
    }
}

function copySavedNPC(npcId) {
    const npc = currentSession.npcs.find(n => n.id === npcId);
    if (npc) {
        const npcText = formatNPCForText(npc);
        copyToClipboard(npcText).then(() => {
            showNotification('success', 'NPC Copied', 
                `${npc.name} copied to clipboard`, 
                'Ready to paste into your notes');
        });
    }
}

function deleteSavedNPC(npcId) {
    const npc = currentSession.npcs.find(n => n.id === npcId);
    if (npc && confirm(`Delete ${npc.name}?\n\nThis action cannot be undone.`)) {
        currentSession.npcs = currentSession.npcs.filter(n => n.id !== npcId);
        refreshSavedNPCs();
        
        showNotification('success', 'NPC Deleted', 
            `Deleted ${npc.name}`, 
            'NPC removed from session');
    }
}

function clearAllNPCs() {
    if (currentSession.npcs.length === 0) return;
    
    if (confirm(`Clear all NPCs from ${currentSession.name}?\n\nThis will remove ${currentSession.npcs.length} NPCs and cannot be undone.`)) {
        currentSession.npcs = [];
        refreshSavedNPCs();
        
        showNotification('success', 'NPCs Cleared', 
            'All NPCs removed', 
            'Session cleared successfully');
    }
}

// ========================================
// EVENT LISTENERS & INITIALIZATION
// ========================================
function initializeNPCGenerator() {
    // Filter change listener
    const npcFilter = document.getElementById('npc-filter');
    if (npcFilter) {
        npcFilter.addEventListener('change', refreshSavedNPCs);
    }
    
    // Initialize display
    refreshSavedNPCs();
}

function refreshNPCDisplay() {
    refreshSavedNPCs();
}

// ========================================
// GLOBAL EXPORTS
// ========================================
window.generateRandomNPC = generateRandomNPC;
window.showManualControls = showManualControls;
window.hideManualControls = hideManualControls;
window.applyManualChanges = applyManualChanges;
window.saveCurrentNPC = saveCurrentNPC;
window.copyNPCToClipboard = copyNPCToClipboard;
window.loadSavedNPC = loadSavedNPC;
window.copySavedNPC = copySavedNPC;
window.deleteSavedNPC = deleteSavedNPC;
window.clearAllNPCs = clearAllNPCs;
window.refreshNPCDisplay = refreshNPCDisplay;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeNPCGenerator, 100);
});