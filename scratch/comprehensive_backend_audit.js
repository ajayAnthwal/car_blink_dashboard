const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
console.log(`Found ${allFiles.length} TypeScript source files to audit.\n`);

let findings = [];

allFiles.forEach((filePath) => {
  const relPath = path.relative(srcDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 1. Audit user creation calls
    if (line.includes('UserModel.create') || line.includes('User.create')) {
      findings.push({
        file: relPath,
        line: lineNum,
        type: 'USER_CREATION',
        code: line.trim()
      });
    }

    // 2. Audit OTP verification fallbacks
    if (line.includes('verifyStoredOtp') && (line.includes('|| true') || line.includes('isOtpValid = true'))) {
      findings.push({
        file: relPath,
        line: lineNum,
        type: 'OTP_FALLBACK_RISK',
        code: line.trim()
      });
    }

    // 3. Audit unhandled error swallowing
    if (line.includes('.catch(() => {})') || line.includes('.catch(err => {})')) {
      findings.push({
        file: relPath,
        line: lineNum,
        type: 'SILENT_PROMISE_CATCH',
        code: line.trim()
      });
    }
  });
});

console.log('====================================================');
console.log(`AUDIT SUMMARY: Found ${findings.length} points of interest.`);
console.log('====================================================\n');

findings.forEach((f, idx) => {
  console.log(`${idx + 1}. [${f.type}] ${f.file}:${f.line}`);
  console.log(`   Code: ${f.code}`);
  console.log('----------------------------------------------------');
});
