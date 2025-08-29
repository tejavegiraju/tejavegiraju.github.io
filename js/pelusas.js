let players = [];
let currentPlayerIndex = 0;
let drawCards = [];
let discardedCards = [];

// Storage key for game state
const GAME_STATE_KEY = 'pelusas-game-state';

// Save game state to session storage
function saveGameState() {
    const gameState = {
        players,
        currentPlayerIndex,
        drawCards,
        discardedCards,
        timestamp: Date.now()
    };
    try {
        sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    } catch (error) {
        console.warn('Failed to save game state:', error);
    }
}

// Load game state from session storage
function loadGameState() {
    try {
        const savedState = sessionStorage.getItem(GAME_STATE_KEY);
        if (savedState) {
            const gameState = JSON.parse(savedState);
            // Check if the saved state is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (Date.now() - gameState.timestamp < maxAge) {
                return gameState;
            } else {
                // Clear old state
                clearGameState();
            }
        }
    } catch (error) {
        console.warn('Failed to load game state:', error);
        clearGameState();
    }
    return null;
}

// Clear game state from session storage
function clearGameState() {
    try {
        sessionStorage.removeItem(GAME_STATE_KEY);
    } catch (error) {
        console.warn('Failed to clear game state:', error);
    }
}

// Restore game state
function restoreGameState(gameState) {
    players = gameState.players || [];
    currentPlayerIndex = gameState.currentPlayerIndex || 0;
    drawCards = gameState.drawCards || [];
    discardedCards = gameState.discardedCards || [];
}

// Check if there's a saved game
function hasSavedGame() {
    return loadGameState() !== null;
}

// Show continue game dialog
function showContinueGameDialog() {
    return new Promise((resolve) => {
        const dialog = createDialog();
        const content = dialog.querySelector('#dialog-content');
        const buttons = dialog.querySelector('#dialog-buttons');
        
        // Get saved game data to show player info
        const savedState = loadGameState();
        let playerInfo = '';
        
        if (savedState && savedState.players) {
            const playerNames = savedState.players.map(player => player.name).join(', ');
            const currentPlayerName = savedState.players[savedState.currentPlayerIndex]?.name || 'Unknown';
            const cardsRemaining = savedState.drawCards?.length || 0;
            
            playerInfo = `
                <div class="bg-gray-700 rounded-lg p-3 mb-4 text-left">
                    <p class="text-sm text-gray-300 mb-2"><strong>Players:</strong> ${playerNames}</p>
                    <p class="text-sm text-gray-300 mb-2"><strong>Current Turn:</strong> ${currentPlayerName}</p>
                    <p class="text-sm text-gray-300"><strong>Cards Remaining:</strong> ${cardsRemaining}</p>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-4">🎮</div>
                <h3 class="text-white text-lg font-bold mb-4">Continue Previous Game?</h3>
                <p class="text-gray-300 mb-4">We found a saved game in progress. Would you like to continue where you left off?</p>
                ${playerInfo}
            </div>
        `;
        
        const newGameButton = document.createElement('button');
        newGameButton.textContent = 'New Game';
        newGameButton.className = 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mr-2';
        newGameButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve('new');
        };
        
        const continueButton = document.createElement('button');
        continueButton.textContent = 'Continue Game';
        continueButton.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold';
        continueButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve('continue');
        };
        
        // Add keyboard support
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                continueButton.click();
            } else if (e.key === 'Escape') {
                newGameButton.click();
            }
        });
        
        // Close on background click (counts as new game)
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve('new');
            }
        });
        
        buttons.appendChild(newGameButton);
        buttons.appendChild(continueButton);
        
        // Focus on continue button by default
        continueButton.focus();
    });
}

// Custom dialog functions
function createDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div id="dialog-content"></div>
            <div id="dialog-buttons" class="flex justify-end space-x-2 mt-4"></div>
        </div>
    `;
    document.body.appendChild(dialog);
    return dialog;
}

function showAlert(message) {
    return new Promise((resolve) => {
        const dialog = createDialog();
        const content = dialog.querySelector('#dialog-content');
        const buttons = dialog.querySelector('#dialog-buttons');
        
        content.innerHTML = `<p class="text-white mb-4">${message}</p>`;
        
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded';
        okButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve();
        };
        
        buttons.appendChild(okButton);
        okButton.focus();
    });
}

function showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const dialog = createDialog();
        const content = dialog.querySelector('#dialog-content');
        const buttons = dialog.querySelector('#dialog-buttons');
        
        content.innerHTML = `
            <p class="text-white mb-4">${message}</p>
            <input type="text" id="prompt-input" value="${defaultValue}" 
                   class="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none">
        `;
        
        const input = content.querySelector('#prompt-input');
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(null);
        };
        
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded';
        okButton.onclick = () => {
            const value = input.value.trim();
            document.body.removeChild(dialog);
            resolve(value || null);
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                okButton.click();
            } else if (e.key === 'Escape') {
                cancelButton.click();
            }
        });
        
        buttons.appendChild(cancelButton);
        buttons.appendChild(okButton);
        input.focus();
        input.select();
    });
}

function showConfirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const dialog = createDialog();
        const content = dialog.querySelector('#dialog-content');
        const buttons = dialog.querySelector('#dialog-buttons');
        
        content.innerHTML = `
            <h3 class="text-white text-lg font-bold mb-4">${title}</h3>
            <p class="text-gray-300 mb-4">${message}</p>
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = cancelText;
        cancelButton.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(false);
        };
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = confirmText;
        confirmButton.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold';
        confirmButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(true);
        };
        
        // Add keyboard support
        document.addEventListener('keydown', function keyHandler(e) {
            if (e.key === 'Enter') {
                confirmButton.click();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'Escape') {
                cancelButton.click();
                document.removeEventListener('keydown', keyHandler);
            }
        });
        
        buttons.appendChild(cancelButton);
        buttons.appendChild(confirmButton);
        
        // Focus on cancel button by default for safety
        cancelButton.focus();
    });
}

function showPlayerPrompt() {
    return new Promise((resolve) => {
        const dialog = createDialog();
        const content = dialog.querySelector('#dialog-content');
        const buttons = dialog.querySelector('#dialog-buttons');
        
        content.innerHTML = `
            <h3 class="text-white text-lg font-bold mb-4">Enter Player Names</h3>
            <p class="text-gray-300 text-sm mb-4">At least 2 players required, maximum 6 players allowed</p>
            <div id="player-inputs" class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div class="player-input-group">
                        <label class="text-white text-sm block mb-1">Player 1 <span class="text-red-400">*</span></label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 1 name" required>
                    </div>
                    <div class="player-input-group">
                        <label class="text-white text-sm block mb-1">Player 2 <span class="text-red-400">*</span></label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 2 name" required>
                    </div>
                    <div class="player-input-group" style="display: none;">
                        <label class="text-white text-sm block mb-1">Player 3</label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 3 name">
                    </div>
                    <div class="player-input-group" style="display: none;">
                        <label class="text-white text-sm block mb-1">Player 4</label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 4 name">
                    </div>
                    <div class="player-input-group" style="display: none;">
                        <label class="text-white text-sm block mb-1">Player 5</label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 5 name">
                    </div>
                    <div class="player-input-group" style="display: none;">
                        <label class="text-white text-sm block mb-1">Player 6</label>
                        <input type="text" class="player-input w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 outline-none" placeholder="Enter player 6 name">
                    </div>
                </div>
            </div>
            <div class="flex justify-between mt-4">
                <button id="add-player-btn" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Add Player</button>
                <button id="remove-player-btn" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" style="display: none;">Remove Player</button>
            </div>
        `;
        
        const playerInputs = content.querySelectorAll('.player-input');
        const addButton = content.querySelector('#add-player-btn');
        const removeButton = content.querySelector('#remove-player-btn');
        const inputGroups = content.querySelectorAll('.player-input-group');
        
        let visibleInputs = 2;
        
        function updateButtons() {
            addButton.style.display = visibleInputs >= 6 ? 'none' : 'block';
            removeButton.style.display = visibleInputs <= 2 ? 'none' : 'block';
        }
        
        addButton.onclick = () => {
            if (visibleInputs < 6) {
                inputGroups[visibleInputs].style.display = 'block';
                visibleInputs++;
                updateButtons();
            }
        };
        
        removeButton.onclick = () => {
            if (visibleInputs > 2) {
                visibleInputs--;
                inputGroups[visibleInputs].style.display = 'none';
                playerInputs[visibleInputs].value = '';
                updateButtons();
            }
        };
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(null);
        };
        
        const okButton = document.createElement('button');
        okButton.textContent = 'Start Game';
        okButton.className = 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded';
        okButton.onclick = () => {
            const names = [];
            for (let i = 0; i < visibleInputs; i++) {
                const name = playerInputs[i].value.trim();
                if (i < 2 && !name) {
                    playerInputs[i].focus();
                    playerInputs[i].classList.add('border-red-500');
                    return;
                }
                if (name) {
                    names.push(name);
                }
            }
            
            // Check for duplicate names
            const uniqueNames = [...new Set(names)];
            if (uniqueNames.length !== names.length) {
                showAlert('Please ensure all player names are unique.');
                return;
            }
            
            if (names.length < 2) {
                showAlert('At least 2 players are required to start the game.');
                return;
            }
            
            document.body.removeChild(dialog);
            resolve(names.join(','));
        };
        
        // Add Enter key support
        playerInputs.forEach((input, index) => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (index < visibleInputs - 1) {
                        playerInputs[index + 1].focus();
                    } else {
                        okButton.click();
                    }
                }
            });
            
            input.addEventListener('input', () => {
                input.classList.remove('border-red-500');
            });
        });
        
        buttons.appendChild(cancelButton);
        buttons.appendChild(okButton);
        
        // Focus on first input
        playerInputs[0].focus();
    });
}

export function attachPelusasEvents() {
    document.getElementById('draw-risk').addEventListener('click', drawRisk);
    document.getElementById('skip').addEventListener('click', skipTurn);
    document.getElementById('reset-pelusas').addEventListener('click', confirmResetPelusas);
}

// Confirmation dialog for resetting the game
async function confirmResetPelusas() {
    const confirmed = await showConfirm(
        'Reset Game', 
        'Are you sure you want to reset the game? All current progress will be lost.',
        'Reset',
        'Cancel'
    );
    
    if (confirmed) {
        clearGameState(); // Clear saved state
        initializePelusas();
    }
}

export function initializePelusas() {
    // Check if there's a saved game
    if (hasSavedGame()) {
        showContinueGameDialog().then(choice => {
            if (choice === 'continue') {
                const savedState = loadGameState();
                if (savedState) {
                    restoreGameState(savedState);
                    updateUI();
                    return;
                }
            }
            // If new game or failed to restore, start fresh
            clearGameState(); // Clear any existing saved state
            startNewGame();
        });
    } else {
        startNewGame();
    }
}

// Start a new game
function startNewGame() {
    showPlayerPrompt().then(playerNamesInput => {
        if (!playerNamesInput) {
            return; // User cancelled
        }
        const playerNames = playerNamesInput.split(',').map(name => name.trim());
        const uniquePlayerNames = [...new Set(playerNames.filter(name => name))]; // Ensure unique names
        
        players = uniquePlayerNames.map(name => ({ name, cards: [], score: 0 }));
        drawCards = generateDeck();
        discardedCards = [];
        currentPlayerIndex = 0;
        updateUI();
        saveGameState(); // Save initial state
    });
}

function generateDeck() {
    const deck = [];
    for (let i = 1; i <= 5; i++) {
        for (let j = 0; j < 13; j++) deck.push(i);
    }
    for (let i = 6; i <= 10; i++) {
        for (let j = 0; j < 9; j++) deck.push(i);
    }
    return shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawRisk() {
    if (drawCards.length === 0) return;
    const card = drawCards.pop();
    const currentPlayer = players[currentPlayerIndex];
    currentPlayer.cards.push(card);
    if (currentPlayer.cards.length > 3 
        && currentPlayer.cards.filter(c => c === card).length > 1) {
        discardedCards.push(...currentPlayer.cards);
        currentPlayer.cards = [];
        showAlert(`${currentPlayer.name} picked duplicate card ${card}! Cards moved to discarded deck.`).then(() => {
            //next player's turn
            skipTurn();
        });
    }
    updateUI();
    checkSkipEligibility();
    saveGameState(); // Save state after each action
}

function skipTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    startTurn();
    document.getElementById('skip').disabled = true;
    updateUI();
    saveGameState(); // Save state after each action
}

function checkSkipEligibility() {
    const currentPlayer = players[currentPlayerIndex];
    const skipButton = document.getElementById('skip');
    if (currentPlayer.cards.length >= 3) {
        skipButton.disabled = false;
        skipButton.classList.remove('bg-gray-600', 'hover:bg-gray-700');
        skipButton.classList.add('bg-purple-600', 'hover:bg-purple-700');
    } else {
        skipButton.disabled = true;
        skipButton.classList.add('bg-gray-600', 'hover:bg-gray-700');
        skipButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
    }
}

function startTurn() {
    const currentPlayer = players[currentPlayerIndex];
    const cardSum = currentPlayer.cards.reduce((sum, card) => sum + card, 0);
    currentPlayer.score += cardSum;
    discardedCards.push(...currentPlayer.cards);
    currentPlayer.cards = [];
    // alert(`${currentPlayer.name}'s turn ended. Score updated by ${cardSum}.`);
}

function updateUI() {
    document.getElementById('draw-count').textContent = `Total: ${drawCards.length}`;
    document.getElementById('discarded-count').textContent = `Total: ${discardedCards.length}`;
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    const currPlayerCards = players[currentPlayerIndex].cards;

    players.forEach(player => {
        player.cards.sort((a, b) => a - b);
    });

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player bg-gray-700 rounded-xl p-4 text-center shadow-md';
        playerDiv.id = `player-${player.name}`;

        if (index === currentPlayerIndex) {
            playerDiv.classList.add('bg-yellow-800', 'text-yellow-100');
        }

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('mb-2');
        headerDiv.innerHTML = `<p class="font-bold text-lg">${player.name}</p>
            <p class="text-sm">Score: ${player.score}</p>
            <p>Cards: ${player.cards.join(', ')}</p>`;
        playerDiv.appendChild(headerDiv);

        const cardsDiv = document.createElement('div');
        cardsDiv.classList.add('flex', 'justify-center', 'flex-wrap', 'gap-2');
        
        const uniqueCards = [...new Set(player.cards)];
        uniqueCards.forEach(card => {
            const cardButton = document.createElement('button');
            cardButton.textContent = card;
            cardButton.classList.add('bg-purple-600', 'hover:bg-purple-700', 'text-white', 'font-bold', 'py-1', 'px-3', 'rounded-full', 'transition-colors', 'disabled:opacity-50', 'disabled:cursor-not-allowed');
            cardButton.disabled = player.cards.length < 3 || currPlayerCards.indexOf(card) == -1 
                || index === currentPlayerIndex;
            cardButton.onclick = () => transferCards(player, card);
            cardsDiv.appendChild(cardButton);
        });
        playerDiv.appendChild(cardsDiv);
        playersDiv.appendChild(playerDiv);
    });

    document.getElementById('game-status').textContent = `Current Player: ${players[currentPlayerIndex].name}`;
    if (drawCards.length === 0) {
        document.getElementById('draw-risk').disabled = true;
        document.getElementById('skip').disabled = true;
        players.forEach(player => {
            player.score += player.cards.reduce((sum, card) => sum + card, 0);
            player.cards = [];
        });
        const winner = players.reduce((prev, curr) => (prev.score > curr.score ? prev : curr));
        document.getElementById('game-status').textContent = `Game Over!
            Winner is ${winner.name} with score ${winner.score}`;
        document.getElementById(`player-${winner.name}`).classList.add('bg-green-600', 'text-white');
        
        // Clear saved state when game ends
        clearGameState();
    }
}

function transferCards(fromPlayer, cardNumber) {
    const currentPlayer = players[currentPlayerIndex];
    const cardsToTransfer = fromPlayer.cards.filter(card => card === cardNumber);
    currentPlayer.cards.push(...cardsToTransfer);
    fromPlayer.cards = fromPlayer.cards.filter(card => card !== cardNumber);
    // alert(`${currentPlayer.name} took ${cardsToTransfer.length} card(s) of number ${cardNumber} from ${fromPlayer.name}`);
    skipTurn();
    saveGameState(); // Save state after each action
}

// Auto-save game state every minute
setInterval(() => {
    saveGameState();
}, 60 * 1000);
