const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard';

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
console.log(`Scanning ${allTsxFiles.length} React TSX/JSX components in car_blink_dashboard...\n`);

let nestedLinkIssues = [];
let unsafeMapCalls = [];

allTsxFiles.forEach((filePath) => {
  const relPath = path.relative(srcDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inLinkStack = 0;
  let linkStartLine = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Detect Nested <Link> or <a> tags
    if (line.includes('<Link') || line.includes('<a ')) {
      if (inLinkStack > 0) {
        nestedLinkIssues.push({
          file: relPath,
          line: lineNum,
          outerLine: linkStartLine,
          code: line.trim()
        });
      }
      inLinkStack++;
      if (inLinkStack === 1) linkStartLine = lineNum;
    }

    if (line.includes('</Link>') || line.includes('</a>')) {
      if (inLinkStack > 0) inLinkStack--;
    }

    // 2. Detect Button asChild inside Link or Link inside Button asChild
    if (line.includes('<Button asChild') && line.includes('<Link')) {
      // Valid pattern: <Button asChild><Link href="..."/></Button>
    } else if (line.includes('<Link') && line.includes('<Button asChild')) {
      // Nested button inside link error
      nestedLinkIssues.push({
        file: relPath,
        line: lineNum,
        outerLine: lineNum,
        code: line.trim()
      });
    }

    // 3. Detect unguarded .map() or .filter() on query responses
    if (line.match(/(\b\w+)\.(map|filter|reduce)\(/) && !line.includes('Array.isArray') && !line.includes('?.') && !line.includes('|| []')) {
      const match = line.match(/(\b\w+)\.(map|filter|reduce)\(/);
      const varName = match ? match[1] : '';
      if (['data', 'list', 'items', 'users', 'leads', 'bookings', 'jobs', 'bids', 'reviews', 'payments', 'warranties', 'refunds', 'settlements', 'invoices'].includes(varName)) {
        unsafeMapCalls.push({
          file: relPath,
          line: lineNum,
          variable: varName,
          code: line.trim()
        });
      }
    }
  });
});

console.log('============================================================');
console.log(`NESTED LINK / HYDRATION DOM AUDIT: Found ${nestedLinkIssues.length} issues.`);
console.log('============================================================\n');

nestedLinkIssues.forEach((issue, idx) => {
  console.log(`${idx + 1}. [NESTED_LINK_RISK] ${issue.file}:${issue.line} (Outer Link at L${issue.outerLine})`);
  console.log(`   Code: ${issue.code}`);
  console.log('------------------------------------------------------------');
});

console.log('\n============================================================');
console.log(`UNGUARDED ARRAY METHOD AUDIT: Found ${unsafeMapCalls.length} issues.`);
console.log('============================================================\n');

unsafeMapCalls.slice(0, 15).forEach((issue, idx) => {
  console.log(`${idx + 1}. [UNGUARDED_ARRAY] ${issue.file}:${issue.line} (Var: ${issue.variable})`);
  console.log(`   Code: ${issue.code}`);
  console.log('------------------------------------------------------------');
});
