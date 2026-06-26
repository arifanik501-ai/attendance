const fs = require('fs');

const mht = `MIME-Version: 1.0
X-Document-Type: Workbook
Content-Type: multipart/related; boundary="----Boundary"

------Boundary
Content-Location: file:///C:/dummy/workbook.htm
Content-Transfer-Encoding: 8bit
Content-Type: text/html; charset="utf-8"

<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Attendance</x:Name>
    <x:WorksheetSource HRef="sheet1.htm"/>
   </x:ExcelWorksheet>
   <x:ExcelWorksheet>
    <x:Name>IOM</x:Name>
    <x:WorksheetSource HRef="sheet2.htm"/>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
</head>
</html>

------Boundary
Content-Location: file:///C:/dummy/sheet1.htm
Content-Transfer-Encoding: 8bit
Content-Type: text/html; charset="utf-8"

<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><style>td { background: red; }</style></head>
<body><table border="1"><tr><td>Sheet 1 Data - বাংলা</td></tr></table></body></html>

------Boundary
Content-Location: file:///C:/dummy/sheet2.htm
Content-Transfer-Encoding: 8bit
Content-Type: text/html; charset="utf-8"

<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><style>td { background: blue; color: white; }</style></head>
<body><table border="1"><tr><td>Sheet 2 Data</td></tr></table></body></html>

------Boundary--`;

fs.writeFileSync('test-multi2.xls', mht, 'utf8');
console.log('done');
