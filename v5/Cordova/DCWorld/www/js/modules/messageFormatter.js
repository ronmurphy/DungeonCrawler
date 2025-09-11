// ========================================
// MESSAGE FORMATTER MODULE
// Portable message display and formatting
// ========================================

class MessageFormatter {
    constructor() {
        this.messageTypes = {
            chat: 'chat-message',
            system: 'chat-message system',
            game_command: 'chat-message game_command', 
            game_response: 'chat-message game_response',
            combat: 'chat-message game_response',
            death: 'chat-message system'
        };
    }

    formatMessage(messageData) {
        const { player_name, message_text, message_type, is_storyteller, created_at } = messageData;
        
        return {
            id: messageData.id || Date.now(),
            sender: player_name || 'System',
            content: message_text,
            type: message_type || 'chat',
            isStoryteller: is_storyteller || false,
            timestamp: created_at || new Date().toISOString(),
            cssClass: this.getCssClass(message_type, is_storyteller)
        };
    }

    getCssClass(messageType, isStoryteller) {
        const baseClass = this.messageTypes[messageType] || this.messageTypes.chat;
        return isStoryteller ? `${baseClass} storyteller` : baseClass;
    }

    createMessageElement(formattedMessage) {
        const messageDiv = document.createElement('div');
        messageDiv.className = formattedMessage.cssClass;
        messageDiv.dataset.messageId = formattedMessage.id;

        const header = document.createElement('div');
        header.className = 'message-header';

        const sender = document.createElement('span');
        sender.className = 'sender';
        sender.textContent = formattedMessage.sender;

        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = this.formatTimestamp(formattedMessage.timestamp);

        header.appendChild(sender);
        header.appendChild(timestamp);

        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Process chat effects if available
        if (window.chatEffectsManager) {
            const processedContent = window.chatEffectsManager.processMessage(formattedMessage.content);
            if (processedContent.hasEffects) {
                content.innerHTML = processedContent.html;
                // Add effect classes to the message container
                if (processedContent.effectClasses) {
                    messageDiv.className += ' ' + processedContent.effectClasses;
                }
            } else {
                content.textContent = formattedMessage.content;
            }
        } else {
            content.textContent = formattedMessage.content;
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Create formatted attack result message
    formatAttackResult(attackResult) {
        let content = `💥 ${attackResult.playerName} attacks with ${attackResult.weapon} (rolled ${attackResult.roll}):\n`;
        
        if (attackResult.hits.length === 0) {
            content = `💥 ${attackResult.playerName} attacks with ${attackResult.weapon} (rolled ${attackResult.roll}) but misses all enemies!`;
        } else {
            attackResult.hits.forEach(hit => {
                if (hit.wasKilled) {
                    content += `💀 KILLED ${hit.enemyName} with ${hit.damage} damage!\n`;
                } else {
                    content += `🎯 Hit ${hit.enemyName} for ${hit.damage} damage (${hit.remainingHp} HP left)\n`;
                }
            });
        }

        return {
            content: content.trim(),
            type: 'game_response',
            cssClass: this.messageTypes.game_response
        };
    }

    // Create formatted death message
    formatDeathMessage(enemy, killerName, deathMessage) {
        return {
            content: deathMessage,
            type: 'system',
            cssClass: this.messageTypes.death,
            sender: 'Combat System'
        };
    }

    // Utility methods for creating different message types
    static createSystemMessage(content) {
        return {
            player_name: 'System',
            message_text: content,
            message_type: 'system',
            is_storyteller: false,
            created_at: new Date().toISOString()
        };
    }

    static createCombatMessage(content) {
        return {
            player_name: 'Combat System',
            message_text: content,
            message_type: 'game_response',
            is_storyteller: false,
            created_at: new Date().toISOString()
        };
    }

    static createCommandMessage(playerName, content) {
        return {
            player_name: playerName,
            message_text: content,
            message_type: 'game_command',
            is_storyteller: false,
            created_at: new Date().toISOString()
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageFormatter;
} else {
    window.MessageFormatter = MessageFormatter;
}
