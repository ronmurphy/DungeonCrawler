/**
 * STORYTELLER CHAT PICKER INTEGRATION
 * Replaces the existing showChatPicker function with the new shared system
 */

// Store reference to original function if it exists
const originalShowChatPicker = window.showChatPicker;

// Enhanced showChatPicker function for StoryTeller
function showChatPicker(panelSide) {
    console.log('📱 Opening enhanced chat picker for panel:', panelSide);
    
    // Initialize the chat picker manager if not already done
    if (!window.chatPickerManager) {
        initializeChatPicker({
            isMobile: false, // StoryTeller is desktop/tablet focused
            theme: 'desktop'
        });
    }
    
    const inputId = `${panelSide}-chat-input`;
    
    // Check if input exists
    const input = document.getElementById(inputId);
    if (!input) {
        console.warn(`Chat input not found: ${inputId}`);
        return;
    }
    
    // Get effects manager if available
    const effectsManager = window.chatEffectsManager || null;
    
    // Show the picker
    window.chatPickerManager.show(inputId, effectsManager)
        .then(({ modal, backdrop }) => {
            console.log('✅ Chat picker opened successfully');
            
            // StoryTeller-specific enhancements
            modal.style.background = 'var(--panel-bg)';
            modal.style.border = '2px solid var(--border-color)';
            
            // Add StoryTeller branding
            const header = modal.querySelector('h3');
            if (header) {
                header.innerHTML = '🎭 StoryTeller Chat Picker';
            }
        })
        .catch(error => {
            console.error('❌ Failed to open chat picker:', error);
            
            // Fallback to original function if available
            if (originalShowChatPicker) {
                originalShowChatPicker(panelSide);
            }
        });
}

// Override the global function
window.showChatPicker = showChatPicker;

// StoryTeller-specific initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chat picker for desktop/tablet use
    if (!window.chatPickerManager) {
        initializeChatPicker({
            isMobile: false,
            theme: 'desktop'
        });
        console.log('🎭 StoryTeller chat picker initialized for desktop use');
    }
});

console.log('🎭 StoryTeller chat picker integration loaded');
