// ========================================
// MAP SYNC INTEGRATION EXAMPLE
// ========================================

// Global map sync adapter instance
let globalMapSyncAdapter = null;

// Initialize map synchronization for Storyteller
async function initializeStorytellerMapSync(sessionCode, supabaseClient) {
    try {
        if (!window.MapSyncAdapter) {
            console.warn('⚠️ MapSyncAdapter not loaded');
            return false;
        }

        // Create adapter
        globalMapSyncAdapter = new MapSyncAdapter();
        
        // Initialize for storyteller
        await globalMapSyncAdapter.initialize({
            supabaseClient: supabaseClient,
            sessionCode: sessionCode,
            playerName: 'Storyteller',
            isStoryteller: true
        });

        // Set up event handlers
        globalMapSyncAdapter.setEventHandlers(
            null, // onMapReceived (not used for storyteller)
            (mapName, mapData) => {
                console.log(`✅ Map "${mapName}" shared successfully`);
                if (typeof showNotification === 'function') {
                    showNotification(`Map "${mapName}" shared with players`, 'success');
                }
            },
            (playerName, x, y) => {
                console.log(`👤 ${playerName} moved to (${x}, ${y})`);
                // Update any visual indicators in the Storyteller UI
                updatePlayerPositionDisplay(playerName, x, y);
            },
            (category, type, error) => {
                console.error(`❌ Map sync error (${category}/${type}):`, error);
                if (typeof showNotification === 'function') {
                    showNotification(`Map sync error: ${error.message}`, 'error');
                }
            }
        );

        // Integrate with existing systems
        globalMapSyncAdapter.integrateWithMapSharing();
        
        console.log('✅ Storyteller map synchronization initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize storyteller map sync:', error);
        return false;
    }
}

// Enhanced map sharing function that uses both old and new systems
function enhancedShareMapWithPlayers() {
    // Skip the original modal-based sharing function - we only want the new sync system
    console.log('🗺️ Sharing map via new sync system only (no modal)');

    // Get the current map from maps manager
    const currentMap = window.mapsManager && window.mapsManager.currentMapId 
        ? window.mapsManager.savedMaps.get(window.mapsManager.currentMapId)
        : null;

    if (!currentMap) {
        console.error('❌ No current map to share');
        return;
    }

    console.log('📋 Current map data:', currentMap);
    console.log('🔍 RAW MAP DATA BEING SENT:', JSON.stringify(currentMap.data, null, 2));
    if (currentMap.data && currentMap.data.backgroundColors) {
        console.log('🎨 Background colors being sent:', currentMap.data.backgroundColors);
    } else {
        console.warn('❌ NO BACKGROUND COLORS in map data being sent!');
    }

    // Share via new sync system only
    if (globalMapSyncAdapter) {
        globalMapSyncAdapter.shareMap(
            currentMap.data, 
            currentMap.name || 'Shared Map',
            {
                allowPlayerMovement: true,
                showPlayerPositions: true,
                gridSize: 20
            }
        ).then(result => {
            if (result.success) {
                console.log('✅ Map shared via sync system (no modal popup)');
                
                // The MAP_SYNC notification will trigger refresh on players
                // No need for additional /refreshmap command
            } else {
                console.warn('⚠️ Failed to share via sync system:', result.error);
            }
        }).catch(error => {
            console.error('❌ Sync system share error:', error);
        });
    } else {
        console.warn('⚠️ Map sync adapter or current map not available');
    }
}

// Update player position display (placeholder - adapt to your UI)
function updatePlayerPositionDisplay(playerName, x, y) {
    // Example implementation - adapt to your UI
    const statusArea = document.getElementById('player-status') || 
                      document.getElementById('chat-messages');
    
    if (statusArea) {
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] 📍 ${playerName} → (${x}, ${y})`;
        
        // Add to chat or status display
        if (typeof addChatMessage === 'function') {
            addChatMessage(message, 'system');
        } else {
            console.log(message);
        }
    }
}

// Wrapper function to stop map sharing
function stopMapSharing() {
    if (globalMapSyncAdapter) {
        globalMapSyncAdapter.stopSharingMap().then(result => {
            if (result.success) {
                console.log('✅ Map sharing stopped');
                if (typeof showNotification === 'function') {
                    showNotification('Map sharing stopped', 'info');
                }
            }
        });
    }
}

// Get current player positions
function getCurrentPlayerPositions() {
    if (globalMapSyncAdapter) {
        return globalMapSyncAdapter.getPlayerPositions();
    }
    return {};
}

// Update map settings
async function updateSharedMapSettings(settings) {
    if (globalMapSyncAdapter) {
        const result = await globalMapSyncAdapter.updateMapSettings(settings);
        if (result.success) {
            console.log('✅ Map settings updated:', settings);
            if (typeof showNotification === 'function') {
                showNotification('Map settings updated', 'success');
            }
        }
        return result;
    }
    return { success: false, error: 'Map sync not initialized' };
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.mapSync = {
        initialize: initializeStorytellerMapSync,
        shareMap: enhancedShareMapWithPlayers,
        stopSharing: stopMapSharing,
        getPlayerPositions: getCurrentPlayerPositions,
        updateSettings: updateSharedMapSettings,
        getAdapter: () => globalMapSyncAdapter
    };
}