const fs = require('fs');

let historyContent = fs.readFileSync('history.js', 'utf8');
historyContent = historyContent.replace(/\\r\\n/g, '\\n');

// 1. Replace rowsHtml inside _renderHistoryState
const oldRowsHtml = `rowsHtml +=
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
            '</div>';`;

const newRowsHtml = `rowsHtml +=
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
            '</article>';`;

historyContent = historyContent.replace(oldRowsHtml, newRowsHtml);

// 2. Replace KPI HTML
const oldKpiHtml = `      '<div class="ios-ss-kpi">' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized</div><div class="ios-ss-kpi-value k-total">' + (totalAuth || totalExist) + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing</div><div class="ios-ss-kpi-value k-existing">' + totalExist + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present</div><div class="ios-ss-kpi-value k-present">' + totalPresent + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent (from Authorize Manpower)</div><div class="ios-ss-kpi-value k-absent">' + totalAbsent + '</div></div>' +
      '</div>' +`;

const newKpiHtml = `      '<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
        '<div><span>Authorized</span><b class="k-authorized">' + (totalAuth || totalExist) + '</b></div>' +
        '<div><span>Existing</span><b class="k-existing">' + totalExist + '</b></div>' +
        '<div><span>Present</span><b class="k-present">' + totalPresent + '</b></div>' +
        '<div><span>Absent</span><b class="k-absent">' + totalAbsent + '</b></div>' +
      '</div>' +`;

historyContent = historyContent.replace(oldKpiHtml, newKpiHtml);

// 3. Update Title header class inside _renderHistoryState
const oldHead = `      '<div class="ios-ss-head">' +
        '<div>' +
          '<h3 class="ios-ss-head-title">Attendance Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions">' +`;

const newHead = `      '<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
        '<div class="ios-merge-head-info">' +
          '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Daily Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +`;

historyContent = historyContent.replace(oldHead, newHead);

historyContent = historyContent.replace(/\\n/g, '\\r\\n');
fs.writeFileSync('history.js', historyContent);
fs.writeFileSync('history.min.js', historyContent);


// CSS Updates
let cssContent = fs.readFileSync('style.css', 'utf8');
cssContent = cssContent.replace(/\\r\\n/g, '\\n');

const newCSS = `
/* --- DAILY SNAPSHOT PREMIUM REDESIGN --- */

.ios-ss-premium-head {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(60, 30, 90, 0.08);
}

.ios-ss-premium-kpis {
  gap: 12px;
}
@media (max-width: 600px) {
  .ios-ss-premium-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

.ios-ss-section {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px -8px rgba(60, 30, 90, 0.12), inset 0 0 0 1px rgba(255,255,255,0.7);
  position: relative;
  margin-bottom: 16px;
}

.ios-ss-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 240, 255, 0.8), rgba(255, 255, 255, 0.9));
  border-bottom: 1px solid rgba(60, 30, 90, 0.05);
}

.ios-ss-sec-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #4c1d95;
  letter-spacing: -0.01em;
}

.ios-ss-sec-summary {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b5b7f;
  background: rgba(255,255,255,0.8);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(60, 30, 90, 0.05);
}

.ios-ss-rows {
  padding-bottom: 8px;
}

.ios-ss-premium-card {
  box-shadow: 0 2px 8px -2px rgba(60, 30, 90, 0.08);
  border: 1px solid rgba(255,255,255,0.5);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.ios-ss-premium-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 8px 20px -6px rgba(60, 30, 90, 0.15);
}

.ios-ss-premium-card .ios-merge-date {
  color: #2e1065 !important;
  font-weight: 800 !important;
  font-size: 1rem !important;
}

`;

cssContent += "\\n" + newCSS;
cssContent = cssContent.replace(/\\n/g, '\\r\\n');

fs.writeFileSync('style.css', cssContent);
fs.writeFileSync('style.min.css', cssContent);

console.log('Daily Snapshot Redesign Complete!');
