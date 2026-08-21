const fs = require('fs');
const path = require('path');

const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');

function loadOrders() {
  const raw = fs.readFileSync(ORDERS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

function createOrder({ customerNumber, items, quantity, rawMessage }) {
  const orders = loadOrders();
  const order = {
    id: `ORD-${Date.now()}`,
    customerNumber,
    items,
    quantity: quantity || 1,
    status: 'pending_confirmation',
    rawMessage,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  saveOrders(orders);
  return order;
}

module.exports = { loadOrders, saveOrders, createOrder };
