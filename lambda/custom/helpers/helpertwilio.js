// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
const accountSid = 'AC521f285e0ade8d1e796c4edcd7559902';
const authToken = '1dd7c45780fb4fec5949f496c18529ac';
const client = require('twilio')(accountSid, authToken);

var twilioHelper = function () { };

twilioHelper.prototype.sendOTPtoWhatsApp = (otp, mobile, name) => {
  client.messages
    .create({
      from: 'whatsapp:+14155238886',
      body: `Hi ${name}, Your OTP is ${otp}`,
      to: `whatsapp:${mobile}`
    })
    .then(message => console.log(message.sid));
}


module.exports = new twilioHelper();

