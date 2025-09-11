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
        
        // Check and announce avatar URL after connection
        setTimeout(() => {
            checkAndAnnounceCurrentAvatar();
        }, 3000); // Give time for connected players update
        
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
        
        // Initialize character sync manager
        if (window.characterSyncManager) {
            window.characterSyncManager.initialize(playerName, sessionCode, isStoryteller);
            console.log('🔄 Character sync manager initialized');
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
        
        // Store connected players globally for player chips
        window.connectedPlayers = uniquePlayers;
        
        // Update the UI if the function exists
        if (typeof window.updateConnectedPlayers === 'function') {
            window.updateConnectedPlayers(uniquePlayers);
        }
        
        // Update player chips in chat panels
        updatePlayerChips('right'); // Update right panel chips
        updatePlayerChips('left');  // Update left panel chips if chat is loaded there
        
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
    
    // Check if this is a NOTE command
    if (message.message_type === 'chat' && message.message_text.startsWith('NOTE:')) {
        console.log('🔍 Detected NOTE command in chat:', message.message_text);
        
        // Process the note command
        processNoteCommand(message.message_text, message.player_name);
        
        // Don't display the raw command - process silently
        console.log('🔇 NOTE command processed silently, not displaying in chat');
        return;
    }

    // Check if this is an AVATAR_URL command
    if (message.message_type === 'chat' && message.message_text.startsWith('AVATAR_URL:')) {
        console.log('🎭 Detected AVATAR_URL command in chat:', message.message_text);
        
        // Process the command with the ChatCommandParser if available (like V4-network)
        if (window.chatCommandParser && typeof window.chatCommandParser.processMessage === 'function') {
            try {
                console.log('🎭 Using ChatCommandParser to process AVATAR_URL');
                const result = await window.chatCommandParser.processMessage(message.message_text, message.player_name);
                if (result && result.success) {
                    console.log('✅ AVATAR_URL processed successfully via ChatCommandParser');
                } else {
                    console.warn('❌ AVATAR_URL processing failed via ChatCommandParser:', result);
                    // Fallback to direct processing
                    processAvatarUrlCommand(message.message_text, message.player_name);
                }
            } catch (error) {
                console.error('❌ Error processing AVATAR_URL via ChatCommandParser:', error);
                // Fallback to direct processing
                processAvatarUrlCommand(message.message_text, message.player_name);
            }
        } else {
            console.log('🎭 ChatCommandParser not available, using direct processing');
            processAvatarUrlCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - process silently
        console.log('🔇 AVATAR_URL command processed silently, not displaying in chat');
        return;
    }

    // Check if this is a CHARACTER SYNC command
    if (message.message_type === 'chat' && message.message_text.startsWith('CHAR_')) {
        console.log('🔄 Detected CHARACTER SYNC command in chat:', message.message_text);
        
        // Process character sync command
        if (window.characterSyncManager) {
            const handled = await window.characterSyncManager.handleCharacterSyncMessage(
                message.message_text, 
                message.player_name
            );
            
            if (handled) {
                console.log('🔇 Character sync command processed silently');
                return; // Don't display in chat
            }
        }
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
        console.log(`🎯 Calling addToInitiativeTracker for ${initiativePlayerName} with roll ${roll}`);
        addToInitiativeTracker(initiativePlayerName, parseInt(roll), details);
    } else {
        console.error('🚨 addToInitiativeTracker function not found!');
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

function processNoteCommand(commandText, playerName) {
    console.log('🔍 Processing NOTE command:', commandText);
    console.log('🔍 Sender:', playerName);
    
    // Parse NOTE:Target:Text:ImageURL format
    const parts = commandText.split(':');
    console.log('🔍 Command parts:', parts);
    
    if (parts.length < 3) {
        console.error('❌ Invalid NOTE command format - need at least 3 parts');
        return;
    }
    
    const [cmd, targetPlayer, ...textParts] = parts;
    console.log('🔍 Target player:', targetPlayer);
    console.log('🔍 Text parts:', textParts);
    
    // Find where image URL starts (if any)
    let noteText = '';
    let imageUrl = '';
    
    // Join all parts and then separate text from potential image URL
    const fullText = textParts.join(':');
    console.log('🔍 Full text:', fullText);
    
    const imageUrlMatch = fullText.match(/https:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)$/i);
    
    if (imageUrlMatch) {
        imageUrl = imageUrlMatch[0];
        noteText = fullText.replace(':' + imageUrl, '').trim();
        console.log('🔍 Found image URL:', imageUrl);
        console.log('🔍 Extracted text:', noteText);
    } else {
        noteText = fullText;
        console.log('🔍 No image found, using full text:', noteText);
    }
    
    // Create note data
    const noteData = {
        sender: playerName,
        recipient: targetPlayer,
        text: noteText,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Created note data:', noteData);
    
    // Add to private messages (if we're the target or StoryTeller)
    const currentPlayerName = window.playerName || playerName;
    const isStoryTeller = window.isStoryTeller || false;
    
    console.log('🔍 Current player:', currentPlayerName);
    console.log('🔍 Is StoryTeller:', isStoryTeller);
    console.log('🔍 Should process note:', (targetPlayer === currentPlayerName || targetPlayer === 'StoryTeller' || isStoryTeller));
    
    if (targetPlayer === currentPlayerName || targetPlayer === 'StoryTeller' || isStoryTeller) {
        console.log('✅ Adding received note to panel');
        if (typeof addReceivedNote === 'function') {
            addReceivedNote(noteData);
        } else {
            console.error('❌ addReceivedNote function not available');
        }
    } else {
        console.log('⏭️ Note not for this user, ignoring');
    }
}

/**
 * Process AVATAR_URL command - Update player avatar in player chips
 * @param {string} commandText - Full AVATAR_URL command text
 * @param {string} playerName - Player sending the command
 */
function processAvatarUrlCommand(commandText, playerName) {
    console.log('🎭 Processing AVATAR_URL command:', commandText);
    console.log('🎭 Sender:', playerName);
    
    // Parse AVATAR_URL:PlayerName:URL format
    const parts = commandText.split(':');
    if (parts.length < 3) {
        console.error('❌ Invalid AVATAR_URL command format - need at least 3 parts');
        return;
    }
    
    const [cmd, targetPlayer, ...urlParts] = parts;
    const avatarUrl = urlParts.join(':'); // Rejoin in case URL contains colons
    
    console.log('🎭 Target player:', targetPlayer);
    console.log('🎭 Avatar URL:', avatarUrl);
    
    // Cache the avatar URL for this player
    if (!window.stPlayerAvatars) {
        window.stPlayerAvatars = new Map();
    }
    window.stPlayerAvatars.set(targetPlayer, avatarUrl);
    
    // Update player chip avatar if it exists
    updatePlayerChipAvatar(targetPlayer, avatarUrl);
    
    console.log('✅ Avatar URL processed for:', targetPlayer);
}

/**
 * Update player chip avatar with actual image
 * @param {string} playerName - Player name
 * @param {string} avatarUrl - Avatar URL
 */
function updatePlayerChipAvatar(playerName, avatarUrl) {
    console.log(`🔍 Looking for chip with player name: "${playerName}"`);
    
    const attemptUpdate = (retryCount = 0) => {
        // Find player chip in the UI
        const playerChips = document.querySelectorAll('.player-chip');
        console.log(`🔍 Found ${playerChips.length} player chips total (attempt ${retryCount + 1})`);
        
        let chipFound = false;
        playerChips.forEach((chip, index) => {
            const nameElement = chip.querySelector('.chip-name');
            if (nameElement) {
                const chipPlayerName = nameElement.textContent.trim();
                console.log(`🔍 Chip ${index}: "${chipPlayerName}"`);
                
                if (chipPlayerName === playerName) {
                    console.log(`✅ Found matching chip for: "${playerName}"`);
                    chipFound = true;
                    
                    const avatarElement = chip.querySelector('.chip-avatar');
                    if (avatarElement && avatarUrl) {
                        console.log(`🔄 Updating avatar element for ${playerName} with URL: ${avatarUrl}`);
                        // Replace emoji with actual image
                        avatarElement.innerHTML = `<img src="${avatarUrl}" alt="${playerName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.parentElement.innerHTML='⚔️'">`;
                        console.log(`✅ Updated ${playerName}'s chip avatar`);
                    } else {
                        console.warn(`❌ Avatar element not found or no URL for ${playerName}`);
                    }
                }
            } else {
                console.log(`🔍 Chip ${index}: No name element found`);
            }
        });
        
        // If chip not found and we have retries left, try again after a delay
        if (!chipFound && retryCount < 3) {
            console.log(`⏳ Chip for "${playerName}" not found, retrying in 500ms...`);
            setTimeout(() => attemptUpdate(retryCount + 1), 500);
        } else if (!chipFound) {
            console.warn(`❌ No chip found for player: "${playerName}" after ${retryCount + 1} attempts`);
        }
    };
    
    attemptUpdate();
}

/**
 * Get cached avatar URL for a player
 * @param {string} playerName - Player name
 * @returns {string|null} Avatar URL or null if not cached
 */
function getCachedAvatarUrl(playerName) {
    if (!window.stPlayerAvatars) {
        return null;
    }
    return window.stPlayerAvatars.get(playerName) || null;
}

/**
 * Announce current player's avatar URL to other connected players
 * @param {string} playerName - Player name
 * @param {string} avatarUrl - Avatar URL to announce
 */
async function announceAvatarUrl(playerName, avatarUrl) {
    if (!playerName || !avatarUrl || !currentGameSession) {
        console.log('🎭 Cannot announce avatar - missing data:', { playerName, avatarUrl, session: !!currentGameSession });
        return;
    }
    
    console.log(`🎭 Announcing avatar URL for ${playerName}:`, avatarUrl);
    
    // Send AVATAR_URL command via chat
    const avatarCommand = `AVATAR_URL:${playerName}:${avatarUrl}`;
    await sendChatMessageAsync(avatarCommand);
    
    // Also cache it locally
    if (!window.stPlayerAvatars) {
        window.stPlayerAvatars = new Map();
    }
    window.stPlayerAvatars.set(playerName, avatarUrl);
    
    console.log(`✅ Avatar URL announced for ${playerName}`);
}

/**
 * Check and announce avatar URL for current character
 * Called when character is loaded or session is joined
 */
async function checkAndAnnounceCurrentAvatar() {
    const currentPlayerName = window.playerName;
    if (!currentPlayerName) {
        console.log('🎭 No player name available for avatar announcement');
        return;
    }
    
    // Try to get avatar URL from current character data
    let avatarUrl = null;
    
    // Method 1: From V4 character data if available
    if (window.getCurrentCharacterData && typeof window.getCurrentCharacterData === 'function') {
        try {
            const characterData = window.getCurrentCharacterData();
            if (characterData?.personal?.avatarUrl) {
                avatarUrl = characterData.personal.avatarUrl;
                console.log('🎭 Found avatar URL from V4 character data:', avatarUrl);
            }
        } catch (error) {
            console.log('🎭 Could not get V4 character data:', error.message);
        }
    }
    
    // Method 2: From StoryTeller selected character if available
    if (!avatarUrl && window.storyTellerPlayersPanel && window.storyTellerPlayersPanel.selectedCharacter) {
        const selectedChar = window.storyTellerPlayersPanel.selectedCharacter;
        if (selectedChar?.personal?.avatarUrl) {
            avatarUrl = selectedChar.personal.avatarUrl;
            console.log('🎭 Found avatar URL from StoryTeller selected character:', avatarUrl);
        }
    }
    
    // Method 3: From cached avatar URLs
    if (!avatarUrl) {
        avatarUrl = getCachedAvatarUrl(currentPlayerName);
        if (avatarUrl) {
            console.log('🎭 Found avatar URL from cache:', avatarUrl);
        }
    }
    
    // Announce the avatar URL if found
    if (avatarUrl) {
        await announceAvatarUrl(currentPlayerName, avatarUrl);
    } else {
        console.log('🎭 No avatar URL found to announce');
    }
}

/**
 * Update player chips in the chat interface
 * Called when players connect/disconnect or when switching chat panels
 */
function updatePlayerChips(panelId = 'right') {
    const playerChipsArea = document.getElementById(`${panelId}-player-chips-area`);
    if (!playerChipsArea) {
        console.log('Player chips area not found for panel:', panelId);
        return;
    }
    
    const playerChipsScroll = playerChipsArea.querySelector('.player-chips-scroll');
    if (!playerChipsScroll) {
        console.log('Player chips scroll container not found');
        return;
    }
    
    // Get connected players from the existing player list
    const players = getConnectedPlayersList();
    const currentPlayerName = window.playerName || 'You';
    const isStoryteller = window.isStoryTeller || window.isStoryteller || false;
    
    console.log('🔄 Updating player chips for panel:', panelId);
    console.log('🔄 Connected players:', players);
    console.log('🔄 Current player:', currentPlayerName);
    console.log('🔄 Is storyteller:', isStoryteller);
    
    // Update the self chip
    let selfChip = playerChipsScroll.querySelector('.player-chip.self');
    if (selfChip) {
        const nameElement = selfChip.querySelector('.chip-name');
        const avatarElement = selfChip.querySelector('.chip-avatar');
        
        if (nameElement) {
            nameElement.textContent = currentPlayerName;
        }
        
        // Update self chip styling based on role
        if (isStoryteller) {
            selfChip.classList.add('storyteller');
        } else {
            selfChip.classList.remove('storyteller');
        }
        
        // Check for cached avatar
        if (avatarElement) {
            const cachedAvatarUrl = getCachedAvatarUrl(currentPlayerName);
            if (cachedAvatarUrl) {
                avatarElement.innerHTML = `<img src="${cachedAvatarUrl}" alt="${currentPlayerName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.parentElement.innerHTML='👤'">`;
            } else {
                avatarElement.innerHTML = isStoryteller ? '👑' : '👤';
            }
        }
    }
    
    // Clear other chips but keep self
    const allChips = Array.from(playerChipsScroll.children);
    allChips.forEach(chip => {
        if (!chip.classList.contains('self')) {
            chip.remove();
        }
    });
    
    // Add chips for other connected players
    players.forEach(player => {
        if (player.name && player.name !== currentPlayerName && 
            player.name !== 'System' && player.name !== 'Heartbeat') {
            
            console.log(`🔍 Creating chip for player: ${player.name}`);
            const chipDiv = document.createElement('div');
            chipDiv.className = 'player-chip';
            
            if (player.is_storyteller) {
                chipDiv.classList.add('storyteller');
            }
            
            // Check for cached avatar URL
            let avatarContent;
            const cachedAvatarUrl = getCachedAvatarUrl(player.name);
            
            if (cachedAvatarUrl) {
                avatarContent = `<img src="${cachedAvatarUrl}" alt="${player.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.parentElement.innerHTML='${player.is_storyteller ? '👑' : '⚔️'}'">`;
                console.log(`✅ Using cached avatar for ${player.name}`);
            } else {
                avatarContent = player.is_storyteller ? '👑' : '⚔️';
                console.log(`🔍 No cached avatar for ${player.name}, using default: ${avatarContent}`);
            }
            
            chipDiv.innerHTML = `
                <div class="chip-avatar">${avatarContent}</div>
                <span class="chip-name">${player.name}</span>
            `;
            
            // Add click event for sending notes (reuse V4-network functionality)
            chipDiv.addEventListener('click', (e) => {
                // Provide haptic feedback on supported devices
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // Visual feedback animation
                chipDiv.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    chipDiv.style.transform = '';
                }, 150);
                
                // Show note input for this player (you can customize this)
                showPlayerNoteInput(player.name);
            });
            
            playerChipsScroll.appendChild(chipDiv);
        }
    });
    
    // Show/hide the chips area based on connected players
    const hasOtherPlayers = players.some(p => 
        p.name && p.name !== currentPlayerName && 
        p.name !== 'System' && p.name !== 'Heartbeat'
    );
    
    if (hasOtherPlayers || isStoryteller) {
        playerChipsArea.style.display = 'block';
        playerChipsArea.classList.add('has-players');
        console.log('✅ Player chips area shown');
    } else {
        playerChipsArea.style.display = 'none';
        playerChipsArea.classList.remove('has-players');
        console.log('⚪ Player chips area hidden (no other players)');
    }
}

/**
 * Show note input for a specific player (basic implementation)
 * You can enhance this with a modal or better UI
 */
function showPlayerNoteInput(playerName) {
    const message = prompt(`Send a private note to ${playerName}:`);
    if (message && message.trim()) {
        // Send note command via chat
        const noteCommand = `NOTE:${playerName}:${message.trim()}`;
        sendChatMessageAsync(noteCommand);
        console.log(`📝 Sent note to ${playerName}: ${message}`);
    }
}

/**
 * Helper function to get connected players list
 * Reuses existing connected players logic
 */
function getConnectedPlayersList() {
    // Try to get from existing connected players tracking
    if (window.connectedPlayers && Array.isArray(window.connectedPlayers)) {
        return window.connectedPlayers;
    }
    
    // Fallback: parse from existing UI elements
    const players = [];
    
    // Try multiple selectors (both legacy and panel-specific)
    const selectors = ['#player-list .player-item', '#right-player-list .player-item', '#left-player-list .player-item'];
    
    for (const selector of selectors) {
        const playerItems = document.querySelectorAll(selector);
        if (playerItems.length > 0) {
            playerItems.forEach(item => {
                const nameElement = item.querySelector('.player-name');
                if (nameElement) {
                    const name = nameElement.textContent.replace(' (You)', '').trim();
                    const isStoryteller = nameElement.textContent.includes('Storyteller') || 
                                       nameElement.textContent.includes('Session Master');
                    
                    if (name && name !== 'Storyteller (You)') {
                        // Avoid duplicates
                        if (!players.find(p => p.name === name)) {
                            players.push({
                                name: name,
                                is_storyteller: isStoryteller
                            });
                        }
                    }
                }
            });
            break; // Use the first selector that has results
        }
    }
    
    return players;
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
    setTimeout(async () => {
        if (typeof createChatSystem === 'function') {
            createChatSystem();
        }
        
        // Initialize Supabase if configured
        if (typeof window.supabase !== 'undefined') {
            initializeSupabase();
        } else {
            console.warn('Supabase library not loaded. Please include the Supabase JavaScript library.');
        }
        
        // Load private messages from IndexedDB
        await loadPrivateMessages();
        updateStoryTellerPrivateMessagesPanel();
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

// ========================================
// PRIVATE MESSAGES FUNCTIONS
// ========================================
let stPrivateMessages = [];
let unifiedStorageDB = null;

// Initialize storage database
async function initPrivateMessagesStorage() {
    if (!unifiedStorageDB) {
        console.log('🔄 Initializing UnifiedStorageDB for private messages...');
        
        // Check if UnifiedStorageDB class is available
        if (typeof UnifiedStorageDB === 'undefined') {
            console.error('❌ UnifiedStorageDB class not available! Check script loading order.');
            throw new Error('UnifiedStorageDB class not available');
        }
        
        unifiedStorageDB = new UnifiedStorageDB();
        await unifiedStorageDB.init();
        
        // Run migration from localStorage if needed
        await unifiedStorageDB.migrateFromLocalStorage();
        console.log('✅ UnifiedStorageDB initialized successfully');
    }
    return unifiedStorageDB;
}

// Load private messages from IndexedDB
async function loadPrivateMessages() {
    try {
        console.log('🔄 Loading private messages from IndexedDB...');
        await initPrivateMessagesStorage();
        stPrivateMessages = await unifiedStorageDB.getAllPrivateMessages();
        console.log(`📥 Loaded ${stPrivateMessages.length} private messages from IndexedDB`);
        
        if (stPrivateMessages.length > 0) {
            console.log('📝 Sample message:', stPrivateMessages[0]);
        }
    } catch (error) {
        console.error('❌ Error loading private messages from IndexedDB:', error);
        // Fallback to localStorage for emergency recovery
        try {
            console.log('🔄 Attempting localStorage fallback...');
            const stored = localStorage.getItem('storyteller_private_messages');
            if (stored) {
                stPrivateMessages = JSON.parse(stored);
                console.log(`📥 Fallback: Loaded ${stPrivateMessages.length} private messages from localStorage`);
            } else {
                console.log('📭 No private messages found in localStorage either');
                stPrivateMessages = [];
            }
        } catch (fallbackError) {
            console.error('❌ Error loading fallback private messages:', fallbackError);
            stPrivateMessages = [];
        }
    }
}

// Save private messages to IndexedDB
async function savePrivateMessages() {
    try {
        if (!unifiedStorageDB) {
            await initPrivateMessagesStorage();
        }
        
        // Save all messages to IndexedDB
        for (const message of stPrivateMessages) {
            await unifiedStorageDB.savePrivateMessage(message);
        }
        
        console.log(`💾 Saved ${stPrivateMessages.length} private messages to IndexedDB`);
    } catch (error) {
        console.error('❌ Error saving private messages to IndexedDB:', error);
        // Emergency fallback to localStorage
        try {
            localStorage.setItem('storyteller_private_messages', JSON.stringify(stPrivateMessages));
            console.log('💾 Emergency fallback: Saved to localStorage');
        } catch (fallbackError) {
            console.error('❌ Error with emergency localStorage save:', fallbackError);
        }
    }
}

async function addReceivedNote(noteData) {
    console.log('📥 Adding received note:', noteData);
    
    // ALWAYS add to array and update UI first (non-blocking)
    stPrivateMessages.push(noteData);
    console.log(`📝 Added to stPrivateMessages array. Total: ${stPrivateMessages.length}`);
    
    // Update the UI immediately
    updateStoryTellerPrivateMessagesPanel();
    
    // Show notification
    if (window.showNotification) {
        window.showNotification('Private Message', `New note from ${noteData.sender}`, 'success');
    }
    
    // Try to save to IndexedDB (non-blocking - errors won't break the UI)
    setTimeout(async () => {
        try {
            console.log('💾 Attempting to save to IndexedDB...');
            if (!unifiedStorageDB) {
                console.log('🔄 Initializing storage...');
                await initPrivateMessagesStorage();
            }
            await unifiedStorageDB.savePrivateMessage(noteData);
            console.log('✅ Saved private message to IndexedDB');
        } catch (error) {
            console.error('❌ Error saving to IndexedDB, using localStorage fallback:', error);
            // Emergency fallback to localStorage
            try {
                localStorage.setItem('storyteller_private_messages', JSON.stringify(stPrivateMessages));
                console.log('💾 Emergency fallback: Saved to localStorage');
            } catch (fallbackError) {
                console.error('❌ Error with localStorage fallback:', fallbackError);
            }
        }
    }, 0); // Run in next tick to avoid blocking UI
    
    // Show notification
    if (window.showNotification) {
        window.showNotification('success', 'Private Message', `New note from ${noteData.sender}`, 'Click to view in Notes panel');
    }
    
    // If notes panel is open, show red badge on private messages tab
    const privateTab = document.querySelector('.notes-tab[onclick="switchNotesTab(\'private\')"]');
    if (privateTab && !privateTab.classList.contains('active')) {
        // Add visual indicator that there's a new message
        privateTab.style.position = 'relative';
        if (!privateTab.querySelector('.new-message-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'new-message-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                width: 8px;
                height: 8px;
                background: #dc3545;
                border-radius: 50%;
                animation: pulse 1s infinite;
            `;
            privateTab.appendChild(indicator);
        }
    }
}

function updateStoryTellerPrivateMessagesPanel() {
    console.log('🔄 updateStoryTellerPrivateMessagesPanel called');
    let container = document.getElementById('st-private-messages-container');
    const countElement = document.getElementById('st-private-messages-count');
    
    console.log('🔍 Container found:', !!container);
    console.log('🔍 Count element found:', !!countElement);
    console.log('🔍 stPrivateMessages.length:', stPrivateMessages.length);
    
    // If container not found, check if we need to switch to Private Messages tab
    if (!container) {
        const privateMessagesTab = document.getElementById('private-messages-tab');
        
        if (privateMessagesTab && privateMessagesTab.style.display === 'none' && typeof switchNotesTab === 'function') {
            console.log('📝 Notes panel loaded but Private Messages tab not active. Switching tabs...');
            switchNotesTab('private');
            
            // Try to find container again after tab switch
            container = document.getElementById('st-private-messages-container');
            console.log('🔍 Container found after tab switch:', !!container);
        }
    }
    
    if (!container) {
        console.log('⏸️ Private messages container not available. Messages will be shown when Notes panel with Private Messages tab is loaded.');
        return;
    }
    
    // Check if the private messages tab is visible
    const privateTab = document.getElementById('private-messages-tab');
    if (privateTab) {
        console.log('🔍 Private messages tab display:', privateTab.style.display);
        console.log('🔍 Private messages tab visible:', privateTab.offsetHeight > 0);
    }
    
    if (stPrivateMessages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #8a8a8a; padding: 20px;">
                <i class="material-icons" style="font-size: 2em; margin-bottom: 10px; display: block;">mail_outline</i>
                No private messages yet! Players can send private notes via player chip clicks.
            </div>
        `;
        
        if (countElement) {
            countElement.style.display = 'none';
        }
        return;
    }
    
    // Show count
    if (countElement) {
        countElement.textContent = `(${stPrivateMessages.length})`;
        countElement.style.display = 'inline';
        countElement.style.background = '#007bff';
        countElement.style.color = 'white';
        countElement.style.padding = '2px 6px';
        countElement.style.borderRadius = '10px';
        countElement.style.fontSize = '0.8em';
        countElement.style.marginLeft = '5px';
    }
    
    // Sort messages by timestamp (newest first) but keep track of original indices
    const sortedMessages = stPrivateMessages
        .map((note, originalIndex) => ({ ...note, originalIndex }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Generate messages HTML
    container.innerHTML = sortedMessages.map((note, displayIndex) => {
        let messageContent = note.text || '';
        
        // Process image markup in notes (V4-network compatible format)
        if (messageContent && messageContent.includes('🖼️ [IMAGE:')) {
            messageContent = messageContent.replace(/🖼️ \[IMAGE:(https?:\/\/[^\]]+)\]/g, (match, imageUrl) => {
                return `<div style="text-align: center; margin: 8px 0;"><img src="${imageUrl}" onclick="showStoryTellerImageModal('${imageUrl}', '${note.text || 'Private Image Note'}')" style="max-width: 100%; max-height: 150px; border-radius: 6px; border: 1px solid var(--border-color, #ddd); cursor: pointer;" title="Click to view full size"><br><small style="color: var(--text-secondary, #666); font-style: italic;">Click image to view full size</small></div>`;
            });
        }
        
        return `
        <div class="st-private-message" style="
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            background: var(--bg-primary, white);
            position: relative;
        ">
            <div class="st-message-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 0.9em;
                color: var(--text-secondary, #666);
            ">
                <div>
                    <strong style="color: var(--text-primary, #333);">${note.sender}</strong>
                    ${note.recipient !== 'StoryTeller' ? `→ ${note.recipient}` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${new Date(note.timestamp).toLocaleTimeString()}</span>
                    <button onclick="deleteStoryTellerNote(${note.originalIndex})" 
                            style="
                                background: none;
                                border: none;
                                color: #dc3545;
                                cursor: pointer;
                                padding: 2px;
                                border-radius: 3px;
                                font-size: 0.8em;
                                opacity: 0.7;
                            "
                            onmouseover="this.style.opacity='1'; this.style.background='#dc354520'"
                            onmouseout="this.style.opacity='0.7'; this.style.background='none'"
                            title="Delete note">
                        ✕
                    </button>
                </div>
            </div>
            
            ${messageContent ? `
                <div class="st-message-text" style="
                    color: var(--text-primary, #333);
                    line-height: 1.4;
                ">${messageContent}</div>
            ` : ''}
            
            ${note.imageUrl && !messageContent.includes('[IMAGE:') ? `
                <div class="st-message-image" style="margin-top: 8px;">
                    <img src="${note.imageUrl}" 
                         onclick="showStoryTellerImageModal('${note.imageUrl}', '${note.text || 'Private Image Note'}')"
                         style="
                             max-width: 100%;
                             max-height: 200px;
                             border-radius: 6px;
                             cursor: pointer;
                             border: 1px solid var(--border-color, #e0e0e0);
                         "
                         title="Click to view full size" />
                </div>
            ` : ''}
        </div>
    `
    }).join('');
    
    // Ensure proper scrolling functionality
    if (container) {
        // Just ensure the CSS properties are set correctly
        container.style.overflowY = 'auto';
        container.style.overflowX = 'hidden';
        container.style.webkitOverflowScrolling = 'touch'; // For iOS
        
        // Force a reflow to ensure scrolling works
        container.scrollTop = container.scrollTop;
        
        console.log('📱 Scroll functionality ensured for private messages container');
        console.log('🔍 Container scroll info:', {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            hasScroll: container.scrollHeight > container.clientHeight
        });
    }
}

function deleteStoryTellerNote(index) {
    if (confirm('Delete this private message?')) {
        // Remove from in-memory array
        stPrivateMessages.splice(index, 1);
        
        // Save updated array to IndexedDB (with localStorage fallback)
        savePrivateMessages();
        
        // Update the display
        updateStoryTellerPrivateMessagesPanel();
        showNotification('Private message deleted', 'success');
    }
}

function showStoryTellerImageModal(imageUrl, caption) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(3px);
    `;
    
    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
        background: var(--bg-primary, white);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    content.innerHTML = `
        <div style="
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 10001;
        ">
            <button onclick="document.body.removeChild(this.closest('.modal-overlay'))" 
                    style="
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        border: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
        </div>
        <img src="${imageUrl}" style="
            width: 100%;
            height: auto;
            display: block;
        " />
        ${caption ? `
            <div style="
                padding: 15px;
                background: var(--bg-secondary, #f8f9fa);
                color: var(--text-primary, #333);
                border-top: 1px solid var(--border-color, #e0e0e0);
            ">${caption}</div>
        ` : ''}
    `;
    
    modal.appendChild(content);
    modal.className = 'modal-overlay';
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modal);
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
    window.deleteStoryTellerNote = deleteStoryTellerNote;
    window.showStoryTellerImageModal = showStoryTellerImageModal;
    
    // Avatar URL system functions
    window.announceAvatarUrl = announceAvatarUrl;
    window.checkAndAnnounceCurrentAvatar = checkAndAnnounceCurrentAvatar;
    window.updatePlayerChips = updatePlayerChips;
    
    // Make updateConnectedPlayers globally available (for compatibility with index.html)
    if (typeof window.updateConnectedPlayers === 'function') {
        // Function is defined in index.html, keep it
    } else {
        console.warn('updateConnectedPlayers function not found in window - should be defined in index.html');
    }
}
