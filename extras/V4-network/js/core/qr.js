/* ========================================
   CHARACTER CARD STEGANOGRAPHY SYSTEM
   Beautiful character cards with embedded data
   ======================================== */

/* ========================================
   CHARACTER CARD VISUAL EXPORT SYSTEM
   Beautiful character cards for sharing and viewing
   ======================================== */

// Character Card Generation - Visual Only
function shareCharacterAsCard() {
    console.log('=== SHARE CHARACTER AS CARD CALLED ===');
    
    const currentCharacter = getCurrentCharacterData();
    
    console.log('Character data retrieved:', currentCharacter);
    
    if (!currentCharacter) {
        console.log('No character data found');
        showNotification('warning', 'No Character', 'No character data found!', 'Please create a character first.');
        return;
    }
    
    if (!currentCharacter.name || currentCharacter.name.trim() === '') {
        console.log('Character name missing');
        showNotification('warning', 'Missing Name', 'Please enter a character name first!', 'Character name is required for sharing.');
        return;
    }

    // Show layout selection modal instead of generating immediately
    showLayoutSelectionModal(currentCharacter);
}

function showLayoutSelectionModal(characterData) {
    // Store character data for later use
    window.pendingCharacterData = characterData;
    
    // Show the layout selection modal
    document.getElementById('layout-selection-modal').style.display = 'flex';
    showNotification('info', 'Choose Layout', 'Select your preferred card layout', 'Preview styles below and click to generate.');
}

function closeLayoutSelectionModal() {
    document.getElementById('layout-selection-modal').style.display = 'none';
    window.pendingCharacterData = null;
}

function generateSelectedLayout(layout) {
    const characterData = window.pendingCharacterData;
    
    if (!characterData) {
        showNotification('warning', 'No Character Data', 'Character data not found!', 'Please try generating the card again.');
        return;
    }
    
    try {
        console.log(`Generating ${layout} layout...`);
        
        // Close the layout selection modal
        closeLayoutSelectionModal();
        
        // Generate the card with selected layout
        generateCharacterCard(characterData, layout);
        
        // Show the card modal
        document.getElementById('card-modal').style.display = 'flex';
        
        // Update the modal title based on layout
        const layoutNames = {
            'portrait': 'Portrait Card',
            'stat-sheet': 'Stat Sheet Card', 
            'full-sheet': 'Full Character Sheet',
            'combat-card': 'Combat Reference Card'
        };
        
        const modalTitle = document.querySelector('#card-modal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = layoutNames[layout] || 'Character Card';
        }
        
        showNotification('save', 'Card Generated', `${layoutNames[layout]} generated successfully!`, 'Your beautiful character card is ready.');
        
    } catch (error) {
        console.error('Error generating character card:', error);
        showNotification('warning', 'Generation Failed', 'Failed to generate character card', error.message);
    }
}

function generateCharacterCard(characterData, layout = 'portrait') {
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on layout
    switch(layout) {
        case 'portrait':
            canvas.width = 600;
            canvas.height = 800;
            break;
        case 'stat-sheet':
            canvas.width = 800;
            canvas.height = 600;
            break;
        case 'full-sheet':
            canvas.width = 1200;
            canvas.height = 1600; // Full character sheet
            break;
        case 'combat-card':
            canvas.width = 700;  // Landscape orientation  
            canvas.height = 500;
            break;
        default:
            canvas.width = 600;
            canvas.height = 800;
    }
    
    // Get current theme colors
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--accent-primary').trim() || '#6b46c1';
    const bgColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#ffffff';
    const textColor = computedStyle.getPropertyValue('--text-primary').trim() || '#000000';
    const cardBg = computedStyle.getPropertyValue('--bg-secondary').trim() || '#f8fafc';
    
    // Determine card style based on character data
    const cardStyle = determineCardStyle(characterData);
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw card based on layout
    switch(layout) {
        case 'portrait':
            drawPortraitCard(ctx, characterData, cardStyle, { primaryColor, bgColor, textColor, cardBg });
            break;
        case 'stat-sheet':
            drawStatSheetCard(ctx, characterData, cardStyle, { primaryColor, bgColor, textColor, cardBg });
            break;
        case 'full-sheet':
            drawFullSheetCard(ctx, characterData, cardStyle, { primaryColor, bgColor, textColor, cardBg });
            break;
        case 'combat-card':
            drawCombatCard(ctx, characterData, cardStyle, { primaryColor, bgColor, textColor, cardBg });
            break;
        default:
            drawPortraitCard(ctx, characterData, cardStyle, { primaryColor, bgColor, textColor, cardBg });
    }
    
    console.log('Character card generated successfully - visual only');
}

function determineCardStyle(characterData) {
    const race = characterData.race || characterData.customRace || '';
    const charClass = characterData.class || characterData.customClass || '';
    const background = characterData.job || characterData.customJob || '';
    
    // Magical theme
    if (charClass.includes('wizard') || charClass.includes('sorcerer') || charClass.includes('warlock') || 
        charClass.includes('necrobard') || charClass.includes('glass_cannon') || race.includes('primal')) {
        return { 
            type: 'magical', 
            colors: { primary: '#8b5cf6', secondary: '#a855f7', accent: '#c084fc' },
            pattern: 'arcane'
        };
    }
    
    // Warrior theme
    if (charClass.includes('fighter') || charClass.includes('barbarian') || charClass.includes('paladin') ||
        charClass.includes('prizefighter') || race.includes('orc') || background.includes('soldier')) {
        return { 
            type: 'warrior', 
            colors: { primary: '#dc2626', secondary: '#b91c1c', accent: '#f87171' },
            pattern: 'battle'
        };
    }
    
    // Tech theme
    if (charClass.includes('hacker') || charClass.includes('engineer') || charClass.includes('bomb_squad') ||
        race.includes('cyborg') || race.includes('android') || background.includes('programmer')) {
        return { 
            type: 'tech', 
            colors: { primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
            pattern: 'circuit'
        };
    }
    
    // Nature theme
    if (charClass.includes('druid') || charClass.includes('ranger') || race.includes('elf') ||
        race.includes('were_creature') || background.includes('banana_farmer')) {
        return { 
            type: 'nature', 
            colors: { primary: '#059669', secondary: '#047857', accent: '#6ee7b7' },
            pattern: 'organic'
        };
    }
    
    // Default classic theme
    return { 
        type: 'classic', 
        colors: { primary: '#6b46c1', secondary: '#553c9a', accent: '#a78bfa' },
        pattern: 'classic'
    };
}

function drawMagicalCard(ctx, characterData, style, colors) {
    // Magical gradient background
    const gradient = ctx.createRadialGradient(300, 400, 0, 300, 400, 400);
    gradient.addColorStop(0, style.colors.primary + '20');
    gradient.addColorStop(0.7, style.colors.secondary + '10');
    gradient.addColorStop(1, colors.cardBg);
    
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, gradient);
    
    // Mystical border with arcane symbols
    ctx.strokeStyle = style.colors.primary;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, null, true);
    
    // Add floating magical particles
    drawMagicalParticles(ctx, style.colors);
    
    // Character info with magical styling
    drawCharacterInfo(ctx, characterData, style, colors, 'magical');
}

function drawWarriorCard(ctx, characterData, style, colors) {
    // Battle-worn parchment background
    ctx.fillStyle = colors.cardBg;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, colors.cardBg);
    
    // Add weathered texture
    addTextureOverlay(ctx, 'weathered');
    
    // Bold border with battle damage
    ctx.strokeStyle = style.colors.primary;
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, null, true);
    
    // Add sword and shield decorations
    drawWarriorDecorations(ctx, style.colors);
    
    drawCharacterInfo(ctx, characterData, style, colors, 'warrior');
}

function drawTechCard(ctx, characterData, style, colors) {
    // Futuristic gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 800);
    gradient.addColorStop(0, colors.cardBg);
    gradient.addColorStop(0.5, style.colors.primary + '15');
    gradient.addColorStop(1, colors.cardBg);
    
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, gradient);
    
    // Circuit board pattern
    drawCircuitPattern(ctx, style.colors);
    
    // Glowing tech border
    ctx.shadowColor = style.colors.accent;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = style.colors.primary;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, null, true);
    ctx.shadowBlur = 0;
    
    drawCharacterInfo(ctx, characterData, style, colors, 'tech');
}

function drawNatureCard(ctx, characterData, style, colors) {
    // Natural gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, style.colors.accent + '30');
    gradient.addColorStop(0.7, colors.cardBg);
    gradient.addColorStop(1, style.colors.primary + '20');
    
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, gradient);
    
    // Organic border with leaf patterns
    drawOrganicBorder(ctx, style.colors);
    
    drawCharacterInfo(ctx, characterData, style, colors, 'nature');
}

function drawClassicCard(ctx, characterData, style, colors) {
    // Classic elegant background
    ctx.fillStyle = colors.cardBg;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, colors.cardBg);
    
    // Elegant border
    ctx.strokeStyle = style.colors.primary;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 20, 20, 560, 760, 20, null, true);
    
    // Add subtle corner decorations
    drawClassicDecorations(ctx, style.colors);
    
    drawCharacterInfo(ctx, characterData, style, colors, 'classic');
}

function drawCharacterPortrait(ctx, characterData, style) {
    const portraitSize = 180;
    const portraitX = (600 - portraitSize) / 2;
    const portraitY = 80;
    
    // Get actual portrait from DOM
    const portraitElement = document.getElementById('portrait-display');
    const portraitImg = portraitElement ? portraitElement.querySelector('img') : null;
    
    if (portraitImg && portraitImg.src && (portraitImg.src.startsWith('data:image/') || portraitImg.src.startsWith('http'))) {
        // Draw actual portrait (supports both base64 and URL images)
        const img = new Image();
        img.onload = function() {
            ctx.save();
            
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(portraitX + portraitSize/2, portraitY + portraitSize/2, portraitSize/2, 0, 2 * Math.PI);
            ctx.clip();
            
            // Draw the portrait image
            ctx.drawImage(img, portraitX, portraitY, portraitSize, portraitSize);
            
            ctx.restore();
            
            // Add portrait border
            ctx.strokeStyle = style.colors.primary;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(portraitX + portraitSize/2, portraitY + portraitSize/2, portraitSize/2, 0, 2 * Math.PI);
            ctx.stroke();
        };
        img.src = portraitImg.src;
    } else {
        // Draw default portrait with style-appropriate icon
        drawDefaultPortrait(ctx, portraitX, portraitY, portraitSize, style);
    }
}

function drawDefaultPortrait(ctx, x, y, size, style) {
    // Portrait background circle
    ctx.fillStyle = style.colors.primary;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Style-appropriate icon
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    
    let icon = '👤';
    switch (style.type) {
        case 'magical': icon = '🧙‍♂️'; break;
        case 'warrior': icon = '⚔️'; break;
        case 'tech': icon = '🤖'; break;
        case 'nature': icon = '🌿'; break;
    }
    
    ctx.fillText(icon, x + size/2, y + size/2 + 20);
    
    // Portrait border
    ctx.strokeStyle = style.colors.secondary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawCharacterInfo(ctx, characterData, style, colors, theme) {
    const portraitSize = 180;
    const portraitY = 80;
    const infoStartY = portraitY + portraitSize + 40;
    
    // Character name with theme styling
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold ${theme === 'tech' ? '32px "Courier New"' : '36px Arial'}`;
    ctx.textAlign = 'center';
    ctx.fillText(characterData.name, 300, infoStartY);
    
    // Level with styled background
    const levelY = infoStartY + 50;
    ctx.fillStyle = style.colors.primary;
    ctx.fillRect(250, levelY - 25, 100, 35);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Level ${characterData.level || 1}`, 300, levelY);
    
    // Race, Class, Background
    ctx.font = '18px Arial';
    ctx.fillStyle = colors.textColor;
    const race = characterData.race || characterData.customRace || 'Unknown';
    const charClass = characterData.class || characterData.customClass || 'Unknown';
    const background = characterData.job || characterData.customJob || 'Unknown';
    
    ctx.fillText(`${race} ${charClass}`, 300, levelY + 40);
    ctx.fillText(`${background}`, 300, levelY + 65);
    
    // Stats section with theme styling
    const statsY = levelY + 110;
    drawThemedStatsSection(ctx, characterData, style, colors, statsY, theme);
    
    // HP/MP with styled bars
    const vitalsY = statsY + 120;
    drawVitalStats(ctx, characterData, style, colors, vitalsY);
    
    // Footer
    ctx.font = '12px Arial';
    ctx.fillStyle = colors.textColor;
    ctx.globalAlpha = 0.6;
    ctx.fillText('Dungeon Crawler World', 300, 740);
    ctx.fillText('dcc-custom.vercel.app', 300, 760);
    ctx.globalAlpha = 1.0;
}

function drawThemedStatsSection(ctx, characterData, style, colors, y, theme) {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = style.colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText('ATTRIBUTES', 300, y);
    
    const stats = characterData.stats || {};
    const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const statValues = [
        stats.strength || 2, stats.dexterity || 2, stats.constitution || 2,
        stats.intelligence || 2, stats.wisdom || 2, stats.charisma || 2
    ];
    
    // Draw stats in a grid with theme styling
    for (let i = 0; i < 6; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 150 + (col * 100);
        const statY = y + 30 + (row * 40);
        
        // Stat background
        ctx.fillStyle = style.colors.primary + '20';
        ctx.fillRect(x - 35, statY - 15, 70, 25);
        
        // Stat label
        ctx.fillStyle = style.colors.primary;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(statNames[i], x, statY - 2);
        
        // Stat value
        ctx.fillStyle = colors.textColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(statValues[i].toString(), x, statY + 15);
    }
}

function drawVitalStats(ctx, characterData, style, colors, y) {
    const hp = characterData.healthPoints || characterData.currentHealthPoints || 3;
    const mp = characterData.magicPoints || characterData.currentMagicPoints || 4;
    
    // HP Bar
    ctx.fillStyle = style.colors.primary + '30';
    ctx.fillRect(150, y, 120, 20);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(150, y, Math.min(120, (hp / 20) * 120), 20);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${hp}`, 210, y + 14);
    
    // MP Bar
    ctx.fillStyle = style.colors.primary + '30';
    ctx.fillRect(330, y, 120, 20);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(330, y, Math.min(120, (mp / 20) * 120), 20);
    ctx.fillStyle = 'white';
    ctx.fillText(`MP: ${mp}`, 390, y + 14);
}

// Decoration functions
function drawMagicalParticles(ctx, colors) {
    ctx.fillStyle = colors.accent + '80';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 560 + 20;
        const y = Math.random() * 760 + 20;
        const size = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawCircuitPattern(ctx, colors) {
    ctx.strokeStyle = colors.primary + '30';
    ctx.lineWidth = 1;
    
    // Draw circuit lines
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(50 + i * 50, 50);
        ctx.lineTo(50 + i * 50, 750);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(50, 80 + i * 70);
        ctx.lineTo(550, 80 + i * 70);
        ctx.stroke();
    }
}

function drawOrganicBorder(ctx, colors) {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    
    // Draw leaf-like border decorations
    for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const x = 300 + Math.cos(rad) * 280;
        const y = 400 + Math.sin(rad) * 380;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rad);
        
        // Simple leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 15, 0, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }
}

function drawWarriorDecorations(ctx, colors) {
    // Corner sword decorations
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    
    // Top corners
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(80, 50);
    ctx.lineTo(65, 35);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(550, 50);
    ctx.lineTo(520, 50);
    ctx.lineTo(535, 35);
    ctx.stroke();
}

function drawClassicDecorations(ctx, colors) {
    // Elegant corner flourishes
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    
    // Corner decorations
    for (let corner of [[50, 50], [550, 50], [50, 750], [550, 750]]) {
        const [x, y] = corner;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI / 2);
        ctx.stroke();
    }
}

function addTextureOverlay(ctx, textureType) {
    // Add subtle texture overlay
    const imageData = ctx.getImageData(20, 20, 560, 760);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.1) {
            const noise = (Math.random() - 0.5) * 20;
            data[i] += noise;     // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
        }
    }
    
    ctx.putImageData(imageData, 20, 20);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor = null, strokeOnly = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    
    if (fillColor && !strokeOnly) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    if (strokeOnly) {
        ctx.stroke();
    }
}

// === REMOVED STEGANOGRAPHY FUNCTIONS ===
// embedDataInCanvas, stringToBinary, binaryToString, extractDataFromImage
// These were removed as we switched to DCW format for character sharing

// === NEW LAYOUT DRAWING FUNCTIONS ===

function drawPortraitCard(ctx, characterData, cardStyle, colors) {
    // Portrait layout - character art + key stats (existing style, cleaned up)
    // TODO: Implement portrait card layout
    console.log('Drawing portrait card layout');
    
    // For now, call the existing drawing function
    switch (cardStyle.type) {
        case 'magical':
            drawMagicalCard(ctx, characterData, cardStyle, colors);
            break;
        case 'warrior':
            drawWarriorCard(ctx, characterData, cardStyle, colors);
            break;
        case 'tech':
            drawTechCard(ctx, characterData, cardStyle, colors);
            break;
        case 'nature':
            drawNatureCard(ctx, characterData, cardStyle, colors);
            break;
        default:
            drawClassicCard(ctx, characterData, cardStyle, colors);
    }
}

function drawStatSheetCard(ctx, characterData, cardStyle, colors) {
    // Stat sheet layout - more detailed stats, compact format
    console.log('Drawing stat sheet card layout');
    // TODO: Implement compact stat sheet layout
    drawPortraitCard(ctx, characterData, cardStyle, colors); // Fallback for now
}

function drawFullSheetCard(ctx, characterData, cardStyle, colors) {
    // Full character sheet with graphing paper background!
    console.log('Drawing full character sheet with graphing paper background');
    // TODO: Implement full character sheet with graph paper background
    drawPortraitCard(ctx, characterData, cardStyle, colors); // Fallback for now
}

function drawCombatCard(ctx, characterData, cardStyle, colors) {
    // Combat card - FF7 Main Menu style
    console.log('Drawing FF7-style combat card');
    
    const canvas = ctx.canvas;
    const width = canvas.width;  // 700px wide
    const height = canvas.height; // 500px tall
    
    // FF7 Main menu background - dark blue gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#16213e');
    bgGradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // FF7 style outer border
    drawFF7Border(ctx, 5, 5, width - 10, height - 10, '#4fc3f7', 3);
    
    const padding = 25;
    
    // Main character window (like FF7 party member display)
    const charWindowX = padding;
    const charWindowY = padding;
    const charWindowW = width - padding * 2;
    const charWindowH = 140;
    
    drawFF7Window(ctx, charWindowX, charWindowY, charWindowW, charWindowH);
    
    // Character portrait - copy from existing portrait-display element
    const avatarSize = 80;
    const avatarX = charWindowX + 20;
    const avatarY = charWindowY + 30;
    
    // Get the actual rendered image from the portrait display
    const portraitElement = document.getElementById('portrait-display');
    const existingImg = portraitElement ? portraitElement.querySelector('img') : null;
    
    if (existingImg && existingImg.src && existingImg.complete) {
        // Image is already loaded and ready - draw it directly
        ctx.save();
        drawFF7Border(ctx, avatarX - 2, avatarY - 2, avatarSize + 4, avatarSize + 4, '#4fc3f7', 1);
        ctx.beginPath();
        ctx.rect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.clip();
        ctx.drawImage(existingImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        console.log('Portrait copied from existing image element');
    } else if (existingImg && existingImg.src) {
        // Image exists but might still be loading
        existingImg.onload = function() {
            ctx.save();
            drawFF7Border(ctx, avatarX - 2, avatarY - 2, avatarSize + 4, avatarSize + 4, '#4fc3f7', 1);
            ctx.beginPath();
            ctx.rect(avatarX, avatarY, avatarSize, avatarSize);
            ctx.clip();
            ctx.drawImage(existingImg, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            console.log('Portrait copied after image loaded');
        };
    } else {
        console.log('No existing portrait image found, showing placeholder');
        drawFF7AvatarPlaceholder();
    }
    
    function drawFF7AvatarPlaceholder() {
        drawFF7Border(ctx, avatarX - 2, avatarY - 2, avatarSize + 4, avatarSize + 4, '#4fc3f7', 1);
        ctx.fillStyle = '#2a4858';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO IMAGE', avatarX + avatarSize/2, avatarY + avatarSize/2);
    }
    
    // Character name and level (FF7 style text)
    const nameX = avatarX + avatarSize + 25;
    const nameY = charWindowY + 40;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(characterData.name || 'CLOUD', nameX, nameY);
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '16px monospace';
    ctx.fillText(`LV ${String(characterData.level || 1).padStart(2, ' ')}`, nameX, nameY + 25);
    
    // Heritage, Background, Class
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    const heritage = characterData.heritage || characterData.race || 'Human';
    const background = characterData.background || characterData.job || 'Folk Hero';
    const characterClass = characterData.class || 'Fighter';
    ctx.fillText(`${heritage} ${background}`, nameX, nameY + 45);
    ctx.fillText(`${characterClass}`, nameX, nameY + 60);
    
    // HP/MP bars (FF7 style) - aligned with Equipment column
    const barX = charWindowX + charWindowW/2 + 10 + 20; // Align with Equipment text
    const barY = nameY - 10;
    const barWidth = 180;
    const barHeight = 12;
    
    // HP
    const currentHP = characterData.currentHealthPoints || 0;
    const maxHP = characterData.healthPoints || 1;
    const hpPercent = currentHP / maxHP;
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP', barX, barY);
    
    drawFF7Bar(ctx, barX + 25, barY - 8, barWidth, barHeight, hpPercent, '#00ff41', '#004d0f');
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentHP}/${maxHP}`, barX + barWidth + 25, barY);
    
    // MP
    const currentMP = characterData.currentMagicPoints || 0;
    const maxMP = characterData.magicPoints || 1;
    const mpPercent = currentMP / maxMP;
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MP', barX, barY + 25);
    
    drawFF7Bar(ctx, barX + 25, barY + 17, barWidth, barHeight, mpPercent, '#4169ff', '#0f1f4d');
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentMP}/${maxMP}`, barX + barWidth + 25, barY + 25);
    
    // AC/Defense under HP/MP bars
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const ac = characterData.armorClass || calculateAC(characterData);
    ctx.fillText(`AC: ${ac}`, barX, barY + 50);
    
    // Call extended method to fill in the rest
    drawExtendedFF7Details(ctx, characterData, charWindowX, charWindowY + charWindowH, charWindowW, height, padding);
    
    console.log('FF7-style combat card completed');
}

function drawExtendedFF7Details(ctx, characterData, startX, startY, fullWidth, canvasHeight, padding) {
    // Extended details for the bottom area
    const availableHeight = canvasHeight - startY - padding;
    
    // Stats window (left)
    const statsY = startY + 15;
    const statsH = Math.floor(availableHeight / 2) - 10;
    const statsW = fullWidth / 2 - 10;
    drawFF7Window(ctx, startX, statsY, statsW, statsH);
    
    // Stats content
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('STATS', startX + 20, statsY + 25);
    
    const stats = characterData.stats || {};
    const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const statLabels = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    
    ctx.font = '12px monospace';
    let statY = statsY + 45;
    for (let i = 0; i < statNames.length; i++) {
        const statValue = stats[statNames[i]] || 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${statLabels[i]}`, startX + 25, statY);
        ctx.fillStyle = '#00ff41';
        ctx.textAlign = 'right';
        ctx.fillText(String(statValue).padStart(3, ' '), startX + statsW - 30, statY);
        ctx.textAlign = 'left';
        statY += 15;
    }
    
    // Equipment window (right)
    const equipX = startX + statsW + 20;
    drawFF7Window(ctx, equipX, statsY, statsW, statsH);
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('EQUIPMENT', equipX + 20, statsY + 25);
    
    const equipment = characterData.equipment || {};
    const inventory = characterData.inventory || [];
    
    const mainWeapon = inventory.find(item => item.id === equipment.mainHand);
    const offWeapon = inventory.find(item => item.id === equipment.offHand);
    const armor = inventory.find(item => item.id === equipment.armor);
    
    ctx.font = '11px monospace';
    let equipY = statsY + 45;
    
    if (mainWeapon) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Main:', equipX + 25, equipY);
        ctx.fillStyle = '#ffff00';
        ctx.fillText(mainWeapon.name, equipX + 25, equipY + 12);
        ctx.fillStyle = '#00ff41';
        ctx.fillText(`DMG: ${mainWeapon.damage || 'N/A'}`, equipX + 25, equipY + 24);
        equipY += 35;
    }
    
    if (offWeapon) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Off:', equipX + 25, equipY);
        ctx.fillStyle = '#ffff00';
        ctx.fillText(offWeapon.name, equipX + 25, equipY + 12);
        equipY += 25;
    }
    
    if (armor) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Armor:', equipX + 25, equipY);
        ctx.fillStyle = '#ffff00';
        ctx.fillText(armor.name, equipX + 25, equipY + 12);
    }
    
    // Bottom row - Achievements and Magic
    const bottomY = statsY + statsH + 15;
    const bottomH = availableHeight - statsH - 30;
    
    // Achievements window (left)
    drawFF7Window(ctx, startX, bottomY, statsW, bottomH);
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ACHIEVEMENTS', startX + 20, bottomY + 25);
    
    if (characterData.achievements && characterData.achievements.length > 0) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffd700';
        let achY = bottomY + 45;
        
        characterData.achievements.slice(0, 4).forEach(achievement => {
            ctx.fillText(`★ ${achievement.name}`, startX + 25, achY);
            achY += 15;
        });
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('No achievements yet', startX + 25, bottomY + 45);
    }
    
    // Magic window (right)
    drawFF7Window(ctx, equipX, bottomY, statsW, bottomH);
    
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('MAGIC', equipX + 20, bottomY + 25);
    
    if (characterData.spells && characterData.spells.length > 0) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#9999ff';
        let spellY = bottomY + 45;
        
        characterData.spells.slice(0, 4).forEach(spell => {
            ctx.fillText(`${spell.name}`, equipX + 25, spellY);
            ctx.fillStyle = '#00ff41';
            ctx.textAlign = 'right';
            ctx.fillText(`${spell.cost || 0}MP`, equipX + statsW - 30, spellY);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#9999ff';
            spellY += 15;
        });
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('No spells learned', equipX + 25, bottomY + 45);
    }
}

function calculateAC(characterData) {
    // Basic AC calculation - 10 + DEX modifier + armor bonus
    const dexMod = Math.floor((characterData.stats?.dexterity || 10) / 2) - 5;
    const baseAC = 10 + dexMod;
    
    // Add armor bonus if equipped
    const equipment = characterData.equipment || {};
    const inventory = characterData.inventory || [];
    const armor = inventory.find(item => item.id === equipment.armor);
    const armorBonus = armor?.acBonus || 0;
    
    return baseAC + armorBonus;
}

function drawFF7Window(ctx, x, y, w, h) {
    // FF7 window background
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, 'rgba(26, 35, 62, 0.9)');
    gradient.addColorStop(1, 'rgba(15, 15, 35, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    
    // FF7 window border
    drawFF7Border(ctx, x, y, w, h, '#4fc3f7', 2);
}

function drawFF7Border(ctx, x, y, w, h, color, thickness) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.strokeRect(x, y, w, h);
    
    // Inner highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawFF7Bar(ctx, x, y, w, h, percent, fillColor, bgColor) {
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(x + 1, y + 1, (w - 2) * percent, h - 2);
}

function closeCardModal() {
    document.getElementById('card-modal').style.display = 'none';
}

function downloadCharacterCard() {
    const canvas = document.getElementById('card-canvas');
    const currentCharacter = getCurrentCharacterData();
    
    // Create filename: CharName-Class-Level.png
    const charName = (currentCharacter?.name || 'Character').replace(/[^a-zA-Z0-9]/g, '_');
    const charClass = (currentCharacter?.class || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const charLevel = currentCharacter?.level || '1';
    const filename = `${charName}-${charClass}-L${charLevel}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification('save', 'Card Downloaded', `Character card saved as ${filename}`, 'File contains embedded character data!');
}

function shareCharacterCard() {
    const canvas = document.getElementById('card-canvas');
    const currentCharacter = getCurrentCharacterData();
    
    canvas.toBlob(function(blob) {
        if (navigator.share && navigator.canShare) {
            const charName = currentCharacter?.name || 'Character';
            const filename = `${charName.replace(/[^a-zA-Z0-9]/g, '_')}-Card.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            
            navigator.share({
                title: 'DCC Character Card',
                text: `Check out my character ${charName} for Dungeon Crawler World!`,
                files: [file]
            }).catch(error => {
                console.error('Share failed:', error);
                showNotification('warning', 'Share Failed', 'Share failed', 'Use "Save Card" instead.');
            });
        } else {
            // Fallback: copy to clipboard if supported
            if (navigator.clipboard) {
                canvas.toBlob(blob => {
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]).then(() => {
                        showNotification('save', 'Copied', 'Character card copied to clipboard!', 'Ready to paste elsewhere.');
                    }).catch(() => {
                        showNotification('save', 'Use Download', 'Use "Save Card" to download the character card', 'Clipboard not supported.');
                    });
                });
            } else {
                showNotification('save', 'Use Download', 'Use "Save Card" to download the character card', 'Sharing not supported on this device.');
            }
        }
    });
}

// Character Loading from Card
function loadCharacterFromCard() {
    showNotification('save', 'Load Character', 'Select a character card image to load', 'Choose a PNG file with embedded character data.');
    document.getElementById('card-scanner-modal').style.display = 'flex';
}

function handleCardUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('warning', 'Invalid File', 'Please select an image file', 'Character cards must be PNG images.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            try {
                const characterData = extractDataFromImage(img);
                if (characterData) {
                    importCharacterData(characterData);
                    closeCardScannerModal();
                } else {
                    showNotification('warning', 'No Data Found', 'No character data found in this image', 'Make sure this is a valid character card.');
                }
            } catch (error) {
                console.error('Error loading character from image:', error);
                showNotification('warning', 'Load Failed', 'Failed to load character from image', error.message);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// === REMOVED extractDataFromImage FUNCTION ===
// Image data extraction was removed - we now use DCW files for character sharing

function closeCardScannerModal() {
    document.getElementById('card-scanner-modal').style.display = 'none';
    // Reset file input
    const fileInput = document.getElementById('card-upload');
    if (fileInput) fileInput.value = '';
}

// QR Code Scanning
let qrStream = null;
let qrScanning = false;

function scanQRForCharacter() {
    document.getElementById('qr-scanner-modal').style.display = 'flex';
    // Hide camera option since we're going file-upload only for now
    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) cameraBtn.style.display = 'none';
    
    showNotification('Upload a QR code image to import a character', 'info');
}

function closeQRScannerModal() {
    qrScanning = false;
    if (qrStream) {
        if (qrStream.stop) {
            // QrScanner object
            qrStream.stop();
        } else if (qrStream.getTracks) {
            // MediaStream object
            qrStream.getTracks().forEach(track => track.stop());
        }
        qrStream = null;
    }
    
    // Reset modal display
    document.querySelector('.scanner-container').style.display = 'none';
    document.querySelector('.file-upload-area').style.display = 'block';
    
    document.getElementById('qr-scanner-modal').style.display = 'none';
}

function uploadQRImage() {
    document.getElementById('qr-file-input').click();
}

function processQRFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Create a simple image reader for now
    const img = new Image();
    
    img.onload = function() {
        // For now, we'll show a message that the user needs to use JSON export/import
        // since we need a working QR decoder
        showNotification('QR code uploaded! For now, please use "Export" and "Load" buttons to share characters.', 'info');
        closeQRScannerModal();
    };
    
    img.onerror = function() {
        showNotification('Failed to load image', 'error');
    };
    
    img.src = URL.createObjectURL(file);
    event.target.value = '';
}

function processQRData(qrString) {
    try {
        const qrData = JSON.parse(qrString);
        
        // Validate QR data
        if (qrData.type !== 'dcc-character' || !qrData.data) {
            showNotification('Invalid character QR code', 'error');
            return;
        }

        // Close scanner modal
        closeQRScannerModal();

        // Confirm import
        const characterName = qrData.data.name || 'Unknown Character';
        const characterClass = qrData.data.class || 'Unknown Class';
        const characterLevel = qrData.data.level || '?';
        
        const message = `Import character "${characterName}" (${characterClass}, Level ${characterLevel})?\n\nThis will replace your current character.`;
        
        if (confirm(message)) {
            importCharacterFromQR(qrData.data);
            showNotification(`Character "${characterName}" imported successfully!`, 'success');
        }

    } catch (error) {
        console.error('Error processing QR data:', error);
        showNotification('Invalid QR code format', 'error');
    }
}

function importCharacterFromQR(characterData) {
    try {
        // Try to use existing character loading function if available
        if (typeof loadCharacterData === 'function') {
            loadCharacterData(characterData);
        } else if (typeof window.loadCharacter === 'function') {
            window.loadCharacter(characterData);
        } else {
            // Fallback: store in localStorage and trigger reload
            localStorage.setItem('qr-imported-character', JSON.stringify(characterData));
            localStorage.setItem('qr-import-pending', 'true');
            
            // Try to trigger character load if function exists
            if (typeof refreshCharacterDisplay === 'function') {
                refreshCharacterDisplay();
            } else {
                // Last resort: reload page
                showNotification('Character data saved. Refreshing page...', 'info');
                setTimeout(() => location.reload(), 1000);
            }
        }
    } catch (error) {
        console.error('Error importing character:', error);
        showNotification('Failed to import character', 'error');
    }
}

function getCurrentCharacterData() {
    // Try different ways to get current character data
    
    // First check if the global character object exists (main.js)
    if (typeof character !== 'undefined' && character) {
        return character;
    }
    
    if (window.currentCharacter) {
        return window.currentCharacter;
    }
    
    if (window.character) {
        return window.character;
    }
    
    // Try to get from localStorage
    const stored = localStorage.getItem('currentCharacter') || localStorage.getItem('character');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored character:', e);
        }
    }
    
    // Try to build character from form fields
    const charName = document.getElementById('char-name')?.value;
    if (charName) {
        return {
            name: charName,
            level: document.getElementById('char-level')?.value || 1,
            class: document.getElementById('class-select')?.value || 'Unknown',
            race: document.getElementById('race-select')?.value || 'Unknown',
            // Add more fields as needed
        };
    }
    
    return null;
}

// Handle imported character on page load
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('qr-import-pending') === 'true') {
        const importedData = localStorage.getItem('qr-imported-character');
        if (importedData) {
            try {
                const characterData = JSON.parse(importedData);
                // Clear the import flags
                localStorage.removeItem('qr-import-pending');
                localStorage.removeItem('qr-imported-character');
                
                // Try to load the character
                setTimeout(() => {
                    importCharacterFromQR(characterData);
                }, 500); // Small delay to ensure page is ready
            } catch (error) {
                console.error('Error processing imported character:', error);
                localStorage.removeItem('qr-import-pending');
                localStorage.removeItem('qr-imported-character');
            }
        }
    }
});

function importCharacterData(characterData) {
    try {
        if (characterData && characterData.name) {
            const characterName = characterData.name;
            
            // Validate that it's a valid character object
            if (!characterData.stats) {
                showNotification('warning', 'Invalid Data', 'Invalid character data', 'Character card does not contain valid character data.');
                return;
            }
            
            // Import the character data directly into the global character object
            if (typeof character !== 'undefined') {
                // Merge the imported data with current character structure
                Object.assign(character, characterData);
                
                // Update the UI immediately
                updateAllCharacterDisplays();
                
                showNotification('save', 'Import Success', `Character "${characterName}" loaded successfully!`, 'Character data loaded from card.');
            } else {
                // Fallback: store in localStorage and reload
                localStorage.setItem('character', JSON.stringify(characterData));
                showNotification('save', 'Import Success', `Character "${characterName}" imported successfully!`, 'The page will reload to show your imported character.');
                
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        } else {
            showNotification('warning', 'Invalid Format', 'Invalid character data', 'Character card does not contain valid data.');
        }
    } catch (error) {
        console.error('Import error:', error);
        showNotification('warning', 'Import Failed', 'Failed to import character', error.message);
    }
}

// Update character displays after import
function updateAllCharacterDisplays() {
    // Trigger updates for various character display functions if they exist
    if (typeof updateStatsDisplay === 'function') updateStatsDisplay();
    if (typeof updateCharacterOverview === 'function') updateCharacterOverview();
    if (typeof renderStatsGrid === 'function') renderStatsGrid();
    if (typeof updateVitals === 'function') updateVitals();
    if (typeof updateCharacterInfo === 'function') updateCharacterInfo();
    
    // Update form fields
    if (character.name) {
        const nameField = document.getElementById('char-name');
        if (nameField) nameField.value = character.name;
    }
    
    if (character.level) {
        const levelField = document.getElementById('char-level');
        if (levelField) levelField.value = character.level;
    }
    
    if (character.race) {
        const raceField = document.getElementById('race-select');
        if (raceField) raceField.value = character.race;
    }
    
    if (character.class) {
        const classField = document.getElementById('class-select');
        if (classField) classField.value = character.class;
    }
    
    if (character.job) {
        const jobField = document.getElementById('job-select');
        if (jobField) jobField.value = character.job;
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'card-modal') closeCardModal();
        if (event.target.id === 'card-scanner-modal') closeCardScannerModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCardModal();
        closeCardScannerModal();
    }
});
