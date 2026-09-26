const fs = require('fs');
const oldPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.ts';
const newPath = 'C:/Users/ajay anthwal/Desktop/car_blink/features/auth/hooks/useAuth.tsx';

if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('Renamed useAuth.ts to useAuth.tsx');
} else {
  console.log('useAuth.ts does not exist');
}
