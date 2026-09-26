const fs = require('fs');

// 1. Update otp.strategy.ts
const otpFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/strategies/otp.strategy.ts';
let otpCode = fs.readFileSync(otpFile, 'utf8');

const oldVerify = `  if (record.otp !== otp) {
    return false;
  }`;

const newVerify = `  const inputOtpStr = String(otp || '').trim();
  const storedOtpStr = String(record.otp || '').trim();

  if (storedOtpStr !== inputOtpStr) {
    return false;
  }`;

if (otpCode.includes(oldVerify)) {
  otpCode = otpCode.replace(oldVerify, newVerify);
  fs.writeFileSync(otpFile, otpCode);
  console.log('Successfully updated verifyStoredOtp string comparison in otp.strategy.ts');
} else {
  console.log('otp.strategy.ts string comparison already updated or pattern not found');
}

// 2. Update auth.service.ts registerUser OTP validation logic
const authServiceFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.service.ts';
let authCode = fs.readFileSync(authServiceFile, 'utf8');

const oldRegisterOtpCheck = `    // 1. Mandatory 6-digit OTP verification for account registration
    if (!data.otp) {
      throw new ApiError(400, 'OTP verification code is required to complete registration.');
    }
    const { verifyStoredOtp } = require('./strategies/otp.strategy');
    const isOtpValid = verifyStoredOtp(cleanPhone, data.otp) || verifyStoredOtp(data.phone, data.otp);
    if (!isOtpValid) {
      throw new ApiError(400, 'Incorrect or expired OTP code. Please check your SMS/WhatsApp and try again.');
    }`;

const newRegisterOtpCheck = `    // 1. Mandatory 6-digit OTP verification for account registration
    if (!data.otp) {
      throw new ApiError(400, 'OTP verification code is required to complete registration.');
    }
    const { verifyStoredOtp } = require('./strategies/otp.strategy');
    const inputOtp = String(data.otp).trim();

    // Check if user already exists and was already verified in step 1, or verify active stored OTP
    let isOtpValid = verifyStoredOtp(cleanPhone, inputOtp) || verifyStoredOtp(data.phone, inputOtp) || verifyStoredOtp(\`+91\${cleanPhone}\`, inputOtp) || verifyStoredOtp(\`91\${cleanPhone}\`, inputOtp);

    // Fallback: If OTP was verified & cleared in a preceding /verify-otp API call and existing user record is verified, allow registration
    if (!isOtpValid && existingUser && existingUser.isPhoneVerified) {
      isOtpValid = true;
    }

    if (!isOtpValid) {
      throw new ApiError(400, 'Incorrect or expired OTP code. Please check your SMS/WhatsApp and try again.');
    }`;

if (authCode.includes('const isOtpValid = verifyStoredOtp(cleanPhone, data.otp) || verifyStoredOtp(data.phone, data.otp);')) {
  authCode = authCode.replace(oldRegisterOtpCheck, newRegisterOtpCheck);
  fs.writeFileSync(authServiceFile, authCode);
  console.log('Successfully updated registerUser OTP check in auth.service.ts');
} else {
  console.log('auth.service.ts registerUser check already updated');
}
