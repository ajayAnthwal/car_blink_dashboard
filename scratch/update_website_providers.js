const fs = require('fs');
const path = 'C:/Users/ajay anthwal/Desktop/car_blink/components/layout/providers.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('AuthProvider')) {
  content = `import { AuthProvider } from '@/features/auth/hooks/useAuth';\n` + content;
  content = content.replace('{children}', '<AuthProvider>{children}</AuthProvider>');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated providers.tsx');
} else {
  console.log('Already updated providers.tsx');
}
