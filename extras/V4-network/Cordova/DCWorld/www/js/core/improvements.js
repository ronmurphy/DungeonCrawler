// ========================================
// DUNGEON CRAWLER CARL IMPROVEMENTS - SYNCED v4.0
// ========================================
// This file enhances the existing character sheet system with elements from the DCC book series
// while preserving the existing custom creation features.
// FIXED: Force-copied from working Uniform-v3 version

// ========================================
// DCC-SPECIFIC SKILLS (90+ skills from the books)
// ========================================
const dccSkills = {
    // Combat Skills
    'Powerful Strike': 'strength',
    'Iron Punch': 'strength',
    'Back Claw': 'dexterity',
    'Smush': 'strength',
    'Pugilism': 'strength',
    'Aiming': 'dexterity',
    'Soul Reaper': 'charisma',
    'Catcher': 'dexterity',
    'Cesta Punta': 'dexterity', // Jai alai sport
    'Light on Your Feet': 'dexterity',
    'Cat-like Reflexes': 'dexterity',
    
    // Survival Skills
    'Breathing': 'constitution',
    'Iron Stomach': 'constitution',
    'Regeneration': 'constitution',
    'Nine Lives': 'constitution',
    'Night Vision': 'wisdom',
    'Acute Ears': 'wisdom',
    'Pathfinder': 'wisdom',
    'Mind Balance': 'wisdom',
    
    // Technical/Professional Skills
    'Basic Electrical Repair': 'intelligence',
    'IED': 'intelligence',
    'Incendiary Device Handling': 'intelligence',
    'Bomb Surgeon': 'intelligence',
    'Metal Detecting': 'intelligence',
    'Biplane Pilot': 'dexterity',
    'Chopper Pilot': 'dexterity',
    'Infusion': 'intelligence',
    
    // Social/Performance Skills
    'Character Actor': 'charisma',
    'Love Vampire': 'charisma',
    'Mascot': 'charisma',
    'Negotiation': 'charisma',
    'Marked For Death': 'constitution',
    
    // Absurd/Humorous Skills (DCC trademark)
    'Cockroach': 'constitution',
    'Frogger': 'dexterity', // Video game skill
    'Operating Sony RMVLZ620 Universal Remote': 'intelligence',
    'Lacing Boots': 'dexterity',
    'Scutelliphily': 'intelligence', // Collecting shields/escutcheons
    
    // Utility Skills
    'Crowd Blast': 'charisma',
    'Backfire': 'constitution',
    'Walk on Air': 'wisdom',
    'Tent the House': 'intelligence'
};

// ========================================
// DCC-SPECIFIC RACES
// ========================================
const dccRaces = {
    // Alien Races
    bopca: {
        name: 'Bopca',
        statBonuses: { intelligence: 1, charisma: 1 },
        skills: [
            { name: 'Diplomatic Immunity', stat: 'charisma' },
            { name: 'Alien Technology', stat: 'intelligence' }
        ],
        maximums: { 
            strength: 12, dexterity: 14, constitution: 13, 
            intelligence: 18, wisdom: 16, charisma: 17 
        },
        description: 'Alien race often working as NPCs, diplomatic and peaceful'
    },
    
    skyfowl: {
        name: 'Skyfowl',
        statBonuses: { dexterity: 2, wisdom: 1 },
        skills: [
            { name: 'Flight', stat: 'dexterity' },
            { name: 'Aerial Combat', stat: 'dexterity' },
            { name: 'Storm Resistance', stat: 'constitution' }
        ],
        maximums: { 
            strength: 14, dexterity: 18, constitution: 15, 
            intelligence: 14, wisdom: 17, charisma: 12 
        },
        description: 'One of six basic starter species, natural fliers and assholes'
    },
    
    // Dungeon Races
    rat_kin: {
        name: 'Rat-kin',
        statBonuses: { dexterity: 1, constitution: 1, wisdom: 1 },
        skills: [
            { name: 'Scavenging', stat: 'wisdom' },
            { name: 'Disease Resistance', stat: 'constitution' },
            { name: 'Tunnel Navigation', stat: 'wisdom' }
        ],
        maximums: { 
            strength: 13, dexterity: 17, constitution: 16, 
            intelligence: 14, wisdom: 16, charisma: 12 
        },
        description: 'First Floor mob that becomes playable race option on Third Floor'
    },
    
    hellspawn_familiar: {
        name: 'Hellspawn Familiar',
        statBonuses: { strength: 1, constitution: 1, charisma: 1 },
        skills: [
            { name: 'Demonic Heritage', stat: 'charisma' },
            { name: 'Wing Growth', stat: 'constitution' },
            { name: 'Fire Resistance', stat: 'constitution' }
        ],
        maximums: { 
            strength: 16, dexterity: 15, constitution: 17, 
            intelligence: 14, wisdom: 13, charisma: 16 
        },
        description: 'Pet-class race that grows wings and size as they level',
        levelProgression: {
            5: 'Small wings develop',
            10: 'Flight capability',
            15: 'Full demonic form'
        }
    },
    
    // Special Races
    primal: {
        name: 'Primal',
        statBonuses: { strength: 2, constitution: 2, intelligence: 2 },
        skills: [
            { name: 'Universal Skill Training', stat: 'intelligence' },
            { name: 'Cosmic Knowledge', stat: 'wisdom' },
            { name: 'Progenitor Heritage', stat: 'charisma' }
        ],
        maximums: { 
            strength: 20, dexterity: 20, constitution: 20, 
            intelligence: 20, wisdom: 20, charisma: 20 
        },
        description: 'Progenitor race - can train ALL skills up to level 20',
        special: 'Can train any skill to maximum level'
    },
    
    were_creature: {
        name: 'Were-creature',
        statBonuses: { strength: 2, constitution: 1 },
        skills: [
            { name: 'Shape Shifting', stat: 'constitution' },
            { name: 'Enhanced Senses', stat: 'wisdom' },
            { name: 'Lunar Affinity', stat: 'wisdom' }
        ],
        maximums: { 
            strength: 18, dexterity: 16, constitution: 17, 
            intelligence: 14, wisdom: 15, charisma: 13 
        },
        description: 'Can change size and form, requires special equipment',
        equipment: ['Size-Altering Gear', 'Hulk Boxers']
    }
};

// ========================================
// DCC-SPECIFIC CLASSES
// ========================================
const dccClasses = {
    // Earth-Based Professional Classes
    compensated_anarchist: {
        name: 'Compensated Anarchist',
        statBonuses: { strength: 1, charisma: 1, constitution: 1 },
        skills: [
            { name: 'Riot Control', stat: 'strength' },
            { name: 'Crowd Manipulation', stat: 'charisma' },
            { name: 'Urban Warfare', stat: 'intelligence' }
        ],
        description: 'Professional revolutionary with corporate backing - Carl\'s class'
    },
    
    bomb_squad_tech: {
        name: 'Bomb Squad Tech',
        statBonuses: { intelligence: 2, dexterity: 1 },
        skills: [
            { name: 'IED', stat: 'intelligence' },
            { name: 'Bomb Surgeon', stat: 'intelligence' },
            { name: 'Incendiary Device Handling', stat: 'intelligence' }
        ],
        description: 'Earth-based explosive specialist'
    },
    
    prizefighter: {
        name: 'Prizefighter',
        statBonuses: { strength: 2, constitution: 1 },
        skills: [
            { name: 'Pugilism', stat: 'strength' },
            { name: 'Iron Punch', stat: 'strength' },
            { name: 'Powerful Strike', stat: 'strength' }
        ],
        description: 'Monk-Earth hybrid focused on hand-to-hand combat'
    },
    
    artist_alley_mogul: {
        name: 'Artist Alley Mogul',
        statBonuses: { charisma: 2, intelligence: 1 },
        skills: [
            { name: 'Character Actor', stat: 'charisma' },
            { name: 'Mascot', stat: 'charisma' },
            { name: 'Performance', stat: 'charisma' }
        ],
        description: 'Earth-based entertainment and business class - Donut\'s Floor 3 class'
    },
    
    former_child_actor: {
        name: 'Former Child Actor',
        statBonuses: { charisma: 1, dexterity: 1, intelligence: 1 },
        skills: [
            { name: 'Character Actor', stat: 'charisma' },
            { name: 'Performance', stat: 'charisma' },
            { name: 'Stealth', stat: 'dexterity' }
        ],
        description: 'Bard-Rogue-Earth hybrid with performance background - Donut\'s class'
    },
    
    // Sports/Entertainment Classes
    roller_derby_jammer: {
        name: 'Roller Derby Jammer',
        statBonuses: { dexterity: 2, constitution: 1 },
        skills: [
            { name: 'Light on Your Feet', stat: 'dexterity' },
            { name: 'Crowd Navigation', stat: 'dexterity' },
            { name: 'Momentum Control', stat: 'dexterity' }
        ],
        description: 'High-speed combat specialist'
    },
    
    football_hooligan: {
        name: 'Football Hooligan',
        statBonuses: { strength: 1, constitution: 1, charisma: 1 },
        skills: [
            { name: 'Crowd Fighting', stat: 'strength' },
            { name: 'Intimidation', stat: 'charisma' },
            { name: 'Team Coordination', stat: 'charisma' }
        ],
        description: 'Mob combat and crowd control expert - Donut\'s Floor 4 class'
    },
    
    kabaddi_raider: {
        name: 'Kabaddi Raider',
        statBonuses: { dexterity: 1, constitution: 1, strength: 1 },
        skills: [
            { name: 'Grappling', stat: 'strength' },
            { name: 'Breath Control', stat: 'constitution' },
            { name: 'Team Tactics', stat: 'intelligence' }
        ],
        description: 'Earth sport-based combat class'
    },
    
    // Vehicle/Heavy Classes
    monster_truck_driver: {
        name: 'Monster Truck Driver',
        statBonuses: { strength: 2, constitution: 2 },
        skills: [
            { name: 'Vehicle Operation', stat: 'dexterity' },
            { name: 'Ramming', stat: 'strength' },
            { name: 'Mechanical Repair', stat: 'intelligence' }
        ],
        description: 'Juggernaut class focused on overwhelming force - Katia Grim\'s class'
    },
    
    // Absurd/Humorous Classes
    vape_shop_counter_jockey: {
        name: 'Vape Shop Counter Jockey',
        statBonuses: { charisma: 1, dexterity: 1 },
        skills: [
            { name: 'Customer Service', stat: 'charisma' },
            { name: 'Product Knowledge', stat: 'intelligence' },
            { name: 'Hipster Culture', stat: 'charisma' }
        ],
        description: 'Master of clouds and customer complaints'
    },
    
    freelance_psychiatrist: {
        name: 'Freelance Psychiatrist',
        statBonuses: { intelligence: 2, wisdom: 1 },
        skills: [
            { name: 'Mind Reading', stat: 'wisdom' },
            { name: 'Psychological Manipulation', stat: 'charisma' },
            { name: 'Therapy', stat: 'wisdom' }
        ],
        description: 'Psionic abilities from understanding the human mind'
    },
    
    banana_farmer: {
        name: 'Banana Farmer',
        statBonuses: { wisdom: 1, constitution: 1, dexterity: 1 },
        skills: [
            { name: 'Plant Growth', stat: 'wisdom' },
            { name: 'Seed Shooting', stat: 'dexterity' },
            { name: 'Agricultural Knowledge', stat: 'intelligence' }
        ],
        description: 'Druid-like abilities focused on banana cultivation'
    },
    
    // Hybrid Classes
    necrobard: {
        name: 'NecroBard',
        statBonuses: { charisma: 1, intelligence: 1, wisdom: 1 },
        skills: [
            { name: 'Death Magic', stat: 'intelligence' },
            { name: 'Performance', stat: 'charisma' },
            { name: 'Undead Control', stat: 'wisdom' }
        ],
        description: 'Combines musical performance with necromantic magic'
    },
    
    feral_cat_berserker: {
        name: 'Feral Cat Berserker',
        statBonuses: { dexterity: 2, constitution: 1 },
        skills: [
            { name: 'Cat-like Reflexes', stat: 'dexterity' },
            { name: 'Feral Rage', stat: 'strength' },
            { name: 'Nine Lives', stat: 'constitution' }
        ],
        description: 'Berserker with feline instincts and agility'
    },
    
    animal_test_subject: {
        name: 'Animal Test Subject',
        statBonuses: { constitution: 2, intelligence: 1 },
        skills: [
            { name: 'Poison Resistance', stat: 'constitution' },
            { name: 'Chemical Knowledge', stat: 'intelligence' },
            { name: 'Mutation', stat: 'constitution' }
        ],
        description: 'Mage specializing in poison, glows green',
        visualEffect: 'green_glow'
    },
    
    glass_cannon: {
        name: 'Glass Cannon',
        statBonuses: { constitution: 1, intelligence: 2 },
        skills: [
            { name: 'Spell Acceleration', stat: 'intelligence' },
            { name: 'Magic Efficiency', stat: 'intelligence' },
            { name: 'Power Channeling', stat: 'constitution' }
        ],
        description: 'Increases constitution, faster spell training, reduced casting costs - Donut\'s Fifth Floor class'
    },
    
    legendary_diva: {
        name: 'Legendary Diva',
        statBonuses: { charisma: 3 },
        skills: [
            { name: 'Stage Presence', stat: 'charisma' },
            { name: 'Crowd Control', stat: 'charisma' },
            { name: 'Performance Magic', stat: 'charisma' }
        ],
        description: 'Ultimate performance class - Donut\'s Sixth Floor class'
    },
    
    viper_queen: {
        name: 'Viper Queen',
        statBonuses: { dexterity: 1, constitution: 1, charisma: 1 },
        skills: [
            { name: 'Spit Poison', stat: 'constitution' },
            { name: 'Serpentine Movement', stat: 'dexterity' },
            { name: 'Venomous Bite', stat: 'constitution' }
        ],
        description: 'Poison-based combat class - Donut\'s Seventh Floor class'
    }
};

// ========================================
// DCC-SPECIFIC WEAPONS AND EQUIPMENT
// ========================================
const dccWeapons = {
    // Earth Weapons
    baseball_bat: {
        name: 'Baseball Bat',
        size: 'medium',
        damage: 'd6',
        special: ['Familiar', 'Earth Weapon'],
        skills: ['Athletics', 'Powerful Strike'],
        description: 'Classic Earth weapon, feels familiar in your hands'
    },
    
    crowbar: {
        name: 'Crowbar',
        size: 'medium',
        damage: 'd6',
        special: ['Tool', 'Leverage'],
        skills: ['Athletics', 'Basic Electrical Repair'],
        description: 'Tool and weapon in one'
    },
    
    chainsaw: {
        name: 'Chainsaw',
        size: 'heavy',
        damage: 'd10',
        special: ['Loud', 'Fuel Required', 'Intimidating'],
        skills: ['Mechanical Repair', 'Intimidation'],
        description: 'Loud, devastating, and fuel-hungry'
    },
    
    kitchen_knife: {
        name: 'Kitchen Knife',
        size: 'light',
        damage: 'd4',
        special: ['Concealable', 'Familiar'],
        skills: ['Stealth', 'Sleight of Hand'],
        description: 'Simple but effective'
    },
    
    // Firearms
    pistol: {
        name: 'Pistol',
        size: 'light',
        damage: 'd6',
        range: 'short',
        special: ['Concealable', 'Ammunition'],
        skills: ['Aiming', 'Basic Firearms'],
        description: 'Compact and concealable'
    },
    
    shotgun: {
        name: 'Shotgun',
        size: 'heavy',
        damage: 'd8',
        range: 'medium',
        special: ['Spread Damage', 'Ammunition'],
        skills: ['Aiming', 'Basic Firearms'],
        description: 'Devastating at close range'
    },
    
    // Explosives
    grenade: {
        name: 'Grenade',
        size: 'light',
        damage: '2d6',
        range: 'thrown',
        special: ['Area Effect', 'Single Use'],
        skills: ['IED', 'Athletics'],
        description: 'Pull pin, throw, take cover'
    },
    
    molotov_cocktail: {
        name: 'Molotov Cocktail',
        size: 'light',
        damage: 'd6+fire',
        range: 'thrown',
        special: ['Fire Damage', 'Area Effect', 'Craftable'],
        skills: ['Incendiary Device Handling', 'Athletics'],
        description: 'Improvised incendiary weapon'
    },
    
    // Dungeon/Alien Weapons
    plasma_rifle: {
        name: 'Plasma Rifle',
        size: 'heavy',
        damage: '2d6',
        range: 'long',
        special: ['Energy Weapon', 'No Ammunition'],
        skills: ['Alien Technology', 'Aiming'],
        description: 'Advanced energy weapon'
    },
    
    vorpal_blade: {
        name: 'Vorpal Blade',
        size: 'medium',
        damage: 'd8',
        special: ['Vorpal', 'Ignores Armor on Crit'],
        skills: ['Weapon Mastery', 'Powerful Strike'],
        description: 'Magical blade that cuts through anything'
    },
    
    gravity_hammer: {
        name: 'Gravity Hammer',
        size: 'heavy',
        damage: 'd10',
        special: ['Knockback Effect', 'Area Damage'],
        skills: ['Powerful Strike', 'Physics'],
        description: 'Manipulates gravity for devastating impact'
    }
};

// ========================================
// DCC-SPECIFIC EQUIPMENT
// ========================================
const dccEquipment = {
    hulk_boxers: {
        name: 'Hulk Boxers',
        slot: 'armor',
        effect: 'Size-altering capability',
        description: 'White boxers with red hearts, designed for size-changing races',
        special: ['Size-Altering', 'Indestructible']
    },
    
    portable_fortress: {
        name: 'Portable Fortress',
        slot: 'utility',
        effect: 'Deployable shelter and defense',
        description: 'Compact base that expands when needed',
        special: ['Deployable', 'Shelter']
    },
    
    universal_remote: {
        name: 'Sony RMVLZ620 Universal Remote',
        slot: 'utility',
        effect: 'Control various electronic devices',
        description: 'Surprisingly useful in dungeons',
        skills: ['Operating Sony RMVLZ620 Universal Remote'],
        special: ['Electronic Control', 'Absurd but Useful']
    }
};

// ========================================
// DCC-SPECIFIC SPELLS
// ========================================
const dccSpells = {
    // Combat Spells
    crowd_blast: {
        name: 'Crowd Blast',
        level: 1,
        cost: 2,
        cooldown: 30,
        effect: 'Area damage to multiple enemies',
        element: 'force',
        description: 'Blasts multiple targets with concussive force'
    },
    
    backfire: {
        name: 'Backfire',
        level: 2,
        cost: 3,
        cooldown: 60,
        effect: 'Reflects damage back to attacker',
        element: 'arcane',
        description: 'Turns enemy attacks against themselves'
    },
    
    soul_reaper: {
        name: 'Soul Reaper',
        level: 3,
        cost: 5,
        cooldown: 120,
        effect: 'Drains life force from target',
        element: 'dark',
        description: 'Harvests the essence of your enemies'
    },
    
    dragon_breath: {
        name: 'Dragon Breath',
        level: 2,
        cost: 4,
        cooldown: 90,
        effect: 'Cone of elemental damage',
        element: 'fire',
        description: 'Breathe like a dragon',
        requiredRace: 'dragonborn'
    },
    
    spit_poison: {
        name: 'Spit Poison',
        level: 1,
        cost: 2,
        cooldown: 30,
        effect: 'Ranged poison attack',
        element: 'nature',
        description: 'Venomous projectile attack',
        requiredClass: 'viper_queen'
    },
    
    // Utility Spells
    infusion: {
        name: 'Infusion',
        level: 1,
        cost: 1,
        cooldown: 10,
        effect: 'Enhances item properties temporarily',
        element: 'arcane',
        description: 'Temporarily improves equipment'
    },
    
    walk_on_air: {
        name: 'Walk on Air',
        level: 2,
        cost: 3,
        cooldown: 300,
        effect: 'Brief levitation ability',
        element: 'air',
        description: 'Defy gravity for a short time'
    },
    
    tent_the_house: {
        name: 'Tent the House',
        level: 2,
        cost: 4,
        cooldown: 600,
        effect: 'Creates temporary shelter',
        element: 'earth',
        description: 'Instant camping setup'
    },
    
    // Buff Spells
    juiced_buff: {
        name: 'Juiced Buff',
        level: 1,
        cost: 2,
        cooldown: 60,
        effect: '+2 to all stats for 10 minutes',
        element: 'divine',
        description: 'Enhances all physical and mental capabilities'
    },
    
    shrouded_buff: {
        name: 'Shrouded Buff',
        level: 1,
        cost: 2,
        cooldown: 60,
        effect: 'Stealth enhancement',
        element: 'shadow',
        description: 'Blend into the shadows'
    },
    
    trolled_buff: {
        name: 'Trolled Buff',
        level: 1,
        cost: 2,
        cooldown: 60,
        effect: 'Confusion resistance',
        element: 'psychic',
        description: 'Mental protection against trickery'
    }
};

// ========================================
// DCC STATUS EFFECTS
// ========================================
const dccStatusEffects = {
    marked_for_death: {
        name: 'Marked for Death',
        duration: 'permanent',
        effect: 'Increased damage taken and dealt',
        description: 'A dangerous but powerful curse'
    },
    
    juiced: {
        name: 'Juiced',
        duration: 600,
        effect: '+2 to all stats',
        description: 'Enhanced physical and mental capabilities'
    },
    
    shrouded: {
        name: 'Shrouded',
        duration: 300,
        effect: 'Enhanced stealth capabilities',
        description: 'Blended with shadows'
    },
    
    radiation_exposure: {
        name: 'Radiation Exposure',
        duration: 'varies',
        effect: 'Gradual health loss, potential mutations',
        description: 'Post-apocalyptic environmental hazard'
    },
    
    dungeon_madness: {
        name: 'Dungeon Madness',
        duration: 'session',
        effect: 'Unpredictable behavior, enhanced creativity',
        description: 'The dungeon gets to you after a while'
    },
    
    nine_lives_active: {
        name: 'Nine Lives Active',
        duration: 'permanent',
        effect: 'Can survive normally fatal damage',
        description: 'Cat-like survival instinct',
        charges: 9
    }
};

// ========================================
// ENHANCEMENT FUNCTIONS
// ========================================

// Merge DCC skills with existing skills
function enhanceSkillSystem() {
    // Add DCC skills to the global standardSkills object
    Object.assign(standardSkills, dccSkills);
    
    // Initialize skill levels for existing characters
    if (character && !character.skillLevels) {
        character.skillLevels = {};
        
        // Initialize existing custom skills
        character.customSkills.forEach(skill => {
            character.skillLevels[skill.name] = { level: 1, experience: 0 };
        });
    }
}

// Merge DCC races with existing races
function enhanceRaceSystem() {
    Object.assign(races, dccRaces);
}

// Merge DCC classes with existing classes
function enhanceClassSystem() {
    Object.assign(classes, dccClasses);
}

// Add DCC weapons to weapon creation system
function enhanceWeaponSystem() {
    // Add predefined DCC weapons as templates
    window.dccWeaponTemplates = dccWeapons;
    
    // Add button to inventory creation area when tab is rendered
    const originalRenderInventory = window.renderInventory;
    if (originalRenderInventory) {
        window.renderInventory = function() {
            originalRenderInventory();
            setTimeout(addDCCWeaponButton, 50); // Small delay to ensure DOM is ready
        };
    }
}

// Add DCC spells to spell creation system
function enhanceSpellSystem() {
    // Add predefined DCC spells as templates
    window.dccSpellTemplates = dccSpells;
    
    // Add button to magic creation area when tab is rendered
    const originalRenderSpells = window.renderSpells;
    if (originalRenderSpells) {
        window.renderSpells = function() {
            originalRenderSpells();
            setTimeout(addDCCSpellButton, 50); // Small delay to ensure DOM is ready
        };
    }
}

// Add DCC weapon button to inventory creation section
function addDCCWeaponButton() {
    console.log('🔧 Adding DCC weapon templates button...');
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid || inventoryGrid.querySelector('.dcc-templates-btn')) {
        console.log('✅ DCC weapon button already exists or grid not found');
        return;
    }
    
    console.log('🔧 Creating DCC weapon button...');
    const templatesBtn = document.createElement('div');
    templatesBtn.className = 'dcc-templates-btn inventory-item';
    templatesBtn.innerHTML = `
        <div style="text-align: center; padding: 20px; border: 2px dashed #ff6b35; background: rgba(255, 107, 53, 0.1); border-radius: 8px;">
            <i class="ra ra-book" style="font-size: 2em; color: #ff6b35; margin-bottom: 10px; display: block;"></i>
            <strong>📚 DCC Book Weapons</strong>
            <br><small>Click to add weapons from the books</small>
        </div>
    `;
    templatesBtn.onclick = showDCCWeaponTemplates;
    
    inventoryGrid.insertBefore(templatesBtn, inventoryGrid.firstChild);
    console.log('✅ DCC weapon button added successfully');
}

// Add DCC spell button to magic creation section  
function addDCCSpellButton() {
    console.log('🔧 Adding DCC spell templates button...');
    const spellsGrid = document.getElementById('spells-grid');
    if (!spellsGrid || spellsGrid.querySelector('.dcc-spell-templates-btn')) {
        console.log('✅ DCC spell button already exists or grid not found');
        return;
    }
    
    console.log('🔧 Creating DCC spell button...');
    const templatesBtn = document.createElement('div');
    templatesBtn.className = 'dcc-spell-templates-btn';
    templatesBtn.innerHTML = `
        <div style="text-align: center; padding: 20px; border: 2px dashed #ff6b35; background: rgba(255, 107, 53, 0.1); border-radius: 8px; margin-bottom: 20px;">
            <i class="ra ra-lightning" style="font-size: 2em; color: #ff6b35; margin-bottom: 10px; display: block;"></i>
            <strong>📚 DCC Book Spells</strong>
            <br><small>Click to add spells from the books</small>
        </div>
    `;
    templatesBtn.onclick = showDCCSpellTemplates;
    
    spellsGrid.insertBefore(templatesBtn, spellsGrid.firstChild);
    console.log('✅ DCC spell button added successfully');
}

// Show DCC weapon templates modal
function showDCCWeaponTemplates() {
    const modal = document.createElement('div');
    modal.className = 'modal level-up-modal-overlay';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content" style="max-width: 800px;">
            <div class="modal-header level-up-header">
                <h3><i class="ra ra-book"></i> DCC Book Weapons</h3>
                <button class="modal-close" onclick="closeDCCModal()" title="Close">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Choose a weapon from the Dungeon Crawler Carl books to add to your inventory:</p>
                <div class="weapon-template-grid">
                    ${Object.entries(dccWeapons).map(([key, weapon]) => `
                        <button class="weapon-template-btn" onclick="addDCCWeapon('${key}')">
                            <strong>${weapon.name}</strong>
                            <small>${weapon.damage} damage • ${weapon.description}</small>
                            ${weapon.special ? `<em>Special: ${weapon.special.join(', ')}</em>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeDCCModal()">Cancel</button>
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDCCModal();
        }
    });
    
    // Close modal on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeDCCModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(modal);
}

// Show DCC spell templates modal
function showDCCSpellTemplates() {
    const modal = document.createElement('div');
    modal.className = 'modal level-up-modal-overlay';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content" style="max-width: 800px;">
            <div class="modal-header level-up-header">
                <h3><i class="ra ra-lightning"></i> DCC Book Spells</h3>
                <button class="modal-close" onclick="closeDCCModal()" title="Close">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Choose a spell from the Dungeon Crawler Carl books to add to your spellbook:</p>
                <div class="spell-template-grid">
                    ${Object.entries(dccSpells).map(([key, spell]) => `
                        <button class="spell-template-btn" onclick="addDCCSpell('${key}')">
                            <strong>${spell.name}</strong> ${getElementEmoji(spell.element)}
                            <small>Level ${spell.level} • Cost ${spell.cost} MP • Cooldown: ${spell.cooldown || 0}s</small>
                            <em>${spell.description}</em>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeDCCModal()">Cancel</button>
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDCCModal();
        }
    });
    
    // Close modal on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeDCCModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(modal);
}

// Add DCC weapon to inventory
function addDCCWeapon(weaponKey) {
    const weaponTemplate = dccWeapons[weaponKey];
    if (!weaponTemplate) return;
    
    const item = {
        id: generateId(),
        name: weaponTemplate.name,
        type: 'weapon',
        size: weaponTemplate.size,
        defense: 0,
        twoHanded: weaponTemplate.special && weaponTemplate.special.includes('Two-Handed'),
        ranged: weaponTemplate.range && weaponTemplate.range !== 'melee',
        healing: false,
        description: weaponTemplate.description,
        special: weaponTemplate.special
    };
    
    character.inventory.push(item);
    renderInventory();
    closeDCCModal();
    
    // Show notification
    if (window.showNotification) {
        showNotification('weapon', `Added ${weaponTemplate.name}`, weaponTemplate.description);
    }
}

// Add DCC spell to spellbook
function addDCCSpell(spellKey) {
    const spellTemplate = dccSpells[spellKey];
    if (!spellTemplate) return;
    
    // Check if character has enough MP capacity
    if (spellTemplate.cost > character.magicPoints) {
        alert(`You need ${spellTemplate.cost} total Magic Points to learn this spell. You currently have ${character.magicPoints} MP.`);
        return;
    }
    
    const spell = {
        id: generateId(),
        name: spellTemplate.name,
        element: spellTemplate.element,
        damageType: spellTemplate.level > 1 ? 'fixed' : '',
        damageAmount: spellTemplate.level * 2,
        healingType: '',
        healingAmount: 0,
        primaryEffect: spellTemplate.effect,
        secondaryEffect: '',
        cost: spellTemplate.cost,
        effects: [spellTemplate.description],
        cooldown: spellTemplate.cooldown,
        level: spellTemplate.level
    };
    
    character.spells.push(spell);
    renderSpells();
    if (window.renderCharacterSpells) renderCharacterSpells();
    closeDCCModal();
    
    // Show notification
    if (window.showNotification) {
        showNotification('spell', `Learned ${spellTemplate.name}`, spellTemplate.description);
    }
}

// Close DCC modal
function closeDCCModal() {
    const modals = document.querySelectorAll('.level-up-modal-overlay');
    modals.forEach(modal => modal.remove());
}

// Enhanced universal modal handling
function enhanceModalSystem() {
    // Add escape key listener for all modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close DCC modals
            const dccModals = document.querySelectorAll('.level-up-modal-overlay');
            dccModals.forEach(modal => modal.remove());
            
            // Close achievement modals
            if (window.closeAchievementModal) {
                window.closeAchievementModal();
            }
            
            // Close character modals
            const characterModals = document.querySelectorAll('.character-modal-overlay, .modal-overlay');
            characterModals.forEach(modal => modal.remove());
        }
    });
}

// Helper function to get element emoji for spells
function getElementEmoji(element) {
    const emojis = {
        fire: '🔥',
        water: '💧',
        earth: '🌍',
        air: '💨',
        ice: '❄️',
        lightning: '⚡',
        shadow: '🌑',
        light: '☀️',
        arcane: '✨',
        dark: '💀',
        force: '💥',
        nature: '🌿',
        psychic: '🧠',
        divine: '✨'
    };
    return emojis[element] || '✨';
}

// Generate unique ID for items and spells
function generateId() {
    return 'dcc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add skill level display to character sheet
function enhanceSkillDisplay() {
    // This will be called when skills are displayed
    const originalDisplaySkills = window.displaySkills;
    if (originalDisplaySkills) {
        window.displaySkills = function() {
            originalDisplaySkills();
            addSkillLevelDisplay();
        };
    }
}

// Add skill level indicators
function addSkillLevelDisplay() {
    const skillElements = document.querySelectorAll('.skill-item');
    skillElements.forEach(skillElement => {
        const skillName = skillElement.textContent.split('(')[0].trim();
        const skillLevel = character.skillLevels && character.skillLevels[skillName] 
            ? character.skillLevels[skillName].level 
            : 1;
        
        // Add level indicator
        if (!skillElement.querySelector('.skill-level')) {
            const levelSpan = document.createElement('span');
            levelSpan.className = 'skill-level';
            levelSpan.textContent = ` [Lv.${skillLevel}]`;
            levelSpan.style.color = '#ff6b35';
            levelSpan.style.fontSize = '0.8em';
            skillElement.appendChild(levelSpan);
        }
    });
}

// Add level up skill selection
function addLevelUpSkillSelection() {
    // Check if character leveled up and needs skill selection
    if (character.level > 1 && !character.skillSelectionComplete) {
        showSkillSelectionModal();
    }
}

// Show skill selection modal for level up
function showSkillSelectionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>🎉 Level Up! Choose New Skills</h2>
            <p>You can learn ${getSkillSlotsForLevel(character.level)} new skills:</p>
            <div class="skill-selection-grid">
                ${Object.entries(standardSkills).map(([skillName, stat]) => `
                    <label class="skill-option">
                        <input type="checkbox" value="${skillName}" onchange="updateSkillSelection()">
                        <span>${skillName} (${stat.charAt(0).toUpperCase() + stat.slice(1)})</span>
                    </label>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button onclick="confirmSkillSelection()" disabled id="confirmSkillBtn">Confirm Selection</button>
                <button onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Get number of skill slots for level
function getSkillSlotsForLevel(level) {
    if (level <= 2) return 2;
    if (level <= 5) return 1;
    if (level <= 10) return 2;
    return 1;
}

// Update skill selection validation
function updateSkillSelection() {
    const checkboxes = document.querySelectorAll('.skill-option input:checked');
    const maxSkills = getSkillSlotsForLevel(character.level);
    const confirmBtn = document.getElementById('confirmSkillBtn');
    
    if (confirmBtn) {
        confirmBtn.disabled = checkboxes.length !== maxSkills;
    }
}

// Confirm skill selection
function confirmSkillSelection() {
    const checkboxes = document.querySelectorAll('.skill-option input:checked');
    
    checkboxes.forEach(checkbox => {
        const skillName = checkbox.value;
        const stat = standardSkills[skillName];
        
        // Add to character's custom skills
        character.customSkills.push({
            name: skillName,
            stat: stat
        });
        
        // Initialize skill level
        if (!character.skillLevels) character.skillLevels = {};
        character.skillLevels[skillName] = { level: 1, experience: 0 };
    });
    
    character.skillSelectionComplete = true;
    closeModal();
    updateCharacterDisplay();
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Add DCC styling
function addDCCStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .dcc-weapon-templates, .dcc-spell-templates {
            margin: 1rem 0;
            padding: 1rem;
            background: rgba(255, 107, 53, 0.1);
            border-left: 4px solid #ff6b35;
            border-radius: 4px;
        }
        
        .weapon-template-grid, .spell-template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            margin: 0.5rem 0;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .weapon-template-btn, .spell-template-btn {
            padding: 0.75rem;
            border: 1px solid #ff6b35;
            background: rgba(255, 107, 53, 0.1);
            color: inherit;
            border-radius: 4px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            min-height: 80px;
        }
        
        .weapon-template-btn:hover, .spell-template-btn:hover {
            background: rgba(255, 107, 53, 0.2);
            transform: translateY(-1px);
            border-color: #ff6b35;
            box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        }
        
        .dcc-weapon-button, .dcc-spell-button {
            margin: 15px 0;
            width: 100%;
        }
        
        .dcc-book-btn {
            background: linear-gradient(135deg, #ff6b35, #ff8f66);
            border: 2px solid #ff6b35;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .dcc-book-btn:hover {
            background: linear-gradient(135deg, #ff8f66, #ffab99);
            border-color: #ff8f66;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        
        .dcc-book-btn:active {
            transform: translateY(0);
        }
        
        .dcc-book-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }
        
        .dcc-book-btn:hover::before {
            left: 100%;
        }
        
        /* Skill selection modal styling */
        .skill-selection-info {
            background: rgba(255, 107, 53, 0.1);
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border-left: 4px solid #ff6b35;
        }
        
        .skill-selection-info ul {
            margin: 0.5rem 0 0 1rem;
            padding: 0;
        }
        
        .selected-skills-display {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
            padding: 0.5rem;
            background: var(--card-bg);
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }
        
        .skill-categories {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .skill-category {
            margin-bottom: 1.5rem;
        }
        
        .category-header {
            background: linear-gradient(135deg, #ff6b35, #ff8f66);
            color: white;
            padding: 0.5rem 1rem;
            margin: 0 0 0.5rem 0;
            border-radius: 6px;
            font-size: 1em;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 0.5rem;
        }
        
        .skill-selection-item {
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 0.75rem;
            background: var(--card-bg);
            transition: all 0.2s;
        }
        
        .skill-selection-item:hover {
            border-color: #ff6b35;
            background: rgba(255, 107, 53, 0.05);
        }
        
        .skill-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-weight: 600;
        }
        
        .skill-info {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }
        
        .skill-stat {
            display: inline-block;
            background: rgba(255, 107, 53, 0.2);
            color: #ff6b35;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .skill-description {
            display: block;
            font-size: 0.85em;
            opacity: 0.8;
            line-height: 1.3;
        }
        
        .proficiency-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
            padding-left: 1.5rem;
            cursor: pointer;
            font-size: 0.9em;
            color: #ff6b35;
            font-weight: 600;
        }
        
        .skill-selection-section {
            margin: 1rem 0;
        }
        
        .skill-level {
            font-weight: bold;
        }
        
        .skill-selection-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            max-height: 300px;
            overflow-y: auto;
            margin: 1rem 0;
        }
        
        .skill-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .skill-option:hover {
            background: rgba(255, 107, 53, 0.1);
        }
        
        .earth-class {
            background: rgba(76, 175, 80, 0.2);
        }
        
        .alien-race {
            background: rgba(156, 39, 176, 0.2);
        }
        
        .apocalypse-element {
            background: rgba(244, 67, 54, 0.2);
        }
        
        /* Achievement modal styling to match level-up modals */
        .achievement-modal .modal-content {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
        }
        
        .achievement-selection-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .achievement-option {
            padding: 1rem;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--card-bg);
        }
        
        .achievement-option:hover {
            border-color: #ff6b35;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
        }
        
        .achievement-option.common {
            border-left: 4px solid #9E9E9E;
        }
        
        .achievement-option.uncommon {
            border-left: 4px solid #4CAF50;
        }
        
        .achievement-option.rare {
            border-left: 4px solid #2196F3;
        }
        
        .achievement-option.epic {
            border-left: 4px solid #9C27B0;
        }
        
        .achievement-option.legendary {
            border-left: 4px solid #FF9800;
        }
        
        .achievement-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }
        
        .achievement-rarity {
            font-size: 0.7em;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(255, 107, 53, 0.2);
            color: #ff6b35;
        }
        
        .achievement-effect {
            background: rgba(255, 107, 53, 0.1);
            padding: 0.5rem;
            border-radius: 4px;
            margin: 0.5rem 0;
            font-size: 0.9em;
        }
        
        .achievement-category {
            text-align: right;
            opacity: 0.7;
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// INITIALIZATION
// ========================================
function initializeDCCImprovements() {
    console.log('🎮 Initializing Dungeon Crawler Carl improvements...');
    
    // Enhance all systems
    enhanceSkillSystem();
    enhanceRaceSystem();
    enhanceClassSystem();
    enhanceWeaponSystem();
    enhanceSpellSystem();
    enhanceSkillDisplay();
    enhanceModalSystem();
    addDCCStyles();
    
    // Add level up skill selection
    if (character && character.level > 1) {
        addLevelUpSkillSelection();
    }
    
    // Add DCC buttons when tabs are switched
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            setTimeout(() => {
                if (e.target.dataset.tab === 'inventory') {
                    addDCCWeaponButton();
                }
                if (e.target.dataset.tab === 'magic') {
                    addDCCSpellButton();
                }
            }, 100);
        }
    });
    
    // Try to add buttons immediately if tabs are already loaded
    setTimeout(() => {
        addDCCWeaponButton();
        addDCCSpellButton();
    }, 500);
    
    // Enhanced integration with existing systems
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab) {
        window.switchTab = function(tabName) {
            originalSwitchTab(tabName);
            setTimeout(() => {
                if (tabName === 'inventory') {
                    addDCCWeaponButton();
                }
                if (tabName === 'magic') {
                    addDCCSpellButton();
                }
            }, 50);
        };
    }
    
    console.log('✅ DCC improvements loaded successfully!');
    console.log(`📊 Added ${Object.keys(dccSkills).length} new skills`);
    console.log(`🏃 Added ${Object.keys(dccRaces).length} new races`);
    console.log(`⚔️ Added ${Object.keys(dccClasses).length} new classes`);
    console.log(`🗡️ Added ${Object.keys(dccWeapons).length} weapon templates`);
    console.log(`✨ Added ${Object.keys(dccSpells).length} spell templates`);
    console.log('🏆 Enhanced level up system with achievements integration');
}

// Auto-initialize when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDCCImprovements);
} else {
    initializeDCCImprovements();
}

// Make functions globally available
window.dccImprovements = {
    showDCCWeaponTemplates,
    showDCCSpellTemplates,
    addDCCWeapon,
    addDCCSpell,
    closeDCCModal,
    updateSkillSelection,
    confirmSkillSelection,
    closeModal,
    addLevelUpSkillSelection
};

// Also make individual functions global for onclick handlers
window.showDCCWeaponTemplates = showDCCWeaponTemplates;
window.showDCCSpellTemplates = showDCCSpellTemplates;
window.addDCCWeapon = addDCCWeapon;
window.addDCCSpell = addDCCSpell;
window.closeDCCModal = closeDCCModal;
window.getElementEmoji = getElementEmoji;
window.generateId = generateId;
window.enhanceModalSystem = enhanceModalSystem;
window.updateSkillSelection = updateSkillSelection;
window.confirmSkillSelection = confirmSkillSelection;
window.closeModal = closeModal;

