const axios = require('axios');

async function testHelloWorld() {
  try {
    console.log('Testing Iconic Solution API with default Meta template "hello_world" for 7078235326...');
    const res = await axios.get('http://wa.iconicsolution.co.in/wapp/api/send/otptemplate', {
      params: {
        apikey: '981044b7c01545f280223743c3858590',
        templatename: 'hello_world',
        mobile: '7078235326',
        otp: '123456'
      },
      timeout: 10000
    });
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Test Error:', err.response?.data || err.message);
  }
}

testHelloWorld();
