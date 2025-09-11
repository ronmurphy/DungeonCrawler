//<!-- Update 98 - races, max attributes, linked skills -->
//<!-- part 1 -->

// ========================================
// CORE CHARACTER DATA STRUCTURE
// ========================================
let character = {
    name: '',
    level: 1,
    availablePoints: 3,
    stats: {
        strength: 2,
        dexterity: 2,
        constitution: 2,
        intelligence: 2,
        wisdom: 2,
        charisma: 2
    },
    statMaximums: {
        strength: 15,
        dexterity: 15,
        constitution: 15,
        intelligence: 15,
        wisdom: 15,
        charisma: 15
    },
    healthPoints: 3,
    currentHealthPoints: 3,
    magicPoints: 4,
    currentMagicPoints: 4,
    customSkills: [],
    personal: {
        age: '',
        backstory: '',
        portrait: null
    },
    race: '',
    customRace: '',
    raceBonuses: [],
    customRaceData: {
        selectedStats: [],
        skills: [],
        maximums: {}
    },
    job: '',
    customJob: '',
    class: '',
    customClass: '',
    jobBonuses: [],
    classBonuses: [],
    customJobData: {
        selectedStats: [],
        skills: []
    },
    customClassData: {
        selectedStats: [],
        skills: []
    },
    rollHistory: [],
    spells: [],
    inventory: [],
    equipment: {
        mainHand: null,
        offHand: null,
        armor: null,
        accessory: null
    },
    statusEffects: [],
    notes: {
        personal: '',
        party: '',
        session: '',
        barter: '',
        world: '',
        combat: ''
    }
};

// ========================================
// GAME DATA DEFINITIONS
// ========================================

// Achievements data will be loaded by achievements.js
// (loadAchievements function is also provided by achievements.js)

const standardSkills = {
    'Acrobatics': 'dexterity',
    'Animal Handling': 'wisdom',
    'Arcana': 'intelligence',
    'Athletics': 'strength',
    'Deception': 'charisma',
    'History': 'intelligence',
    'Insight': 'wisdom',
    'Intimidation': 'charisma',
    'Investigation': 'intelligence',
    'Medicine': 'wisdom',
    'Nature': 'intelligence',
    'Perception': 'wisdom',
    'Performance': 'charisma',
    'Persuasion': 'charisma',
    'Religion': 'intelligence',
    'Sleight of Hand': 'dexterity',
    'Stealth': 'dexterity',
    'Survival': 'wisdom',
    
    // DCC-Specific Skills
    'Powerful Strike': 'strength',
    'Iron Punch': 'strength',
    'Pugilism': 'strength',
    'Aiming': 'dexterity',
    'Cat-like Reflexes': 'dexterity',
    'Light on Your Feet': 'dexterity',
    'Iron Stomach': 'constitution',
    'Regeneration': 'constitution',
    'Nine Lives': 'constitution',
    'Night Vision': 'wisdom',
    'Character Actor': 'charisma',
    'Negotiation': 'charisma',
    'Crowd Blast': 'charisma',
    'Basic Electrical Repair': 'intelligence',
    'IED': 'intelligence',
    'Bomb Surgeon': 'intelligence',
    'Alien Technology': 'intelligence',
    'Diplomatic Immunity': 'charisma',
    'Flight': 'dexterity',
    'Scavenging': 'wisdom',
    'Shape Shifting': 'constitution',
    'Enhanced Senses': 'wisdom'
};

const weaponSizes = {
    light: { dice: 4, name: 'Light' },
    medium: { dice: 6, name: 'Medium' },
    heavy: { dice: 8, name: 'Heavy' }
};

const races = {
    // DCC-Specific Races
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
        }
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
        }
    },
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
        }
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
        }
    },
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
        }
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
        }
    },
    
    // Fantasy Races
    human: {
        name: 'Human',
        statBonuses: { charisma: 1 },
        skills: [{ name: 'Adaptability', stat: 'charisma' }],
        maximums: { strength: 15, dexterity: 15, constitution: 15, intelligence: 15, wisdom: 15, charisma: 15 }
    },
    elf: {
        name: 'Elf',
        statBonuses: { dexterity: 2 },
        skills: [{ name: 'Keen Senses', stat: 'wisdom' }],
        maximums: { strength: 12, dexterity: 18, constitution: 12, intelligence: 16, wisdom: 16, charisma: 15 }
    },
    dwarf: {
        name: 'Dwarf',
        statBonuses: { constitution: 2 },
        skills: [{ name: 'Stoneworking', stat: 'intelligence' }],
        maximums: { strength: 16, dexterity: 12, constitution: 18, intelligence: 14, wisdom: 15, charisma: 12 }
    },
    orc: {
        name: 'Orc',
        statBonuses: { strength: 2 },
        skills: [{ name: 'Intimidating Presence', stat: 'strength' }],
        maximums: { strength: 18, dexterity: 14, constitution: 16, intelligence: 12, wisdom: 12, charisma: 12 }
    },
    halfling: {
        name: 'Halfling',
        statBonuses: { dexterity: 1, charisma: 1 },
        skills: [{ name: 'Lucky', stat: 'charisma' }],
        maximums: { strength: 10, dexterity: 17, constitution: 14, intelligence: 15, wisdom: 15, charisma: 16 }
    },
    dragonborn: {
        name: 'Dragonborn',
        statBonuses: { strength: 1, charisma: 1 },
        skills: [{ name: 'Dragon Breath', stat: 'constitution' }],
        maximums: { strength: 17, dexterity: 14, constitution: 16, intelligence: 14, wisdom: 14, charisma: 17 }
    },
    tiefling: {
        name: 'Tiefling',
        statBonuses: { intelligence: 1, charisma: 1 },
        skills: [{ name: 'Infernal Heritage', stat: 'charisma' }],
        maximums: { strength: 14, dexterity: 15, constitution: 14, intelligence: 17, wisdom: 14, charisma: 18 }
    },
    gnome: {
        name: 'Gnome',
        statBonuses: { intelligence: 2 },
        skills: [{ name: 'Tinkering', stat: 'intelligence' }],
        maximums: { strength: 10, dexterity: 15, constitution: 14, intelligence: 18, wisdom: 15, charisma: 15 }
    },
    goblin: {
        name: 'Goblin',
        statBonuses: { dexterity: 2 },
        skills: [{ name: 'Nimble Escape', stat: 'dexterity' }],
        maximums: { strength: 12, dexterity: 18, constitution: 13, intelligence: 14, wisdom: 13, charisma: 14 }
    },
    slime: {
        name: 'Slime',
        statBonuses: { constitution: 2 },
        skills: [{ name: 'Amorphous Body', stat: 'constitution' }],
        maximums: { strength: 5, dexterity: 20, constitution: 16, intelligence: 10, wisdom: 10, charisma: 10 }
    },

    // Modern/Future Races
    cyborg: {
        name: 'Cyborg',
        statBonuses: { strength: 1, intelligence: 1 },
        skills: [{ name: 'System Interface', stat: 'intelligence' }],
        maximums: { strength: 17, dexterity: 14, constitution: 14, intelligence: 18, wisdom: 13, charisma: 13 }
    },
    mutant: {
        name: 'Mutant',
        statBonuses: { constitution: 1, wisdom: 1 },
        skills: [{ name: 'Radiation Resistance', stat: 'constitution' }],
        maximums: { strength: 16, dexterity: 16, constitution: 17, intelligence: 15, wisdom: 16, charisma: 14 }
    },
    android: {
        name: 'Android',
        statBonuses: { intelligence: 2 },
        skills: [{ name: 'Perfect Memory', stat: 'intelligence' }],
        maximums: { strength: 14, dexterity: 15, constitution: 13, intelligence: 20, wisdom: 12, charisma: 12 }
    },
    clone: {
        name: 'Clone',
        statBonuses: { constitution: 1, charisma: 1 },
        skills: [{ name: 'Genetic Resilience', stat: 'constitution' }],
        maximums: { strength: 15, dexterity: 15, constitution: 16, intelligence: 15, wisdom: 14, charisma: 16 }
    },

    // Apocalypse Races
    ghoul: {
        name: 'Ghoul',
        statBonuses: { constitution: 1, strength: 1 },
        skills: [{ name: 'Rad Absorption', stat: 'constitution' }],
        maximums: { strength: 16, dexterity: 13, constitution: 18, intelligence: 12, wisdom: 11, charisma: 8 }
    },
    raider: {
        name: 'Raider',
        statBonuses: { strength: 1, dexterity: 1 },
        skills: [{ name: 'Scrap Fighting', stat: 'strength' }],
        maximums: { strength: 17, dexterity: 16, constitution: 15, intelligence: 13, wisdom: 13, charisma: 14 }
    },
    vault_dweller: {
        name: 'Vault Dweller',
        statBonuses: { intelligence: 1, charisma: 1 },
        skills: [{ name: 'Pre-War Knowledge', stat: 'intelligence' }],
        maximums: { strength: 14, dexterity: 14, constitution: 14, intelligence: 17, wisdom: 15, charisma: 17 }
    },
    synth: {
        name: 'Synth',
        statBonuses: { dexterity: 1, intelligence: 1 },
        skills: [{ name: 'Synthetic Reflexes', stat: 'dexterity' }],
        maximums: { strength: 15, dexterity: 17, constitution: 14, intelligence: 17, wisdom: 14, charisma: 15 }
    },
    beast_kin: {
        name: 'Beast-kin',
        statBonuses: { wisdom: 1, dexterity: 1 },
        skills: [{ name: 'Animal Instincts', stat: 'wisdom' }],
        maximums: { strength: 15, dexterity: 17, constitution: 15, intelligence: 13, wisdom: 17, charisma: 14 }
    },
    plant_hybrid: {
        name: 'Plant Hybrid',
        statBonuses: { constitution: 1, wisdom: 1 },
        skills: [{ name: 'Photosynthesis', stat: 'constitution' }],
        maximums: { strength: 13, dexterity: 12, constitution: 18, intelligence: 14, wisdom: 17, charisma: 13 }
    }
};

const jobs = {
    engineer: { name: 'Engineer', statBonuses: { intelligence: 1 }, skills: [{ name: 'Mechanical', stat: 'intelligence' }, { name: 'Electrical', stat: 'intelligence' }] },
    doctor: { name: 'Doctor', statBonuses: { intelligence: 1, wisdom: 1 }, skills: [{ name: 'Surgery', stat: 'dexterity' }, { name: 'Diagnosis', stat: 'intelligence' }] },
    lawyer: { name: 'Lawyer', statBonuses: { intelligence: 1, charisma: 1 }, skills: [{ name: 'Legal Knowledge', stat: 'intelligence' }, { name: 'Negotiation', stat: 'charisma' }] },
    teacher: { name: 'Teacher', statBonuses: { wisdom: 1, charisma: 1 }, skills: [{ name: 'Teaching', stat: 'charisma' }, { name: 'Research', stat: 'intelligence' }] },
    mechanic: { name: 'Mechanic', statBonuses: { dexterity: 1, intelligence: 1 }, skills: [{ name: 'Repair', stat: 'dexterity' }, { name: 'Automotive', stat: 'intelligence' }] },
    police: { name: 'Police Officer', statBonuses: { constitution: 1, wisdom: 1 }, skills: [{ name: 'Law Enforcement', stat: 'wisdom' }, { name: 'Criminal Justice', stat: 'intelligence' }] },
    firefighter: { name: 'Firefighter', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Emergency Response', stat: 'wisdom' }, { name: 'Physical Rescue', stat: 'strength' }] },
    chef: { name: 'Chef', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Cooking', stat: 'dexterity' }, { name: 'Food Knowledge', stat: 'intelligence' }] },
    artist: { name: 'Artist', statBonuses: { dexterity: 1, charisma: 1 }, skills: [{ name: 'Visual Arts', stat: 'dexterity' }, { name: 'Art History', stat: 'intelligence' }] },
    programmer: { name: 'Programmer', statBonuses: { intelligence: 2 }, skills: [{ name: 'Programming', stat: 'intelligence' }, { name: 'Systems Analysis', stat: 'intelligence' }] },
    soldier: { name: 'Soldier', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Military Tactics', stat: 'intelligence' }, { name: 'Combat Training', stat: 'strength' }] },
    athlete: { name: 'Athlete', statBonuses: { strength: 1, dexterity: 1 }, skills: [{ name: 'Sports', stat: 'dexterity' }, { name: 'Physical Training', stat: 'constitution' }] },
    scientist: { name: 'Scientist', statBonuses: { intelligence: 2 }, skills: [{ name: 'Research', stat: 'intelligence' }, { name: 'Scientific Method', stat: 'wisdom' }] },
    musician: { name: 'Musician', statBonuses: { dexterity: 1, charisma: 1 }, skills: [{ name: 'Musical Performance', stat: 'charisma' }, { name: 'Music Theory', stat: 'intelligence' }] },
    writer: { name: 'Writer', statBonuses: { intelligence: 1, charisma: 1 }, skills: [{ name: 'Writing', stat: 'intelligence' }, { name: 'Research', stat: 'intelligence' }] }
};

const classes = {
    // DCC-Specific Classes
    compensated_anarchist: {
        name: 'Compensated Anarchist',
        statBonuses: { strength: 1, charisma: 1, constitution: 1 },
        skills: [
            { name: 'Riot Control', stat: 'strength' },
            { name: 'Crowd Manipulation', stat: 'charisma' },
            { name: 'Urban Warfare', stat: 'intelligence' }
        ]
    },
    bomb_squad_tech: {
        name: 'Bomb Squad Tech',
        statBonuses: { intelligence: 2, dexterity: 1 },
        skills: [
            { name: 'IED', stat: 'intelligence' },
            { name: 'Bomb Surgeon', stat: 'intelligence' },
            { name: 'Incendiary Device Handling', stat: 'intelligence' }
        ]
    },
    prizefighter: {
        name: 'Prizefighter',
        statBonuses: { strength: 2, constitution: 1 },
        skills: [
            { name: 'Pugilism', stat: 'strength' },
            { name: 'Iron Punch', stat: 'strength' },
            { name: 'Powerful Strike', stat: 'strength' }
        ]
    },
    artist_alley_mogul: {
        name: 'Artist Alley Mogul',
        statBonuses: { charisma: 2, intelligence: 1 },
        skills: [
            { name: 'Character Actor', stat: 'charisma' },
            { name: 'Mascot', stat: 'charisma' },
            { name: 'Performance', stat: 'charisma' }
        ]
    },
    former_child_actor: {
        name: 'Former Child Actor',
        statBonuses: { charisma: 1, dexterity: 1, intelligence: 1 },
        skills: [
            { name: 'Character Actor', stat: 'charisma' },
            { name: 'Performance', stat: 'charisma' },
            { name: 'Stealth', stat: 'dexterity' }
        ]
    },
    roller_derby_jammer: {
        name: 'Roller Derby Jammer',
        statBonuses: { dexterity: 2, constitution: 1 },
        skills: [
            { name: 'Light on Your Feet', stat: 'dexterity' },
            { name: 'Crowd Navigation', stat: 'dexterity' },
            { name: 'Momentum Control', stat: 'dexterity' }
        ]
    },
    football_hooligan: {
        name: 'Football Hooligan',
        statBonuses: { strength: 1, constitution: 1, charisma: 1 },
        skills: [
            { name: 'Crowd Fighting', stat: 'strength' },
            { name: 'Intimidation', stat: 'charisma' },
            { name: 'Team Coordination', stat: 'charisma' }
        ]
    },
    kabaddi_raider: {
        name: 'Kabaddi Raider',
        statBonuses: { dexterity: 1, constitution: 1, strength: 1 },
        skills: [
            { name: 'Grappling', stat: 'strength' },
            { name: 'Breath Control', stat: 'constitution' },
            { name: 'Team Tactics', stat: 'intelligence' }
        ]
    },
    monster_truck_driver: {
        name: 'Monster Truck Driver',
        statBonuses: { strength: 2, constitution: 2 },
        skills: [
            { name: 'Vehicle Operation', stat: 'dexterity' },
            { name: 'Ramming', stat: 'strength' },
            { name: 'Mechanical Repair', stat: 'intelligence' }
        ]
    },
    vape_shop_counter_jockey: {
        name: 'Vape Shop Counter Jockey',
        statBonuses: { charisma: 1, dexterity: 1 },
        skills: [
            { name: 'Customer Service', stat: 'charisma' },
            { name: 'Product Knowledge', stat: 'intelligence' },
            { name: 'Hipster Culture', stat: 'charisma' }
        ]
    },
    freelance_psychiatrist: {
        name: 'Freelance Psychiatrist',
        statBonuses: { intelligence: 2, wisdom: 1 },
        skills: [
            { name: 'Mind Reading', stat: 'wisdom' },
            { name: 'Psychological Manipulation', stat: 'charisma' },
            { name: 'Therapy', stat: 'wisdom' }
        ]
    },
    banana_farmer: {
        name: 'Banana Farmer',
        statBonuses: { wisdom: 1, constitution: 1, dexterity: 1 },
        skills: [
            { name: 'Plant Growth', stat: 'wisdom' },
            { name: 'Seed Shooting', stat: 'dexterity' },
            { name: 'Agricultural Knowledge', stat: 'intelligence' }
        ]
    },
    necrobard: {
        name: 'NecroBard',
        statBonuses: { charisma: 1, intelligence: 1, wisdom: 1 },
        skills: [
            { name: 'Death Magic', stat: 'intelligence' },
            { name: 'Performance', stat: 'charisma' },
            { name: 'Undead Control', stat: 'wisdom' }
        ]
    },
    feral_cat_berserker: {
        name: 'Feral Cat Berserker',
        statBonuses: { dexterity: 2, constitution: 1 },
        skills: [
            { name: 'Cat-like Reflexes', stat: 'dexterity' },
            { name: 'Feral Rage', stat: 'strength' },
            { name: 'Nine Lives', stat: 'constitution' }
        ]
    },
    animal_test_subject: {
        name: 'Animal Test Subject',
        statBonuses: { constitution: 2, intelligence: 1 },
        skills: [
            { name: 'Poison Resistance', stat: 'constitution' },
            { name: 'Chemical Knowledge', stat: 'intelligence' },
            { name: 'Mutation', stat: 'constitution' }
        ]
    },
    glass_cannon: {
        name: 'Glass Cannon',
        statBonuses: { constitution: 1, intelligence: 2 },
        skills: [
            { name: 'Spell Acceleration', stat: 'intelligence' },
            { name: 'Magic Efficiency', stat: 'intelligence' },
            { name: 'Power Channeling', stat: 'constitution' }
        ]
    },
    legendary_diva: {
        name: 'Legendary Diva',
        statBonuses: { charisma: 3 },
        skills: [
            { name: 'Stage Presence', stat: 'charisma' },
            { name: 'Crowd Control', stat: 'charisma' },
            { name: 'Performance Magic', stat: 'charisma' }
        ]
    },
    viper_queen: {
        name: 'Viper Queen',
        statBonuses: { dexterity: 1, constitution: 1, charisma: 1 },
        skills: [
            { name: 'Spit Poison', stat: 'constitution' },
            { name: 'Serpentine Movement', stat: 'dexterity' },
            { name: 'Venomous Bite', stat: 'constitution' }
        ]
    },
    
    // Traditional Classes
    fighter: { name: 'Fighter', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Weapon Mastery', stat: 'strength' }, { name: 'Combat Tactics', stat: 'intelligence' }] },
    wizard: { name: 'Wizard', statBonuses: { intelligence: 2 }, skills: [{ name: 'Spellcasting', stat: 'intelligence' }, { name: 'Arcane Lore', stat: 'intelligence' }] },
    rogue: { name: 'Rogue', statBonuses: { dexterity: 2 }, skills: [{ name: 'Sneak Attack', stat: 'dexterity' }, { name: 'Lockpicking', stat: 'dexterity' }] },
    cleric: { name: 'Cleric', statBonuses: { wisdom: 1, charisma: 1 }, skills: [{ name: 'Divine Magic', stat: 'wisdom' }, { name: 'Healing', stat: 'wisdom' }] },
    ranger: { name: 'Ranger', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Tracking', stat: 'wisdom' }, { name: 'Wilderness Survival', stat: 'wisdom' }] },
    barbarian: { name: 'Barbarian', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Rage', stat: 'strength' }, { name: 'Primal Instincts', stat: 'wisdom' }] },
    bard: { name: 'Bard', statBonuses: { charisma: 1, dexterity: 1 }, skills: [{ name: 'Bardic Magic', stat: 'charisma' }, { name: 'Inspiration', stat: 'charisma' }] },
    paladin: { name: 'Paladin', statBonuses: { strength: 1, charisma: 1 }, skills: [{ name: 'Divine Combat', stat: 'strength' }, { name: 'Lay on Hands', stat: 'charisma' }] },
    warlock: { name: 'Warlock', statBonuses: { charisma: 1, constitution: 1 }, skills: [{ name: 'Eldritch Magic', stat: 'charisma' }, { name: 'Pact Knowledge', stat: 'intelligence' }] },
    sorcerer: { name: 'Sorcerer', statBonuses: { charisma: 2 }, skills: [{ name: 'Innate Magic', stat: 'charisma' }, { name: 'Metamagic', stat: 'charisma' }] },
    monk: { name: 'Monk', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Martial Arts', stat: 'dexterity' }, { name: 'Ki Control', stat: 'wisdom' }] },
    druid: { name: 'Druid', statBonuses: { wisdom: 2 }, skills: [{ name: 'Nature Magic', stat: 'wisdom' }, { name: 'Animal Handling', stat: 'wisdom' }] },
    gunslinger: { name: 'Gunslinger', statBonuses: { dexterity: 1, constitution: 1 }, skills: [{ name: 'Firearms', stat: 'dexterity' }, { name: 'Quick Draw', stat: 'dexterity' }] },
    hacker: { name: 'Data Runner', statBonuses: { intelligence: 2 }, skills: [{ name: 'Computer Systems', stat: 'intelligence' }, { name: 'Digital Infiltration', stat: 'dexterity' }] },
    medic: { name: 'Field Medic', statBonuses: { wisdom: 1, intelligence: 1 }, skills: [{ name: 'Field Medicine', stat: 'wisdom' }, { name: 'Trauma Care', stat: 'dexterity' }] },
    engineer_class: { name: 'Engineer', statBonuses: { intelligence: 1, dexterity: 1 }, skills: [{ name: 'Engineering', stat: 'intelligence' }, { name: 'Technical Repair', stat: 'dexterity' }] },
    pilot: { name: 'Vehicle Pilot', statBonuses: { dexterity: 1, intelligence: 1 }, skills: [{ name: 'Piloting', stat: 'dexterity' }, { name: 'Navigation', stat: 'intelligence' }] },
    survivalist: { name: 'Survivalist', statBonuses: { constitution: 1, wisdom: 1 }, skills: [{ name: 'Wilderness Survival', stat: 'wisdom' }, { name: 'Foraging', stat: 'wisdom' }] }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFullStatName(shortName) {
    const statMap = {
        'str': 'strength', 'dex': 'dexterity', 'con': 'constitution',
        'int': 'intelligence', 'wis': 'wisdom', 'cha': 'charisma'
    };
    return statMap[shortName] || shortName;
}

function getElementEmoji(element) {
    const emojis = {
        fire: '🔥', ice: '❄️', lightning: '⚡', earth: '🌍',
        air: '💨', water: '💧', light: '☀️', dark: '🌑',
        arcane: '🔮', divine: '✨', nature: '🌿', psychic: '🧠',
        shadow: '👤', force: '💥'
    };
    return emojis[element] || '✨';
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(type, title, result, details) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    notification.innerHTML = `
                <h4><i class="ra ra-${type === 'roll' ? 'perspective-dice-six' : type === 'weapon' ? 'sword' : type === 'spell' ? 'lightning' : type === 'rest' ? 'heart-plus' : type === 'status' ? 'lightning-bolt' : type === 'save' ? 'save' : type === 'level' ? 'trophy' : type === 'notes' ? 'scroll' : 'sword'}"></i> ${title}</h4>
                <div class="result">${result}</div>
                <div class="details">${details}</div>
            `;

    container.appendChild(notification);

    // Force reflow to ensure animation plays
    notification.offsetHeight;

    setTimeout(() => notification.classList.add('show'), 10);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ========================================
// TAB SYSTEM
// ========================================
function switchTab(tabName) {
    // Update both tab-btn and sidebar-tab classes
    document.querySelectorAll('.tab-btn, .sidebar-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Close sidebar after navigation on mobile
    closeSidebar();

    // Update content based on active tab
    if (tabName === 'character') {
        updateCharacterDisplay();
    } else if (tabName === 'rolling') {
        updateDiceSystemInfo();
        updateRollHistoryDisplay();
    } else if (tabName === 'combat') {
        updateDiceSystemInfo();
        updateRollHistoryDisplay();
    } else if (tabName === 'magic') {
        updateMagicTabDisplay();
        renderSpells();
        calculateSpellCost();
    } else if (tabName === 'inventory') {
        renderInventory();
        renderEquipment();
    } else if (tabName === 'status') {
        renderStatusEffects();
    } else if (tabName === 'notes') {
        loadNotesFromCharacter();
    } else if (tabName === 'reference') {
        loadGameReference();
    }
}

// ========================================
// SIDEBAR DRAWER SYSTEM
// ========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        
        // Toggle body scroll lock
        document.body.classList.toggle('sidebar-open');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    }
}

function switchCharSubTab(subTabName) {
    document.querySelectorAll('.char-sub-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.char-sub-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-sub-tab="${subTabName}"]`).classList.add('active');
    document.getElementById(`${subTabName}-content`).classList.add('active');

    if (subTabName === 'spells') {
        renderCharacterSpells();
    } else if (subTabName === 'weapons') {
        renderCharacterWeapons();
    }
}

// ========================================
// NOTES SYSTEM
// ========================================
function loadNotesFromCharacter() {
    // Ensure character has required inventory properties
    if (!character.gold) character.gold = 0;
    if (!character.inventory) character.inventory = [];
    
    const noteFields = {
        'personal-notes': character.notes?.personal || '',
        'party-notes': character.notes?.party || '',
        'session-notes': character.notes?.session || '',
        'barter-notes': character.notes?.barter || '',
        'world-notes': character.notes?.world || '',
        'combat-notes': character.notes?.combat || ''
    };

    Object.entries(noteFields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    });
    
    // Trigger inventory manager updates when character loads
    if (window.inventoryManager) {
        window.inventoryManager.updateGoldDisplay();
        window.inventoryManager.updateTradeAreaDisplay();
        window.inventoryManager.renderInventory();
    }
    
    // Dispatch character loaded event
    document.dispatchEvent(new CustomEvent('characterLoaded'));
}


function saveNotesToCharacter() {
    // Call the silent version from character manager
    if (typeof saveNotesToCharacterSilent === 'function') {
        saveNotesToCharacterSilent();
    }
}

function autoSaveNotes() {
    // Auto-save notes when user types
    const noteFields = ['personal-notes', 'party-notes', 'session-notes', 'barter-notes', 'world-notes', 'combat-notes'];

    noteFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', debounce(() => {
                saveNotesToCharacter();
            }, 2000)); // Auto-save 2 seconds after user stops typing
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// CHARACTER STATS SYSTEM
// ========================================
// ========================================
// BONUS CALCULATION HELPERS
// ========================================
function getSelectedRaceBonuses() {
    const raceSelect = document.getElementById('race-select');
    if (!raceSelect || !raceSelect.value) return {};
    
    const selectedRace = raceSelect.value;
    
    // Check for DCC races if improvements.js is loaded
    if (typeof dccRaces !== 'undefined' && dccRaces[selectedRace]) {
        return dccRaces[selectedRace].statBonuses || {};
    }
    
    // Handle custom race bonuses
    if (selectedRace === 'custom') {
        const bonuses = {};
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const checkbox = document.getElementById(`custom-race-${stat}`);
            if (checkbox && checkbox.checked) {
                const fullStatName = getFullStatName(stat);
                bonuses[fullStatName] = 1; // Custom races give +1 to selected stats
            }
        });
        return bonuses;
    }
    
    return {};
}

function getSelectedJobBonuses() {
    const jobSelect = document.getElementById('job-select');
    if (!jobSelect || !jobSelect.value) return {};
    
    const selectedJob = jobSelect.value;
    
    // Check for DCC classes if improvements.js is loaded  
    if (typeof dccClasses !== 'undefined' && dccClasses[selectedJob]) {
        return dccClasses[selectedJob].statBonuses || {};
    }
    
    // Handle custom job bonuses
    if (selectedJob === 'custom') {
        const bonuses = {};
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const checkbox = document.getElementById(`custom-job-${stat}`);
            if (checkbox && checkbox.checked) {
                const fullStatName = getFullStatName(stat);
                bonuses[fullStatName] = 1; // Custom jobs give +1 to selected stats
            }
        });
        return bonuses;
    }
    
    return {};
}

function getSelectedClassBonuses() {
    const classSelect = document.getElementById('class-select');
    if (!classSelect || !classSelect.value) return {};
    
    const selectedClass = classSelect.value;
    
    // Check for DCC classes if improvements.js is loaded
    if (typeof dccClasses !== 'undefined' && dccClasses[selectedClass]) {
        return dccClasses[selectedClass].statBonuses || {};
    }
    
    // Handle custom class bonuses
    if (selectedClass === 'custom') {
        const bonuses = {};
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const checkbox = document.getElementById(`custom-class-${stat}`);
            if (checkbox && checkbox.checked) {
                const fullStatName = getFullStatName(stat);
                bonuses[fullStatName] = 1; // Custom classes give +1 to selected stats
            }
        });
        return bonuses;
    }
    
    return {};
}

function getFullStatName(shortName) {
    const statMap = {
        'str': 'strength',
        'dex': 'dexterity', 
        'con': 'constitution',
        'int': 'intelligence',
        'wis': 'wisdom',
        'cha': 'charisma'
    };
    return statMap[shortName] || shortName;
}

function renderStats() {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = '';

    Object.entries(character.stats).forEach(([stat, value]) => {
        const maxValue = character.statMaximums[stat] || 15;
        
        // Get bonuses from race, job, and class
        const raceBonuses = getSelectedRaceBonuses();
        const jobBonuses = getSelectedJobBonuses();
        const classBonuses = getSelectedClassBonuses();
        
        // Calculate total bonuses for this stat
        const raceBonus = raceBonuses[stat] || 0;
        const jobBonus = jobBonuses[stat] || 0;
        const classBonus = classBonuses[stat] || 0;
        
        // Check if job and class both give bonuses to same stat (double bonus = gold)
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const statCard = document.createElement('div');
        statCard.className = `stat-card ${hasDoubleBonus ? 'double-bonus' : ''}`;
        
        // Build bonus indicators HTML
        let bonusIndicators = '';
        
        // Left side: Job/Background bonuses
        if (jobBonus > 0) {
            bonusIndicators += '<span class="bonus-indicator job-bonus positive top-left"><span class="material-icons">add</span></span>';
        } else if (jobBonus < 0) {
            bonusIndicators += '<span class="bonus-indicator job-bonus negative bottom-left"><span class="material-icons">remove</span></span>';
        }
        
        // Right side: Class bonuses  
        if (classBonus > 0) {
            bonusIndicators += '<span class="bonus-indicator class-bonus positive top-right"><span class="material-icons">add</span></span>';
        } else if (classBonus < 0) {
            bonusIndicators += '<span class="bonus-indicator class-bonus negative bottom-right"><span class="material-icons">remove</span></span>';
        }
        
        statCard.innerHTML = `
            ${bonusIndicators}
            <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
            <div class="stat-value">${value}</div>
            <div class="stat-max">Max: ${maxValue}</div>
            <div class="stat-controls">
                <button class="control-btn" onclick="adjustStat('${stat}', -1)" ${value <= 1 ? 'disabled' : ''}>-</button>
                <button class="control-btn" onclick="adjustStat('${stat}', 1)" ${character.availablePoints <= 0 || value >= maxValue ? 'disabled' : ''}>+</button>
            </div>
        `;
        statsGrid.appendChild(statCard);
    });

    document.getElementById('available-points').textContent = character.availablePoints;
}

function adjustStat(stat, change) {
    const currentValue = character.stats[stat];
    const newValue = currentValue + change;
    const maxValue = character.statMaximums[stat] || 15;

    if (change > 0 && character.availablePoints > 0 && newValue <= maxValue) {
        character.stats[stat] = newValue;
        character.availablePoints--;
    } else if (change < 0 && currentValue > 1) {
        character.stats[stat] = newValue;
        character.availablePoints++;
    }

    if (stat === 'constitution' || stat === 'wisdom' || stat === 'intelligence') {
        updateHealthMagicDisplay();
    }

    renderStats();
    renderCharacterSkills();
}

function updateHealthMagicDisplay() {
    character.healthPoints = character.stats.constitution + character.level;
    character.currentHealthPoints = Math.min(character.currentHealthPoints, character.healthPoints);

    character.magicPoints = character.stats.wisdom + character.stats.intelligence;
    character.currentMagicPoints = Math.min(character.currentMagicPoints, character.magicPoints);

    document.getElementById('health-points').textContent = character.healthPoints;
    document.getElementById('magic-points').textContent = character.magicPoints;

    const magicCurrentMP = document.getElementById('magic-current-mp');
    const magicTotalMP = document.getElementById('magic-total-mp');
    if (magicCurrentMP) magicCurrentMP.textContent = character.currentMagicPoints;
    if (magicTotalMP) magicTotalMP.textContent = character.magicPoints;
}

function adjustCurrentHP(change) {
    const newValue = character.currentHealthPoints + change;
    if (newValue >= 0 && newValue <= character.healthPoints) {
        character.currentHealthPoints = newValue;
        updateCharacterDisplay();
    }
}

function adjustCurrentMP(change) {
    const newValue = character.currentMagicPoints + change;
    if (newValue >= 0 && newValue <= character.magicPoints) {
        character.currentMagicPoints = newValue;
        updateCharacterDisplay();
        updateMagicTabDisplay();
        renderSpells();
        renderCharacterSpells();
    }
}

function adjustMagicPointsInTab(change) {
    adjustCurrentMP(change);
}

function updateMagicTabDisplay() {
    document.getElementById('magic-current-mp').textContent = character.currentMagicPoints;
    document.getElementById('magic-total-mp').textContent = character.magicPoints;
}

// ========================================
// CHARACTER BACKGROUND SYSTEM
// ========================================
function resetCharacterBonuses() {
    const currentTotal = Object.values(character.stats).reduce((sum, stat) => sum + stat, 0);
    const baseTotal = 12;
    const pointsUsed = currentTotal - baseTotal;

    character.stats = {
        strength: 2, dexterity: 2, constitution: 2,
        intelligence: 2, wisdom: 2, charisma: 2
    };

    // Reset maximums to default
    character.statMaximums = {
        strength: 15, dexterity: 15, constitution: 15,
        intelligence: 15, wisdom: 15, charisma: 15
    };

    const maxPoints = character.level * 3;
    character.availablePoints = Math.min(maxPoints, pointsUsed);

    character.customSkills = character.customSkills.filter(skill =>
        !skill.source || (skill.source !== 'job' && skill.source !== 'class' && skill.source !== 'race')
    );

    character.raceBonuses = [];
    character.jobBonuses = [];
    character.classBonuses = [];
}

// ========================================
// NEW CHARACTER CREATION
// ========================================
function createNewCharacter() {
    // Apply selected skills before reset
    applySelectedSkillsToCharacter();
    
    // Reset character to default state
    character = {
        name: '',
        level: 1,
        availablePoints: 3,
        stats: {
            strength: 2,
            dexterity: 2,
            constitution: 2,
            intelligence: 2,
            wisdom: 2,
            charisma: 2
        },
        statMaximums: {
            strength: 15,
            dexterity: 15,
            constitution: 15,
            intelligence: 15,
            wisdom: 15,
            charisma: 15
        },
        healthPoints: 3,
        currentHealthPoints: 3,
        magicPoints: 4,
        currentMagicPoints: 4,
        customSkills: [],
        personal: {
            age: '',
            backstory: '',
            portrait: null
        },
        race: '',
        customRace: '',
        raceBonuses: [],
        customRaceData: {
            selectedStats: [],
            skills: [],
            maximums: {}
        },
        job: '',
        customJob: '',
        class: '',
        customClass: '',
        jobBonuses: [],
        classBonuses: [],
        customJobData: {
            selectedStats: [],
            skills: []
        },
        customClassData: {
            selectedStats: [],
            skills: []
        },
        rollHistory: [],
        spells: [],
        inventory: [],
        gold: 0,
        equipment: {
            mainHand: null,
            offHand: null,
            armor: null,
            accessory: null
        },
        statusEffects: [],
        notes: {
            personal: '',
            party: '',
            session: '',
            barter: '',
            world: '',
            combat: ''
        }
    };

    // Clear all form fields thoroughly
    resetAllFormFields();
    
    // Hide and clear all dynamic displays
    clearDynamicDisplays();
    
    // Switch to creation tab and refresh UI
    switchTab('creation');
    
    // Re-render all components with fresh data
    renderStats();
    renderCharacterSkills();
    renderCharacterSpells();
    renderCharacterWeapons();
    renderInventory();
    renderEquipment();
    updateHealthMagicDisplay();
    updateCharacterDisplay();
    updateBonusesDisplay();
    
    // Clear portrait display
    resetPortraitDisplay();
    
    // Clear header character info
    const characterInfoDisplay = document.querySelector('.character-info-display');
    if (characterInfoDisplay) {
        characterInfoDisplay.textContent = '';
    }
    
    // Reset skills selection
    selectedSkills = [];
    updateSelectedSkillsDisplay();
    updateSkillsCounter();
    renderAvailableSkills();
    
    // Force refresh of the creation tab UI
    refreshCreationTabUI();
    
    console.log('New character created - all data and displays cleared');
}

function refreshCreationTabUI() {
    // Force update all form fields to reflect the reset character data
    const charName = document.getElementById('char-name');
    if (charName) {
        charName.value = character.name || '';
        charName.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const charLevel = document.getElementById('char-level');
    if (charLevel) {
        charLevel.value = character.level || 1;
        charLevel.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const charAge = document.getElementById('char-age');
    if (charAge) {
        charAge.value = character.personal.age || '';
        charAge.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const charBackstory = document.getElementById('char-backstory');
    if (charBackstory) {
        charBackstory.value = character.personal.backstory || '';
        charBackstory.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Reset all dropdowns to first option (empty) and trigger change events
    const raceSelect = document.getElementById('race-select');
    if (raceSelect) {
        raceSelect.selectedIndex = 0;
        raceSelect.value = '';
        raceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const jobSelect = document.getElementById('job-select');
    if (jobSelect) {
        jobSelect.selectedIndex = 0;
        jobSelect.value = '';
        jobSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const classSelect = document.getElementById('class-select');
    if (classSelect) {
        classSelect.selectedIndex = 0;
        classSelect.value = '';
        classSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Hide all custom input fields
    const customFields = ['custom-race', 'custom-job', 'custom-class'];
    customFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.display = 'none';
            field.value = '';
        }
    });
    
    // Hide all custom bonus builders
    const customBuilders = ['custom-race-bonuses', 'custom-job-bonuses', 'custom-class-bonuses'];
    customBuilders.forEach(builderId => {
        const builder = document.getElementById(builderId);
        if (builder) {
            builder.style.display = 'none';
        }
    });
    
    // Force refresh of stats display in creation tab with a small delay
    setTimeout(() => {
        renderStats();
        updateBonusesDisplay();
        updateHealthMagicDisplay();
        
        // Update available points display
        const availablePointsDisplay = document.getElementById('available-points');
        if (availablePointsDisplay) {
            availablePointsDisplay.textContent = character.availablePoints;
        }
        
        // Force re-render of any character-specific displays
        if (typeof updateCharacterDisplay === 'function') {
            updateCharacterDisplay();
        }
        
        console.log('Creation tab UI fully refreshed');
    }, 100);
    
    console.log('Creation tab UI refresh initiated');
}

function resetAllFormFields() {
    // Reset character info fields
    const fields = [
        'char-name', 'char-level', 'custom-race', 'custom-job', 'custom-class',
        'race-select', 'job-select', 'class-select', 'char-age', 'char-backstory'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'select-one') {
                field.value = '';
                field.selectedIndex = 0;
            } else if (field.type === 'number') {
                field.value = fieldId === 'char-level' ? '1' : '';
            } else if (field.tagName.toLowerCase() === 'textarea') {
                field.value = '';
            } else {
                field.value = '';
            }
            
            // Trigger change events to update any dependent UI
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    // Reset custom skill dropdowns and inputs
    const customSkillFields = [
        'custom-race-skill1', 'custom-race-skill2', 
        'custom-job-skill1', 'custom-job-skill2',
        'custom-class-skill1', 'custom-class-skill2'
    ];
    
    customSkillFields.forEach(fieldId => {
        const select = document.getElementById(fieldId);
        const nameInput = document.getElementById(fieldId + '-name');
        
        if (select) {
            select.value = '';
            select.selectedIndex = 0;
        }
        if (nameInput) {
            nameInput.value = '';
            nameInput.style.display = 'none';
        }
    });
    
    // Reset portrait upload
    const portraitUpload = document.getElementById('portrait-upload');
    if (portraitUpload) portraitUpload.value = '';
}

function clearDynamicDisplays() {
    // Hide and clear Active Bonuses display
    const bonusesDisplay = document.getElementById('bonuses-display');
    if (bonusesDisplay) {
        bonusesDisplay.style.display = 'none';
        const bonusesContent = bonusesDisplay.querySelector('.bonuses-content');
        if (bonusesContent) {
            bonusesContent.innerHTML = '';
        }
    }
    
    // Hide custom bonus builders
    const customBuilders = [
        'custom-race-bonuses',
        'custom-job-bonuses', 
        'custom-class-bonuses'
    ];
    
    customBuilders.forEach(builderId => {
        const builder = document.getElementById(builderId);
        if (builder) {
            builder.style.display = 'none';
            // Clear any content inside
            const inputs = builder.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
    });
    
    // Hide custom input fields
    const customInputs = [
        'custom-race',
        'custom-job', 
        'custom-class'
    ];
    
    customInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.display = 'none';
            input.value = '';
        }
    });
    
    // Clear stats grid (will be repopulated by renderStats())
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = '';
    }
    
    // Clear any skill displays
    const skillDisplays = document.querySelectorAll('.skill-display, .skills-list, .character-skills');
    skillDisplays.forEach(display => {
        if (display) {
            display.innerHTML = '';
        }
    });
    
    // Clear any equipment displays
    const equipmentSlots = ['mainHand', 'offHand', 'armor', 'accessory'];
    equipmentSlots.forEach(slot => {
        const slotElement = document.getElementById(slot);
        if (slotElement) {
            slotElement.innerHTML = `
                <div class="equipment-placeholder">
                    <i class="ra ra-crossed-swords"></i>
                    <span>Empty</span>
                </div>
            `;
        }
    });
    
    // Clear inventory display
    const inventoryContainer = document.querySelector('.inventory-container, .inventory-list, #inventory-display');
    if (inventoryContainer) {
        inventoryContainer.innerHTML = '';
    }
    
    // Clear spell displays
    const spellContainers = document.querySelectorAll('.spells-container, .spells-list, #spells-display');
    spellContainers.forEach(container => {
        if (container) {
            container.innerHTML = '';
        }
    });
}

function resetPortraitDisplay() {
    const portraitDisplay = document.getElementById('portrait-display');
    if (portraitDisplay) {
        portraitDisplay.innerHTML = `
            <div class="portrait-placeholder">
                <i class="ra ra-hood"></i>
                <span>Tap to Upload</span>
            </div>
        `;
    }
}

function applyRaceBonuses() {
    if (character.race && races[character.race]) {
        const race = races[character.race];

        // Apply stat maximums
        Object.entries(race.maximums).forEach(([stat, max]) => {
            character.statMaximums[stat] = max;
            // If current stat exceeds new maximum, reduce it
            if (character.stats[stat] > max) {
                const excess = character.stats[stat] - max;
                character.stats[stat] = max;
                character.availablePoints += excess;
            }
        });

        // Apply stat bonuses
        Object.entries(race.statBonuses).forEach(([stat, bonus]) => {
            const newValue = character.stats[stat] + bonus;
            if (newValue <= character.statMaximums[stat]) {
                character.stats[stat] = newValue;
                character.raceBonuses.push(`+${bonus} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${race.name})`);
            }
        });

        // Apply racial skills
        race.skills.forEach(skill => {
            if (!character.customSkills.find(s => s.name === skill.name)) {
                character.customSkills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'race'
                });
                character.raceBonuses.push(`${skill.name} [${skill.stat.slice(0, 3).toUpperCase()}] skill (${race.name})`);
            }
        });
    } else if (document.getElementById('race-select')?.value === 'custom' && character.customRaceData) {
        applyCustomRaceBonuses();
    }

    renderStats();
    renderCharacterSkills();
}

function applyCustomRaceBonuses() {
    const customData = character.customRaceData;

    // Apply custom maximums
    if (customData.maximums) {
        Object.entries(customData.maximums).forEach(([stat, max]) => {
            if (max) {
                character.statMaximums[stat] = parseInt(max);
                // If current stat exceeds new maximum, reduce it
                if (character.stats[stat] > parseInt(max)) {
                    const excess = character.stats[stat] - parseInt(max);
                    character.stats[stat] = parseInt(max);
                    character.availablePoints += excess;
                }
            }
        });
    }

    // Apply stat bonuses
    applyCustomBonuses(customData, 'race', 'Custom Race');
}

function applyJobBonuses() {
    if (character.job && jobs[character.job]) {
        const job = jobs[character.job];

        Object.entries(job.statBonuses).forEach(([stat, bonus]) => {
            const newValue = character.stats[stat] + bonus;
            if (newValue <= character.statMaximums[stat]) {
                character.stats[stat] = newValue;
                character.jobBonuses.push(`+${bonus} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${job.name})`);
            }
        });

        job.skills.forEach(skill => {
            if (!character.customSkills.find(s => s.name === skill.name)) {
                character.customSkills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'job'
                });
                character.jobBonuses.push(`${skill.name} [${skill.stat.slice(0, 3).toUpperCase()}] skill (${job.name})`);
            }
        });
    } else if (document.getElementById('job-select')?.value === 'custom' && character.customJobData) {
        applyCustomBonuses(character.customJobData, 'job', 'Custom Background');
    }

    renderStats();
    renderCharacterSkills();
}

function applyClassBonuses() {
    if (character.class && classes[character.class]) {
        const charClass = classes[character.class];

        Object.entries(charClass.statBonuses).forEach(([stat, bonus]) => {
            const newValue = character.stats[stat] + bonus;
            if (newValue <= character.statMaximums[stat]) {
                character.stats[stat] = newValue;
                character.classBonuses.push(`+${bonus} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${charClass.name})`);
            }
        });

        charClass.skills.forEach(skill => {
            if (!character.customSkills.find(s => s.name === skill.name)) {
                character.customSkills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'class'
                });
                character.classBonuses.push(`${skill.name} [${skill.stat.slice(0, 3).toUpperCase()}] skill (${charClass.name})`);
            }
        });
    } else if (document.getElementById('class-select')?.value === 'custom_class' && character.customClassData) {
        applyCustomBonuses(character.customClassData, 'class', 'Custom Class');
    }

    renderStats();
    renderCharacterSkills();
}

function applyCustomBonuses(customData, type, typeName) {
    const selectedStats = customData.selectedStats || [];
    const bonusArray = type === 'race' ? character.raceBonuses :
        type === 'job' ? character.jobBonuses : character.classBonuses;

    if (selectedStats.length === 1) {
        const fullStatName = getFullStatName(selectedStats[0]);
        const newValue = character.stats[fullStatName] + 3;
        if (newValue <= character.statMaximums[fullStatName]) {
            character.stats[fullStatName] = newValue;
            bonusArray.push(`+3 ${fullStatName.charAt(0).toUpperCase() + fullStatName.slice(1)} (${typeName} - single focus)`);
        }
    } else if (selectedStats.length === 2) {
        const fullStat1 = getFullStatName(selectedStats[0]);
        const fullStat2 = getFullStatName(selectedStats[1]);

        const newValue1 = character.stats[fullStat1] + 2;
        const newValue2 = character.stats[fullStat2] + 1;

        if (newValue1 <= character.statMaximums[fullStat1]) {
            character.stats[fullStat1] = newValue1;
            bonusArray.push(`+2 ${fullStat1.charAt(0).toUpperCase() + fullStat1.slice(1)} (${typeName} - primary)`);
        }
        if (newValue2 <= character.statMaximums[fullStat2]) {
            character.stats[fullStat2] = newValue2;
            bonusArray.push(`+1 ${fullStat2.charAt(0).toUpperCase() + fullStat2.slice(1)} (${typeName} - secondary)`);
        }
    }

    customData.skills.forEach(skillData => {
        if (!character.customSkills.find(s => s.name === skillData.name)) {
            character.customSkills.push({
                name: skillData.name,
                stat: skillData.stat,
                source: type
            });
            bonusArray.push(`${skillData.name} [${skillData.stat.slice(0, 3).toUpperCase()}] skill (${typeName})`);
        }
    });
}

function updateBonusesDisplay() {
    const bonusesDisplay = document.getElementById('bonuses-display');
    const bonusesContent = document.getElementById('bonuses-content');
    const allBonuses = [...character.raceBonuses, ...character.jobBonuses, ...character.classBonuses];

    if (allBonuses.length > 0) {
        bonusesDisplay.style.display = 'block';
        const bonusesHtml = allBonuses.map(bonus =>
            `<div style="background: rgba(244, 208, 63, 0.1); padding: 8px; border-radius: 5px; border: 1px solid #f4d03f; margin-bottom: 8px; font-size: 13px;"><strong style="color: #f4d03f;">+</strong> ${bonus}</div>`
        ).join('');
        bonusesContent.innerHTML = bonusesHtml;
    } else {
        bonusesDisplay.style.display = 'none';
    }
}

// ========================================
// EVENT HANDLERS
// ========================================
function handlePortraitUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check if we should upload to GitHub for custom avatars
        if (window.avatarUrlSystem && window.githubImageHost) {
            // Ask user if they want to upload to GitHub or use local only
            const useGitHub = confirm(
                'Would you like to upload this custom avatar to GitHub?\n\n' +
                '✅ Yes: Avatar will be accessible from any device and shareable\n' +
                '❌ No: Avatar will only be stored locally in this browser'
            );
            
            if (useGitHub) {
                // Upload to GitHub and use URL
                const characterName = character.name || 'CustomCharacter';
                window.avatarUrlSystem.uploadCustomAvatar(file, characterName)
                    .then(avatarUrl => {
                        if (avatarUrl) {
                            character.personal.avatarUrl = avatarUrl;
                            character.personal.portrait = null; // Clear base64 data
                            
                            const portraitDisplay = document.getElementById('portrait-display');
                            portraitDisplay.innerHTML = `<img src="${avatarUrl}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                            
                            console.log('✅ Custom avatar uploaded to GitHub');
                        } else {
                            // Fallback to local base64
                            handlePortraitUploadLocal(file);
                        }
                    })
                    .catch(error => {
                        console.error('❌ GitHub upload failed:', error);
                        // Fallback to local base64
                        handlePortraitUploadLocal(file);
                    });
            } else {
                // Use local base64 storage
                handlePortraitUploadLocal(file);
            }
        } else {
            // Fallback to local base64 storage
            handlePortraitUploadLocal(file);
        }
    }
}

// Local base64 upload function
function handlePortraitUploadLocal(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        character.personal.portrait = e.target.result;
        character.personal.avatarUrl = null; // Clear URL if using base64
        
        const portraitDisplay = document.getElementById('portrait-display');
        portraitDisplay.innerHTML = `<img src="${e.target.result}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        
        console.log('✅ Custom avatar stored locally as base64');
    };
    reader.readAsDataURL(file);
}

function handleRaceSelection() {
    const raceSelect = document.getElementById('race-select');
    const customRaceInput = document.getElementById('custom-race');
    const customRaceBonuses = document.getElementById('custom-race-bonuses');

    resetCharacterBonuses();

    if (raceSelect.value === 'custom') {
        customRaceInput.style.display = 'block';
        customRaceBonuses.style.display = 'block';
        character.race = '';
    } else {
        customRaceInput.style.display = 'none';
        customRaceBonuses.style.display = 'none';
        character.race = raceSelect.value;
        character.customRace = '';
        customRaceInput.value = '';
        clearCustomSelections('race');
    }

    applyRaceBonuses();
    applyJobBonuses();
    applyClassBonuses();
    updateBonusesDisplay();
    updateHealthMagicDisplay();
}

function handleJobSelection() {
    const jobSelect = document.getElementById('job-select');
    const customJobInput = document.getElementById('custom-job');
    const customJobBonuses = document.getElementById('custom-job-bonuses');

    resetCharacterBonuses();

    if (jobSelect.value === 'custom') {
        customJobInput.style.display = 'block';
        customJobBonuses.style.display = 'block';
        character.job = '';
    } else {
        customJobInput.style.display = 'none';
        customJobBonuses.style.display = 'none';
        character.job = jobSelect.value;
        character.customJob = '';
        customJobInput.value = '';
        clearCustomSelections('job');
    }

    applyRaceBonuses();
    applyJobBonuses();
    applyClassBonuses();
    updateBonusesDisplay();
    updateHealthMagicDisplay();
}

function handleClassSelection() {
    const classSelect = document.getElementById('class-select');
    const customClassInput = document.getElementById('custom-class');
    const customClassBonuses = document.getElementById('custom-class-bonuses');

    resetCharacterBonuses();

    if (classSelect.value === 'custom_class') {
        customClassInput.style.display = 'block';
        customClassBonuses.style.display = 'block';
        character.class = '';
    } else {
        customClassInput.style.display = 'none';
        customClassBonuses.style.display = 'none';
        character.class = classSelect.value;
        character.customClass = '';
        customClassInput.value = '';
        clearCustomSelections('class');
    }

    applyRaceBonuses();
    applyJobBonuses();
    applyClassBonuses();
    updateBonusesDisplay();
    updateHealthMagicDisplay();
}

function clearCustomSelections(type) {
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const checkbox = document.getElementById(`custom-${type}-${stat}`);
        if (checkbox) checkbox.checked = false;
    });

    if (type === 'race') {
        // Clear custom maximums
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const input = document.getElementById(`custom-race-max-${stat}`);
            if (input) input.value = '15';
        });
    }

    [1, 2].forEach(num => {
        const skillSelect = document.getElementById(`custom-${type}-skill${num}`);
        const skillName = document.getElementById(`custom-${type}-skill${num}-name`);
        if (skillSelect) skillSelect.value = '';
        if (skillName) {
            skillName.style.display = 'none';
            skillName.value = '';
        }
    });

    if (type === 'race') {
        character.customRaceData = { selectedStats: [], skills: [], maximums: {} };
    } else {
        character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}Data`] = {
            selectedStats: [],
            skills: []
        };
    }
}

function updateCustomRaceBonuses() {
    updateCustomBonuses('race');
}

function handleHeritageSelection() {
    const raceSelect = document.getElementById('race-select');
    const selectedHeritage = raceSelect.value;
    
    // Ensure character.personal exists
    if (!character.personal) {
        character.personal = { age: '', backstory: '', portrait: null };
    }
    
    // Check if heritage is selected and not custom
    if (selectedHeritage && selectedHeritage !== 'custom') {
        // Try new URL system first, fallback to old system
        if (window.avatarUrlSystem) {
            // Use new URL-based avatar system (no base64 conversion needed)
            window.avatarUrlSystem.updateCharacterPortrait(selectedHeritage, 'portrait-display', true)
                .then(avatarResult => {
                    if (avatarResult) {
                        if (avatarResult.startsWith('http')) {
                            // URL-based avatar - store URL instead of base64
                            character.personal.avatarUrl = avatarResult;
                            character.personal.portrait = null; // Clear old base64 data
                            console.log(`✅ Updated character with avatar URL: ${selectedHeritage}`);
                        } else {
                            // Base64 fallback
                            character.personal.portrait = avatarResult;
                            character.personal.avatarUrl = null;
                            console.log(`✅ Updated character with base64 fallback: ${selectedHeritage}`);
                        }
                    } else {
                        // No avatar available
                        showDefaultPortraitPlaceholder();
                        character.personal.portrait = null;
                        character.personal.avatarUrl = null;
                    }
                })
                .catch(error => {
                    console.warn(`⚠️ Error with avatar URL system: ${error.message}`);
                    // Fallback to old system
                    handleHeritageSelectionFallback(selectedHeritage);
                });
        } else {
            // Fallback to old avatar assignment system
            handleHeritageSelectionFallback(selectedHeritage);
        }
    } else if (selectedHeritage === 'custom' || selectedHeritage === '') {
        // If custom or no heritage selected, revert to placeholder
        showDefaultPortraitPlaceholder();
        character.personal.portrait = null;
        character.personal.avatarUrl = null;
    }
    
    // Update custom race bonuses as before
    updateCustomRaceBonuses();
}

// Fallback function for old avatar assignment system
function handleHeritageSelectionFallback(selectedHeritage) {
    // Check if old avatar assignment system is available
    if (window.avatarAssignmentSystem && selectedHeritage && selectedHeritage !== 'custom') {
        // Always assign avatar when heritage changes (not just when empty)
        const avatarFilename = window.avatarAssignmentSystem.getAvatarForHeritage(selectedHeritage);
        if (avatarFilename) {
            const avatarPath = `assets/avatars/${avatarFilename}`;
            
            // Convert avatar to base64 and save to character
            loadImageAsBase64(avatarPath).then(base64Data => {
                if (base64Data) {
                    character.personal.portrait = base64Data;
                    character.personal.avatarUrl = null; // Clear URL if using base64
                    
                    // Update the portrait display
                    const portraitDisplay = document.getElementById('portrait-display');
                    if (portraitDisplay) {
                        portraitDisplay.innerHTML = `<img src="${base64Data}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                    }
                    
                    console.log(`✅ Updated avatar for ${selectedHeritage}: ${avatarFilename}`);
                }
            }).catch(error => {
                console.warn(`⚠️ Could not load avatar ${avatarPath}:`, error);
                // Show default placeholder for missing avatars
                showDefaultPortraitPlaceholder();
            });
        } else {
            // No avatar mapping found, show default placeholder
            console.log(`ℹ️ No avatar available for ${selectedHeritage}, showing default placeholder`);
            showDefaultPortraitPlaceholder();
        }
    } else {
        // No system available, show placeholder
        showDefaultPortraitPlaceholder();
    }
}

// Helper function to show default portrait placeholder
function showDefaultPortraitPlaceholder() {
    const portraitDisplay = document.getElementById('portrait-display');
    if (portraitDisplay) {
        // Clear any existing portrait data
        character.personal.portrait = null;
        
        // Show the default placeholder
        portraitDisplay.innerHTML = `
            <div class="portrait-placeholder">
                <i class="ra ra-hood"></i>
                <span>Tap to Upload</span>
            </div>
        `;
    }
}

// Helper function to load image and convert to base64
function loadImageAsBase64(imagePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS if needed
        
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                const base64Data = canvas.toDataURL('image/png');
                resolve(base64Data);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error(`Failed to load image: ${imagePath}`));
        };
        
        img.src = imagePath;
    });
}

function updateCustomJobBonuses() {
    updateCustomBonuses('job');
}

function updateCustomClassBonuses() {
    updateCustomBonuses('class');
}

function updateCustomBonuses(type) {
    const selectValue = document.getElementById(`${type}-select`).value;
    if ((type === 'race' && selectValue !== 'custom') ||
        (type === 'job' && selectValue !== 'custom') ||
        (type === 'class' && selectValue !== 'custom_class')) return;

    const selectedStats = [];
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        if (document.getElementById(`custom-${type}-${stat}`).checked) {
            selectedStats.push(stat);
        }
    });

    if (selectedStats.length > 2) {
        const lastStat = selectedStats.pop();
        document.getElementById(`custom-${type}-${lastStat}`).checked = false;
    }

    const customData = {
        selectedStats: selectedStats,
        skills: []
    };

    // Handle custom maximums for race
    if (type === 'race') {
        customData.maximums = {};
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(stat => {
            const shortStat = stat.substring(0, 3);
            const maxInput = document.getElementById(`custom-race-max-${shortStat}`);
            if (maxInput) {
                customData.maximums[stat] = parseInt(maxInput.value) || 15;
            }
        });
    }

    [1, 2].forEach(num => {
        const skillSelect = document.getElementById(`custom-${type}-skill${num}`);
        const skillStatSelect = document.getElementById(`custom-${type}-skill${num}-stat`);
        const skillNameInput = document.getElementById(`custom-${type}-skill${num}-name`);

        if (skillSelect?.value && skillSelect.value !== '') {
            let skillName = skillSelect.value;
            let skillStat = skillStatSelect.value;

            if (skillSelect.value === 'custom' && skillNameInput.value.trim()) {
                skillName = skillNameInput.value.trim();
            }

            if (skillName && skillName !== 'custom') {
                customData.skills.push({
                    name: skillName,
                    stat: skillStat
                });
            }
        }
    });

    character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}Data`] = customData;

    resetCharacterBonuses();
    applyRaceBonuses();
    applyJobBonuses();
    applyClassBonuses();
    updateBonusesDisplay();
    updateHealthMagicDisplay();
}

function updateCustomRace() {
    character.customRace = document.getElementById('custom-race').value;
    updateBonusesDisplay();
}

function updateCustomJob() {
    character.customJob = document.getElementById('custom-job').value;
    updateBonusesDisplay();
}

function updateCustomClass() {
    character.customClass = document.getElementById('custom-class').value;
    updateBonusesDisplay();
}

function updateCharacterLevel() {
    const newLevel = parseInt(document.getElementById('char-level').value);
    const levelDiff = newLevel - character.level;

    character.availablePoints += levelDiff * 3;

    if (character.availablePoints < 0) {
        character.availablePoints = 0;
    }

    character.level = newLevel;
    updateHealthMagicDisplay();
    renderStats();

    const rollLevelDisplay = document.getElementById('roll-level-display');
    if (rollLevelDisplay) rollLevelDisplay.textContent = character.level;
}

function updateCharacterName() {
    character.name = document.getElementById('char-name').value;
    updateCharacterDisplay();
}

// ========================================
// CHARACTER DISPLAY
// ========================================
function updateCharacterDisplay() {
    // Update character display
    const nameDisplay = document.getElementById('char-display-name');
    if (character.name) {
        nameDisplay.textContent = character.name;
    } else {
        nameDisplay.textContent = 'Character Overview';
    }

    // Update level display
    const levelDisplay = document.getElementById('char-level-display');
    if (levelDisplay) {
        levelDisplay.textContent = `Level ${character.level}`;
    }

    // Update level up button visibility
    const levelUpBtn = document.getElementById('level-up-btn');
    if (levelUpBtn) {
        const shouldShow = character.level < 20;
        levelUpBtn.style.display = shouldShow ? 'flex' : 'none';
        console.log(`Level up button: level=${character.level}, shouldShow=${shouldShow}, display=${levelUpBtn.style.display}`);
    } else {
        console.log('Level up button element not found!');
    }

    // Add portrait to overview - support both URL and base64 avatars
    const overviewPortrait = document.getElementById('overview-portrait');
    if (overviewPortrait) {
        if (character.personal?.avatarUrl) {
            // URL-based avatar (new system)
            overviewPortrait.innerHTML = `<img src="${character.personal.avatarUrl}" alt="Character Portrait">`;
        } else if (character.personal?.portrait) {
            // Base64 avatar (legacy system)
            overviewPortrait.innerHTML = `<img src="${character.personal.portrait}" alt="Character Portrait">`;
        } else {
            // No avatar, show placeholder
            overviewPortrait.innerHTML = `
                <div class="portrait-placeholder">
                    <i class="ra ra-hood"></i>
                </div>
            `;
        }
    }

    // Update character summary display (Heritage/Background/Class in footer)
    const charSummary = document.getElementById('char-summary');
    const raceName = character.race ? races[character.race]?.name || character.race : character.customRace || 'Unknown';
    const jobName = character.job ? jobs[character.job]?.name || character.job : character.customJob || 'Unknown';
    const className = character.class ? classes[character.class]?.name || character.class : character.customClass || 'Unknown';
    const totalDefense = calculateTotalDefense();

    charSummary.innerHTML = `
    <span><strong>Heritage:</strong> ${raceName}</span>
    <span><strong>Background:</strong> ${jobName}</span>
    <span><strong>Class:</strong> ${className}</span>
    <span class="armor-stat"><i class="ra ra-shield"></i> <strong>Armor:</strong> ${totalDefense}</span>
`;

    document.getElementById('char-current-hp').textContent = character.currentHealthPoints;
    document.getElementById('char-total-hp').textContent = character.healthPoints;
    document.getElementById('char-current-mp').textContent = character.currentMagicPoints;
    document.getElementById('char-total-mp').textContent = character.magicPoints;

    // const totalDefense = calculateTotalDefense();
    // const defenseDisplay = document.getElementById('total-defense-display');
    // if (defenseDisplay) {
    //     defenseDisplay.textContent = totalDefense;
    // }

    renderCharacterStats();
}

function renderCharacterStats() {
    const charStatsDisplay = document.getElementById('char-stats-display');
    charStatsDisplay.innerHTML = '';

    // Get bonuses from race, job, and class
    const raceBonuses = getSelectedRaceBonuses();
    const jobBonuses = getSelectedJobBonuses();
    const classBonuses = getSelectedClassBonuses();

    Object.entries(character.stats).forEach(([stat, value]) => {
        // Calculate bonuses for this stat
        const raceBonus = raceBonuses[stat] || 0;
        const jobBonus = jobBonuses[stat] || 0;
        const classBonus = classBonuses[stat] || 0;
        
        // Check if job and class both give bonuses to same stat (double bonus = gold)
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const statCard = document.createElement('div');
        statCard.onclick = () => rollAttribute(stat, value);
        statCard.style.cssText = `
            background: ${hasDoubleBonus ? 'rgba(255, 215, 0, 0.15)' : 'rgba(40, 40, 60, 0.9)'};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            border: 1px solid ${hasDoubleBonus ? '#ffd700' : '#4a4a6a'};
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: visible;
            ${hasDoubleBonus ? 'box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);' : ''}
        `;
        
        // Build bonus indicators HTML
        let bonusIndicators = '';
        
        // Left side: Job/Background bonuses
        if (jobBonus > 0) {
            bonusIndicators += '<span style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; background: #4a8a4a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 10;">+</span>';
        } else if (jobBonus < 0) {
            bonusIndicators += '<span style="position: absolute; bottom: 4px; left: 4px; width: 14px; height: 14px; background: #8a4a4a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 10;">-</span>';
        }
        
        // Right side: Class bonuses  
        if (classBonus > 0) {
            bonusIndicators += '<span style="position: absolute; top: 4px; right: 4px; width: 14px; height: 14px; background: #4a6a8a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 10;">+</span>';
        } else if (classBonus < 0) {
            bonusIndicators += '<span style="position: absolute; bottom: 4px; right: 4px; width: 14px; height: 14px; background: #8a4a6a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 10;">-</span>';
        }
        
        statCard.onmouseenter = () => {
            statCard.style.borderColor = hasDoubleBonus ? '#ffd700' : '#f4d03f';
            statCard.style.background = hasDoubleBonus ? 'rgba(255, 215, 0, 0.25)' : 'rgba(244, 208, 63, 0.1)';
            statCard.style.transform = 'translateY(-1px)';
            if (hasDoubleBonus) {
                statCard.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
            }
        };
        statCard.onmouseleave = () => {
            statCard.style.borderColor = hasDoubleBonus ? '#ffd700' : '#4a4a6a';
            statCard.style.background = hasDoubleBonus ? 'rgba(255, 215, 0, 0.15)' : 'rgba(40, 40, 60, 0.9)';
            statCard.style.transform = 'translateY(0)';
            if (hasDoubleBonus) {
                statCard.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            } else {
                statCard.style.boxShadow = 'none';
            }
        };
        statCard.innerHTML = `
            ${bonusIndicators}
            <div style="font-weight: 600; color: ${hasDoubleBonus ? '#ffd700' : '#f4d03f'}; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
            <div style="font-size: 20px; font-weight: bold; color: #ffffff;">${value}</div>
        `;
        charStatsDisplay.appendChild(statCard);
    });

    // Render bonus sources information
    renderBonusSources(raceBonuses, jobBonuses, classBonuses);
}

function renderBonusSources(raceBonuses, jobBonuses, classBonuses) {
    const bonusSourcesDisplay = document.getElementById('bonus-sources-display');
    if (!bonusSourcesDisplay) return;

    bonusSourcesDisplay.innerHTML = '';

    // Collect all attributes that have bonuses
    const attributesWithBonuses = new Set();
    Object.keys(raceBonuses).forEach(stat => raceBonuses[stat] !== 0 && attributesWithBonuses.add(stat));
    Object.keys(jobBonuses).forEach(stat => jobBonuses[stat] !== 0 && attributesWithBonuses.add(stat));
    Object.keys(classBonuses).forEach(stat => classBonuses[stat] !== 0 && attributesWithBonuses.add(stat));

    if (attributesWithBonuses.size === 0) return;

    const bonusInfo = document.createElement('div');
    bonusInfo.style.cssText = `
        margin-top: 15px;
        padding: 12px;
        background: rgba(40, 40, 60, 0.6);
        border-radius: 8px;
        border: 1px solid #4a4a6a;
    `;

    let bonusHTML = '<div style="font-size: 12px; color: #f4d03f; font-weight: 600; margin-bottom: 8px; text-align: center;">Attribute Bonuses</div>';
    
    Array.from(attributesWithBonuses).forEach(stat => {
        const raceBonus = raceBonuses[stat] || 0;
        const jobBonus = jobBonuses[stat] || 0;
        const classBonus = classBonuses[stat] || 0;
        
        const sources = [];
        if (raceBonus !== 0) sources.push(`${character.race} (${raceBonus > 0 ? '+' : ''}${raceBonus})`);
        if (jobBonus !== 0) sources.push(`${character.job} (${jobBonus > 0 ? '+' : ''}${jobBonus})`);
        if (classBonus !== 0) sources.push(`${character.class} (${classBonus > 0 ? '+' : ''}${classBonus})`);
        
        if (sources.length > 0) {
            const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
            bonusHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; padding: 3px 6px; background: ${hasDoubleBonus ? 'rgba(255, 215, 0, 0.1)' : 'rgba(50, 50, 70, 0.5)'}; border-radius: 4px;">
                    <span style="font-size: 11px; color: ${hasDoubleBonus ? '#ffd700' : '#cbd5e1'}; font-weight: 500; text-transform: capitalize;">${stat}:</span>
                    <span style="font-size: 10px; color: #94a3b8;">${sources.join(', ')}</span>
                </div>
            `;
        }
    });

    bonusInfo.innerHTML = bonusHTML;
    bonusSourcesDisplay.appendChild(bonusInfo);
}

// ========================================
// SKILLS SYSTEM
// ========================================


// Function to consolidate skills
function consolidateSkills() {
    const skillMap = new Map();

    // Process custom skills and mark sources
    character.customSkills.forEach(skill => {
        const key = skill.name.toLowerCase();

        // Check if this matches a standard skill
        let matchedStandard = null;
        for (const [stdName, stdStat] of Object.entries(standardSkills)) {
            if (key === stdName.toLowerCase() ||
                (key.includes(stdName.toLowerCase()) || stdName.toLowerCase().includes(key))) {
                matchedStandard = stdName;
                break;
            }
        }

        if (matchedStandard) {
            // Use the matched standard skill data
            if (!skillMap.has(matchedStandard.toLowerCase())) {
                skillMap.set(matchedStandard.toLowerCase(), {
                    name: matchedStandard,
                    stat: standardSkills[matchedStandard],
                    sources: [],
                    baseSkill: true
                });
            }
            const existing = skillMap.get(matchedStandard.toLowerCase());
            if (skill.source === 'race') existing.sources.push('H');
            else if (skill.source === 'job') existing.sources.push('B');
            else if (skill.source === 'class') existing.sources.push('C');
            else if (skill.source === 'levelup') existing.sources.push('L');
        } else {
            // It's a unique skill
            if (!skillMap.has(key)) {
                skillMap.set(key, {
                    name: skill.name,
                    stat: skill.stat,
                    sources: [],
                    baseSkill: false
                });
            }
            const existing = skillMap.get(key);
            if (skill.source === 'race') existing.sources.push('H');
            else if (skill.source === 'job') existing.sources.push('B');
            else if (skill.source === 'class') existing.sources.push('C');
            else if (skill.source === 'levelup') existing.sources.push('L');
        }
    });

    return skillMap;
}

// Update renderCharacterSkills function
function renderCharacterSkills() {
    const skillsGrid = document.getElementById('char-skills-grid');
    if (!skillsGrid) return;

    skillsGrid.innerHTML = '';

    const consolidatedSkills = consolidateSkills();
    
    // Get bonuses to check for double bonuses
    const jobBonuses = getSelectedJobBonuses();
    const classBonuses = getSelectedClassBonuses();

    consolidatedSkills.forEach((skillData, key) => {
        const skillValue = character.stats[skillData.stat];
        const sourceLabel = skillData.sources.length > 0 ? ` [${skillData.sources.join(',')}]` : '';
        
        // Check if this skill gets double bonus (both job and class affect same stat)
        const jobBonus = jobBonuses[skillData.stat] || 0;
        const classBonus = classBonuses[skillData.stat] || 0;
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);

        const skillItem = createInteractiveItem('skill', {
            name: skillData.name + sourceLabel,
            stat: skillData.stat,
            value: skillValue,
            icon: skillData.baseSkill ? 'ra-gear' : 'ra-star',
            hasDoubleBonus: hasDoubleBonus,
            onClick: () => rollSkill(skillData.name, skillData.stat, skillValue)
        });
        skillsGrid.appendChild(skillItem);
    });

    // Add non-source custom skills
    character.customSkills.filter(skill => !skill.source).forEach((skill, index) => {
        const skillValue = character.stats[skill.stat];
        
        // Check for double bonus on custom skills too
        const jobBonus = jobBonuses[skill.stat] || 0;
        const classBonus = classBonuses[skill.stat] || 0;
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const skillItem = createInteractiveItem('skill', {
            name: skill.name + ' (Custom)',
            stat: skill.stat,
            value: skillValue,
            icon: 'ra-star',
            hasDoubleBonus: hasDoubleBonus,
            onClick: () => rollSkill(skill.name, skill.stat, skillValue),
            removeButton: () => removeCustomSkillFromCharTab(index)
        });
        skillsGrid.appendChild(skillItem);
    });
}

function createInteractiveItem(type, options) {
    const item = document.createElement('div');
    item.className = `interactive-item ${type}-item ${options.hasDoubleBonus ? 'double-bonus' : ''}`;
    item.onclick = options.onClick;

    const statDisplay = options.stat ? `[${options.stat.substring(0, 3).toUpperCase()}]` : '';
    const valueText = type === 'skill' ? `+${options.value}` :
        type === 'spell' ? `${options.value} MP` :
            `d${options.diceType || 6}+${options.value}`;

    // Handle both Material icons and RPGAwesome icons
    const iconHtml = options.iconType === 'material' ? 
        `<span class="material-icons">${options.icon}</span>` : 
        `<i class="ra ${options.icon}"></i>`;

    item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${iconHtml} ${options.name}</div>
                    <div class="item-stat">${statDisplay}${options.description || ''}</div>
                </div>
                <div class="item-value">${valueText}</div>
                ${options.removeButton ? `<button class="control-btn" onclick="event.stopPropagation(); (${options.removeButton})()" style="width: 32px; height: 32px; font-size: 16px; margin-left: 10px;">×</button>` : ''}
            `;

    return item;
}

function addCustomSkillFromCharTab() {
    const skillName = document.getElementById('char-custom-skill-name').value.trim();
    const skillStat = document.getElementById('char-custom-skill-stat').value;

    if (skillName) {
        character.customSkills.push({
            name: skillName,
            stat: skillStat
        });

        document.getElementById('char-custom-skill-name').value = '';
        renderCharacterSkills();
    }
}

function removeCustomSkillFromCharTab(index) {
    character.customSkills.splice(index, 1);
    renderCharacterSkills();
}

// ========================================
// SPELLS SYSTEM
// ========================================
function renderCharacterSpells() {
    const spellsContainer = document.getElementById('char-spells-container');
    if (!spellsContainer) return;

    spellsContainer.innerHTML = '';

    if (character.spells.length === 0) {
        spellsContainer.innerHTML = `
                    <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-lightning" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No spells learned yet. Visit the Magic tab to create your first spell!
                    </div>
                `;
        return;
    }

    character.spells.forEach(spell => {
        const canCast = character.currentMagicPoints >= spell.cost;
        const elementEmoji = getElementEmoji(spell.element);

        const spellItem = createInteractiveItem('spell', {
            name: `${elementEmoji} ${spell.name}`,
            description: `${spell.element} | ${spell.effects.join(', ')}`,
            value: spell.cost,
            icon: 'ra-lightning',
            onClick: canCast ? () => castSpellFromCharTab(spell.id) : null
        });

        if (!canCast) {
            spellItem.classList.add('insufficient-mp');
        }

        spellsContainer.appendChild(spellItem);
    });
}

function renderCharacterWeapons() {
    const weaponsContainer = document.getElementById('char-weapons-container');
    if (!weaponsContainer) return;

    weaponsContainer.innerHTML = '';

    const equippedWeapons = [];
    Object.values(character.equipment).forEach(itemId => {
        if (itemId) {
            const item = getItemById(itemId);
            if (item && item.type === 'weapon') {
                equippedWeapons.push(item);
            }
        }
    });

    if (equippedWeapons.length === 0) {
        weaponsContainer.innerHTML = `
                    <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-sword" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No weapons equipped. Visit the Inventory tab to equip weapons!
                    </div>
                `;
        return;
    }

    equippedWeapons.forEach(weapon => {
        const statUsed = weapon.ranged ? 'dexterity' : 'strength';
        const statValue = character.stats[statUsed];
        const weaponSize = weaponSizes[weapon.size] || weaponSizes.medium;

        // Get intelligent icon for this weapon
        const weaponIcon = getItemIcon(weapon.name, weapon.type);

        const weaponItem = createInteractiveItem('weapon', {
            name: weapon.name,
            description: `${weaponSize.name} • d${weaponSize.dice} + ${statUsed.slice(0, 3).toUpperCase()}(${statValue}) ${weapon.ranged ? '• Ranged' : '• Melee'}`,
            value: statValue,
            diceType: weaponSize.dice,
            icon: weaponIcon,
            iconType: 'material', // Use Material icons instead of RPGAwesome
            onClick: () => rollWeaponDamage(weapon.id)
        });

        weaponsContainer.appendChild(weaponItem);
    });
}

function renderSpells() {
    const spellsGrid = document.getElementById('spells-grid');
    if (!spellsGrid) return;

    spellsGrid.innerHTML = '';

    if (character.spells.length === 0) {
        spellsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-lightning" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No spells learned yet. Create your first spell below!
                    </div>
                `;
        return;
    }

    character.spells.forEach(spell => {
        const spellDiv = document.createElement('div');
        spellDiv.style.cssText = `
                    background: rgba(40, 40, 60, 0.8);
                    border: 1px solid #8a4a8a;
                    border-radius: 12px;
                    padding: 18px;
                    transition: all 0.3s ease;
                    position: relative;
                `;

        spellDiv.onmouseenter = () => {
            spellDiv.style.borderColor = '#da70d6';
            spellDiv.style.background = 'rgba(218, 112, 214, 0.1)';
            spellDiv.style.transform = 'translateY(-2px)';
        };

        spellDiv.onmouseleave = () => {
            spellDiv.style.borderColor = '#8a4a8a';
            spellDiv.style.background = 'rgba(40, 40, 60, 0.8)';
            spellDiv.style.transform = 'translateY(0)';
        };

        const elementEmoji = getElementEmoji(spell.element);
        const canCast = character.currentMagicPoints >= spell.cost;

        spellDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <h4 style="color: #da70d6; margin: 0; font-size: 16px; font-weight: 600;">
                            ${elementEmoji} ${spell.name}
                        </h4>
                        <button onclick="removeSpell('${spell.id}')" style="background: #8a4a4a; border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px;">×</button>
                    </div>
                    
                    <div style="font-size: 12px; color: #8a8a8a; margin-bottom: 10px; text-transform: capitalize;">
                        ${spell.element} Magic
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        ${spell.effects.map(effect =>
            `<span style="background: rgba(138, 74, 138, 0.3); color: #da70d6; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-right: 6px; margin-bottom: 4px; display: inline-block;">${effect}</span>`
        ).join('')}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <div style="color: #f4d03f; font-weight: bold; font-size: 14px;">
                            Cost: ${spell.cost} MP
                        </div>
                        <button onclick="castSpell('${spell.id}')" 
                                style="background: ${canCast ? '#8a4a8a' : '#4a4a5a'}; 
                                       border: none; 
                                       color: ${canCast ? 'white' : '#6a6a8a'}; 
                                       padding: 8px 16px; 
                                       border-radius: 6px; 
                                       cursor: ${canCast ? 'pointer' : 'not-allowed'}; 
                                       font-size: 12px; 
                                       transition: all 0.3s ease;
                                       ${canCast ? '' : 'opacity: 0.5;'}"
                                ${canCast ? '' : 'disabled'}>
                            <i class="ra ra-lightning"></i> Cast
                        </button>
                    </div>
                `;

        spellsGrid.appendChild(spellDiv);
    });
}

function calculateSpellCost() {
    let cost = 1;
    let breakdown = ['Base Cost: 1 MP (activation)'];

    const damageType = document.getElementById('damage-type').value;
    const damageAmount = parseInt(document.getElementById('damage-amount').value) || 0;

    if (damageType === 'fixed' && damageAmount > 0) {
        const damageCost = Math.ceil(damageAmount / 2);
        cost += damageCost;
        breakdown.push(`Damage: ${damageAmount} pts = ${damageCost} MP`);
    } else if (damageType === 'd6') {
        cost += 3;
        breakdown.push('Damage: d6 roll = 3 MP');
    }

    const healingType = document.getElementById('healing-type').value;
    const healingAmount = parseInt(document.getElementById('healing-amount').value) || 0;

    if (healingType === 'fixed' && healingAmount > 0) {
        const healingCost = Math.ceil(healingAmount / 2);
        cost += healingCost;
        breakdown.push(`Healing: ${healingAmount} pts = ${healingCost} MP`);
    } else if (healingType === 'd6') {
        cost += 3;
        breakdown.push('Healing: d6 roll = 3 MP');
    }

    const primaryEffect = document.getElementById('primary-effect').value;
    if (primaryEffect) {
        cost += 1;
        breakdown.push('Primary Effect: 1 MP');
    }

    const secondaryEffect = document.getElementById('secondary-effect').value;
    if (secondaryEffect) {
        cost += 1;
        breakdown.push('Secondary Effect: 1 MP');
    }

    document.getElementById('cost-breakdown').innerHTML = breakdown.join('<br>');
    document.getElementById('total-cost').textContent = cost;

    const createBtn = document.getElementById('create-spell-btn');
    if (cost > character.magicPoints) {
        createBtn.disabled = true;
        createBtn.style.opacity = '0.5';
        createBtn.innerHTML = `<i class="ra ra-lightning"></i> Create Spell (Need ${cost} MP Total)`;
    } else {
        createBtn.disabled = false;
        createBtn.style.opacity = '1';
        createBtn.innerHTML = '<i class="ra ra-lightning"></i> Create Spell';
    }

    return cost;
}

function createSpell() {
    const name = document.getElementById('spell-name').value.trim();
    const element = document.getElementById('spell-element').value;
    const damageType = document.getElementById('damage-type').value;
    const damageAmount = parseInt(document.getElementById('damage-amount').value) || 0;
    const healingType = document.getElementById('healing-type').value;
    const healingAmount = parseInt(document.getElementById('healing-amount').value) || 0;
    const primaryEffect = document.getElementById('primary-effect').value;
    const secondaryEffect = document.getElementById('secondary-effect').value;

    if (!name) {
        alert('Please enter a spell name!');
        return;
    }

    const cost = calculateSpellCost();
    const effects = [];

    if (damageType === 'fixed' && damageAmount > 0) {
        effects.push(`${damageAmount} damage`);
    } else if (damageType === 'd6') {
        effects.push('d6 damage');
    }

    if (healingType === 'fixed' && healingAmount > 0) {
        effects.push(`${healingAmount} healing`);
    } else if (healingType === 'd6') {
        effects.push('d6 healing');
    }

    if (primaryEffect) {
        effects.push(primaryEffect.replace('_', ' '));
    }

    if (secondaryEffect) {
        effects.push(secondaryEffect.replace('_', ' '));
    }

    if (effects.length === 0) {
        effects.push('no effect');
    }

    const spell = {
        id: generateId(),
        name: name,
        element: element,
        damageType: damageType,
        damageAmount: damageAmount,
        healingType: healingType,
        healingAmount: healingAmount,
        primaryEffect: primaryEffect,
        secondaryEffect: secondaryEffect,
        cost: cost,
        effects: effects
    };

    character.spells.push(spell);

    // Clear form
    document.getElementById('spell-name').value = '';
    document.getElementById('damage-amount').value = '0';
    document.getElementById('healing-amount').value = '0';
    document.getElementById('damage-type').value = '';
    document.getElementById('healing-type').value = '';
    document.getElementById('primary-effect').value = '';
    document.getElementById('secondary-effect').value = '';
    document.getElementById('damage-amount').disabled = true;
    document.getElementById('healing-amount').disabled = true;

    renderSpells();
    renderCharacterSpells();
    calculateSpellCost();

    // alert(`✨ Created spell: ${spell.name}!\nCost: ${spell.cost} MP\nEffects: ${spell.effects.join(', ')}`);
}

// function castSpell(spellId) {
//     const spell = character.spells.find(s => s.id === spellId);
//     if (!spell) return;

//     if (character.currentMagicPoints < spell.cost) {
//         alert(`Not enough magic points! Need ${spell.cost} MP, have ${character.currentMagicPoints} MP.`);
//         return;
//     }

//     character.currentMagicPoints -= spell.cost;

//     let results = [];
//     let totalDamage = 0;
//     let totalHealing = 0;

//     if (spell.damageType === 'fixed' && spell.damageAmount > 0) {
//         totalDamage = spell.damageAmount;
//         results.push(`Dealt ${totalDamage} damage`);
//     } else if (spell.damageType === 'd6') {
//         totalDamage = Math.floor(Math.random() * 6) + 1;
//         results.push(`Dealt ${totalDamage} damage (d6 roll)`);
//     }

//     if (spell.healingType === 'fixed' && spell.healingAmount > 0) {
//         totalHealing = spell.healingAmount;
//         results.push(`Healed ${totalHealing} points`);
//     } else if (spell.healingType === 'd6') {
//         totalHealing = Math.floor(Math.random() * 6) + 1;
//         results.push(`Healed ${totalHealing} points (d6 roll)`);
//     }

//     if (spell.primaryEffect) {
//         results.push(`Applied ${spell.primaryEffect.replace('_', ' ')}`);
//     }
//     if (spell.secondaryEffect) {
//         results.push(`Applied ${spell.secondaryEffect.replace('_', ' ')}`);
//     }

//     const spellData = {
//         type: 'Spell',
//         name: spell.name,
//         element: spell.element,
//         cost: spell.cost,
//         results: results,
//         finalTotal: totalDamage || totalHealing || 'N/A',
//         timestamp: new Date().toLocaleTimeString()
//     };

//     character.rollHistory.unshift(spellData);
//     if (character.rollHistory.length > 50) {
//         character.rollHistory = character.rollHistory.slice(0, 50);
//     }

//     const elementEmoji = getElementEmoji(spellData.element);
//     showNotification('spell', `Spell Cast: ${elementEmoji} ${spellData.name}`,
//         `Cost: ${spellData.cost} MP`,
//         `${spellData.results.length > 0 ? spellData.results.join('<br>') : 'Spell cast successfully!'}<br>MP Remaining: ${character.currentMagicPoints}/${character.magicPoints}`);

//     updateMagicTabDisplay();
//     updateCharacterDisplay();
//     renderSpells();
//     renderCharacterSpells();
// }

function castSpell(spellId) {
    const spell = character.spells.find(s => s.id === spellId);
    if (!spell) return;

    if (character.currentMagicPoints < spell.cost) {
        alert(`Not enough magic points! Need ${spell.cost} MP, have ${character.currentMagicPoints} MP.`);
        return;
    }

    character.currentMagicPoints -= spell.cost;

    let results = [];
    let totalDamage = 0;
    let totalHealing = 0;
    let toHitRoll = null;

    // Check if spell does damage
    if (spell.damageType && spell.damageType !== '') {
        // Roll to hit for damage spells
        toHitRoll = rollToHit('intelligence'); // Spells use INT for to-hit
        results.push(`To Hit: d10(${toHitRoll.d10Roll}) + INT(${toHitRoll.statBonus}) + Lv(${toHitRoll.levelBonus}) = ${toHitRoll.total}`);

        if (toHitRoll.isCrit) {
            results.push('💥 CRITICAL HIT!');
        }

        if (spell.damageType === 'fixed' && spell.damageAmount > 0) {
            totalDamage = spell.damageAmount;
            if (toHitRoll.isCrit) {
                totalDamage += 5;
            }
            results.push(`Dealt ${totalDamage} damage${toHitRoll.isCrit ? ' (includes +5 crit bonus)' : ''}`);
        } else if (spell.damageType === 'd6') {
            totalDamage = Math.floor(Math.random() * 6) + 1;
            if (toHitRoll.isCrit) {
                totalDamage += 5;
            }
            results.push(`Dealt ${totalDamage} damage (d6 roll${toHitRoll.isCrit ? ' + 5 crit bonus' : ''})`);
        }
    }

    if (spell.healingType === 'fixed' && spell.healingAmount > 0) {
        totalHealing = spell.healingAmount;
        results.push(`Healed ${totalHealing} points`);
    } else if (spell.healingType === 'd6') {
        totalHealing = Math.floor(Math.random() * 6) + 1;
        results.push(`Healed ${totalHealing} points (d6 roll)`);
    }

    if (spell.primaryEffect) {
        results.push(`Applied ${spell.primaryEffect.replace('_', ' ')}`);
    }
    if (spell.secondaryEffect) {
        results.push(`Applied ${spell.secondaryEffect.replace('_', ' ')}`);
    }

    const spellData = {
        type: 'Spell',
        name: spell.name,
        element: spell.element,
        cost: spell.cost,
        results: results,
        finalTotal: totalDamage || totalHealing || 'N/A',
        timestamp: new Date().toLocaleTimeString(),
        toHit: toHitRoll
    };

    character.rollHistory.unshift(spellData);
    if (character.rollHistory.length > 50) {
        character.rollHistory = character.rollHistory.slice(0, 50);
    }

    const elementEmoji = getElementEmoji(spellData.element);
    const title = toHitRoll && toHitRoll.isCrit ? `💥 CRITICAL! ${elementEmoji} ${spellData.name}` : `Spell Cast: ${elementEmoji} ${spellData.name}`;

    showNotification('spell', title,
        `Cost: ${spellData.cost} MP`,
        `${spellData.results.length > 0 ? spellData.results.join('<br>') : 'Spell cast successfully!'}<br>MP Remaining: ${character.currentMagicPoints}/${character.magicPoints}`);

    // Send spell to chat if in combat mode
    if (isInCombatMode() && typeof sendChatMessage === 'function') {
        const characterName = character.name || 'Unknown';
        const attackRoll = toHitRoll ? toHitRoll.total : null;
        const damage = totalDamage || 0;
        const commandString = `SPELL:${characterName}:${attackRoll || 'auto'}:${damage}:${spell.name}:${spell.cost}`;
        sendChatMessage(commandString);
    }

    updateMagicTabDisplay();
    updateCharacterDisplay();
    updateRollHistoryDisplay();
    renderSpells();
    renderCharacterSpells();
}

function castSpellFromCharTab(spellId) {
    castSpell(spellId);
}

function removeSpell(spellId) {
    if (confirm('Are you sure you want to forget this spell?')) {
        character.spells = character.spells.filter(spell => spell.id !== spellId);
        renderSpells();
        renderCharacterSpells();
    }
}

// ========================================
// INVENTORY SYSTEM
// ========================================
function addItem() {
    const name = document.getElementById('item-name').value.trim();
    const type = document.getElementById('item-type').value;
    const size = document.getElementById('weapon-size').value;
    const defense = parseInt(document.getElementById('item-defense').value) || 0;
    const twoHanded = document.getElementById('item-twohanded').checked;
    const ranged = document.getElementById('item-ranged').checked;
    const healing = document.getElementById('item-healing').checked;

    if (!name) {
        alert('Please enter an item name!');
        return;
    }

    const item = {
        id: generateId(),
        name: name,
        type: type,
        size: type === 'weapon' ? size : null,
        defense: defense,
        twoHanded: twoHanded,
        ranged: ranged,
        healing: type === 'consumable' ? healing : false
    };

    character.inventory.push(item);

    // Reset form
    document.getElementById('item-name').value = '';
    document.getElementById('item-defense').value = '';
    document.getElementById('item-twohanded').checked = false;
    document.getElementById('item-ranged').checked = false;
    document.getElementById('item-healing').checked = false;
    document.getElementById('healing-consumable-container').style.display = 'none';

    renderInventory();
    // alert(`Created ${item.name}!`);
}

// Add consumable use function
function useConsumable(itemId) {
    const item = getItemById(itemId);
    if (!item || item.type !== 'consumable') return;

    if (item.healing) {
        const healAmount = 10 + character.level;
        const oldHP = character.currentHealthPoints;
        character.currentHealthPoints = Math.min(character.healthPoints, character.currentHealthPoints + healAmount);
        const actualHealed = character.currentHealthPoints - oldHP;

        showNotification('rest', `Used ${item.name}`,
            `Healed ${actualHealed} HP`,
            `${character.currentHealthPoints}/${character.healthPoints} HP`);
    }

    // Remove the consumable from inventory
    character.inventory = character.inventory.filter(invItem => invItem.id !== itemId);

    updateCharacterDisplay();
    renderInventory();
}

function removeItem(itemId) {
    const item = getItemById(itemId);
    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
    }

    if (isItemEquipped(itemId)) {
        Object.keys(character.equipment).forEach(slot => {
            if (character.equipment[slot] === itemId) {
                character.equipment[slot] = null;
            }
        });
        renderEquipment();
        renderCharacterWeapons();
    }

    character.inventory = character.inventory.filter(invItem => invItem.id !== itemId);
    renderInventory();
    // alert(`Deleted "${item.name}".`);
}

// ========================================
// INTELLIGENT ICON SYSTEM FOR EQUIPMENT
// ========================================

// Intelligent Icon Database for Equipment
const itemIconDatabase = {
    // Weapons - Material Icons
    weapons: {
        // Firearms
        pistol: 'sports_martial_arts',
        gun: 'sports_martial_arts', 
        rifle: 'sports_martial_arts',
        musket: 'sports_martial_arts',
        firearm: 'sports_martial_arts',
        blunderbuss: 'sports_martial_arts',
        
        // Bows and Ranged
        bow: 'sports_martial_arts',
        crossbow: 'sports_martial_arts',
        sling: 'sports_martial_arts',
        dart: 'sports_martial_arts',
        javelin: 'sports_martial_arts',
        spear: 'sports_martial_arts',
        
        // Blades
        sword: 'sports_martial_arts',
        blade: 'sports_martial_arts',
        dagger: 'sports_martial_arts',
        knife: 'sports_martial_arts',
        scimitar: 'sports_martial_arts',
        rapier: 'sports_martial_arts',
        shortsword: 'sports_martial_arts',
        longsword: 'sports_martial_arts',
        bastard: 'sports_martial_arts',
        
        // Blunt Weapons
        mace: 'gavel',
        hammer: 'build',
        club: 'gavel',
        staff: 'straighten',
        rod: 'straighten',
        wand: 'auto_fix_high',
        
        // Polearms
        pike: 'straighten',
        halberd: 'straighten',
        glaive: 'straighten',
        lance: 'straighten',
        
        // Axes
        axe: 'carpenter',
        hatchet: 'carpenter',
        battleaxe: 'carpenter',
        
        // Default weapon
        default: 'sports_martial_arts'
    },
    
    // Armor - Material Icons
    armor: {
        // Body Armor
        armor: 'security',
        mail: 'security',
        plate: 'security',
        leather: 'security',
        chainmail: 'security',
        studded: 'security',
        brigandine: 'security',
        
        // Clothing/Robes
        robe: 'checkroom',
        cloak: 'checkroom',
        tunic: 'checkroom',
        garb: 'checkroom',
        vestment: 'checkroom',
        
        // Default armor
        default: 'security'
    },
    
    // Shields and Off-hand Items - Material Icons
    offhand: {
        // Shields
        shield: 'shield',
        buckler: 'shield',
        targe: 'shield',
        
        // Potions and Consumables
        potion: 'science',
        flask: 'science',
        vial: 'science',
        elixir: 'science',
        brew: 'science',
        tonic: 'science',
        
        // Tools
        torch: 'flashlight_on',
        lantern: 'lightbulb',
        lamp: 'lightbulb',
        
        // Books and Scrolls
        book: 'menu_book',
        tome: 'menu_book',
        grimoire: 'menu_book',
        scroll: 'description',
        parchment: 'description',
        
        // Magical Items
        orb: 'bubble_chart',
        crystal: 'bubble_chart',
        gem: 'diamond',
        stone: 'circle',
        
        // Default offhand
        default: 'shield'
    },
    
    // Accessories - Material Icons
    accessories: {
        // Jewelry
        ring: 'panorama_fish_eye',
        amulet: 'favorite',
        necklace: 'favorite',
        pendant: 'favorite',
        charm: 'favorite',
        talisman: 'favorite',
        
        // Clothing
        cloak: 'checkroom',
        cape: 'checkroom',
        belt: 'fitness_center',
        sash: 'fitness_center',
        gloves: 'back_hand',
        gauntlets: 'back_hand',
        boots: 'directions_walk',
        
        // Default accessory
        default: 'star'
    }
};

// Function to get intelligent icon for an item based on name scanning
function getItemIcon(itemName, itemType, slot) {
    if (!itemName) return getDefaultIcon(itemType, slot);
    
    const name = itemName.toLowerCase();
    let iconDatabase;
    
    // Determine which database to search based on type and slot
    if (itemType === 'weapon' || slot === 'mainHand') {
        iconDatabase = itemIconDatabase.weapons;
    } else if (itemType === 'armor' || slot === 'armor') {
        iconDatabase = itemIconDatabase.armor;
    } else if (slot === 'offHand') {
        iconDatabase = itemIconDatabase.offhand;
    } else {
        iconDatabase = itemIconDatabase.accessories;
    }
    
    // Search for keywords in the item name (like VB6 InStr functionality)
    for (const keyword in iconDatabase) {
        if (keyword !== 'default' && name.includes(keyword)) {
            return iconDatabase[keyword];
        }
    }
    
    // Cross-reference other categories for better matches
    // Check if weapon keywords appear in non-weapon items
    if (slot !== 'mainHand' && itemType !== 'weapon') {
        for (const keyword in itemIconDatabase.weapons) {
            if (keyword !== 'default' && name.includes(keyword)) {
                return itemIconDatabase.weapons[keyword];
            }
        }
    }
    
    // Check offhand items for any slot
    for (const keyword in itemIconDatabase.offhand) {
        if (keyword !== 'default' && name.includes(keyword)) {
            return itemIconDatabase.offhand[keyword];
        }
    }
    
    // Return default icon for the category
    return iconDatabase.default || getDefaultIcon(itemType, slot);
}

// Function to get default icons when no match is found
function getDefaultIcon(itemType, slot) {
    switch (itemType) {
        case 'weapon': return 'sports_martial_arts';
        case 'armor': return 'security';
        case 'accessory': return 'star';
        case 'consumable': return 'science';
        default:
            switch (slot) {
                case 'mainHand': return 'sports_martial_arts';
                case 'offHand': return 'shield';
                case 'armor': return 'security';
                case 'accessory': return 'star';
                default: return 'help_outline';
            }
    }
}

function renderInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = '';

    character.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        if (isItemEquipped(item.id)) {
            itemDiv.classList.add('equipped');
        }

        const stats = [];
        if (item.type === 'weapon' && item.size) {
            const weaponSize = weaponSizes[item.size];
            stats.push(`d${weaponSize.dice}`);
        }
        if (item.defense > 0) stats.push(`+${item.defense} DEF`);
        if (item.twoHanded) stats.push('2H');
        if (item.ranged) stats.push('RNG');

        // Get intelligent icon for this item
        const itemIcon = getItemIcon(item.name, item.type);

        itemDiv.innerHTML = `
    <div class="item-icon-name">
        <span class="material-icons item-icon">${itemIcon}</span>
        <div class="item-name">${item.name}</div>
    </div>
    <div class="item-type">${item.type} ${item.size ? `(${weaponSizes[item.size].name})` : ''}</div>
    <div class="item-stats">
        ${stats.map(stat => `<span class="item-stat">${stat}</span>`).join('')}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        ${item.type === 'consumable' ?
                `<button class="btn-secondary" onclick="useConsumable('${item.id}')" style="font-size: 11px; padding: 4px 8px; min-height: auto;">
                Use
            </button>` :
                `<button class="btn-secondary" onclick="selectItem('${item.id}')" style="font-size: 11px; padding: 4px 8px; min-height: auto;">
                ${isItemEquipped(item.id) ? 'Unequip' : 'Equip'}
            </button>`
            }
        <button class="remove-btn" onclick="removeItem('${item.id}')" title="Delete Item">
            <i class="ra ra-cancel"></i>
        </button>
    </div>
`;
        
        // Add equipment bonus indicators for weapons and armor
        if (item.type === 'weapon' || item.type === 'armor') {
            const itemType = item.type === 'weapon' ? (item.ranged ? 'ranged weapon' : 'melee weapon') : item.type;
            addEquipmentBonusIndicators(itemDiv, item.name, itemType);
        }
        
        inventoryGrid.appendChild(itemDiv);
    });
}

function selectItem(itemId) {
    const item = getItemById(itemId);
    if (isItemEquipped(itemId)) {
        unequipItem(itemId);
    } else {
        equipItem(item);
    }
}

function equipItem(item) {
    let slot = '';

    if (item.type === 'weapon') {
        if (item.twoHanded) {
            character.equipment.mainHand = null;
            character.equipment.offHand = null;
            slot = 'mainHand';
        } else {
            if (!character.equipment.mainHand) {
                slot = 'mainHand';
            } else if (!character.equipment.offHand) {
                slot = 'offHand';
            } else {
                slot = 'mainHand';
            }
        }
    } else if (item.type === 'armor') {
        slot = 'armor';
    } else {
        slot = 'accessory';
    }

    character.equipment[slot] = item.id;
    renderEquipment();
    renderInventory();
    renderCharacterWeapons();
    updateCharacterDisplay();
}

function unequipItem(itemId) {
    Object.keys(character.equipment).forEach(slot => {
        if (character.equipment[slot] === itemId) {
            character.equipment[slot] = null;
        }
    });
    renderEquipment();
    renderInventory();
    renderCharacterWeapons();
    updateCharacterDisplay();
}

function isItemEquipped(itemId) {
    return Object.values(character.equipment).includes(itemId);
}

function getItemById(itemId) {
    return character.inventory.find(item => item.id === itemId);
}

function renderEquipment() {
    Object.keys(character.equipment).forEach(slot => {
        const itemElement = document.getElementById(`${slot}-item`);
        const statsElement = document.getElementById(`${slot}-stats`);
        const slotElement = document.querySelector(`[data-slot="${slot}"]`);
        const slotIconElement = slotElement.querySelector('.slot-icon i');

        const itemId = character.equipment[slot];
        if (itemId) {
            const item = getItemById(itemId);
            if (item) {
                itemElement.textContent = item.name;

                const stats = [];
                if (item.type === 'weapon' && item.size) {
                    const weaponSize = weaponSizes[item.size];
                    stats.push(`d${weaponSize.dice} damage`);
                }
                if (item.defense > 0) stats.push(`+${item.defense} defense`);
                if (item.twoHanded) stats.push('Two-handed');
                if (item.ranged) stats.push('Ranged');

                statsElement.textContent = stats.join(', ');
                slotElement.classList.add('equipped');

                // Update the slot icon to match the equipped item
                const itemIcon = getItemIcon(item.name, item.type, slot);
                slotIconElement.className = `material-icons`;
                slotIconElement.textContent = itemIcon;
            }
        } else {
            itemElement.textContent = 'Empty';
            statsElement.textContent = '';
            slotElement.classList.remove('equipped');
            
            // Reset to default slot icon when empty
            const defaultIcon = getDefaultSlotIcon(slot);
            if (defaultIcon.type === 'material') {
                slotIconElement.className = `material-icons`;
                slotIconElement.textContent = defaultIcon.icon;
            } else {
                slotIconElement.className = `ra ra-${defaultIcon.icon}`;
                slotIconElement.textContent = '';
            }
        }
    });
}

// Function to get default icons for empty equipment slots
function getDefaultSlotIcon(slot) {
    switch (slot) {
        case 'mainHand': return { type: 'rpg', icon: 'sword' };
        case 'offHand': return { type: 'rpg', icon: 'shield' };
        case 'armor': return { type: 'rpg', icon: 'armor' };
        case 'accessory': return { type: 'material', icon: 'star' };
        default: return { type: 'material', icon: 'help_outline' };
    }
}

function showEquipMenu(slot) {
    const availableItems = character.inventory.filter(item => {
        if (slot === 'mainHand' || slot === 'offHand') {
            return item.type === 'weapon';
        } else if (slot === 'armor') {
            return item.type === 'armor';
        } else {
            return item.type === 'accessory' || item.type === 'misc';
        }
    });

    if (availableItems.length > 0) {
        const itemNames = availableItems.map(item => `${item.name} (${item.type})`).join('\n');
        alert(`Available items for ${slot}:\n${itemNames}\n\nClick on an item in the inventory below to equip it.`);
    } else {
        alert(`No items available for ${slot} slot.`);
    }
}

// ========================================
// COMBAT SYSTEM
// ========================================
function calculateTotalDefense() {
    let totalDefense = 0;

    Object.values(character.equipment).forEach(itemId => {
        if (itemId) {
            const item = getItemById(itemId);
            if (item && item.defense) {
                totalDefense += item.defense;
            }
        }
    });

    return totalDefense;
}

function applyDamage(damage, target = 'character') {
    if (target === 'character') {
        const totalDefense = calculateTotalDefense();
        const actualDamage = Math.max(1, damage - totalDefense);

        character.currentHealthPoints = Math.max(0, character.currentHealthPoints - actualDamage);
        updateHealthMagicDisplay();
        updateCharacterDisplay();

        const defenseText = totalDefense > 0 ? ` (${damage} - ${totalDefense} armor)` : '';
        showNotification('damage', 'Damage Taken',
            `${actualDamage} damage taken!${defenseText}`,
            `${character.currentHealthPoints}/${character.healthPoints} HP remaining`);

        return actualDamage;
    }
}

function testDamage() {
    const damageInput = document.getElementById('damage-input');
    const damage = parseInt(damageInput.value) || 5;

    if (damage < 1) {
        alert('Please enter a damage amount of at least 1.');
        return;
    }

    applyDamage(damage);
}

function quickRest() {
    const hpRecovery = Math.floor(character.healthPoints / 2);
    const mpRecovery = Math.floor(character.magicPoints / 2);

    const oldHP = character.currentHealthPoints;
    const oldMP = character.currentMagicPoints;

    character.currentHealthPoints = Math.min(character.healthPoints, character.currentHealthPoints + hpRecovery);
    character.currentMagicPoints = Math.min(character.magicPoints, character.currentMagicPoints + mpRecovery);

    const actualHPRecovered = character.currentHealthPoints - oldHP;
    const actualMPRecovered = character.currentMagicPoints - oldMP;

    updateHealthMagicDisplay();
    updateCharacterDisplay();

    showNotification('rest', 'Quick Rest',
        `Recovered ${actualHPRecovered} HP and ${actualMPRecovered} MP`,
        `${character.currentHealthPoints}/${character.healthPoints} HP, ${character.currentMagicPoints}/${character.magicPoints} MP`);
}

function longRest() {
    const oldHP = character.currentHealthPoints;
    const oldMP = character.currentMagicPoints;

    character.currentHealthPoints = character.healthPoints;
    character.currentMagicPoints = character.magicPoints;

    const actualHPRecovered = character.currentHealthPoints - oldHP;
    const actualMPRecovered = character.currentMagicPoints - oldMP;

    updateHealthMagicDisplay();
    updateCharacterDisplay();

    showNotification('rest', 'Long Rest',
        `Fully recovered! +${actualHPRecovered} HP and +${actualMPRecovered} MP`,
        `${character.currentHealthPoints}/${character.healthPoints} HP, ${character.currentMagicPoints}/${character.magicPoints} MP`);
}

// ========================================
// DICE ROLLING SYSTEM
// ========================================
function getDiceConfiguration(level) {
    const tensDigit = Math.floor(level / 10);
    const onesDigit = level % 10;

    let diceCount = Math.max(1, tensDigit);
    let diceType = 10;

    if (level >= 80) {
        diceCount = 8;
        diceType = 10;
    } else if (level >= 11 && level <= 20) {
        diceCount = 1;
        diceType = 20;
    } else if (level >= 21) {
        diceCount = Math.min(8, tensDigit);
        diceType = 10;
    }

    return {
        diceCount: diceCount,
        diceType: diceType,
        levelBonus: onesDigit,
        description: `${diceCount}d${diceType} + ${onesDigit} (Level ${level})`
    };
}

function rollDice(diceCount, diceType) {
    const rolls = [];
    for (let i = 0; i < diceCount; i++) {
        rolls.push(Math.floor(Math.random() * diceType) + 1);
    }
    return rolls;
}

// To Hit System
function rollToHit(attackStat, isCrit = false) {
    const d10Roll = Math.floor(Math.random() * 10) + 1;
    const statBonus = character.stats[attackStat];
    const levelBonus = character.level;
    const toHitTotal = d10Roll + statBonus + levelBonus;

    return {
        d10Roll: d10Roll,
        isCrit: d10Roll === 10,
        statBonus: statBonus,
        levelBonus: levelBonus,
        total: toHitTotal,
        statUsed: attackStat
    };
}

function rollAttribute(statName, statValue) {
    console.log(`🎯 rollAttribute called: ${statName}, value: ${statValue}`);
    console.log(`🎯 isInCombatMode(): ${isInCombatMode()}`);
    console.log(`🎯 window.combatModeActive: ${window.combatModeActive}`);
    
    // Check if this is DEX and we're in combat mode for initiative
    if (statName.toLowerCase() === 'dexterity' && isInCombatMode()) {
        console.log(`🎯 DEX + Combat Mode detected - rolling initiative!`);
        rollInitiativeForDexterity(statValue);
        return;
    } else {
        console.log(`🎯 Normal attribute roll (not DEX+combat)`);
    }
    
    const config = getDiceConfiguration(character.level);
    const diceRolls = rollDice(config.diceCount, config.diceType);
    const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
    const finalTotal = diceTotal + config.levelBonus + statValue;

    const rollData = {
        type: 'Attribute',
        name: statName.charAt(0).toUpperCase() + statName.slice(1),
        diceRolls: diceRolls,
        diceTotal: diceTotal,
        levelBonus: config.levelBonus,
        statBonus: statValue,
        finalTotal: finalTotal,
        config: config,
        timestamp: new Date().toLocaleTimeString()
    };

    character.rollHistory.unshift(rollData);
    if (character.rollHistory.length > 50) {
        character.rollHistory = character.rollHistory.slice(0, 50);
    }

    const diceDisplay = rollData.diceRolls.map(roll => `<span style="color: #f4d03f;">${roll}</span>`).join(' + ');
    showNotification('roll', `${rollData.type} Roll: ${rollData.name}`,
        `Total: ${rollData.finalTotal}`,
        `Dice: [${diceDisplay}] = ${rollData.diceTotal}<br>+ Level Bonus: ${rollData.levelBonus}<br>+ ${rollData.type} Bonus: ${rollData.statBonus}`);

    updateRollHistoryDisplay();
}

// ========================================
// COMBAT MODE DETECTION & INITIATIVE
// ========================================

function isInCombatMode() {
    // Check if combat has been explicitly started by StoryTeller
    if (typeof window.combatModeActive !== 'undefined') {
        return window.combatModeActive;
    }
    
    // Fallback: Check if we're connected to a game session
    if (typeof window.supabaseChat !== 'undefined' && 
        typeof window.supabaseChat.isConnected === 'function' && 
        window.supabaseChat.isConnected()) {
        // But default to false - only true combat when explicitly started
        return false;
    }
    return false;
}

function rollInitiativeForDexterity(dexterity) {
    console.log('🎲 rollInitiativeForDexterity called with dexterity:', dexterity);
    
    // Get character level for luck calculation
    const level = character.level || 1;
    const characterName = character.name || 'Unknown';
    
    console.log(`🎲 Character: ${characterName}, Level: ${level}, DEX: ${dexterity}`);
    
    // Calculate luck dice count (1d10 per 10 levels, rounded up)
    const luckDiceCount = Math.ceil(level / 10);
    
    // Roll d20 for initiative
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    
    // Roll luck dice
    let luckTotal = 0;
    const luckRolls = [];
    for (let i = 0; i < luckDiceCount; i++) {
        const luckRoll = Math.floor(Math.random() * 10) + 1;
        luckRolls.push(luckRoll);
        luckTotal += luckRoll;
    }
    
    // Calculate total initiative
    const totalInitiative = d20Roll + dexterity + luckTotal;
    
    // Format luck rolls display
    const luckDisplay = luckDiceCount > 0 ? ` + luck(${luckRolls.join('+')})` : '';
    const rollDetails = `d20(${d20Roll}) + DEX(${dexterity})${luckDisplay} = ${totalInitiative}`;
    
    // Add to roll history
    const rollData = {
        type: 'Initiative',
        name: 'Initiative Roll',
        diceRolls: [d20Roll, ...luckRolls],
        diceTotal: d20Roll + luckTotal,
        levelBonus: 0,
        statBonus: dexterity,
        finalTotal: totalInitiative,
        config: { luckDiceCount, luckRolls, details: rollDetails },
        timestamp: new Date().toLocaleTimeString()
    };

    character.rollHistory.unshift(rollData);
    if (character.rollHistory.length > 50) {
        character.rollHistory = character.rollHistory.slice(0, 50);
    }
    
    // Show initiative notification
    showNotification('roll', '🎲 Initiative Roll',
        `Total: ${totalInitiative}`,
        rollDetails);
    
    // Send to chat if connected
    if (typeof sendChatMessage === 'function') {
        const commandString = `INITIATIVE:${characterName}:${totalInitiative}:${rollDetails}`;
        console.log('🎲 Sending initiative command to chat:', commandString);
        sendChatMessage(commandString);
        console.log('🎲 Initiative command sent!');
    } else {
        console.error('🎲 sendChatMessage function not available!');
    }
    
    updateRollHistoryDisplay();
}

/**
 * Handle combat start command from StoryTeller
 */
function handleCombatStart() {
    console.log('🚨 handleCombatStart called!');
    window.combatModeActive = true;
    console.log('⚔️ Combat mode activated - DEX button will now roll initiative');
    console.log('⚔️ window.combatModeActive is now:', window.combatModeActive);
    
    // Show notification to player
    showNotification('combat', '⚔️ Combat Started!', 
        'Click your DEX attribute to roll initiative', 
        'The StoryTeller has initiated combat');
}

/**
 * Handle combat stop command from StoryTeller
 */
function handleCombatStop() {
    window.combatModeActive = false;
    console.log('🏁 Combat mode deactivated - DEX button back to normal attribute roll');
    
    // Show notification to player
    showNotification('combat', '🏁 Combat Ended', 
        'You can now rest and recover', 
        'Combat has concluded');
}

/**
 * Process combat-related commands received via chat
 * This should be called by the chat message processor
 */
function processCombatCommand(message) {
    console.log('🔍 processCombatCommand called with:', message);
    
    if (typeof message !== 'string') {
        console.log('🔍 Message is not a string, returning false');
        return false;
    }
    
    if (message.startsWith('COMBAT_START:')) {
        console.log('🔍 COMBAT_START detected, parsing target...');
        
        // Parse target from COMBAT_START:TARGET:message format
        const parts = message.split(':');
        if (parts.length >= 2) {
            const target = parts[1];
            const currentPlayerName = window.networkPlayerName || window.playerName || '';
            
            console.log('🔍 Combat command target:', target);
            console.log('🔍 Current player name:', currentPlayerName);
            
            // Check if this command is for us (ALL or our specific name)
            if (target === 'ALL' || target === currentPlayerName) {
                console.log('🔍 ✅ Command is for us, calling handleCombatStart()');
                handleCombatStart();
                return true;
            } else {
                console.log('🔍 ❌ Command not for us, ignoring');
                return false;
            }
        } else {
            console.log('🔍 ⚠️ Invalid COMBAT_START format, no target found');
            return false;
        }
    } else if (message.startsWith('COMBAT_STOP:') || message.startsWith('COMBAT_END:')) {
        console.log('🔍 COMBAT_STOP/END detected, parsing target...');
        
        // Parse target from COMBAT_STOP:TARGET:message or COMBAT_END:TARGET:message format
        const parts = message.split(':');
        if (parts.length >= 2) {
            const target = parts[1];
            const currentPlayerName = window.networkPlayerName || window.playerName || '';
            
            console.log('🔍 Combat stop/end command target:', target);
            console.log('🔍 Current player name:', currentPlayerName);
            
            // Check if this command is for us (ALL or our specific name)
            if (target === 'ALL' || target === currentPlayerName) {
                console.log('🔍 ✅ Stop/End command is for us, calling handleCombatStop()');
                handleCombatStop();
                return true;
            } else {
                console.log('🔍 ❌ Stop/End command not for us, ignoring');
                return false;
            }
        } else {
            console.log('🔍 ⚠️ Invalid COMBAT_STOP/END format, no target found');
            return false;
        }
    }
    
    console.log('🔍 No combat command match found');
    return false;
}

function rollSkill(skillName, statName, statValue) {
    const config = getDiceConfiguration(character.level);
    const diceRolls = rollDice(config.diceCount, config.diceType);
    const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
    const finalTotal = diceTotal + config.levelBonus + statValue;

    const rollData = {
        type: 'Skill',
        name: skillName,
        stat: statName.charAt(0).toUpperCase() + statName.slice(1),
        diceRolls: diceRolls,
        diceTotal: diceTotal,
        levelBonus: config.levelBonus,
        statBonus: statValue,
        finalTotal: finalTotal,
        config: config,
        timestamp: new Date().toLocaleTimeString()
    };

    character.rollHistory.unshift(rollData);
    if (character.rollHistory.length > 50) {
        character.rollHistory = character.rollHistory.slice(0, 50);
    }

    const diceDisplay = rollData.diceRolls.map(roll => `<span style="color: #f4d03f;">${roll}</span>`).join(' + ');
    showNotification('roll', `${rollData.type} Roll: ${rollData.name}`,
        `Total: ${rollData.finalTotal}`,
        `Dice: [${diceDisplay}] = ${rollData.diceTotal}<br>+ Level Bonus: ${rollData.levelBonus}<br>+ ${rollData.type} Bonus: ${rollData.statBonus}`);

    // Send skill roll to chat if in combat mode (useful for things like stealth, athletics, etc.)
    if (isInCombatMode() && typeof sendChatMessage === 'function') {
        const characterName = character.name || 'Unknown';
        const commandString = `ROLL:${characterName}:${skillName}:${rollData.finalTotal}:${rollData.stat}`;
        sendChatMessage(commandString);
    }

    updateRollHistoryDisplay();
}

// ========================================
// EQUIPMENT BONUS SYSTEM
// ========================================

// Get equipment bonuses from achievements and skills
function getEquipmentBonuses(itemName, itemType) {
    const bonuses = {
        damage: 0,
        toHit: 0,
        sources: []
    };

    // Check achievements for equipment bonuses
    if (character.achievements) {
        character.achievements.forEach(achievement => {
            const achievementBonuses = parseEquipmentBonuses(achievement.effect, itemName, itemType);
            if (achievementBonuses.damage > 0 || achievementBonuses.toHit > 0) {
                bonuses.damage += achievementBonuses.damage;
                bonuses.toHit += achievementBonuses.toHit;
                bonuses.sources.push({
                    type: 'achievement',
                    name: achievement.name,
                    damage: achievementBonuses.damage,
                    toHit: achievementBonuses.toHit
                });
            }
        });
    }

    // Check skills for equipment bonuses (future enhancement)
    // This could be expanded to check skill descriptions for equipment bonuses

    return bonuses;
}

// Parse equipment bonuses from text (achievements/skills)
function parseEquipmentBonuses(effectText, itemName, itemType) {
    const bonuses = { damage: 0, toHit: 0 };
    if (!effectText) return bonuses;

    const itemNameLower = itemName.toLowerCase();
    const itemTypeLower = itemType.toLowerCase();
    const effectLower = effectText.toLowerCase();

    // Patterns for equipment bonuses
    const bonusPatterns = [
        // Specific weapon bonuses: "+2 damage with Rusty Sword"
        new RegExp(`\\+(\\d+)\\s+damage\\s+with\\s+${itemNameLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'gi'),
        // Weapon type bonuses: "+1 to hit with swords", "+2 damage with ranged weapons"
        new RegExp(`\\+(\\d+)\\s+(?:to hit|hit)\\s+with\\s+.*${itemTypeLower}`, 'gi'),
        new RegExp(`\\+(\\d+)\\s+damage\\s+with\\s+.*${itemTypeLower}`, 'gi'),
        // General weapon bonuses: "+1 to all weapon attacks"
        /\+(\d+)\s+(?:to hit|hit)\s+(?:with\s+)?(?:all\s+)?weapons?/gi,
        /\+(\d+)\s+damage\s+(?:with\s+)?(?:all\s+)?weapons?/gi,
        // Shield bonuses for armor with "shield" in name
        ...(itemNameLower.includes('shield') ? [
            /\+(\d+)\s+(?:to\s+)?(?:ac|armor|protection)\s+(?:with\s+)?shields?/gi,
            /\+(\d+)\s+(?:to\s+)?defense\s+(?:with\s+)?shields?/gi
        ] : [])
    ];

    // Check for specific item name matches
    if (effectLower.includes(itemNameLower)) {
        const damageMatch = effectText.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?damage\\s+.*${itemNameLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'gi'));
        const hitMatch = effectText.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?hit\\s+.*${itemNameLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'gi'));
        
        if (damageMatch) bonuses.damage += parseInt(damageMatch[0].match(/\d+/)[0]);
        if (hitMatch) bonuses.toHit += parseInt(hitMatch[0].match(/\d+/)[0]);
    }

    // Check general patterns
    bonusPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(effectText)) !== null) {
            const bonus = parseInt(match[1]);
            if (pattern.source.includes('damage')) {
                bonuses.damage += bonus;
            } else if (pattern.source.includes('hit')) {
                bonuses.toHit += bonus;
            }
        }
    });

    return bonuses;
}

// Add visual indicators to equipment display
function addEquipmentBonusIndicators(itemElement, itemName, itemType) {
    const bonuses = getEquipmentBonuses(itemName, itemType);
    
    if (bonuses.sources.length > 0) {
        // Add bonus indicator
        const bonusIndicator = document.createElement('div');
        bonusIndicator.className = 'equipment-bonus-indicator';
        bonusIndicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: var(--primary-color);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            cursor: help;
            z-index: 2;
        `;
        bonusIndicator.textContent = '⚡';
        bonusIndicator.title = bonuses.sources.map(source => 
            `${source.name}: ${source.damage > 0 ? `+${source.damage} damage` : ''}${source.damage > 0 && source.toHit > 0 ? ', ' : ''}${source.toHit > 0 ? `+${source.toHit} to hit` : ''}`
        ).join('\n');
        
        // Make sure the item element has relative positioning
        itemElement.style.position = 'relative';
        itemElement.appendChild(bonusIndicator);
    }
}

function rollWeaponDamage(weaponId) {
    const weapon = getItemById(weaponId);
    if (!weapon) return;

    const weaponSize = weaponSizes[weapon.size] || weaponSizes.medium;
    const statUsed = weapon.ranged ? 'dexterity' : 'strength';

    // Get equipment bonuses
    const equipmentBonuses = getEquipmentBonuses(weapon.name, weapon.ranged ? 'ranged weapon' : 'melee weapon');

    // Roll to hit (with equipment bonuses)
    const toHitRoll = rollToHit(statUsed);
    toHitRoll.total += equipmentBonuses.toHit;
    toHitRoll.equipmentBonus = equipmentBonuses.toHit;

    // Roll damage
    const damageRoll = Math.floor(Math.random() * weaponSize.dice) + 1;
    let totalDamage = damageRoll + character.stats[statUsed] + equipmentBonuses.damage;

    // Apply critical hit bonus
    if (toHitRoll.isCrit) {
        totalDamage += 5;
    }

    const weaponData = {
        type: 'Weapon',
        name: weapon.name,
        weaponSize: weaponSize.name,
        statUsed: statUsed,
        damageRoll: damageRoll,
        statBonus: character.stats[statUsed],
        equipmentBonus: equipmentBonuses.damage,
        totalDamage: totalDamage,
        diceType: weaponSize.dice,
        isRanged: weapon.ranged,
        toHit: toHitRoll,
        equipmentBonusSources: equipmentBonuses.sources,
        timestamp: new Date().toLocaleTimeString()
    };

    character.rollHistory.unshift(weaponData);
    if (character.rollHistory.length > 50) {
        character.rollHistory = character.rollHistory.slice(0, 50);
    }

    // Build bonus description for notification
    const equipmentBonusText = equipmentBonuses.sources.length > 0 ? 
        `<br>Equipment Bonuses: ${equipmentBonuses.sources.map(s => `${s.name} (+${s.damage > 0 ? s.damage + ' dmg' : ''}${s.damage > 0 && s.toHit > 0 ? ', ' : ''}${s.toHit > 0 ? s.toHit + ' hit' : ''})`).join(', ')}` : '';

    showNotification('weapon', `${weaponData.name} Attack`,
        `${toHitRoll.isCrit ? '💥 CRITICAL HIT!' : 'Hit!'} Damage: ${weaponData.totalDamage}`,
        `To Hit: d10(${toHitRoll.d10Roll}) + ${statUsed.charAt(0).toUpperCase() + statUsed.slice(1)}(${toHitRoll.statBonus}) + Lv(${toHitRoll.levelBonus})${equipmentBonuses.toHit > 0 ? ` + Equipment(${equipmentBonuses.toHit})` : ''} = ${toHitRoll.total}<br>` +
        `Damage: d${weaponData.diceType}(${weaponData.damageRoll}) + ${weaponData.statUsed.charAt(0).toUpperCase() + weaponData.statUsed.slice(1)}(${weaponData.statBonus})${equipmentBonuses.damage > 0 ? ` + Equipment(${equipmentBonuses.damage})` : ''}${toHitRoll.isCrit ? ' + Crit(5)' : ''}<br>` +
        `${weaponData.weaponSize} ${weaponData.isRanged ? 'Ranged' : 'Melee'} Weapon${equipmentBonusText}`);

    // Send attack to chat if in combat mode
    if (isInCombatMode() && typeof sendChatMessage === 'function') {
        const characterName = character.name || 'Unknown';
        const commandString = `ATTACK:${characterName}:${toHitRoll.total}:${weaponData.totalDamage}:${weapon.name}`;
        sendChatMessage(commandString);
    }

    updateRollHistoryDisplay();
}

function updateDiceSystemInfo() {
    const diceExplanation = document.getElementById('dice-explanation');
    if (!diceExplanation) return;

    const config = getDiceConfiguration(character.level);

    let explanation = `<strong>Level ${character.level}:</strong> ${config.description}<br>`;
    explanation += `<em>Roll ${config.diceCount}d${config.diceType}, add ${config.levelBonus} (level bonus), plus attribute/skill bonus</em><br><br>`;

    explanation += '<strong>System Rules:</strong><br>';
    explanation += '• Levels 1-10: Roll 1d10 + level<br>';
    explanation += '• Levels 11-20: Roll 1d20 + level<br>';
    explanation += '• Levels 21+: Roll dice equal to tens digit (e.g., Level 34 = 3d10)<br>';
    explanation += '• Level 80+ capped at 8d10 maximum<br>';
    explanation += '• Always add the ones digit of your level as bonus<br><br>';

    explanation += '<strong>Weapon Damage:</strong><br>';
    explanation += '• Light weapons: 1d4 + stat<br>';
    explanation += '• Medium weapons: 1d6 + stat<br>';
    explanation += '• Heavy weapons: 1d8 + stat<br>';
    explanation += '• Melee weapons use Strength<br>';
    explanation += '• Ranged weapons use Dexterity';

    diceExplanation.innerHTML = explanation;
}


function updateRollHistoryDisplay() {
    const rollHistory = document.getElementById('roll-history');
    if (!rollHistory) return;

    if (character.rollHistory.length === 0) {
        rollHistory.innerHTML = `
            <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                <i class="ra ra-perspective-dice-six" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                No rolls yet! Click attributes, skills, weapons, or spells in the Character tab to start rolling.
            </div>
        `;
        return;
    }

    rollHistory.innerHTML = character.rollHistory.map((roll, index) => {
        let content = '';
        let typeIcon = '';
        let typeColor = '';

        if (roll.type === 'Weapon') {
            typeIcon = 'ra-sword';
            typeColor = '#d4af37';
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #d4af37; margin: 0; font-size: 14px;">
                        <i class="ra ${typeIcon}"></i> ${roll.name} Attack ${roll.toHit?.isCrit ? '💥' : ''}
                    </h4>
                    <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                </div>
                ${roll.toHit?.isCrit ? '<div style="color: #ffd700; font-weight: bold; font-size: 12px; margin-bottom: 5px;">CRITICAL HIT!</div>' : ''}
                <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                    To Hit: ${roll.toHit?.total || 'N/A'} | Damage: ${roll.totalDamage}
                </div>
                <div style="font-size: 12px; color: #c0c0c0;">
                    To Hit: d10(${roll.toHit?.d10Roll || '?'}) + ${roll.statUsed.substring(0, 3).toUpperCase()}(${roll.toHit?.statBonus || '?'}) + Lv(${roll.toHit?.levelBonus || '?'})<br>
                    Damage: d${roll.diceType}(${roll.damageRoll}) + ${roll.statUsed.substring(0, 3).toUpperCase()}(${roll.statBonus})${roll.toHit?.isCrit ? ' + Crit(5)' : ''}<br>
                    ${roll.weaponSize} ${roll.isRanged ? 'Ranged' : 'Melee'} Weapon
                </div>
            `;
        } else if (roll.type === 'Spell' && roll.toHit) {
            typeIcon = 'ra-lightning';
            typeColor = '#8a4a8a';
            const diceDisplay = roll.diceRolls ? roll.diceRolls.map(r => `<span style="color: #f4d03f;">${r}</span>`).join(' + ') : 'N/A';

            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #8a4a8a; margin: 0; font-size: 14px;">
                        <i class="ra ${typeIcon}"></i> ${roll.name} ${roll.toHit?.isCrit ? '💥' : ''}
                    </h4>
                    <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                </div>
                ${roll.toHit?.isCrit ? '<div style="color: #ffd700; font-weight: bold; font-size: 12px; margin-bottom: 5px;">CRITICAL HIT!</div>' : ''}
                <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                    ${roll.element} Magic | Cost: ${roll.cost} MP
                </div>
                <div style="font-size: 12px; color: #c0c0c0;">
                    ${roll.results ? roll.results.join('<br>') : 'Spell cast successfully!'}
                </div>
            `;
        } else if (roll.type === 'Spell') {
            // Non-damage spell
            typeIcon = 'ra-lightning';
            typeColor = '#8a4a8a';
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #8a4a8a; margin: 0; font-size: 14px;">
                        <i class="ra ${typeIcon}"></i> ${roll.name}
                    </h4>
                    <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                </div>
                <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                    ${roll.element} Magic | Cost: ${roll.cost} MP
                </div>
                <div style="font-size: 12px; color: #c0c0c0;">
                    ${roll.results ? roll.results.join('<br>') : 'Spell cast successfully!'}
                </div>
            `;
        } else {
            // Attribute/Skill rolls
            typeIcon = roll.type === 'Attribute' ? 'ra-muscle-up' : roll.type === 'Skill' ? 'ra-gear' : 'ra-lightning';
            typeColor = roll.type === 'Attribute' ? '#4a6a8a' : roll.type === 'Skill' ? '#4a8a4a' : '#8a4a8a';
            const diceDisplay = roll.diceRolls ? roll.diceRolls.map(r => `<span style="color: #f4d03f;">${r}</span>`).join(' + ') : 'N/A';

            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #f4d03f; margin: 0; font-size: 14px;">
                        <i class="ra ${typeIcon}"></i> ${roll.name} ${roll.type === 'Skill' ? `[${roll.stat}]` : ''}
                    </h4>
                    <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                </div>
                <div style="font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                    Result: ${roll.finalTotal}
                </div>
                <div style="font-size: 12px; color: #c0c0c0;">
                    ${roll.diceRolls ? `Dice: [${diceDisplay}] = ${roll.diceTotal} + Level: ${roll.levelBonus} + Bonus: ${roll.statBonus}` :
                    roll.results ? roll.results.join('<br>') : 'Spell cast successfully!'}
                </div>
            `;
        }

        return `
            <div style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid ${typeColor};">
                ${content}
            </div>
        `;
    }).join('');
    
    // Sync modal content if open
    syncModalContent();
    
    // Sync chat roll history if bottom sheet is open
    if (typeof updateChatRollHistory === 'function') {
        updateChatRollHistory();
    }
}

function clearRollHistory() {
    character.rollHistory = [];
    updateRollHistoryDisplay();
    // Sync modal content if open
    syncModalContent();
    
    // Sync chat roll history if function exists
    if (typeof updateChatRollHistory === 'function') {
        updateChatRollHistory();
    }
}

// ========================================
// ACHIEVEMENT SYSTEM
// ========================================

// Calculate rarity chances based on character level (designed for levels 1-50+)
function getAchievementRarityChances(level) {
    // Base chances - common is always most likely
    let commonChance = Math.max(50 - level, 20); // 50% at level 1, down to 20% at level 30+
    let uncommonChance = Math.min(20 + level * 0.5, 35); // 20% at level 1, up to 35% at level 30
    let rareChance = Math.min(5 + level * 0.4, 25); // 5% at level 1, up to 25% at level 50
    let epicChance = Math.min(Math.max(level - 10, 0) * 0.3, 15); // 0% before level 10, up to 15% at level 50
    let legendaryChance = Math.min(Math.max(level - 20, 0) * 0.2, 5); // 0% before level 20, up to 5% at level 45

    // Normalize to 100%
    const total = commonChance + uncommonChance + rareChance + epicChance + legendaryChance;
    if (total > 0) {
        commonChance = (commonChance / total) * 100;
        uncommonChance = (uncommonChance / total) * 100;
        rareChance = (rareChance / total) * 100;
        epicChance = (epicChance / total) * 100;
        legendaryChance = (legendaryChance / total) * 100;
    }

    return { commonChance, uncommonChance, rareChance, epicChance, legendaryChance };
}

// Select 3 achievements based on level and rarity
async function selectAchievementsForLevel(level) {
    // Ensure achievements are loaded
    await loadAchievements();
    
    if (!achievementsData) {
        console.error('Achievements data not properly loaded');
        return [];
    }

    // Gather all available achievements from all categories
    const allAchievements = [];
    
    // Add achievements from all available categories
    if (achievementsData.general) allAchievements.push(...achievementsData.general);
    if (achievementsData.skill_based) allAchievements.push(...achievementsData.skill_based);
    if (achievementsData.race_based) allAchievements.push(...achievementsData.race_based);
    if (achievementsData.class_based) allAchievements.push(...achievementsData.class_based);
    if (achievementsData.weapon_based) allAchievements.push(...achievementsData.weapon_based);
    if (achievementsData.absurd) allAchievements.push(...achievementsData.absurd);
    if (achievementsData.legendary) allAchievements.push(...achievementsData.legendary);
    
    if (allAchievements.length === 0) {
        console.warn('No achievements found in loaded data');
        return [];
    }

    console.log(`🎯 Found ${allAchievements.length} total achievements for level ${level} selection`);

    const rarityChances = getAchievementRarityChances(level);
    const selectedAchievements = [];

    for (let i = 0; i < 3; i++) {
        const roll = Math.random() * 100;
        let targetRarity = 'common';

        if (roll <= rarityChances.legendaryChance) targetRarity = 'legendary';
        else if (roll <= rarityChances.legendaryChance + rarityChances.epicChance) targetRarity = 'epic';
        else if (roll <= rarityChances.legendaryChance + rarityChances.epicChance + rarityChances.rareChance) targetRarity = 'rare';
        else if (roll <= 100 - rarityChances.commonChance) targetRarity = 'uncommon';

        // Filter achievements by rarity
        const availableAchievements = allAchievements.filter(achievement => 
            achievement.rarity === targetRarity && 
            !selectedAchievements.find(selected => selected.id === achievement.id)
        );

        if (availableAchievements.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableAchievements.length);
            selectedAchievements.push(availableAchievements[randomIndex]);
        } else {
            // Fallback to any available achievement
            const fallbackAchievements = allAchievements.filter(achievement => 
                !selectedAchievements.find(selected => selected.id === achievement.id)
            );
            if (fallbackAchievements.length > 0) {
                const randomIndex = Math.floor(Math.random() * fallbackAchievements.length);
                selectedAchievements.push(fallbackAchievements[randomIndex]);
            }
        }
    }

    console.log(`🏆 Selected ${selectedAchievements.length} achievements:`, selectedAchievements.map(a => `${a.name} (${a.rarity})`));
    return selectedAchievements;
}

// Get rarity color for UI display
function getRarityColor(rarity) {
    switch (rarity) {
        case 'common': return '#8a8a8a';
        case 'uncommon': return '#4a8a4a';
        case 'rare': return '#4a6a8a';
        case 'epic': return '#8a4a8a';
        case 'legendary': return '#f4d03f';
        default: return '#8a8a8a';
    }
}

// Render achievements in the level-up modal
async function renderLevelUpAchievements(level) {
    const achievementsGrid = document.getElementById('levelup-achievements-grid');
    if (!achievementsGrid) return;

    const selectedAchievements = await selectAchievementsForLevel(level);
    achievementsGrid.innerHTML = '';

    selectedAchievements.forEach(achievement => {
        const rarityColor = getRarityColor(achievement.rarity);
        const achievementDiv = document.createElement('div');
        achievementDiv.className = 'levelup-achievement-item';
        achievementDiv.style.cssText = `
            border: 2px solid var(--border-color);
            border-radius: var(--radius-sm);
            padding: var(--spacing-sm);
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--bg-secondary);
            margin-bottom: var(--spacing-xs);
        `;

        achievementDiv.innerHTML = `
            <div class="achievement-name" style="font-weight: bold; color: ${rarityColor}; margin-bottom: 4px;">
                <i class="ra ra-medal"></i> ${achievement.name}
            </div>
            <div class="achievement-rarity" style="font-size: 11px; color: ${rarityColor}; text-transform: uppercase; margin-bottom: 6px;">
                ${achievement.rarity}
            </div>
            <div class="achievement-description" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                ${achievement.description}
            </div>
            <div class="achievement-effect" style="font-size: 12px; color: var(--primary-color); font-weight: bold;">
                ${achievement.effect}
            </div>
        `;

        achievementDiv.onclick = () => selectLevelUpAchievementInModal(achievement);
        achievementsGrid.appendChild(achievementDiv);
    });
}

// Select achievement in modal
window.selectLevelUpAchievementInModal = function(achievement) {
    // Remove previous selection styling
    document.querySelectorAll('.levelup-achievement-item').forEach(item => {
        item.style.borderColor = 'var(--border-color)';
        item.style.background = 'var(--bg-secondary)';
    });

    // Add selection styling to clicked achievement
    event.target.closest('.levelup-achievement-item').style.borderColor = 'var(--primary-color)';
    event.target.closest('.levelup-achievement-item').style.background = 'rgba(var(--primary-rgb), 0.1)';

    // Store selected achievement
    window.selectedLevelUpAchievement = achievement;

    // Update display
    const selectedDisplay = document.getElementById('selected-achievement-display');
    if (selectedDisplay) {
        selectedDisplay.textContent = achievement.name;
        selectedDisplay.parentElement.style.display = 'block';
    }

    // Update confirm button state
    updateLevelUpConfirmButton();
};

// Update the confirm button based on selections
function updateLevelUpConfirmButton() {
    const confirmBtn = document.getElementById('confirm-levelup-btn');
    const remainingPoints = parseInt(document.getElementById('levelup-points-remaining').textContent);
    
    if (!confirmBtn) return;

    let canConfirm = remainingPoints === 0;
    
    // Check if on a skill level and skill is required but not selected
    const isSkillLevel = document.getElementById('skill-selection-section') && 
                        document.getElementById('skill-selection-section').style.display !== 'none';
    
    if (isSkillLevel && !window.selectedLevelUpSkill) {
        canConfirm = false;
    }

    // Always require achievement selection now
    if (!window.selectedLevelUpAchievement) {
        canConfirm = false;
    }

    confirmBtn.disabled = !canConfirm;
    confirmBtn.style.opacity = canConfirm ? '1' : '0.5';
}

// ========================================
// LEVEL UP SYSTEM
// ========================================
async function handleLevelUp() {
    await levelUp();
}

async function levelUp() {
    // Calculate points from race and class
    let pointsGained = 0;
    let levelUpBonuses = [];

    // Get race bonuses for level up (if any - could expand this)
    if (character.race && races[character.race]) {
        // For now, races don't give level up bonuses, but we could add this
    }

    // Get class bonuses for level up
    if (character.class && classes[character.class]) {
        pointsGained += 3; // Standard 3 points per level
        levelUpBonuses.push(`+3 Attribute Points (Class: ${classes[character.class].name})`);
    } else if (character.customClass) {
        pointsGained += 3;
        levelUpBonuses.push(`+3 Attribute Points (Class: ${character.customClass})`);
    } else {
        pointsGained += 3; // Default if no class
        levelUpBonuses.push(`+3 Attribute Points (Base Level Up)`);
    }

    // Check if it's a skill level (every 3rd level)
    const newLevel = character.level + 1;
    const isSkillLevel = newLevel % 3 === 0;

    // Use the new streamlined level up system
    await showLevelUpModal(newLevel);
}

// OLD LEVEL UP SYSTEM - REPLACED BY levelSystem.js
function showLevelUpModal_OLD(pointsGained, bonuses, isSkillLevel, newLevel) {
    // Remove any existing modal
    const existingModal = document.querySelector('.level-up-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'level-up-modal-overlay';
    modal.onclick = (e) => {
        if (e.target === modal) e.preventDefault(); // Can't close by clicking outside
    };

    const modalContent = document.createElement('div');
    modalContent.className = 'level-up-modal-content';

    // Create temporary stats for preview
    const tempStats = { ...character.stats };
    let tempAvailablePoints = pointsGained;

    const createStatRow = (stat) => {
        const currentValue = tempStats[stat];
        const maxValue = character.statMaximums[stat];

        return `
                    <div class="level-up-stat-row">
                        <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                        <div class="stat-controls">
                            <button class="control-btn" onclick="adjustLevelUpStat('${stat}', -1)" 
                                    ${currentValue <= character.stats[stat] ? 'disabled' : ''}>-</button>
                            <div class="stat-value">
                                <span id="levelup-${stat}-current">${currentValue}</span>
                                <span class="stat-max">/ ${maxValue}</span>
                            </div>
                            <button class="control-btn" onclick="adjustLevelUpStat('${stat}', 1)" 
                                    ${currentValue >= maxValue || tempAvailablePoints <= 0 ? 'disabled' : ''}>+</button>
                        </div>
                        <div class="stat-change" id="levelup-${stat}-change">
                            ${currentValue > character.stats[stat] ? `+${currentValue - character.stats[stat]}` : ''}
                        </div>
                    </div>
                `;
    };

    modalContent.innerHTML = `
                <div class="modal-header level-up-header">
                    <h3><i class="ra ra-trophy"></i> Level Up!</h3>
                    <div class="level-display">Level ${character.level} → ${newLevel}</div>
                </div>
                <div class="modal-body">
                    <div class="level-up-bonuses">
                        ${bonuses.map(bonus => `<div class="bonus-item">${bonus}</div>`).join('')}
                    </div>
                    
                    <div class="level-up-points">
                        <h4>Distribute Attribute Points</h4>
                        <div class="points-remaining">
                            Points Remaining: <span id="levelup-points-remaining">${tempAvailablePoints}</span>
                        </div>
                    </div>
                    
                    <div class="level-up-stats">
                        ${Object.keys(character.stats).map(stat => createStatRow(stat)).join('')}
                    </div>
                    
                    <div class="level-up-rewards-section">
                        <h4><i class="ra ra-star"></i> Level ${newLevel} Rewards</h4>
                        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">Choose your rewards for reaching level ${newLevel}:</p>
                        
                        <!-- Tab Navigation -->
                        <div class="reward-tabs" style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: var(--spacing-md);">
                            <button class="reward-tab" id="achievement-tab" onclick="switchRewardTab('achievement')" 
                                    style="flex: 1; padding: var(--spacing-sm); border: none; background: var(--primary-color); color: white; cursor: pointer; border-radius: var(--radius-sm) var(--radius-sm) 0 0;">
                                <i class="ra ra-medal"></i> Achievement
                            </button>
                            ${isSkillLevel ? `
                                <button class="reward-tab" id="skill-tab" onclick="switchRewardTab('skill')" 
                                        style="flex: 1; padding: var(--spacing-sm); border: none; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; border-radius: var(--radius-sm) var(--radius-sm) 0 0;">
                                    <i class="ra ra-gears"></i> New Skill
                                </button>
                            ` : ''}
                        </div>
                        
                        <!-- Achievement Selection -->
                        <div id="achievement-selection-section">
                            <h5 style="color: var(--primary-color); margin-bottom: var(--spacing-sm);">Choose an Achievement:</h5>
                            <div class="achievement-selector-container" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: var(--spacing-sm);">
                                <div id="levelup-achievements-grid" class="levelup-achievements-grid">
                                    <!-- Achievements will be rendered here -->
                                </div>
                            </div>
                            <div class="selected-levelup-achievement" id="selected-levelup-achievement" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); display: none;">
                                <strong>Selected Achievement:</strong> <span id="selected-achievement-display">None</span>
                            </div>
                        </div>
                        
                        <!-- Skill Selection (only on skill levels) -->
                        ${isSkillLevel ? `
                            <div id="skill-selection-section" style="display: none;">
                                <h5 style="color: var(--primary-color); margin-bottom: var(--spacing-sm);">Choose a New Skill:</h5>
                                <div class="skill-selector-container" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: var(--spacing-sm);">
                                    <div id="levelup-skills-grid" class="levelup-skills-grid">
                                        <!-- Skills will be rendered here -->
                                    </div>
                                </div>
                                <div class="selected-levelup-skill" id="selected-levelup-skill" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); display: none;">
                                    <strong>Selected Skill:</strong> <span id="selected-skill-display">None</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="level-up-preview">
                        <h4>Preview</h4>
                        <div class="preview-stats">
                            <div>HP: ${character.healthPoints} → <span id="levelup-hp-preview">${tempStats.constitution + newLevel}</span></div>
                            <div>MP: ${character.magicPoints} → <span id="levelup-mp-preview">${tempStats.wisdom + tempStats.intelligence}</span></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="confirmLevelUp(${newLevel}, ${isSkillLevel})" 
                            id="confirm-levelup-btn" ${tempAvailablePoints > 0 ? 'disabled' : ''}>
                        <i class="ra ra-check"></i> Confirm Level Up
                    </button>
                </div>
            `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Store temp stats globally for the modal functions
    window.tempLevelUpStats = tempStats;
    window.tempLevelUpPoints = tempAvailablePoints;
    window.originalStats = { ...character.stats };
    window.selectedLevelUpSkill = null;
    window.selectedLevelUpAchievement = null;
    
    // Always render achievements first (default tab)
    renderLevelUpAchievements(newLevel);
    
    // If it's a skill level, render the skills too (but start with achievement tab)
    if (isSkillLevel) {
        renderLevelUpSkills();
    }
}

// Global functions for level-up modal
window.switchRewardTab = function(tabType) {
    const achievementTab = document.getElementById('achievement-tab');
    const skillTab = document.getElementById('skill-tab');
    const achievementSection = document.getElementById('achievement-selection-section');
    const skillSection = document.getElementById('skill-selection-section');
    
    if (tabType === 'achievement') {
        // Style achievement tab as active
        achievementTab.style.background = 'var(--primary-color)';
        achievementTab.style.color = 'white';
        
        // Style skill tab as inactive
        if (skillTab) {
            skillTab.style.background = 'var(--bg-secondary)';
            skillTab.style.color = 'var(--text-primary)';
        }
        
        // Show/hide sections
        achievementSection.style.display = 'block';
        if (skillSection) skillSection.style.display = 'none';
        
    } else if (tabType === 'skill') {
        // Style skill tab as active
        if (skillTab) {
            skillTab.style.background = 'var(--primary-color)';
            skillTab.style.color = 'white';
        }
        
        // Style achievement tab as inactive
        achievementTab.style.background = 'var(--bg-secondary)';
        achievementTab.style.color = 'var(--text-primary)';
        
        // Show/hide sections
        if (skillSection) skillSection.style.display = 'block';
        achievementSection.style.display = 'none';
    }
    
    updateLevelUpConfirmButton();
};

window.selectRewardType = function(type) {
    // This function is now replaced by switchRewardTab, but keeping for backward compatibility
    switchRewardTab(type);
};

function renderLevelUpSkills() {
    const skillsGrid = document.getElementById('levelup-skills-grid');
    if (!skillsGrid) return;
    
    skillsGrid.innerHTML = '';
    
    // Get available skills (same logic as character creation)
    let availableSkills = {};
    
    // Get skills from skills.json if available
    if (typeof skills !== 'undefined' && skills.skills) {
        Object.values(skills.skills).forEach(category => {
            if (category.skills) {
                Object.values(category.skills).forEach(skill => {
                    // Only show skills the player doesn't already have
                    const hasSkill = character.customSkills.some(cs => cs.name === skill.name);
                    if (!hasSkill) {
                        availableSkills[skill.name] = {
                            stat: skill.stat,
                            description: skill.description || 'A useful skill for adventurers'
                        };
                    }
                });
            }
        });
    }
    
    // Add DCC skills they don't have
    if (typeof dccSkills !== 'undefined') {
        Object.entries(dccSkills).forEach(([skillName, skillStat]) => {
            const hasSkill = character.customSkills.some(cs => cs.name === skillName);
            if (!hasSkill && !availableSkills[skillName]) {
                availableSkills[skillName] = {
                    stat: skillStat,
                    description: getSkillDescription(skillName, skillStat)
                };
            }
        });
    }
    
    // Get bonuses to check for double bonuses
    const jobBonuses = getSelectedJobBonuses();
    const classBonuses = getSelectedClassBonuses();
    
    Object.entries(availableSkills).forEach(([skillName, skillData]) => {
        // Check if this skill gets double bonus
        const jobBonus = jobBonuses[skillData.stat] || 0;
        const classBonus = classBonuses[skillData.stat] || 0;
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const skillItem = document.createElement('div');
        skillItem.className = 'levelup-skill-item';
        skillItem.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            padding: var(--spacing-sm);
            margin-bottom: var(--spacing-xs);
            cursor: pointer;
            transition: all var(--transition-base);
        `;
        
        skillItem.onclick = () => selectLevelUpSkillInModal(skillName, skillData.stat);
        
        skillItem.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 2px;">${skillName}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2px;">
                [${skillData.stat.substring(0, 3).toUpperCase()}] ${hasDoubleBonus ? '<span style="color: #ffd700;">+2 Bonus!</span>' : ''}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">${skillData.description}</div>
        `;
        
        skillsGrid.appendChild(skillItem);
    });
}

window.selectLevelUpSkillInModal = function(skillName, skillStat) {
    // Update selection
    window.selectedLevelUpSkill = { name: skillName, stat: skillStat };
    
    // Update visual selection
    document.querySelectorAll('.levelup-skill-item').forEach(item => {
        item.style.borderColor = 'var(--border-color)';
        item.style.background = 'var(--bg-secondary)';
    });
    
    event.target.closest('.levelup-skill-item').style.borderColor = 'var(--primary-color)';
    event.target.closest('.levelup-skill-item').style.background = 'rgba(var(--primary-rgb), 0.1)';
    
    // Update selected skill display
    const selectedDisplay = document.getElementById('selected-levelup-skill');
    const skillDisplay = document.getElementById('selected-skill-display');
    if (selectedDisplay && skillDisplay) {
        selectedDisplay.style.display = 'block';
        skillDisplay.textContent = `${skillName} [${skillStat.substring(0, 3).toUpperCase()}]`;
    }
};

window.adjustLevelUpStat = function (stat, change) {
    const currentValue = window.tempLevelUpStats[stat];
    const newValue = currentValue + change;
    const maxValue = character.statMaximums[stat];
    const originalValue = window.originalStats[stat];

    if (change > 0 && window.tempLevelUpPoints > 0 && newValue <= maxValue) {
        window.tempLevelUpStats[stat] = newValue;
        window.tempLevelUpPoints--;
    } else if (change < 0 && currentValue > originalValue) {
        window.tempLevelUpStats[stat] = newValue;
        window.tempLevelUpPoints++;
    }

    // Update display
    document.getElementById(`levelup-${stat}-current`).textContent = window.tempLevelUpStats[stat];
    document.getElementById(`levelup-points-remaining`).textContent = window.tempLevelUpPoints;

    // Update change display
    const changeElement = document.getElementById(`levelup-${stat}-change`);
    const diff = window.tempLevelUpStats[stat] - originalValue;
    changeElement.textContent = diff > 0 ? `+${diff}` : '';

    // Update all buttons
    Object.keys(character.stats).forEach(s => {
        const minusBtn = document.querySelector(`button[onclick="adjustLevelUpStat('${s}', -1)"]`);
        const plusBtn = document.querySelector(`button[onclick="adjustLevelUpStat('${s}', 1)"]`);

        minusBtn.disabled = window.tempLevelUpStats[s] <= window.originalStats[s];
        plusBtn.disabled = window.tempLevelUpStats[s] >= character.statMaximums[s] || window.tempLevelUpPoints <= 0;
    });

    // Update HP/MP preview
    const newLevel = character.level + 1;
    document.getElementById('levelup-hp-preview').textContent = window.tempLevelUpStats.constitution + newLevel;
    document.getElementById('levelup-mp-preview').textContent = window.tempLevelUpStats.wisdom + window.tempLevelUpStats.intelligence;

    // Enable/disable confirm button
    updateLevelUpConfirmButton();
};

window.confirmLevelUp = function (newLevel, isSkillLevel) {
    // Always require achievement selection
    if (!window.selectedLevelUpAchievement) {
        alert('Please select an achievement for your level ' + newLevel + ' reward!');
        return;
    }

    // Validate skill selection if it's a skill level and we're on the skill tab
    if (isSkillLevel) {
        const skillSection = document.getElementById('skill-selection-section');
        const isOnSkillTab = skillSection && skillSection.style.display !== 'none';
        
        if (isOnSkillTab && !window.selectedLevelUpSkill) {
            alert('Please select a skill for your level ' + newLevel + ' reward!');
            return;
        }
    }

    // Apply the level up - first copy the base stats
    character.level = newLevel;
    character.stats = { ...window.tempLevelUpStats };

    // Add achievement (always) and apply its effects
    if (!character.achievements) {
        character.achievements = [];
    }
    character.achievements.push({
        ...window.selectedLevelUpAchievement,
        earnedAt: newLevel,
        earnedDate: new Date().toISOString()
    });

    // Apply achievement effects using the proper achievement system
    if (window.applyAchievementEffects && window.selectedLevelUpAchievement) {
        applyAchievementEffects(character, window.selectedLevelUpAchievement);
    }
    
    // Add skill if applicable and selected
    const skillSection = document.getElementById('skill-selection-section');
    const isOnSkillTab = skillSection && skillSection.style.display !== 'none';
    
    if (isSkillLevel && isOnSkillTab && window.selectedLevelUpSkill) {
        character.customSkills.push({
            name: window.selectedLevelUpSkill.name,
            stat: window.selectedLevelUpSkill.stat,
            source: 'levelup'
        });
    }

    // Update HP and MP
    updateHealthMagicDisplay();

    // Update level display
    document.getElementById('char-level').value = newLevel;

    // Re-render everything
    renderStats();
    renderCharacterSkills();
    updateCharacterDisplay();
    updateDiceSystemInfo();

    // Show notification
    const skillMessage = (isSkillLevel && isOnSkillTab && window.selectedLevelUpSkill) ? ` | New skill: ${window.selectedLevelUpSkill.name}!` : '';
    const achievementMessage = window.selectedLevelUpAchievement ? ` | Achievement: ${window.selectedLevelUpAchievement.name}!` : '';
    // const grantedSkillsMessage = grantedSkills.length > 0 ? ` | Granted skills: ${grantedSkills.join(', ')}!` : '';
    
    showNotification('level', 'Level Up Complete!',
        `You are now level ${newLevel}!`,
        `HP: ${character.healthPoints} | MP: ${character.magicPoints}${skillMessage}${achievementMessage}`);

    // Close modal
    document.querySelector('.level-up-modal-overlay').remove();

    // Clean up temp variables
    delete window.tempLevelUpStats;
    delete window.tempLevelUpPoints;
    delete window.originalStats;
};

// ========================================
// ACHIEVEMENT SKILL PROCESSING
// ========================================

// Parse achievement effects and grant referenced skills
function processAchievementSkills(achievement) {
    if (!achievement || !achievement.effect) return;

    // Regular expressions to match skill bonuses in achievement effects
    const skillPatterns = [
        /\+(\d+) to ([^,]+?) skill/gi,  // "+3 to Pathfinder skill"
        /\+(\d+) to ([^,]+) skill/gi,   // "+2 to Basic Electrical Repair skill"
    ];

    const grantedSkills = [];
    
    skillPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(achievement.effect)) !== null) {
            const bonus = parseInt(match[1]);
            const skillName = match[2].trim();
            
            // Check if player already has this skill
            const hasSkill = character.customSkills.some(skill => 
                skill.name.toLowerCase() === skillName.toLowerCase()
            );
            
            if (!hasSkill) {
                // Determine the appropriate stat for this skill
                const skillStat = determineSkillStat(skillName);
                
                // Add the skill to the character
                character.customSkills.push({
                    name: skillName,
                    stat: skillStat,
                    source: 'achievement',
                    grantedBy: achievement.name
                });
                
                grantedSkills.push(skillName);
                console.log(`🎯 Achievement "${achievement.name}" granted skill: ${skillName} (${skillStat})`);
            }
        }
    });
    
    return grantedSkills;
}

// Determine the most appropriate stat for a skill based on its name and existing skill mappings
function determineSkillStat(skillName) {
    // First check if it matches a standard D&D skill
    const standardSkillMatch = Object.keys(standardSkills).find(skill => 
        skill.toLowerCase() === skillName.toLowerCase()
    );
    if (standardSkillMatch) {
        return standardSkills[standardSkillMatch];
    }
    
    // Check DCC skills if available
    if (typeof dccSkills !== 'undefined') {
        const dccSkillMatch = Object.keys(dccSkills).find(skill => 
            skill.toLowerCase() === skillName.toLowerCase()
        );
        if (dccSkillMatch) {
            return dccSkills[dccSkillMatch];
        }
    }
    
    // Skill name-based heuristics for common patterns
    const skillNameLower = skillName.toLowerCase();
    
    // Physical/Combat skills -> Strength or Dexterity
    if (skillNameLower.includes('combat') || skillNameLower.includes('weapon') || 
        skillNameLower.includes('martial') || skillNameLower.includes('fighting')) {
        return 'strength';
    }
    
    // Stealth/Agility skills -> Dexterity
    if (skillNameLower.includes('stealth') || skillNameLower.includes('agility') || 
        skillNameLower.includes('reflexes') || skillNameLower.includes('acrobat') ||
        skillNameLower.includes('dodge') || skillNameLower.includes('quick')) {
        return 'dexterity';
    }
    
    // Survival/Health skills -> Constitution
    if (skillNameLower.includes('survival') || skillNameLower.includes('endurance') || 
        skillNameLower.includes('stomach') || skillNameLower.includes('hardy') ||
        skillNameLower.includes('tough') || skillNameLower.includes('cockroach')) {
        return 'constitution';
    }
    
    // Knowledge/Technical skills -> Intelligence
    if (skillNameLower.includes('knowledge') || skillNameLower.includes('technical') || 
        skillNameLower.includes('electrical') || skillNameLower.includes('computer') ||
        skillNameLower.includes('engineering') || skillNameLower.includes('science') ||
        skillNameLower.includes('repair') || skillNameLower.includes('programming') ||
        skillNameLower.includes('ied') || skillNameLower.includes('bomb') ||
        skillNameLower.includes('remote') || skillNameLower.includes('operating')) {
        return 'intelligence';
    }
    
    // Perception/Wisdom skills -> Wisdom
    if (skillNameLower.includes('perception') || skillNameLower.includes('aware') || 
        skillNameLower.includes('insight') || skillNameLower.includes('pathfinder') ||
        skillNameLower.includes('navigation') || skillNameLower.includes('tracking') ||
        skillNameLower.includes('medicine') || skillNameLower.includes('animal')) {
        return 'wisdom';
    }
    
    // Social/Performance skills -> Charisma
    if (skillNameLower.includes('social') || skillNameLower.includes('persuasion') || 
        skillNameLower.includes('performance') || skillNameLower.includes('actor') ||
        skillNameLower.includes('charm') || skillNameLower.includes('vampire') ||
        skillNameLower.includes('deception') || skillNameLower.includes('intimidation') ||
        skillNameLower.includes('leadership')) {
        return 'charisma';
    }
    
    // Default to Intelligence for unknown skills
    console.log(`⚠️ Unknown skill type for "${skillName}", defaulting to Intelligence`);
    return 'intelligence';
}

// ========================================
// STATUS EFFECTS SYSTEM
// ========================================

// OLD DROPDOWN-BASED SYSTEM - COMMENTED OUT FOR NEW BUTTON SYSTEM
/*
function addStatusEffect() {
    const effectType = document.getElementById('status-effect-type').value;
    const duration = parseInt(document.getElementById('status-duration').value) || 10;
    const notes = document.getElementById('status-notes').value.trim();
    const customName = document.getElementById('custom-status-name').value.trim();

    let effectName = effectType;
    let effectIcon = '';

    const selectElement = document.getElementById('status-effect-type');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const optionText = selectedOption.textContent;
    
    // Extract icon (first character) and name (everything after the first space)
    if (optionText.includes(' ')) {
        effectIcon = optionText.split(' ')[0];
        effectName = optionText.substring(optionText.indexOf(' ') + 1);
    } else {
        effectIcon = '⚙️';
        effectName = optionText;
    }

    if (effectType === 'custom' && customName) {
        effectName = customName;
        effectIcon = '⚙️';
    } else if (effectType === 'custom' && !customName) {
        alert('Please enter a name for the custom effect.');
        return;
    }

    const statusEffect = {
        id: generateId(),
        type: effectType,
        name: effectName,
        icon: effectIcon,
        duration: duration,
        notes: notes,
        startTime: Date.now()
    };

    character.statusEffects.push(statusEffect);

    document.getElementById('status-duration').value = '10';
    document.getElementById('status-notes').value = '';
    document.getElementById('custom-status-name').value = '';
    document.getElementById('custom-status-name').style.display = 'none';
    document.getElementById('status-effect-type').value = 'bleeding';

    renderStatusEffects();
    startHeaderStatusTimer(); // Start the header timer when effects are added
}
*/

// OLD Modal-specific status effect function (COMMENTED OUT - replaced with button system)
/*
function addModalStatusEffect() {
    const effectType = document.getElementById('modal-status-effect-type').value;
    const duration = parseInt(document.getElementById('modal-status-duration').value) || 10;
    const notes = document.getElementById('modal-status-notes').value.trim();
    const customName = document.getElementById('modal-custom-status-name').value.trim();

    console.log('Modal Debug - effectType:', effectType);
    console.log('Modal Debug - duration:', duration);
    console.log('Modal Debug - notes:', notes);

    let effectName = effectType;
    let effectIcon = '';

    const selectElement = document.getElementById('modal-status-effect-type');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const optionText = selectedOption.textContent;
    
    console.log('Modal Debug - selectedOption:', selectedOption);
    console.log('Modal Debug - optionText:', optionText);
    
    // Extract icon (first character) and name (everything after the first space)
    if (optionText.includes(' ')) {
        effectIcon = optionText.split(' ')[0];
        effectName = optionText.substring(optionText.indexOf(' ') + 1);
    } else {
        effectIcon = '⚙️';
        effectName = optionText;
    }

    console.log('Modal Debug - extracted effectIcon:', effectIcon);
    console.log('Modal Debug - extracted effectName:', effectName);

    if (effectType === 'custom' && customName) {
        effectName = customName;
        effectIcon = '⚙️';
    } else if (effectType === 'custom' && !customName) {
        alert('Please enter a name for the custom effect.');
        return;
    }

    console.log('Modal Debug - final effectIcon:', effectIcon);
    console.log('Modal Debug - final effectName:', effectName);

    const statusEffect = {
        id: generateId(),
        type: effectType,
        name: effectName,
        icon: effectIcon,
        duration: duration,
        notes: notes,
        startTime: Date.now()
    };

    character.statusEffects.push(statusEffect);

    // Reset modal form
    document.getElementById('modal-status-duration').value = '10';
    document.getElementById('modal-status-notes').value = '';
    document.getElementById('modal-custom-status-name').value = '';
    document.getElementById('modal-custom-status-name').style.display = 'none';
    document.getElementById('modal-status-effect-type').value = 'bleeding';

    renderStatusEffects();
    startHeaderStatusTimer(); // Start the header timer when effects are added
}
*/

// NEW Button-based modal status effect system
let selectedModalStatusEffect = null;

function selectModalStatusEffect(effectType, effectName, effectIcon) {
    // Remove previous selection
    document.querySelectorAll('.modal-status-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select current button
    const selectedBtn = document.querySelector(`[onclick*="${effectType}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // Store selection
    selectedModalStatusEffect = {
        type: effectType,
        name: effectName,
        icon: effectIcon
    };
    
    // Show/hide custom name input
    const customNameInput = document.getElementById('modal-custom-status-name');
    if (effectType === 'custom') {
        customNameInput.style.display = 'block';
        customNameInput.focus();
    } else {
        customNameInput.style.display = 'none';
        customNameInput.value = '';
    }
}

function applyModalStatusEffect() {
    if (!selectedModalStatusEffect) {
        alert('Please select a status effect first.');
        return;
    }
    
    const duration = parseInt(document.getElementById('modal-status-duration').value) || 10;
    const notes = document.getElementById('modal-status-notes').value.trim();
    const customName = document.getElementById('modal-custom-status-name').value.trim();
    
    let effectName = selectedModalStatusEffect.name;
    let effectIcon = selectedModalStatusEffect.icon;
    
    if (selectedModalStatusEffect.type === 'custom') {
        if (!customName) {
            alert('Please enter a name for the custom effect.');
            return;
        }
        effectName = customName;
        effectIcon = '⚙️';
    }
    
    const statusEffect = {
        id: generateId(),
        type: selectedModalStatusEffect.type,
        name: effectName,
        icon: effectIcon,
        duration: duration,
        notes: notes,
        startTime: Date.now()
    };

    character.statusEffects.push(statusEffect);

    // Reset form
    document.getElementById('modal-status-duration').value = '10';
    document.getElementById('modal-status-notes').value = '';
    document.getElementById('modal-custom-status-name').value = '';
    document.getElementById('modal-custom-status-name').style.display = 'none';
    
    // Clear selection
    document.querySelectorAll('.modal-status-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedModalStatusEffect = null;

    renderStatusEffects();
    startHeaderStatusTimer();
    
    // Close the modal after successfully applying the effect
    closeStatusEffectsModal();
}

function removeStatusEffect(effectId) {
    character.statusEffects = character.statusEffects.filter(effect => effect.id !== effectId);
    renderStatusEffects();
    
    // Stop header timer if no more effects
    if (character.statusEffects.length === 0) {
        stopHeaderStatusTimer();
    }
}

function updateStatusTimers() {
    let expiredEffects = [];

    character.statusEffects.forEach(effect => {
        const timeElapsed = Math.floor((Date.now() - effect.startTime) / 60000);
        if (timeElapsed >= effect.duration) {
            expiredEffects.push(effect);
        }
    });

    if (expiredEffects.length > 0) {
        expiredEffects.forEach(effect => {
            showNotification('status', 'Status Effect Ended',
                `${effect.icon} ${effect.name} has worn off!`,
                `Effect duration has expired. You may feel the effects fading away.`);

            // Remove the expired effect
            character.statusEffects = character.statusEffects.filter(e => e.id !== effect.id);
        });

        renderStatusEffects();
        
        // Stop header timer if all effects have expired
        if (character.statusEffects.length === 0) {
            stopHeaderStatusTimer();
        }
    }
}

function renderStatusEffects() {
    const statusGrid = document.getElementById('status-effects-grid');
    if (!statusGrid) return;

    statusGrid.innerHTML = '';

    if (character.statusEffects.length === 0) {
        statusGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-heart" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No active status effects. You're feeling healthy!
                    </div>
                `;
        return;
    }

    character.statusEffects.forEach(effect => {
        const timeElapsed = Math.floor((Date.now() - effect.startTime) / 60000);
        const timeRemaining = Math.max(0, effect.duration - timeElapsed);

        const effectDiv = document.createElement('div');
        effectDiv.style.cssText = `
                    background: rgba(40, 40, 60, 0.8);
                    border: 1px solid #8a4a4a;
                    border-radius: 8px;
                    padding: 15px;
                    position: relative;
                    border-left: 4px solid ${timeRemaining <= 1 ? '#ff6b6b' : '#8a4a4a'};
                `;

        effectDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <h4 style="color: #ff6b6b; margin: 0; font-size: 14px;">
                            ${effect.icon} ${effect.name}
                        </h4>
                        <button onclick="removeStatusEffect('${effect.id}')" 
                                style="background: #8a4a4a; border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 10px;">×</button>
                    </div>
                    
                    <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 8px;">
                        ${effect.notes || 'No additional notes'}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 11px; color: #8a8a8a;">
                            ${timeRemaining > 0 ? `${timeRemaining}m remaining` : 'EXPIRED'}
                        </div>
                        <div style="width: 60px; height: 4px; background: #3a3a5a; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${(timeRemaining / effect.duration) * 100}%; height: 100%; background: ${timeRemaining <= 1 ? '#ff6b6b' : '#4a8a4a'}; transition: all 0.3s ease;"></div>
                        </div>
                    </div>
                `;

        statusGrid.appendChild(effectDiv);
    });
    
    // Update header display after rendering
    updateHeaderStatusDisplay();
    
    // Sync modal content if open
    syncModalContent();
}

// ========================================
// HEADER STATUS EFFECTS DISPLAY
// ========================================
function updateHeaderStatusDisplay() {
    const headerContainer = document.getElementById('status-header-container');
    if (!headerContainer) return;

    headerContainer.innerHTML = '';

    if (!character.statusEffects || character.statusEffects.length === 0) {
        return;
    }

    character.statusEffects.forEach(effect => {
        const timeElapsed = Math.floor((Date.now() - effect.startTime) / 60000);
        const timeRemaining = Math.max(0, effect.duration - timeElapsed);
        
        if (timeRemaining <= 0) return; // Skip expired effects

        const progressPercent = (timeRemaining / effect.duration) * 100;
        const isCritical = timeRemaining <= 2; // Last 2 minutes are critical

        const statusItem = document.createElement('div');
        statusItem.className = `status-header-item ${isCritical ? 'critical' : ''}`;
        statusItem.style.position = 'relative';
        statusItem.style.overflow = 'hidden';

        const minutes = Math.floor(timeRemaining);
        const seconds = Math.floor((timeRemaining % 1) * 60);
        const timeDisplay = minutes > 0 ? `${minutes}m` : `${seconds}s`;

        statusItem.innerHTML = `
            <span class="status-header-icon">${effect.icon}</span>
            <span class="status-header-name" title="${effect.name}">${effect.name}</span>
            <span class="status-header-timer">${timeDisplay}</span>
            <div class="status-progress-bar" style="width: ${progressPercent}%"></div>
        `;

        headerContainer.appendChild(statusItem);
    });
}

function startHeaderStatusTimer() {
    // Update header display every second for more accurate countdown
    if (window.statusHeaderTimer) {
        clearInterval(window.statusHeaderTimer);
    }
    
    window.statusHeaderTimer = setInterval(() => {
        updateHeaderStatusDisplay();
        
        // Also check for expired effects more frequently
        updateStatusTimers();
    }, 1000);
}

function stopHeaderStatusTimer() {
    if (window.statusHeaderTimer) {
        clearInterval(window.statusHeaderTimer);
        window.statusHeaderTimer = null;
    }
}

// ========================================
// SAVE/LOAD SYSTEM
// ========================================

function saveCharacter() {
    // Apply selected skills to character before saving
    applySelectedSkillsToCharacter();
    
    // Use the new storage-based save
    if (typeof saveCharacterToStorage === 'function') {
        saveCharacterToStorage();
    } else {
        // Fallback to JSON export if character manager not loaded
        exportCharacterToJSON();
    }
}

function loadCharacter() {
    // Use the new storage-based load
    if (typeof loadCharacterFromStorage === 'function') {
        loadCharacterFromStorage();
    } else {
        // Fallback to JSON import if character manager not loaded
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        character = JSON.parse(e.target.result);

                        // Ensure all properties exist for backward compatibility
                        if (!character.personal) character.personal = { age: '', backstory: '', portrait: null };
                        if (!character.jobBonuses) character.jobBonuses = [];
                        if (!character.classBonuses) character.classBonuses = [];
                        if (!character.raceBonuses) character.raceBonuses = [];
                        if (!character.customSkills) character.customSkills = [];
                        if (!character.customJobData) character.customJobData = { selectedStats: [], skills: [] };
                        if (!character.customClassData) character.customClassData = { selectedStats: [], skills: [] };
                        if (!character.customRaceData) character.customRaceData = { selectedStats: [], skills: [], maximums: {} };
                        if (!character.rollHistory) character.rollHistory = [];
                        if (!character.spells) character.spells = [];
                        if (!character.inventory) character.inventory = [];
                        if (!character.equipment) character.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
                        if (!character.statusEffects) character.statusEffects = [];
                        if (!character.notes) character.notes = { personal: '', party: '', session: '', barter: '', world: '', combat: '' };
                        if (!character.statMaximums) character.statMaximums = {
                            strength: 15, dexterity: 15, constitution: 15,
                            intelligence: 15, wisdom: 15, charisma: 15
                        };
                        if (!character.race) character.race = '';
                        if (!character.customRace) character.customRace = '';

                        // Update UI elements
                        document.getElementById('char-name').value = character.name || '';
                        document.getElementById('char-level').value = character.level || 1;
                        document.getElementById('char-age').value = character.personal?.age || '';
                        document.getElementById('char-backstory').value = character.personal?.backstory || '';

                        // Handle portrait
                        if (character.personal?.portrait) {
                            const portraitDisplay = document.getElementById('portrait-display');
                            portraitDisplay.innerHTML = `<img src="${character.personal.portrait}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                        }

                        // Handle race selection and restore custom data
                        if (character.race) {
                            document.getElementById('race-select').value = character.race;
                        } else if (character.customRace) {
                            document.getElementById('race-select').value = 'custom';
                            document.getElementById('custom-race').style.display = 'block';
                            document.getElementById('custom-race').value = character.customRace;
                            document.getElementById('custom-race-bonuses').style.display = 'block';

                            if (character.customRaceData && character.customRaceData.selectedStats) {
                                character.customRaceData.selectedStats.forEach(stat => {
                                    const checkbox = document.getElementById(`custom-race-${stat}`);
                                    if (checkbox) checkbox.checked = true;
                                });
                            }

                            if (character.customRaceData && character.customRaceData.maximums) {
                                Object.entries(character.customRaceData.maximums).forEach(([stat, max]) => {
                                    const shortStat = stat.substring(0, 3);
                                    const input = document.getElementById(`custom-race-max-${shortStat}`);
                                    if (input) input.value = max;
                                });
                            }
                        }

                        // Handle job selection and restore custom data
                        if (character.job) {
                            document.getElementById('job-select').value = character.job;
                        } else if (character.customJob) {
                            document.getElementById('job-select').value = 'custom';
                            document.getElementById('custom-job').style.display = 'block';
                            document.getElementById('custom-job').value = character.customJob;
                            document.getElementById('custom-job-bonuses').style.display = 'block';

                            if (character.customJobData && character.customJobData.selectedStats) {
                                character.customJobData.selectedStats.forEach(stat => {
                                    const checkbox = document.getElementById(`custom-job-${stat}`);
                                    if (checkbox) checkbox.checked = true;
                                });
                            }
                        }

                        // Handle class selection and restore custom data
                        if (character.class) {
                            document.getElementById('class-select').value = character.class;
                        } else if (character.customClass) {
                            document.getElementById('class-select').value = 'custom_class';
                            document.getElementById('custom-class').style.display = 'block';
                            document.getElementById('custom-class').value = character.customClass;
                            document.getElementById('custom-class-bonuses').style.display = 'block';

                            if (character.customClassData && character.customClassData.selectedStats) {
                                character.customClassData.selectedStats.forEach(stat => {
                                    const checkbox = document.getElementById(`custom-class-${stat}`);
                                    if (checkbox) checkbox.checked = true;
                                });
                            }
                        }

                        // Re-render everything
                        renderStats();
                        renderCharacterSkills();
                        renderCharacterSpells();
                        renderCharacterWeapons();
                        renderInventory();
                        renderEquipment();
                        updateHealthMagicDisplay();
                        updateCharacterDisplay();
                        updateBonusesDisplay();
                        renderSpells();
                        updateMagicTabDisplay();

                    } catch (error) {
                        alert('Error loading character file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// ========================================
// INITIALIZATION
// ========================================
// ========================================
// SKILLS SELECTION SYSTEM
// ========================================
let selectedSkills = [];
const MAX_SELECTED_SKILLS = 5;

function initializeSkillsSelection() {
    // Initialize skills tabs
    document.querySelectorAll('.skills-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.skillsTab;
            switchSkillsTab(targetTab);
        });
    });
    
    // Initialize filters
    document.getElementById('skills-filter-stat').addEventListener('change', filterSkills);
    document.getElementById('skills-search').addEventListener('input', filterSkills);
    
    // Render available skills
    renderAvailableSkills();
    updateSelectedSkillsDisplay();
}

function switchSkillsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.skills-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.skillsTab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.skills-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-skills-tab`);
    });
}

function renderAvailableSkills() {
    const skillsGrid = document.getElementById('skills-selection-grid');
    if (!skillsGrid) return;
    
    skillsGrid.innerHTML = '';
    
    // Get skills from multiple sources
    let availableSkills = {};
    
    // First, try to load from skills.json structure
    if (typeof skills !== 'undefined' && skills.skills) {
        Object.values(skills.skills).forEach(category => {
            if (category.skills) {
                Object.values(category.skills).forEach(skill => {
                    availableSkills[skill.name] = {
                        stat: skill.stat,
                        description: skill.description || 'A useful skill for adventurers'
                    };
                });
            }
        });
    }
    
    // Then add DCC skills from improvements.js if available
    if (typeof dccSkills !== 'undefined') {
        Object.entries(dccSkills).forEach(([skillName, skillStat]) => {
            if (!availableSkills[skillName]) {
                // Add description based on skill name and type
                let description = getSkillDescription(skillName, skillStat);
                availableSkills[skillName] = {
                    stat: skillStat,
                    description: description
                };
            }
        });
    }
    
    // Add some basic D&D skills if nothing else is available
    if (Object.keys(availableSkills).length === 0) {
        availableSkills = {
            'Stealth': { stat: 'dexterity', description: 'Move silently and hide from enemies' },
            'Athletics': { stat: 'strength', description: 'Climb, jump, and perform physical feats' },
            'Persuasion': { stat: 'charisma', description: 'Convince others through charm and logic' },
            'Investigation': { stat: 'intelligence', description: 'Search for clues and analyze evidence' },
            'Perception': { stat: 'wisdom', description: 'Notice hidden details and detect danger' },
            'Survival': { stat: 'wisdom', description: 'Navigate wilderness and find food/shelter' },
            'Lockpicking': { stat: 'dexterity', description: 'Open locks and disable mechanical traps' },
            'Medicine': { stat: 'wisdom', description: 'Treat wounds and diagnose illnesses' },
            'Technology': { stat: 'intelligence', description: 'Operate and repair technological devices' },
            'Intimidation': { stat: 'charisma', description: 'Frighten or coerce through threats' }
        };
    }
    
    // Get bonuses to check for double bonuses
    const jobBonuses = getSelectedJobBonuses();
    const classBonuses = getSelectedClassBonuses();
    
    Object.entries(availableSkills).forEach(([skillName, skillData]) => {
        const isSelected = selectedSkills.some(skill => skill.name === skillName);
        const canSelect = selectedSkills.length < MAX_SELECTED_SKILLS || isSelected;
        
        // Check if this skill gets double bonus
        const jobBonus = jobBonuses[skillData.stat] || 0;
        const classBonus = classBonuses[skillData.stat] || 0;
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const skillItem = document.createElement('div');
        skillItem.className = `skill-selection-item ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`;
        
        skillItem.innerHTML = `
            <input type="checkbox" class="skill-selection-checkbox" 
                   ${isSelected ? 'checked' : ''} 
                   ${!canSelect ? 'disabled' : ''}
                   onchange="toggleSkillSelection('${skillName}', '${skillData.stat}', this.checked)">
            <div class="skill-selection-info">
                <div class="skill-selection-name">${skillName}</div>
                <div class="skill-selection-stat">[${skillData.stat.substring(0, 3).toUpperCase()}]</div>
                <div class="skill-selection-description">${skillData.description}</div>
            </div>
            ${hasDoubleBonus ? '<span class="skill-selection-bonus">+2 Bonus!</span>' : ''}
        `;
        
        skillsGrid.appendChild(skillItem);
    });
    
    // Apply current filters
    filterSkills();
}

// Helper function to generate descriptions for DCC skills
function getSkillDescription(skillName, skillStat) {
    const descriptions = {
        // Combat Skills
        'Powerful Strike': 'Devastating melee attacks that break through armor',
        'Iron Punch': 'Unarmed combat expertise with deadly fists',
        'Back Claw': 'Sneaky rear attacks that bypass defenses',
        'Smush': 'Overwhelming crushing attacks that flatten enemies',
        'Pugilism': 'Professional boxing and ring fighting techniques',
        'Aiming': 'Precision targeting for critical ranged attacks',
        'Soul Reaper': 'Dark magic that drains enemy life force',
        'Catcher': 'Intercepting projectiles and thrown objects',
        'Cesta Punta': 'Jai alai sport techniques adapted for combat',
        'Light on Your Feet': 'Enhanced agility and movement speed',
        'Cat-like Reflexes': 'Lightning-fast reaction times',
        
        // Survival Skills
        'Breathing': 'Controlled breathing for stamina and endurance',
        'Iron Stomach': 'Resistance to poisons and inedible food',
        'Regeneration': 'Accelerated healing and injury recovery',
        'Nine Lives': 'Supernatural survival instincts',
        'Night Vision': 'Enhanced vision in low-light conditions',
        'Acute Ears': 'Exceptional hearing for detecting danger',
        'Pathfinder': 'Navigation and wilderness survival',
        'Mind Balance': 'Mental stability and focus under pressure',
        
        // Technical Skills
        'Basic Electrical Repair': 'Fix and maintain electrical systems',
        'IED': 'Improvised explosive device creation and disposal',
        'Incendiary Device Handling': 'Safe handling of fire-based weapons',
        'Bomb Surgeon': 'Expert bomb disposal and defusing',
        'Metal Detecting': 'Finding hidden metal objects and treasure',
        'Biplane Pilot': 'Flying vintage aircraft and aerial maneuvers',
        'Chopper Pilot': 'Helicopter operation and combat flying',
        'Infusion': 'Magical item enhancement and enchantment',
        
        // Social Skills
        'Character Actor': 'Convincing disguises and role-playing',
        'Love Vampire': 'Charming and manipulating through attraction',
        'Mascot': 'Inspiring allies and boosting team morale',
        'Negotiation': 'Diplomatic bargaining and deal-making',
        'Marked For Death': 'Surviving when targeted for assassination',
        
        // Absurd DCC Skills
        'Cockroach': 'Surviving impossible situations like a cockroach',
        'Frogger': 'Dodging through traffic and moving obstacles',
        'Operating Sony RMVLZ620 Universal Remote': 'Mastering complex remote controls',
        'Lacing Boots': 'Quickly and efficiently tying footwear',
        'Scutelliphily': 'Collecting and identifying shields and emblems',
        'Crowd Blast': 'Managing and controlling large groups',
        'Backfire': 'Surviving when plans go horribly wrong',
        'Walk on Air': 'Mystical levitation and air walking',
        'Tent the House': 'Pest control and fumigation expertise'
    };
    
    return descriptions[skillName] || `A specialized ${skillStat}-based skill for adventurers`;
}

function toggleSkillSelection(skillName, skillStat, isChecked) {
    if (isChecked) {
        if (selectedSkills.length < MAX_SELECTED_SKILLS) {
            selectedSkills.push({ name: skillName, stat: skillStat, source: 'selected' });
        } else {
            // Revert checkbox if limit reached
            event.target.checked = false;
            showNotification('error', 'Skill Limit Reached', 
                `You can only select ${MAX_SELECTED_SKILLS} skills.`, 
                'Remove a skill first if you want to select a different one.');
            return;
        }
    } else {
        selectedSkills = selectedSkills.filter(skill => skill.name !== skillName);
    }
    
    updateSelectedSkillsDisplay();
    updateSkillsCounter();
    renderAvailableSkills(); // Re-render to update disabled states
}

function updateSelectedSkillsDisplay() {
    const selectedGrid = document.getElementById('selected-skills-grid');
    if (!selectedGrid) return;
    
    selectedGrid.innerHTML = '';
    
    if (selectedSkills.length === 0) {
        selectedGrid.innerHTML = `
            <div class="no-skills-message">
                <i class="ra ra-help"></i>
                <p>No skills selected yet. Choose up to 5 skills above!</p>
            </div>
        `;
        return;
    }
    
    // Get bonuses to check for double bonuses
    const jobBonuses = getSelectedJobBonuses();
    const classBonuses = getSelectedClassBonuses();
    
    selectedSkills.forEach((skill, index) => {
        // Check if this skill gets double bonus
        const jobBonus = jobBonuses[skill.stat] || 0;
        const classBonus = classBonuses[skill.stat] || 0;
        const hasDoubleBonus = (jobBonus !== 0 && classBonus !== 0);
        
        const skillItem = document.createElement('div');
        skillItem.className = `selected-skill-item ${hasDoubleBonus ? 'double-bonus' : ''}`;
        
        skillItem.innerHTML = `
            <div class="selected-skill-info">
                <div class="selected-skill-name">${skill.name}</div>
                <div class="selected-skill-stat">[${skill.stat.substring(0, 3).toUpperCase()}] ${hasDoubleBonus ? '+2 Bonus!' : ''}</div>
            </div>
            <button class="remove-skill-btn" onclick="removeSelectedSkill(${index})" title="Remove skill">
                <span class="material-icons">close</span>
            </button>
        `;
        
        selectedGrid.appendChild(skillItem);
    });
}

function removeSelectedSkill(index) {
    selectedSkills.splice(index, 1);
    updateSelectedSkillsDisplay();
    updateSkillsCounter();
    renderAvailableSkills(); // Re-render to update checkboxes
}

function updateSkillsCounter() {
    const counter = document.getElementById('selected-skills-count');
    if (counter) {
        counter.textContent = selectedSkills.length;
    }
}

function filterSkills() {
    const statFilter = document.getElementById('skills-filter-stat').value;
    const searchText = document.getElementById('skills-search').value.toLowerCase();
    
    document.querySelectorAll('.skill-selection-item').forEach(item => {
        const skillName = item.querySelector('.skill-selection-name').textContent.toLowerCase();
        const skillStat = item.querySelector('.skill-selection-stat').textContent.toLowerCase();
        
        const matchesSearch = skillName.includes(searchText);
        const matchesStat = !statFilter || skillStat.includes(statFilter.substring(0, 3));
        
        item.style.display = (matchesSearch && matchesStat) ? 'flex' : 'none';
    });
}

function addCustomSkillToSelection() {
    const nameInput = document.getElementById('custom-skill-name');
    const statSelect = document.getElementById('custom-skill-stat');
    
    const skillName = nameInput.value.trim();
    const skillStat = statSelect.value;
    
    if (!skillName) {
        showNotification('error', 'Invalid Skill', 'Please enter a skill name.', '');
        return;
    }
    
    if (selectedSkills.length >= MAX_SELECTED_SKILLS) {
        showNotification('error', 'Skill Limit Reached', 
            `You can only select ${MAX_SELECTED_SKILLS} skills.`, 
            'Remove a skill first if you want to add a custom one.');
        return;
    }
    
    // Check if skill already exists
    if (selectedSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
        showNotification('error', 'Duplicate Skill', 'This skill is already selected.', '');
        return;
    }
    
    // Add custom skill
    selectedSkills.push({ name: skillName, stat: skillStat, source: 'custom' });
    
    // Clear form
    nameInput.value = '';
    statSelect.value = 'strength';
    
    updateSelectedSkillsDisplay();
    updateSkillsCounter();
    renderAvailableSkills();
    
    showNotification('success', 'Custom Skill Added', 
        `${skillName} has been added to your skills.`, '');
}

// Apply selected skills to character
function applySelectedSkillsToCharacter() {
    // Clear existing selected skills
    character.customSkills = character.customSkills.filter(skill => skill.source !== 'selected' && skill.source !== 'custom');
    
    // Add selected skills to character
    selectedSkills.forEach(skill => {
        character.customSkills.push({
            name: skill.name,
            stat: skill.stat,
            source: skill.source
        });
    });
    
    // Re-render character skills
    renderCharacterSkills();
}

// ========================================
// GAME REFERENCE SYSTEM
// ========================================

let gameReferenceLoaded = false;

// Simple markdown parser for basic formatting
function parseMarkdown(text) {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```[\s\S]*?```/g, function(match) {
        const code = match.replace(/```/g, '').trim();
        return `<pre><code>${code}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    
    // Lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Numbered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, function(match) {
        if (!match.includes('<ul>')) {
            return '<ol>' + match + '</ol>';
        }
        return match;
    });
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    
    return html;
}

// Load and display the game reference markdown
async function loadGameReference() {
    if (gameReferenceLoaded) {
        return; // Already loaded
    }
    
    const loadingElement = document.querySelector('.reference-loading');
    const contentElement = document.getElementById('reference-content');
    
    try {
        loadingElement.style.display = 'flex';
        contentElement.style.display = 'none';
        
        const response = await fetch('./game-reference.md');
        if (!response.ok) {
            throw new Error(`Failed to load reference: ${response.status}`);
        }
        
        const markdownText = await response.text();
        const htmlContent = parseMarkdown(markdownText);
        
        contentElement.innerHTML = htmlContent;
        
        // Hide loading and show content
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';
        
        gameReferenceLoaded = true;
        
    } catch (error) {
        console.error('Error loading game reference:', error);
        loadingElement.innerHTML = `
            <div style="text-align: center; color: var(--error);">
                <i class="material-icons" style="font-size: 2rem; margin-bottom: 1rem;">error_outline</i>
                <p>Failed to load game reference</p>
                <p style="font-size: 0.9em; opacity: 0.7;">Check your internet connection and try again</p>
            </div>
        `;
    }
}

// ========================================
// INITIALIZATION
// ========================================

function initializeCharacterSheet() {
    renderStats();
    renderCharacterSkills();
    renderCharacterSpells();
    renderCharacterWeapons();
    renderInventory();
    renderEquipment();
    updateHealthMagicDisplay();

    // Event listeners
    document.getElementById('char-level').addEventListener('input', updateCharacterLevel);
    document.getElementById('char-name').addEventListener('input', updateCharacterName);
    document.getElementById('portrait-upload').addEventListener('change', handlePortraitUpload);
    document.getElementById('race-select').addEventListener('change', handleRaceSelection);
    document.getElementById('job-select').addEventListener('change', handleJobSelection);
    document.getElementById('class-select').addEventListener('change', handleClassSelection);
    document.getElementById('custom-race').addEventListener('input', updateCustomRace);
    document.getElementById('custom-job').addEventListener('input', updateCustomJob);
    document.getElementById('custom-class').addEventListener('input', updateCustomClass);

    // Custom skill dropdown listeners
    ['custom-race-skill1', 'custom-race-skill2', 'custom-job-skill1', 'custom-job-skill2', 'custom-class-skill1', 'custom-class-skill2'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', function () {
                const nameInput = document.getElementById(id + '-name');
                if (this.value === 'custom') {
                    nameInput.style.display = 'block';
                } else {
                    nameInput.style.display = 'none';
                    nameInput.value = '';
                }

                if (id.includes('race')) {
                    updateCustomRaceBonuses();
                } else if (id.includes('job')) {
                    updateCustomJobBonuses();
                } else {
                    updateCustomClassBonuses();
                }
            });
        }
    });

    // Custom skill name input listeners
    ['custom-race-skill1-name', 'custom-race-skill2-name', 'custom-job-skill1-name', 'custom-job-skill2-name', 'custom-class-skill1-name', 'custom-class-skill2-name'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function () {
                if (id.includes('race')) {
                    updateCustomRaceBonuses();
                } else if (id.includes('job')) {
                    updateCustomJobBonuses();
                } else {
                    updateCustomClassBonuses();
                }
            });
        }
    });

    // Custom race max stat listeners
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const input = document.getElementById(`custom-race-max-${stat}`);
        if (input) {
            input.addEventListener('input', updateCustomRaceBonuses);
        }
    });

    // Magic system event listeners
    const magicInputs = ['damage-type', 'damage-amount', 'healing-type', 'healing-amount', 'primary-effect', 'secondary-effect'];
    magicInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateSpellCost);
            element.addEventListener('input', calculateSpellCost);
        }
    });

    // consumable healing items (check if element exists - may be commented out)
    const itemTypeElement = document.getElementById('item-type');
    if (itemTypeElement) {
        itemTypeElement.addEventListener('change', function () {
            const healingContainer = document.getElementById('healing-consumable-container');
            if (healingContainer) {
                if (this.value === 'consumable') {
                    healingContainer.style.display = 'flex';
                } else {
                    healingContainer.style.display = 'none';
                }
            }
        });
    }

    // Enable/disable amount inputs based on type selection
    const damageTypeElement = document.getElementById('damage-type');
    if (damageTypeElement) {
        damageTypeElement.addEventListener('change', function () {
            const amountInput = document.getElementById('damage-amount');
            if (amountInput) {
                if (this.value === 'fixed') {
                    amountInput.disabled = false;
                    amountInput.value = amountInput.value || '2';
                } else {
                    amountInput.disabled = true;
                    amountInput.value = '0';
                }
                calculateSpellCost();
            }
        });
    }

    const healingTypeElement = document.getElementById('healing-type');
    if (healingTypeElement) {
        healingTypeElement.addEventListener('change', function () {
            const amountInput = document.getElementById('healing-amount');
            if (amountInput) {
                if (this.value === 'fixed') {
                    amountInput.disabled = false;
                    amountInput.value = amountInput.value || '2';
                } else {
                    amountInput.disabled = true;
                    amountInput.value = '0';
                }
                calculateSpellCost();
            }
        });
    }

    // Tab switching - supports both bottom tabs and sidebar tabs
    document.querySelectorAll('.tab-btn, .sidebar-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(tab.dataset.tab);
        });
    });

    // Sub-tab switching for character tab
    document.querySelectorAll('.char-sub-tab').forEach(subTab => {
        subTab.addEventListener('click', (e) => {
            switchCharSubTab(subTab.dataset.subTab);
        });
    });

    // Status effects event listeners (COMMENTED OUT - old dropdown system)
    /*
    const statusEffectType = document.getElementById('status-effect-type');
    if (statusEffectType) {
        statusEffectType.addEventListener('change', function () {
            const customNameInput = document.getElementById('custom-status-name');
            if (this.value === 'custom') {
                customNameInput.style.display = 'block';
            } else {
                customNameInput.style.display = 'none';
                customNameInput.value = '';
            }
        });
    }
    */

    // OLD Modal status effects event listeners (COMMENTED OUT - replaced with button system)
    /*
    const modalStatusEffectType = document.getElementById('modal-status-effect-type');
    if (modalStatusEffectType) {
        modalStatusEffectType.addEventListener('change', function () {
            const customNameInput = document.getElementById('modal-custom-status-name');
            if (this.value === 'custom') {
                customNameInput.style.display = 'block';
            } else {
                customNameInput.style.display = 'none';
                customNameInput.value = '';
            }
        });
    }
    */

    // Start the status effect timer - checks every minute
    setInterval(updateStatusTimers, 60000);
    
    // Initialize header status display and start timer if effects exist
    renderStatusEffects(); // This will call updateHeaderStatusDisplay
    if (character.statusEffects && character.statusEffects.length > 0) {
        startHeaderStatusTimer();
    }
    
    // Initialize skills selection system
    initializeSkillsSelection();

    // Initialize achievements system
    loadAchievements();

    // Initialize auto-save for notes
    autoSaveNotes();
}

// ========================================
// FLOATING MODALS FOR ROLL HISTORY & STATUS EFFECTS
// ========================================

function showRollHistoryModal() {
    const modal = document.getElementById('roll-history-modal');
    const modalContent = document.getElementById('roll-history-modal-content');
    const originalContent = document.getElementById('roll-history');
    
    // Copy the current roll history content
    modalContent.innerHTML = originalContent.innerHTML;
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Add click outside to close functionality
    const clickOutsideHandler = (event) => {
        if (event.target === modal) {
            closeRollHistoryModal();
        }
    };
    modal.addEventListener('click', clickOutsideHandler);
    
    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeRollHistoryModal();
            document.removeEventListener('keydown', escapeHandler);
            modal.removeEventListener('click', clickOutsideHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    console.log('Roll History modal opened');
}

function closeRollHistoryModal() {
    const modal = document.getElementById('roll-history-modal');
    modal.style.display = 'none';
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = '';
    
    console.log('Roll History modal closed');
}

function showStatusEffectsModal() {
    const modal = document.getElementById('status-effects-modal');
    const modalContent = document.getElementById('status-effects-modal-content');
    
    const originalGrid = document.getElementById('status-effects-grid');
    
    // Copy only the current status effects display (not the form)
    modalContent.innerHTML = originalGrid.innerHTML;
    
    // DON'T copy the old form - keep the new button-based modal form that's already in the HTML
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Add click outside to close functionality
    const clickOutsideHandler = (event) => {
        if (event.target === modal) {
            closeStatusEffectsModal();
        }
    };
    modal.addEventListener('click', clickOutsideHandler);
    
    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeStatusEffectsModal();
            document.removeEventListener('keydown', escapeHandler);
            modal.removeEventListener('click', clickOutsideHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    console.log('Status Effects modal opened');
}

function closeStatusEffectsModal() {
    const modal = document.getElementById('status-effects-modal');
    modal.style.display = 'none';
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = '';
    
    console.log('Status Effects modal closed');
}

// Helper function to sync modal content when data updates
function syncModalContent() {
    // Sync roll history modal if open
    const rollModal = document.getElementById('roll-history-modal');
    if (rollModal && rollModal.style.display === 'flex') {
        const modalContent = document.getElementById('roll-history-modal-content');
        const originalContent = document.getElementById('roll-history');
        modalContent.innerHTML = originalContent.innerHTML;
    }
    
    // Sync status effects modal if open
    const statusModal = document.getElementById('status-effects-modal');
    if (statusModal && statusModal.style.display === 'flex') {
        const modalContent = document.getElementById('status-effects-modal-content');
        const modalFormContent = document.getElementById('status-effects-form-modal-content');
        const originalGrid = document.getElementById('status-effects-grid');
        const originalForm = document.querySelector('.add-status-section');
        
        modalContent.innerHTML = originalGrid.innerHTML;
        if (originalForm) {
            modalFormContent.innerHTML = originalForm.outerHTML;
        }
    }
}

// ========================================
// ACHIEVEMENTS MODAL
// ========================================

function getRarityIcon(rarity) {
    const rarityLower = (rarity || 'common').toLowerCase();
    
    const rarityMap = {
        'common': { icon: 'military_tech', class: 'rarity-common' },
        'uncommon': { icon: 'military_tech', class: 'rarity-uncommon' },
        'rare': { icon: 'military_tech', class: 'rarity-rare' },
        'epic': { icon: 'military_tech', class: 'rarity-epic' },
        'legendary': { icon: 'military_tech', class: 'rarity-legendary' },
        'ultra rare': { icon: 'military_tech', class: 'rarity-ultra-rare' },
        'ultra-rare': { icon: 'military_tech', class: 'rarity-ultra-rare' },
        'celestial': { icon: 'military_tech', class: 'rarity-celestial' }
    };
    
    return rarityMap[rarityLower] || rarityMap['common'];
}

function showAchievementsModal() {
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Create a simple achievements modal
    const modal = document.createElement('div');
    modal.className = 'modal achievement-modal level-up-modal-overlay';
    modal.style.display = 'flex';
    
    const achievements = character.achievements || [];
    let achievementsList = '';
    
    if (achievements.length === 0) {
        achievementsList = `
            <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                <i class="ra ra-trophy" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                No achievements yet! Level up and explore to unlock achievements.
            </div>
        `;
    } else {
        achievementsList = achievements.map(achievement => {
            const rarity = achievement.rarity || 'Common';
            const rarityInfo = getRarityIcon(rarity);
            
            return `
            <div style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid #ffd700;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #ffd700; margin: 0; font-size: 14px;">
                        <i class="ra ra-trophy"></i> ${achievement.name}
                    </h4>
                    <div style="display: flex; align-items: center;">
                        <span style="color: #8a8a8a; font-size: 12px;">${rarity}</span>
                        <span class="material-icons rarity-icon ${rarityInfo.class}">${rarityInfo.icon}</span>
                    </div>
                </div>
                <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 5px;">
                    ${achievement.description || 'Achievement unlocked!'}
                </div>
                ${achievement.effect ? `<div style="font-size: 11px; color: #4fc3f7;">Effect: ${achievement.effect}</div>` : ''}
            </div>
        `;
        }).join('');
    }
    
    modal.innerHTML = `
        <div class="modal-content level-up-modal-content">
            <div class="modal-header">
                <h3><i class="ra ra-trophy"></i> Achievements (${achievements.length})</h3>
                <button class="close-modal" onclick="closeAchievementsModal()" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <div style="max-height: 400px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ffd700 rgba(255,255,255,0.1);">
                    ${achievementsList}
                </div>
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAchievementsModal();
        }
    });
    
    // Close modal with Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeAchievementsModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(modal);
    console.log('Achievements modal opened');
}

function closeAchievementsModal() {
    // Restore body scrolling
    document.body.style.overflow = '';
    
    const modal = document.querySelector('.achievement-modal');
    if (modal) {
        modal.remove();
    }
    console.log('Achievements modal closed');
}

// Make combat command processor globally available
window.processCombatCommand = processCombatCommand;

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initializeCharacterSheet);