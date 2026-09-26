const fs = require('fs');

// 1. Update whatsapp.provider.ts line 182
const providerFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/whatsapp.provider.ts';
let providerCode = fs.readFileSync(providerFile, 'utf8');

providerCode = providerCode.replace(
  "const tplRes = await this.sendWhatsAppTemplate(toPhone, 'carblink_notification', ['CarBlink Alert', message]);",
  "const tplRes = await this.sendWhatsAppTemplate(toPhone, 'carblink_verification_notice', ['Customer', message]);"
);

fs.writeFileSync(providerFile, providerCode);
console.log('Successfully updated whatsapp.provider.ts fallback to UTILITY template carblink_verification_notice');

// 2. Update notification.service.ts line 84
const notifFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/notification.service.ts';
let notifCode = fs.readFileSync(notifFile, 'utf8');

notifCode = notifCode.replace(
  "'carblink_notification',",
  "'carblink_verification_notice',"
);

fs.writeFileSync(notifFile, notifCode);
console.log('Successfully updated notification.service.ts to use UTILITY template carblink_verification_notice');
