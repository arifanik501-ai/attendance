const https = require('https');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function testAugustExcelCalculations() {
  console.log("Fetching August 2026 history snapshots...");
  const index = await fetchJSON('https://whatsapp-c10ef-default-rtdb.firebaseio.com/mep_attendance_history_index.json');
  const augDates = Object.keys(index || {}).filter(k => k.startsWith('2026-08')).sort();
  console.log(`Found ${augDates.length} snapshot dates in August 2026.`);

  const results = [];
  for (const dStr of augDates) {
    const state = await fetchJSON(`https://whatsapp-c10ef-default-rtdb.firebaseio.com/mep_attendance_history/${dStr}.json`);
    results.push({ dateStr: dStr, state: state });
  }

  const SECTIONS_CONFIG = {
    "monir": true,
    "takbir": true,
    "bikash": true,
    "anik": true,
    "anwar": true
  };

  const dates = results.map(r => r.dateStr).sort((a, b) => new Date(a) - new Date(b));
  const dataMap = {};

  results.forEach(function(res) {
    const dStr = res.dateStr;
    const state = res.state || {};
    
    Object.keys(state).forEach(function(pageId) {
      if (!SECTIONS_CONFIG[pageId]) return;
      const pageData = state[pageId];
      if (typeof pageData !== 'object' || pageData === null) return;
      
      Object.keys(pageData).forEach(function(originalGroupName) {
        let groupName = originalGroupName;
        const excludedSections = ['anik', 'anwar', 'bikash', 'monir', 'takbir'];
        if (excludedSections.includes(groupName.toLowerCase().trim())) return;
        if (groupName.trim().toLowerCase() === 'power press & stamping') {
          groupName = 'Fan Power Press & Stamping';
        }
        var rows = pageData[originalGroupName];
        if (!rows) return;
        if (!Array.isArray(rows)) {
          if (typeof rows === 'object') { rows = Object.values(rows); } else { return; }
        }
        
        if (!dataMap[groupName]) dataMap[groupName] = {};
        
        rows.forEach(function(row) {
          if (!row || typeof row !== 'object') return;
          let desig = String(row.designation || 'N/A').trim();
          if (groupName === 'Fan Auto Powder Coating' && desig.toLowerCase() === 'computer operator') {
            desig = 'Sr. Supervisor';
          }
          if (desig.toLowerCase() === 'supervisor') {
            desig = 'Sr. Supervisor';
          }
          if (!dataMap[groupName][desig]) dataMap[groupName][desig] = {};
          
          const authorized = parseInt(row.authorized) || 0;
          const existing = parseInt(row.existing) || 0;
          const present = parseInt(row.present) || 0;
          const absent = Math.max(0, authorized - present);
          
          if (!dataMap[groupName][desig][dStr]) {
            dataMap[groupName][desig][dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 };
          }
          
          dataMap[groupName][desig][dStr].auth += authorized;
          dataMap[groupName][desig][dStr].exist += existing;
          dataMap[groupName][desig][dStr].pres += present;
          dataMap[groupName][desig][dStr].abs += absent;
        });
      });
    });
  });

  const dateTotals = {};
  dates.forEach(dStr => {
    dateTotals[dStr] = { auth: 0, exist: 0, pres: 0, abs: 0 };
  });

  Object.keys(dataMap).forEach(section => {
    Object.keys(dataMap[section]).forEach(desig => {
      dates.forEach(dStr => {
        const cell = dataMap[section][desig][dStr];
        if (cell) {
          dateTotals[dStr].auth += cell.auth;
          dateTotals[dStr].exist += cell.exist;
          dateTotals[dStr].pres += cell.pres;
          dateTotals[dStr].abs += cell.abs;
        }
      });
    });
  });

  const isWorkingDay = (dStr) => Boolean(dateTotals[dStr] && dateTotals[dStr].pres > 0);
  const workingDays = dates.filter(isWorkingDay);
  const offDays = dates.filter(d => !isWorkingDay(d));

  console.log(`\n--- Working Days Summary ---`);
  console.log(`Total Dates: ${dates.length}`);
  console.log(`Working Days Count (pres > 0): ${workingDays.length}`);
  console.log(`Off Days Count (pres = 0): ${offDays.length}`);
  console.log(`Off Dates:`, offDays);

  let gTotalAuth = 0, gTotalExist = 0, gTotalPres = 0, gTotalAbs = 0;
  let gWorkingDays = 0;
  dates.forEach(dStr => {
    const t = dateTotals[dStr];
    if (isWorkingDay(dStr)) {
      gTotalAuth += t.auth;
      gTotalExist += t.exist;
      gTotalPres += t.pres;
      gTotalAbs += t.abs;
      gWorkingDays++;
    }
  });

  console.log(`\n--- Grand Daily Totals ---`);
  console.log(`Grand Total Present: ${gTotalPres}`);
  console.log(`Grand Total Authorized: ${gTotalAuth}`);
  console.log(`Grand Average Present: ${Math.round(gTotalPres / gWorkingDays)} (divided by ${gWorkingDays} working days)`);
  console.log(`Grand Average Authorized: ${Math.round(gTotalAuth / gWorkingDays)}`);
  console.log(`Efficiency Percentage: ${Math.round((gTotalPres / gTotalAuth) * 100)}%`);

  const firstSection = Object.keys(dataMap).sort()[0];
  const firstDesig = Object.keys(dataMap[firstSection]).sort()[0];
  let rAuth = 0, rPres = 0, rWorkDays = 0;
  dates.forEach(dStr => {
    const cell = dataMap[firstSection][firstDesig][dStr];
    if (cell && isWorkingDay(dStr)) {
      rAuth += cell.auth;
      rPres += cell.pres;
      rWorkDays++;
    }
  });
  console.log(`\nSample Row [${firstSection} - ${firstDesig}]:`);
  console.log(`Total Present: ${rPres}, Working Days: ${rWorkDays}, Average Present: ${Math.round(rPres / rWorkDays)}`);
}

testAugustExcelCalculations();
