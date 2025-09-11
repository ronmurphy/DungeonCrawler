# Image Sharing System Documentation
**Date: August 31, 2025**

## Overview

The DCC-custom project implements a cross-platform image sharing system that allows users to upload and share images between V4-network and StoryTeller applications in real-time. Images are stored on GitHub and shared via Supabase real-time messaging.

## System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  V4-network │    │   GitHub    │    │  Supabase   │    │ StoryTeller │
│             │    │   Storage   │    │  Real-time  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Upload Image   │                   │                   │
       ├──────────────────>│                   │                   │
       │                   │                   │                   │
       │ 2. Send Message   │                   │                   │
       ├──────────────────────────────────────>│                   │
       │                   │                   │ 3. Broadcast      │
       │                   │                   ├──────────────────>│
       │                   │                   │                   │
       │ 4. Receive & Display                  │ 4. Receive & Display
       │<──────────────────────────────────────┤<──────────────────┤
```

## How It Works

### 1. Image Upload Flow
1. User clicks camera button in either V4-network or StoryTeller
2. File is uploaded to GitHub repository (`dcc-image-storage`) with character-based organization
3. App sends `🖼️ [IMAGE:url]` message to Supabase chat
4. Both apps receive the message via real-time subscription
5. Command interceptors process the message and create interactive image buttons

### 2. Character-Based Organization
Images are organized in GitHub by character name:
```
dcc-image-storage/
├── Player1/
│   ├── image1.jpg
│   └── image2.png
├── Player2/
│   └── screenshot.jpg
└── StoryTeller/
    └── map.png
```

### 3. Real-time Synchronization
- Both apps subscribe to the same Supabase session
- Image messages use special format: `🖼️ [IMAGE:https://github.com/...]`
- Command interceptors recognize this pattern and create buttons instead of text

## Code Implementation

### V4-network Integration

**File:** `V4-network/js/chatImageUploadIntegration.js`

```javascript
// Upload and send to Supabase
async handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Upload to GitHub with character organization
        const result = await window.multiImageHost.uploadImage(file, { characterName });
        
        // Send to Supabase for real-time sharing
        await this.sendImageToChat(result, characterName);
        
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

// Send image message to Supabase
async sendImageToChat(uploadResult, characterName) {
    const imageMessage = `🖼️ [IMAGE:${uploadResult.url}]`;
    
    if (typeof window.sendChatMessageAsync === 'function') {
        await window.sendChatMessageAsync(imageMessage);
    } else if (typeof window.sendChatMessage === 'function') {
        await window.sendChatMessage(imageMessage);
    }
}
```

### StoryTeller Integration

**File:** `StoryTeller/js/chatImageUploadIntegration.js`

```javascript
// Upload and send to Supabase
async handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Upload to GitHub
        const result = await window.multiImageHost.uploadImage(file);
        
        // Send to Supabase for real-time sharing
        await this.sendImageToChat(result);
        
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

// Send image message to Supabase
async sendImageToChat(uploadResult) {
    const imageMessage = `🖼️ [IMAGE:${uploadResult.url}]`;
    
    if (typeof window.sendChatMessageAsync === 'function') {
        await window.sendChatMessageAsync(imageMessage);
    } else if (typeof window.sendChatMessage === 'function') {
        await window.sendChatMessage(imageMessage);
    } else if (window.supabaseChat && typeof window.supabaseChat.sendChatMessage === 'function') {
        await window.supabaseChat.sendChatMessage(imageMessage);
    }
}
```

### Command Interceptor System

Both apps use identical command interceptors to process incoming image messages:

**Files:** 
- `V4-network/js/command-interceptor.js`
- `StoryTeller/js/command-interceptor.js`

```javascript
// Pattern matching for image messages
function isCommandMessage(messageText) {
    const imagePattern = /^🖼️ \[IMAGE:.*\]$/;
    return imagePattern.test(messageText);
}

// Process image messages
function processCommandMessage(message, isStoryteller = false) {
    const messageText = message.message_text;
    
    // Handle image messages 🖼️ [IMAGE:url]
    if (messageText.match(/^🖼️ \[IMAGE:.*\]$/)) {
        console.log('📷 Processing image message:', messageText);
        
        // Extract image URL from message format
        const match = messageText.match(/\[IMAGE:([^\]]+)\]/);
        if (match) {
            const imageUrl = match[1];
            
            // Create placeholder message first
            const imageMessage = {
                ...message,
                message_text: `📷 shared an image`
            };
            
            // Display message then enhance with button
            if (originalDisplayChatMessage) {
                originalDisplayChatMessage(imageMessage);
                
                setTimeout(() => {
                    addImageButtonToChat(imageUrl, message.player_name);
                }, 100);
            }
            
            return null; // Prevent double display
        }
    }
}

// Create interactive image button
function addImageButtonToChat(imageUrl, playerName) {
    // Find the most recent message containing "📷 shared an image"
    const chatMessages = document.querySelectorAll('.chat-message');
    let lastMessage = null;
    
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const message = chatMessages[i];
        if (message.innerHTML && message.innerHTML.includes('📷 shared an image') && 
            !message.querySelector('[data-image-url]')) {
            lastMessage = message;
            break;
        }
    }
    
    if (lastMessage) {
        // Create styled button
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
        `;
        
        imageButton.innerHTML = `
            <span style="font-size: 1.2em;">📷</span>
            <span>View Image</span>
            <small style="opacity: 0.8;">(github)</small>
        `;
        
        // Open image in modal when clicked
        imageButton.onclick = () => {
            if (window.chatImageSystem && window.chatImageSystem.openImageModal) {
                window.chatImageSystem.openImageModal(imageUrl, playerName);
            } else {
                window.open(imageUrl, '_blank');
            }
        };
        
        // Replace text with button
        lastMessage.innerHTML = lastMessage.innerHTML.replace('📷 shared an image', '');
        lastMessage.appendChild(imageButton);
    }
}
```

### Modal Display System

**File:** `ChatImageSystem.js` (used by both apps)

```javascript
// Unified white modal with download functionality
openImageModal(imageUrl, playerName) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 90%;
        max-height: 90%;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    // Add image and download button
    modal.innerHTML = `
        <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
        <div style="margin-top: 15px; text-align: center;">
            <button onclick="window.open('${imageUrl}', '_blank')" 
                    style="background: #007bff; color: white; border: none; 
                           padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                📥 Download
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
```

## Message Flow Examples

### Successful Image Share
```
1. V4-network: User uploads "screenshot.jpg"
   -> GitHub: https://github.com/user/dcc-image-storage/raw/main/Player1/screenshot.jpg
   -> Supabase: "🖼️ [IMAGE:https://github.com/user/dcc-image-storage/raw/main/Player1/screenshot.jpg]"

2. Both Apps Receive:
   -> Command Interceptor: Detects image pattern
   -> Display: "Player1 📷 [View Image]" button
   -> Click: Opens white modal with download option
```

### Character Organization
```javascript
// V4-network character detection
if (typeof character !== 'undefined' && character && character.name) {
    characterName = character.name.trim();
} else if (typeof window.networkPlayerName !== 'undefined' && window.networkPlayerName) {
    characterName = window.networkPlayerName;
}

// Results in GitHub path: /CharacterName/image.jpg
```

## Key Features

### ✅ Cross-Platform Compatibility
- Images uploaded in V4-network appear instantly in StoryTeller
- Images uploaded in StoryTeller appear instantly in V4-network
- Both use identical command interceptor logic

### ✅ Character-Based Organization
- Images automatically organized by character name in GitHub
- Supports multiple characters per session
- Easy to locate specific character's images

### ✅ Real-time Synchronization
- Uses Supabase real-time subscriptions
- No polling or manual refresh required
- Instant notification when images are shared

### ✅ Unified UI Experience
- Consistent white modal design across both apps
- Gradient image buttons with hover effects
- Download functionality built-in

### ✅ Error Handling
- Graceful fallbacks if GitHub upload fails
- Local display if Supabase unavailable
- Clear error messages and console logging

## Dependencies

### Required Services
- **GitHub Repository**: `dcc-image-storage` for image hosting
- **Supabase**: Real-time messaging and session management
- **GitHub API Token**: For uploading images to repository

### Required Files
- `multiImageHost.js`: GitHub upload functionality
- `chatImageUploadIntegration.js`: UI and upload logic
- `command-interceptor.js`: Message processing
- `ChatImageSystem.js`: Modal display system
- `supabase-chat.js`: Real-time messaging

## Session Management

Both apps must be connected to the same Supabase session:
```javascript
// Session code format (case-insensitive)
sessionCode = sessionCode.toUpperCase(); // Always uppercase for consistency
```

## Troubleshooting

### Images Not Appearing Cross-Platform
1. Check if both apps are connected to same session
2. Verify Supabase connection is active
3. Ensure command interceptors are initialized
4. Check browser console for error messages

### GitHub Upload Failures
1. Verify GitHub API token is configured
2. Check repository permissions
3. Ensure `dcc-image-storage` repository exists
4. Verify network connectivity

### Console Debug Commands
```javascript
// Check if systems are loaded
console.log('Image System:', !!window.multiImageHost);
console.log('Chat Functions:', !!window.sendChatMessage);
console.log('Command Interceptor:', !!window.originalDisplayChatMessage);

// Test image message processing
window.testImageMessage = function() {
    const testMessage = {
        message_text: '🖼️ [IMAGE:https://example.com/test.jpg]',
        player_name: 'TestPlayer'
    };
    if (window.processCommandMessage) {
        window.processCommandMessage(testMessage);
    }
};
```

## Future Enhancements

- **Image Thumbnails**: Generate thumbnails for faster loading
- **Image Gallery**: Browse all session images in organized view
- **Image Categories**: Tag images by type (map, character, item, etc.)
- **Offline Support**: Cache images for offline viewing
- **Image Editing**: Basic editing tools (crop, annotate, etc.)

---
*Last Updated: August 31, 2025*
*System Status: ✅ Fully Operational*
