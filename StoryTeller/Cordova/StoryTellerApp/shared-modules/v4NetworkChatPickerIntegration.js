/**
 * V4-NETWORK CHAT PICKER INTEGRATION
 * Enhances the existing mobile-first chat effects modal with the new shared system
 */

// Store reference to original function if it exists
const originalShowSheetChatEffects = window.showSheetChatEffects;

// Enhanced mobile chat picker for V4-network
function showSheetChatEffects() {
    console.log('📱 Opening mobile chat picker (V4-network)');
    
    // Initialize the chat picker manager if not already done
    if (!window.chatPickerManager) {
        initializeChatPicker({
            isMobile: true, // V4-network is mobile-first
            theme: 'mobile'
        });
    }
    
    const inputId = 'sheet-chat-input';
    
    // Check if input exists
    const input = document.getElementById(inputId);
    if (!input) {
        console.warn(`Chat input not found: ${inputId}`);
        // Fallback to original function if it exists
        if (originalShowSheetChatEffects) {
            return originalShowSheetChatEffects();
        }
        return;
    }
    
    // Get effects manager if available
    const effectsManager = window.chatEffectsManager || null;
    
    // Show the picker
    window.chatPickerManager.show(inputId, effectsManager)
        .then(({ modal, backdrop }) => {
            console.log('✅ Mobile chat picker opened successfully');
            
            // V4-network-specific enhancements
            modal.style.background = 'var(--bg-primary)';
            
            // Add mobile-specific touch handling
            modal.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Prevent background scrolling
            }, { passive: false });
            
            // Add V4-network branding
            const header = modal.querySelector('h3');
            if (header) {
                header.innerHTML = '⚔️ V4 Chat Picker';
            }
        })
        .catch(error => {
            console.error('❌ Failed to open mobile chat picker:', error);
            
            // Fallback to original implementation
            if (originalShowSheetEffects) {
                originalShowSheetEffects();
            }
        });
}

// Override the global function
window.showSheetChatEffects = showSheetChatEffects;

// V4-network-specific initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chat picker for mobile use
    if (!window.chatPickerManager) {
        initializeChatPicker({
            isMobile: true,
            theme: 'mobile'
        });
        console.log('⚔️ V4-network chat picker initialized for mobile use');
    }
    
    // Add mobile-specific optimizations
    if (window.chatPickerManager) {
        // Optimize for mobile viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const originalContent = viewport.content;
            
            // Store original for restoration
            window.chatPickerManager.originalViewport = originalContent;
        }
    }
});

console.log('⚔️ V4-network chat picker integration loaded');
