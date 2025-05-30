let players = [];
let currentPlayerIndex = 0;
let drawCards = [];
let discardedCards = [];

function initializeGame() {
    const playerNames = prompt('Enter player names (comma-separated):').split(',').map(name => name.trim());
    const uniquePlayerNames = [...new Set(playerNames.filter(name => name))]; // Ensure unique names
    if (uniquePlayerNames.length < 3 || uniquePlayerNames.length > 6) {
        alert('Please enter between 3 and 6 player names.');
        initializeGame();
        return;
    }
    players = uniquePlayerNames.map(name => ({ name, cards: [], score: 0 }));
    drawCards = generateDeck();
    discardedCards = [];
    updateUI();
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
        alert(`${currentPlayer.name} picked duplicate card ${card}! Cards moved to discarded deck.`);
        //next player's turn
        skipTurn();
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
    if (currentPlayer.cards.length >= 3) {
        document.getElementById('skip').disabled = false;
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
        playerDiv.className = 'player';
        playerDiv.id = `player-${player.name}`;
        playerDiv.innerHTML = `<p><strong>${player.name}</strong></p>
            <p>Score: ${player.score}</p>
            <p>Cards: ${player.cards.join(', ')}</p>`;
        if (index === currentPlayerIndex) {
            playerDiv.style.backgroundColor = 'lightyellow';
        }
        const cardsDiv = document.createElement('div');
        const uniqueCards = [...new Set(player.cards)];
        uniqueCards.forEach(card => {
            const cardButton = document.createElement('button');
            cardButton.textContent = card;
            cardButton.style.margin = '5px';
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
        document.getElementById(`player-${winner.name}`).style.backgroundColor = 'lightgreen';
        // updateUI();
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
