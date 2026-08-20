# WhatsApp AI Agent

Handles the WhatsApp "traffic jam" problem: classifies every incoming
message with AI, auto-answers price/stock/hours/delivery questions from
your catalog, captures orders, and only escalates to a human what
actually needs a human (complaints, uncertain messages, new orders to
fulfill).

## What it does

1. Customer messages your WhatsApp Business number
2. Message hits `/webhook`, gets classified (PRICE_QUERY, STOCK_QUERY,
   ORDER, HOURS_QUERY, DELIVERY_QUERY, COMPLAINT, GREETING, OTHER)
3. Repetitive questions get answered instantly from `data/catalog.json`
4. Orders get logged and the customer gets an instant confirmation
5. Anything low-confidence or a complaint gets flagged to the owner's
   WhatsApp directly + logged in the dashboard
6. Dashboard at `/` shows a digest instead of a raw message pile

## Setup (Replit)

1. **Upload this whole folder to a new Replit Node.js project**
   (or `git init` it and import to Replit)

2. **Get WhatsApp Cloud API credentials**
   - Go to developers.facebook.com → create an app → add "WhatsApp" product
   - Under WhatsApp > API Setup, grab: temporary access token (or generate
     a permanent one under System Users), and the Phone Number ID
   - Use the free test number to start — no business verification needed
     for testing with up to 5 recipient numbers

3. **Get a Claude API key**
   - console.anthropic.com → API Keys → create one

4. **Set environment variables** in Replit's Secrets tab (copy from `.env.example`):
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN` — make up any random string, you'll reuse it in step 6
   - `ANTHROPIC_API_KEY`
   - `OWNER_WHATSAPP_NUMBER` — your number, country code no `+` (e.g. `2348012345678`)

5. **Run it** — Replit will `npm install` automatically, then `npm start`.
   Copy the live URL Replit gives you (e.g. `https://yourapp.username.repl.co`)

6. **Connect the webhook in Meta**
   - In your Meta app, WhatsApp > Configuration
   - Callback URL: `https://yourapp.username.repl.co/webhook`
   - Verify Token: same string you set as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the `messages` webhook field

7. **Test it** — message your WhatsApp test number from your phone. Try:
   - "how much is the bearing 6205" → instant price reply
   - "do you have spark plugs" → instant stock reply (out of stock)
   - "I want to order 2 bearing 6205" → order captured + confirmation
   - "this thing you sold me is bad" → escalates to you as a complaint

8. **Check the dashboard** — visit your Replit URL's root (`/`) to see
   pending orders and open escalations instead of scrolling raw chats

## Customizing for a real client

- Edit `data/catalog.json`: swap in their real items, prices, stock,
  hours, delivery terms
- Each `item.keywords` array should include how customers actually type
  it (typos, short forms, Pidgin) — this feeds the fuzzy matcher
- For multi-tenant (multiple client businesses on one deployment), give
  each business its own catalog file and route messages by which
  WhatsApp number received them — ask me for this next if you want it

## Files

```
server.js                 → entry point
routes/webhook.js         → receives + responds to WhatsApp messages (the agent logic)
routes/dashboard.js       → API for the dashboard
services/classifier.js    → Claude-powered message classification
services/catalogService.js→ fuzzy match customer text to catalog items
services/orderService.js  → order storage
services/escalationService.js → flags + notifies owner of what needs a human
services/whatsappService.js   → send/receive via Meta Cloud API
data/catalog.json         → business's products, prices, stock (edit this per client)
data/orders.json          → order log (auto-created)
data/escalations.json     → escalation log (auto-created)
public/index.html         → dashboard UI
```
