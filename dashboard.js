const express = require('express');
const router = express.Router();

const { loadOrders } = require('../services/orderService');
const { loadEscalations } = require('../services/escalationService');

router.get('/api/summary', (req, res) => {
  const orders = loadOrders();
  const escalations = loadEscalations();

  const pendingOrders = orders.filter(o => o.status === 'pending_confirmation');
  const openEscalations = escalations.filter(e => e.status === 'open');

  res.json({
    pendingOrdersCount: pendingOrders.length,
    openEscalationsCount: openEscalations.length,
    pendingOrders,
    openEscalations,
  });
});

module.exports = router;
