/**
 * Chat Effects System
 * Integrates with Icon Studio-style animations for chat messages
 * Based on David's evening implementation suggestions
 */

class ChatEffectsManager {
    constructor() {
        this.effects = null;
        this.initialized = false;
        this.loadEffects();
    }

    /**
     * Load effects configuration from JSON
     */
    async loadEffects() {
        try {
            const response = await fetch('data/enhanced_chat_effects.json');
            this.effects = await response.json();
            this.initialized = true;
            console.log('Chat effects loaded:', Object.keys(this.effects.effects).length, 'categories');
        } catch (error) {
            console.error('Failed to load chat effects:', error);
            this.effects = { effects: { basic: {}, gaming: {}, modifiers: {} } };
        }
    }

    /**
     * Process a message for effect commands
     * @param {string} message - Original message text
     * @returns {object} - { html: processedHTML, hasEffects: boolean }
     */
    processMessage(message) {
        if (!this.initialized || !message) {
            return { html: message, hasEffects: false };
        }

        let processedMessage = message;
        let hasEffects = false;
        const appliedEffects = [];

        // Find all effect commands
        const effectCommands = this.findEffectCommands(message);
        
        if (effectCommands.length === 0) {
            return { html: message, hasEffects: false };
        }

        // Separate modifiers from main effects
        const modifiers = effectCommands.filter(cmd => this.isModifier(cmd));
        const mainEffects = effectCommands.filter(cmd => !this.isModifier(cmd));

        // Build CSS classes
        let effectClasses = [];
        
        // Add ALL main effects (support chaining)
        mainEffects.forEach(effectCommand => {
            const effectData = this.getEffectDataByCommand(effectCommand);
            if (effectData) {
                effectClasses.push('chat-effect', effectData.class);
                appliedEffects.push(effectCommand);
                hasEffects = true;
            }
        });

        // Add modifiers
        modifiers.forEach(modifier => {
            const modifierData = this.getModifierDataByCommand(modifier);
            if (modifierData) {
                effectClasses.push(modifierData.class);
                appliedEffects.push(modifier);
                hasEffects = true;
            }
        });

        // Remove effect commands from message, handling invisible vs visible modifiers
        effectCommands.forEach(cmd => {
            const effectData = this.getEffectDataByCommand(cmd) || this.getModifierDataByCommand(cmd);
            
            // Only remove invisible modifiers and main effects from the text
            if (!effectData || effectData.invisible !== false) {
                processedMessage = processedMessage.replace(new RegExp(this.escapeRegex(cmd), 'g'), '');
            }
        });

        // Clean up extra spaces
        processedMessage = processedMessage.replace(/\s+/g, ' ').trim();

        // Wrap in span with effect classes if effects were found
        if (hasEffects && processedMessage) {
            const classString = effectClasses.join(' ');
            processedMessage = `<span class="${classString}" data-effects="${appliedEffects.join(',')}">${processedMessage}</span>`;
            
            console.log('Applied effects:', appliedEffects.join(', '), 'to message:', processedMessage.substring(0, 50) + '...');
        }

        return {
            html: processedMessage,
            hasEffects: hasEffects,
            effects: appliedEffects
        };
    }

    /**
     * Find all effect commands in a message
     * @param {string} message 
     * @returns {Array} - Array of found commands like [':bounce:', ':fast:']
     */
    findEffectCommands(message) {
        const commands = [];
        const regex = /:[\w-]+:/g;
        let match;

        while ((match = regex.exec(message)) !== null) {
            const command = match[0];
            console.log(`🔍 Found potential command: ${command}`);
            if (this.isValidEffect(command)) {
                console.log(`✅ Valid effect command: ${command}`);
                commands.push(command);
            } else {
                console.log(`❌ Invalid effect command: ${command}`);
            }
        }

        console.log(`🔍 Final effect commands found: [${commands.join(', ')}]`);
        return commands;
    }

    /**
     * Get effect data by command (like ':magic:')
     * @param {string} command - Command with colons like ':magic:'
     * @returns {object|null}
     */
    getEffectDataByCommand(command) {
        if (!this.effects) return null;

        // Check basic effects
        for (const key in this.effects.effects.basic) {
            if (this.effects.effects.basic[key].command === command) {
                return this.effects.effects.basic[key];
            }
        }

        // Check gaming effects
        for (const key in this.effects.effects.gaming) {
            if (this.effects.effects.gaming[key].command === command) {
                return this.effects.effects.gaming[key];
            }
        }

        return null;
    }

    /**
     * Get modifier data by command (like ':fast:')
     * @param {string} command - Command with colons like ':fast:'
     * @returns {object|null}
     */
    getModifierDataByCommand(command) {
        if (!this.effects) return null;

        // Check modifiers
        for (const key in this.effects.effects.modifiers) {
            if (this.effects.effects.modifiers[key].command === command) {
                return this.effects.effects.modifiers[key];
            }
        }

        return null;
    }

    /**
     * Check if a command is a valid effect
     * @param {string} command - Command like ':bounce:'
     * @returns {boolean}
     */
    isValidEffect(command) {
        return this.getEffectDataByCommand(command) !== null || this.getModifierDataByCommand(command) !== null;
    }

    /**
     * Check if a command is a modifier
     * @param {string} command - Command like ':fast:'
     * @returns {boolean}
     */
    isModifier(command) {
        return this.getModifierDataByCommand(command) !== null;
    }

    /**
     * Get effect data by name (legacy method for backwards compatibility)
     * @param {string} effectName - Name without colons
     * @returns {object|null}
     */
    getEffectData(effectName) {
        if (!this.effects) return null;

        // Check basic effects
        if (this.effects.effects.basic[effectName]) {
            return this.effects.effects.basic[effectName];
        }

        // Check gaming effects
        if (this.effects.effects.gaming[effectName]) {
            return this.effects.effects.gaming[effectName];
        }

        return null;
    }

    /**
     * Get modifier data by name
     * @param {string} modifierName - Name without colons
     * @returns {object|null}
     */
    getModifierData(modifierName) {
        if (!this.effects || !this.effects.effects.modifiers) return null;
        return this.effects.effects.modifiers[modifierName] || null;
    }

    /**
     * Get all available effects for UI display
     * @returns {object} - Categorized effects
     */
    getAvailableEffects() {
        if (!this.effects) return { basic: {}, gaming: {}, modifiers: {} };
        return this.effects.effects;
    }

    /**
     * Clean up animation after it completes
     * @param {HTMLElement} element - Element with animation
     */
    cleanupAnimation(element) {
        if (!element) return;

        // Remove animation classes after animation ends
        element.addEventListener('animationend', () => {
            element.classList.remove('chat-effect');
            const effectData = element.dataset.effects;
            if (effectData) {
                effectData.split(',').forEach(effect => {
                    const data = this.getEffectData(effect) || this.getModifierData(effect);
                    if (data && data.class) {
                        element.classList.remove(data.class);
                    }
                });
            }
        }, { once: true });
    }

    /**
     * Create effects picker HTML for UI
     * @returns {string} - HTML for effects picker
     */
    createEffectsPicker() {
        if (!this.effects) return '<div>Effects not loaded</div>';

        let html = '<div class="effects-picker">';
        
        // Basic effects
        html += '<div class="effect-category"><h4>Basic Effects</h4><div class="effect-buttons">';
        Object.entries(this.effects.effects.basic).forEach(([key, effect]) => {
            html += `<button class="effect-btn" data-command="${effect.command}" title="${effect.description}">${effect.name}</button>`;
        });
        html += '</div></div>';

        // Gaming effects
        html += '<div class="effect-category"><h4>DCC Effects</h4><div class="effect-buttons">';
        Object.entries(this.effects.effects.gaming).forEach(([key, effect]) => {
            html += `<button class="effect-btn" data-command="${effect.command}" title="${effect.description}">${effect.name}</button>`;
        });
        html += '</div></div>';

        // Modifiers
        html += '<div class="effect-category"><h4>Modifiers</h4><div class="effect-buttons">';
        Object.entries(this.effects.effects.modifiers).forEach(([key, modifier]) => {
            html += `<button class="effect-btn modifier" data-command="${modifier.command}" title="${modifier.description}">${modifier.name}</button>`;
        });
        html += '</div></div>';

        html += '</div>';
        return html;
    }

    /**
     * Escape regex special characters
     * @param {string} string 
     * @returns {string}
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Create global instance
window.chatEffectsManager = new ChatEffectsManager();

// Set global flag to indicate this module is loaded
window.isChatEffectsLoaded = true;
console.log('✅ ChatEffectsManager loaded and ready');

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatEffectsManager;
}
