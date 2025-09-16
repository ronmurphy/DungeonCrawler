# Enhanced Death System - Strategic Revival Choices

## Overview
Successfully implemented an advanced death system with dual revival options that provide strategic choices with different consequences and costs.

## Features Implemented

### 1. Dual Revival System
- **Revenge Revival (⚔️)**: Return to combat to face your killer again
  - Cost: 1/2 gold + 1 item (lower penalty)
  - Result: Restart same combat encounter
  - Strategic: Risk vs reward - chance for revenge but must fight again

- **Retreat Revival (🏃)**: Safe escape to the overworld  
  - Cost: 2/3 gold + 2 items (higher penalty)
  - Result: Return safely to map
  - Strategic: Guaranteed safety but more expensive

### 2. Smart Item Priority System
Items are lost based on strategic importance:
1. **Healing Items** (Priority 1 - lost first)
   - Potions, elixirs, remedies
   - Makes sense to lose consumables first
   
2. **Accessories** (Priority 2)
   - Rings, amulets, accessories
   - Secondary equipment
   
3. **Offhand Items** (Priority 3)
   - Shields, offhand weapons
   - Important but replaceable
   
4. **Weapons & Armor** (Priority 4 - protected)
   - Main weapons, armor pieces
   - Core combat equipment protected last

### 3. Enhanced UI/UX
- **Visual Design**: Color-coded revival options with distinct styling
  - Orange for Revenge (aggressive feel)
  - Teal for Retreat (calm, safe feel)
  - Dark red for permanent death
  
- **Clear Information**: Each option shows exact penalties before selection
- **Responsive Animations**: Hover effects and smooth transitions
- **Intuitive Icons**: Sword for revenge, running figure for retreat

### 4. Technical Implementation
- **Updated `handleRevival()`**: Now handles string parameters ('revenge', 'retreat', false)
- **Enhanced `applyDeathPenalties()`**: Calculates different penalties based on revival type
- **New `selectItemsToLose()`**: Smart priority-based item selection algorithm
- **Enemy Storage**: `currentEnemies` property stores encounter for revenge restart
- **Modal Styling**: Complete CSS redesign for new dual-option interface

## Game Balance Considerations

### Strategic Depth
- Players must weigh immediate safety vs long-term cost
- Revenge option encourages aggressive play but with risk
- Retreat option provides certainty but discourages reckless combat

### Penalty Structure
- **Gold Loss**: Revenge (50%) vs Retreat (67%) creates meaningful choice
- **Item Loss**: 1 vs 2 items makes retreat significantly more expensive
- **Smart Priority**: Protects essential gear while removing expendables

### Player Agency
- Three distinct choices (revenge, retreat, permanent death)
- Clear consequences displayed before selection
- No "trap" options - all choices are viable strategies

## Code Files Modified
- `v5/js/combat/CombatManager.js`: Complete death system overhaul
  - New modal HTML structure
  - Updated CSS styling
  - Enhanced penalty calculation
  - Smart item selection algorithm
  - Dual revival handling logic

## Testing Notes
- Modal displays correctly with penalty calculations
- Revival buttons work with new parameter structure  
- Combat restart works for revenge option
- Smart item priority properly protects gear
- CSS styling provides clear visual hierarchy

## Future Enhancement Ideas
- Add different penalty scaling based on difficulty
- Consider temporary buffs for revenge revival (anger bonus)
- Add death statistics tracking
- Implement "insurance" items that protect against loss
- Create achievements for different revival choices

---

This enhanced death system transforms player death from a simple setback into a strategic decision point, adding depth to the combat experience while maintaining clear game balance.