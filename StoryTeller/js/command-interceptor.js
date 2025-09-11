/**
 * COMMAND INTERCEPTOR SYSTEM
 * ========================
 * 
 * This file intercepts chat messages AFTER supabase processes them but BEFORE they display.
 * It provides "distributed computing" st        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer}'s ${statParts[0] || 'stat'} changed by ${statParts[1] || '1'}`;
        case 'GOLD':
            return `📋 ${targetPlayer} ${parseInt(parameters) > 0 ? 'gained' : 'lost'} ${Math.abs(parseInt(parameters) || 0)} gold`;
        case 'CLEAN':
            return `📋 Database cleanup performed: ${parameters || 'standard cleanup'}`;
        default:
            return `📋 ${targetPlayer} received a ${command.toLowerCase()}`;mand processing where:
 * - Generic commands are sent via chat (e.g., "LOOT:PlayerName:handful_gold")
 * - Each client calculates specific results based on their perspective
 * - Players see personal results, storyteller sees details, others see generic descriptions
 * 
 * IMPORTANT: This file does NOT modify supabase-chat.js or any supabase files.
 * It works by hooking into the display function to intercept messages before rendering.
 * 
 * Commands supported:
 * - LOOT:PlayerName:loot_type (gives randomized loot to specific player)
 * - ACHIEVEMENT:PlayerName:achievement_name (awards achievement)
 * - LEVELUP:PlayerName:new_level (handles level progression)
 * 
 * Integration approach:
 * 1. Override the displayChatMessage function to intercept messages
 * 2. Check if message contains a command pattern
 * 3. Process command and show appropriate results based on user role
 * 4. Fall back to normal message display for non-commands
 */

// Global variables for command processing
let originalDisplayChatMessage = null;
let commandParser = null;

// Debug toggle - use global window variable
if (typeof window.showDebug === 'undefined') {
    window.showDebug = false;
}

/**
 * Initialize the command interceptor system
 * Call this after supabase-chat.js is loaded but before connecting
 */
function initializeCommandInterceptor() {
    console.log('🎯 Initializing Command Interceptor...');
    
    // Prevent double initialization
    if (window.commandInterceptorInitialized) {
        console.log('🎯 Command Interceptor already initialized');
        return true;
    }
    
    // Store reference to original display function
    if (typeof displayChatMessage === 'function') {
        // Make sure we're not storing a reference to ourselves
        if (displayChatMessage.name === 'interceptChatMessage') {
            console.warn('⚠️ displayChatMessage already intercepted - skipping');
            return false;
        }
        
        originalDisplayChatMessage = displayChatMessage;
        
        // Override the display function with our interceptor
        window.displayChatMessage = interceptChatMessage;
        window.commandInterceptorInitialized = true;
        
        console.log('✅ Command Interceptor hooked into displayChatMessage');
    } else {
        console.warn('⚠️ displayChatMessage function not found - interceptor not active');
        return false;
    }
    
    // Initialize command parser if available
    if (typeof ChatCommandParser !== 'undefined') {
        commandParser = new ChatCommandParser();
        console.log('✅ Command Parser initialized');
    } else {
        console.warn('⚠️ ChatCommandParser not available - commands will pass through unprocessed');
    }
    
    return true;
}

/**
 * Intercept chat messages before they display
 * This is the main hook that processes commands without modifying supabase
 */
async function interceptChatMessage(message) {
    // Recursion protection
    if (message._intercepted) {
        console.warn('⚠️ Message already intercepted, avoiding recursion');
        return;
    }
    
    // Mark message as intercepted
    message._intercepted = true;
    
    // Check if this looks like a command
    if (message.message_text && isCommandMessage(message.message_text)) {
        if (window.showDebug) console.log('🎯 Command detected:', message.message_text);
        
        // Process the command and get the appropriate display version
        const processedMessage = await processCommandMessage(message);
        
        // Only display if processedMessage is not null (silent commands return null)
        if (processedMessage !== null) {
            // Make sure we have the original function
            if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
                originalDisplayChatMessage(processedMessage);
            } else {
                console.error('❌ Original display function not available');
            }
        }
    } else {
        // Not a command - display normally
        if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
            originalDisplayChatMessage(message);
        } else {
            console.error('❌ Original display function not available');
        }
    }
}

/**
 * Check if a message contains a command pattern
 */
function isCommandMessage(messageText) {
    // Look for patterns like: COMMAND:PlayerName or COMMAND:PlayerName:parameters
    const commandPattern = /^(LOOT|ACHIEVEMENT|LEVELUP|ITEM|SKILL|EXP|GOLD|HEALTH|STAT|NOTE|CLEAN|COMBAT_START|COMBAT_STOP|COMBAT_END):[^:]+/;
    // Also check for special silent commands
    const silentCommandPattern = /^\/refreshmap$|^\/sendmap$|^\/github:/;
    // Also check for map sync messages that should be hidden
    const mapSyncPattern = /^MAP_SYNC:/;
    // Check for character sync messages that should be hidden
    const characterSyncPattern = /^CHAR_(ANNOUNCE|REQUEST|DATA):/;
    // Check for image messages that need processing
    const imagePattern = /^🖼️ \[IMAGE:.*\]$/;
    
    return commandPattern.test(messageText) || silentCommandPattern.test(messageText) || mapSyncPattern.test(messageText) || characterSyncPattern.test(messageText) || imagePattern.test(messageText);
}

/**
 * Process a command message and return the appropriate display version
 * based on the current user's role (player, storyteller, or observer)
 */
async function processCommandMessage(message) {
    const messageText = message.message_text;
    const currentPlayer = window.playerName;
    const isStoryteller = window.isStoryteller || window.isStoryTeller;
    
    // Handle special silent commands
    if (messageText === '/refreshmap') {
        console.log('📡 Processing silent map refresh command');
        
        // Trigger map refresh if MapSyncAdapter is available
        if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
            window.mapSyncAdapter.mapClientManager.checkForExistingMap();
            console.log('🗺️ Map refresh triggered');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle /sendmap command - storyteller shares current map
    if (messageText === '/sendmap') {
        console.log('📡 Processing sendmap command');
        
        // Only storytellers can send maps
        if (isStoryteller) {
            // Trigger the enhanced map sharing function
            if (typeof enhancedShareMapWithPlayers === 'function') {
                enhancedShareMapWithPlayers();
                console.log('🗺️ Map sharing triggered by /sendmap command');
            } else if (typeof shareMapWithPlayers === 'function') {
                shareMapWithPlayers();
                console.log('🗺️ Map sharing triggered by /sendmap command (fallback)');
            } else {
                console.warn('⚠️ Map sharing functions not available');
            }
        } else {
            // Players can request a map refresh using the new table
            if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
                const clientManager = window.mapSyncAdapter.mapClientManager;
                if (clientManager.getDBClient) {
                    clientManager.getDBClient()
                        .from('map_updates')
                        .insert([{
                            session_code: clientManager.currentSession,
                            action: 'refresh',
                            map_name: 'Player requested refresh'
                        }])
                        .then(() => console.log('📡 Refresh request sent via database'))
                        .catch(err => console.warn('⚠️ Could not send refresh request:', err));
                }
            }
            console.log('🔄 Player requested map refresh via /sendmap');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle /github:token command - storyteller distributes GitHub API token
    if (messageText.startsWith('/github:')) {
        console.log('📡 Processing GitHub token distribution command');
        
        // Only storytellers can distribute tokens
        if (isStoryteller) {
            const tokenPart = messageText.substring(8); // Remove '/github:'
            
            if (tokenPart) {
                // Store the token in IndexedDB for this storyteller
                if (window.githubTokenStorage) {
                    try {
                        await window.githubTokenStorage.storeToken(tokenPart);
                        console.log('🔑 GitHub API token stored in IndexedDB');
                    } catch (error) {
                        console.warn('⚠️ IndexedDB storage failed, using localStorage fallback');
                        localStorage.setItem('github_api_token', tokenPart);
                    }
                } else {
                    localStorage.setItem('github_api_token', tokenPart);
                }
                console.log('🔑 GitHub API token stored locally');
                
                // Initialize/update GitHubImageHost if it exists
                if (window.MultiImageHost) {
                    try {
                        // Update the GitHub configuration
                        const githubConfig = {
                            owner: 'ronmurphy',
                            repo: 'dcc-image-storage',
                            apiToken: tokenPart
                        };
                        
                        // Update existing GitHubImageHost instance
                        if (window.multiImageHost && window.multiImageHost.githubHost) {
                            window.multiImageHost.githubHost.config.apiToken = tokenPart;
                            console.log('🔑 GitHubImageHost token updated');
                        }
                        
                        console.log('✅ GitHub integration ready for image hosting');
                    } catch (error) {
                        console.warn('⚠️ Error updating GitHub configuration:', error);
                    }
                }
                
                // Show confirmation to storyteller
                if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
                    const confirmationMessage = {
                        ...message,
                        message_text: "✅ GitHub API key configured! Image hosting ready.",
                        sender_name: "System",
                        created_at: new Date().toISOString()
                    };
                    originalDisplayChatMessage(confirmationMessage);
                }
            } else {
                console.warn('⚠️ No token provided in /github: command');
            }
        } else {
            console.log('🔑 Player received GitHub token distribution (ignored)');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle MAP_SYNC messages - these should be processed but not displayed
    if (messageText.startsWith('MAP_SYNC:')) {
        console.log('📡 Processing MAP_SYNC notification');
        
        try {
            const syncData = JSON.parse(messageText.substring(9));
            if (syncData.action === 'map_shared') {
                console.log('📨 Map shared notification received:', syncData.mapName);
                // Trigger map refresh if MapSyncAdapter is available
                if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
                    window.mapSyncAdapter.mapClientManager.checkForExistingMap();
                    console.log('🗺️ Map refresh triggered by MAP_SYNC');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing MAP_SYNC message:', error);
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle CHAR_ sync messages - these should be processed but not displayed
    if (messageText.startsWith('CHAR_ANNOUNCE:') || messageText.startsWith('CHAR_REQUEST:') || messageText.startsWith('CHAR_DATA:')) {
        console.log('📡 Processing character sync message (silent)');
        
        try {
            // Let the character sync manager handle this message
            if (window.characterSyncManager) {
                window.characterSyncManager.handleCharacterSyncMessage(messageText, message.player_name);
            }
        } catch (error) {
            console.warn('⚠️ Error processing character sync message:', error);
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle image messages 🖼️ [IMAGE:url]
    if (messageText.match(/^🖼️ \[IMAGE:.*\]$/)) {
        console.log('📷 Processing image message:', messageText);
        
        // Extract image URL from message format: 🖼️ [IMAGE:url]
        const match = messageText.match(/\[IMAGE:([^\]]+)\]/);
        if (match) {
            const imageUrl = match[1];
            console.log('📷 Extracted image URL:', imageUrl);
            
            // Create image message for display
            const imageMessage = {
                ...message,
                message_text: `📷 shared an image` // Simple text that will be enhanced
            };
            
            // Display the message normally first
            if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
                originalDisplayChatMessage(imageMessage);
                
                // Then enhance the last message with the image button
                setTimeout(() => {
                    addImageButtonToChat(imageUrl, message.player_name);
                }, 100);
            }
            
            // Return null to prevent double display
            return null;
        } else {
            console.error('❌ Could not extract image URL from message:', messageText);
            return message; // Display as regular message if parsing fails
        }
    }
    
    // If this is the StoryTeller interface, don't process commands - let them display normally
    if (isStoryteller) {
        return message; // Pass through unchanged
    }
    
    // Parse regular commands (only for player interfaces)
    const commandParts = messageText.split(':');
    if (commandParts.length < 2) {
        // Malformed command - display as-is
        return message;
    }
    
    const command = commandParts[0];
    const targetPlayer = commandParts[1];
    const parameters = commandParts.length > 2 ? commandParts.slice(2).join(':') : null;
    
    // Determine what version to show based on user role
    let displayText;
    let messageType = 'command';
    
    if (targetPlayer === currentPlayer) {
        // This command is for the current player - show personal results
        displayText = await generatePersonalResult(command, parameters, message);
        messageType = 'personal-result';
    } else if (isStoryteller) {
        // Storyteller sees detailed results
        displayText = generateStorytelleroResult(command, targetPlayer, parameters);
        messageType = 'storyteller-result';
    } else {
        // Other players see generic description
        displayText = generateGenericResult(command, targetPlayer, parameters);
        messageType = 'generic-result';
    }
    
    // Return modified message
    return {
        ...message,
        message_text: displayText,
        message_type: messageType,
        original_command: messageText
    };
}

/**
 * Generate personal result for the target player
 */
async function generatePersonalResult(command, parameters, message) {
    if (!commandParser) {
        return `You received a ${command} command${parameters ? ': ' + parameters : ''}`;
    }
    
    switch (command) {
        case 'LOOT':
            return await generatePersonalLoot(parameters);
        case 'ACHIEVEMENT':
            return `🏆 Achievement Unlocked: ${parameters}!`;
        case 'LEVELUP':
            return `🎉 Congratulations! You've leveled up!`;
        case 'HEALTH':
            const healthAmount = parseInt(parameters);
            if (healthAmount > 0) {
                return `🩹 You were healed for ${healthAmount} health!`;
            } else {
                return `💥 You took ${Math.abs(healthAmount)} damage!`;
            }
        case 'EXP':
            return `⭐ You gained ${parameters} experience points!`;
        case 'SKILL':
            const skillParts = parameters ? parameters.split(':') : [];
            const skillName = skillParts[0] || 'Unknown Skill';
            const skillExp = skillParts[1] || 'some';
            return `📚 You trained ${skillName} and gained ${skillExp} experience!`;
        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            const statName = statParts[0] || 'a stat';
            const statChange = parseInt(statParts[1]) || 1;
            return `📊 Your ${statName} ${statChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(statChange)}!`;
        case 'GOLD':
            const goldAmount = parseInt(parameters) || 0;
            return `💰 You ${goldAmount > 0 ? 'gained' : 'lost'} ${Math.abs(goldAmount)} gold!`;
        case 'NOTE':
            console.log('🐛 Processing NOTE command for current player');
            // Add to notification system if available
            if (typeof addReceivedNote === 'function') {
                // Extract sender name from the message context
                const senderName = (message && message.player_name) || 'Unknown';
                console.log('🐛 Adding note to notification system:', senderName, parameters);
                
                // Parse the NOTE command: NOTE:Target:Text (V4-network style)
                const noteParts = parameters ? parameters.split(':') : [];
                const targetPlayer = noteParts[0] || '';
                const noteText = noteParts.slice(1).join(':') || '';
                
                // Create note data object matching StoryTeller format, but keep text as-is
                const noteData = {
                    sender: senderName,
                    recipient: targetPlayer,
                    text: noteText, // Keep full text including any image markup
                    imageUrl: '', // Don't parse separately - let the display function handle it
                    timestamp: new Date().toISOString()
                };
                
                // Handle async addReceivedNote properly
                try {
                    const result = addReceivedNote(noteData);
                    // If it returns a promise, handle any errors
                    if (result && typeof result.catch === 'function') {
                        result.catch(error => {
                            console.error('🐛 Error in addReceivedNote:', error);
                        });
                    }
                } catch (error) {
                    console.error('🐛 Error calling addReceivedNote:', error);
                }
            } else {
                console.warn('🐛 addReceivedNote function not available');
            }
            
            // Notes should not display in main chat - they're private!
            // Return null to suppress chat display
            return null;
        case 'CLEAN':
            // For players, just show a generic cleanup message
            return `🧹 The storyteller performed database maintenance`;
        case 'COMBAT_START':
            // Notify player that combat has started
            return `⚔️ **Combat has begun!** Use your DEX attribute to roll initiative.`;
        case 'COMBAT_STOP':
        case 'COMBAT_END':
            // Notify player that combat has ended
            return `🏁 **Combat has ended.** You can now rest and recover.`;
        default:
            return `You received: ${command}${parameters ? ' - ' + parameters : ''}`;
    }
}

/**
 * Generate storyteller result with details
 */
function generateStorytelleroResult(command, targetPlayer, parameters) {
    switch (command) {
        case 'LOOT':
            return `📋 ${targetPlayer} received loot (${parameters}) - see their screen for details`;
        case 'ACHIEVEMENT':
            return `📋 ${targetPlayer} earned achievement: ${parameters}`;
        case 'LEVELUP':
            return `📋 ${targetPlayer} leveled up to level null`;
        case 'HEALTH':
            const healthAmount = parseInt(parameters);
            return `📋 ${targetPlayer} ${healthAmount > 0 ? 'healed' : 'took damage'}: ${Math.abs(healthAmount)} HP`;
        case 'EXP':
            return `📋 ${targetPlayer} gained ${parameters} experience`;
        case 'SKILL':
            const skillParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer} trained ${skillParts[0] || 'a skill'}`;
        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer}'s ${statParts[0] || 'stat'} changed by ${statParts[1] || '1'}`;
        case 'GOLD':
            return `📋 ${targetPlayer} ${parseInt(parameters) > 0 ? 'gained' : 'lost'} ${Math.abs(parseInt(parameters))} gold`;
        case 'NOTE':
            return `📋 Note sent to ${targetPlayer}`;
        case 'COMBAT_START':
            return `📋 Combat initiated - waiting for ${targetPlayer} to roll initiative`;
        case 'COMBAT_STOP':
        case 'COMBAT_END':
            return `📋 Combat ended for ${targetPlayer}`;
        default:
            return `📋 ${targetPlayer} received ${command}: ${parameters}`;
    }
}

/**
 * Generate generic result for other players
 */
function generateGenericResult(command, targetPlayer, parameters) {
    switch (command) {
        case 'LOOT':
            return `💰 ${targetPlayer} found some loot!`;
        case 'ACHIEVEMENT':
            return `${targetPlayer} accomplished something noteworthy`;
        case 'LEVELUP':
            return `${targetPlayer} has grown stronger`;
        case 'NOTE':
            return `📝 Notes are being passed`;
        case 'CLEAN':
            return `🧹 Database maintenance performed`;
        case 'COMBAT_START':
            return `⚔️ Combat has begun`;
        case 'COMBAT_STOP':
        case 'COMBAT_END':
            return `🏁 Combat has ended`;
        default:
            return `${targetPlayer} received a ${command.toLowerCase()}`;
    }
}

/**
 * Generate specific loot results for the target player
 * Uses the ChatCommandParser if available
 */
async function generatePersonalLoot(lootType) {
    if (!commandParser) {
        return `💰 You found some ${formatLootName(lootType)}!`;
    }
    
    try {
        // Ensure current player is registered (with minimal data for now)
        const currentPlayer = window.playerName;
        if (!commandParser.getPlayer(currentPlayer)) {
            // Register player with basic data structure
            commandParser.registerPlayer(currentPlayer, {
                name: currentPlayer,
                level: 1,
                gold: 0,
                inventory: [],
                attributes: {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10
                }
            });
        }
        
        // Use the command parser to generate specific loot
        const result = await commandParser.processMessage(`LOOT:${currentPlayer}:${lootType}`, 'StoryTeller');
        
        if (result && result.success && result.message) {
            // Extract just the loot part for the player and make it more descriptive
            let personalMessage = result.message.replace(currentPlayer + ' ', 'You ');
            
            // Enhance the message with better formatting
            personalMessage = enhanceLootMessage(personalMessage, lootType, result);
            
            return personalMessage;
        } else {
            // Fallback to simple description
            return `💰 You found ${formatLootName(lootType)}!`;
        }
    } catch (error) {
        console.warn('Error generating personal loot:', error);
        return `💰 You found ${formatLootName(lootType)}!`;
    }
}

/**
 * Format loot type names to be more readable
 * @param {string} lootType - The loot type (e.g., "small_pouch", "handful_gold")
 * @returns {string} Formatted name (e.g., "Small Pouch", "Handful of Gold")
 */
function formatLootName(lootType) {
    const nameMap = {
        'small_pouch': 'Small Pouch',
        'handful_gold': 'Handful of Gold',
        'small_bag': 'Small Bag',
        'treasure_chest': 'Treasure Chest',
        'magic_item': 'Magic Item',
        'weapon': 'Weapon',
        'armor': 'Armor',
        'potion': 'Potion'
    };
    
    return nameMap[lootType] || lootType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Enhance loot message with better descriptions
 * @param {string} message - Original message
 * @param {string} lootType - Type of loot
 * @param {Object} result - Command result with details
 * @returns {string} Enhanced message
 */
function enhanceLootMessage(message, lootType, result) {
    // If we have gold awarded, format it nicely
    if (result.goldAwarded && result.diceRolled) {
        const lootName = formatLootName(lootType);
        return `💰 You found ${lootName} (${result.goldAwarded} gold)${result.rollsDetail ? ` - Rolled ${result.diceRolled}: ${result.rollsDetail.join('+')}` : ''}!`;
    }
    
    // If we have an item awarded, format it
    if (result.itemAwarded) {
        return `🎒 You found ${result.itemAwarded.name}!`;
    }
    
    // Default to the original message but with formatting
    return message;
}

/**
 * Add image button to the most recent chat message
 */
function addImageButtonToChat(imageUrl, playerName) {
    // Find the most recent chat message
    const chatMessages = document.querySelectorAll('.chat-message');
    let lastMessage = null;
    
    // Look for the most recent message that contains "📷 shared an image" and doesn't already have a button
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const message = chatMessages[i];
        if (message.innerHTML && message.innerHTML.includes('📷 shared an image') && !message.querySelector('[data-image-url]')) {
            lastMessage = message;
            break;
        }
    }
    
    if (lastMessage) {
        // Create the image button
        const imageButton = document.createElement('button');
        imageButton.setAttribute('data-image-url', imageUrl);
        imageButton.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            margin: 4px 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: white;
            font-size: 0.9em;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            vertical-align: middle;
        `;
        
        imageButton.innerHTML = `
            <span style="font-size: 1.2em;">📷</span>
            <span>View Image</span>
            <small style="opacity: 0.8; font-size: 0.8em;">(github)</small>
        `;
        
        // Use ChatImageSystem if available, otherwise open in new tab
        imageButton.onclick = () => {
            if (window.chatImageSystem && window.chatImageSystem.openImageModal) {
                window.chatImageSystem.openImageModal(imageUrl, playerName);
            } else {
                window.open(imageUrl, '_blank');
            }
        };
        
        imageButton.onmouseover = function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };
        
        imageButton.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        };

        // Replace the "📷 shared an image" text with just the button
        lastMessage.innerHTML = lastMessage.innerHTML.replace('📷 shared an image', '');
        lastMessage.appendChild(imageButton);
        
        console.log('✅ Image button added to chat message');
    } else {
        console.warn('⚠️ Could not find recent image message to enhance');
    }
}

// Auto-initialize when the script loads (after a short delay to ensure other scripts are ready)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeCommandInterceptor();
    }, 1000);
});

console.log('📜 Command Interceptor script loaded - waiting for initialization');
