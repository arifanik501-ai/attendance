// ═══════════════════════════════════════════════════
// MEP FAN LTD. — Service Worker
// Daily 8:00 AM & 1:00 PM Attendance Notifications
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'mep-fan-v43';
const NOTIFICATION_HOUR_AM = 8; // 8:00 AM
const NOTIFICATION_HOUR_PM = 13; // 1:00 PM
const NOTIFICATION_MINUTE = 0;

const ASSET_VERSION = 'v=38';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './entry.html',
  `./app.js?${ASSET_VERSION}`,
  `./style.css?${ASSET_VERSION}`,
  `./tooltip.js?${ASSET_VERSION}`,
  './firebase-init.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
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

// Fetch handler — network first, fallback to cache (required for PWA installability)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Firebase/external URLs
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Cache successful responses
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Offline fallback
      return caches.match(event.request);
    })
  );
});

// Listen for messages from the main page
self.addEventListener('message', (event) => {
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
  
  // Determine if we are in one of the notification windows (0 to 5 minutes past the hour)
  const isAMWindow = (hour === NOTIFICATION_HOUR_AM && minute >= NOTIFICATION_MINUTE && minute <= NOTIFICATION_MINUTE + 5);
  const isPMWindow = (hour === NOTIFICATION_HOUR_PM && minute >= NOTIFICATION_MINUTE && minute <= NOTIFICATION_MINUTE + 5);

  if (isAMWindow || isPMWindow) {
    const timeBlock = isAMWindow ? 'AM' : 'PM';
    const todayKey = `notified_${timeBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

    // Use cache API to track daily notification per time block
    const cache = await caches.open('mep-notification-tracker');
    const response = await cache.match(todayKey);
    
    if (!response) {
      // Not yet notified for this time block today — show notification
      const timeStr = isAMWindow ? '8:00 AM' : '1:00 PM';
      await self.registration.showNotification('🏭 MEP FAN LTD.', {
        body: `It's ${timeStr}! Time to update your Attendance Sheet now. Please do it quickly! ⏰`,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: `mep-attendance-${timeBlock}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'open', title: '📋 Open Dashboard' },
          { action: 'dismiss', title: '❌ Dismiss' }
        ]
      });

      // Mark this time block as notified
      await cache.put(todayKey, new Response('notified'));

      // Clean up old keys (keep only last few days)
      const keys = await cache.keys();
      for (const key of keys) {
        if (key.url && !key.url.includes(todayKey)) {
          // Avoid deleting the other timeblock's key for the same day
          const otherTimeBlock = isAMWindow ? 'PM' : 'AM';
          const otherTodayKey = `notified_${otherTimeBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
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
