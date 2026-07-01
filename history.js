function _saveAttendanceHistory(state) {
  try {
    var stamp = new Date();
    var today = stamp.getFullYear() + '-' + String(stamp.getMonth() + 1).padStart(2, '0') + '-' + String(stamp.getDate()).padStart(2, '0');
    
    // Save to LocalStorage
    try {
      localStorage.setItem('mep_history_' + today, JSON.stringify(state));
    } catch(err) { console.error('Local history save error:', err); }

    // Save to Cloud
    if (window.firebaseDb) {
      window.firebaseDb.ref('mep_attendance_history/' + today).set(state).catch(function(e) { console.error('Error saving history snapshot:', e); });
      window.firebaseDb.ref('mep_attendance_history_index/' + today).set(true).catch(function(e) { console.error('Error saving history index:', e); });
    }
  } catch(e) { console.error('_saveAttendanceHistory error:', e); }
}

window.openAdminHistoryModal = function() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '999999';

  const modal = document.createElement('div');
  modal.style.background = '#fff';
  modal.style.padding = '25px 30px';
  modal.style.borderRadius = '16px';
  modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  modal.style.textAlign = 'center';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.gap = '15px';

  const title = document.createElement('h3');
  title.innerText = 'Admin Access';
  title.style.margin = '0';
  title.style.color = '#1e293b';
  title.style.fontFamily = 'Inter, sans-serif';

  const input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'Enter PIN';
  input.style.padding = '12px';
  input.style.fontSize = '18px';
  input.style.border = '2px solid #e2e8f0';
  input.style.borderRadius = '8px';
  input.style.width = '180px';
  input.style.textAlign = 'center';
  input.style.outline = 'none';
  input.style.transition = 'border-color 0.2s';
  input.addEventListener('focus', () => input.style.borderColor = '#3b82f6');
  input.addEventListener('blur', () => input.style.borderColor = '#e2e8f0');

  const btn = document.createElement('button');
  btn.innerText = 'Unlock Archive';
  btn.style.padding = '12px';
  btn.style.background = '#3b82f6';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '8px';
  btn.style.fontSize = '15px';
  btn.style.fontWeight = 'bold';
  btn.style.cursor = 'pointer';
  
  modal.appendChild(title);
  modal.appendChild(input);
  modal.appendChild(btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  input.focus();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  const checkPass = () => {
    if (input.value.trim() === '12') {
      document.body.removeChild(overlay);
      window.openHistoryModal();
    } else {
      input.style.borderColor = '#ef4444';
      input.value = '';
      input.placeholder = 'Wrong PIN';
    }
  };

  input.addEventListener('input', (e) => {
    if (e.target.value.trim() === '12') checkPass();
  });
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkPass();
  });
  btn.addEventListener('click', checkPass);
};

window.openHistoryModal = function() {
  if (document.getElementById('history-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'history-modal';
  modal.className = 'ios-hm-overlay no-print';

  modal.innerHTML = `
    <div class="ios-hm-card" role="dialog" aria-labelledby="ios-hm-title">
      <span class="ios-hm-aurora ios-hm-aurora-1" aria-hidden="true"></span>
      <span class="ios-hm-aurora ios-hm-aurora-2" aria-hidden="true"></span>
      <span class="ios-hm-aurora ios-hm-aurora-3" aria-hidden="true"></span>
      <div class="ios-hm-header">
        <div class="ios-hm-title-wrap">
          <div class="ios-hm-icon" aria-hidden="true">
            <svg class="ios-hm-icon-svg" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ios-admin-shield" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/><stop offset="100%" stop-color="#ddd6fe" stop-opacity="0.84"/></linearGradient>
              </defs>
              <path d="M12 2.9l7.1 2.8v5.5c0 4.8-2.9 8.5-7.1 10.3-4.2-1.8-7.1-5.5-7.1-10.3V5.7L12 2.9z" fill="url(#ios-admin-shield)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
              <circle cx="12" cy="9.4" r="2.4" fill="#7c3aed"/>
              <path d="M8.2 16.5c.75-2.05 2.05-3.1 3.8-3.1s3.05 1.05 3.8 3.1" stroke="#7c3aed" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M9.1 18.1h5.8" stroke="#a78bfa" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h2 id="ios-hm-title" class="ios-hm-title">
              Admin
            </h2>
            <div class="ios-hm-sub">Protected attendance history</div>
          </div>
        </div>
        <div class="ios-hm-header-actions">
          <button id="btn-admin-compile-excel" class="admin-premium-btn" onclick="window.downloadCompleteMonthlyHistoryExcel()" type="button" title="Compile Excel for current month">
            <svg class="admin-premium-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Compile Excel</span>
          </button>
          <button id="btn-admin-monthly-chart" class="admin-premium-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #047857;" onclick="window.generateMonthlyChart()" type="button" title="View Monthly Pie Chart">
            <svg class="admin-premium-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            <span>Pie Chart</span>
          </button>
          <button id="fan-merge-history-btn" class="ios-hm-merge-btn" onclick="window.showFanAssembleDimmerMergedHistory()" type="button">
            <span class="ios-hm-merge-icon" aria-hidden="true">↔</span>
            <span>Fan Assemble + Dimmer</span>
          </button>
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
        </aside>

        <section class="ios-hm-viewer" id="history-data-viewer">
          <div class="ios-hm-empty">
            <div class="ios-hm-empty-ico" aria-hidden="true">
              <span class="ios-hm-empty-ring"></span>
              <span class="ios-hm-empty-ring ios-hm-empty-ring-2"></span>
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="8.5" cy="14.5" r="1" fill="currentColor"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor"/></svg>
            </div>
            <div class="ios-hm-empty-text">Select a date to view admin history</div>
            <div class="ios-hm-empty-hint">Days with a glowing dot have saved snapshots</div>
          </div>
        </section>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) window.closeHistoryModal();
  });
  window._iosHmKey = function(e) { if (e.key === 'Escape') window.closeHistoryModal(); };
  document.addEventListener('keydown', window._iosHmKey);

  nextMotionFrame(() => modal.classList.add('is-open'));

  window.historyCurrentDate = new Date();
  window.historySelectedDate = null;
  window.historyMergedMode = false;
  window._fetchSavedHistoryDates(() => {
    window._renderHistoryCalendar();
    window._updateHistoryCountBadge();
  });
};

window._updateHistoryCountBadge = function() {
  const badge = document.getElementById('history-count-badge');
  if (!badge) return;
  const count = window.savedHistoryDates ? window.savedHistoryDates.size : 0;
  const numEl = badge.querySelector('.ios-hm-count-num');
  const lblEl = badge.querySelector('.ios-hm-count-lbl');
  if (numEl) numEl.textContent = count;
  if (lblEl) lblEl.textContent = count === 1 ? 'snapshot' : 'snapshots';
  badge.classList.toggle('is-empty', count === 0);
  badge.classList.add('is-ready');
};

window.closeHistoryModal = function() {
  const modal = document.getElementById('history-modal');
  if (!modal) return;
  if (window._iosHmKey) {
    document.removeEventListener('keydown', window._iosHmKey);
    window._iosHmKey = null;
  }
  modal.classList.remove('is-open');
  setTimeout(() => modal.remove(), 350);
};

window.savedHistoryDates = new Set(); // Stores dates in 'YYYY-MM-DD' format

window._fetchSavedHistoryDates = function(callback) {
  if (window.firebaseDb) {
    window.firebaseDb.ref('mep_attendance_history_index').once('value').then(function(snapshot) {
      window.savedHistoryDates.clear();
      if (snapshot.exists()) {
        var val = snapshot.val();
        if (val && typeof val === 'object') {
          Object.keys(val).forEach(function(dateStr) { window.savedHistoryDates.add(dateStr); });
        }
      }
      if (callback) callback();
    }).catch(function(err) {
      console.error('Error fetching history dates', err);
      if (callback) callback();
    });
  } else {
    if (callback) callback();
  }
};

window.changeHistoryMonth = function(delta) {
  window.historyCurrentDate.setMonth(window.historyCurrentDate.getMonth() + delta);
  window._renderHistoryCalendar();
};

window._renderHistoryCalendar = function() {
  const grid = document.getElementById('history-calendar-grid');
  const monthYearLabel = document.getElementById('history-month-year');
  if (!grid || !monthYearLabel) return;
  
  const d = window.historyCurrentDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthYearLabel.textContent = monthNames[month] + ' ' + year;
  
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const curDateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    const hasData = window.savedHistoryDates.has(curDateStr);
    const isToday = curDateStr === todayStr;
    const isFuture = new Date(year, month, i) > today;

    const classes = ['ios-hm-day'];
    if (hasData) classes.push('ios-hm-day--filled');
    if (isFuture) classes.push('ios-hm-day--future');
    if (isToday) classes.push('ios-hm-day--today');

    const onClick = hasData
      ? `onclick="window._loadHistoryForDate('${curDateStr}')"`
      : (isFuture ? 'disabled' : `onclick="alert('No snapshot recorded for this date.')"`);

    const dot = hasData ? '<span class="ios-hm-dot"></span>' : '';

    html += `<button class="${classes.join(' ')}" ${onClick}>${i}${dot}</button>`;
  }

  grid.innerHTML = html;
};

window._loadHistoryForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  if (window.historyMergedMode) {
    window.renderFanAssembleDimmerMergedForDate(dateStr);
    return;
  }
  updateMergedHistoryButtonState();
  
  viewer.innerHTML = `
    <div class="ios-hm-loader">
      <div class="ios-hm-spinner"></div>
      <div class="ios-hm-loader-text">Loading snapshot for ${dateStr}…</div>
    </div>
  `;

  if (window.firebaseDb) {
    window.firebaseDb.ref(`mep_attendance_history/${dateStr}`).once('value').then(snapshot => {
      if (snapshot.exists()) {
        const state = snapshot.val();
        _renderHistoryState(dateStr, state, viewer);
      } else {
        viewer.innerHTML = `<div class="ios-hm-empty"><div class="ios-hm-empty-text">No snapshot found for ${dateStr}.</div></div>`;
      }
    }).catch(err => {
      viewer.innerHTML = `<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Error loading data</div></div>`;
    });
  }
};

window.deleteHistoryDate = function(dateStr) {
  if (!window.firebaseDb) {
    alert('Firebase not connected!');
    return;
  }

  const formattedDate = formatHistoryDate(dateStr);
  const confirmed = confirm(
    'Warning: This will permanently delete attendance history for ' +
    formattedDate +
    '.\n\nThis action cannot be undone. Delete this date?'
  );
  if (!confirmed) return;

  const viewer = document.getElementById('history-data-viewer');
  if (viewer) {
    viewer.innerHTML = `
      <div class="ios-hm-loader">
        <div class="ios-hm-spinner"></div>
        <div class="ios-hm-loader-text">Deleting snapshot for ${historyEscapeHtml(dateStr)}…</div>
      </div>
    `;
  }

  Promise.all([
    window.firebaseDb.ref('mep_attendance_history/' + dateStr).remove(),
    window.firebaseDb.ref('mep_attendance_history_index/' + dateStr).remove()
  ]).then(function() {
    window.savedHistoryDates.delete(dateStr);
    if (window.historySelectedDate === dateStr) window.historySelectedDate = null;
    window.historyMergedMode = false;
    updateMergedHistoryButtonState();
    window._renderHistoryCalendar();
    window._updateHistoryCountBadge();
    if (viewer) {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">Deleted history for ' + historyEscapeHtml(formattedDate) + '.</div><div class="ios-hm-empty-hint">Select another saved date to view admin history.</div></div>';
    }
  }).catch(function(err) {
    console.error('History delete error:', err);
    if (viewer) {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Error deleting history</div><div class="ios-hm-empty-hint">' + historyEscapeHtml(err.message || String(err)) + '</div></div>';
    } else {
      alert('Error deleting history: ' + (err.message || err));
    }
  });
};

function updateMergedHistoryButtonState() {
  const btn = document.getElementById('fan-merge-history-btn');
  if (!btn) return;
  btn.classList.toggle('is-active', !!window.historyMergedMode);
}

function historyEscapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function historyToCount(value) {
  return parseInt(value, 10) || 0;
}

function getHistoryRows(state, pageId, groupName) {
  const groupRows = state?.[pageId]?.[groupName];
  if (Array.isArray(groupRows)) return groupRows;
  if (groupRows && typeof groupRows === 'object') return Object.values(groupRows);
  return [];
}

function formatHistoryDate(dateStr) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  } catch(e) {
    return dateStr;
  }
}

function getAttendancePct(present, existing) {
  return existing > 0 ? Math.round((present / existing) * 100) : 0;
}

function getAttendanceTone(pct) {
  if (pct >= 90) return 'high';
  if (pct >= 70) return 'mid';
  return 'low';
}

function collectFanAssembleDimmerTotals(state) {
  const targetGroups = ["Fan Assemble", "Fan Dimmer & Blade"];
  const totals = { authorized: 0, existing: 0, present: 0, absent: 0 };
  const workerRow = { designation: 'Worker', authorized: 0, existing: 0, present: 0, absent: 0 };

  targetGroups.forEach(function(groupName) {
    getHistoryRows(state, 'anik', groupName).forEach(function(row) {
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

window.showFanAssembleDimmerMergedHistory = function() {
  window.historyMergedMode = !window.historyMergedMode;
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
          window.renderFanAssembleDimmerMergedForDate(latestDate);
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
  window.renderFanAssembleDimmerMergedForDate(selectedDate);
};

window.renderFanAssembleDimmerMergedForDate = function(dateStr) {
  const viewer = document.getElementById('history-data-viewer');
  if (!viewer) return;
  window.historySelectedDate = dateStr;
  window.historyMergedMode = true;
  updateMergedHistoryButtonState();

  viewer.innerHTML = `
    <div class="ios-hm-loader">
      <div class="ios-hm-spinner"></div>
      <div class="ios-hm-loader-text">Loading daily Worker merge…</div>
    </div>
  `;

  const loadDailyMerged = function() {
    if (!window.firebaseDb) {
      viewer.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text" style="color:#ef4444;">Firebase not connected</div><div class="ios-hm-empty-hint">Daily merged history needs saved Firebase snapshots.</div></div>';
      return;
    }

    window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snapshot) {
      if (snapshot.exists()) {
        renderFanAssembleDimmerMergedHistory(dateStr, snapshot.val(), viewer);
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

function renderFanAssembleDimmerMergedHistory(dateStr, state, container) {
  const merged = collectFanAssembleDimmerTotals(state);
  if (merged.rows.length === 0) {
    container.innerHTML = '<div class="ios-hm-empty"><div class="ios-hm-empty-text">No Worker history found for Fan Assemble or Fan Dimmer.</div></div>';
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
        '<div class="ios-ss-head-date">' + historyEscapeHtml(formatHistoryDate(dateStr)) + ' · Fan Assemble Worker + Fan Dimmer Worker</div>' +
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

  // Populate the month selection dropdown with reporting months
  setTimeout(function() {
    window.populatePDFMonthDropdown();
  }, 50);
}

function getReportingMonthInfo(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { key: "invalid", year: 0, month: 0, monthName: "Invalid", rangeStr: "", displayName: "Invalid Date" };
  }
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) {
    return { key: "invalid", year: 0, month: 0, monthName: "Invalid", rangeStr: "", displayName: "Invalid Date (" + dateStr + ")" };
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { key: "invalid", year: 0, month: 0, monthName: "Invalid", rangeStr: "", displayName: "Invalid Date (" + dateStr + ")" };
  }

  let repMonth = m;
  let repYear = y;

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = monthNames[repMonth];
  const lastDay = new Date(repYear, repMonth, 0).getDate();
  
  let rangeStr = "1 " + monthName + " - " + lastDay + " " + monthName + " " + repYear;
  const displayName = rangeStr + " (" + monthName + " Month)";

  return {
    key: repYear + "-" + String(repMonth).padStart(2, '0'),
    year: repYear,
    month: repMonth,
    monthName: monthName,
    rangeStr: rangeStr,
    displayName: displayName
  };
}

window.populatePDFMonthDropdown = function() {
  const select = document.getElementById('merged-pdf-month-select');
  if (!select) return;

  if (!window.savedHistoryDates || window.savedHistoryDates.size === 0) {
    select.innerHTML = '<option value="" disabled selected>No snapshots</option>';
    return;
  }

  const monthsMap = new Map();
  window.savedHistoryDates.forEach(function(dateStr) {
    const info = getReportingMonthInfo(dateStr);
    if (info.key === "invalid") return;
    if (!monthsMap.has(info.key)) {
      monthsMap.set(info.key, {
        info: info,
        dates: []
      });
    }
    monthsMap.get(info.key).dates.push(dateStr);
  });

  const sortedMonths = Array.from(monthsMap.values()).sort(function(a, b) {
    return b.info.key.localeCompare(a.info.key);
  });

  select.innerHTML = '<option value="" disabled selected>Select Month...</option>';
  sortedMonths.forEach(function(m) {
    const opt = document.createElement('option');
    opt.value = m.info.key;
    opt.textContent = m.info.displayName;
    select.appendChild(opt);
  });
};

window.downloadMonthlyHistoryPDF = function() {
  const select = document.getElementById('merged-pdf-month-select');
  if (!select) return;
  const monthKey = select.value;
  if (!monthKey) {
    alert('Please select a month first.');
    return;
  }

  const btn = document.getElementById('btn-export-pdf') || select.nextElementSibling;
  const originalText = btn ? btn.innerHTML : 'PDF';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '...';
  }

  const datesInMonth = Array.from(window.savedHistoryDates).filter(function(dateStr) {
    return getReportingMonthInfo(dateStr).key === monthKey;
  }).sort(function(a, b) {
    const partsA = a.split('-').map(Number);
    const partsB = b.split('-').map(Number);
    const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
    const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
    return dateA - dateB;
  });

  if (datesInMonth.length === 0) {
    alert('No dates with saved snapshots in this month.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  const fetchPromises = datesInMonth.map(function(dateStr) {
    return window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snap) {
      return {
        dateStr: dateStr,
        state: snap.val()
      };
    });
  });

  Promise.all(fetchPromises).then(function(results) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    generateAndPrintMonthlyReport(monthKey, results);
  }).catch(function(err) {
    console.error(err);
    alert('Error fetching data: ' + err.message);
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
};

window.generateMonthlyChart = function() {
  if (typeof window.syncLiveDataToAppState === 'function') window.syncLiveDataToAppState();

  let monthKey;
  const select = document.getElementById('merged-pdf-month-select');
  if (select && select.value) {
    monthKey = select.value;
  } else if (window.historyCurrentDate) {
    monthKey = window.historyCurrentDate.getFullYear() + '-' + String(window.historyCurrentDate.getMonth() + 1).padStart(2, '0');
  }

  if (!monthKey) {
    alert('Please select a month first.');
    return;
  }

  const btn = document.getElementById('btn-admin-monthly-chart');
  const originalText = btn ? btn.innerHTML : 'Pie Chart';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '...';
  }

  const datesInMonth = Array.from(window.savedHistoryDates).filter(function(dateStr) {
    return getReportingMonthInfo(dateStr).key === monthKey;
  }).sort(function(a, b) {
    const partsA = a.split('-').map(Number);
    const partsB = b.split('-').map(Number);
    const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
    const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
    return dateA - dateB;
  });

  if (datesInMonth.length === 0) {
    alert('No dates with saved snapshots in this month.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  const fetchPromises = datesInMonth.map(function(dateStr) {
    return window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snap) {
      return {
        dateStr: dateStr,
        state: snap.val()
      };
    });
  });

  Promise.all(fetchPromises).then(function(results) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    window.renderMonthlyChartModal(monthKey, results);
  }).catch(function(err) {
    console.error(err);
    alert('Error fetching data: ' + err.message);
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
};

window.renderMonthlyChartModal = function(monthKey, results) {
  let totalAuth = 0;
  let totalExist = 0;
  let totalPresent = 0;
  let totalAbsent = 0;

  results.forEach(res => {
    const state = res.state;
    if (!state) return;
    Object.keys(state).forEach(pageId => {
      const pageData = state[pageId];
      if (typeof pageData !== 'object' || pageData === null) return;
      
      Object.keys(pageData).forEach(originalGroupName => {
        let groupName = originalGroupName;
        const excludedSections = ['anik', 'anwar', 'bikash', 'monir', 'takbir'];
        if (excludedSections.includes(groupName.toLowerCase().trim())) return;

        let rows = pageData[originalGroupName];
        if (!rows) return;
        if (!Array.isArray(rows)) {
          if (typeof rows === 'object') { rows = Object.values(rows); } else { return; }
        }

        rows.forEach(row => {
          if (!row || typeof row !== 'object') return;
          const authorized = parseInt(row.authorized) || 0;
          const existing = parseInt(row.existing) || 0;
          const present = parseInt(row.present) || 0;
          const absent = authorized - present; 

          totalAuth += authorized;
          totalExist += existing;
          totalPresent += present;
          totalAbsent += absent;
        });
      });
    });
  });

  if (totalExist === 0) {
    alert("No data available to chart for this month.");
    return;
  }

  const numDates = results.length;
  const avgPresent = numDates > 0 ? Math.round(totalPresent / numDates) : 0;
  const avgAbsent = numDates > 0 ? Math.round(totalAbsent / numDates) : 0;

  const pieTotal = totalPresent + totalAbsent;
  const oAvgPct = pieTotal > 0 ? Math.round((totalPresent / pieTotal) * 100) : 0;
  const oAbsPct = pieTotal > 0 ? Math.round((totalAbsent / pieTotal) * 100) : 0;

  let presentSlicePct = pieTotal > 0 ? (totalPresent / pieTotal) * 100 : 0;

  const overlay = document.createElement('div');
  overlay.className = 'ios-hm-overlay';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999999';
  overlay.style.backgroundColor = 'rgba(15,23,42,0.85)';
  overlay.style.backdropFilter = 'blur(8px)';
  overlay.style.opacity = '1';
  
  const monthParts = monthKey.split('-');
  const dateObj = new Date(monthParts[0], monthParts[1] - 1);
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  overlay.innerHTML = `
    <div style="background: #ffffff; width: 92%; max-width: 420px; border-radius: 28px; padding: 35px 25px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; animation: chartPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
      <h2 style="margin: 0 0 5px 0; color: #0f172a; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.02em;">Monthly Overview</h2>
      <div style="color: #64748b; margin-bottom: 35px; font-weight: 600; font-size: 1.05rem;">${monthName}</div>
      
      <div style="position: relative; width: 220px; height: 220px; margin: 0 auto 40px auto; border-radius: 50%; background: conic-gradient(#10b981 0% ${presentSlicePct}%, #ef4444 ${presentSlicePct}% 100%); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(0,0,0,0.05); transition: all 0.3s ease;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 145px; height: 145px; background: #ffffff; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: inset 0 4px 15px rgba(0,0,0,0.08), 0 0 0 12px rgba(255,255,255,0.3);">
          <span style="font-size: 2.8rem; font-weight: 900; color: #10b981; letter-spacing: -0.03em; line-height: 1;">${oAvgPct}<span style="font-size: 1.5rem;">%</span></span>
          <span style="font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">Present</span>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px;">
        <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 16px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; font-weight: 700; color: #166534; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span> Present
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #14532d;">${oAvgPct}%</div>
          <div style="font-size: 0.85rem; color: #166534; font-weight: 600; opacity: 0.8; margin-top: 4px;">${avgPresent.toLocaleString()} avg/day</div>
        </div>
        <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 16px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; font-weight: 700; color: #991b1b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></span> Absent
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #7f1d1d;">${oAbsPct}%</div>
          <div style="font-size: 0.85rem; color: #991b1b; font-weight: 600; opacity: 0.8; margin-top: 4px;">${avgAbsent.toLocaleString()} avg/day</div>
        </div>
      </div>
      
      <button onclick="this.closest('.ios-hm-overlay').remove()" style="width: 100%; padding: 16px; background: #0f172a; color: #fff; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">
        Close Dashboard
      </button>
    </div>
    <style>
      @keyframes chartPopIn {
        0% { opacity: 0; transform: scale(0.9) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
  `;

  document.body.appendChild(overlay);
};

window.downloadCompleteMonthlyHistoryExcel = function() {
  if (typeof window.syncLiveDataToAppState === 'function') window.syncLiveDataToAppState();
  // Force SW unregister to bypass stubborn cache during development/updates
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      for (let reg of regs) { reg.unregister(); }
    });
  }

  let monthKey;
  const select = document.getElementById('merged-pdf-month-select');
  if (select && select.value) {
    monthKey = select.value;
  } else if (window.historyCurrentDate) {
    monthKey = window.historyCurrentDate.getFullYear() + '-' + String(window.historyCurrentDate.getMonth() + 1).padStart(2, '0');
  }

  if (!monthKey) {
    alert('Please select a month first.');
    return;
  }

  const btn = document.getElementById('btn-export-complete-excel') || document.getElementById('btn-admin-compile-excel');
  const originalText = btn ? btn.innerHTML : 'Compile Excel';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '...';
  }

  const datesInMonth = Array.from(window.savedHistoryDates).filter(function(dateStr) {
    return getReportingMonthInfo(dateStr).key === monthKey;
  }).sort(function(a, b) {
    const partsA = a.split('-').map(Number);
    const partsB = b.split('-').map(Number);
    const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
    const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
    return dateA - dateB;
  });

  if (datesInMonth.length === 0) {
    alert('No dates with saved snapshots in this month.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  const fetchPromises = datesInMonth.map(function(dateStr) {
    return window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snap) {
      return {
        dateStr: dateStr,
        state: snap.val()
      };
    });
  });

  Promise.all(fetchPromises).then(function(results) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    generateAndDownloadCompleteMonthlyExcel(monthKey, results);
  }).catch(function(err) {
    console.error(err);
    alert('Error fetching data: ' + err.message);
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
};
function generateAndDownloadCompleteMonthlyExcel(monthKey, results) {
  if (results.length === 0) {
    alert("No data available for the selected month.");
    return;
  }

  const monthInfo = getReportingMonthInfo(results[0].dateStr);
  
  // 1. Get all dates and sort them
  const dates = results.map(r => r.dateStr).sort((a, b) => new Date(a) - new Date(b));
  const numDates = dates.length;
  
  // 2. Build 2D map: dataMap[sectionName][designationName][dateStr] = { auth, exist, pres, abs }
  const dataMap = {};
  
  results.forEach(function(res) {
    const dStr = res.dateStr;
    const state = res.state || {};
    
    Object.keys(state).forEach(function(pageId) {
      // Only process valid attendance sheets (keys in SECTIONS_CONFIG)
      if (typeof SECTIONS_CONFIG === 'undefined' || !SECTIONS_CONFIG[pageId]) return;

      const pageData = state[pageId];
      if (typeof pageData !== 'object' || pageData === null) return;
      
      Object.keys(pageData).forEach(function(originalGroupName) {
        let groupName = originalGroupName;
        // Filter out unwanted personal names acting as sections
        const excludedSections = ['anik', 'anwar', 'bikash', 'monir', 'takbir'];
        if (excludedSections.includes(groupName.toLowerCase().trim())) return;

        // Merge historical "Power Press & Stamping" into "Fan Power Press & Stamping"
        if (groupName.trim().toLowerCase() === 'power press & stamping') {
          groupName = 'Fan Power Press & Stamping';
        }

        var rows = pageData[originalGroupName];
        if (!rows) return;
        if (!Array.isArray(rows)) {
          if (typeof rows === 'object') { rows = Object.values(rows); } else { return; }
        }
        
        if (!dataMap[groupName]) dataMap[groupName] = {};
        
        rows.forEach(function(row) {
          if (!row || typeof row !== 'object') return;
          let desig = String(row.designation || 'N/A').trim();
          
          // Merge Computer Operator into Sr. Supervisor for Fan Auto Powder Coating
          if (groupName === 'Fan Auto Powder Coating' && desig.toLowerCase() === 'computer operator') {
            desig = 'Sr. Supervisor';
          }
          
          if (!dataMap[groupName][desig]) dataMap[groupName][desig] = {};
          
          const authorized = parseInt(row.authorized) || 0;
          const existing = parseInt(row.existing) || 0;
          const present = parseInt(row.present) || 0;
          const absent = authorized - present;
          
          if (!dataMap[groupName][desig][dStr]) {
            dataMap[groupName][desig][dStr] = {
              auth: 0,
              exist: 0,
              pres: 0,
              abs: 0
            };
          }
          
          dataMap[groupName][desig][dStr].auth += authorized;
          dataMap[groupName][desig][dStr].exist += existing;
          dataMap[groupName][desig][dStr].pres += present;
          dataMap[groupName][desig][dStr].abs += absent;
        });
      });
    });
  });

  // 3. Build HTML Table for Excel
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Attendance Report</x:Name>
            <x:WorksheetOptions>
              <x:DoNotDisplayGridlines/>
              <x:FreezePanes/>
              <x:FrozenNoSplit/>
              <x:SplitHorizontal>3</x:SplitHorizontal>
              <x:TopRowBottomPane>3</x:TopRowBottomPane>
              <x:SplitVertical>2</x:SplitVertical>
              <x:LeftColumnRightPane>2</x:LeftColumnRightPane>
              <x:ActivePane>0</x:ActivePane>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
  </head><body>
  <table border="1" style="border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 10pt; border: 1px solid #94a3b8;">
    <thead>
      <tr>
        <th colspan="${2 + dates.length * 4 + 6}" style="font-size: 18pt; font-weight: bold; text-align: center; padding: 12px; background-color: #064e3b; color: #ffffff; border: 1px solid #94a3b8;">
          Complete Attendance Efficiency Report - ${monthInfo.displayName}
        </th>
      </tr>
      <tr>
        <th rowspan="2" style="background-color: #064e3b; color: #ffffff; font-weight: bold; vertical-align: middle; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; padding: 6px;">Section</th>
        <th rowspan="2" style="background-color: #064e3b; color: #ffffff; font-weight: bold; vertical-align: middle; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 6px;">Designation</th>`;
        
  dates.forEach(dStr => {
    const d = new Date(dStr);
    const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const isFriday = d.getDay() === 5;
    const bgColor = isFriday ? '#991b1b' : '#047857';
    html += `<th colspan="4" style="background-color: ${bgColor}; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 6px;">${dateLabel}</th>`;
  });
  
  html += `<th colspan="6" style="background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 6px;">Monthly Total / Average</th>
      </tr>
      <tr>`;
      
  dates.forEach((dStr) => {
    const isFriday = new Date(dStr).getDay() === 5;
    const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
    const existBg = isFriday ? '#fecaca' : '#d1fae5';
    const presBg = '#a7f3d0';
    const absBg = '#ffedd5';
    html += `<th style="background-color: ${authBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Auth</th>
             <th style="background-color: ${existBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Exist</th>
             <th style="background-color: ${presBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Pres</th>
             <th style="background-color: ${absBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Abs</th>`;
  });
  
  html += `<th style="background-color: #e2e8f0; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Auth</th>
           <th style="background-color: #cbd5e1; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Exist</th>
           <th style="background-color: #a7f3d0; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Pres</th>
           <th style="background-color: #ffedd5; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Abs</th>
           <th style="background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Pres %</th>
           <th style="background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Abs %</th>
      </tr>
    </thead>
    <tbody>`;

  const dateTotals = {};
  dates.forEach(dStr => {
      dateTotals[dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 };
  });

  Object.keys(dataMap).sort().forEach(section => {
    // 3. Remove Empty Rows: Skip designations that have 0 auth/exist across all dates
    const designations = Object.keys(dataMap[section]).sort().filter(desig => {
      let totalData = 0;
      dates.forEach(dStr => {
        if (dataMap[section][desig][dStr]) totalData += dataMap[section][desig][dStr].auth + dataMap[section][desig][dStr].exist;
      });
      return totalData > 0;
    });
    
    if (designations.length === 0) return; // Skip section entirely if empty
    
    const rowSpanCount = designations.length + 1; // +1 for the Subtotal row
    
    // To track section totals
    const sectionTotals = {};
    dates.forEach(dStr => sectionTotals[dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 });
    
    designations.forEach((desig, index) => {
      html += `<tr>`;
      if (index === 0) {
        html += `<td rowspan="${rowSpanCount}" style="vertical-align: middle; background-color: #f8fafc; color: #000000; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; padding: 5px; font-weight: bold; font-size: 10pt;">${section}</td>`;
      }
      html += `<td style="background-color: #ffffff; color: #000000; border: 1px solid #cbd5e1; border-right: 2px solid #94a3b8; padding: 5px; font-weight: 500;">${desig}</td>`;
        
      let rowAuthSum = 0, rowExistSum = 0, rowPresSum = 0, rowAbsSum = 0;
      let rowDaysWithData = 0;
      
      dates.forEach(dStr => {
        const cell = dataMap[section][desig][dStr];
        const isFriday = new Date(dStr).getDay() === 5;
        const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
        const existBg = isFriday ? '#fecaca' : '#d1fae5';
        
        if (cell) {
          html += `<td style="text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 4px; color: #000000; background-color: ${authBg}; mso-number-format:'0';">${cell.auth}</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #000000; background-color: ${existBg}; mso-number-format:'0';">${cell.exist}</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${cell.pres}</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${cell.abs}</td>`;
          rowAuthSum += cell.auth;
          rowExistSum += cell.exist;
          rowPresSum += cell.pres;
          rowAbsSum += cell.abs;
          rowDaysWithData++;
          
          dateTotals[dStr].auth += cell.auth;
          dateTotals[dStr].exist += cell.exist;
          dateTotals[dStr].pres += cell.pres;
          dateTotals[dStr].abs += cell.abs;
          
          sectionTotals[dStr].auth += cell.auth;
          sectionTotals[dStr].exist += cell.exist;
          sectionTotals[dStr].pres += cell.pres;
          sectionTotals[dStr].abs += cell.abs;
        } else {
          html += `<td style="text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; color: #7F7F7F; background-color: ${authBg};">-</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; color: #7F7F7F; background-color: ${existBg};">-</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; color: #7F7F7F; background-color: #a7f3d0;">-</td>
                   <td style="text-align: center; border: 1px solid #cbd5e1; color: #7F7F7F; background-color: #ffedd5;">-</td>`;
        }
      });
      
      const avgAuth = rowDaysWithData > 0 ? Math.round(rowAuthSum / rowDaysWithData) : 0;
      const avgExist = rowDaysWithData > 0 ? Math.round(rowExistSum / rowDaysWithData) : 0;
      const avgPres = rowDaysWithData > 0 ? Math.round(rowPresSum / rowDaysWithData) : 0;
      const avgAbs = rowDaysWithData > 0 ? Math.round(rowAbsSum / rowDaysWithData) : 0;
      
      const rawAvgPct = rowAuthSum > 0 ? (rowPresSum / rowAuthSum) : 0;
      const rawAbsPct = rowAuthSum > 0 ? (rowAbsSum / rowAuthSum) : 0;
      
      html += `<td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #e2e8f0; mso-number-format:'0';">${avgAuth}</td>
               <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #000000; background-color: #cbd5e1; mso-number-format:'0';">${avgExist}</td>
               <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${avgPres}</td>
               <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${avgAbs}</td>
               <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${rawAvgPct}</td>
               <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-right: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${rawAbsPct}</td>
             </tr>`;
    });

    // Section Total Row with thick border
    html += `<tr>`;
    html += `<td style="background-color: #f8fafc; color: #000000; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 5px; font-weight: bold; font-style: italic; text-align: right;">Total</td>`;
    
    let secAuthTotal = 0, secExistTotal = 0, secPresTotal = 0, secAbsTotal = 0;
    dates.forEach(dStr => {
      const t = sectionTotals[dStr];
      const isFriday = new Date(dStr).getDay() === 5;
      const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
      const existBg = isFriday ? '#fecaca' : '#d1fae5';
      html += `<td style="text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; font-weight: bold; background-color: ${authBg}; color: #000000; mso-number-format:'0';">${t.auth}</td>
               <td style="text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; font-weight: bold; background-color: ${existBg}; color: #000000; mso-number-format:'0';">${t.exist}</td>
               <td style="text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; font-weight: bold; background-color: #a7f3d0; color: #000000; mso-number-format:'0';">${t.pres}</td>
               <td style="text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; font-weight: bold; background-color: #ffedd5; color: #9a3412; mso-number-format:'0';">${t.abs}</td>`;
      secAuthTotal += t.auth;
      secExistTotal += t.exist;
      secPresTotal += t.pres;
      secAbsTotal += t.abs;
    });

    const numDates = dates.length;
    const sAvgAuth = numDates > 0 ? Math.round(secAuthTotal / numDates) : 0;
    const sAvgExist = numDates > 0 ? Math.round(secExistTotal / numDates) : 0;
    const sAvgPres = numDates > 0 ? Math.round(secPresTotal / numDates) : 0;
    const sAvgAbs = numDates > 0 ? Math.round(secAbsTotal / numDates) : 0;
    
    const sRawPct = secAuthTotal > 0 ? (secPresTotal / secAuthTotal) : 0;
    const sRawAbsPct = secAuthTotal > 0 ? (secAbsTotal / secAuthTotal) : 0;

    html += `<td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #e2e8f0; mso-number-format:'0';">${sAvgAuth}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #cbd5e1; mso-number-format:'0';">${sAvgExist}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${sAvgPres}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${sAvgAbs}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${sRawPct}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${sRawAbsPct}</td>
           </tr>`;
           
    // 5. Visual Spacing: Add empty row separator
    html += `<tr><td colspan="${2 + dates.length * 4 + 6}" style="border:none; height: 16px; background-color: #f1f5f9;"></td></tr>`;
  });
  
  // Daily Totals Row
  html += `<tr>
    <td colspan="2" style="font-weight: bold; text-align: right; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 8px; color: #ffffff; background-color: #0f766e;">GRAND DAILY TOTALS</td>`;
  
  dates.forEach(dStr => {
    const t = dateTotals[dStr];
    const isFriday = new Date(dStr).getDay() === 5;
    const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
    const existBg = isFriday ? '#fecaca' : '#d1fae5';
    html += `<td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 6px; color: #000000; background-color: ${authBg};">${t.auth}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 6px; color: #000000; background-color: ${existBg};">${t.exist}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 6px; color: #000000; background-color: #a7f3d0;">${t.pres}</td>
             <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 6px; color: #9a3412; background-color: #ffedd5;">${t.abs}</td>`;
  });
  
  let gTotalAuth = 0, gTotalExist = 0, gTotalPres = 0, gTotalAbs = 0;
  let gDaysWithData = 0;
  dates.forEach(dStr => {
    const t = dateTotals[dStr];
    if (t.auth > 0 || t.exist > 0 || t.pres > 0 || t.abs > 0) {
      gTotalAuth += t.auth;
      gTotalExist += t.exist;
      gTotalPres += t.pres;
      gTotalAbs += t.abs;
      gDaysWithData++;
    }
  });
  const gAvgAuth = gDaysWithData > 0 ? Math.round(gTotalAuth / gDaysWithData) : 0;
  const gAvgExist = gDaysWithData > 0 ? Math.round(gTotalExist / gDaysWithData) : 0;
  const gAvgPres = gDaysWithData > 0 ? Math.round(gTotalPres / gDaysWithData) : 0;
  const gAvgAbs = gDaysWithData > 0 ? Math.round(gTotalAbs / gDaysWithData) : 0;
  const gPct = gTotalAuth > 0 ? Math.round((gTotalPres / gTotalAuth) * 100) + '%' : '0%';
  const gAbsPct = gTotalAuth > 0 ? Math.round((gTotalAbs / gTotalAuth) * 100) + '%' : '0%';

  html += `<td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #e2e8f0; mso-number-format:'0';">${gAvgAuth}</td>
           <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #cbd5e1; mso-number-format:'0';">${gAvgExist}</td>
           <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${gAvgPres}</td>
           <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${gAvgAbs}</td>
           <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${gPct}</td>
           <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${gAbsPct}</td></tr>`;

  
  // =========================================================
  // Second Table: Designation-Wise Daily Summary
  // =========================================================
  const desigTotals = {};
  Object.keys(dataMap).forEach(section => {
    Object.keys(dataMap[section]).forEach(desig => {
      if (!desigTotals[desig]) {
        desigTotals[desig] = {};
        dates.forEach(dStr => desigTotals[desig][dStr] = {auth: 0, exist: 0, pres: 0, abs: 0});
      }
      dates.forEach(dStr => {
        if (dataMap[section][desig][dStr]) {
          desigTotals[desig][dStr].auth += dataMap[section][desig][dStr].auth;
          desigTotals[desig][dStr].exist += dataMap[section][desig][dStr].exist;
          desigTotals[desig][dStr].pres += dataMap[section][desig][dStr].pres;
          desigTotals[desig][dStr].abs += dataMap[section][desig][dStr].abs;
        }
      });
    });
  });

  html += `<tr><td colspan="${2 + dates.length * 4 + 6}" style="border:none; height: 30px;"></td></tr>
           <tr><td colspan="${2 + dates.length * 4 + 6}" style="border:none; height: 30px;"></td></tr>`;

  html += `<tr>
        <td colspan="2" rowspan="2" style="background-color: #064e3b; color: #ffffff; font-weight: bold; vertical-align: middle; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 6px;">Designation</td>`;
        
  dates.forEach(dStr => {
    const d = new Date(dStr);
    const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const isFriday = d.getDay() === 5;
    const bgColor = isFriday ? '#991b1b' : '#047857';
    html += `<th colspan="4" style="background-color: ${bgColor}; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 6px;">${dateLabel}</th>`;
  });
  
  html += `<th colspan="6" style="background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 6px;">Monthly Total / Average</th>
      </tr>
      <tr>`;
      
  dates.forEach((dStr) => {
    const isFriday = new Date(dStr).getDay() === 5;
    const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
    const existBg = isFriday ? '#fecaca' : '#d1fae5';
    html += `<th style="background-color: ${authBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Auth</th>
              <th style="background-color: ${existBg}; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Exist</th>
              <th style="background-color: #a7f3d0; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Pres</th>
              <th style="background-color: #ffedd5; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Abs</th>`;
  });
  
  html += `<th style="background-color: #e2e8f0; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Auth</th>
            <th style="background-color: #cbd5e1; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Exist</th>
            <th style="background-color: #a7f3d0; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Pres</th>
            <th style="background-color: #ffedd5; color: #000000; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Avg Abs</th>
            <th style="background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Pres %</th>
            <th style="background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 4px; font-size: 10pt;">Abs %</th>
      </tr>`;

  Object.keys(desigTotals).sort().forEach(desig => {
    let checkData = 0;
    dates.forEach(dStr => checkData += desigTotals[desig][dStr].auth + desigTotals[desig][dStr].exist);
    if (checkData === 0) return; // Skip empty rows

    html += `<tr><td colspan="2" style="background-color: #ffffff; color: #000000; border: 1px solid #cbd5e1; border-right: 2px solid #94a3b8; padding: 5px; font-weight: bold; font-size: 10pt;">${desig}</td>`;
    
    let rAuth = 0, rExist = 0, rPres = 0, rAbs = 0;
    
    dates.forEach(dStr => {
      const cell = desigTotals[desig][dStr];
      const isFriday = new Date(dStr).getDay() === 5;
      const authBg = isFriday ? '#fee2e2' : '#ecfdf5';
      const existBg = isFriday ? '#fecaca' : '#d1fae5';
      html += `<td style="text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 4px; color: #000000; background-color: ${authBg}; mso-number-format:'0';">${cell.auth}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #000000; background-color: ${existBg}; mso-number-format:'0';">${cell.exist}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${cell.pres}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${cell.abs}</td>`;
      
      rAuth += cell.auth;
      rExist += cell.exist;
      rPres += cell.pres;
      rAbs += cell.abs;
    });
    
    const aAuth = numDates > 0 ? Math.round(rAuth / numDates) : 0;
    const aExist = numDates > 0 ? Math.round(rExist / numDates) : 0;
    const aPres = numDates > 0 ? Math.round(rPres / numDates) : 0;
    const aAbs = numDates > 0 ? Math.round(rAbs / numDates) : 0;
    const rawPct = rAuth > 0 ? (rPres / rAuth) : 0;
    const rawAbsPct = rAuth > 0 ? (rAbs / rAuth) : 0;
    
    html += `<td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; padding: 5px; color: #000000; background-color: #e2e8f0; mso-number-format:'0';">${aAuth}</td>
              <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #000000; background-color: #cbd5e1; mso-number-format:'0';">${aExist}</td>
              <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${aPres}</td>
              <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${aAbs}</td>
              <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${rawPct}</td>
              <td style="font-weight:bold; text-align: center; border: 1px solid #cbd5e1; border-right: 2px solid #94a3b8; padding: 5px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${rawAbsPct}</td>
            </tr>`;
  });
  

  // Make the primary HTML a complete document
  html += `</tbody></table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Complete_Attendance_Efficiency_Report_${monthInfo.monthName}_${monthInfo.year}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.downloadMonthlyHistoryExcel = function() {
  const select = document.getElementById('merged-pdf-month-select');
  if (!select) return;
  const monthKey = select.value;
  if (!monthKey) {
    alert('Please select a month first.');
    return;
  }

  const btn = document.getElementById('btn-export-excel');
  const originalText = btn ? btn.innerHTML : 'Excel';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '...';
  }

  const datesInMonth = Array.from(window.savedHistoryDates).filter(function(dateStr) {
    return getReportingMonthInfo(dateStr).key === monthKey;
  }).sort(function(a, b) {
    const partsA = a.split('-').map(Number);
    const partsB = b.split('-').map(Number);
    const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
    const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
    return dateA - dateB;
  });

  if (datesInMonth.length === 0) {
    alert('No dates with saved snapshots in this month.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  const fetchPromises = datesInMonth.map(function(dateStr) {
    return window.firebaseDb.ref('mep_attendance_history/' + dateStr).once('value').then(function(snap) {
      return {
        dateStr: dateStr,
        state: snap.val()
      };
    });
  });

  Promise.all(fetchPromises).then(function(results) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    generateAndDownloadMonthlyExcel(monthKey, results);
  }).catch(function(err) {
    console.error(err);
    alert('Error fetching data: ' + err.message);
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
};

function generateAndDownloadMonthlyExcel(monthKey, results) {
  if (results.length === 0) {
    alert("No data available for the selected month.");
    return;
  }

  const monthInfo = getReportingMonthInfo(results[0].dateStr);

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Monthly Merge</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
</head>
<body>
  <table border="1" style="border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11pt; border: 1px solid #94a3b8;">
    <thead>
      <tr>
        <th colspan="7" style="font-size: 18pt; font-weight: bold; text-align: center; padding: 12px; background-color: #064e3b; color: #ffffff; border: 1px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
          Worker Attendance - ${monthInfo.displayName}
        </th>
      </tr>
      <tr>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Date</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Day</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Authorized</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Existing</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Present</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; white-space: normal; word-wrap: break-word;">Absent<br>(from Authorize Manpower)</th>
        <th style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">Percentage</th>
      </tr>
    </thead>
    <tbody>
`;

  let totalAuthSum = 0;
  let totalExistSum = 0;
  let totalPresentSum = 0;
  let totalAbsentSum = 0;
  const dayCount = results.length;

  results.forEach(function(res) {
    const parts = res.dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

    const isFriday = dateObj.getDay() === 5;
    const rowBg = isFriday ? '#fee2e2' : '#ffffff';
    const cellBorder = "1px solid #cbd5e1";

    const merged = collectFanAssembleDimmerTotals(res.state);
    const auth = merged.totals.authorized || 0;
    const exist = merged.totals.existing || 0;
    const pres = merged.totals.present || 0;
    const abs = merged.totals.absent || 0;
    const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

    totalAuthSum += auth;
    totalExistSum += exist;
    totalPresentSum += pres;
    totalAbsentSum += abs;

    html += `<tr>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; background-color: ${rowBg};">${formattedDate}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; background-color: ${rowBg};">${dayName}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; background-color: ${isFriday ? '#fecaca' : '#ecfdf5'}; mso-number-format:'0';">${auth}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; background-color: ${isFriday ? '#fecaca' : '#d1fae5'}; mso-number-format:'0';">${exist}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">${pres}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">${abs}</td>
      <td style="text-align: center; padding: 6px; border: ${cellBorder}; color: #000000; font-weight: bold; background-color: ${rowBg};">${pct}%</td>
    </tr>`;
  });

  const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;
  const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
  const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
  
  html += `
    </tbody>
    <tfoot>
      <tr>
        <th colspan="2" style="background-color: #0f766e; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">Total / Average</th>
        <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">${avgAuth}</th>
        <th style="background-color: #cbd5e1; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">${avgExist}</th>
        <th style="background-color: #a7f3d0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">${totalPresentSum}</th>
        <th style="background-color: #ffedd5; color: #9a3412; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">${totalAbsentSum}</th>
        <th style="background-color: #166534; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">${overallPct}%</th>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Worker_Attendance_${monthInfo.monthName}_${monthInfo.year}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateAndPrintMonthlyReport(monthKey, results) {
  if (results.length === 0) {
    alert("No data available for the selected month.");
    return;
  }

  const monthInfo = getReportingMonthInfo(results[0].dateStr);

  let totalAuthSum = 0;
  let totalExistSum = 0;
  let totalPresentSum = 0;
  let totalAbsentSum = 0;
  const dayCount = results.length;

  const tableRowsHtml = results.map(function(res, index) {
    const parts = res.dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

    const merged = collectFanAssembleDimmerTotals(res.state);
    const auth = merged.totals.authorized || 0;
    const exist = merged.totals.existing || 0;
    const pres = merged.totals.present || 0;
    const abs = merged.totals.absent || 0;
    const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

    totalAuthSum += auth;
    totalExistSum += exist;
    totalPresentSum += pres;
    totalAbsentSum += abs;

    const pctTone = getAttendanceTone(pct);
    let pctClass = 'pct-mid';
    if (pctTone === 'high') pctClass = 'pct-high';
    if (pctTone === 'low') pctClass = 'pct-low';

    return (
      '<tr>' +
        '<td style="text-align: center;">' + (index + 1) + '</td>' +
        '<td><strong>' + formattedDate + '</strong> <span class="day-name">(' + dayName + ')</span></td>' +
        '<td style="text-align: center;">' + auth + '</td>' +
        '<td style="text-align: center;">' + exist + '</td>' +
        '<td style="text-align: center; color: #10b981; font-weight: bold;">' + pres + '</td>' +
        '<td style="text-align: center; color: #ef4444; font-weight: bold;">' + abs + '</td>' +
        '<td style="text-align: center;"><span class="pct-badge ' + pctClass + '">' + pct + '%</span></td>' +
      '</tr>'
    );
  }).join('');

  const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
  const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
  const avgPresent = dayCount > 0 ? (totalPresentSum / dayCount).toFixed(1) : '0.0';
  const avgAbsent = dayCount > 0 ? (totalAbsentSum / dayCount).toFixed(1) : '0.0';
  const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print the monthly PDF.");
    return;
  }

  printWindow.document.write(
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<title>Monthly Worker Attendance Report - ' + monthInfo.monthName + ' ' + monthInfo.year + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' +
        '@page {' +
          'size: A4 portrait;' +
          'margin: 15mm;' +
        '}' +
        'body {' +
          'font-family: \'Inter\', -apple-system, sans-serif;' +
          'color: #000000;' +
          'margin: 0;' +
          'padding: 0;' +
          'font-size: 11px;' +
          'line-height: 1.4;' +
          'background: #ffffff;' +
        '}' +
        '.header {' +
          'display: flex;' +
          'justify-content: space-between;' +
          'align-items: flex-start;' +
          'border-bottom: 2px solid #7c3aed;' +
          'padding-bottom: 12px;' +
          'margin-bottom: 20px;' +
        '}' +
        '.header-left h1 {' +
          'font-size: 18px;' +
          'font-weight: 800;' +
          'color: #1c1134;' +
          'margin: 0 0 4px 0;' +
          'letter-spacing: -0.02em;' +
        '}' +
        '.header-left h2 {' +
          'font-size: 13px;' +
          'font-weight: 700;' +
          'color: #7c3aed;' +
          'margin: 0 0 6px 0;' +
          'letter-spacing: -0.01em;' +
        '}' +
        '.header-left p {' +
          'font-size: 10px;' +
          'color: #000000;' +
          'margin: 0;' +
        '}' +
        '.header-right {' +
          'text-align: right;' +
        '}' +
        '.header-right .badge {' +
          'display: inline-block;' +
          'background: #f5f3ff;' +
          'color: #6d28d9;' +
          'border: 1px solid #ddd6fe;' +
          'font-weight: 700;' +
          'padding: 4px 8px;' +
          'border-radius: 6px;' +
          'font-size: 10px;' +
        '}' +
        '.header-right p {' +
          'font-size: 9px;' +
          'color: #000000;' +
          'margin: 4px 0 0 0;' +
        '}' +
        '.kpi-container {' +
          'display: grid;' +
          'grid-template-columns: repeat(5, 1fr);' +
          'gap: 10px;' +
          'margin-bottom: 20px;' +
        '}' +
        '.kpi-card {' +
          'background: #f8fafc;' +
          'border: 1px solid #e2e8f0;' +
          'border-radius: 8px;' +
          'padding: 8px 10px;' +
          'text-align: center;' +
        '}' +
        '.kpi-label {' +
          'font-size: 8px;' +
          'font-weight: 700;' +
          'color: #000000;' +
          'text-transform: uppercase;' +
          'letter-spacing: 0.05em;' +
          'margin-bottom: 2px;' +
        '}' +
        '.kpi-value {' +
          'font-size: 16px;' +
          'font-weight: 800;' +
          'color: #000000;' +
        '}' +
        '.kpi-value.present { color: #10b981; }' +
        '.kpi-value.absent { color: #ef4444; }' +
        '.kpi-value.pct { color: #7c3aed; }' +
        '.kpi-sub {' +
          'font-size: 8px;' +
          'color: #94a3b8;' +
          'margin-top: 2px;' +
        '}' +
        'table {' +
          'width: 100%;' +
          'border-collapse: collapse;' +
          'margin-bottom: 25px;' +
        '}' +
        'th {' +
          'background: #f1f5f9;' +
          'border: 1px solid #cbd5e1;' +
          'color: #000000;' +
          'font-weight: 700;' +
          'font-size: 9px;' +
          'text-transform: uppercase;' +
          'letter-spacing: 0.05em;' +
          'padding: 8px 10px;' +
          'text-align: left;' +
        '}' +
        'td {' +
          'border: 1px solid #e2e8f0;' +
          'padding: 6px 10px;' +
          'font-size: 10px;' +
        '}' +
        'tr:nth-child(even) {' +
          'background: #f8fafc;' +
        '}' +
        '.day-name {' +
          'color: #94a3b8;' +
          'font-weight: normal;' +
          'font-size: 9px;' +
        '}' +
        '.pct-badge {' +
          'display: inline-block;' +
          'font-weight: 700;' +
          'padding: 2px 6px;' +
          'border-radius: 4px;' +
          'font-size: 9px;' +
        '}' +
        '.pct-high { background: #d1fae5; color: #065f46; }' +
        '.pct-mid { background: #fef3c7; color: #92400e; }' +
        '.pct-low { background: #fee2e2; color: #991b1b; }' +
        '.footer {' +
          'margin-top: 40px;' +
          'display: flex;' +
          'justify-content: space-between;' +
          'font-size: 9px;' +
          'color: #000000;' +
        '}' +
        '.signature-line {' +
          'width: 150px;' +
          'border-top: 1px solid #cbd5e1;' +
          'margin-top: 30px;' +
          'text-align: center;' +
          'padding-top: 4px;' +
          'font-weight: 600;' +
        '}' +
        '@media print {' +
          'body {' +
            '-webkit-print-color-adjust: exact;' +
            'print-color-adjust: exact;' +
          '}' +
        '}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div class="header">' +
        '<div class="header-left">' +
          '<h1>MEP GROUP</h1>' +
          '<h2>Manpower Attendance Monthly Report</h2>' +
          '<p>Component: <strong>Fan Assemble Worker & Fan Dimmer Worker (Merged)</strong></p>' +
        '</div>' +
        '<div class="header-right">' +
          '<div class="badge">' + monthInfo.monthName + ' Month</div>' +
          '<p style="font-weight: 600; color: #000000; margin-top: 6px;">Period: ' + monthInfo.rangeStr + ', ' + monthInfo.year + '</p>' +
          '<p>Generated: ' + new Date().toLocaleString('en-GB') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-container">' +
        '<div class="kpi-card">' +
          '<div class="kpi-label">Days Snapshotted</div>' +
          '<div class="kpi-value">' + dayCount + '</div>' +
          '<div class="kpi-sub">Total records</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-label">Avg Authorized</div>' +
          '<div class="kpi-value">' + avgAuth + '</div>' +
          '<div class="kpi-sub">Workers / Day</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-label">Avg Existing</div>' +
          '<div class="kpi-value">' + avgExist + '</div>' +
          '<div class="kpi-sub">Workers / Day</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-label">Avg Present</div>' +
          '<div class="kpi-value present">' + avgPresent + '</div>' +
          '<div class="kpi-sub">Workers / Day</div>' +
        '</div>' +
        '<div class="kpi-card">' +
          '<div class="kpi-label">Avg Present %</div>' +
          '<div class="kpi-value pct">' + overallPct + '%</div>' +
          '<div class="kpi-sub">Overall Rate</div>' +
        '</div>' +
      '</div>' +
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th style="width: 40px; text-align: center;">SL</th>' +
            '<th>Date</th>' +
            '<th style="width: 80px; text-align: center;">Authorized</th>' +
            '<th style="width: 80px; text-align: center;">Existing</th>' +
            '<th style="width: 80px; text-align: center;">Present</th>' +
            '<th style="width: 80px; text-align: center;">Absent<br><span style="font-size:0.85em; font-weight:500;">(from Authorize<br>Manpower)</span></th>' +
            '<th style="width: 80px; text-align: center;">Present %</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          tableRowsHtml +
        '</tbody>' +
        '<tfoot>' +
          '<tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">' +
            '<td colspan="2" style="text-align: right;">Average:</td>' +
            '<td style="text-align: center;">' + avgAuth + '</td>' +
            '<td style="text-align: center;">' + avgExist + '</td>' +
            '<td style="text-align: center; color: #10b981;">' + avgPresent + '</td>' +
            '<td style="text-align: center; color: #ef4444;">' + avgAbsent + '</td>' +
            '<td style="text-align: center;"><span class="pct-badge pct-high" style="background: #7c3aed; color: white;">' + overallPct + '%</span></td>' +
          '</tr>' +
        '</tfoot>' +
      '</table>' +
      '<div class="footer">' +
        '<div>' +
          '<p>Note: This report is dynamically generated from MEP Attendance System.</p>' +
        '</div>' +
        '<div style="display: flex; gap: 40px;">' +
          '<div class="signature-line">Prepared By</div>' +
          '<div class="signature-line">Authorized Signature</div>' +
        '</div>' +
      '</div>' +
      '<script>' +
        'window.addEventListener(\'DOMContentLoaded\', function() {' +
          'setTimeout(function() {' +
            'window.print();' +
          '}, 500);' +
        '});' +
      '</script>' +
    '</body>' +
    '</html>'
  );
  printWindow.document.close();
}

function _renderHistoryState(dateStr, state, container) {
  try {
    var formattedDate = formatHistoryDate(dateStr);

    var totalAuth = 0, totalExist = 0, totalPresent = 0, totalAbsent = 0;
    var sectionsHtml = '';

    var pageIds = Object.keys(state);
    pageIds.forEach(function(pageId) {
      if (isMetaStateKey(pageId)) return;
      if (!state[pageId] || typeof state[pageId] !== 'object' || Array.isArray(state[pageId])) return;

      var pageData = state[pageId];
      var groupNames = Object.keys(pageData);
      if (groupNames.length === 0) return;

      groupNames.forEach(function(groupName) {
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
        });

        if (groupRows.length === 0) return;

        var rowsHtml = '';
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
        });

        sectionsHtml +=
          '<div class="ios-ss-section">' +
            '<div class="ios-ss-sec-head">' +
              '<h4 class="ios-ss-sec-title">' + historyEscapeHtml(groupName) + '</h4>' +
              '<div class="ios-ss-sec-summary"><b>' + secPresent + '</b>/' + secExist + ' present · <i>' + secAbsent + '</i> absent</div>' +
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
      '<div class="ios-ss-head">' +
        '<div>' +
          '<h3 class="ios-ss-head-title">Attendance Snapshot</h3>' +
          '<div class="ios-ss-head-date">' + formattedDate + '</div>' +
        '</div>' +
        '<div class="ios-ss-head-actions">' +
          '<button class="ios-ss-delete-btn" onclick="window.deleteHistoryDate(\'' + historyEscapeHtml(dateStr) + '\')" type="button">' +
            '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>' +
            '<span>Delete Date</span>' +
          '</button>' +
          '<div class="ios-ss-ring" style="--pct:' + pct + '"><span class="ios-ss-ring-val">' + pct + '%</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ios-ss-kpi">' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized</div><div class="ios-ss-kpi-value k-total">' + (totalAuth || totalExist) + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing</div><div class="ios-ss-kpi-value k-existing">' + totalExist + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present</div><div class="ios-ss-kpi-value k-present">' + totalPresent + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent (from Authorize Manpower)</div><div class="ios-ss-kpi-value k-absent">' + totalAbsent + '</div></div>' +
      '</div>' +
      '<div class="ios-ss-sections">' + sectionsHtml + '</div>';
  } catch(e) {
    console.error('_renderHistoryState error:', e);
    container.innerHTML = '<div style="padding:2rem;"><h3 style="color:#ef4444; margin-bottom:1rem;">Error rendering snapshot</h3><pre style="background:#f8fafc; padding:1.5rem; border-radius:12px; overflow:auto; max-height:70vh; font-size:0.85rem; color:#334155; border:1px solid #e2e8f0;">' + JSON.stringify(state, null, 2) + '</pre></div>';
  }
}
