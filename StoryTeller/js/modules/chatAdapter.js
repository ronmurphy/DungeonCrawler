// ========================================
// MODULAR CHAT ADAPTER
// Bridge between new modules and existing StoryTeller UI
// ========================================

// Global chat manager instance
let globalChatManager = null;

// Initialize the modular chat system
async function initializeModularChat() {
    try {
        globalChatManager = new ChatManager();
        
        // Set up event handlers
        globalChatManager.setEventHandlers(
            (message) => handleModularMessage(message),
            (status) => handleModularConnectionChange(status),
            (type, error) => handleModularError(type, error)
        );
        
        console.log('✅ Modular chat system initialized');
        return globalChatManager;
    } catch (error) {
        console.error('Failed to initialize modular chat:', error);
        throw error;
    }
}

// Handle incoming messages from the modular system
function handleModularMessage(formattedMessage) {
    // Use the existing displayMessage function if available
    if (typeof displayMessage === 'function') {
        displayMessage({
            player_name: formattedMessage.sender,
            message_text: formattedMessage.content,
            message_type: formattedMessage.type,
            is_storyteller: formattedMessage.isStoryteller,
            created_at: formattedMessage.timestamp
        });
    } else {
        console.log('📨 New message:', formattedMessage);
    }
}

// Handle connection status changes
function handleModularConnectionChange(status) {
    console.log(`🔗 Connection status: ${status}`);
    
    // Update UI if functions exist
    if (typeof updateConnectionStatus === 'function') {
        updateConnectionStatus(status);
    }
    
    // Show/hide interfaces
    if (status === 'connected') {
        if (typeof showChatInterface === 'function') {
            showChatInterface();
        }
    } else {
        if (typeof hideChatInterface === 'function') {
            hideChatInterface();
        }
    }
}

// Handle errors from the modular system
function handleModularError(type, error) {
    console.error(`❌ Chat error (${type}):`, error);
    
    if (typeof showNotification === 'function') {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Wrapper functions to use modular system with existing UI
async function createModularSession(sessionCode, dmName, supabaseUrl, supabaseKey) {
    try {
        if (!globalChatManager) {
            await initializeModularChat();
        }
        
        await globalChatManager.initialize(supabaseUrl, supabaseKey);
        const session = await globalChatManager.createSession(sessionCode, dmName);
        
        console.log('🎮 Modular session created:', session);
        return session;
    } catch (error) {
        console.error('Failed to create modular session:', error);
        throw error;
    }
}

async function joinModularSession(sessionCode, playerName, isStoryteller, supabaseUrl, supabaseKey) {
    try {
        if (!globalChatManager) {
            await initializeModularChat();
        }
        
        await globalChatManager.initialize(supabaseUrl, supabaseKey);
        const session = await globalChatManager.joinSession(sessionCode, playerName, isStoryteller);
        
        console.log('👋 Modular session joined:', session);
        return session;
    } catch (error) {
        console.error('Failed to join modular session:', error);
        throw error;
    }
}

async function sendModularMessage(messageText) {
    try {
        if (!globalChatManager) {
            throw new Error('Chat manager not initialized');
        }
        
        await globalChatManager.sendMessage(messageText);
        return true;
    } catch (error) {
        console.error('Failed to send modular message:', error);
        throw error;
    }
}

async function leaveModularSession() {
    try {
        if (!globalChatManager) {
            return true;
        }
        
        await globalChatManager.leaveSession();
        console.log('🚪 Left modular session');
        return true;
    } catch (error) {
        console.error('Failed to leave modular session:', error);
        return false;
    }
}

// Add enemy to modular combat system
function addModularEnemy(enemyData) {
    if (!globalChatManager) {
        console.warn('Chat manager not initialized');
        return null;
    }
    
    return globalChatManager.addEnemy(enemyData);
}

// Get modular combat status
function getModularCombatStatus() {
    if (!globalChatManager) {
        return null;
    }
    
    return globalChatManager.getCombatStatus();
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.modularChat = {
        initialize: initializeModularChat,
        createSession: createModularSession,
        joinSession: joinModularSession,
        sendMessage: sendModularMessage,
        leaveSession: leaveModularSession,
        addEnemy: addModularEnemy,
        getCombatStatus: getModularCombatStatus,
        getChatManager: () => globalChatManager
    };
}
