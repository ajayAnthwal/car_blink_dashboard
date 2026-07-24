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

// We want to replace res?.docs || [] with (Array.isArray(res) ? res : (res?.docs || res?.data || []))
const files = walkSync('./app/(executive)');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Simple replacement for basic pattern
  content = content.replace(/res\?\.docs \|\| \[\]/g, '(Array.isArray(res) ? res : (res?.docs || res?.data || []))');
  content = content.replace(/res\?\.data \|\| \[\]/g, '(Array.isArray(res) ? res : (res?.docs || res?.data || []))');
  content = content.replace(/res\.docs \|\| \[\]/g, '(Array.isArray(res) ? res : (res?.docs || res?.data || []))');
  content = content.replace(/res\.data \|\| \[\]/g, '(Array.isArray(res) ? res : (res?.docs || res?.data || []))');
  
  // also replace any occurrences of (Array.isArray(res) ? res : (res?.docs || []))
  content = content.replace(/\(Array\.isArray\(([\w]+)\) \? \1 : \(\1\?\.docs \|\| \[\]\)\)/g, '(Array.isArray($1) ? $1 : ($1?.docs || $1?.data || []))');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
}

console.log(`Finished fixing executive arrays. Modified ${modifiedCount} files.`);
