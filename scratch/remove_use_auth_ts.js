const fs = require('fs');
const tsPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.ts';

if (fs.existsSync(tsPath)) {
  fs.unlinkSync(tsPath);
  console.log('Removed useAuth.ts');
}
