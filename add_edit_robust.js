const fs = require('fs');

function robustInject(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let originalContent = content;

  // 1. In _loadHistoryForDate
  // Match: const state = snapshot.val();\s*_renderHistoryState(dateStr, state, viewer);
  content = content.replace(
    /const state = snapshot\.val\(\);\s*_renderHistoryState\(dateStr, state, viewer\);/g,
    "const state = snapshot.val();\n        window.currentHistoryState = state;\n        window.historyEditMode = false;\n        _renderHistoryState(dateStr, state, viewer);"
  );

  // 2. In _renderHistoryState loop update
  // We need to replace the Object.values / Array.isArray logic that was originally there.
  // Original:
  // if (!Array.isArray(rows)) {
  //   if (typeof rows === 'object') { rows = Object.values(rows); } else { return; }
  // }
  // if (rows.length === 0) return;
  // var groupRows = [];
  // var secExist = 0, secPresent = 0, secAbsent = 0;
  // rows.forEach(function(row) {
  
  // Let's find this chunk.
  const regexLoop = /if \(!Array\.isArray\(rows\)\) \{[\s\S]*?rows\.forEach\(function\(row\) \{/g;
  content = content.replace(regexLoop, function(match) {
    return `var rowsObj = pageData[groupName];
        if (!rowsObj || typeof rowsObj !== 'object') return;

        var groupRows = [];
        var secExist = 0, secPresent = 0, secAbsent = 0;
        
        Object.keys(rowsObj).forEach(function(rKey) {
          var row = rowsObj[rKey];`;
  });

  // Also replace the push to include rKey, pageId, groupName.
  // groupRows.push({desig: desig, existing: existing, present: present, absent: absent});
  content = content.replace(
    /groupRows\.push\(\{desig: desig, existing: existing, present: present, absent: absent\}\);/g,
    "groupRows.push({desig: desig, existing: existing, present: present, absent: absent, authorized: authorized, pageId: pageId, groupName: groupName, rKey: rKey});"
  );

  // 3. Card rendering
  // Original rowsHtml += '<article ...'
  const regexCard = /rowsHtml \+=\s*'<article class="ios-merge-card ios-ss-premium-card" style="margin: 8px 14px; padding: 12px 14px;">' \+[\s\S]*?'<\/article>';/g;
  content = content.replace(regexCard, function(match) {
    return `if (window.historyEditMode) {
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
            ${match}
          }`;
  });

  // 4. Header buttons
  // Match: '<div class="ios-ss-head-actions" style="margin-left: auto;">' +
  //        '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\'' + historyEscapeHtml(dateStr) + '\')" type="button">'
  
  const regexHead = /'<div class="ios-ss-head-actions" style="margin-left: auto;">' \+\s*'<button class="ios-ss-delete-btn" onclick="window\.deleteHistoryDate\('' \+ historyEscapeHtml\(dateStr\) \+ ''\)" type="button">'/g;
  
  content = content.replace(regexHead, `'<div class="ios-ss-head-actions" style="margin-left: auto;">' +
          (window.historyEditMode ? 
            '<button id="btn-save-history" class="admin-premium-btn" onclick="window.saveHistoryChanges(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button" style="background:#10b981; margin-right:8px; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Save Changes</span></button>' +
            '<button class="ios-ss-delete-btn" onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#f1f5f9; color:#475569; border:none; border-radius:99px; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Cancel</span></button>' 
          :
            '<button class="admin-premium-btn" onclick="window.toggleHistoryEditMode()" type="button" style="margin-right:8px; background:#3b82f6; border:none; border-radius:99px; color:#fff; font-weight:bold; padding:6px 12px; cursor:pointer;"><span>Edit Snapshot</span></button>' +
            '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\\'' + historyEscapeHtml(dateStr) + '\\')" type="button">'`);

  if (content !== originalContent) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' updated via robust injection!');
  } else {
    console.log(filename + ' NO CHANGES made. Regex might have failed.');
  }
}

robustInject('history.js');
robustInject('history.min.js');
