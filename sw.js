const CACHE_NAME = 'game-hub-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/games.html',
  '/pelusas.html',
  '/tictac.html',
  '/snl.html',
  '/player.html',
  '/css/style.css',
  '/css/player.css',
  '/js/app.js',
  '/js/pelusas.js',
  '/js/ticktac.js',
  '/js/snl.js',
  '/js/player.js',
  '/js/redirect.js',
  '/manifest.json',
  // Add icon files when they are available
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/public/',
  '/public/aud',
'/public/aud/*.mp3'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache.map(url => {
          // Handle relative URLs properly
          return new Request(url, { cache: 'reload' });
        })).catch(error => {
          console.warn('Service Worker: Failed to cache some resources', error);
          // Cache individual files that exist
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(new Request(url, { cache: 'reload' }))
                .catch(err => console.warn(`Failed to cache ${url}:`, err))
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetch', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (CDN, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for when connectivity is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    // Handle background sync logic here
  }
});

// Push notification handling (for future use)
self.addEventListener('push', event => {
  console.log('Service Worker: Push Received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'game-hub-notification',
    renotify: true,
    actions: [
      {
        action: 'open',
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
    self.registration.showNotification('Game Hub', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
