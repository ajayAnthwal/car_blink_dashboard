import fs from 'fs';
import path from 'path';

const walkSync = (dir: string, filelist: string[] = []) => {
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

const regex = /\(Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\?\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)\)\)/g;

const simplerRegex1 = /\(Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)/g;
const simplerRegex2 = /Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\?\.[\w]+\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)\)\)/g;
const simplerRegex3 = /Array\.isArray\(([^?)]+)\??\.docs\) \? [^:]+ : \(Array\.isArray\([^?)]+\??\.data\) \? [^:]+ : \(Array\.isArray\([^)]+\) \? [^:]+ : \[\]\)\)/g;


const files = walkSync('./app/(customer)');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // The replacement is just: $1?.docs || []
  // We need to carefully capture the variable name before ?.docs.
  // Wait, we can just replace all of them with: ($1?.docs || [])
  
  content = content.replace(regex, '($1?.docs || [])');
  content = content.replace(simplerRegex1, '($1?.docs || [])');
  content = content.replace(simplerRegex2, '($1?.docs || [])');
  content = content.replace(simplerRegex3, '($1?.docs || [])');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
}

console.log(`Finished. Modified ${modifiedCount} files.`);
