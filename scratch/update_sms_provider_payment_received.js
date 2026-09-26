const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/sms.provider.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        } else if (lowerMsg.includes('booking confirmed') || lowerMsg.includes('booking for') || lowerMsg.includes('booking id')) {
          // 5. Booking Confirmation Flow (SmartPing 1561218 | DLT 1777178939663828651)
          targetTemplateId = '1561218';
          targetDltContentId = process.env.VISPL_BOOKING_CONFIRM_DLT_ID || '1777178939663828651';
          textToSend = \`Carblink Services Private Limited: Your booking for Service Request has been confirmed. Booking ID: CB1042 Date & Time: Today. Thank you for choosing CarBlink.\`;
        } else {`;

const replacement = `        } else if (lowerMsg.includes('booking confirmed') || lowerMsg.includes('booking for')) {
          // 5. Booking Confirmation Flow (SmartPing 1561218 | DLT 1777178939663828651)
          targetTemplateId = '1561218';
          targetDltContentId = process.env.VISPL_BOOKING_CONFIRM_DLT_ID || '1777178939663828651';
          textToSend = \`Carblink Services Private Limited: Your booking for Service Request has been confirmed. Booking ID: CB1042 Date & Time: Today. Thank you for choosing CarBlink.\`;
        } else if (lowerMsg.includes('payment') || lowerMsg.includes('paid') || lowerMsg.includes('received')) {
          // 6. Payment Received Flow (SmartPing 1561219 | DLT 177717893973612595)
          targetTemplateId = '1561219';
          targetDltContentId = process.env.VISPL_PAYMENT_DLT_ID || '177717893973612595';
          const payMatch = message.match(/₹?\\s*(\\d+)/);
          const payAmount = payMatch ? payMatch[1] : '300';
          textToSend = \`Carblink Services Private Limited: We have received your payment of Rs.\${payAmount} towards your advance service booking. Booking ID: CB1042. For booking details, visit https://carblink.in/. Thank you for choosing CarBlink.\`;
        } else {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated sms.provider.ts to include Payment Received DLT template');
} else {
  console.log('Target already updated or not found');
}
