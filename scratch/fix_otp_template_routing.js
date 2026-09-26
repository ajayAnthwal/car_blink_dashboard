const fs = require('fs');

// 1. Update otp.strategy.ts
const otpStrategyPath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/strategies/otp.strategy.ts';
let otpContent = fs.readFileSync(otpStrategyPath, 'utf8');

const targetOtp = `export const storeOtp = async (identifier: string, otp: string): Promise<void> => {`;
const replacementOtp = `export const storeOtp = async (identifier: string, otp: string, purpose: 'LOGIN' | 'RESET' | 'MOBILE_VERIFY' | 'REGISTER' = 'LOGIN'): Promise<void> => {`;

if (otpContent.includes(targetOtp)) {
  otpContent = otpContent.replace(targetOtp, replacementOtp);
}

const targetMsg = `    const otpMessage = \`Your OTP for mobile number verification on Carblink is \${otp}. This OTP is valid for 5minutes. Please do not share this OTP with anyone.\`;`;

const replacementMsg = `    let otpMessage = \`Your OTP for login to your Carblink account is \${otp}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;
    if (purpose === 'RESET') {
      otpMessage = \`Your OTP to reset your Carblink account password is \${otp}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;
    } else if (purpose === 'MOBILE_VERIFY') {
      otpMessage = \`Your OTP for mobile number verification on Carblink is \${otp}. This OTP is valid for 5minutes. Please do not share this OTP with anyone.\`;
    } else if (purpose === 'REGISTER') {
      otpMessage = \`Your Carblink account has been successfully registered with mobile number \${cleanPhone}. Welcome to Carblink.\`;
    } else {
      otpMessage = \`Your OTP for login to your Carblink account is \${otp}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;
    }`;

if (otpContent.includes(targetMsg)) {
  otpContent = otpContent.replace(targetMsg, replacementMsg);
}

fs.writeFileSync(otpStrategyPath, otpContent, 'utf8');
console.log('Successfully updated otp.strategy.ts for dynamic purpose-based OTP message generation');

// 2. Update auth.service.ts
const authServicePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.service.ts';
let authContent = fs.readFileSync(authServicePath, 'utf8');

const targetAuthMsg = `const message = \`Your password reset code for CarBlink is: \${otp}. Valid for 10 minutes.\`;`;
const replacementAuthMsg = `const message = \`Your OTP to reset your Carblink account password is \${otp}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.\`;`;

if (authContent.includes(targetAuthMsg)) {
  authContent = authContent.replace(targetAuthMsg, replacementAuthMsg);
  fs.writeFileSync(authServicePath, authContent, 'utf8');
  console.log('Successfully updated auth.service.ts forgotPassword message string to match reset DLT template');
}
