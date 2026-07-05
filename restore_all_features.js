const { execSync } = require('child_process');

const scriptsToRun = [
  'update_script.js', // Merged views (Fan Sada Shapla, Fan Rojonigondha)
  'update_excel_script.js', // Excel force inclusion of designations
  'fix_excel_style.js', // Initial Excel styling
  'update_excel_premium.js', // Premium Excel styling
  'update_excel_hyper_premium.js', // Hyper Premium Excel styling
  'update_font_times.js', // Revert to Times New Roman
  'update_ui_script.js', // UI button for merged views
  'update_ss_robust.js' // Premium UI card styling for history snapshots
];

scriptsToRun.forEach(script => {
  try {
    console.log(`Running ${script}...`);
    const output = execSync(`node ${script}`, { encoding: 'utf-8' });
    console.log(output);
  } catch (err) {
    console.error(`Error running ${script}:`, err.message);
  }
});

console.log("All updates restored successfully!");
