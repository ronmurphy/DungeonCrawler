// ========================================
// STORY TELLER TOOL - MAIN JAVASCRIPT
// Core functionality and shared utilities
// ========================================

// ========================================
// DEBUG MODE CONTROLS
// ========================================
// Debug mode controls
window.showDebug = false; // Set to true to see map debugging info

// Debug toggle function - type toggleMapDebug() in console
window.toggleMapDebug = function() {
    window.showDebug = !window.showDebug;
    console.log(`🐛 Map debug mode ${window.showDebug ? 'ENABLED' : 'DISABLED'}`);
    console.log('Use toggleMapDebug() to switch debug mode on/off');
    return window.showDebug;
};

// Test network tileset transmission - type testNetworkTileset() in console
window.testNetworkTileset = function() {
    console.log('🧪 Testing network tileset transmission...');
    window.showDebug = true;
    
    // Test if MapDataFormatter is available
    if (!window.MapDataFormatter) {
        console.error('❌ MapDataFormatter not available');
        return false;
    }
    
    // Create a simple test map data
    const testMapData = {
        name: 'Network Test Map',
        tileset: 'default',
        width: 3,
        height: 3,
        spriteNames: ['mountain', 'water', 'grass', 'mountain', 'water', 'grass', 'mountain', 'water', 'grass'],
        backgroundColors: {}
    };
    
    console.log('📤 Test map data:', testMapData);
    
    // Test the formatter with network config
    const formatter = new window.MapDataFormatter();
    formatter.formatForSharing(testMapData, 'Network Test Map', {})
        .then(result => {
            console.log('✅ Network transmission test successful!');
            console.log('📦 Enriched data:', result);
            console.log('🎨 Tileset config included:', !!result.tilesetConfig);
            console.log('📡 Network transmission info:', result.networkTransmission);
        })
        .catch(error => {
            console.error('❌ Network transmission test failed:', error);
        });
    
    return true;
};

// Auto-enable debug mode when map panels are opened
function enableDebugForMaps() {
    if (!window.showDebug) {
        window.showDebug = true;
        console.log('🗺️ Auto-enabled debug mode for map operations');
        console.log('Type toggleMapDebug() to disable debug mode');
    }
}

// ========================================
// GLOBAL STATE
// ========================================
let currentSession = {
    name: 'New Session',
    npcs: [],
    quests: [],
    items: [],
    maps: [],
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load saved theme
    loadTheme();
    
    // Initialize tab navigation
    initializeTabNavigation();
    
    // Load last session or create new one
    loadLastSession();
    
    // Initialize file input for import
    initializeImportHandler();
    
    // Initialize the unified map renderer
    setTimeout(() => {
        if (typeof UnifiedMapRenderer !== 'undefined') {
            window.unifiedMapRenderer = new UnifiedMapRenderer();
            // Load default tileset
            window.unifiedMapRenderer.loadTileset('default').then(() => {
                if (window.showDebug) {
                    console.log('✅ Unified Map Renderer initialized with default tileset');
                }
            }).catch(error => {
                console.warn('⚠️ Unified Map Renderer tileset load failed:', error);
            });
        } else {
            console.warn('⚠️ UnifiedMapRenderer not found, retrying...');
            setTimeout(() => {
                if (typeof UnifiedMapRenderer !== 'undefined') {
                    window.unifiedMapRenderer = new UnifiedMapRenderer();
                    window.unifiedMapRenderer.loadTileset('default').then(() => {
                        if (window.showDebug) {
                            console.log('✅ Unified Map Renderer initialized (delayed) with default tileset');
                        }
                    });
                }
            }, 1000);
        }
    }, 100);
    
    // Initialize DCC Game Mechanics (if modules are loaded)
    setTimeout(() => {
        if (typeof DCCChatIntegration !== 'undefined') {
            initializeDCCSystem();
        }
    }, 500);
    
    // Initialize Supabase for real-time chat (if configured and not already initialized)
    setTimeout(() => {
        if (typeof initializeSupabase === 'function' && !window.supabaseInitialized) {
            const result = initializeSupabase();
            if (result) {
                window.supabaseInitialized = true;
            }
        }
    }, 1000); // Delay to ensure all modules are loaded
    
    console.log('Story Teller Tool initialized');
}

// ========================================
// TAB NAVIGATION
// ========================================
function initializeTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
            
            // Update active states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Call tab-specific initialization if needed
        switch(tabName) {
            case 'npc':
                if (typeof refreshNPCDisplay === 'function') {
                    refreshNPCDisplay();
                }
                break;
            case 'quest':
                if (typeof refreshQuestDisplay === 'function') {
                    refreshQuestDisplay();
                }
                break;
            case 'items':
                if (typeof refreshItemsDisplay === 'function') {
                    refreshItemsDisplay();
                }
                break;
            case 'map':
                if (typeof refreshMapDisplay === 'function') {
                    refreshMapDisplay();
                }
                break;
        }
    }
}

// ========================================
// THEME MANAGEMENT
// ========================================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('st-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        // Default is dark theme
        document.body.classList.add('dark-theme');
        localStorage.setItem('st-theme', 'dark');
    }
}

// ========================================
// SESSION MANAGEMENT
// ========================================
function showSessionManager() {
    document.getElementById('session-modal').style.display = 'flex';
    document.getElementById('session-name-input').value = currentSession.name;
    loadSessionsList();
}

function hideSessionManager() {
    document.getElementById('session-modal').style.display = 'none';
}

function createNewSession() {
    const nameInput = document.getElementById('session-name-input');
    const sessionName = nameInput.value.trim() || 'New Session';
    
    // Save current session if it has content
    if (hasSessionContent()) {
        saveSession();
    }
    
    // Create new session
    currentSession = {
        name: sessionName,
        npcs: [],
        quests: [],
        items: [],
        maps: [],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    updateSessionDisplay();
    refreshAllDisplays();
    hideSessionManager();
    
    showNotification('success', 'New Session Created', 
        `Created session: ${sessionName}`, 
        'Start building your campaign!');
}

function saveSession() {
    currentSession.lastModified = new Date().toISOString();
    
    try {
        const sessionKey = `st-session-${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
        localStorage.setItem('st-current-session', sessionKey);
        
        showNotification('success', 'Session Saved', 
            `Saved: ${currentSession.name}`, 
           'Your campaign data is safe!');
        
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('error', 'Save Failed', 
            'Could not save session', 
            'Check your browser storage settings');
        
        return false;
    }
}

function saveSessionSilent() {
    currentSession.lastModified = new Date().toISOString();
    
    try {
        const sessionKey = `st-session-${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
        localStorage.setItem('st-current-session', sessionKey);
        
  //      showNotification('success', 'Session Saved', 
   //         `Saved: ${currentSession.name}`, 
 //           'Your campaign data is safe!');
        
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('error', 'Save Failed', 
            'Could not save session', 
            'Check your browser storage settings');
        
        return false;
    }
}

function loadSession(sessionName) {
    try {
        const sessionKey = `st-session-${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const savedSession = localStorage.getItem(sessionKey);
        
        if (savedSession) {
            currentSession = JSON.parse(savedSession);
            updateSessionDisplay();
            refreshAllDisplays();
            hideSessionManager();
            
            showNotification('success', 'Session Loaded', 
                `Loaded: ${currentSession.name}`, 
                'Welcome back to your campaign!');
            
            return true;
        }
    } catch (error) {
        console.error('Error loading session:', error);
        showNotification('error', 'Load Failed', 
            'Could not load session', 
            'The session file may be corrupted');
    }
    
    return false;
}

function loadLastSession() {
    const lastSession = localStorage.getItem('st-current-session');
    if (lastSession) {
        const sessionData = localStorage.getItem(lastSession);
        if (sessionData) {
            try {
                currentSession = JSON.parse(sessionData);
                updateSessionDisplay();
                refreshAllDisplays();
                return;
            } catch (error) {
                console.error('Error loading last session:', error);
            }
        }
    }
    
    // If no last session or error, start with default
    updateSessionDisplay();
}

function exportSession() {
    const exportData = {
        ...currentSession,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}_session.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Session Exported', 
        `Exported: ${currentSession.name}`, 
        'File downloaded to your device');
}

function importSession() {
    document.getElementById('import-file').click();
}

function initializeImportHandler() {
    document.getElementById('import-file').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (importedData.name && Array.isArray(importedData.npcs)) {
                        currentSession = {
                            name: importedData.name,
                            npcs: importedData.npcs || [],
                            quests: importedData.quests || [],
                            items: importedData.items || [],
                            maps: importedData.maps || [],
                            created: importedData.created || new Date().toISOString(),
                            lastModified: new Date().toISOString()
                        };
                        
                        updateSessionDisplay();
                        refreshAllDisplays();
                        hideSessionManager();
                        
                        showNotification('success', 'Session Imported', 
                            `Imported: ${currentSession.name}`, 
                            'Campaign data loaded successfully!');
                    } else {
                        throw new Error('Invalid session format');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification('error', 'Import Failed', 
                        'Invalid session file', 
                        'Please check the file format');
                }
            };
            reader.readAsText(file);
        }
        
        // Reset file input
        event.target.value = '';
    });
}

function loadSessionsList() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';
    
    // Get all saved sessions
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('st-session-')) {
            try {
                const sessionData = JSON.parse(localStorage.getItem(key));
                sessions.push(sessionData);
            } catch (error) {
                console.error('Error parsing session:', key, error);
            }
        }
    }
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No saved sessions found</p>';
        return;
    }
    
    // Sort by last modified
    sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    sessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        sessionItem.innerHTML = `
            <div onclick="loadSession('${session.name}')">
                <div style="font-weight: 600; color: var(--text-primary);">${session.name}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    Modified: ${new Date(session.lastModified).toLocaleDateString()}
                    | NPCs: ${session.npcs?.length || 0}
                    | Quests: ${session.quests?.length || 0}
                </div>
            </div>
            <button onclick="deleteSession('${session.name}')" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                Delete
            </button>
        `;
        
        sessionItem.onmouseenter = () => {
            sessionItem.style.borderColor = 'var(--primary)';
            sessionItem.style.background = 'var(--bg-tertiary)';
        };
        
        sessionItem.onmouseleave = () => {
            sessionItem.style.borderColor = 'var(--border-color)';
            sessionItem.style.background = 'var(--bg-secondary)';
        };
        
        sessionsList.appendChild(sessionItem);
    });
}

function deleteSession(sessionName) {
    if (confirm(`Are you sure you want to delete the session "${sessionName}"?\n\nThis action cannot be undone.`)) {
        const sessionKey = `st-session-${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.removeItem(sessionKey);
        
        // If this was the current session, start a new one
        if (currentSession.name === sessionName) {
            currentSession = {
                name: 'New Session',
                npcs: [],
                quests: [],
                items: [],
                maps: [],
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            updateSessionDisplay();
            refreshAllDisplays();
        }
        
        loadSessionsList();
        showNotification('success', 'Session Deleted', 
            `Deleted: ${sessionName}`, 
            'Session removed from storage');
    }
}

function updateSessionDisplay() {
    const sessionDisplay = document.getElementById('session-name-display');
    if (sessionDisplay) {
        sessionDisplay.textContent = currentSession.name;
    }
}

function hasSessionContent() {
    return currentSession.npcs.length > 0 || 
           currentSession.quests.length > 0 || 
           (currentSession.items && currentSession.items.length > 0) || 
           currentSession.maps.length > 0;
}

function refreshAllDisplays() {
    // Call refresh functions for all tabs
    if (typeof refreshNPCDisplay === 'function') {
        refreshNPCDisplay();
    }
    if (typeof refreshQuestDisplay === 'function') {
        refreshQuestDisplay();
    }
    if (typeof refreshItemsDisplay === 'function') {
        refreshItemsDisplay();
    }
    if (typeof refreshMapDisplay === 'function') {
        refreshMapDisplay();
    }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(type, title, result, details) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };
    
    notification.innerHTML = `
        <h4><i class="material-icons">${icons[type] || 'info'}</i> ${title}</h4>
        <div class="result">${result}</div>
        <div class="details">${details}</div>
    `;

    container.appendChild(notification);

    // Force reflow to ensure animation plays
    notification.offsetHeight;

    setTimeout(() => notification.classList.add('show'), 10);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollMultipleDice(count, sides) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(rollDice(sides));
    }
    return rolls;
}

// Copy to clipboard utility
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            console.error('Copy failed:', error);
        } finally {
            textArea.remove();
        }
        return Promise.resolve();
    }
}

// ========================================
// DCC GAME MECHANICS INTEGRATION
// ========================================
let dccSystem = null;

function initializeDCCSystem() {
    try {
        dccSystem = new DCCChatIntegration();
        
        // Set up event handlers
        dccSystem.setEventHandlers(
            handleRollComplete,
            handleCombatAction
        );
        
        // Register a default player for testing
        dccSystem.registerPlayer({
            name: 'TestPlayer',
            level: 5,
            attributes: {
                strength: 14,
                dexterity: 12,
                constitution: 13,
                intelligence: 10,
                wisdom: 11,
                charisma: 15
            }
        });
        
        console.log('✅ DCC Game Mechanics initialized');
        
        // Make DCC functions globally available
        window.dccSystem = dccSystem;
        window.rollDCCAttribute = rollDCCAttribute;
        window.rollDCCSkill = rollDCCSkill;
        window.rollDCCCustom = rollDCCCustom;
        window.rollDCCSave = rollDCCSave;
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize DCC system:', error);
        return false;
    }
}

function handleRollComplete(rollData) {
    console.log('🎲 Roll completed:', rollData);
    
    // Create a notification for the roll
    const rollTitle = `${rollData.type}: ${rollData.name}`;
    const rollResult = `Result: ${rollData.finalTotal}`;
    let rollDetails = rollData.description || '';
    
    // Add dice breakdown for dice rolls
    if (rollData.diceRolls && rollData.diceRolls.length > 0) {
        const diceDisplay = rollData.diceRolls.map(roll => `<span style="color: #f4d03f;">${roll}</span>`).join(' + ');
        rollDetails = `Dice: [${diceDisplay}] = ${rollData.diceTotal}<br>${rollDetails}`;
    }
    
    showNotification('success', rollTitle, rollResult, rollDetails);
}

function handleCombatAction(combatData) {
    console.log('⚔️ Combat action:', combatData);
    
    const title = `${combatData.playerName} attacks with ${combatData.weaponName}`;
    const result = combatData.toHit.isCrit ? '💥 CRITICAL HIT!' : `Hit: ${combatData.toHit.total}`;
    let details = combatData.toHit.description;
    
    if (combatData.damage) {
        details += `<br>Damage: ${combatData.damage.totalDamage}`;
    }
    
    showNotification('info', title, result, details);
}

// Helper functions for easy DCC rolling
function rollDCCAttribute(playerName, attribute) {
    if (!dccSystem) {
        console.error('DCC system not initialized');
        return null;
    }
    return dccSystem.processRoll(playerName, attribute);
}

function rollDCCSkill(playerName, skillName) {
    if (!dccSystem) {
        console.error('DCC system not initialized');
        return null;
    }
    return dccSystem.processRoll(playerName, skillName);
}

function rollDCCCustom(playerName, diceString, purpose = 'Custom Roll') {
    if (!dccSystem) {
        console.error('DCC system not initialized');
        return null;
    }
    return dccSystem.processRoll(playerName, purpose, diceString);
}

function rollDCCSave(playerName, saveType) {
    if (!dccSystem) {
        console.error('DCC system not initialized');
        return null;
    }
    return dccSystem.processSavingThrow(playerName, saveType);
}

// ========================================
// GLOBAL EXPORTS
// ========================================
// Make functions globally available
window.toggleTheme = toggleTheme;
window.showSessionManager = showSessionManager;
window.hideSessionManager = hideSessionManager;
window.createNewSession = createNewSession;
window.saveSession = saveSession;
window.loadSession = loadSession;
window.exportSession = exportSession;
window.importSession = importSession;
window.deleteSession = deleteSession;
window.switchTab = switchTab;
window.showNotification = showNotification;
window.generateId = generateId;
window.capitalizeFirst = capitalizeFirst;
window.getRandomElement = getRandomElement;
window.rollDice = rollDice;
window.rollMultipleDice = rollMultipleDice;
window.copyToClipboard = copyToClipboard;

// Auto-save every 30 seconds if there's content
setInterval(() => {
    if (hasSessionContent()) {
        saveSessionSilent();
    }
}, 30000);

// ========================================
// DCC MECHANICS INTEGRATION
// ========================================

// Global DCC integration instance
let dccIntegration = null;

function initializeDCCSystem() {
    if (typeof DCCChatIntegration !== 'undefined') {
        dccIntegration = new DCCChatIntegration();
        console.log('DCC Mechanics System initialized');
        
        // Set up event handlers
        dccIntegration.setEventHandlers(
            (rollResult) => {
                console.log('Roll completed:', rollResult);
            },
            (combatResult) => {
                console.log('Combat action:', combatResult);
            }
        );

        // Initialize test panel data
        setTimeout(() => {
            if (document.getElementById('dcc-race-select')) {
                populateDCCTestData();
            }
        }, 100);
    } else {
        console.warn('DCC Integration modules not loaded');
    }
}

async function populateDCCTestData() {
    if (!dccIntegration) return;

    try {
        // Populate race dropdown
        const raceSelect = document.getElementById('dcc-race-select');
        const races = await dccIntegration.characterData.getRaces();
        if (raceSelect && races) {
            raceSelect.innerHTML = '';
            races.forEach(race => {
                const option = document.createElement('option');
                option.value = race.id || race.name.toLowerCase().replace(' ', '_');
                option.textContent = race.name;
                raceSelect.appendChild(option);
            });
        }

        // Populate class dropdown
        const classSelect = document.getElementById('dcc-class-select');
        const classes = await dccIntegration.characterData.getClasses();
        if (classSelect && classes) {
            classSelect.innerHTML = '';
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.id || cls.name.toLowerCase().replace(' ', '_');
                option.textContent = cls.name;
                classSelect.appendChild(option);
            });
        }

        // Populate data lists
        await populateDataDisplay();
    } catch (error) {
        console.error('Error populating DCC test data:', error);
    }
}

async function populateDataDisplay() {
    if (!dccIntegration) return;

    try {
        // Races
        const races = await dccIntegration.characterData.getRaces();
        const raceList = document.getElementById('race-list');
        const raceCount = document.getElementById('race-count');
        if (raceList && races) {
            raceCount.textContent = races.length;
            raceList.innerHTML = races.map(race => 
                `<div class="data-item" title="${race.description || ''}">${race.name}</div>`
            ).join('');
        }

        // Classes
        const classes = await dccIntegration.characterData.getClasses();
        const classList = document.getElementById('class-list');
        const classCount = document.getElementById('class-count');
        if (classList && classes) {
            classCount.textContent = classes.length;
            classList.innerHTML = classes.map(cls => 
                `<div class="data-item" title="${cls.description || ''}">${cls.name}</div>`
            ).join('');
        }

        // Jobs
        const jobs = await dccIntegration.characterData.getJobs();
        const jobList = document.getElementById('job-list');
        const jobCount = document.getElementById('job-count');
        if (jobList && jobs) {
            jobCount.textContent = jobs.length;
            jobList.innerHTML = jobs.map(job => 
                `<div class="data-item" title="${job.description || ''}">${job.name}</div>`
            ).join('');
        }
    } catch (error) {
        console.error('Error populating data display:', error);
    }
}

function getTestPlayer() {
    const name = document.getElementById('dcc-player-name').value || 'Testificate';
    const level = parseInt(document.getElementById('dcc-level').value) || 1;
    
    return {
        name: name,
        level: level,
        attributes: {
            strength: parseInt(document.getElementById('dcc-str').value) || 10,
            dexterity: parseInt(document.getElementById('dcc-dex').value) || 10,
            constitution: parseInt(document.getElementById('dcc-con').value) || 10,
            intelligence: parseInt(document.getElementById('dcc-int').value) || 10,
            wisdom: parseInt(document.getElementById('dcc-wis').value) || 10,
            charisma: parseInt(document.getElementById('dcc-cha').value) || 10
        },
        achievements: [
            {
                name: 'Test Achievement',
                effect: document.getElementById('test-bonus-effect').value || '+1 to hit with all weapons'
            }
        ]
    };
}

function outputTestResult(title, result) {
    const output = document.getElementById('dcc-test-output');
    if (!output) return;

    const timestamp = new Date().toLocaleTimeString();
    const resultText = `[${timestamp}] ${title}\n${JSON.stringify(result, null, 2)}\n\n`;
    
    output.textContent += resultText;
    output.scrollTop = output.scrollHeight;
}

// ========================================
// DCC TEST FUNCTIONS
// ========================================

function testAttributeRoll() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const result = dccIntegration.processRoll(player.name, 'strength');
    outputTestResult('Attribute Roll (Strength)', result);
}

function testSkillRoll() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const result = dccIntegration.processRoll(player.name, 'climb');
    outputTestResult('Skill Roll (Climb)', result);
}

function testSavingThrow() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const result = dccIntegration.processSavingThrow(player.name, 'reflex');
    outputTestResult('Saving Throw (Reflex)', result);
}

function testWeaponAttack() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const weapon = dccIntegration.createWeapon(
        document.getElementById('test-weapon-name').value || 'Rusty Sword',
        'medium',
        false
    );
    
    const result = dccIntegration.processAttack(player.name, weapon);
    outputTestResult('Weapon Attack', result);
}

function testCustomRoll() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const result = dccIntegration.processCustomRoll(player.name, '3d6+2', 'Custom Test Roll');
    outputTestResult('Custom Roll (3d6+2)', result);
}

function testSpellRoll() {
    if (!dccIntegration) return;
    
    const player = getTestPlayer();
    dccIntegration.registerPlayer(player);
    
    const result = dccIntegration.processRoll(player.name, 'spell', 'd20+2');
    outputTestResult('Spell Roll', result);
}

function testEquipmentBonus() {
    if (!dccIntegration) return;
    
    const weaponName = document.getElementById('test-weapon-name').value || 'Rusty Sword';
    const bonusEffect = document.getElementById('test-bonus-effect').value || '+2 damage with Rusty Sword';
    
    const player = getTestPlayer();
    player.achievements[0].effect = bonusEffect;
    
    const bonuses = dccIntegration.equipmentBonusSystem.getEquipmentBonuses(
        weaponName,
        'melee weapon',
        player
    );
    
    outputTestResult('Equipment Bonus Test', {
        weapon: weaponName,
        effect: bonusEffect,
        bonuses: bonuses,
        summary: dccIntegration.equipmentBonusSystem.formatBonusSummary(bonuses)
    });
}

// Export DCC test functions to global scope
window.testAttributeRoll = testAttributeRoll;
window.testSkillRoll = testSkillRoll;
window.testSavingThrow = testSavingThrow;
window.testWeaponAttack = testWeaponAttack;
window.testCustomRoll = testCustomRoll;
window.testSpellRoll = testSpellRoll;
window.testEquipmentBonus = testEquipmentBonus;
window.populateDCCTestData = populateDCCTestData;

// ========================================
// SUPABASE CONFIGURATION UI FUNCTIONS
// ========================================
function saveSupabaseConfig() {
    const urlInput = document.getElementById('supabase-url');
    const keyInput = document.getElementById('supabase-key');
    
    if (!urlInput || !keyInput) {
        showNotification('Configuration form not found', 'error');
        return;
    }
    
    const url = urlInput.value.trim();
    const key = keyInput.value.trim();
    
    if (!url || !key) {
        showNotification('Please enter both URL and API key', 'error');
        return;
    }
    
    if (typeof supabaseConfig !== 'undefined') {
        const validation = supabaseConfig.validateConfig(url, key);
        if (!validation.valid) {
            showNotification('Invalid configuration: ' + validation.errors.join(', '), 'error');
            return;
        }
        
        const result = supabaseConfig.saveConfig(url, key);
        if (result.success) {
            showNotification('Configuration saved successfully!', 'success');
            updateConfigDisplay();
            
            // Try to initialize Supabase
            if (typeof initializeSupabase === 'function') {
                window.supabaseInitialized = false; // Reset flag
                const initResult = initializeSupabase();
                if (initResult) {
                    showNotification('Connected to Supabase successfully!', 'success');
                } else {
                    showNotification('Configuration saved but connection failed', 'warning');
                }
            }
        } else {
            showNotification('Failed to save configuration', 'error');
        }
    } else {
        showNotification('Configuration manager not loaded', 'error');
    }
}

function testSupabaseConnection() {
    if (typeof supabaseConfig !== 'undefined' && supabaseConfig.hasConfig()) {
        showNotification('Testing connection...', 'info');
        
        if (typeof initializeSupabase === 'function') {
            window.supabaseInitialized = false; // Reset flag
            const result = initializeSupabase();
            if (result) {
                showNotification('✅ Connection test successful!', 'success');
                updateConfigDisplay();
            } else {
                showNotification('❌ Connection test failed', 'error');
            }
        } else {
            showNotification('Supabase chat system not loaded', 'error');
        }
    } else {
        showNotification('Please save configuration first', 'warning');
    }
}

function clearSupabaseConfig() {
    if (confirm('Are you sure you want to clear the Supabase configuration?')) {
        if (typeof supabaseConfig !== 'undefined') {
            const result = supabaseConfig.clearConfig();
            if (result.success) {
                document.getElementById('supabase-url').value = '';
                document.getElementById('supabase-key').value = '';
                showNotification('Configuration cleared', 'success');
                updateConfigDisplay();
                
                // Reset Supabase initialization
                window.supabaseInitialized = false;
            } else {
                showNotification('Failed to clear configuration', 'error');
            }
        }
    }
}

function updateConfigDisplay() {
    const statusDisplay = document.getElementById('config-status-display');
    if (!statusDisplay) return;
    
    if (typeof supabaseConfig !== 'undefined' && supabaseConfig.hasConfig()) {
        statusDisplay.innerHTML = `
            <span class="status-dot connected"></span>
            <span class="status-text">Configured</span>
        `;
        
        // Load saved values into form
        const config = supabaseConfig.loadConfig();
        if (config.success) {
            const urlInput = document.getElementById('supabase-url');
            const keyInput = document.getElementById('supabase-key');
            if (urlInput) urlInput.value = config.data.supabaseUrl;
            if (keyInput) keyInput.value = config.data.supabaseKey;
        }
    } else {
        statusDisplay.innerHTML = `
            <span class="status-dot offline"></span>
            <span class="status-text">Not Configured</span>
        `;
    }
}

// ========================================
// SETTINGS MODAL FUNCTIONS
// ========================================
function showSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'flex';
        updateConfigDisplay(); // Refresh config display when opening settings
    }
}

function hideSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
