import { initializePelusas, attachPelusasEvents } from './pelusas.js';
import { initializeTicTac, attachTicTacEvents } from './ticktac.js';
import { initializeSNL, setupSNLGame, attachSNLGameEvents } from './snl.js';
import { initializePlayer } from './player.js';

const contentContainer = document.getElementById('content-container');

async function getPageContent(url, main = 'main') {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector(main).innerHTML;
        return content;
    } catch (error) {
        console.error('Error loading page:', error);
        return '';
    }
}

// Function to load the player content
async function loadPlayer() {
    if (playerLoaded) {
        return; // Player is already loaded
    }
    playerLoaded = true; // Set the flag to true to prevent reloading
    const playerContent = await getPageContent('player.html');
    if (!playerContent) {
        console.error('Failed to load player content');
        return;
    }
    document.getElementById('player-main').innerHTML = playerContent;
    // Initialize the music player
    initializePlayer();
}

// Function to handle dynamic page loading
async function loadPage(url) {
    const content = await getPageContent(url);
    if (!content) {
        contentContainer.innerHTML = '<h1 class="text-3xl font-bold text-red-500">Page Not Found</h1><p class="text-red-300 mt-2">The requested page does not exist.</p>';
        window.history.pushState({}, '', '#error');
        return;
    }
    contentContainer.innerHTML = content;
    
    // Update the URL in the browser's address bar
    window.history.pushState({}, '', url);     
    handleNavLinks();
    // Check the URL and initialize the correct game
    if (url === 'pelusas.html') {
        initializePelusas();
        attachPelusasEvents();
    } else if (url === 'tictac.html') {
        initializeTicTac();
        attachTicTacEvents();
    } else if (url === 'snl.html') {
        initializeSNL();
        setupSNLGame();
        attachSNLGameEvents();
    }
}

// Event listener for browser history (back/forward buttons)
window.addEventListener('popstate', () => {
    loadPage(location.pathname);
});

function attachNavLinkClick(event) {
    event.preventDefault(); // Prevent the default link behavior
    const url = event.target.getAttribute('href');
    loadPage(url);
}

function handleNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = location.pathname.split('/').pop() || 'index.html';
    // Remove active class from all links
    navLinks.forEach(link => {
        link.classList.remove('text-purple-400');
    });

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('text-purple-400');
        }
        
        link.removeEventListener('click', attachNavLinkClick); // Remove any existing listeners
        link.addEventListener('click', attachNavLinkClick);
    });

    loadPlayer();
}

let playerLoaded = false; 

// Event listener to handle navigation links
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = location.pathname.split('/').pop();
    if (currentPath === 'index.html' || currentPath === '') {
        // No need to load content, it's already there. Just setup links.
        handleNavLinks();
    } else {
        loadPage(currentPath);
    }
});