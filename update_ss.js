const fs = require('fs');

let content = fs.readFileSync('history.js', 'utf8');
content = content.replace(/\\r\\n/g, '\\n');

// 1. Replace rowsHtml inside _renderHistoryState
const rowRegex = /rowsHtml \+=[\\s\\S]*?<div class="ios-ss-row">[\\s\\S]*?<\/div>';/g;
if (rowRegex.test(content)) {
  content = content.replace(rowRegex, `rowsHtml +=
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
            '</article>';`);
  console.log('REPLACED rowsHtml');
} else {
  console.log('COULD NOT FIND rowsHtml');
}

// 2. Replace KPI HTML
const kpiRegex = /'<div class="ios-ss-kpi">[\\s\\S]*?<\/div>' \+/g;
if (kpiRegex.test(content)) {
  content = content.replace(kpiRegex, `'<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
        '<div><span>Authorized</span><b class="k-authorized">' + (totalAuth || totalExist) + '</b></div>' +
        '<div><span>Existing</span><b class="k-existing">' + totalExist + '</b></div>' +
        '<div><span>Present</span><b class="k-present">' + totalPresent + '</b></div>' +
        '<div><span>Absent</span><b class="k-absent">' + totalAbsent + '</b></div>' +
      '</div>' +`);
  console.log('REPLACED KPI Html');
} else {
  console.log('COULD NOT FIND KPI Html');
}

// 3. Update Title header
const headRegex = /'<div class="ios-ss-head">' \+[\\s\\S]*?'<div class="ios-ss-head-actions">' \+/g;
if (headRegex.test(content)) {
  content = content.replace(headRegex, `'<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
        '<div class="ios-merge-head-info">' +
          '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Daily Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +`);
  console.log('REPLACED Head Html');
} else {
  console.log('COULD NOT FIND Head Html');
}

content = content.replace(/\\n/g, '\\r\\n');
fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);
