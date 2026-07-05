const fs = require('fs');

// Restore from backup
fs.copyFileSync('history.js.bak', 'history.js');
fs.copyFileSync('history.js.bak', 'history.min.js');

console.log("Restored history.js and history.min.js from backup");

// Now run the robust injection script
require('./add_edit_robust.js');
