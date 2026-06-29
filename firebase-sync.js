// Firebase Synchronization Listener
function setupFirebaseListener() {
  if (window.firebaseDb) {
    // Sync state
    window.firebaseDb.ref('mep_dashboard_state').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // --- MIGRATION BLOCK START ---
        if (localStorage.getItem('mep_mig_ot_3hr') !== 'true') {
           let modified = false;
           if (data.branchAttendance) {
             for (const pId in data.branchAttendance) {
               const pData = data.branchAttendance[pId];
               if (typeof pData === 'object' && !Array.isArray(pData)) {
                 for (const pKey in pData) {
                   const perData = pData[pKey];
                   if (typeof perData === 'object' && !Array.isArray(perData)) {
                     for (const gName in perData) {
                       const gData = perData[gName];
                       if (typeof gData === 'object' && !Array.isArray(gData)) {
                         for (const dKey in gData) {
                           const val = gData[dKey];
                           if (val === true || val === 1 || val === '1' || val === 'true' || (typeof val === 'string' && val.endsWith('hr'))) {
                             if (val !== '3hr') {
                               gData[dKey] = '3hr';
                               modified = true;
                             }
                           }
                         }
                       }
                     }
                   }
                 }
               }
             }
           }
           if (modified) {
             window.firebaseDb.ref('mep_dashboard_state').set(data);
           }
           localStorage.setItem('mep_mig_ot_3hr', 'true');
        }
        // --- MIGRATION BLOCK END ---
        
        if (data.iom_staff_list) {
          let list = Array.isArray(data.iom_staff_list) 
            ? data.iom_staff_list 
            : Object.values(data.iom_staff_list);
          IOM_STAFF_LIST = list.filter(item => item && item.id);
        }

        globalAppState = data;
        localStorage.setItem('mep_dashboard_state_cache', JSON.stringify(data));
      } else {
        globalAppState = createDefaultState();
        saveAppState(globalAppState);
      }

      // The state updates silently in the background (globalAppState is always fresh).
      // We intentionally do NOT re-trigger visual rendering here.
      // The user must click the "Refresh" (Update) button on the dashboard to see new changes.
      // And if they are editing a sheet, their own save will push to Firebase without interrupting their typing.
    });

    // Listen for publish trigger to update live dashboard globally
    let initialPublishLoad = true;
    window.firebaseDb.ref('mep_dashboard_publish_trigger').on('value', (snapshot) => {
      if (initialPublishLoad) {
        initialPublishLoad = false;
        return;
      }
      const trigger = snapshot.val();
      if (trigger) {
        localDashboardState = JSON.parse(JSON.stringify(globalAppState));
        localStorage.setItem('mep_dashboard_live_cache', JSON.stringify(localDashboardState));
        if (currentActivePageId === 'index' || currentActivePageId === 'overtime-dashboard' || currentActivePageId === 'iom-dashboard') {
          _performDashboardRender();
        }
      }
    });

    // Listen for entry sheet updates from other devices/users
    let initialUpdateLoad = true;
    window.firebaseDb.ref('mep_last_update_info').on('value', (snapshot) => {
      if (initialUpdateLoad) {
        initialUpdateLoad = false;
        return;
      }
      const data = snapshot.val();
      if (data && data.deviceId !== SESSION_DEVICE_ID) {
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = 'MEP FAN LTD.';
          const options = {
            body: data.actionStr || `🔄 ${data.pageTitle} has been updated`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: 'mep-update-notification',
            vibrate: [100, 50, 100],
            renotify: true
          };

          if ('serviceWorker' in navigator) {
            window.playAlertSoundAndVibrate();
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => {
              new Notification(title, options);
            });
          } else {
            window.playAlertSoundAndVibrate();
            new Notification(title, options);
          }
        }
      }
    });

    // Listen for Admin Broadcasts globally
    window.firebaseDb.ref('mep_admin_broadcast').on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const lastSeenStr = localStorage.getItem('mep_last_seen_broadcast');
      const lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0;

      if (currentActivePageId === 'index' || currentActivePageId === 'overtime-dashboard' || currentActivePageId === 'iom-dashboard') {
        window.scrollTo(0, 0);
      }

      // Ensure Broadcast is newer than what user has seen, and limit it to past 24 hours
      const isNew = data.timestamp > lastSeen;
      const hoursAgo = (Date.now() - data.timestamp) / (1000 * 60 * 60);

      if (isNew && hoursAgo < 24) {
        localStorage.setItem('mep_last_seen_broadcast', data.timestamp.toString());

        if ('Notification' in window && Notification.permission === 'granted') {
          const title = '📢 ADMIN ANNOUNCEMENT';
          const options = {
            body: data.message,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: 'mep-broadcast-' + data.timestamp,
            vibrate: [200, 100, 300, 100, 400],
            requireInteraction: true,
            renotify: true
          };

          if ('serviceWorker' in navigator) {
            window.playAlertSoundAndVibrate();
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => new Notification(title, options));
          } else {
            window.playAlertSoundAndVibrate();
            new Notification(title, options);
          }
        }
      }
    });
  } else {
    // Fallback if SDK failed to load
    globalAppState = getAppState();
    if (currentActivePageId === 'index' || currentActivePageId === 'overtime-dashboard') {
      _performDashboardRender();
    }
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initHighRefreshMotion();
  initSmoothModeToggle();
  initRefreshButton();
  lockMobilePortraitOrientation();
  initThemePicker();

  let retryCount = 0;
  const maxRetries = 20; // 10 seconds total

  function trySetupFirebase() {
    if (window.firebaseDb) {
      setupFirebaseListener();
    } else if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(trySetupFirebase, 500);
    } else {
      console.warn("Firebase failed to load after 10 seconds, falling back to local storage.");
      setupFirebaseListener(); // this will hit the fallback
    }
  }

  trySetupFirebase();

  // Restore scroll position after reload
  const scrollPos = sessionStorage.getItem('dashboardScrollPos');
  if (scrollPos) {
    setTimeout(() => window.scrollTo(0, parseInt(scrollPos)), 50);
  }

  setTimeout(initScrollReveal, 100);
});

window.addEventListener('orientationchange', () => {
  setTimeout(lockMobilePortraitOrientation, 250);
});

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('dashboardScrollPos', window.scrollY);
});

// Close dropdowns / FAB menu when clicking outside
document.addEventListener('click', (e) => {
  const notiBtn = document.getElementById('noti-btn');
  const notiDropdown = document.getElementById('noti-dropdown');
  const remBtn = document.getElementById('reminder-btn');
  const remDropdown = document.getElementById('reminder-dropdown');
  const fabWrapper = document.getElementById('fab-menu-wrapper');

  if (notiBtn && notiDropdown && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
    notiDropdown.style.display = 'none';
  }

  if (remBtn && remDropdown && !remBtn.contains(e.target) && !remDropdown.contains(e.target)) {
    remDropdown.style.display = 'none';
  }

  // Minimize FAB when user clicks anywhere outside the FAB menu
  if (window._fabOpen && fabWrapper && !fabWrapper.contains(e.target)) {
    window.toggleFabMenu();
  }
});
