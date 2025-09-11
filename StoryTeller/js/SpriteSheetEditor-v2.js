class SpriteSheetEditor {
    constructor() {
        this.gridWidth = 4;
        this.gridHeight = 4;
        this.spriteSize = 64;
        this.offsetX = 0;
        this.offsetY = 0;
        this.previewImage = null;
        this.sprites = [];
        this.backgroundColors = {};
        this.selectedCell = null;
        this.lockedCells = new Set(); // Track cells that shouldn't move during global alignment
        this.defaultTileset = null; // Store default.json data
        this.currentPalette = 'default';
        
        // Color Palettes
        this.colorPalettes = {
            default: {
                mountain: "#8B7355", water: "#4A90E2", grass: "#7CB342", rock: "#757575",
                castle: "#E0E0E0", house: "#FFAB40", shop: "#FF7043", temple: "#F5F5F5",
                dragon: "#FF5722", sword: "#CFD8DC", skull: "#424242", danger: "#FF9800",
                tower: "#9E9E9E", road: "#BCAAA4", door: "#8D6E63", fire: "#FF5722"
            },
            gothic: {
                mountain: "#2C1810", water: "#1A237E", grass: "#2E7D32", rock: "#424242",
                castle: "#616161", house: "#5D4037", shop: "#6A1B9A", temple: "#37474F",
                dragon: "#B71C1C", sword: "#455A64", skull: "#212121", danger: "#E65100",
                tower: "#424242", road: "#3E2723", door: "#4E342E", fire: "#BF360C"
            },
            bright: {
                mountain: "#FFE082", water: "#81D4FA", grass: "#C8E6C9", rock: "#F5F5F5",
                castle: "#FFECB3", house: "#FFCC02", shop: "#FF8A65", temple: "#E8F5E8",
                dragon: "#FF6B6B", sword: "#E1F5FE", skull: "#BDBDBD", danger: "#FFB74D",
                tower: "#E0E0E0", road: "#F0F4C3", door: "#BCAAA4", fire: "#FF8A50"
            },
            realistic: {
                mountain: "#8D6E63", water: "#1976D2", grass: "#689F38", rock: "#795548",
                castle: "#9E9E9E", house: "#FF8F00", shop: "#F57C00", temple: "#ECEFF1",
                dragon: "#8BC34A", sword: "#607D8B", skull: "#6D4C41", danger: "#FF5722",
                tower: "#78909C", road: "#8D6E63", door: "#5D4037", fire: "#FF5722"
            }
        };
        
        this.loadDefaultTileset();
        this.createModal();
    }
    
    async loadDefaultTileset() {
        try {
            const response = await fetch('assets/default.json');
            this.defaultTileset = await response.json();
            console.log('✅ Default tileset loaded:', this.defaultTileset.name);
        } catch (error) {
            console.error('❌ Failed to load default tileset:', error);
            this.defaultTileset = null;
        }
    }
    
    getSpriteNameForPosition(row, col) {
        if (!this.defaultTileset || !this.defaultTileset.sprites) return '';
        
        // Find sprite at this grid position
        const sprite = this.defaultTileset.sprites.find(s => 
            s.position && s.position[0] === col && s.position[1] === row
        );
        
        return sprite ? sprite.name : `Sprite ${row * this.gridWidth + col + 1}`;
    }
    
    getSpriteDataForPosition(row, col) {
        if (!this.defaultTileset || !this.defaultTileset.sprites) return null;
        
        const sprite = this.defaultTileset.sprites.find(s => 
            s.position && s.position[0] === col && s.position[1] === row
        );
        
        return sprite;
    }
    
    applyCurrentPalette() {
        // Apply palette colors to all cells based on their sprite names
        for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
            const row = Math.floor(i / this.gridWidth);
            const col = i % this.gridWidth;
            const spriteData = this.getSpriteDataForPosition(row, col);
            
            if (spriteData && spriteData.id) {
                const palette = this.colorPalettes[this.currentPalette];
                if (palette[spriteData.id]) {
                    this.backgroundColors[i] = palette[spriteData.id];
                }
            }
        }
        
        this.updateGrid();
        
        // Update color picker if a cell is selected
        if (this.selectedCell !== null) {
            const currentColor = this.backgroundColors[this.selectedCell] || '#8B7355';
            document.getElementById('sprite-color').value = currentColor;
            document.getElementById('sprite-color-hex').value = currentColor;
        }
        
        console.log(`🎨 Applied ${this.currentPalette} palette`);
    }
    
    autoDetectCellColor() {
        if (this.selectedCell === null || !this.sprites[this.selectedCell]) {
            alert('Please select a cell with a sprite first');
            return;
        }
        
        // Create a canvas to analyze the sprite
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Get dominant color using shared method
            const dominantColor = this.getDominantColor(ctx, canvas.width, canvas.height);
            
            // Apply the detected color
            this.backgroundColors[this.selectedCell] = dominantColor;
            document.getElementById('sprite-color').value = dominantColor;
            document.getElementById('sprite-color-hex').value = dominantColor;
            this.updateGrid();
            
            console.log(`🎯 Auto-detected color: ${dominantColor} for cell ${this.selectedCell + 1}`);
        };
        
        img.src = this.sprites[this.selectedCell];
    }
    
    autoDetectAllColors() {
        const totalCells = this.gridWidth * this.gridHeight;
        let processedCells = 0;
        let cellsWithSprites = 0;
        
        console.log('✨ Starting Auto All color detection...');
        
        // Create progress indication
        const button = document.getElementById('auto-detect-all');
        const originalText = button.innerHTML;
        
        for (let i = 0; i < totalCells; i++) {
            if (!this.sprites[i]) {
                processedCells++;
                continue; // Skip cells without sprites
            }
            
            cellsWithSprites++;
            
            // Create canvas to analyze each sprite
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = ((cellIndex) => {
                return () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Get dominant color for this cell
                    const dominantColor = this.getDominantColor(ctx, canvas.width, canvas.height);
                    
                    // Apply the detected color
                    this.backgroundColors[cellIndex] = dominantColor;
                    
                    processedCells++;
                    
                    // Update progress
                    const progress = Math.round((processedCells / totalCells) * 100);
                    button.innerHTML = `✨ ${progress}%`;
                    
                    // Check if all cells are processed
                    if (processedCells >= totalCells) {
                        this.updateGrid();
                        
                        // Update color picker if a cell is selected
                        if (this.selectedCell !== null) {
                            const currentColor = this.backgroundColors[this.selectedCell] || '#8B7355';
                            document.getElementById('sprite-color').value = currentColor;
                            document.getElementById('sprite-color-hex').value = currentColor;
                        }
                        
                        // Restore button text
                        setTimeout(() => {
                            button.innerHTML = originalText;
                        }, 1000);
                        
                        console.log(`✅ Auto All complete! Processed ${cellsWithSprites} cells with sprites`);
                        alert(`🎨 Auto-detected colors for ${cellsWithSprites} cells!`);
                    }
                };
            })(i);
            
            img.src = this.sprites[i];
        }
        
        if (cellsWithSprites === 0) {
            alert('No sprites found to analyze. Import a sprite sheet first!');
            button.innerHTML = originalText;
        }
    }
    
    getDominantColor(ctx, width, height) {
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Count color frequencies
        const colorCounts = {};
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Group similar colors (reduce precision)
            const rGroup = Math.floor(r / 32) * 32;
            const gGroup = Math.floor(g / 32) * 32;
            const bGroup = Math.floor(b / 32) * 32;
            
            const colorKey = `${rGroup},${gGroup},${bGroup}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
        
        // Find most common color
        let maxCount = 0;
        let dominantColor = '#8B7355';
        
        for (const colorKey in colorCounts) {
            if (colorCounts[colorKey] > maxCount) {
                maxCount = colorCounts[colorKey];
                const [r, g, b] = colorKey.split(',').map(Number);
                dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
        }
        
        return dominantColor;
    }
    
    setupSpectrumPicker() {
        const picker = document.getElementById('spectrum-picker');
        let isDragging = false;
        
        const updateColorFromPicker = (e) => {
            const rect = picker.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.max(0, Math.min(1, x / rect.width));
            
            // Convert position to HSL color
            const hue = percent * 360;
            const color = this.hslToHex(hue, 70, 50); // 70% saturation, 50% lightness
            
            // Update color inputs
            document.getElementById('sprite-color').value = color;
            document.getElementById('sprite-color-hex').value = color;
            
            // Apply to selected cell
            if (this.selectedCell !== null) {
                this.backgroundColors[this.selectedCell] = color;
                this.updateGrid();
            }
            
            // Update picker indicator position
            const indicator = picker.querySelector('::after') || picker;
            picker.style.setProperty('--indicator-pos', `${percent * 100}%`);
        };
        
        picker.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateColorFromPicker(e);
        });
        
        picker.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateColorFromPicker(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        picker.addEventListener('click', updateColorFromPicker);
    }
    
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    createModal() {
        // Create modal HTML with new CSS structure
        const modalHTML = `
            <div id="sprite-editor-modal" class="modal sprite-editor-modal">
                <div class="modal-content sprite-editor-modal-content">
                    <div class="modal-header sprite-editor-header">
                        <h2>🎨 Sprite Sheet Editor</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body sprite-editor-body">
                        
                        <!-- ROW 1: Color Swatches & Import -->
                        <div class="color-swatches-section">
                            <div class="color-palettes">
                                <h4>🎨 Color Palettes</h4>
                                <div class="palette-buttons">
                                    <button id="palette-default" class="palette-btn active" data-palette="default">🏔️ Default</button>
                                    <button id="palette-gothic" class="palette-btn" data-palette="gothic">🌑 Gothic</button>
                                    <button id="palette-bright" class="palette-btn" data-palette="bright">☀️ Bright</button>
                                    <button id="palette-realistic" class="palette-btn" data-palette="realistic">🌍 Realistic</button>
                                </div>
                            </div>
                            
                            <div class="import-section">
                                <button id="import-full-sheet" class="btn btn-primary">
                                    📁 Import Sprite Sheet
                                </button>
                                <input type="file" id="sheet-file-input" accept="image/*" style="display: none;">
                                
                                <div class="grid-size-controls">
                                    <label>Grid Size:</label>
                                    <select id="grid-width" style="padding: 4px 6px; font-size: 12px; margin-left: 5px;">
                                        <option value="3">3×3</option>
                                        <option value="4" selected>4×4</option>
                                        <option value="5">5×5</option>
                                        <option value="6">6×6</option>
                                        <option value="8">8×8</option>
                                    </select>
                                    <input type="hidden" id="grid-height" value="4">
                                </div>
                            </div>
                        </div>

                        <!-- ROW 2: Main Workspace (Sliders | Grid | Editor) -->
                        <div class="main-workspace">
                            <!-- Alignment Controls (Left) -->
                            <div class="alignment-controls">
                                <h4>⚙️ Alignment</h4>
                                <div class="controls-column">
                                    <div class="control-group">
                                        <label>Horizontal Shift</label>
                                        <input type="range" id="offset-x" value="0" min="-50" max="50" step="1">
                                        <span id="offset-x-value" class="value-display">0px</span>
                                    </div>
                                    
                                    <div class="control-group">
                                        <label>Vertical Shift</label>
                                        <input type="range" id="offset-y" value="0" min="-50" max="50" step="1">
                                        <span id="offset-y-value" class="value-display">0px</span>
                                    </div>
                                    
                                    <div class="control-group">
                                        <label>Cell Size</label>
                                        <input type="range" id="actual-sprite-size" value="64" min="48" max="80" step="1">
                                        <span id="sprite-size-value" class="value-display">64px</span>
                                    </div>
                                    
                                    <button id="reset-alignment" class="reset-button" title="Reset to center">↺ Reset</button>
                                </div>
                            </div>
                            
                            <!-- Sprite Grid (Center) -->
                            <div class="sprite-grid-container">
                                <h3>🖼️ Sprite Grid</h3>
                                <div id="sprite-grid" class="sprite-grid"></div>
                            </div>
                            
                            <!-- Cell Editor (Right) -->
                            <div class="cell-editor-container">
                                <h3>⚙️ Cell Editor</h3>
                                
                                <div class="form-group">
                                    <label>Sprite Name:</label>
                                    <input type="text" id="sprite-name" placeholder="e.g., mountain, forest" style="width: 100%;">
                                </div>
                                
                                <div class="form-group">
                                    <label>Category:</label>
                                    <select id="sprite-category" style="width: 100%;">
                                        <option value="terrain">Terrain</option>
                                        <option value="walls">Walls</option>
                                        <option value="floors">Floors</option>
                                        <option value="doors">Doors</option>
                                        <option value="items">Items</option>
                                        <option value="creatures">Creatures</option>
                                        <option value="hazards">Hazards</option>
                                        <option value="paths">Paths</option>
                                        <option value="features">Features</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Background Color:</label>
                                    <div class="color-controls">
                                        <div class="color-input-group">
                                            <input type="color" id="sprite-color" value="#8B7355">
                                            <input type="text" id="sprite-color-hex" placeholder="#8B7355">
                                        </div>
                                        <div class="auto-color-buttons">
                                            <button id="auto-detect-color" class="btn-auto-color" title="Auto-detect dominant color for selected cell">🎯 Auto</button>
                                            <button id="auto-detect-all" class="btn-auto-color-all" title="Auto-detect colors for all cells with sprites">✨ Auto All</button>
                                        </div>
                                    </div>
                                    
                                    <!-- Spectrum Color Picker -->
                                    <div id="spectrum-picker" style="margin-top: 8px;"></div>
                                </div>
                                
                                <div class="button-group">
                                    <button id="toggle-cell-lock" class="btn btn-lock">
                                        🔒 Lock Position
                                    </button>
                                    
                                    <button id="import-cell-image" class="btn btn-import">
                                        📁 Import Cell Image
                                    </button>
                                    <input type="file" id="cell-file-input" accept="image/*" style="display: none;">
                                    
                                    <button id="save-cell" class="btn btn-save">
                                        💾 Save Cell
                                    </button>
                                </div>
                                
                                <p class="lock-info">
                                    💡 Locked cells won't move when adjusting alignment sliders
                                </p>
                            </div>
                        </div>
                        
                        <!-- ROW 3: Export Section -->
                        <div class="export-section">
                            <h3>📤 Export Tileset</h3>
                            <div class="export-controls">
                                <input type="text" id="tileset-name" placeholder="Enter tileset name" value="Custom Tileset">
                                <button id="export-json" class="btn btn-export">📤 Export JSON</button>
                                <button id="export-png" class="btn btn-export">🖼️ Export PNG</button>
                            </div>
                        </div>

                        <!-- Hidden Legacy Controls (preserved for compatibility) -->
                        <div style="display: none;">
                            <select id="grid-width-old">
                                <option value="3">3</option>
                                <option value="4" selected>4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="8">8</option>
                            </select>
                            <select id="grid-height-old">
                                <option value="3">3</option>
                                <option value="4" selected>4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.setupEventListeners();
        this.createGrid();
    }
    
    setupEventListeners() {
        // Close modal functionality
        const modal = document.getElementById('sprite-editor-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Grid size control (unified selector)
        const gridWidthSelect = document.getElementById('grid-width');
        const gridHeightHidden = document.getElementById('grid-height');
        
        gridWidthSelect.addEventListener('change', (e) => {
            this.gridWidth = parseInt(e.target.value);
            this.gridHeight = parseInt(e.target.value); // Keep it square
            gridHeightHidden.value = e.target.value;
            this.createGrid();
        });
        
        // Color Palette Selection
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Switch palette
                this.currentPalette = e.target.dataset.palette;
                this.applyCurrentPalette();
            });
        });
        
        // Auto-detect color button
        document.getElementById('auto-detect-color').addEventListener('click', () => {
            this.autoDetectCellColor();
        });
        
        // Auto-detect all colors button
        document.getElementById('auto-detect-all').addEventListener('click', () => {
            this.autoDetectAllColors();
        });
        
        // Spectrum color picker
        this.setupSpectrumPicker();
        
        // Alignment controls
        const offsetXSlider = document.getElementById('offset-x');
        const offsetYSlider = document.getElementById('offset-y');
        const spriteSizeSlider = document.getElementById('actual-sprite-size');
        
        offsetXSlider.addEventListener('input', (e) => {
            this.offsetX = parseInt(e.target.value);
            document.getElementById('offset-x-value').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        offsetYSlider.addEventListener('input', (e) => {
            this.offsetY = parseInt(e.target.value);
            document.getElementById('offset-y-value').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        spriteSizeSlider.addEventListener('input', (e) => {
            this.spriteSize = parseInt(e.target.value);
            document.getElementById('sprite-size-value').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        // Reset button
        document.getElementById('reset-alignment').addEventListener('click', () => {
            this.offsetX = 0;
            this.offsetY = 0;
            this.spriteSize = 64;
            
            offsetXSlider.value = 0;
            offsetYSlider.value = 0;
            spriteSizeSlider.value = 64;
            
            document.getElementById('offset-x-value').textContent = '0px';
            document.getElementById('offset-y-value').textContent = '0px';
            document.getElementById('sprite-size-value').textContent = '64px';
            
            this.updatePreview();
        });
        
        // Import full sheet
        document.getElementById('import-full-sheet').addEventListener('click', () => {
            document.getElementById('sheet-file-input').click();
        });
        
        document.getElementById('sheet-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.loadSpriteSheet(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Import cell image
        document.getElementById('import-cell-image').addEventListener('click', () => {
            document.getElementById('cell-file-input').click();
        });
        
        document.getElementById('cell-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && this.selectedCell !== null) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.sprites[this.selectedCell] = e.target.result;
                    this.updateGrid();
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Cell lock toggle
        document.getElementById('toggle-cell-lock').addEventListener('click', () => {
            if (this.selectedCell !== null) {
                if (this.lockedCells.has(this.selectedCell)) {
                    this.lockedCells.delete(this.selectedCell);
                    document.getElementById('toggle-cell-lock').innerHTML = '🔒 Lock Position';
                } else {
                    this.lockedCells.add(this.selectedCell);
                    document.getElementById('toggle-cell-lock').innerHTML = '🔓 Unlock Position';
                }
                this.updateGrid();
            }
        });
        
        // Save cell
        document.getElementById('save-cell').addEventListener('click', () => {
            this.saveCurrentCell();
        });
        
        // Color inputs
        document.getElementById('sprite-color').addEventListener('change', (e) => {
            document.getElementById('sprite-color-hex').value = e.target.value;
            if (this.selectedCell !== null) {
                this.backgroundColors[this.selectedCell] = e.target.value;
                this.updateGrid();
            }
        });
        
        document.getElementById('sprite-color-hex').addEventListener('change', (e) => {
            document.getElementById('sprite-color').value = e.target.value;
            if (this.selectedCell !== null) {
                this.backgroundColors[this.selectedCell] = e.target.value;
                this.updateGrid();
            }
        });
        
        // Export functionality
        document.getElementById('export-json').addEventListener('click', () => {
            this.exportTileset();
        });
        
        document.getElementById('export-png').addEventListener('click', () => {
            this.exportSpriteSheetPNG();
        });
    }
    
    createGrid() {
        const gridContainer = document.getElementById('sprite-grid');
        gridContainer.innerHTML = '';
        
        // Set grid layout
        gridContainer.style.gridTemplateColumns = `repeat(${this.gridWidth}, 60px)`;
        
        // Create cells
        for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
            const cell = document.createElement('div');
            cell.className = 'sprite-cell';
            cell.dataset.index = i;
            
            // Add click handler
            cell.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.sprite-cell').forEach(c => c.classList.remove('selected'));
                // Add selection to current cell
                cell.classList.add('selected');
                this.selectedCell = i;
                this.updateCellEditor();
                
                // Auto-populate sprite name from default.json
                const row = Math.floor(i / this.gridWidth);
                const col = i % this.gridWidth;
                const spriteName = this.getSpriteNameForPosition(row, col);
                const spriteData = this.getSpriteDataForPosition(row, col);
                
                // Update form fields
                document.getElementById('sprite-name').value = spriteName;
                
                if (spriteData) {
                    // Set category if available
                    const categorySelect = document.getElementById('sprite-category');
                    if (spriteData.category && categorySelect) {
                        categorySelect.value = spriteData.category;
                    }
                    
                    // Set background color from default.json
                    const defaultColor = this.defaultTileset.backgroundColors[spriteData.id];
                    if (defaultColor) {
                        this.backgroundColors[i] = defaultColor;
                        document.getElementById('sprite-color').value = defaultColor;
                        document.getElementById('sprite-color-hex').value = defaultColor;
                        this.updateGrid();
                    }
                }
                
                console.log(`🎯 Selected cell ${i + 1}: "${spriteName}" (${spriteData ? spriteData.category : 'unknown'})`);
            });
            
            gridContainer.appendChild(cell);
        }
        
        this.updateGrid();
    }
    
    updateGrid() {
        const cells = document.querySelectorAll('.sprite-cell');
        
        cells.forEach((cell, index) => {
            // Clear previous content
            cell.innerHTML = '';
            cell.style.backgroundImage = '';
            cell.style.backgroundColor = this.backgroundColors[index] || '#f9f9f9';
            
            // Add locked indicator
            if (this.lockedCells.has(index)) {
                cell.classList.add('locked');
            } else {
                cell.classList.remove('locked');
            }
            
            // Add sprite if exists
            if (this.sprites[index]) {
                cell.style.backgroundImage = `url(${this.sprites[index]})`;
                cell.style.backgroundSize = 'cover';
                cell.style.backgroundPosition = 'center';
            } else {
                cell.textContent = `Cell ${index + 1}`;
            }
        });
    }
    
    updateCellEditor() {
        if (this.selectedCell === null) return;
        
        // Update lock button text
        const lockButton = document.getElementById('toggle-cell-lock');
        if (this.lockedCells.has(this.selectedCell)) {
            lockButton.innerHTML = '🔓 Unlock Position';
        } else {
            lockButton.innerHTML = '🔒 Lock Position';
        }
        
        // Update color picker
        const currentColor = this.backgroundColors[this.selectedCell] || '#8B7355';
        document.getElementById('sprite-color').value = currentColor;
        document.getElementById('sprite-color-hex').value = currentColor;
    }
    
    loadSpriteSheet(imageSrc) {
        this.previewImage = new Image();
        this.previewImage.onload = () => {
            this.updatePreview();
        };
        this.previewImage.src = imageSrc;
    }
    
    updatePreview() {
        if (!this.previewImage) return;
        
        // Calculate source sprite size from the loaded image
        const sourceImageWidth = this.previewImage.width;
        const sourceImageHeight = this.previewImage.height;
        const sourceSpriteWidth = sourceImageWidth / this.gridWidth;
        const sourceSpriteHeight = sourceImageHeight / this.gridHeight;
        
        console.log(`📏 Source image: ${sourceImageWidth}×${sourceImageHeight}`);
        console.log(`📐 Source sprite size: ${sourceSpriteWidth}×${sourceSpriteHeight}`);
        console.log(`🎯 Target sprite size: ${this.spriteSize}×${this.spriteSize}`);
        
        // Extract sprites from sheet
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const index = row * this.gridWidth + col;
                
                // Skip locked cells during global alignment
                if (this.lockedCells.has(index)) continue;
                
                // Create a separate canvas for each sprite
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = this.spriteSize;
                canvas.height = this.spriteSize;
                
                // Calculate source coordinates using actual image dimensions
                const sourceX = col * sourceSpriteWidth + this.offsetX;
                const sourceY = row * sourceSpriteHeight + this.offsetY;
                
                console.log(`🎨 Cell ${index + 1}: extracting from (${sourceX}, ${sourceY}) size ${sourceSpriteWidth}×${sourceSpriteHeight}`);
                
                // Draw sprite from sheet using correct source dimensions
                ctx.drawImage(
                    this.previewImage,
                    sourceX, sourceY,                    // Source position
                    sourceSpriteWidth, sourceSpriteHeight, // Source size
                    0, 0,                                  // Destination position
                    canvas.width, canvas.height            // Destination size
                );
                
                // Store the sprite data immediately
                this.sprites[index] = canvas.toDataURL();
            }
        }
        
        this.updateGrid();
    }
    
    saveCurrentCell() {
        if (this.selectedCell === null) return;
        
        const name = document.getElementById('sprite-name').value;
        const category = document.getElementById('sprite-category').value;
        
        if (!name) {
            alert('Please enter a sprite name');
            return;
        }
        
        // This could be extended to save to a database or local storage
        console.log(`Saved cell ${this.selectedCell + 1}: ${name} (${category})`);
        alert(`Cell ${this.selectedCell + 1} saved as "${name}"`);
    }
    
    exportTileset() {
        const tilesetName = document.getElementById('tileset-name').value || 'Custom Tileset';
        
        const tileset = {
            name: tilesetName,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            spriteSize: this.spriteSize,
            sprites: {},
            backgroundColors: this.backgroundColors,
            lockedCells: Array.from(this.lockedCells),
            createdAt: new Date().toISOString()
        };
        
        // Add sprite data
        this.sprites.forEach((sprite, index) => {
            if (sprite) {
                const name = `sprite_${index + 1}`;
                tileset.sprites[name] = {
                    index: index,
                    data: sprite,
                    backgroundColor: this.backgroundColors[index] || '#8B7355'
                };
            }
        });
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(tileset, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tilesetName.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Tileset "${tilesetName}" exported successfully!`);
    }
    
    exportSpriteSheetPNG() {
        const tilesetName = document.getElementById('tileset-name').value || 'Custom Tileset';
        
        // Create a canvas for the full sprite sheet
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate canvas size
        const totalWidth = this.gridWidth * this.spriteSize;
        const totalHeight = this.gridHeight * this.spriteSize;
        
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        console.log(`🖼️ Creating PNG sprite sheet: ${totalWidth}×${totalHeight}px`);
        
        // Draw each sprite onto the canvas
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const index = row * this.gridWidth + col;
                const x = col * this.spriteSize;
                const y = row * this.spriteSize;
                
                // Fill background color first
                const bgColor = this.backgroundColors[index] || '#8B7355';
                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, this.spriteSize, this.spriteSize);
                
                // Draw sprite if exists
                if (this.sprites[index]) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, x, y, this.spriteSize, this.spriteSize);
                        
                        // Check if this is the last sprite to process
                        if (index === (this.gridWidth * this.gridHeight - 1)) {
                            this.finalizePNGExport(canvas, tilesetName);
                        }
                    };
                    img.src = this.sprites[index];
                } else {
                    // Draw placeholder text
                    ctx.fillStyle = '#666';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${index + 1}`, x + this.spriteSize/2, y + this.spriteSize/2);
                    
                    // Check if this is the last cell
                    if (index === (this.gridWidth * this.gridHeight - 1)) {
                        // Wait a bit for any pending image loads
                        setTimeout(() => this.finalizePNGExport(canvas, tilesetName), 100);
                    }
                }
            }
        }
    }
    
    finalizePNGExport(canvas, tilesetName) {
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tilesetName.replace(/[^a-z0-9]/gi, '_')}_spritesheet.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`Sprite sheet PNG "${tilesetName}" exported successfully!`);
        }, 'image/png');
    }
    
    show() {
        const modal = document.getElementById('sprite-editor-modal');
        if (modal) {
            // Force display using multiple methods
            modal.style.display = 'block';
            modal.style.zIndex = '99999';
            modal.classList.add('show');
            
            // Ensure modal content is also visible
            const content = modal.querySelector('.sprite-editor-modal-content');
            if (content) {
                content.style.zIndex = '100000';
            }
            
            console.log('🎨 Sprite Sheet Editor modal opened with z-index:', modal.style.zIndex);
            console.log('📋 Modal element:', modal);
        } else {
            console.error('❌ Sprite Sheet Editor modal not found!');
            // Try to create it if it doesn't exist
            this.createModal();
        }
    }
    
    hide() {
        const modal = document.getElementById('sprite-editor-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            console.log('🎨 Sprite Sheet Editor modal closed');
        }
    }
}

// Make it globally available
window.SpriteSheetEditor = SpriteSheetEditor;

// Global function to open the sprite editor
window.openSpriteEditor = function() {
    console.log('🎨 Opening Sprite Sheet Editor...');
    
    // Create instance if it doesn't exist
    if (!window.spriteEditor) {
        console.log('📝 Creating new SpriteSheetEditor instance');
        window.spriteEditor = new SpriteSheetEditor();
    }
    
    // Show the modal
    window.spriteEditor.show();
};

// Debug function to check modal state
window.debugSpriteEditor = function() {
    console.log('=== SPRITE EDITOR DEBUG ===');
    console.log('spriteEditor instance:', window.spriteEditor);
    
    const modal = document.getElementById('sprite-editor-modal');
    console.log('Modal element:', modal);
    
    if (modal) {
        console.log('Modal display:', modal.style.display);
        console.log('Modal z-index:', modal.style.zIndex);
        console.log('Modal classList:', modal.classList.toString());
        
        const content = modal.querySelector('.sprite-editor-modal-content');
        console.log('Modal content:', content);
        if (content) {
            console.log('Content z-index:', content.style.zIndex);
        }
    }
};

// Auto-create instance when script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 SpriteSheetEditor script loaded');
    if (!window.spriteEditor) {
        window.spriteEditor = new SpriteSheetEditor();
        console.log('✅ SpriteSheetEditor instance created');
    }
});
