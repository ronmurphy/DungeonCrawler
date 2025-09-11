# V5-Network: 3D TTRPG Platform

## Project Overview

V5-Network is the evolution of V4-Network, transforming from a character sheet-focused tabletop companion into a full 3D exploration platform while maintaining its TTRPG roots. Built for the Dungeon Crawler Carl universe, it combines online multiplayer capabilities with immersive 3D dungeon exploration.

## Why V5?

**The Evolution Path:**
- **V4-Network**: Character sheet management + chat for tabletop play
- **V5-Network**: 3D exploration primary + character management secondary
- **Goal**: Enable remote/online play while preserving tabletop TTRPG feel

**Core Problem Being Solved:**
Originally inspired by adding 3D exploration to StoryTeller maps via the simple 3dDungeons renderer. Instead of shoe-horning features, V5 is designed from the ground up to support both 3D exploration and traditional TTRPG mechanics.

## Technical Architecture

### Foundation
- **Base**: Copy of proven V4-Network codebase
- **UI Framework**: Shoelace components for modern, consistent interface
- **3D Engine**: Emoji-based raycasting renderer (inspired by 3dDungeons)
- **Network**: Existing Supabase integration (proven reliable)
- **Platform**: Progressive Web App with Cordova mobile support

### Key Systems

#### 1. 3D Renderer
- **Style**: Emoji-based graphics (🏰⛰️🌲🗿) - solves art asset problem
- **Engine**: Raycasting-based 3D engine (reference: `extras/miniGames/3dDungeons`)
- **Performance**: Mobile-optimized, 60fps target
- **Input**: Touch-friendly controls with virtual joystick

#### 2. Map System
- **StoryTeller Integration**: Consume existing simple map format
- **Dungeon Mode**: Procedural generation when no StoryTeller maps available
- **Dual Rendering**: 2D tiles (existing) + 3D exploration (new)

#### 3. Network Architecture
```
Supabase Database
├── Real-time Chat (existing)
├── Character Sync (existing) 
├── Map Distribution (enhanced)
└── Player Position Sync (new)
```

#### 4. Character Management
- **V4 Compatibility**: Existing character sheets continue to work
- **New Integration**: Stats affect 3D exploration (movement speed, abilities, etc.)
- **Progression**: XP/leveling through exploration and combat

## UI Design Philosophy

### "Hybrid Tabletop" Approach
Balances 3D exploration with TTRPG tradition:

**Primary Interface:**
- 3D viewport takes center stage (full screen)
- Minimal HUD with essential info (health, mana, minimap)
- Clean, uncluttered exploration experience

**Secondary Interfaces:**
- Character sheet as elegant slide-out panel (not modal)
- Chat as collapsible sidebar/drawer
- FAB system preserved for quick actions
- Inventory/equipment as overlay panels

**Responsive Design:**
- Mobile-first (primary platform)
- Desktop support maintained
- Touch-optimized controls
- Accessibility considerations

### Component Structure (Shoelace-based)
```
Main 3D Viewport
├── HUD Overlay (health/mana bars, minimap)
├── Chat Drawer (sl-drawer, right side)
├── Character Panel (sl-drawer, left side)
├── Action FABs (floating action buttons)
└── Modal Dialogs (inventory, settings, etc.)
```

## Development Phases

### Phase 1: Foundation ✅
- [x] Copy V4-Network → V5
- [x] Verify existing functionality works
- [x] Set up development environment

### Phase 2: UI Redesign
- [ ] Integrate Shoelace components
- [ ] Redesign main interface (3D-first layout)
- [ ] Implement responsive drawer system
- [ ] Preserve FAB functionality

### Phase 3: 3D Engine Integration
- [ ] Extract 3D engine from 3dDungeons reference
- [ ] Clean up and optimize for mobile
- [ ] Integrate with existing map data structures
- [ ] Add view mode toggle (2D ↔ 3D)

### Phase 4: Enhanced Features
- [ ] Improve movement mechanics (fix slow speed)
- [ ] Add combat system integration
- [ ] Implement procedural dungeon generation
- [ ] Enhanced multiplayer position sync

### Phase 5: Polish & Testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] User testing with existing V4 users
- [ ] Documentation and deployment

## Technical Decisions

### Why Emoji Graphics?
- **No art assets needed**: Huge Unicode library available
- **Consistent across platforms**: Renders everywhere
- **Scalable**: Works at any resolution
- **Charming aesthetic**: Fits the fun TTRPG vibe
- **Performance**: Lightweight, fast rendering

### Why Shoelace?
- **Modern components**: Clean, professional appearance
- **Mobile-optimized**: Touch-friendly by default
- **Customizable**: Themeable to match TTRPG aesthetic
- **Well-maintained**: Active development and community
- **Framework agnostic**: Works with existing vanilla JS

### Why Keep V4 Architecture?
- **Proven reliability**: Supabase integration works
- **User familiarity**: Existing players know the system
- **Risk mitigation**: Fall back to V4 if needed
- **Incremental development**: Add features without breaking existing functionality

## File Structure
```
v5/
├── README.md (this file)
├── index.html (main entry point)
├── main.js (application core)
├── css/ (styling)
├── js/ (application logic)
├── assets/ (images, icons)
├── Cordova/ (mobile build)
└── miniGames/ (3D engine and features)
```

## Getting Started

### Development Setup
1. Ensure V5 works as-is (should match V4-Network)
2. Test Supabase connection
3. Verify mobile/desktop compatibility
4. Begin UI integration with Shoelace

### Key Files to Understand
- `main.js` - Application initialization and core logic
- `supabase-chat.js` - Network communication
- `character-manager.js` - Character sheet functionality
- `extras/miniGames/3dDungeons/` - 3D engine reference implementation

## Contributing

### For David & Michelle (or other contributors):
1. Read this README thoroughly
2. Test existing V4 functionality in V5
3. Review `extras/miniGames/3dDungeons` for 3D reference
4. Focus on one phase at a time
5. Maintain mobile-first approach
6. Test frequently on actual devices

### Coding Standards
- Mobile performance is priority #1
- Maintain backward compatibility with V4 features
- Use Shoelace components where possible
- Comment complex 3D math and rendering logic
- Test on both iOS and Android

## Vision Statement

"A 3D TTRPG platform that brings the magic of tabletop exploration into the digital realm, while preserving the social and mechanical depth that makes TTRPGs special."

V5-Network should feel like you're exploring a living dungeon with friends, not just playing a video game.
