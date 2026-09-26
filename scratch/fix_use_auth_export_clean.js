const fs = require('fs');
const tsPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.ts';

fs.writeFileSync(tsPath, `export * from './useAuth';\n`, 'utf8');
console.log('Updated useAuth.ts to export * from "./useAuth";');
