if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

exports.sendSms = function sendSms(pubSubEvent, context, callback) {
  let messageProperties;
  try {
    messageProperties = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());
  } catch (err) {
    return callback(err, 'Failed to parse event data');
  }

  client.messages
    .create({
      ...messageProperties,
      from: twilioPhoneNumber
    })
    .then(message => callback(null, message))
    .catch(err => callback(err, 'Failed to send SMS'));
};
