const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/customer/sub-modules/booking/booking.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('let assignedPartner = booking.assignedPartnerId;', 'let assignedPartner = (booking as any).assignedPartnerId;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed TypeScript cast in booking.service.ts');
