const axios = require('axios');

async function testOtp() {
  try {
    console.log('Sending Signup OTP request to http://localhost:8000/api/auth/send-signup-otp for 7078235326...');
    const res = await axios.post('http://localhost:8000/api/auth/send-signup-otp', {
      phone: '7078235326'
    });
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Test OTP Error:', err.response?.data || err.message);
  }
}

testOtp();
