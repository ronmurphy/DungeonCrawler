// =========================================
// SUPABASE FULL CONNECT - USAGE EXAMPLES
// =========================================

/*
This file demonstrates how to use the new fullSupabaseConnect() method
for easy, one-line Supabase setup in the StoryTeller application.

Prerequisites:
1. Supabase account configured (see SupabaseConnect.md)
2. supabase-chat.js loaded in your HTML page
3. Database tables created (game_sessions, game_messages)
*/

// =========================================
// BASIC USAGE EXAMPLES
// =========================================

async function exampleDMCreateSession() {
    console.log('🎲 DM Creating New Session...');
    
    const result = await fullSupabaseConnect(
        'Alice',    // DM name
        'DCC01',    // Session code
        true,       // Is storyteller
        'create'    // Create new session
    );
    
    if (result.success) {
        console.log('✅ DM connected successfully!');
        console.log('Session info:', result.sessionInfo);
        
        // Ready to send messages immediately!
        await sendChatMessageAsync('Welcome to the dungeon, adventurers!');
    } else {
        console.error('❌ DM connection failed:', result.error);
    }
}

async function examplePlayerJoinSession() {
    console.log('⚔️ Player Joining Session...');
    
    const result = await fullSupabaseConnect(
        'Bob',      // Player name
        'DCC01',    // Same session code as DM
        false,      // Not storyteller
        'join'      // Join existing session
    );
    
    if (result.success) {
        console.log('✅ Player connected successfully!');
        console.log('Session info:', result.sessionInfo);
        
        // Ready to send messages immediately!
        await sendChatMessageAsync('Hello, I am ready to adventure!');
    } else {
        console.error('❌ Player connection failed:', result.error);
    }
}

// =========================================
// ADVANCED USAGE
// =========================================

async function exampleErrorHandling() {
    console.log('🔧 Advanced Error Handling...');
    
    const result = await fullSupabaseConnect('Charlie', 'INVALID_SESSION', false, 'join');
    
    if (!result.success) {
        switch(result.error) {
            case 'Session INVALID_SESSION not found':
                console.log('Creating new session instead...');
                const createResult = await fullSupabaseConnect('Charlie', 'BACKUP01', true, 'create');
                if (createResult.success) {
                    console.log('✅ Backup session created!');
                }
                break;
                
            case 'Failed to initialize Supabase. Check configuration.':
                console.log('❌ Need to configure Supabase API keys first');
                // Redirect to settings page
                break;
                
            default:
                console.log('❌ Unknown error:', result.error);
        }
    }
}

async function exampleMultipleConnections() {
    console.log('👥 Multiple Players Connecting...');
    
    // DM creates the session
    const dm = await fullSupabaseConnect('DM_Alice', 'PARTY01', true, 'create');
    
    if (dm.success) {
        console.log('✅ DM Alice connected');
        
        // Multiple players join
        const players = ['Fighter_Bob', 'Wizard_Carol', 'Thief_Dave'];
        
        for (const playerName of players) {
            const playerResult = await fullSupabaseConnect(playerName, 'PARTY01', false, 'join');
            
            if (playerResult.success) {
                console.log(`✅ ${playerName} joined the party!`);
            } else {
                console.log(`❌ ${playerName} failed to join:`, playerResult.error);
            }
        }
    }
}

// =========================================
// INTEGRATION WITH EXISTING UI
// =========================================

async function exampleUIIntegration() {
    console.log('🎨 UI Integration Example...');
    
    // Get values from UI (if they exist)
    const playerNameInput = document.getElementById('storyteller-name');
    const sessionCodeInput = document.getElementById('new-session-code');
    const storytellerToggle = document.getElementById('storyteller-toggle');
    
    if (playerNameInput && sessionCodeInput) {
        const playerName = playerNameInput.value.trim();
        const sessionCode = sessionCodeInput.value.trim().toUpperCase();
        const isStoryteller = storytellerToggle ? storytellerToggle.checked : false;
        const mode = isStoryteller ? 'create' : 'join';
        
        const result = await fullSupabaseConnect(playerName, sessionCode, isStoryteller, mode);
        
        if (result.success) {
            // fullSupabaseConnect automatically updates UI elements
            console.log('✅ Connected and UI updated automatically!');
            
            // Hide setup form, show chat
            const setupPanel = document.getElementById('setup-panel');
            const chatPanel = document.getElementById('chat-panel');
            
            if (setupPanel) setupPanel.style.display = 'none';
            if (chatPanel) chatPanel.style.display = 'block';
            
        } else {
            // Show error in UI
            alert('Connection failed: ' + result.error);
        }
    }
}

// =========================================
// TESTING FUNCTIONS
// =========================================

async function quickTest() {
    console.log('🧪 Quick Connection Test...');
    
    // Test creating a session
    const testSession = 'TEST_' + Date.now();
    const result = await fullSupabaseConnect('TestUser', testSession, true, 'create');
    
    console.log('Test result:', result);
    
    if (result.success) {
        console.log('✅ All systems working!');
        
        // Send a test message
        await sendChatMessageAsync('Test message from fullSupabaseConnect!');
        
        // Clean up - end the test session
        if (currentGameSession) {
            console.log('🧹 Cleaning up test session...');
        }
    } else {
        console.log('❌ System check failed:', result.error);
    }
}

// =========================================
// HELPER FUNCTIONS
// =========================================

function checkSupabaseReady() {
    console.log('🔍 Checking Supabase readiness...');
    console.log('- Supabase loaded:', typeof window.supabase !== 'undefined');
    console.log('- Chat module loaded:', typeof fullSupabaseConnect !== 'undefined');
    console.log('- Config module loaded:', typeof supabaseConfig !== 'undefined');
    
    if (typeof fullSupabaseConnect !== 'undefined') {
        console.log('✅ Ready to use fullSupabaseConnect()!');
    } else {
        console.log('❌ supabase-chat.js not loaded');
    }
}

// =========================================
// EXPORT FOR USE (if using modules)
// =========================================

// For testing in browser console:
window.exampleDMCreateSession = exampleDMCreateSession;
window.examplePlayerJoinSession = examplePlayerJoinSession;
window.quickTest = quickTest;
window.checkSupabaseReady = checkSupabaseReady;

// =========================================
// AUTO-RUN CHECK ON LOAD
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        checkSupabaseReady();
        console.log('💡 Try running: quickTest() to verify everything works!');
    }, 1000);
});
