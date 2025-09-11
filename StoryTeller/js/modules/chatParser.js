// ========================================
// CHAT PARSER MODULE
// Portable command parsing and processing
// ========================================

class ChatParser {
    constructor() {
        this.commands = new Map();
        this.setupDefaultCommands();
    }

    setupDefaultCommands() {
        // Register default commands
        this.registerCommand('ATTACK', this.parseAttackCommand.bind(this));
        this.registerCommand('ROLL', this.parseRollCommand.bind(this));
        this.registerCommand('SKILL', this.parseSkillCommand.bind(this));
        this.registerCommand('SAVE', this.parseSaveCommand.bind(this));
    }

    registerCommand(command, handler) {
        this.commands.set(command.toUpperCase(), handler);
    }

    parseMessage(messageText) {
        const trimmed = messageText.trim();
        
        // Check if it's a command (starts with a known command word)
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
            const command = parts[0].toUpperCase();
            if (this.commands.has(command)) {
                return {
                    isCommand: true,
                    command: command,
                    data: this.commands.get(command)(parts),
                    originalText: messageText
                };
            }
        }

        return {
            isCommand: false,
            originalText: messageText
        };
    }

    parseAttackCommand(parts) {
        // ATTACK:PlayerName:Roll:Damage:Weapon
        if (parts.length < 5) {
            throw new Error('Attack command format: ATTACK:PlayerName:Roll:Damage:Weapon');
        }

        return {
            type: 'attack',
            playerName: parts[1],
            roll: parseInt(parts[2]),
            damage: parseInt(parts[3]),
            weapon: parts[4],
            isValid: !isNaN(parseInt(parts[2])) && !isNaN(parseInt(parts[3]))
        };
    }

    parseRollCommand(parts) {
        // ROLL:PlayerName:Die:Modifier:Purpose
        if (parts.length < 4) {
            throw new Error('Roll command format: ROLL:PlayerName:Die:Modifier:Purpose');
        }

        return {
            type: 'roll',
            playerName: parts[1],
            die: parts[2],
            modifier: parseInt(parts[3]) || 0,
            purpose: parts[4] || 'General roll'
        };
    }

    parseSkillCommand(parts) {
        // SKILL:PlayerName:SkillName:Roll:Modifier
        if (parts.length < 4) {
            throw new Error('Skill command format: SKILL:PlayerName:SkillName:Roll:Modifier');
        }

        return {
            type: 'skill',
            playerName: parts[1],
            skillName: parts[2],
            roll: parseInt(parts[3]),
            modifier: parseInt(parts[4]) || 0
        };
    }

    parseSaveCommand(parts) {
        // SAVE:PlayerName:SaveType:Roll:Modifier
        if (parts.length < 4) {
            throw new Error('Save command format: SAVE:PlayerName:SaveType:Roll:Modifier');
        }

        return {
            type: 'save',
            playerName: parts[1],
            saveType: parts[2],
            roll: parseInt(parts[3]),
            modifier: parseInt(parts[4]) || 0
        };
    }

    // Utility method to create command strings
    static createAttackCommand(playerName, roll, damage, weapon) {
        return `ATTACK:${playerName}:${roll}:${damage}:${weapon}`;
    }

    static createRollCommand(playerName, die, modifier = 0, purpose = '') {
        return `ROLL:${playerName}:${die}:${modifier}:${purpose}`;
    }

    static createSkillCommand(playerName, skillName, roll, modifier = 0) {
        return `SKILL:${playerName}:${skillName}:${roll}:${modifier}`;
    }

    static createSaveCommand(playerName, saveType, roll, modifier = 0) {
        return `SAVE:${playerName}:${saveType}:${roll}:${modifier}`;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatParser;
} else {
    window.ChatParser = ChatParser;
}
