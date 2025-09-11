// ========================================
// ✅ ACTIVE CHAT SYSTEM - SUPABASE REAL-TIME
// 
// This is the CURRENT chat system in use!
// Budget-friendly alternative to PubNub (Free vs $98/month)
// Handles real-time messaging, combat integration, and session management
// 
// Previous system: realtime-chat.js (PubNub) - archived due to cost
// ========================================

// ========================================
// SUPABASE CONFIGURATION
// ========================================
let supabase = null;
let currentConfig = null;
let currentGameSession = null;
let messagesSubscription = null;
let isStoryTeller = false;
let playerName = '';

// Global debug toggle - set to false to reduce console spam
if (typeof window.showDebug === 'undefined') {
    window.showDebug = false;
}

// ========================================
// AUTO-RECONNECTION SYSTEM
// ========================================
let connectionMonitor = null;
let lastHeartbeat = Date.now();
let reconnectAttempts = 0;
let maxReconnectAttempts = 40; // Increased for long RPG sessions (15+ min turns)
let reconnectDelay = 3000; // Start with 3 seconds
let isReconnecting = false;
let visibilityChangeHandler = null;

// Platform detection for enhanced mobile features
let isCordova = typeof window.cordova !== 'undefined';
let isBrowser = !isCordova;

// Initialize Supabase (free tier: 500MB database, 2GB bandwidth)
function initializeSupabase(customUrl = null, customKey = null) {
    // Prevent double initialization
    if (window.supabaseInitialized) {
        console.log('Supabase already initialized');
        return true;
    }
    
    let supabaseUrl = customUrl;
    let supabaseKey = customKey;
    
    // If custom parameters not provided, load from configuration
    if (!supabaseUrl || !supabaseKey) {
        if (typeof supabaseConfig !== 'undefined') {
            const configResult = supabaseConfig.loadConfig();
            
            if (!configResult.success) {
                console.warn('Supabase not configured. Please set up your API keys in the Configure tab.');
                showChatError('Chat not configured. Please visit the Configure tab to set up Supabase.');
                return false;
            }
            
            currentConfig = configResult.data;
            supabaseUrl = supabaseUrl || currentConfig.supabaseUrl;
            supabaseKey = supabaseKey || currentConfig.supabaseKey;
        } else {
            console.error('Supabase configuration manager not loaded');
            showChatError('Configuration manager not loaded. Please refresh the page.');
            return false;
        }
    }
    
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        // Make the client globally accessible for map sync and other modules
        window.supabaseClient = supabase;
        
        // Store configuration for later use
        if (!currentConfig) {
            currentConfig = { supabaseUrl, supabaseKey };
        }
        
        // Clear any previous error messages
        const errorDiv = document.getElementById('chat-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        console.log('Supabase initialized for real-time gaming');
        window.supabaseInitialized = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showChatError(`Failed to connect to Supabase: ${error.message}`);
        return false;
    }
}

// ========================================
// DATABASE SETUP (RUN ONCE)
// ========================================
function createGameTables() {
    // You'll run this SQL in your Supabase dashboard:
    const setupSQL = `
    -- Game sessions table
    CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        session_code VARCHAR(10) UNIQUE NOT NULL,
        dm_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN DEFAULT true
    );

    -- Game messages table  
    CREATE TABLE IF NOT EXISTS game_messages (
        id SERIAL PRIMARY KEY,
        session_code VARCHAR(10) REFERENCES game_sessions(session_code),
        player_name VARCHAR(100) NOT NULL,
        message_type VARCHAR(50) NOT NULL, -- 'chat', 'game_command', 'system'
        message_text TEXT,
        game_data JSONB, -- For structured game commands
        is_storyteller BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Enable real-time subscriptions
    ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
    `;
    
    console.log('Run this SQL in your Supabase dashboard:', setupSQL);
}

// ========================================
// ERROR HANDLING
// ========================================
function showChatError(message) {
    let errorDiv = document.getElementById('chat-error-message');
    
    if (!errorDiv) {
        // Create error message div if it doesn't exist
        errorDiv = document.createElement('div');
        errorDiv.id = 'chat-error-message';
        errorDiv.className = 'chat-error';
        
        // Insert at the top of chat content
        const chatContent = document.getElementById('chat');
        if (chatContent) {
            chatContent.insertBefore(errorDiv, chatContent.firstChild);
        }
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="material-icons">error</i>
            <span>${message}</span>
        </div>
    `;
    errorDiv.style.display = 'block';
}

// ========================================
// UI INTERFACE FUNCTIONS
// ========================================
async function startGameSession() {
    const dmNameInput = document.getElementById('storyteller-name');
    const sessionCodeInput = document.getElementById('new-session-code');
    
    if (!dmNameInput || !sessionCodeInput) {
        console.error('Required input elements not found');
        alert('Error: Unable to find input fields');
        return;
    }
    
    const dmName = dmNameInput.value.trim();
    const sessionCode = sessionCodeInput.value.trim().toUpperCase();
    
    if (!dmName) {
        alert('Please enter your name');
        return;
    }
    
    if (!sessionCode) {
        alert('Please enter a session code');
        return;
    }
    
    // Check if Supabase is configured
    if (!supabase) {
        alert('Supabase not configured. Please configure your database settings first.');
        return;
    }

    try {
        // Set the global variables first
        window.playerName = dmName;
        
        // Automatically set as storyteller when starting new session
        window.isStoryteller = true;
        
        // Update UI to reflect storyteller status
        const storytellerToggle = document.getElementById('storyteller-toggle');
        if (storytellerToggle) {
            storytellerToggle.checked = true;
        }
        
        await createNewGameSession();
        
        // Add system message about storyteller status
        if (window.addMessage) {
            window.addMessage('System', `${dmName} is now the Storyteller for this session.`, 'system');
        }
        
    } catch (error) {
        console.error('Failed to start game session:', error);
        alert('Failed to start session: ' + error.message);
    }
}

async function joinGameSession() {
    const playerNameInput = document.getElementById('storyteller-name');
    const sessionCodeInput = document.getElementById('new-session-code');
    
    if (!playerNameInput || !sessionCodeInput) {
        console.error('Required input elements not found');
        alert('Error: Unable to find input fields');
        return;
    }
    
    const playerName = playerNameInput.value.trim();
    const sessionCode = sessionCodeInput.value.trim().toUpperCase();
    
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (!sessionCode) {
        alert('Please enter a session code');
        return;
    }
    
    if (sessionCode.length > 10) {
        alert('Session code must be 10 characters or less');
        return;
    }
    
    try {
        // Set the global player name
        window.playerName = playerName;
        await joinExistingSession(sessionCode);
    } catch (error) {
        console.error('Failed to join game session:', error);
        alert('Failed to join session: ' + error.message);
    }
}

function sendChatMessage(messageText = null) {
    // If messageText is provided, use it directly (for combat commands)
    if (messageText) {
        sendChatMessageAsync(messageText);
        return;
    }
    
    // Otherwise, get message from input (for UI usage)
    const messageInput = document.getElementById('chat-message-input');
    if (!messageInput) {
        console.error('Chat message input not found');
        return;
    }
    
    const inputText = messageInput.value.trim();
    if (!inputText) return;
    
    // Clear input
    messageInput.value = '';
    
    // Send the message using the existing async function
    sendChatMessageAsync(inputText);
}

// ========================================
// GAME SESSION MANAGEMENT
// ========================================

// ========================================
// FULL CONNECT METHOD - ONE-STEP SETUP
// ========================================

/**
 * Complete Supabase connection and session setup in one method
 * @param {string} playerName - Name of the player/DM
 * @param {string} sessionCode - Session code to create or join
 * @param {boolean} isStoryteller - True if this is the DM/Storyteller
 * @param {string} mode - 'create' to create new session, 'join' to join existing
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} - Success/failure result with details
 */
async function fullSupabaseConnect(playerName, sessionCode, isStoryteller = false, mode = 'join', options = {}) {
    const result = {
        success: false,
        error: null,
        sessionInfo: null,
        connectionStatus: 'disconnected'
    };
    
    try {
        // Step 1: Validate inputs
        if (!playerName || !sessionCode) {
            throw new Error('Player name and session code are required');
        }
        
        if (sessionCode.length > 10) {
            throw new Error('Session code must be 10 characters or less');
        }
        
        // Normalize session code to uppercase for consistency
        sessionCode = sessionCode.toUpperCase();
        
        console.log(`🔌 Starting full Supabase connect: ${playerName} ${mode === 'create' ? 'creating' : 'joining'} session ${sessionCode}`);
        
        // Step 2: Initialize Supabase if not already done
        if (!supabase) {
            const initResult = initializeSupabase();
            if (!initResult) {
                throw new Error('Failed to initialize Supabase. Check configuration.');
            }
        }
        
        // Step 3: Set global variables
        window.playerName = playerName;
        window.isStoryteller = isStoryteller;
        window.isStoryTeller = isStoryteller; // Fix naming inconsistency
        isStoryTeller = isStoryteller; // Set local variable too
        
        // Step 4: Create or join session with smart fallback
        let sessionResult;
        if (mode === 'create') {
            // Try to create new session
            sessionResult = await createGameSessionDirect(sessionCode, playerName);
            
            if (!sessionResult.success && sessionResult.error && sessionResult.error.includes('already exists')) {
                // Session already exists - automatically switch to join mode
                console.log(`⚠️ Session ${sessionCode} already exists, switching to join mode...`);
                sessionResult = await joinExistingSession(sessionCode);
                if (sessionResult.success) {
                    console.log(`✅ Automatically joined existing session ${sessionCode}`);
                }
            } else if (sessionResult.success) {
                console.log(`✅ Session ${sessionCode} created successfully`);
            }
        } else {
            // Join existing session
            sessionResult = await joinExistingSession(sessionCode);
            console.log(`✅ Joined session ${sessionCode} successfully`);
        }
        
        if (!sessionResult.success) {
            throw new Error(sessionResult.error || 'Failed to setup session');
        }
        
        // Step 5: Subscribe to real-time messages
        await subscribeToGameMessages(sessionCode);
        console.log(`🔔 Real-time subscription active for session ${sessionCode}`);
        
        // Step 6: Start connection monitoring
        startConnectionMonitor();
        console.log(`👁️ Connection monitor started for ${sessionCode}`);
        
        // Step 7: Update UI elements if they exist (optional, no error if missing)
        updateUIAfterConnect(playerName, sessionCode, isStoryteller, mode);
        
        // Step 8: Send join/create announcement
        if (mode === 'create') {
            await sendSystemMessage(`${playerName} started the session as Storyteller`);
        } else {
            await sendSystemMessage(`${playerName} joined the session`);
        }
        
        // Step 9: Auto-send avatar URL if available (silent command)
        console.log('🔍 DEBUG - About to call autoSendAvatarUrl for:', playerName);
        await autoSendAvatarUrl(playerName);
        console.log('🔍 DEBUG - autoSendAvatarUrl completed for:', playerName);
        
        // Step 10: Update self chip avatar immediately
        if (typeof window.updateSelfChipAvatar === 'function') {
            setTimeout(() => {
                window.updateSelfChipAvatar();
            }, 200);
        }
        
        // Success!
        result.success = true;
        result.sessionInfo = {
            sessionCode: sessionCode,
            playerName: playerName,
            isStoryteller: isStoryteller,
            mode: mode
        };
        result.connectionStatus = 'connected';
        
        console.log(`🎉 Full Supabase connect complete! Ready for real-time gaming.`);
        
        // Update connected players list after connection
        setTimeout(() => {
            updateConnectedPlayersList();
        }, 2000); // Give time for system messages to be sent
        
        return result;
        
    } catch (error) {
        console.error('❌ Full Supabase connect failed:', error);
        result.error = error.message;
        result.connectionStatus = 'failed';
        
        // Clear any partial state
        if (messagesSubscription) {
            messagesSubscription.unsubscribe();
            messagesSubscription = null;
        }
        
        return result;
    }
}

/**
 * Auto-send avatar URL as silent command when player joins
 * @param {string} playerName - Name of the player who joined
 */
async function autoSendAvatarUrl(playerName) {
    try {
        console.log('🔍 DEBUG - autoSendAvatarUrl called for:', playerName);
        
        // Get player's character data - use the same method as v4CharacterSyncManager
        let characterData = null;
        
        console.log('🔍 DEBUG - Checking character manager...');
        console.log('🔍 DEBUG - window.characterManager exists:', !!window.characterManager);
        console.log('🔍 DEBUG - characterManager.currentCharacterId:', window.characterManager?.currentCharacterId);
        console.log('🔍 DEBUG - window.character exists:', !!window.character);
        
        // V4-network uses characterManager.currentCharacterId and global 'character' object
        if (window.characterManager && window.characterManager.currentCharacterId && window.character) {
            // Verify the character object matches the current ID
            if (character.id === characterManager.currentCharacterId) {
                characterData = character;
                console.log('🔍 DEBUG - Found character via currentCharacterId match');
            }
        }
        
        // Fallback: try to find current character in characters array
        if (!characterData && window.characterManager && window.characterManager.currentCharacterId && window.characterManager.characters) {
            characterData = characterManager.characters.find(
                char => char.id === characterManager.currentCharacterId
            );
            if (characterData) {
                console.log('🔍 DEBUG - Found character via characters array search');
            }
        }
        
        // Last resort: if we have a global character object, use it
        if (!characterData && window.character && window.character.id) {
            characterData = character;
            console.log('🔍 DEBUG - Using global character object as fallback');
        }
        
        if (!characterData) {
            console.log(`📸 No character data found for ${playerName} to auto-send avatar`);
            console.log(`📸 Debug - characterManager:`, window.characterManager);
            console.log(`📸 Debug - currentCharacterId:`, window.characterManager?.currentCharacterId);
            console.log(`📸 Debug - global character:`, window.character);
            return;
        }
        
        console.log('🔍 DEBUG - Character data found:', characterData.name);
        console.log('🔍 DEBUG - Character personal section:', characterData.personal);
        
        // Check for avatar URL (new system) or portrait (old system)
        let avatarUrl = null;
        if (characterData.personal?.avatarUrl) {
            avatarUrl = characterData.personal.avatarUrl;
            console.log('🔍 DEBUG - Found avatarUrl:', avatarUrl);
        } else if (characterData.personal?.portrait) {
            // For now, skip base64 portraits in avatar announcements
            console.log(`📸 Character ${playerName} has base64 portrait - skipping avatar URL announcement`);
            return;
        }
        
        if (!avatarUrl) {
            console.log(`📸 No avatar URL found for ${playerName} to auto-send`);
            return;
        }
        
        // Send silent AVATAR_URL command
        const avatarCommand = `AVATAR_URL:${playerName}:${avatarUrl}`;
        console.log(`🎭 Auto-sending avatar URL for ${playerName}: ${avatarUrl}`);
        
        // Send as silent command (no visible message) - use the correct function
        await sendChatMessageAsync(avatarCommand);
        console.log(`🎭 Avatar URL command sent successfully for ${playerName}`);
        
    } catch (error) {
        console.error('❌ Error auto-sending avatar URL:', error);
        // Don't fail the connection if avatar sending fails
    }
}

/**
 * Helper function to create session directly (without UI dependency)
 */
async function createGameSessionDirect(sessionCode, dmName) {
    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert([{
                session_code: sessionCode,
                dm_name: dmName
            }])
            .select();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return { success: false, error: `Session ${sessionCode} already exists` };
            }
            throw error;
        }

        currentGameSession = {
            id: data[0].id,
            session_code: sessionCode,
            dm_name: dmName
        };

        return { success: true, session: currentGameSession };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Join an existing game session
 * @param {string} sessionCode - Session code to join (max 10 chars)
 * @returns {Object} - Result object with success/error
 */
async function joinExistingSession(sessionCode) {
    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('session_code', sessionCode.toUpperCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Session not found' };
            }
            return { success: false, error: error.message };
        }

        // Store session info globally
        currentGameSession = {
            id: data.id,
            session_code: data.session_code,
            dm_name: data.dm_name
        };

        return { success: true, session: currentGameSession };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Helper function to update UI elements after successful connection
 */
function updateUIAfterConnect(playerName, sessionCode, isStoryteller, mode) {
    try {
        // Update storyteller toggle if it exists
        const storytellerToggle = document.getElementById('storyteller-toggle');
        if (storytellerToggle) {
            storytellerToggle.checked = isStoryteller;
        }
        
        // Update player name field if it exists  
        const playerNameInput = document.getElementById('storyteller-name') || document.getElementById('dm-name-input');
        if (playerNameInput) {
            playerNameInput.value = playerName;
        }
        
        // Update session code field if it exists
        const sessionCodeInput = document.getElementById('new-session-code') || document.getElementById('session-code-input');
        if (sessionCodeInput) {
            sessionCodeInput.value = sessionCode;
        }
        
        // Update player URL
        const playerUrlInput = document.getElementById('player-url');
        if (playerUrlInput) {
            // Generate Supabase URL + session for players to copy/paste
            let playerUrl = 'No Supabase URL configured';
            if (supabase && supabase.supabaseUrl) {
                playerUrl = `${supabase.supabaseUrl}?session=${sessionCode}`;
            } else {
                // Fallback - try to get from config
                const config = localStorage.getItem('storyteller-supabase-config');
                if (config) {
                    const parsed = JSON.parse(config);
                    playerUrl = `${parsed.url}?session=${sessionCode}`;
                }
            }
            playerUrlInput.value = playerUrl;
            console.log('🔗 Generated player URL:', playerUrl);
        }
        
        // Update session status display
        const sessionStatus = document.getElementById('session-status');
        if (sessionStatus) {
            sessionStatus.innerHTML = `
                <span class="status-dot connected"></span>
                <span class="status-text">Session: ${sessionCode} (Active)</span>
            `;
        }
        
        // Show success message if chat area exists
        const chatArea = document.getElementById('chat');
        if (chatArea && window.addMessage) {
            const actionText = mode === 'create' ? 'created' : 'joined';
            const roleText = isStoryteller ? 'Storyteller' : 'Player';
            window.addMessage('System', `${playerName} ${actionText} session ${sessionCode} as ${roleText}`, 'system');
        }
        
        console.log(`🎨 UI updated for ${playerName} (${isStoryteller ? 'Storyteller' : 'Player'})`);
        
        // Initialize V4 character sync manager
        if (window.v4CharacterSyncManager) {
            window.v4CharacterSyncManager.initialize(playerName, sessionCode);
            console.log('🔄 V4 Character sync manager initialized');
        }
        
    } catch (error) {
        console.warn('⚠️ UI update failed (non-critical):', error.message);
    }
}

/**
 * Send a system message (helper for announcements)
 */
async function sendSystemMessage(messageText) {
    try {
        if (!currentGameSession || !supabase) return;
        
        await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession.session_code,
                player_name: 'System',
                message_type: 'system',
                message_text: messageText,
                is_storyteller: false
            }]);
    } catch (error) {
        console.warn('⚠️ System message failed (non-critical):', error.message);
    }
}

// ========================================
// AUTO-RECONNECTION SYSTEM
// ========================================

/**
 * Start monitoring connection health and auto-reconnect if needed
 * Enhanced for Cordova, PWA, and browser compatibility
 */
function startConnectionMonitor() {
    if (connectionMonitor) {
        clearInterval(connectionMonitor);
    }
    
    console.log(`🔍 Starting connection health monitor for ${isCordova ? 'Cordova app' : 'browser'}...`);
    
    // Platform-specific monitoring intervals
    let monitorInterval;
    if (isCordova) {
        // Cordova can handle more frequent checks and background activity
        monitorInterval = 10000; // 10 seconds for native app
        console.log('📱 Using enhanced Cordova monitoring (10s intervals)');
    } else {
        // Regular browser - more conservative to avoid performance issues
        monitorInterval = 20000; // 20 seconds for browser
        console.log('🌐 Using browser monitoring (20s intervals)');
    }
    
    // Start monitoring
    connectionMonitor = setInterval(async () => {
        await checkConnectionHealth();
    }, monitorInterval);
    
    // Setup platform-specific visibility monitoring
    setupVisibilityMonitoring();
    
    // Setup network monitoring
    setupNetworkMonitoring();
    
    console.log(`✅ Connection monitor active (${monitorInterval/1000}s intervals)`);
}

/**
 * Check if the real-time connection is still healthy
 */
async function checkConnectionHealth() {
    if (!currentGameSession || !supabase || isReconnecting) {
        return;
    }
    
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeat;
    
    // If no heartbeat for 60 seconds, consider connection dead
    if (timeSinceLastHeartbeat > 60000) {
        console.warn('⚠️ Real-time connection appears dead (no heartbeat for 60s)');
        await attemptReconnection('heartbeat_timeout');
        return;
    }
    
    // Test if subscription is still active
    if (!messagesSubscription || messagesSubscription.state === 'CLOSED') {
        console.warn('⚠️ Real-time subscription is closed');
        await attemptReconnection('subscription_closed');
        return;
    }
    
    // Send a test heartbeat message
    try {
        await sendHeartbeat();
    } catch (error) {
        console.warn('⚠️ Heartbeat failed:', error.message);
        await attemptReconnection('heartbeat_failed');
    }
}

/**
 * Send a heartbeat message to test connection
 */
async function sendHeartbeat() {
    if (!currentGameSession || !supabase) return;
    
    try {
        await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession.session_code,
                player_name: 'Heartbeat',
                message_type: 'heartbeat',
                message_text: `ping_${Date.now()}`,
                is_storyteller: false
            }]);
        
        lastHeartbeat = Date.now();
    } catch (error) {
        throw new Error(`Heartbeat failed: ${error.message}`);
    }
}

/**
 * Attempt to reconnect the real-time subscription
 */
async function attemptReconnection(reason) {
    if (isReconnecting || reconnectAttempts >= maxReconnectAttempts) {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached. Manual intervention required.');
            showConnectionStatus('Connection lost - please refresh page', 'error');
        }
        return;
    }
    
    isReconnecting = true;
    reconnectAttempts++;
    
    console.log(`🔄 Attempting reconnection #${reconnectAttempts} (reason: ${reason})...`);
    showConnectionStatus(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`, 'warning');
    
    try {
        // Unsubscribe from old subscription
        if (messagesSubscription) {
            messagesSubscription.unsubscribe();
            messagesSubscription = null;
        }
        
        // Wait before reconnecting (exponential backoff)
        const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Attempt to resubscribe
        await subscribeToGameMessages(currentGameSession.session_code);
        
        // Success!
        reconnectAttempts = 0;
        isReconnecting = false;
        lastHeartbeat = Date.now();
        
        console.log('✅ Reconnection successful!');
        showConnectionStatus('Connected', 'success');
        
        // Send reconnection notification
        await sendSystemMessage(`${window.playerName} reconnected to the session`);
        
    } catch (error) {
        console.error(`❌ Reconnection attempt #${reconnectAttempts} failed:`, error);
        isReconnecting = false;
        
        if (reconnectAttempts < maxReconnectAttempts) {
            showConnectionStatus(`Reconnection failed, retrying...`, 'warning');
        } else {
            showConnectionStatus('Connection failed - please refresh page', 'error');
        }
    }
}

/**
 * Monitor page visibility changes (mobile app backgrounding)
 * Enhanced for Cordova, PWA, and browser compatibility
 */
function setupVisibilityMonitoring() {
    if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
    }
    
    console.log(`📱 Setting up visibility monitoring for ${isCordova ? 'Cordova' : 'Browser'}`);
    
    // Standard web visibility API (works in all platforms)
    visibilityChangeHandler = async () => {
        if (document.hidden) {
            console.log('📱 App went to background (web API)');
            onAppBackgrounded();
        } else {
            console.log('📱 App returned to foreground (web API)');
            onAppForegrounded();
        }
    };
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    
    // Enhanced Cordova events for better native app detection
    if (isCordova) {
        document.addEventListener('deviceready', () => {
            console.log('📱 Cordova device ready - setting up native app events');
            
            // Cordova pause/resume events (more reliable than web API)
            document.addEventListener('pause', () => {
                console.log('📱 App paused (Cordova native)');
                onAppBackgrounded();
            }, false);
            
            document.addEventListener('resume', () => {
                console.log('📱 App resumed (Cordova native)');
                onAppForegrounded();
            }, false);
            
            // Handle back button (Android)
            document.addEventListener('backbutton', (e) => {
                console.log('📱 Back button pressed');
                // Don't exit app, just minimize
                if (typeof navigator.app !== 'undefined') {
                    navigator.app.exitApp();
                }
            }, false);
            
        }, false);
    }
}

/**
 * Handle app going to background
 */
function onAppBackgrounded() {
    console.log('� App backgrounded - adjusting connection monitoring');
    
    if (isCordova) {
        // Cordova apps can maintain connections better in background
        console.log('📱 Cordova detected - using enhanced background mode');
        // Reduce heartbeat frequency to save battery
        if (connectionMonitor) {
            clearInterval(connectionMonitor);
            // Check every 60 seconds instead of 15 when backgrounded
            connectionMonitor = setInterval(async () => {
                await checkConnectionHealth();
            }, 60000);
        }
    } else {
        // Web browsers will likely pause execution
        console.log('🌐 Browser detected - preparing for potential connection pause');
    }
}

/**
 * Handle app returning to foreground  
 */
function onAppForegrounded() {
    console.log('🔄 App foregrounded - restoring full connection monitoring');
    
    // Always restart normal monitoring frequency when returning
    if (connectionMonitor) {
        clearInterval(connectionMonitor);
        connectionMonitor = setInterval(async () => {
            await checkConnectionHealth();
        }, 15000);
    }
    
    // Check connection health immediately when returning to foreground
    setTimeout(async () => {
        if (currentGameSession) {
            console.log('🔍 Checking connection after returning to foreground...');
            await checkConnectionHealth();
        }
    }, 2000);
}

/**
 * Monitor network status changes
 * Enhanced for Cordova network detection
 */
function setupNetworkMonitoring() {
    console.log(`🌐 Setting up network monitoring for ${isCordova ? 'Cordova' : 'browser'}`);
    
    // Standard browser network monitoring
    if ('navigator' in window && 'onLine' in navigator) {
        const handleOnline = async () => {
            console.log('🌐 Network connection restored (browser API)');
            if (currentGameSession) {
                setTimeout(async () => {
                    await checkConnectionHealth();
                }, 3000);
            }
        };
        
        const handleOffline = () => {
            console.log('📵 Network connection lost (browser API)');
            showConnectionStatus('Network offline', 'warning');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    }
    
    // Enhanced Cordova network monitoring
    if (isCordova) {
        document.addEventListener('deviceready', () => {
            // Cordova Network Information plugin
            if (typeof navigator.connection !== 'undefined') {
                console.log('📱 Cordova network plugin detected');
                
                const checkNetworkState = () => {
                    const networkState = navigator.connection.type;
                    console.log(`📡 Network state: ${networkState}`);
                    
                    if (networkState === 'none') {
                        showConnectionStatus('No network connection', 'error');
                    } else if (networkState === 'wifi' || networkState === 'cellular') {
                        showConnectionStatus('Network connected', 'success');
                        // Check connection health when network comes back
                        setTimeout(async () => {
                            if (currentGameSession) {
                                await checkConnectionHealth();
                            }
                        }, 2000);
                    }
                };
                
                // Monitor network changes
                document.addEventListener('online', checkNetworkState, false);
                document.addEventListener('offline', checkNetworkState, false);
                
                // Initial network state check
                checkNetworkState();
            }
        }, false);
    }
}

/**
 * Stop the connection monitor
 */
function stopConnectionMonitor() {
    if (connectionMonitor) {
        clearInterval(connectionMonitor);
        connectionMonitor = null;
    }
    
    if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
    }
    
    console.log('🛑 Connection monitor stopped');
}

/**
 * Show connection status to user (if UI elements exist)
 */
function showConnectionStatus(message, type = 'info') {
    // Try multiple possible status element IDs
    const statusElements = [
        'connection-status',
        'realtime-status', 
        'chat-status',
        'online-status'
    ];
    
    for (const elementId of statusElements) {
        const element = document.getElementById(elementId);
        if (element) {
            element.className = `status ${type}`;
            element.textContent = message;
            break;
        }
    }
    
    // Also log to console
    const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`${emoji} Connection Status: ${message}`);
}

/**
 * Disconnect from current session and clean up
 */
function disconnectFromSession() {
    console.log('🔌 Disconnecting from session...');
    
    // Stop connection monitoring
    stopConnectionMonitor();
    
    // Unsubscribe from real-time messages
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }
    
    // Clear session data
    currentGameSession = null;
    window.playerName = '';
    window.isStoryteller = false;
    
    // Reset reconnection state
    reconnectAttempts = 0;
    isReconnecting = false;
    lastHeartbeat = 0;
    
    // Update UI
    showConnectionStatus('Disconnected', 'info');
    
    console.log('✅ Disconnected and cleaned up');
}

async function createNewGameSession(customSessionCode = null) {
    if (!supabase) {
        showNotification('Supabase not initialized', 'error');
        return;
    }
    
    const dmNameInput = document.getElementById('storyteller-name');
    const sessionCodeInput = document.getElementById('new-session-code');
    
    if (!dmNameInput) {
        console.error('Storyteller name input not found');
        showNotification('Error: Unable to find name input field', 'error');
        return;
    }
    
    const sessionCode = customSessionCode || (sessionCodeInput ? sessionCodeInput.value.trim().toUpperCase() : null) || generateSessionCode();
    
    const dmName = dmNameInput.value.trim();
    
    if (!dmName) {
        showNotification('Please enter your name first', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert([{ 
                session_code: sessionCode, 
                dm_name: dmName 
            }])
            .select();
            
        if (error) throw error;
        
        currentGameSession = data[0];
        playerName = dmName;
        isStoryTeller = true;
        
        // Update UI elements that exist in the unified interface
        const currentSessionCode = document.getElementById('current-session-code');
        if (currentSessionCode) {
            currentSessionCode.textContent = data[0].session_code;
        }
        
        const chatSessionControls = document.getElementById('chat-session-controls');
        if (chatSessionControls) {
            chatSessionControls.style.display = 'none';
        }
        
        const chatMessagesContainer = document.getElementById('chat-messages-container');
        if (chatMessagesContainer) {
            chatMessagesContainer.style.display = 'block';
        }
        
        // Update player URL display
        const playerUrlInput = document.getElementById('player-url');
        if (playerUrlInput) {
            // Use the utility function from config manager for consistent URL generation
            let playerUrl;
            if (window.supabaseConfigManager && window.supabaseConfigManager.generateSessionUrl) {
                playerUrl = window.supabaseConfigManager.generateSessionUrl(data[0].session_code);
            } else {
                // Fallback to direct generation if config manager not available
                const baseUrl = `${window.location.origin}${window.location.pathname}`;
                playerUrl = `${baseUrl}?session=${data[0].session_code}`;
            }
            
            playerUrlInput.value = playerUrl;
            console.log('Generated player URL:', playerUrl);
        }
        
        // Update chat status if element exists
        const statusElement = document.getElementById('chat-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="status-dot connected"></span>
                <span class="status-text">Connected</span>
            `;
        }
        
        // Subscribe to real-time messages for this session
        subscribeToSession(data[0].session_code);
        
        const successMessage = `Session "${data[0].session_code}" created successfully! Player URL generated.`;
        if (typeof showNotification === 'function') {
            showNotification(successMessage, 'success');
        } else {
            alert(successMessage);
        }
        console.log('Game session created:', data[0].session_code);
        
    } catch (error) {
        console.error('Error creating session:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Session code being used:', sessionCode);
        
        // Check if this is a duplicate session code error
        if (error.code === '23505' && error.message.includes('session_code')) {
            console.log('Session code already exists, joining existing session instead...');
            
            try {
                // Join the existing session instead - use the same sessionCode variable
                const { data: existingSession, error: joinError } = await supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('session_code', sessionCode)
                    .single();
                
                if (joinError) throw joinError;
                
                // Set up as if we joined the session
                currentGameSession = existingSession;
                playerName = dmName;
                isStoryTeller = true;
                
                // Update UI elements
                const currentSessionCodeElement = document.getElementById('current-session-code');
                if (currentSessionCodeElement) {
                    currentSessionCodeElement.textContent = existingSession.session_code;
                }
                
                const chatSessionControls = document.getElementById('chat-session-controls');
                if (chatSessionControls) {
                    chatSessionControls.style.display = 'none';
                }
                
                const chatMessagesContainer = document.getElementById('chat-messages-container');
                if (chatMessagesContainer) {
                    chatMessagesContainer.style.display = 'block';
                }
                
                // Update player URL display
                const playerUrlInput = document.getElementById('player-url');
                if (playerUrlInput) {
                    let playerUrl;
                    if (window.supabaseConfigManager && window.supabaseConfigManager.generateSessionUrl) {
                        playerUrl = window.supabaseConfigManager.generateSessionUrl(existingSession.session_code);
                    } else {
                        const baseUrl = `${window.location.origin}${window.location.pathname}`;
                        playerUrl = `${baseUrl}?session=${existingSession.session_code}`;
                    }
                    
                    playerUrlInput.value = playerUrl;
                    console.log('Generated player URL:', playerUrl);
                }
                
                // Update chat status
                const statusElement = document.getElementById('chat-status');
                if (statusElement) {
                    statusElement.innerHTML = `
                        <span class="status-dot connected"></span>
                        <span class="status-text">Connected</span>
                    `;
                }
                
                // Subscribe to real-time messages for this session
                subscribeToSession(existingSession.session_code);
                
                const successMessage = `Joined existing session "${existingSession.session_code}"! Player URL generated.`;
                if (typeof showNotification === 'function') {
                    showNotification(successMessage, 'success');
                } else {
                    alert(successMessage);
                }
                console.log('Joined existing session:', existingSession.session_code);
                
            } catch (joinError) {
                console.error('Error joining existing session:', joinError);
                const errorMessage = 'Failed to join existing session: ' + (joinError.message || 'Unknown error');
                if (typeof showNotification === 'function') {
                    showNotification(errorMessage, 'error');
                } else {
                    alert(errorMessage);
                }
            }
        } else {
            // Handle other types of errors
            const errorMessage = 'Failed to create session: ' + (error.message || 'Unknown error');
            if (typeof showNotification === 'function') {
                showNotification(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        }
    }
}

async function joinGameSession() {
    if (!supabase) {
        showNotification('Supabase not initialized', 'error');
        return;
    }
    
    const nameInput = document.getElementById('storyteller-name');
    const sessionCodeInput = document.getElementById('new-session-code');
    
    if (!nameInput || !sessionCodeInput) {
        console.error('Required input elements not found');
        showNotification('Error: Unable to find input fields', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const sessionCode = sessionCodeInput.value.trim().toUpperCase();
    
    if (!name || !sessionCode) {
        showNotification('Please enter your name and session code', 'error');
        return;
    }
    
    if (sessionCode.length > 10) {
        showNotification('Session code must be 10 characters or less', 'error');
        return;
    }
    
    try {
        // Check if session exists
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .eq('active', true)
            .single();
            
        if (sessionError || !session) {
            showNotification('Session not found or inactive', 'error');
            return;
        }
        
        playerName = name;
        window.playerName = name; // Sync with global
        // In StoryTeller interface, always set as storyteller, preserve existing setting for others
        isStoryTeller = window.isStoryTeller || (role === 'storyteller');
        window.isStoryTeller = window.isStoryTeller || (role === 'storyteller'); // Sync with global
        currentGameSession = sessionCode;
        
        // Send join message
        await sendSystemMessage(`${playerName} joined as ${isStoryTeller ? 'Story Teller' : 'Player'}`);
        
        // Set up real-time listening for this session
        subscribeToSession(sessionCode);
        
        // Update UI
        updateConnectionStatus('connected');
        showChatInterface();
        
        if (isStoryTeller) {
            showGameDataCard();
            addStoryTellerQuickActions();
        } else {
            addPlayerQuickActions();
        }
        
        showNotification(`Connected to session: ${sessionCode}`, 'success');
        
    } catch (error) {
        console.error('Error joining session:', error);
        showNotification('Failed to join session', 'error');
    }
}

async function leaveGameSession() {
    if (currentGameSession && currentGameSession.code && currentGameSession.code.length <= 10) {
        // Add a fun snarky disconnect message
        const snarkMessages = [
            "🏨 You rest for the night in a safe room...",
            "🚪 Have fun with real life! (Warning: No respawns available)",
            "💤 Logging out... Dream of electric sheep and loot drops",
            "🎭 The Storyteller grants you temporary immunity from plot hooks",
            "🏃‍♂️ Disconnecting... May your real-world stats be ever in your favor!"
        ];
        const randomMessage = snarkMessages[Math.floor(Math.random() * snarkMessages.length)];
        
        try {
            await sendSystemMessage(randomMessage);
        } catch (error) {
            console.log('Could not send disconnect message:', error);
        }
        
        if (messagesSubscription) {
            console.log('🔌 Unsubscribing from real-time messages...');
            messagesSubscription.unsubscribe();
            messagesSubscription = null;
        }
    }
    
    const playerDisplayName = window.playerName || 'Player';
    const sessionCode = currentGameSession ? currentGameSession.code : 'Unknown';
    
    console.log(`🚪 ${playerDisplayName} has left the chat session: ${sessionCode}`);
    
    currentGameSession = null;
    updateConnectionStatus('offline');
    clearChatMessages(); // Clear messages on disconnect
    hideChatInterface();
    hideGameDataCard();
    
    showNotification(`${playerDisplayName} has left the chat`, 'success');
    console.log('✅ Session disconnect complete - UI reset to connection setup');
}

// ========================================
// REAL-TIME MESSAGING
// ========================================
function subscribeToSession(sessionCode) {
    if (window.showDebug) {
        if (window.showDebug) console.log('🔍 DEBUG - Setting up real-time subscription for session:', sessionCode);
        if (window.showDebug) console.log('🔍 DEBUG - Current player name:', window.playerName);
        if (window.showDebug) console.log('🔍 DEBUG - Is storyteller:', window.isStoryTeller);
    }
    
    if (messagesSubscription) {
        if (window.showDebug) console.log('🔍 DEBUG - Unsubscribing from previous subscription');
        messagesSubscription.unsubscribe();
    }
    
    messagesSubscription = supabase
        .channel(`game-session-${sessionCode}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'game_messages',
                filter: `session_code=eq.${sessionCode}`
            }, 
            (payload) => {
                if (window.showDebug) {
                    if (window.showDebug) console.log('🔍 DEBUG - Real-time message received:', payload);
                    if (window.showDebug) console.log('🔍 DEBUG - Message session_code:', payload.new.session_code);
                    if (window.showDebug) console.log('🔍 DEBUG - Expected session_code:', sessionCode);
                }
                
                // Update heartbeat timestamp on any message received
                lastHeartbeat = Date.now();
                
                // Handle the message
                handleIncomingMessage(payload.new);
            }
        )
        .subscribe((status) => {
            if (window.showDebug) console.log('🔍 DEBUG - Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
                lastHeartbeat = Date.now();
                showConnectionStatus('Connected', 'success');
                if (window.showDebug) console.log('🔍 DEBUG - Successfully subscribed to session:', sessionCode);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                showConnectionStatus('Connection issues detected', 'warning');
                if (window.showDebug) console.log('🔍 DEBUG - Subscription error for session:', sessionCode);
                // The connection monitor will handle reconnection
            }
        });
        
    // Load recent messages
    loadRecentMessages(sessionCode);
}

// Alias for backward compatibility and fullSupabaseConnect
async function subscribeToGameMessages(sessionCode) {
    return subscribeToSession(sessionCode);
}

async function loadRecentMessages(sessionCode) {
    try {
        const { data: messages, error } = await supabase
            .from('game_messages')
            .select('*')
            .eq('session_code', sessionCode)
            .order('created_at', { ascending: true })
            .limit(50); // Last 50 messages
            
        if (error) throw error;
        
        // Clear existing messages
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Display each message (filter out heartbeat messages)
        messages.forEach(message => {
            // Filter out heartbeat messages (don't display them)
            if (message.message_type === 'heartbeat' || message.player_name === 'Heartbeat') {
                return; // Skip heartbeat messages
            }
            displayChatMessage(message);
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Get connected players from recent activity and update the UI
async function updateConnectedPlayersList() {
    if (!supabase || !currentGameSession) return;
    
    try {
        // Get unique players from recent messages (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
        
        const { data: messages, error } = await supabase
            .from('game_messages')
            .select('player_name, is_storyteller, created_at')
            .eq('session_code', currentGameSession.session_code)
            .gte('created_at', fiveMinutesAgo)
            .neq('player_name', 'System')
            .neq('player_name', 'Heartbeat')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Get unique players
        const uniquePlayers = [];
        const seenPlayers = new Set();
        
        messages.forEach(message => {
            if (message.player_name && !seenPlayers.has(message.player_name)) {
                uniquePlayers.push({
                    name: message.player_name,
                    is_storyteller: message.is_storyteller,
                    last_seen: message.created_at
                });
                seenPlayers.add(message.player_name);
            }
        });
        
        if (window.showDebug) console.log('🔍 DEBUG - Connected players found:', uniquePlayers);
        
        // Update the UI if the function exists
        if (typeof window.updateConnectedPlayers === 'function') {
            window.updateConnectedPlayers(uniquePlayers);
        }
        
    } catch (error) {
        console.warn('⚠️ Failed to update connected players:', error.message);
    }
}

async function sendChatMessageAsync(messageText = null) {
    if (window.showDebug) {
        if (window.showDebug) console.log('🔍 DEBUG - Sending message:', messageText);
        if (window.showDebug) console.log('🔍 DEBUG - Supabase available:', !!supabase);
        if (window.showDebug) console.log('🔍 DEBUG - Current session:', currentGameSession);
        if (window.showDebug) console.log('🔍 DEBUG - window.playerName:', window.playerName);
        if (window.showDebug) console.log('🔍 DEBUG - local playerName:', playerName);
        if (window.showDebug) console.log('🔍 DEBUG - window.isStoryTeller:', window.isStoryTeller);
        if (window.showDebug) console.log('🔍 DEBUG - local isStoryTeller:', isStoryTeller);
    }
    
    if (!supabase) {
        console.error('Supabase not initialized');
        return;
    }
    
    if (!currentGameSession) {
        console.error('No active game session');
        return;
    }
    
    if (!messageText) {
        console.error('No message text provided');
        return;
    }
    
    try {
        // Debug the storyteller flag
        if (window.showDebug) {
            console.log('🔍 DEBUG - Storyteller flags:', {
                'window.isStoryTeller': window.isStoryTeller,
                'window.isStoryteller': window.isStoryteller,
                'isStoryTeller param': isStoryTeller,
                'final value': window.isStoryTeller || isStoryTeller || false
            });
        }
        
        const messageData = {
            session_code: currentGameSession.session_code,
            player_name: window.playerName || playerName || 'Unknown Player',
            message_type: 'chat',
            message_text: messageText,
            is_storyteller: window.isStoryTeller || isStoryTeller || false
        };
        
        if (window.showDebug) console.log('🔍 DEBUG - Inserting message:', messageData);
        
        const { data, error } = await supabase
            .from('game_messages')
            .insert([messageData])
            .select();
            
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('Message sent successfully:', data);
        
    } catch (error) {
        console.error('Error sending message:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to send message: ' + error.message, 'error');
        }
    }
}

async function sendGameCommand(command, data) {
    if (!supabase || !currentGameSession) return;
    
    try {
        const { error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession,
                player_name: playerName,
                message_type: 'game_command',
                message_text: `🎲 ${command}: ${JSON.stringify(data)}`,
                game_data: { command, data },
                is_storyteller: isStoryTeller
            }]);
            
        if (error) throw error;
        
    } catch (error) {
        console.error('Error sending game command:', error);
        showNotification('Failed to send game command', 'error');
    }
}

async function sendGameResponse(responseText) {
    if (!supabase || !currentGameSession) return;
    
    try {
        const { error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession,
                player_name: 'StoryTeller System',
                message_type: 'game_response',
                message_text: responseText,
                is_storyteller: true
            }]);
            
        if (error) throw error;
        
    } catch (error) {
        console.error('Error sending game response:', error);
    }
}

// ========================================
// MESSAGE PROCESSING
// ========================================
async function handleIncomingMessage(message) {
    if (window.showDebug) {
        if (window.showDebug) console.log('🔍 DEBUG - Handling incoming message:', message);
        if (window.showDebug) console.log('🔍 DEBUG - Message is_storyteller:', message.is_storyteller);
        if (window.showDebug) console.log('🔍 DEBUG - Message player_name:', message.player_name);
        if (window.showDebug) console.log('🔍 DEBUG - Current window.playerName:', window.playerName);
    }
    
    // Add specific debugging for all messages to help diagnose AVATAR_URL issue
    console.log('📨 Incoming message structure:');
    console.log('   - message_type:', message.message_type);
    console.log('   - message_text:', message.message_text);
    console.log('   - player_name:', message.player_name);
    console.log('   - is_storyteller:', message.is_storyteller);
    console.log('   - startsWith AVATAR_URL check:', message.message_text?.startsWith('AVATAR_URL:'));
    
    // Filter out heartbeat messages (don't display them)
    if (message.message_type === 'heartbeat' || message.player_name === 'Heartbeat') {
        if (window.showDebug) console.log('📡 Heartbeat received, connection healthy');
        return;
    }
    
    // Check if this is a CHARACTER SYNC command
    if (message.message_type === 'chat' && message.message_text.startsWith('CHAR_')) {
        console.log('🔄 Detected CHARACTER SYNC command in chat:', message.message_text);
        
        // Process character sync command
        if (window.v4CharacterSyncManager) {
            const handled = await window.v4CharacterSyncManager.handleCharacterSyncMessage(
                message.message_text, 
                message.player_name
            );
            
            if (handled) {
                console.log('🔇 Character sync command processed silently');
                return; // Don't display in chat
            }
        }
    }
    
    // Check if this is a command disguised as a chat message
    if (message.message_type === 'chat' && message.message_text.startsWith('ATTACK:')) {
        console.log('Detected ATTACK command in chat');
        
        if (isStoryTeller) {
            // Parse and process the attack command
            processAttackCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - we'll show a nicer message instead
        return;
    }
    
    // Check if this is an AVATAR_URL command
    if (message.message_type === 'chat' && message.message_text.startsWith('AVATAR_URL:')) {
        console.log('🎭 Detected AVATAR_URL command in chat:', message.message_text);
        console.log('🎭 Message from player:', message.player_name);
        console.log('🎭 Current player:', window.playerName || playerName);
        console.log('🎭 ChatCommandParser available:', !!window.chatCommandParser);
        
        // Process the avatar URL command using the chatCommandParser
        if (window.chatCommandParser) {
            try {
                const result = await window.chatCommandParser.processMessage(message.message_text, message.player_name);
                if (result && result.success) {
                    console.log('✅ Avatar URL command processed successfully for:', message.player_name);
                    console.log('✅ Avatar URL:', result.details?.avatarUrl);
                    
                    // Cache the avatar for the sender (in case they want to see their own chip update)
                    if (result.details?.avatarUrl && window.chatCommandParser) {
                        window.chatCommandParser.playerAvatars.set(message.player_name, result.details.avatarUrl);
                        console.log('🔄 Manually cached avatar for:', message.player_name);
                    }
                    
                    // First trigger a refresh of connected players list (this will recreate chips with cached avatars)
                    console.log('🔄 Triggering connected players list refresh first');
                    if (window.updateConnectedPlayers) {
                        await new Promise(resolve => {
                            updateConnectedPlayersList();
                            setTimeout(resolve, 300); // Wait for chips to be created
                        });
                    }
                    
                    // Then force immediate chip update for this specific player (as backup)
                    if (window.chatCommandParser.updatePlayerChipAvatar) {
                        const avatarUrl = result.details?.avatarUrl;
                        if (avatarUrl) {
                            console.log('🔄 Double-checking chip update for:', message.player_name);
                            window.chatCommandParser.updatePlayerChipAvatar(message.player_name, avatarUrl);
                        }
                    }
                    
                } else {
                    console.warn('❌ Avatar URL command processing failed:', result);
                }
            } catch (error) {
                console.error('❌ Error processing AVATAR_URL command:', error);
            }
        } else {
            console.warn('❌ ChatCommandParser not available!');
        }
        
        console.log('🔇 AVATAR_URL command processed, returning early to hide from chat');
        // Don't display the raw command in chat
        return;
    }
    
    // Check if this is a DLCHAR command (Download Character)
    if (message.message_type === 'chat' && 
        (message.message_text.startsWith('DLCHAR:') || message.message_text.startsWith('/dlchar:'))) {
        console.log('📥 Detected DLCHAR command in chat:', message.message_text);
        
        // Process the DLCHAR command using the chatCommandParser
        if (window.chatCommandParser) {
            try {
                const result = await window.chatCommandParser.processMessage(message.message_text, message.player_name);
                if (result && result.success) {
                    console.log('✅ DLCHAR command processed successfully:', result.details?.characterName);
                    
                    // Display success message in chat
                    const successMessage = {
                        player_name: 'Character System',
                        message_text: result.message,
                        message_type: 'system',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(successMessage);
                } else {
                    console.warn('❌ DLCHAR command processing failed:', result);
                    
                    // Display error message in chat
                    const errorMessage = {
                        player_name: 'Character System',
                        message_text: `❌ ${result?.error || 'Character download failed'}`,
                        message_type: 'system',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(errorMessage);
                }
            } catch (error) {
                console.error('❌ Error processing DLCHAR command:', error);
                
                // Display error message in chat
                const errorMessage = {
                    player_name: 'Character System',
                    message_text: `❌ Character download error: ${error.message}`,
                    message_type: 'system',
                    is_storyteller: true,
                    created_at: new Date().toISOString()
                };
                displayChatMessage(errorMessage);
            }
        } else {
            console.warn('❌ ChatCommandParser not available for DLCHAR!');
        }
        
        console.log('🔇 DLCHAR command processed, returning early to hide from chat');
        // Don't display the raw command in chat
        return;
    }
    
    // Always display normal messages in chat
    displayChatMessage(message);
    
    // Don't process our own messages for game commands, but allow other processing
    const currentPlayerName = window.playerName || playerName;
    const isOwnMessage = message.player_name === currentPlayerName;
    
    if (isOwnMessage) {
        console.log('This is our own message, skipping game command processing but allowing effects');
    }
    
    // Check if this is a game command for Story Teller to process (skip for own messages)
    if (message.message_type === 'game_command' && 
        isStoryTeller && 
        !isOwnMessage &&
        document.getElementById('auto-process-toggle')?.checked) {
        processGameCommand(message);
    }
    
    // Show notification if not on chat tab
    const chatTab = document.getElementById('chat');
    const bottomSheet = document.getElementById('chat-bottom-sheet');
    
    // Extract message text for checking
    const messageText = typeof message === 'string' ? message : (message.message_text || '');
    
    // Only show notifications for NOTEs meant for this player
    const isPrivateNote = messageText.toLowerCase().includes(`note:${(window.networkPlayerName || '').toLowerCase()}:`);
    
    // Don't show notifications if chat is open (redundant)
    const isChatOpen = (chatTab && chatTab.classList.contains('active')) || 
                      (bottomSheet && bottomSheet.classList.contains('open'));
    
    if (isPrivateNote && !isChatOpen) {
        // Update FAB notification for private notes
        if (typeof window.updateFABNotification === 'function') {
            window.updateFABNotification();
        }
        
        // Optional: Show browser notification for important private notes
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Private Note Received', {
                body: `You have a private note from ${senderName || 'Storyteller'}`,
                icon: '/icon-192.png',
                silent: false
            });
        }
    }
    
    // Update connected players list (debounced)
    clearTimeout(window.playerUpdateTimeout);
    window.playerUpdateTimeout = setTimeout(() => {
        updateConnectedPlayersList();
    }, 1000); // Update after 1 second of no new messages
}

// ========================================
// COMMAND PROCESSING
// ========================================
function processAttackCommand(commandText, playerName) {
    console.log('Processing ATTACK command:', commandText);
    
    // Parse ATTACK:PlayerName:AttackRoll:Damage:WeaponName
    const parts = commandText.split(':');
    if (parts.length < 5) {
        console.error('Invalid ATTACK command format');
        return;
    }
    
    const [cmd, targetPlayer, attackRoll, damage, weaponName] = parts;
    
    // Create a user-friendly message to display
    const displayMessage = `${targetPlayer} attacks with ${weaponName}! (Roll: ${attackRoll}, Damage: ${damage})`;
    
    // Display the nice message instead of the raw command
    const fakeMessage = {
        player_name: 'Combat System',
        message_text: displayMessage,
        message_type: 'system',
        is_storyteller: true,
        created_at: new Date().toISOString()
    };
    displayChatMessage(fakeMessage);
    
    // Process the attack if combat is active
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        console.log('Processing attack in active combat');
        
        // Auto-fill combat form
        const attackingPlayerEl = document.getElementById('attacking-player');
        const attackRollEl = document.getElementById('attack-roll');
        const damageRollEl = document.getElementById('damage-roll');
        
        if (attackingPlayerEl) attackingPlayerEl.value = targetPlayer;
        if (attackRollEl) attackRollEl.value = attackRoll;
        if (damageRollEl) damageRollEl.value = damage;
        
        // Auto-resolve the attack
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                // Send result back to chat
                const enemy = currentCombat.currentEnemy;
                const hit = parseInt(attackRoll) >= enemy.ac;
                
                if (hit) {
                    // Create comprehensive hit message
                    const hitMessage = `⚔️ ${targetPlayer}'s ${weaponName} hit for ${damage} damage! ${enemy.name} has ${enemy.currentHp}/${enemy.maxHp} HP remaining.`;
                    
                    const resultMessage = {
                        player_name: 'Combat System',
                        message_text: hitMessage,
                        message_type: 'combat_result',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(resultMessage);
                } else {
                    // Miss message
                    const missMessage = {
                        player_name: 'Combat System',
                        message_text: `⚔️ ${targetPlayer}'s ${weaponName} attack missed!`,
                        message_type: 'combat_result',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(missMessage);
                }
            }
        }, 100);
    } else {
        console.log('No active combat - attack command ignored');
        const warningMessage = {
            player_name: 'Combat System',
            message_text: '⚠️ No active combat session. Start combat first!',
            message_type: 'warning',
            is_storyteller: true,
            created_at: new Date().toISOString()
        };
        displayChatMessage(warningMessage);
    }
}

function processGameCommand(message) {
    if (!message.game_data) return;
    
    const { command, data } = message.game_data;
    const cmdPlayerName = message.player_name;
    
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
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll;
        document.getElementById('damage-roll').value = damage;
        
        // Auto-resolve the attack
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                // Send result back to chat
                const enemy = currentCombat.currentEnemy;
                const hit = attackRoll >= enemy.ac;
                const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
                
                sendGameResponse(`${playerName}'s attack with ${weaponName}: ${result}`);
            }
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
    if (typeof currentCombat !== 'undefined' && currentCombat.active && typeof addToCombatLog === 'function') {
        addToCombatLog(message);
    }
}

function processPlayerSpell(data, playerName) {
    const { spellName, attackRoll, damage, mpCost } = data;
    
    // Process similar to attack
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll || 0;
        document.getElementById('damage-roll').value = damage || 0;
        
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                const enemy = currentCombat.currentEnemy;
                const hit = attackRoll ? attackRoll >= enemy.ac : true;
                const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
                
                sendGameResponse(`${playerName}'s spell ${spellName}: ${result} (${mpCost} MP spent)`);
            }
        }, 100);
    } else {
        sendGameResponse(`${playerName} cast ${spellName} (${attackRoll || 'auto'} to hit, ${damage} damage, ${mpCost} MP) - No active combat`);
    }
}

// ========================================
// UI HELPERS (reuse from original chat system)
// ========================================
function displayChatMessage(message) {
    console.log('🔍 DEBUG - displayChatMessage called with:', message);
    
    // Handle null messages (silent commands like NOTE)
    if (!message) {
        console.log('🔍 DEBUG - Message is null, skipping display');
        return;
    }
    
    // Filter out character sync messages - these should be handled silently
    if (message.message_text && typeof message.message_text === 'string') {
        if (message.message_text.startsWith('CHAR_ANNOUNCE:') || 
            message.message_text.startsWith('CHAR_REQUEST:') || 
            message.message_text.startsWith('CHAR_DATA:')) {
            console.log('🔍 DEBUG - Filtering out character sync message:', message.message_text.substring(0, 20) + '...');
            
            // Process the sync message silently
            if (window.v4CharacterSyncManager) {
                window.v4CharacterSyncManager.handleCharacterSyncMessage(message.message_text, message.player_name);
            }
            return; // Don't display in chat
        }
    }
    
    // Use the main page's addChatMessage function for consistency
    if (window.addChatMessage) {
        let messageType = 'player';
        if (message.message_type === 'system') messageType = 'system';
        if (message.is_storyteller) messageType = 'storyteller';
        
        console.log('🔍 DEBUG - Calling window.addChatMessage with type:', messageType);
        window.addChatMessage(message.message_text, messageType, message.player_name);
        return;
    }
    
    // Fallback if addChatMessage doesn't exist
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.message_type}`;
    
    let senderClass = '';
    if (message.is_storyteller) senderClass = 'storyteller';
    if (message.message_type === 'system') senderClass = 'system';
    if (message.message_type === 'game_response') senderClass = 'game-response';
    
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender ${senderClass}">${message.player_name || 'System'}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${message.message_text}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check for session parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionCode = urlParams.get('session');
    
    if (sessionCode) {
        // Auto-populate session code field
        setTimeout(() => {
            const sessionCodeInput = document.getElementById('new-session-code');
            if (sessionCodeInput) {
                sessionCodeInput.value = sessionCode.toUpperCase();
            }
        }, 500);
    }
    
    // Wait for main app to initialize
    setTimeout(() => {
        if (typeof createChatSystem === 'function') {
            createChatSystem();
        }
        
        // Initialize Supabase if configured
        if (typeof window.supabase !== 'undefined') {
            initializeSupabase();
        } else {
            console.warn('Supabase library not loaded. Please include the Supabase JavaScript library.');
        }
    }, 1000);
});

// ========================================
// UTILITY FUNCTIONS
// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateSessionCode() {
    // Generate a 6-character code (well within 10 char limit)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code.length > 10 ? code.substring(0, 10) : code;
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');
        
        if (dot) dot.className = `status-dot ${status}`;
        if (text) text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function clearChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
}

function showChatInterface() {
    const connectionSetup = document.getElementById('connection-setup');
    const chatInterface = document.getElementById('chat-interface');
    if (connectionSetup) connectionSetup.style.display = 'none';
    if (chatInterface) chatInterface.style.display = 'block';
}

function hideChatInterface() {
    const connectionSetup = document.getElementById('connection-setup');
    const chatInterface = document.getElementById('chat-interface');
    if (connectionSetup) connectionSetup.style.display = 'block';
    if (chatInterface) chatInterface.style.display = 'none';
}

function showGameDataCard() {
    const gameDataCard = document.getElementById('game-data-card');
    if (gameDataCard) gameDataCard.style.display = 'block';
}

function hideGameDataCard() {
    const gameDataCard = document.getElementById('game-data-card');
    if (gameDataCard) gameDataCard.style.display = 'none';
}

// Export functions for use by other modules
if (typeof window !== 'undefined') {
    window.supabaseChat = {
        createNewGameSession,
        joinGameSession,
        leaveGameSession,
        sendChatMessage,
        sendGameCommand,
        sendGameResponse,
        isConnected: () => currentGameSession !== null,
        getCurrentSession: () => currentGameSession
    };
    
    // Global functions for HTML onclick handlers
    window.startGameSession = startGameSession;
    window.joinGameSession = joinGameSession;
    window.leaveGameSession = leaveGameSession;
    window.sendChatMessage = sendChatMessage;
    window.updateConnectedPlayersList = updateConnectedPlayersList;
    
    // Debug function to check cached avatars
    window.checkCachedAvatars = function() {
        console.log('🔍 === AVATAR DEBUG INFO ===');
        console.log('🔍 ChatCommandParser available:', !!window.chatCommandParser);
        
        if (window.chatCommandParser) {
            // Get all player chips
            const playerChips = document.querySelectorAll('.player-chip');
            console.log('🔍 Found player chips:', playerChips.length);
            
            playerChips.forEach((chip, index) => {
                const nameElement = chip.querySelector('.chip-name');
                const avatarElement = chip.querySelector('.chip-avatar');
                const playerName = nameElement ? nameElement.textContent : 'Unknown';
                const cachedUrl = window.chatCommandParser.getCachedAvatarUrl(playerName);
                const hasImage = avatarElement ? avatarElement.querySelector('img') !== null : false;
                
                console.log(`🔍 Chip ${index}: ${playerName}`);
                console.log(`    - Cached URL: ${cachedUrl || 'None'}`);
                console.log(`    - Has image: ${hasImage}`);
                console.log(`    - Avatar content: ${avatarElement ? avatarElement.innerHTML.substring(0, 50) + '...' : 'None'}`);
            });
        }
        
        console.log('🔍 === END DEBUG INFO ===');
    };
}
