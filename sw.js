const CACHE_NAME = 'ollo-v1.3'; // Increment version to force cache update
const urlsToCache = [
  '/',
  '/index.html',
  '/games.html',
  '/player.html',
  '/pelusas.html',
  '/offline.html',
  '/snl.html',
  '/tictac.html',
  '/test-pwa.html',
  '/css/style.css',
  '/css/player.css',
  '/js/app.js',
  '/js/player.js',
  '/js/pelusas.js',
  '/js/snl.js',
  '/js/ticktac.js',
  '/js/redirect.js',
  '/icons/icon.svg',
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  '/public/aud/playlist.json'
];

// Install event - cache resources and skip waiting for immediate activation
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        
        // Ensure offline.html is cached first (critical for offline functionality)
        return cache.add('/offline.html')
          .then(() => {
            console.log('Offline page cached successfully');
            return cache.addAll(urlsToCache);
          })
          .catch(() => {
            console.warn('Failed to cache offline.html, but continuing...');
            return cache.addAll(urlsToCache);
          });
      })
      .then(() => {
        console.log('Caching complete (with possible warnings)');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache install failed:', error);
        // Continue with partial cache, ensuring offline.html is prioritized
        return caches.open(CACHE_NAME).then(cache => {
          // Try to cache offline.html first
          const offlinePromise = cache.add('/offline.html').catch(err => 
            console.warn('Failed to cache offline.html:', err)
          );
          
          // Then cache other resources
          const otherPromises = urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          );
          
          return Promise.allSettled([offlinePromise, ...otherPromises]);
        }).then(() => self.skipWaiting());
      })
  );
});

// Fetch event - network first with cache fallback for fresh content
self.addEventListener('fetch', event => {
  // Skip non-http requests and chrome-extension requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Different strategies for different types of requests
  const url = new URL(event.request.url);
  
  // Skip requests for non-same-origin unless it's our domain
  if (url.origin !== location.origin && !url.pathname.startsWith('/')) {
    return;
  }
  
  // For audio files, use cache first (they don't change often and are large)
  if (event.request.url.includes('/public/aud/') || 
      event.request.url.match(/\.(mp3|m4a|wav|ogg|a)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // For static assets (CSS, JS, images), use stale while revalidate
  if (event.request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // For HTML pages and API calls, use network first for fresh content
  event.respondWith(networkFirst(event.request));
});

// Network First Strategy - Always try network first, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // If we got a good response, cache it
    if (response && response.status === 200 && response.type === 'basic') {
      const responseToCache = response.clone();
      const cache = await caches.open(CACHE_NAME);
      // Don't wait for cache operation to complete
      cache.put(request, responseToCache).catch(err => 
        console.warn('Failed to cache response:', err.message)
      );
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache for:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If it's a navigation request and we have no cache, return offline page
    if (request.mode === 'navigate') {
      console.log('Serving offline page for navigation request');
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
      
      // Fallback offline response
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Offline - Ollo</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>You're Offline</h1>
          <p>Please check your internet connection.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </body>
        </html>
      `, { 
        status: 200, 
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // For non-navigation requests, throw the error
    console.warn('No cache available for:', request.url);
    throw error;
  }
}

// Cache First Strategy - Check cache first, fallback to network
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type === 'basic') {
      const responseToCache = response.clone();
      const cache = await caches.open(CACHE_NAME);
      // Don't wait for cache operation
      cache.put(request, responseToCache).catch(err => 
        console.warn('Failed to cache response:', err.message)
      );
    }
    
    return response;
  } catch (error) {
    console.warn('Cache first failed for:', request.url, error.message);
    throw error;
  }
}

// Stale While Revalidate - Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in the background to update cache
    const fetchPromise = fetch(request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone()).catch(err => 
          console.warn('Failed to update cache:', err.message)
        );
      }
      return response;
    }).catch(err => {
      console.warn('Background fetch failed:', err.message);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, wait for network
    return fetchPromise;
  } catch (error) {
    console.warn('Stale while revalidate failed for:', request.url, error.message);
    throw error;
  }
}

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and claimed clients');
      
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            message: 'Service Worker updated successfully'
          });
        });
      });
    })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
  return Promise.resolve();
}

// Push notifications (for future implementation)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Ollo', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
