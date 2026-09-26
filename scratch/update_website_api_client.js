const fs = require('fs');
const path = 'C:/Users/ajay anthwal/Desktop/car_blink/lib/apiClient.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (!response.ok) {`;
const replacement = `    if (response.status === 401 && typeof window !== 'undefined') {
      storage.clearToken();
      document.cookie = 'carblink_logged_out=1; path=/; max-age=10;';
    }

    if (!response.ok) {`;

if (!content.includes('response.status === 401')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated apiClient.ts');
} else {
  console.log('Already updated apiClient.ts');
}
