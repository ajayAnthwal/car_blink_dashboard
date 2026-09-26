const axios = require('axios');

async function testBookingConfirm() {
  try {
    console.log('Testing Iconic Solution API with Approved Template "booking_confirm_" for 7078235326...');
    const res = await axios.get('http://wa.iconicsolution.co.in/wapp/api/send/otptemplate', {
      params: {
        apikey: '981044b7c01545f280223743c3858590',
        templatename: 'booking_confirm_',
        mobile: '7078235326',
        otp: 'carwash'
      },
      timeout: 10000
    });
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Test Error:', err.response?.data || err.message);
  }
}

testBookingConfirm();
