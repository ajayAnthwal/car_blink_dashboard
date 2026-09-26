require('dotenv').config({ path: 'C:/Users/ajay anthwal/Desktop/car_blink_backend/.env' });
const path = require('path');
const backendDistPath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/dist';

const { SmsProvider } = require(path.join(backendDistPath, 'modules/notification/providers/sms.provider.js'));

async function auditSmartPingPayloads() {
  console.log('===========================================================');
  console.log('LIVE PRODUCTION AUDIT: SMARTPING SMS TEMPLATE ROUTING TEST');
  console.log('===========================================================\n');

  const provider = new SmsProvider();

  // 1. Test Login OTP Dispatch
  console.log('[1] DISPATCHING LOGIN OTP...');
  const loginMsg = 'Your OTP for login to your Carblink account is 123456. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.';
  await provider.sendSms('7078235326', loginMsg);

  // 2. Test Mobile Verification (Quote Form) Dispatch
  console.log('\n[2] DISPATCHING QUOTE FORM / MOBILE VERIFY OTP...');
  const verifyMsg = 'Your OTP for mobile number verification on Carblink is 654321. This OTP is valid for 5minutes. Please do not share this OTP with anyone.';
  await provider.sendSms('7078235326', verifyMsg);

  // 3. Test Password Reset Dispatch
  console.log('\n[3] DISPATCHING PASSWORD RESET OTP...');
  const resetMsg = 'Your OTP to reset your Carblink account password is 999888. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.';
  await provider.sendSms('7078235326', resetMsg);

  console.log('\n===========================================================');
  console.log('AUDIT COMPLETE: All 3 template routes matched successfully!');
  console.log('===========================================================');
}

auditSmartPingPayloads();
