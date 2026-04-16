const fs = require('fs');
const path = require('path');

try {
  const imgPath = path.join(__dirname, '8dbe405d-f9a0-4513-8956-65945f9f1bb8_removalai_preview.png');
  const imgData = fs.readFileSync(imgPath);
  const b64 = 'data:image/png;base64,' + imgData.toString('base64');

  let appJs = fs.readFileSync('app.js', 'utf8');
  
  // Replace references
  appJs = appJs.replace(/src="8dbe405d-f9a0-4513-8956-65945f9f1bb8_removalai_preview\.png"/g, `src="${b64}"`);
  
  fs.writeFileSync('app.js', appJs);
  console.log('Fixed app.js');
} catch (e) {
  console.error(e);
}
