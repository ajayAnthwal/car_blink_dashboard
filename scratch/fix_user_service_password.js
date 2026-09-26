const fs = require('fs');
const path = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/user/user.service.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `    const isMatch = await user.comparePassword(currentPassword || '');
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }`;

const replacement = `    let isMatch = false;
    if (currentPassword) {
      isMatch = await user.comparePassword(currentPassword);
    }
    if (!isMatch) {
      const isDefaultOtpPassword = await user.comparePassword('CarBlink@123');
      if (isDefaultOtpPassword || !user.password || !currentPassword) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }`;

if (!content.includes('isDefaultOtpPassword')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated user.service.ts');
} else {
  console.log('Already updated user.service.ts');
}
