# Combat to Character Sheet HP/MP Sync System

**Date Created**: September 15, 2025  
**Status**: WORKING ✅  
**Critical System**: Character damage persistence from combat to main character sheet

## Overview

This system ensures that HP/MP changes during combat (damage taken, healing received) are properly reflected on the main character sheet after combat ends. This was a complex problem involving multiple storage layers, timing issues, and data synchronization challenges.

## The Problem

Originally, players could take damage in combat, but when combat ended, the character sheet would still show full HP. The damage was not persisting from the combat system to the persistent character data.

## Root Cause Analysis

### Storage Layer Conflicts
- **Combat System**: Uses `PartyManager` with `member.hp` for real-time combat HP tracking
- **Character Sheet**: Uses global `character.currentHealthPoints` for display
- **Persistent Storage**: Uses `characterManager.characters[]` array and IndexedDB
- **Auto-Save System**: Runs every 30 seconds, potentially overwriting data

### The Critical Bug
The `saveCurrentCharacterToStorage()` function was **overwriting correct damaged HP data** with stale full HP data:

```javascript
// BAD - This overwrote PartyManager's correct damage data
characterManager.characters[characterIndex] = {
    ...character,  // <-- Global character object with FULL HP
    id: characterManager.currentCharacterId,
    lastModified: new Date().toISOString()
};
```

## The Solution

### 1. Real-Time Combat Sync (`PartyManager.js`)

When damage is applied in combat, immediately sync to persistent storage:

```javascript
// In PartyManager.applyDamage()
const oldHp = member.hp;
member.hp = Math.max(0, member.hp - damage);

// CRITICAL: Sync combat HP back to persistent character data
this.syncMemberToPersistentCharacter(memberName, member);
```

The sync method updates both storage locations:
```javascript
async syncMemberToPersistentCharacter(memberName, member) {
    // Update global character object (if it exists and matches)
    if (window.character && window.character.name === memberName) {
        window.character.currentHealthPoints = member.hp;
        window.character.currentMagicPoints = member.mp;
    }

    // Update characterManager array (CRITICAL for persistence)
    if (window.characterManager && window.characterManager.characters) {
        const charIndex = window.characterManager.characters.findIndex(char => char.name === memberName);
        if (charIndex !== -1) {
            window.characterManager.characters[charIndex].currentHealthPoints = member.hp;
            window.characterManager.characters[charIndex].currentMagicPoints = member.mp;
        }
    }
}
```

### 2. Post-Combat Refresh (`CombatManager.js`)

When combat ends, ensure character sheet displays updated HP/MP:

```javascript
async refreshCharacterSheetAfterCombat() {
    // CRITICAL: Save characterManager array directly (preserves PartyManager updates)
    await saveCharactersToStorage();
    
    // Load fresh data from storage
    const updatedCharacterData = await this.loadCharacterFromDB(playerName);
    
    // Fallback: Use characterManager array if storage is stale
    if (window.characterManager && window.characterManager.characters) {
        const freshCharData = window.characterManager.characters.find(char => char.name === playerName);
        if (freshCharData && freshCharData.currentHealthPoints !== updatedCharacterData?.currentHealthPoints) {
            updatedCharacterData = freshCharData; // Use fresh data
        }
    }
    
    // Update global character object
    Object.assign(character, updatedCharacterData);
    
    // Update character sheet display
    updateCharacterDisplay(); // Updates char-current-hp elements
    updateHealthMagicDisplay(); // Updates other HP displays
}
```

## Critical Implementation Details

### DO THIS ✅

1. **Use `saveCharactersToStorage()` directly** after combat to preserve PartyManager data
2. **Sync combat changes immediately** via `syncMemberToPersistentCharacter()`
3. **Update both storage locations**: global character object AND characterManager array
4. **Call `updateCharacterDisplay()`** to update character sheet specific elements (`char-current-hp`, `char-total-hp`)
5. **Use fallback checks** when loading data to ensure fresh data is used

### DON'T DO THIS ❌

1. **Never use `saveCurrentCharacterToStorage()`** after combat - it overwrites with stale global character data
2. **Don't rely only on `window.character`** - it can be undefined or contain DOM elements due to naming conflicts
3. **Don't skip the immediate sync** during combat - auto-save can overwrite changes
4. **Don't forget to update character sheet specific elements** - regular HP displays use different IDs

## Data Flow Diagram

```
Combat Damage Applied
         ↓
PartyManager.applyDamage(member, damage)
         ↓
member.hp = oldHp - damage
         ↓
syncMemberToPersistentCharacter()
         ↓
Update characterManager.characters[index].currentHealthPoints = member.hp
         ↓
Combat Ends
         ↓
refreshCharacterSheetAfterCombat()
         ↓
saveCharactersToStorage() // Preserves PartyManager data
         ↓
loadCharacterFromDB() // Gets fresh damaged HP data
         ↓
Object.assign(character, updatedCharacterData)
         ↓
updateCharacterDisplay() // Updates char-current-hp elements
         ↓
Character Sheet Shows Correct Reduced HP ✅
```

## Key Files Modified

### `/v5/js/combat/PartyManager.js`
- Added `syncMemberToPersistentCharacter()` method
- Modified `applyDamage()` and `applyHealing()` to call sync immediately
- Ensures combat HP changes are saved to persistent storage in real-time

### `/v5/js/combat/CombatManager.js`  
- Added `refreshCharacterSheetAfterCombat()` method
- Added `updateCharacterSheetVitals()` method for character sheet specific elements
- Fixed post-combat refresh to use correct storage methods
- Added fallback logic for stale data protection

### Character Sheet HTML Elements
The character sheet uses these specific element IDs:
- `char-current-hp` - Current HP display
- `char-total-hp` - Max HP display  
- `char-current-mp` - Current MP display
- `char-total-mp` - Max MP display

## Testing Verification

To verify the system works:

1. **Start combat** with full HP (e.g., 18/18)
2. **Take damage** in combat (e.g., -2 damage = 16/18)  
3. **End combat** (defeat enemy)
4. **Check character sheet** - should show reduced HP (16/18)
5. **Verify persistence** - refresh page, HP should remain reduced

## Troubleshooting

### If damage doesn't persist:

1. **Check PartyManager sync** - Look for "🔄 Synced to characterManager array" in console
2. **Verify save method** - Ensure `saveCharactersToStorage()` is called, NOT `saveCurrentCharacterToStorage()`
3. **Check data freshness** - Look for stale data warnings in refresh function
4. **Verify element updates** - Ensure `updateCharacterDisplay()` is called

### Common Issues:

- **Auto-save interference**: Fixed by immediate sync during combat
- **DOM element conflicts**: `window.character` sometimes contains DOM elements instead of character data
- **Timing issues**: Fixed by forcing save before refresh and using fallback data checks
- **Storage layer confusion**: Multiple storage systems (IndexedDB, localStorage, in-memory arrays) must stay synchronized

## Future Considerations

- **Multi-player support**: System already handles multiple party members correctly
- **NPC damage tracking**: Only syncs player character data to persistent storage
- **Online play**: Each player's damage syncs to their own character data
- **Performance**: Immediate sync prevents data loss without significant overhead

## Success Metrics

✅ **Combat damage persists** to character sheet  
✅ **Auto-save doesn't overwrite** combat changes  
✅ **Multiple storage layers** stay synchronized  
✅ **Character sheet displays** update correctly  
✅ **System scales** for future party members  

This system now provides reliable HP/MP persistence from combat to character sheet with proper error handling and fallback mechanisms.