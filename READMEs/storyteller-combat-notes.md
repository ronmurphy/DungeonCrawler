# StoryTeller Combat Integration - Implementation Notes

## Changes Made to StoryTeller

### Files Modified

#### 1. `/StoryTeller/js/supabase-chat.js`

**New Functions Added:**
- `processInitiativeCommand(commandText, playerName)` - Processes INITIATIVE commands from players
- `processSpellCommand(commandText, playerName)` - Processes SPELL commands from players  
- `processRollCommand(commandText, playerName)` - Processes ROLL (skill) commands from players

**Modified Message Processing:**
Added new command detection in `handleIncomingMessage()`:
- Added INITIATIVE command detection: `message.message_text.startsWith('INITIATIVE:')`
- Added SPELL command detection: `message.message_text.startsWith('SPELL:')`
- Added ROLL command detection: `message.message_text.startsWith('ROLL:')`

**Command Processing Logic:**

##### Initiative Command Processing:
```javascript
function processInitiativeCommand(commandText, playerName) {
    // Parse INITIATIVE:PlayerName:Roll:Details format
    // Display formatted message: "🎲 PlayerName rolled initiative: 25 (d20(15) + DEX(3) + luck(7) = 25)"
    // Ready for future initiative tracker integration
}
```

##### Spell Command Processing:
```javascript
function processSpellCommand(commandText, playerName) {
    // Parse SPELL:PlayerName:AttackRoll:Damage:SpellName:MPCost format  
    // Display formatted message: "✨ PlayerName cast Fireball (15 to hit) for 8 damage (3 MP)"
    // Handles both attack spells and utility spells
}
```

##### Skill Command Processing:
```javascript
function processRollCommand(commandText, playerName) {
    // Parse ROLL:PlayerName:SkillName:Result:Stat format
    // Display formatted message: "🎲 PlayerName rolled Athletics (STR): 18"
    // Useful for combat-relevant skills like stealth, athletics, etc.
}
```

### Command Formats Supported

**INITIATIVE Command:**
- Format: `INITIATIVE:PlayerName:Roll:Details`
- Example: `INITIATIVE:Alice:25:d20(15) + DEX(3) + luck(7) = 25`
- Display: "🎲 Alice rolled initiative: 25 (d20(15) + DEX(3) + luck(7) = 25)"

**SPELL Command:**
- Format: `SPELL:PlayerName:AttackRoll:Damage:SpellName:MPCost`
- Example: `SPELL:Bob:15:8:Fireball:3`
- Display: "✨ Bob cast Fireball (15 to hit) for 8 damage (3 MP)"

**ROLL Command:**
- Format: `ROLL:PlayerName:SkillName:Result:Stat`
- Example: `ROLL:Carol:Athletics:18:STR`
- Display: "🎲 Carol rolled Athletics (STR): 18"

**ATTACK Command (Existing):**
- Format: `ATTACK:PlayerName:AttackRoll:Damage:WeaponName`
- Example: `ATTACK:Dave:16:12:Longsword`
- Display: "Dave attacks with Longsword! (Roll: 16, Damage: 12)"

### Chat Display Features

**Message Types:**
- `initiative` - Initiative roll messages
- `spell` - Spell casting messages  
- `skill` - Skill roll messages
- `combat_result` - Attack resolution messages

**System Message Sources:**
- "Initiative System" - For initiative rolls
- "Magic System" - For spell casting
- "Skill System" - For skill rolls
- "Combat System" - For attack results

**Visual Indicators:**
- 🎲 - Initiative and skill rolls
- ✨ - Spell casting
- ⚔️ - Combat attacks

### Integration Points

**Ready for Future Features:**
- `addToInitiativeTracker()` - Function hook ready for initiative collection UI
- Initiative data is parsed and ready for turn order calculation
- Spell/attack data ready for action buffer integration
- All combat commands properly formatted for StoryTeller display

**Combat Panel Integration:**
- Commands work with existing combat panel (processAttackCommand already integrates)
- Ready for initiative collector interface
- Ready for action buffer system
- All formatted for consistent chat display

### Testing Status

**✅ Working:**
- All four command types process correctly
- Formatted messages display in StoryTeller chat
- No syntax errors or broken functionality
- Commands properly filtered from raw display

**⚠️ Needs Testing:**
- Full workflow with V4-network connection
- Initiative collection interface (not yet implemented)
- Action buffer integration (not yet implemented)
- Combat panel integration verification

### Next Steps

1. Test full V4-network → StoryTeller command flow
2. Create initiative collection interface
3. Implement action buffer system
4. Build turn order display
5. Test complete initiative workflow

---

*File: storyteller-combat-notes.md*
*Date: September 3, 2025*
*Status: StoryTeller command processing implemented, ready for testing*
