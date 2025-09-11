# Reordered Sprite Sheet - Map Editor Compatible

## Overview
This sprite sheet (dungeon_sprite_sheet_ordered.png) follows the EXACT order from your map-editor.js file for seamless integration.

## Tile Order (Matching map-editor.js):

### **Row 1: Terrain**
1. **Mountain** (🏔️) - Grey rocky mountain texture
2. **Water** (🌊) - Blue water with wave patterns  
3. **Grass** (🌿) - Green grass with details
4. **Rock/Stone Wall** (🪨) - Grey brick pattern

### **Row 2: Buildings**
5. **Castle** (🏰) - Grey fortress with battlements
6. **House** (🏠) - House with orange roof
7. **Shop** (🏪) - Market with orange awnings
8. **Temple** (🏛️) - White columns with black roof

### **Row 3: RPG Icons**
9. **Dragon** (🐉) - Orange dragon head (NEW!)
10. **Sword** (⚔️) - Silver/grey sword (NEW!)
11. **Skull** (💀) - White/grey skull (NEW!)
12. **Danger** (⚠️) - Orange warning triangle

### **Row 4: Special Items**
13. **Tower** (🗼) - Grey stone tower (NEW!)
14. **Road** (🛣️) - Grey stone path
15. **Door** (🚪) - Wooden door over stone wall
16. **Fire** (🔥) - Orange flame torch

## JavaScript Integration:

```javascript
const tileOptions = [
  // Terrain
  { type: "emoji", value: "0", name: "Mountain", category: "terrain" },
  { type: "emoji", value: "1", name: "Water", category: "terrain" },
  { type: "emoji", value: "2", name: "Grass", category: "terrain" },
  { type: "emoji", value: "3", name: "Rock", category: "terrain" },
  
  // Buildings
  { type: "emoji", value: "4", name: "Castle", category: "buildings" },
  { type: "emoji", value: "5", name: "House", category: "buildings" },
  { type: "emoji", value: "6", name: "Shop", category: "buildings" },
  { type: "emoji", value: "7", name: "Temple", category: "buildings" },
  
  // RPG Icons
  { type: "rpg", value: "8", name: "Dragon", category: "monsters" },
  { type: "rpg", value: "9", name: "Sword", category: "items" },
  { type: "rpg", value: "10", name: "Skull", category: "hazards" },
  { type: "rpg", value: "11", name: "Danger", category: "hazards" },
  
  // Special
  { type: "emoji", value: "12", name: "Tower", category: "buildings" },
  { type: "road", value: "13", name: "Road", category: "paths" },
  { type: "emoji", value: "14", name: "Door", category: "features" },
  { type: "emoji", value: "15", name: "Fire", category: "hazards" }
];
```

## CSS Implementation:
```css
.tile {
  width: 32px;
  height: 32px;
  background-image: url('dungeon_sprite_sheet_ordered.png');
  background-size: 256px 256px;
}

.tile-0 { background-position: 0px 0px; }        /* Mountain */
.tile-1 { background-position: -64px 0px; }      /* Water */
.tile-2 { background-position: -128px 0px; }     /* Grass */
.tile-3 { background-position: -192px 0px; }     /* Rock */
.tile-4 { background-position: 0px -64px; }      /* Castle */
.tile-5 { background-position: -64px -64px; }    /* House */
.tile-6 { background-position: -128px -64px; }   /* Shop */
.tile-7 { background-position: -192px -64px; }   /* Temple */
.tile-8 { background-position: 0px -128px; }     /* Dragon */
.tile-9 { background-position: -64px -128px; }   /* Sword */
.tile-10 { background-position: -128px -128px; } /* Skull */
.tile-11 { background-position: -192px -128px; } /* Danger */
.tile-12 { background-position: 0px -192px; }    /* Tower */
.tile-13 { background-position: -64px -192px; }  /* Road */
.tile-14 { background-position: -128px -192px; } /* Door */
.tile-15 { background-position: -192px -192px; } /* Fire */
```

## New Tiles Added:
✅ **Dragon** - Orange dragon head for monsters
✅ **Sword** - Silver sword for items/weapons  
✅ **Skull** - White skull for hazards/death
✅ **Tower** - Grey stone tower for buildings

## Missing Tiles:
- **Player** (👤) - Can be added as tile 16 if needed
- **Clear** - Empty/transparent tile for erasing

This order now matches your map-editor.js file exactly, making integration seamless!

