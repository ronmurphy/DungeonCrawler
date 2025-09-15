# DCC-Custom Project Overview
**Date: August 25, 2025**

## 🎯 Project Structure & Purpose

### **Two-App System**

#### **StoryTeller** - Dungeon Master Application
- **Location**: `/StoryTeller/`
- **Purpose**: Complete DM interface for running DCC campaigns
- **Features**:
  - Real-time chat with players via Supabase
  - Combat command processing (ATTACK, ROLL, SKILL, SAVE)
  - Session management and player coordination
  - NPC generation, quest generation, map editing
  - Item generation and loot distribution
  - Dark/light theme system
  - Database management (CLEAN commands)
  - Quick Connect for instant session setup
- **Status**: ✅ **Fully functional and production-ready**

#### **v5** - Player Application  
- **Location**: `/v5/`
- **Purpose**: Character sheet manager and player interface for DCC RPG
- **Origin**: Clone of v5-network folder, updated for modular integration
- **Features**:
  - Character creation and management
  - Skill system and progression tracking
  - Achievement system (771 achievements)
  - QR code character sharing
  - Level progression and experience tracking
  - Equipment and inventory management
  - Currently implementing threejs map and combat system
- **Status**: 🔄 **Ready for chat integration via modular system**

#### **V3, v5-network** - Legacy Player App
- **Location**: `/v5-network/` (legacy, not actively updated)
- **Status**: ⚠️ **Archived** - v5 is the active development branch

---

## 🏗️ Integration Strategy

### **Modular System Design**
The StoryTeller chat system was built with **modular architecture** specifically to enable easy integration with v5:

#### **Portable Modules** (Ready for v5)
```
StoryTeller/js/modules/
├── supabaseClient.js      # Database connection & operations
├── chatParser.js          # Command parsing (ATTACK, ROLL, etc)
├── combatHandler.js       # Combat processing & loot generation
├── messageFormatter.js   # Message display & formatting
├── chatManager.js         # Main orchestrator
└── chatAdapter.js         # Bridge to UI (customize for v5)
```

#### **Supporting Files for Integration**
```
StoryTeller/css/chat.css           # Chat styling (portable)
StoryTeller/js/supabase-chat.js    # Core chat functions
StoryTeller/js/command-interceptor.js  # Command processing system
```
---

## 🚨 Cardinal Rules

### **Rule #1: Never Directly Modify Supabase Files**
- ❌ **Don't edit**: `supabase-chat.js`, `supabase-config.js`, or any Supabase module
- ✅ **Instead**: Create new files and integrate via:
  - **DOM manipulation**: Add event listeners, modify elements
  - **Include in index.html**: Add new script tags
  - **Wrapper functions**: Create new files that call Supabase functions
  - **Extension files**: Build on top of existing Supabase functionality
  - **Information folder**: Always check /READMEs/ dir for updated notes

### **Why This Rule Exists**
- Supabase files are **extremely fragile** and break easily
- Connection logic is complex and hard to debug when broken
- Real-time subscriptions are particularly sensitive
- One wrong modification can break the entire chat system

### **How to Add Features Safely**
```javascript
// ✅ GOOD: Create new file (e.g., my-chat-extension.js)
function enhancedChatFeature() {
    // Use existing Supabase functions
    sendChatMessageAsync('Enhanced message');
    
    // Add your custom logic
    myCustomLogic();
}

// ✅ GOOD: Extend via DOM
document.addEventListener('DOMContentLoaded', function() {
    // Add new UI elements
    // Attach event listeners
    // Extend existing functionality
});

// ❌ BAD: Modifying supabase-chat.js directly
// This will break things!
```

---

## 📊 Current Status

### **StoryTeller (DM App) - PRODUCTION READY** ✅
- Real-time chat system fully functional
- All command processing working
- Database management operational
- Theme system complete
- Mobile/tablet optimized
- Auto-reconnection system active
- Quick Connect feature working

### **v5 (Player App) - INTEGRATION READY** 🔄
- Character system fully functional
- Achievement system complete (771 achievements)
- Skill system operational
- QR code sharing working
- **Currently working on threejs map, combat, and a better inventory**

### **Integration Pathway** 🛤️
- Modular files designed for portability
- chatAdapter.js ready for v5 customization
- CSS styling prepared for integration
- Command system ready for character data connection

---

## 🎮 User Experience Vision

### **Complete Gaming Ecosystem**
Once integrated, the system will provide:

#### **For Dungeon Masters (StoryTeller)**
- Complete session management
- Real-time player communication
- Automated combat processing
- NPC and quest generation
- Map editing and sharing

#### **For Players (v5 + Chat)**
- Full character sheet management
- Real-time chat with DM and party
- Automatic combat result processing
- Achievement tracking via chat events
- "Distributed computing" personalized loot
- Session participation via mobile device

#### **Shared Features**
- Cross-platform real-time communication
- Synchronized combat processing
- Persistent session data
- Mobile-friendly interfaces
- Free operation via Supabase

---

## 🔧 Technical Architecture

### **Communication Flow**
```
DM (StoryTeller) ←→ Supabase Database ←→ Players (v5 + Chat)
                       ↕
              Real-time subscriptions
              Session management
              Command processing
```

### **Data Management**
- **Supabase**: Real-time messaging, session data
- **LocalStorage**: Configuration, preferences, API keys
- **JSON Files**: Game data (races, classes, skills, achievements)
- **Character Data**: Stored locally in v5, shared via chat commands

### **Modular Benefits**
- **Easy Updates**: Modify individual modules without affecting others
- **Portable Code**: Move functionality between apps
- **Safe Development**: Isolate new features from core systems
- **Version Control**: Track changes to specific components

---

## 🚀 Future Development

### **Phase 1: Current State** ✅
- StoryTeller fully functional
- v5 character system complete
- Modular chat system ready

### **Phase 2: Integration** (Next)
- Copy modular files to v5
- Customize chatAdapter.js for v5 UI
- Test chat integration with character system
- Implement distributed loot system

### **Phase 3: Enhancement** (Future)
- Advanced combat integration
- Achievement triggers via chat
- Enhanced mobile experience
- Cross-session character persistence

---

## 📝 Development Guidelines

### **For StoryTeller Modifications**
1. Use command-interceptor.js for new commands
2. Create separate files for new features
3. Never modify core Supabase files
4. Test thoroughly with real sessions

### **For v5 Integration**
1. Copy modules intact, modify chatAdapter.js only
2. Integrate with existing v5 character system
3. Maintain v5's UI patterns and styling
4. Test chat functionality before character integration

### **For Both Apps**
1. Document all changes in markdown files
2. Maintain compatibility with mobile devices
3. Follow established coding patterns
4. Preserve existing functionality during updates

---

## 🎯 Success Metrics

### **Integration Success Indicators**
- ✅ v5 can send/receive real-time chat messages
- ✅ DM commands (ATTACK, ROLL) process correctly in v5
- ✅ Character data integrates with chat commands
- ✅ Mobile devices maintain stable connections
- ✅ No loss of existing v5 functionality
- ✅ Seamless user experience across both apps

---

## Current TODO:

## Currently working on...
 - Storyteller's map maker and spritesheet editor needs some updating
 - v5 is getting a threejs map explore and combat, turnbaised system
 - v5 needs a improved inventory.. two other code bases were managing it, not good.
 - need to look for dead code and comment it out, if the app wrks after the comment out, we can remove it
 - need optimizing on both apps
 - mapgate is a 3d object dev tool made by the author, a 'web blender' app, may need improvements


This project represents a complete tabletop RPG ecosystem with professional-grade real-time communication, all running on free infrastructure while maintaining the flexibility to customize and extend functionality as needed.
