// PWA Test Script
// Add this to browser console to test PWA features

console.log('🔍 PWA Feature Test');

// Check if service worker is supported
if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker supported');
    
    navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
            console.log('✅ Service Worker registered:', registrations[0].scope);
        } else {
            console.log('❌ No service worker registered');
        }
    });
} else {
    console.log('❌ Service Worker not supported');
}

// Check if app is installable
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    installPrompt = e;
    console.log('✅ App is installable');
});

// Check if app is running as PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ Running as standalone PWA');
} else if (window.navigator.standalone === true) {
    console.log('✅ Running as standalone PWA (iOS)');
} else {
    console.log('ℹ️ Running in browser');
}

// Check manifest
fetch('/manifest.json')
    .then(response => response.json())
    .then(manifest => {
        console.log('✅ Manifest loaded:', manifest.name);
    })
    .catch(error => {
        console.log('❌ Manifest error:', error);
    });

// Check cache
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        if (cacheNames.length > 0) {
            console.log('✅ Cache available:', cacheNames);
        } else {
            console.log('ℹ️ No cache found');
        }
    });
} else {
    console.log('❌ Cache API not supported');
}

// Check offline status
console.log('🌐 Online status:', navigator.onLine ? 'Online' : 'Offline');

// Test install prompt (run manually)
window.testInstall = () => {
    if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.then(result => {
            console.log('Install prompt result:', result.outcome);
        });
    } else {
        console.log('No install prompt available');
    }
};

console.log('💡 Run testInstall() to test installation prompt');
console.log('📱 PWA Test Complete');
