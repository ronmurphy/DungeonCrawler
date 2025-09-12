# ThreeRenderMap Mobile-First Optimization Checklist

## 🎯 **Mobile Performance Priorities**
- Target: Low-tier Android devices with integrated graphics
- Focus: Frame rate over visual fidelity
- Strategy: Aggressive culling and LOD (Level of Detail) systems

---

## 📐 **Map Dimensions & Scaling** ⚠️ **URGENT - IMPLEMENT FIRST**

### Current Issues:
- [ ] **Tiles too small** - Player can't properly explore
- [ ] **No proper map bounds** - Infinite generation performance hit
- [ ] **Grass sprites too dense** - Framerate killer on mobile

### Implementation Areas:
- **File:** `v5/js/ThreeMapRenderer.js`
- **Method:** `createTileMesh()` - Adjust tile size multiplier
- **Method:** `createGrassField()` - Reduce grass density for mobile
- **Reference:** `maped3d-main/js/classes/MapEditor.js` lines 89-120 (map bounds calculation)

### Proposed Changes:
- [ ] **Tile size:** Increase from 1x1 to 4x4 or 8x8 units
- [ ] **Map bounds:** Define max render area (e.g., 100x100 tiles max)
- [ ] **Grass density:** Reduce from current to 25% on mobile detection

---

## 🏃‍♂️ **Movement & Physics System** 

### Current State: Basic WASD movement
- [ ] **Delta-time movement** - FPS-independent motion
- [ ] **Sprint mechanics** - Right-click to run (already reserved)
- [ ] **Collision detection** - Wall/object boundaries
- [ ] **Jump/land physics** - Terrain interaction
- [ ] **Movement smoothing** - Reduce jitter on mobile

### Implementation Plan:
- **New File:** `v5/js/Scene3DController-v5.js`
- **Extract from:** `maped3d-main/js/classes/Scene3DController.js` lines 8-50 (moveState system)
- **Extract from:** `maped3d-main/js/classes/PhysicsController.js` (collision detection)

### Key Features to Port:
```javascript
// From maped3d Scene3DController
this.moveState = {
  forward: false, backward: false, left: false, right: false,
  speed: 0.025, sprint: false, mouseRightDown: false
};
```

---

## 🚪 **Interactive Elements System**

### Door/Building Interactions:
- [ ] **Proximity detection** - "Press E" prompts
- [ ] **Teleportation zones** - Enter buildings/dungeons  
- [ ] **Marker system** - Interactive object placement
- [ ] **UI prompts** - Mobile-friendly interaction hints

### Implementation:
- **New File:** `v5/js/InteractionController-v5.js`
- **Extract from:** `maped3d-main/js/classes/Scene3DController.js` lines 3000-3200 (door system)
- **Method reference:** `handleProximityDetection()`, `createDoorMarker()`

---

## 🏠 **Room/Zone Management** 

### Current State: Single continuous map
- [ ] **Room-based loading** - Stream areas on demand
- [ ] **Zone boundaries** - Defined play areas
- [ ] **Progressive loading** - Load adjacent rooms
- [ ] **Memory cleanup** - Unload distant areas

### Implementation:
- **New File:** `v5/js/Room-v5.js`
- **Extract from:** `maped3d-main/js/classes/Room.js` (room boundary system)
- **Integration:** Supabase room data streaming

---

## 🎨 **Rendering Optimizations**

### Level of Detail (LOD) System:
- [ ] **Distance-based tile quality** - Reduce detail far away
- [ ] **Billboard culling** - Hide sprites beyond view distance  
- [ ] **Texture resolution scaling** - Lower res for distant objects
- [ ] **Grass sprite culling** - Only render nearby vegetation

### Implementation Areas:
- **File:** `v5/js/ThreeMapRenderer.js`
- **Method:** `createTileMesh()` - Add LOD logic
- **Method:** `updateBillboards()` - Add distance culling
- **Reference:** `maped3d-main/js/classes/Scene3DController.js` lines 150-200 (render distance)

### Mobile-Specific Optimizations:
```javascript
// Detect mobile and reduce quality
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  this.renderDistance = 50; // Reduced from 100
  this.textureMultiplier = 0.5; // Half resolution textures
}
```

---

## 🌅 **Lighting & Atmosphere** (Future)

### Basic Lighting:
- [ ] **Ambient lighting** - Global illumination
- [ ] **Directional light** - Sun simulation
- [ ] **Shadow optimization** - Mobile-friendly shadows

### Implementation:
- **Reference:** `maped3d-main/js/classes/day-night-cycle.js`
- **Keep simple** - Avoid complex lighting on mobile

---

## 🎮 **Input & Controls** 

### Mobile Touch Controls:
- [ ] **Touch movement** - Virtual joystick
- [ ] **Tap interactions** - Mobile "E" key equivalent
- [ ] **Gesture support** - Pinch zoom, swipe navigation
- [ ] **Responsive UI** - Scale for different screen sizes

### Implementation:
- **New File:** `v5/js/MobileControls-v5.js`
- **Integration:** Touch event handlers for 3D movement

---

## 📊 **Performance Monitoring**

### FPS & Memory Tracking:
- [ ] **Performance stats** - Real-time FPS counter
- [ ] **Memory usage** - Track texture/geometry memory
- [ ] **Automatic quality scaling** - Reduce quality if FPS drops
- [ ] **Device capability detection** - Adjust based on hardware

### Implementation:
- **Reference:** `maped3d-main/js/classes/Scene3DController.js` lines 40-80 (stats integration)

---

## 🔧 **File Structure Plan**

### New V5 Files to Create:
```
v5/js/
├── Scene3DController-v5.js     # Core 3D scene management
├── PhysicsController-v5.js     # Collision & movement physics  
├── Room-v5.js                  # Zone/room management
├── InteractionController-v5.js # Door/object interactions
├── MobileControls-v5.js        # Touch input handling
└── PerformanceManager-v5.js    # Mobile optimization
```

### Integration with Existing:
- **ThreeMapRenderer.js** - Enhanced with LOD and culling
- **PlayerMapViewer.js** - Integrate new controllers
- **index.html** - Mobile-responsive UI updates

---

## 🚀 **Implementation Priority**

### Phase 1 (This Session):
1. **Map dimensions** - Fix tile scaling immediately
2. **Basic LOD** - Distance-based rendering
3. **Mobile detection** - Automatic quality adjustment

### Phase 2 (Next Session):
1. **Movement system** - Port from maped3d
2. **Collision detection** - Wall boundaries
3. **Interactive elements** - Door system

### Phase 3 (Future):
1. **Room-based loading** - Memory optimization
2. **Advanced touch controls** - Mobile UX
3. **Performance monitoring** - Automatic scaling

---

## 📋 **Success Metrics**

- [ ] **30+ FPS** on low-tier Android (target)
- [ ] **Smooth movement** with no stuttering
- [ ] **Responsive interactions** on touch devices
- [ ] **Memory usage** under 200MB on mobile
- [ ] **Fast loading** - New areas load in <2 seconds

---

*This checklist serves as the roadmap for transforming V5 from a basic 3D viewer into a mobile-optimized 3D exploration platform, leveraging proven techniques from maped3d-main.*
