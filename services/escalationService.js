const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./whatsappService');

const ESCALATIONS_PATH = path.join(__dirname, '..', 'data', 'escalations.json');

function loadEscalations() {
  const raw = fs.readFileSync(ESCALATIONS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveEscalations(list) {
  fs.writeFileSync(ESCALATIONS_PATH, JSON.stringify(list, null, 2));
}

// Logs the escalation AND pings the owner directly on WhatsApp with context,
// so a human sees only the messages that actually need attention.
async function escalate({ customerNumber, messageText, reason }) {
  const list = loadEscalations();
  const entry = {
    id: `ESC-${Date.now()}`,
    customerNumber,
    messageText,
    reason,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  saveEscalations(list);

  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  if (ownerNumber) {
    await sendMessage(
      ownerNumber,
      `⚠️ Needs your attention (${reason})\nFrom: ${customerNumber}\nMessage: "${messageText}"`
    );
  }

  return entry;
}

module.exports = { loadEscalations, saveEscalations, escalate };
