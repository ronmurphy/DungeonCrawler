// ========================================
// PLAYER DATA PARSER
// Parse player attack data from copy-paste
// ========================================

// Expected format from player app:
// ATTACK:PlayerName:AttackRoll:Damage:WeaponName
// e.g., "ATTACK:Carl:18:8:Steel Sword"

function addPlayerDataInput() {
    // Add to combat tab after the attack resolution section
    const combatCard = document.querySelector('.active-combat-card .card-header');
    if (!combatCard) return;
    
    const playerDataSection = document.createElement('div');
    playerDataSection.className = 'player-data-section';
    playerDataSection.innerHTML = `
        <div class="player-data-input">
            <h4>Quick Player Data Input</h4>
            <p class="input-help">Players can copy attack data from their app and paste here:</p>
            <div class="data-input-group">
                <textarea id="player-data-paste" placeholder="Paste player attack data here...
Example: ATTACK:Carl:18:8:Steel Sword" rows="3"></textarea>
                <button class="parse-data-btn" onclick="parsePlayerData()">
                    <i class="material-icons">content_paste</i>
                    Parse & Apply
                </button>
            </div>
        </div>
    `;
    
    // Insert after player attack section
    const attackSection = document.querySelector('.player-attack-section');
    if (attackSection) {
        attackSection.parentNode.insertBefore(playerDataSection, attackSection.nextSibling);
    }
}

function parsePlayerData() {
    const textarea = document.getElementById('player-data-paste');
    const data = textarea.value.trim();
    
    if (!data) {
        showNotification('No data to parse', 'error');
        return;
    }
    
    // Parse different data types
    const lines = data.split('\n');
    let successCount = 0;
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        if (line.startsWith('ATTACK:')) {
            if (parseAttackData(line)) successCount++;
        } else if (line.startsWith('ROLL:')) {
            if (parseGeneralRoll(line)) successCount++;
        } else if (line.startsWith('SPELL:')) {
            if (parseSpellData(line)) successCount++;
        }
    });
    
    if (successCount > 0) {
        showNotification(`Parsed ${successCount} player action(s)`, 'success');
        textarea.value = ''; // Clear after successful parse
    } else {
        showNotification('No valid data found to parse', 'error');
    }
}

function parseAttackData(line) {
    // Format: ATTACK:PlayerName:AttackRoll:Damage:WeaponName
    const parts = line.split(':');
    
    if (parts.length < 5) {
        console.warn('Invalid attack data format:', line);
        return false;
    }
    
    const [, playerName, attackRoll, damage, weaponName] = parts;
    
    // Auto-fill the attack resolution fields
    document.getElementById('attacking-player').value = playerName;
    document.getElementById('attack-roll').value = attackRoll;
    document.getElementById('damage-roll').value = damage;
    
    // Auto-resolve the attack
    setTimeout(() => {
        resolvePlayerAttack();
        addToCombatLog(`Auto-parsed attack from ${playerName} with ${weaponName}`);
    }, 100);
    
    return true;
}

function parseGeneralRoll(line) {
    // Format: ROLL:PlayerName:SkillName:Result:Description
    const parts = line.split(':');
    
    if (parts.length < 4) {
        console.warn('Invalid roll data format:', line);
        return false;
    }
    
    const [, playerName, skillName, result, description] = parts;
    const desc = description || '';
    
    addToCombatLog(`${playerName} rolled ${skillName}: ${result} ${desc}`);
    return true;
}

function parseSpellData(line) {
    // Format: SPELL:PlayerName:SpellName:AttackRoll:Damage:MPCost
    const parts = line.split(':');
    
    if (parts.length < 6) {
        console.warn('Invalid spell data format:', line);
        return false;
    }
    
    const [, playerName, spellName, attackRoll, damage, mpCost] = parts;
    
    // Handle spell attacks similarly to weapon attacks
    document.getElementById('attacking-player').value = playerName;
    document.getElementById('attack-roll').value = attackRoll;
    document.getElementById('damage-roll').value = damage;
    
    setTimeout(() => {
        resolvePlayerAttack();
        addToCombatLog(`Auto-parsed spell ${spellName} from ${playerName} (${mpCost} MP)`);
    }, 100);
    
    return true;
}

// Add to the V3 player app - example of what players would copy
function generatePlayerAttackData(playerName, attackRoll, damage, weaponName) {
    return `ATTACK:${playerName}:${attackRoll}:${damage}:${weaponName}`;
}

function generatePlayerRollData(playerName, skillName, result, description = '') {
    return `ROLL:${playerName}:${skillName}:${result}:${description}`;
}

function generatePlayerSpellData(playerName, spellName, attackRoll, damage, mpCost) {
    return `SPELL:${playerName}:${spellName}:${attackRoll}:${damage}:${mpCost}`;
}

// Initialize when combat manager loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('combat')) {
            addPlayerDataInput();
        }
    }, 1000);
});
