# Planned Development - Shader Effects System for V5

**Date Created**: September 17, 2025  
**Priority**: Medium-High  
**Complexity**: Moderate  
**Target**: Combat spell effects + environmental effects for ShapeForge objects

---

## 🎯 Project Overview

Create a mobile-friendly shader effects system for V5 that provides:
1. **Combat spell effects** - Visual effects when players cast spells
2. **Environmental effects** - Enhanced ShapeForge objects (water tiles, glowing objects)
3. **Performance optimization** - Mobile-first approach with quality scaling

---

## 🔮 Combat Spell Effects System

### Element-Based Effects
Based on existing Element system (fire, ice, etc.), create spell casting visuals:

#### 🔥 Fire Element Effects
- **Fireball**: Projectile with trailing particles
- **Fire blast**: Area effect with expanding flame ring
- **Burning**: Target engulfed in flame particles
- **Fire shield**: Protective aura around caster

#### ❄️ Ice Element Effects  
- **Ice shard**: Crystalline projectile with frost trail
- **Freeze**: Target surrounded by ice crystals
- **Blizzard**: Area effect with swirling snow particles
- **Ice armor**: Crystalline protective shell

#### ⚡ Lightning Element Effects
- **Lightning bolt**: Jagged energy beam between points
- **Chain lightning**: Branching electrical arcs
- **Static field**: Crackling energy around target
- **Thunder shield**: Electrical aura with sparks

#### 🌍 Earth Element Effects
- **Rock throw**: Stone projectile with dust trail
- **Earthquake**: Ground crack effects with debris
- **Stone skin**: Rocky texture overlay on target
- **Earth shield**: Floating rock barrier

#### 💨 Air Element Effects
- **Wind blast**: Swirling air currents with debris
- **Tornado**: Spinning vortex effect
- **Levitate**: Upward swirling air currents
- **Air barrier**: Rippling atmospheric distortion

### Implementation Architecture
```javascript
class V5SpellEffects {
  constructor(renderer) {
    this.renderer = renderer;
    this.activeEffects = new Map();
    this.isMobile = renderer.isMobile;
    this.qualityLevel = this.detectQuality();
  }

  // Main interface for combat system
  castSpell(element, spellType, caster, target, options = {}) {
    const effectConfig = this.getSpellEffect(element, spellType);
    return this.createSpellEffect(effectConfig, caster, target, options);
  }

  // Element-specific effect generators
  createFireEffect(config, caster, target) { /* ... */ }
  createIceEffect(config, caster, target) { /* ... */ }
  createLightningEffect(config, caster, target) { /* ... */ }
  // etc...
}
```

---

## 🌊 Environmental Effects System

### ShapeForge Object Enhancement

#### Water Tile Effects
- **Animated water surface**: Shader-based rippling effect
- **Reflection simulation**: Simple environment mapping
- **Foam/splash effects**: Particle system for water edges
- **Depth variation**: Color gradients for shallow/deep areas

#### Glowing Objects
- **Magical crystals**: Pulsing glow with color cycling
- **Enchanted weapons**: Weapon-specific aura effects
- **Light sources**: Torch/lantern flame effects
- **Portal effects**: Swirling dimensional gateway visuals

#### Atmospheric Effects
- **Fog/mist**: Volumetric-style fog for moody areas
- **Particle ambience**: Floating dust, snow, or embers
- **Weather effects**: Rain, snow particle systems
- **Magical zones**: Area-based magical particle effects

### Implementation Strategy
```javascript
class V5EnvironmentalEffects {
  constructor(renderer) {
    this.renderer = renderer;
    this.tileEffects = new Map(); // For water tiles, etc.
    this.objectEffects = new Map(); // For ShapeForge objects
  }

  // Integrate with ThreeMapRenderer tile system
  addWaterTileEffect(tileX, tileY, intensity = 1.0) { /* ... */ }
  
  // Integrate with ShapeForge object loading
  enhanceShapeForgeObject(object, effectType, options = {}) { /* ... */ }
}
```

---

## 🎨 Technical Design Decisions

### Mobile-First Performance
1. **Quality Scaling**:
   - **Low**: Simple color overlays and basic particles
   - **Medium**: Shader effects with reduced complexity  
   - **High**: Full shader effects with all features

2. **Effect Pooling**: Reuse particle systems and geometries
3. **Distance Culling**: Disable effects beyond certain range
4. **Frame Rate Monitoring**: Automatically reduce quality if FPS drops

### Shader Architecture
```glsl
// Example simple glow vertex shader
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float intensity;

void main() {
  vec3 pos = position;
  pos.y += sin(time * 2.0) * intensity * 0.1; // Simple wave
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### Integration Points
1. **Combat System**: Hook into spell casting events
2. **ThreeMapRenderer**: Integrate with tile and object rendering
3. **ShapeForge Loading**: Auto-detect effect keywords in object names
4. **Mobile Controls**: Performance-aware effect toggling

---

## 📋 Implementation Phases

### Phase 1: Foundation (1-2 sessions)
- [ ] Create `V5SpellEffects` class structure
- [ ] Implement quality detection and mobile optimization
- [ ] Create basic fire and ice spell effects
- [ ] Integration with combat system spell casting

### Phase 2: Combat Effects (2-3 sessions)  
- [ ] Complete all 5 element types (fire, ice, lightning, earth, air)
- [ ] Add projectile effects with proper targeting
- [ ] Implement area-of-effect visual systems
- [ ] Add casting animations and impact effects

### Phase 3: Environmental Effects (2-3 sessions)
- [ ] Create water tile shader system
- [ ] Implement ShapeForge object glow effects
- [ ] Add atmospheric particle systems
- [ ] Create magical zone area effects

### Phase 4: Polish & Optimization (1-2 sessions)
- [ ] Performance optimization and mobile testing
- [ ] Effect pooling and memory management
- [ ] Visual polish and particle tuning
- [ ] Documentation and examples

---

## 🔗 Integration Requirements

### Combat System Hooks
```javascript
// In combat system, when spell is cast:
const spellEffect = renderer.spellEffects.castSpell(
  spell.element,     // 'fire', 'ice', etc.
  spell.type,        // 'projectile', 'area', 'shield'
  caster.position,   // Vector3 
  target.position,   // Vector3
  { 
    intensity: spell.level,
    duration: spell.duration 
  }
);
```

### ShapeForge Integration
```javascript
// In ShapeForge object loading:
if (objectName.includes('water')) {
  renderer.environmentalEffects.addWaterTileEffect(tileX, tileY);
}
if (objectName.includes('glow') || objectName.includes('magic')) {
  renderer.environmentalEffects.enhanceShapeForgeObject(object, 'glow');
}
```

---

## 🎮 User Experience Goals

### Combat Enhancement
- **Visual feedback**: Clear indication when spells are cast
- **Element distinction**: Each element feels unique and recognizable  
- **Impact satisfaction**: Satisfying visual impact on spell hit
- **Performance**: Smooth effects even on mobile devices

### Environmental Immersion
- **Atmosphere**: Enhanced mood through environmental effects
- **Interactivity**: Effects that respond to player presence
- **Consistency**: Effects that match the overall V5 art style
- **Scalability**: Effects that work on all device types

---

## 📊 Success Metrics

### Technical Metrics
- **Performance**: Maintain 30+ FPS on mobile with effects active
- **Memory**: < 50MB additional memory usage for effect system
- **Loading time**: < 2 second initialization time
- **Compatibility**: Works across all supported devices

### User Experience Metrics
- **Spell casting feels impactful**: Visual feedback enhances combat
- **Environmental immersion improved**: Effects enhance atmosphere
- **No performance degradation**: Effects don't hurt gameplay
- **Mobile parity**: Desktop and mobile effect quality appropriate

---

## 💡 Future Expansion Ideas

### Advanced Features
- **Custom spell combinations**: Mix elements for unique effects
- **Weather system integration**: Environmental effects based on weather
- **Dynamic lighting**: Effects that influence scene lighting
- **Audio integration**: Synchronized sound and visual effects

### Creative Tools
- **Effect editor**: In-game tool for creating custom effects
- **ShapeForge integration**: Direct effect assignment in ShapeForge
- **Community sharing**: Share custom effect configurations
- **Spell effect marketplace**: Download community-created effects

---

## 🔧 Technical Considerations

### Browser Compatibility
- **WebGL support**: Graceful fallback for limited WebGL capabilities
- **Shader compilation**: Handle shader compilation failures
- **Mobile browsers**: iOS Safari and Android Chrome optimization
- **Performance monitoring**: Automatic quality adjustment

### Integration Challenges
- **Existing codebase**: Minimal disruption to current V5 systems
- **Memory management**: Proper cleanup of effect resources
- **State synchronization**: Effects consistent across multiplayer
- **Save/load system**: Persist effect settings and preferences

---

*This system will provide a significant visual upgrade to V5 combat and environmental immersion while maintaining the mobile-first performance philosophy.*