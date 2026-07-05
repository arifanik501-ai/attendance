const fs = require('fs');

function upgradeExcelPremium(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let originalContent = content;

  // 1. Font
  content = content.replace(
    /font-family: 'Times New Roman', Times, serif; font-size: 10pt;/g, 
    "font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt;"
  );

  // 2. Title Header
  content = content.replace(
    /font-size: 18pt; font-weight: bold; text-align: center; padding: 12px; background-color: #064e3b; color: #ffffff; border: 1px solid #94a3b8;/g,
    "font-size: 22pt; font-weight: 800; text-align: center; padding: 20px; background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b; text-transform: uppercase; letter-spacing: 2px;"
  );

  // 3. Section/Designation Header
  content = content.replace(
    /background-color: #064e3b; color: #ffffff; font-weight: bold; vertical-align: middle; text-align: center; border: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;/g,
    "background-color: #1e293b; color: #ffffff; font-weight: 800; vertical-align: middle; text-align: center; border: 1px solid #334155; border-bottom: 3px solid #64748b; padding: 10px;"
  );

  // 4. Dates Header Colors
  content = content.replace(
    /const bgColor = isFriday \? '#991b1b' : '#047857';/g,
    "const bgColor = isFriday ? '#9f1239' : '#334155';"
  );
  content = content.replace(
    /padding: 6px;">\$\{dateLabel\}<\/th>/g,
    'padding: 10px;">${dateLabel}</th>'
  );

  // 5. Monthly Total / Average
  content = content.replace(
    /background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; border-left: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 6px;/g,
    "background-color: #1e293b; color: #ffffff; font-weight: 800; text-align: center; border: 1px solid #334155; border-left: 2px solid #475569; border-right: 2px solid #475569; padding: 10px;"
  );

  // 6. Auth/Exist/Pres/Abs column headers
  content = content.replace(
    /padding: 4px; font-size: 10pt;">Auth<\/th>/g,
    'padding: 8px; font-size: 10pt; font-weight: bold; text-transform: uppercase;">Auth</th>'
  );
  content = content.replace(
    /padding: 4px; font-size: 10pt;">Exist<\/th>/g,
    'padding: 8px; font-size: 10pt; font-weight: bold; text-transform: uppercase;">Exist</th>'
  );
  content = content.replace(
    /padding: 4px; font-size: 10pt;">Pres<\/th>/g,
    'padding: 8px; font-size: 10pt; font-weight: bold; text-transform: uppercase;">Pres</th>'
  );
  content = content.replace(
    /padding: 4px; font-size: 10pt;">Abs<\/th>/g,
    'padding: 8px; font-size: 10pt; font-weight: bold; text-transform: uppercase;">Abs</th>'
  );

  // 7. General paddings for data cells
  content = content.replace(/padding: 4px;/g, 'padding: 6px;');
  content = content.replace(/padding: 5px;/g, 'padding: 8px;');
  content = content.replace(/padding: 6px;/g, 'padding: 8px;');

  // 8. GRAND DAILY TOTALS
  content = content.replace(
    /color: #ffffff; background-color: #0f766e;">GRAND DAILY TOTALS<\/td>/g,
    'color: #ffffff; background-color: #0f172a; font-size: 12pt; text-transform: uppercase;">GRAND DAILY TOTALS</td>'
  );

  // 9. Total Row (Section)
  content = content.replace(
    /border-top: 2px solid #000000; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 8px; font-weight: bold; font-style: italic; text-align: right;">Total<\/td>/g,
    'border-top: 3px solid #334155; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 10px; font-weight: 900; text-transform: uppercase; text-align: right; background-color: #f8fafc;">Total</td>'
  );

  // 10. Update Friday background color to be slightly more premium (rose-50 / rose-100 instead of red-100)
  content = content.replace(/#fee2e2/g, '#fff1f2'); // Auth friday
  content = content.replace(/#fecaca/g, '#ffe4e6'); // Exist friday

  // Subtotals headers - update colors to be less harsh
  content = content.replace(/#e2e8f0/g, '#f1f5f9');
  content = content.replace(/#cbd5e1/g, '#e2e8f0');

  // Fix up Total row border issue created by replacement
  content = content.replace(/border-top: 2px solid #000000;/g, "border-top: 3px solid #334155;");

  // Visual Spacing
  content = content.replace(/height: 16px;/g, "height: 24px;");

  if (content !== originalContent) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' updated for premium excel style.');
  } else {
    console.log(filename + ' no changes made.');
  }
}

upgradeExcelPremium('history.js');
upgradeExcelPremium('history.min.js');
