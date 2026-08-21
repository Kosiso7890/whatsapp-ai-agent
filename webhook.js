const express = require('express');
const router = express.Router();

const { parseIncomingMessage, sendMessage } = require('../services/whatsappService');
const { classifyMessage } = require('../services/classifier');
const { loadCatalog, findItems } = require('../services/catalogService');
const { createOrder } = require('../services/orderService');
const { escalate } = require('../services/escalationService');

// Meta requires this GET endpoint to verify your webhook URL when you set it up
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// This is where every incoming WhatsApp message actually lands
router.post('/webhook', async (req, res) => {
  // Always respond 200 fast so Meta doesn't retry/timeout; process after
  res.sendStatus(200);

  const incoming = parseIncomingMessage(req.body);
  if (!incoming) return; // not a text message (status update, image, etc) — ignore

  const { from, text } = incoming;
  const catalog = loadCatalog();

  const classification = await classifyMessage(text, catalog);
  const { intent, item_mentions, quantity, confidence } = classification;

  // Low confidence -> don't guess, hand to a human
  if (confidence === 'low') {
    await escalate({ customerNumber: from, messageText: text, reason: 'low confidence classification' });
    await sendMessage(from, `Thanks for reaching out! Let me get a team member to help with that shortly.`);
    return;
  }

  switch (intent) {
    case 'GREETING': {
      await sendMessage(from, `Hello! Welcome to ${catalog.business_name}. Ask me about prices, stock, or place an order anytime.`);
      break;
    }

    case 'HOURS_QUERY': {
      await sendMessage(from, `We're open: ${catalog.hours}`);
      break;
    }

    case 'DELIVERY_QUERY': {
      await sendMessage(from, catalog.delivery_info);
      break;
    }

    case 'PRICE_QUERY':
    case 'STOCK_QUERY': {
      const matched = findItems(catalog, item_mentions);
      if (matched.length === 0) {
        await escalate({ customerNumber: from, messageText: text, reason: 'item not found in catalog' });
        await sendMessage(from, `Let me check on that for you and get back to you shortly.`);
        break;
      }
      const lines = matched.map(item => {
        if (intent === 'PRICE_QUERY') {
          return `${item.name}: ₦${item.price.toLocaleString()}`;
        }
        return `${item.name}: ${item.stock > 0 ? `${item.stock} in stock` : 'currently out of stock'}`;
      });
      await sendMessage(from, lines.join('\n'));
      break;
    }

    case 'ORDER': {
      const matched = findItems(catalog, item_mentions);
      if (matched.length === 0) {
        await escalate({ customerNumber: from, messageText: text, reason: 'order item not found in catalog' });
        await sendMessage(from, `Got your order request — let me confirm item availability and get back to you shortly.`);
        break;
      }

      const outOfStock = matched.filter(i => i.stock === 0);
      if (outOfStock.length > 0) {
        await sendMessage(from, `Sorry, ${outOfStock.map(i => i.name).join(', ')} is currently out of stock. Anything else I can help with?`);
        break;
      }

      const order = createOrder({
        customerNumber: from,
        items: matched.map(i => ({ id: i.id, name: i.name, price: i.price })),
        quantity,
        rawMessage: text,
      });

      const total = matched.reduce((sum, i) => sum + i.price, 0) * (quantity || 1);
      await sendMessage(
        from,
        `Order received! ✅\n${matched.map(i => i.name).join(', ')} x${quantity || 1}\nEstimated total: ₦${total.toLocaleString()}\nWe'll confirm shortly. Order ref: ${order.id}`
      );

      // Also notify the owner a new order came in — but this is a low-noise
      // notification, not a raw message dump
      await escalate({ customerNumber: from, messageText: `New order: ${order.id}`, reason: 'new order — needs fulfillment' });
      break;
    }

    case 'COMPLAINT': {
      await escalate({ customerNumber: from, messageText: text, reason: 'complaint — needs human tone' });
      await sendMessage(from, `I'm sorry to hear that. A team member will reach out to you shortly to sort this out.`);
      break;
    }

    default: {
      await escalate({ customerNumber: from, messageText: text, reason: 'unclassified / other' });
      await sendMessage(from, `Thanks for your message! Let me get a team member to help with that shortly.`);
    }
  }
});

module.exports = router;
