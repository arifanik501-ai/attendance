// ═══════════════════════════════════════════════════
// APP VERSION — update this string when you deploy a
// new release. The change count below auto-increments
// on every data save.
// ═══════════════════════════════════════════════════
const APP_VERSION = '2.6.39';

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
      "Fan Sada Shapla": ["Worker"]
    }
  }
};

let IOM_STAFF_LIST = [
  { id: '3746', name: 'Md. Saiful Islam', designation: 'Manager (Fan)', department: 'Fan Admin' },
  { id: '15387', name: 'Arif Ahmed', designation: 'Asst. Engineer', department: 'Fan Admin' },
  { id: '966', name: 'MD Zohirul Islam Monir', designation: 'Sr. Engineer', department: 'Fan Admin' },
  { id: '11989', name: 'Md. Anwar Hossain', designation: 'Production Engineer', department: 'Fan Admin' },
  { id: '18025', name: 'Md Hafijur Rahman', designation: 'Production Engineer', department: 'Fan Power Press & Stamping' },
  { id: '7544', name: 'MD Hasan Khalifa', designation: 'Asst. Engineer', department: 'Fan Power Press & Stamping' },
  { id: '16027', name: 'Md Sayed Hossain', designation: 'Jr. Engineer', department: 'Fan Power Press & Stamping' },
  { id: '7620', name: 'Hossainuzzaman', designation: 'Sub-Asst. Engineer', department: 'Fan Auto Powder Coating' },
  { id: '1032', name: 'Md. Masum Talukder', designation: 'Asst. Engineer', department: 'Fan Lathe' },
  { id: '7520', name: 'Bikash Chand Ray', designation: 'Asst. Engineer', department: 'Fan Admin' },
  { id: '15998', name: 'Lucky Akter', designation: 'Jr. Engineer', department: 'Fan Rojonigondha' },
  { id: '7571', name: 'Bithi Rani Das', designation: 'Sub-Asst. Engineer', department: 'Fan Assemble' },
  { id: '16749', name: 'Nafija Islam', designation: 'Jr.Engineer', department: 'Fan Dimmer & Blade' },
  { id: '16976', name: 'Md Takbir Hossain', designation: 'Asst. Engineer', department: 'Fan Armature' }
];

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
const META_STATE_KEYS = ['history', 'branchAttendance', 'iom', 'iom_staff_list', 'iom_locked'];
const SMOOTH_MODE_STORAGE_KEY = 'mep_smooth_mode_enabled';
const EDIT_AUTH_STORAGE_KEY = 'mep_edit_auth_enabled';

function isMetaStateKey(key) {
  return META_STATE_KEYS.includes(key);
}