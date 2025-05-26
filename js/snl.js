function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function generateRandomSnakesAndLadders() {
    const snakes = {};
    const ladders = {};

    while (Object.keys(snakes).length < 12) {
        const start = Math.floor(Math.random() * 90) + 11;
        const end = Math.floor(Math.random() * (start - 1)) + 1;
        if (
            start < 10 ||
            parseInt(start/10) == parseInt(end/10) ||
            end >= 100 ||
            start == 100 ||
            end <= 1 ||
            start <= end 
        ) {
            continue;
        }
        if (!snakes[start] && !snakes[end] && !ladders[start] && !ladders[end]) {
            snakes[start] = end;
            snakes[end] = -1;
        }
    }

    while (Object.keys(ladders).length < 12) {
        const start = Math.floor(Math.random() * 90) + 1;
        const end = Math.floor(Math.random() * (100 - start)) + start + 1;
        if (
            start > 90 ||
            parseInt(start/10) == parseInt(end/10) ||
            end >= 100 ||
            start <= 1 ||
            end < 1 ||
            start >= end
        ) {
            continue;
        }
    
        if (!ladders[start] && !ladders[end] && !snakes[start] && !snakes[end]) {
            ladders[start] = end;
            ladders[end] = -1;
        }
    }

    return { snakes, ladders };
}

const { snakes, ladders } = generateRandomSnakesAndLadders();

function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = ''; // Clear the board
    let isReverse = false;
    for (let row = 10; row > 0; row--) {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.flexDirection = isReverse ? 'row-reverse' : 'row';
        for (let col = 10; col >= 1; col--) {
            const cellNumber = (row - 1) * 10 + col;
            const cell = document.createElement('div');
            cell.textContent = cellNumber;
            cell.style.border = '1px solid black';
            cell.style.height = '25px';
            cell.style.width = '25px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.position = 'relative';
            cell.id = `cell-${cellNumber}`;
            rowDiv.appendChild(cell);
        }
        isReverse = !isReverse;
        board.appendChild(rowDiv);
    }

    addSnakesAndLadders();
}

function addSnakesAndLadders() {
    for (const [start, end] of Object.entries(snakes)) {
        if (start == -1 || end == -1) {
            continue;
        }
        const startCell = document.getElementById(`cell-${start}`);
        startCell.style.backgroundColor = 'red';
        startCell.title = `Snake to ${end}`;
        const endCell = document.getElementById(`cell-${end}`);
        endCell.style.backgroundColor = 'orange';
        endCell.title = `Snake from ${start}`;
    }

    for (const [start, end] of Object.entries(ladders)) {
        if (start == -1 || end == -1) {
            continue;
        }
        const startCell = document.getElementById(`cell-${start}`);
        startCell.style.backgroundColor = 'turquoise';
        startCell.title = `Ladder to ${end}`;
        const endCell = document.getElementById(`cell-${end}`);
        endCell.style.backgroundColor = 'green';
        endCell.title = `Ladder from ${start}`;
    }
}

function highlightCurrentPlayer(playerPosition) {
    document.querySelectorAll('.highlight').forEach(cell => cell.classList.remove('highlight'));
    const currentCell = document.getElementById(`cell-${playerPosition}`);
    if (currentCell) {
        currentCell.classList.add('highlight');
        currentCell.style.border = '3px solid yellow';
    }
}

function setupGame() {
    const players = [
        { id: 1, position: 1, color: 'blue' },
        { id: 2, position: 1, color: 'red' }
    ];
    let currentPlayerIndex = 0;

    players.forEach(player => {
        const playerMarker = document.createElement('div');
        playerMarker.textContent = `P${player.id}`;
        playerMarker.style.position = 'absolute';
        playerMarker.style.width = '100%';
        playerMarker.style.height = '100%';
        playerMarker.style.display = 'flex';
        playerMarker.style.alignItems = 'center';
        // playerMarker.style.justifyContent = 'center';
        playerMarker.style.color = player.color;
        player.marker = playerMarker;
        document.getElementById(`cell-${player.position}`).appendChild(playerMarker);
    });
    document.getElementById('current-player').textContent = `Current Player: P${players[currentPlayerIndex].id}`;

    document.querySelector('button').addEventListener('click', () => {
        const dice = rollDice();
        document.getElementById('dice-result').textContent = `Dice: ${dice}`;
        const currentPlayer = players[currentPlayerIndex];
        let newPosition = currentPlayer.position + dice;

        if (newPosition <= 100) {
            if (snakes[newPosition] && snakes[newPosition] != -1) {
                newPosition = snakes[newPosition];
            } else if (ladders[newPosition] && ladders[newPosition] != -1) {
                newPosition = ladders[newPosition];
            }
            // document.querySelectorAll('.highlight').forEach(cell => cell.classList.remove('highlight'));
            document.getElementById(`cell-${currentPlayer.position}`).removeChild(currentPlayer.marker);
            currentPlayer.position = newPosition;
            document.getElementById(`cell-${currentPlayer.position}`).appendChild(currentPlayer.marker);
            if (newPosition == 100) {
                document.getElementById('dice-result').textContent = 'You win!';
                document.querySelector('button').disabled = true;
            } 
        } else if (newPosition > 100) {
            document.getElementById('dice-result').textContent = 'You rolled too high!';
        }
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        document.getElementById('current-player').textContent = `Current Player: P${players[currentPlayerIndex].id}`;
    });
}