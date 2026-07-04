const fs = require('fs');
let code = fs.readFileSync('history.js', 'utf8');

const targetStr = `    results.forEach(function(res) {
      const parts = res.dateStr.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  
      const isFriday = dateObj.getDay() === 5;
      const rowBg = isFriday ? '#fee2e2' : '#ffffff';
      const cellBorder = "1px solid #cbd5e1";

      const merged = window.historyMergedMode === 'roj_shapla' ? collectFanRojonigondhaShaplaTotals(res.state) : collectFanAssembleDimmerTotals(res.state);
      const auth = merged.totals.authorized || 0;
      const exist = merged.totals.existing || 0;
      const pres = merged.totals.present || 0;
      const abs = merged.totals.absent || 0;
      const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

      totalAuthSum += auth;
      totalExistSum += exist;
      totalPresentSum += pres;
      totalAbsentSum += abs;

      html += \`<tr>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${rowBg};">\${formattedDate}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${rowBg};">\${dayName}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? '#fecaca' : '#ecfdf5'}; mso-number-format:'0';">\${auth}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? '#fecaca' : '#d1fae5'}; mso-number-format:'0';">\${exist}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">\${pres}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">\${abs}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; font-weight: bold; background-color: \${rowBg};">\${pct}%</td>
      </tr>\`;
    });

    const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;
    const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
    const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
    
    html += \`
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2" style="background-color: #0f766e; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">Total / Average</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${avgAuth}</th>
          <th style="background-color: #cbd5e1; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${avgExist}</th>
          <th style="background-color: #a7f3d0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${totalPresentSum}</th>
          <th style="background-color: #ffedd5; color: #9a3412; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${totalAbsentSum}</th>
          <th style="background-color: #166534; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${overallPct}%</th>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>\`;`;

const replacementStr = `    results.forEach(function(res) {
      const parts = res.dateStr.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
      const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  
      const isFriday = dateObj.getDay() === 5;
      const cellBorder = "1px solid #94a3b8";
      const fridayBg = "#fbcfa9";

      const merged = window.historyMergedMode === 'roj_shapla' ? collectFanRojonigondhaShaplaTotals(res.state) : collectFanAssembleDimmerTotals(res.state);
      const auth = merged.totals.authorized || 0;
      const exist = merged.totals.existing || 0;
      const pres = merged.totals.present || 0;
      const abs = merged.totals.absent || 0;
      const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

      totalAuthSum += auth;
      totalExistSum += exist;
      totalPresentSum += pres;
      totalAbsentSum += abs;

      html += \`<tr>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${formattedDate}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${dayName}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'}; mso-number-format:'0';">\${auth}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'}; mso-number-format:'0';">\${exist}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#a7f3d0'}; mso-number-format:'0';">\${pres}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #c2410c; background-color: \${isFriday ? fridayBg : '#ffedd5'}; mso-number-format:'0';">\${abs}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; font-weight: bold; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${pct}%</td>
      </tr>\`;
    });

    const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;
    const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
    const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
    
    html += \`
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2" style="background-color: #047857; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">Total / Average</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${avgAuth}</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${avgExist}</th>
          <th style="background-color: #a7f3d0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${totalPresentSum}</th>
          <th style="background-color: #ffedd5; color: #c2410c; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${totalAbsentSum}</th>
          <th style="background-color: #064e3b; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${overallPct}%</th>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>\`;`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('history.js', code);
  fs.writeFileSync('history.min.js', code);
  console.log('Successfully styled Excel Merge to match screenshot.');
} else {
  console.log('Error: target string not found.');
}
\n
function collectFanRojonigondhaShaplaTotals(state) {
  const targetGroups = ["Fan Rojonigondha", "Fan Sada Shapla"];
  const totals = { authorized: 0, existing: 0, present: 0, absent: 0 };
  const workerRow = { designation: 'Worker', authorized: 0, existing: 0, present: 0, absent: 0 };

  targetGroups.forEach(function(groupName) {
    getHistoryRows(state, 'bikash', groupName).forEach(function(row) {
      if (!row || typeof row !== 'object') return;
      const designation = String(row.designation || '').trim();
      if (designation.toLowerCase() !== 'worker') return;
      const authorized = historyToCount(row.authorized);
      const existing = historyToCount(row.existing);
      const present = historyToCount(row.present);
      let absent = authorized - present;

      totals.authorized += authorized;
      totals.existing += existing;
      totals.present += present;
      totals.absent += absent;
      workerRow.authorized += authorized;
      workerRow.existing += existing;
      workerRow.present += present;
      workerRow.absent += absent;
    });
  });

  return {
    totals: totals,
    rows: workerRow.authorized > 0 || workerRow.existing > 0 || workerRow.present > 0 || workerRow.absent > 0 ? [workerRow] : []
  };
}

window.showFanRojonigondhaShaplaMergedHistory = function() {
  window.historyMergedMode = window.historyMergedMode === 'roj_shapla' ? false : 'roj_shapla';
  updateMergedHistoryButtonState();
  if (!window.historyMergedMode) {
    if (window.historySelectedDate) {
      window._loadHistoryForDate(window.historySelectedDate);
    }
    return;
  }

  const selectedDate = window.historySelectedDate || Array.from(window.savedHistoryDates || []).sort().reverse()[0];
  if (!selectedDate) {
    if (!window.savedHistoryDates || window.savedHistoryDates.size === 0) {
      window._fetchSavedHistoryDates(function() {
        const latestDate = Array.from(window.savedHistoryDates || []).sort().reverse()[0];
        if (latestDate) {
          window.historySelectedDate = latestDate;
          window.renderFanRojonigondhaShaplaMergedForDate(latestDate);
          return;
        }
        const viewer = document.getElementById('history-data-viewer');
        if (viewer) {
          viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No saved history found yet.</div><div class="ios-hm-empty-hint">Save attendance snapshots first, then open this merged history.</div></div>';
        }
      });
    }
    return;
  }
  window.historySelectedDate = selectedDate;
  window.renderFanRojonigondhaShaplaMergedForDate(selectedDate);
};

window.renderFanRojonigondhaShaplaMergedForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  window.historyMergedMode = 'roj_shapla';
  updateMergedHistoryButtonState();

  viewer.innerHTML = `<div class="ios-hm-loader"><div class="ios-hm-spinner"></div><div class="ios-hm-loader-text">Loading daily Worker merge…</div></div>`;

  const loadDailyMerged = function() {
    if (!window.firebaseDb) {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Firebase not connected</div><div class="ios-hm-empty-hint">Daily merged history needs saved Firebase snapshots.</div></div>';
      return;
    }

    window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        renderFanRojonigondhaShaplaMergedHistory(dateStr, snapshot.val(), viewer);
      } else {
        viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No snapshot found for ' + historyEscapeHtml(dateStr) + '.</div></div>';
      }
    }).catch(function(err) {
      console.error('Merged history load error:', err);
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Error loading merged history</div></div>';
    });
  };

  if (!window.savedHistoryDates || !window.savedHistoryDates.has(dateStr)) {
    window._fetchSavedHistoryDates(loadDailyMerged);
  } else {
    loadDailyMerged();
  }
};

function renderFanRojonigondhaShaplaMergedHistory(dateStr, state, container) {
  const merged = collectFanRojonigondhaShaplaTotals(state);
  if (merged.rows.length === 0) {
    container.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No Worker history found for Fan Rojonigondha or Fan Sada Shapla.</div></div>';
    return;
  }

  const totalPct = getAttendancePct(merged.totals.present, merged.totals.authorized);
  const rowCards = merged.rows.map(function(row) {
    const rowPct = getAttendancePct(row.present, row.authorized);
    return (
      '<article class="ios-merge-card">' +
        '<div class="ios-merge-card-main">' +
          '<div class="ios-merge-date">' + historyEscapeHtml(row.designation) + '</div>' +
          '<div class="ios-merge-title">' + row.present + '/' + row.existing + ' present</div>' +
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
    '<div class="ios-merge-head">' +
      '<div>' +
        '<h3 class="ios-ss-head-title">Daily Worker Merge</h3>' +
        '<div class="ios-ss-head-date">' + historyEscapeHtml(formatHistoryDate(dateStr)) + ' &middot; Fan Rojonigondha Worker + Fan Sada Shapla Worker</div>' +
      '</div>' +
      '<div class="ios-ss-head-actions">' +
        '<div style="display: inline-flex; align-items: center; gap: 6px; margin-right: 4px;">' +
          '<select id="merged-pdf-month-select" style="padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(139, 92, 246, 0.22); background: white; font-family: inherit; font-size: 0.72rem; font-weight: 700; color: #1c1134; outline: none; cursor: pointer; height: 32px; box-sizing: border-box; transition: border-color 0.2s;" onmouseover="this.style.borderColor=\'#8b5cf6\'" onmouseout="this.style.borderColor=\'rgba(139, 92, 246, 0.22)\'">' +
            '<option value="" disabled selected>Select Month...</option>' +
          '</select>' +
          '<button id="btn-export-pdf" onclick="window.downloadMonthlyHistoryPDF()" class="ios-ss-delete-btn" style="color: #6d28d9; background: rgba(245, 240, 255, 0.82); border: 1px solid rgba(139, 92, 246, 0.22); height: 32px; padding: 0 12px; font-weight: 800; font-size: 0.72rem; display: inline-flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; transition: all 0.2s;" onmouseover="this.style.borderColor=\'#8b5cf6\'; this.style.background=\'rgba(245, 240, 255, 0.95)\';" onmouseout="this.style.borderColor=\'rgba(139, 92, 246, 0.22)\'; this.style.background=\'rgba(245, 240, 255, 0.82)\';" type="button">' +
            '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>' +
            '<span>PDF</span>' +
          '</button>' +
          '<button id="btn-export-excel" onclick="window.downloadMonthlyHistoryExcel()" class="ios-ss-delete-btn" style="color: #047857; background: rgba(209, 250, 229, 0.82); border: 1px solid rgba(16, 185, 129, 0.22); height: 32px; padding: 0 12px; font-weight: 800; font-size: 0.72rem; display: inline-flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; transition: all 0.2s; margin-left: 4px;" onmouseover="this.style.borderColor=\'#10b981\'; this.style.background=\'rgba(209, 250, 229, 0.95)\';" onmouseout="this.style.borderColor=\'rgba(16, 185, 129, 0.22)\'; this.style.background=\'rgba(209, 250, 229, 0.82)\';" type="button" title="Download Merged Sections Only">' +
            '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
            '<span>Excel Merge</span>' +
          '</button>' +
          '<button id="btn-export-complete-excel" onclick="window.downloadCompleteMonthlyHistoryExcel()" class="admin-premium-btn" style="height: 32px; padding: 0 12px; font-size: 0.72rem; margin-left: 4px;" type="button" title="Download Complete Month Details">' +
            '<svg class="admin-premium-icon" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
            '<span>Complete Excel</span>' +
          '</button>' +
        '</div>' +
        '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\'' + historyEscapeHtml(dateStr) + '\')" type="button">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
          '<span>Delete Date</span>' +
        '</button>' +
        '<div class="ios-ss-ring" style="--pct:' + totalPct + '"><span class="ios-ss-ring-val">' + totalPct + '%</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="ios-merge-kpis">' +
      '<div><span>Type</span><b>Worker</b></div>' +
      '<div><span>Authorized</span><b class="k-authorized">' + merged.totals.authorized + '</b></div>' +
      '<div><span>Existing</span><b class="k-existing">' + merged.totals.existing + '</b></div>' +
      '<div><span>Present</span><b class="k-present">' + merged.totals.present + '</b></div>' +
      '<div><span>Absent (from Authorize Manpower)</span><b class="k-absent">' + merged.totals.absent + '</b></div>' +
    '</div>' +
    '<div class="ios-merge-list">' + rowCards + '</div>';

  setTimeout(function() {
    window.populatePDFMonthDropdown();
  }, 50);
}
