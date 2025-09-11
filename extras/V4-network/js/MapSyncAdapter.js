// ========================================
// MAP SYNC ADAPTER MODULE
// Integration bridge between map sync system and existing apps
// ========================================

class MapSyncAdapter {
    constructor() {
        this.mapSyncManager = null;
        this.mapClientManager = null;
        this.positionTracker = null;
        this.isStoryteller = false;
        this.isInitialized = false;
        this.chatManager = null;
        this.supabaseClient = null;
        
        // Event handlers for integration
        this.onMapReceived = null;
        this.onMapShared = null;
        this.onPlayerMoved = null;
        this.onError = null;
        
        console.log('🔌 MapSyncAdapter initialized');
    }

    // Initialize adapter with existing systems
    async initialize(options = {}) {
        try {
            const {
                supabaseClient,
                chatManager,
                sessionCode,
                playerName,
                isStoryteller = false,
                mapContainerId = null
            } = options;

            if (!supabaseClient || !sessionCode) {
                throw new Error('Supabase client and session code required');
            }

            this.supabaseClient = supabaseClient;
            this.chatManager = chatManager;
            this.isStoryteller = isStoryteller;

            // Initialize appropriate manager based on role
            if (isStoryteller) {
                await this.initializeStoryteller(sessionCode);
            } else {
                await this.initializePlayer(sessionCode, playerName, mapContainerId);
            }

            this.isInitialized = true;
            console.log(`✅ MapSyncAdapter initialized as ${isStoryteller ? 'Storyteller' : 'Player'}`);
            
            return this;
        } catch (error) {
            console.error('❌ Failed to initialize MapSyncAdapter:', error);
            throw error;
        }
    }

    // Initialize for Storyteller role
    async initializeStoryteller(sessionCode) {
        // Create MapSyncManager
        this.mapSyncManager = new MapSyncManager();
        this.mapSyncManager.initialize(this.supabaseClient, sessionCode);
        
        // Set up event handlers
        this.mapSyncManager.setEventHandlers(
            (playerName, x, y) => this.handlePlayerPositionUpdate(playerName, x, y),
            (type, error) => this.handleMapSyncError(type, error),
            (mapName, mapData) => this.handleMapShareSuccess(mapName, mapData)
        );
        
        // Subscribe to player positions
        await this.mapSyncManager.subscribeToPlayerPositions();
        
        // Setup database tables
        await this.mapSyncManager.setupTables();
        
        console.log('🎭 Storyteller map sync initialized');
    }

    // Initialize for Player role
    async initializePlayer(sessionCode, playerName, mapContainerId) {
        // Create MapClientManager
        this.mapClientManager = new MapClientManager();
        this.mapClientManager.initialize(this.supabaseClient, sessionCode, mapContainerId);
        
        // Set up event handlers
        this.mapClientManager.setEventHandlers(
            (mapData, record) => this.handleMapReceived(mapData, record),
            () => this.handleMapRemoved(),
            (playerName, x, y) => this.handlePlayerPositionUpdate(playerName, x, y),
            (type, error) => this.handleMapError(type, error)
        );
        
        // Subscribe to maps
        await this.mapClientManager.subscribeToMaps();
        
        // Check for existing maps when connecting
        console.log('🔍 Checking for existing maps...');
        await this.mapClientManager.checkForExistingMap();
        
        console.log('🔌 Player initialization complete');
        console.log('🔌 Current session code:', sessionCode);
        console.log('🔌 MapClientManager session:', this.mapClientManager.currentSession);
        
        // Create position tracker
        this.positionTracker = new PlayerPositionTracker();
        this.positionTracker.initialize(
            this.supabaseClient, 
            sessionCode, 
            playerName,
            document.getElementById(mapContainerId)
        );
        
        // Set up position tracker event handlers
        this.positionTracker.setEventHandlers(
            (x, y, prev) => this.handlePlayerMove(x, y, prev),
            (x, y, reason) => this.handleMovementBlocked(x, y, reason),
            (type, error) => this.handleTrackingError(type, error)
        );
        
        console.log('👤 Player map sync initialized');
    }

    // Set external event handlers
    setEventHandlers(onMapReceived, onMapShared, onPlayerMoved, onError) {
        this.onMapReceived = onMapReceived;
        this.onMapShared = onMapShared;
        this.onPlayerMoved = onPlayerMoved;
        this.onError = onError;
    }

    // ========================================
    // STORYTELLER FUNCTIONS
    // ========================================

    // Share map (Storyteller only)
    async shareMap(mapData, mapName = 'Shared Map', options = {}) {
        if (!this.isStoryteller || !this.mapSyncManager) {
            throw new Error('Map sharing only available for storytellers');
        }
        
        return await this.mapSyncManager.shareMap(mapData, mapName, options);
    }

    // Update map settings (Storyteller only)
    async updateMapSettings(newSettings) {
        if (!this.isStoryteller || !this.mapSyncManager) {
            throw new Error('Map settings update only available for storytellers');
        }
        
        return await this.mapSyncManager.updateMapSettings(newSettings);
    }

    // Stop sharing map (Storyteller only)
    async stopSharingMap() {
        if (!this.isStoryteller || !this.mapSyncManager) {
            throw new Error('Stop sharing only available for storytellers');
        }
        
        return await this.mapSyncManager.stopSharingMap();
    }

    // Get player positions (Storyteller only)
    getPlayerPositions() {
        if (!this.isStoryteller || !this.mapSyncManager) {
            return {};
        }
        
        return this.mapSyncManager.getPlayerPositions();
    }

    // Clear player position (Storyteller only)
    clearPlayerPosition(playerName) {
        if (!this.isStoryteller || !this.mapSyncManager) {
            return;
        }
        
        this.mapSyncManager.clearPlayerPosition(playerName);
    }

    // ========================================
    // PLAYER FUNCTIONS
    // ========================================

    // Move to position (Player only)
    async moveToPosition(x, y) {
        if (this.isStoryteller || !this.positionTracker) {
            throw new Error('Position movement only available for players');
        }
        
        return await this.positionTracker.moveTo(x, y);
    }

    // Move relative to current position (Player only)
    async moveRelative(deltaX, deltaY) {
        if (this.isStoryteller || !this.positionTracker) {
            throw new Error('Relative movement only available for players');
        }
        
        return await this.positionTracker.moveRelative(deltaX, deltaY);
    }

    // Get current player position (Player only)
    getCurrentPosition() {
        if (this.isStoryteller || !this.positionTracker) {
            return null;
        }
        
        return this.positionTracker.getCurrentPosition();
    }

    // Enable/disable keyboard movement (Player only)
    setupKeyboardMovement(enabled = true) {
        if (this.isStoryteller || !this.positionTracker) {
            return;
        }
        
        this.positionTracker.setupKeyboardMovement(enabled);
    }

    // Get movement statistics (Player only)
    getMovementStats() {
        if (this.isStoryteller || !this.positionTracker) {
            return null;
        }
        
        return this.positionTracker.getMovementStats();
    }

    // ========================================
    // COMMON FUNCTIONS
    // ========================================

    // Get current shared map
    getCurrentMap() {
        if (this.isStoryteller) {
            return this.mapSyncManager?.currentSharedMap || null;
        } else {
            return this.mapClientManager?.getCurrentMap() || null;
        }
    }

    // ========================================
    // INTEGRATION WITH EXISTING SYSTEMS
    // ========================================

    // Integration with existing map sharing system
    integrateWithMapSharing() {
        if (typeof window.shareMapWithPlayers === 'function') {
            const originalShareMap = window.shareMapWithPlayers;
            
            window.shareMapWithPlayers = () => {
                // Call original function
                originalShareMap();
                
                // Also try to share via new system if available
                if (this.isStoryteller && this.mapSyncManager && window.currentMap) {
                    this.shareMap(window.currentMap, window.currentMap.name || 'Shared Map')
                        .then(result => {
                            if (result.success) {
                                console.log('✅ Map also shared via sync system');
                            }
                        })
                        .catch(error => {
                            console.warn('⚠️ Failed to share via sync system:', error);
                        });
                }
            };
            
            console.log('🔗 Integrated with existing map sharing system');
        }
    }

    // Integration with chat system
    integrateWithChat() {
        if (this.chatManager) {
            // Add map commands to chat parser
            const originalHandleCommand = this.chatManager.handleCommand?.bind(this.chatManager);
            
            this.chatManager.handleCommand = async (parsedCommand) => {
                // Handle map commands
                if (parsedCommand.command === 'map') {
                    return await this.handleMapCommand(parsedCommand);
                }
                
                // Call original handler
                if (originalHandleCommand) {
                    return await originalHandleCommand(parsedCommand);
                }
            };
            
            console.log('🔗 Integrated with chat system');
        }
    }

    // Handle map-related chat commands
    async handleMapCommand(parsedCommand) {
        const subcommand = parsedCommand.args[0];
        
        try {
            switch (subcommand) {
                case 'share':
                    if (this.isStoryteller) {
                        // Share current map
                        if (window.currentMap) {
                            const result = await this.shareMap(window.currentMap);
                            return `Map shared: ${result.success ? '✅' : '❌'}`;
                        } else {
                            return '❌ No map to share';
                        }
                    }
                    break;
                    
                case 'stop':
                    if (this.isStoryteller) {
                        const result = await this.stopSharingMap();
                        return `Map sharing stopped: ${result.success ? '✅' : '❌'}`;
                    }
                    break;
                    
                case 'move':
                    if (!this.isStoryteller && parsedCommand.args.length >= 3) {
                        const x = parseInt(parsedCommand.args[1]);
                        const y = parseInt(parsedCommand.args[2]);
                        
                        if (!isNaN(x) && !isNaN(y)) {
                            const result = await this.moveToPosition(x, y);
                            return `Movement: ${result.success ? '✅' : '❌'} ${result.reason || ''}`;
                        }
                    }
                    break;
                    
                case 'pos':
                case 'position':
                    if (!this.isStoryteller) {
                        const pos = this.getCurrentPosition();
                        return `Current position: (${pos.x}, ${pos.y})`;
                    }
                    break;
                    
                case 'stats':
                    if (!this.isStoryteller) {
                        const stats = this.getMovementStats();
                        return `Movement stats: ${stats.totalMoves} moves, ${stats.totalDistance} distance`;
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Map command error:', error);
            return `❌ Map command failed: ${error.message}`;
        }
        
        return null; // Command not handled
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    handleMapReceived(mapData, record) {
        console.log('📥 Map received:', mapData.name);
        
        // Update position tracker constraints
        if (this.positionTracker && mapData) {
            const size = mapData.size || (mapData.grid ? mapData.grid.length : 0);
            this.positionTracker.setConstraints(0, 0, size - 1, size - 1);
            this.positionTracker.setMovementEnabled(mapData.settings?.allowPlayerMovement !== false);
        }
        
        if (this.onMapReceived) {
            this.onMapReceived(mapData, record);
        }
    }

    handleMapRemoved() {
        console.log('🗑️ Map removed');
        
        // Disable movement
        if (this.positionTracker) {
            this.positionTracker.setMovementEnabled(false);
        }
    }

    handleMapShareSuccess(mapName, mapData) {
        console.log('📤 Map shared successfully:', mapName);
        
        if (this.onMapShared) {
            this.onMapShared(mapName, mapData);
        }
    }

    handlePlayerPositionUpdate(playerName, x, y) {
        console.log(`👤 Player ${playerName} moved to (${x}, ${y})`);
        
        if (this.onPlayerMoved) {
            this.onPlayerMoved(playerName, x, y);
        }
    }

    handlePlayerMove(x, y, previousPosition) {
        console.log(`🚶 Moved to (${x}, ${y}) from (${previousPosition.x}, ${previousPosition.y})`);
        
        if (this.onPlayerMoved) {
            this.onPlayerMoved(window.playerName || 'Player', x, y);
        }
    }

    handleMovementBlocked(x, y, reason) {
        console.log(`🚫 Movement to (${x}, ${y}) blocked: ${reason}`);
        
        // Show user feedback
        if (typeof showNotification === 'function') {
            showNotification(`Movement blocked: ${reason}`, 'warning');
        }
    }

    handleMapSyncError(type, error) {
        console.error(`❌ Map sync error (${type}):`, error);
        
        if (this.onError) {
            this.onError('map_sync', type, error);
        }
    }

    handleMapError(type, error) {
        console.error(`❌ Map client error (${type}):`, error);
        
        if (this.onError) {
            this.onError('map_client', type, error);
        }
    }

    handleTrackingError(type, error) {
        console.error(`❌ Position tracking error (${type}):`, error);
        
        if (this.onError) {
            this.onError('position_tracking', type, error);
        }
    }

    // ========================================
    // UTILITIES
    // ========================================

    // Check if adapter is ready
    isReady() {
        return this.isInitialized && (
            (this.isStoryteller && this.mapSyncManager) ||
            (!this.isStoryteller && this.mapClientManager && this.positionTracker)
        );
    }

    // Get status information
    getStatus() {
        return {
            initialized: this.isInitialized,
            role: this.isStoryteller ? 'storyteller' : 'player',
            ready: this.isReady(),
            hasMap: !!this.getCurrentMap(),
            currentPosition: this.isStoryteller ? null : this.getCurrentPosition(),
            playerPositions: this.isStoryteller ? this.getPlayerPositions() : null
        };
    }

    // Cleanup all managers
    cleanup() {
        if (this.mapSyncManager) {
            this.mapSyncManager.cleanup();
        }
        
        if (this.mapClientManager) {
            this.mapClientManager.cleanup();
        }
        
        if (this.positionTracker) {
            this.positionTracker.cleanup();
        }
        
        console.log('🧹 MapSyncAdapter cleaned up');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapSyncAdapter;
} else {
    window.MapSyncAdapter = MapSyncAdapter;
}