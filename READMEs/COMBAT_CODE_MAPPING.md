# COMBAT SYSTEM CODE MAPPING
**Date:** 2025-09-03  
**Purpose:** Document all combat-related code across existing files for future reference

## 📁 V4-network (Player App) - Combat Integration Points

### 1. `/V4-network/js/core/main.js`

#### 🔹 **isInCombatMode() Function** (NEW)
**Lines:** ~Added after existing functions
**Purpose:** Detects if player is connected to game session
**Status:** ✅ Implemented
```javascript
function isInCombatMode() {
    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
        return false;
    }
    if (typeof window.currentChannel === 'undefined' || !window.currentChannel) {
        return false;
    }
    if (typeof window.currentCharacter === 'undefined' || !window.currentCharacter) {
        return false;
    }
    return true;
}
```

#### 🔹 **rollInitiativeForDexterity() Function** (NEW)
**Lines:** ~Added after isInCombatMode()
**Purpose:** Handles DEX → initiative rolling with luck dice
**Status:** ✅ Implemented
```javascript
function rollInitiativeForDexterity(character, dexModifier) {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const characterLevel = character.level || 1;
    const luckDiceCount = Math.ceil(characterLevel / 10);
    // ... (full implementation in combatSystem-V4.js)
}
```

#### 🔹 **rollAttribute() Function** (MODIFIED)
**Lines:** ~Existing function, modified for combat detection
**Purpose:** When DEX clicked in combat mode → roll initiative
**Status:** ✅ Implemented
```javascript
// Original rollAttribute() modified to add:
if (attributeName === 'DEX' && isInCombatMode()) {
    return rollInitiativeForDexterity(currentCharacter, modifier);
}
```

#### 🔹 **rollWeaponDamage() Function** (MODIFIED)
**Lines:** ~Existing function, modified for combat commands
**Purpose:** When weapon clicked in combat mode → send ATTACK command
**Status:** ✅ Implemented
```javascript
// Original rollWeaponDamage() modified to add:
if (isInCombatMode()) {
    sendAttackCommand(characterName, weaponName, attackRoll, damageRoll);
}
```

#### 🔹 **castSpell() Function** (MODIFIED)
**Lines:** ~Existing function, modified for combat commands
**Purpose:** When spell cast in combat mode → send SPELL command
**Status:** ✅ Implemented
```javascript
// Original castSpell() modified to add:
if (isInCombatMode()) {
    sendSpellCommand(characterName, spellName, castingRoll, effect);
}
```

#### 🔹 **rollSkill() Function** (MODIFIED)
**Lines:** ~Existing function, modified for combat commands
**Purpose:** When skill rolled in combat mode → send ROLL command
**Status:** ✅ Implemented
```javascript
// Original rollSkill() modified to add:
if (isInCombatMode()) {
    sendRollCommand(characterName, skillName, rollResult, modifier);
}
```

### 2. `/V4-network/js/supabase-chat.js`

#### 🔹 **processInitiativeCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Formats initiative results for display
**Status:** ✅ Implemented

#### 🔹 **processAttackCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Formats attack results for display
**Status:** ✅ Implemented

#### 🔹 **processSpellCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Formats spell casting results for display
**Status:** ✅ Implemented

#### 🔹 **processRollCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Formats skill roll results for display
**Status:** ✅ Implemented

## 📁 StoryTeller (DM App) - Combat Integration Points

### 1. `/StoryTeller/js/supabase-chat.js`

#### 🔹 **processInitiativeCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Processes INITIATIVE commands from players
**Status:** ✅ Implemented
```javascript
function processInitiativeCommand(commandData) {
    const parts = commandData.split('|');
    // Parse: INITIATIVE|CharacterName|Total|d20|DEX|LuckDice
    // Add to initiative tracker and display formatted message
}
```

#### 🔹 **processAttackCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Processes ATTACK commands from players
**Status:** ✅ Implemented
```javascript
function processAttackCommand(commandData) {
    const parts = commandData.split('|');
    // Parse: ATTACK|CharacterName|WeaponName|AttackRoll|DamageRoll
    // Display formatted attack message
}
```

#### 🔹 **processSpellCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Processes SPELL commands from players
**Status:** ✅ Implemented
```javascript
function processSpellCommand(commandData) {
    const parts = commandData.split('|');
    // Parse: SPELL|CharacterName|SpellName|CastingRoll|Effect
    // Display formatted spell message
}
```

#### 🔹 **processRollCommand() Function** (NEW)
**Lines:** ~Added to chat processing functions
**Purpose:** Processes ROLL commands from players
**Status:** ✅ Implemented
```javascript
function processRollCommand(commandData) {
    const parts = commandData.split('|');
    // Parse: ROLL|CharacterName|SkillName|RollResult|Modifier
    // Display formatted skill roll message
}
```

#### 🔹 **Message Processing Logic** (MODIFIED)
**Lines:** ~Existing chat message handler modified
**Purpose:** Route combat commands to appropriate processors
**Status:** ✅ Implemented
```javascript
// Modified existing message processing to add:
if (message.startsWith('INITIATIVE|') || message.startsWith('ATTACK|') || 
    message.startsWith('SPELL|') || message.startsWith('ROLL|')) {
    processCombatCommand(message);
    return; // Don't display raw command
}
```

### 2. `/StoryTeller/index.html`

#### 🔹 **Combat Panel UI** (FUTURE)
**Lines:** ~TBD - needs UI elements for initiative tracker
**Purpose:** Display initiative order and turn management
**Status:** ⏳ Pending implementation

#### 🔹 **Chat Message Display** (MODIFIED)
**Lines:** ~Existing chat display modified for combat formatting
**Purpose:** Show formatted combat messages instead of raw commands
**Status:** ✅ Implemented (basic formatting)

## 🔄 COMMAND FLOW MAPPING

### Initiative Roll Flow:
```
V4-network: Player clicks DEX button
    ↓
main.js: rollAttribute() detects combat mode
    ↓ 
main.js: rollInitiativeForDexterity() calculates result
    ↓
supabase-chat.js: Sends "INITIATIVE|Name|Total|d20|DEX|Luck"
    ↓
StoryTeller: supabase-chat.js receives command
    ↓
StoryTeller: processInitiativeCommand() parses and displays
```

### Attack Flow:
```
V4-network: Player clicks weapon button
    ↓
main.js: rollWeaponDamage() detects combat mode
    ↓
supabase-chat.js: Sends "ATTACK|Name|Weapon|Attack|Damage"
    ↓
StoryTeller: processAttackCommand() parses and displays
```

### Spell Flow:
```
V4-network: Player clicks spell button
    ↓
main.js: castSpell() detects combat mode
    ↓
supabase-chat.js: Sends "SPELL|Name|Spell|Roll|Effect"
    ↓
StoryTeller: processSpellCommand() parses and displays
```

### Skill Roll Flow:
```
V4-network: Player clicks skill button
    ↓
main.js: rollSkill() detects combat mode
    ↓
supabase-chat.js: Sends "ROLL|Name|Skill|Result|Modifier"
    ↓
StoryTeller: processRollCommand() parses and displays
```

## 📝 INTEGRATION NOTES

### Current State:
- ✅ **V4-network**: All button integrations complete
- ✅ **StoryTeller**: All command processing complete
- ✅ **Commands**: All 4 command types implemented
- ⏳ **UI**: Initiative tracker UI needs to be built
- ⏳ **Testing**: Full end-to-end testing needed

### Migration Strategy:
1. **Current code works** - don't break existing functionality
2. **New files contain clean implementations** - reference for future development
3. **Existing files have integration points documented** - easy to maintain
4. **Combat system can be enhanced** - without touching core character system

### Files That Need Updates Going Forward:
- `/V4-network/js/combatSystem-V4.js` - All new combat features
- `/StoryTeller/js/combatSystem-ST.js` - All new combat features
- This mapping document - Update as features are added

### Files That Should NOT Be Modified for Combat:
- Core character management functions
- Base attribute/skill rolling logic  
- Chat infrastructure (except command routing)
- UI layout (except combat-specific panels)

## 🎯 NEXT IMPLEMENTATION TARGETS

1. **Initiative Tracker UI** (StoryTeller)
   - Visual initiative order display
   - Turn indicator
   - Manual initiative editing

2. **Combat Controls** (StoryTeller)
   - Start/End combat buttons
   - Next/Previous turn buttons
   - Round counter

3. **Enhanced Testing**
   - Full V4-network ↔ StoryTeller workflow
   - All command types
   - Error handling

**This document serves as the definitive reference for all combat-related code across both applications.**
