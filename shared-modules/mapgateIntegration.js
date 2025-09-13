/**
 * Example of using the shared ShapeForgeBrowser in mapgate
 * This replaces the old duplicate code with the shared module
 */

// Example usage for the main sample browser
function showSampleObjectsShared() {
    console.log("📦 Using shared ShapeForgeBrowser...");
    
    const browser = new ShapeForgeBrowser({
        basePath: 'assets/sampleObjects/ShapeForge/',
        title: 'Sample Objects',
        onSelect: (data, filename) => {
            console.log(`🎯 Selected: ${filename}`);
            
            // Load into current editor context
            if (window.loadShapeForgeObjectIntoEditor) {
                window.loadShapeForgeObjectIntoEditor(data, filename);
            } else {
                // Fallback: set global currentObject
                window.currentObject = data;
                
                // Update name field if exists
                const nameField = document.querySelector('#object-name');
                if (nameField) {
                    nameField.value = data.name || filename.replace('.shapeforge.json', '');
                }
                
                console.log(`✅ Loaded ${filename} as current object`);
            }
        }
    });
    
    browser.show();
}

// Example usage for inline container
function showSampleObjectsInline(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container ${containerId} not found`);
        return;
    }
    
    const browser = new ShapeForgeBrowser({
        basePath: 'assets/sampleObjects/ShapeForge/',
        modal: false,
        onSelect: (data, filename) => {
            console.log(`🎯 Inline selected: ${filename}`);
            // Handle selection for inline usage
        }
    });
    
    browser.show(container);
}

// For global access
if (typeof window !== 'undefined') {
    window.showSampleObjectsShared = showSampleObjectsShared;
    window.showSampleObjectsInline = showSampleObjectsInline;
}

console.log('🔧 Shared ShapeForgeBrowser integration loaded');