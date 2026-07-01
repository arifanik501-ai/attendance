const fs = require('fs');
let code = fs.readFileSync('history.js', 'utf8');

const targetStr = `    results.forEach(function(res) {
      const parts = res.dateStr.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  
      const isFriday = dateObj.getDay() === 5;
      const rowBg = isFriday ? '#fee2e2' : '#ffffff';
      const cellBorder = "1px solid #cbd5e1";

      const merged = collectFanAssembleDimmerTotals(res.state);
      const auth = merged.totals.authorized || 0;
      const exist = merged.totals.existing || 0;
      const pres = merged.totals.present || 0;
      const abs = merged.totals.absent || 0;
      const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

      totalAuthSum += auth;
      totalExistSum += exist;
      totalPresentSum += pres;
      totalAbsentSum += abs;

      html += \`<tr>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${rowBg};">\${formattedDate}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${rowBg};">\${dayName}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? '#fecaca' : '#ecfdf5'}; mso-number-format:'0';">\${auth}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? '#fecaca' : '#d1fae5'}; mso-number-format:'0';">\${exist}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: #a7f3d0; mso-number-format:'0';">\${pres}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #9a3412; background-color: #ffedd5; mso-number-format:'0';">\${abs}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; font-weight: bold; background-color: \${rowBg};">\${pct}%</td>
      </tr>\`;
    });

    const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;
    const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
    const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
    
    html += \`
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2" style="background-color: #0f766e; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">Total / Average</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${avgAuth}</th>
          <th style="background-color: #cbd5e1; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${avgExist}</th>
          <th style="background-color: #a7f3d0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${totalPresentSum}</th>
          <th style="background-color: #ffedd5; color: #9a3412; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${totalAbsentSum}</th>
          <th style="background-color: #166534; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8;">\${overallPct}%</th>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>\`;`;

const replacementStr = `    results.forEach(function(res) {
      const parts = res.dateStr.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
      const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  
      const isFriday = dateObj.getDay() === 5;
      const cellBorder = "1px solid #94a3b8";
      const fridayBg = "#fbcfa9";

      const merged = collectFanAssembleDimmerTotals(res.state);
      const auth = merged.totals.authorized || 0;
      const exist = merged.totals.existing || 0;
      const pres = merged.totals.present || 0;
      const abs = merged.totals.absent || 0;
      const pct = auth > 0 ? Math.round((pres / auth) * 100) : 0;

      totalAuthSum += auth;
      totalExistSum += exist;
      totalPresentSum += pres;
      totalAbsentSum += abs;

      html += \`<tr>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${formattedDate}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${dayName}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'}; mso-number-format:'0';">\${auth}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#ffffff'}; mso-number-format:'0';">\${exist}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; background-color: \${isFriday ? fridayBg : '#a7f3d0'}; mso-number-format:'0';">\${pres}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #c2410c; background-color: \${isFriday ? fridayBg : '#ffedd5'}; mso-number-format:'0';">\${abs}</td>
        <td style="text-align: center; padding: 6px; border: \${cellBorder}; color: #000000; font-weight: bold; background-color: \${isFriday ? fridayBg : '#ffffff'};">\${pct}%</td>
      </tr>\`;
    });

    const overallPct = totalAuthSum > 0 ? Math.round((totalPresentSum / totalAuthSum) * 100) : 0;
    const avgAuth = dayCount > 0 ? (totalAuthSum / dayCount).toFixed(1) : '0.0';
    const avgExist = dayCount > 0 ? (totalExistSum / dayCount).toFixed(1) : '0.0';
    
    html += \`
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2" style="background-color: #047857; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">Total / Average</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${avgAuth}</th>
          <th style="background-color: #e2e8f0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${avgExist}</th>
          <th style="background-color: #a7f3d0; color: #000000; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${totalPresentSum}</th>
          <th style="background-color: #ffedd5; color: #c2410c; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${totalAbsentSum}</th>
          <th style="background-color: #064e3b; color: #ffffff; text-align: center; font-weight: bold; padding: 8px; border: 1px solid #94a3b8; border-top: 2px solid #000000;">\${overallPct}%</th>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>\`;`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('history.js', code);
  fs.writeFileSync('history.min.js', code);
  console.log('Successfully styled Excel Merge to match screenshot.');
} else {
  console.log('Error: target string not found.');
}
