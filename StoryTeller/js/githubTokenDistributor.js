/**
 * GitHub Token Auto-Distribution System
 * Automatically sends GitHub tokens to newly connected players
 */
class GitHubTokenAutoDistributor {
    constructor() {
        this.isStoryteller = window.isStoryteller || window.isStoryTeller;
        this.lastPlayerCount = 0;
        this.distributionCooldown = 5000; // 5 second cooldown
        this.lastDistribution = 0;
        
        if (this.isStoryteller) {
            this.initializeForStoryteller();
        }
    }

    /**
     * Initialize auto-distribution for storytellers
     */
    initializeForStoryteller() {
        // Hook into player connection events
        this.watchForNewPlayers();
        console.log('🔑 GitHub token auto-distributor initialized for storyteller');
    }

    /**
     * Watch for new player connections
     */
    watchForNewPlayers() {
        // Method 1: Watch for player list changes
        setInterval(() => {
            this.checkPlayerCount();
        }, 3000);

        // Method 2: Hook into chat messages for "Player connected" messages
        if (window.addEventListener) {
            window.addEventListener('playerConnected', (event) => {
                this.handleNewPlayerConnection(event.detail);
            });
        }
    }

    /**
     * Check if player count has increased
     */
    checkPlayerCount() {
        // This would need to be adapted based on how your app tracks players
        // For now, we'll use a simple approach
        
        const chatContainer = document.querySelector('.chat-messages, #chatMessages, .messages-container');
        if (chatContainer) {
            const messages = chatContainer.querySelectorAll('.message, .chat-message');
            const connectionMessages = Array.from(messages).filter(msg => 
                msg.textContent.includes('connected') || 
                msg.textContent.includes('joined') ||
                msg.textContent.includes('Player')
            );
            
            if (connectionMessages.length > this.lastPlayerCount) {
                this.lastPlayerCount = connectionMessages.length;
                this.distributeTokenWithCooldown();
            }
        }
    }

    /**
     * Handle new player connection
     */
    handleNewPlayerConnection(playerInfo) {
        console.log('🔗 New player connected:', playerInfo);
        this.distributeTokenWithCooldown();
    }

    /**
     * Distribute token with cooldown protection
     */
    async distributeTokenWithCooldown() {
        const now = Date.now();
        if (now - this.lastDistribution < this.distributionCooldown) {
            console.log('🔄 Token distribution on cooldown, skipping');
            return;
        }

        this.lastDistribution = now;
        await this.distributeToken();
    }

    /**
     * Distribute GitHub token to all players
     */
    async distributeToken() {
        if (!this.isStoryteller) {
            return;
        }

        try {
            let token = null;
            
            // Try to get token from IndexedDB first
            if (window.githubTokenStorage) {
                token = await window.githubTokenStorage.getToken();
            }
            
            // Fallback to localStorage
            if (!token) {
                token = localStorage.getItem('github_api_token');
            }

            if (token) {
                // Send the token via chat (silent command)
                const command = `/github:${token}`;
                
                // Use the existing chat system to send the command
                if (window.sendMessage && typeof window.sendMessage === 'function') {
                    window.sendMessage(command);
                    console.log('🔑 GitHub token distributed to new players');
                } else if (window.supabaseClient && window.supabaseClient.sendChatMessage) {
                    window.supabaseClient.sendChatMessage(command);
                    console.log('🔑 GitHub token distributed to new players (via supabase)');
                } else {
                    console.log('⚠️ Could not find chat send function for token distribution');
                }
            } else {
                console.log('⚠️ No GitHub token available for distribution');
            }
        } catch (error) {
            console.error('❌ Failed to distribute GitHub token:', error);
        }
    }

    /**
     * Manual token distribution (for testing)
     */
    async manualDistribute() {
        console.log('🔧 Manual token distribution triggered');
        await this.distributeToken();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.isStoryteller || window.isStoryTeller) {
        window.githubTokenDistributor = new GitHubTokenAutoDistributor();
    }
});

// Also initialize if DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.isStoryteller || window.isStoryTeller) {
        window.githubTokenDistributor = new GitHubTokenAutoDistributor();
    }
}
