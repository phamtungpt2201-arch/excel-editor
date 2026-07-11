const xlsx = require('xlsx');

const rows = 1000;
const cols = 50;

const data = [];
for (let i = 0; i < rows; i++) {
  const row = {};
  for (let j = 0; j < cols; j++) {
    row[`Column_${j + 1}`] = `Row${i + 1}_Col${j + 1}`;
  }
  data.push(row);
}

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
xlsx.writeFile(workbook, 'test_data_1000x50.xlsx');
console.log("Created test_data_1000x50.xlsx");
