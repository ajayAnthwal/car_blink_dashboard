const fs = require('fs');

const file = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/whatsapp.provider.ts';
let code = fs.readFileSync(file, 'utf8');

const oldParse = `  private parsePhone(toPhone: string): string {
    let raw = toPhone.replace(/[^0-9]/g, '');
    if (raw.length === 10) {
      raw = '91' + raw;
    }
    return raw;
  }`;

const newParse = `  private parsePhone(toPhone: string): string {
    let digits = toPhone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits;
  }`;

if (code.includes(oldParse)) {
  code = code.replace(oldParse, newParse);
  fs.writeFileSync(file, code);
  console.log('Successfully updated parsePhone in whatsapp.provider.ts');
} else {
  console.log('parsePhone already updated or pattern not found');
}
