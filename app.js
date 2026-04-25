// ═══════════════════════════════════════════════════
// APP VERSION — update this string when you deploy a
// new release. The change count below auto-increments
// on every data save.
// ═══════════════════════════════════════════════════
const APP_VERSION = '2.5.0';

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

window.playAlertSoundAndVibrate = function () {
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
  } catch (e) { }
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
window.sendAdminBroadcast = function () {
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

    // Auto-increment the global change counter
    window.firebaseDb.ref('mep_change_count')
      .transaction(current => (current || 0) + 1)
      .then(() => _loadAndDisplayChangeCount())
      .catch(() => {});
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

// ────────────────────────────────────────────────────────────
// Smooth click + page transition for internal links.
// Delegates a single click listener on the document so it works for any
// sidebar re-renders. Spawns a water-ripple at the click point on nav-links,
// adds a brief press-feedback class, then fades the page out before
// navigating. The next page already starts with opacity:0/translateX(14px)
// and slides in — so the two halves feel like one smooth transition.
// ────────────────────────────────────────────────────────────
let __smoothNavInFlight = false;

function spawnRipple(el, e, className) {
  const rect = el.getBoundingClientRect();
  const x = (e && typeof e.clientX === 'number') ? e.clientX - rect.left : rect.width / 2;
  const y = (e && typeof e.clientY === 'number') ? e.clientY - rect.top : rect.height / 2;
  const ripple = document.createElement('span');
  ripple.className = className;
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

function installSmoothNav() {
  if (window.__smoothNavInstalled) return;
  window.__smoothNavInstalled = true;

  document.addEventListener('click', (e) => {
    // Non-navigating glass buttons: ripple + spring press only
    if (!__smoothNavInFlight) {
      const glassBtn = e.target.closest('.glass-btn');
      if (glassBtn && !glassBtn.matches('a[href]')) {
        spawnRipple(glassBtn, e, 'glass-btn-ripple');
        glassBtn.classList.remove('glass-btn-pressing');
        // force reflow so animation restarts even on rapid clicks
        void glassBtn.offsetWidth;
        glassBtn.classList.add('glass-btn-pressing');
        glassBtn.addEventListener('animationend', function handler(ev) {
          if (ev.animationName === 'glassBtnPressSpring') {
            glassBtn.classList.remove('glass-btn-pressing');
            glassBtn.removeEventListener('animationend', handler);
          }
        });
      }
    }

    if (__smoothNavInFlight) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const rawHref = a.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return;

    let url;
    try { url = new URL(rawHref, window.location.href); }
    catch { return; }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    if (a.target && a.target !== '' && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;

    e.preventDefault();
    __smoothNavInFlight = true;

    // Ripple + press feedback for sidebar nav links
    if (a.classList.contains('nav-link')) {
      spawnRipple(a, e, 'nav-link-ripple');
      a.classList.add('nav-link-pressing');
    }
    // Ripple + press feedback for glass buttons that are also links
    if (a.classList.contains('glass-btn')) {
      spawnRipple(a, e, 'glass-btn-ripple');
      a.classList.add('glass-btn-pressing');
    }

    document.body.classList.add('page-leaving');

    window.setTimeout(() => {
      window.location.href = rawHref;
    }, 300);
  }, true);
}

// Install once as soon as possible. Safe to call repeatedly.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installSmoothNav, { once: true });
} else {
  installSmoothNav();
}

function generateSidebar(activePage) {
  const pages = [
    { id: 'index', title: 'Dashboard', url: 'index.html', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
    { id: 'anik', title: 'Entry (Anik)', url: 'entry.html?page=anik', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'takbir', title: 'Entry (Takbir)', url: 'entry.html?page=takbir', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'monir', title: 'Entry (Monir)', url: 'entry.html?page=monir', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'anwar', title: 'Entry (Anwar)', url: 'entry.html?page=anwar', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'bikash', title: 'Entry (Bikash)', url: 'entry.html?page=bikash', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' }
  ];

  let html = `
    <div class="brand-container">
      <div class="brand-icon">
        <img src="icon.svg" alt="MEP Fan Attendance logo" />
      </div>
      <div class="brand">MEP FAN LTD.</div>
      <div class="brand-subtitle">Manpower System</div>
    </div>
    <div class="sidebar-divider"></div>
    <nav style="display:flex; flex-direction:column; gap:0.6rem;">`;
  pages.forEach(p => {
    const isSpecialPrimary = p.id === 'anik' || p.id === 'takbir';
    const isSpecialSecondary = p.id !== 'index' && !isSpecialPrimary;
    const isMainDashboard = p.id === 'index';

    let specialClass = '';
    if (isSpecialPrimary) specialClass = 'special-entry-link';
    if (isSpecialSecondary) specialClass = 'secondary-entry-link';
    if (isMainDashboard) specialClass = 'main-dashboard-link';

    html += `<a href="${p.url}" class="nav-link ${specialClass} ${activePage === p.id ? 'active' : ''}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${p.icon} <span style="white-space:nowrap;">${p.title}</span>
    </a>`;
  });
  html += `</nav>`;

  html += `
    <div class="sidebar-divider"></div>
  `;

  return html;
}

function _loadAndDisplayChangeCount() {
  if (!window.firebaseDb) return;
  window.firebaseDb.ref('mep_change_count').once('value').then(snap => {
    const el = document.getElementById('change-count-label');
    if (el) el.textContent = '';
  }).catch(() => {
    const el = document.getElementById('change-count-label');
    if (el) el.textContent = '';
  });
}

function renderEntryPage(pageId) {
  currentActivePageId = pageId;
  document.getElementById('sidebar').innerHTML = generateSidebar(pageId);
  const config = SECTIONS_CONFIG[pageId];

  // Split "Entry Sheet (Name)" into a small eyebrow label + a large
  // display name so the heading feels editorial.
  const titleMatch = config.title.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (titleMatch) {
    const eyebrow = titleMatch[1];
    const name = titleMatch[2];
    // Split the display name into individual letter spans so each
    // letter can cascade in (and float) with a stagger.
    const nameLetters = Array.from(name).map((ch, i) => {
      const safe = ch === ' ' ? '&nbsp;'
        : ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span class="page-title-letter" style="--i:${i}">${safe}</span>`;
    }).join('');
    document.getElementById('page-title').innerHTML =
      '<span class="page-title-halo" aria-hidden="true"></span>' +
      '<span class="page-title-stars" aria-hidden="true">' +
        '<span class="page-title-star s1"></span>' +
        '<span class="page-title-star s2"></span>' +
        '<span class="page-title-star s3"></span>' +
        '<span class="page-title-star s4"></span>' +
      '</span>' +
      `<span class="page-title-eyebrow"><span class="page-title-eyebrow-diamond" aria-hidden="true">\u2726</span>${eyebrow}<span class="page-title-eyebrow-diamond" aria-hidden="true">\u2726</span></span>` +
      `<span class="page-title-name" data-text="${name.replace(/"/g, '&quot;')}" aria-label="${name.replace(/"/g, '&quot;')}">${nameLetters}</span>` +
      '<span class="page-title-caption"><em>Daily Attendance Record</em></span>';
  } else {
    document.getElementById('page-title').innerHTML =
      `<span class="page-title-name">${config.title}</span>`;
  }
  document.getElementById('page-title').classList.add('page-title-premium');

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
        <div class="glass-lock-wrap" id="glass-lock-wrap" aria-hidden="true">
          <svg class="glass-lock" viewBox="0 0 120 140" width="96" height="112">
            <defs>
              <linearGradient id="lockBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fff4d6" stop-opacity="0.95"/>
                <stop offset="45%" stop-color="#fde68a" stop-opacity="0.72"/>
                <stop offset="100%" stop-color="#c9954b" stop-opacity="0.55"/>
              </linearGradient>
              <linearGradient id="lockShackle" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#fde68a"/>
                <stop offset="40%" stop-color="#e9c16d"/>
                <stop offset="70%" stop-color="#b45309"/>
                <stop offset="100%" stop-color="#7a3e09"/>
              </linearGradient>
              <linearGradient id="lockShine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
              </linearGradient>
              <radialGradient id="lockHalo" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stop-color="#fde68a" stop-opacity="0.7"/>
                <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
              </radialGradient>
              <filter id="lockSoftShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dy="3"/>
                <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
                <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <circle class="glass-lock-halo" cx="60" cy="78" r="58" fill="url(#lockHalo)"/>
            <circle class="glass-lock-ring glass-lock-ring-a" cx="60" cy="82" r="46" fill="none" stroke="#10b981" stroke-width="2.5" opacity="0"/>
            <circle class="glass-lock-ring glass-lock-ring-b" cx="60" cy="82" r="46" fill="none" stroke="#34d399" stroke-width="2" opacity="0"/>
            <g class="glass-lock-shackle" filter="url(#lockSoftShadow)">
              <path d="M36 62 L36 44 Q36 20 60 20 Q84 20 84 44 L84 62"
                    stroke="url(#lockShackle)" stroke-width="10" fill="none"
                    stroke-linecap="round"/>
              <path d="M40 60 L40 44 Q40 24 60 24"
                    stroke="rgba(255,255,255,0.55)" stroke-width="2.4" fill="none"
                    stroke-linecap="round"/>
            </g>
            <g class="glass-lock-body" filter="url(#lockSoftShadow)">
              <rect x="20" y="58" width="80" height="74" rx="15"
                    fill="url(#lockBody)" stroke="rgba(180,83,9,0.55)" stroke-width="1.5"/>
              <rect x="25" y="63" width="70" height="20" rx="10"
                    fill="url(#lockShine)" opacity="0.8"/>
              <path class="glass-lock-glint" d="M28 70 Q50 84 92 78"
                    stroke="rgba(255,255,255,0.85)" stroke-width="2" fill="none"
                    stroke-linecap="round" opacity="0.55"/>
              <g class="glass-lock-keyhole">
                <circle cx="60" cy="90" r="6.5" fill="#3d2110"/>
                <path d="M57 91 L57 108 Q57 111 60 111 Q63 111 63 108 L63 91 Z" fill="#3d2110"/>
              </g>
              <circle class="glass-lock-burst" cx="60" cy="96" r="10" fill="#fef3c7" opacity="0"/>
              <circle class="glass-lock-sparkle glass-lock-sparkle-a" cx="36" cy="72" r="1.5" fill="#fff"/>
              <circle class="glass-lock-sparkle glass-lock-sparkle-b" cx="84" cy="120" r="1.2" fill="#fff"/>
            </g>
          </svg>
        </div>
        <h2 style="margin:0 0 0.5rem 0; color:#1e293b; font-size:1.3rem; font-weight:700;">Password Required</h2>
        <p style="color:#64748b; font-size:0.9rem; margin-bottom:1.5rem;">Enter your PIN to access <strong>${config.title}</strong></p>
        <div style="display:flex; justify-content:center; gap:0.5rem; margin-bottom:1rem;" id="pin-container">
          <input type="password" maxlength="1" class="pin-box" id="pin1" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin2" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin3" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
          <input type="password" maxlength="1" class="pin-box" id="pin4" inputmode="numeric" pattern="[0-9]*" autocomplete="off" style="width:48px; height:56px; text-align:center; font-size:1.5rem; font-weight:700; border:2px solid #cbd5e1; border-radius:10px; background:rgba(255,255,255,0.9); color:#1e293b; outline:none; transition:border-color 0.2s;">
        </div>
        <div style="margin-bottom:0.8rem; display:flex; justify-content:center;">
          <button type="button" id="toggle-pin" class="toggle-pin-btn" aria-pressed="false" aria-label="Show PIN">
            <span class="toggle-pin-icon" aria-hidden="true">
              <svg class="eye-open" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="eye-closed" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.9 20.9 0 0 1 5.06-6.06M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a20.8 20.8 0 0 1-3.17 4.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
            <span class="toggle-pin-label">Show PIN</span>
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
  const popPin = (el) => {
    el.classList.remove('pin-pop');
    // Force reflow so the animation can retrigger on consecutive inputs.
    void el.offsetWidth;
    el.classList.add('pin-pop');
  };
  pins.forEach((pin, i) => {
    pin.addEventListener('animationend', () => {
      pin.classList.remove('pin-pop');
      pin.classList.remove('pin-shake');
      pin.classList.remove('pin-reveal');
    });
    pin.addEventListener('input', (e) => {
      pin.style.borderColor = '#eab308';
      if (e.target.value) {
        popPin(pin);
        if (i < 3) pins[i + 1].focus();
        if (i === 3) document.getElementById('pin-submit').click();
      }
    });
    pin.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !pin.value && i > 0) {
        pins[i - 1].focus();
        pins[i - 1].value = '';
      }
    });
  });
  pins[0].focus();

  // Show/Hide PIN toggle
  const toggleBtn = document.getElementById('toggle-pin');
  const toggleLabel = toggleBtn.querySelector('.toggle-pin-label');
  toggleBtn.addEventListener('click', () => {
    const isHidden = pins[0].type === 'password';
    const nextType = isHidden ? 'text' : 'password';
    pins.forEach((p, idx) => {
      setTimeout(() => {
        p.type = nextType;
        p.classList.remove('pin-reveal');
        void p.offsetWidth;
        p.classList.add('pin-reveal');
      }, idx * 60);
    });
    toggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', isHidden ? 'Hide PIN' : 'Show PIN');
    toggleLabel.textContent = isHidden ? 'Hide PIN' : 'Show PIN';
  });

  // Submit handler
  document.getElementById('pin-submit').addEventListener('click', () => {
    const entered = Array.from(pins).map(p => p.value).join('');
    const lockWrap = document.getElementById('glass-lock-wrap');
    if (entered === config.password) {
      sessionStorage.setItem('auth_' + pageId, 'true');
      if (lockWrap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        lockWrap.classList.add('is-unlocked');
        setTimeout(() => _renderEntryContent(pageId), 1350);
      } else {
        _renderEntryContent(pageId);
      }
    } else {
      document.getElementById('pin-error').textContent = 'Incorrect PIN. Please try again.';
      if (lockWrap) {
        lockWrap.classList.remove('is-wrong');
        void lockWrap.offsetWidth;
        lockWrap.classList.add('is-wrong');
        setTimeout(() => lockWrap.classList.remove('is-wrong'), 650);
      }
      pins.forEach(p => {
        p.value = '';
        p.style.borderColor = '#ef4444';
        p.classList.remove('pin-shake');
        void p.offsetWidth;
        p.classList.add('pin-shake');
      });
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
  const exportScale = Math.max(8, Math.min(10, Math.ceil((window.devicePixelRatio || 1) * 4)));

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
      <img src="icon.svg" alt="MEP Fan Attendance logo" style="height: 70px; margin-bottom: 10px; display: block;" />
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
    scale: exportScale,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    scrollX: 0,
    scrollY: 0,
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
    <!-- FAB Menu System -->
    <div id="fab-menu-wrapper" style="position:fixed; top:1.5rem; right:2.5rem; z-index:9999; display:flex; flex-direction:column; align-items:flex-end; gap:0;" class="no-print">
      
      <!-- Main Toggle Button -->
      <button id="fab-toggle-btn" onclick="window.toggleFabMenu()" data-tip-title="Menu" data-tip-desc="Open quick actions" data-tip-placement="left"
        style="background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:16px; width:56px; height:56px;
        display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
        cursor:pointer; box-shadow:0 8px 25px rgba(99,102,241,0.4); transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        position:relative; z-index:10002;"
        onmouseover="this.style.transform='scale(1.08)'; this.style.boxShadow='0 12px 35px rgba(99,102,241,0.5)';"
        onmouseout="if(!window._fabOpen){this.style.transform='scale(1)'; this.style.boxShadow='0 8px 25px rgba(99,102,241,0.4)';}">
        <svg id="fab-icon" class="pfab pfab-main" width="24" height="24" viewBox="0 0 24 24" style="transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1); filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));"><defs><linearGradient id="g-main-tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e0e7ff"/></linearGradient><radialGradient id="g-main-dot" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#6366f1"/></radialGradient></defs><g><rect class="pf-tile pf-t1" x="3" y="3" width="7.5" height="7.5" rx="2.4" fill="url(#g-main-tile)"/><rect class="pf-tile pf-t2" x="13.5" y="3" width="7.5" height="7.5" rx="2.4" fill="url(#g-main-tile)" opacity="0.85"/><rect class="pf-tile pf-t3" x="3" y="13.5" width="7.5" height="7.5" rx="2.4" fill="url(#g-main-tile)" opacity="0.85"/><circle class="pf-tile pf-t4" cx="17.25" cy="17.25" r="3.75" fill="#ffffff"/><circle cx="17.25" cy="17.25" r="2" fill="url(#g-main-dot)"/><circle cx="16.3" cy="16.3" r="0.7" fill="#ffffff" opacity="0.85"/></g></svg>
      </button>

      <!-- FAB Child Items Container (hidden by default) -->
      <div id="fab-children" style="display:none; flex-direction:column; align-items:flex-end; gap:0.75rem; margin-top:0.75rem;">

        <!-- Notification Bell -->
        <div class="fab-child notification-container" style="position:relative; opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button id="noti-btn" class="no-print" data-tip-title="Notifications" data-tip-desc="History & alerts feed" data-tip-theme="info" data-tip-placement="left"
            style="background:var(--glass-bg); border:1.5px solid var(--glass-border); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.background='rgba(255,255,255,0.85)'; this.style.boxShadow='0 8px 32px rgba(239,68,68,0.3), 0 0 0 4px rgba(239,68,68,0.1)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.background='var(--glass-bg)'; this.style.boxShadow='var(--glass-shadow)';"
            onclick="event.stopPropagation(); const d = document.getElementById('noti-dropdown'); const r = document.getElementById('reminder-dropdown'); if(r) r.style.display='none'; d.style.display = (d.style.display === 'none' || d.style.display === '') ? 'flex' : 'none'; document.getElementById('noti-badge').style.display='none'; localStorage.removeItem('has_new_notifications');">
            <svg class="pfab pfab-feed" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(239,68,68,0.45));"><defs><linearGradient id="g-feed-bell" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fca5a5"/><stop offset="45%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></linearGradient><radialGradient id="g-feed-badge" cx="30%" cy="30%" r="80%"><stop offset="0%" stop-color="#fca5a5"/><stop offset="100%" stop-color="#dc2626"/></radialGradient></defs><g class="pf-bell"><path d="M12 3.2c-3.7 0-6.7 3-6.7 6.7v3.4L3.7 15.4c-.6.8-.1 2 .9 2h14.8c1 0 1.5-1.2.9-2l-1.6-2v-3.4c0-3.7-3-6.7-6.7-6.7z" fill="url(#g-feed-bell)"/><path d="M7 8.2c.6-1.9 2.5-3.3 5-3.3" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M10.3 19.3a1.7 1.7 0 0 0 3.4 0" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" fill="none"/></g><g class="pf-badge"><circle cx="18" cy="5.8" r="3.4" fill="#ffffff"/><circle cx="18" cy="5.8" r="2.2" fill="url(#g-feed-badge)"/><circle cx="17.3" cy="5.1" r="0.55" fill="#ffffff" opacity="0.85"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:#ef4444; letter-spacing:0.04em; font-family:'Inter',sans-serif;">FEED</span>
            <span id="noti-badge" style="position:absolute; top:10px; right:10px; width:9px; height:9px; background:#ef4444; border-radius:50%; border:2px solid white; display:${hasNewNoti ? 'block' : 'none'}; box-shadow:0 0 10px rgba(239,68,68,0.8); animation:pulse 1.5s ease-in-out infinite;"></span>
          </button>
        
          <div id="noti-dropdown" class="glass-card no-print" style="position:absolute; top:-10px; left:auto; right:calc(100% + 12px); width:340px; z-index:10001; display:none; flex-direction:column; padding:0; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15); transform-origin: top right; animation: scaleIn 0.2s ease-out;">
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

        <!-- Reminder Button -->
        <div class="fab-child reminder-container" style="position:relative; opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button id="reminder-btn" class="no-print" data-tip-title="Reminders" data-tip-desc="Schedule recurring tasks" data-tip-theme="warning" data-tip-placement="left"
            style="background:var(--glass-bg); border:1.5px solid var(--glass-border); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.background='rgba(255,255,255,0.85)'; this.style.boxShadow='0 8px 32px rgba(234,179,8,0.35), 0 0 0 4px rgba(234,179,8,0.12)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.background='var(--glass-bg)'; this.style.boxShadow='var(--glass-shadow)';"
            onclick="event.stopPropagation(); const d = document.getElementById('reminder-dropdown'); const n = document.getElementById('noti-dropdown'); if(n) n.style.display='none'; d.style.display = (d.style.display === 'none' || d.style.display === '') ? 'flex' : 'none'; updateReminderList();">
            <svg class="pfab pfab-plan" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(234,179,8,0.45));"><defs><linearGradient id="g-plan-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#fde68a"/></linearGradient><linearGradient id="g-plan-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#d97706"/></linearGradient><radialGradient id="g-plan-today" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#ca8a04"/></radialGradient></defs><g class="pf-book"><rect x="3.2" y="5.5" width="17.6" height="15" rx="2.6" fill="url(#g-plan-body)" stroke="#ca8a04" stroke-width="1.4"/><rect x="3.2" y="5.5" width="17.6" height="4.8" fill="url(#g-plan-ribbon)"/><rect x="3.2" y="9.4" width="17.6" height="0.9" fill="#7c2d12" opacity="0.25"/><rect x="6.6" y="2.6" width="2.6" height="5.2" rx="1.3" fill="#78350f"/><rect x="14.8" y="2.6" width="2.6" height="5.2" rx="1.3" fill="#78350f"/><rect x="6.6" y="3.4" width="2.6" height="1.3" rx="0.6" fill="#fef3c7" opacity="0.7"/><rect x="14.8" y="3.4" width="2.6" height="1.3" rx="0.6" fill="#fef3c7" opacity="0.7"/><circle class="pf-dot pf-d1" cx="8.2" cy="13.8" r="1.4" fill="#d97706"/><circle class="pf-dot" cx="12" cy="13.8" r="1.4" fill="#d97706" opacity="0.38"/><circle class="pf-dot" cx="15.8" cy="13.8" r="1.4" fill="#d97706" opacity="0.38"/><circle class="pf-dot" cx="8.2" cy="17.4" r="1.4" fill="#d97706" opacity="0.38"/><circle class="pf-dot pf-today" cx="12" cy="17.4" r="1.6" fill="url(#g-plan-today)"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:#eab308; letter-spacing:0.04em; font-family:'Inter',sans-serif;">PLAN</span>
            <span id="reminder-badge" style="position:absolute; top:10px; right:10px; width:9px; height:9px; background:#eab308; border-radius:50%; border:2px solid white; display:none; box-shadow:0 0 10px rgba(234,179,8,0.8); animation:pulse 1.5s ease-in-out infinite;"></span>
          </button>
          
          <div id="reminder-dropdown" class="glass-card no-print" style="position:absolute; top:-10px; left:auto; right:calc(100% + 12px); width:340px; z-index:10001; display:none; flex-direction:column; padding:0; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.15); transform-origin: top right; animation: scaleIn 0.2s ease-out;">
            <div style="padding:1.2rem; border-bottom:1px solid rgba(0,0,0,0.08); font-weight:800; font-size:1.1rem; color:var(--text-dark); background:rgba(255,255,255,0.4); display:flex; justify-content:space-between; align-items:center;">
               <span>Pending Today</span>
               <span id="reminder-count" style="background:#eab308; color:white; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">0</span>
            </div>
            <div id="reminder-list" style="max-height:350px; overflow-y:auto; padding:0;">
            </div>
          </div>
        </div>

        <!-- Force Save Button -->
        <div class="fab-child save-container" style="position:relative; opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button id="force-save-btn" class="no-print" data-tip-title="Force Save" data-tip-desc="Write a history snapshot now" data-tip-shortcut="Ctrl+S" data-tip-theme="success" data-tip-placement="left"
            style="background:var(--glass-bg); border:1.5px solid var(--glass-border); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.background='rgba(255,255,255,0.85)'; this.style.boxShadow='0 8px 32px rgba(16,185,129,0.3), 0 0 0 4px rgba(16,185,129,0.1)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.background='var(--glass-bg)'; this.style.boxShadow='var(--glass-shadow)';"
            onclick="window.forceSaveHistory()">
            <svg class="pfab pfab-save" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(16,185,129,0.45));"><defs><linearGradient id="g-save-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="55%" stop-color="#10b981"/><stop offset="100%" stop-color="#047857"/></linearGradient><linearGradient id="g-save-shutter" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f2937"/><stop offset="100%" stop-color="#111827"/></linearGradient><linearGradient id="g-save-label" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d1fae5"/></linearGradient></defs><g class="pf-disk"><path d="M4.8 3.5h11.4l4.3 4.3V19a2.2 2.2 0 0 1-2.2 2.2H4.8A2.2 2.2 0 0 1 2.6 19V5.7A2.2 2.2 0 0 1 4.8 3.5z" fill="url(#g-save-body)" stroke="#047857" stroke-width="1.1"/><path d="M4.8 3.5h11.4l4.3 4.3H4.8z" fill="rgba(255,255,255,0.18)"/><rect x="6.5" y="3.5" width="9" height="4.8" rx="0.7" fill="url(#g-save-shutter)"/><rect x="12.8" y="4.4" width="1.6" height="2.9" rx="0.2" fill="#f3f4f6"/><rect x="5.6" y="12.6" width="12.8" height="8.6" rx="1.4" fill="url(#g-save-label)" stroke="#047857" stroke-width="1.1"/><path class="pf-check" d="M8.5 17l2.2 2.2 4.6-4.6" stroke="#10b981" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:#10b981; letter-spacing:0.04em; font-family:'Inter',sans-serif;">SAVE</span>
          </button>
        </div>

        <!-- History Button -->
        <div class="fab-child history-container" style="position:relative; opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button id="history-btn" class="no-print" data-tip-title="Attendance History" data-tip-desc="View past snapshots" data-tip-shortcut="Ctrl+H" data-tip-placement="left"
            style="background:var(--glass-bg); border:1.5px solid var(--glass-border); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.background='rgba(255,255,255,0.85)'; this.style.boxShadow='0 8px 32px rgba(139,92,246,0.3), 0 0 0 4px rgba(139,92,246,0.1)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.background='var(--glass-bg)'; this.style.boxShadow='var(--glass-shadow)';"
            onclick="window.openHistoryModal()">
            <svg class="pfab pfab-hist" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(139,92,246,0.45));" aria-hidden="true"><defs><linearGradient id="g-hist-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(237,233,254,0.95)"/><stop offset="50%" stop-color="rgba(196,181,253,0.6)"/><stop offset="100%" stop-color="rgba(167,139,250,0.35)"/></linearGradient><linearGradient id="g-hist-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient><linearGradient id="g-hist-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="60%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient><clipPath id="g-hist-top-clip"><path d="M5 3.2 L19 3.2 Q19 9, 12 12 Q5 9, 5 3.2 Z"/></clipPath><clipPath id="g-hist-bottom-clip"><path d="M5 20.8 L19 20.8 Q19 15, 12 12 Q5 15, 5 20.8 Z"/></clipPath></defs><g class="pf-hourglass"><rect class="pf-cap pf-cap-top" x="3.2" y="1.8" width="17.6" height="1.8" rx="0.8" fill="url(#g-hist-cap)"/><rect class="pf-cap pf-cap-bottom" x="3.2" y="20.4" width="17.6" height="1.8" rx="0.8" fill="url(#g-hist-cap)"/><path class="pf-glass" d="M5 3.2 L19 3.2 Q19 9, 12 12 Q5 9, 5 3.2 Z M5 20.8 L19 20.8 Q19 15, 12 12 Q5 15, 5 20.8 Z" fill="url(#g-hist-glass)" stroke="#7c3aed" stroke-width="1.05" stroke-linejoin="round"/><g clip-path="url(#g-hist-top-clip)"><path class="pf-sand-top" d="M5 3.2 L19 3.2 L19 7.8 L5 7.8 Z" fill="url(#g-hist-sand)"/></g><g clip-path="url(#g-hist-bottom-clip)"><path class="pf-sand-bottom" d="M6.5 20.8 L17.5 20.8 L14.5 17.5 L9.5 17.5 Z" fill="url(#g-hist-sand)"/></g><circle class="pf-grain g1" cx="12" cy="9" r="0.5" fill="#f59e0b"/><circle class="pf-grain g2" cx="12" cy="9" r="0.5" fill="#f59e0b"/><circle class="pf-grain g3" cx="12" cy="9" r="0.45" fill="#fbbf24"/><path class="pf-glass-highlight" d="M6.5 3.6 L7.4 7.5" stroke="rgba(255,255,255,0.85)" stroke-width="0.8" stroke-linecap="round" fill="none"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:#8b5cf6; letter-spacing:0.04em; font-family:'Inter',sans-serif;">HIST</span>
          </button>
        </div>

        <!-- Push Notification Toggle -->
        <div class="fab-child" style="opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          ${buildPushNotificationButton()}
        </div>

        <!-- Theme Button -->
        <div class="fab-child" style="opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button class="no-print" data-tip-title="Change Theme" data-tip-desc="Cycle color palette" data-tip-placement="left"
            style="background:var(--glass-bg); border:1.5px solid var(--glass-border); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:var(--glass-shadow); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.background='rgba(255,255,255,0.85)'; this.style.boxShadow='0 8px 32px rgba(250,204,21,0.3), 0 0 0 4px rgba(250,204,21,0.1)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.background='var(--glass-bg)'; this.style.boxShadow='var(--glass-shadow)';"
            onclick="event.stopPropagation(); var dd=document.getElementById('theme-dropdown'); var bd=document.getElementById('theme-backdrop'); if(dd) dd.classList.toggle('open'); if(bd) bd.classList.toggle('show');">
            <svg class="pfab pfab-theme" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(234,179,8,0.45));"><defs><linearGradient id="g-theme-brush" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient><linearGradient id="g-theme-handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#d97706"/></linearGradient><linearGradient id="g-theme-tip1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f472b6"/><stop offset="100%" stop-color="#db2777"/></linearGradient><linearGradient id="g-theme-tip2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><g class="pf-palette"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" fill="url(#g-theme-handle)" stroke="#92400e" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 21h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343" fill="url(#g-theme-handle)" stroke="#92400e" stroke-width="1.2" stroke-linejoin="round"/><rect x="4.5" y="4.5" width="3" height="13" rx="1" fill="rgba(255,255,255,0.4)"/><g class="pf-brush"><path d="M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485" fill="url(#g-theme-brush)" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/><circle cx="14" cy="8.5" r="1.1" fill="url(#g-theme-tip1)"/><circle cx="16.3" cy="10.8" r="1.1" fill="url(#g-theme-tip2)"/></g><circle cx="7.2" cy="18" r="0.9" fill="#78350f"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:#eab308; letter-spacing:0.04em; font-family:'Inter',sans-serif;">THEME</span>
          </button>
        </div>

        <!-- Download JPG Button (Gold Premium) -->
        <div class="fab-child" style="opacity:0; transform:scale(0.3) translateY(-20px); transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);">
          <button class="no-print" data-tip-title="Export JPG" data-tip-desc="Download report as an image" data-tip-shortcut="Ctrl+E" data-tip-theme="warning" data-tip-placement="left"
            style="background:linear-gradient(135deg,#fbbf24,#f59e0b); border:1.5px solid rgba(245,158,11,0.4); border-radius:16px; width:56px; height:56px;
            display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
            cursor:pointer; box-shadow:0 8px 20px rgba(245,158,11,0.35); transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            position:relative;"
            onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(245,158,11,0.5), 0 0 0 4px rgba(245,158,11,0.15)';"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='0 8px 20px rgba(245,158,11,0.35)';"
            onclick="exportReport()">
            <svg class="pfab pfab-jpg" width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));"><defs><linearGradient id="g-jpg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient><radialGradient id="g-jpg-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient><linearGradient id="g-jpg-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient><linearGradient id="g-jpg-arrow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><g class="pf-photo"><rect x="2.4" y="2.8" width="13.4" height="10.4" rx="1.8" fill="url(#g-jpg-sky)" stroke="#ffffff" stroke-width="1.5"/><circle cx="6.6" cy="6.4" r="1.5" fill="url(#g-jpg-sun)"/><path d="M2.8 12.4l3.4-3.4 2.6 2.6 2.8-2.8 3.8 3.8" fill="url(#g-jpg-mtn)" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/></g><g class="pf-download"><path d="M12 12v8.2" stroke="url(#g-jpg-arrow)" stroke-width="2.6" stroke-linecap="round"/><path d="M9 17l3 3 3-3" stroke="url(#g-jpg-arrow)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M5.5 21.6h13" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/></g></svg>
            <span style="font-size:0.52rem; font-weight:800; color:white; letter-spacing:0.04em; font-family:'Inter',sans-serif; text-shadow:0 1px 2px rgba(0,0,0,0.2);">JPG</span>
          </button>
        </div>

      </div>
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
        <img src="icon.svg" alt="MEP Fan Attendance logo" style="height: 85px; margin-bottom: 12px; display: block;" />
        <h2 style="color:#854d0e; font-size:2.4rem; font-weight:800; margin-bottom: 8px; letter-spacing: -0.02em; font-family: 'Inter', sans-serif;">MEP FAN LTD.</h2>
        <div class="theme-accent-line"></div>
        <p style="font-weight:600; font-size: 1.05rem; color:#475569; letter-spacing: 0.15em; font-family: 'Inter', sans-serif; text-transform: uppercase;">ATTENDANCE REPORT</p>
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
  if (window.forceSaveHistory) window.forceSaveHistory(true);
  const content = document.getElementById('export-content');
  const exportScale = Math.max(8, Math.min(10, Math.ceil((window.devicePixelRatio || 1) * 4)));

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
    scale: exportScale,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    scrollX: 0,
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
  { id: 'amber',        name: 'Golden Amber',    desc: 'Warm sunlit gold',         swatch: 'linear-gradient(135deg, #facc15, #eab308)',    palette: ['#fde68a','#facc15','#ca8a04'] },
  { id: 'ocean',        name: 'Ocean Blue',      desc: 'Deep tidal serenity',      swatch: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',    palette: ['#7dd3fc','#0ea5e9','#0369a1'] },
  { id: 'rose',         name: 'Rose Garden',     desc: 'Soft blushing petals',     swatch: 'linear-gradient(135deg, #fb7185, #f43f5e)',    palette: ['#fecdd3','#fb7185','#be123c'] },
  { id: 'emerald',      name: 'Emerald Forest',  desc: 'Cool mossy green',         swatch: 'linear-gradient(135deg, #34d399, #10b981)',    palette: ['#a7f3d0','#10b981','#065f46'] },
  { id: 'purple',       name: 'Purple Haze',     desc: 'Dreamy violet mist',       swatch: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',    palette: ['#ddd6fe','#8b5cf6','#5b21b6'] },
  { id: 'mint',         name: 'Mint Fresh',      desc: 'Crisp cool mint',          swatch: 'linear-gradient(135deg, #6ee7b7, #34d399)',    palette: ['#d1fae5','#6ee7b7','#047857'] },
  { id: 'sunset',       name: 'Sunset Orange',   desc: 'Dusk fire glow',           swatch: 'linear-gradient(135deg, #fb923c, #f97316)',    palette: ['#fed7aa','#fb923c','#c2410c'] },
  { id: 'arctic',       name: 'Arctic Ice',      desc: 'Frosted cyan chill',       swatch: 'linear-gradient(135deg, #22d3ee, #06b6d4)',    palette: ['#cffafe','#22d3ee','#0891b2'] },
  { id: 'lavender',     name: 'Lavender Dream',  desc: 'Soft purple haze',         swatch: 'linear-gradient(135deg, #c084fc, #a855f7)',    palette: ['#e9d5ff','#c084fc','#7e22ce'] },
  { id: 'peach',        name: 'Peach Blossom',   desc: 'Ripe summer fruit',        swatch: 'linear-gradient(135deg, #fdba74, #fb923c)',    palette: ['#fed7aa','#fdba74','#ea580c'] },
  { id: 'silver-mist',  name: 'Silver Mist',     desc: 'Calm cloud gray',          swatch: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',    palette: ['#f1f5f9','#cbd5e1','#64748b'] },
  { id: 'sky-azure',    name: 'Sky Azure',       desc: 'Open horizon blue',        swatch: 'linear-gradient(135deg, #bae6fd, #38bdf8)',    palette: ['#e0f2fe','#7dd3fc','#0284c7'] },
  { id: 'honey-glow',   name: 'Honey Glow',      desc: 'Liquid amber honey',       swatch: 'linear-gradient(135deg, #fef08a, #facc15)',    palette: ['#fef9c3','#fde047','#a16207'] },
  { id: 'mint-sorbet',  name: 'Mint Sorbet',     desc: 'Cool dessert green',       swatch: 'linear-gradient(135deg, #a7f3d0, #34d399)',    palette: ['#d1fae5','#6ee7b7','#059669'] },
  { id: 'light-maroon', name: 'Light Maroon',    desc: 'Faded rose wine',          swatch: 'linear-gradient(135deg, #fda4af, #fb7185)',    palette: ['#fecdd3','#fda4af','#9f1239'] },
  { id: 'chocolate',    name: 'Chocolate',       desc: 'Rich cocoa warmth',        swatch: 'linear-gradient(135deg, #fcd34d, #d97706)',    palette: ['#fde68a','#fbbf24','#92400e'] },
  { id: 'watermelon',   name: 'Watermelon',      desc: 'Juicy pink crush',         swatch: 'linear-gradient(135deg, #fb7185, #f43f5e)',    palette: ['#fecaca','#fb7185','#9f1239'] },
  { id: 'parrot',       name: 'Parrot',          desc: 'Vivid tropical lime',      swatch: 'linear-gradient(135deg, #d9f99d, #a3e635)',    palette: ['#ecfccb','#a3e635','#4d7c0f'] }
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
  // Update header "current theme" label
  const hdrLabel = document.getElementById('theme-hdr-current');
  if (hdrLabel) {
    const current = THEMES.find(t => t.id === themeId);
    if (current) hdrLabel.textContent = current.name;
  }

  if (!document.body.classList.contains('theme-init-done')) {
    setTimeout(() => document.body.classList.add('theme-init-done'), 100);
  }
}

function pickRandomTheme() {
  const current = document.body.getAttribute('data-theme') || 'rose';
  const pool = THEMES.filter(t => t.id !== current);
  const next = pool[Math.floor(Math.random() * pool.length)];
  setTheme(next.id);
  // Subtle haptic-style pulse on the card
  const card = document.querySelector(`.theme-option[data-theme="${next.id}"]`);
  if (card) {
    card.classList.add('just-selected');
    setTimeout(() => card.classList.remove('just-selected'), 900);
  }
}

function closeThemeDropdown() {
  document.getElementById('theme-dropdown')?.classList.remove('open');
  document.getElementById('theme-backdrop')?.classList.remove('show');
}

function initThemePicker() {
  // Don't add duplicate
  if (document.querySelector('.theme-fab')) return;

  const savedTheme = localStorage.getItem('mep_theme') || 'rose';

  const cardsHtml = THEMES.map((t, i) => {
    const dotsHtml = t.palette.map(c => `<i style="background:${c}"></i>`).join('');
    const paletteSpans = t.palette.map(c => `<span style='background:${c}'></span>`).join('');
    const descHtml = `${t.desc}<span class='tt-pal'>${paletteSpans}</span>`;
    return `
      <button class="theme-option ${t.id === savedTheme ? 'active' : ''}"
              data-theme="${t.id}"
              style="--i:${i}; --tg:${t.swatch};"
              data-tip-title="${t.name}"
              data-tip-desc="${descHtml}"
              data-tip-shortcut="Click to apply"
              data-tip-html="true"
              data-tip-placement="auto"
              onclick="event.stopPropagation(); setTheme('${t.id}'); this.classList.add('just-selected'); setTimeout(()=>this.classList.remove('just-selected'), 900);">
        <span class="theme-swatch" style="background: ${t.swatch}">
          <span class="theme-swatch-sheen"></span>
          <span class="theme-swatch-check">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          </span>
        </span>
        <span class="theme-meta">
          <span class="theme-name">${t.name}</span>
          <span class="theme-dots">${dotsHtml}</span>
        </span>
        <span class="theme-ripple"></span>
      </button>`;
  }).join('');

  const fab = document.createElement('div');
  fab.className = 'theme-fab no-print';
  fab.innerHTML = `
    <div class="theme-backdrop" id="theme-backdrop" onclick="closeThemeDropdown()"></div>
    <div class="theme-dropdown" id="theme-dropdown" role="dialog" aria-label="Theme Gallery">
      <div class="theme-hdr">
        <div class="theme-hdr-left">
          <div class="theme-hdr-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
          </div>
          <div class="theme-hdr-text">
            <span class="theme-hdr-title">Theme Gallery</span>
            <span class="theme-hdr-sub"><span id="theme-hdr-current">${(THEMES.find(x=>x.id===savedTheme)||{name:''}).name}</span> · ${THEMES.length} themes</span>
          </div>
        </div>
        <button class="theme-hdr-close"
                data-tip-title="Close"
                data-tip-shortcut="Esc"
                onclick="event.stopPropagation(); closeThemeDropdown();"
                aria-label="Close theme gallery">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </div>

      <div class="theme-grid">
        ${cardsHtml}
      </div>

      <div class="theme-ftr">
        <button class="theme-ftr-btn theme-ftr-random"
                data-tip-title="Surprise Me"
                data-tip-desc="Apply a random theme"
                data-tip-theme="info"
                onclick="event.stopPropagation(); pickRandomTheme();">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>
          <span>Surprise Me</span>
        </button>
        <button class="theme-ftr-btn theme-ftr-done"
                data-tip-title="Done"
                data-tip-shortcut="Esc"
                onclick="event.stopPropagation(); closeThemeDropdown();">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          <span>Done</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(fab);

  // Call to populate change count immediately after injection
  setTimeout(_loadAndDisplayChangeCount, 100);

  // Close dropdown on outside click or backdrop click
  document.addEventListener('click', (e) => {
    // Don't close when clicking inside the dropdown itself
    if (e.target.closest('.theme-dropdown')) return;
    closeThemeDropdown();
  });
  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeThemeDropdown();
  });

  // Apply saved theme
  setTheme(savedTheme);
}

// Expose helpers for inline onclick
window.pickRandomTheme = pickRandomTheme;
window.closeThemeDropdown = closeThemeDropdown;


// ═══════════════════════════════════════════════════
// 120fps-READY MOTION HELPERS
// ═══════════════════════════════════════════════════

function initHighRefreshMotion() {
  document.documentElement.classList.add('high-refresh-motion');
  document.documentElement.style.setProperty('--motion-target-fps', '120');
  document.documentElement.style.setProperty('--motion-frame', `${(1000 / 120).toFixed(3)}ms`);
}

function nextMotionFrame(callback) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

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
      row.style.transition = 'opacity var(--motion-fast) var(--motion-ease), transform var(--motion-fast) var(--motion-ease)';

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
  initHighRefreshMotion();
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

// Close dropdowns / FAB menu when clicking outside
document.addEventListener('click', (e) => {
  const notiBtn = document.getElementById('noti-btn');
  const notiDropdown = document.getElementById('noti-dropdown');
  const remBtn = document.getElementById('reminder-btn');
  const remDropdown = document.getElementById('reminder-dropdown');
  const fabWrapper = document.getElementById('fab-menu-wrapper');

  if (notiBtn && notiDropdown && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
    notiDropdown.style.display = 'none';
  }

  if (remBtn && remDropdown && !remBtn.contains(e.target) && !remDropdown.contains(e.target)) {
    remDropdown.style.display = 'none';
  }

  // Minimize FAB when user clicks anywhere outside the FAB menu
  if (window._fabOpen && fabWrapper && !fabWrapper.contains(e.target)) {
    window.toggleFabMenu();
  }
});

// Clear History
window.clearHistory = function () {
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

    nextMotionFrame(() => {
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
      <button id="mep-push-btn" class="no-print" title="${enabled ? 'Daily Notification ON — Click to disable' : 'Enable Daily 8AM Notification'}"
        style="background:${enabled
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'var(--glass-bg)'};
        border:1.5px solid ${enabled ? 'rgba(255,255,255,0.35)' : 'var(--glass-border)'};
        border-radius:16px; width:56px; height:56px;
        display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px;
        cursor:pointer;
        box-shadow:${enabled
          ? '0 6px 24px rgba(16,185,129,0.5), 0 0 0 4px rgba(16,185,129,0.15)'
          : 'var(--glass-shadow)'};
        transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); position:relative;
        backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);"
        onmouseover="this.style.transform='scale(1.1) translateY(-2px)'; this.style.boxShadow='${enabled ? '0 10px 35px rgba(16,185,129,0.6), 0 0 0 6px rgba(16,185,129,0.2)' : '0 8px 32px rgba(100,116,139,0.3), 0 0 0 4px rgba(100,116,139,0.1)'}'; this.style.background='${enabled ? 'linear-gradient(135deg,#34d399,#10b981)' : 'rgba(255,255,255,0.85)'}';"
        onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='${enabled ? '0 6px 24px rgba(16,185,129,0.5),0 0 0 4px rgba(16,185,129,0.15)' : 'var(--glass-shadow)'}'; this.style.background='${enabled ? 'linear-gradient(135deg,#10b981,#059669)' : 'var(--glass-bg)'}';"
        onclick="handlePushToggle()">
        <span class="push-icon" style="line-height:1; filter:${enabled ? 'drop-shadow(0 0 6px rgba(255,255,255,0.55))' : 'none'}; display:flex; align-items:center; justify-content:center;">${enabled
          ? '<svg class="pfab pfab-push pfab-push-on" width="24" height="24" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="g-push-on" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d1fae5"/></linearGradient></defs><g class="pf-bell"><path d="M12 3.2c-3.7 0-6.7 3-6.7 6.7v3.4L3.7 15.4c-.6.8-.1 2 .9 2h14.8c1 0 1.5-1.2.9-2l-1.6-2v-3.4c0-3.7-3-6.7-6.7-6.7z" fill="url(#g-push-on)"/><path d="M7 8.2c.6-1.9 2.5-3.3 5-3.3" stroke="rgba(16,185,129,0.55)" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M10.3 19.3a1.7 1.7 0 0 0 3.4 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/></g><g class="pf-sparkles"><path d="M19.3 4.4l1.8 1.8" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.95"/><path d="M14.8 2.6L16.4 1" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.95"/><circle cx="21" cy="10" r="0.9" fill="#ffffff" opacity="0.9"/></g></svg>'
          : '<svg class="pfab pfab-push pfab-push-off" width="24" height="24" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="g-push-off" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs><g class="pf-bell"><path d="M12 3.2c-3.7 0-6.7 3-6.7 6.7v3.4L3.7 15.4c-.6.8-.1 2 .9 2h14.8c1 0 1.5-1.2.9-2l-1.6-2v-3.4c0-3.7-3-6.7-6.7-6.7z" fill="url(#g-push-off)" opacity="0.28"/><path d="M12 3.2c-3.7 0-6.7 3-6.7 6.7v3.4L3.7 15.4c-.6.8-.1 2 .9 2h14.8c1 0 1.5-1.2.9-2l-1.6-2v-3.4c0-3.7-3-6.7-6.7-6.7z" stroke="#64748b" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M10.3 19.3a1.7 1.7 0 0 0 3.4 0" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" fill="none"/></g><line class="pf-slash-bg" x1="4.2" y1="4.2" x2="19.8" y2="19.8" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line class="pf-slash" x1="4.2" y1="4.2" x2="19.8" y2="19.8" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round"/></svg>'
        }</span>
        <span class="push-label" style="font-size:0.52rem; font-weight:800; letter-spacing:0.04em; font-family:'Inter',sans-serif; color:${enabled ? 'white' : '#64748b'}; line-height:1;">${enabled ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  `;
}

// Toggle handler
window.handlePushToggle = async function () {
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

window.activatePushFromModal = async function () {
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
  nextMotionFrame(() => {
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

window.installPWA = async function () {
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

window.dismissInstallBanner = function () {
  localStorage.setItem('mep_install_dismissed', Date.now().toString());
  hideInstallBanner();
};

/* =========================================================================
   FAB MENU TOGGLE
   ========================================================================= */

window._fabOpen = false;
window.toggleFabMenu = function() {
  var children = document.getElementById('fab-children');
  var icon = document.getElementById('fab-icon');
  var btn = document.getElementById('fab-toggle-btn');
  if (!children) return;

  window._fabOpen = !window._fabOpen;

  if (window._fabOpen) {
    children.style.display = 'flex';
    if (icon) icon.style.transform = 'rotate(90deg)';
    if (btn) { btn.style.transform = 'scale(1.08) rotate(0deg)'; btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)'; btn.style.boxShadow = '0 8px 25px rgba(239,68,68,0.4)'; }
    var items = children.querySelectorAll('.fab-child');
    items.forEach(function(item, i) {
      setTimeout(function() {
        item.style.opacity = '1';
        item.style.transform = 'scale(1) translateY(0)';
      }, i * 60);
    });
  } else {
    if (icon) icon.style.transform = 'rotate(0deg)';
    if (btn) { btn.style.transform = 'scale(1)'; btn.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)'; btn.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }
    var items = children.querySelectorAll('.fab-child');
    var total = items.length;
    items.forEach(function(item, i) {
      setTimeout(function() {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.3) translateY(-20px)';
      }, (total - 1 - i) * 40);
    });
    setTimeout(function() { children.style.display = 'none'; }, total * 40 + 300);
    // Also close any open dropdowns
    var nd = document.getElementById('noti-dropdown'); if (nd) nd.style.display = 'none';
    var rd = document.getElementById('reminder-dropdown'); if (rd) rd.style.display = 'none';
  }
};

/* =========================================================================
   HISTORY FEATURE : AUTO-SAVE & MODAL UI
   ========================================================================= */

window.forceSaveHistory = function(silent) {
  if (!window.firebaseDb) { if (!silent) alert('Firebase not connected!'); return; }
  window.firebaseDb.ref('mep_dashboard_state').once('value').then(function(snapshot) {
    if (snapshot.exists()) {
      var currentState = snapshot.val();
      _saveAttendanceHistory(currentState);
      if (!silent) alert('\u2705 History Snapshot Saved Successfully!');
    } else {
      if (!silent) alert('No dashboard data found to save.');
    }
  }).catch(function(e) {
    console.error('Force save error:', e);
    if (!silent) alert('Error saving history: ' + e.message);
  });
};

function _saveAttendanceHistory(state) {
  if (!window.firebaseDb) return;
  try {
    var stamp = new Date();
    var today = stamp.getFullYear() + '-' + String(stamp.getMonth() + 1).padStart(2, '0') + '-' + String(stamp.getDate()).padStart(2, '0');
    window.firebaseDb.ref('mep_attendance_history/' + today).set(state).catch(function(e) { console.error('Error saving history snapshot:', e); });
    window.firebaseDb.ref('mep_attendance_history_index/' + today).set(true).catch(function(e) { console.error('Error saving history index:', e); });
  } catch(e) { console.error('_saveAttendanceHistory error:', e); }
}

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
                <radialGradient id="ios-hm-face" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stop-color="#fff" stop-opacity="0.95"/>
                  <stop offset="70%" stop-color="#ede9fe" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#c4b5fd" stop-opacity="0.75"/>
                </radialGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#ios-hm-face)" stroke="#fff" stroke-width="1.2" stroke-opacity="0.85"/>
              <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(124,58,237,0.45)" stroke-width="0.6"/>
              <g stroke="#fff" stroke-width="1" stroke-linecap="round">
                <line x1="12" y1="3" x2="12" y2="4.5"/>
                <line x1="21" y1="12" x2="19.5" y2="12"/>
                <line x1="12" y1="21" x2="12" y2="19.5"/>
                <line x1="3" y1="12" x2="4.5" y2="12"/>
              </g>
              <line class="ios-hm-icon-hand-hour" x1="12" y1="12" x2="12" y2="7.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
              <line class="ios-hm-icon-hand-min" x1="12" y1="12" x2="16.2" y2="12" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="1" fill="#fff"/>
            </svg>
          </div>
          <div>
            <h2 id="ios-hm-title" class="ios-hm-title">
              Attendance History
              <span id="history-count-badge" class="ios-hm-count-badge" aria-hidden="true">
                <span class="ios-hm-count-dot"></span>
                <span class="ios-hm-count-num">\u2014</span>
                <span class="ios-hm-count-lbl">snapshots</span>
              </span>
            </h2>
            <div class="ios-hm-sub">Browse past records by date</div>
          </div>
        </div>
        <button class="ios-hm-close" onclick="window.closeHistoryModal()" aria-label="Close">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="ios-hm-body">
        <aside class="ios-hm-sidebar">
          <div class="ios-hm-sidebar-eyebrow" aria-hidden="true">Archive</div>
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
            <span class="ios-hm-legend-dot"></span>Green dots indicate saved snapshots
          </div>
        </aside>

        <section class="ios-hm-viewer" id="history-data-viewer">
          <div class="ios-hm-empty">
            <div class="ios-hm-empty-ico" aria-hidden="true">
              <span class="ios-hm-empty-ring"></span>
              <span class="ios-hm-empty-ring ios-hm-empty-ring-2"></span>
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="8.5" cy="14.5" r="1" fill="currentColor"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor"/></svg>
            </div>
            <div class="ios-hm-empty-text">Select a date to view history</div>
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

function _renderHistoryState(dateStr, state, container) {
  try {
    var formattedDate = dateStr;
    try { formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}); } catch(e) {}

    var totalAuth = 0, totalExist = 0, totalPresent = 0, totalAbsent = 0;
    var sectionsHtml = '';

    function barClass(pct) {
      if (pct >= 90) return 'high';
      if (pct >= 70) return 'mid';
      return 'low';
    }

    var pageIds = Object.keys(state);
    pageIds.forEach(function(pageId) {
      if (pageId === 'history') return;
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
          var absent = parseInt(row.absent) || 0;
          if (absent === 0 && present < existing) absent = existing - present;
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
                '<div class="ios-ss-desig-name">' + r.desig + '</div>' +
                '<div class="ios-ss-bar"><div class="ios-ss-bar-fill ' + barClass(pct) + '" style="width:' + pct + '%"></div></div>' +
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
              '<h4 class="ios-ss-sec-title">' + groupName + '</h4>' +
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
        '<div class="ios-ss-ring" style="--pct:' + pct + '"><span class="ios-ss-ring-val">' + pct + '%</span></div>' +
      '</div>' +
      '<div class="ios-ss-kpi">' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Authorized</div><div class="ios-ss-kpi-value k-total">' + (totalAuth || totalExist) + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Existing</div><div class="ios-ss-kpi-value k-existing">' + totalExist + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Present</div><div class="ios-ss-kpi-value k-present">' + totalPresent + '</div></div>' +
        '<div class="ios-ss-kpi-cell"><div class="ios-ss-kpi-label">Absent</div><div class="ios-ss-kpi-value k-absent">' + totalAbsent + '</div></div>' +
      '</div>' +
      '<div class="ios-ss-sections">' + sectionsHtml + '</div>';
  } catch(e) {
    console.error('_renderHistoryState error:', e);
    container.innerHTML = '<div style="padding:2rem;"><h3 style="color:#ef4444; margin-bottom:1rem;">Error rendering snapshot</h3><pre style="background:#f8fafc; padding:1.5rem; border-radius:12px; overflow:auto; max-height:70vh; font-size:0.85rem; color:#334155; border:1px solid #e2e8f0;">' + JSON.stringify(state, null, 2) + '</pre></div>';
  }
}
