// ========================================
// MAP SYNC MANAGER MODULE
// Storyteller-side map sharing with real-time synchronization
// ========================================

class MapSyncManager {
    constructor() {
        this.supabaseClient = null;
        this.currentSession = null;
        this.currentSharedMap = null;
        this.playerPositions = new Map(); // playerId -> {x, y, timestamp}
        this.positionSubscription = null;
        this.mapSubscription = null;
        
        // Event callbacks
        this.onPlayerPositionUpdate = null;
        this.onMapSyncError = null;
        this.onMapShareSuccess = null;
        
        console.log('🗺️ MapSyncManager initialized');
    }

    // Initialize with Supabase client
    initialize(supabaseClient, sessionCode) {
        console.log('🔍 MapSyncManager.initialize called with:', {
            'supabaseClient type': typeof supabaseClient,
            'has from method': typeof supabaseClient?.from === 'function',
            'has auth property': !!supabaseClient?.auth,
            'sessionCode': sessionCode
        });
        
        if (!supabaseClient) {
            throw new Error('Supabase client is required');
        }
        
        // More flexible validation - check for either from() method or auth property
        if (typeof supabaseClient.from !== 'function' && !supabaseClient.auth) {
            console.error('❌ Invalid Supabase client - missing from() method and auth property');
            throw new Error('Valid Supabase client required - must have from() method or auth property');
        }
        
        this.supabaseClient = supabaseClient;
        this.currentSession = sessionCode;
        
        console.log('✅ MapSyncManager connected to session:', sessionCode);
        return this;
    }

    // Set event handlers
    setEventHandlers(onPlayerPositionUpdate, onMapSyncError, onMapShareSuccess) {
        this.onPlayerPositionUpdate = onPlayerPositionUpdate;
        this.onMapSyncError = onMapSyncError;
        this.onMapShareSuccess = onMapShareSuccess;
    }

    // Share a map with all players in the session
    async shareMap(mapData, mapName = 'Shared Map', options = {}) {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapSyncManager not properly initialized');
            }

            // Prepare map data for sharing (now async with tileset config)
            const sharedMapData = await this.prepareMapForSharing(mapData, mapName, options);
            
            // Store in database
            const { data, error } = await this.supabaseClient
                .from('shared_maps')
                .upsert({
                    session_code: this.currentSession,
                    map_name: mapName,
                    map_data: sharedMapData,
                    shared_at: new Date().toISOString(),
                    map_settings: options
                }, {
                    onConflict: 'session_code'
                });

            if (error) throw error;

            // Send real-time notification to players
            await this.notifyPlayersMapUpdate(sharedMapData, mapName);
            
            this.currentSharedMap = sharedMapData;
            
            if (this.onMapShareSuccess) {
                this.onMapShareSuccess(mapName, sharedMapData);
            }
            
            console.log('✅ Map shared successfully with tileset config:', mapName);
            return { success: true, data: sharedMapData };
            
        } catch (error) {
            console.error('❌ Failed to share map:', error);
            if (this.onMapSyncError) {
                this.onMapSyncError('share', error);
            }
            return { success: false, error: error.message };
        }
    }

    // Prepare map data in standardized format using the formatter module
    async prepareMapForSharing(mapData, mapName, options) {
        // Check if formatter is available
        if (!window.MapDataFormatter) {
            console.error('❌ MapDataFormatter module not loaded');
            throw new Error('MapDataFormatter module is required but not loaded');
        }

        try {
            const formatter = new window.MapDataFormatter();
            const standardizedMap = await formatter.formatForSharing(mapData, mapName, options);
            
            console.log('✅ Map formatted successfully with network config:', standardizedMap.name);
            console.log('📡 Network transmission info:', standardizedMap.networkTransmission);
            return standardizedMap;
            
        } catch (error) {
            console.error('❌ Failed to format map data:', error);
            console.log('📋 Map format info:', window.MapDataFormatter ? 
                new window.MapDataFormatter().getFormatInfo(mapData) : 'Formatter not available');
            throw error;
        }
    }

    // Send real-time notification to players about map update
    async notifyPlayersMapUpdate(mapData, mapName) {
        try {
            // Use the new map_updates table instead of chat
            const { error } = await this.supabaseClient
                .from('map_updates')
                .insert([{
                    session_code: this.currentSession,
                    action: 'map_shared',
                    map_name: mapName,
                    map_data: {
                        name: mapName,
                        timestamp: new Date().toISOString()
                    }
                }]);
            
            if (error) {
                console.warn('⚠️ Failed to send map update notification:', error);
            } else {
                console.log('📡 Map update notification sent via database');
            }
        } catch (error) {
            console.warn('⚠️ Failed to send map notification:', error);
        }
    }

    // Subscribe to player position updates
    async subscribeToPlayerPositions() {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapSyncManager not initialized');
            }

            this.positionSubscription = this.supabaseClient
                .channel(`storyteller-positions-${this.currentSession}`)
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

            console.log('👥 Subscribed to player position updates');
            return true;
        } catch (error) {
            console.error('❌ Failed to subscribe to player positions:', error);
            if (this.onMapSyncError) {
                this.onMapSyncError('position_subscription', error);
            }
            return false;
        }
    }

    // Handle incoming player position updates
    handlePlayerPositionUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const position = newRecord;
                if (position.session_code === this.currentSession) {
                    this.playerPositions.set(position.player_name, {
                        x: position.x,
                        y: position.y,
                        timestamp: position.updated_at
                    });

                    if (this.onPlayerPositionUpdate) {
                        this.onPlayerPositionUpdate(position.player_name, position.x, position.y);
                    }

                    console.log(`📍 Player ${position.player_name} moved to (${position.x}, ${position.y})`);
                }
            }
        } catch (error) {
            console.error('❌ Error processing player position update:', error);
        }
    }

    // Get current player positions
    getPlayerPositions() {
        return Object.fromEntries(this.playerPositions);
    }

    // Clear a player's position (when they disconnect)
    clearPlayerPosition(playerName) {
        this.playerPositions.delete(playerName);
        console.log(`🚪 Cleared position for player: ${playerName}`);
    }

    // Update map settings (grid size, permissions, etc.)
    async updateMapSettings(newSettings) {
        try {
            if (!this.currentSharedMap) {
                throw new Error('No map currently shared');
            }

            this.currentSharedMap.settings = {
                ...this.currentSharedMap.settings,
                ...newSettings
            };

            // Update in database
            await this.supabaseClient
                .from('shared_maps')
                .update({ 
                    map_settings: this.currentSharedMap.settings,
                    updated_at: new Date().toISOString()
                })
                .eq('session_code', this.currentSession);

            // Notify players
            await this.notifyPlayersMapUpdate(this.currentSharedMap, this.currentSharedMap.name);
            
            console.log('⚙️ Map settings updated:', newSettings);
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to update map settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Stop sharing the current map
    async stopSharingMap() {
        try {
            if (!this.currentSession) {
                return { success: true, message: 'No session active' };
            }

            // Remove from database
            await this.supabaseClient
                .from('shared_maps')
                .delete()
                .eq('session_code', this.currentSession);

            // Notify players
            await this.supabaseClient.sendMessage(
                this.currentSession,
                'Storyteller',
                'MAP_SYNC:{"action":"map_removed"}',
                'map_sync',
                true
            );

            this.currentSharedMap = null;
            this.playerPositions.clear();

            console.log('🛑 Stopped sharing map');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to stop sharing map:', error);
            return { success: false, error: error.message };
        }
    }

    // Cleanup subscriptions
    cleanup() {
        if (this.positionSubscription) {
            this.positionSubscription.unsubscribe();
            this.positionSubscription = null;
        }
        
        if (this.mapSubscription) {
            this.mapSubscription.unsubscribe();
            this.mapSubscription = null;
        }

        this.playerPositions.clear();
        console.log('🧹 MapSyncManager cleaned up');
    }

    // Setup database tables (call once during initialization)
    async setupTables() {
        try {
            // Instead of using execute_sql RPC, check if tables exist by querying them
            console.log('🔍 Checking for required map sync tables...');
            
            // Test if shared_maps table exists
            const { error: mapsTableError } = await this.supabaseClient
                .from('shared_maps')
                .select('id')
                .limit(1);
            
            // Test if player_positions table exists
            const { error: positionsTableError } = await this.supabaseClient
                .from('player_positions')
                .select('id')
                .limit(1);
            
            if (mapsTableError || positionsTableError) {
                console.warn('⚠️ Map sync tables not found. Please create them manually:');
                console.warn(`
                -- Run this SQL in your Supabase SQL Editor:
                
                -- Shared Maps Table
                CREATE TABLE IF NOT EXISTS shared_maps (
                    id SERIAL PRIMARY KEY,
                    session_code VARCHAR(10) NOT NULL,
                    map_name VARCHAR(200) NOT NULL,
                    map_data JSONB NOT NULL,
                    map_settings JSONB DEFAULT '{}',
                    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(session_code)
                );

                -- Player Positions Table
                CREATE TABLE IF NOT EXISTS player_positions (
                    id SERIAL PRIMARY KEY,
                    session_code VARCHAR(10) NOT NULL,
                    player_name VARCHAR(100) NOT NULL,
                    x INTEGER NOT NULL,
                    y INTEGER NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(session_code, player_name)
                );

                -- Create indexes for performance
                CREATE INDEX IF NOT EXISTS idx_shared_maps_session ON shared_maps(session_code);
                CREATE INDEX IF NOT EXISTS idx_player_positions_session ON player_positions(session_code);
                CREATE INDEX IF NOT EXISTS idx_player_positions_updated ON player_positions(updated_at);
                `);
                
                // Continue anyway - the system may still work for basic functionality
                console.log('📋 Continuing with table setup incomplete - some features may not work');
            } else {
                console.log('✅ Map synchronization tables verified');
            }
        } catch (error) {
            console.warn('⚠️ Could not verify map tables:', error.message);
            console.log('🔧 Manual table creation may be required');
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapSyncManager;
} else {
    window.MapSyncManager = MapSyncManager;
}