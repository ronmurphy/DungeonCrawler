// ========================================
// ⚠️  ARCHIVE NOTICE - DO NOT USE THIS FILE ⚠️
// 
// This file is NOT in use and is here for archive purposes only!
// 
// Current active chat system: supabase-chat.js
// This file was replaced due to PubNub cost limitations
// (200 messages/month vs Supabase free tier)
// 
// DO NOT LOAD THIS FILE IN HTML OR REFERENCE IN CODE
// 
// VARIABLES COMMENTED OUT TO PREVENT CONFLICTS
// ========================================

// ========================================
// REAL-TIME CHAT & GAME DATA SYSTEM
// Using PubNub for instant messaging and game data
// ========================================

// ========================================
// PUBNUB CONFIGURATION - ARCHIVED
// ========================================
// let pubnub = null;
// let currentChannel = null;
// let isStoryTeller = false;
// let playerName = '';

// Initialize PubNub (you'll need to get free API keys from pubnub.com)
function initializePubNub() {
    pubnub = new PubNub({
        publishKey: 'your-publish-key-here',
        subscribeKey: 'your-subscribe-key-here',
        userId: generateUniqueUserId()
    });
    
    // Set up message listener
    pubnub.addListener({
        message: function(messageEvent) {
            handleIncomingMessage(messageEvent);
        },
        presence: function(presenceEvent) {
            handlePresenceEvent(presenceEvent);
        }
    });
    
    console.log('PubNub initialized');
}

// ========================================
// CHAT SYSTEM
// ========================================
function createChatSystem() {
    // Add chat tab to the main navigation
    addChatTab();
}

function addChatTab() {
    // Add tab button
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;
    
    const chatTabBtn = document.createElement('button');
    chatTabBtn.className = 'tab-btn';
    chatTabBtn.setAttribute('data-tab', 'chat');
    chatTabBtn.innerHTML = `
        <span class="tab-icon"><i class="material-icons">chat</i></span>
        <span class="tab-label">Game Chat</span>
        <span class="chat-notification" id="chat-notification" style="display: none;"></span>
    `;
    tabNav.appendChild(chatTabBtn);
    
    // Add tab content
    const tabContainer = document.querySelector('.tab-container');
    if (!tabContainer) return;
    
    const chatTab = document.createElement('section');
    chatTab.className = 'tab-content';
    chatTab.id = 'chat';
    chatTab.innerHTML = createChatTabContent();
    tabContainer.appendChild(chatTab);
    
    // Add event listener for tab switching
    chatTabBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        chatTabBtn.classList.add('active');
        chatTab.classList.add('active');
    });
}

function createChatTabContent() {
    return `
        <div class="content-wrapper">
            <!-- Connection Setup Card -->
            <div class="card chat-setup-card">
                <div class="card-header">
                    <i class="material-icons">wifi</i>
                    <h3>Game Session Connection</h3>
                    <div class="connection-status" id="connection-status">
                        <span class="status-dot offline"></span>
                        <span class="status-text">Offline</span>
                    </div>
                </div>
                
                <div class="connection-setup" id="connection-setup">
                    <div class="setup-grid">
                        <div class="input-group">
                            <label>Your Name</label>
                            <input type="text" id="player-name-input" placeholder="Enter your name...">
                        </div>
                        <div class="input-group">
                            <label>Role</label>
                            <select id="role-select">
                                <option value="player">Player</option>
                                <option value="storyteller">Story Teller</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Session Code</label>
                            <input type="text" id="session-code-input" placeholder="Enter session code...">
                        </div>
                        <div class="input-group">
                            <button class="connect-btn" onclick="connectToSession()">
                                <i class="material-icons">link</i>
                                Connect to Session
                            </button>
                        </div>
                    </div>
                    
                    <div class="session-management">
                        <button class="create-session-btn" onclick="createNewChatSession()">
                            <i class="material-icons">add</i>
                            Create New Session
                        </button>
                        <div class="session-info" id="session-info" style="display: none;">
                            <p><strong>Session Code:</strong> <span id="current-session-code"></span></p>
                            <p>Share this code with your players to join the session.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Chat Interface Card -->
            <div class="card chat-interface-card" id="chat-interface" style="display: none;">
                <div class="card-header">
                    <i class="material-icons">forum</i>
                    <h3>Game Chat</h3>
                    <div class="chat-controls">
                        <span class="participant-count" id="participant-count">0 participants</span>
                        <button class="disconnect-btn" onclick="disconnectFromSession()">
                            <i class="material-icons">logout</i>
                            Disconnect
                        </button>
                    </div>
                </div>
                
                <!-- Participants List -->
                <div class="participants-section">
                    <h4>Session Participants</h4>
                    <div class="participants-list" id="participants-list"></div>
                </div>
                
                <!-- Chat Messages -->
                <div class="chat-messages-container">
                    <div class="chat-messages" id="chat-messages"></div>
                </div>
                
                <!-- Message Input -->
                <div class="message-input-section">
                    <div class="quick-actions" id="quick-actions">
                        <!-- Quick action buttons will be added here based on role -->
                    </div>
                    <div class="message-input-container">
                        <input type="text" id="message-input" placeholder="Type your message..." onkeypress="handleMessageKeyPress(event)">
                        <button class="send-btn" onclick="sendChatMessage()">
                            <i class="material-icons">send</i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Game Data Processing Card (Story Teller Only) -->
            <div class="card game-data-card" id="game-data-card" style="display: none;">
                <div class="card-header">
                    <i class="material-icons">analytics</i>
                    <h3>Game Data Processing</h3>
                </div>
                
                <div class="auto-processing-status">
                    <label class="toggle-switch">
                        <input type="checkbox" id="auto-process-toggle" checked>
                        <span class="toggle-slider"></span>
                        Auto-process game commands
                    </label>
                </div>
                
                <div class="recent-game-data" id="recent-game-data">
                    <h4>Recent Game Commands</h4>
                    <div class="game-data-log" id="game-data-log"></div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// SESSION MANAGEMENT
// ========================================
function createNewChatSession() {
    const sessionCode = generateSessionCode();
    currentChannel = `dcc-session-${sessionCode}`;
    
    document.getElementById('current-session-code').textContent = sessionCode;
    document.getElementById('session-info').style.display = 'block';
    document.getElementById('session-code-input').value = sessionCode;
    
    showNotification(`Session created: ${sessionCode}`, 'success');
}

function connectToSession() {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.joinGameSession();
    } else {
        showNotification('Chat system not initialized', 'error');
    }
}

function createNewChatSession() {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.createNewGameSession();
    } else {
        showNotification('Chat system not initialized', 'error');
    }
}

function disconnectFromSession() {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.leaveGameSession();
    } else {
        updateConnectionStatus('offline');
        hideChatInterface();
        hideGameDataCard();
    }
}

// ========================================
// MESSAGE HANDLING
// ========================================
function handleIncomingMessage(messageEvent) {
    const message = messageEvent.message;
    const channel = messageEvent.channel;
    const sender = messageEvent.publisher;
    
    if (channel !== currentChannel) return;
    
    // Check if this is a game command
    if (message.type === 'game_command' && isStoryTeller && document.getElementById('auto-process-toggle').checked) {
        processGameCommand(message);
    }
    
    // Display message in chat
    displayChatMessage(message);
    
    // Show notification if not on chat tab
    if (!document.getElementById('chat').classList.contains('active')) {
        showChatNotification();
    }
}

function processGameCommand(message) {
    const { command, data, playerName: cmdPlayerName } = message;
    
    switch (command) {
        case 'ATTACK':
            processPlayerAttack(data, cmdPlayerName);
            break;
        case 'ROLL':
            processPlayerRoll(data, cmdPlayerName);
            break;
        case 'SPELL':
            processPlayerSpell(data, cmdPlayerName);
            break;
        default:
            console.log('Unknown game command:', command);
    }
    
    // Log the processed command
    logGameData(command, data, cmdPlayerName);
}

function processPlayerAttack(data, playerName) {
    const { attackRoll, damage, weaponName } = data;
    
    // Auto-fill combat form if we're in an active combat
    if (currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll;
        document.getElementById('damage-roll').value = damage;
        
        // Auto-resolve the attack
        setTimeout(() => {
            resolvePlayerAttack();
            
            // Send result back to chat
            const enemy = currentCombat.currentEnemy;
            const hit = attackRoll >= enemy.ac;
            const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
            
            sendGameResponse(`${playerName}'s attack with ${weaponName}: ${result}`);
        }, 100);
    } else {
        sendGameResponse(`${playerName} attacked with ${weaponName} (${attackRoll} to hit, ${damage} damage) - No active combat to resolve against`);
    }
}

function processPlayerRoll(data, playerName) {
    const { skillName, result, description } = data;
    
    // Just log and announce the roll
    const message = `${playerName} rolled ${skillName}: ${result}${description ? ` (${description})` : ''}`;
    sendGameResponse(message);
    
    // Add to combat log if combat is active
    if (currentCombat.active) {
        addToCombatLog(message);
    }
}

function processPlayerSpell(data, playerName) {
    const { spellName, attackRoll, damage, mpCost } = data;
    
    // Process similar to attack
    if (currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll;
        document.getElementById('damage-roll').value = damage;
        
        setTimeout(() => {
            resolvePlayerAttack();
            
            const enemy = currentCombat.currentEnemy;
            const hit = attackRoll >= enemy.ac;
            const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
            
            sendGameResponse(`${playerName}'s spell ${spellName}: ${result} (${mpCost} MP spent)`);
        }, 100);
    } else {
        sendGameResponse(`${playerName} cast ${spellName} (${attackRoll} to hit, ${damage} damage, ${mpCost} MP) - No active combat`);
    }
}

// ========================================
// QUICK ACTIONS
// ========================================
function addPlayerQuickActions() {
    const quickActions = document.getElementById('quick-actions');
    quickActions.innerHTML = `
        <button class="quick-action-btn attack-btn" onclick="quickAttack()">
            <i class="ra ra-sword"></i>
            Quick Attack
        </button>
        <button class="quick-action-btn roll-btn" onclick="quickRoll()">
            <i class="ra ra-dice-six"></i>
            Skill Roll
        </button>
        <button class="quick-action-btn spell-btn" onclick="quickSpell()">
            <i class="ra ra-lightning-bolt"></i>
            Cast Spell
        </button>
    `;
}

function addStoryTellerQuickActions() {
    const quickActions = document.getElementById('quick-actions');
    quickActions.innerHTML = `
        <button class="quick-action-btn dm-roll-btn" onclick="dmRoll()">
            <i class="ra ra-dice-six"></i>
            DM Roll
        </button>
        <button class="quick-action-btn share-map-btn" onclick="shareMapToChat()">
            <i class="material-icons">map</i>
            Share Map
        </button>
        <button class="quick-action-btn enemy-btn" onclick="announceEnemy()">
            <i class="ra ra-monster-skull"></i>
            Enemy Appears
        </button>
    `;
}

// ========================================
// QUICK ACTION IMPLEMENTATIONS
// ========================================
function quickAttack() {
    // Simple attack dialog
    const weaponName = prompt('Weapon name:') || 'weapon';
    const attackRoll = prompt('Attack roll (d20 + mods):');
    const damage = prompt('Damage roll:');
    
    if (attackRoll && damage) {
        sendGameCommand('ATTACK', {
            attackRoll: parseInt(attackRoll),
            damage: damage,
            weaponName: weaponName
        });
    }
}

function quickRoll() {
    const skillName = prompt('Skill name:') || 'skill check';
    const result = prompt('Roll result:');
    const description = prompt('Description (optional):') || '';
    
    if (result) {
        sendGameCommand('ROLL', {
            skillName: skillName,
            result: parseInt(result),
            description: description
        });
    }
}

function quickSpell() {
    const spellName = prompt('Spell name:') || 'spell';
    const attackRoll = prompt('Attack roll (if applicable):');
    const damage = prompt('Damage (if applicable):');
    const mpCost = prompt('MP cost:') || '0';
    
    if (attackRoll || damage) {
        sendGameCommand('SPELL', {
            spellName: spellName,
            attackRoll: attackRoll ? parseInt(attackRoll) : null,
            damage: damage || '0',
            mpCost: mpCost
        });
    }
}

function shareMapToChat() {
    if (!currentMap || !currentMap.mapData) {
        showNotification('No map to share', 'error');
        return;
    }
    
    const mapDataUrl = encodeMapToDataUrl(currentMap);
    const shareableLink = `${window.location.origin}${window.location.pathname}?sharedMap=${mapDataUrl}`;
    
    sendChatMessage(`📍 **Map Shared**: ${currentMap.name || 'Current Map'} - ${shareableLink}`);
    showNotification('Map link shared in chat', 'success');
}

function announceEnemy() {
    if (currentCombat.currentEnemy) {
        const enemy = currentCombat.currentEnemy;
        sendChatMessage(`⚔️ **${enemy.name} appears!** (Level ${enemy.level}, AC ${enemy.ac}, ${enemy.currentHp}/${enemy.maxHp} HP)`);
    } else {
        sendChatMessage('⚔️ **An enemy appears!** (Details in StoryTeller app)');
    }
}

// ========================================
// MESSAGE SENDING
// ========================================
function sendChatMessage(messageText = null) {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.sendChatMessage(messageText);
    } else {
        showNotification('Chat system not initialized', 'error');
    }
}

function sendGameCommand(command, data) {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.sendGameCommand(command, data);
    } else {
        showNotification('Chat system not initialized', 'error');
    }
}

function sendGameResponse(responseText) {
    // Use Supabase chat system instead
    if (typeof window.supabaseChat !== 'undefined') {
        window.supabaseChat.sendGameResponse(responseText);
    } else {
        console.log('Game response:', responseText);
    }
}

function sendSystemMessage(text) {
    const message = {
        type: 'system',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    pubnub.publish({
        channel: currentChannel,
        message: message
    });
}

// ========================================
// UI HELPERS
// ========================================
function displayChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.type}`;
    
    let senderClass = '';
    if (message.isStoryTeller) senderClass = 'storyteller';
    if (message.type === 'system') senderClass = 'system';
    if (message.type === 'game_response') senderClass = 'game-response';
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender ${senderClass}">${message.playerName || 'System'}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${message.text}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('.status-text');
    
    dot.className = `status-dot ${status}`;
    text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function showChatInterface() {
    document.getElementById('connection-setup').style.display = 'none';
    document.getElementById('chat-interface').style.display = 'block';
}

function hideChatInterface() {
    document.getElementById('connection-setup').style.display = 'block';
    document.getElementById('chat-interface').style.display = 'none';
}

function showGameDataCard() {
    document.getElementById('game-data-card').style.display = 'block';
}

function hideGameDataCard() {
    document.getElementById('game-data-card').style.display = 'none';
}

function showChatNotification() {
    const notification = document.getElementById('chat-notification');
    notification.style.display = 'block';
    notification.textContent = '•';
}

function clearChatNotification() {
    document.getElementById('chat-notification').style.display = 'none';
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function logGameData(command, data, playerName) {
    const gameDataLog = document.getElementById('game-data-log');
    const logEntry = document.createElement('div');
    logEntry.className = 'game-data-entry';
    logEntry.innerHTML = `
        <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
        <span class="log-player">${playerName}</span>
        <span class="log-command">${command}</span>
        <span class="log-data">${JSON.stringify(data)}</span>
    `;
    gameDataLog.appendChild(logEntry);
    gameDataLog.scrollTop = gameDataLog.scrollHeight;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateUniqueUserId() {
    return 'user-' + Math.random().toString(36).substring(2, 15);
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        createChatSystem();
        // Note: You'll need to include PubNub library and initialize with real API keys
        // initializePubNub();
    }, 1000);
});
