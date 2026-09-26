const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

const srcDir = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard';
const lucideExports = new Set(Object.keys(lucide));

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
console.log(`Auditing ${allTsxFiles.length} files for missing Lucide icon imports...\n`);

let fixedFilesCount = 0;
let totalIconsFixed = 0;

allTsxFiles.forEach((filePath) => {
  const relPath = path.relative(srcDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all JSX tags matching Lucide icon names
  const jsxTagMatches = content.match(/<([A-Z][A-Za-z0-9]+)[\s/>]/g) || [];
  const uniqueTags = Array.from(new Set(jsxTagMatches.map(t => t.replace(/[</\s>]/g, ''))));

  const missingLucideIcons = [];

  uniqueTags.forEach((tagName) => {
    if (!lucideExports.has(tagName)) return;

    // Strict check if tag is in an import statement or defined locally
    const lines = content.split('\n');
    const hasImport = lines.some(line => line.includes(tagName) && (line.includes('import') || line.includes('require')));
    const isDefinedInFile = content.includes(`function ${tagName}`) || content.includes(`const ${tagName}`) || content.includes(`class ${tagName}`) || content.includes(`interface ${tagName}`) || content.includes(`type ${tagName}`);

    if (!hasImport && !isDefinedInFile) {
      missingLucideIcons.push(tagName);
    }
  });

  if (missingLucideIcons.length > 0) {
    console.log(`[FIXING] ${relPath} -> Missing icons: ${missingLucideIcons.join(', ')}`);

    // Check if lucide-react import already exists in file
    const lucideImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/);

    if (lucideImportMatch) {
      const existingIconsStr = lucideImportMatch[1];
      const existingIcons = existingIconsStr.split(',').map(s => s.trim()).filter(Boolean);
      const updatedIcons = Array.from(new Set([...existingIcons, ...missingLucideIcons])).join(', ');
      content = content.replace(lucideImportMatch[0], `import { ${updatedIcons} } from "lucide-react"`);
    } else {
      // Add new lucide-react import line at top of file
      const importLine = `import { ${missingLucideIcons.join(', ')} } from "lucide-react";\n`;
      if (content.includes('"use client";')) {
        content = content.replace('"use client";', `"use client";\n${importLine}`);
      } else if (content.startsWith('// @ts-nocheck')) {
        content = content.replace('// @ts-nocheck', `// @ts-nocheck\n${importLine}`);
      } else {
        content = `${importLine}${content}`;
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    fixedFilesCount++;
    totalIconsFixed += missingLucideIcons.length;
  }
});

console.log('\n============================================================');
console.log(`SUCCESSFULLY FIXED ${totalIconsFixed} MISSING LUCIDE ICONS ACROSS ${fixedFilesCount} FILES!`);
console.log('============================================================');
