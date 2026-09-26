const fs = require('fs');
const envPath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/.env';
let envContent = fs.readFileSync(envPath, 'utf8');

if (!envContent.includes('ICONIC_WA_API_KEY')) {
  envContent += `\n# Iconic Solution WhatsApp API Credentials\nICONIC_WA_API_KEY=981044b7c01545f280223743c3858590\nICONIC_WA_BASE_URL=http://wa.iconicsolution.co.in/wapp/api/send\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Successfully added ICONIC_WA_API_KEY to .env');
} else {
  console.log('ICONIC_WA_API_KEY already present in .env');
}
