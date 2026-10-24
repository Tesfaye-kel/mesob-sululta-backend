async function sendOtp(phone, code) {
  const provider = process.env.SMS_PROVIDER;
  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !from) throw new Error('Twilio SMS credentials are incomplete.');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: `MESOB appointment verification code: ${code}` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`SMS provider rejected the OTP request (${response.status}).`);
    return;
  }
  if (provider === 'africastalking') {
    const apiKey = process.env.SMS_API_KEY;
    const username = process.env.SMS_USERNAME;
    if (!apiKey || !username) throw new Error('Africa’s Talking SMS credentials are incomplete.');
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, to: phone, message: `MESOB appointment verification code: ${code}` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`SMS provider rejected the OTP request (${response.status}).`);
    return;
  }
  if (process.env.NODE_ENV !== 'production' && process.env.FAN_IDENTITY_PROVIDER === 'mock' && process.env.DEV_OTP_LOG === 'true') {
    console.info(`[DEV OTP] ${code}`);
    return;
  }
  throw new Error('SMS delivery is not configured. OTP was not sent.');
}

module.exports = { sendOtp };
