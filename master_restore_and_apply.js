const fs = require('fs');

console.log("=== COMPLETE RESTORE + ALL FEATURES ===");

// 1. Restore from backup
let content = fs.readFileSync('history.js.bak', 'utf8');
console.log("✓ Restored from backup. Size:", content.length);

// =============================================
// FEATURE 1: Excel force-include designations
// (Fan Sada Shapla > Supervisor, Fan Assemble > Jr. Officer from July 2024)
// =============================================
// Update excel generation to include them (update_excel_script.js logic)
// The generateAndDownloadCompleteMonthlyExcel function has a filter.
// We insert "force include" logic into the designation filter.
const filterTarget = `      // 3. Remove Empty Rows: Skip designations that have 0 auth/exist across all dates
      const designations = Object.keys(dataMap[section]).sort().filter(desig => {`;
const filterReplace = `      // 3. Remove Empty Rows: Skip designations that have 0 auth/exist across all dates
      const designations = Object.keys(dataMap[section]).sort().filter(desig => {
        // Force include these from July 1st
        if (section === 'Fan Sada Shapla' && (desig === 'Supervisor' || desig === 'Sr. Supervisor')) {
          if (dates.some(d => d >= '2024-07-01')) return true;
        }
        if (section === 'Fan Assemble' && desig === 'Jr. Officer') {
          if (dates.some(d => d >= '2024-07-01')) return true;
        }`;
content = content.replace(filterTarget, filterReplace);
console.log("✓ Excel force-include designations applied");

// =============================================
// FEATURE 2: Merged History Tab (Fan Assemble + Dimmer AND Rojonigondha + Shapla)
// (update_ui_script.js logic)
// =============================================

// 2a. Add Rojonigondha+Shapla button to the modal header
const headerBtnTarget = `          <button id="fan-merge-history-btn" class="ios-hm-merge-btn" onclick="window.showFanAssembleDimmerMergedHistory()" type="button">
            <span class="ios-hm-merge-icon" aria-hidden="true">↔</span>
            <span>Fan Assemble + Dimmer</span>
          </button>`;
const headerBtnReplace = `          <button id="fan-merge-history-btn" class="ios-hm-merge-btn" onclick="window.showFanAssembleDimmerMergedHistory()" type="button">
            <span class="ios-hm-merge-icon" aria-hidden="true">↔</span>
            <span>Fan Assemble + Dimmer</span>
          </button>
          <button id="fan-roj-shapla-history-btn" class="ios-hm-merge-btn" onclick="window.showFanRojonigondhaShaplaMergedHistory()" type="button" style="margin-left:6px;">
            <span class="ios-hm-merge-icon" aria-hidden="true">↔</span>
            <span>Rojonigondha + Shapla</span>
          </button>`;
content = content.replace(headerBtnTarget, headerBtnReplace);
console.log("✓ Added Rojonigondha+Shapla button to header");

// 2b. Fix _loadHistoryForDate to handle both merged modes
const loadFnTarget = `window._loadHistoryForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  if (window.historyMergedMode) {
    window.renderFanAssembleDimmerMergedForDate(dateStr);
    return;
  }
  updateMergedHistoryButtonState();`;
const loadFnReplace = `window._loadHistoryForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  if (window.historyMergedMode === 'assemble_dimmer') {
    window.renderFanAssembleDimmerMergedForDate(dateStr);
    return;
  }
  if (window.historyMergedMode === 'roj_shapla') {
    window.renderFanRojonigondhaShaplaMergedForDate(dateStr);
    return;
  }
  updateMergedHistoryButtonState();`;
content = content.replace(loadFnTarget, loadFnReplace);
console.log("✓ Updated _loadHistoryForDate for dual merged modes");

// 2c. Fix showFanAssembleDimmerMergedHistory to use string mode
const showMergedTarget = `window.showFanAssembleDimmerMergedHistory = function() {
  window.historyMergedMode = !window.historyMergedMode;
  updateMergedHistoryButtonState();
  if (!window.historyMergedMode) {`;
const showMergedReplace = `window.showFanAssembleDimmerMergedHistory = function() {
  window.historyMergedMode = (window.historyMergedMode === 'assemble_dimmer') ? false : 'assemble_dimmer';
  updateMergedHistoryButtonState();
  if (!window.historyMergedMode) {`;
content = content.replace(showMergedTarget, showMergedReplace);
console.log("✓ Updated showFanAssembleDimmerMergedHistory to use string mode");

// 2d. Fix renderFanAssembleDimmerMergedForDate to set string mode
content = content.replace(
  `window.historySelectedDate = dateStr;\r\n  window.historyMergedMode = true;\r\n  updateMergedHistoryButtonState();\r\n\r\n  viewer.innerHTML = \`\r\n    <div class="ios-hm-loader">\r\n      <div class="ios-hm-spinner"></div>\r\n      <div class="ios-hm-loader-text">Loading daily Worker merge…</div>`,
  `window.historySelectedDate = dateStr;\r\n  window.historyMergedMode = 'assemble_dimmer';\r\n  updateMergedHistoryButtonState();\r\n\r\n  viewer.innerHTML = \`\r\n    <div class="ios-hm-loader">\r\n      <div class="ios-hm-spinner"></div>\r\n      <div class="ios-hm-loader-text">Loading daily Worker merge…</div>`
);
console.log("✓ Fixed renderFanAssembleDimmerMergedForDate mode string");

// 2e. Fix updateMergedHistoryButtonState to handle both buttons
const updateBtnTarget = `function updateMergedHistoryButtonState() {
  const btn = document.getElementById('fan-merge-history-btn');
  if (!btn) return;
  btn.classList.toggle('is-active', !!window.historyMergedMode);
}`;
const updateBtnReplace = `function updateMergedHistoryButtonState() {
  const btn1 = document.getElementById('fan-merge-history-btn');
  const btn2 = document.getElementById('fan-roj-shapla-history-btn');
  if (btn1) btn1.classList.toggle('is-active', window.historyMergedMode === 'assemble_dimmer');
  if (btn2) btn2.classList.toggle('is-active', window.historyMergedMode === 'roj_shapla');
}`;
content = content.replace(updateBtnTarget, updateBtnReplace);
console.log("✓ Fixed updateMergedHistoryButtonState for both buttons");

// 2f. Inject Rojonigondha+Shapla merged functions before end of file
const rojShaplaMergedCode = `
// === ROJONIGONDHA + SHAPLA MERGED VIEW ===
function collectFanRojonigondhaShaplaTotals(state) {
  const targetGroups = ["Fan Sada Shapla", "Fan Rojonigondha"];
  const rows = [];
  const totals = { authorized: 0, existing: 0, present: 0, absent: 0 };
  targetGroups.forEach(function(groupName) {
    var pageIds = Object.keys(state);
    pageIds.forEach(function(pageId) {
      if (!state[pageId] || typeof state[pageId] !== 'object') return;
      var groupData = state[pageId][groupName];
      if (!groupData) return;
      var rowsArr = Array.isArray(groupData) ? groupData : Object.values(groupData);
      rowsArr.forEach(function(row) {
        if (!row || typeof row !== 'object') return;
        var authorized = parseInt(row.authorized) || 0;
        var existing = parseInt(row.existing) || 0;
        var present = parseInt(row.present) || 0;
        var absent = authorized - present;
        totals.authorized += authorized;
        totals.existing += existing;
        totals.present += present;
        totals.absent += absent;
        rows.push({ designation: String(row.designation || 'N/A'), group: groupName, authorized: authorized, existing: existing, present: present, absent: absent });
      });
    });
  });
  return { totals: totals, rows: rows };
}

window.showFanRojonigondhaShaplaMergedHistory = function() {
  window.historyMergedMode = (window.historyMergedMode === 'roj_shapla') ? false : 'roj_shapla';
  updateMergedHistoryButtonState();
  if (!window.historyMergedMode) {
    if (window.historySelectedDate) window._loadHistoryForDate(window.historySelectedDate);
    return;
  }
  const selectedDate = window.historySelectedDate || Array.from(window.savedHistoryDates || []).sort().reverse()[0];
  if (!selectedDate) return;
  window.historySelectedDate = selectedDate;
  window.renderFanRojonigondhaShaplaMergedForDate(selectedDate);
};

window.renderFanRojonigondhaShaplaMergedForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  window.historyMergedMode = 'roj_shapla';
  updateMergedHistoryButtonState();
  viewer.innerHTML = '<div class="ios-hm-loader"><div class="ios-hm-spinner"></div><div class="ios-hm-loader-text">Loading Rojonigondha + Shapla merge…</div></div>';
  if (!window.firebaseDb) { viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Firebase not connected</div></div>'; return; }
  window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      renderFanRojonigondhaShaplaMergedHistory(dateStr, snapshot.val(), viewer);
    } else {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No snapshot found for ' + historyEscapeHtml(dateStr) + '.</div></div>';
    }
  }).catch(function(err) {
    viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Error loading data</div></div>';
  });
};

function renderFanRojonigondhaShaplaMergedHistory(dateStr, state, container) {
  const merged = collectFanRojonigondhaShaplaTotals(state);
  if (merged.rows.length === 0) {
    container.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No data found for Fan Rojonigondha or Fan Sada Shapla.</div></div>';
    return;
  }
  const totalPct = getAttendancePct(merged.totals.present, merged.totals.authorized);
  const rowCards = merged.rows.map(function(row) {
    const rowPct = getAttendancePct(row.present, row.authorized);
    return (
      '<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px;">' +
        '<div class="ios-merge-card-main">' +
          '<div class="ios-merge-date" style="font-size: 0.85rem; color: #6d28d9; font-weight: 600;">' + historyEscapeHtml(row.group) + '</div>' +
          '<div class="ios-merge-date" style="font-size: 0.95rem; color: #1c1134; margin-bottom: 2px;">' + historyEscapeHtml(row.designation) + '</div>' +
          '<div class="ios-merge-title" style="font-weight: 600; opacity: 0.85;">' + row.present + '/' + row.existing + ' present</div>' +
        '</div>' +
        '<div class="ios-merge-card-stats">' +
          '<span class="ios-merge-pill authorized">Auth ' + row.authorized + '</span>' +
          '<span class="ios-merge-pill present">P ' + row.present + '</span>' +
          '<span class="ios-merge-pill existing">E ' + row.existing + '</span>' +
          '<span class="ios-merge-pill absent">A ' + row.absent + '</span>' +
          '<span class="ios-merge-percent ' + getAttendanceTone(rowPct) + '">' + rowPct + '%</span>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  container.innerHTML =
    '<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
      '<div class="ios-merge-head-info">' +
        '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Rojonigondha + Shapla Merge</h3>' +
        '<div class="ios-ss-head-date">' + historyEscapeHtml(formatHistoryDate(dateStr)) + '</div>' +
      '</div>' +
      '<div class="ios-ss-head-actions" style="margin-left: auto;">' +
        '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
          '<span>Delete Date</span>' +
        '</button>' +
        '<div class="ios-ss-ring" style="--pct:' + totalPct + '"><span class="ios-ss-ring-val">' + totalPct + '%</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
      '<div><span>Authorized</span><b class="k-authorized">' + merged.totals.authorized + '</b></div>' +
      '<div><span>Existing</span><b class="k-existing">' + merged.totals.existing + '</b></div>' +
      '<div><span>Present</span><b class="k-present">' + merged.totals.present + '</b></div>' +
      '<div><span>Absent</span><b class="k-absent">' + merged.totals.absent + '</b></div>' +
    '</div>' +
    '<div class="ios-merge-list">' + rowCards + '</div>';
}
// === END ROJONIGONDHA + SHAPLA MERGED VIEW ===
`;
content = content + rojShaplaMergedCode;
console.log("✓ Added Rojonigondha+Shapla merged functions");

// =============================================
// FEATURE 3: Premium Daily Snapshot UI
// (update_ss_robust.js logic - replace ios-ss-row with premium cards)
// =============================================
const rowsHtmlTarget = `        var rowsHtml = '';
        groupRows.forEach(function(r) {
          var pct = r.existing > 0 ? Math.round((r.present / r.existing) * 100) : 0;
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
        });`;

const rowsHtmlReplace = `        var rowsHtml = '';
        groupRows.forEach(function(r) {
          var pct = r.existing > 0 ? Math.round((r.present / r.existing) * 100) : 0;
          if (window.historyEditMode) {
            rowsHtml +=
              '<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px; border: 2px solid #3b82f6; background: #eff6ff;">' +
                '<div class="ios-merge-card-main">' +
                  '<div class="ios-merge-date" style="font-size: 0.95rem; color: #1e3a8a; margin-bottom: 6px; font-weight: 700;">' + historyEscapeHtml(r.desig) + '</div>' +
                '</div>' +
                '<div class="ios-merge-card-stats" style="margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">' +
                  '<label style="font-size:0.85rem; font-weight:600; color:#1e40af; display:flex; align-items:center; gap:4px;">Present: <input type="number" class="ios-hm-edit-input" data-page="' + historyEscapeHtml(r.pageId) + '" data-group="' + historyEscapeHtml(r.groupName) + '" data-rkey="' + historyEscapeHtml(r.rKey) + '" data-field="present" value="' + r.present + '" min="0" style="width:65px; padding:5px 8px; border:2px solid #93c5fd; border-radius:8px; font-size:0.9rem; font-weight:700; text-align:center;"></label>' +
                  '<label style="font-size:0.85rem; font-weight:600; color:#1e40af; display:flex; align-items:center; gap:4px;">Existing: <input type="number" class="ios-hm-edit-input" data-page="' + historyEscapeHtml(r.pageId) + '" data-group="' + historyEscapeHtml(r.groupName) + '" data-rkey="' + historyEscapeHtml(r.rKey) + '" data-field="existing" value="' + r.existing + '" min="0" style="width:65px; padding:5px 8px; border:2px solid #93c5fd; border-radius:8px; font-size:0.9rem; font-weight:700; text-align:center;"></label>' +
                  '<span style="font-size:0.85rem; color:#64748b;">Auth: <b>' + r.authorized + '</b></span>' +
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

content = content.replace(rowsHtmlTarget, rowsHtmlReplace);
console.log("✓ Applied premium card UI for daily snapshot rows");

// Also update groupRows.push to include rKey, pageId, groupName for edit mode
content = content.replace(
  `          groupRows.push({desig: desig, existing: existing, present: present, absent: absent});`,
  `          groupRows.push({desig: desig, existing: existing, present: present, absent: absent, authorized: authorized, pageId: pageId, groupName: groupName, rKey: String(rows.indexOf ? rows.indexOf(row) : groupRows.length)});`
);
// Fix: Object.values doesn't retain keys. We need to use object key iteration.
// Replace the row iteration in _renderHistoryState to use Object.keys for rKey tracking.
content = content.replace(
  `        var rows = pageData[groupName];
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
          groupRows.push({desig: desig, existing: existing, present: present, absent: absent, authorized: authorized, pageId: pageId, groupName: groupName, rKey: String(rows.indexOf ? rows.indexOf(row) : groupRows.length)});`,

  `        var rowsRaw = pageData[groupName];
        if (!rowsRaw) return;
        var rowsObj = (Array.isArray(rowsRaw) || typeof rowsRaw !== 'object') ? null : rowsRaw;
        var rowsList = rowsObj ? Object.values(rowsRaw) : (Array.isArray(rowsRaw) ? rowsRaw : []);
        var rowsKeys = rowsObj ? Object.keys(rowsRaw) : rowsList.map(function(_,i){return String(i);});
        if (rowsList.length === 0) return;

        var groupRows = [];
        var secExist = 0, secPresent = 0, secAbsent = 0;
        rowsList.forEach(function(row, idx) {
          if (!row || typeof row !== 'object') return;
          var rKey = rowsKeys[idx] || String(idx);
          var desig = row.designation || 'N/A';
          var authorized = parseInt(row.authorized) || 0;
          var existing = parseInt(row.existing) || 0;
          var present = parseInt(row.present) || 0;
          var absent = authorized - present;
          totalAuth += authorized;
          totalExist += existing; totalPresent += present; totalAbsent += absent;
          secExist += existing; secPresent += present; secAbsent += absent;
          groupRows.push({desig: desig, existing: existing, present: present, absent: absent, authorized: authorized, pageId: pageId, groupName: groupName, rKey: rKey});`
);
console.log("✓ Fixed row iteration for edit mode key tracking");

// =============================================
// FEATURE 4: Premium head for _renderHistoryState
// =============================================
const headTarget = `      '\u003cdiv class="ios-ss-head"\u003e' +
        '\u003cdiv\u003e' +
          '\u003ch3 class="ios-ss-head-title"\u003eAttendance Snapshot\u003c/h3\u003e' +
          '\u003cdiv class="ios-ss-head-date"\u003e' + formattedDate + '\u003c/div\u003e' +
        '\u003c/div\u003e' +
        '\u003cdiv class="ios-ss-head-actions"\u003e' +
          '\u003cbutton class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')\" type="button"\u003e' +
            '\u003csvg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"\u003e\u003cpath d="M3 6h18"\u003e\u003c/path\u003e\u003cpath d="M8 6V4h8v2"\u003e\u003c/path\u003e\u003cpath d="M19 6l-1 14H6L5 6"\u003e\u003c/path\u003e\u003cpath d="M10 11v5"\u003e\u003c/path\u003e\u003cpath d="M14 11v5"\u003e\u003c/path\u003e\u003c/svg\u003e' +
            '\u003cspan\u003eDelete Date\u003c/span\u003e' +
          '\u003c/button\u003e' +
          '\u003cdiv class="ios-ss-ring" style="--pct:' + pct + '"\u003e\u003cspan class="ios-ss-ring-val"\u003e' + pct + '%\u003c/span\u003e\u003c/div\u003e' +
        '\u003c/div\u003e' +
      '\u003c/div\u003e' +`;

// Use raw string to find it in content
const headFind = `'<div class="ios-ss-head">' +
        '<div>' +
          '<h3 class="ios-ss-head-title">Attendance Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions">' +
          '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
            '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
            '<span>Delete Date</span>' +
          '</button>' +
          '<div class="ios-ss-ring" style="--pct:' + pct + '"><span class="ios-ss-ring-val">' + pct + '%</span></div>' +
        '</div>' +
      '</div>' +`;

const headRepl = `'<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
        '<div class="ios-merge-head-info">' +
          '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Daily Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +
          (window.historyEditMode ?
            '<button id="btn-save-history" onclick="window.saveHistoryChanges(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" style="background:#10b981; margin-right:8px; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 14px; cursor:pointer; font-size:0.85rem;">Save Changes</button>' +
            '<button onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:99px; font-weight:bold; padding:6px 14px; cursor:pointer; font-size:0.85rem;">Cancel</button>'
          :
            '<button onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#3b82f6; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 14px; cursor:pointer; font-size:0.85rem;">✏️ Edit Snapshot</button>' +
            '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
              '<span>Delete Date</span>' +
            '</button>'
          ) +
          '<div class="ios-ss-ring" style="--pct:' + pct + '"><span class="ios-ss-ring-val">' + pct + '%</span></div>' +
        '</div>' +
      '</div>' +`;

if (content.includes(headFind)) {
  content = content.replace(headFind, headRepl);
  console.log("✓ Applied premium head with Edit button to daily snapshot");
} else {
  console.log("✗ Could not find head target - check manually");
}

// =============================================
// FEATURE 5: Edit/Save functions + Premium KPI
// =============================================
const kpiFind = `'<div class="ios-ss-kpi">' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized</div><div class="ios-ss-kpi-value k-total">' + (totalAuth || totalExist) + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing</div><div class="ios-ss-kpi-value k-existing">' + totalExist + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present</div><div class="ios-ss-kpi-value k-present">' + totalPresent + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent (from Authorize Manpower)</div><div class="ios-ss-kpi-value k-absent">' + totalAbsent + '</div></div>' +
      '</div>' +`;

const kpiRepl = `'<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
        '<div><span>Authorized</span><b class="k-authorized">' + (totalAuth || totalExist) + '</b></div>' +
        '<div><span>Existing</span><b class="k-existing">' + totalExist + '</b></div>' +
        '<div><span>Present</span><b class="k-present">' + totalPresent + '</b></div>' +
        '<div><span>Absent</span><b class="k-absent">' + totalAbsent + '</b></div>' +
      '</div>' +`;

if (content.includes(kpiFind)) {
  content = content.replace(kpiFind, kpiRepl);
  console.log("✓ Applied premium KPI grid");
} else {
  console.log("✗ KPI target not found");
}

// Inject global edit functions + state tracking at start of _loadHistoryForDate
const loadHistTarget = `window._loadHistoryForDate = function(dateStr) {`;
const loadHistReplace = `window.historyEditMode = false;
window.currentHistoryState = null;

window.toggleHistoryEditMode = function() {
  window.historyEditMode = !window.historyEditMode;
  if (!window.historySelectedDate || !window.currentHistoryState) return;
  var viewer = document.getElementById('history-data-viewer');
  if (viewer) _renderHistoryState(window.historySelectedDate, window.currentHistoryState, viewer);
};

window.saveHistoryChanges = function(dateStr) {
  if (!window.currentHistoryState) return;
  if (!confirm('Save changes to this snapshot?\\n\\nThis will update the data in Firebase and affect the compiled Excel.')) return;
  var inputs = document.querySelectorAll('.ios-hm-edit-input');
  inputs.forEach(function(input) {
    var pageId = input.getAttribute('data-page');
    var group = input.getAttribute('data-group');
    var rKey = input.getAttribute('data-rkey');
    var field = input.getAttribute('data-field');
    var val = parseInt(input.value); if (isNaN(val)) val = 0;
    if (window.currentHistoryState[pageId] && window.currentHistoryState[pageId][group]) {
      var rowsData = window.currentHistoryState[pageId][group];
      if (Array.isArray(rowsData)) { if (rowsData[parseInt(rKey)]) rowsData[parseInt(rKey)][field] = val; }
      else if (rowsData[rKey]) rowsData[rKey][field] = val;
    }
  });
  var btn = document.getElementById('btn-save-history');
  if (btn) btn.textContent = 'Saving…';
  window.firebaseDb.ref('mep_attendance_history/' + dateStr).set(window.currentHistoryState).then(function() {
    alert('✅ Snapshot updated successfully!');
    window.historyEditMode = false;
    var viewer = document.getElementById('history-data-viewer');
    if (viewer) _renderHistoryState(dateStr, window.currentHistoryState, viewer);
  }).catch(function(err) {
    alert('Error saving: ' + err.message);
    if (btn) btn.textContent = 'Save Changes';
  });
};

window._loadHistoryForDate = function(dateStr) {`;

content = content.replace(loadHistTarget, loadHistReplace);
console.log("✓ Injected Edit/Save functions and state tracking");

// Patch _loadHistoryForDate to store state
content = content.replace(
  `        const state = snapshot.val();
        _renderHistoryState(dateStr, state, viewer);`,
  `        const state = snapshot.val();
        window.currentHistoryState = state;
        window.historyEditMode = false;
        _renderHistoryState(dateStr, state, viewer);`
);
console.log("✓ Patched _loadHistoryForDate to store currentHistoryState");

// =============================================
// FEATURE 6: Excel Premium Styling (Times New Roman)
// =============================================
content = content.replace(
  /font-family: 'Times New Roman', Times, serif; font-size: 10pt;/g,
  "font-family: 'Times New Roman', Times, serif; font-size: 11pt;"
);

// Premium header color
content = content.replace(
  /background-color: #1e3a5f;/g,
  "background-color: #020617;"
);

console.log("✓ Applied Times New Roman and premium Excel styles");

// =============================================
// SAVE THE RESULT
// =============================================
fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);
console.log("\n✅ ALL DONE! history.js and history.min.js updated with ALL features:");
console.log("  1. Excel: Force-include Fan Sada Shapla Supervisor + Fan Assemble Jr. Officer");
console.log("  2. UI: Rojonigondha+Shapla merged tab button");
console.log("  3. UI: Premium daily snapshot cards (ios-merge-card)");
console.log("  4. UI: ✏️ Edit Snapshot button + Save/Cancel flow");
console.log("  5. Firebase: Save edited snapshot directly to Firebase");
console.log("  6. Excel: Times New Roman font + premium dark header");
