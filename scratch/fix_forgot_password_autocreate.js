const fs = require('fs');
const targetFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.service.ts';

let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `    if (!user) {
      const refCode = 'CB' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newUserData: any = {
        fullName: isEmail ? cleanIdentifier.split('@')[0] : \`Customer \${cleanIdentifier.slice(-4)}\`,
        password: 'CarBlink@123',
        role: ROLES.CUSTOMER,
        isPhoneVerified: false,
        isEmailVerified: false,
        referralCode: refCode
      };

      if (isEmail) {
        newUserData.email = cleanIdentifier;
      } else {
        newUserData.phone = cleanIdentifier;
      }

      try {
        user = await UserModel.create(newUserData);
      } catch (createErr) {
        user = await UserModel.findOne({
          $or: [
            { email: cleanIdentifier },
            { phone: cleanIdentifier }
          ]
        });
        if (!user) {
          throw new ApiError(400, 'Unable to send reset code. Please check your email/phone number and try again.');
        }
      }

      try {
        const { LeadModel } = require('../customer/sub-modules/lead/lead.model');
        await LeadModel.updateMany(
          { phone: cleanIdentifier, customerId: { $exists: false } },
          { customerId: user._id }
        );
      } catch (bindErr) {}
    }`;

const replacementBlock = `    if (!user) {
      throw new ApiError(404, 'No registered account found with this mobile number or email address. Please sign up first.');
    }`;

if (!content.includes("password: 'CarBlink@123'")) {
  console.log('Target block not found or already updated.');
} else {
  content = content.replace(targetBlock, replacementBlock);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully updated forgotPassword logic: auto-creation removed, throwing 404 ApiError when user does not exist!');
}
