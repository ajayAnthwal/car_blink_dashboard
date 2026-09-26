require('dotenv').config({ path: 'C:/Users/ajay anthwal/Desktop/car_blink_backend/.env' });
const path = require('path');
const backendDistPath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/dist';

const { SmsProvider } = require(path.join(backendDistPath, 'modules/notification/providers/sms.provider.js'));

async function sendRealLoginSmsTest() {
  console.log('Dispatching LIVE Login OTP SMS via SmartPing to +91 7078235326...');
  
  const provider = new SmsProvider();
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const loginMsg = `Your OTP for login to your Carblink account is ${testOtp}. This OTP is valid for 5 minutes. Please do not share this OTP with anyone.`;
  
  console.log('Sending message payload:', loginMsg);
  const result = await provider.sendSms('7078235326', loginMsg);
  
  console.log('\nLIVE SMARTPING RESPONSE:');
  console.log(JSON.stringify(result, null, 2));
}

sendRealLoginSmsTest();
