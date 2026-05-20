const fs = require('fs');
const file = 'components/FilmmakerApp.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
content = content.replace(/\\\\n/g, '\\n');
fs.writeFileSync(file, content);
console.log('Fixed escaped chars');
