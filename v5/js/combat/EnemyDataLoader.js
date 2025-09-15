/**
 * EnemyDataLoader - Loads and queries enemy data from enemies.json
 * Provides enemy information for combat encounters
 */
export class EnemyDataLoader {
    constructor() {
        this.enemiesData = null;
        this.isLoaded = false;
    }

    /**
     * Load enemies.json data
     */
    async loadEnemyData() {
        if (this.isLoaded) return this.enemiesData;

        try {
            console.log('📚 Loading enemy data from enemies.json...');
            const response = await fetch('data/enemies.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load enemies.json: ${response.status}`);
            }

            this.enemiesData = await response.json();
            this.isLoaded = true;
            
            console.log('✅ Enemy data loaded successfully');
            console.log(`📊 Available floors: ${Object.keys(this.enemiesData).join(', ')}`);
            
            return this.enemiesData;
        } catch (error) {
            console.error('❌ Failed to load enemy data:', error);
            throw error;
        }
    }

    /**
     * Get enemy by name from any floor
     * @param {string} enemyName - Name to search for (like "goblin_grunt")
     * @returns {Object|null} Enemy data with floor info
     */
    async getEnemyByName(enemyName) {
        await this.loadEnemyData();

        const searchName = enemyName.toLowerCase().replace(/\s+/g, '_');
        
        // Search through all floors
        for (const [floorKey, floorData] of Object.entries(this.enemiesData)) {
            if (floorData.enemies) {
                for (const [enemyKey, enemyData] of Object.entries(floorData.enemies)) {
                    if (enemyKey === searchName || 
                        enemyData.name.toLowerCase().replace(/\s+/g, '_') === searchName) {
                        
                        console.log(`🎯 Found enemy "${enemyName}" on ${floorData.name}`);
                        
                        return {
                            ...enemyData,
                            id: enemyKey,
                            floor: floorKey,
                            floorName: floorData.name,
                            floorTheme: floorData.theme,
                            spriteType: enemyKey // Use the key as sprite type
                        };
                    }
                }
            }
        }

        console.warn(`⚠️ Enemy "${enemyName}" not found in enemies.json`);
        return null;
    }

    /**
     * Get random enemy from specific floor
     * @param {string} floor - Floor key (like "floor_1")
     * @returns {Object|null} Random enemy data
     */
    async getRandomEnemyFromFloor(floor = 'floor_1') {
        await this.loadEnemyData();

        const floorData = this.enemiesData[floor];
        if (!floorData || !floorData.enemies) {
            console.warn(`⚠️ Floor "${floor}" not found`);
            return null;
        }

        const enemyKeys = Object.keys(floorData.enemies);
        const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
        const enemyData = floorData.enemies[randomKey];

        console.log(`🎲 Random enemy from ${floorData.name}: ${enemyData.name}`);

        return {
            ...enemyData,
            id: randomKey,
            floor: floor,
            floorName: floorData.name,
            floorTheme: floorData.theme,
            spriteType: randomKey
        };
    }

    /**
     * Get multiple random enemies for an encounter
     * @param {string} floor - Floor to get enemies from
     * @param {number} count - Number of enemies
     * @returns {Array} Array of enemy data
     */
    async getRandomEncounter(floor = 'floor_1', count = 1) {
        const enemies = [];
        
        for (let i = 0; i < count; i++) {
            const enemy = await this.getRandomEnemyFromFloor(floor);
            if (enemy) {
                // Add unique ID for multiple of same enemy type
                enemy.id = `${enemy.id}_${i + 1}`;
                enemy.instanceName = `${enemy.name} ${i + 1}`;
                enemies.push(enemy);
            }
        }

        console.log(`⚔️ Generated encounter: ${enemies.length} enemies from ${floor}`);
        return enemies;
    }

    /**
     * Get all enemies from a floor
     * @param {string} floor - Floor key
     * @returns {Array} All enemies from that floor
     */
    async getAllEnemiesFromFloor(floor = 'floor_1') {
        await this.loadEnemyData();

        const floorData = this.enemiesData[floor];
        if (!floorData || !floorData.enemies) {
            return [];
        }

        const enemies = [];
        for (const [enemyKey, enemyData] of Object.entries(floorData.enemies)) {
            enemies.push({
                ...enemyData,
                id: enemyKey,
                floor: floor,
                floorName: floorData.name,
                floorTheme: floorData.theme,
                spriteType: enemyKey
            });
        }

        return enemies;
    }

    /**
     * Search enemies by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching enemies
     */
    async searchEnemies(criteria = {}) {
        await this.loadEnemyData();

        const results = [];
        const { level, name, floor, hasAttack } = criteria;

        for (const [floorKey, floorData] of Object.entries(this.enemiesData)) {
            if (floor && floorKey !== floor) continue;

            if (floorData.enemies) {
                for (const [enemyKey, enemyData] of Object.entries(floorData.enemies)) {
                    let matches = true;

                    if (level && enemyData.level !== level) matches = false;
                    if (name && !enemyData.name.toLowerCase().includes(name.toLowerCase())) matches = false;
                    if (hasAttack && (!enemyData.attacks || !enemyData.attacks.some(a => a.name.toLowerCase().includes(hasAttack.toLowerCase())))) matches = false;

                    if (matches) {
                        results.push({
                            ...enemyData,
                            id: enemyKey,
                            floor: floorKey,
                            floorName: floorData.name,
                            floorTheme: floorData.theme,
                            spriteType: enemyKey
                        });
                    }
                }
            }
        }

        console.log(`🔍 Search found ${results.length} enemies matching criteria`);
        return results;
    }

    /**
     * Get floor information
     * @param {string} floor - Floor key
     * @returns {Object|null} Floor data
     */
    async getFloorInfo(floor) {
        await this.loadEnemyData();
        return this.enemiesData[floor] || null;
    }

    /**
     * Get all available floors
     * @returns {Array} Floor information
     */
    async getAllFloors() {
        await this.loadEnemyData();
        
        return Object.entries(this.enemiesData).map(([key, data]) => ({
            key: key,
            name: data.name,
            theme: data.theme,
            enemyCount: Object.keys(data.enemies || {}).length
        }));
    }
}

// Create singleton instance
window.enemyDataLoader = new EnemyDataLoader();

console.log('📚 EnemyDataLoader initialized and ready!');