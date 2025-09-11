// ========================================
// QUEST GENERATOR
// Generate and manage quests and plot hooks
// ========================================

// ========================================
// QUEST DATA DEFINITIONS
// ========================================
const questTypes = {
    fetch: {
        name: 'Fetch Quest',
        description: 'Retrieve an item or person',
        templates: [
            'Retrieve the {item} from {location}',
            'Find and bring back {person} from {location}',
            'Collect {number} {items} for {questgiver}',
            'Recover the stolen {item} from {faction}'
        ]
    },
    kill: {
        name: 'Elimination',
        description: 'Defeat enemies or monsters',
        templates: [
            'Eliminate the {enemy} threatening {location}',
            'Clear out the {enemies} from {location}',
            'Hunt down {person} who has been {crime}',
            'Destroy the {threat} before it reaches {location}'
        ]
    },
    escort: {
        name: 'Escort Mission',
        description: 'Protect someone or something',
        templates: [
            'Escort {person} safely to {destination}',
            'Guard the {item} shipment to {location}',
            'Protect {person} during the {event}',
            'Ensure {person} reaches {destination} alive'
        ]
    },
    delivery: {
        name: 'Delivery',
        description: 'Transport items or messages',
        templates: [
            'Deliver this {item} to {person} in {location}',
            'Take this message to {person} in {destination}',
            'Transport {cargo} to {destination} before {deadline}',
            'Smuggle {item} past {faction} to {location}'
        ]
    },
    rescue: {
        name: 'Rescue Mission',
        description: 'Save someone from danger',
        templates: [
            'Rescue {person} from {location}',
            'Save {person} from {captors}',
            'Free the prisoners from {location}',
            'Extract {person} before {deadline}'
        ]
    },
    investigation: {
        name: 'Investigation',
        description: 'Solve mysteries or gather information',
        templates: [
            'Investigate the {mystery} at {location}',
            'Find out who {crime} and why',
            'Discover the truth about {person}',
            'Uncover the secrets of {location}'
        ]
    },
    diplomatic: {
        name: 'Diplomatic Mission',
        description: 'Negotiate or mediate conflicts',
        templates: [
            'Negotiate peace between {faction1} and {faction2}',
            'Convince {person} to {action}',
            'Mediate the dispute over {resource}',
            'Secure an alliance with {faction}'
        ]
    },
    exploration: {
        name: 'Exploration',
        description: 'Discover new places or secrets',
        templates: [
            'Explore the mysterious {location}',
            'Map the uncharted {region}',
            'Find the lost {location}',
            'Discover what happened to {settlement}'
        ]
    }
};

const questItems = [
    'ancient artifact', 'mysterious crystal', 'stolen documents', 'rare herb',
    'lost heirloom', 'weapon prototype', 'data chip', 'medicine',
    'treasure map', 'sacred relic', 'tech component', 'poison antidote',
    'encryption key', 'power core', 'memory drive', 'research notes',
    'family portrait', 'signal device', 'energy cell', 'blueprint'
];

const questLocations = [
    'abandoned warehouse', 'underground bunker', 'ruined city', 'desert outpost',
    'mountain fortress', 'forest settlement', 'space station', 'hidden laboratory',
    'ancient temple', 'trading post', 'refugee camp', 'military base',
    'crashed ship', 'underground tunnel', 'rooftop garden', 'corporate tower',
    'scavenger town', 'research facility', 'cult compound', 'nomad caravan'
];

const questEnemies = [
    'raider gang', 'mutant beast', 'rogue AI', 'corporate assassin',
    'cult fanatics', 'mercenary squad', 'alien creature', 'undead horde',
    'robot sentries', 'rival scavenger', 'corrupt official', 'mad scientist',
    'bandit leader', 'monster alpha', 'war machine', 'psychic entity',
    'plague carrier', 'cyber-enhanced soldier', 'cultist priest', 'crime boss'
];

const questPersons = [
    'village elder', 'missing scientist', 'kidnapped child', 'rebel leader',
    'corrupt merchant', 'wanted criminal', 'lost explorer', 'injured soldier',
    'desperate mother', 'wise hermit', 'traitor spy', 'fallen hero',
    'mysterious stranger', 'tribal chief', 'tech specialist', 'medical doctor',
    'information broker', 'weapon dealer', 'survivor leader', 'courier'
];

const questFactions = [
    'The Crimson Raiders', 'Tech Salvation', 'Wasteland Republic', 'Iron Brotherhood',
    'The Forsaken', 'New Eden Coalition', 'Scavenger Union', 'The Pure',
    'Shadow Collective', 'The Enlightened', 'Steel Wolves', 'Desert Nomads',
    'The Resistance', 'Corporate Alliance', 'Mutant Liberation', 'The Order',
    'Free Traders', 'The Remnant', 'Cyber Collective', 'The Cleaners'
];

const questRewards = [
    { type: 'gold', amount: '2d6 × 10', description: 'Gold coins' },
    { type: 'experience', amount: '50-200', description: 'Experience points' },
    { type: 'item', amount: 'rare', description: 'Rare equipment' },
    { type: 'reputation', amount: '+1', description: 'Faction standing' },
    { type: 'information', amount: 'valuable', description: 'Useful intel' },
    { type: 'contact', amount: 'new ally', description: 'Helpful contact' },
    { type: 'weapon', amount: 'magic/tech', description: 'Enhanced weapon' },
    { type: 'shelter', amount: 'safe house', description: 'Secure location' }
];

const questComplications = [
    'Time pressure - must complete within 24 hours',
    'Rival group also seeking the same objective',
    'Target location is heavily guarded',
    'Quest giver has hidden motives',
    'Weather/environmental hazards',
    'Required to be stealthy - no violence',
    'Multiple factions involved with conflicting interests',
    'Target is not what it seems',
    'Innocent bystanders at risk',
    'Equipment restrictions apply',
    'Information is incomplete or false',
    'Must work with an untrustworthy ally'
];

// ========================================
// CURRENT GENERATED QUEST
// ========================================
let currentQuest = null;

// ========================================
// QUEST GENERATION
// ========================================
function generateRandomQuest() {
    // Choose random quest type
    const questTypeKey = getRandomElement(Object.keys(questTypes));
    const questType = questTypes[questTypeKey];
    
    // Choose random template
    const template = getRandomElement(questType.templates);
    
    // Generate quest details
    const questDetails = {
        id: generateId(),
        type: questTypeKey,
        typeName: questType.name,
        template: template,
        title: '',
        description: '',
        questGiver: getRandomElement(questPersons),
        location: getRandomElement(questLocations),
        reward: getRandomElement(questRewards),
        difficulty: rollDice(5), // 1-5 difficulty
        estimatedTime: `${rollDice(6)} hours`,
        complication: rollDice(6) <= 2 ? getRandomElement(questComplications) : null,
        created: new Date().toISOString()
    };
    
    // Fill in template variables
    questDetails.description = fillQuestTemplate(template);
    questDetails.title = generateQuestTitle(questDetails);
    
    currentQuest = questDetails;
    displayQuest(currentQuest);
    
    // Show action buttons
    document.getElementById('quest-actions').style.display = 'flex';
}

function fillQuestTemplate(template) {
    let filled = template;
    
    // Replace template variables
    const replacements = {
        '{item}': getRandomElement(questItems),
        '{items}': getRandomElement(questItems) + 's',
        '{location}': getRandomElement(questLocations),
        '{destination}': getRandomElement(questLocations),
        '{person}': getRandomElement(questPersons),
        '{questgiver}': getRandomElement(questPersons),
        '{enemy}': getRandomElement(questEnemies),
        '{enemies}': getRandomElement(questEnemies),
        '{faction}': getRandomElement(questFactions),
        '{faction1}': getRandomElement(questFactions),
        '{faction2}': getRandomElement(questFactions),
        '{threat}': getRandomElement(questEnemies),
        '{captors}': getRandomElement(questEnemies),
        '{mystery}': 'strange ' + getRandomElement(['disappearances', 'lights', 'sounds', 'events']),
        '{crime}': getRandomElement(['stealing', 'murdering', 'sabotaging', 'betraying']),
        '{action}': getRandomElement(['join the cause', 'reveal information', 'stop the attack', 'leave town']),
        '{resource}': getRandomElement(['water rights', 'salvage territory', 'trade route', 'mining claim']),
        '{region}': getRandomElement(['wasteland', 'forest', 'mountains', 'ruins']),
        '{settlement}': getRandomElement(['village', 'outpost', 'colony', 'research station']),
        '{event}': getRandomElement(['ceremony', 'trade meeting', 'evacuation', 'summit']),
        '{deadline}': getRandomElement(['dawn', 'sunset', 'the raid begins', 'they move out']),
        '{cargo}': getRandomElement(['medical supplies', 'ammunition', 'food', 'equipment']),
        '{number}': rollDice(6) + 2 // 3-8
    };
    
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
        filled = filled.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
    });
    
    return filled;
}

function generateQuestTitle(quest) {
    const titleTemplates = [
        `The ${capitalizeFirst(quest.description.split(' ')[1] || 'Mission')}`,
        `${quest.typeName}: ${quest.questGiver}`,
        `${quest.location} ${quest.typeName}`,
        `Operation ${getRandomElement(['Nightfall', 'Sunrise', 'Phoenix', 'Thunder', 'Shadow', 'Steel'])}`
    ];
    
    return getRandomElement(titleTemplates);
}

// ========================================
// QUEST DISPLAY
// ========================================
function displayQuest(quest) {
    const display = document.getElementById('generated-quest');
    
    const difficultyStars = '★'.repeat(quest.difficulty) + '☆'.repeat(5 - quest.difficulty);
    const rewardIcon = getRewardIcon(quest.reward.type);
    
    display.innerHTML = `
        <div class="quest-card">
            <div class="quest-header">
                <div class="quest-title">${quest.title}</div>
                <div class="quest-type-badge">${quest.typeName}</div>
            </div>
            
            <div class="quest-description">
                "${quest.description}"
            </div>
            
            <div class="quest-details">
                <div class="quest-detail-group">
                    <div class="detail-label">Quest Giver</div>
                    <div class="detail-value">${quest.questGiver}</div>
                </div>
                
                <div class="quest-detail-group">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${quest.location}</div>
                </div>
                
                <div class="quest-detail-group">
                    <div class="detail-label">Difficulty</div>
                    <div class="detail-value">${difficultyStars}</div>
                    <div class="detail-sub">Level ${quest.difficulty}</div>
                </div>
                
                <div class="quest-detail-group">
                    <div class="detail-label">Estimated Time</div>
                    <div class="detail-value">${quest.estimatedTime}</div>
                </div>
            </div>
            
            <div class="quest-reward">
                <div class="reward-header">
                    <i class="ra ra-gem"></i>
                    Reward
                </div>
                <div class="reward-details">
                    ${rewardIcon} ${quest.reward.description}: ${quest.reward.amount}
                </div>
            </div>
            
            ${quest.complication ? `
                <div class="quest-complication">
                    <div class="complication-header">
                        <i class="ra ra-lightning-bolt"></i>
                        Complication
                    </div>
                    <div class="complication-text">${quest.complication}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function getRewardIcon(type) {
    const icons = {
        gold: '💰',
        experience: '⭐',
        item: '📦',
        reputation: '🏆',
        information: '📜',
        contact: '🤝',
        weapon: '⚔️',
        shelter: '🏠'
    };
    return icons[type] || '🎁';
}

// ========================================
// QUEST ACTIONS
// ========================================
function saveCurrentQuest() {
    if (!currentQuest) return;
    
    currentSession.quests.push({ ...currentQuest });
    refreshSavedQuests();
    
    showNotification('success', 'Quest Saved', 
        `Saved "${currentQuest.title}"`, 
        `Added to ${currentSession.name}`);
}

function copyQuestToClipboard() {
    if (!currentQuest) return;
    
    const questText = formatQuestForText(currentQuest);
    
    copyToClipboard(questText).then(() => {
        showNotification('success', 'Quest Copied', 
            'Quest details copied to clipboard', 
            'Ready to paste into your notes');
    }).catch(error => {
        console.error('Copy failed:', error);
        showNotification('error', 'Copy Failed', 
            'Could not copy to clipboard', 
            'Try manually selecting the text');
    });
}

function formatQuestForText(quest) {
    let text = `${quest.title}
Type: ${quest.typeName}
Quest Giver: ${quest.questGiver}
Location: ${quest.location}

Description: ${quest.description}

Difficulty: ${'★'.repeat(quest.difficulty)} (${quest.difficulty}/5)
Estimated Time: ${quest.estimatedTime}

Reward: ${quest.reward.description} (${quest.reward.amount})`;

    if (quest.complication) {
        text += `\n\nComplication: ${quest.complication}`;
    }
    
    return text;
}

// ========================================
// SAVED QUESTS MANAGEMENT
// ========================================
function refreshSavedQuests() {
    const container = document.getElementById('saved-quests-container');
    if (!container) return;
    
    if (currentSession.quests.length === 0) {
        container.innerHTML = `
            <div class="no-quests">
                <i class="ra ra-scroll-unfurled" style="font-size: 3em; margin-bottom: 15px; color: #6b7280;"></i>
                <p>No saved quests yet. Generate and save some quests to build your campaign!</p>
            </div>
        `;
        updateQuestStats();
        return;
    }
    
    container.innerHTML = currentSession.quests.map(quest => createSavedQuestCard(quest)).join('');
    updateQuestStats();
}

function updateQuestStats() {
    const totalQuests = currentSession.quests.length;
    
    // Update total quests
    const totalElement = document.getElementById('total-quests');
    if (totalElement) {
        totalElement.textContent = totalQuests;
    }
    
    if (totalQuests === 0) {
        const avgElement = document.getElementById('avg-difficulty');
        const typeElement = document.getElementById('most-common-type');
        if (avgElement) avgElement.textContent = '0';
        if (typeElement) typeElement.textContent = 'None';
        return;
    }
    
    // Calculate average difficulty
    const avgDifficulty = currentSession.quests.reduce((sum, quest) => sum + quest.difficulty, 0) / totalQuests;
    const avgElement = document.getElementById('avg-difficulty');
    if (avgElement) {
        avgElement.textContent = Math.round(avgDifficulty * 10) / 10;
    }
    
    // Find most common quest type
    const typeCounts = {};
    currentSession.quests.forEach(quest => {
        typeCounts[quest.typeName] = (typeCounts[quest.typeName] || 0) + 1;
    });
    
    const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
        typeCounts[a] > typeCounts[b] ? a : b, 'None'
    );
    
    const typeElement = document.getElementById('most-common-type');
    if (typeElement) {
        typeElement.textContent = mostCommonType;
    }
}

function createSavedQuestCard(quest) {
    const difficultyStars = '★'.repeat(quest.difficulty);
    const rewardIcon = getRewardIcon(quest.reward.type);
    
    return `
        <div class="saved-quest-card" onclick="loadSavedQuest('${quest.id}')">
            <div class="saved-quest-header">
                <div class="saved-quest-title">${quest.title}</div>
                <div class="saved-quest-difficulty">${difficultyStars}</div>
            </div>
            
            <div class="saved-quest-type">${quest.typeName}</div>
            <div class="saved-quest-description">${quest.description}</div>
            
            <div class="saved-quest-footer">
                <div class="saved-quest-reward">${rewardIcon} ${quest.reward.type}</div>
                <div class="saved-quest-actions">
                    <button class="saved-action-btn" onclick="event.stopPropagation(); copySavedQuest('${quest.id}')" title="Copy">
                        📋
                    </button>
                    <button class="saved-action-btn delete-saved-btn" onclick="event.stopPropagation(); deleteSavedQuest('${quest.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

function loadSavedQuest(questId) {
    const quest = currentSession.quests.find(q => q.id === questId);
    if (quest) {
        currentQuest = { ...quest };
        displayQuest(currentQuest);
        document.getElementById('quest-actions').style.display = 'flex';
        
        showNotification('info', 'Quest Loaded', 
            `Loaded "${quest.title}"`, 
            'You can now edit or copy this quest');
    }
}

function copySavedQuest(questId) {
    const quest = currentSession.quests.find(q => q.id === questId);
    if (quest) {
        const questText = formatQuestForText(quest);
        copyToClipboard(questText).then(() => {
            showNotification('success', 'Quest Copied', 
                `"${quest.title}" copied to clipboard`, 
                'Ready to paste into your notes');
        });
    }
}

function deleteSavedQuest(questId) {
    const quest = currentSession.quests.find(q => q.id === questId);
    if (quest && confirm(`Delete "${quest.title}"?\n\nThis action cannot be undone.`)) {
        currentSession.quests = currentSession.quests.filter(q => q.id !== questId);
        refreshSavedQuests();
        
        showNotification('success', 'Quest Deleted', 
            `Deleted "${quest.title}"`, 
            'Quest removed from session');
    }
}

function clearAllQuests() {
    if (currentSession.quests.length === 0) return;
    
    if (confirm(`Clear all quests from ${currentSession.name}?\n\nThis will remove ${currentSession.quests.length} quests and cannot be undone.`)) {
        currentSession.quests = [];
        refreshSavedQuests();
        
        showNotification('success', 'Quests Cleared', 
            'All quests removed', 
            'Session cleared successfully');
    }
}

// ========================================
// INITIALIZATION
// ========================================
function initializeQuestGenerator() {
    refreshSavedQuests();
}

function refreshQuestDisplay() {
    refreshSavedQuests();
}

// ========================================
// GLOBAL EXPORTS
// ========================================
window.generateRandomQuest = generateRandomQuest;
window.saveCurrentQuest = saveCurrentQuest;
window.copyQuestToClipboard = copyQuestToClipboard;
window.loadSavedQuest = loadSavedQuest;
window.copySavedQuest = copySavedQuest;
window.deleteSavedQuest = deleteSavedQuest;
window.clearAllQuests = clearAllQuests;
window.refreshQuestDisplay = refreshQuestDisplay;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeQuestGenerator, 100);
});