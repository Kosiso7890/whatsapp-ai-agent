const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Classifies an incoming WhatsApp message and extracts useful entities.
 * Returns: { intent, confidence, item_mentions, quantity, reasoning }
 *
 * intent is one of: PRICE_QUERY, STOCK_QUERY, ORDER, HOURS_QUERY,
 * DELIVERY_QUERY, COMPLAINT, GREETING, OTHER
 */
async function classifyMessage(messageText, catalog) {
  const itemNames = catalog.items.map(i => i.name).join(', ');

  const systemPrompt = `You are a message classifier for a business WhatsApp line.
The business sells: ${itemNames}.

Classify the customer's message into exactly ONE of these intents:
- PRICE_QUERY: asking how much something costs
- STOCK_QUERY: asking if something is available/in stock
- ORDER: wants to buy/order something (may include quantity)
- HOURS_QUERY: asking about opening hours
- DELIVERY_QUERY: asking about delivery/shipping
- COMPLAINT: unhappy, reporting a problem, angry tone
- GREETING: just saying hello, no real question yet
- OTHER: anything that doesn't fit above, or is ambiguous

Also extract:
- item_mentions: array of item names/keywords the customer mentioned (empty array if none)
- quantity: number if a quantity was mentioned, otherwise null
- confidence: your confidence in this classification, "high", "medium", or "low"

Respond ONLY with valid JSON, no preamble, no markdown fences:
{"intent": "...", "item_mentions": [...], "quantity": null, "confidence": "..."}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageText }],
    });

    const raw = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim()
      .replace(/```json|```/g, '')
      .trim();

    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Classifier error:', err.message);
    // Fail safe: if classification breaks, escalate rather than guess
    return {
      intent: 'OTHER',
      item_mentions: [],
      quantity: null,
      confidence: 'low',
    };
  }
}

module.exports = { classifyMessage };
