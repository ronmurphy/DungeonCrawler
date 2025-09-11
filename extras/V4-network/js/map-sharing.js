// ========================================
// MAP SHARING SYSTEM
// Share maps with players without backend
// ========================================

// ========================================
// MAP SHARING FUNCTIONS
// ========================================
function shareMapWithPlayers() {
    if (!currentMap || !currentMap.mapData) {
        showNotification('No map to share', 'error');
        return;
    }
    
    // Create shareable map data
    const shareableMap = {
        name: currentMap.name || 'Shared Map',
        size: currentMap.size,
        mapData: currentMap.mapData,
        playerLayer: currentMap.playerLayer || [],
        type: currentMap.type,
        timestamp: new Date().toISOString()
    };
    
    // Generate sharing options
    showMapSharingModal(shareableMap);
}

function showMapSharingModal(mapData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('map-sharing-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'map-sharing-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    const mapDataUrl = encodeMapToDataUrl(mapData);
    const copyableLink = `${window.location.origin}${window.location.pathname}?sharedMap=${mapDataUrl}`;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share Map with Players</h3>
                <button class="modal-close" onclick="hideMapSharingModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="sharing-section">
                    <h4>🔗 Shareable Link</h4>
                    <p>Players can open this link to view the map:</p>
                    <div class="link-container">
                        <input type="text" id="shareable-link" value="${copyableLink}" readonly>
                        <button class="copy-link-btn" onclick="copyShareableLink()">
                            <i class="material-icons">content_copy</i>
                            Copy Link
                        </button>
                    </div>
                </div>
                
                <div class="sharing-section">
                    <h4>📱 QR Code</h4>
                    <div class="qr-container" id="qr-container">
                        <div class="qr-placeholder">
                            <button onclick="generateQRCode('${copyableLink}')">Generate QR Code</button>
                        </div>
                    </div>
                </div>
                
                <div class="sharing-section">
                    <h4>📋 Export for Manual Sharing</h4>
                    <div class="export-options">
                        <button class="export-btn" onclick="exportMapAsImage()">
                            <i class="material-icons">image</i>
                            Export as Image
                        </button>
                        <button class="export-btn" onclick="exportMapAsText()">
                            <i class="material-icons">text_snippet</i>
                            Export as Text
                        </button>
                    </div>
                </div>
                
                <div class="sharing-section">
                    <h4>⚙️ Sharing Options</h4>
                    <div class="sharing-options">
                        <label class="option-checkbox">
                            <input type="checkbox" id="hide-player-tokens" checked>
                            Hide player tokens from shared map
                        </label>
                        <label class="option-checkbox">
                            <input type="checkbox" id="fog-of-war">
                            Enable fog of war (hide unexplored areas)
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function hideMapSharingModal() {
    const modal = document.getElementById('map-sharing-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function encodeMapToDataUrl(mapData) {
    // Convert map data to base64 encoded string
    const jsonString = JSON.stringify(mapData);
    return btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeMapFromDataUrl(encodedData) {
    try {
        // Decode base64 back to map data
        const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        const jsonString = atob(base64);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to decode map data:', error);
        return null;
    }
}

function copyShareableLink() {
    const linkInput = document.getElementById('shareable-link');
    linkInput.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard!', 'success');
}

function generateQRCode(url) {
    // Simple QR code generation (would need a library in real implementation)
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = `
        <div class="qr-code-placeholder">
            <p>QR Code for: ${url.substring(0, 50)}...</p>
            <p><small>Note: In a full implementation, this would show an actual QR code</small></p>
            <button onclick="copyShareableLink()">Copy Link Instead</button>
        </div>
    `;
}

function exportMapAsImage() {
    // Convert the map grid to canvas and download as image
    const mapGrid = document.getElementById('map-grid');
    if (!mapGrid) return;
    
    // Create a canvas representation of the map
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const tileSize = 40;
    const gridSize = currentMap.size;
    
    canvas.width = gridSize * tileSize;
    canvas.height = gridSize * tileSize;
    
    // Fill background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvas.width, i * tileSize);
        ctx.stroke();
    }
    
    // Draw tiles
    ctx.font = `${tileSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const tile = currentMap.mapData[y] && currentMap.mapData[y][x];
            if (tile && tile.value) {
                const centerX = x * tileSize + tileSize / 2;
                const centerY = y * tileSize + tileSize / 2;
                
                if (tile.type === 'emoji') {
                    ctx.fillText(tile.value, centerX, centerY);
                } else {
                    // For non-emoji tiles, draw a colored square
                    ctx.fillStyle = getTileColor(tile.type);
                    ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
                    ctx.fillStyle = '#000';
                    ctx.fillText(tile.name.charAt(0), centerX, centerY);
                }
            }
        }
    }
    
    // Download the canvas as image
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentMap.name || 'map'}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    showNotification('Map exported as image', 'success');
}

function exportMapAsText() {
    if (!currentMap || !currentMap.mapData) return;
    
    let textMap = `Map: ${currentMap.name || 'Untitled'}\n`;
    textMap += `Size: ${currentMap.size}x${currentMap.size}\n`;
    textMap += `Type: ${currentMap.type || 'Unknown'}\n\n`;
    
    // Create ASCII representation
    for (let y = 0; y < currentMap.size; y++) {
        let row = '';
        for (let x = 0; x < currentMap.size; x++) {
            const tile = currentMap.mapData[y] && currentMap.mapData[y][x];
            if (tile && tile.value) {
                if (tile.type === 'emoji') {
                    row += tile.value;
                } else {
                    row += tile.name.charAt(0).toUpperCase();
                }
            } else {
                row += '·';
            }
        }
        textMap += row + '\n';
    }
    
    // Create downloadable text file
    const blob = new Blob([textMap], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name || 'map'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Map exported as text', 'success');
}

function getTileColor(tileType) {
    const colors = {
        'terrain': '#22c55e',
        'buildings': '#6366f1',
        'monsters': '#ef4444',
        'items': '#f59e0b',
        'hazards': '#dc2626',
        'paths': '#8b5cf6',
        'features': '#06b6d4',
        'tokens': '#14b8a6',
        'tools': '#6b7280'
    };
    return colors[tileType] || '#9ca3af';
}

// ========================================
// LOAD SHARED MAP
// ========================================
function checkForSharedMap() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedMapData = urlParams.get('sharedMap');
    
    if (sharedMapData) {
        const mapData = decodeMapFromDataUrl(sharedMapData);
        if (mapData) {
            loadSharedMap(mapData);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

function loadSharedMap(mapData) {
    currentMap = {
        size: mapData.size,
        mapData: mapData.mapData,
        playerLayer: mapData.playerLayer || [],
        name: mapData.name + ' (Shared)',
        type: mapData.type
    };
    
    // Update UI
    resizeMap();
    redrawMap();
    
    // Switch to map tab
    switchTab('map');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="map"]').classList.add('active');
    
    showNotification(`Loaded shared map: ${mapData.name}`, 'success');
}

// Check for shared map on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkForSharedMap, 1000);
});
