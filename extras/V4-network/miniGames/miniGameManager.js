// miniGameManager.js - WebView-based mini-game integration for V4-network

class MiniGameManager {
    constructor() {
        this.activeGame = null;
        this.gameContainer = null;
        this.isGameActive = false;
        this.chatContainer = null;
        this.originalChatDisplay = '';
        
        // Bind methods
        this.handleGameMessage = this.handleGameMessage.bind(this);
        this.closeGame = this.closeGame.bind(this);
        
        // Listen for messages from mini-games
        window.addEventListener('message', this.handleGameMessage);
    }

    /**
     * Launch the Iron Tangle mini-game in a WebView overlay
     */
    launchIronTangle() {
        if (this.isGameActive) {
            console.log('Game already active');
            return;
        }

        this.createGameOverlay();
        this.minimizeChat();
        
        // Create iframe container (reverting to working iframe approach)
        const gameFrame = document.createElement('div');
        gameFrame.className = 'mini-game-frame';
        gameFrame.innerHTML = `
            <div class="game-header">
                <h3>🚂 Iron Tangle Railway</h3>
                <button class="close-game-btn" onclick="miniGameManager.closeGame()">✕</button>
            </div>
            <iframe 
                src="miniGames/ironTangle/ironTangle.html" 
                width="100%" 
                height="100%" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms">
            </iframe>
        `;

        this.gameContainer.appendChild(gameFrame);
        this.activeGame = 'ironTangle';
        this.isGameActive = true;

        // Add game-specific styling
        this.addGameStyles();
        
        console.log('Iron Tangle launched successfully');
    }

    /**
     * Launch Donut's Magic Mania mini-game in a WebView overlay
     */
    launchDonutsMagicMania() {
        if (this.isGameActive) {
            console.log('Game already active');
            return;
        }

        this.createGameOverlay();
        this.minimizeChat();
        
        // Create iframe container (reverting to working iframe approach)
        const gameFrame = document.createElement('div');
        gameFrame.className = 'mini-game-frame';
        gameFrame.innerHTML = `
            <div class="game-header">
                <h3>🍩 Donut's Magic Mania</h3>
                <button class="close-game-btn" onclick="miniGameManager.closeGame()">✕</button>
            </div>
            <iframe 
                src="miniGames/donutsMagicMania/donutsMagicMania.html" 
                width="100%" 
                height="100%" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms">
            </iframe>
        `;

        this.gameContainer.appendChild(gameFrame);
        this.activeGame = 'donutsMagicMania';
        this.isGameActive = true;

        // Load game content via fetch (WebView approach)
        this.loadGameContent('miniGames/donutsMagicMania/donutsMagicMania.html', 'donutsMagicManiaContainer');

        // Add game-specific styling
        this.addGameStyles();
        
        console.log('Donuts Magic Mania launched successfully');
    }

    /**
     * Load game content directly into a container (WebView approach)
     */
    async loadGameContent(gameUrl, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        try {
            // Fetch the game HTML
            const response = await fetch(gameUrl);
            if (!response.ok) {
                throw new Error(`Failed to load ${gameUrl}: ${response.status}`);
            }
            
            const gameHtml = await response.text();
            
            // Create a document fragment to safely parse HTML
            const parser = new DOMParser();
            const gameDoc = parser.parseFromString(gameHtml, 'text/html');
            
            // Extract and modify styles to constrain within modal
            const styles = gameDoc.querySelectorAll('style');
            styles.forEach(style => {
                const newStyle = document.createElement('style');
                let styleContent = style.textContent;
                
                // Override any fullscreen styles to fit within modal
                styleContent = styleContent.replace(/100vw/g, '100%');
                styleContent = styleContent.replace(/100vh/g, '100%');
                styleContent = styleContent.replace(/width:\s*100vw/g, 'width: 100%');
                styleContent = styleContent.replace(/height:\s*100vh/g, 'height: 100%');
                
                // Add container-specific scoping
                newStyle.textContent = `
                    .webview-container { ${styleContent} }
                    .webview-container * { 
                        max-width: 100% !important; 
                        max-height: 100% !important; 
                    }
                    .webview-container canvas {
                        max-width: 100% !important;
                        max-height: calc(100% - 50px) !important;
                    }
                `;
                
                document.head.appendChild(newStyle);
            });
            
            // Extract and apply the body content
            const gameBody = gameDoc.body;
            if (gameBody) {
                container.innerHTML = gameBody.innerHTML;
                
                // Override any fullscreen elements within the game
                const gameContainer = container.querySelector('#gameContainer');
                if (gameContainer) {
                    gameContainer.style.width = '100%';
                    gameContainer.style.height = '100%';
                    gameContainer.style.maxWidth = '100%';
                    gameContainer.style.maxHeight = '100%';
                }
                
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    canvas.style.maxWidth = '100%';
                    canvas.style.maxHeight = 'calc(100% - 50px)';
                }
                
                // Execute any scripts in the game
                const scripts = gameDoc.querySelectorAll('script');
                scripts.forEach(script => {
                    if (script.src) {
                        // External script
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        document.head.appendChild(newScript);
                    } else {
                        // Inline script
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.head.appendChild(newScript);
                    }
                });
            }
            
            console.log(`Successfully loaded ${gameUrl} as WebView within modal`);
            
        } catch (error) {
            console.error('Error loading game content:', error);
            container.innerHTML = `
                <div class="error-message">
                    <h3>❌ Failed to load game</h3>
                    <p>Could not load ${gameUrl}</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Check if mini-games are available
     */
    static isAvailable() {
    }

    /**
     * Launch Katia's Training Room mini-game in a WebView overlay
     */
    launchKatiasTrainingRoom() {
        if (this.isGameActive) {
            console.log('Game already active');
            return;
        }

        this.createGameOverlay();
        this.minimizeChat();
        
        // Create iframe container (reverting to working iframe approach)
        const gameFrame = document.createElement('div');
        gameFrame.className = 'mini-game-frame';
        gameFrame.innerHTML = `
            <div class="game-header">
                <h3>🎯 Katia's Training Room</h3>
                <button class="close-game-btn" onclick="miniGameManager.closeGame()">✕</button>
            </div>
            <iframe 
                src="miniGames/katiasTrainingRoom/katiasTrainingRoom.html" 
                width="100%" 
                height="100%" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms">
            </iframe>
        `;

        this.gameContainer.appendChild(gameFrame);
        this.activeGame = 'katiasTrainingRoom';
        this.isGameActive = true;

        // Add game-specific styling
        this.addGameStyles();
        
        console.log('Katia\'s Training Room launched successfully');
    }

    /**
     * Create the overlay container for mini-games
     */
    createGameOverlay() {
        if (this.gameContainer) {
            return; // Already exists
        }

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'mini-game-overlay';
        this.gameContainer.id = 'miniGameOverlay';

        // Find the chat container to position the overlay correctly
        this.chatContainer = document.getElementById('chat-container') || 
                           document.getElementById('chat') ||
                           document.querySelector('.chat-container');

        if (this.chatContainer) {
            // Insert overlay before chat
            this.chatContainer.parentNode.insertBefore(this.gameContainer, this.chatContainer);
        } else {
            // Fallback: append to body
            document.body.appendChild(this.gameContainer);
        }
    }

    /**
     * Minimize the chat to make room for the game
     */
    minimizeChat() {
        if (this.chatContainer) {
            this.originalChatDisplay = this.chatContainer.style.display || '';
            this.chatContainer.style.display = 'none';
            
            // Alternative: minimize instead of hide
            // this.chatContainer.classList.add('minimized');
        }
    }

    /**
     * Restore the chat to its original state
     */
    restoreChat() {
        if (this.chatContainer) {
            this.chatContainer.style.display = this.originalChatDisplay;
            this.chatContainer.classList.remove('minimized');
        }
    }

    /**
     * Close the active mini-game
     */
    closeGame() {
        if (!this.isGameActive) {
            return;
        }

        // Remove game container
        if (this.gameContainer) {
            this.gameContainer.remove();
            this.gameContainer = null;
        }

        // Restore chat
        this.restoreChat();

        // Clean up state
        this.activeGame = null;
        this.isGameActive = false;

        // Remove game-specific styles
        this.removeGameStyles();

        console.log('Mini-game closed');
    }

    /**
     * Handle messages from mini-games
     */
    handleGameMessage(event) {
        // Only handle messages from our mini-games
        if (!event.data || !event.data.type) {
            return;
        }

        switch (event.data.type) {
            case 'CLOSE_MINI_GAME':
                this.closeGame();
                break;
            
            case 'GAME_READY':
                console.log(`${event.data.game} is ready`);
                break;
            
            case 'GAME_SCORE':
                // Handle score updates if needed
                console.log(`Score update from ${event.data.game}:`, event.data.score);
                break;
            
            default:
                console.log('Unknown message from mini-game:', event.data);
        }
    }

    /**
     * Add CSS styles for mini-game overlay
     */
    addGameStyles() {
        if (document.getElementById('mini-game-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'mini-game-styles';
        style.textContent = `
            .mini-game-overlay {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90vw;
                height: 85vh;
                max-width: 800px;
                max-height: 600px;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
                border: 2px solid #8B4513;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: gameSlideIn 0.5s ease-out;
            }

            .mini-game-frame {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .game-header {
                background: linear-gradient(45deg, #8B4513, #A0522D);
                color: #F5DEB3;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #CD853F;
                font-family: 'Courier New', monospace;
            }

            .game-header h3 {
                margin: 0;
                font-size: 1.2em;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }

            .close-game-btn {
                background: rgba(220, 20, 60, 0.8);
                border: 1px solid #DC143C;
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .close-game-btn:hover {
                background: #DC143C;
                transform: scale(1.1);
            }

            .mini-game-frame iframe {
                flex: 1;
                border: none;
                background: #1a1a1a;
            }

            @keyframes loadingPulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }

            .error-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ff6b6b;
                text-align: center;
                padding: 20px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 10px;
                border: 1px solid #ff6b6b;
            }

            .error-message h3 {
                margin: 0 0 10px 0;
                color: #ff6b6b;
            }

            .error-message p {
                margin: 5px 0;
                color: #F5DEB3;
            }

            @keyframes gameSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            /* Chat minimization styles */
            .chat-container.minimized {
                height: 50px;
                overflow: hidden;
                transition: height 0.3s ease;
            }

            /* Mobile responsive - Progressive Enhancement */
            @media (max-width: 768px) {
                .mini-game-overlay {
                    width: 95vw;
                    height: 85vh;
                    top: 50%;
                    left: 50%;
                }
            }
            
            @media (min-height: 700px) {
                .mini-game-overlay {
                    max-height: 650px;
                }
            }

            @media (min-height: 800px) {
                .mini-game-overlay {
                    max-height: 720px;
                }
            }

            /* Game button integration */
            .game-launch-btn {
                background: linear-gradient(45deg, #8B4513, #A0522D);
                border: 2px solid #CD853F;
                color: #F5DEB3;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                margin: 5px;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .game-launch-btn:hover {
                background: linear-gradient(45deg, #A0522D, #D2691E);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Remove mini-game styles
     */
    removeGameStyles() {
        const styleElement = document.getElementById('mini-game-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }

    /**
     * Add game launch button to the UI
     */
    addGameButton(container) {
        if (!container) {
            console.warn('No container provided for game button');
            return;
        }

        const gameButton = document.createElement('button');
        gameButton.className = 'game-launch-btn';
        gameButton.innerHTML = '🚂 Iron Tangle';
        gameButton.title = 'Play the Iron Tangle railway mini-game';
        gameButton.onclick = () => this.launchIronTangle();

        container.appendChild(gameButton);
        return gameButton;
    }

    /**
     * Create a button to launch Donut's Magic Mania
     */
    createDonutsMagicManiaButton(container) {
        if (!container) {
            console.warn('No container provided for game button');
            return;
        }

        const gameButton = document.createElement('button');
        gameButton.className = 'game-launch-btn';
        gameButton.innerHTML = '🍩 Donut\'s Magic Mania';
        gameButton.title = 'Play Princess Donut\'s sparkly match-3 game';
        gameButton.onclick = () => this.launchDonutsMagicMania();

        container.appendChild(gameButton);
        return gameButton;
    }

    /**
     * Check if mini-games are available
     */
    static isAvailable() {
        // Check if mini-game files exist
        return fetch('miniGames/ironTangle/ironTangle.html', { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }
}

// Global instance
window.miniGameManager = new MiniGameManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniGameManager;
}

// Auto-integration for DCC apps
document.addEventListener('DOMContentLoaded', () => {
    // Look for common control areas to add the game button
    const controlContainers = [
        '#controls',
        '.controls',
        '#button-container',
        '.button-container',
        '#game-controls',
        '.game-controls'
    ];

    // NOTE: Automatic button creation disabled since we now use the expandable FAB
    /*
    for (const selector of controlContainers) {
        const container = document.querySelector(selector);
        if (container) {
            console.log('Adding Iron Tangle button to:', selector);
            miniGameManager.addGameButton(container);
            break;
        }
    }

    // If no suitable container found, create one
    if (!document.querySelector('.game-launch-btn')) {
        const gameControls = document.createElement('div');
        gameControls.className = 'mini-game-controls';
        gameControls.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100;
        `;
        
        miniGameManager.addGameButton(gameControls);
        document.body.appendChild(gameControls);
        console.log('Created floating game controls');
    }
    */
    console.log('Iron Tangle available via expandable FAB (automatic button creation disabled)');
});

console.log('MiniGameManager loaded successfully');
