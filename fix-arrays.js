const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'app', '(customer)', 'customer');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(dir, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /(\w+)\?\.docs\s*\|\|\s*\1\s*\|\|\s*\[\]/g;
    if (regex.test(content)) {
      content = content.replace(regex, '(Array.isArray($1?.docs) ? $1.docs : (Array.isArray($1?.data) ? $1.data : (Array.isArray($1) ? $1 : [])))');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
