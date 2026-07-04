const fs = require('fs');

let content = fs.readFileSync('history.js', 'utf8');
content = content.replace(/\\r\\n/g, '\\n');

function replaceStr(desc, findReg, repStr) {
  if (!findReg.test(content)) {
    console.error("COULD NOT FIND:", desc);
  } else {
    content = content.replace(findReg, repStr);
    console.log("REPLACED:", desc);
  }
}

// 1. Clean up header & Add Viewer Tabs
// We'll replace the entire innerHTML template for modal setup.
// From `<div class="ios-hm-header-actions">` up to `</section>`
replaceStr(
  "Layout HTML",
  /<div class="ios-hm-header-actions">[\s\S]*?<\/section>/,
  `<div class="ios-hm-header-actions">
          <button class="ios-hm-close" onclick="window.closeHistoryModal()" aria-label="Close">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="ios-hm-body">
        <aside class="ios-hm-sidebar">
          <div class="ios-hm-sidebar-eyebrow" aria-hidden="true">Admin Archive</div>
          <div class="ios-hm-month-nav">
            <button class="ios-hm-nav-btn" onclick="window.changeHistoryMonth(-1)" aria-label="Previous month">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <h3 id="history-month-year" class="ios-hm-month-label">…</h3>
            <button class="ios-hm-nav-btn" onclick="window.changeHistoryMonth(1)" aria-label="Next month">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <div class="ios-hm-weekdays">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div id="history-calendar-grid" class="ios-hm-grid"></div>

          <div class="ios-hm-legend">
            <span class="ios-hm-legend-dot"></span>Green dots indicate saved admin snapshots
          </div>
          
          <div class="ios-hm-sidebar-footer">
            <button id="btn-admin-compile-excel" class="admin-premium-btn ios-global-btn" onclick="window.downloadCompleteMonthlyHistoryExcel()" type="button" title="Compile Excel for current month">
              <svg class="admin-premium-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Compile Excel</span>
            </button>
            <button id="btn-admin-monthly-chart" class="admin-premium-btn ios-global-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #047857;" onclick="window.generateMonthlyChart()" type="button" title="View Monthly Pie Chart">
              <svg class="admin-premium-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              <span>Pie Chart</span>
            </button>
          </div>
        </aside>

        <section class="ios-hm-viewer-wrapper">
          <div class="ios-hm-view-tabs">
            <button id="fan-merge-history-btn-default" class="ios-hm-tab-btn is-active" onclick="window.showDefaultMergedHistory()" type="button">
              Daily Snapshot
            </button>
            <button id="fan-merge-history-btn" class="ios-hm-tab-btn" onclick="window.showFanAssembleDimmerMergedHistory()" type="button">
              Fan Assemble + Dimmer
            </button>
            <button id="fan-roj-shapla-merge-history-btn" class="ios-hm-tab-btn" onclick="window.showFanRojonigondhaShaplaMergedHistory()" type="button">
              Rojonigondha + Shapla
            </button>
          </div>
          <div class="ios-hm-viewer" id="history-data-viewer">
            <div class="ios-hm-empty">
              <div class="ios-hm-empty-ico" aria-hidden="true">
                <span class="ios-hm-empty-ring"></span>
                <span class="ios-hm-empty-ring ios-hm-empty-ring-2"></span>
                <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="8.5" cy="14.5" r="1" fill="currentColor"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor"/></svg>
              </div>
              <div class="ios-hm-empty-text">Select a date to view admin history</div>
              <div class="ios-hm-empty-hint">Days with a glowing dot have saved snapshots</div>
            </div>
          </div>
        </section>`
);

// 2. We need a `showDefaultMergedHistory` function to reset the merge mode.
replaceStr(
  "showDefaultMergedHistory",
  /window\.showFanAssembleDimmerMergedHistory = function\(\) \{/,
  `window.showDefaultMergedHistory = function() {
  window.historyMergedMode = false;
  updateMergedHistoryButtonState();
  if (window.historySelectedDate) {
    window._loadHistoryForDate(window.historySelectedDate);
  } else {
    const viewer = document.getElementById('history-data-viewer');
    if (viewer) {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-ico" aria-hidden="true"><span class="ios-hm-empty-ring"></span><span class="ios-hm-empty-ring ios-hm-empty-ring-2"></span><svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="8.5" cy="14.5" r="1" fill="currentColor"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor"/></svg></div><div class="ios-hm-empty-text">Select a date to view admin history</div><div class="ios-hm-empty-hint">Days with a glowing dot have saved snapshots</div></div>';
    }
  }
};

window.showFanAssembleDimmerMergedHistory = function() {`
);

// 3. Fix updateMergedHistoryButtonState to toggle active states correctly
replaceStr(
  "updateMergedHistoryButtonState",
  /function updateMergedHistoryButtonState\(\) \{[\s\S]*?\}\s*window\._loadHistoryForDate/,
  `function updateMergedHistoryButtonState() {
  const btnDef = document.getElementById('fan-merge-history-btn-default');
  const btnAsm = document.getElementById('fan-merge-history-btn');
  const btnRoj = document.getElementById('fan-roj-shapla-merge-history-btn');
  
  if (btnDef) btnDef.classList.toggle('is-active', !window.historyMergedMode);
  if (btnAsm) btnAsm.classList.toggle('is-active', window.historyMergedMode === 'assemble_dimmer');
  if (btnRoj) btnRoj.classList.toggle('is-active', window.historyMergedMode === 'roj_shapla');
}
window._loadHistoryForDate`
);


// 4. In showFanAssembleDimmerMergedHistory, it resets mode if already active. We shouldn't reset, we should just set it since it's a tab now.
replaceStr(
  "Mode set in Assemble Dimmer",
  /window\.historyMergedMode = window\.historyMergedMode === 'assemble_dimmer' \? false : 'assemble_dimmer';\s*updateMergedHistoryButtonState\(\);\s*if \(!window\.historyMergedMode\) \{[\s\S]*?return;\s*\}/,
  `if (window.historyMergedMode === 'assemble_dimmer') return; // already active
  window.historyMergedMode = 'assemble_dimmer';
  updateMergedHistoryButtonState();`
);

replaceStr(
  "Mode set in Roj Shapla",
  /window\.historyMergedMode = window\.historyMergedMode === 'roj_shapla' \? false : 'roj_shapla';\s*updateMergedHistoryButtonState\(\);\s*if \(!window\.historyMergedMode\) \{[\s\S]*?return;\s*\}/,
  `if (window.historyMergedMode === 'roj_shapla') return; // already active
  window.historyMergedMode = 'roj_shapla';
  updateMergedHistoryButtonState();`
);


// 5. Replace Viewer Headers for Merged (Assemble + Dimmer)
// We need to match the entire `container.innerHTML = ...` up to `setTimeout`
replaceStr(
  "Viewer HTML Assemble Dimmer",
  /container\.innerHTML =\s*'<div class="ios-merge-head">' \+[\s\S]*?<\/div>';/,
  `container.innerHTML =
    '<div class="ios-merge-head">' +
      '<div class="ios-merge-head-info">' +
        '<h3 class="ios-ss-head-title">Daily Worker Merge</h3>' +
        '<div class="ios-ss-head-date">' + historyEscapeHtml(formatHistoryDate(dateStr)) + ' &middot; Fan Assemble Worker + Fan Dimmer Worker</div>' +
      '</div>' +
      '<div class="ios-ss-ring" style="--pct:' + totalPct + '"><span class="ios-ss-ring-val">' + totalPct + '%</span></div>' +
    '</div>' +
    '<div class="ios-export-toolbar">' +
      '<div class="ios-export-group">' +
        '<select id="merged-pdf-month-select" class="ios-export-select">' +
          '<option value="" disabled selected>Select Month...</option>' +
        '</select>' +
        '<button id="btn-export-pdf" onclick="window.downloadMonthlyHistoryPDF()" class="ios-export-btn ios-export-pdf" type="button" title="Download PDF">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>' +
          '<span>PDF</span>' +
        '</button>' +
        '<button id="btn-export-excel" onclick="window.downloadMonthlyHistoryExcel()" class="ios-export-btn ios-export-excel" type="button" title="Download Merged Excel">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
          '<span>Excel Merge</span>' +
        '</button>' +
        '<button id="btn-export-complete-excel" onclick="window.downloadCompleteMonthlyHistoryExcel()" class="ios-export-btn ios-export-complete" type="button" title="Download Complete Excel">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
          '<span>Complete Excel</span>' +
        '</button>' +
      '</div>' +
      '<button class="ios-export-btn ios-export-delete" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" title="Delete this date snapshot">' +
        '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
        '<span>Delete</span>' +
      '</button>' +
    '</div>' +
    '<div class="ios-merge-kpis">' +
      '<div><span>Type</span><b>Worker</b></div>' +
      '<div><span>Authorized</span><b class="k-authorized">' + merged.totals.authorized + '</b></div>' +
      '<div><span>Existing</span><b class="k-existing">' + merged.totals.existing + '</b></div>' +
      '<div><span>Present</span><b class="k-present">' + merged.totals.present + '</b></div>' +
      '<div><span>Absent (from Authorize Manpower)</span><b class="k-absent">' + merged.totals.absent + '</b></div>' +
    '</div>' +
    '<div class="ios-merge-list">' + rowCards + '</div>';`
);

// 6. Replace Viewer Headers for Merged (Roj Shapla)
replaceStr(
  "Viewer HTML Roj Shapla",
  /container\.innerHTML =\s*'<div class="ios-merge-head">' \+[\s\S]*?<\/div>';/g, // Should match the second one now
  `container.innerHTML =
    '<div class="ios-merge-head">' +
      '<div class="ios-merge-head-info">' +
        '<h3 class="ios-ss-head-title">Daily Worker Merge</h3>' +
        '<div class="ios-ss-head-date">' + historyEscapeHtml(formatHistoryDate(dateStr)) + ' &middot; Fan Rojonigondha Worker + Fan Sada Shapla Worker</div>' +
      '</div>' +
      '<div class="ios-ss-ring" style="--pct:' + totalPct + '"><span class="ios-ss-ring-val">' + totalPct + '%</span></div>' +
    '</div>' +
    '<div class="ios-export-toolbar">' +
      '<div class="ios-export-group">' +
        '<select id="merged-pdf-month-select" class="ios-export-select">' +
          '<option value="" disabled selected>Select Month...</option>' +
        '</select>' +
        '<button id="btn-export-pdf" onclick="window.downloadMonthlyHistoryPDF()" class="ios-export-btn ios-export-pdf" type="button" title="Download PDF">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>' +
          '<span>PDF</span>' +
        '</button>' +
        '<button id="btn-export-excel" onclick="window.downloadMonthlyHistoryExcel()" class="ios-export-btn ios-export-excel" type="button" title="Download Merged Excel">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
          '<span>Excel Merge</span>' +
        '</button>' +
        '<button id="btn-export-complete-excel" onclick="window.downloadCompleteMonthlyHistoryExcel()" class="ios-export-btn ios-export-complete" type="button" title="Download Complete Excel">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
          '<span>Complete Excel</span>' +
        '</button>' +
      '</div>' +
      '<button class="ios-export-btn ios-export-delete" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" title="Delete this date snapshot">' +
        '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
        '<span>Delete</span>' +
      '</button>' +
    '</div>' +
    '<div class="ios-merge-kpis">' +
      '<div><span>Type</span><b>Worker</b></div>' +
      '<div><span>Authorized</span><b class="k-authorized">' + merged.totals.authorized + '</b></div>' +
      '<div><span>Existing</span><b class="k-existing">' + merged.totals.existing + '</b></div>' +
      '<div><span>Present</span><b class="k-present">' + merged.totals.present + '</b></div>' +
      '<div><span>Absent (from Authorize Manpower)</span><b class="k-absent">' + merged.totals.absent + '</b></div>' +
    '</div>' +
    '<div class="ios-merge-list">' + rowCards + '</div>';`
);

content = content.replace(/\\n/g, '\\r\\n');
fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);

// CSS Updates
let cssContent = fs.readFileSync('style.css', 'utf8');
cssContent = cssContent.replace(/\\r\\n/g, '\\n');

// We append the new CSS at the end
const newCSS = `
/* --- NEW ADMIN MODAL LAYOUT STYLES --- */

/* Sidebar Footer */
.ios-hm-sidebar {
  display: flex;
  flex-direction: column;
}
.ios-hm-sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(60,30,90,0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ios-global-btn {
  width: 100%;
  justify-content: center;
  padding: 10px 12px;
}

/* Viewer Wrapper & View Tabs */
.ios-hm-viewer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.4);
}
.ios-hm-view-tabs {
  display: flex;
  padding: 12px 20px;
  gap: 8px;
  border-bottom: 1px solid rgba(60,30,90,0.08);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow-x: auto;
}
.ios-hm-tab-btn {
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid transparent;
  color: #4c1d95;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 99px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.ios-hm-tab-btn:hover {
  background: rgba(139, 92, 246, 0.15);
}
.ios-hm-tab-btn.is-active {
  background: #7c3aed;
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
}

.ios-hm-viewer {
  flex: 1;
}

/* Export Toolbar */
.ios-export-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
}
.ios-export-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ios-export-btn, .ios-export-select {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  transition: all 0.2s;
  cursor: pointer;
  outline: none;
}
.ios-export-select {
  border: 1px solid rgba(139, 92, 246, 0.22);
  background: white;
  color: #1c1134;
}
.ios-export-select:hover, .ios-export-select:focus {
  border-color: #8b5cf6;
}
.ios-export-pdf {
  color: #6d28d9;
  background: rgba(245, 240, 255, 0.82);
  border: 1px solid rgba(139, 92, 246, 0.22);
}
.ios-export-pdf:hover {
  border-color: #8b5cf6;
  background: rgba(245, 240, 255, 0.95);
}
.ios-export-excel {
  color: #047857;
  background: rgba(209, 250, 229, 0.82);
  border: 1px solid rgba(16, 185, 129, 0.22);
}
.ios-export-excel:hover {
  border-color: #10b981;
  background: rgba(209, 250, 229, 0.95);
}
.ios-export-complete {
  color: #b45309;
  background: rgba(254, 243, 199, 0.82);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.ios-export-complete:hover {
  border-color: #f59e0b;
  background: rgba(254, 243, 199, 0.95);
}
.ios-export-delete {
  color: #ef4444;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.ios-export-delete:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
}

/* Adjust ios-merge-head */
.ios-merge-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0; 
}
.ios-merge-head-info {
  flex: 1;
}

@media (max-width: 768px) {
  .ios-hm-sidebar-footer {
    padding-top: 12px;
    margin-top: 12px;
    flex-direction: row;
  }
  .ios-export-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .ios-export-group {
    justify-content: stretch;
  }
  .ios-export-group > * {
    flex: 1;
  }
}
`;

cssContent += "\\n" + newCSS;
cssContent = cssContent.replace(/\\n/g, '\\r\\n');

fs.writeFileSync('style.css', cssContent);
fs.writeFileSync('style.min.css', cssContent);

console.log('Update UI complete.');
