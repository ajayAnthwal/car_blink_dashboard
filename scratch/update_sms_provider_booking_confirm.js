const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/sms.provider.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        } else if (lowerMsg.includes('login')) {
          // 4. Login OTP Flow (SmartPing 1557713 | DLT 1777178764480007649)
          targetTemplateId = '1557713';
          targetDltContentId = process.env.VISPL_LOGIN_DLT_ID || '1777178764480007649';
          textToSend = \`Your OTP for login to your Carblink account is \${otpCode}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;
        } else {`;

const replacement = `        } else if (lowerMsg.includes('login')) {
          // 4. Login OTP Flow (SmartPing 1557713 | DLT 1777178764480007649)
          targetTemplateId = '1557713';
          targetDltContentId = process.env.VISPL_LOGIN_DLT_ID || '1777178764480007649';
          textToSend = \`Your OTP for login to your Carblink account is \${otpCode}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;
        } else if (lowerMsg.includes('booking confirmed') || lowerMsg.includes('booking for') || lowerMsg.includes('booking id')) {
          // 5. Booking Confirmation Flow (SmartPing 1561218 | DLT 1777178939663828651)
          targetTemplateId = '1561218';
          targetDltContentId = process.env.VISPL_BOOKING_CONFIRM_DLT_ID || '1777178939663828651';
          textToSend = \`Carblink Services Private Limited: Your booking for Service Request has been confirmed. Booking ID: CB1042 Date & Time: Today. Thank you for choosing CarBlink.\`;
        } else {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated sms.provider.ts to include Booking Confirmation DLT template');
} else {
  console.log('Target already updated or not found');
}
