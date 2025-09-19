# DungeonCrawler Project Summary
*Custom Tabletop RPG Digital Platform*

## 🎯 What This Is
DungeonCrawler is a complete **custom tabletop RPG system** inspired by **Dungeon Crawler Carl (DCC)** - the LitRPG book series. It consists of two main applications that work together to provide a modern, mobile-first digital RPG experience with real-time networking capabilities that captures the high-tech dungeon crawling essence of the series.

## 🏗️ System Architecture

### **StoryTeller** - Dungeon Master Application
- **Purpose**: Complete DM control center for running campaigns
- **Platform**: Web-based (desktop/tablet optimized)
- **Status**: ✅ Production ready and fully functional

**Core Features:**
- **Real-time Chat System**: Multi-player communication via Supabase
- **Combat Management**: Turn-based combat with initiative tracking
- **Command Processing**: Parser for RPG commands (ATTACK, ROLL, SKILL, SAVE, etc.)
- **Map Creation & Sharing**: Built-in map editor with transmission to players
- **Content Generation**: NPC, quest, item, and loot generation
- **Session Management**: Player coordination and session control
- **Database Operations**: Character management and campaign data

**Map System (v1.3):**
- Hybrid marker system for player positioning
- Grid-based map editor with sprite/tile support
- Real-time map transmission to player apps
- Marker system: `markers` object + `tileMarkers` flat array for 15x15 grids
- Background color support and multiple tileset formats

### **V5** - Player Application (5th Generation)
- **Purpose**: Character sheet manager and player interface
- **Platform**: Mobile-first Progressive Web App (PWA)
- **Status**: 🔄 Active development with 3D integration

**Core Features:**
- **Character Management**: Complete DCC-inspired character sheets
- **Skill System**: 771+ achievements and progression tracking  
- **Equipment/Inventory**: Item management with trading systems
- **Experience/Leveling**: Automated progression tracking
- **QR Code Sharing**: Cross-device character transfer
- **Real-time Chat**: Integration with StoryTeller chat system
- **Map Rendering**: Dual 2D/3D map display system

**3D Integration (Current Focus):**
- **ThreeJS Engine**: WebGL-based 3D map rendering
- **ShapeForge Objects**: Advanced 3D asset loading system
- **Dual Rendering**: 2D canvas (auto-display) + 3D WebGL (FAB toggle)
- **Mobile Optimization**: Touch controls and performance tuning
- **Immersive Experience**: First-person dungeon exploration

## 🌐 Network Architecture

### **Supabase Backend**
```
Real-time Database
├── Chat Messages & Commands
├── Character Synchronization  
├── Map Distribution (StoryTeller → V5)
├── Player Position Tracking
├── Session Management
└── Combat State Synchronization
```

### **Data Flow**
1. **StoryTeller** creates/edits maps with marker positioning
2. **MapDataFormatter** handles format detection and conversion
3. **Supabase** transmits standardized map data in real-time
4. **V5** receives and renders maps in 2D/3D
5. **Player actions** sync back through chat commands

## 🎮 RPG System Features

### **Combat System** (Both Apps)
- **Initiative-based**: Automated turn order management
- **Command Parsing**: Natural language combat commands
- **Visual Combat**: Card-based monster display with animations
- **Relationship System**: Monster affinities and combos
- **Damage Calculation**: Full DCC-inspired mechanics
- **Loot Generation**: Automated treasure distribution

### **Character Progression**
- **DCC-Inspired**: Achievement-heavy progression system inspired by the series
- **Achievement System**: 771+ tracked milestones (very LitRPG!)
- **Equipment Management**: Complete inventory systems with gear optimization
- **Skill Advancement**: Automated progression tracking
- **Cross-device Sync**: QR code and database synchronization

### **Map & Exploration**
- **Grid-based Maps**: Traditional 2D tile system
- **3D Exploration**: Immersive first-person mode
- **Marker System**: Player spawn points and special locations
- **Real-time Updates**: Live map changes during sessions
- **Multiple Formats**: Support for various map data structures

## 🔧 Technical Stack

### **Frontend**
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **3D Engine**: Three.js for WebGL rendering
- **UI Framework**: Custom mobile-optimized components
- **PWA Features**: Offline support, installable, push notifications

### **Backend**
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
- **Authentication**: Supabase Auth with session management  
- **Storage**: Supabase Storage for assets and character data
- **Real-time**: WebSocket-based live updates

### **Development Tools**
- **Modular Architecture**: Portable modules for easy integration
- **Git Workflow**: Feature branches with detailed documentation
- **Mobile Testing**: Live server testing on devices
- **Performance Monitoring**: Mobile-first optimization

## 📱 Mobile-First Design

### **V5 Optimization**
- **Touch Interface**: Large touch targets and gesture support
- **Responsive Design**: Adapts to phone/tablet/desktop
- **Offline Capability**: Core features work without internet
- **Performance**: 60fps target for 3D rendering
- **Battery Efficiency**: Optimized for mobile power consumption

### **Cross-Platform Compatibility**
- **iOS**: PWA installation and full-screen support
- **Android**: Native-like experience with manifest.json
- **Desktop**: Full functionality in modern browsers
- **Tablets**: Optimized layouts for larger screens

## 🎨 User Experience

### **DM Experience (StoryTeller)**
- **Unified Interface**: All DM tools in single application
- **Quick Setup**: Instant session creation and player invites
- **Visual Combat**: Drag-and-drop monster management
- **Live Updates**: See player actions in real-time
- **Content Generation**: On-demand NPCs, quests, items

### **Player Experience (V5)**
- **Character Focus**: Beautiful, functional character sheets
- **Social Features**: Real-time chat with party members
- **Immersive Maps**: Switch between 2D and 3D exploration
- **Achievement Tracking**: Visual progression feedback
- **Easy Sharing**: QR codes for quick character transfer

## 🔮 Current Development

### **Active Work**
- **3D Map Transmission**: StoryTeller v1.3 markers → V5 3D positioning
- **Combat Integration**: 3D combat visualization in V5
- **Performance Optimization**: Mobile 3D rendering improvements
- **UI Polish**: Enhanced mobile interface components

### **Known Challenges**
- **Dual Rendering Architecture**: Managing 2D/3D system complexity
- **Format Detection**: Multiple map data formats require careful handling
- **Mobile Performance**: Balancing visual quality with battery life
- **Real-time Sync**: Ensuring reliable network state management

## 🎲 Use Cases

### **Local Game Sessions**
- DM runs StoryTeller on laptop/tablet
- Players use phones with V5 app
- Real-time communication and map sharing
- Visual combat with 3D exploration

### **Remote Gaming**
- All participants connect via Supabase
- Screen sharing for additional visual context
- Synchronized character sheets and maps
- Persistent session state across breaks

### **Solo Play**
- V5 dungeon generation for solo exploration
- StoryTeller NPC generation for solo DMing
- Character development and testing
- Content creation and planning

---

**This is a comprehensive, custom-built digital RPG platform designed to enhance traditional tabletop gaming with modern technology while preserving the authentic RPG experience.**