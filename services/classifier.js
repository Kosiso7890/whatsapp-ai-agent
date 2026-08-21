// FREE keyword-based classifier — no paid AI API needed.
const INTENT_KEYWORDS = {
  GREETING: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how far'],
  HOURS_QUERY: ['hours', 'open', 'close', 'closing time', 'opening time', 'what time'],
  DELIVERY_QUERY: ['deliver', 'delivery', 'shipping', 'ship', 'how long', 'send it'],
  COMPLAINT: ['bad', 'complain', 'complaint', 'not working', 'broken', 'refund', 'disappointed', 'angry', 'wrong item', 'damaged', 'terrible', 'worst'],
  STOCK_QUERY: ['available', 'stock', 'do you have', 'in stock', 'still have'],
  PRICE_QUERY: ['price', 'how much', 'cost', 'pricing', 'worth'],
  ORDER: ['order', 'buy', 'want to purchase', 'i want', 'i need', 'send me', 'get me'],
};

const PRIORITY = ['COMPLAINT', 'ORDER', 'PRICE_QUERY', 'STOCK_QUERY', 'HOURS_QUERY', 'DELIVERY_QUERY', 'GREETING'];

function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of PRIORITY) {
    const keywords = INTENT_KEYWORDS[intent];
    if (keywords.some(kw => lower.includes(kw))) {
      return intent;
    }
  }
  return 'OTHER';
}

function detectQuantity(text, intent) {
  if (intent !== 'ORDER') return null;
  const matches = text.match(/\b(\d{1,2})\b/);
  return matches ? parseInt(matches[1], 10) : null;
}

function detectItemMentions(text) {
  const stripped = text
    .toLowerCase()
    .replace(/\b(hi|hello|hey|please|i want|i need|do you have|how much|is|the|a|an|to|order|buy|for)\b/g, '')
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped ? [stripped] : [];
}

async function classifyMessage(messageText, catalog) {
  const intent = detectIntent(messageText);
  const quantity = detectQuantity(messageText, intent);
  const item_mentions = detectItemMentions(messageText);
  const confidence = intent === 'OTHER' ? 'low' : 'medium';
  return { intent, item_mentions, quantity, confidence };
}

module.exports = { classifyMessage };
