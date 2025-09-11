/**
 * Auto-initialization for GitHub Image Hosting System
 * Automatically sets up the image hosting when the page loads
 */

(function() {
    console.log('🚀 Auto-initializing GitHub Image Hosting System...');

    async function initializeImageHosting() {
        try {
            // Wait for all classes to be loaded
            if (typeof MultiImageHost === 'undefined') {
                console.log('⏳ Waiting for MultiImageHost class...');
                setTimeout(initializeImageHosting, 500);
                return;
            }

            // Get token from storage
            let token = null;
            
            // Try IndexedDB first
            if (window.githubTokenStorage) {
                try {
                    token = await window.githubTokenStorage.getToken();
                } catch (error) {
                    console.log('📦 IndexedDB not ready, using localStorage');
                }
            }
            
            // Fallback to localStorage
            if (!token) {
                token = localStorage.getItem('github_api_token');
            }

            // Initialize MultiImageHost
            const config = {
                githubOwner: 'ronmurphy',
                githubRepo: 'dcc-image-storage',
                githubToken: token
            };

            window.multiImageHost = new MultiImageHost(config);
            console.log('✅ MultiImageHost auto-initialized');

            // Also initialize ChatImageSystem if available
            if (typeof ChatImageSystem !== 'undefined') {
                window.chatImageSystem = new ChatImageSystem();
                console.log('✅ ChatImageSystem auto-initialized');
                
                // Try to add image button to chat if chat container exists
                const chatContainer = document.querySelector('.chat-container, #chatContainer, .chat-area, #chat-area');
                if (chatContainer) {
                    try {
                        window.chatImageSystem.initializeChatButtons();
                        console.log('✅ Chat image buttons initialized');
                    } catch (error) {
                        console.log('⚠️ Could not initialize chat buttons:', error.message);
                    }
                }
            }

            // Run status check
            if (window.checkImageHostingStatus) {
                setTimeout(() => {
                    window.checkImageHostingStatus();
                }, 1000);
            }

        } catch (error) {
            console.error('❌ Failed to auto-initialize image hosting:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeImageHosting);
    } else {
        // DOM is already ready
        setTimeout(initializeImageHosting, 100);
    }
})();
