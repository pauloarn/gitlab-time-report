// Service Worker for GitLab Time Report PWA
const CACHE_NAME = 'gitlab-time-report-v2';
const STATIC_CACHE = 'gitlab-time-report-static-v2';
const DYNAMIC_CACHE = 'gitlab-time-report-dynamic-v2';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Check if request URL is cacheable
function isCacheableRequest(url) {
  // Only cache HTTP/HTTPS requests
  const scheme = url.protocol;
  if (scheme !== 'http:' && scheme !== 'https:') {
    return false;
  }
  
  // Skip chrome-extension, moz-extension, edge, etc.
  const href = url.href.toLowerCase();
  if (href.startsWith('chrome-extension://') || 
      href.startsWith('moz-extension://') ||
      href.startsWith('edge://') ||
      href.startsWith('safari-extension://') ||
      href.startsWith('opera-extension://')) {
    return false;
  }
  
  // Only cache same-origin or CORS-enabled requests
  // Skip data: URLs, blob: URLs, etc.
  if (scheme === 'data:' || scheme === 'blob:' || scheme === 'file:') {
    return false;
  }
  
  return true;
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-cacheable requests (extensions, etc.)
  if (!isCacheableRequest(url)) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses (only if cacheable)
        if (response.status === 200 && isCacheableRequest(url)) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone).catch(() => {
                // Silently fail if cache.put fails (e.g., for unsupported schemes)
              });
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    const response = await fetch(request);
    
    // Cache successful API responses for 5 minutes (only if cacheable)
    if (response.status === 200 && isCacheableRequest(url)) {
      const responseClone = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone).catch(() => {
        // Silently fail if cache.put fails
      });
    }
    
    return response;
  } catch (error) {
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const url = new URL(request.url);
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200 && isCacheableRequest(url)) {
      const responseClone = response.clone();
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, responseClone).catch(() => {
        // Silently fail if cache.put fails
      });
    }
    return response;
  } catch (error) {
    return new Response('Asset not found', { status: 404 });
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  const url = new URL(request.url);
  
  try {
    const response = await fetch(request);
    
    // Cache successful navigation responses (only if cacheable)
    if (response.status === 200 && isCacheableRequest(url)) {
      const responseClone = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone).catch(() => {
        // Silently fail if cache.put fails
      });
    }
    
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - GitLab Time Report</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
            }
            .container { 
              max-width: 500px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            h1 { color: #fc6d26; }
            .icon { font-size: 64px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Sync any pending data when connection is restored
    // Example: Sync cached API requests
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          // Silently fail if sync fails
        }
      }
    }
  } catch (error) {
    // Silently fail if background sync fails
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
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
        title: 'View',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('GitLab Time Report', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 