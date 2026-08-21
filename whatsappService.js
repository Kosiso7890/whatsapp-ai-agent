const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendMessage(toNumber, text) {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('WhatsApp send error:', err.response?.data || err.message);
  }
}

// Extracts the plain text + sender number from a Meta webhook payload.
// Returns null if the payload isn't a text message (e.g. status update, image, etc).
function parseIncomingMessage(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') return null;

    return {
      from: message.from,
      text: message.text.body,
      messageId: message.id,
      timestamp: message.timestamp,
    };
  } catch (err) {
    return null;
  }
}

module.exports = { sendMessage, parseIncomingMessage };
