const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard';
const conflictingSymbols = new Set(['Badge', 'Table', 'BarChart', 'PieChart', 'AreaChart', 'LineChart', 'Sheet']);

function getAllTsxFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') return;
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllTsxFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allTsxFiles = getAllTsxFiles(srcDir);
console.log(`Cleaning conflicting imports across ${allTsxFiles.length} files...\n`);

let cleanedFilesCount = 0;

allTsxFiles.forEach((filePath) => {
  const relPath = path.relative(srcDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Match import { ... } from "lucide-react"
  const lucideImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/);

  if (lucideImportMatch) {
    const icons = lucideImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const filteredIcons = icons.filter(icon => !conflictingSymbols.has(icon));

    if (filteredIcons.length !== icons.length) {
      if (filteredIcons.length > 0) {
        content = content.replace(lucideImportMatch[0], `import { ${filteredIcons.join(', ')} } from "lucide-react"`);
      } else {
        content = content.replace(lucideImportMatch[0] + ';\n', '');
        content = content.replace(lucideImportMatch[0], '');
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[CLEANED] ${relPath} -> Removed conflicting symbols: ${icons.filter(i => conflictingSymbols.has(i)).join(', ')}`);
      cleanedFilesCount++;
    }
  }
});

console.log(`\nCleaned ${cleanedFilesCount} files successfully!`);
