const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '../../frontend/faculty/sheets/sheets.js');
const htmlPath = path.join(__dirname, '../../frontend/faculty/sheets/index.html');

const js = fs.readFileSync(jsPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

const regex = /getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/g;
const ids = new Set();
let m;
while ((m = regex.exec(js)) !== null) {
  ids.add(m[1]);
}

const missing = [];
for (const id of ids) {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missing.push(id);
  }
}

console.log('Audited', ids.size, 'IDs accessed via getElementById in sheets.js');
console.log('IDs in sheets.js not present in sheets/index.html:');
missing.forEach(id => console.log(' - ' + id));
