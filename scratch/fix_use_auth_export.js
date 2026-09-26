const fs = require('fs');
const tsPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.ts';
const tsxPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.tsx';

if (fs.existsSync(tsxPath)) {
  fs.writeFileSync(tsPath, `export * from './useAuth.tsx';\n`, 'utf8');
  console.log('Successfully created useAuth.ts re-exporting useAuth.tsx');
} else {
  console.log('useAuth.tsx does not exist');
}
