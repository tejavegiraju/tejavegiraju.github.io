import { initializePelusas, attachPelusasEvents } from './pelusas.js';
import { initializeTicTac, attachTicTacEvents } from './ticktac.js';
import { initializeSNL, setupSNLGame, attachSNLGameEvents } from './snl.js';
import { initializePlayer } from './player.js';

const contentContainer = document.getElementById('content-container');

// PWA Variables
let deferredPrompt;
let isAppInstalled = false;

// Check if app is already installed
function checkIfAppInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        isAppInstalled = true;
        console.log('App is running in standalone mode');
    }
}

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered successfully:', registration);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, prompt user to refresh
                            showUpdateAvailable();
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Show update notification
function showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed top-0 left-0 right-0 bg-purple-600 text-white p-2 text-center z-50';
    updateBanner.innerHTML = `
        <span>New version available!</span>
        <button onclick="window.location.reload()" class="ml-4 bg-white text-purple-600 px-3 py-1 rounded text-sm font-semibold">
            Update
        </button>
        <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
            ✕
        </button>
    `;
    document.body.appendChild(updateBanner);
}

// Handle PWA install prompt
function setupPWAInstall() {
    const installButton = document.getElementById('install-button');
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt fired');
        e.preventDefault();
        deferredPrompt = e;
        
        if (!isAppInstalled && installButton) {
            installButton.classList.remove('hidden');
            console.log('Install button shown');
        }
    });
    
    // Handle install button click
    if (installButton) {
        installButton.addEventListener('click', async () => {
            console.log('Install button clicked');
            
            if (deferredPrompt) {
                try {
                    // Show the install prompt
                    installButton.disabled = true;
                    installButton.textContent = 'Installing...';
                    
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    
                    if (outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                        installButton.classList.add('hidden');
                        showInstallSuccess();
                    } else {
                        console.log('User dismissed the install prompt');
                        // Reset button state
                        installButton.disabled = false;
                        installButton.textContent = '📱 Install App';
                    }
                    deferredPrompt = null;
                } catch (error) {
                    console.error('Error during installation:', error);
                    installButton.disabled = false;
                    installButton.textContent = '📱 Install App';
                }
            } else {
                console.log('No install prompt available - providing fallback instructions');
                showInstallInstructions();
            }
        });
    }
    
    // Listen for app installed event
    window.addEventListener('appinstalled', (e) => {
        console.log('App was installed successfully');
        isAppInstalled = true;
        if (installButton) {
            installButton.classList.add('hidden');
        }
        showInstallSuccess();
    });
}

// Show installation success message
function showInstallSuccess() {
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed bottom-4 left-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    successMsg.innerHTML = `
        <div class="flex items-center">
            <span class="text-2xl mr-2">🎉</span>
            <div>
                <div class="font-semibold">App installed successfully!</div>
                <div class="text-sm opacity-90">You can now use Game Hub like a native app.</div>
            </div>
        </div>
    `;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 5000);
}

// Show install instructions for browsers that don't support auto-prompt
function showInstallInstructions() {
    const instructionsModal = document.createElement('div');
    instructionsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    instructionsModal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 class="text-xl font-bold text-purple-400 mb-4">📱 Install Game Hub</h3>
            <div class="text-gray-300 space-y-3">
                <p><strong>Chrome/Edge:</strong></p>
                <ul class="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Click the install icon in the address bar</li>
                    <li>Or go to Menu → "Install Game Hub"</li>
                </ul>
                
                <p><strong>Firefox:</strong></p>
                <ul class="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Menu → "Install this site as an app"</li>
                </ul>
                
                <p><strong>Safari (iOS):</strong></p>
                <ul class="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Share button → "Add to Home Screen"</li>
                </ul>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full">
                Got it!
            </button>
        </div>
    `;
    document.body.appendChild(instructionsModal);
    
    // Close on background click
    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
            instructionsModal.remove();
        }
    });
}

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
    // Initialize PWA features
    initializePWA();
});

// Initialize PWA features
function initializePWA() {
    checkIfAppInstalled();
    registerServiceWorker();
    setupPWAInstall();
    
    // Debug PWA readiness
    setTimeout(() => {
        debugPWAReadiness();
    }, 2000);
}

// Debug function to check PWA readiness
function debugPWAReadiness() {
    console.log('🔍 PWA Debug Information:');
    console.log('- Service Worker supported:', 'serviceWorker' in navigator);
    console.log('- HTTPS or localhost:', location.protocol === 'https:' || location.hostname === 'localhost');
    console.log('- Manifest linked:', document.querySelector('link[rel="manifest"]') !== null);
    console.log('- Install prompt available:', deferredPrompt !== null);
    console.log('- Already installed:', isAppInstalled);
    
    // Check if running from file:// protocol
    if (location.protocol === 'file:') {
        console.warn('⚠️ PWA installation requires HTTPS or localhost. Use a local server.');
        showPWARequirementsMessage();
    }
}

// Show PWA requirements message
function showPWARequirementsMessage() {
    const requirementsMsg = document.createElement('div');
    requirementsMsg.className = 'fixed top-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg z-50';
    requirementsMsg.innerHTML = `
        <div class="flex items-start">
            <span class="text-xl mr-2">⚠️</span>
            <div>
                <div class="font-semibold">PWA Installation Unavailable</div>
                <div class="text-sm mt-1">To install this app, serve it from a web server (HTTPS) or localhost.</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="mt-2 bg-white text-yellow-600 px-3 py-1 rounded text-sm font-semibold">
                    Dismiss
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(requirementsMsg);
    
    setTimeout(() => {
        if (requirementsMsg.parentElement) {
            requirementsMsg.remove();
        }
    }, 10000);
}