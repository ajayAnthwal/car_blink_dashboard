const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/sms.provider.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        } else if (lowerMsg.includes('comparison') || lowerMsg.includes('request received') || lowerMsg.includes('request submitted')) {
          // 7. CarBlink Request Received Flow (SmartPing 1561220 | DLT 1777178939780575133)
          targetTemplateId = '1561220';
          targetDltContentId = process.env.VISPL_REQUEST_RECEIVED_DLT_ID || '1777178939780575133';
          textToSend = 'Carblink Services Private Limited: Your car service comparison request has been successfully submitted on CarBlink. Our team will contact you shortly regarding your request and help you with available service options. Visit https://carblink.in/ for details. Thank you.';
        } else {`;

const replacement = `        } else if (lowerMsg.includes('comparison') || lowerMsg.includes('request received') || lowerMsg.includes('request submitted')) {
          // 7. CarBlink Request Received Flow (SmartPing 1561220 | DLT 1777178939780575133)
          targetTemplateId = '1561220';
          targetDltContentId = process.env.VISPL_REQUEST_RECEIVED_DLT_ID || '1777178939780575133';
          textToSend = 'Carblink Services Private Limited: Your car service comparison request has been successfully submitted on CarBlink. Our team will contact you shortly regarding your request and help you with available service options. Visit https://carblink.in/ for details. Thank you.';
        } else if (lowerMsg.includes('cancel') || lowerMsg.includes('cancelled')) {
          // 8. Booking Cancellation Flow (SmartPing 1561221 | DLT 177717893980841235)
          targetTemplateId = '1561221';
          targetDltContentId = process.env.VISPL_BOOKING_CANCEL_DLT_ID || '177717893980841235';
          textToSend = 'Carblink Services Private Limited: Your Car Periodic Inspection service booking with Booking ID CB1042 has been cancelled successfully. For booking details or assistance, visit https://carblink.in/. Thank you.';
        } else {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated sms.provider.ts to include Booking Cancellation DLT template');
} else {
  console.log('Target already updated or not found');
}
