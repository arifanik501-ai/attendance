const fs = require('fs');

function revertFontToTimes(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let originalContent = content;

  // Replace font-family back to Times New Roman
  content = content.replace(
    /font-family: 'Montserrat', 'Calibri', 'Segoe UI', sans-serif;/g, 
    "font-family: 'Times New Roman', Times, serif;"
  );

  if (content !== originalContent) {
    fs.writeFileSync(filename, content);
    console.log(filename + ' updated font back to Times New Roman.');
  } else {
    console.log(filename + ' no changes made.');
  }
}

revertFontToTimes('history.js');
revertFontToTimes('history.min.js');
