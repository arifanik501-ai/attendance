const firebaseConfig = {
  apiKey: "AIzaSyBcjbR7Qu7M-RnHUtLJ9zeehILqQHYLw4E",
  authDomain: "whatsapp-c10ef.firebaseapp.com",
  databaseURL: "https://whatsapp-c10ef-default-rtdb.firebaseio.com",
  projectId: "whatsapp-c10ef",
  storageBucket: "whatsapp-c10ef.firebasestorage.app",
  messagingSenderId: "675053106773",
  appId: "1:675053106773:web:b7078468691a07ecfec6dc",
  measurementId: "G-89Z8WBJ3R0"
};

// Initialize Firebase immediately if the SDK is loaded globally
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.firebaseDb = firebase.database();
}

const SECTIONS_CONFIG = {
  anik: {
    title: "Entry Sheet (Anik)",
    password: "2645",
    groups: {
      "Fan Assemble": ["Manager", "In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker"],
      "Fan Dimmer & Blade": ["Engineer", "Worker"]
    }
  },
  takbir: {
    title: "Entry Sheet (Takbir)",
    password: "9696",
    groups: {
      "Fan Armature": ["Engineer", "Technicalman", "Worker"],
      "Fan Replace": ["Technicalman", "Worker"]
    }
  },
  monir: {
    title: "Entry Sheet (Monir)",
    password: "2222",
    groups: {
      "Power Press & Stamping": ["In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker"],
      "Fan Dalai & Die Casting": ["Jr. Officer", "Worker"]
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
  }
};

let globalAppState = null;
let currentActivePageId = null;
const SESSION_DEVICE_ID = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

window.playAlertSoundAndVibrate = function() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

function createDefaultState() {
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
  return state;
}

function getAppState() {
  let stateToReturn = globalAppState || createDefaultState();

  // NORMALIZE DATA: Sync historical loaded state with current SECTIONS_CONFIG structure
  for (const pageKey of Object.keys(stateToReturn)) {
    if (pageKey === 'history') continue;
    if (!SECTIONS_CONFIG[pageKey]) {
      delete stateToReturn[pageKey];
    }
  }

  for (const [pageKey, pageData] of Object.entries(SECTIONS_CONFIG)) {
    if (!stateToReturn[pageKey]) {
      stateToReturn[pageKey] = {};
    }

    // 1. Remove deleted groups
    for (const groupName of Object.keys(stateToReturn[pageKey])) {
      if (!pageData.groups[groupName]) {
        delete stateToReturn[pageKey][groupName];
      }
    }

    // 2. Filter deleted designations & handle new ones
    for (const [groupName, designations] of Object.entries(pageData.groups)) {
      if (!stateToReturn[pageKey][groupName]) {
        stateToReturn[pageKey][groupName] = designations.map(desig => ({
          designation: desig, authorized: 0, existing: 0, present: 0, absent: 0
        }));
      } else {
        // Remove old
        stateToReturn[pageKey][groupName] = stateToReturn[pageKey][groupName].filter(r => designations.includes(r.designation));

        // Add new
        const existingDesigs = stateToReturn[pageKey][groupName].map(r => r.designation);
        for (const newDesig of designations) {
          if (!existingDesigs.includes(newDesig)) {
            stateToReturn[pageKey][groupName].push({
              designation: newDesig, authorized: 0, existing: 0, present: 0, absent: 0
            });
          }
        }

        // Enforce config array order
        stateToReturn[pageKey][groupName].sort((a, b) => designations.indexOf(a.designation) - designations.indexOf(b.designation));
      }
    }
  }

  // Hardcoded Admin Authorized Values
  if (stateToReturn.takbir && stateToReturn.takbir["Fan Armature"]) {
    const w = stateToReturn.takbir["Fan Armature"].find(x => x.designation === "Worker");
    if (w) w.authorized = 28;
  }
  if (stateToReturn.anik && stateToReturn.anik["Fan Dimmer & Blade"]) {
    const w = stateToReturn.anik["Fan Dimmer & Blade"].find(x => x.designation === "Worker");
    if (w) w.authorized = 17;
  }
  if (stateToReturn.anwar && stateToReturn.anwar["Fan Auto Powder Coating"]) {
    const w = stateToReturn.anwar["Fan Auto Powder Coating"].find(x => x.designation === "Worker");
    if (w) w.authorized = 40;
  }
  if (stateToReturn.bikash && stateToReturn.bikash["Fan Rojonigondha"]) {
    const w = stateToReturn.bikash["Fan Rojonigondha"].find(x => x.designation === "Worker");
    if (w) w.authorized = 9;
  }

  return stateToReturn;
}

// ═══════════════════════════════════════════════════
// ADMIN BROADCAST SYSTEM
// ═══════════════════════════════════════════════════
window.sendAdminBroadcast = function() {
  // Remove existing modal if any
  const existing = document.getElementById('admin-broadcast-modal');
  if (existing) existing.remove();

  const modalHTML = `
    <div id="admin-broadcast-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15, 23, 42, 0.7); backdrop-filter:blur(10px); z-index:10000; display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.3s ease;">
      <div class="glass-card" style="width:90%; max-width:420px; padding:2.5rem 2rem; transform:scale(0.9); transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position:relative; overflow:visible;">
        
        <div style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); width:50px; height:50px; background:linear-gradient(135deg, #ef4444, #dc2626); border-radius:50%; display:flex; justify-content:center; align-items:center; box-shadow:0 8px 20px rgba(239, 68, 68, 0.4); border:4px solid #ffffff;">
          <svg width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-3.14 8.167-7.221.055-.419.145-.826.262-1.221A3.896 3.896 0 0119.897 4m0 0l-5.632 1.408A5.961 5.961 0 0011 8H7a3 3 0 00-3 3v2a3 3 0 003 3h4m0 0v6l-2-6"></path></svg>
        </div>

        <h3 style="margin:1rem 0 0.5rem 0; color:var(--text-dark); font-size:1.6rem; text-align:center; font-weight:800; letter-spacing:-0.02em;">Admin Broadcast</h3>
        <p style="color:var(--text-light); font-size:0.9rem; text-align:center; margin-bottom:2rem; font-weight:500;">Send a real-time push notification to all online and offline staff devices.</p>
        
        <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-dark); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Admin Password</label>
        <input type="password" id="admin-broadcast-pwd" style="width:100%; padding:0.9rem 1.2rem; border-radius:12px; border:2px solid #e2e8f0; margin-bottom:1.5rem; font-size:1.1rem; font-family:'Inter', sans-serif; outline:none; transition:all 0.2s;" onfocus="this.style.borderColor='#ef4444'; this.style.boxShadow='0 0 0 4px rgba(239,68,68,0.1)';" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';" placeholder="••••••••">
        
        <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-dark); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Message to Broadcast</label>
        <textarea id="admin-broadcast-msg" rows="3" style="width:100%; padding:0.9rem 1.2rem; border-radius:12px; border:2px solid #e2e8f0; margin-bottom:2rem; font-size:1.05rem; font-family:'Inter', sans-serif; outline:none; resize:none; transition:all 0.2s;" onfocus="this.style.borderColor='#ef4444'; this.style.boxShadow='0 0 0 4px rgba(239,68,68,0.1)';" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';" placeholder="Enter announcement text..."></textarea>
        
        <div style="display:flex; gap:1rem;">
          <button onclick="document.getElementById('admin-broadcast-modal').remove()" style="flex:1; padding:0.8rem; background:#f1f5f9; border:none; border-radius:10px; color:#475569; font-weight:700; font-size:1rem; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">Cancel</button>
          
          <button id="send-broadcast-btn" style="flex:1.5; padding:0.8rem; background:linear-gradient(135deg, #ef4444, #b91c1c); color:white; border:none; border-radius:10px; font-weight:700; font-size:1rem; cursor:pointer; box-shadow:0 4px 12px rgba(239, 68, 68, 0.4); transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.4)';">Send Now 🚀</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('admin-broadcast-modal');
  const card = modal.querySelector('.glass-card');
  const pwdInput = document.getElementById('admin-broadcast-pwd');
  const btn = document.getElementById('send-broadcast-btn');
  const msgInput = document.getElementById('admin-broadcast-msg');

  // Trigger intro animation
  setTimeout(() => {
    modal.style.opacity = '1';
    card.style.transform = 'scale(1)';
    pwdInput.focus();
  }, 10);

  btn.addEventListener('click', () => {
    if (pwdInput.value !== '8250') {
      pwdInput.style.borderColor = '#dc2626';
      pwdInput.style.animation = 'shake 0.4s ease';
      setTimeout(() => pwdInput.style.animation = 'none', 400);
      return;
    }
    const msg = msgInput.value.trim();
    if (!msg) {
      msgInput.style.borderColor = '#dc2626';
      msgInput.style.animation = 'shake 0.4s ease';
      setTimeout(() => msgInput.style.animation = 'none', 400);
      return;
    }

    // Change btn state securely
    btn.innerHTML = 'Sending...';
    btn.style.opacity = '0.8';
    btn.style.pointerEvents = 'none';

    window.firebaseDb.ref('mep_admin_broadcast').set({
      message: msg,
      timestamp: Date.now(),
      senderId: SESSION_DEVICE_ID
    }).then(() => {
      // Success out animation
      modal.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => {
        modal.remove();
        app.showToast('✅ Broadcast sent beautifully to all devices!', 'success');
      }, 300);
    }).catch(e => {
      btn.innerHTML = 'Failed!';
      btn.style.background = '#000';
      alert('Failed: ' + e.message);
    });
  });
};

function saveAppState(state, customActionStr = null) {
  if (window.firebaseDb) {
    window.firebaseDb.ref('mep_dashboard_state').set(state);
    
    const sheetName = currentActivePageId ? (SECTIONS_CONFIG[currentActivePageId]?.title || 'An entry sheet') : 'The dashboard';
    const actionMessage = customActionStr || `🔄 ${sheetName} has been updated`;
    
    window.firebaseDb.ref('mep_last_update_info').set({
      deviceId: SESSION_DEVICE_ID,
      timestamp: Date.now(),
      pageTitle: sheetName,
      actionStr: actionMessage
    });
  } else {
    localStorage.setItem('manpowerData', JSON.stringify(state));
  }
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
    { id: 'anik', title: 'Entry Sheet (Anik)', url: 'entry.html?page=anik' },
    { id: 'takbir', title: 'Entry Sheet (Takbir)', url: 'entry.html?page=takbir' },
    { id: 'monir', title: 'Entry Sheet (Monir)', url: 'entry.html?page=monir' },
    { id: 'anwar', title: 'Entry Sheet (Anwar)', url: 'entry.html?page=anwar' },
    { id: 'bikash', title: 'Entry Sheet (Bikash)', url: 'entry.html?page=bikash' }
  ];

  let html = `<div class="brand">MEP FAN LTD.</div><nav style="display:flex; flex-direction:column; gap:0.5rem;">`;
  pages.forEach(p => {
    const isSpecialPrimary = p.id === 'anik' || p.id === 'takbir';
    const isSpecialSecondary = p.id !== 'index' && !isSpecialPrimary;
    const isMainDashboard = p.id === 'index';

    let specialClass = '';
    if (isSpecialPrimary) specialClass = 'special-entry-link';
    if (isSpecialSecondary) specialClass = 'secondary-entry-link';
    if (isMainDashboard) specialClass = 'main-dashboard-link';

    html += `<a href="${p.url}" class="nav-link ${specialClass} ${activePage === p.id ? 'active' : ''}">${p.title}</a>`;
  });
  html += `</nav>`;
  return html;
}

function renderEntryPage(pageId) {
  currentActivePageId = pageId;
  document.getElementById('sidebar').innerHTML = generateSidebar(pageId);
  const config = SECTIONS_CONFIG[pageId];

  document.getElementById('page-title').innerHTML = `${config.title}`;

  // Check if already authenticated this session
  const authed = sessionStorage.getItem('auth_' + pageId);
  if (authed === 'true') {
    if (globalAppState) _renderEntryContent(pageId);
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
          <input type="password" maxlength="1" class="pin-box" id="pin1" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin2" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin3" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin4" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
        </div>
        <div style="margin-bottom:0.8rem;">
          <button type="button" id="toggle-pin" style="background:none; border:none; cursor:pointer; font-size:0.85rem; color:#64748b; font-weight:600; display:flex; align-items:center; gap:4px; margin:0 auto;" onclick="const pins=document.querySelectorAll('.pin-box'); const isHidden=pins[0].type==='password'; pins.forEach(p=>p.type=isHidden?'text':'password'); this.innerHTML=isHidden?'🙈 Hide PIN':'👁️ Show PIN';">
            👁️ Show PIN
          </button>
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

  setTimeout(() => {
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
              <th>Absent</th>
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
        <td style="text-align: center; color: var(--text-dark); font-weight: 700; background: rgba(0,0,0,0.02);">${row.authorized}</td>
        <td style="text-align: center;"><input type="number" min="0" data-group="${groupName}" data-index="${index}" data-field="existing" value="${row.existing}" class="entry-input"></td>
        <td style="text-align: center;"><input type="number" min="0" data-group="${groupName}" data-index="${index}" data-field="present" value="${row.present}" class="entry-input"></td>
        <td class="absent-val" style="font-weight:600; color:#ef4444;">${row.absent}</td>
      </tr>`;
      });

      html += `<tr class="total-row">
        <td>Total</td>
        <td class="sum-auth" style="text-align: center;">${sums.auth}</td>
        <td class="sum-exist" style="text-align: center;">${sums.exist}</td>
        <td class="sum-pres" style="text-align: center;">${sums.pres}</td>
        <td class="sum-abs" style="text-align: center;">${sums.abs}</td>
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

    // Re-init reveal to catch the new tables
    initScrollReveal();

    document.getElementById('btn-export').addEventListener('click', () => {
      exportEntryReport(pageId, config.title);
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      // Add history notification
      const now = new Date();
      if (!state.history) state.history = [];

      // Formatting: 06 March 26
      const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: '2-digit' });
      // Formatting: 10:45 PM
      const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      state.history.unshift({
        page: SECTIONS_CONFIG[pageId].title,
        time: timeFormatter.format(now),
        date: dateFormatter.format(now),
        timestamp: Date.now()
      });
      // Keep max 20 history items
      if (state.history.length > 20) state.history.pop();
      localStorage.setItem('has_new_notifications', 'true');

      saveAppState(state);

      alert('Entry Updated & Saved to Dashboard Successfully!');
      window.location.href = 'index.html';
    });

  }, 10); // End setTimeout macro task
}

function exportEntryReport(pageId, title) {
  const content = document.getElementById('report-container');

  const clone = content.cloneNode(true);
  clone.classList.add('a4-report');

  // Create header for the export
  const header = document.createElement('div');
  header.className = 'report-header-flex';
  header.style.marginBottom = '20px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'flex-start';
  header.innerHTML = `
    <div class="report-title-container" style="padding:0; flex:1;">
      <h2 style="color:#854d0e; font-size:2rem; font-weight:800; margin-bottom:4px; margin-top:0;">MEP FAN LTD.</h2>
      <div class="theme-accent-line" style="width:120px; height:3px; background:#facc15; margin-bottom:8px; border-radius:3px;"></div>
      <p style="font-weight:700; font-size:1.1rem; color:#475569; text-transform:uppercase; margin:0;">${title} Manpower Report</p>
    </div>
    <div style="text-align:right; flex-shrink:0;">
      <div class="clock-widget" id="export-clock-widget" style="padding:0.8rem 1.5rem; min-width:150px; background:#ffffff; border-radius:12px; border:2px solid #e2e8f0; margin:0; box-shadow:none;">
        <div class="analog-clock" style="width:90px; height:90px; margin:0 auto 0.5rem auto; border:3px solid #cbd5e1; background:#ffffff; box-shadow:none; position:relative; border-radius:50%;">
          <div class="clock-face" style="position:relative; width:100%; height:100%;">
            <div class="number number-12" style="position:absolute; font-weight:700; font-size:0.65rem; color:#64748b; top:8%; left:50%; transform:translateX(-50%);">12</div>
            <div class="number number-3" style="position:absolute; font-weight:700; font-size:0.65rem; color:#64748b; right:10%; top:50%; transform:translateY(-50%);">3</div>
            <div class="number number-6" style="position:absolute; font-weight:700; font-size:0.65rem; color:#64748b; bottom:8%; left:50%; transform:translateX(-50%);">6</div>
            <div class="number number-9" style="position:absolute; font-weight:700; font-size:0.65rem; color:#64748b; left:10%; top:50%; transform:translateY(-50%);">9</div>
            <div class="hand hour-hand" id="export-hour-hand" style="position:absolute; bottom:50%; left:50%; transform-origin:bottom; border-radius:6px; width:3px; height:25px; background:#334155; margin-left:-1.5px; box-shadow:none;"></div>
            <div class="hand min-hand" id="export-min-hand" style="position:absolute; bottom:50%; left:50%; transform-origin:bottom; border-radius:6px; width:2px; height:35px; background:#334155; margin-left:-1px; box-shadow:none;"></div>
            <div class="hand second-hand" id="export-second-hand" style="position:absolute; bottom:50%; left:50%; transform-origin:bottom; border-radius:6px; width:2px; height:40px; background:#dc2626; margin-left:-1px; box-shadow:none;"></div>
            <div class="clock-center" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:6px; height:6px; background:#334155; border-radius:50%; z-index:2; box-shadow:none;"></div>
          </div>
        </div>
        <div class="digital-time" id="export-digital-time" style="font-weight:600; font-size:1.5rem; color:#0f172a; letter-spacing:-0.02em; font-family:'Inter', sans-serif; margin-bottom:0.2rem; display:flex; align-items:flex-start; justify-content:center;">--:--:-- --</div>
        <div class="clock-date" id="export-clock-date" style="font-weight:600; font-size:0.8rem; color:#475569; background:transparent;">--</div>
      </div>
    </div>
  `;

  clone.insertBefore(header, clone.firstChild);

  // Directly initialize the export clock immediately before html2canvas processes it
  const now = new Date();
  const seconds = now.getSeconds();
  const mins = now.getMinutes();
  const hour = now.getHours();

  const eHourHand = clone.querySelector('#export-hour-hand');
  const eMinHand = clone.querySelector('#export-min-hand');
  const eSecondHand = clone.querySelector('#export-second-hand');
  const eDigital = clone.querySelector('#export-digital-time');
  const eDate = clone.querySelector('#export-clock-date');

  if (eHourHand) eHourHand.style.transform = `rotate(${((hour / 12) * 360) + ((mins / 60) * 30)}deg)`;
  if (eMinHand) eMinHand.style.transform = `rotate(${((mins / 60) * 360) + ((seconds / 60) * 6)}deg)`;
  if (eSecondHand) eSecondHand.style.transform = `rotate(${((seconds / 60) * 360)}deg)`;

  let h = String(hour % 12 || 12).padStart(2, '0');
  let ampm = hour >= 12 ? 'PM' : 'AM';
  let m = mins.toString().padStart(2, '0');
  if (eDigital) eDigital.innerHTML = `${h}:${m}<span style="font-size: 0.85rem; font-weight: 700; margin-left: 6px; margin-bottom: 2px; color: #64748b; letter-spacing: 0;">${ampm}</span>`;
  if (eDate) eDate.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: '2-digit' });

  // Setup off-screen rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '850px';
  container.style.background = '#ffffff';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';

  const currentTheme = document.body.getAttribute('data-theme');
  if (currentTheme) {
    container.setAttribute('data-theme', currentTheme);
  }

  // Adjust table styling for export
  const tables = clone.querySelectorAll('table');
  tables.forEach(t => {
    t.style.width = '100%';
    t.style.borderCollapse = 'collapse';
    t.style.border = '2px solid #0f172a';
    t.style.marginBottom = '1.5rem';
    t.style.backgroundColor = '#ffffff';
  });

  const headers = clone.querySelectorAll('th');
  headers.forEach(th => {
    th.style.background = '#e2e8f0';
    th.style.border = '1px solid #0f172a';
    th.style.padding = '8px';
    th.style.color = '#000';
    th.style.fontWeight = '800';
  });

  const cells = clone.querySelectorAll('td');
  cells.forEach(td => {
    td.style.border = '1px solid #0f172a';
    td.style.padding = '6px';

    // Convert inputs to text for print
    const input = td.querySelector('input');
    if (input) {
      td.textContent = input.value;
    }

    // Keep absent cells red, others black
    const isAbsent = td.classList.contains('absent-val') || td.classList.contains('sum-abs');
    const val = parseInt(td.textContent) || 0;
    if (isAbsent && val > 0) {
      td.style.setProperty('color', '#dc2626', 'important');
      td.style.setProperty('font-weight', '900', 'important');
    } else {
      td.style.color = '#000';
    }
  });

  const titles = clone.querySelectorAll('h3');
  titles.forEach(h => {
    h.style.color = '#000';
    h.style.borderBottom = '1px solid #cbd5e1';
    h.style.paddingBottom = '4px';
    h.style.marginBottom = '10px';
  });

  // Strip input wrappers from clone
  clone.querySelectorAll('.table-container').forEach(tc => {
    tc.style.boxShadow = 'none';
    tc.style.background = 'transparent';
    tc.style.border = 'none';
  });
  clone.querySelectorAll('.glass-card').forEach(gc => {
    gc.style.boxShadow = 'none';
    gc.style.background = 'transparent';
    gc.style.border = 'none';
    gc.style.padding = '0';
    gc.style.marginBottom = '20px';
  });

  container.appendChild(clone);
  document.body.appendChild(container);

  if (typeof html2canvas === 'undefined') {
    alert("Missing html2canvas script! Please ensure html2canvas is loaded on the entry sheet.");
    document.body.removeChild(container);
    return;
  }

  html2canvas(container, {
    scale: 7,
    backgroundColor: '#ffffff',
    windowWidth: 850
  }).then(canvas => {
    document.body.removeChild(container);
    const link = document.createElement('a');
    link.download = `MEP_${title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
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
  { id: 'R4', section: 'Section', designation: 'Manager', rowspan: 7, type: 'filter', filters: { designation: 'Manager' } },
  { id: 'R5', designation: 'Incharge Production', type: 'filter', filters: { designation: 'In-charge' } },
  { id: 'R6', designation: 'Engineer Production', type: 'filter', filters: { designation: 'Engineer' } },
  { id: 'R7', designation: 'Senior Supervisor', type: 'filter', filters: { designation: 'Sr. Supervisor' } },
  { id: 'R8', designation: 'Jr. Officer', type: 'filter', filters: { designation: 'Jr. Officer' } },
  { id: 'R9', designation: 'Computer Operator', type: 'filter', filters: { designation: 'Computer Operator' } },
  { id: 'R10', designation: 'Technical Man', type: 'filter', filters: { designation: 'Technicalman' } },

  { id: 'R11', section: 'Fan Assemble', designation: 'Worker', type: 'filter', filters: { group: 'Fan Assemble', designation: 'Worker' }, link: 'entry.html?page=anik' },
  { id: 'R12', section: 'Fan Armature', designation: 'Worker', type: 'filter', filters: { group: 'Fan Armature', designation: 'Worker' }, link: 'entry.html?page=takbir' },
  { id: 'R13', section: 'Fan Blade and Dimmer', designation: 'Worker', type: 'filter', filters: { group: 'Fan Dimmer & Blade', designation: 'Worker' }, link: 'entry.html?page=anik' },
  { id: 'R14', section: 'Fan Replace', designation: 'Worker', type: 'filter', filters: { group: 'Fan Replace', designation: 'Worker' }, link: 'entry.html?page=takbir' },
  { id: 'R15', section: 'Fan Lathe', designation: 'Worker', type: 'filter', filters: { group: 'Fan Lathe', designation: 'Worker' }, link: 'entry.html?page=anwar' },
  { id: 'R16', section: 'Fan Auto Powder Coating', designation: 'Worker', type: 'filter', filters: { group: 'Fan Auto Powder Coating', designation: 'Worker' }, link: 'entry.html?page=anwar' },
  { id: 'R17', section: 'Fan Rojonigondha', designation: 'Worker', type: 'filter', filters: { group: 'Fan Rojonigondha', designation: 'Worker' }, link: 'entry.html?page=bikash' },
  { id: 'R18', section: 'Fan Sada Shapla', designation: 'Worker', type: 'filter', filters: { group: 'Fan Sada Shapla', designation: 'Worker' }, link: 'entry.html?page=bikash' },
  { id: 'R19', section: 'Fan Power Press', designation: 'Worker', type: 'filter', filters: { group: 'Power Press & Stamping', designation: 'Worker' }, link: 'entry.html?page=monir' },
  { id: 'R20', section: 'Fan Die Casting', designation: 'Worker', type: 'filter', filters: { group: 'Fan Dalai & Die Casting', designation: 'Worker' }, link: 'entry.html?page=monir' },

  { id: 'R21', section: '', designation: 'Production Total', type: 'formula', formulaStr: 'SUM(R4:R20)', isTotal: true },

  { id: 'R22', section: '', designation: 'S Grade', type: 'formula', formulaStr: 'R7+R9+R10+R11+R12+R13+R14+R15+R16+R17+R18+R19+R20', isTotal: true },
  { id: 'R23', section: '', designation: 'M Grade', type: 'formula', formulaStr: 'R4+R5+R6+R8', isTotal: true }
];

function calculateDashboardData(state) {
  const values = {};

  // First Pass: Resolve filters
  for (const cfg of EXACT_DASHBOARD_ROWS) {
    if (cfg.type === 'filter') {
      let auth = 0, exist = 0, pres = 0, abs = 0;

      for (const [pageId, groups] of Object.entries(state)) {
        if (pageId === 'history') continue;
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

window.renderDashboard = function () {
  currentActivePageId = 'index';
  if (globalAppState) {
    _performDashboardRender();
  }
}

function _performDashboardRender() {
  try {
    document.getElementById('sidebar').innerHTML = generateSidebar('index');

    // Clear all entry page auth so password is required again
    Object.keys(SECTIONS_CONFIG).forEach(key => sessionStorage.removeItem('auth_' + key));

    // Yield to browser main thread so CSS animations can start instantly
    setTimeout(() => {
      const state = getAppState();
      const calculatedData = calculateDashboardData(state);

      const hasNewNoti = localStorage.getItem('has_new_notifications') === 'true';
      const historyList = (state.history || []).map(h => `
    <div style="padding:0.8rem 1rem; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:6px; transition:background 0.2s; cursor:default;" onmouseover="this.style.background='var(--glass-bg)'" onmouseout="this.style.background='transparent'">
      <div style="font-weight:700; font-size:0.95rem; color:var(--text-dark); display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" fill="none" stroke="#ca8a04" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        ${h.page} Updated
      </div>
      <div style="font-size:0.8rem; color:var(--text-light); display:flex; justify-content:space-between; font-weight:500;">
        <span>📅 ${h.date}</span>
        <span>🕒 ${h.time}</span>
      </div>
    </div>
  `).join('') || '<div style="padding:1.5rem; text-align:center; color:var(--text-light); font-size:0.95rem; font-weight:500;">No recent updates</div>';

      const container = document.getElementById('dashboard-container');
      container.innerHTML = `
    <!-- Top right notification and reminder bells -->
    <div style="position: fixed; top: 1.5rem; right: 2.5rem; z-index: 9999; display: flex; gap: 1rem;" class="no-print">
      
      <!-- Admin Broadcast Button (Hidden by default, shows on hover) -->
      <button onclick="window.sendAdminBroadcast()" class="no-print" style="opacity: 0; background:#ef4444; color:white; border:none; border-radius:50%; width:50px; height:50px; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:0 6px 15px rgba(239, 68, 68, 0.4); transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter:blur(8px);" onmouseover="this.style.opacity='1'; this.style.transform='scale(1.1)'; this.style.background='#dc2626'" onmouseout="this.style.opacity='0'; this.style.transform='scale(1)'; this.style.background='#ef4444'" title="Admin Blast Notification">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-3.14 8.167-7.221.055-.419.145-.826.262-1.221A3.896 3.896 0 0119.897 4m0 0l-5.632 1.408A5.961 5.961 0 0011 8H7a3 3 0 00-3 3v2a3 3 0 003 3h4m0 0v6l-2-6"></path></svg>
      </button>

      <!-- Push Notification Toggle -->
      ${buildPushNotificationButton()}

      <!-- Reminder Button -->
      <div class="reminder-container" style="position:relative;">
        <button id="reminder-btn" class="no-print" style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:50%; width:50px; height:50px; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position:relative; backdrop-filter:blur(8px);" onmouseover="this.style.transform='scale(1.05)'; this.style.background='rgba(255,255,255,0.7)';" onmouseout="this.style.transform='scale(1)'; this.style.background='var(--glass-bg)';" onclick="event.stopPropagation(); const d = document.getElementById('reminder-dropdown'); const n = document.getElementById('noti-dropdown'); if(n) n.style.display='none'; d.style.display = (d.style.display === 'none' || d.style.display === '') ? 'flex' : 'none'; updateReminderList();">
          <svg width="24" height="24" fill="none" stroke="var(--text-dark)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span id="reminder-badge" style="position:absolute; top:12px; right:12px; width:10px; height:10px; background:#eab308; border-radius:50%; border:2px solid white; display:none; box-shadow:0 0 8px rgba(234,179,8,0.6);"></span>
        </button>
        
        <div id="reminder-dropdown" class="glass-card no-print" style="position:absolute; top:65px; left:auto; right:-10px; width:340px; z-index:100; display:none; flex-direction:column; padding:0; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15); transform-origin: top right; animation: scaleIn 0.2s ease-out;">
          <div style="padding:1.2rem; border-bottom:1px solid rgba(0,0,0,0.08); font-weight:800; font-size:1.1rem; color:var(--text-dark); background:rgba(255,255,255,0.4); display:flex; justify-content:space-between; align-items:center;">
             <span>Pending Today</span>
             <span id="reminder-count" style="background:#eab308; color:white; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">0</span>
          </div>
          <div id="reminder-list" style="max-height:350px; overflow-y:auto; padding:0;">
          </div>
        </div>
      </div>

      <!-- Notification Bell -->
      <div class="notification-container" style="position:relative;">
        <button id="noti-btn" class="no-print" style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:50%; width:50px; height:50px; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position:relative; backdrop-filter:blur(8px);" onmouseover="this.style.transform='scale(1.05)'; this.style.background='rgba(255,255,255,0.7)';" onmouseout="this.style.transform='scale(1)'; this.style.background='var(--glass-bg)';" onclick="event.stopPropagation(); const d = document.getElementById('noti-dropdown'); const r = document.getElementById('reminder-dropdown'); if(r) r.style.display='none'; d.style.display = (d.style.display === 'none' || d.style.display === '') ? 'flex' : 'none'; document.getElementById('noti-badge').style.display='none'; localStorage.removeItem('has_new_notifications');">
          <svg width="24" height="24" fill="none" stroke="var(--text-dark)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span id="noti-badge" style="position:absolute; top:12px; right:12px; width:10px; height:10px; background:#ef4444; border-radius:50%; border:2px solid white; display:${hasNewNoti ? 'block' : 'none'}; box-shadow:0 0 8px rgba(239,68,68,0.6);"></span>
        </button>
        
        <div id="noti-dropdown" class="glass-card no-print" style="position:absolute; top:65px; left:auto; right:-10px; width:340px; z-index:100; display:none; flex-direction:column; padding:0; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15); transform-origin: top right; animation: scaleIn 0.2s ease-out;">
          <div style="padding:1.2rem; border-bottom:1px solid rgba(0,0,0,0.08); font-weight:800; font-size:1.1rem; color:var(--text-dark); background:rgba(255,255,255,0.4); display:flex; justify-content:space-between; align-items:center;">
            <span>History Update</span>
            <button onclick="clearHistory()" title="Clear All History" style="background:none; border:1px solid rgba(239,68,68,0.3); border-radius:8px; cursor:pointer; padding:4px 10px; display:flex; align-items:center; gap:4px; color:#ef4444; font-size:0.72rem; font-weight:700; transition:all 0.2s; font-family:'Inter',sans-serif;" onmouseover="this.style.background='rgba(239,68,68,0.1)'; this.style.borderColor='#ef4444';" onmouseout="this.style.background='none'; this.style.borderColor='rgba(239,68,68,0.3)';">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Clear
            </button>
          </div>
          <div id="noti-list" style="max-height:350px; overflow-y:auto; padding:0;">
            ${historyList}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom right export button -->
    <div style="position: fixed; bottom: 2.5rem; right: 2.5rem; z-index: 9999;" class="no-print">
      <button onclick="exportReport()" class="water-btn">
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Download Report
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
        <div class="theme-accent-line"></div>
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
        const data = calculatedData[row.id] || { auth: 0, exist: 0, pres: 0, abs: 0 };
        const mgmtIds = ['R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10'];
        let rowClass = row.isTotal ? 'total-row' : (mgmtIds.includes(row.id) ? 'management-row' : '');

        html += `<tr class="${rowClass}">`;

        if (row.section !== undefined) {
          if (row.rowspan) {
              html += `<td rowspan="${row.rowspan}" style="font-weight:700; vertical-align:middle; text-align:center; background:rgba(255,255,255,0.35); border-right:1px solid rgba(255,255,255,0.6); padding: 0.5rem;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;">
              <span style="color:#32cd32; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em;">${row.section}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <polyline points="19 15 12 22 5 15"></polyline>
              </svg>
            </div>
          </td>`;
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

      // Initialize reminder badge silently on load
      updateReminderList(true);

    }); // End setTimeout macro-task

  } catch (err) {
    console.error(err);
    document.getElementById('dashboard-container').innerHTML = `
      <div style="padding: 2rem; color: #ef4444; background: #fee2e2; border-radius: 8px; margin: 2rem; font-weight: bold;">
        <h2>Dashboard Render Error</h2>
        <pre>${err.stack}</pre>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
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

  let h = String(hour % 12 || 12).padStart(2, '0');
  let ampm = hour >= 12 ? 'PM' : 'AM';
  let m = mins.toString().padStart(2, '0');
  digitalTime.innerHTML = `${h}:${m}<span style="font-size: 0.85rem; font-weight: 700; margin-top: 0.3rem; margin-left: 6px; color: #64748b; letter-spacing: 0;">${ampm}</span>`;

  const d = now.getDate();
  const getSuffix = (n) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  clockDate.textContent = `${d}${getSuffix(d)} ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
}

function exportReport() {
  const content = document.getElementById('export-content');

  // Clone the node to prevent screen jumping and layout breaking
  const clone = content.cloneNode(true);
  clone.classList.add('a4-report');

  // Synchronously update the clock on the cloned node before html2canvas processes it
  const now = new Date();
  const seconds = now.getSeconds();
  const mins = now.getMinutes();
  const hour = now.getHours();

  const eHourHand = clone.querySelector('#hour-hand');
  const eMinHand = clone.querySelector('#min-hand');
  const eSecondHand = clone.querySelector('#second-hand');
  const eDigital = clone.querySelector('#digital-time');
  const eDate = clone.querySelector('#clock-date');

  if (eHourHand) eHourHand.style.transform = `rotate(${((hour / 12) * 360) + ((mins / 60) * 30)}deg)`;
  if (eMinHand) eMinHand.style.transform = `rotate(${((mins / 60) * 360) + ((seconds / 60) * 6)}deg)`;
  if (eSecondHand) eSecondHand.style.transform = `rotate(${((seconds / 60) * 360)}deg)`;

  let h = String(hour % 12 || 12).padStart(2, '0');
  let ampm = hour >= 12 ? 'PM' : 'AM';
  let m = mins.toString().padStart(2, '0');
  if (eDigital) eDigital.innerHTML = `${h}:${m}<span style="font-size: 0.85rem; font-weight: 700; margin-left: 6px; margin-bottom: 2px; color: #64748b; letter-spacing: 0;">${ampm}</span>`;
  const d = now.getDate();
  const getSuffix = (n) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
  };
  if (eDate) eDate.textContent = `${d}${getSuffix(d)} ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

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

  // Apply computed shadow inline to bypass html2canvas CSS var limitations
  container.querySelectorAll('.glass-card, .table-container, .report-header-flex, .clock-widget, .analog-clock, .btn').forEach(el => {
    const comp = window.getComputedStyle(el);
    if (comp.boxShadow && comp.boxShadow !== 'none') {
      el.style.boxShadow = comp.boxShadow;
    }
  });

  // Hide no-print elements inside the clone
  clone.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');

  // Enforce explicit borders on tables to prevent html2canvas clipping
  clone.querySelectorAll('table').forEach(t => {
    t.style.borderCollapse = 'collapse';
    t.style.border = '2px solid #0f172a';
    t.style.backgroundColor = '#ffffff';
  });

  // Force absent values to red in exported JPG
  clone.querySelectorAll('tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length === 0) return;
    const lastCell = cells[cells.length - 1]; // Absent column is always last
    const val = parseInt(lastCell.textContent) || 0;
    if (val > 0) {
      lastCell.style.setProperty('color', '#dc2626', 'important');
      lastCell.style.setProperty('font-weight', '900', 'important');
    }
  });

  // Use configuration to ensure entire table renders
  html2canvas(clone, {
    scale: 7,
    useCORS: true,
    scrollY: 0,
    windowWidth: clone.scrollWidth,
    windowHeight: clone.scrollHeight
  }).then(canvas => {
    // Clean up
    document.body.removeChild(container);

    const link = document.createElement('a');
    link.download = 'MEP_Fan_Manpower_Report_Full.jpg';
    link.href = canvas.toDataURL('image/jpeg', 1.0);
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
  { id: 'mint', name: 'Mint Fresh', swatch: 'linear-gradient(135deg, #6ee7b7, #34d399)' },
  { id: 'sunset', name: 'Sunset Orange', swatch: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { id: 'arctic', name: 'Arctic Ice', swatch: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
  { id: 'lavender', name: 'Lavender Dream', swatch: 'linear-gradient(135deg, #c084fc, #a855f7)' },
  { id: 'peach', name: 'Peach Blossom', swatch: 'linear-gradient(135deg, #fdba74, #fb923c)' },
  { id: 'silver-mist', name: 'Silver Mist', swatch: 'linear-gradient(135deg, #e2e8f0, #94a3b8)' },
  { id: 'sky-azure', name: 'Sky Azure', swatch: 'linear-gradient(135deg, #bae6fd, #38bdf8)' },
  { id: 'honey-glow', name: 'Honey Glow', swatch: 'linear-gradient(135deg, #fef08a, #facc15)' },
  { id: 'mint-sorbet', name: 'Mint Sorbet', swatch: 'linear-gradient(135deg, #a7f3d0, #34d399)' },
  { id: 'light-maroon', name: 'Light Maroon', swatch: 'linear-gradient(135deg, #fda4af, #fb7185)' },
  { id: 'chocolate', name: 'Chocolate', swatch: 'linear-gradient(135deg, #fcd34d, #d97706)' },
  { id: 'watermelon', name: 'Watermelon', swatch: 'linear-gradient(135deg, #fb7185, #f43f5e)' },
  { id: 'parrot', name: 'Parrot', swatch: 'linear-gradient(135deg, #d9f99d, #a3e635)' }
];

function setTheme(themeId) {
  const currentTheme = document.body.getAttribute('data-theme') || 'rose';

  // Smooth crossfade animation for gradients
  if (currentTheme !== themeId && document.body.classList.contains('theme-init-done')) {
    const fader = document.createElement('div');
    fader.style.position = 'fixed';
    fader.style.top = '0';
    fader.style.left = '0';
    fader.style.width = '100vw';
    fader.style.height = '100vh';
    fader.style.zIndex = '-999';
    fader.style.pointerEvents = 'none';
    fader.style.background = window.getComputedStyle(document.body).background;
    fader.style.transition = 'opacity 1.5s ease-in-out';
    fader.style.opacity = '1';

    document.body.appendChild(fader);

    // Force browser reflow to ensure the transition engine registers opacity: 1 first
    void fader.offsetWidth;

    setTimeout(() => {
      fader.style.opacity = '0';
      setTimeout(() => fader.remove(), 1600);
    }, 50);
  }

  if (themeId === 'rose') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', themeId);
  }
  localStorage.setItem('mep_theme', themeId);

  // Update active state in dropdown
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeId);
  });

  if (!document.body.classList.contains('theme-init-done')) {
    setTimeout(() => document.body.classList.add('theme-init-done'), 100);
  }
}

function initThemePicker() {
  // Don't add duplicate
  if (document.querySelector('.theme-fab')) return;

  const savedTheme = localStorage.getItem('mep_theme') || 'rose';

  const fab = document.createElement('div');
  fab.className = 'theme-fab no-print';
  fab.innerHTML = `
    <div class="theme-backdrop" id="theme-backdrop"></div>
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
    document.getElementById('theme-backdrop').classList.toggle('show');
  });

  // Close dropdown on outside click or backdrop click
  document.addEventListener('click', () => {
    document.getElementById('theme-dropdown')?.classList.remove('open');
    document.getElementById('theme-backdrop')?.classList.remove('show');
  });

  // Apply saved theme
  setTheme(savedTheme);
}


// ═══════════════════════════════════════════════════
// 60fps SCROLL REVEAL ANIMATIONS
// ═══════════════════════════════════════════════════

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  // Observe all scroll-reveal elements
  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

  // Also observe table rows that enter viewport on scroll
  document.querySelectorAll('tbody tr').forEach((row, i) => {
    if (row.getBoundingClientRect().top > window.innerHeight) {
      row.style.opacity = '0';
      row.style.transform = 'translate3d(0, 20px, 0)';
      row.style.transition = `opacity 0.1s cubic-bezier(0.16, 1, 0.3, 1), transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)`;

      const rowObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translate3d(0, 0, 0)';
            rowObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });

      rowObserver.observe(row);
    }
  });
}

// Firebase Synchronization Listener
function setupFirebaseListener() {
  if (window.firebaseDb) {
    // Sync state
    window.firebaseDb.ref('mep_dashboard_state').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        globalAppState = data;
      } else {
        globalAppState = createDefaultState();
        saveAppState(globalAppState);
      }

      // Re-trigger visual rendering without reload
      if (currentActivePageId === 'index') {
        _performDashboardRender();
      } else if (currentActivePageId) {
        const authed = sessionStorage.getItem('auth_' + currentActivePageId);
        if (authed === 'true') {
          _renderEntryContent(currentActivePageId);
        }
      }
    });

    // Listen for entry sheet updates from other devices/users
    let initialUpdateLoad = true;
    window.firebaseDb.ref('mep_last_update_info').on('value', (snapshot) => {
      if (initialUpdateLoad) {
        initialUpdateLoad = false;
        return;
      }
      const data = snapshot.val();
      if (data && data.deviceId !== SESSION_DEVICE_ID) {
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = 'MEP FAN LTD.';
          const options = {
            body: data.actionStr || `🔄 ${data.pageTitle} has been updated`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: 'mep-update-notification',
            vibrate: [100, 50, 100],
            renotify: true
          };

          if ('serviceWorker' in navigator) {
            window.playAlertSoundAndVibrate();
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => {
              new Notification(title, options);
            });
          } else {
            window.playAlertSoundAndVibrate();
            new Notification(title, options);
          }
        }
      }
    });
    
    // Listen for Admin Broadcasts globally
    window.firebaseDb.ref('mep_admin_broadcast').on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const lastSeenStr = localStorage.getItem('mep_last_seen_broadcast');
      const lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0;

      // Ensure Broadcast is newer than what user has seen, and limit it to past 24 hours
      const isNew = data.timestamp > lastSeen;
      const hoursAgo = (Date.now() - data.timestamp) / (1000 * 60 * 60);

      if (isNew && hoursAgo < 24) {
        localStorage.setItem('mep_last_seen_broadcast', data.timestamp.toString());
        
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = '📢 ADMIN ANNOUNCEMENT';
          const options = {
            body: data.message,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: 'mep-broadcast-' + data.timestamp,
            vibrate: [200, 100, 300, 100, 400],
            requireInteraction: true,
            renotify: true
          };

          if ('serviceWorker' in navigator) {
            window.playAlertSoundAndVibrate();
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => new Notification(title, options));
          } else {
            window.playAlertSoundAndVibrate();
            new Notification(title, options);
          }
        }
      }
    });
  } else {
    // Fallback if SDK failed to load
    globalAppState = getAppState();
    if (currentActivePageId === 'index') {
      _performDashboardRender();
    }
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initThemePicker();

  let retryCount = 0;
  const maxRetries = 20; // 10 seconds total

  function trySetupFirebase() {
    if (window.firebaseDb) {
      setupFirebaseListener();
    } else if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(trySetupFirebase, 500);
    } else {
      console.warn("Firebase failed to load after 10 seconds, falling back to local storage.");
      setupFirebaseListener(); // this will hit the fallback
    }
  }

  trySetupFirebase();

  // Restore scroll position after reload
  const scrollPos = sessionStorage.getItem('dashboardScrollPos');
  if (scrollPos) {
    setTimeout(() => window.scrollTo(0, parseInt(scrollPos)), 50);
  }

  setTimeout(initScrollReveal, 100);
});

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('dashboardScrollPos', window.scrollY);
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const notiBtn = document.getElementById('noti-btn');
  const notiDropdown = document.getElementById('noti-dropdown');
  const remBtn = document.getElementById('reminder-btn');
  const remDropdown = document.getElementById('reminder-dropdown');

  if (notiBtn && notiDropdown && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
    notiDropdown.style.display = 'none';
  }

  if (remBtn && remDropdown && !remBtn.contains(e.target) && !remDropdown.contains(e.target)) {
    remDropdown.style.display = 'none';
  }
});

// Clear History
window.clearHistory = function() {
  const state = getAppState();
  state.history = [];
  localStorage.removeItem('has_new_notifications');
  saveAppState(state, "🧹 History has been cleaned");

  // Update the dropdown list immediately
  const list = document.getElementById('noti-list');
  if (list) {
    list.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-light); font-size:0.95rem; font-weight:500;">No recent updates</div>';
  }

  // Trigger Push Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = 'MEP FAN LTD.';
    const options = {
      body: '🧹 History has been cleaned successfully',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'mep-history-clean',
      vibrate: [100, 50, 100],
      renotify: true
    };
    if ('serviceWorker' in navigator) {
      window.playAlertSoundAndVibrate();
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      window.playAlertSoundAndVibrate();
      new Notification(title, options);
    }
  }
};

// Reminder Logic
window.updateReminderList = function (silent = false) {
  const state = getAppState();
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: '2-digit' });
  const todayStr = dateFormatter.format(now);
  const history = state.history || [];

  // Find which sections have been updated today
  const updatedTodayMap = {};
  history.forEach(h => {
    if (h.date === todayStr) {
      updatedTodayMap[h.page] = true;
    }
  });

  const missingSections = [];
  // Loop through all configured pages to find missing ones
  for (const [pageKey, config] of Object.entries(SECTIONS_CONFIG)) {
    if (!updatedTodayMap[config.title]) {
      missingSections.push({ title: config.title, id: pageKey });
    }
  }

  const badge = document.getElementById('reminder-badge');
  const countSpan = document.getElementById('reminder-count');
  const list = document.getElementById('reminder-list');

  if (badge) {
    if (missingSections.length > 0) {
      badge.style.display = 'block';
      if (countSpan) countSpan.textContent = missingSections.length;
    } else {
      badge.style.display = 'none';
      if (countSpan) countSpan.textContent = '0';
    }
  }

  if (list && !silent) {
    if (missingSections.length === 0) {
      list.innerHTML = '<div style="padding:1.5rem; text-align:center; color:#10b981; font-size:0.95rem; font-weight:600;"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" style="display:block; margin:0 auto 8px auto;" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>All sheets updated today!</div>';
    } else {
      list.innerHTML = missingSections.map(s => `
        <a href="entry.html?page=${s.id.replace('qc', 'qc')}" style="text-decoration:none; padding:0.8rem 1rem; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; transition:background 0.2s;" onmouseover="this.style.background='var(--glass-bg)'" onmouseout="this.style.background='transparent'">
          <div style="font-weight:600; font-size:0.95rem; color:var(--text-dark); display:flex; align-items:center; gap:8px;">
            <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ${s.title}
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.1); padding:2px 8px; border-radius:8px;">Missing</span>
        </a>
      `).join('');
    }
  }
};

// ═══════════════════════════════════════════════════
// PUSH NOTIFICATION SYSTEM — Daily 8:00 AM Reminder
// ═══════════════════════════════════════════════════

const MEP_NOTIFICATION = {
  swRegistration: null,
  checkInterval: null,

  // Register the service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      this.swRegistration = reg;
      console.log('✅ Service Worker registered');
      return reg;
    } catch (err) {
      console.error('SW registration failed:', err);
      return null;
    }
  },

  // Request notification permission with nice UI
  async requestPermission() {
    if (!('Notification' in window)) {
      this.showToast('❌ This browser does not support Notifications', 'error');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      this.showToast('⚠️ Notifications are blocked. Please allow from browser settings.', 'warning');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Full activation flow
  async activate() {
    // Step 1: Register SW
    const reg = await this.registerServiceWorker();
    if (!reg) {
      this.showToast('❌ Failed to register Service Worker', 'error');
      return false;
    }

    // Step 2: Request notification permission
    const allowed = await this.requestPermission();
    if (!allowed) {
      return false;
    }

    // Step 3: Mark as enabled
    localStorage.setItem('mep_push_enabled', 'true');

    // Step 4: Tell SW to start checking
    if (reg.active) {
      reg.active.postMessage({ type: 'ENABLE_NOTIFICATIONS' });
    }

    // Step 5: Start main-thread backup checker
    this.startMainThreadChecker();

    // Step 6: Register periodic background sync (if supported)
    this.registerPeriodicSync(reg);

    // Step 7: Start keep-alive pings
    this.startKeepAlive();

    this.showToast('✅ Notifications enabled successfully! You will receive a daily reminder at 8:00 AM.', 'success');
    this.updateButtonState(true);
    return true;
  },

  // Deactivate notifications
  deactivate() {
    localStorage.setItem('mep_push_enabled', 'false');
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.updateButtonState(false);
    this.showToast('🔕 Notifications have been disabled', 'info');
  },

  // Main-thread high precision checker
  startMainThreadChecker() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    // Align tightly to the system clock's exact seconds tick
    const msUntilNextSecond = 1000 - new Date().getMilliseconds();
    setTimeout(() => {
      this.checkTimeAndNotify();
      this.checkInterval = setInterval(() => {
        this.checkTimeAndNotify();
      }, 1000);
    }, msUntilNextSecond);
  },

  // Check if it's 8 AM / 1 PM and notify strictly on time
  async checkTimeAndNotify() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Determine if we are in one of the notification windows (0 to 5 minutes)
    const isAMWindow = (hour === 8 && minute >= 0 && minute <= 5);
    const isPMWindow = (hour === 13 && minute >= 0 && minute <= 5);

    if (isAMWindow || isPMWindow) {
      const timeBlock = isAMWindow ? 'AM' : 'PM';
      // Use timeBlock in tracking key to allow both morning and afternoon reminders!
      const todayKey = `mep_notified_${timeBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

      if (!localStorage.getItem(todayKey)) {
        // Trigger via SW
        if (this.swRegistration && this.swRegistration.active) {
          this.swRegistration.active.postMessage({ type: 'CHECK_NOTIFICATION_NOW' });
        } else {
          // Direct fallback notification
          if (Notification.permission === 'granted') {
            new Notification('🏭 MEP FAN LTD.', {
              body: 'Time to update your Attendance Sheet now. Please do it quickly! ⏰',
              tag: 'mep-attendance-daily',
              renotify: true,
              requireInteraction: true
            });
          }
        }
        localStorage.setItem(todayKey, 'true');
        // Clean up old keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('mep_notified_') && key !== todayKey) {
            // Keep the AM key if we are in PM, etc.
            const otherBlock = isAMWindow ? 'PM' : 'AM';
            const otherKey = `mep_notified_${otherBlock}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
            if (key !== otherKey) {
               localStorage.removeItem(key);
            }
          }
        });
      }
    }
  },

  // Keep service worker alive via periodic pings
  startKeepAlive() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({ type: 'KEEPALIVE' });
      }
    }, 20000); // Every 20 seconds
  },

  // Register periodic background sync
  async registerPeriodicSync(reg) {
    if ('periodicSync' in reg) {
      try {
        await reg.periodicSync.register('mep-daily-check', {
          minInterval: 60 * 60 * 1000 // 1 hour minimum
        });
        console.log('✅ Periodic background sync registered');
      } catch (err) {
        console.log('Periodic sync not available:', err);
      }
    }
  },

  // Show toast notification in-app
  showToast(message, type = 'info') {
    const existing = document.getElementById('mep-toast');
    if (existing) existing.remove();

    const colors = {
      success: { bg: 'linear-gradient(135deg, #10b981, #059669)', border: '#10b981' },
      error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', border: '#ef4444' },
      warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#f59e0b' },
      info: { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: '#3b82f6' }
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.id = 'mep-toast';
    toast.style.cssText = `
      position:fixed; top:1.5rem; left:50%; transform:translateX(-50%) translateY(-120%);
      background:${c.bg}; color:white; padding:1rem 1.5rem; border-radius:14px;
      font-size:0.95rem; font-weight:600; z-index:99999; box-shadow:0 12px 40px rgba(0,0,0,0.25);
      transition:transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); max-width:90vw; text-align:center;
      backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.2); font-family:'Inter',sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(-120%)';
      setTimeout(() => toast.remove(), 600);
    }, 4000);
  },

  // Update the bell button UI state
  updateButtonState(enabled) {
    const btn = document.getElementById('mep-push-btn');
    if (!btn) return;
    const icon = btn.querySelector('.push-icon');
    const label = btn.querySelector('.push-label');
    if (enabled) {
      if (icon) icon.textContent = '🔔';
      if (label) label.textContent = 'ON';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btn.style.boxShadow = '0 4px 20px rgba(16,185,129,0.4)';
      btn.title = 'Daily Notification ON — Click to disable';
    } else {
      if (icon) icon.textContent = '🔕';
      if (label) label.textContent = 'OFF';
      btn.style.background = 'var(--glass-bg)';
      btn.style.boxShadow = 'var(--glass-shadow)';
      btn.title = 'Enable Daily 8AM Notification';
    }
  },

  // Initialize: auto-setup if previously enabled
  async init() {
    const enabled = localStorage.getItem('mep_push_enabled') === 'true';
    if (enabled && 'serviceWorker' in navigator && Notification.permission === 'granted') {
      const reg = await this.registerServiceWorker();
      if (reg) {
        // Wait for SW to be active
        if (reg.active) {
          reg.active.postMessage({ type: 'ENABLE_NOTIFICATIONS' });
        } else {
          reg.addEventListener('activate', () => {
            reg.active.postMessage({ type: 'ENABLE_NOTIFICATIONS' });
          });
        }
        this.startMainThreadChecker();
        this.startKeepAlive();
      }
    }
  }
};

// Build the notification toggle button for the dashboard
function buildPushNotificationButton() {
  const enabled = localStorage.getItem('mep_push_enabled') === 'true' && Notification.permission === 'granted';

  return `
    <div class="push-notification-container" style="position:relative;">
      <button id="mep-push-btn" class="no-print" title="${enabled ? 'Daily Notification ON — Click to toggle' : 'Enable Daily 8AM Notification'}"
        style="background:${enabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--glass-bg)'};
        border:1px solid ${enabled ? 'rgba(255,255,255,0.3)' : 'var(--glass-border)'};
        border-radius:50%; width:50px; height:50px;
        display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1px;
        cursor:pointer; box-shadow:${enabled ? '0 4px 20px rgba(16,185,129,0.4)' : 'var(--glass-shadow)'};
        transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position:relative; backdrop-filter:blur(8px);"
        onmouseover="this.style.transform='scale(1.08)';"
        onmouseout="this.style.transform='scale(1)';"
        onclick="handlePushToggle()">
        <span class="push-icon" style="font-size:1.3rem; line-height:1;">${enabled ? '🔔' : '🔕'}</span>
        <span class="push-label" style="font-size:0.55rem; font-weight:800; color:${enabled ? 'white' : 'var(--text-dark)'}; line-height:1;">${enabled ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  `;
}

// Toggle handler
window.handlePushToggle = async function() {
  const enabled = localStorage.getItem('mep_push_enabled') === 'true';
  if (enabled) {
    MEP_NOTIFICATION.deactivate();
  } else {
    // Show activation modal for first time
    showNotificationModal();
  }
};

// Beautiful activation modal
function showNotificationModal() {
  const existing = document.getElementById('mep-push-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'mep-push-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:99999; display:flex; justify-content:center; align-items:center;
    background:rgba(0,0,0,0.5); backdrop-filter:blur(8px); animation:fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="background:white; border-radius:24px; padding:2.5rem; max-width:380px; width:90%;
      box-shadow:0 25px 60px rgba(0,0,0,0.25); text-align:center; animation:scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">

      <div style="width:80px; height:80px; margin:0 auto 1.2rem; background:linear-gradient(135deg, #fef3c7, #fde68a);
        border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2.5rem;
        box-shadow:0 8px 24px rgba(234,179,8,0.3);">
        🔔
      </div>

      <h3 style="margin:0 0 0.5rem; font-size:1.3rem; font-weight:800; color:#1e293b; font-family:'Inter',sans-serif;">
        Enable Daily Reminder
      </h3>

      <p style="color:#64748b; font-size:0.92rem; line-height:1.6; margin:0 0 1.5rem; font-family:'Inter',sans-serif;">
        Every day at <strong style="color:#ef4444;">8:00 AM</strong> you will receive a notification on your phone/computer to
        <strong style="color:#1e293b;">update the Attendance Sheet</strong>.
      </p>

      <div style="display:flex; flex-direction:column; gap:0.7rem;">
        <button onclick="activatePushFromModal()" style="width:100%; padding:0.85rem; background:linear-gradient(135deg, #10b981, #059669);
          color:white; border:none; border-radius:14px; font-size:1rem; font-weight:700; cursor:pointer;
          box-shadow:0 6px 20px rgba(16,185,129,0.4); transition:all 0.2s;
          font-family:'Inter',sans-serif;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 28px rgba(16,185,129,0.5)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(16,185,129,0.4)';">
          ✅ Yes, Enable Now
        </button>
        <button onclick="document.getElementById('mep-push-modal').remove()" style="width:100%; padding:0.7rem;
          background:transparent; color:#64748b; border:1px solid #e2e8f0; border-radius:14px;
          font-size:0.9rem; font-weight:600; cursor:pointer; transition:all 0.2s;
          font-family:'Inter',sans-serif;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='transparent';">
          Maybe Later
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

window.activatePushFromModal = async function() {
  const modal = document.getElementById('mep-push-modal');
  if (modal) modal.remove();
  await MEP_NOTIFICATION.activate();
};

// Auto-initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
  MEP_NOTIFICATION.init();
});

// ═══════════════════════════════════════════════════
// PWA INSTALL PROMPT SYSTEM
// ═══════════════════════════════════════════════════

let deferredInstallPrompt = null;

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

// Detect if already installed
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hideInstallBanner();
  localStorage.setItem('mep_pwa_installed', 'true');
});

function showInstallBanner() {
  // Don't show if user dismissed it recently (within 24 hours)
  const dismissed = localStorage.getItem('mep_install_dismissed');
  if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return;

  // Don't show if already installed
  if (localStorage.getItem('mep_pwa_installed') === 'true') return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  // Remove old banner if exists
  const existing = document.getElementById('mep-install-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'mep-install-banner';
  banner.className = 'no-print';
  banner.style.cssText = `
    position:fixed; bottom:6rem; left:50%; transform:translateX(-50%) translateY(150%);
    background:white; border-radius:20px; padding:1.2rem 1.5rem; max-width:420px; width:92%;
    box-shadow:0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
    z-index:99998; display:flex; align-items:center; gap:1rem;
    transition:transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family:'Inter',sans-serif;
  `;

  banner.innerHTML = `
    <img src="icon-192.png" alt="MEP Fan" style="width:52px; height:52px; border-radius:14px; flex-shrink:0;
      box-shadow:0 4px 12px rgba(0,0,0,0.15); object-fit:cover;">
    <div style="flex:1; min-width:0;">
      <div style="font-weight:800; font-size:0.95rem; color:#1e293b; margin-bottom:2px;">Install Fan Attendance</div>
      <div style="font-size:0.78rem; color:#64748b; font-weight:500;">Add to Home Screen for quick access</div>
    </div>
    <div style="display:flex; gap:0.5rem; flex-shrink:0;">
      <button onclick="installPWA()" style="background:linear-gradient(135deg, #10b981, #059669); color:white;
        border:none; border-radius:12px; padding:0.55rem 1rem; font-size:0.82rem; font-weight:700;
        cursor:pointer; transition:all 0.2s; box-shadow:0 4px 12px rgba(16,185,129,0.3);
        font-family:'Inter',sans-serif;"
        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16,185,129,0.4)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)';">
        Install
      </button>
      <button onclick="dismissInstallBanner()" style="background:none; border:1px solid #e2e8f0;
        border-radius:12px; padding:0.55rem 0.7rem; cursor:pointer; color:#94a3b8; font-size:0.85rem;
        transition:all 0.2s; font-family:'Inter',sans-serif;"
        onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';"
        onmouseout="this.style.background='none'; this.style.borderColor='#e2e8f0';">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  // Slide in animation
  requestAnimationFrame(() => {
    setTimeout(() => {
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
  });
}

function hideInstallBanner() {
  const banner = document.getElementById('mep-install-banner');
  if (banner) {
    banner.style.transform = 'translateX(-50%) translateY(150%)';
    setTimeout(() => banner.remove(), 600);
  }
}

window.installPWA = async function() {
  if (!deferredInstallPrompt) {
    // Fallback: show manual instructions
    alert('To install: tap the browser menu (⋮) → "Add to Home Screen" or "Install App"');
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === 'accepted') {
    localStorage.setItem('mep_pwa_installed', 'true');
    hideInstallBanner();
  }

  deferredInstallPrompt = null;
};

window.dismissInstallBanner = function() {
  localStorage.setItem('mep_install_dismissed', Date.now().toString());
  hideInstallBanner();
};
