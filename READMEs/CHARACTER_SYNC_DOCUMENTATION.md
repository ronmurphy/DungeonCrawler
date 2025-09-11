# 🔄 Character Sync System Documentation

## Overview
Complete real-time character synchronization system between V4-network and StoryTeller using Supabase chat infrastructure with intelligent hash-based updates and automatic conflict resolution.

## 🏗️ Architecture

### Data Flow
```
V4-Network Player          →  Supabase  →  StoryTeller GM
┌─────────────────┐       ┌──────────┐  ┌─────────────────┐
│ Character Data  │ ────→ │   Chat   │  │ Import & Store  │
│ Hash Checking   │ ←──── │ Messages │  │ Hash Validation │
│ Auto Updates    │       └──────────┘  │ Request Missing │
└─────────────────┘                     └─────────────────┘
```

## 🎯 Key Features

### 🔍 Smart Sync Detection
- **Character Hashing**: MD5-style hash of critical character data
- **Change Detection**: Only syncs when character actually changes
- **Conflict Resolution**: Handles version conflicts automatically

### 📡 Real-time Communication
- **Supabase Integration**: Uses existing chat infrastructure
- **Silent Messages**: Sync commands don't appear in chat
- **Background Processing**: No user interruption

### 🎮 User Experience
- **Auto-Announce**: Characters auto-sync when joining chat
- **Progress Feedback**: Users see sync status and completion
- **Error Handling**: Graceful fallbacks and clear error messages

## 🔧 Technical Implementation

### Character Hash Algorithm
```javascript
generateCharacterHash(character) {
    const normalized = {
        name: character.name,
        level: character.level || 1,
        class: character.class,
        race: character.race,
        stats: character.stats || {},
        skills: character.skills || [],
        equipment: character.equipment || [],
        achievements: character.achievements || [],
        hitPoints: character.hitPoints || character.hp || 0,
        lastModified: character.lastModified
    };
    
    // Generate hash from normalized data
    return simpleHash(JSON.stringify(normalized, Object.keys(normalized).sort()));
}
```

### Message Protocol
```javascript
// Character Announcement
CHAR_ANNOUNCE:{
    "type": "character_announcement",
    "character_name": "Testificate", 
    "character_hash": "a1b2c3d4",
    "player_name": "PlayerName",
    "timestamp": 1693574400000
}

// Character Request (when StoryTeller needs data)
CHAR_REQUEST:{
    "type": "character_request",
    "character_name": "Testificate",
    "from_player": "StoryTeller",
    "to_player": "PlayerName", 
    "timestamp": 1693574400000
}

// Character Data Transfer
CHAR_DATA:{
    "type": "character_data",
    "character_name": "Testificate",
    "character_data": { /* full character object */ },
    "to_player": "StoryTeller",
    "from_player": "PlayerName",
    "timestamp": 1693574400000
}
```

## 🚀 Workflow Examples

### Scenario 1: New Player Joins Chat
1. **V4-Network**: Player joins chat session
2. **Auto-Announce**: `v4CharacterSyncManager.announceCurrentCharacter()`
3. **StoryTeller**: Receives character announcement
4. **Hash Check**: StoryTeller checks if character exists locally
5. **Request**: If missing, requests character data
6. **Transfer**: V4-Network sends full character data
7. **Import**: StoryTeller imports using `CharacterImportProfile`
8. **Notification**: Both sides show success status

### Scenario 2: Character Update During Play
1. **V4-Network**: Character levels up or gains equipment
2. **Change Detection**: Hash changes detected
3. **Auto-Announce**: New hash announced to StoryTeller
4. **Update Check**: StoryTeller compares hashes
5. **Selective Update**: Only changed data requested/sent
6. **Live Update**: Character panel updates in real-time

### Scenario 3: Connection Recovery
1. **Disconnect**: Player temporarily loses connection
2. **Rejoin**: Player reconnects to chat
3. **Hash Verification**: StoryTeller compares stored vs announced hash
4. **Sync Decision**: Only syncs if character changed while offline
5. **Efficient Recovery**: Minimal data transfer

## 📂 File Structure

### StoryTeller (GM Side)
```
/StoryTeller/js/
├── characterSyncManager.js      # Main sync coordinator
├── characterImportProfile.js    # Import/normalization system  
├── v4NetworkBridge.js          # PostMessage fallback bridge
├── storyTellerPlayersPanel.js  # Character display/management
└── supabase-chat.js            # Chat with sync integration
```

### V4-Network (Player Side)
```
/V4-network/
├── v4CharacterSyncManager.js   # Player-side sync manager
├── storyTellerBridge.js        # Legacy bridge system
├── character-manager.js        # Character data source
└── supabase-chat.js           # Chat with sync integration
```

## ⚙️ Configuration

### Auto-Sync Settings
```javascript
// V4-Network: Auto-sync every 30 seconds
setupAutoSync() {
    setInterval(() => {
        if (this.isConnected) {
            this.checkCharacterUpdate();
        }
    }, 30000);
}

// StoryTeller: Process all character announcements
handleCharacterAnnouncement(message, senderName) {
    if (!this.isStoryTeller) return; // Only GM processes
    
    // Check existing character and request if needed
    const existingCharacter = await this.getStoredCharacter(character_name);
    if (!existingCharacter || hash_mismatch) {
        await this.requestCharacterData(character_name, player_name);
    }
}
```

## 🎛️ Manual Controls

### V4-Network Player Commands
- **Export Character**: Still works, now also auto-syncs
- **Character Updates**: Automatically detected and synced
- **Connection Status**: Shows sync status in notifications

### StoryTeller GM Controls  
- **Import Dialog**: Enhanced with real-time data
- **Character Panel**: Shows sync status and last update
- **Manual Import**: Still available as fallback

## 🔒 Security & Privacy

### Data Validation
- **Input Sanitization**: All character data validated before import
- **Schema Checking**: CharacterImportProfile normalizes all data
- **Error Boundaries**: Sync failures don't break main application

### Permission Model
- **Player → GM**: Characters auto-sync to StoryTeller
- **GM → Player**: No reverse sync (GM doesn't push to players)
- **Session Isolation**: Only syncs within same chat session

## 🐛 Error Handling

### Common Issues & Solutions
1. **Hash Mismatch**: Triggers automatic re-sync request
2. **Network Timeout**: Falls back to manual import dialog
3. **Invalid Data**: CharacterImportProfile repairs/normalizes
4. **Missing Character**: Graceful fallback to sample characters

### Debug Mode
```javascript
// Enable detailed logging
window.showDebug = true;

// Check sync status
console.log(window.characterSyncManager.getStatus());
console.log(window.v4CharacterSyncManager.getStatus());
```

## 🎉 Benefits

### For Players
- **Seamless Experience**: Characters automatically appear in StoryTeller
- **No Manual Steps**: Export happens automatically when joining chat  
- **Real-time Updates**: Character changes sync immediately
- **Offline Recovery**: Handles disconnections gracefully

### For Game Masters
- **Live Character Data**: Always have latest character information
- **Session Management**: Characters organized by chat session
- **Import History**: Track when characters were last synced
- **Backup Integration**: Works with existing import/export system

## 🔄 Migration Path

### Existing Users
1. **Immediate**: Manual import still works exactly as before
2. **Enhanced**: Auto-sync activates when joining chat sessions  
3. **Gradual**: Players discover auto-sync organically
4. **Fallback**: Old export/import buttons still available

### New Users
1. **Join Chat**: Characters automatically sync
2. **Real-time**: Updates happen transparently
3. **No Training**: System works invisibly

---

*The character sync system bridges V4-network and StoryTeller through intelligent, hash-based synchronization that respects user privacy while providing seamless real-time character data sharing.*
