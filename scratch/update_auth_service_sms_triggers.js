const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add welcome registration SMS trigger to registerUser
const targetRegister = `    return {
      user: userObj,
      tokens: { accessToken, refreshToken },
      message: 'Registration successful.',
    };`;

const replacementRegister = `    // Trigger Account Registration Welcome SMS
    if (cleanPhone) {
      smsProvider.sendSms(cleanPhone, \`Your Carblink account has been successfully registered with mobile number \${cleanPhone}. Welcome to Carblink.\`).catch(() => {});
    }

    return {
      user: userObj,
      tokens: { accessToken, refreshToken },
      message: 'Registration successful.',
    };`;

if (content.includes(targetRegister)) {
  content = content.replace(targetRegister, replacementRegister);
}

// 2. Add password reset confirmation SMS trigger to resetPassword
const targetReset = `    user.password = data.newPassword;
    await user.save();

    return { message: 'Password has been reset successfully' };`;

const replacementReset = `    user.password = data.newPassword;
    await user.save();

    if (user.phone) {
      smsProvider.sendSms(user.phone, 'Your Carblink account password has been successfully reset. If you did not initiate this request, please contact Carblink support.').catch(() => {});
    }

    return { message: 'Password has been reset successfully' };`;

if (content.includes(targetReset)) {
  content = content.replace(targetReset, replacementReset);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated auth.service.ts with SMS triggers for registration and password reset confirmation');
