import { initializePelusas, attachPelusasEvents } from './pelusas.js';
import { initializeTicTac, attachTicTacEvents } from './ticktac.js';
import { initializeSNL, setupSNLGame, attachSNLGameEvents } from './snl.js';

const contentContainer = document.getElementById('content-container');

// Function to handle dynamic page loading
async function loadPage(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('main').innerHTML;
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
    } catch (error) {
        console.error('Error loading page:', error);
        contentContainer.innerHTML = '<h1 class="text-3xl font-bold text-red-500">Error loading page.</h1><p class="text-red-300 mt-2">Please ensure the file exists and try again.</p>';
        window.history.pushState({}, '', '#error');
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
}

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