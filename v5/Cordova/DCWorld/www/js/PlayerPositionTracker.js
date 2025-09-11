// ========================================
// PLAYER POSITION TRACKER MODULE
// Advanced CSS grid position tracking and management
// ========================================

class PlayerPositionTracker {
    constructor() {
        this.currentPosition = { x: 0, y: 0 };
        this.playerName = '';
        this.sessionCode = '';
        this.supabaseClient = null;
        this.mapElement = null;
        this.isMovementEnabled = false;
        this.positionHistory = [];
        this.maxHistorySize = 50;
        this.lastUpdateTime = 0;
        this.updateThrottleMs = 100; // Throttle updates to prevent spam
        
        // Movement constraints
        this.constraints = {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0
        };
        
        // Event callbacks
        this.onPositionChange = null;
        this.onMovementBlocked = null;
        this.onTrackingError = null;
        
        console.log('🎯 PlayerPositionTracker initialized');
    }

    // Initialize tracker
    initialize(supabaseClient, sessionCode, playerName, mapElement = null) {
        this.supabaseClient = supabaseClient;
        this.sessionCode = sessionCode;
        this.playerName = playerName;
        this.mapElement = mapElement;
        
        console.log(`🎯 Position tracker initialized for ${playerName} in session ${sessionCode}`);
        return this;
    }

    // Set event handlers
    setEventHandlers(onPositionChange, onMovementBlocked, onTrackingError) {
        this.onPositionChange = onPositionChange;
        this.onMovementBlocked = onMovementBlocked;
        this.onTrackingError = onTrackingError;
    }

    // Set movement constraints based on map size
    setConstraints(minX, minY, maxX, maxY) {
        this.constraints = { minX, minY, maxX, maxY };
        console.log(`🔒 Movement constraints set: (${minX},${minY}) to (${maxX},${maxY})`);
    }

    // Enable or disable movement
    setMovementEnabled(enabled) {
        this.isMovementEnabled = enabled;
        console.log(`🚶 Movement ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Validate position against constraints and obstacles
    validatePosition(x, y) {
        // Check bounds
        if (x < this.constraints.minX || x > this.constraints.maxX ||
            y < this.constraints.minY || y > this.constraints.maxY) {
            return { valid: false, reason: 'out_of_bounds' };
        }

        // Check if movement is enabled
        if (!this.isMovementEnabled) {
            return { valid: false, reason: 'movement_disabled' };
        }

        // Check for obstacles (if map element is available)
        if (this.mapElement) {
            const tile = this.mapElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (tile && tile.dataset.obstacle === 'true') {
                return { valid: false, reason: 'obstacle' };
            }
        }

        return { valid: true };
    }

    // Move to specific position
    async moveTo(x, y, force = false) {
        try {
            const now = Date.now();
            
            // Throttle updates to prevent spam
            if (!force && now - this.lastUpdateTime < this.updateThrottleMs) {
                console.log('⏱️ Movement throttled');
                return { success: false, reason: 'throttled' };
            }

            // Validate movement
            const validation = this.validatePosition(x, y);
            if (!validation.valid && !force) {
                if (this.onMovementBlocked) {
                    this.onMovementBlocked(x, y, validation.reason);
                }
                return { success: false, reason: validation.reason };
            }

            // Store previous position
            const previousPosition = { ...this.currentPosition };
            
            // Update position
            this.currentPosition = { x, y };
            this.lastUpdateTime = now;
            
            // Add to history
            this.addToHistory(previousPosition, { x, y }, now);
            
            // Update database
            if (this.supabaseClient) {
                await this.updatePositionInDatabase(x, y);
            }
            
            // Update visual
            this.updateVisualPosition(x, y);
            
            // Trigger callback
            if (this.onPositionChange) {
                this.onPositionChange(x, y, previousPosition);
            }
            
            console.log(`📍 Moved from (${previousPosition.x},${previousPosition.y}) to (${x},${y})`);
            return { success: true, from: previousPosition, to: { x, y } };
            
        } catch (error) {
            console.error('❌ Failed to move player:', error);
            if (this.onTrackingError) {
                this.onTrackingError('movement', error);
            }
            return { success: false, error: error.message };
        }
    }

    // Move relative to current position
    async moveRelative(deltaX, deltaY) {
        const newX = this.currentPosition.x + deltaX;
        const newY = this.currentPosition.y + deltaY;
        return this.moveTo(newX, newY);
    }

    // Update position in database
    async updatePositionInDatabase(x, y) {
        try {
            if (!this.supabaseClient || !this.sessionCode || !this.playerName) {
                throw new Error('Position tracker not properly initialized');
            }

            const { error } = await this.supabaseClient.getClient()
                .from('player_positions')
                .upsert({
                    session_code: this.sessionCode,
                    player_name: this.playerName,
                    x: x,
                    y: y,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'session_code,player_name'
                });

            if (error) throw error;
            
        } catch (error) {
            console.error('❌ Failed to update position in database:', error);
            throw error;
        }
    }

    // Update visual position marker
    updateVisualPosition(x, y) {
        if (!this.mapElement) return;
        
        // Remove old position marker
        const oldMarker = this.mapElement.querySelector(`.player-marker[data-player="${this.playerName}"]`);
        if (oldMarker) {
            oldMarker.remove();
        }
        
        // Find target tile
        const targetTile = this.mapElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!targetTile) return;
        
        // Create new position marker
        const marker = document.createElement('div');
        marker.className = 'player-marker';
        marker.dataset.player = this.playerName;
        marker.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #007bff;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            z-index: 10;
            pointer-events: none;
            animation: playerMove 0.3s ease-out;
        `;
        
        // Add player name label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            pointer-events: none;
        `;
        label.textContent = this.playerName;
        marker.appendChild(label);
        
        targetTile.appendChild(marker);
        
        // Add CSS animation if not already present
        if (!document.getElementById('player-move-animation')) {
            const style = document.createElement('style');
            style.id = 'player-move-animation';
            style.textContent = `
                @keyframes playerMove {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Add movement to history
    addToHistory(from, to, timestamp) {
        this.positionHistory.push({
            from,
            to,
            timestamp,
            playerName: this.playerName
        });
        
        // Trim history if too large
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift();
        }
    }

    // Get movement history
    getHistory(count = null) {
        if (count) {
            return this.positionHistory.slice(-count);
        }
        return [...this.positionHistory];
    }

    // Clear movement history
    clearHistory() {
        this.positionHistory = [];
        console.log('🗑️ Position history cleared');
    }

    // Get current position
    getCurrentPosition() {
        return { ...this.currentPosition };
    }

    // Set up keyboard movement (WASD or arrow keys)
    setupKeyboardMovement(enabled = true) {
        if (enabled) {
            document.addEventListener('keydown', this.handleKeyPress.bind(this));
            console.log('⌨️ Keyboard movement enabled (WASD/Arrow keys)');
        } else {
            document.removeEventListener('keydown', this.handleKeyPress.bind(this));
            console.log('⌨️ Keyboard movement disabled');
        }
    }

    // Handle keyboard input for movement
    handleKeyPress(event) {
        if (!this.isMovementEnabled) return;
        
        let deltaX = 0, deltaY = 0;
        
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                deltaY = -1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                deltaY = 1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                deltaX = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                deltaX = 1;
                break;
            default:
                return; // Not a movement key
        }
        
        event.preventDefault();
        this.moveRelative(deltaX, deltaY);
    }

    // Set up click-to-move on map tiles
    setupClickToMove(mapContainer) {
        if (!mapContainer) return;
        
        mapContainer.addEventListener('click', (event) => {
            if (!this.isMovementEnabled) return;
            
            const tile = event.target.closest('[data-x][data-y]');
            if (tile) {
                const x = parseInt(tile.dataset.x);
                const y = parseInt(tile.dataset.y);
                this.moveTo(x, y);
            }
        });
        
        console.log('🖱️ Click-to-move enabled');
    }

    // Calculate distance between two positions
    static calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if position is adjacent (for turn-based movement)
    isAdjacent(x, y) {
        const distance = PlayerPositionTracker.calculateDistance(
            this.currentPosition, 
            { x, y }
        );
        return distance <= 1.5; // Allow diagonal movement
    }

    // Get adjacent positions
    getAdjacentPositions() {
        const adjacent = [];
        const { x, y } = this.currentPosition;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip current position
                
                const newX = x + dx;
                const newY = y + dy;
                
                if (this.validatePosition(newX, newY).valid) {
                    adjacent.push({ x: newX, y: newY });
                }
            }
        }
        
        return adjacent;
    }

    // Teleport to position (bypasses movement constraints)
    async teleportTo(x, y) {
        console.log(`✨ Teleporting to (${x}, ${y})`);
        return this.moveTo(x, y, true); // Force = true
    }

    // Get statistics about player movement
    getMovementStats() {
        const totalMoves = this.positionHistory.length;
        let totalDistance = 0;
        
        this.positionHistory.forEach(move => {
            totalDistance += PlayerPositionTracker.calculateDistance(move.from, move.to);
        });
        
        return {
            totalMoves,
            totalDistance: Math.round(totalDistance * 100) / 100,
            averageDistance: totalMoves > 0 ? Math.round((totalDistance / totalMoves) * 100) / 100 : 0,
            currentPosition: this.getCurrentPosition(),
            movementEnabled: this.isMovementEnabled
        };
    }

    // Clean up event listeners and resources
    cleanup() {
        this.setupKeyboardMovement(false);
        this.clearHistory();
        console.log('🧹 PlayerPositionTracker cleaned up');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerPositionTracker;
} else {
    window.PlayerPositionTracker = PlayerPositionTracker;
}