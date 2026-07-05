const fs = require('fs');

let bak = fs.readFileSync('history.js.bak', 'utf8');

// _renderHistoryState is the LAST function in the backup
const funcStart = bak.indexOf('\nfunction _renderHistoryState(dateStr, state, container) {');
// End = end of file (it's the last function)
const endPos = bak.length;

console.log('funcStart:', funcStart, 'endPos (file length):', endPos);
if (funcStart === -1) { console.error('Not found!'); process.exit(1); }

const newRenderFn = `
function _renderHistoryState(dateStr, state, container) {
  try {
    var formattedDate = formatHistoryDate(dateStr);
    var totalAuth = 0, totalExist = 0, totalPresent = 0, totalAbsent = 0;
    var sectionsHtml = '';

    Object.keys(state).forEach(function(pageId) {
      if (isMetaStateKey(pageId)) return;
      var pageData = state[pageId];
      if (!pageData || typeof pageData !== 'object' || Array.isArray(pageData)) return;

      Object.keys(pageData).forEach(function(groupName) {
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
          groupRows.push({desig: desig, existing: existing, present: present,
            absent: absent, authorized: authorized,
            pageId: pageId, groupName: groupName, rKey: rKey});
        });

        if (groupRows.length === 0) return;

        var rowsHtml = '';
        groupRows.forEach(function(r) {
          var pct = r.existing > 0 ? Math.round((r.present / r.existing) * 100) : 0;
          if (window.historyEditMode) {
            rowsHtml +=
              '<div class="ios-ss-row" style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;margin:4px 14px;padding:10px 14px;">' +
                '<div class="ios-ss-desig">' +
                  '<div class="ios-ss-desig-name" style="color:#1e40af;">' + historyEscapeHtml(r.desig) + '</div>' +
                  '<div style="font-size:0.73rem;color:#6b7280;margin-top:2px;">Auth: ' + r.authorized + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                  '<label style="font-size:0.78rem;font-weight:600;color:#1d4ed8;display:flex;align-items:center;gap:4px;">P:<input type="number" min="0" class="ios-hm-edit-input" data-page="' + historyEscapeHtml(r.pageId) + '" data-group="' + historyEscapeHtml(r.groupName) + '" data-rkey="' + historyEscapeHtml(r.rKey) + '" data-field="present" value="' + r.present + '" style="width:52px;padding:4px 5px;border:1.5px solid #93c5fd;border-radius:6px;font-size:0.88rem;font-weight:700;text-align:center;outline:none;"></label>' +
                  '<label style="font-size:0.78rem;font-weight:600;color:#1d4ed8;display:flex;align-items:center;gap:4px;">E:<input type="number" min="0" class="ios-hm-edit-input" data-page="' + historyEscapeHtml(r.pageId) + '" data-group="' + historyEscapeHtml(r.groupName) + '" data-rkey="' + historyEscapeHtml(r.rKey) + '" data-field="existing" value="' + r.existing + '" style="width:52px;padding:4px 5px;border:1.5px solid #93c5fd;border-radius:6px;font-size:0.88rem;font-weight:700;text-align:center;outline:none;"></label>' +
                '</div>' +
              '</div>';
          } else {
            rowsHtml +=
              '<div class="ios-ss-row">' +
                '<div class="ios-ss-desig">' +
                  '<div class="ios-ss-desig-name">' + historyEscapeHtml(r.desig) + '</div>' +
                  '<div class="ios-ss-mini-meta">' +
                    '<span class="ios-ss-mini-dot ' + getAttendanceTone(pct) + '"></span>' +
                    '<span>' + pct + '% present</span>' +
                  '</div>' +
                '</div>' +
                '<div class="ios-ss-chips">' +
                  '<span class="ios-ss-chip c-exist"><span class="lbl">E</span>' + r.existing + '</span>' +
                  '<span class="ios-ss-chip c-present"><span class="lbl">P</span>' + r.present + '</span>' +
                  '<span class="ios-ss-chip c-absent' + (r.absent === 0 ? ' zero' : '') + '"><span class="lbl">A</span>' + r.absent + '</span>' +
                '</div>' +
              '</div>';
          }
        });

        sectionsHtml +=
          '<div class="ios-ss-section">' +
            '<div class="ios-ss-sec-head">' +
              '<h4 class="ios-ss-sec-title">' + historyEscapeHtml(groupName) + '</h4>' +
              '<div class="ios-ss-sec-summary"><b>' + secPresent + '</b>/' + secExist + ' present \u00b7 <i>' + secAbsent + '</i> absent</div>' +
            '</div>' +
            '<div class="ios-ss-rows">' + rowsHtml + '</div>' +
          '</div>';
      });
    });

    if (sectionsHtml === '') {
      container.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No attendance data recorded on ' + formattedDate + '.</div></div>';
      return;
    }

    var pct = totalExist > 0 ? Math.round((totalPresent / totalExist) * 100) : 0;

    container.innerHTML =
      '<div class="ios-ss-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-bottom:10px;margin-bottom:10px;">' +
        '<div>' +
          '<h3 class="ios-ss-head-title">Attendance Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="display:flex;align-items:center;gap:6px;">' +
          (window.historyEditMode ?
            '<button id="btn-save-history" onclick="window.saveHistoryChanges(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" style="background:#10b981;border:none;border-radius:99px;color:#fff;font-weight:700;padding:7px 15px;cursor:pointer;font-size:0.82rem;">\u2713 Save</button>' +
            '<button onclick="window.toggleHistoryEditMode()" type="button" style="background:#f1f5f9;color:#475569;border:none;border-radius:99px;font-weight:700;padding:7px 13px;cursor:pointer;font-size:0.82rem;">\u2715 Cancel</button>'
          :
            '<button onclick="window.toggleHistoryEditMode()" type="button" style="background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius:99px;color:#fff;font-weight:700;padding:7px 15px;cursor:pointer;font-size:0.82rem;">\u270f\ufe0f Edit</button>' +
            '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
              '<span>Delete</span>' +
            '</button>'
          ) +
          '<div class="ios-ss-ring" style="--pct:' + pct + '"><span class="ios-ss-ring-val">' + pct + '%</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ios-ss-kpi">' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized</div><div class="ios-ss-kpi-value k-total">' + (totalAuth || totalExist) + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing</div><div class="ios-ss-kpi-value k-existing">' + totalExist + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present</div><div class="ios-ss-kpi-value k-present">' + totalPresent + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent</div><div class="ios-ss-kpi-value k-absent">' + totalAbsent + '</div></div>' +
      '</div>' +
      '<div class="ios-ss-sections">' + sectionsHtml + '</div>';
  } catch(e) {
    console.error('_renderHistoryState error:', e);
    container.innerHTML = '<div style="padding:2rem;"><h3 style="color:#ef4444;">Error rendering snapshot</h3><pre style="background:#f8fafc;padding:1rem;border-radius:8px;overflow:auto;font-size:0.8rem;color:#334155;">' + JSON.stringify(state, null, 2) + '</pre></div>';
  }
}

window.historyEditMode = false;
window.currentHistoryState = null;

window.toggleHistoryEditMode = function() {
  window.historyEditMode = !window.historyEditMode;
  if (!window.historySelectedDate || !window.currentHistoryState) return;
  var viewer = document.getElementById('history-data-viewer');
  if (viewer) { _renderHistoryState(window.historySelectedDate, window.currentHistoryState, viewer); }
};

window.saveHistoryChanges = function(dateStr) {
  if (!window.currentHistoryState) return;
  if (!confirm('Are you sure you want to save these changes?\\nThis will permanently update Firebase data.')) return;
  var inputs = document.querySelectorAll('.ios-hm-edit-input');
  inputs.forEach(function(input) {
    var pageId = input.getAttribute('data-page');
    var group = input.getAttribute('data-group');
    var rKey = input.getAttribute('data-rkey');
    var field = input.getAttribute('data-field');
    var val = parseInt(input.value); if (isNaN(val)) val = 0;
    if (window.currentHistoryState[pageId] &&
        window.currentHistoryState[pageId][group] &&
        window.currentHistoryState[pageId][group][rKey]) {
      window.currentHistoryState[pageId][group][rKey][field] = val;
    }
  });
  var btn = document.getElementById('btn-save-history');
  if (btn) { btn.innerHTML = 'Saving...'; btn.disabled = true; }
  window.firebaseDb.ref('mep_attendance_history/' + dateStr).set(window.currentHistoryState).then(function() {
    alert('Snapshot updated successfully!');
    window.historyEditMode = false;
    var viewer = document.getElementById('history-data-viewer');
    if (viewer) { _renderHistoryState(dateStr, window.currentHistoryState, viewer); }
  }).catch(function(err) {
    console.error('Error saving snapshot:', err);
    alert('Failed to save. Please try again.');
    if (btn) { btn.innerHTML = '\\u2713 Save'; btn.disabled = false; }
  });
};
`;

// Build: everything from backup BEFORE _renderHistoryState + our new version
let result = bak.substring(0, funcStart) + newRenderFn;

// Patch _loadHistoryForDate to store state
result = result.replace(
    /const state = snapshot\.val\(\);\s*\n(\s*)_renderHistoryState\(dateStr, state, viewer\);/,
    'const state = snapshot.val();\n$1window.currentHistoryState = state;\n$1window.historyEditMode = false;\n$1_renderHistoryState(dateStr, state, viewer);'
);

fs.writeFileSync('history.js', result);
fs.writeFileSync('history.min.js', result);

console.log('Done!');
console.log('openAdminHistoryModal present:', result.includes('openAdminHistoryModal'));
console.log('openHistoryModal present:', result.includes('openHistoryModal'));
console.log('toggleHistoryEditMode present:', result.includes('toggleHistoryEditMode'));
console.log('Edit button present:', result.includes('window.toggleHistoryEditMode()'));
