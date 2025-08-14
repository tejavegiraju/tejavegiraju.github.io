let players = [];
let currentPlayerIndex = 0;
let drawCards = [];
let discardedCards = [];

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
    document.getElementById('reset-pelusas').addEventListener('click', initializePelusas);
}

export function initializePelusas() {
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
}

function skipTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    startTurn();
    document.getElementById('skip').disabled = true;
    updateUI();
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
    }
}

function transferCards(fromPlayer, cardNumber) {
    const currentPlayer = players[currentPlayerIndex];
    const cardsToTransfer = fromPlayer.cards.filter(card => card === cardNumber);
    currentPlayer.cards.push(...cardsToTransfer);
    fromPlayer.cards = fromPlayer.cards.filter(card => card !== cardNumber);
    // alert(`${currentPlayer.name} took ${cardsToTransfer.length} card(s) of number ${cardNumber} from ${fromPlayer.name}`);
    skipTurn();
}
