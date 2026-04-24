import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, child } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Expose these globally so app.js can use them without being a module itself
window.firebaseDb = db;
window.firebaseRef = ref;
window.firebaseOnValue = onValue;
window.firebaseSet = set;
window.firebaseGet = get;
window.firebaseChild = child;

// Notify app.js that Firebase is ready to use
window.dispatchEvent(new Event('firebase-ready'));
