// ========================================
// STORYTELLER BRIDGE
// Send character data to StoryTeller for real-time import
// ========================================

class StoryTellerBridge {
    constructor() {
        this.connectionStatus = 'disconnected';
        this.storyTellerWindow = null;
        this.messageHandlers = new Map();
        
        this.setupEventListeners();
        console.log('🌉 StoryTellerBridge initialized');
    }

    /**
     * Setup event listeners for communication
     */
    setupEventListeners() {
        window.addEventListener('message', (event) => {
            this.handleIncomingMessage(event);
        });
    }

    /**
     * Handle incoming messages from StoryTeller
     */
    handleIncomingMessage(event) {
        const { type, data, source } = event.data;

        if (source !== 'storyteller') return;

        console.log('📨 Received message from StoryTeller:', type, data);

        switch (type) {
            case 'storyteller-ready':
                this.handleStoryTellerReady(data);
                break;
            case 'import-success':
                this.handleImportSuccess(data);
                break;
            case 'import-error':
                this.handleImportError(data);
                break;
            case 'pong':
                console.log('🏓 Pong received from StoryTeller');
                break;
        }
    }

    /**
     * Handle StoryTeller ready signal
     */
    handleStoryTellerReady(data) {
        console.log('✅ StoryTeller is ready for character imports');
        this.connectionStatus = 'connected';
        
        // Send handshake
        this.sendMessage('handshake', {
            capabilities: ['character-export', 'real-time-updates'],
            version: '1.0.0'
        });

        // Show connection notification
        showNotification('success', 'StoryTeller Connected', 
            'Characters will auto-import to StoryTeller', 
            'Export characters to see them appear instantly');
    }

    /**
     * Handle successful import
     */
    handleImportSuccess(data) {
        console.log('✅ Character successfully imported to StoryTeller:', data.characterName);
        showNotification('success', 'Export Complete', 
            `${data.characterName} imported to StoryTeller`, 
            'Character is now available in StoryTeller session');
    }

    /**
     * Handle import error
     */
    handleImportError(data) {
        console.error('❌ Character import failed in StoryTeller:', data.error);
        showNotification('error', 'Import Failed', 
            `Failed to import ${data.characterName}`, 
            data.error);
    }

    /**
     * Send character to StoryTeller
     */
    async sendCharacterToStoryTeller(characterId) {
        try {
            // Get character data using V4's character manager
            let character;
            if (characterId && window.characterManager && window.characterManager.characters) {
                character = characterManager.characters.find(char => char.id === characterId);
            }
            
            // If no specific ID provided or not found, use current character
            if (!character && window.character && window.character.id) {
                character = window.character;
            }
            
            if (!character) {
                throw new Error('Character not found');
            }

            console.log('📤 Sending character to StoryTeller:', character.name);

            // Send via postMessage
            this.sendMessage('character-export', character);

            // Fallback: use localStorage for same-browser communication
            this.sendViaStorage(character);

            // Show sending notification
            showNotification('info', 'Sending to StoryTeller', 
                `Exporting ${character.name}...`, 
                'Character will appear in StoryTeller automatically');

            return true;

        } catch (error) {
            console.error('❌ Failed to send character to StoryTeller:', error);
            showNotification('error', 'Export Failed', 
                'Failed to send character to StoryTeller', 
                error.message);
            return false;
        }
    }

    /**
     * Send all characters to StoryTeller
     */
    async sendAllCharactersToStoryTeller() {
        try {
            const characters = getAllCharacters();
            if (!characters || characters.length === 0) {
                showNotification('warning', 'No Characters', 
                    'No characters to export', 
                    'Create some characters first');
                return;
            }

            let successCount = 0;
            for (const character of characters) {
                const success = await this.sendCharacterToStoryTeller(character.id);
                if (success) successCount++;
            }

            showNotification('success', 'Bulk Export Complete', 
                `${successCount}/${characters.length} characters exported`, 
                'Characters are now available in StoryTeller');

        } catch (error) {
            console.error('❌ Bulk export failed:', error);
            showNotification('error', 'Bulk Export Failed', 
                'Failed to export characters', 
                error.message);
        }
    }

    /**
     * Send message to StoryTeller
     */
    sendMessage(type, data) {
        const message = {
            type,
            data,
            source: 'v4-network',
            timestamp: Date.now()
        };

        // Send to parent window if we're in an iframe
        if (window.parent !== window) {
            window.parent.postMessage(message, '*');
        }

        // Send to opener window if we were opened by another window
        if (window.opener) {
            window.opener.postMessage(message, '*');
        }

        // Broadcast to all windows
        window.postMessage(message, window.location.origin);
    }

    /**
     * Fallback: use localStorage for same-browser communication
     */
    sendViaStorage(character) {
        try {
            localStorage.setItem('v4-character-export', JSON.stringify(character));
            // Remove after a short delay to trigger storage event
            setTimeout(() => {
                localStorage.removeItem('v4-character-export');
            }, 1000);
        } catch (error) {
            console.warn('⚠️ Storage fallback failed:', error);
        }
    }

    /**
     * Test connection to StoryTeller
     */
    testConnection(showNotificationOnFail = false) {
        console.log('🔍 Testing connection to StoryTeller...');
        this.sendMessage('ping', { test: true });
        
        // Show status after a delay
        setTimeout(() => {
            const status = this.connectionStatus === 'connected' ? 
                'Connected to StoryTeller' : 'StoryTeller not detected';
            
            // Only show notification if connected OR explicitly requested
            if (this.connectionStatus === 'connected' || showNotificationOnFail) {
                showNotification('info', 'Connection Status', status, 
                    this.connectionStatus === 'connected' ? 
                    'Real-time export enabled' : 'Chat-based sync is now primary method');
            }
            
            // Log status regardless
            console.log(`🔗 Bridge Status: ${status}`);
        }, 1000);
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connectionStatus: this.connectionStatus,
            hasStoryTellerWindow: !!this.storyTellerWindow
        };
    }
}

// ========================================
// ENHANCED EXPORT FUNCTIONS
// ========================================

// Override existing export function to include StoryTeller sending
const originalExportCharacterFromManager = window.exportCharacterFromManager;
window.exportCharacterFromManager = function(characterId) {
    // Call original export function
    if (originalExportCharacterFromManager) {
        originalExportCharacterFromManager(characterId);
    }
    
    // Also send to StoryTeller
    if (window.storyTellerBridge) {
        window.storyTellerBridge.sendCharacterToStoryTeller(characterId);
    }
};

// Override bulk export function
const originalExportAllCharacters = window.exportAllCharacters;
window.exportAllCharacters = function() {
    // Call original export function
    if (originalExportAllCharacters) {
        originalExportAllCharacters();
    }
    
    // Also send to StoryTeller
    if (window.storyTellerBridge) {
        window.storyTellerBridge.sendAllCharactersToStoryTeller();
    }
};

// ========================================
// GLOBAL INITIALIZATION
// ========================================
window.storyTellerBridge = new StoryTellerBridge();

// Add connection test to interface
document.addEventListener('DOMContentLoaded', () => {
    // Test connection on load but don't show failure notification
    // The new chat-based sync is the primary method
    setTimeout(() => {
        window.storyTellerBridge.testConnection(false); // false = don't show "not detected" notification
    }, 2000);
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryTellerBridge;
}
