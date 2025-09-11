// ========================================
// MAP EDITOR
// Create and manage battle maps and world maps
// ========================================

// ========================================
// MAP DATA DEFINITIONS
// ========================================

// Sprite sheet configuration
const SPRITE_CONFIG = {
    enabled: true, // Set to false to fallback to emojis
    path: 'assets/dungeon_sprite_sheet_ordered.png',
    tileSize: 64, // Each tile is 64x64 pixels
    sheetSize: 256, // Total sheet is 256x256 pixels
    tilesPerRow: 4
};

const tileOptions = [
    // Terrain - using Michelle's approach
    { type: "sprite", value: "0", name: "Mountain", category: "terrain" },
    { type: "sprite", value: "1", name: "Water", category: "terrain" },
    { type: "sprite", value: "2", name: "Grass", category: "terrain" },
    { type: "sprite", value: "3", name: "Rock", category: "terrain" },
    
    // Buildings
    { type: "sprite", value: "4", name: "Castle", category: "buildings" },
    { type: "sprite", value: "5", name: "House", category: "buildings" },
    { type: "sprite", value: "6", name: "Shop", category: "buildings" },
    { type: "sprite", value: "7", name: "Temple", category: "buildings" },
    
    // RPG Icons
    { type: "sprite", value: "8", name: "Dragon", category: "monsters" },
    { type: "sprite", value: "9", name: "Sword", category: "items" },
    { type: "sprite", value: "10", name: "Skull", category: "hazards" },
    { type: "sprite", value: "11", name: "Danger", category: "hazards" },
    
    // Special
    { type: "sprite", value: "12", name: "Tower", category: "buildings" },
    { type: "sprite", value: "13", name: "Road", category: "paths" },
    { type: "sprite", value: "14", name: "Door", category: "features" },
    { type: "sprite", value: "15", name: "Fire", category: "hazards" },
    
    // Legacy/Additional tiles
    { type: "emoji", value: "🌳", name: "Tree", category: "terrain" },
    { type: "player", value: "👤", name: "Player", category: "tokens" },
    { type: "clear", value: "", name: "Clear", category: "tools" }
];

// ========================================
// SPRITE SHEET UTILITIES
// ========================================
function getSpritePosition(spriteIndex) {
    const row = Math.floor(spriteIndex / SPRITE_CONFIG.tilesPerRow);
    const col = spriteIndex % SPRITE_CONFIG.tilesPerRow;
    const x = col * SPRITE_CONFIG.tileSize;
    const y = row * SPRITE_CONFIG.tileSize;
    return { x, y };
}

function createSpriteCSS(spriteIndex) {
    const pos = getSpritePosition(spriteIndex);
    return `
        background-image: url('${SPRITE_CONFIG.path}');
        background-position: -${pos.x}px -${pos.y}px;
        background-size: ${SPRITE_CONFIG.sheetSize}px ${SPRITE_CONFIG.sheetSize}px;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
    `;
}

function getTileDisplay(tileOption) {
    console.log('🎨 getTileDisplay called for:', tileOption.name, 'type:', tileOption.type, 'enabled:', SPRITE_CONFIG.enabled);
    
    if (SPRITE_CONFIG.enabled && tileOption.type === "sprite") {
        // Use Michelle's CSS class approach
        const tileDiv = `<div class="tile tile-${tileOption.value}"></div>`;
        console.log('🎨 Creating Michelle sprite tile with class:', `tile-${tileOption.value}`);
        return tileDiv;
    } else {
        // Fallback to emoji or other display methods
        const value = tileOption.value || "";
        console.log('🎨 Using fallback display for:', tileOption.name, 'value:', value);
        if (tileOption.type === "rpg") {
            return `<i class="ra ${value}"></i>`;
        } else if (tileOption.type === "material") {
            return `<span class="material-icons">${value}</span>`;
        } else {
            return value;
        }
    }
}

// Check if sprite sheet is available
function checkSpriteAvailability() {
    if (!SPRITE_CONFIG.enabled) {
        console.log('🎨 Sprite config is disabled');
        return false;
    }
    
    console.log('🎨 Checking sprite availability at:', SPRITE_CONFIG.path);
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            console.log('✅ Sprite sheet loaded successfully!');
            resolve(true);
        };
        img.onerror = () => {
            console.error('❌ Sprite sheet failed to load from:', SPRITE_CONFIG.path);
            resolve(false);
        };
        img.src = SPRITE_CONFIG.path;
    });
}

const mapTemplates = {
    dungeon: {
        name: "Dungeon",
        tiles: ["🏰", "🚪", "🗻", "🔥", "💀"],
        weights: [0.3, 0.2, 0.3, 0.1, 0.1]
    },
    wilderness: {
        name: "Wilderness", 
        tiles: ["🌳", "🌿", "🏔️", "💧", "🗻"],
        weights: [0.4, 0.3, 0.15, 0.1, 0.05]
    },
    town: {
        name: "Town",
        tiles: ["🏠", "🏪", "🛤️", "⛪", "🌳"],
        weights: [0.4, 0.2, 0.2, 0.1, 0.1]
    },
    cave: {
        name: "Cave",
        tiles: ["🗻", "💧", "💎", "🔥", "🕳️"],
        weights: [0.5, 0.2, 0.1, 0.1, 0.1]
    }
};

// ========================================
// MAP STATE
// ========================================
let currentMap = {
    size: 15,
    mapData: [],
    playerLayer: [],
    name: "Untitled Map",
    type: "dungeon"
};

let currentSelection = tileOptions[0];
let isDragging = false;

// ========================================
// MAP INITIALIZATION
// ========================================
async function initializeMapEditor() {
    // Check sprite availability first
    const spritesAvailable = await checkSpriteAvailability();
    if (!spritesAvailable) {
        console.warn('🎨 Sprite sheet not found, falling back to emoji tiles');
        SPRITE_CONFIG.enabled = false;
    } else {
        console.log('🎨 Sprite sheet loaded successfully!');
    }
    
    createTileSelector();
    initializeMapTypeSelector();
    initializeMapSizeSelector();
    resizeMap();
    refreshSavedMaps();
    
    // Show sprite status to user
    showSpriteStatus(spritesAvailable);
    
    console.log('Map editor initialized');
}

function showSpriteStatus(spritesAvailable) {
    const statusElement = document.getElementById('sprite-status');
    if (statusElement) {
        statusElement.innerHTML = spritesAvailable ? 
            '🎨 Enhanced sprites active' : 
            '📝 Using emoji tiles (sprites not found)';
        statusElement.className = spritesAvailable ? 'sprite-status-active' : 'sprite-status-fallback';
    }
}

function createTileSelector() {
    const selector = document.getElementById('tile-selector');
    if (!selector) return;
    
    selector.innerHTML = '';
    
    tileOptions.forEach((opt, i) => {
        const tile = document.createElement('div');
        tile.className = 'selector-tile';
        if (i === 0) tile.classList.add('selected');
        
        if (opt.type === "sprite") {
            // Use sprite display
            tile.innerHTML = getTileDisplay(opt);
        } else if (opt.type === "emoji") {
            tile.textContent = opt.value;
        } else if (opt.type === "material") {
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = opt.value;
            tile.appendChild(icon);
        } else if (opt.type === "rpg") {
            const icon = document.createElement('i');
            icon.classList.add('ra', opt.value);
            tile.appendChild(icon);
        } else if (opt.type === "road") {
            const road = document.createElement('div');
            road.classList.add('road-tile');
            road.textContent = opt.value;
            tile.appendChild(road);
        } else if (opt.type === "player") {
            const player = document.createElement('div');
            player.classList.add('player-icon');
            player.textContent = opt.value;
            tile.appendChild(player);
        } else if (opt.type === "clear") {
            tile.innerHTML = '🗑️';
            tile.style.background = 'var(--danger)';
        }
        
        tile.title = opt.name;
        tile.onclick = () => selectTile(opt, tile);
        
        selector.appendChild(tile);
    });
}

function selectTile(option, element) {
    document.querySelectorAll('.selector-tile').forEach(t => t.classList.remove('selected'));
    element.classList.add('selected');
    currentSelection = option;
    
    // Update current tool display if it exists
    const currentToolDisplay = document.getElementById('current-tool');
    if (currentToolDisplay) {
        currentToolDisplay.textContent = `${option.value || option.emoji || ''} ${option.name}`;
    }
}

function initializeMapTypeSelector() {
    document.querySelectorAll('.map-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.map-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMap.type = btn.dataset.type;
        });
    });
}

function initializeMapSizeSelector() {
    const mapSizeSelect = document.getElementById('map-size'); // Fixed ID to match HTML
    if (mapSizeSelect) {
        mapSizeSelect.addEventListener('change', (e) => {
            const sizeMap = { small: 10, medium: 15, large: 20 };
            currentMap.size = sizeMap[e.target.value];
            resizeMap();
        });
    }
}

// New function for size buttons
function setMapSize(size) {
    const sizeMap = { small: 10, medium: 15, large: 20 };
    currentMap.size = sizeMap[size];
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.dataset.size === size) {
            btn.style.background = 'var(--accent-color)';
            btn.style.borderColor = 'var(--accent-color)';
            btn.style.color = 'white';
            btn.classList.add('active');
        } else {
            btn.style.background = 'var(--bg-primary)';
            btn.style.borderColor = 'var(--border-color)';
            btn.style.color = 'var(--text-primary)';
            btn.classList.remove('active');
        }
    });
    
    resizeMap();
}

// ========================================
// MAP GRID MANAGEMENT
// ========================================
function resizeMap() {
    const size = currentMap.size;
    const totalTiles = size * size;
    
    // Resize data arrays
    currentMap.mapData = Array(totalTiles).fill(null);
    currentMap.playerLayer = Array(totalTiles).fill(null);
    
    // Update grid
    const grid = document.getElementById('map-grid');
    if (!grid) return;
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    
    // Create tiles
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'map-tile';
        tile.dataset.idx = i;
        
        // Mouse events for drawing
        tile.addEventListener('mousedown', () => {
            isDragging = true;
            placeTile(i);
        });
        
        tile.addEventListener('mouseenter', () => {
            if (isDragging) placeTile(i);
        });
        
        tile.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        renderTile(tile, null, null);
        grid.appendChild(tile);
    }
    
    // Global mouse up to stop dragging
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Update display
    const gridSizeDisplay = document.getElementById('grid-size-display');
    if (gridSizeDisplay) {
        gridSizeDisplay.textContent = `${size}x${size}`;
    }
    updateTilesPlacedCounter();
}

function placeTile(index) {
    const tile = document.querySelector(`[data-idx="${index}"]`);
    
    if (currentSelection.type === "clear") {
        currentMap.mapData[index] = null;
        currentMap.playerLayer[index] = null;
    } else if (currentSelection.type === "player") {
        currentMap.playerLayer[index] = currentSelection;
    } else {
        currentMap.mapData[index] = currentSelection;
        currentMap.playerLayer[index] = null; // Clear player when placing terrain
    }
    
    renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
    updateTilesPlacedCounter();
}

function renderTile(tile, mapData, playerData) {
    tile.innerHTML = '';
    tile.className = 'map-tile';
    
    // Render map data (terrain/buildings)
    if (mapData) {
        if (mapData.type === "sprite") {
            // Use Michelle's CSS class approach
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `tile tile-${mapData.value}`;
            tile.appendChild(spriteDiv);
            console.log('🎨 Rendered sprite tile with class:', `tile-${mapData.value}`);
        } else if (mapData.type === "emoji") {
            tile.textContent = mapData.value;
        } else if (mapData.type === "material") {
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = mapData.value;
            tile.appendChild(icon);
        } else if (mapData.type === "rpg") {
            const icon = document.createElement('i');
            icon.classList.add('ra', mapData.value);
            tile.appendChild(icon);
        } else if (mapData.type === "road") {
            tile.classList.add('road-tile');
            tile.textContent = mapData.value;
        }
    }
    
    // Render player data (overlay)
    if (playerData) {
        const player = document.createElement('div');
        player.classList.add('player-overlay');
        player.textContent = playerData.value;
        tile.appendChild(player);
    }
}

function updateTilesPlacedCounter() {
    const placedCount = currentMap.mapData.filter(tile => tile !== null).length +
                      currentMap.playerLayer.filter(tile => tile !== null).length;
    const tilesPlacedElement = document.getElementById('tiles-placed');
    if (tilesPlacedElement) {
        tilesPlacedElement.textContent = placedCount;
    }
}

// ========================================
// RANDOM MAP GENERATION
// ========================================
function generateRandomMap() {
    const template = mapTemplates[currentMap.type];
    const size = currentMap.size;
    
    // Clear existing map
    currentMap.mapData = Array(size * size).fill(null);
    currentMap.playerLayer = Array(size * size).fill(null);
    
    // Use different algorithms based on map type
    switch (currentMap.type) {
        case 'dungeon':
            generateDungeonMap(size);
            break;
        case 'cave':
            generateCaveMap(size);
            break;
        case 'wilderness':
            generateWildernessMap(size);
            break;
        case 'town':
            generateTownMap(size);
            break;
        default:
            generateBasicRandomMap(size, template);
    }
    
    // Re-render the grid
    const grid = document.getElementById('map-grid');
    const tiles = grid.querySelectorAll('.map-tile');
    tiles.forEach((tile, index) => {
        renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
    });
    
    updateTilesPlacedCounter();
    
    showNotification('success', 'Random Map Generated', 
        `Created ${template.name} map using procedural generation`, 
        `${size}x${size} grid with realistic layout`);
}

// ========================================
// DUNGEON GENERATION (BSP Algorithm)
// ========================================
function generateDungeonMap(size) {
    // Create walls everywhere first
    const wallTile = tileOptions.find(opt => opt.value === "🗻");
    for (let i = 0; i < size * size; i++) {
        currentMap.mapData[i] = wallTile;
    }
    
    // BSP recursive room generation
    const rooms = [];
    generateBSPRooms(0, 0, size, size, rooms, 3); // 3 levels deep
    
    // Clear rooms
    const floorTile = tileOptions.find(opt => opt.type === "clear");
    rooms.forEach(room => {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                const index = y * size + x;
                if (index >= 0 && index < size * size) {
                    currentMap.mapData[index] = null; // Clear floor
                }
            }
        }
    });
    
    // Connect rooms with corridors
    connectRooms(rooms, size);
    
    // Add doors
    addDoors(rooms, size);
    
    // Add some decorative elements
    addDungeonDetails(rooms, size);
}

function generateBSPRooms(x, y, width, height, rooms, depth) {
    if (depth <= 0 || width < 8 || height < 8) {
        // Create a room in this space
        const roomWidth = Math.max(3, Math.floor(width * 0.6));
        const roomHeight = Math.max(3, Math.floor(height * 0.6));
        const roomX = x + Math.floor((width - roomWidth) / 2);
        const roomY = y + Math.floor((height - roomHeight) / 2);
        
        rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
        return;
    }
    
    // Split randomly horizontally or vertically
    const splitHorizontally = Math.random() < 0.5;
    
    if (splitHorizontally) {
        const splitY = y + Math.floor(height * (0.3 + Math.random() * 0.4));
        generateBSPRooms(x, y, width, splitY - y, rooms, depth - 1);
        generateBSPRooms(x, splitY, width, height - (splitY - y), rooms, depth - 1);
    } else {
        const splitX = x + Math.floor(width * (0.3 + Math.random() * 0.4));
        generateBSPRooms(x, y, splitX - x, height, rooms, depth - 1);
        generateBSPRooms(splitX, y, width - (splitX - x), height, rooms, depth - 1);
    }
}

function connectRooms(rooms, size) {
    for (let i = 0; i < rooms.length - 1; i++) {
        const room1 = rooms[i];
        const room2 = rooms[i + 1];
        
        const x1 = Math.floor(room1.x + room1.width / 2);
        const y1 = Math.floor(room1.y + room1.height / 2);
        const x2 = Math.floor(room2.x + room2.width / 2);
        const y2 = Math.floor(room2.y + room2.height / 2);
        
        // Create L-shaped corridor
        createCorridor(x1, y1, x2, y1, size); // Horizontal
        createCorridor(x2, y1, x2, y2, size); // Vertical
    }
}

function createCorridor(x1, y1, x2, y2, size) {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const index = y * size + x;
            if (index >= 0 && index < size * size) {
                currentMap.mapData[index] = null; // Clear corridor
            }
        }
    }
}

function addDoors(rooms, size) {
    const doorTile = tileOptions.find(opt => opt.value === "🚪");
    
    rooms.forEach(room => {
        // Add doors on room edges
        const sides = [
            { x: room.x + Math.floor(room.width / 2), y: room.y }, // Top
            { x: room.x + Math.floor(room.width / 2), y: room.y + room.height - 1 }, // Bottom
            { x: room.x, y: room.y + Math.floor(room.height / 2) }, // Left
            { x: room.x + room.width - 1, y: room.y + Math.floor(room.height / 2) } // Right
        ];
        
        // Randomly place 1-2 doors
        const doorCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < doorCount; i++) {
            const side = sides[Math.floor(Math.random() * sides.length)];
            const index = side.y * size + side.x;
            if (index >= 0 && index < size * size) {
                currentMap.mapData[index] = doorTile;
            }
        }
    });
}

function addDungeonDetails(rooms, size) {
    const treasureTile = tileOptions.find(opt => opt.value === "ra-gem");
    const dangerTile = tileOptions.find(opt => opt.value === "ra-skull");
    
    rooms.forEach(room => {
        // 30% chance for treasure
        if (Math.random() < 0.3) {
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
            const index = y * size + x;
            if (index >= 0 && index < size * size) {
                currentMap.mapData[index] = treasureTile;
            }
        }
        
        // 20% chance for danger
        if (Math.random() < 0.2) {
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
            const index = y * size + x;
            if (index >= 0 && index < size * size) {
                currentMap.mapData[index] = dangerTile;
            }
        }
    });
}

// ========================================
// CAVE GENERATION (Cellular Automata)
// ========================================
function generateCaveMap(size) {
    // Initialize with random noise (45% wall density)
    let grid = [];
    for (let i = 0; i < size * size; i++) {
        grid[i] = Math.random() < 0.45 ? 1 : 0; // 1 = wall, 0 = empty
    }
    
    // Apply cellular automata rules 5 times
    for (let iteration = 0; iteration < 5; iteration++) {
        grid = applyCellularAutomataRules(grid, size);
    }
    
    // Convert to tiles
    const wallTile = tileOptions.find(opt => opt.value === "🗻");
    const waterTile = tileOptions.find(opt => opt.value === "💧");
    
    for (let i = 0; i < size * size; i++) {
        if (grid[i] === 1) {
            currentMap.mapData[i] = wallTile;
        } else {
            // Occasionally add water pools
            if (Math.random() < 0.1) {
                currentMap.mapData[i] = waterTile;
            } else {
                currentMap.mapData[i] = null; // Empty cave floor
            }
        }
    }
    
    // Add cave details
    addCaveDetails(size);
}

function applyCellularAutomataRules(grid, size) {
    const newGrid = [...grid];
    
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = y * size + x;
            const neighborWalls = countNeighborWalls(grid, x, y, size);
            
            // Cellular automata rules
            if (neighborWalls >= 4) {
                newGrid[index] = 1; // Become/stay wall
            } else if (neighborWalls < 4) {
                newGrid[index] = 0; // Become/stay empty
            }
        }
    }
    
    return newGrid;
}

function countNeighborWalls(grid, x, y, size) {
    let count = 0;
    
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Treat out-of-bounds as walls
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
                count++;
            } else {
                const index = ny * size + nx;
                if (grid[index] === 1) count++;
            }
        }
    }
    
    return count;
}

function addCaveDetails(size) {
    const treasureTile = tileOptions.find(opt => opt.value === "ra-gem");
    const fireTile = tileOptions.find(opt => opt.value === "🔥");
    
    // Add some treasure and light sources
    for (let i = 0; i < size * size; i++) {
        if (currentMap.mapData[i] === null && Math.random() < 0.05) {
            if (Math.random() < 0.7) {
                currentMap.mapData[i] = treasureTile;
            } else {
                currentMap.mapData[i] = fireTile;
            }
        }
    }
}

// ========================================
// WILDERNESS GENERATION (Perlin-like Noise)
// ========================================
function generateWildernessMap(size) {
    // Generate height map using simple noise
    const heightMap = generateHeightMap(size);
    
    // Convert heights to terrain types
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = y * size + x;
            const height = heightMap[index];
            
            let tile = null;
            if (height < 0.2) {
                tile = tileOptions.find(opt => opt.value === "💧"); // Water
            } else if (height < 0.4) {
                tile = tileOptions.find(opt => opt.value === "🌿"); // Grass
            } else if (height < 0.7) {
                tile = tileOptions.find(opt => opt.value === "🌳"); // Trees
            } else {
                tile = tileOptions.find(opt => opt.value === "🏔️"); // Mountains
            }
            
            currentMap.mapData[index] = tile;
        }
    }
    
    // Add paths connecting high-traffic areas
    addWildernessDetails(size);
}

function generateHeightMap(size) {
    const heightMap = [];
    
    // Simple noise generation (simplified Perlin-like)
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let height = 0;
            
            // Multiple octaves of noise
            height += noise(x * 0.1, y * 0.1) * 0.5;
            height += noise(x * 0.05, y * 0.05) * 0.3;
            height += noise(x * 0.02, y * 0.02) * 0.2;
            
            // Normalize to 0-1 range
            height = (height + 1) / 2;
            
            heightMap.push(height);
        }
    }
    
    return heightMap;
}

function noise(x, y) {
    // Simple pseudo-random noise function
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Returns -1 to 1
}

function addWildernessDetails(size) {
    const roadTile = tileOptions.find(opt => opt.type === "road");
    
    // Add a simple path across the map
    const pathY = Math.floor(size / 2);
    for (let x = 0; x < size; x++) {
        const index = pathY * size + x;
        if (Math.random() < 0.8) { // 80% chance to place road
            currentMap.mapData[index] = roadTile;
        }
    }
}

// ========================================
// TOWN GENERATION (Grid-based)
// ========================================
function generateTownMap(size) {
    // Start with roads as base
    const roadTile = tileOptions.find(opt => opt.type === "road");
    
    // Create road grid
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = y * size + x;
            
            // Create main roads every 4-5 tiles
            if (x % 4 === 0 || y % 4 === 0 || x === size - 1 || y === size - 1) {
                currentMap.mapData[index] = roadTile;
            }
        }
    }
    
    // Fill in building plots
    const buildings = [
        tileOptions.find(opt => opt.value === "🏠"),  // Houses
        tileOptions.find(opt => opt.value === "🏪"),  // Shops
        tileOptions.find(opt => opt.value === "⛪"),  // Temple
    ];
    
    for (let x = 1; x < size - 1; x += 4) {
        for (let y = 1; y < size - 1; y += 4) {
            // Create 2x2 building plots
            for (let dx = 0; dx < 2 && x + dx < size - 1; dx++) {
                for (let dy = 0; dy < 2 && y + dy < size - 1; dy++) {
                    const index = (y + dy) * size + (x + dx);
                    if (currentMap.mapData[index] === null) {
                        // Choose building type based on probability
                        let buildingTile;
                        const rand = Math.random();
                        if (rand < 0.7) {
                            buildingTile = buildings[0]; // House (70%)
                        } else if (rand < 0.9) {
                            buildingTile = buildings[1]; // Shop (20%)
                        } else {
                            buildingTile = buildings[2]; // Temple (10%)
                        }
                        
                        currentMap.mapData[index] = buildingTile;
                    }
                }
            }
        }
    }
    
    // Add some trees for decoration
    addTownDetails(size);
}

function addTownDetails(size) {
    const treeTile = tileOptions.find(opt => opt.value === "🌳");
    
    // Add trees in empty spaces
    for (let i = 0; i < size * size; i++) {
        if (currentMap.mapData[i] === null && Math.random() < 0.1) {
            currentMap.mapData[i] = treeTile;
        }
    }
}

// ========================================
// FALLBACK: Basic Random Generation
// ========================================
function generateBasicRandomMap(size, template) {
    const totalTiles = size * size;
    
    for (let i = 0; i < totalTiles; i++) {
        // Skip some tiles for empty space
        if (Math.random() < 0.3) continue;
        
        const randomTile = getWeightedRandomTile(template);
        const tileOption = tileOptions.find(opt => opt.value === randomTile);
        
        if (tileOption) {
            currentMap.mapData[i] = tileOption;
        }
    }
    
    // Add some random players/NPCs
    for (let i = 0; i < totalTiles; i++) {
        if (Math.random() < 0.05) {
            const playerTile = tileOptions.find(opt => opt.type === "player");
            if (playerTile) {
                currentMap.playerLayer[i] = playerTile;
            }
        }
    }
}

function getWeightedRandomTile(template) {
    const random = Math.random();
    let weightSum = 0;
    
    for (let i = 0; i < template.tiles.length; i++) {
        weightSum += template.weights[i];
        if (random <= weightSum) {
            return template.tiles[i];
        }
    }
    
    return template.tiles[0]; // Fallback
}

// ========================================
// MAP ACTIONS
// ========================================
function saveCurrentMap() {
    const mapName = prompt('Enter map name:', currentMap.name || 'Untitled Map');
    if (!mapName) return;
    
    const mapToSave = {
        id: generateId(),
        name: mapName,
        size: currentMap.size,
        type: currentMap.type,
        mapData: currentMap.mapData,
        playerLayer: currentMap.playerLayer,
        created: new Date().toISOString()
    };
    
    currentSession.maps.push(mapToSave);
    currentMap.name = mapName;
    
    refreshSavedMaps();
    
    showNotification('success', 'Map Saved', 
        `Saved "${mapName}"`, 
        `Added to ${currentSession.name}`);
}

function clearMap() {
    if (confirm('Clear the entire map?\n\nThis action cannot be undone.')) {
        const size = currentMap.size;
        const totalTiles = size * size;
        
        currentMap.mapData = Array(totalTiles).fill(null);
        currentMap.playerLayer = Array(totalTiles).fill(null);
        
        const grid = document.getElementById('map-grid');
        const tiles = grid.querySelectorAll('.map-tile');
        tiles.forEach((tile, index) => {
            renderTile(tile, null, null);
        });
        
        updateTilesPlacedCounter();
        
        showNotification('info', 'Map Cleared', 
            'Map has been cleared', 
            'Ready for new design');
    }
}

function exportMapToFile() {
    const exportData = {
        name: currentMap.name || 'Untitled Map',
        size: currentMap.size,
        type: currentMap.type,
        mapData: currentMap.mapData,
        playerLayer: currentMap.playerLayer,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentMap.name || 'map').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Map Exported', 
        `Exported "${currentMap.name}"`, 
        'File downloaded to your device');
}

function importMapFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (importedData.mapData && importedData.size) {
                        currentMap = {
                            size: importedData.size,
                            mapData: importedData.mapData || [],
                            playerLayer: importedData.playerLayer || [],
                            name: importedData.name || 'Imported Map',
                            type: importedData.type || 'dungeon'
                        };
                        
                        // Update UI
                        document.getElementById('map-size-select').value = 
                            currentMap.size === 10 ? 'small' : 
                            currentMap.size === 15 ? 'medium' : 'large';
                        
                        resizeMap();
                        
                        // Re-render tiles
                        const grid = document.getElementById('map-grid');
                        const tiles = grid.querySelectorAll('.map-tile');
                        tiles.forEach((tile, index) => {
                            renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
                        });
                        
                        updateTilesPlacedCounter();
                        
                        showNotification('success', 'Map Imported', 
                            `Imported "${currentMap.name}"`, 
                            'Map loaded successfully!');
                    } else {
                        throw new Error('Invalid map format');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification('error', 'Import Failed', 
                        'Invalid map file', 
                        'Please check the file format');
                }
            };
            reader.readAsText(file);
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    input.click();
}

// ========================================
// SAVED MAPS MANAGEMENT
// ========================================
function refreshSavedMaps() {
    const container = document.getElementById('saved-maps-container');
    if (!container) return;
    
    if (!currentSession.maps || currentSession.maps.length === 0) {
        container.innerHTML = `
            <div class="no-maps">
                <i class="ra ra-map" style="font-size: 3em; margin-bottom: 15px; color: #6b7280;"></i>
                <p>No saved maps yet. Create and save some maps for your adventures!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentSession.maps.map(map => createSavedMapCard(map)).join('');
}

function createSavedMapCard(map) {
    const tilesCount = (map.mapData?.filter(t => t !== null).length || 0) + 
                     (map.playerLayer?.filter(t => t !== null).length || 0);
    
    return `
        <div class="saved-map-card" onclick="loadSavedMap('${map.id}')">
            <div class="saved-map-header">
                <div class="saved-map-name">${map.name}</div>
                <div class="saved-map-size">${map.size}x${map.size}</div>
            </div>
            
            <div class="saved-map-details">
                Type: ${capitalize(map.type)} | ${tilesCount} tiles placed
            </div>
            
            <div class="saved-map-actions">
                <button class="saved-action-btn" onclick="event.stopPropagation(); copySavedMap('${map.id}')" title="Duplicate">
                    📋
                </button>
                <button class="saved-action-btn delete-saved-btn" onclick="event.stopPropagation(); deleteSavedMap('${map.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function loadSavedMap(mapId) {
    const map = currentSession.maps.find(m => m.id === mapId);
    if (map) {
        currentMap = {
            size: map.size,
            mapData: map.mapData || [],
            playerLayer: map.playerLayer || [],
            name: map.name,
            type: map.type || 'dungeon'
        };
        
        // Update UI
        const sizeSelect = document.getElementById('map-size-select');
        sizeSelect.value = map.size === 10 ? 'small' : map.size === 15 ? 'medium' : 'large';
        
        resizeMap();
        
        // Re-render tiles
        const grid = document.getElementById('map-grid');
        const tiles = grid.querySelectorAll('.map-tile');
        tiles.forEach((tile, index) => {
            renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
        });
        
        updateTilesPlacedCounter();
        
        showNotification('info', 'Map Loaded', 
            `Loaded "${map.name}"`, 
            'You can now edit this map');
    }
}

function copySavedMap(mapId) {
    const map = currentSession.maps.find(m => m.id === mapId);
    if (map) {
        const mapCopy = {
            id: generateId(),
            name: `${map.name} (Copy)`,
            size: map.size,
            type: map.type,
            mapData: [...map.mapData],
            playerLayer: [...map.playerLayer],
            created: new Date().toISOString()
        };
        
        currentSession.maps.push(mapCopy);
        refreshSavedMaps();
        
        showNotification('success', 'Map Duplicated', 
            `Created copy of "${map.name}"`, 
            'New map added to session');
    }
}

function deleteSavedMap(mapId) {
    const map = currentSession.maps.find(m => m.id === mapId);
    if (map && confirm(`Delete "${map.name}"?\n\nThis action cannot be undone.`)) {
        currentSession.maps = currentSession.maps.filter(m => m.id !== mapId);
        refreshSavedMaps();
        
        showNotification('success', 'Map Deleted', 
            `Deleted "${map.name}"`, 
            'Map removed from session');
    }
}

function clearAllMaps() {
    if (!currentSession.maps || currentSession.maps.length === 0) return;
    
    if (confirm(`Clear all maps from ${currentSession.name}?\n\nThis will remove ${currentSession.maps.length} maps and cannot be undone.`)) {
        currentSession.maps = [];
        refreshSavedMaps();
        
        showNotification('success', 'Maps Cleared', 
            'All maps removed', 
            'Session cleared successfully');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function refreshMapDisplay() {
    refreshSavedMaps();
}

// Show load map dialog (refreshes the saved maps list)
function loadMapDialog() {
    refreshSavedMaps();
    // Could add a modal or expand saved maps section here
    console.log('📁 Load Map Dialog - showing saved maps');
}

// ========================================
// GLOBAL EXPORTS
// ========================================
window.generateRandomMap = generateRandomMap;
window.saveCurrentMap = saveCurrentMap;
window.clearMap = clearMap;
window.resizeMap = resizeMap;
window.setMapSize = setMapSize;
window.loadMapDialog = loadMapDialog;
window.exportMapToFile = exportMapToFile;
window.importMapFromFile = importMapFromFile;
window.loadSavedMap = loadSavedMap;
window.copySavedMap = copySavedMap;
window.deleteSavedMap = deleteSavedMap;
window.clearAllMaps = clearAllMaps;
window.refreshMapDisplay = refreshMapDisplay;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeMapEditor, 100);
});