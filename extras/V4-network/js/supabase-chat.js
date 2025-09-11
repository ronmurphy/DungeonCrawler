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

function sendChatMessage() {
    const messageInput = document.getElementById('chat-message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    // Clear input
    messageInput.value = '';
    
    // Send the message using the existing async function
    sendChatMessageAsync(messageText);
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
function handleIncomingMessage(message) {
    if (window.showDebug) {
        if (window.showDebug) console.log('🔍 DEBUG - Handling incoming message:', message);
        if (window.showDebug) console.log('🔍 DEBUG - Message is_storyteller:', message.is_storyteller);
        if (window.showDebug) console.log('🔍 DEBUG - Message player_name:', message.player_name);
        if (window.showDebug) console.log('🔍 DEBUG - Current window.playerName:', window.playerName);
    }
    
    // Filter out heartbeat messages (don't display them)
    if (message.message_type === 'heartbeat' || message.player_name === 'Heartbeat') {
        if (window.showDebug) console.log('📡 Heartbeat received, connection healthy');
        return;
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
    
    // Check if this is an INITIATIVE command
    if (message.message_type === 'chat' && message.message_text.startsWith('INITIATIVE:')) {
        console.log('Detected INITIATIVE command in chat');
        
        if (isStoryTeller) {
            // Parse and process the initiative command
            processInitiativeCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - we'll show a nicer message instead
        return;
    }
    
    // Check if this is a SPELL command
    if (message.message_type === 'chat' && message.message_text.startsWith('SPELL:')) {
        console.log('Detected SPELL command in chat');
        
        if (isStoryTeller) {
            // Parse and process the spell command
            processSpellCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - we'll show a nicer message instead
        return;
    }
    
    // Check if this is a ROLL command (skills)
    if (message.message_type === 'chat' && message.message_text.startsWith('ROLL:')) {
        console.log('Detected ROLL command in chat');
        
        if (isStoryTeller) {
            // Parse and process the roll command
            processRollCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - we'll show a nicer message instead
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
    if (chatTab && !chatTab.classList.contains('active')) {
        showChatNotification();
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

function processInitiativeCommand(commandText, playerName) {
    console.log('Processing INITIATIVE command:', commandText);
    
    // Parse INITIATIVE:PlayerName:Roll:Details
    const parts = commandText.split(':');
    if (parts.length < 3) {
        console.error('Invalid INITIATIVE command format');
        return;
    }
    
    const [cmd, initiativePlayerName, roll, details] = parts;
    
    // Create a nice display message
    const displayMessage = `🎲 ${initiativePlayerName} rolled initiative: ${roll}${details ? ` (${details})` : ''}`;
    
    // Display the nice message instead of the raw command
    const fakeMessage = {
        player_name: 'Initiative System',
        message_text: displayMessage,
        message_type: 'initiative',
        is_storyteller: true,
        created_at: new Date().toISOString()
    };
    displayChatMessage(fakeMessage);
    
    // If there's an initiative tracker in the Story Teller interface, update it
    if (typeof addToInitiativeTracker === 'function') {
        addToInitiativeTracker(initiativePlayerName, parseInt(roll), details);
    }
    
    // Log the initiative roll
    console.log(`Initiative: ${initiativePlayerName} rolled ${roll}`);
}

function processSpellCommand(commandText, playerName) {
    console.log('Processing SPELL command:', commandText);
    
    // Parse SPELL:PlayerName:AttackRoll:Damage:SpellName:MPCost
    const parts = commandText.split(':');
    if (parts.length < 5) {
        console.error('Invalid SPELL command format');
        return;
    }
    
    const [cmd, spellPlayerName, attackRoll, damage, spellName, mpCost] = parts;
    
    // Create a nice display message
    const attackText = attackRoll && attackRoll !== 'auto' ? ` (${attackRoll} to hit)` : '';
    const damageText = damage && damage !== '0' ? ` for ${damage} damage` : '';
    const displayMessage = `✨ ${spellPlayerName} cast ${spellName}${attackText}${damageText} (${mpCost || 0} MP)`;
    
    // Display the nice message instead of the raw command
    const fakeMessage = {
        player_name: 'Magic System',
        message_text: displayMessage,
        message_type: 'spell',
        is_storyteller: true,
        created_at: new Date().toISOString()
    };
    displayChatMessage(fakeMessage);
    
    // Log the spell cast
    console.log(`Spell: ${spellPlayerName} cast ${spellName}`);
}

function processRollCommand(commandText, playerName) {
    console.log('Processing ROLL command:', commandText);
    
    // Parse ROLL:PlayerName:SkillName:Result:Stat
    const parts = commandText.split(':');
    if (parts.length < 4) {
        console.error('Invalid ROLL command format');
        return;
    }
    
    const [cmd, rollPlayerName, skillName, result, stat] = parts;
    
    // Create a nice display message
    const statText = stat ? ` (${stat})` : '';
    const displayMessage = `🎲 ${rollPlayerName} rolled ${skillName}${statText}: ${result}`;
    
    // Display the nice message instead of the raw command
    const fakeMessage = {
        player_name: 'Skill System',
        message_text: displayMessage,
        message_type: 'skill',
        is_storyteller: true,
        created_at: new Date().toISOString()
    };
    displayChatMessage(fakeMessage);
    
    // Log the skill roll
    console.log(`Skill Roll: ${rollPlayerName} rolled ${skillName} (${result})`);
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
    
    // Check for combat start messages and show notification
    if (message.message_text && message.message_text.includes('📢 Combat') && message.message_text.includes('begun')) {
        // Show prominent combat notification
        if (typeof showNotification === 'function') {
            showNotification('combat', '⚔️ Combat Started!', 
                'Roll initiative using your DEX button', 
                'Click DEX attribute to join combat');
        }
        
        // Set combat mode active (if function exists)
        if (typeof setCombatMode === 'function') {
            setCombatMode(true);
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
    
    // Parse player name for accent color (format: "playername|#hexcolor")
    let playerDisplayName = message.player_name || 'System';
    let playerColor = '';
    
    if (playerDisplayName.includes('|')) {
        const parts = playerDisplayName.split('|');
        playerDisplayName = parts[0];
        playerColor = parts[1];
        
        // Validate hex color format
        if (playerColor && !playerColor.match(/^#[0-9A-Fa-f]{6}$/)) {
            playerColor = ''; // Invalid color, use default
        }
    }
    
    // Apply color styling if valid color provided
    const colorStyle = playerColor ? `style="color: ${playerColor}; font-weight: bold;"` : '';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender ${senderClass}" ${colorStyle}>${playerDisplayName}</span>
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
        sendGameResponse
    };
    
    // Global functions for HTML onclick handlers
    window.startGameSession = startGameSession;
    window.joinGameSession = joinGameSession;
    window.leaveGameSession = leaveGameSession;
    window.sendChatMessage = sendChatMessage;
    window.updateConnectedPlayersList = updateConnectedPlayersList;
}
