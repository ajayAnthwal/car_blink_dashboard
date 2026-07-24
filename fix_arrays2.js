const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

// Regex to find my previous replacement: (Array.isArray(res) ? res : (res?.docs || []))
// We want to change it to: (Array.isArray(res) ? res : (res?.docs || res?.data || []))
const regex = /\(Array\.isArray\(([\w]+)\) \? \1 : \(\1\?\.docs \|\| \[\]\)\)/g;

const files = walkSync('./app/(customer)');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(regex, '(Array.isArray($1) ? $1 : ($1?.docs || $1?.data || []))');

  // Edge cases if some were written as res?.docs || [] directly
  content = content.replace(/setModels\(res\?\.docs \|\| \[\]\);/g, 'setModels(Array.isArray(res) ? res : (res?.docs || res?.data || []));');
  content = content.replace(/setBrands\(res\?\.docs \|\| \[\]\);/g, 'setBrands(Array.isArray(res) ? res : (res?.docs || res?.data || []));');
  content = content.replace(/setVehicles\(res\?\.docs \|\| \[\]\);/g, 'setVehicles(Array.isArray(res) ? res : (res?.docs || res?.data || []));');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
}

console.log(`Finished fixing arrays again. Modified ${modifiedCount} files.`);
