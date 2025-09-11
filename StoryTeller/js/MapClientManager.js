// ========================================
// MAP CLIENT MANAGER MODULE
// Player-side map receiving and synchronization
// ========================================

class MapClientManager {
    constructor() {
        this.supabaseClient = null;
        this.currentSession = null;
        this.currentMap = null;
        this.mapSubscription = null;
        this.positionSubscription = null;
        this.mapContainer = null;
        this.mapViewer = null; // PlayerMapViewer instance
        this.playerPositions = new Map(); // playerId -> {x, y, element}
        this.currentPlayerPosition = { x: 0, y: 0 };
        
        // Event callbacks
        this.onMapReceived = null;
        this.onMapRemoved = null;
        this.onPlayerPositionUpdate = null;
        this.onMapError = null;
        
        console.log('🗺️ MapClientManager initialized');
    }

    // Initialize with Supabase client
    initialize(supabaseClient, sessionCode, mapContainerId) {
        // Flexible client validation - check for common Supabase methods
        const hasFromMethod = supabaseClient && typeof supabaseClient.from === 'function';
        const hasAuthProperty = supabaseClient && supabaseClient.auth;
        const hasOldIsInitialized = supabaseClient && typeof supabaseClient.isInitialized === 'function';
        
        if (!hasFromMethod && !hasAuthProperty && !hasOldIsInitialized) {
            throw new Error('Valid Supabase client required - must have .from() method or .auth property');
        }
        
        console.log('🔍 Client validation:', {
            hasFromMethod,
            hasAuthProperty, 
            hasOldIsInitialized,
            clientType: typeof supabaseClient
        });
        
        this.supabaseClient = supabaseClient;
        this.currentSession = sessionCode;
        
        // Helper method to get the actual client for database operations
        this.getDBClient = () => {
            if (this.supabaseClient.getClient && typeof this.supabaseClient.getClient === 'function') {
                return this.supabaseClient.getClient(); // Old wrapper style
            }
            return this.supabaseClient; // Direct client
        };
        
        // Get map container element
        if (mapContainerId) {
            this.mapContainer = document.getElementById(mapContainerId);
            if (!this.mapContainer) {
                console.warn(`⚠️ Map container '${mapContainerId}' not found`);
            } else {
                // Initialize PlayerMapViewer with proven pan/zoom functionality
                // Wait for DOM to be ready before initializing viewer
                this.initializeViewer();
                console.log('✅ Map container found, initializing viewer...');
            }
        }
        
        console.log('✅ MapClientManager connected to session:', sessionCode);
        
        // Add a test function to the window for debugging
        this.testMapNotification = async () => {
            console.log('🧪 Testing map notification...');
            try {
                const { error } = await this.getDBClient()
                    .from('map_updates')
                    .insert([{
                        session_code: this.currentSession,
                        action: 'refresh',
                        map_name: 'Test Map',
                        map_data: { test: true }
                    }]);
                
                if (error) {
                    console.error('❌ Test notification failed:', error);
                } else {
                    console.log('✅ Test notification sent');
                }
            } catch (error) {
                console.error('❌ Test error:', error);
            }
        };
        
        console.log('🧪 Test function added to MapClientManager instance');
        
        return this;
    }

    // Initialize PlayerMapViewer once DOM elements are available
    initializeViewer() {
        console.log('🔧 Attempting to initialize PlayerMapViewer...');
        try {
            // Check if required elements exist
            const container = document.getElementById('map-viewer-container');
            const canvas = document.getElementById('map-canvas');
            
            console.log('Elements check - container:', !!container, 'canvas:', !!canvas);
            
            if (!container || !canvas) {
                console.warn('⚠️ Map viewer elements not found, retrying in 100ms...');
                setTimeout(() => this.initializeViewer(), 100);
                return;
            }
            
            // Check if PlayerMapViewer class is available
            if (typeof PlayerMapViewer === 'undefined') {
                console.error('❌ PlayerMapViewer class not loaded!');
                return;
            }
            
            this.mapViewer = new PlayerMapViewer('map-viewer-container', 'map-canvas');
            console.log('✅ PlayerMapViewer initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize PlayerMapViewer:', error);
            console.error('Error details:', error.message, error.stack);
            // Fallback - try again in a moment
            setTimeout(() => this.initializeViewer(), 500);
        }
    }

    // Set event handlers
    setEventHandlers(onMapReceived, onMapRemoved, onPlayerPositionUpdate, onMapError) {
        this.onMapReceived = onMapReceived;
        this.onMapRemoved = onMapRemoved;
        this.onPlayerPositionUpdate = onPlayerPositionUpdate;
        this.onMapError = onMapError;
    }

    // Subscribe to map updates and chat messages
    async subscribeToMaps() {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapClientManager not properly initialized');
            }

            console.log(`🔔 Setting up map subscription for session: ${this.currentSession}`);

            // Subscribe to map_updates table for instant notifications
            this.mapUpdateSubscription = this.getDBClient()
                .channel(`map-updates-${this.currentSession}`)
                .on('postgres_changes', 
                    { 
                        event: 'INSERT', 
                        schema: 'public', 
                        table: 'map_updates',
                        filter: `session_code=eq.${this.currentSession}`
                    }, 
                    (payload) => {
                        console.log('📡 Database notification received:', payload);
                        this.handleMapUpdateNotification(payload);
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Map updates subscription status:', status);
                });

            // Subscribe to map sync messages in chat (backup method)
            const chatManager = this.supabaseClient.getChatManager?.() || window.globalChatManager;
            if (chatManager) {
                // Add our map sync handler to the message processing
                this.originalMessageHandler = chatManager.onMessageReceived;
                chatManager.onMessageReceived = (message) => {
                    this.handleIncomingMessage(message);
                    if (this.originalMessageHandler) {
                        this.originalMessageHandler(message);
                    }
                };
            }

            // Subscribe to shared maps table changes using new Supabase API
            this.mapSubscription = this.getDBClient()
                .channel(`map-sync-${this.currentSession}`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'shared_maps',
                        filter: `session_code=eq.${this.currentSession}`
                    }, 
                    (payload) => {
                        this.handleMapUpdate(payload);
                    }
                )
                .subscribe();

            // Subscribe to player positions using new Supabase API
            this.positionSubscription = this.getDBClient()
                .channel(`positions-${this.currentSession}`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'player_positions',
                        filter: `session_code=eq.${this.currentSession}`
                    }, 
                    (payload) => {
                        this.handlePlayerPositionUpdate(payload);
                    }
                )
                .subscribe();

            // Check for existing shared map
            await this.checkForExistingMap();

            console.log('📡 Subscribed to map updates');
            return true;
        } catch (error) {
            console.error('❌ Failed to subscribe to maps:', error);
            if (this.onMapError) {
                this.onMapError('subscription', error);
            }
            return false;
        }
    }

    // Handle incoming chat messages for map sync
    handleIncomingMessage(message) {
        try {
            if (message.message_type === 'map_sync' || 
                (message.message_text && message.message_text.startsWith('MAP_SYNC:'))) {
                
                let syncData;
                if (message.message_text.startsWith('MAP_SYNC:')) {
                    syncData = JSON.parse(message.message_text.substring(9));
                } else {
                    syncData = message.sync_data || message;
                }

                if (syncData.action === 'map_shared') {
                    console.log('📨 Received map share notification:', syncData.mapName);
                    this.checkForExistingMap(); // Refresh map data
                } else if (syncData.action === 'map_removed') {
                    console.log('📨 Received map removal notification');
                    this.handleMapRemoved();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing map sync message:', error);
        }
    }

    // Handle map_updates table notifications (new method)
    handleMapUpdateNotification(payload) {
        try {
            const updateRecord = payload.new;
            console.log('📡 Processing map update notification:', updateRecord);
            
            if (updateRecord.session_code === this.currentSession) {
                console.log('✅ Notification matches current session');
                if (updateRecord.action === 'map_shared') {
                    console.log('📨 Map shared via database notification:', updateRecord.map_name);
                    console.log('🔄 Calling checkForExistingMap...');
                    this.checkForExistingMap(); // Refresh map data
                } else if (updateRecord.action === 'map_removed') {
                    console.log('📨 Map removed via database notification');
                    this.handleMapRemoved();
                } else if (updateRecord.action === 'refresh') {
                    console.log('📨 Map refresh requested via database notification');
                    console.log('🔄 Calling checkForExistingMap...');
                    this.checkForExistingMap();
                }
                
                // Mark the notification as processed
                this.markNotificationProcessed(updateRecord.id);
            } else {
                console.log('❌ Notification for different session:', updateRecord.session_code, 'vs', this.currentSession);
            }
        } catch (error) {
            console.error('❌ Error processing map update notification:', error);
        }
    }

    // Mark notification as processed (optional cleanup)
    async markNotificationProcessed(notificationId) {
        try {
            await this.getDBClient()
                .from('map_updates')
                .update({ processed: true })
                .eq('id', notificationId);
        } catch (error) {
            console.warn('⚠️ Could not mark notification as processed:', error);
        }
    }

    // Handle map table updates
    handleMapUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                if (newRecord.session_code === this.currentSession) {
                    this.loadMap(newRecord);
                }
            } else if (eventType === 'DELETE') {
                if (oldRecord.session_code === this.currentSession) {
                    this.handleMapRemoved();
                }
            }
        } catch (error) {
            console.error('❌ Error processing map update:', error);
        }
    }

    // Check for existing shared map
    async checkForExistingMap() {
        try {
            console.log('🔍 Checking for existing map in session:', this.currentSession);
            
            const { data, error } = await this.getDBClient()
                .from('shared_maps')
                .select('*')
                .eq('session_code', this.currentSession)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // Not found is OK
                    console.error('❌ Database error checking for map:', error);
                    throw error;
                }
                console.log('📭 No shared map found in session:', this.currentSession);
                return null;
            }

            if (data) {
                console.log('📊 Found existing map:', data.map_name);
                this.loadMap(data);
                return data;
            }
        } catch (error) {
            console.error('❌ Failed to check for existing map:', error);
            if (this.onMapError) {
                this.onMapError('load', error);
            }
        }
        return null;
    }

    // Load and display a received map
    loadMap(mapRecord) {
        try {
            this.currentMap = mapRecord.map_data;
            this.currentMap.settings = mapRecord.map_settings || {};
            
            // DEBUG: Show exactly what was received from StoryTeller
            console.log('🔍 RAW MAP DATA RECEIVED FROM STORYTELLER:', JSON.stringify(mapRecord.map_data, null, 2));
            console.log('🔍 Map data keys:', Object.keys(mapRecord.map_data || {}));
            if (mapRecord.map_data && mapRecord.map_data.backgroundColors) {
                console.log('🎨 Background colors in received data:', mapRecord.map_data.backgroundColors);
            } else {
                console.warn('❌ NO BACKGROUND COLORS in received map data!');
            }
            
            console.log('🗺️ Loading map:', this.currentMap.name);
            
            if (this.mapContainer) {
                this.renderMap(this.currentMap);
            }
            
            if (this.onMapReceived) {
                this.onMapReceived(this.currentMap, mapRecord);
            }
            
            // Load existing player positions
            this.loadPlayerPositions();
            
        } catch (error) {
            console.error('❌ Failed to load map:', error);
            if (this.onMapError) {
                this.onMapError('render', error);
            }
        }
    }

    // Render map using PlayerMapViewer (proven pan/zoom functionality)
    renderMap(mapData) {
        console.log('🎨 renderMap called with:', mapData);
        
        if (!this.mapViewer) {
            console.warn('⚠️ Map viewer not ready, trying to initialize...');
            this.initializeViewer();
            
            // If still no viewer after initialization, try again later
            if (!this.mapViewer) {
                console.warn('⚠️ Map viewer initialization failed, retrying in 200ms...');
                setTimeout(() => this.renderMap(mapData), 200);
                return;
            }
        }

        // Hide placeholder and show canvas
        const placeholder = document.getElementById('map-placeholder');
        const canvas = document.getElementById('map-canvas');
        
        if (placeholder) placeholder.style.display = 'none';
        if (canvas) canvas.style.display = 'block';

        // Convert different map data formats to PlayerMapViewer format
        let standardMapData = null;

        console.log('🔍 Converting map data format...');
        console.log('Input mapData:', mapData);
        console.log('Input mapData keys:', Object.keys(mapData));
        console.log('Has backgroundColors?', 'backgroundColors' in mapData, mapData.backgroundColors);
        console.log('📡 Network transmission info:', mapData.networkTransmission);
        console.log('🎨 Network tilesetConfig available:', !!mapData.tilesetConfig);

        if (mapData.grid) {
            // New grid format - extract sprite names directly
            const grid = mapData.grid;
            const size = mapData.size || grid.length;
            const spriteNames = [];
            
            console.log('📊 Grid format detected, size:', size, 'grid sample:', grid[0]?.slice(0, 3));
            
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    const cellData = grid[row][col];
                    
                    // Extract sprite name directly (no conversion to numbers!)
                    let spriteName = null;
                    
                    if (cellData && typeof cellData === 'object' && cellData.type === 'sprite' && cellData.value) {
                        spriteName = cellData.value; // Keep the sprite name as-is
                    } else if (typeof cellData === 'number' && cellData > 0) {
                        // If it's already a number, convert to sprite name
                        spriteName = this.numberToSprite(cellData);
                    }
                    
                    spriteNames.push(spriteName);
                }
            }
            
            console.log('📊 Extracted sprite names sample:', spriteNames.slice(0, 10));
            console.log('🎨 Background colors found:', Object.keys(mapData.backgroundColors || {}).length > 0 ? mapData.backgroundColors : 'None');
            
            standardMapData = {
                width: size,
                height: size,
                spriteNames: spriteNames, // Use sprite names, not numeric tiles
                tileset: mapData.tileset,
                backgroundColors: mapData.backgroundColors || {}, // Include background colors!
                tilesetConfig: mapData.tilesetConfig, // Pass through network tileset config!
                name: mapData.name || 'Shared Map'
            };
            
            console.log('✅ Converted grid to standard format:', standardMapData);
            
        } else if (mapData.mapData && mapData.size) {
            // Legacy format
            const size = mapData.size;
            console.log('📊 Legacy format detected, size:', size, 'mapData length:', mapData.mapData.length);
            
            standardMapData = {
                width: size,
                height: size,
                tiles: mapData.mapData,
                tileset: mapData.tileset,
                tilesetConfig: mapData.tilesetConfig, // Pass through network tileset config!
                name: mapData.name || 'Shared Map'
            };
            
            console.log('✅ Legacy format converted:', standardMapData);
            
        } else if (mapData.width && mapData.height && mapData.tiles) {
            // Already in standard format
            console.log('📊 Already in standard format');
            standardMapData = {
                ...mapData,
                tilesetConfig: mapData.tilesetConfig // Ensure network tileset config is preserved
            };
            
        } else {
            console.error('❌ Unsupported map data format:', mapData);
            console.error('Available keys:', Object.keys(mapData));
            return;
        }

        // Use PlayerMapViewer to render the map
        console.log('🎯 Calling PlayerMapViewer.renderMap with:', standardMapData);
        this.mapViewer.renderMap(standardMapData);

        console.log('🎨 Map rendered successfully with PlayerMapViewer');
    }

    // Get tile color based on tile value
    getTileColor(tileValue) {
        const colors = {
            0: '#f8f9fa', // Empty/void
            1: '#6c757d', // Wall/stone
            2: '#fff3cd', // Floor/path
            3: '#d4edda', // Door/entrance
            4: '#f8d7da', // Danger/trap
            5: '#d1ecf1', // Water
            6: '#d4edda', // Grass
            7: '#e2e3e5', // Rock
            8: '#fff3cd'  // Sand
        };
        
        return colors[tileValue] || '#e9ecef';
    }

    // Move player to specified position
    async movePlayerTo(x, y) {
        try {
            if (!this.currentMap?.settings?.allowPlayerMovement) {
                console.log('🚫 Player movement not allowed on this map');
                return;
            }

            // Update local position
            this.currentPlayerPosition = { x, y };
            
            // Update visual position
            this.updatePlayerPositionVisual(window.playerName || 'Player', x, y, true);
            
            // Send to server
            await this.getDBClient()
                .from('player_positions')
                .upsert({
                    session_code: this.currentSession,
                    player_name: window.playerName || 'Player',
                    x: x,
                    y: y,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'session_code,player_name'
                });

            console.log(`🚶 Moved to position (${x}, ${y})`);
        } catch (error) {
            console.error('❌ Failed to move player:', error);
            if (this.onMapError) {
                this.onMapError('movement', error);
            }
        }
    }

    // Handle player position updates
    handlePlayerPositionUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const position = newRecord;
                if (position.session_code === this.currentSession) {
                    const isCurrentPlayer = position.player_name === (window.playerName || 'Player');
                    this.updatePlayerPositionVisual(position.player_name, position.x, position.y, isCurrentPlayer);
                    
                    if (this.onPlayerPositionUpdate) {
                        this.onPlayerPositionUpdate(position.player_name, position.x, position.y);
                    }
                }
            } else if (eventType === 'DELETE') {
                if (oldRecord.session_code === this.currentSession) {
                    this.removePlayerPositionVisual(oldRecord.player_name);
                }
            }
        } catch (error) {
            console.error('❌ Error processing player position update:', error);
        }
    }

    // Update player position visual indicator
    updatePlayerPositionVisual(playerName, x, y, isCurrentPlayer = false) {
        if (!this.mapContainer) return;
        
        const mapGrid = this.mapContainer.querySelector('.map-client-grid');
        if (!mapGrid) return;
        
        const tile = mapGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!tile) return;
        
        // Remove old position marker for this player
        const oldMarker = mapGrid.querySelector(`.player-marker[data-player="${playerName}"]`);
        if (oldMarker) {
            oldMarker.remove();
        }
        
        // Create new position marker
        const marker = document.createElement('div');
        marker.className = 'player-marker';
        marker.dataset.player = playerName;
        marker.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${isCurrentPlayer ? '#007bff' : '#28a745'};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            z-index: 5;
            pointer-events: none;
        `;
        
        // Add player name tooltip
        marker.title = playerName;
        
        tile.appendChild(marker);
        
        this.playerPositions.set(playerName, { x, y, element: marker });
    }

    // Remove player position visual
    removePlayerPositionVisual(playerName) {
        const playerData = this.playerPositions.get(playerName);
        if (playerData && playerData.element) {
            playerData.element.remove();
        }
        this.playerPositions.delete(playerName);
    }

    // Load existing player positions
    async loadPlayerPositions() {
        try {
            const { data, error } = await this.getDBClient()
                .from('player_positions')
                .select('*')
                .eq('session_code', this.currentSession);

            if (error) throw error;

            if (data && data.length > 0) {
                data.forEach(position => {
                    const isCurrentPlayer = position.player_name === (window.playerName || 'Player');
                    this.updatePlayerPositionVisual(position.player_name, position.x, position.y, isCurrentPlayer);
                });
                
                console.log(`👥 Loaded ${data.length} player positions`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load player positions:', error);
        }
    }

    // Handle map removal
    handleMapRemoved() {
        this.currentMap = null;
        this.playerPositions.clear();
        
        if (this.mapContainer) {
            this.mapContainer.innerHTML = `
                <div style="
                    padding: 40px;
                    text-align: center;
                    color: #666;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                ">
                    🗺️ No map currently shared
                    <br><small>Waiting for storyteller to share a map...</small>
                </div>
            `;
        }
        
        if (this.onMapRemoved) {
            this.onMapRemoved();
        }
        
        console.log('🗑️ Map removed');
    }

    // Get current map data
    getCurrentMap() {
        return this.currentMap;
    }

    // Get current player position
    getPlayerPosition() {
        return this.currentPlayerPosition;
    }

    // Get all player positions
    getAllPlayerPositions() {
        return Object.fromEntries(this.playerPositions);
    }

    // Helper method to convert sprite names to numeric IDs for PlayerMapViewer
    spriteToNumber(spriteName) {
        // Simple sprite-to-number mapping for rendering
        const spriteMap = {
            'mountain': 1,
            'forest': 2,
            'water': 3,
            'grass': 4,
            'stone': 5,
            'desert': 6,
            'snow': 7,
            'lava': 8,
            'swamp': 9,
            'city': 10,
            'village': 11,
            'road': 12,
            'bridge': 13,
            'door': 14,
            'chest': 15,
            'treasure': 16,
            'monster': 17,
            'npc': 18,
            'player': 19,
            'stairs': 20
        };
        
        return spriteMap[spriteName] || 1; // Default to 1 (mountain) if not found
    }

    // Helper method to convert numeric IDs back to sprite names
    numberToSprite(number) {
        // Reverse mapping
        const numberMap = {
            1: 'mountain',
            2: 'forest',
            3: 'water',
            4: 'grass',
            5: 'stone',
            6: 'desert',
            7: 'snow',
            8: 'lava',
            9: 'swamp',
            10: 'city',
            11: 'village',
            12: 'road',
            13: 'bridge',
            14: 'door',
            15: 'chest',
            16: 'treasure',
            17: 'monster',
            18: 'npc',
            19: 'player',
            20: 'stairs'
        };
        
        return numberMap[number] || 'mountain'; // Default to mountain if not found
    }

    // Cleanup subscriptions
    cleanup() {
        if (this.mapSubscription) {
            this.mapSubscription.unsubscribe();
            this.mapSubscription = null;
        }
        
        if (this.positionSubscription) {
            this.positionSubscription.unsubscribe();
            this.positionSubscription = null;
        }
        
        if (this.mapUpdateSubscription) {
            this.mapUpdateSubscription.unsubscribe();
            this.mapUpdateSubscription = null;
        }

        this.playerPositions.clear();
        console.log('🧹 MapClientManager cleaned up');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapClientManager;
} else {
    window.MapClientManager = MapClientManager;
}