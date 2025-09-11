# V4-Network Combat Integration - Implementation Notes

## Changes Made to V4-Network

### Files Modified

#### 1. `/V4-network/js/core/main.js`

**New Functions Added:**
- `isInCombatMode()` - Detects if connected to game session for combat context
- `rollInitiativeForDexterity(dexterity)` - Handles initiative rolling with d20+DEX+luck dice

**Modified Functions:**
- `rollAttribute(statName, statValue)` - Added DEX detection for initiative when in combat
- `rollWeaponDamage(weaponId)` - Added ATTACK command sending when in combat  
- `castSpell(spellId)` - Added SPELL command sending when in combat
- `rollSkill(skillName, statName, statValue)` - Added ROLL command sending when in combat

**Combat Detection Logic:**
```javascript
function isInCombatMode() {
    // Check if we're connected to a game session (indicating potential combat)
    if (typeof window.supabaseChat !== 'undefined' && window.supabaseChat.isConnected) {
        return true; // For now, always consider connected = potential combat
    }
    return false;
}
```

**Initiative Rolling Logic:**
- Calculates luck dice: `Math.ceil(level / 10)` (1d10 per 10 levels)
- Rolls d20 + DEX + luck dice total
- Formats display: `d20(15) + DEX(3) + luck(7+2) = 27`
- Sends chat command: `INITIATIVE:PlayerName:Total:Details`

#### 2. `/V4-network/js/supabase-chat.js`

**New Functions Added:**
- `processInitiativeCommand(commandText, playerName)` - Processes INITIATIVE commands
- `processSpellCommand(commandText, playerName)` - Processes SPELL commands  
- `processRollCommand(commandText, playerName)` - Processes ROLL commands

**Modified Message Processing:**
- Added INITIATIVE command detection: `message.message_text.startsWith('INITIATIVE:')`
- Added SPELL command detection: `message.message_text.startsWith('SPELL:')`
- Added ROLL command detection: `message.message_text.startsWith('ROLL:')`

**Command Formats:**
- `INITIATIVE:PlayerName:Roll:Details`
- `SPELL:PlayerName:AttackRoll:Damage:SpellName:MPCost`
- `ROLL:PlayerName:SkillName:Result:Stat`

### Chat Command Integration

**How It Works:**
1. Player performs action (click DEX, weapon, spell, skill)
2. `isInCombatMode()` checks if connected to game session
3. If in combat, action data sent via `sendChatMessage(commandString)`
4. Chat command processed by both V4-network and StoryTeller
5. V4-network shows formatted message instead of raw command

**User Experience:**
- **Normal mode**: Buttons work as usual (roll history, notifications)
- **Combat mode**: Same buttons also send data to StoryTeller automatically
- **Seamless**: No mode switching required, context-aware
- **Mobile optimized**: No extra UI clutter, uses existing buttons

### Testing Status

**✅ Working:**
- DEX attribute rolls initiative with luck dice calculation
- Initiative data appears in chat as formatted message
- Weapon/spell/skill buttons send combat data when connected
- No broken existing functionality

**⚠️ Needs StoryTeller Implementation:**
- Commands are sent but StoryTeller doesn't process them yet
- Need StoryTeller-side command processing
- Need initiative collection interface
- Need action buffer system

### Next Steps

1. Implement StoryTeller command processing
2. Create initiative collector interface  
3. Test full initiative workflow
4. Move to action buffer implementation

---

*File: v4-network-combat-notes.md*
*Date: September 3, 2025*
*Status: V4-network implementation complete, awaiting StoryTeller integration*
