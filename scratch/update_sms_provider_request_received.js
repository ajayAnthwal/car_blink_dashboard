const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/sms.provider.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        } else if (lowerMsg.includes('payment') || lowerMsg.includes('paid') || lowerMsg.includes('received')) {
          // 6. Payment Received Flow (SmartPing 1561219 | DLT 177717893973612595)
          targetTemplateId = '1561219';
          targetDltContentId = process.env.VISPL_PAYMENT_DLT_ID || '177717893973612595';
          const payMatch = message.match(/₹?\\s*(\\d+)/);
          const payAmount = payMatch ? payMatch[1] : '300';
          textToSend = \`Carblink Services Private Limited: We have received your payment of Rs.\${payAmount} towards your advance service booking. Booking ID: CB1042. For booking details, visit https://carblink.in/. Thank you for choosing CarBlink.\`;
        } else {`;

const replacement = `        } else if (lowerMsg.includes('payment') || lowerMsg.includes('paid') || lowerMsg.includes('received')) {
          // 6. Payment Received Flow (SmartPing 1561219 | DLT 177717893973612595)
          targetTemplateId = '1561219';
          targetDltContentId = process.env.VISPL_PAYMENT_DLT_ID || '177717893973612595';
          const payMatch = message.match(/₹?\\s*(\\d+)/);
          const payAmount = payMatch ? payMatch[1] : '300';
          textToSend = \`Carblink Services Private Limited: We have received your payment of Rs.\${payAmount} towards your advance service booking. Booking ID: CB1042. For booking details, visit https://carblink.in/. Thank you for choosing CarBlink.\`;
        } else if (lowerMsg.includes('comparison') || lowerMsg.includes('request received') || lowerMsg.includes('request submitted')) {
          // 7. CarBlink Request Received Flow (SmartPing 1561220 | DLT 1777178939780575133)
          targetTemplateId = '1561220';
          targetDltContentId = process.env.VISPL_REQUEST_RECEIVED_DLT_ID || '1777178939780575133';
          textToSend = 'Carblink Services Private Limited: Your car service comparison request has been successfully submitted on CarBlink. Our team will contact you shortly regarding your request and help you with available service options. Visit https://carblink.in/ for details. Thank you.';
        } else {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated sms.provider.ts to include CarBlink Request Received DLT template');
} else {
  console.log('Target already updated or not found');
}
