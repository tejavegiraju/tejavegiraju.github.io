let currentPlayer = 'X';
let board = Array(9).fill(null);

// Custom dialog function for Tic-Tac-Toe
function showAlert(message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="text-4xl mb-4">${getGameIcon(message)}</div>
                    <h3 class="text-xl font-bold text-white mb-4">Game Over!</h3>
                    <p class="text-gray-300 mb-6">${message}</p>
                    <div class="space-y-3">
                        <button id="play-again-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            🎮 Play Again
                        </button>
                        <button id="close-dialog-btn" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const playAgainBtn = dialog.querySelector('#play-again-btn');
        const closeBtn = dialog.querySelector('#close-dialog-btn');
        
        playAgainBtn.onclick = () => {
            document.body.removeChild(dialog);
            resetTicTac();
            resolve('play-again');
        };
        
        closeBtn.onclick = () => {
            document.body.removeChild(dialog);
            resolve('close');
        };
        
        // Keyboard support
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                playAgainBtn.click();
            } else if (e.key === 'Escape') {
                closeBtn.click();
            }
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve('close');
            }
        });
        
        // Focus on play again button
        playAgainBtn.focus();
    });
}

// Get appropriate icon for the game result
function getGameIcon(message) {
    if (message.includes('wins')) {
        return '🏆'; // Trophy for winner
    } else if (message.includes('draw')) {
        return '🤝'; // Handshake for draw
    }
    return '🎮'; // Default game icon
}

export function attachTicTacEvents() {
    document.getElementById('reset-tic-tac').addEventListener('click', resetTicTac);
}

export function initializeTicTac() {
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
            const winnerMessage = `Player ${currentPlayer} wins! 🎉`;
            document.getElementById('game-status').textContent = winnerMessage;
            disableBoard();
            // Show winner dialog after a short delay for visual feedback
            setTimeout(() => {
                showAlert(winnerMessage);
            }, 100);
        } else if (board.every(cell => cell)) {
            const drawMessage = "It's a draw! Good game! 🤝";
            document.getElementById('game-status').textContent = drawMessage;
            // Show draw dialog after a short delay for visual feedback
            setTimeout(() => {
                showAlert(drawMessage);
            }, 100);
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

function resetTicTac() {
    currentPlayer = 'X';
    board = Array(9).fill(null);
    document.getElementById('game-status').textContent = `Player ${currentPlayer}'s turn`;
    initializeTicTac();
}
