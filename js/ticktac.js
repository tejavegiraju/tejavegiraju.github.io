let currentPlayer = 'X';
let board = Array(9).fill(null);

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    board.forEach((_, index) => {
        const cell = document.createElement('div');
        cell.style.border = '1px solid black';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '24px';
        cell.style.cursor = 'pointer';
        cell.id = `cell-${index}`;
        cell.addEventListener('click', () => makeMove(index));
        gameBoard.appendChild(cell);
    });
}

function makeMove(index) {
    if (!board[index]) {
        board[index] = currentPlayer;
        document.getElementById(`cell-${index}`).textContent = currentPlayer;
        if (checkWinner()) {
            document.getElementById('game-status').textContent = `Player ${currentPlayer} wins!`;
            disableBoard();
        } else if (board.every(cell => cell)) {
            document.getElementById('game-status').textContent = 'It\'s a draw!';
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('game-status').textContent = `Player ${currentPlayer}'s turn`;
        }
    }
}

function checkWinner() {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winningCombinations.some(combination => 
        combination.every(index => board[index] === currentPlayer)
    );
}

function disableBoard() {
    board.forEach((_, index) => {
        document.getElementById(`cell-${index}`).style.pointerEvents = 'none';
    });
}

function resetGame() {
    currentPlayer = 'X';
    board = Array(9).fill(null);
    document.getElementById('game-status').textContent = `Player ${currentPlayer}'s turn`;
    createBoard();
}

window.onload = () => {
    createBoard();
};