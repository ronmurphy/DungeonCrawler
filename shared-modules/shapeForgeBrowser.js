/**
 * ShapeForge Browser Module
 * 
 * Unified ShapeForge file browser and loader for all DungeonCrawler projects
 * Eliminates code duplication across maped3d, mapgate, V5, etc.
 * 
 * Usage:
 *   const browser = new ShapeForgeBrowser({
 *     basePath: 'assets/sampleObjects/ShapeForge/',
 *     onSelect: (data, filename) => { /* handle selection */ }
 *   });
 *   browser.show();
 */
class ShapeForgeBrowser {
    constructor(options = {}) {
        this.basePath = options.basePath || 'assets/sampleObjects/ShapeForge/';
        this.onSelect = options.onSelect || (() => {});
        this.onLoad = options.onLoad || (() => {});
        this.containerElement = options.container || null;
        this.modal = options.modal !== false; // default to modal
        this.title = options.title || 'Browse ShapeForge Objects';
        this.allowMultiple = options.allowMultiple || false;
        
        // Cache for discovered files
        this.cachedFiles = null;
        this.cacheTimestamp = 0;
        this.cacheExpiry = 30000; // 30 seconds
        
        console.log('🎯 ShapeForgeBrowser initialized:', {
            basePath: this.basePath,
            modal: this.modal,
            title: this.title
        });
    }
    
    /**
     * Dynamically discover ShapeForge files
     */
    async discoverFiles() {
        const now = Date.now();
        if (this.cachedFiles && (now - this.cacheTimestamp) < this.cacheExpiry) {
            console.log(`📂 Using cached ShapeForge files (${this.cachedFiles.length} files)`);
            return this.cachedFiles;
        }
        
        console.log(`📂 Dynamically discovering ShapeForge files...`);
        let sampleFiles = [];
        
        try {
            // Method 1: Try directory listing (works on dev servers)
            const dirResponse = await fetch(this.basePath);
            if (dirResponse.ok) {
                const dirText = await dirResponse.text();
                const fileMatches = dirText.match(/href="([^"]*\.shapeforge\.json)"/g);
                if (fileMatches) {
                    sampleFiles = fileMatches.map(match => match.match(/href="([^"]*)"/)[1]);
                    console.log(`📂 Found ${sampleFiles.length} files via directory listing`);
                }
            }
        } catch (error) {
            console.log(`📂 Directory listing not available, using fallback method`);
        }
        
        // Method 2: Fallback - test common/likely filenames
        if (sampleFiles.length === 0) {
            const commonNames = [
                'Chest.shapeforge.json',
                'Pillar.shapeforge.json',
                'Statue.shapeforge.json',
                'TexturedPillar2.shapeforge.json',
                'TexturedStatue.shapeforge.json',
                'TexturedStatue2.shapeforge.json',
                'woodBlock.shapeforge.json',
                'Fireball_d20.shapeforge.json',
                'magic_d20.shapeforge.json',
                'Dungeon Entrance.shapeforge.json',
                'Exit.shapeforge.json',
                'FireMarker.shapeforge.json',
                'Not-Statue.shapeforge.json',
                'grass.shapeforge.json',
                'mountain.shapeforge.json',
                'castle.shapeforge.json',
                'house.shapeforge.json',
                'town.shapeforge.json',
                'tower.shapeforge.json',
                'tree.shapeforge.json',
                'rock.shapeforge.json',
                'bridge.shapeforge.json',
                'well.shapeforge.json',
                'fountain.shapeforge.json'
            ];
            
            const existenceTests = commonNames.map(async filename => {
                try {
                    const testResponse = await fetch(`${this.basePath}${filename}`, { method: 'HEAD' });
                    return testResponse.ok ? filename : null;
                } catch (error) {
                    return null;
                }
            });
            
            const results = await Promise.all(existenceTests);
            sampleFiles = results.filter(filename => filename !== null);
            console.log(`📂 Discovered ${sampleFiles.length} files via existence testing`);
        }
        
        // Cache the results
        this.cachedFiles = sampleFiles;
        this.cacheTimestamp = now;
        
        return sampleFiles;
    }
    
    /**
     * Load ShapeForge file data
     */
    async loadFile(filename) {
        try {
            console.log(`📄 Loading ShapeForge file: ${filename}`);
            const response = await fetch(`${this.basePath}${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Loaded ${filename}:`, data.name || 'Untitled');
            
            if (this.onLoad) {
                this.onLoad(data, filename);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ Failed to load ${filename}:`, error);
            throw error;
        }
    }
    
    /**
     * Create file card element
     */
    createFileCard(filename, data) {
        const displayName = (data.name && data.name !== 'Untitled Project') ? data.name : filename.replace('.shapeforge.json', '');
        
        const card = document.createElement('div');
        card.className = 'shapeforge-file-card';
        card.style.cssText = `
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            background: white;
            min-height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        `;
        
        // Default thumbnail if none provided
        const defaultThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
        
        card.innerHTML = `
            <div>
                <img src="${data.thumbnail || defaultThumbnail}" 
                     style="width: 64px; height: 64px; margin-bottom: 8px; object-fit: cover; border-radius: 4px;" 
                     alt="${displayName}">
            </div>
            <div>
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #333;">${displayName}</div>
                <div style="font-size: 12px; color: #666;">${filename}</div>
            </div>
        `;
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            card.style.borderColor = '#007bff';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
            card.style.borderColor = '#ddd';
        });
        
        // Click handler
        card.addEventListener('click', () => {
            this.selectFile(data, filename);
        });
        
        return card;
    }
    
    /**
     * Handle file selection
     */
    selectFile(data, filename) {
        console.log(`🎯 Selected ShapeForge file: ${filename}`);
        
        if (this.onSelect) {
            this.onSelect(data, filename);
        }
        
        // Close modal if it exists
        if (this.modal && this.currentDialog) {
            this.currentDialog.hide();
        }
    }
    
    /**
     * Render file grid
     */
    async renderGrid(container) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Discovering ShapeForge files...</div>';
        
        try {
            const files = await this.discoverFiles();
            
            if (files.length === 0) {
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">No ShapeForge files found in ${this.basePath}</div>`;
                return;
            }
            
            // Create grid
            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px;
                padding: 16px;
            `;
            
            container.innerHTML = '';
            container.appendChild(grid);
            
            // Load and display files
            let loadedCount = 0;
            
            for (const filename of files) {
                try {
                    const data = await this.loadFile(filename);
                    const card = this.createFileCard(filename, data);
                    grid.appendChild(card);
                    loadedCount++;
                } catch (error) {
                    console.warn(`⚠️ Skipping ${filename} due to error:`, error);
                }
            }
            
            console.log(`✅ Rendered ${loadedCount}/${files.length} ShapeForge files`);
            
        } catch (error) {
            console.error('❌ Failed to render grid:', error);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Error loading ShapeForge files</div>';
        }
    }
    
    /**
     * Show as modal dialog (requires Shoelace)
     */
    showModal() {
        if (typeof document === 'undefined') {
            console.error('❌ ShapeForgeBrowser.showModal() requires DOM environment');
            return;
        }
        
        // Create modal dialog
        const dialog = document.createElement('sl-dialog');
        dialog.label = this.title;
        dialog.style.cssText = '--width: 80vw; --height: 70vh;';
        
        dialog.innerHTML = `
            <div style="height: 60vh; overflow-y: auto;">
                <div id="shapeforge-grid"></div>
            </div>
            <sl-button slot="footer" variant="neutral" onclick="this.closest('sl-dialog').hide()">Cancel</sl-button>
        `;
        
        document.body.appendChild(dialog);
        this.currentDialog = dialog;
        
        dialog.show();
        
        // Render grid
        const gridContainer = dialog.querySelector('#shapeforge-grid');
        this.renderGrid(gridContainer);
        
        // Cleanup on close
        dialog.addEventListener('sl-hide', () => {
            setTimeout(() => {
                if (dialog.parentNode) {
                    dialog.parentNode.removeChild(dialog);
                }
            }, 100);
        });
    }
    
    /**
     * Show inline in container
     */
    showInline(container) {
        if (!container) {
            console.error('❌ ShapeForgeBrowser.showInline() requires container element');
            return;
        }
        
        this.renderGrid(container);
    }
    
    /**
     * Main show method - chooses modal or inline based on options
     */
    show(container = null) {
        if (container) {
            this.showInline(container);
        } else if (this.modal) {
            this.showModal();
        } else {
            console.error('❌ ShapeForgeBrowser.show() requires container when modal=false');
        }
    }
    
    /**
     * Clear cache (force refresh)
     */
    clearCache() {
        this.cachedFiles = null;
        this.cacheTimestamp = 0;
        console.log('🗑️ ShapeForgeBrowser cache cleared');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShapeForgeBrowser;
} else if (typeof window !== 'undefined') {
    window.ShapeForgeBrowser = ShapeForgeBrowser;
}

console.log('📦 ShapeForgeBrowser module loaded');