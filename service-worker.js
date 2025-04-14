/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'seed-it-cache-v1.9.4';
const APP_VERSION = '1.9.4';
const PDF_CACHE_PREFIX = 'seed-pdf-cache-';
const TIMESTAMP_CACHE_NAME = 'seed-timestamp-cache';
const PDF_CACHE_EXPIRATION = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds

const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.bundle.js',
  '/static/css/main.bundle.css',
  '/favicon.ico',
  '/SEED_Logo.png',
  '/tone.mp3'
];

// Helper function to get user-specific PDF cache name
const getUserPDFCacheName = async () => {
  try {
    // Instead of trying to get user email, just use a default cache
    return PDF_CACHE_PREFIX + 'default';
  } catch (error) {
    console.error('Error getting user cache name:', error);
    return PDF_CACHE_PREFIX + 'default';
  }
};

// Helper function to store cache timestamp
const storeCacheTimestamp = async (url, userEmail) => {
  try {
    const cache = await caches.open(TIMESTAMP_CACHE_NAME);
    const key = `${userEmail || 'default'}-${url}`;
    await cache.put(new Request(key), new Response(Date.now().toString()));
  } catch (error) {
    console.error('Error storing cache timestamp:', error);
  }
};

// Helper function to get cache timestamp
const getCacheTimestamp = async (url, userEmail) => {
  try {
    const cache = await caches.open(TIMESTAMP_CACHE_NAME);
    const key = `${userEmail || 'default'}-${url}`;
    const response = await cache.match(new Request(key));
    if (!response) return null;
    const timestamp = await response.text();
    return parseInt(timestamp, 10);
  } catch (error) {
    console.error('Error getting cache timestamp:', error);
    return null;
  }
};

// Helper function to check cache expiration
const isExpired = async (url, userEmail) => {
  try {
    const timestamp = await getCacheTimestamp(url, userEmail);
    if (!timestamp) return false;
    return Date.now() - timestamp > PDF_CACHE_EXPIRATION;
  } catch (error) {
    console.error('Error checking cache expiration:', error);
    return false;
  }
};

// Helper function to clean expired PDFs for a specific user
const cleanExpiredPDFs = async (userEmail) => {
  try {
    const cacheName = userEmail ? 
      `${PDF_CACHE_PREFIX}${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 
      PDF_CACHE_PREFIX + 'default';
    
    const cache = await caches.open(cacheName);
    const timestampCache = await caches.open(TIMESTAMP_CACHE_NAME);
    const requests = await cache.keys();
    
    const now = Date.now();
    for (const request of requests) {
      const timestamp = await getCacheTimestamp(request.url, userEmail);
      if (timestamp && (now - timestamp > PDF_CACHE_EXPIRATION)) {
        await cache.delete(request);
        await timestampCache.delete(new Request(`${userEmail || 'default'}-${request.url}`));
      }
    }
  } catch (error) {
    console.error('Error cleaning expired PDFs:', error);
  }
};

// Clean all user PDF caches
const cleanAllExpiredPDFs = async () => {
  const cacheNames = await caches.keys();
  const pdfCaches = cacheNames.filter(name => name.startsWith(PDF_CACHE_PREFIX));
  
  await Promise.all(pdfCaches.map(async (cacheName) => {
    const userEmail = cacheName.replace(PDF_CACHE_PREFIX, '');
    await cleanExpiredPDFs(userEmail);
  }));
};

// Handle PDF requests with user-specific caching
const handlePDFRequest = async (event) => {
  const userPDFCache = await getUserPDFCacheName();
  const cache = await caches.open(userPDFCache);
  const userEmail = userPDFCache.replace(PDF_CACHE_PREFIX, '');

  // Check if cached version exists and is not expired
  const cachedResponse = await cache.match(event.request);
  const isExpiredPDF = await isExpired(event.request.url, userEmail);
  
  if (cachedResponse && !isExpiredPDF) {
    return cachedResponse;
  }

  // Fetch new version and cache it
  try {
    const networkResponse = await fetch(event.request);
    const responseToCache = networkResponse.clone();
    await cache.put(event.request, responseToCache);
    await storeCacheTimestamp(event.request.url, userEmail);
    return networkResponse;
  } catch (error) {
    // Return expired cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Force update check
const checkForUpdates = async () => {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'CHECK_VERSION', version: APP_VERSION });
    });
  } catch (error) {
    console.error('Update check failed:', error);
  }
};

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.waitUntil(checkForUpdates());
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Add handler for setting user email if needed in future
  if (event.data && event.data.type === 'SET_USER_EMAIL') {
    // Store user email in IndexedDB or other storage if needed
    console.log('Received user email:', event.data.email);
  }
});

// Install a service worker
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      // Cache app shell and version
      caches.open(CACHE_NAME).then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      }),
      // Create PDF cache if it doesn't exist
      caches.open(PDF_CACHE_PREFIX + 'default'),
      // Clean expired PDFs
      cleanAllExpiredPDFs()
    ])
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Handle security check redirects
  if (event.request.url.includes('?i=1')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If fetch fails, try to get from cache
        return caches.match(event.request.url.split('?')[0]);
      })
    );
    return;
  }

  // Handle version check requests
  if (event.request.url.endsWith('/version')) {
    event.respondWith(
      caches.match('version').then(response => {
        return response || new Response(APP_VERSION);
      })
    );
    return;
  }

  // Handle PDF requests
  if (event.request.url.endsWith('.pdf')) {
    event.respondWith(handlePDFRequest(event));
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found
        if (response) {
          return response;
        }
        // Otherwise fetch from network
        return fetch(event.request).catch(error => {
          console.error('Fetch error:', error);
          // Return a custom offline page or fallback content
          return new Response('Offline content', {
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Add this function for manual cleanup
async function cleanupExpiredPDFs() {
  const cacheNames = await caches.keys();
  const pdfCaches = cacheNames.filter(name => name.startsWith(PDF_CACHE_PREFIX));
  
  for (const cacheName of pdfCaches) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const now = Date.now();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cacheTime = response.headers.get('cache-time');
      
      if (cacheTime && (now - parseInt(cacheTime, 10) > PDF_CACHE_EXPIRATION)) {
        await cache.delete(request);
      }
    }
  }
}

// Modify the activate event to include cleanup and version check
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.startsWith(PDF_CACHE_PREFIX) && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      }),
      // Run manual cleanup for expired PDFs
      cleanupExpiredPDFs(),
      // Claim clients immediately
      self.clients.claim()
    ])
  );
});

// Add periodic version check
self.addEventListener('periodicsync', event => {
  if (event.tag === 'version-check') {
    event.waitUntil(checkForUpdates());
  }
  if (event.tag === 'cleanup-expired-pdfs') {
    event.waitUntil(cleanupExpiredPDFs());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const notificationData = event.data ? event.data.json() : {
    title: 'SEED-IT Learning Reminder',
    message: 'Time to continue learning! 📚',
    timestamp: new Date().getTime()
  };

  const options = {
    body: notificationData.message,
    icon: '/SEED_Logo.png',
    badge: '/favicon.ico',
    tag: `daily-reminder-${new Date().getHours()}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    timestamp: notificationData.timestamp,
    sound: '/tone.mp3',
    silent: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    data: {
      url: '/',
      soundUrl: '/tone.mp3'
    }
  };

  // Play sound when showing notification
  const playNotificationSound = async () => {
    try {
      const audio = new Audio('/tone.mp3');
      await audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title || 'SEED-IT Learning Reminder', options),
      playNotificationSound()
    ])
  );
});

// Handle notification clicks with improved navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open or focus the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        return clients.openWindow(event.notification.data.url || '/');
      })
    );
  }
}); 