/**
 * Emoji Processor for StoryTeller Chat
 * Converts text emoticons to emoji before sending to Supabase
 * Integrates with existing chat system
 */

class EmojiProcessor {
    constructor() {
        // Common text emoticons to emoji mappings
        this.emojiMap = {
            // Basic smileys
            ':)': '😊', ':]': '😊', '=)': '😊',
            ':D': '😁', '=D': '😁', 'XD': '😆',
            ':(': '😢', ':[': '😢', '=(': '😢',
            ':P': '😛', ':p': '😛', '=P': '😛',
            ';)': '😉', ';]': '😉',
            ':o': '😮', ':O': '😯', '=o': '😮',
            ':|': '😐', '=|': '😐',
            
            // Advanced expressions
            ':@': '😠', '>:(': '😠', '>:)': '😈',
            ':/': '😕', ':\\': '😕', '=\\': '😕',
            ':*': '😘', '<3': '❤️', '</3': '💔',
            'o_O': '😳', 'O_o': '😳', 'o.O': '😳',
            '^_^': '😊', '^.^': '😊', '-_-': '😑',
            
            // Gaming specific
            ':roll:': '🎲', ':dice:': '🎲',
            ':sword:': '⚔️', ':shield:': '🛡️',
            ':treasure:': '💰', ':gold:': '💰',
            ':mp:': '✨', ':spell:': '🔮',
            ':fire:': '🔥', ':ice:': '❄️',
            ':poison:': '☠️', ':heal:': '💚',
            
            // DCC specific
            ':boom:': '💥', ':fumble:': '💢',
            ':luck:': '🍀', ':skull:': '💀',
            ':cleric:': '⛪', ':wizard:': '🧙',
            ':warrior:': '⚔️', ':thief:': '🗡️',
            ':dwarf:': '🧔', ':elf:': '🧝',
            ':halfling:': '🦶', ':human:': '👤'
        };
        
        // Short codes (Discord/Slack style)
        this.shortCodes = {
            ':smile:': '😊', ':grin:': '😁', ':joy:': '😂',
            ':wink:': '😉', ':heart:': '❤️', ':star:': '⭐',
            ':thumbsup:': '👍', ':thumbsdown:': '👎',
            ':ok:': '👌', ':peace:': '✌️', ':fist:': '✊'
        };
        
        // Combine all mappings
        this.allMappings = { ...this.emojiMap, ...this.shortCodes };
    }
    
    /**
     * Check if message is a system command that should skip emoji processing
     * @param {string} message - The message to check
     * @returns {boolean} - True if message should skip emoji processing
     */
    isSystemCommand(message) {
        const commandPrefixes = [
            'LOOT:', 'ACHIEVEMENT:', 'LEVELUP:', 'ITEM:', 'SKILL:', 'EXP:',
            'GOLD:', 'HEALTH:', 'STAT:', 'NOTE:', 'CLEAN:', 'AVATAR_URL:',
            'DLCHAR:', 'MAP_SYNC:', '/dlchar:', '/github:', '/sendmap',
            'INITIATIVE:', 'COMBAT:', 'ATTACK:', 'DAMAGE:', 'HEAL:',
            'GRIND:', 'TRADE:', 'GUILD:', 'DUNGEON:'
        ];
        
        // Also skip messages that start with system emojis (like combat stats)
        const systemEmojiPrefixes = ['📊', '💰', '🎁', '⚔️', '🛡️', '💀', '🎯', '🎲', '🏆'];
        
        return commandPrefixes.some(prefix => message.startsWith(prefix)) ||
               systemEmojiPrefixes.some(prefix => message.startsWith(prefix));
    }

    /**
     * Process a message and convert text emoticons to emojis
     * @param {string} message - The message to process
     * @returns {string} - Message with emojis converted
     */
    processMessage(message) {
        if (!message || typeof message !== 'string') return message;
        
        // Skip emoji processing for system commands
        if (this.isSystemCommand(message)) {
            console.log('🚫 Skipping emoji processing for system command:', message.substring(0, 20) + '...');
            return message;
        }
        
        // Protect URLs from emoji conversion
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlPlaceholders = [];
        let processedMessage = message;
        
        // Replace URLs with placeholders
        processedMessage = processedMessage.replace(urlRegex, (match) => {
            const placeholder = `__URL_PLACEHOLDER_${urlPlaceholders.length}__`;
            urlPlaceholders.push(match);
            return placeholder;
        });
        
        // Sort by length (longest first) to avoid partial replacements
        const sortedKeys = Object.keys(this.allMappings).sort((a, b) => b.length - a.length);
        
        // Replace each emoticon with its emoji
        for (const emoticon of sortedKeys) {
            const emoji = this.allMappings[emoticon];
            
            if (emoticon.startsWith(':') && emoticon.endsWith(':')) {
                // Short codes like :doom: :wizard: - simple global replace
                if (processedMessage.includes(emoticon)) {
                    processedMessage = processedMessage.replaceAll(emoticon, emoji);
                }
            } else {
                // Symbol emoticons like :) :P - exact match with escaping
                const regex = new RegExp(this.escapeRegex(emoticon), 'g');
                processedMessage = processedMessage.replace(regex, emoji);
            }
        }
        
        // Restore URLs from placeholders
        urlPlaceholders.forEach((url, index) => {
            const placeholder = `__URL_PLACEHOLDER_${index}__`;
            processedMessage = processedMessage.replace(placeholder, url);
        });
        
        return processedMessage;
    }
    
    /**
     * Escape special regex characters in emoticon strings
     * @param {string} string - String to escape
     * @returns {string} - Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Test function to verify emoji processing
     */
    test() {
        console.log('🧪 Testing emoji processor...');
        const testCases = [
            'Hello :)',
            'I cast :mp: spell',
            'The :wizard: uses :doom: effect',
            'Rolling :roll: for damage',
            'Explosion :boom: happens!'
        ];
        
        testCases.forEach(test => {
            const result = this.processMessage(test);
            console.log(`Test: "${test}" → "${result}"`);
        });
    }
    
    /**
     * Get list of available emoticons for emoji picker
     * @returns {Object} - Categorized emoticons
     */
    getEmoticonList() {
        return {
            basic: {
                name: 'Basic',
                emojis: [
                    { code: ':)', emoji: '😊', name: 'Happy' },
                    { code: ':D', emoji: '😁', name: 'Grin' },
                    { code: ':(', emoji: '😢', name: 'Sad' },
                    { code: ':P', emoji: '😛', name: 'Tongue' },
                    { code: ';)', emoji: '😉', name: 'Wink' },
                    { code: '<3', emoji: '❤️', name: 'Heart' }
                ]
            },
            gaming: {
                name: 'Gaming',
                emojis: [
                    { code: ':roll:', emoji: '🎲', name: 'Dice' },
                    { code: ':sword:', emoji: '⚔️', name: 'Sword' },
                    { code: ':shield:', emoji: '🛡️', name: 'Shield' },
                    { code: ':treasure:', emoji: '💰', name: 'Gold' },
                    { code: ':mp:', emoji: '✨', name: 'Magic Points' },
                    { code: ':fire:', emoji: '🔥', name: 'Fire' }
                ]
            },
            dcc: {
                name: 'DCC',
                emojis: [
                    { code: ':boom:', emoji: '💥', name: 'Explosion' },
                    { code: ':luck:', emoji: '🍀', name: 'Lucky' },
                    { code: ':skull:', emoji: '💀', name: 'Skull' },
                    { code: ':cleric:', emoji: '⛪', name: 'Cleric' },
                    { code: ':wizard:', emoji: '🧙', name: 'Wizard' },
                    { code: ':warrior:', emoji: '⚔️', name: 'Warrior' }
                ]
            }
        };
    }
}

// Create global instance
window.emojiProcessor = new EmojiProcessor();

// Set global flag to indicate this module is loaded
window.isEmojiProcessorLoaded = true;
console.log('✅ EmojiProcessor loaded and ready');

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmojiProcessor;
}
