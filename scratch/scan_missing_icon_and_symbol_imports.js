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
console.log(`Scanning ${allTsxFiles.length} React components for missing icon & symbol imports...\n`);

let missingImportIssues = [];

allTsxFiles.forEach((filePath) => {
  const relPath = path.relative(srcDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Find all Lucide icons or JSX tags used in the file like <IconName ...
  const jsxTagMatches = content.match(/<([A-Z][A-Za-z0-9]+)[\s/>]/g) || [];
  const uniqueTags = Array.from(new Set(jsxTagMatches.map(t => t.replace(/[</\s>]/g, ''))));

  // Common built-in HTML/React tags to ignore
  const ignoreList = new Set([
    'Fragment', 'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
    'Button', 'Input', 'Select', 'Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell',
    'Skeleton', 'Badge', 'Link', 'Image', 'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription',
    'DialogFooter', 'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
    'ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie',
    'Cell', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend', 'RechartsTooltip', 'StatusBadge',
    'ProfileCompletionScoreWidget', 'CustomerSatisfactionWidget', 'WebsitePromotionalBanners'
  ]);

  uniqueTags.forEach((tagName) => {
    if (ignoreList.has(tagName)) return;

    // Check if symbol is defined or imported in content
    const importRegex = new RegExp(`\\b${tagName}\\b`);
    
    // Split imports vs JSX content
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import') || line.trim().startsWith('const') || line.trim().startsWith('let') || line.trim().startsWith('function'));
    const isImported = importLines.some(line => line.includes(tagName));
    const isDefinedInFile = content.includes(`function ${tagName}`) || content.includes(`const ${tagName}`) || content.includes(`class ${tagName}`) || content.includes(`interface ${tagName}`) || content.includes(`type ${tagName}`);

    if (!isImported && !isDefinedInFile) {
      missingImportIssues.push({
        file: relPath,
        symbol: tagName
      });
    }
  });
});

console.log('============================================================');
console.log(`MISSING IMPORT SCAN RESULTS: Found ${missingImportIssues.length} potential issues.`);
console.log('============================================================\n');

missingImportIssues.forEach((issue, idx) => {
  console.log(`${idx + 1}. [MISSING_SYMBOL_IMPORT] ${issue.file} -> Symbol: <${issue.symbol} />`);
});
