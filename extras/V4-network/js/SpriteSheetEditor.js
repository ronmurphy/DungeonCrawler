/**
 * SpriteSheetEditor - Tool for Michelle to create custom tilesets
 * Allows importing sprite sheets, defining grids, naming sprites, setting colors
 */
class SpriteSheetEditor {
    constructor() {
        this.currentImage = null;
        this.gridSize = { width: 4, height: 4 };
        this.spriteSize = 64;
        this.sprites = [];
        this.backgroundColors = {};
        this.selectedCell = null;
        this.lockedCells = new Set(); // Track cells that shouldn't move during global alignment
        
        this.createModal();
    }
    
    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="sprite-editor-modal" class="modal" style="display: none; z-index: 10000 !important;">
                <div class="modal-content" style="max-width: 900px; height: 85vh; z-index: 10001 !important; position: relative;">
                    <div class="modal-header" style="padding: 15px 20px;">
                        <h2 style="margin: 0; font-size: 18px;">🎨 Sprite Sheet Editor</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body" style="
                        overflow-y: auto; 
                        padding: 15px;
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    ">
                        
                        <!-- ROW 1: Top Controls -->
                        <div class="top-controls" style="
                            display: flex; 
                            gap: 15px; 
                            padding: 15px; 
                            background: #f8f9fa; 
                            border-radius: 6px; 
                            border: 1px solid #dee2e6;
                            align-items: center;
                            flex-wrap: wrap;
                        ">
                            <div class="import-section">
                                <button id="import-full-sheet" class="btn btn-primary" style="font-size: 14px; padding: 8px 16px;">
                                    📁 Import Sprite Sheet
                                </button>
                                <input type="file" id="sheet-file-input" accept="image/*" style="display: none;">
                            </div>
                            
                            <div class="grid-controls" style="display: flex; gap: 20px; flex: 1; justify-content: center;">
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px;">Grid Width:</label>
                                    <input type="range" id="grid-width" value="4" min="2" max="8" step="1" style="width: 120px;">
                                    <span id="grid-width-value" style="display: block; text-align: center; margin-top: 5px; font-weight: bold; color: #007cba;">4</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Grid Height:</label>
                                    <input type="range" id="grid-height" value="4" min="2" max="8" step="1" style="width: 120px;">
                                                                        <span id="grid-width-value" style="display: block; text-align: center; margin-top: 3px; font-weight: bold; color: #0c5460; font-size: 11px;">4</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px;">Grid Height:</label>
                                    <input type="range" id="grid-height" value="4" min="3" max="8" step="1" style="width: 100px;">
                                    <span id="grid-height-value" style="display: block; text-align: center; margin-top: 3px; font-weight: bold; color: #0c5460; font-size: 11px;">4</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px;">Horizontal Shift:</label>
                                    <input type="range" id="offset-x" value="0" min="-50" max="50" step="1" style="width: 100px;">
                                    <span id="offset-x-value" style="display: block; text-align: center; margin-top: 3px; font-weight: bold; color: #0c5460; font-size: 11px;">0px</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px;">Vertical Shift:</label>
                                    <input type="range" id="offset-y" value="0" min="-50" max="50" step="1" style="width: 100px;">
                                    <span id="offset-y-value" style="display: block; text-align: center; margin-top: 3px; font-weight: bold; color: #0c5460; font-size: 11px;">0px</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 12px;">Cell Size:</label>
                                    <input type="range" id="actual-sprite-size" value="64" min="48" max="80" step="1" style="width: 100px;">
                                    <span id="sprite-size-value" style="display: block; text-align: center; margin-top: 3px; font-weight: bold; color: #0c5460; font-size: 11px;">64px</span>
                                </div>
                                
                                <button id="reset-alignment" class="btn" title="Reset to center" style="align-self: flex-end; margin-bottom: 8px; padding: 6px 10px; font-size: 12px;">↺ Reset</button>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Sprite Size:</label>
                                    <input type="range" id="sprite-size" value="64" min="32" max="128" step="8" style="width: 120px;">
                                    <span id="sprite-size-value" style="display: block; text-align: center; margin-top: 5px; font-weight: bold; color: #007cba;">64px</span>
                                </div>
                            </div>
                        </div>

                        <!-- Alignment Controls (shown when image loaded) -->
                        <div class="alignment-controls" id="alignment-controls" style="
                            display: none; 
                            margin-bottom: 25px; 
                            padding: 15px; 
                            background: #e8f4fd; 
                            border: 1px solid #bee5eb; 
                            border-radius: 8px;
                        ">
                            <h4 style="margin: 0 0 15px 0; color: #0c5460;">🎯 Fine-Tune Alignment</h4>
                            <div style="display: flex; gap: 25px; align-items: center; justify-content: center; flex-wrap: wrap;">
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Horizontal Shift:</label>
                                    <input type="range" id="offset-x" value="0" min="-50" max="50" step="1" style="width: 120px;">
                                    <span id="offset-x-value" style="display: block; text-align: center; margin-top: 5px; font-weight: bold; color: #0c5460;">0px</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Vertical Shift:</label>
                                    <input type="range" id="offset-y" value="0" min="-50" max="50" step="1" style="width: 120px;">
                                    <span id="offset-y-value" style="display: block; text-align: center; margin-top: 5px; font-weight: bold; color: #0c5460;">0px</span>
                                </div>
                                
                                <div class="control-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Cell Size:</label>
                                    <input type="range" id="actual-sprite-size" value="64" min="48" max="80" step="1" style="width: 120px;">
                                    <span id="sprite-size-value" style="display: block; text-align: center; margin-top: 5px; font-weight: bold; color: #0c5460;">64px</span>
                                </div>
                                
                                <button id="reset-alignment" class="btn" title="Reset to center" style="align-self: flex-end; margin-bottom: 10px;">↺ Reset</button>
                            </div>
                        </div>

                        <!-- ROW 2: Main Workspace -->
                        <div class="main-workspace" style="
                            display: flex; 
                            gap: 20px; 
                            min-height: 350px;
                        ">
                            <!-- Sprite Grid (Left Side) -->
                            <div class="sprite-grid-container" style="
                                flex: 1; 
                                max-width: 500px;
                                background: white;
                                padding: 15px;
                                border-radius: 6px;
                                border: 1px solid #dee2e6;
                            ">
                                <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">🖼️ Sprite Grid</h3>
                                <div id="sprite-grid" class="sprite-grid"></div>
                            </div>
                            
                            <!-- Cell Editor (Right Side) -->
                                                        <!-- Cell Editor (Right Side) -->
                            <div class="cell-editor-container" style="
                                width: 280px;
                                background: white;
                                padding: 15px;
                                border-radius: 6px;
                                border: 1px solid #dee2e6;
                                height: fit-content;
                            ">
                                <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">⚙️ Cell Editor</h3>
                                
                                <div id="cell-info">
                                    <p style="color: #6c757d; font-style: italic; text-align: center; margin-top: 50px;">
                                        👆 Click a cell in the grid to edit its properties
                                    </p>
                                </div>
                                
                                <div id="cell-editor" style="display: none;">
                                    <div class="form-group" style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Sprite Name:</label>
                                        <input type="text" id="sprite-name" placeholder="e.g., mountain, water" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                    </div>
                                    
                                    <div class="form-group" style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Display Name:</label>
                                        <input type="text" id="sprite-display-name" placeholder="e.g., Mountain, Water" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                    </div>
                                    
                                    <div class="form-group" style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Category:</label>
                                        <select id="sprite-category" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                            <option value="terrain">Terrain</option>
                                            <option value="buildings">Buildings</option>
                                            <option value="monsters">Monsters</option>
                                            <option value="items">Items</option>
                                            <option value="hazards">Hazards</option>
                                            <option value="paths">Paths</option>
                                            <option value="features">Features</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group" style="margin-bottom: 20px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Background Color:</label>
                                        <div style="display: flex; gap: 8px; align-items: center;">
                                            <input type="color" id="sprite-color" value="#8B7355" style="width: 50px; height: 35px; border: 1px solid #ced4da; border-radius: 4px;">
                                            <input type="text" id="sprite-color-hex" placeholder="#8B7355" style="flex: 1; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                        </div>
                                    </div>
                                    
                                    <div class="button-group" style="display: flex; flex-direction: column; gap: 12px;">
                                        <button id="toggle-cell-lock" class="btn" style="background: #28a745; color: white; padding: 10px; border-radius: 4px; border: none; font-weight: 600;">
                                            🔒 Lock Position
                                        </button>
                                        
                                        <button id="import-cell-image" class="btn" style="background: #6c757d; color: white; padding: 10px; border-radius: 4px; border: none;">
                                            📁 Import Cell Image
                                        </button>
                                        <input type="file" id="cell-file-input" accept="image/*" style="display: none;">
                                        
                                        <button id="save-cell" class="btn btn-primary" style="background: #007cba; color: white; padding: 12px; border-radius: 4px; border: none; font-weight: 600; font-size: 14px;">
                                            💾 Save Cell
                                        </button>
                                    </div>
                                    
                                    <p style="font-size: 11px; color: #6c757d; margin-top: 15px; text-align: center; line-height: 1.4;">
                                        💡 Locked cells won't move when adjusting alignment sliders
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ROW 3: Export Section -->
                        <div class="export-section" style="
                            padding: 15px; 
                            background: #f8f9fa; 
                            border-radius: 6px; 
                            border: 1px solid #dee2e6;
                        ">
                            <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">📤 Export Tileset</h3>
                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <input type="text" id="tileset-name" placeholder="Enter tileset name" value="Custom Tileset" style="
                                    flex: 1; 
                                    min-width: 200px; 
                                    padding: 8px 12px; 
                                    border: 1px solid #ced4da; 
                                    border-radius: 4px;
                                    font-size: 13px;
                                ">
                                <button id="export-json" class="btn btn-success" style="
                                    background: #28a745; 
                                    color: white; 
                                    padding: 8px 16px; 
                                    border-radius: 4px; 
                                    border: none; 
                                    font-weight: 600;
                                    font-size: 13px;
                                ">📤 Export JSON</button>
                                <button id="export-png" class="btn btn-info" disabled style="
                                    background: #6c757d; 
                                    color: white; 
                                    padding: 8px 16px; 
                                    border-radius: 4px; 
                                    border: none;
                                    opacity: 0.6;
                                    font-size: 13px;
                                ">🖼️ Export PNG (Soon)</button>
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
        
        // Add styles
        this.addStyles();
        
        // Bind events
        this.bindEvents();
    }
    
    addStyles() {
        const styles = `
            <style id="sprite-editor-styles">
                #sprite-editor-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0,0,0,0.5) !important;
                    z-index: 10000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                #sprite-editor-modal .modal-content {
                    background: white !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                    z-index: 10001 !important;
                    max-height: 90vh !important;
                    overflow: hidden !important;
                    position: relative !important;
                }
                
                #sprite-editor-modal .modal-header {
                    background: #007cba !important;
                    color: white !important;
                    padding: 15px 20px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                #sprite-editor-modal .close {
                    font-size: 24px !important;
                    cursor: pointer !important;
                    color: white !important;
                }
                
                #sprite-editor-modal .close:hover {
                    opacity: 0.7 !important;
                }
                
                .sprite-grid {
                    display: grid;
                    gap: 2px;
                    background: #ddd;
                    padding: 10px;
                    border-radius: 8px;
                    max-width: 500px;
                }
                
                .sprite-cell {
                    aspect-ratio: 1;
                    background: #f9f9f9;
                    border: 2px solid #ccc;
                    cursor: pointer;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    text-align: center;
                    min-height: 60px;
                }
                
                .sprite-cell:hover {
                    border-color: #007cba;
                }
                
                .sprite-cell.selected {
                    border-color: #ff6b35;
                    background: #fff5f0;
                }
                
                .sprite-cell.locked {
                    border: 3px solid #28a745 !important;
                    box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
                }
                
                .sprite-cell.locked::after {
                    content: "🔒";
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    font-size: 12px;
                    background: rgba(40, 167, 69, 0.9);
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .sprite-cell.has-sprite {
                    background-size: cover;
                    background-position: center;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .form-group input, .form-group select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                
                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .control-group input[type="range"] {
                    width: 120px;
                    margin: 0 8px;
                }
                
                .control-group span {
                    min-width: 40px;
                    font-weight: bold;
                    color: #007cba;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .btn-primary { background: #007cba; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-info { background: #17a2b8; color: white; }
                
                .btn:hover { opacity: 0.9; }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    bindEvents() {
        const modal = document.getElementById('sprite-editor-modal');
        const closeBtn = modal.querySelector('.close');
        
        // Close modal
        closeBtn.onclick = () => this.close();
        window.onclick = (event) => {
            if (event.target === modal) this.close();
        };
        
        // Grid size changes - now with sliders and real-time updates
        document.getElementById('grid-width').oninput = () => this.updateGridControls();
        document.getElementById('grid-height').oninput = () => this.updateGridControls();
        document.getElementById('sprite-size').oninput = () => this.updateSpriteControls();
        
        // Real-time alignment controls (no Apply button needed!)
        document.getElementById('offset-x').oninput = () => this.updateAlignmentDisplay();
        document.getElementById('offset-y').oninput = () => this.updateAlignmentDisplay();
        document.getElementById('actual-sprite-size').oninput = () => this.updateAlignmentDisplay();
        document.getElementById('reset-alignment').onclick = () => this.resetAlignment();
        
        // Import full sheet
        document.getElementById('import-full-sheet').onclick = () => {
            document.getElementById('sheet-file-input').click();
        };
        
        document.getElementById('sheet-file-input').onchange = (e) => {
            this.importFullSheet(e.target.files[0]);
        };
        
        // Import cell image
        document.getElementById('import-cell-image').onclick = () => {
            if (this.selectedCell) {
                document.getElementById('cell-file-input').click();
            }
        };
        
        document.getElementById('cell-file-input').onchange = (e) => {
            this.importCellImage(e.target.files[0]);
        };
        
        // Color picker sync
        document.getElementById('sprite-color').onchange = (e) => {
            document.getElementById('sprite-color-hex').value = e.target.value;
        };
        
        document.getElementById('sprite-color-hex').onchange = (e) => {
            document.getElementById('sprite-color').value = e.target.value;
        };
        
        // Save cell
        document.getElementById('save-cell').onclick = () => this.saveCurrentCell();
        
        // Lock/unlock cell position
        document.getElementById('toggle-cell-lock').onclick = () => this.toggleCellLock();
        
        // Export
        document.getElementById('export-json').onclick = () => this.exportJSON();
        
        // Initialize grid
        this.updateGridControls();
    }
    
    updateGridControls() {
        const width = parseInt(document.getElementById('grid-width').value);
        const height = parseInt(document.getElementById('grid-height').value);
        
        // Update value displays
        document.getElementById('grid-width-value').textContent = width;
        document.getElementById('grid-height-value').textContent = height;
        
        this.gridSize = { width, height };
        this.renderGrid();
        
        // If image is loaded, reapply alignment
        if (this.currentImage) {
            this.applyAlignment();
        }
    }
    
    updateSpriteControls() {
        const size = parseInt(document.getElementById('sprite-size').value);
        document.getElementById('sprite-size-value').textContent = `${size}px`;
        this.spriteSize = size;
        
        // If image is loaded, reapply alignment
        if (this.currentImage) {
            this.applyAlignment();
        }
    }
    
    renderGrid() {
        const gridContainer = document.getElementById('sprite-grid');
        gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize.width}, 1fr)`;
        
        // Clear existing grid
        gridContainer.innerHTML = '';
        
        // Create cells
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'sprite-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.textContent = `${x},${y}`;
                
                cell.onclick = () => this.selectCell(x, y);
                
                gridContainer.appendChild(cell);
            }
        }
    }
    
    selectCell(x, y) {
        // Deselect previous cell
        document.querySelectorAll('.sprite-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Select new cell
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.classList.add('selected');
        
        this.selectedCell = { x, y };
        this.showCellEditor(x, y);
    }
    
    showCellEditor(x, y) {
        document.getElementById('cell-info').style.display = 'none';
        document.getElementById('cell-editor').style.display = 'block';
        
        // Update lock button based on cell state
        const cellKey = `${x},${y}`;
        const isLocked = this.lockedCells.has(cellKey);
        const lockBtn = document.getElementById('toggle-cell-lock');
        
        if (isLocked) {
            lockBtn.textContent = '🔓 Unlock Position';
            lockBtn.style.background = '#dc3545';
            lockBtn.title = 'Click to allow this cell to move with alignment sliders';
        } else {
            lockBtn.textContent = '🔒 Lock Position';
            lockBtn.style.background = '#28a745';
            lockBtn.title = 'Click to keep this cell fixed when adjusting alignment';
        }
        
        // Load existing sprite data if any
        const existingSprite = this.sprites.find(s => s.position[0] === x && s.position[1] === y);
        
        if (existingSprite) {
            document.getElementById('sprite-name').value = existingSprite.id;
            document.getElementById('sprite-display-name').value = existingSprite.name;
            document.getElementById('sprite-category').value = existingSprite.category;
            
            const color = this.backgroundColors[existingSprite.id] || '#8B7355';
            document.getElementById('sprite-color').value = color;
            document.getElementById('sprite-color-hex').value = color;
        } else {
            // Clear form
            document.getElementById('sprite-name').value = '';
            document.getElementById('sprite-display-name').value = '';
            document.getElementById('sprite-category').value = 'terrain';
            document.getElementById('sprite-color').value = '#8B7355';
            document.getElementById('sprite-color-hex').value = '#8B7355';
        }
    }
    
    async importFullSheet(file) {
        if (!file) return;
        
        const imageUrl = URL.createObjectURL(file);
        this.currentImage = imageUrl;
        
        // Show alignment controls
        document.getElementById('alignment-controls').style.display = 'block';
        
        // Apply initial positioning
        this.applyAlignment();
        
        console.log('✅ Full sprite sheet imported - use sliders to adjust alignment in real-time');
    }
    
    updateAlignmentDisplay() {
        // Update value displays
        const offsetX = document.getElementById('offset-x').value;
        const offsetY = document.getElementById('offset-y').value;
        const spriteSize = document.getElementById('actual-sprite-size').value;
        
        document.getElementById('offset-x-value').textContent = `${offsetX}px`;
        document.getElementById('offset-y-value').textContent = `${offsetY}px`;
        document.getElementById('sprite-size-value').textContent = `${spriteSize}px`;
        
        // Apply changes immediately (real-time)
        this.applyAlignment();
    }
    
    toggleCellLock() {
        if (!this.selectedCell) return;
        
        const cellKey = `${this.selectedCell.x},${this.selectedCell.y}`;
        const cell = document.querySelector(`[data-x="${this.selectedCell.x}"][data-y="${this.selectedCell.y}"]`);
        
        if (this.lockedCells.has(cellKey)) {
            // Unlock the cell
            this.lockedCells.delete(cellKey);
            cell.classList.remove('locked');
            console.log(`🔓 Unlocked cell [${this.selectedCell.x}, ${this.selectedCell.y}]`);
        } else {
            // Lock the cell
            this.lockedCells.add(cellKey);
            cell.classList.add('locked');
            console.log(`🔒 Locked cell [${this.selectedCell.x}, ${this.selectedCell.y}]`);
        }
        
        // Update button appearance
        this.showCellEditor(this.selectedCell.x, this.selectedCell.y);
    }
    
    applyAlignment() {
        if (!this.currentImage) return;
        
        const offsetX = parseInt(document.getElementById('offset-x').value) || 0;
        const offsetY = parseInt(document.getElementById('offset-y').value) || 0;
        const actualSpriteSize = parseInt(document.getElementById('actual-sprite-size').value) || 64;
        
        // Calculate total sheet size based on grid and sprite size
        const totalSheetWidth = this.gridSize.width * actualSpriteSize;
        const totalSheetHeight = this.gridSize.height * actualSpriteSize;
        
        // Apply image to all cells with proper positioning
        document.querySelectorAll('.sprite-cell').forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const cellKey = `${x},${y}`;
            
            // Skip locked cells - they keep their current positioning
            if (this.lockedCells.has(cellKey)) {
                return;
            }
            
            // Calculate background position to show the correct sprite
            // Negative values move the background image to show different parts
            const bgPosX = offsetX - (x * actualSpriteSize);
            const bgPosY = offsetY - (y * actualSpriteSize);
            
            cell.style.backgroundImage = `url(${this.currentImage})`;
            cell.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
            cell.style.backgroundSize = `${totalSheetWidth}px ${totalSheetHeight}px`;
            cell.style.backgroundRepeat = 'no-repeat';
            cell.classList.add('has-sprite');
            cell.textContent = '';
        });
        
        console.log(`🎯 Applied alignment: offset(${offsetX}, ${offsetY}), sprite size: ${actualSpriteSize}px, sheet size: ${totalSheetWidth}x${totalSheetHeight}`);
    }
    
    resetAlignment() {
        document.getElementById('offset-x').value = 0;
        document.getElementById('offset-y').value = 0;
        document.getElementById('actual-sprite-size').value = 64;
        this.updateAlignmentDisplay();
    }
    
    async importCellImage(file) {
        if (!file || !this.selectedCell) return;
        
        const imageUrl = URL.createObjectURL(file);
        const cell = document.querySelector(`[data-x="${this.selectedCell.x}"][data-y="${this.selectedCell.y}"]`);
        
        cell.style.backgroundImage = `url(${imageUrl})`;
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundPosition = 'center';
        cell.classList.add('has-sprite');
        cell.textContent = '';
        
        console.log(`✅ Cell image imported for position [${this.selectedCell.x}, ${this.selectedCell.y}]`);
    }
    
    saveCurrentCell() {
        if (!this.selectedCell) return;
        
        const name = document.getElementById('sprite-name').value.trim();
        const displayName = document.getElementById('sprite-display-name').value.trim();
        const category = document.getElementById('sprite-category').value;
        const color = document.getElementById('sprite-color').value;
        
        if (!name) {
            alert('Please enter a sprite name');
            return;
        }
        
        // Remove existing sprite at this position
        this.sprites = this.sprites.filter(s => !(s.position[0] === this.selectedCell.x && s.position[1] === this.selectedCell.y));
        
        // Add new sprite
        this.sprites.push({
            id: name,
            name: displayName || name,
            category: category,
            position: [this.selectedCell.x, this.selectedCell.y]
        });
        
        // Save background color
        this.backgroundColors[name] = color;
        
        // Update cell display
        const cell = document.querySelector(`[data-x="${this.selectedCell.x}"][data-y="${this.selectedCell.y}"]`);
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 10px;
            padding: 2px;
            text-overflow: ellipsis;
            overflow: hidden;
        `;
        overlay.textContent = displayName || name;
        
        // Remove existing overlay
        const existing = cell.querySelector('div');
        if (existing) existing.remove();
        
        cell.appendChild(overlay);
        
        console.log(`✅ Saved sprite: ${name} at position [${this.selectedCell.x}, ${this.selectedCell.y}]`);
    }
    
    exportJSON() {
        const tilesetName = document.getElementById('tileset-name').value.trim() || 'Custom Tileset';
        
        const tilesetData = {
            name: tilesetName,
            description: `Custom tileset created with SpriteSheetEditor`,
            spriteSize: this.spriteSize,
            gridSize: `${this.gridSize.width}x${this.gridSize.height}`,
            backgroundColors: this.backgroundColors,
            sprites: this.sprites
        };
        
        // Download JSON file
        const blob = new Blob([JSON.stringify(tilesetData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tilesetName.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('✅ Tileset JSON exported:', tilesetData);
    }
    
    show() {
        const modal = document.getElementById('sprite-editor-modal');
        modal.style.display = 'flex';
        console.log('🎨 SpriteSheetEditor modal opened');
    }
    
    close() {
        document.getElementById('sprite-editor-modal').style.display = 'none';
    }
}

// Global function to open sprite editor
window.openSpriteEditor = function() {
    if (!window.spriteEditor) {
        window.spriteEditor = new SpriteSheetEditor();
    }
    window.spriteEditor.show();
};
