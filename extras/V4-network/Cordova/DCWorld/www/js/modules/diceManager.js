// Dice Panel Module
// Following the patterns established by David and Manus for StoryTeller modules

class DiceManager {
    constructor() {
        this.savedRolls = [];
        this.rollHistory = [];
        this.rollCounter = 0; // Track total number of rolls
        this.maxHistorySize = 50; // Increased for grid display
        this.currentAdvantageMode = null; // 'advantage', 'disadvantage', or null
        this.deleteMode = false; // For saved rolls delete mode
        this.diceMode = 'roll'; // 'roll' or 'build'
        this.builderFormula = ''; // Current formula being built
        
        this.init();
    }
    
    init() {
        this.loadSavedRolls();
        this.loadRollHistory();
        console.log('Dice Manager initialized');
    }
    
    // Roll a simple die
    rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }
    
    // Parse and execute a complex dice roll formula
    parseAndRoll(formula) {
        try {
            // Clean the formula
            const cleanFormula = formula.replace(/\s/g, '').toLowerCase();
            
            // Basic validation
            if (!/^[\dd\+\-\*\/\(\)]+$/.test(cleanFormula)) {
                throw new Error('Invalid characters in dice formula');
            }
            
            // Parse dice notation (e.g., "2d6", "1d20", "3d8+2")
            let processedFormula = cleanFormula;
            const diceMatches = cleanFormula.match(/(\d*)d(\d+)/g);
            const rollDetails = [];
            let totalMaxPossible = 0; // Track theoretical maximum
            let totalActual = 0; // Track actual total from dice only
            
            if (diceMatches) {
                for (const diceMatch of diceMatches) {
                    const [, countStr, sidesStr] = diceMatch.match(/(\d*)d(\d+)/);
                    const count = countStr ? parseInt(countStr) : 1;
                    const sides = parseInt(sidesStr);
                    
                    if (count > 100) throw new Error('Too many dice (max 100)');
                    if (sides > 1000) throw new Error('Too many sides (max 1000)');
                    
                    const rolls = [];
                    let total = 0;
                    
                    for (let i = 0; i < count; i++) {
                        const roll = this.rollDie(sides);
                        rolls.push(roll);
                        total += roll;
                    }
                    
                    // Add to our totals for max roll detection
                    totalMaxPossible += (count * sides); // Max possible for this group
                    totalActual += total; // Actual rolled for this group
                    
                    rollDetails.push({
                        formula: diceMatch,
                        count,
                        sides,
                        rolls,
                        total,
                        maxPossible: count * sides
                    });
                    
                    processedFormula = processedFormula.replace(diceMatch, total.toString());
                }
            }
            
            // Evaluate the mathematical expression
            const finalResult = this.evaluateExpression(processedFormula);
            
            // Check for max roll: only consider dice results, ignore modifiers
            // If we have dice and the dice total equals max possible dice total, it's a max roll
            const hasMaxRoll = diceMatches && diceMatches.length > 0 && totalActual === totalMaxPossible;
            
            return {
                formula: formula,
                result: finalResult,
                details: rollDetails,
                processedFormula,
                hasMaxRoll: hasMaxRoll,
                diceTotal: totalActual,
                maxPossible: totalMaxPossible
            };
            
        } catch (error) {
            throw new Error(`Invalid dice formula: ${error.message}`);
        }
    }
    
    // Safe mathematical expression evaluator
    evaluateExpression(expr) {
        // Only allow numbers, basic operators, and parentheses
        if (!/^[\d\+\-\*\/\(\)\s\.]+$/.test(expr)) {
            throw new Error('Invalid mathematical expression');
        }
        
        try {
            // Use Function constructor for safe evaluation
            return Function('"use strict"; return (' + expr + ')')();
        } catch (error) {
            throw new Error('Could not evaluate expression');
        }
    }
    
    // Roll with advantage/disadvantage (for d20 rolls)
    rollWithAdvantage(formula, type) {
        if (type === 'advantage') {
            const roll1 = this.parseAndRoll(formula);
            const roll2 = this.parseAndRoll(formula);
            const higher = roll1.result >= roll2.result ? roll1 : roll2;
            
            return {
                ...higher,
                advantageType: 'advantage',
                bothRolls: [roll1.result, roll2.result],
                chosen: higher.result,
                hasMaxRoll: roll1.hasMaxRoll || roll2.hasMaxRoll // Either roll had max
            };
        } else if (type === 'disadvantage') {
            const roll1 = this.parseAndRoll(formula);
            const roll2 = this.parseAndRoll(formula);
            const lower = roll1.result <= roll2.result ? roll1 : roll2;
            
            return {
                ...lower,
                advantageType: 'disadvantage',
                bothRolls: [roll1.result, roll2.result],
                chosen: lower.result,
                hasMaxRoll: roll1.hasMaxRoll || roll2.hasMaxRoll // Either roll had max
            };
        }
        
        return this.parseAndRoll(formula);
    }
    
    // Execute a roll and add to history
    executeRoll(formula, rollName = null) {
        try {
            let result;
            
            // Apply advantage/disadvantage to ANY dice roll, not just d20
            if (this.currentAdvantageMode) {
                result = this.rollWithAdvantage(formula, this.currentAdvantageMode);
            } else {
                result = this.parseAndRoll(formula);
            }
            
            this.rollCounter++; // Increment roll counter
            
            const rollRecord = {
                id: this.generateId(),
                rollNumber: this.rollCounter,
                formula: result.formula,
                result: result.result,
                details: result.details,
                name: rollName,
                timestamp: new Date().toISOString(),
                advantageType: result.advantageType,
                bothRolls: result.bothRolls,
                hasMaxRoll: result.hasMaxRoll
            };
            
            this.addToHistory(rollRecord);
            this.displayRollResult(rollRecord);
            
            // Add to chat
            if (typeof addChatMessage === 'function') {
                let message = `🎲 ${rollName ? `${rollName}: ` : ''}${formula} = ${result.result}`;
                if (result.advantageType) {
                    message += ` (${result.advantageType}: ${result.bothRolls.join(', ')})`;
                }
                if (result.hasMaxRoll) {
                    message += ` 🔥 MAX ROLL!`;
                }
                addChatMessage(message, 'system');
            }
            
            return rollRecord;
            
        } catch (error) {
            this.displayError(error.message);
            return null;
        }
    }
    
    // Display roll result in the UI
    displayRollResult(rollRecord) {
        const resultsContainer = document.getElementById('dice-results');
        if (!resultsContainer) return;
        
        // Clear placeholder if it exists
        const placeholder = resultsContainer.querySelector('.placeholder-text');
        if (placeholder) {
            placeholder.remove();
        }
        
        const resultElement = document.createElement('div');
        resultElement.className = 'dice-result';
        
        // Add max roll class if applicable
        if (rollRecord.hasMaxRoll) {
            resultElement.classList.add('max-roll');
        }
        
        // Special handling for advantage/disadvantage rolls
        if (rollRecord.advantageType && rollRecord.bothRolls) {
            resultElement.classList.add('advantage-roll');
            
            const [roll1, roll2] = rollRecord.bothRolls;
            const isAdvantage = rollRecord.advantageType === 'advantage';
            const chosenRoll = rollRecord.result;
            
            // Determine which roll was chosen and color coding
            const roll1IsChosen = (isAdvantage && roll1 >= roll2) || (!isAdvantage && roll1 <= roll2);
            const roll2IsChosen = !roll1IsChosen;
            
            resultElement.innerHTML = `
                <div class="roll-number">R${rollRecord.rollNumber}</div>
                <h5 title="${rollRecord.name || rollRecord.formula}">${rollRecord.name || rollRecord.formula}</h5>
                <div class="advantage-result">
                    <div class="advantage-label ${rollRecord.advantageType}">
                        ${rollRecord.advantageType === 'advantage' ? '📈 ADV' : '📉 DIS'}
                    </div>
                    <div class="dual-rolls">
                        <span class="roll-value ${roll1IsChosen ? 'chosen' : 'not-chosen'} ${rollRecord.advantageType}">
                            ${roll1}
                        </span>
                        <span class="roll-separator">|</span>
                        <span class="roll-value ${roll2IsChosen ? 'chosen' : 'not-chosen'} ${rollRecord.advantageType}">
                            ${roll2}
                        </span>
                    </div>
                    <div class="final-result">= ${chosenRoll}</div>
                </div>
                <div class="result-timestamp">
                    ${new Date(rollRecord.timestamp).toLocaleTimeString()}
                </div>
            `;
        } else {
            // Normal roll display
            let detailsHtml = '';
            if (rollRecord.details && rollRecord.details.length > 0) {
                detailsHtml = rollRecord.details.map(detail => {
                    // Highlight individual max rolls in the details
                    const rollsText = detail.rolls.map(roll => 
                        roll === detail.sides ? `<strong>${roll}</strong>` : roll
                    ).join(', ');
                    return `${detail.formula}: [${rollsText}]`;
                }).join('<br>');
            }
            
            resultElement.innerHTML = `
                <div class="roll-number">R${rollRecord.rollNumber}</div>
                <h5 title="${rollRecord.name || rollRecord.formula}">${rollRecord.name || rollRecord.formula}</h5>
                <div class="result-number">${rollRecord.result}</div>
                ${detailsHtml ? `<div class="result-details">${detailsHtml}</div>` : ''}
                <div class="result-timestamp">
                    ${new Date(rollRecord.timestamp).toLocaleTimeString()}
                </div>
            `;
        }
        
        // Insert at the beginning for grid layout (new rolls appear at top-left)
        resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
        
        // Limit displayed results for performance
        const results = resultsContainer.querySelectorAll('.dice-result');
        if (results.length > 30) { // Increased limit for grid display
            results[results.length - 1].remove();
        }
    }
    
    // Display error message
    displayError(message) {
        const resultsContainer = document.getElementById('dice-results');
        if (!resultsContainer) return;
        
        const errorElement = document.createElement('div');
        errorElement.className = 'dice-result';
        errorElement.style.borderLeftColor = '#ff4444';
        errorElement.innerHTML = `
            <h5>❌ Error</h5>
            <div class="result-details" style="color: #ff4444;">${message}</div>
        `;
        
        resultsContainer.insertBefore(errorElement, resultsContainer.firstChild);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }
    
    // Add roll to history
    addToHistory(rollRecord) {
        this.rollHistory.unshift(rollRecord);
        
        // Limit history size
        if (this.rollHistory.length > this.maxHistorySize) {
            this.rollHistory = this.rollHistory.slice(0, this.maxHistorySize);
        }
        
        this.saveRollHistory();
    }
    
    // Save a custom roll
    saveRoll(name, formula) {
        if (!name.trim() || !formula.trim()) {
            throw new Error('Name and formula are required');
        }
        
        // Test the formula first
        this.parseAndRoll(formula);
        
        const savedRoll = {
            id: this.generateId(),
            name: name.trim(),
            formula: formula.trim(),
            created: new Date().toISOString()
        };
        
        this.savedRolls.push(savedRoll);
        this.saveSavedRolls();
        this.renderSavedRolls();
        
        if (typeof addChatMessage === 'function') {
            addChatMessage(`💾 Saved roll: "${name}" (${formula})`, 'system');
        }
    }
    
    // Delete a saved roll
    deleteSavedRoll(id) {
        this.savedRolls = this.savedRolls.filter(roll => roll.id !== id);
        this.saveSavedRolls();
        this.renderSavedRolls();
    }
    
    // Set advantage mode
    setAdvantageMode(mode) {
        this.currentAdvantageMode = mode;
        this.updateAdvantageButtons();
    }
    
    // Update advantage button states
    updateAdvantageButtons() {
        const advantageBtn = document.getElementById('advantage-btn');
        const disadvantageBtn = document.getElementById('disadvantage-btn');
        
        if (advantageBtn) {
            advantageBtn.classList.toggle('active', this.currentAdvantageMode === 'advantage');
        }
        if (disadvantageBtn) {
            disadvantageBtn.classList.toggle('active', this.currentAdvantageMode === 'disadvantage');
        }
    }
    
    // Render saved rolls list
    renderSavedRolls() {
        const container = document.getElementById('saved-rolls-list');
        if (!container) return;
        
        if (this.savedRolls.length === 0) {
            container.innerHTML = `
                <div class="dice-empty" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-secondary);">
                    📚 No saved rolls yet
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.savedRolls.map(roll => `
            <div class="saved-roll-item ${this.deleteMode ? 'delete-mode' : ''}" 
                 onclick="window.diceManager.handleSavedRollClick('${roll.id}', '${roll.formula}', '${roll.name}')">
                <div class="saved-roll-info">
                    <div class="saved-roll-name">${this.escapeHtml(roll.name)}</div>
                    <div class="saved-roll-formula">${this.escapeHtml(roll.formula)}</div>
                </div>
                <div class="delete-indicator">✖</div>
            </div>
        `).join('');
    }
    
    // Clear roll history
    clearHistory() {
        this.rollHistory = [];
        this.rollCounter = 0; // Reset roll counter
        this.saveRollHistory();
        
        const resultsContainer = document.getElementById('dice-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="placeholder-text">Click a die to roll</p>';
        }
        
        if (typeof addChatMessage === 'function') {
            addChatMessage('🧹 Cleared roll history', 'system');
        }
    }
    
    // Storage functions
    saveSavedRolls() {
        localStorage.setItem('storyteller_saved_rolls', JSON.stringify(this.savedRolls));
    }
    
    loadSavedRolls() {
        try {
            const stored = localStorage.getItem('storyteller_saved_rolls');
            if (stored) {
                this.savedRolls = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load saved rolls:', error);
            this.savedRolls = [];
        }
    }
    
    saveRollHistory() {
        const historyData = {
            rollHistory: this.rollHistory,
            rollCounter: this.rollCounter
        };
        localStorage.setItem('storyteller_roll_history', JSON.stringify(historyData));
    }
    
    loadRollHistory() {
        try {
            const stored = localStorage.getItem('storyteller_roll_history');
            if (stored) {
                const historyData = JSON.parse(stored);
                this.rollHistory = historyData.rollHistory || [];
                this.rollCounter = historyData.rollCounter || 0;
            }
        } catch (error) {
            console.warn('Failed to load roll history:', error);
            this.rollHistory = [];
            this.rollCounter = 0;
        }
    }
    
    // Export/Import functions
    exportRolls() {
        const exportData = {
            savedRolls: this.savedRolls,
            rollHistory: this.rollHistory,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyteller-dice-rolls-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof addChatMessage === 'function') {
            addChatMessage('💾 Exported dice rolls', 'system');
        }
    }
    
    importRolls(fileContent) {
        try {
            const importData = JSON.parse(fileContent);
            
            if (importData.savedRolls) {
                this.savedRolls = [...this.savedRolls, ...importData.savedRolls];
                this.saveSavedRolls();
                this.renderSavedRolls();
            }
            
            if (typeof addChatMessage === 'function') {
                addChatMessage(`📥 Imported ${importData.savedRolls?.length || 0} saved rolls`, 'system');
            }
            
        } catch (error) {
            throw new Error('Invalid dice rolls file format');
        }
    }
    
    // Utility functions
    generateId() {
        return 'roll_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Handle saved roll click (either execute or delete based on mode)
    handleSavedRollClick(rollId, formula, name) {
        if (this.deleteMode) {
            this.deleteSavedRoll(rollId);
        } else {
            this.executeRoll(formula, name);
        }
    }
    
    // Toggle delete mode for saved rolls
    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.renderSavedRolls();
        
        const deleteBtn = document.querySelector('.delete-mode-btn');
        if (deleteBtn) {
            deleteBtn.classList.toggle('active', this.deleteMode);
            deleteBtn.textContent = this.deleteMode ? '✖ Exit Delete' : '🗑 Delete';
        }
    }
    
    // Toggle between roll and build modes
    toggleDiceMode(mode) {
        this.diceMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.dice-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update dice builder visibility (dice controls always stay visible)
        const diceBuilder = document.querySelector('.dice-builder');
        
        if (mode === 'build') {
            diceBuilder.classList.add('active');
        } else {
            diceBuilder.classList.remove('active');
        }
    }
    
    // Add dice to unified builder (works for both typing and clicking)
    addDiceToBuilder(diceType) {
        if (this.diceMode !== 'build') {
            // Normal roll mode - execute immediately
            this.executeRoll(`1${diceType}`);
            return;
        }
        
        // Build mode - add to unified input
        const unifiedInput = document.getElementById('unified-roll-input');
        if (unifiedInput) {
            let currentValue = unifiedInput.value.trim();
            
            if (currentValue) {
                // Add a + if we're appending to existing formula
                if (!currentValue.endsWith('+') && !currentValue.endsWith('-')) {
                    currentValue += '+';
                }
            }
            
            unifiedInput.value = currentValue + `1${diceType}`;
            unifiedInput.focus();
        }
    }
    
    // Clear unified builder
    clearUnifiedBuilder() {
        const unifiedInput = document.getElementById('unified-roll-input');
        if (unifiedInput) {
            unifiedInput.value = '';
            unifiedInput.focus();
        }
    }
    
    // Roll unified formula
    rollUnifiedFormula() {
        const unifiedInput = document.getElementById('unified-roll-input');
        if (!unifiedInput) return;
        
        const formula = unifiedInput.value.trim();
        if (!formula) return;
        
        this.executeRoll(formula);
    }
    
    // Save unified roll
    saveUnifiedRoll() {
        const unifiedInput = document.getElementById('unified-roll-input');
        if (!unifiedInput) return;
        
        const formula = unifiedInput.value.trim();
        if (!formula) return;
        
        const name = prompt('Enter a name for this roll:', formula);
        if (name !== null && name.trim()) {
            try {
                this.saveRoll(name.trim(), formula);
            } catch (error) {
                alert(error.message);
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for UI interaction
function rollSimpleDie(diceType) {
    if (window.diceManager) {
        window.diceManager.addDiceToBuilder(diceType);
    }
}

function rollCustomFormula() {
    // Legacy function - redirect to unified
    if (window.diceManager) {
        window.diceManager.rollUnifiedFormula();
    }
}

function saveCustomRoll() {
    // Legacy function - redirect to unified
    if (window.diceManager) {
        window.diceManager.saveUnifiedRoll();
    }
}

function setAdvantageMode(mode) {
    if (window.diceManager) {
        const currentMode = window.diceManager.currentAdvantageMode;
        const newMode = currentMode === mode ? null : mode;
        window.diceManager.setAdvantageMode(newMode);
    }
}

function clearRollHistory() {
    if (window.diceManager && confirm('Clear all roll history?')) {
        window.diceManager.clearHistory();
    }
}

function exportDiceRolls() {
    if (window.diceManager) {
        window.diceManager.exportRolls();
    }
}

function importDiceRolls() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    window.diceManager.importRolls(e.target.result);
                } catch (error) {
                    alert(error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Initialize dice panel
function initializeDicePanel() {
    if (!window.diceManager) {
        window.diceManager = new DiceManager();
    }
    
    // Render initial state
    window.diceManager.renderSavedRolls();
    window.diceManager.updateAdvantageButtons();
    
    console.log('Dice panel initialized');
}

// New functions for dice builder and delete mode
function toggleDeleteMode() {
    if (window.diceManager) {
        window.diceManager.toggleDeleteMode();
    }
}

function toggleDiceMode(mode) {
    if (window.diceManager) {
        window.diceManager.toggleDiceMode(mode);
    }
}

// New unified functions
function rollUnifiedFormula() {
    if (window.diceManager) {
        window.diceManager.rollUnifiedFormula();
    }
}

function saveUnifiedRoll() {
    if (window.diceManager) {
        window.diceManager.saveUnifiedRoll();
    }
}

function clearUnifiedBuilder() {
    if (window.diceManager) {
        window.diceManager.clearUnifiedBuilder();
    }
}
