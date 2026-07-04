const fs = require('fs');

let content = fs.readFileSync('history.js', 'utf8');

// 1. Replace rowsHtml inside _renderHistoryState
content = content.replace(
  /'<div class="ios-ss-row">' \+\s+'<div class="ios-ss-desig">' \+\s+'<div class="ios-ss-desig-name">' \+ historyEscapeHtml\(r\.desig\) \+ '<\/div>' \+\s+'<div class="ios-ss-mini-meta">' \+\s+'<span class="ios-ss-mini-dot ' \+ getAttendanceTone\(pct\) \+ '"><\/span>' \+\s+'<span>' \+ pct \+ '% present<\/span>' \+\s+'<\/div>' \+\s+'<\/div>' \+\s+'<div class="ios-ss-chips">' \+\s+'<span class="ios-ss-chip c-exist"><span class="lbl">E<\/span>' \+ r\.existing \+ '<\/span>' \+\s+'<span class="ios-ss-chip c-present"><span class="lbl">P<\/span>' \+ r\.present \+ '<\/span>' \+\s+'<span class="ios-ss-chip c-absent' \+ \(r\.absent === 0 \? ' zero' : ''\) \+ '"><span class="lbl">A<\/span>' \+ r\.absent \+ '<\/span>' \+\s+'<\/div>' \+\s+'<\/div>';/g,
  `'<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px;">' +
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
            '</article>';`
);

// 2. Replace KPI HTML
content = content.replace(
  /'<div class="ios-ss-kpi">' \+\s+'<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized<\/div><div class="ios-ss-kpi-value k-total">' \+ \(totalAuth \|\| totalExist\) \+ '<\/div><\/div>' \+\s+'<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing<\/div><div class="ios-ss-kpi-value k-existing">' \+ totalExist \+ '<\/div><\/div>' \+\s+'<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present<\/div><div class="ios-ss-kpi-value k-present">' \+ totalPresent \+ '<\/div><\/div>' \+\s+'<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent \(from Authorize Manpower\)<\/div><div class="ios-ss-kpi-value k-absent">' \+ totalAbsent \+ '<\/div><\/div>' \+\s+'<\/div>' \+/g,
  `'<div class="ios-merge-kpis ios-ss-premium-kpis" style="margin: 0 0 24px 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">' +
        '<div><span>Authorized</span><b class="k-authorized">' + (totalAuth || totalExist) + '</b></div>' +
        '<div><span>Existing</span><b class="k-existing">' + totalExist + '</b></div>' +
        '<div><span>Present</span><b class="k-present">' + totalPresent + '</b></div>' +
        '<div><span>Absent</span><b class="k-absent">' + totalAbsent + '</b></div>' +
      '</div>' +`
);

// 3. Update Title header
content = content.replace(
  /'<div class="ios-ss-head">' \+\s+'<div>' \+\s+'<h3 class="ios-ss-head-title">Attendance Snapshot<\/h3>' \+\s+'<div class="ios-ss-head-date">' \+ formattedDate \+ '<\/div>' \+\s+'<\/div>' \+\s+'<div class="ios-ss-head-actions">' \+/g,
  `'<div class="ios-merge-head ios-ss-premium-head" style="margin-bottom: 20px;">' +
        '<div class="ios-merge-head-info">' +
          '<h3 class="ios-ss-head-title" style="font-size: 1.3rem;">Daily Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions" style="margin-left: auto;">' +`
);

fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);
console.log('REPLACED WITH REGEX');
