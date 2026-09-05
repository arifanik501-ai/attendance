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
        
        

        globalAppState = data;
        localStorage.setItem('mep_dashboard_state_cache', JSON.stringify(data));

        

        
        if (data.sectionStatus || data.sectionStatusHistory) {
          if (!localDashboardState) {
            localDashboardState = JSON.parse(JSON.stringify(data));
          }
          if (data.sectionStatus) localDashboardState.sectionStatus = data.sectionStatus;
          if (data.sectionStatusHistory) localDashboardState.sectionStatusHistory = data.sectionStatusHistory;

          if (!globalAppState) globalAppState = data;
          else {
            if (data.sectionStatus) globalAppState.sectionStatus = data.sectionStatus;
            if (data.sectionStatusHistory) globalAppState.sectionStatusHistory = data.sectionStatusHistory;
          }

          localStorage.setItem('mep_dashboard_live_cache', JSON.stringify(localDashboardState));
          localStorage.setItem('mep_dashboard_state_cache', JSON.stringify(globalAppState));

          if (currentActivePageId === 'section-status-report') {
            if (typeof _performDashboardRender === 'function') {
              _performDashboardRender();
            } else if (typeof window._renderSectionStatusReportContent === 'function') {
              window._renderSectionStatusReportContent();
            }
          }
        }
      } else {
        globalAppState = createDefaultState();
        saveAppState(globalAppState);
      }
    });

    // Listen for publish trigger to update live dashboard globally
    let initialPublishLoad = true;
    window.firebaseDb.ref('mep_dashboard_publish_trigger').on('value', (snapshot) => {
      const trigger = snapshot.val();
      if (trigger) {
        const pubTs = (typeof trigger === 'number') ? trigger : Date.now();
        localStorage.setItem('mep_last_publish_ts', pubTs);
        window.mepHasPendingDashboardUpdates = false;
        if (typeof window.checkDashboardUpdateNoticeStatus === 'function') {
          window.checkDashboardUpdateNoticeStatus();
        }
      }
      if (initialPublishLoad) {
        initialPublishLoad = false;
        return;
      }
      if (trigger) {
        localDashboardState = JSON.parse(JSON.stringify(globalAppState));
        localStorage.setItem('mep_dashboard_live_cache', JSON.stringify(localDashboardState));
        if (currentActivePageId === 'index'  || currentActivePageId === 'section-status-report') {
          _performDashboardRender();
        }
      }
    });

    // Listen for entry sheet updates from other devices/users
    let initialUpdateLoad = true;
    window.firebaseDb.ref('mep_last_update_info').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp) {
        localStorage.setItem('mep_last_update_ts', data.timestamp);
        const lastPub = Number(localStorage.getItem('mep_last_publish_ts') || 0);
        if (data.timestamp > lastPub) {
          window.mepHasPendingDashboardUpdates = true;
        }
        if (typeof window.checkDashboardUpdateNoticeStatus === 'function') {
          window.checkDashboardUpdateNoticeStatus();
        }
      }
      if (initialUpdateLoad) {
        initialUpdateLoad = false;
        return;
      }
      if (data) {
        if (window.firebaseDb) {
          window.firebaseDb.ref('mep_dashboard_state/sectionStatus').once('value').then(snap => {
            if (snap.exists()) {
              const secStat = snap.val();
              if (!localDashboardState) localDashboardState = {};
              localDashboardState.sectionStatus = secStat;
              if (globalAppState) globalAppState.sectionStatus = secStat;
              localStorage.setItem('mep_dashboard_live_cache', JSON.stringify(localDashboardState));
              if (currentActivePageId === 'section-status-report') {
                if (typeof _performDashboardRender === 'function') _performDashboardRender();
                else if (typeof window._renderSectionStatusReportContent === 'function') window._renderSectionStatusReportContent();
              }
            }
          }).catch(err => console.warn('Section status live sync error:', err));
        }

        if (data && data.deviceId !== SESSION_DEVICE_ID && data.timestamp) {
          const lastNotifiedTs = Number(sessionStorage.getItem('mep_last_notified_event_ts') || 0);
          if (data.timestamp > lastNotifiedTs) {
            sessionStorage.setItem('mep_last_notified_event_ts', String(data.timestamp));
            if ('Notification' in window && Notification.permission === 'granted') {
              const title = 'MEP FAN LTD.';
              const options = {
                body: data.actionStr || `🔄 ${data.pageTitle} has been updated`,
                icon: './icon-192.png',
                badge: './icon-192.png',
                tag: `mep-update-${data.timestamp}`,
                vibrate: [100, 50, 100],
                renotify: false
              };

              window.playAlertSoundAndVibrate();
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification(title, options);
                }).catch(() => {
                  new Notification(title, options);
                });
              } else {
                new Notification(title, options);
              }
            }
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

      if (currentActivePageId === 'index' || currentActivePageId === 'overtime-dashboard' ) {
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
    if (currentActivePageId === 'index') {
      _performDashboardRender();
    }
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initHighRefreshMotion();
  initSmoothModeToggle();
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
