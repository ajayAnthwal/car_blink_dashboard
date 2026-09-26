const fs = require('fs');
const path = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/whatsapp.provider.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `const activeTemplate = templateName || 'carblink_verification_notice';`;
const replacement = `const activeTemplate = (templateName && templateName !== 'carblink_verification_notice') ? templateName : 'booking_confirm_';`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated activeTemplate in whatsapp.provider.ts to booking_confirm_');
} else {
  console.log('Target not found or already updated.');
}
