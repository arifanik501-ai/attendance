const SECTIONS_CONFIG = {
  anik: {
    title: "Entry Sheet (Anik)",
    password: "2645",
    groups: {
      "Fan Assemble": ["Manager", "In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker"],
      "Fan Armature": ["Engineer", "Technicalman", "Worker"],
      "Fan Dimmer & Blade": ["Engineer", "Worker"],
      "Fan Replace": ["Technicalman", "Worker"]
    }
  },
  monir: {
    title: "Entry Sheet (Monir)",
    password: "2222",
    groups: {
      "Power Press & Stamping": ["In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker", "Jr. Officer"],
      "Fan Dalai & Die Casting": ["Engineer", "Jr. Engineer", "Worker"]
    }
  },
  anwar: {
    title: "Entry Sheet (Anwar)",
    password: "1111",
    groups: {
      "Fan Auto Powder Coating": ["In-charge", "Engineer", "Technicalman", "Computer Operator", "Worker"],
      "Fan Lathe": ["Engineer", "Technicalman", "Worker"]
    }
  },
  bikash: {
    title: "Entry Sheet (Bikash)",
    password: "0011",
    groups: {
      "Fan Rojonigondha": ["In-charge", "Engineer", "Technicalman", "Worker"],
      "Fan Sada Shapla": ["Worker"]
    }
  },
  qc: {
    title: "Entry Sheet (QC)",
    password: "6699",
    groups: {
      "Fan Rojonigondha": ["In-charge", "Engineer", "QC Checker"]
    }
  }
};

function getAppState() {
  const stored = localStorage.getItem('manpowerData');
  if (stored) {
    return JSON.parse(stored);
  }
  const state = {};
  for (const [pageKey, pageData] of Object.entries(SECTIONS_CONFIG)) {
    state[pageKey] = {};
    for (const [groupName, designations] of Object.entries(pageData.groups)) {
      state[pageKey][groupName] = designations.map(desig => ({
        designation: desig,
        authorized: 0,
        existing: 0,
        present: 0,
        absent: 0
      }));
    }
  }
  // Load Default Data from user's Excel if empty
  if (state.anik["Fan Assemble"]) {
    let man = state.anik["Fan Assemble"].find(x => x.designation === "Manager");
    if (man) { man.authorized = 1; man.existing = 1; man.present = 1; man.absent = 0; }
    let eng = state.anik["Fan Assemble"].find(x => x.designation === "Engineer");
    if (eng) { eng.authorized = 1; }
    let wkr = state.anik["Fan Assemble"].find(x => x.designation === "Worker");
    if (wkr) { wkr.authorized = 36; wkr.existing = 36; wkr.present = 35; wkr.absent = 1; }
  }
  saveAppState(state);
  return state;
}

function saveAppState(state) {
  localStorage.setItem('manpowerData', JSON.stringify(state));
}

function calculateRow(row) {
  const existing = parseInt(row.existing) || 0;
  const present = parseInt(row.present) || 0;
  row.absent = Math.max(0, existing - present);
  return row;
}

function generateSidebar(activePage) {
  const pages = [
    { id: 'index', title: 'Main Dashboard', url: 'index.html' },
    { id: 'anik', title: 'Entry Sheet (Anik)', url: 'entry_anik.html' },
    { id: 'monir', title: 'Entry Sheet (Monir)', url: 'entry_monir.html' },
    { id: 'anwar', title: 'Entry Sheet (Anwar)', url: 'entry_anwar.html' },
    { id: 'bikash', title: 'Entry Sheet (Bikash)', url: 'entry_bikash.html' },
    { id: 'qc', title: 'Entry Sheet (QC)', url: 'entry_qc.html' }
  ];

  let html = `<div class="brand">MEP FAN LTD.</div><nav style="display:flex; flex-direction:column; gap:0.5rem;">`;
  pages.forEach(p => {
    html += `<a href="${p.url}" class="nav-link ${activePage === p.id ? 'active' : ''}">${p.title}</a>`;
  });
  html += `</nav>`;
  return html;
}

function renderEntryPage(pageId) {
  document.getElementById('sidebar').innerHTML = generateSidebar(pageId);
  const config = SECTIONS_CONFIG[pageId];

  document.getElementById('page-title').innerHTML = `${config.title}`;

  // Check if already authenticated this session
  const authed = sessionStorage.getItem('auth_' + pageId);
  if (authed === 'true') {
    _renderEntryContent(pageId);
    return;
  }

  // Show password gate
  const container = document.getElementById('report-container');
  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; min-height:50vh;">
      <div style="background:rgba(255,255,255,0.7); backdrop-filter:blur(12px); border-radius:16px; padding:2.5rem; box-shadow:0 8px 32px rgba(0,0,0,0.1); border:1px solid rgba(255,255,255,0.5); text-align:center; max-width:360px; width:100%;">
        <div style="font-size:2.5rem; margin-bottom:1rem;">🔒</div>
        <h2 style="margin:0 0 0.5rem 0; color:#1e293b; font-size:1.3rem; font-weight:700;">Password Required</h2>
        <p style="color:#64748b; font-size:0.9rem; margin-bottom:1.5rem;">Enter your PIN to access <strong>${config.title}</strong></p>
        <div style="display:flex; justify-content:center; gap:0.5rem; margin-bottom:1rem;" id="pin-container">
          <input type="password" maxlength="1" class="pin-box" id="pin1" inputmode="numeric" pattern="[0-9]*" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin2" inputmode="numeric" pattern="[0-9]*" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin3" inputmode="numeric" pattern="[0-9]*" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin4" inputmode="numeric" pattern="[0-9]*" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
        </div>
        <div id="pin-error" style="color:#ef4444; font-size:0.85rem; min-height:1.5rem; margin-bottom:0.5rem;"></div>
        <button id="pin-submit" style="width:100%; padding:0.7rem; background:linear-gradient(135deg, #eab308, #ca8a04); color:white; border:none; border-radius:10px; font-size:1rem; font-weight:700; cursor:pointer; transition:transform 0.15s, box-shadow 0.15s; box-shadow:0 4px 14px rgba(234,179,8,0.4);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(234,179,8,0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(234,179,8,0.4)';">
          Unlock
        </button>
      </div>
    </div>
  `;

  // PIN input auto-advance logic
  const pins = document.querySelectorAll('.pin-box');
  pins.forEach((pin, i) => {
    pin.addEventListener('input', (e) => {
      pin.style.borderColor = '#eab308';
      if (e.target.value && i < 3) pins[i + 1].focus();
      if (i === 3 && e.target.value) document.getElementById('pin-submit').click();
    });
    pin.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !pin.value && i > 0) {
        pins[i - 1].focus();
        pins[i - 1].value = '';
      }
    });
  });
  pins[0].focus();

  // Submit handler
  document.getElementById('pin-submit').addEventListener('click', () => {
    const entered = Array.from(pins).map(p => p.value).join('');
    if (entered === config.password) {
      sessionStorage.setItem('auth_' + pageId, 'true');
      _renderEntryContent(pageId);
    } else {
      document.getElementById('pin-error').textContent = 'Incorrect PIN. Please try again.';
      pins.forEach(p => { p.value = ''; p.style.borderColor = '#ef4444'; });
      pins[0].focus();
    }
  });
}

function _renderEntryContent(pageId) {
  const state = getAppState();
  const pageState = state[pageId];
  const config = SECTIONS_CONFIG[pageId];

  const container = document.getElementById('report-container');
  container.innerHTML = '';

  for (const [groupName, rows] of Object.entries(pageState)) {
    const card = document.createElement('div');
    card.className = 'glass-card';

    let html = `<h3>${groupName}</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Designation</th>
              <th>Authorized</th>
              <th>Existing</th>
              <th>Present</th>
              <th>Absent (Auto)</th>
            </tr>
          </thead>
          <tbody>`;

    let sums = { auth: 0, exist: 0, pres: 0, abs: 0 };

    rows.forEach((row, index) => {
      sums.auth += parseInt(row.authorized) || 0;
      sums.exist += parseInt(row.existing) || 0;
      sums.pres += parseInt(row.present) || 0;
      sums.abs += parseInt(row.absent) || 0;

      html += `<tr>
        <td style="font-weight:500;">${row.designation}</td>
        <td style="text-align: center;"><input type="number" min="0" data-group="${groupName}" data-index="${index}" data-field="authorized" value="${row.authorized}" class="entry-input"></td>
        <td style="text-align: center;"><input type="number" min="0" data-group="${groupName}" data-index="${index}" data-field="existing" value="${row.existing}" class="entry-input"></td>
        <td style="text-align: center;"><input type="number" min="0" data-group="${groupName}" data-index="${index}" data-field="present" value="${row.present}" class="entry-input"></td>
        <td class="absent-val" style="font-weight:600; color:#ef4444;">${row.absent}</td>
      </tr>`;
    });

    html += `<tr class="total-row">
        <td>Total</td>
        <td class="sum-auth"><div style="width:60px; text-align:center; margin:0 auto;">${sums.auth}</div></td>
        <td class="sum-exist"><div style="width:60px; text-align:center; margin:0 auto;">${sums.exist}</div></td>
        <td class="sum-pres"><div style="width:60px; text-align:center; margin:0 auto;">${sums.pres}</div></td>
        <td class="sum-abs"><div style="width:60px; text-align:center; margin:0 auto;">${sums.abs}</div></td>
      </tr>
      </tbody></table></div>`;

    card.innerHTML = html;
    container.appendChild(card);
  }

  document.querySelectorAll('.entry-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const g = e.target.getAttribute('data-group');
      const i = e.target.getAttribute('data-index');
      const f = e.target.getAttribute('data-field');
      const val = parseInt(e.target.value) || 0;

      state[pageId][g][i][f] = val;

      if (f === 'existing' || f === 'present') {
        calculateRow(state[pageId][g][i]);
        e.target.closest('tr').querySelector('.absent-val').textContent = state[pageId][g][i].absent;
      }

      updateGroupTotals(e.target.closest('table'), state[pageId][g]);
    });
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    saveAppState(state);
    alert('Entry Updated & Saved to Dashboard Successfully!');
    window.location.href = 'index.html';
  });
}

function updateGroupTotals(table, rows) {
  let sums = { auth: 0, exist: 0, pres: 0, abs: 0 };
  rows.forEach(r => {
    sums.auth += parseInt(r.authorized) || 0;
    sums.exist += parseInt(r.existing) || 0;
    sums.pres += parseInt(r.present) || 0;
    sums.abs += parseInt(r.absent) || 0;
  });

  table.querySelector('.sum-auth').textContent = sums.auth;
  table.querySelector('.sum-exist').textContent = sums.exist;
  table.querySelector('.sum-pres').textContent = sums.pres;
  table.querySelector('.sum-abs').textContent = sums.abs;
}

// Exactly mapping the structure of Excel rows
const EXACT_DASHBOARD_ROWS = [
  // id, section (if defined, otherwise spans from above if blank, or empty), designation, how to calc
  { id: 'R4', section: 'Section', designation: 'Manager', rowspan: 7, type: 'filter', filters: { excludePage: 'qc', designation: 'Manager' } },
  { id: 'R5', designation: 'Incharge Production', type: 'filter', filters: { excludePage: 'qc', designation: 'In-charge' } },
  { id: 'R6', designation: 'Engineer Production', type: 'filter', filters: { excludePage: 'qc', designation: 'Engineer' } },
  { id: 'R7', designation: 'Senior Supervisor', type: 'filter', filters: { excludePage: 'qc', designation: 'Sr. Supervisor' } },
  { id: 'R8', designation: 'Jr. Officer', type: 'filter', filters: { excludePage: 'qc', designation: 'Jr. Officer' } },
  { id: 'R9', designation: 'Computer Operator', type: 'filter', filters: { excludePage: 'qc', designation: 'Computer Operator' } },
  { id: 'R10', designation: 'Technical Man', type: 'filter', filters: { excludePage: 'qc', designation: 'Technicalman' } },

  { id: 'R11', section: 'Fan Assemble', designation: 'Worker', type: 'filter', filters: { group: 'Fan Assemble', designation: 'Worker' }, link: 'entry_anik.html' },
  { id: 'R12', section: 'Fan Armature', designation: 'Worker', type: 'filter', filters: { group: 'Fan Armature', designation: 'Worker' }, link: 'entry_anik.html' },
  { id: 'R13', section: 'Fan Blade and Dimmer', designation: 'Worker', type: 'filter', filters: { group: 'Fan Dimmer & Blade', designation: 'Worker' }, link: 'entry_anik.html' },
  { id: 'R14', section: 'Fan Replace', designation: 'Worker', type: 'filter', filters: { group: 'Fan Replace', designation: 'Worker' }, link: 'entry_anik.html' },
  { id: 'R15', section: 'Fan Lathe', designation: 'Worker', type: 'filter', filters: { group: 'Fan Lathe', designation: 'Worker' }, link: 'entry_anwar.html' },
  { id: 'R16', section: 'Fan Auto Powder Coating', designation: 'Worker', type: 'filter', filters: { group: 'Fan Auto Powder Coating', designation: 'Worker' }, link: 'entry_anwar.html' },
  { id: 'R17', section: 'Fan Rojonigondha', designation: 'Worker', type: 'filter', filters: { group: 'Fan Rojonigondha', designation: 'Worker', excludePage: 'qc' }, link: 'entry_bikash.html' },
  { id: 'R18', section: 'Fan Sada Shapla', designation: 'Worker', type: 'filter', filters: { group: 'Fan Sada Shapla', designation: 'Worker' }, link: 'entry_bikash.html' },
  { id: 'R19', section: 'Fan Power Press', designation: 'Worker', type: 'filter', filters: { group: 'Power Press & Stamping', designation: 'Worker' }, link: 'entry_monir.html' },
  { id: 'R20', section: 'Fan Die Casting', designation: 'Worker', type: 'filter', filters: { group: 'Fan Dalai & Die Casting', designation: 'Worker' }, link: 'entry_monir.html' },

  { id: 'R21', section: '', designation: 'Production Total', type: 'formula', formulaStr: 'SUM(R4:R20)', isTotal: true },

  { id: 'R22', section: 'Fan QC', designation: '(QC) Incharge', rowspan: 3, type: 'filter', filters: { page: 'qc', designation: 'In-charge' }, link: 'entry_qc.html' },
  { id: 'R23', designation: '(QC) Engineer', type: 'filter', filters: { page: 'qc', designation: 'Engineer' }, link: 'entry_qc.html' },
  { id: 'R24', designation: '(QC) Checker', type: 'filter', filters: { page: 'qc', designation: 'QC Checker' }, link: 'entry_qc.html' },

  { id: 'R25', section: '', designation: 'QC Total', type: 'formula', formulaStr: 'SUM(R22:R24)', isTotal: true },

  { id: 'R26', section: '', designation: 'S Grade', type: 'formula', formulaStr: 'R21+R9+R7+R10+R24', isTotal: true },
  { id: 'R27', section: '', designation: 'M Grade', type: 'formula', formulaStr: 'R4+R5+R6+R8+R23+R22', isTotal: true }
];

function calculateDashboardData(state) {
  const values = {};

  // First Pass: Resolve filters
  for (const cfg of EXACT_DASHBOARD_ROWS) {
    if (cfg.type === 'filter') {
      let auth = 0, exist = 0, pres = 0, abs = 0;

      for (const [pageId, groups] of Object.entries(state)) {
        if (cfg.filters.page && pageId !== cfg.filters.page) continue;
        if (cfg.filters.excludePage && pageId === cfg.filters.excludePage) continue;

        for (const [groupName, rows] of Object.entries(groups)) {
          if (cfg.filters.group && groupName !== cfg.filters.group) continue;

          for (const r of rows) {
            if (cfg.filters.designation && r.designation !== cfg.filters.designation) continue;
            auth += parseInt(r.authorized) || 0;
            exist += parseInt(r.existing) || 0;
            pres += parseInt(r.present) || 0;
            abs += parseInt(r.absent) || 0;
          }
        }
      }
      values[cfg.id] = { auth, exist, pres, abs };
    }
  }

  // Second Pass: Resolve formulas
  for (const cfg of EXACT_DASHBOARD_ROWS) {
    if (cfg.type === 'formula') {
      let auth = 0, exist = 0, pres = 0, abs = 0;

      if (cfg.formulaStr.startsWith('SUM(')) {
        const range = cfg.formulaStr.replace('SUM(', '').replace(')', '').split(':');
        const startNum = parseInt(range[0].replace('R', ''));
        const endNum = parseInt(range[1].replace('R', ''));

        for (let i = startNum; i <= endNum; i++) {
          const rId = 'R' + i;
          if (values[rId]) {
            auth += values[rId].auth; exist += values[rId].exist;
            pres += values[rId].pres; abs += values[rId].abs;
          }
        }
      } else {
        // e.g. R21+R9+R7+R10+R24
        const parts = cfg.formulaStr.split('+');
        for (const p of parts) {
          if (values[p]) {
            auth += values[p].auth; exist += values[p].exist;
            pres += values[p].pres; abs += values[p].abs;
          }
        }
      }
      values[cfg.id] = { auth, exist, pres, abs };
    }
  }

  return values;
}

function renderDashboard() {
  document.getElementById('sidebar').innerHTML = generateSidebar('index');
  const state = getAppState();
  const calculatedData = calculateDashboardData(state);

  const container = document.getElementById('dashboard-container');
  container.innerHTML = `
    <div style="position: fixed; bottom: 2.5rem; right: 2.5rem; z-index: 9999;" class="no-print">
      <button onclick="exportReport()" style="display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Inter', sans-serif; font-size: 1.05rem; padding: 1rem 1.8rem; box-shadow: 0 10px 30px rgba(202, 138, 4, 0.4); background: linear-gradient(135deg, #eab308, #ca8a04); color: white; border: none; border-radius: 50px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 0.02em;" onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 15px 35px rgba(202, 138, 4, 0.5)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 10px 30px rgba(202, 138, 4, 0.4)';">
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Export A4 Report
      </button>
    </div>
  `;

  const mainCard = document.createElement('div');
  mainCard.className = 'glass-card';
  mainCard.id = 'export-content';

  const today = new Date();
  const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  let html = `
    <div class="report-header-flex">
      <div class="report-title-container">
        <h2 style="color:#854d0e; font-size:2.4rem; font-weight:800; margin-bottom: 8px; letter-spacing: -0.02em; font-family: 'Inter', sans-serif;">MEP FAN LTD.</h2>
        <div style="height: 3px; background: linear-gradient(90deg, #ca8a04 0%, #fde047 80%, transparent 100%); width: 100%; margin-bottom: 10px; border-radius: 2px;"></div>
        <p style="font-weight:600; font-size: 1.05rem; color:#475569; letter-spacing: 0.15em; font-family: 'Inter', sans-serif; text-transform: uppercase;">MEP FAN ATTENDANCE REPORT</p>
      </div>

      <div class="clock-widget" id="clock-widget">
        <div class="analog-clock">
          <div class="clock-face">
            <div class="number number-12">12</div>
            <div class="number number-3">3</div>
            <div class="number number-6">6</div>
            <div class="number number-9">9</div>
            <div class="hand hour-hand" id="hour-hand"></div>
            <div class="hand min-hand" id="min-hand"></div>
            <div class="hand second-hand" id="second-hand"></div>
            <div class="clock-center"></div>
          </div>
        </div>
        <div class="digital-time" id="digital-time">--:--:-- --</div>
        <div class="clock-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Barishal, Bangladesh
        </div>
        <div class="clock-date" id="clock-date">--</div>
      </div>
    </div>
    
    <div class="table-container">
      <table class="report-table">
        <thead>
          <tr>
            <th style="width:20%">Section/Area</th>
            <th style="width:25%">Designation</th>
            <th>Authorized<br>Manpower</th>
            <th>Existing<br>Manpower</th>
            <th>Present<br>Manpower</th>
            <th>Absent</th>
          </tr>
        </thead>
        <tbody>`;

  for (const row of EXACT_DASHBOARD_ROWS) {
    const data = calculatedData[row.id];
    const mgmtIds = ['R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10'];
    let rowClass = row.isTotal ? 'total-row' : (mgmtIds.includes(row.id) ? 'management-row' : '');

    html += `<tr class="${rowClass}">`;

    if (row.section !== undefined) {
      if (row.rowspan) {
        if (row.section === 'Fan QC') {
          html += `<td rowspan="${row.rowspan}" style="font-weight:700; font-size: 0.95rem; vertical-align:middle; text-align:center; background:rgba(255,255,255,0.35); border-right:1px solid rgba(255,255,255,0.6); color:#1e293b; padding: 0.5rem;">
            ${row.section}
          </td>`;
        } else {
          html += `<td rowspan="${row.rowspan}" style="font-weight:700; vertical-align:middle; text-align:center; background:rgba(255,255,255,0.35); border-right:1px solid rgba(255,255,255,0.6); padding: 0.5rem;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;">
              <span style="color:#32cd32; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em;">${row.section}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <polyline points="19 15 12 22 5 15"></polyline>
              </svg>
            </div>
          </td>`;
        }
      } else {
        html += `<td style="font-weight:700; color:#713f12;">${row.section}</td>`;
      }
    }

    html += `
      <td style="font-weight:500;">${row.designation}</td>
      <td style="text-align: center;">${data.auth}</td>
      <td style="text-align: center;">${data.exist}</td>
      <td style="text-align: center;">${data.pres}</td>
      <td style="text-align: center; ${data.abs > 0 ? 'color:#dc2626; font-weight:800;' : ''}">${data.abs}</td>
    </tr>`;
  }

  html += `</tbody></table></div>`;

  mainCard.innerHTML = html;
  container.appendChild(mainCard);

  if (window.clockInterval) clearInterval(window.clockInterval);
  window.clockInterval = setInterval(updateClock, 1000);
  updateClock();
}

function updateClock() {
  const hourHand = document.getElementById('hour-hand');
  const minHand = document.getElementById('min-hand');
  const secondHand = document.getElementById('second-hand');
  const digitalTime = document.getElementById('digital-time');
  const clockDate = document.getElementById('clock-date');

  if (!hourHand) return;

  const now = new Date();

  const seconds = now.getSeconds();
  const secondsDegrees = ((seconds / 60) * 360);
  secondHand.style.transform = `rotate(${secondsDegrees}deg)`;

  const mins = now.getMinutes();
  const minsDegrees = ((mins / 60) * 360) + ((seconds / 60) * 6);
  minHand.style.transform = `rotate(${minsDegrees}deg)`;

  const hour = now.getHours();
  const hourDegrees = ((hour / 12) * 360) + ((mins / 60) * 30);
  hourHand.style.transform = `rotate(${hourDegrees}deg)`;

  let h = hour % 12 || 12;
  let ampm = hour >= 12 ? 'PM' : 'AM';
  let m = mins.toString().padStart(2, '0');
  let s = seconds.toString().padStart(2, '0');
  digitalTime.textContent = `${h}:${m}:${s} ${ampm}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  clockDate.textContent = now.toLocaleDateString('en-US', options);
}


function exportReport() {
  const content = document.getElementById('export-content');

  // Clone the node to prevent screen jumping and layout breaking
  const clone = content.cloneNode(true);
  clone.classList.add('a4-report');

  // Create an off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // Match A4 width

  // Carry current theme into the export container
  const currentTheme = document.body.getAttribute('data-theme');
  if (currentTheme) {
    container.setAttribute('data-theme', currentTheme);
  }

  container.appendChild(clone);
  document.body.appendChild(container);

  // Hide no-print elements inside the clone
  clone.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');

  // Use configuration to ensure entire table renders
  html2canvas(clone, {
    scale: 4,
    useCORS: true,
    scrollY: 0,
    windowWidth: clone.scrollWidth,
    windowHeight: clone.scrollHeight
  }).then(canvas => {
    // Clean up
    document.body.removeChild(container);

    const link = document.createElement('a');
    link.download = 'MEP_Fan_Manpower_Report_Full.jpg';
    link.href = canvas.toDataURL('image/jpeg', 1.0); // Highest quality
    link.click();
  });
}

// ═══════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════

const THEMES = [
  { id: 'amber', name: 'Golden Amber', swatch: 'linear-gradient(135deg, #facc15, #eab308)' },
  { id: 'ocean', name: 'Ocean Blue', swatch: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
  { id: 'rose', name: 'Rose Garden', swatch: 'linear-gradient(135deg, #fb7185, #f43f5e)' },
  { id: 'emerald', name: 'Emerald Forest', swatch: 'linear-gradient(135deg, #34d399, #10b981)' },
  { id: 'purple', name: 'Purple Haze', swatch: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
  { id: 'midnight', name: 'Midnight Dark', swatch: 'linear-gradient(135deg, #334155, #0f172a)' },
  { id: 'sunset', name: 'Sunset Orange', swatch: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { id: 'arctic', name: 'Arctic Ice', swatch: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
  { id: 'lavender', name: 'Lavender Dream', swatch: 'linear-gradient(135deg, #c084fc, #a855f7)' },
  { id: 'slate', name: 'Charcoal Slate', swatch: 'linear-gradient(135deg, #94a3b8, #64748b)' }
];

function setTheme(themeId) {
  if (themeId === 'amber') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', themeId);
  }
  localStorage.setItem('mep_theme', themeId);

  // Update active state in dropdown
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeId);
  });
}

function initThemePicker() {
  // Don't add duplicate
  if (document.querySelector('.theme-fab')) return;

  const savedTheme = localStorage.getItem('mep_theme') || 'amber';

  const fab = document.createElement('div');
  fab.className = 'theme-fab no-print';
  fab.innerHTML = `
    <button class="theme-fab-btn" title="Change Theme">🎨</button>
    <div class="theme-dropdown" id="theme-dropdown">
      ${THEMES.map(t => `
        <button class="theme-option ${t.id === savedTheme ? 'active' : ''}" data-theme="${t.id}" onclick="setTheme('${t.id}')">
          <span class="theme-swatch" style="background: ${t.swatch}"></span>
          ${t.name}
        </button>
      `).join('')}
    </div>
  `;
  document.body.appendChild(fab);

  // Toggle dropdown
  fab.querySelector('.theme-fab-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('theme-dropdown').classList.toggle('open');
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    document.getElementById('theme-dropdown')?.classList.remove('open');
  });

  // Apply saved theme
  setTheme(savedTheme);
}

// Auto-initialize theme picker on page load
document.addEventListener('DOMContentLoaded', initThemePicker);
