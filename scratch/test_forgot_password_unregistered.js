require('dotenv').config({ path: 'C:/Users/ajay anthwal/Desktop/car_blink_backend/.env' });
const path = require('path');
const backendDir = 'C:/Users/ajay anthwal/Desktop/car_blink_backend';
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));

const { AuthService } = require(path.join(backendDir, 'dist/modules/auth/auth.service.js'));

async function testUnregisteredForgotPassword() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  const fakePhone = '9888877777';
  console.log(`Testing Forgot Password with UNREGISTERED number: ${fakePhone}`);

  try {
    const res = await AuthService.forgotPassword(fakePhone);
    console.log('❌ FAIL: Forgot Password created user or returned success:', res);
  } catch (err) {
    console.log('✅ SUCCESS: Caught expected error!');
    console.log('   Status Code:', err.statusCode || err.status || 404);
    console.log('   Message:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testUnregisteredForgotPassword();
