const fs = require('fs');

const funcs = `
window.historyEditMode = false;
window.currentHistoryState = null;

window.toggleHistoryEditMode = function() {
  window.historyEditMode = !window.historyEditMode;
  if (!window.historySelectedDate || !window.currentHistoryState) return;
  const viewer = document.getElementById('history-data-viewer');
  if (viewer) {
    _renderHistoryState(window.historySelectedDate, window.currentHistoryState, viewer);
  }
};

window.saveHistoryChanges = function(dateStr) {
  if (!window.currentHistoryState) return;
  if (!confirm("Are you sure you want to save these changes to the snapshot?\\n\\nThis will update the data in Firebase and affect the compiled Excel report.")) return;
  
  const inputs = document.querySelectorAll('.ios-hm-edit-input');
  inputs.forEach(input => {
    const pageId = input.getAttribute('data-page');
    const group = input.getAttribute('data-group');
    const rKey = input.getAttribute('data-rkey');
    const field = input.getAttribute('data-field');
    
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0;
    
    if (window.currentHistoryState[pageId] && 
        window.currentHistoryState[pageId][group] && 
        window.currentHistoryState[pageId][group][rKey]) {
      window.currentHistoryState[pageId][group][rKey][field] = val;
    }
  });
  
  const btn = document.getElementById('btn-save-history');
  if (btn) btn.innerHTML = 'Saving...';
  
  window.firebaseDb.ref('mep_attendance_history/' + dateStr).set(window.currentHistoryState).then(() => {
    alert("Snapshot updated successfully!");
    window.historyEditMode = false;
    const viewer = document.getElementById('history-data-viewer');
    if (viewer) {
      _renderHistoryState(dateStr, window.currentHistoryState, viewer);
    }
  }).catch(err => {
    console.error("Error saving snapshot:", err);
    alert("Failed to save snapshot.");
    if (btn) btn.innerHTML = '<span>Save Changes</span>';
  });
};
`;

function inject(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    if (!content.includes('window.saveHistoryChanges')) {
        fs.writeFileSync(filename, content + "\\n" + funcs);
        console.log("Injected into " + filename);
    } else {
        console.log(filename + " already has the functions.");
    }
}

inject('history.js');
inject('history.min.js');
