// ========================================
// CHAT MANAGER MODULE
// Main orchestrator using all portable modules
// ========================================

class ChatManager {
    constructor() {
        this.supabaseClient = new SupabaseClient();
        this.chatParser = new ChatParser();
        this.combatHandler = new CombatHandler();
        this.messageFormatter = new MessageFormatter();
        
        this.currentSession = null;
        this.currentPlayer = null;
        this.messageSubscription = null;
        this.isStoryteller = false;
        
        // Event callbacks
        this.onMessageReceived = null;
        this.onConnectionChange = null;
        this.onError = null;
        
        this.setupCombatHandlers();
    }

    setupCombatHandlers() {
        // Handle enemy defeated events
        this.combatHandler.setEventHandlers(
            (enemy, killerName) => this.handleEnemyDefeated(enemy, killerName),
            (eventType, data) => this.handleCombatEvent(eventType, data)
        );
    }

    // Initialize the chat system
    async initialize(supabaseUrl, supabaseKey) {
        try {
            await this.supabaseClient.initialize(supabaseUrl, supabaseKey);
            await this.supabaseClient.setupTables();
            
            if (this.onConnectionChange) {
                this.onConnectionChange('connected');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize chat system:', error);
            if (this.onError) {
                this.onError('initialization', error);
            }
            throw error;
        }
    }

    // Create a new game session
    async createSession(sessionCode, dmName) {
        try {
            const session = await this.supabaseClient.createSession(sessionCode, dmName);
            this.currentSession = session;
            this.currentPlayer = dmName;
            this.isStoryteller = true;
            
            await this.subscribeToMessages(sessionCode);
            
            console.log(`🎮 Created session: ${sessionCode}`);
            return session;
        } catch (error) {
            console.error('Failed to create session:', error);
            if (this.onError) {
                this.onError('create_session', error);
            }
            throw error;
        }
    }

    // Join an existing game session
    async joinSession(sessionCode, playerName, isStoryteller = false) {
        try {
            const session = await this.supabaseClient.joinSession(sessionCode);
            this.currentSession = session;
            this.currentPlayer = playerName;
            this.isStoryteller = isStoryteller;
            
            await this.subscribeToMessages(sessionCode);
            
            // Send join message
            await this.sendSystemMessage(`${playerName} joined the session`);
            
            console.log(`👋 ${playerName} joined session: ${sessionCode}`);
            return session;
        } catch (error) {
            console.error('Failed to join session:', error);
            if (this.onError) {
                this.onError('join_session', error);
            }
            throw error;
        }
    }

    // Leave the current session
    async leaveSession() {
        if (!this.currentSession) return;

        try {
            // Send leave message if we have a valid session
            if (this.currentSession.session_code && this.currentSession.session_code.length <= 10) {
                const leaveMessages = [
                    "🏨 You rest for the night in a safe room...",
                    "🚪 Have fun with real life! (Warning: No respawns available)",
                    "💤 Logging out... Dream of electric sheep and loot drops",
                    "🎭 The Storyteller grants you temporary immunity from plot hooks",
                    "🏃‍♂️ Disconnecting... May your real-world stats be ever in your favor!"
                ];
                const randomMessage = leaveMessages[Math.floor(Math.random() * leaveMessages.length)];
                await this.sendSystemMessage(randomMessage);
            }

            // Cleanup subscription
            if (this.messageSubscription) {
                this.messageSubscription.unsubscribe();
                this.messageSubscription = null;
            }

            const playerName = this.currentPlayer;
            const sessionCode = this.currentSession.session_code;

            // Reset state
            this.currentSession = null;
            this.currentPlayer = null;
            this.isStoryteller = false;

            if (this.onConnectionChange) {
                this.onConnectionChange('offline');
            }

            console.log(`🚪 ${playerName} left session: ${sessionCode}`);
            return true;
        } catch (error) {
            console.error('Error leaving session:', error);
            // Reset state even if error occurs
            this.currentSession = null;
            this.currentPlayer = null;
            this.isStoryteller = false;
            
            if (this.onConnectionChange) {
                this.onConnectionChange('offline');
            }
            
            return false;
        }
    }

    // Send a chat message
    async sendMessage(messageText, messageType = 'chat') {
        if (!this.currentSession || !this.currentPlayer) {
            throw new Error('Not connected to a session');
        }

        try {
            // Parse the message for commands
            const parsed = this.chatParser.parseMessage(messageText);
            
            if (parsed.isCommand) {
                await this.handleCommand(parsed);
            } else {
                // Send regular chat message
                await this.supabaseClient.sendMessage(
                    this.currentSession.session_code,
                    this.currentPlayer,
                    messageText,
                    messageType,
                    this.isStoryteller
                );
            }
            
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            if (this.onError) {
                this.onError('send_message', error);
            }
            throw error;
        }
    }

    // Handle parsed commands
    async handleCommand(parsedCommand) {
        try {
            switch (parsedCommand.command) {
                case 'ATTACK':
                    await this.handleAttackCommand(parsedCommand.data);
                    break;
                case 'ROLL':
                case 'SKILL':
                case 'SAVE':
                    await this.handleRollCommand(parsedCommand.data);
                    break;
                default:
                    // Send as regular message if command not recognized
                    await this.supabaseClient.sendMessage(
                        this.currentSession.session_code,
                        this.currentPlayer,
                        parsedCommand.originalText,
                        'chat',
                        this.isStoryteller
                    );
            }
        } catch (error) {
            console.error('Error handling command:', error);
            // Send error message to chat
            await this.sendSystemMessage(`Error processing command: ${error.message}`);
        }
    }

    // Handle attack commands
    async handleAttackCommand(attackData) {
        // Send the attack command to chat
        await this.supabaseClient.sendMessage(
            this.currentSession.session_code,
            attackData.playerName,
            `ATTACK:${attackData.playerName}:${attackData.roll}:${attackData.damage}:${attackData.weapon}`,
            'game_command',
            false
        );

        // Process the attack if there are enemies
        if (this.combatHandler.getActiveEnemies().length > 0) {
            const result = this.combatHandler.processAttack(attackData);
            
            // Send the result to chat
            await this.supabaseClient.sendMessage(
                this.currentSession.session_code,
                'Combat System',
                result.message,
                'game_response',
                false
            );
        }
    }

    // Handle other roll commands
    async handleRollCommand(rollData) {
        let message = '';
        switch (rollData.type) {
            case 'roll':
                message = `🎲 ${rollData.playerName} rolled ${rollData.die}${rollData.modifier > 0 ? '+' + rollData.modifier : rollData.modifier < 0 ? rollData.modifier : ''} for ${rollData.purpose}`;
                break;
            case 'skill':
                message = `🎯 ${rollData.playerName} rolled ${rollData.skillName}: ${rollData.roll}${rollData.modifier > 0 ? '+' + rollData.modifier : rollData.modifier < 0 ? rollData.modifier : ''}`;
                break;
            case 'save':
                message = `🛡️ ${rollData.playerName} rolled ${rollData.saveType} save: ${rollData.roll}${rollData.modifier > 0 ? '+' + rollData.modifier : rollData.modifier < 0 ? rollData.modifier : ''}`;
                break;
        }

        await this.supabaseClient.sendMessage(
            this.currentSession.session_code,
            rollData.playerName,
            message,
            'game_response',
            false
        );
    }

    // Send system message
    async sendSystemMessage(message) {
        if (!this.currentSession) return;
        
        await this.supabaseClient.sendMessage(
            this.currentSession.session_code,
            'System',
            message,
            'system',
            false
        );
    }

    // Subscribe to real-time messages
    async subscribeToMessages(sessionCode) {
        this.messageSubscription = this.supabaseClient.subscribeToMessages(
            sessionCode,
            (payload) => this.handleMessageReceived(payload)
        );
    }

    // Handle received messages
    handleMessageReceived(payload) {
        const messageData = payload.new;
        const formatted = this.messageFormatter.formatMessage(messageData);
        
        if (this.onMessageReceived) {
            this.onMessageReceived(formatted);
        }
    }

    // Handle enemy defeated
    async handleEnemyDefeated(enemy, killerName) {
        const deathMessage = this.combatHandler.generateDeathMessage(enemy, killerName);
        await this.sendSystemMessage(deathMessage);
    }

    // Handle combat events
    handleCombatEvent(eventType, data) {
        console.log(`⚔️ Combat event: ${eventType}`, data);
    }

    // Add enemy to combat
    addEnemy(enemyData) {
        return this.combatHandler.addEnemy(enemyData);
    }

    // Get combat status
    getCombatStatus() {
        return {
            activeEnemies: this.combatHandler.getActiveEnemies(),
            allEnemies: this.combatHandler.getAllEnemies(),
            combatLog: this.combatHandler.getCombatLog()
        };
    }

    // Set event handlers
    setEventHandlers(onMessageReceived, onConnectionChange, onError) {
        this.onMessageReceived = onMessageReceived;
        this.onConnectionChange = onConnectionChange;
        this.onError = onError;
    }

    // Get current state
    getState() {
        return {
            isConnected: this.currentSession !== null,
            currentSession: this.currentSession,
            currentPlayer: this.currentPlayer,
            isStoryteller: this.isStoryteller,
            supabaseInitialized: this.supabaseClient.isInitialized()
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
} else {
    window.ChatManager = ChatManager;
}
