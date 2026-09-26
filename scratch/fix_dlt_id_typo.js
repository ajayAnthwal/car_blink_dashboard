const fs = require('fs');
const targetFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/sms.provider.ts';

let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace("process.env.VISPL_REGISTER_DLT_ID || '1777178798813648790'", "process.env.VISPL_REGISTER_DLT_ID || '177717898813648790'");
fs.writeFileSync(targetFile, content, 'utf8');

console.log('Successfully fixed DLT Content ID typo in sms.provider.ts!');
