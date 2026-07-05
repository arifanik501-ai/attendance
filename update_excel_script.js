const fs = require('fs');

function updateFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Inject forced designations
  const injectTarget = `          dataMap[groupName][desig][dStr].pres += present;
          dataMap[groupName][desig][dStr].abs += absent;
        });
      });
    });
  });

  // 3. Build HTML Table for Excel`;

  const injectReplacement = `          dataMap[groupName][desig][dStr].pres += present;
          dataMap[groupName][desig][dStr].abs += absent;
        });
      });
    });
  });

  // --- START INJECTION: Force specific designations from July 2024 onwards ---
  dates.forEach(function(dStr) {
    if (dStr >= '2024-07-01') {
      if (!dataMap['Fan Sada Shapla']) dataMap['Fan Sada Shapla'] = {};
      if (!dataMap['Fan Sada Shapla']['Supervisor']) dataMap['Fan Sada Shapla']['Supervisor'] = {};
      if (!dataMap['Fan Sada Shapla']['Supervisor'][dStr]) {
        dataMap['Fan Sada Shapla']['Supervisor'][dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 };
      }

      if (!dataMap['Fan Assemble']) dataMap['Fan Assemble'] = {};
      if (!dataMap['Fan Assemble']['Jr. Officer']) dataMap['Fan Assemble']['Jr. Officer'] = {};
      if (!dataMap['Fan Assemble']['Jr. Officer'][dStr]) {
        dataMap['Fan Assemble']['Jr. Officer'][dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 };
      }
    }
  });
  // --- END INJECTION ---

  // 3. Build HTML Table for Excel`;

  if (content.includes(injectTarget)) {
    content = content.replace(injectTarget, injectReplacement);
    console.log(filename + ': REPLACED injection');
  } else {
    console.log(filename + ': COULD NOT FIND injection target');
  }

  // 2. Bypass filter for forced designations
  const filterTarget = `  Object.keys(dataMap).sort().forEach(section => {
    // 3. Remove Empty Rows: Skip designations that have 0 auth/exist across all dates
    const designations = Object.keys(dataMap[section]).sort().filter(desig => {
      let totalData = 0;
      dates.forEach(dStr => {`;

  const filterReplacement = `  Object.keys(dataMap).sort().forEach(section => {
    // 3. Remove Empty Rows: Skip designations that have 0 auth/exist across all dates
    const designations = Object.keys(dataMap[section]).sort().filter(desig => {
      // Force include these from July 1st
      if (section === 'Fan Sada Shapla' && desig === 'Supervisor') {
        if (dates.some(d => d >= '2024-07-01')) return true;
      }
      if (section === 'Fan Assemble' && desig === 'Jr. Officer') {
        if (dates.some(d => d >= '2024-07-01')) return true;
      }

      let totalData = 0;
      dates.forEach(dStr => {`;

  if (content.includes(filterTarget)) {
    content = content.replace(filterTarget, filterReplacement);
    console.log(filename + ': REPLACED filter bypass');
  } else {
    console.log(filename + ': COULD NOT FIND filter bypass target');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(filename, content);
}

updateFile('history.js');
updateFile('history.min.js');
console.log('Update finished.');
