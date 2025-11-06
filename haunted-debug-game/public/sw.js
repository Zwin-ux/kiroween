/**
 * Service Worker for Asset Caching
 * 
 * Handles caching of game assets for offline support and performance optimization.
 */

const CACHE_NAME = 'haunted-debug-game-assets-v1';
const CRITICAL_ASSETS = [
  '/Compiler Room.png',
  '/asset icon.png',
  '/icon_ghost_surprised.png',
];

// Assets to cache on install
const PRECACHE_ASSETS = [
  ...CRITICAL_ASSETS,
  '/pumpkin.png',
  '/candypumpkin.png',
  '/terminal.png',
];

/**
 * Install event - precache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('✅ Assets precached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to precache assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache with network fallback
 */
self.addEventListener('fetch', (event) => {
  // Only handle asset requests (images)
  if (event.request.destination === 'image' || isAssetRequest(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache
            return cachedResponse;
          }
          
          // Fetch from network and cache
          return fetch(event.request)
            .then((networkResponse) => {
              // Don't cache non-successful responses
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // Clone the response for caching
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.warn('Failed to cache asset:', error);
                });
              
              return networkResponse;
            })
            .catch((error) => {
              console.warn('Network request failed:', error);
              
              // Try to serve a fallback for images
              if (event.request.destination === 'image') {
                return generateFallbackImage(event.request.url);
              }
              
              throw error;
            });
        })
    );
  }
});

/**
 * Message event - handle cache management commands
 */
self.addEventListener('message', (event) => {
  const { type, url, urls, priority } = event.data;
  
  switch (type) {
    case 'CACHE_ASSET':
      cacheAsset(url, priority)
        .then(() => {
          event.ports[0]?.postMessage({ success: true, url });
        })
        .catch((error) => {
          event.ports[0]?.postMessage({ success: false, url, error: error.message });
        });
      break;
      
    case 'EVICT_ASSETS':
      evictAssets(urls)
        .then(() => {
          event.ports[0]?.postMessage({ success: true, evicted: urls.length });
        })
        .catch((error) => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'CLEAR_CACHE':
      clearCache()
        .then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo()
        .then((info) => {
          event.ports[0]?.postMessage({ success: true, info });
        })
        .catch((error) => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      break;
  }
});

/**
 * Check if request is for a game asset
 */
function isAssetRequest(url) {
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
  return assetExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Cache a specific asset
 */
async function cacheAsset(url, priority = 'normal') {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    
    if (response.ok) {
      await cache.put(url, response);
      console.log(`📦 Cached asset (${priority}):`, url);
      
      // Notify main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            url,
            priority
          });
        });
      });
    }
  } catch (error) {
    console.error('Failed to cache asset:', url, error);
    throw error;
  }
}

/**
 * Evict multiple assets from cache
 */
async function evictAssets(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const deletePromises = urls.map(url => cache.delete(url));
    await Promise.all(deletePromises);
    console.log(`🗑️ Evicted ${urls.length} assets from cache`);
  } catch (error) {
    console.error('Failed to evict assets:', error);
    throw error;
  }
}

/**
 * Clear entire cache
 */
async function clearCache() {
  try {
    await caches.delete(CACHE_NAME);
    await caches.open(CACHE_NAME); // Recreate empty cache
    console.log('🗑️ Cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Get cache information
 */
async function getCacheInfo() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const info = {
      name: CACHE_NAME,
      entryCount: keys.length,
      entries: keys.map(request => ({
        url: request.url,
        method: request.method,
      })),
    };
    
    return info;
  } catch (error) {
    console.error('Failed to get cache info:', error);
    throw error;
  }
}

/**
 * Generate fallback image for failed asset loads
 */
function generateFallbackImage(url) {
  // Determine fallback type based on URL
  let fallbackSvg;
  
  if (url.includes('room') || url.includes('Room')) {
    // Room fallback
    fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#111827"/>
      <text x="400" y="300" text-anchor="middle" fill="#6B7280" font-family="monospace" font-size="16">Room Loading...</text>
    </svg>`;
  } else if (url.includes('icon') || url.includes('Icon')) {
    // Icon fallback
    fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>`;
  } else {
    // Generic fallback
    fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#374151"/>
      <text x="50" y="50" text-anchor="middle" fill="#EF4444" font-family="monospace" font-size="12">❌</text>
    </svg>`;
  }
  
  const blob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
  return new Response(blob, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}