require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', webhookRoutes);
app.use('/', dashboardRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp AI agent running on port ${PORT}`);
});
