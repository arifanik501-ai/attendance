const fs = require('fs');

function applyHistoryEditFeature(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let originalContent = content;

  // 1. Inject global variables and functions
  if (!content.includes('window.historyEditMode')) {
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
  if (!confirm("Are you sure you want to save these changes to the snapshot?\\n\\nThis will affect the compiled Excel report.")) return;
  
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
    alert("Error saving: " + err.message);
    if (btn) btn.innerHTML = 'Save Changes';
  });
};

`;
    // Insert at the top
    content = funcs + content;
  }

  // 2. _loadHistoryForDate
  const loadTarget = `      if (snapshot.exists()) {
        const state = snapshot.val();
        _renderHistoryState(dateStr, state, viewer);`;
  const loadReplace = `      if (snapshot.exists()) {
        const state = snapshot.val();
        window.currentHistoryState = state;
        window.historyEditMode = false;
        _renderHistoryState(dateStr, state, viewer);`;
  content = content.replace(loadTarget, loadReplace);

  // 3. _renderHistoryState loop update
  const loopTarget = `      groupNames.forEach(function(groupName) {
        var rows = pageData[groupName];
        if (!rows) return;
        if (!Array.isArray(rows)) {
          if (typeof rows === 'object') { rows = Object.values(rows); } else { return; }
        }
        if (rows.length === 0) return;

        var groupRows = [];
        var secExist = 0, secPresent = 0, secAbsent = 0;
        rows.forEach(function(row) {
          if (!row || typeof row !== 'object') return;
          var desig = row.designation || 'N/A';
          var authorized = parseInt(row.authorized) || 0;
          var existing = parseInt(row.existing) || 0;
          var present = parseInt(row.present) || 0;
          var absent = authorized - present;
          totalAuth += authorized;
          totalExist += existing; totalPresent += present; totalAbsent += absent;
          secExist += existing; secPresent += present; secAbsent += absent;
          groupRows.push({desig: desig, existing: existing, present: present, absent: absent});
        });`;

  const loopReplace = `      groupNames.forEach(function(groupName) {
        var rowsObj = pageData[groupName];
        if (!rowsObj || typeof rowsObj !== 'object') return;

        var groupRows = [];
        var secExist = 0, secPresent = 0, secAbsent = 0;
        
        Object.keys(rowsObj).forEach(function(rKey) {
          var row = rowsObj[rKey];
          if (!row || typeof row !== 'object') return;
          var desig = row.designation || 'N/A';
          var authorized = parseInt(row.authorized) || 0;
          var existing = parseInt(row.existing) || 0;
          var present = parseInt(row.present) || 0;
          var absent = authorized - present;
          totalAuth += authorized;
          totalExist += existing; totalPresent += present; totalAbsent += absent;
          secExist += existing; secPresent += present; secAbsent += absent;
          groupRows.push({
            desig: desig, existing: existing, present: present, absent: absent, authorized: authorized,
            pageId: pageId, groupName: groupName, rKey: rKey
          });
        });`;

  content = content.replace(loopTarget, loopReplace);

  // 4. _renderHistoryState card render update
  const cardTarget = `        var rowsHtml = '';
        groupRows.forEach(function(r) {
          var pct = r.existing > 0 ? Math.round((r.present / r.existing) * 100) : 0;
          rowsHtml +=
            '<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px;">' +
              '<div class="ios-merge-card-main">' +
                '<div class="ios-merge-date" style="font-size: 0.95rem; color: #1c1134; margin-bottom: 2px;">' + historyEscapeHtml(r.desig) + '</div>' +
                '<div class="ios-merge-title" style="font-weight: 600; opacity: 0.85;">' + r.present + '/' + r.existing + ' present</div>' +
              '</div>' +
              '<div class="ios-merge-card-stats">' +
                '<span class="ios-merge-pill present">P ' + r.present + '</span>' +
                '<span class="ios-merge-pill existing">E ' + r.existing + '</span>' +
                '<span class="ios-merge-pill absent">A ' + r.absent + '</span>' +
                '<span class="ios-merge-percent ' + getAttendanceTone(pct) + '">' + pct + '%</span>' +
              '</div>' +
            '</article>';
        });`;

  const cardReplace = `        var rowsHtml = '';
        groupRows.forEach(function(r) {
          var pct = r.existing > 0 ? Math.round((r.present / r.existing) * 100) : 0;
          
          if (window.historyEditMode) {
            rowsHtml +=
              '<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px; border: 1px solid #3b82f6; background: #eff6ff;">' +
                '<div class="ios-merge-card-main">' +
                  '<div class="ios-merge-date" style="font-size: 0.95rem; color: #1e3a8a; margin-bottom: 2px;">' + historyEscapeHtml(r.desig) + '</div>' +
                '</div>' +
                '<div class="ios-merge-card-stats" style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">' +
                  '<span style="font-size:0.85rem; font-weight:600; color:#475569; display:flex; align-items:center; gap:4px;">Pres: <input type="number" class="ios-hm-edit-input" data-page="'+historyEscapeHtml(r.pageId)+'" data-group="'+historyEscapeHtml(r.groupName)+'" data-rkey="'+historyEscapeHtml(r.rKey)+'" data-field="present" value="'+r.present+'" style="width:60px; padding:4px; border:1px solid #cbd5e1; border-radius:6px;"></span>' +
                  '<span style="font-size:0.85rem; font-weight:600; color:#475569; display:flex; align-items:center; gap:4px;">Exist: <input type="number" class="ios-hm-edit-input" data-page="'+historyEscapeHtml(r.pageId)+'" data-group="'+historyEscapeHtml(r.groupName)+'" data-rkey="'+historyEscapeHtml(r.rKey)+'" data-field="existing" value="'+r.existing+'" style="width:60px; padding:4px; border:1px solid #cbd5e1; border-radius:6px;"></span>' +
                  '<span style="font-size:0.85rem; font-weight:600; color:#475569; display:flex; align-items:center; gap:4px;">Auth: '+r.authorized+'</span>' +
                '</div>' +
              '</article>';
          } else {
            rowsHtml +=
              '<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px;">' +
                '<div class="ios-merge-card-main">' +
                  '<div class="ios-merge-date" style="font-size: 0.95rem; color: #1c1134; margin-bottom: 2px;">' + historyEscapeHtml(r.desig) + '</div>' +
                  '<div class="ios-merge-title" style="font-weight: 600; opacity: 0.85;">' + r.present + '/' + r.existing + ' present</div>' +
                '</div>' +
                '<div class="ios-merge-card-stats">' +
                  '<span class="ios-merge-pill present">P ' + r.present + '</span>' +
                  '<span class="ios-merge-pill existing">E ' + r.existing + '</span>' +
                  '<span class="ios-merge-pill absent">A ' + r.absent + '</span>' +
                  '<span class="ios-merge-percent ' + getAttendanceTone(pct) + '">' + pct + '%</span>' +
                '</div>' +
              '</article>';
          }
        });`;

  content = content.replace(cardTarget, cardReplace);

  // 5. _renderHistoryState head actions update
  const headTarget = `        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +
          '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
            '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
            '<span>Delete Date</span>' +
          '</button>' +`;

  const headReplace = `        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +
          (window.historyEditMode ? 
            '<button id="btn-save-history" class="admin-premium-btn" onclick="window.saveHistoryChanges(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" style="background:#10b981; margin-right:8px; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Save Changes</span></button>' +
            '<button class="ios-ss-delete-btn" onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#f1f5f9; color:#475569; border:none; border-radius:99px; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Cancel</span></button>' 
          :
            '<button class="admin-premium-btn" onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#3b82f6; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Edit Snapshot</span></button>' +
            '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
              '<span>Delete Date</span>' +
            '</button>'
          ) +`;

  content = content.replace(headTarget, headReplace);

  if (content !== originalContent) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' updated with History Edit feature.');
  } else {
    console.log(filename + ' no changes made or targets not found.');
  }
}

applyHistoryEditFeature('history.js');
applyHistoryEditFeature('history.min.js');
