// ═══════════════════════════════════════════════════
// MEP FAN LTD. — Service Worker
// Daily 8:00 AM & 1:00 PM Attendance Notifications
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'mep-dashboard-cache-v146';
const NOTIFICATION_HOUR_AM = 8; // 8:00 AM
const NOTIFICATION_HOUR_PM = 13; // 1:00 PM
const NOTIFICATION_MINUTE = 0;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './entry.html',
  './config.min.js',
  './app.min.js',
  './dashboard-render.min.js',
  './history.min.js',
  './style.min.css',
  './tooltip.js',
  './firebase-init.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './admin-icon.png',
  './feed-icon.png',
  './pending-icon.png',
  './theme-icon.png',
  './push-off-icon.png',
  './fab-main-icon.png',
  './sec-status-header-icon.png',
  './iom-header-icon.png'
];

// Check interval inside service worker (every 30 seconds when active)
let notificationCheckInterval = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean old caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== 'mep-notification-tracker').map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
  startNotificationCheck();
});

// Fetch handler — Stale-While-Revalidate for 0ms Instant Reloads
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Firebase/external analytics/fonts APIs
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com') || event.request.url.includes('gstatic.com')) return;

  const url = new URL(event.request.url);
  const isImage = /\.(png|jpg|jpeg|svg|webp|ico)($|\?)/i.test(url.pathname);

  // Instant response with background update
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    
    // Asynchronous background revalidation
    const fetchPromise = fetch(event.request).then(async (response) => {
      if (response && response.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    }).catch(() => cached);

    // If already in cache, return immediately with 0ms latency
    if (cached) {
      return cached;
    }

    // Otherwise return network response
    return await fetchPromise;
  })());
});

// Listen for messages from the main page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'ENABLE_NOTIFICATIONS') {
    startNotificationCheck();
  }
  if (event.data && event.data.type === 'CHECK_NOTIFICATION_NOW') {
    checkAndNotify();
  }
  if (event.data && event.data.type === 'KEEPALIVE') {
    // Just keep the SW alive
  }
});

function startNotificationCheck() {
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  // Check every 30 seconds
  notificationCheckInterval = setInterval(() => {
    checkAndNotify();
  }, 30000);
  // Also check immediately
  checkAndNotify();
}

async function checkAndNotify() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Active window: 0 to 10 minutes past 8:00 AM & 1:00 PM
  const isAMWindow = (hour === NOTIFICATION_HOUR_AM && minute >= 0 && minute <= 10);
  const isPMWindow = (hour === NOTIFICATION_HOUR_PM && minute >= 0 && minute <= 10);

  if (isAMWindow || isPMWindow) {
    const timeBlock = isAMWindow ? 'AM' : 'PM';
    const timeStr = isAMWindow ? '8:00 AM' : '1:00 PM';
    const todayKey = `notified_strictly_once_${timeBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

    // Track daily notification per time block (strictly ONCE)
    const cache = await caches.open('mep-notification-tracker');
    const response = await cache.match(todayKey);
    
    if (!response) {
      // Exactly ONCE per time block (never repeats)
      await self.registration.showNotification('🏭 MEP FAN LTD.', {
        body: `It's ${timeStr}! Time to update your Attendance Sheet now. Please do it quickly! ⏰`,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: `mep-attendance-${timeBlock}`,
        renotify: false,
        requireInteraction: true,
        vibrate: [300, 100, 300],
        actions: [
          { action: 'open', title: '📋 Open Dashboard' },
          { action: 'dismiss', title: '❌ Dismiss' }
        ]
      });

      // Mark this time block as notified strictly once
      await cache.put(todayKey, new Response('notified_once'));

      // Clean up old keys (keep only current day's active blocks)
      const keys = await cache.keys();
      for (const key of keys) {
        if (key.url && !key.url.includes(todayKey)) {
          const otherTimeBlock = isAMWindow ? 'PM' : 'AM';
          const otherTodayKey = `notified_strictly_once_${otherTimeBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
          if (!key.url.includes(otherTodayKey)) {
            await cache.delete(key);
          }
        }
      }
    }
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus the dashboard
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});

// Periodic background sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'mep-daily-check') {
    event.waitUntil(checkAndNotify());
  }
});
