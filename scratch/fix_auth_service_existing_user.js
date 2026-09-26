const fs = require('fs');

const authServiceFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.service.ts';
let code = fs.readFileSync(authServiceFile, 'utf8');

const oldBlock = `    // 1. Mandatory 6-digit OTP verification for account registration
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
    }

    // Lock role registration to only CUSTOMER or PARTNER
    const requestedRole = data.role || ROLES.CUSTOMER;
    if (requestedRole !== ROLES.CUSTOMER && requestedRole !== ROLES.PARTNER) {
      throw new UnauthorizedError('Unauthorized role registration');
    }

    // 2. Check uniqueness of email/phone
    const queryConditions: any[] = [
      { phone: cleanPhone },
      { phone: \`+91\${cleanPhone}\`, },
      { phone: \`91\${cleanPhone}\` }
    ];
    if (cleanEmail) {
      queryConditions.push({ email: cleanEmail });
    }

    const existingUser = await UserModel.findOne({
      $or: queryConditions,
    });`;

const newBlock = `    // 2. Check existing user
    const queryConditions: any[] = [
      { phone: cleanPhone },
      { phone: \`+91\${cleanPhone}\` },
      { phone: \`91\${cleanPhone}\` }
    ];
    if (cleanEmail) {
      queryConditions.push({ email: cleanEmail });
    }

    const existingUser = await UserModel.findOne({
      $or: queryConditions,
    });

    // 1. Mandatory 6-digit OTP verification for account registration
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
    }

    // Lock role registration to only CUSTOMER or PARTNER
    const requestedRole = data.role || ROLES.CUSTOMER;
    if (requestedRole !== ROLES.CUSTOMER && requestedRole !== ROLES.PARTNER) {
      throw new UnauthorizedError('Unauthorized role registration');
    }`;

if (code.includes('if (!isOtpValid && existingUser && existingUser.isPhoneVerified)')) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync(authServiceFile, code);
  console.log('Successfully reordered existingUser query in auth.service.ts');
} else {
  console.log('auth.service.ts already updated or block not found');
}
