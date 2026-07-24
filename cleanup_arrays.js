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

// Regex patterns to match all the messy Array.isArray checks
const regexes = [
  /\(Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\?\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)\)\)/g,
  /\(Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)/g,
  /Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\?\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)\)/g,
  /Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)/g,
  /\(\(Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)\)/g
];

const files = walkSync('./app/(customer)');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const regex of regexes) {
    content = content.replace(regex, '($1?.docs || [])');
  }

  // Handle some manual edge cases
  content = content.replace(/Array\.isArray\(ticketsRes\) \? ticketsRes : \(ticketsRes\?\.tickets \|\| ticketsRes\?\.docs \|\| \[\]\)/g, '(ticketsRes?.docs || [])');
  content = content.replace(/Array\.isArray\(res\?\.docs\) \? res\.docs : \(Array\.isArray\(res\?\.data\) \? res\.data : \(Array\.isArray\(res\) \? res : \[\]\)\)/g, '(res?.docs || [])');
  content = content.replace(/Array\.isArray\(leadsArray\) \? leadsArray : \[\]/g, '(leadsArray || [])');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
}

console.log(`Finished. Modified ${modifiedCount} files.`);
