import { initializePelusas, attachPelusasEvents } from './pelusas.js';
import { initializeTicTac, attachTicTacEvents } from './ticktac.js';
import { initializeSNL, setupSNLGame, attachSNLGameEvents } from './snl.js';
import { initializePlayer } from './player.js';

const contentContainer = document.getElementById('content-container');

// PWA Install functionality
let deferredPrompt;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
                
                // Check for updates on page load
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showUpdateAvailable();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
            
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log('Service Worker updated:', event.data.message);
                // Optionally show a subtle notification
            }
        });
    });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Show the install button
    showInstallButton();
});

// Handle app installed
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
    hideInstallButton();
});

function showInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.innerHTML = '📱 Install App';
    installButton.className = 'fixed top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-50';
    installButton.addEventListener('click', installApp);
    document.body.appendChild(installButton);
}

function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.remove();
    }
}

async function installApp() {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Clear the deferredPrompt
        deferredPrompt = null;
        hideInstallButton();
    }
}

function showUpdateAvailable() {
    const updateNotification = document.createElement('div');
    updateNotification.innerHTML = `
        <div class="fixed top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <p>New version available!</p>
            <div class="flex gap-2 mt-2">
                <button id="update-button" class="bg-green-800 hover:bg-green-900 px-2 py-1 rounded text-sm">Update</button>
                <button id="refresh-content-button" class="bg-blue-800 hover:bg-blue-900 px-2 py-1 rounded text-sm">Refresh Content</button>
            </div>
        </div>
    `;
    document.body.appendChild(updateNotification);
    
    document.getElementById('update-button').addEventListener('click', () => {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration && registration.waiting) {
                registration.waiting.postMessage({type: 'SKIP_WAITING'});
                window.location.reload();
            }
        });
    });
    
    document.getElementById('refresh-content-button').addEventListener('click', () => {
        // Force refresh all content by bypassing cache
        window.location.reload(true);
    });
}

// Add a manual refresh button for getting latest content
function addRefreshButton() {
    const refreshButton = document.createElement('button');
    refreshButton.id = 'manual-refresh';
    refreshButton.innerHTML = '🔄 Refresh';
    refreshButton.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm shadow-lg z-40';
    refreshButton.title = 'Get latest content from server';
    refreshButton.addEventListener('click', () => {
        // Clear cache and reload to get fresh content
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                window.location.reload();
            });
        } else {
            window.location.reload(true);
        }
    });
    document.body.appendChild(refreshButton);
    
    // Hide after 10 seconds
    setTimeout(() => {
        if (refreshButton.parentNode) {
            refreshButton.remove();
        }
    }, 10000);
}

// Show refresh button on page load
window.addEventListener('load', () => {
    setTimeout(addRefreshButton, 2000); // Show after 2 seconds
});

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
        const redirectedFrom = window.sessionStorage.getItem('redirectedFrom');
        window.sessionStorage.removeItem('redirectedFrom'); // Clear the session storage
        if (redirectedFrom && redirectedFrom !== currentPath && redirectedFrom !== 'index.html') {
            loadPage(redirectedFrom); // Load the redirected page
            window.history.replaceState({}, '', '/');
        }
    } else {
        loadPage(currentPath);
    }
});