/**
 * SHARED CHAT PICKER MANAGER
 * Universal emoji and effects picker for both V4-network and StoryTeller
 * Adapts UI based on platform (mobile vs desktop)
 */

class ChatPickerManager {
    constructor(options = {}) {
        this.isMobile = options.isMobile || this.detectMobile();
        this.theme = options.theme || 'auto'; // mobile, desktop, auto
        this.emojiCategories = this.getEmojiCategories();
        this.effectsData = null;
        this.currentTab = 'emojis';
        
        // Platform-specific styling
        this.styles = this.getStylesForPlatform();
    }

    detectMobile() {
        return window.innerWidth <= 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    getEmojiCategories() {
        return {
            combat: {
                name: '⚔️ Combat',
                emojis: [
                    { emoji: '⚔️', code: ':sword:', name: 'Sword' },
                    { emoji: '🛡️', code: ':shield:', name: 'Shield' },
                    { emoji: '💥', code: ':boom:', name: 'Boom' },
                    { emoji: '💢', code: ':fumble:', name: 'Fumble' },
                    { emoji: '🏹', code: ':bow:', name: 'Bow' },
                    { emoji: '🗡️', code: ':thief:', name: 'Dagger' }
                ]
            },
            magic: {
                name: '✨ Magic',
                emojis: [
                    { emoji: '✨', code: ':mp:', name: 'Magic' },
                    { emoji: '🔮', code: ':spell:', name: 'Spell' },
                    { emoji: '🔥', code: ':fire:', name: 'Fire' },
                    { emoji: '❄️', code: ':ice:', name: 'Ice' },
                    { emoji: '⚡', code: ':lightning:', name: 'Lightning' },
                    { emoji: '☠️', code: ':poison:', name: 'Poison' }
                ]
            },
            items: {
                name: '💰 Items',
                emojis: [
                    { emoji: '💰', code: ':treasure:', name: 'Treasure' },
                    { emoji: '🎲', code: ':dice:', name: 'Dice' },
                    { emoji: '💀', code: ':skull:', name: 'Skull' },
                    { emoji: '💚', code: ':heal:', name: 'Heal' },
                    { emoji: '🍀', code: ':luck:', name: 'Luck' },
                    { emoji: '⭐', code: ':star:', name: 'Star' }
                ]
            },
            social: {
                name: '😊 Social',
                emojis: [
                    { emoji: '😊', code: ':)', name: 'Happy' },
                    { emoji: '😁', code: ':D', name: 'Grin' },
                    { emoji: '😢', code: ':(', name: 'Sad' },
                    { emoji: '😉', code: ';)', name: 'Wink' },
                    { emoji: '❤️', code: '<3', name: 'Heart' },
                    { emoji: '👍', code: ':thumbsup:', name: 'Thumbs Up' }
                ]
            },
            rpg: {
                name: '🎭 RPG',
                emojis: [
                    { emoji: '🧙', code: ':wizard:', name: 'Wizard' },
                    { emoji: '⛪', code: ':cleric:', name: 'Cleric' },
                    { emoji: '🧔', code: ':dwarf:', name: 'Dwarf' },
                    { emoji: '🧝', code: ':elf:', name: 'Elf' },
                    { emoji: '👤', code: ':human:', name: 'Human' },
                    { emoji: '🦶', code: ':halfling:', name: 'Halfling' }
                ]
            }
        };
    }

    getStylesForPlatform() {
        if (this.isMobile) {
            return {
                modal: `
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--bg-primary);
                    border-radius: 16px 16px 0 0;
                    max-height: 70vh;
                    z-index: 10000;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                `,
                emojiGrid: 'grid-template-columns: repeat(6, 1fr); gap: 6px;',
                emojiButton: `
                    aspect-ratio: 1;
                    min-height: 44px;
                    padding: 8px;
                    font-size: 1.3em;
                    border-radius: 6px;
                `
            };
        } else {
            return {
                modal: `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-primary);
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    z-index: 10000;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    border: 1px solid var(--border-color);
                `,
                emojiGrid: 'grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;',
                emojiButton: `
                    min-height: 50px;
                    padding: 10px;
                    font-size: 1.4em;
                    border-radius: 8px;
                `
            };
        }
    }

    async show(inputId, effectsManager = null) {
        this.effectsData = effectsManager;
        this.targetInputId = inputId;
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'chat-picker-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'chat-picker-modal';
        modal.style.cssText = this.styles.modal;
        
        modal.innerHTML = this.generateModalHTML();
        
        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
            if (this.isMobile) {
                modal.style.transform = 'translateY(0)';
            }
        });
        
        // Event listeners
        backdrop.addEventListener('click', () => this.close());
        this.setupEventListeners(modal);
        
        return { modal, backdrop };
    }

    generateModalHTML() {
        return `
            <!-- Header -->
            <div style="
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: var(--text-primary);">
                    ${this.isMobile ? '💬 Chat Picker' : '🎨 Enhanced Chat Picker'}
                </h3>
                <button onclick="document.querySelector('.chat-picker-backdrop').click()" 
                        style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: var(--text-secondary);">
                    ×
                </button>
            </div>
            
            <!-- Tabs -->
            <div style="
                display: flex;
                border-bottom: 1px solid var(--border-color);
                background: var(--bg-secondary);
            ">
                <button class="picker-tab active" data-tab="emojis" style="
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--accent-color);
                    border-bottom: 2px solid var(--accent-color);
                    font-weight: 600;
                ">
                    😊 Emojis
                </button>
                <button class="picker-tab" data-tab="effects" style="
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-secondary);
                    border-bottom: 2px solid transparent;
                ">
                    ✨ Effects
                </button>
                <button class="picker-tab" data-tab="combos" style="
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-secondary);
                    border-bottom: 2px solid transparent;
                ">
                    🎨 Combos
                </button>
            </div>
            
            <!-- Content -->
            <div style="
                padding: 16px;
                max-height: ${this.isMobile ? '50vh' : '400px'};
                overflow-y: auto;
            ">
                <div id="picker-content">
                    ${this.generateEmojiContent()}
                </div>
            </div>
        `;
    }

    generateEmojiContent() {
        let content = '';
        
        Object.keys(this.emojiCategories).forEach(categoryKey => {
            const category = this.emojiCategories[categoryKey];
            content += `
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 0.9em; font-weight: 600;">
                        ${category.name}
                    </h5>
                    <div style="display: grid; ${this.styles.emojiGrid}">
            `;
            
            category.emojis.forEach(emoji => {
                content += `
                    <button onclick="window.chatPickerManager.insertText('${emoji.code}')" 
                            style="
                                background: var(--bg-secondary);
                                border: 1px solid var(--border-color);
                                ${this.styles.emojiButton}
                                cursor: pointer;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: var(--text-primary);
                            "
                            onmouseover="this.style.background='var(--accent-color)'; this.style.transform='scale(0.95)';"
                            onmouseout="this.style.background='var(--bg-secondary)'; this.style.transform='scale(1)';"
                            title="${emoji.name} (${emoji.code})">
                        ${emoji.emoji}
                    </button>
                `;
            });
            
            content += `</div></div>`;
        });
        
        return content;
    }

    insertText(text) {
        const input = document.getElementById(this.targetInputId);
        if (input) {
            const cursorPos = input.selectionStart;
            const textBefore = input.value.substring(0, cursorPos);
            const textAfter = input.value.substring(input.selectionEnd);
            
            input.value = textBefore + text + ' ' + textAfter;
            input.setSelectionRange(cursorPos + text.length + 1, cursorPos + text.length + 1);
            input.focus();
            
            // Trigger any input events
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        this.close();
    }

    close() {
        const backdrop = document.querySelector('.chat-picker-backdrop');
        const modal = document.querySelector('.chat-picker-modal');
        
        if (backdrop) backdrop.remove();
        if (modal) modal.remove();
    }

    setupEventListeners(modal) {
        // Tab switching
        modal.querySelectorAll('.picker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab appearance
        document.querySelectorAll('.picker-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.style.color = 'var(--accent-color)';
                tab.style.borderBottomColor = 'var(--accent-color)';
            } else {
                tab.style.color = 'var(--text-secondary)';
                tab.style.borderBottomColor = 'transparent';
            }
        });
        
        // Update content
        const content = document.getElementById('picker-content');
        if (content) {
            switch(tabName) {
                case 'emojis':
                    content.innerHTML = this.generateEmojiContent();
                    break;
                case 'effects':
                    content.innerHTML = this.generateEffectsContent();
                    break;
                case 'combos':
                    content.innerHTML = this.generateCombosContent();
                    break;
            }
        }
    }

    generateEffectsContent() {
        if (!this.effectsData) {
            return '<p style="text-align: center; color: var(--text-secondary);">Effects not available</p>';
        }
        
        // Implementation would go here based on effectsData
        return '<p style="text-align: center; color: var(--text-secondary);">Effects coming soon...</p>';
    }

    generateCombosContent() {
        const combos = [
            { combo: ':crit: :fire: ', text: 'CRITICAL FIRE!', desc: 'Critical Fire Attack' },
            { combo: ':spell: :lightning: ', text: 'Lightning Spell!', desc: 'Magic Lightning' },
            { combo: ':fumble: :boom: ', text: 'Epic Fail!', desc: 'Critical Fumble' },
            { combo: ':treasure: :star: ', text: 'Legendary Loot!', desc: 'Rare Treasure' }
        ];
        
        let content = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        combos.forEach(combo => {
            content += `
                <button onclick="window.chatPickerManager.insertText('${combo.combo}')"
                        style="
                            background: var(--bg-secondary);
                            border: 1px solid var(--border-color);
                            border-radius: 8px;
                            padding: 12px;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            color: var(--text-primary);
                            text-align: left;
                        "
                        onmouseover="this.style.background='var(--accent-color)'; this.style.color='white';"
                        onmouseout="this.style.background='var(--bg-secondary)'; this.style.color='var(--text-primary)';">
                    <div>
                        <strong>${combo.combo}</strong>${combo.text}
                    </div>
                    <span style="font-size: 0.8em; opacity: 0.7;">${combo.desc}</span>
                </button>
            `;
        });
        
        content += '</div>';
        return content;
    }
}

// Global instance
window.chatPickerManager = null;

// Initialize function
function initializeChatPicker(options = {}) {
    window.chatPickerManager = new ChatPickerManager(options);
    return window.chatPickerManager;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChatPickerManager, initializeChatPicker };
}
