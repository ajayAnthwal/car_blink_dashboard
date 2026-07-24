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

const regex = /\(([\w]+)\?\.docs \|\| \[\]\)/g;

const files = walkSync('./app/(customer)');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(regex, '(Array.isArray($1) ? $1 : ($1?.docs || []))');

  // Also replace double parens if there were any, like ((res?.docs || []))
  // The above regex handles single parens.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
}

console.log(`Finished fixing arrays. Modified ${modifiedCount} files.`);
