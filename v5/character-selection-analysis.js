/* CHARACTER SELECTION FLOW ANALYSIS */

// Found in v5/js/core/character-manager.js

// 1. CHARACTER CARDS are created by createCharacterCard(charData)
//    - Cards displayed in <div class="characters-grid">
//    - Each card has 2 selection methods:

// METHOD 1: Click anywhere on card (general area)
card.onclick = () => loadCharacterFromManager(charData.id);

// METHOD 2: Click chat button (💬 emoji)
<button class="card-action-btn chat-btn" 
        onclick="event.stopPropagation(); loadCharacterAndConnect('${charData.id}')" 
        title="Load Character & Connect to Chat">
    💬
</button>

// FLOW ANALYSIS:
// Method 1: Click card → loadCharacterFromManager(id)
// Method 2: Click chat → loadCharacterAndConnect(id) → loadCharacterFromManager(id)

// BOTH methods call loadCharacterFromManager() where our fix is located:

function loadCharacterFromManager(characterId) {
    // ... character loading logic ...
    
    // OUR FIX: Set player names for trade area system
    if (typeof window.setNetworkPlayerName === 'function') {
        window.setNetworkPlayerName(character.name || 'Unknown Player');
    } else {
        // CRITICAL FIX: Set player names for trade area system
        window.networkPlayerName = character.name || 'Unknown Player';
        window.playerName = character.name || 'Unknown Player';
        console.log(`👤 Set player name: ${window.playerName}`);
    }
}

/* CONCLUSION: Our fix covers both character selection methods! */