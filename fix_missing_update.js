const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');
let originalContent = content;

// 1. Add instant sync for authorized manpower edits
content = content.replace(
  /state\[pageId\]\[g\]\[i\]\.authorized = val;\s*globalAppState = state;\s*updateGroupTotals\(e\.target\.closest\('table'\), state\[pageId\]\[g\]\);\s*return;/g,
  `state[pageId][g][i].authorized = val;
            globalAppState = state;
            updateGroupTotals(e.target.closest('table'), state[pageId][g]);
            if (window.firebaseDb) {
              window.firebaseDb.ref(\`mep_dashboard_state/\${pageId}/\${g}/\${i}/authorized\`).set(val);
              // Also update last update info without full re-render
              window.firebaseDb.ref('mep_last_update_info').set({
                deviceId: SESSION_DEVICE_ID,
                timestamp: Date.now(),
                pageTitle: SECTIONS_CONFIG[pageId].title,
                actionStr: "dY, " + SECTIONS_CONFIG[pageId].title + " has been updated"
              });
            }
            return;`
);

// 2. Add instant sync for present/existing/absent edits
content = content.replace(
  /state\[pageId\]\[g\]\[i\]\[f\] = val;\s*if \(f === 'existing' \|\| f === 'present'\) \{\s*calculateRow\(state\[pageId\]\[g\]\[i\]\);\s*e\.target\.closest\('tr'\)\.querySelector\('\.absent-val'\)\.textContent = state\[pageId\]\[g\]\[i\]\.absent;\s*\}\s*updateGroupTotals\(e\.target\.closest\('table'\), state\[pageId\]\[g\]\);/g,
  `state[pageId][g][i][f] = val;

          if (f === 'existing' || f === 'present') {
            calculateRow(state[pageId][g][i]);
            e.target.closest('tr').querySelector('.absent-val').textContent = state[pageId][g][i].absent;
          }

          updateGroupTotals(e.target.closest('table'), state[pageId][g]);

          if (window.firebaseDb) {
            window.firebaseDb.ref(\`mep_dashboard_state/\${pageId}/\${g}/\${i}/\${f}\`).set(val);
            if (f === 'existing' || f === 'present') {
              window.firebaseDb.ref(\`mep_dashboard_state/\${pageId}/\${g}/\${i}/absent\`).set(state[pageId][g][i].absent);
            }
            window.firebaseDb.ref('mep_last_update_info').set({
              deviceId: SESSION_DEVICE_ID,
              timestamp: Date.now(),
              pageTitle: SECTIONS_CONFIG[pageId].title,
              actionStr: "dY, " + SECTIONS_CONFIG[pageId].title + " has been updated"
            });
          }`
);

// 3. Fix btn-save to use a transaction for history and NOT overwrite everything
const oldSaveBtnLogic = `        state.history.unshift({
          page: SECTIONS_CONFIG[pageId].title,
          time: timeFormatter.format(now),
          date: dateFormatter.format(now),
          timestamp: Date.now()
        });
        // Keep max 20 history items
        if (state.history.length > 20) state.history.pop();
        localStorage.setItem('has_new_notifications', 'true');
  
        saveAppState(state);
  
        // Re-lock the authorize manpower edit mode after saving
        localStorage.setItem(EDIT_AUTH_STORAGE_KEY, 'false');
  
        alert('Thank you.');
        window.location.href = 'index.html';`;

const newSaveBtnLogic = `        if (window.firebaseDb) {
          // Use transaction for history to prevent concurrent overwrites
          window.firebaseDb.ref('mep_dashboard_state/history').transaction(currentHistory => {
            let hist = currentHistory || [];
            hist.unshift({
              page: SECTIONS_CONFIG[pageId].title,
              time: timeFormatter.format(now),
              date: dateFormatter.format(now),
              timestamp: Date.now()
            });
            if (hist.length > 20) hist.pop();
            return hist;
          }).then(() => {
            localStorage.setItem('has_new_notifications', 'true');
            
            // Re-lock the authorize manpower edit mode after saving
            localStorage.setItem(EDIT_AUTH_STORAGE_KEY, 'false');
            
            // Trigger update info & change count (since we bypassed saveAppState)
            window.firebaseDb.ref('mep_last_update_info').set({
              deviceId: SESSION_DEVICE_ID,
              timestamp: Date.now(),
              pageTitle: SECTIONS_CONFIG[pageId].title,
              actionStr: "dY, " + SECTIONS_CONFIG[pageId].title + " has been updated"
            });
            window.firebaseDb.ref('mep_change_count')
              .transaction(current => (current || 0) + 1)
              .catch(e => console.error("Error updating change count:", e));

            if (typeof _saveAttendanceHistory === 'function') {
               _saveAttendanceHistory(globalAppState);
            }

            alert('Thank you.');
            window.location.href = 'index.html';
          }).catch(err => {
            console.error('Error saving history transaction:', err);
            alert('Error saving. Please try again.');
          });
        } else {
          // Fallback if no firebase
          if (!state.history) state.history = [];
          state.history.unshift({
            page: SECTIONS_CONFIG[pageId].title,
            time: timeFormatter.format(now),
            date: dateFormatter.format(now),
            timestamp: Date.now()
          });
          if (state.history.length > 20) state.history.pop();
          saveAppState(state);
          localStorage.setItem(EDIT_AUTH_STORAGE_KEY, 'false');
          alert('Thank you.');
          window.location.href = 'index.html';
        }`;

content = content.replace(oldSaveBtnLogic, newSaveBtnLogic);

if (content === originalContent) {
  console.log("No changes made. The regex patterns might not have matched.");
} else {
  fs.writeFileSync('app.js', content);
  fs.writeFileSync('app.min.js', content);
  console.log("Updated app.js successfully!");
}
