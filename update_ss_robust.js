const fs = require('fs');

let content = fs.readFileSync('history.js', 'utf8');
content = content.replace(/\\r\\n/g, '\\n');

// Replace Rows Html
let startRows = content.indexOf('rowsHtml +=\\n            \\'<div class="ios-ss-row">\\' +');
let endRows = content.indexOf('</div>\\';\\n        });', startRows) + 8;
if (startRows > -1 && endRows > 8) {
  const replacement = `rowsHtml +=
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
  content = content.substring(0, startRows) + replacement + content.substring(endRows);
  console.log('REPLACED rowsHtml');
} else {
  console.log('COULD NOT FIND rowsHtml, start:', startRows);
}

// Replace KPI HTML
let startKPI = content.indexOf('\\'<div class="ios-ss-kpi">\\' +');
let endKPI = content.indexOf('\\'</div>\\' +\\n      \\'<div class="ios-ss-sections">\\'', startKPI);
if (startKPI > -1 && endKPI > -1) {
  const replacement = `'<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
        '<div><span>Authorized</span><b class="k-authorized">' + (totalAuth || totalExist) + '</b></div>' +
        '<div><span>Existing</span><b class="k-existing">' + totalExist + '</b></div>' +
        '<div><span>Present</span><b class="k-present">' + totalPresent + '</b></div>' +
        '<div><span>Absent</span><b class="k-absent">' + totalAbsent + '</b></div>' +
      '</div>' +`;
  content = content.substring(0, startKPI) + replacement + content.substring(endKPI + 8);
  console.log('REPLACED KPI Html');
} else {
  console.log('COULD NOT FIND KPI Html, start:', startKPI);
}

// Replace Head HTML
let startHead = content.indexOf('\\'<div class="ios-ss-head">\\' +');
let endHead = content.indexOf('\\'<div class="ios-ss-head-actions">\\' +', startHead);
if (startHead > -1 && endHead > -1) {
  const replacement = `'<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
        '<div class="ios-merge-head-info">' +
          '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Daily Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +`;
  content = content.substring(0, startHead) + replacement + content.substring(endHead + 37);
  console.log('REPLACED Head Html');
} else {
  console.log('COULD NOT FIND Head Html, start:', startHead);
}

content = content.replace(/\\n/g, '\\r\\n');
fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);
