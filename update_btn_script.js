const fs = require('fs');

let content = fs.readFileSync('history.js', 'utf8');
content = content.replace(/\\r\\n/g, '\\n');

content = content.replace(
  /function updateMergedHistoryButtonState\(\) \{[\s\S]*?\}\s*function historyEscapeHtml/,
  `function updateMergedHistoryButtonState() {
  const btnDef = document.getElementById('fan-merge-history-btn-default');
  const btnAsm = document.getElementById('fan-merge-history-btn');
  const btnRoj = document.getElementById('fan-roj-shapla-merge-history-btn');
  
  if (btnDef) btnDef.classList.toggle('is-active', !window.historyMergedMode);
  if (btnAsm) btnAsm.classList.toggle('is-active', window.historyMergedMode === 'assemble_dimmer');
  if (btnRoj) btnRoj.classList.toggle('is-active', window.historyMergedMode === 'roj_shapla');
}

function historyEscapeHtml`
);

content = content.replace(/\\n/g, '\\r\\n');
fs.writeFileSync('history.js', content);
fs.writeFileSync('history.min.js', content);

console.log('Fixed updateMergedHistoryButtonState');
