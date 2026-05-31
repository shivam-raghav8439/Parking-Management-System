import axios from 'axios';

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (mobile, otp) => {
  // Always print to console so offline sandbox mode testing is completely frictionless
  console.log(`\n======================================`);
  console.log(`[SMS OTP SIMULATOR]`);
  console.log(`Mobile: ${mobile}`);
  console.log(`OTP: ${otp}`);
  console.log(`======================================\n`);

  if (!process.env.FAST2SMS_KEY || process.env.FAST2SMS_KEY === 'your_fast2sms_api_key' || global.isMockDB) {
    console.log(`[SMS OTP] FAST2SMS_KEY is missing or in mock mode. SMS sending skipped, logged above.`);
    return { success: true, message: 'SMS simulated' };
  }

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'otp',
      variables_values: otp,
      numbers: mobile,
    }, {
      headers: { authorization: process.env.FAST2SMS_KEY }
    });
    return response.data;
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send SMS via Fast2SMS: ${error.message}`);
    // Do not throw in sandbox so testing is not blocked, but throw if in production mode
    if (!global.isMockDB) {
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  }
};
