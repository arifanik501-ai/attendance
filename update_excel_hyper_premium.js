const fs = require('fs');

function upgradeHyperPremium(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let originalContent = content;

  // 1. Font & Base size
  content = content.replace(
    /font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt;/g, 
    "font-family: 'Montserrat', 'Calibri', 'Segoe UI', sans-serif; font-size: 11pt;"
  );

  // 2. Title Header
  content = content.replace(
    /font-size: 22pt; font-weight: 800; text-align: center; padding: 20px; background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b; text-transform: uppercase; letter-spacing: 2px;/g,
    "font-size: 24pt; font-weight: 900; text-align: center; padding: 24px; background-color: #020617; color: #ffffff; border: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 3px;"
  );

  // 3. Section/Designation Header gold accent
  content = content.replace(/border-bottom: 3px solid #64748b;/g, "border-bottom: 4px solid #d97706;");

  // 4. Dates Friday color
  content = content.replace(/'#9f1239'/g, "'#be123c'");

  // 5. Pres % and Abs % Headers
  content = content.replace(
    /background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #e2e8f0; border-bottom: 2px solid #94a3b8; padding: 8px; font-size: 10pt;">Pres %<\/th>/g,
    'background-color: #059669; color: #ffffff; text-align: center; border: 1px solid #e2e8f0; border-bottom: 3px solid #047857; padding: 10px; font-size: 11pt; font-weight: 900; text-transform: uppercase;">Pres %</th>'
  );
  content = content.replace(
    /background-color: #064e3b; color: #ffffff; text-align: center; border: 1px solid #e2e8f0; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; padding: 8px; font-size: 10pt;">Abs %<\/th>/g,
    'background-color: #e11d48; color: #ffffff; text-align: center; border: 1px solid #e2e8f0; border-bottom: 3px solid #be123c; border-right: 2px solid #94a3b8; padding: 10px; font-size: 11pt; font-weight: 900; text-transform: uppercase;">Abs %</th>'
  );

  // 6. Pres % and Abs % data cells
  // We need to replace the background color for these specific columns.
  // Pres % doesn't have border-right: 2px solid #94a3b8
  content = content.replace(
    /padding: 8px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';/g,
    "padding: 10px; color: #ffffff; background-color: #059669; mso-number-format:'0%'; font-size: 11pt;"
  );
  
  // Abs % HAS border-right: 2px solid #94a3b8. But wait, in our previous script we might have matched both.
  // Let's do a precise string match because we replaced ALL #064e3b for the data cells.
  // Actually, the above replace will catch BOTH if they both have `padding: 8px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';`.
  // Let's look at the actual string:
  // `<td style="font-weight:bold; text-align: center; border: 1px solid #e2e8f0; border-right: 2px solid #94a3b8; padding: 8px; color: #ffffff; background-color: #064e3b; mso-number-format:'0%';">${rawAbsPct}</td>`
  // After the first replace, it becomes background-color: #059669.
  // So let's run the first replace, THEN fix the Abs % one.
  content = content.replace(
    /border-right: 2px solid #94a3b8; padding: 10px; color: #ffffff; background-color: #059669; mso-number-format:'0%'; font-size: 11pt;/g,
    "border-right: 2px solid #94a3b8; padding: 10px; color: #ffffff; background-color: #e11d48; mso-number-format:'0%'; font-size: 11pt;"
  );

  // 7. Grand Daily Totals
  content = content.replace(
    /color: #ffffff; background-color: #0f172a; font-size: 12pt; text-transform: uppercase;">GRAND DAILY TOTALS<\/td>/g,
    'color: #ffffff; background-color: #312e81; font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">GRAND DAILY TOTALS</td>'
  );

  // 8. Section Total Row background
  content = content.replace(
    /text-transform: uppercase; text-align: right; background-color: #f8fafc;">Total<\/td>/g,
    'text-transform: uppercase; text-align: right; background-color: #f1f5f9; color: #0f172a;">TOTAL</td>'
  );

  // 9. Section Name column font size
  content = content.replace(
    /font-weight: bold; font-size: 10pt;">\$\{section\}<\/td>/g,
    'font-weight: 900; font-size: 13pt; text-transform: uppercase; color: #1e293b;">${section}</td>'
  );

  // 10. Designation Name column font size
  content = content.replace(
    /padding: 8px; font-weight: 500;">\$\{desig\}<\/td>/g,
    'padding: 10px; font-weight: 700; font-size: 11pt; color: #334155;">${desig}</td>'
  );
  
  // 11. Increase padding on all data cells from 8px to 10px
  content = content.replace(/padding: 8px;/g, 'padding: 10px;');

  // 12. Adjust font size of the headers for Auth/Exist/Pres/Abs
  content = content.replace(/font-size: 10pt; font-weight: bold; text-transform: uppercase;/g, 'font-size: 10.5pt; font-weight: 900; text-transform: uppercase;');

  // Update Total / Average header
  content = content.replace(
    /Monthly Total \/ Average/g,
    'MONTHLY PERFORMANCE SUMMARY'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' updated for hyper-premium excel style.');
  } else {
    console.log(filename + ' no changes made.');
  }
}

upgradeHyperPremium('history.js');
upgradeHyperPremium('history.min.js');
