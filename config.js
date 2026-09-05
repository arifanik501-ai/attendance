// ═══════════════════════════════════════════════════
// APP VERSION — update this string when you deploy a
// new release. The change count below auto-increments
// on every data save.
// ═══════════════════════════════════════════════════
const APP_VERSION = '2.6.58';

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
    password: "8250",
    groups: {
      "Fan Assemble": ["Manager", "In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Jr. Officer", "Worker"],
      "Fan Dimmer & Blade": ["Engineer", "Worker"]
    }
  },
  takbir: {
    title: "Entry Sheet (Takbir)",
    password: "9696",
    groups: {
      "Fan Armature": ["Engineer", "Technicalman", "Worker"],
      "Fan Assemble": ["Manager", "In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Jr. Officer", "Worker"],
      "Fan Dimmer & Blade": ["Engineer", "Worker"]
    }
  },
  monir: {
    title: "Entry Sheet (Monir)",
    password: "2222",
    groups: {
      "Fan Power Press & Stamping": ["In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker"],
      "Fan Dalai & Die Casting": ["Jr. Officer", "Worker"]
    }
  },
  anwar: {
    title: "Entry Sheet (Anwar)",
    password: "1111",
    groups: {
      "Fan Auto Powder Coating": ["In-charge", "Engineer", "Technicalman", "Sr. Supervisor", "Worker"],
      "Fan Lathe": ["Engineer", "Technicalman", "Worker"]
    }
  },
  bikash: {
    title: "Entry Sheet (Bikash)",
    password: "0011",
    groups: {
      "Fan Rojonigondha": ["In-charge", "Engineer", "Technicalman", "Worker"],
      "Fan Sada Shapla": ["Supervisor", "Worker"],
      "Fan Replace": ["Engineer", "Technicalman", "Worker"]
    }
  }
};

let globalAppState = null;
let localDashboardState = null;
try {
  const cached = localStorage.getItem('mep_dashboard_state_cache');
  if (cached) globalAppState = JSON.parse(cached);
  const cachedLive = localStorage.getItem('mep_dashboard_live_cache');
  if (cachedLive) localDashboardState = JSON.parse(cachedLive);
} catch(e) {}
let currentActivePageId = null;
const SESSION_DEVICE_ID = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
const CUSTOM_PERIOD_CUTOFF_DAY = 26;
const SECTION_STATUS_CONFIG = {
  fan_power_press: {
    name: "Fan Power Press Section",
    entryBy: "Monir",
    ownerPage: "monir"
  },
  fan_die_casting: {
    name: "Fan Die Casting Section",
    entryBy: "Monir",
    ownerPage: "monir"
  },
  fan_auto_powder_coating: {
    name: "Fan Auto Powder Coating Section",
    entryBy: "Anwar",
    ownerPage: "anwar"
  },
  fan_lathe: {
    name: "Fan Lathe Section",
    entryBy: "Anwar",
    ownerPage: "anwar"
  },
  fan_assemble_line: {
    name: "Fan Assemble Line",
    entryBy: "Takbir",
    ownerPage: "takbir"
  },
  fan_dimmer_and_blade: {
    name: "Fan Dimmer and Blade",
    entryBy: "Takbir",
    ownerPage: "takbir"
  },
  fan_armature_winding: {
    name: "Fan Armature Winding",
    entryBy: "Takbir",
    ownerPage: "takbir"
  },
  cf_5607_production: {
    name: "CF 5607 Production",
    entryBy: "Bikash",
    ownerPage: "bikash"
  },
  exhaust_fan_production: {
    name: "Exhaust Fan Production",
    entryBy: "Bikash",
    ownerPage: "bikash"
  },
  capacitor_production: {
    name: "Capacitor Production",
    entryBy: "Bikash",
    ownerPage: "bikash"
  },
  rechargeable_production: {
    name: "Rechargeable Production",
    entryBy: "Bikash",
    ownerPage: "bikash"
  }
};

const META_STATE_KEYS = ['history', 'branchAttendance', 'rocketEntries', 'sectionStatus'];
const SMOOTH_MODE_STORAGE_KEY = 'mep_smooth_mode_enabled';
const EDIT_AUTH_STORAGE_KEY = 'mep_edit_auth_enabled';

function isMetaStateKey(key) {
  return META_STATE_KEYS.includes(key);
}