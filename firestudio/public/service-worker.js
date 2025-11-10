// AgriAssist Service Worker - Offline First Architecture
const CACHE_NAME = 'agri-assist-v1.2.0';
const OFFLINE_URL = '/offline';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/offline',
  '/dashboard',
  '/crop-recommendation',
  '/disease-diagnosis', 
  '/weather',
  '/chat',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  '/api/weather',
  '/api/crops',
  '/api/market-prices'
];

// Static assets that can be cached
const STATIC_CACHE_PATTERNS = [
  /\/_next\/static\/.*/,
  /\/icons\/.*/,
  /\/images\/.*/,
  /\.(?:js|css|html|png|jpg|jpeg|svg|ico|webp|woff|woff2)$/
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      try {
        // Cache critical resources
        await cache.addAll(CRITICAL_RESOURCES);
        console.log('[SW] Critical resources cached');
        
        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache critical resources:', error);
      }
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      // Take control of all pages immediately
      await self.clients.claim();
      
      // Delete old caches
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(name => name !== CACHE_NAME)
        .map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        });
      
      await Promise.all(deletePromises);
      console.log('[SW] Service worker activated');
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle API requests with Network First strategy
  if (isApiRequest(url)) {
    return handleApiRequest(request);
  }
  
  // Handle static assets with Cache First strategy
  if (isStaticAsset(url)) {
    return handleStaticAsset(request);
  }
  
  // Handle navigation requests with Network First + Offline fallback
  if (request.mode === 'navigate') {
    return handleNavigationRequest(request);
  }
  
  // Default: try network first, then cache
  return handleDefaultRequest(request);
}

// Network First strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    // Try cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-By', 'service-worker-cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
    
    // Return offline API response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline. Please check your internet connection.',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'service-worker-offline'
        }
      }
    );
  }
}

// Cache First strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Navigation requests with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache for:', request.url);
    
    // Try cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match(OFFLINE_URL);
    return offlineResponse || new Response('Offline - Please check your internet connection');
  }
}

// Default strategy: Network First with Cache Fallback
async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Resource not available offline');
  }
}