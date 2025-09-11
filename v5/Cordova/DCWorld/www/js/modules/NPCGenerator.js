/**
 * Enhanced NPC Generator Module
 * Ported from StoryTeller.mobile.old with improvements
 * Integrates with existing DCCUtilities and data systems
 */

class NPCGenerator {
    constructor() {
        this.currentNPC = null;
        this.savedNPCs = [];
        
        // Initialize utilities if available
        this.utils = window.dccUtilities || null;
        this.mechanics = window.dccMechanics || null;
        
        // Initialize data - will try to use JSON data if available
        this.initializeData().then(() => {
            // Load saved NPCs after data is initialized
            this.savedNPCs = this.loadSavedNPCs();
        });
    }

    /**
     * Initialize NPC data - prefer JSON data loader if available
     */
    async initializeData() {
        try {
            // Load jobs, races, classes, and items data directly
            const [jobsData, racesData, classesData, itemsData] = await Promise.all([
                this.loadJSONData('data/jobs.json'),
                this.loadJSONData('data/races.json'),
                this.loadJSONData('data/classes.json'),
                this.loadJSONData('data/dcc-items.json')
            ]);
            
            if (jobsData && racesData) {
                console.log('Loading NPC data from JSON files...');
                this.jobs = jobsData;
                this.races = racesData;
                this.classes = classesData || null;
                this.items = itemsData || null;
                this.initializeFromCustomJSON();
            } else {
                throw new Error('Could not load JSON data');
            }
        } catch (error) {
            console.warn('Could not load JSON data, falling back to static data:', error);
            this.initializeStaticData();
        }
    }
    
    /**
     * Load JSON data from file
     */
    async loadJSONData(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to load ${path}:`, error);
            return null;
        }
    }

    /**
     * Initialize from your custom JSON data format
     */
    initializeFromCustomJSON() {
        // Convert races - combine all categories
        this.npcRaces = {};
        Object.values(this.races).flat().forEach(race => {
            const key = race.id || race.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            this.npcRaces[key] = {
                name: race.name,
                description: race.description,
                statBonuses: race.statBonuses || {},
                maximums: race.maximums || {},
                skills: race.skills || [],
                category: race.category,
                icon: this.getRaceIcon(race.name)
            };
        });
        
        // Convert jobs to backgrounds - combine all categories  
        this.npcBackgrounds = {};
        Object.values(this.jobs).flat().forEach(job => {
            const key = job.id || job.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            this.npcBackgrounds[key] = {
                name: job.name,
                description: job.description,
                statBonuses: job.statBonuses || {},
                skills: job.skills || [],
                category: job.category
            };
        });
        
        // Initialize NPC classes - prefer JSON data if available
        if (this.classes) {
            console.log('Loading classes from classes.json...');
            this.npcClasses = {};
            Object.values(this.classes).flat().forEach(cls => {
                const key = cls.id || cls.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                this.npcClasses[key] = {
                    name: cls.name,
                    description: cls.description,
                    statBonuses: cls.statBonuses || {},
                    skills: cls.skills || [],
                    category: cls.category
                };
            });
        } else {
            console.log('No classes.json found, using fallback classes...');
            // Initialize fallback NPC classes
            this.npcClasses = {
                warrior: { name: 'Warrior', skills: ['Weapon Mastery', 'Shield Bash'], category: 'traditional' },
                rogue: { name: 'Rogue', skills: ['Sneak Attack', 'Poison Knowledge'], category: 'traditional' },
                mage: { name: 'Mage', skills: ['Spellcasting', 'Mana Manipulation'], category: 'traditional' },
                ranger: { name: 'Ranger', skills: ['Tracking', 'Archery'], category: 'traditional' },
                cleric: { name: 'Cleric', skills: ['Divine Healing', 'Turn Undead'], category: 'traditional' },
                barbarian: { name: 'Barbarian', skills: ['Rage', 'Intimidating Roar'], category: 'traditional' },
                bard: { name: 'Bard', skills: ['Bardic Inspiration', 'Charm'], category: 'traditional' },
                paladin: { name: 'Paladin', skills: ['Divine Smite', 'Aura of Protection'], category: 'traditional' },
                sorcerer: { name: 'Sorcerer', skills: ['Raw Magic', 'Metamagic'], category: 'traditional' },
                monk: { name: 'Monk', skills: ['Martial Arts', 'Ki Focus'], category: 'traditional' },
                gunslinger: { name: 'Gunslinger', skills: ['Quick Draw', 'Trick Shot'], category: 'modern' },
                hacker: { name: 'Hacker', skills: ['System Breach', 'Data Mining'], category: 'modern' },
                medic: { name: 'Medic', skills: ['Field Surgery', 'Pharmaceutical Knowledge'], category: 'modern' },
                engineer: { name: 'Engineer', skills: ['Repair', 'Invention'], category: 'modern' }
            };
        }
        
        console.log(`Loaded ${Object.keys(this.npcRaces).length} races, ${Object.keys(this.npcBackgrounds).length} jobs, and ${Object.keys(this.npcClasses).length} classes for NPC generation`);
    }
    
    /**
     * Get appropriate icon for race
     */
    getRaceIcon(raceName) {
        const icons = {
            'human': '👤',
            'elf': '🧝',
            'dwarf': '🧙',
            'halfling': '🧚',
            'bopca': '👽',
            'skyfowl': '🦅',
            'rat-kin': '🐭',
            'mutant': '🧬',
            'android': '🤖',
            'cyborg': '⚙️'
        };
        
        const key = raceName.toLowerCase().replace(/[^a-z]/g, '');
        return icons[key] || '👤';
    }

    /**
     * Initialize static data as fallback
     */
    initializeStaticData() {
        this.npcRaces = {
            human: { name: 'Human', icon: '👤', statBonus: { charisma: 1 }, category: 'fantasy' },
            elf: { name: 'Elf', icon: '🧝', statBonus: { dexterity: 1 }, category: 'fantasy' },
            dwarf: { name: 'Dwarf', icon: '⛏️', statBonus: { constitution: 1 }, category: 'fantasy' },
            orc: { name: 'Orc', icon: '💪', statBonus: { strength: 1 }, category: 'fantasy' },
            halfling: { name: 'Halfling', icon: '🍄', statBonus: { dexterity: 1 }, category: 'fantasy' },
            dragonborn: { name: 'Dragonborn', icon: '🐲', statBonus: { strength: 1 }, category: 'fantasy' },
            tiefling: { name: 'Tiefling', icon: '😈', statBonus: { charisma: 1 }, category: 'fantasy' },
            gnome: { name: 'Gnome', icon: '🧙', statBonus: { intelligence: 1 }, category: 'fantasy' },
            goblin: { name: 'Goblin', icon: '👺', statBonus: { dexterity: 1 }, category: 'fantasy' },
            ghoul: { name: 'Ghoul', icon: '☠️', statBonus: { constitution: 1 }, category: 'apocalypse' },
            cyborg: { name: 'Cyborg', icon: '🤖', statBonus: { intelligence: 1 }, category: 'modern' },
            mutant: { name: 'Mutant', icon: '☢️', statBonus: { constitution: 1 }, category: 'apocalypse' }
        };

        this.npcBackgrounds = {
            merchant: { name: 'Merchant', skills: ['Persuasion', 'Appraisal'], category: 'professional' },
            guard: { name: 'Guard', skills: ['Intimidation', 'Combat Training'], category: 'service' },
            scholar: { name: 'Scholar', skills: ['Research', 'Ancient Lore'], category: 'professional' },
            farmer: { name: 'Farmer', skills: ['Animal Handling', 'Survival'], category: 'physical' },
            thief: { name: 'Thief', skills: ['Stealth', 'Lockpicking'], category: 'creative' },
            noble: { name: 'Noble', skills: ['Persuasion', 'Etiquette'], category: 'professional' },
            sailor: { name: 'Sailor', skills: ['Navigation', 'Weather Sense'], category: 'physical' },
            craftsman: { name: 'Craftsman', skills: ['Crafting', 'Tool Mastery'], category: 'physical' },
            entertainer: { name: 'Entertainer', skills: ['Performance', 'Storytelling'], category: 'creative' },
            hermit: { name: 'Hermit', skills: ['Survival', 'Herb Lore'], category: 'creative' },
            soldier: { name: 'Soldier', skills: ['Combat Tactics', 'Leadership'], category: 'service' },
            priest: { name: 'Priest', skills: ['Divine Knowledge', 'Healing'], category: 'service' },
            spy: { name: 'Spy', skills: ['Deception', 'Information Gathering'], category: 'service' },
            wasteland_scavenger: { name: 'Wasteland Scavenger', skills: ['Salvaging', 'Radiation Resistance'], category: 'physical' }
        };

        this.npcClasses = {
            warrior: { name: 'Warrior', skills: ['Weapon Mastery', 'Shield Bash'], category: 'traditional' },
            rogue: { name: 'Rogue', skills: ['Sneak Attack', 'Poison Knowledge'], category: 'traditional' },
            mage: { name: 'Mage', skills: ['Spellcasting', 'Mana Manipulation'], category: 'traditional' },
            ranger: { name: 'Ranger', skills: ['Tracking', 'Archery'], category: 'traditional' },
            cleric: { name: 'Cleric', skills: ['Divine Healing', 'Turn Undead'], category: 'traditional' },
            barbarian: { name: 'Barbarian', skills: ['Rage', 'Intimidating Roar'], category: 'traditional' },
            bard: { name: 'Bard', skills: ['Bardic Inspiration', 'Charm'], category: 'traditional' },
            paladin: { name: 'Paladin', skills: ['Divine Smite', 'Aura of Protection'], category: 'traditional' },
            sorcerer: { name: 'Sorcerer', skills: ['Raw Magic', 'Metamagic'], category: 'traditional' },
            monk: { name: 'Monk', skills: ['Martial Arts', 'Ki Focus'], category: 'traditional' },
            gunslinger: { name: 'Gunslinger', skills: ['Quick Draw', 'Trick Shot'], category: 'modern' },
            hacker: { name: 'Hacker', skills: ['System Breach', 'Data Mining'], category: 'modern' },
            medic: { name: 'Medic', skills: ['Field Surgery', 'Pharmaceutical Knowledge'], category: 'modern' },
            engineer: { name: 'Engineer', skills: ['Repair', 'Invention'], category: 'modern' }
        };
    }

    /**
     * Parse stat bonus from description text
     */
    parseStatBonus(description) {
        const bonuses = {};
        const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        stats.forEach(stat => {
            const regex = new RegExp(`\\+\\d+\\s+${stat}`, 'i');
            const match = description.match(regex);
            if (match) {
                const bonus = parseInt(match[0].replace(/[^0-9]/g, ''));
                bonuses[stat] = bonus;
            }
        });
        
        return bonuses;
    }

    /**
     * Extract skills from description text
     */
    extractSkillsFromDescription(description) {
        // Simple skill extraction - could be enhanced
        const commonSkills = [
            'Combat', 'Stealth', 'Magic', 'Persuasion', 'Intimidation', 'Healing',
            'Crafting', 'Survival', 'Investigation', 'Performance', 'Athletics'
        ];
        
        const foundSkills = commonSkills.filter(skill => 
            description.toLowerCase().includes(skill.toLowerCase())
        );
        
        return foundSkills.length > 0 ? foundSkills : ['General Skills', 'Specialization'];
    }

    /**
     * Generate a random NPC using custom JSON data
     */
    generateRandomNPC() {
        const npcType = document.getElementById('npc-type-select')?.value || 'npc';
        const level = this.rollDice(10); // Random level 1-10
        
        // Generate basic info
        const race = this.getRandomElement(Object.keys(this.npcRaces));
        const background = this.getRandomElement(Object.keys(this.npcBackgrounds));
        const name = this.generateNPCName();
        
        // Generate base stats
        const baseStats = this.generateStats(level);
        
        // Apply racial bonuses from JSON data
        const raceData = this.npcRaces[race];
        if (raceData && raceData.statBonuses) {
            Object.entries(raceData.statBonuses).forEach(([stat, bonus]) => {
                if (baseStats[stat] !== undefined) {
                    baseStats[stat] = Math.min(baseStats[stat] + bonus, raceData.maximums?.[stat] || 18);
                }
            });
        }
        
        // Apply background bonuses from JSON data
        const backgroundData = this.npcBackgrounds[background];
        if (backgroundData && backgroundData.statBonuses) {
            Object.entries(backgroundData.statBonuses).forEach(([stat, bonus]) => {
                if (baseStats[stat] !== undefined) {
                    baseStats[stat] = Math.min(baseStats[stat] + bonus, 18);
                }
            });
        }
        
        // Generate skills from race and background
        const skills = this.generateSkillsFromJSON(raceData, backgroundData);
        const equipment = this.generateEquipment(background, level);
        
        // Calculate derived stats based on game rules
        const healthPoints = baseStats.constitution + baseStats.dexterity;
        const magicPoints = baseStats.wisdom + baseStats.intelligence;
        const armorClass = this.calculateArmorClass(baseStats.dexterity, equipment);
        
        // Create NPC object with JSON data structure
        this.currentNPC = {
            id: this.generateId(),
            name: name,
            type: npcType,
            level: level,
            race: race,
            background: background,
            stats: baseStats,
            healthPoints: healthPoints,
            magicPoints: magicPoints,
            armorClass: armorClass,
            skills: skills,
            equipment: equipment,
            notes: this.generateNotes(npcType, raceData, backgroundData),
            timestamp: new Date().toISOString()
        };
        
        this.displayNPC(this.currentNPC);
        return this.currentNPC;
    }

    /**
     * Generate stats for NPC
     */
    generateStats(level) {
        return {
            strength: this.rollDice(4) + level,
            dexterity: this.rollDice(4) + level,
            constitution: this.rollDice(4) + level,
            intelligence: this.rollDice(4) + level,
            wisdom: this.rollDice(4) + level,
            charisma: this.rollDice(4) + level
        };
    }

    /**
     * Generate skills from JSON race and background data
     */
    generateSkillsFromJSON(raceData, backgroundData) {
        const skills = [];
        
        // Add racial skills
        if (raceData && raceData.skills) {
            raceData.skills.forEach(skill => {
                skills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'racial',
                    level: this.rollDice(3) + 1,
                    description: `Racial ability: ${skill.name}`
                });
            });
        }
        
        // Add background skills
        if (backgroundData && backgroundData.skills) {
            backgroundData.skills.forEach(skill => {
                skills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'background',
                    level: this.rollDice(3) + 1,
                    description: `Professional skill: ${skill.name}`
                });
            });
        }
        
        // Add some general skills if not enough
        if (skills.length < 3) {
            const generalSkills = [
                { name: 'Perception', stat: 'wisdom' },
                { name: 'Athletics', stat: 'strength' },
                { name: 'Stealth', stat: 'dexterity' },
                { name: 'Persuasion', stat: 'charisma' }
            ];
            
            const needed = 3 - skills.length;
            for (let i = 0; i < needed; i++) {
                const skill = this.getRandomElement(generalSkills);
                skills.push({
                    name: skill.name,
                    stat: skill.stat,
                    source: 'general',
                    level: this.rollDice(2) + 1,
                    description: `General skill: ${skill.name}`
                });
            }
        }
        
        return skills;
    }

    /**
     * Generate skills for NPC
     */
    generateSkills(background, characterClass) {
        const skills = [];
        const backgroundSkills = this.npcBackgrounds[background]?.skills || [];
        const classSkills = this.npcClasses[characterClass]?.skills || [];
        
        if (backgroundSkills.length > 0) {
            skills.push({
                name: this.getRandomElement(backgroundSkills),
                source: 'background',
                level: this.rollDice(3) + 1
            });
        }
        
        if (classSkills.length > 0) {
            skills.push({
                name: this.getRandomElement(classSkills),
                source: 'class',
                level: this.rollDice(3) + 1
            });
        }
        
        return skills;
    }

    /**
     * Generate equipment for NPC
     */
    generateEquipment(characterClass, level) {
        const equipment = {
            weapons: [],
            armor: null,
            items: []
        };
        
        // Basic weapon based on class
        const weapons = this.getWeaponsForClass(characterClass);
        if (weapons.length > 0) {
            equipment.weapons.push(this.getRandomElement(weapons));
        }
        
        // Basic armor
        equipment.armor = this.getArmorForLevel(level);
        
        // Random items
        const itemCount = this.rollDice(3);
        for (let i = 0; i < itemCount; i++) {
            equipment.items.push(this.getRandomElement(this.npcItems));
        }
        
        return equipment;
    }

    /**
     * Get weapons suitable for a class
     */
    getWeaponsForClass(characterClass) {
        const weaponSets = {
            warrior: ['Sword', 'War Hammer', 'Spear'],
            rogue: ['Dagger', 'Short Sword', 'Crossbow'],
            mage: ['Staff', 'Wand', 'Dagger'],
            ranger: ['Bow', 'Spear', 'Hunting Knife'],
            cleric: ['Mace', 'Staff', 'Shield'],
            gunslinger: ['Pistol', 'Rifle', 'Knife'],
            default: ['Club', 'Knife', 'Staff']
        };
        
        return weaponSets[characterClass] || weaponSets.default;
    }

    /**
     * Get armor for level
     */
    getArmorForLevel(level) {
        if (level <= 3) return 'Leather Armor';
        if (level <= 6) return 'Chain Mail';
        if (level <= 9) return 'Plate Armor';
        return 'Enchanted Armor';
    }

    /**
     * Generate contextual notes including race and background descriptions
     */
    generateNotes(npcType, raceData, backgroundData) {
        const contextualNotes = {
            npc: [
                'Friendly and helpful to travelers',
                'Has useful local information',
                'Might offer a quest or job',
                'Could become a recurring ally',
                'Has interesting rumors to share'
            ],
            encounter: [
                'Hostile towards strangers',
                'Guards something valuable',
                'Looking for trouble',
                'Has a grudge against someone',
                'Territorial and aggressive'
            ]
        };
        
        const noteList = contextualNotes[npcType] || contextualNotes.npc;
        let notes = this.getRandomElement(noteList);
        
        // Add race and background descriptions to notes
        if (raceData?.description || backgroundData?.description) {
            notes += '\n\n**Character Background:**';
            
            if (raceData?.description) {
                notes += `\n**Race:** ${raceData.description}`;
            }
            
            if (backgroundData?.description) {
                notes += `\n**Background:** ${backgroundData.description}`;
            }
        }
        
        return notes;
    }

    /**
     * Calculate Armor Class based on game rules
     * AC = Base 10 + armor bonuses + DEX modifier
     */
    calculateArmorClass(dexterity, equipment) {
        const baseAC = 10;
        const dexModifier = dexterity - 10; // Standard D&D modifier calculation
        
        // Get armor bonus based on equipment
        let armorBonus = 0;
        if (equipment && equipment.armor) {
            const armor = equipment.armor.toLowerCase();
            if (armor.includes('leather')) {
                armorBonus = 1; // +1 for leather
            } else if (armor.includes('chain') || armor.includes('mail')) {
                armorBonus = 2; // +2 for chain
            } else if (armor.includes('plate') || armor.includes('enchanted') || armor.includes('scale') || armor.includes('splint')) {
                armorBonus = 3; // +3 for higher medieval/D&D-like armors
            }
        }
        
        return baseAC + armorBonus + Math.floor(dexModifier / 2); // Use half DEX modifier to keep numbers reasonable
    }

    /**
     * Display NPC in the interface with enhanced JSON data
     */
    displayNPC(npc) {
        const container = document.getElementById('generated-npc');
        if (!container) return;
        
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        
        container.innerHTML = `
            <div class="npc-display">
                <div class="npc-card">
                    <div class="npc-header">
                        <div class="npc-portrait ${npc.type}">
                            ${raceData?.icon || '👤'}
                        </div>
                        <div class="npc-header-info">
                            <h4 class="npc-name">${npc.name}</h4>
                            <span class="npc-type-badge ${npc.type}">
                                ${npc.type === 'npc' ? '🤝 Friendly' : '⚔️ Encounter'}
                            </span>
                        </div>
                        <div class="npc-vital-stats">
                            <div class="vital-stat">
                                <span class="vital-label">HP</span>
                                <span class="vital-value">${npc.hitPoints || npc.healthPoints || 'N/A'}</span>
                            </div>
                            <div class="vital-stat">
                                <span class="vital-label">AC</span>
                                <span class="vital-value">${npc.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-details">
                        <div class="npc-info-grid">
                            <div class="npc-basic-info">
                                <div class="info-item">
                                    <span class="info-label">Level</span>
                                    <span class="info-value">${npc.level}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Race</span>
                                    <span class="info-value">${raceData?.name || 'Unknown'}</span>
                                    ${raceData?.category ? `<small class="info-category">${raceData.category}</small>` : ''}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Background</span>
                                    <span class="info-value">${backgroundData?.name || 'Unknown'}</span>
                                    ${backgroundData?.category ? `<small class="info-category">${backgroundData.category}</small>` : ''}
                                </div>
                            </div>
                            
                            <div class="npc-stats">
                                <div class="stats-header">Attributes</div>
                                <div class="stat-grid">
                                    <div class="stat-item">
                                        <span class="stat-label">STR</span>
                                        <span class="stat-value">${npc.stats?.strength || npc.strength || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">DEX</span>
                                        <span class="stat-value">${npc.stats?.dexterity || npc.dexterity || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CON</span>
                                        <span class="stat-value">${npc.stats?.constitution || npc.constitution || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">INT</span>
                                        <span class="stat-value">${npc.stats?.intelligence || npc.intelligence || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">WIS</span>
                                        <span class="stat-value">${npc.stats?.wisdom || npc.wisdom || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CHA</span>
                                        <span class="stat-value">${npc.stats?.charisma || npc.charisma || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-skills-equipment">
                            <div class="npc-skills">
                                <div class="section-header">Skills & Abilities</div>
                                <div class="skills-list">
                                    ${npc.skills && npc.skills.length > 0 ? npc.skills.map(skill => 
                                        `<div class="skill-item">
                                            <span class="skill-name">${skill.name}</span>
                                            <span class="skill-stat">(${skill.stat?.toUpperCase() || 'N/A'})</span>
                                            <span class="skill-level">Level ${skill.level || 1}</span>
                                            <span class="skill-source">${skill.source}</span>
                                        </div>`
                                    ).join('') : '<span class="no-content">No special abilities</span>'}
                                </div>
                            </div>
                            
                            <div class="npc-equipment">
                                <div class="section-header">Equipment</div>
                                <div class="equipment-list">
                                    ${npc.equipment && npc.equipment.weapons && npc.equipment.weapons.length > 0 ? 
                                        `<span><strong>Weapons:</strong> ${npc.equipment.weapons.join(', ')}</span>` : ''}
                                    ${npc.equipment && npc.equipment.armor ? 
                                        `<span><strong>Armor:</strong> ${npc.equipment.armor}</span>` : ''}
                                    ${npc.equipment && npc.equipment.items && npc.equipment.items.length > 0 ? 
                                        `<span><strong>Items:</strong> ${npc.equipment.items.join(', ')}</span>` : ''}
                                    ${(!npc.equipment || (!npc.equipment.weapons?.length && !npc.equipment.armor && !npc.equipment.items?.length)) ? 
                                        '<span class="no-content">Basic equipment</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${npc.notes ? `
                        <div class="npc-notes">
                            <div class="section-header">Notes</div>
                            <div class="notes-content">${npc.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="npc-actions-bar">
                        <button class="btn btn-primary" onclick="npcGenerator.saveCurrentNPC()">
                            💾 Save NPC
                        </button>
                        <button class="btn btn-secondary" onclick="npcGenerator.editCurrentNPC()">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-secondary" onclick="npcGenerator.generateRandomNPC()">
                            🎲 Generate New
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate NPC notes based on type
        `;
    }
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Utility functions
     */
    generateId() {
        return this.utils ? this.utils.generateId() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    rollDice(sides) {
        return this.mechanics ? this.mechanics.rollDice(1, sides)[0] : Math.floor(Math.random() * sides) + 1;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    generateNPCName() {
        const firstNames = [
            'Aiden', 'Sera', 'Gareth', 'Luna', 'Thane', 'Zara', 'Kael', 'Mira',
            'Dorian', 'Lyra', 'Magnus', 'Nyx', 'Orion', 'Vera', 'Cassius', 'Iris',
            'Marcus', 'Nova', 'Raven', 'Zeke', 'Echo', 'Sage', 'Phoenix', 'Storm'
        ];
        
        const lastNames = [
            'Stormwind', 'Nightfall', 'Ironforge', 'Goldleaf', 'Starweaver', 'Shadowbane',
            'Steel', 'Cross', 'Hunter', 'Stone', 'Black', 'Grey', 'White', 'Fox',
            'Wasteland', 'Ruins', 'Scavenger', 'Survivor', 'Raider', 'Drifter'
        ];
        
        return `${this.getRandomElement(firstNames)} ${this.getRandomElement(lastNames)}`;
    }

    /**
     * Save current NPC
     */
    saveCurrentNPC() {
        if (!this.currentNPC) return;
        
        this.savedNPCs.push({ ...this.currentNPC });
        this.saveSavedNPCs();
        this.displaySavedNPCs();
        
        // Show success message
        this.showMessage('NPC saved successfully!', 'success');
    }

    /**
     * Edit current NPC - Comprehensive inline edit mode
     */
    editCurrentNPC() {
        if (!this.currentNPC) return;
        
        // Store original NPC data for potential revert
        this.originalNPC = JSON.parse(JSON.stringify(this.currentNPC));
        this.isEditMode = true;
        
        // Initialize attribute points if not set
        if (this.currentNPC.attributePoints === undefined) {
            this.currentNPC.attributePoints = 0;
        }
        
        // Enable edit mode display
        this.displayNPCEditMode(this.currentNPC);
    }
    
    /**
     * Display NPC in edit mode with inline editors
     */
    displayNPCEditMode(npc) {
        const container = document.getElementById('generated-npc');
        if (!container) return;
        
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        
        // Get available weapons (common/uncommon only)
        const availableWeapons = this.getAvailableWeapons();
        
        container.innerHTML = `
            <div class="npc-display edit-mode">
                <div class="npc-card">
                    <div class="npc-header">
                        <div class="npc-portrait ${npc.type}">
                            ${raceData?.icon || '👤'}
                        </div>
                        <div class="npc-header-info">
                            <div class="editable-field">
                                <input type="text" id="edit-name" class="edit-input edit-name" value="${npc.name}" placeholder="NPC Name">
                                <div class="edit-controls">
                                    <button class="edit-accept" onclick="npcGenerator.acceptFieldEdit('name')" title="Accept">✓</button>
                                    <button class="edit-cancel" onclick="npcGenerator.cancelFieldEdit('name')" title="Cancel">✗</button>
                                </div>
                            </div>
                            <span class="npc-type-badge ${npc.type}">
                                ${npc.type === 'npc' ? '🤝 Friendly' : '⚔️ Encounter'}
                            </span>
                        </div>
                        <div class="npc-vital-stats">
                            <div class="vital-stat">
                                <span class="vital-label">HP</span>
                                <span class="vital-value" id="display-hp">${npc.hitPoints || npc.healthPoints || 'N/A'}</span>
                            </div>
                            <div class="vital-stat">
                                <span class="vital-label">AC</span>
                                <span class="vital-value" id="display-ac">${npc.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-details">
                        <div class="npc-info-grid">
                            <div class="npc-basic-info">
                                <div class="info-item">
                                    <span class="info-label">Level</span>
                                    <div class="editable-field">
                                        <input type="number" id="edit-level" class="edit-input edit-level" value="${npc.level}" min="1" max="20">
                                        <div class="edit-controls">
                                            <button class="edit-accept" onclick="npcGenerator.acceptFieldEdit('level')" title="Accept">✓</button>
                                            <button class="edit-cancel" onclick="npcGenerator.cancelFieldEdit('level')" title="Cancel">✗</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Race</span>
                                    <div class="editable-field">
                                        <select id="edit-race" class="edit-select" onchange="npcGenerator.handleRaceChange()">
                                            ${Object.keys(this.npcRaces).map(raceKey => 
                                                `<option value="${raceKey}" ${raceKey === npc.race ? 'selected' : ''}>${this.npcRaces[raceKey].name}</option>`
                                            ).join('')}
                                        </select>
                                        <div class="edit-controls">
                                            <button class="edit-accept" onclick="npcGenerator.acceptFieldEdit('race')" title="Accept">✓</button>
                                            <button class="edit-cancel" onclick="npcGenerator.cancelFieldEdit('race')" title="Cancel">✗</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Background</span>
                                    <div class="editable-field">
                                        <select id="edit-background" class="edit-select" onchange="npcGenerator.handleBackgroundChange()">
                                            ${Object.keys(this.npcBackgrounds).map(bgKey => 
                                                `<option value="${bgKey}" ${bgKey === npc.background ? 'selected' : ''}>${this.npcBackgrounds[bgKey].name}</option>`
                                            ).join('')}
                                        </select>
                                        <div class="edit-controls">
                                            <button class="edit-accept" onclick="npcGenerator.acceptFieldEdit('background')" title="Accept">✓</button>
                                            <button class="edit-cancel" onclick="npcGenerator.cancelFieldEdit('background')" title="Cancel">✗</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="npc-stats">
                                <div class="stats-header">
                                    Attributes
                                    <div class="attribute-points">
                                        Points: <span id="attribute-points-display">${npc.attributePoints || 0}</span>
                                    </div>
                                </div>
                                <div class="stat-grid">
                                    <div class="stat-item">
                                        <span class="stat-label">STR</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('strength', -1)">−</button>
                                            <span class="stat-value" id="stat-strength">${npc.stats?.strength || npc.strength || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('strength', 1)">+</button>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">DEX</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('dexterity', -1)">−</button>
                                            <span class="stat-value" id="stat-dexterity">${npc.stats?.dexterity || npc.dexterity || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('dexterity', 1)">+</button>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CON</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('constitution', -1)">−</button>
                                            <span class="stat-value" id="stat-constitution">${npc.stats?.constitution || npc.constitution || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('constitution', 1)">+</button>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">INT</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('intelligence', -1)">−</button>
                                            <span class="stat-value" id="stat-intelligence">${npc.stats?.intelligence || npc.intelligence || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('intelligence', 1)">+</button>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">WIS</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('wisdom', -1)">−</button>
                                            <span class="stat-value" id="stat-wisdom">${npc.stats?.wisdom || npc.wisdom || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('wisdom', 1)">+</button>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CHA</span>
                                        <div class="stat-editor">
                                            <button class="stat-btn stat-minus" onclick="npcGenerator.adjustStat('charisma', -1)">−</button>
                                            <span class="stat-value" id="stat-charisma">${npc.stats?.charisma || npc.charisma || 10}</span>
                                            <button class="stat-btn stat-plus" onclick="npcGenerator.adjustStat('charisma', 1)">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-skills-equipment">
                            <div class="npc-skills">
                                <div class="section-header">Skills & Abilities</div>
                                <div class="skills-list edit-skills" id="edit-skills-container">
                                    ${this.renderEditableSkills(npc.skills || [])}
                                </div>
                                <button class="btn-small" onclick="npcGenerator.addSkill()">+ Add Skill</button>
                            </div>
                            
                            <div class="npc-equipment">
                                <div class="section-header">Equipment</div>
                                <div class="equipment-edit">
                                    <div class="equipment-section">
                                        <label>Weapons:</label>
                                        <div id="weapons-edit-container">
                                            ${this.renderEditableWeapons(npc.equipment?.weapons || [])}
                                        </div>
                                        <button class="btn-small" onclick="npcGenerator.addWeapon()">+ Add Weapon</button>
                                    </div>
                                    
                                    <div class="equipment-section">
                                        <label>Armor:</label>
                                        <input type="text" id="edit-armor" class="edit-input" value="${npc.equipment?.armor || ''}" placeholder="Armor type">
                                    </div>
                                    
                                    <div class="equipment-section">
                                        <label>Other Items:</label>
                                        <textarea id="edit-items" class="edit-textarea" placeholder="Other equipment...">${(npc.equipment?.items || []).join(', ')}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-notes">
                            <div class="section-header">Notes</div>
                            <textarea id="edit-notes" class="edit-textarea" placeholder="Add notes about this NPC...">${npc.notes || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="npc-actions-bar edit-actions">
                        <button class="btn btn-success" onclick="npcGenerator.saveNPCEdits()">
                            💾 Save Changes
                        </button>
                        <button class="btn btn-warning" onclick="npcGenerator.saveAsNewNPC()">
                            📄 Save as New
                        </button>
                        <button class="btn btn-secondary" onclick="npcGenerator.cancelEdit()">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Update calculations based on current stats
        this.updateCalculatedValues();
    }

    /**
     * Display saved NPCs
     */
    displaySavedNPCs() {
        // Check if data is loaded
        if (!this.npcRaces || !this.npcBackgrounds) {
            console.log('NPC data not loaded yet, waiting...');
            // Retry after data is loaded
            setTimeout(() => this.displaySavedNPCs(), 100);
            return;
        }
        
        // Try new container structure first, fall back to old
        let container = document.getElementById('saved-npcs-container');
        if (!container) {
            container = document.getElementById('saved-npcs-grid');
        }
        if (!container) return;
        
        if (this.savedNPCs.length === 0) {
            container.innerHTML = `
                <div class="no-npcs">
                    <i class="ra ra-users"></i>
                    <p>No saved NPCs yet</p>
                    <p>Generate and save some NPCs to see them here</p>
                </div>
            `;
            return;
        }
        
        const filter = document.getElementById('npc-filter')?.value || 'all';
        const filteredNPCs = filter === 'all' ? this.savedNPCs : this.savedNPCs.filter(npc => npc.type === filter);
        
        if (filteredNPCs.length === 0) {
            container.innerHTML = `
                <div class="no-npcs">
                    <i class="ra ra-users"></i>
                    <p>No NPCs match the current filter</p>
                </div>
            `;
            return;
        }
        
        // Use new grid structure for the tabbed interface
        container.innerHTML = `
            <div class="saved-npcs-grid">
                ${filteredNPCs.map(npc => this.createSavedNPCCard(npc)).join('')}
            </div>
        `;
        
        // Update count after displaying NPCs
        if (typeof updateSavedNPCCount === 'function') {
            updateSavedNPCCount();
        }
    }

    /**
     * Create saved NPC card HTML
     */
    createSavedNPCCard(npc) {
        // Safety check for race data
        const raceData = this.npcRaces && this.npcRaces[npc.race] ? this.npcRaces[npc.race] : null;
        const backgroundData = this.npcBackgrounds && this.npcBackgrounds[npc.background] ? this.npcBackgrounds[npc.background] : null;
        
        // Fallback values if data is missing
        const raceIcon = raceData?.icon || '👤';
        const raceName = raceData?.name || npc.race || 'Unknown';
        
        return `
            <div class="saved-npc-card" data-npc-id="${npc.id}">
                <div class="saved-npc-header">
                    <div class="saved-npc-portrait ${npc.type}">
                        ${raceIcon}
                    </div>
                    <div class="saved-npc-info">
                        <h5 class="saved-npc-name">${npc.name}</h5>
                        <span class="saved-npc-details">Lvl ${npc.level} ${raceName}</span>
                        <span class="saved-npc-type ${npc.type}">
                            ${npc.type === 'npc' ? '🤝' : '⚔️'}
                        </span>
                    </div>
                </div>
                <div class="saved-npc-actions">
                    <button class="btn-small" onclick="npcGenerator.viewNPCModal('${npc.id}')" title="View Details">
                        <i class="material-icons">visibility</i>
                    </button>
                    <button class="btn-small" onclick="npcGenerator.loadNPC('${npc.id}')" title="Load to Editor">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small" onclick="npcGenerator.copyNPC('${npc.id}')" title="Copy to Clipboard">
                        <i class="material-icons">content_copy</i>
                    </button>
                    <button class="btn-small danger" onclick="npcGenerator.deleteNPC('${npc.id}')" title="Delete">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Load saved NPC
     */
    loadNPC(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (npc) {
            this.currentNPC = { ...npc };
            this.displayNPC(this.currentNPC);
            
            // Switch to New NPC tab to show the loaded NPC
            if (typeof switchNPCTab === 'function') {
                switchNPCTab('new');
            }
            
            this.showMessage(`Loaded ${npc.name} for editing`, 'success');
        }
    }

    /**
     * View NPC in modal
     */
    viewNPCModal(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (!npc) return;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('npc-modal')) {
            this.createNPCModal();
        }
        
        // Populate modal with NPC data
        this.populateNPCModal(npc);
        
        // Show modal
        const modal = document.getElementById('npc-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    /**
     * Create NPC modal
     */
    createNPCModal() {
        const modalHTML = `
            <div id="npc-modal" class="npc-modal" onclick="npcGenerator.closeNPCModal(event)">
                <div class="npc-modal-content" onclick="event.stopPropagation()">
                    <div class="npc-modal-header">
                        <h3 class="npc-modal-title">NPC Details</h3>
                        <div class="npc-modal-controls">
                            <button class="btn-modal-flag" id="npc-flag-btn" onclick="npcGenerator.toggleNPCFlag()" title="Toggle Map Flag (Coming Soon)">
                                <i class="ra ra-map-marker"></i>
                                <span>Flag for Map</span>
                            </button>
                            <button class="btn-modal-close" onclick="npcGenerator.closeNPCModal()">
                                <i class="ra ra-close"></i>
                            </button>
                        </div>
                    </div>
                    <div class="npc-modal-body" id="npc-modal-body">
                        <!-- NPC content will be populated here -->
                    </div>
                    <div class="npc-modal-footer">
                        <button class="btn-secondary" onclick="npcGenerator.editNPCFromModal()">
                            <i class="ra ra-edit"></i> Edit NPC
                        </button>
                        <button class="btn-secondary" onclick="npcGenerator.copyNPCFromModal()">
                            <i class="ra ra-copy"></i> Copy to Clipboard
                        </button>
                        <button class="btn-secondary" onclick="npcGenerator.closeNPCModal()">
                            <i class="ra ra-close"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Populate modal with NPC data
     */
    populateNPCModal(npc) {
        const modalBody = document.getElementById('npc-modal-body');
        if (!modalBody) return;
        
        // Store current NPC for modal actions
        this.modalNPC = npc;
        
        // Use the same display format as the main view
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        const classData = this.npcClasses[npc.characterClass];
        
        modalBody.innerHTML = `
            <div class="npc-display modal-npc-display">
                <div class="npc-card">
                    <div class="npc-header">
                        <div class="npc-portrait ${npc.type}">
                            ${raceData?.icon || '👤'}
                        </div>
                        <div class="npc-header-info">
                            <h4 class="npc-name">${npc.name}</h4>
                            <span class="npc-type-badge ${npc.type}">
                                ${npc.type === 'npc' ? '🤝 Friendly' : '⚔️ Encounter'}
                            </span>
                        </div>
                        <div class="npc-vital-stats">
                            <div class="vital-stat">
                                <span class="vital-label">HP</span>
                                <span class="vital-value">${npc.hitPoints || npc.healthPoints || 'N/A'}</span>
                            </div>
                            <div class="vital-stat">
                                <span class="vital-label">AC</span>
                                <span class="vital-value">${npc.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-details">
                        <div class="npc-info-grid">
                            <div class="npc-basic-info">
                                <div class="info-item">
                                    <span class="info-label">Level</span>
                                    <span class="info-value">${npc.level}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Race</span>
                                    <span class="info-value">${raceData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Background</span>
                                    <span class="info-value">${backgroundData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Class</span>
                                    <span class="info-value">${classData?.name || 'Unknown'}</span>
                                </div>
                            </div>
                            
                            <div class="npc-stats">
                                <div class="stats-header">Attributes</div>
                                <div class="stat-grid">
                                    <div class="stat-item">
                                        <span class="stat-label">STR</span>
                                        <span class="stat-value">${npc.stats?.strength || npc.strength || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">DEX</span>
                                        <span class="stat-value">${npc.stats?.dexterity || npc.dexterity || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CON</span>
                                        <span class="stat-value">${npc.stats?.constitution || npc.constitution || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">INT</span>
                                        <span class="stat-value">${npc.stats?.intelligence || npc.intelligence || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">WIS</span>
                                        <span class="stat-value">${npc.stats?.wisdom || npc.wisdom || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CHA</span>
                                        <span class="stat-value">${npc.stats?.charisma || npc.charisma || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-skills-equipment">
                            <div class="npc-skills">
                                <div class="section-header">Skills</div>
                                <div class="skills-list">
                                    ${npc.skills ? npc.skills.map(skill => 
                                        `<span class="skill-badge">${typeof skill === 'string' ? skill : `${skill.name} (${skill.level})`}</span>`
                                    ).join(' ') : '<span class="no-content">None</span>'}
                                </div>
                            </div>
                            
                            <div class="npc-equipment">
                                <div class="section-header">Equipment</div>
                                <div class="equipment-list">
                                    ${npc.equipment && npc.equipment.weapons && npc.equipment.weapons.length > 0 ? 
                                        `<span><strong>Weapons:</strong> ${npc.equipment.weapons.join(', ')}</span>` : ''}
                                    ${npc.equipment && npc.equipment.armor ? 
                                        `<span><strong>Armor:</strong> ${npc.equipment.armor}</span>` : ''}
                                    ${npc.equipment && npc.equipment.items && npc.equipment.items.length > 0 ? 
                                        `<span><strong>Items:</strong> ${npc.equipment.items.join(', ')}</span>` : ''}
                                    ${(!npc.equipment || (!npc.equipment.weapons?.length && !npc.equipment.armor && !npc.equipment.items?.length)) ? 
                                        '<span class="no-content">None</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${npc.notes ? `
                        <div class="npc-notes">
                            <div class="section-header">Notes</div>
                            <div class="notes-content">${npc.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Update flag button state (placeholder for future map integration)
        const flagBtn = document.getElementById('npc-flag-btn');
        if (flagBtn) {
            const isFlagged = npc.mapFlagged || false;
            flagBtn.classList.toggle('flagged', isFlagged);
            flagBtn.querySelector('span').textContent = isFlagged ? 'Flagged for Map' : 'Flag for Map';
        }
    }

    /**
     * Close NPC modal
     */
    closeNPCModal(event) {
        if (event && event.target !== event.currentTarget) return;
        
        const modal = document.getElementById('npc-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
        this.modalNPC = null;
    }

    /**
     * Edit NPC from modal
     */
    editNPCFromModal() {
        if (this.modalNPC) {
            this.loadNPC(this.modalNPC.id);
            this.closeNPCModal();
        }
    }

    /**
     * Copy NPC from modal
     */
    copyNPCFromModal() {
        if (this.modalNPC) {
            this.copyNPC(this.modalNPC.id);
        }
    }

    /**
     * Toggle NPC map flag (placeholder for future feature)
     */
    toggleNPCFlag() {
        if (!this.modalNPC) return;
        
        // Find the NPC in saved list and toggle flag
        const npcIndex = this.savedNPCs.findIndex(n => n.id === this.modalNPC.id);
        if (npcIndex !== -1) {
            this.savedNPCs[npcIndex].mapFlagged = !this.savedNPCs[npcIndex].mapFlagged;
            this.modalNPC.mapFlagged = this.savedNPCs[npcIndex].mapFlagged;
            
            // Save to storage
            localStorage.setItem('storyteller_saved_npcs', JSON.stringify(this.savedNPCs));
            
            // Update button state
            const flagBtn = document.getElementById('npc-flag-btn');
            if (flagBtn) {
                const isFlagged = this.modalNPC.mapFlagged;
                flagBtn.classList.toggle('flagged', isFlagged);
                flagBtn.querySelector('span').textContent = isFlagged ? 'Flagged for Map' : 'Flag for Map';
            }
            
            this.showMessage(
                `${this.modalNPC.name} ${this.modalNPC.mapFlagged ? 'flagged for' : 'unflagged from'} map`, 
                'info'
            );
        }
    }

    /**
     * Copy NPC to clipboard
     */
    copyNPC(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (npc) {
            const npcText = this.formatNPCForCopy(npc);
            navigator.clipboard.writeText(npcText).then(() => {
                this.showMessage('NPC copied to clipboard!', 'success');
            });
        }
    }

    /**
     * Format NPC for copying
     */
    formatNPCForCopy(npc) {
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        const classData = this.npcClasses[npc.characterClass];
        
        return `**${npc.name}**
Level ${npc.level} ${raceData?.name || 'Unknown'} ${classData?.name || 'Unknown'}
Background: ${backgroundData?.name || 'Unknown'}

**Stats:** STR ${npc.stats.strength}, DEX ${npc.stats.dexterity}, CON ${npc.stats.constitution}, INT ${npc.stats.intelligence}, WIS ${npc.stats.wisdom}, CHA ${npc.stats.charisma}
**HP:** ${npc.healthPoints} | **MP:** ${npc.magicPoints}

**Skills:** ${npc.skills.map(s => `${s.name} (${s.level})`).join(', ')}
**Equipment:** ${[...npc.equipment.weapons, npc.equipment.armor, ...npc.equipment.items].filter(Boolean).join(', ')}

**Notes:** ${npc.notes}`;
    }

    /**
     * Delete saved NPC
     */
    deleteNPC(npcId) {
        if (confirm('Are you sure you want to delete this NPC?')) {
            this.savedNPCs = this.savedNPCs.filter(n => n.id !== npcId);
            this.saveSavedNPCs();
            this.displaySavedNPCs();
            this.showMessage('NPC deleted successfully!', 'success');
        }
    }

    /**
     * Clear all NPCs
     */
    clearAllNPCs() {
        if (confirm('Are you sure you want to delete ALL saved NPCs? This cannot be undone.')) {
            this.savedNPCs = [];
            this.saveSavedNPCs();
            this.displaySavedNPCs();
            this.showMessage('All NPCs cleared!', 'success');
        }
    }

    /**
     * Storage functions
     */
    loadSavedNPCs() {
        try {
            const saved = localStorage.getItem('storyteller_saved_npcs');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved NPCs:', error);
            return [];
        }
    }

    saveSavedNPCs() {
        try {
            localStorage.setItem('storyteller_saved_npcs', JSON.stringify(this.savedNPCs));
        } catch (error) {
            console.error('Error saving NPCs:', error);
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        // Try to use existing message system if available
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            // Fallback to simple alert
            alert(message);
        }
    }

    /**
     * Initialize the NPC generator interface
     */
    init() {
        // Wait for data to be initialized before displaying NPCs
        const initializeDisplay = () => {
            if (!this.npcRaces || !this.npcBackgrounds) {
                // Data not ready yet, wait a bit longer
                setTimeout(initializeDisplay, 100);
                return;
            }
            
            // Initialize UI if elements exist
            this.displaySavedNPCs();
            
            // Update saved count after displaying NPCs
            if (typeof updateSavedNPCCount === 'function') {
                updateSavedNPCCount();
            }
        };
        
        initializeDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Filter change
        const filterSelect = document.getElementById('npc-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.displaySavedNPCs());
        }
    }
    
    /**
     * Render editable skills list
     */
    renderEditableSkills(skills) {
        if (!skills || skills.length === 0) {
            return '<div class="skill-item-edit">No skills assigned</div>';
        }
        
        return skills.map((skill, index) => {
            // Handle both string skills and skill objects
            const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || 'Unknown Skill');
            
            return `
                <div class="skill-item-edit" data-skill-index="${index}">
                    <input type="text" class="edit-input skill-edit-input" value="${skillName}" placeholder="Skill name">
                    <button class="btn-small btn-danger" onclick="npcGenerator.removeSkill(${index})">✗</button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render editable weapons list
     */
    renderEditableWeapons(weapons) {
        if (!weapons || weapons.length === 0) {
            return '<div class="weapon-item-edit">No weapons assigned</div>';
        }
        
        const availableWeapons = this.getAvailableWeapons();
        
        return weapons.map((weapon, index) => `
            <div class="weapon-item-edit" data-weapon-index="${index}">
                <select class="edit-select weapon-select">
                    <option value="${weapon}" selected>${weapon}</option>
                    ${availableWeapons.filter(w => w !== weapon).map(w => 
                        `<option value="${w}">${w}</option>`
                    ).join('')}
                </select>
                <button class="btn-small btn-danger" onclick="npcGenerator.removeWeapon(${index})">✗</button>
            </div>
        `).join('');
    }
    
    /**
     * Get available weapons for edit mode
     */
    getAvailableWeapons() {
        // Custom weapon list combining DCC and D&D weapons
        return [
            // Basic Weapons
            'Dagger', 'Club', 'Staff', 'Sling', 'Dart',
            // Swords
            'Short Sword', 'Long Sword', 'Bastard Sword', 'Two-Handed Sword', 'Scimitar',
            // Axes
            'Hand Axe', 'Battle Axe', 'Great Axe', 'War Hammer',
            // Polearms
            'Spear', 'Pike', 'Halberd', 'Glaive', 'Pole Arm',
            // Ranged
            'Short Bow', 'Long Bow', 'Light Crossbow', 'Heavy Crossbow', 'Javelin',
            // Exotic
            'Mace', 'Flail', 'Morning Star', 'Warhammer', 'Maul',
            // DCC Specific
            'Crowbar', 'Pitchfork', 'Sickle', 'Hammer', 'Pick',
            // Dungeon Crawler Carl inspired
            'Chain Whip', 'Throwing Knives', 'Acid Bomb', 'Crystal Blade', 'Energy Weapon',
            'Plasma Rifle', 'Nano Blade', 'Gravity Hammer', 'Tesla Coil', 'Quantum Sword'
        ];
    }
    
    /**
     * Accept field edit
     */
    acceptFieldEdit(fieldName) {
        const input = document.getElementById(`edit-${fieldName}`);
        if (!input) return;
        
        const newValue = input.value.trim();
        
        switch(fieldName) {
            case 'name':
                this.currentNPC.name = newValue;
                break;
            case 'level':
                const oldLevel = this.currentNPC.level || 1;
                const newLevel = parseInt(newValue) || 1;
                this.handleLevelChange(oldLevel, newLevel);
                this.currentNPC.level = newLevel;
                this.updateCalculatedValues();
                break;
            case 'race':
                this.currentNPC.race = newValue;
                this.handleRaceChange();
                break;
            case 'background':
                this.currentNPC.background = newValue;
                this.handleBackgroundChange();
                break;
        }
        
        this.showMessage(`${fieldName} updated!`, 'success');
    }
    
    /**
     * Handle level changes with attribute point system
     */
    handleLevelChange(oldLevel, newLevel) {
        if (!this.currentNPC.attributePoints) {
            this.currentNPC.attributePoints = 0;
        }
        
        const levelDiff = newLevel - oldLevel;
        
        if (levelDiff > 0) {
            // Level up: gain attribute points
            this.currentNPC.attributePoints += levelDiff * 2; // 2 points per level
            this.showMessage(`Level increased! You gained ${levelDiff * 2} attribute points.`, 'success');
        } else if (levelDiff < 0) {
            // Level down: randomly reduce attributes
            const levelsLost = Math.abs(levelDiff);
            this.handleLevelDown(levelsLost);
            this.showMessage(`Level decreased! Attributes randomly reduced.`, 'warning');
        }
        
        this.updateAttributePointsDisplay();
    }
    
    /**
     * Handle level down by randomly reducing attributes
     */
    handleLevelDown(levelsLost) {
        const attributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        for (let level = 0; level < levelsLost; level++) {
            // Pick 3 random attributes to reduce
            const shuffled = [...attributes].sort(() => 0.5 - Math.random());
            const toReduce = shuffled.slice(0, 3);
            
            toReduce.forEach(attr => {
                const currentValue = this.currentNPC.stats?.[attr] || this.currentNPC[attr] || 10;
                if (currentValue > 2) { // Can't go below 2
                    const newValue = currentValue - 1;
                    if (!this.currentNPC.stats) this.currentNPC.stats = {};
                    this.currentNPC.stats[attr] = newValue;
                    this.currentNPC[attr] = newValue;
                    
                    // Update display
                    const statElement = document.getElementById(`stat-${attr}`);
                    if (statElement) {
                        statElement.textContent = newValue;
                    }
                }
            });
        }
    }
    
    /**
     * Update attribute points display
     */
    updateAttributePointsDisplay() {
        const pointsDisplay = document.getElementById('attribute-points-display');
        if (pointsDisplay) {
            const points = this.currentNPC.attributePoints || 0;
            pointsDisplay.textContent = points;
            pointsDisplay.style.color = points > 0 ? '#4caf50' : '#f44336';
        }
    }
    
    /**
     * Cancel field edit
     */
    cancelFieldEdit(fieldName) {
        const input = document.getElementById(`edit-${fieldName}`);
        if (!input) return;
        
        // Restore original value
        switch(fieldName) {
            case 'name':
                input.value = this.originalNPC.name;
                break;
            case 'level':
                input.value = this.originalNPC.level;
                break;
            case 'race':
                input.value = this.originalNPC.race;
                break;
            case 'background':
                input.value = this.originalNPC.background;
                break;
        }
    }
    
    /**
     * Adjust stat value
     */
    adjustStat(statName, delta) {
        if (!this.currentNPC.stats) {
            this.currentNPC.stats = {};
        }
        
        const currentValue = this.currentNPC.stats[statName] || this.currentNPC[statName] || 10;
        const newValue = currentValue + delta;
        
        // Check limits
        if (newValue < 3 || newValue > 18) {
            this.showMessage('Attributes must be between 3 and 18', 'warning');
            return;
        }
        
        // Check attribute points for increases
        if (delta > 0) {
            const pointsNeeded = delta;
            const availablePoints = this.currentNPC.attributePoints || 0;
            
            if (availablePoints < pointsNeeded) {
                this.showMessage('Not enough attribute points!', 'warning');
                return;
            }
            
            // Spend points
            this.currentNPC.attributePoints -= pointsNeeded;
        } else if (delta < 0) {
            // Refund points when decreasing
            this.currentNPC.attributePoints = (this.currentNPC.attributePoints || 0) + Math.abs(delta);
        }
        
        // Apply the change
        this.currentNPC.stats[statName] = newValue;
        this.currentNPC[statName] = newValue; // Also set flat property for compatibility
        
        // Update display
        const statElement = document.getElementById(`stat-${statName}`);
        if (statElement) {
            statElement.textContent = newValue;
        }
        
        // Update attribute points display
        this.updateAttributePointsDisplay();
        
        // Recalculate dependent values
        this.updateCalculatedValues();
    }
    
    /**
     * Handle race change in edit mode
     */
    handleRaceChange() {
        const raceSelect = document.getElementById('edit-race');
        if (!raceSelect) return;
        
        const newRace = raceSelect.value;
        this.currentNPC.race = newRace;
        
        // Update race-specific maximums and recalculate
        this.updateCalculatedValues();
        this.showMessage('Race changed! Stats recalculated.', 'info');
    }
    
    /**
     * Handle background change in edit mode
     */
    handleBackgroundChange() {
        const backgroundSelect = document.getElementById('edit-background');
        if (!backgroundSelect) return;
        
        const newBackground = backgroundSelect.value;
        this.currentNPC.background = newBackground;
        
        this.showMessage('Background updated!', 'success');
    }
    
    /**
     * Update calculated values (HP, AC, etc.)
     */
    updateCalculatedValues() {
        if (!this.currentNPC) return;
        
        // Get current stats
        const stats = this.currentNPC.stats || {};
        const con = stats.constitution || this.currentNPC.constitution || 10;
        const dex = stats.dexterity || this.currentNPC.dexterity || 10;
        const level = this.currentNPC.level || 1;
        
        // Calculate HP (base + con modifier + level)
        const conMod = Math.floor((con - 10) / 2);
        const baseHP = this.currentNPC.type === 'enemy' ? 8 : 6;
        const newHP = Math.max(1, baseHP + conMod + (level - 1) * (baseHP/2 + conMod));
        
        // Calculate AC with armor type restrictions
        const dexMod = Math.floor((dex - 10) / 2);
        const armorType = (this.currentNPC.equipment?.armor || '').toLowerCase();
        const armorBonus = this.getArmorBonus(armorType);
        
        // Apply DEX restrictions based on armor type
        let effectiveDexMod = dexMod;
        if (this.isHeavyArmor(armorType)) {
            effectiveDexMod = 0; // Heavy armor: no DEX bonus
        } else if (this.isMediumArmor(armorType)) {
            effectiveDexMod = Math.min(dexMod, 2); // Medium armor: max DEX +2
        }
        // Light armor and no armor: full DEX bonus
        
        const newAC = 10 + effectiveDexMod + armorBonus;
        
        // Update NPC data
        this.currentNPC.hitPoints = Math.round(newHP);
        this.currentNPC.healthPoints = Math.round(newHP);
        this.currentNPC.armorClass = newAC;
        
        // Update display
        const hpDisplay = document.getElementById('display-hp');
        const acDisplay = document.getElementById('display-ac');
        
        if (hpDisplay) hpDisplay.textContent = Math.round(newHP);
        if (acDisplay) acDisplay.textContent = newAC;
    }
    
    /**
     * Check if armor type is heavy armor
     */
    isHeavyArmor(armorType) {
        const heavyArmors = ['chain mail', 'splint', 'plate', 'plate mail', 'full plate', 'field plate'];
        return heavyArmors.includes(armorType.toLowerCase());
    }
    
    /**
     * Check if armor type is medium armor
     */
    isMediumArmor(armorType) {
        const mediumArmors = ['hide', 'chain shirt', 'scale mail', 'breastplate', 'ring mail'];
        return mediumArmors.includes(armorType.toLowerCase());
    }
    
    /**
     * Get armor bonus for AC calculation
     */
    getArmorBonus(armorType) {
        const armorBonuses = {
            // No Armor
            'unarmored': 0,
            'clothing': 0,
            'robes': 0,
            
            // Light Armor (+1-3 AC, no DEX penalty)
            'padded': 1,
            'leather': 1,
            'studded leather': 2,
            'leather jacket': 1,
            
            // Medium Armor (+4-6 AC, max DEX +2)
            'hide': 4,
            'chain shirt': 5,
            'scale mail': 6,
            'breastplate': 5,
            'ring mail': 4,
            
            // Heavy Armor (+7-9 AC, no DEX bonus)
            'chain mail': 7,
            'splint': 8,
            'plate': 9,
            'plate mail': 9,
            'full plate': 9,
            'field plate': 8,
            
            // Shields (+2 AC, requires off-hand slot)
            'shield': 2,
            'buckler': 1,
            'tower shield': 3,
            
            // Special/Magical
            'mithril': 4,
            'dragon scale': 6,
            'crystal armor': 5,
            'power armor': 9,
            'nano suit': 7
        };
        
        return armorBonuses[armorType.toLowerCase()] || 0;
    }
    
    /**
     * Add new skill
     */
    addSkill() {
        if (!this.currentNPC.skills) {
            this.currentNPC.skills = [];
        }
        
        this.currentNPC.skills.push('New Skill');
        
        // Re-render skills section
        const skillsContainer = document.getElementById('edit-skills-container');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.renderEditableSkills(this.currentNPC.skills);
        }
    }
    
    /**
     * Remove skill
     */
    removeSkill(index) {
        if (!this.currentNPC.skills || index < 0 || index >= this.currentNPC.skills.length) return;
        
        this.currentNPC.skills.splice(index, 1);
        
        // Re-render skills section
        const skillsContainer = document.getElementById('edit-skills-container');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.renderEditableSkills(this.currentNPC.skills);
        }
    }
    
    /**
     * Add new weapon
     */
    addWeapon() {
        if (!this.currentNPC.equipment) {
            this.currentNPC.equipment = { weapons: [], armor: '', items: [] };
        }
        if (!this.currentNPC.equipment.weapons) {
            this.currentNPC.equipment.weapons = [];
        }
        
        const availableWeapons = this.getAvailableWeapons();
        const newWeapon = availableWeapons[0] || 'Dagger';
        
        this.currentNPC.equipment.weapons.push(newWeapon);
        
        // Re-render weapons section
        const weaponsContainer = document.getElementById('weapons-edit-container');
        if (weaponsContainer) {
            weaponsContainer.innerHTML = this.renderEditableWeapons(this.currentNPC.equipment.weapons);
        }
    }
    
    /**
     * Remove weapon
     */
    removeWeapon(index) {
        if (!this.currentNPC.equipment?.weapons || index < 0 || index >= this.currentNPC.equipment.weapons.length) return;
        
        this.currentNPC.equipment.weapons.splice(index, 1);
        
        // Re-render weapons section
        const weaponsContainer = document.getElementById('weapons-edit-container');
        if (weaponsContainer) {
            weaponsContainer.innerHTML = this.renderEditableWeapons(this.currentNPC.equipment.weapons);
        }
    }
    
    /**
     * Save NPC edits
     */
    saveNPCEdits() {
        // Collect all current edit values
        this.collectEditValues();
        
        // Update storage
        this.updateStoredNPC();
        
        // Exit edit mode
        this.isEditMode = false;
        this.originalNPC = null;
        
        // Refresh display
        this.displayNPC(this.currentNPC);
        
        // Refresh the saved NPCs list if we're on that tab
        const activeTab = document.querySelector('.npc-tab.active');
        if (activeTab && activeTab.textContent.includes('Saved')) {
            this.displaySavedNPCs();
        }
        
        this.showMessage('NPC saved successfully!', 'success');
    }
    
    /**
     * Save as new NPC
     */
    saveAsNewNPC() {
        // Collect all current edit values
        this.collectEditValues();
        
        // Create new NPC with unique ID
        const newNPC = {
            ...this.currentNPC,
            id: `npc_${Date.now()}`,
            name: this.currentNPC.name + ' (Copy)'
        };
        
        // Save to storage
        this.saveNPCToStorage(newNPC);
        
        // Set as current NPC
        this.currentNPC = newNPC;
        
        // Exit edit mode
        this.isEditMode = false;
        this.originalNPC = null;
        
        // Refresh display
        this.displayNPC(this.currentNPC);
        
        // Refresh the saved NPCs list if we're on that tab
        const activeTab = document.querySelector('.npc-tab.active');
        if (activeTab && activeTab.textContent.includes('Saved')) {
            this.displaySavedNPCs();
        }
        
        this.showMessage('NPC saved as new character!', 'success');
    }
    
    /**
     * Cancel edit mode
     */
    cancelEdit() {
        if (this.originalNPC) {
            // Restore original NPC data
            this.currentNPC = JSON.parse(JSON.stringify(this.originalNPC));
        }
        
        // Exit edit mode
        this.isEditMode = false;
        this.originalNPC = null;
        
        // Refresh display
        this.displayNPC(this.currentNPC);
        
        this.showMessage('Edit cancelled', 'info');
    }
    
    /**
     * Collect all edit values from form
     */
    collectEditValues() {
        // Basic info
        const nameInput = document.getElementById('edit-name');
        const levelInput = document.getElementById('edit-level');
        const raceSelect = document.getElementById('edit-race');
        const backgroundSelect = document.getElementById('edit-background');
        
        if (nameInput) this.currentNPC.name = nameInput.value.trim();
        if (levelInput) this.currentNPC.level = parseInt(levelInput.value) || 1;
        if (raceSelect) this.currentNPC.race = raceSelect.value;
        if (backgroundSelect) this.currentNPC.background = backgroundSelect.value;
        
        // Skills
        const skillInputs = document.querySelectorAll('.skill-edit-input');
        this.currentNPC.skills = Array.from(skillInputs)
            .map(input => input.value.trim())
            .filter(skill => skill.length > 0);
        
        // Weapons
        const weaponSelects = document.querySelectorAll('.weapon-select');
        if (!this.currentNPC.equipment) this.currentNPC.equipment = {};
        this.currentNPC.equipment.weapons = Array.from(weaponSelects)
            .map(select => select.value)
            .filter(weapon => weapon.length > 0);
        
        // Armor
        const armorInput = document.getElementById('edit-armor');
        if (armorInput) {
            this.currentNPC.equipment.armor = armorInput.value.trim();
        }
        
        // Other items
        const itemsTextarea = document.getElementById('edit-items');
        if (itemsTextarea) {
            this.currentNPC.equipment.items = itemsTextarea.value
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }
        
        // Notes
        const notesTextarea = document.getElementById('edit-notes');
        if (notesTextarea) {
            this.currentNPC.notes = notesTextarea.value.trim();
        }
    }
    
    /**
     * Save NPC to storage
     */
    saveNPCToStorage(npc) {
        try {
            const savedNPCs = JSON.parse(localStorage.getItem('storyteller_saved_npcs') || '[]');
            
            // Check if NPC already exists
            const existingIndex = savedNPCs.findIndex(saved => saved.id === npc.id);
            
            if (existingIndex >= 0) {
                // Update existing
                savedNPCs[existingIndex] = npc;
            } else {
                // Add new
                savedNPCs.push(npc);
            }
            
            localStorage.setItem('storyteller_saved_npcs', JSON.stringify(savedNPCs));
            
            // Update internal array
            this.savedNPCs = savedNPCs;
            
            // Update saved count if panel is active
            this.updateSavedCount();
            
        } catch (error) {
            console.error('Error saving NPC to storage:', error);
            this.showMessage('Error saving NPC', 'error');
        }
    }
    
    /**
     * Update stored NPC
     */
    updateStoredNPC() {
        if (!this.currentNPC || !this.currentNPC.id) {
            // If no ID, create one and save as new
            this.currentNPC.id = `npc_${Date.now()}`;
        }
        
        this.saveNPCToStorage(this.currentNPC);
    }
    
    /**
     * Update saved NPCs count display
     */
    updateSavedCount() {
        try {
            const savedNPCs = JSON.parse(localStorage.getItem('storyteller_saved_npcs') || '[]');
            const countElement = document.querySelector('.saved-count');
            if (countElement) {
                countElement.textContent = savedNPCs.length;
            }
        } catch (error) {
            console.error('Error updating saved count:', error);
        }
    }
}

// Default items list
NPCGenerator.prototype.npcItems = [
    'Health Potion', 'Rope (50ft)', 'Rations (3 days)', 'Gold Coins (2d6)',
    'Lockpicks', 'Healing Herbs', 'Map Fragment', 'Strange Crystal',
    'Old Key', 'Mysterious Letter', 'Silver Pendant', 'Worn Book',
    'Trade Goods', 'Tools of Trade', 'Lucky Charm', 'Family Heirloom',
    'Radiation Detector', 'Scrap Metal', 'Water Purifier', 'Old Photo'
];

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPCGenerator;
} else {
    window.NPCGenerator = NPCGenerator;
}
