const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

test('legacy product documents default to active without a migration', () => {
  const product = new Product({ name: 'Legacy item', price: 10, stock: 2 });
  assert.equal(product.isArchived, false);
  assert.equal(product.archivedAt, null);
});

test('order schema continues to accept legacy single-product records', async () => {
  const order = new Order({
    product: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    quantity: 2,
    unitPrice: 15,
    totalPrice: 30,
  });
  await assert.doesNotReject(order.validate());
  assert.equal(order.status, 'delivered');
  assert.deepEqual(order.statusHistory, []);
});

test('order schema accepts item snapshots for multi-item records', async () => {
  const order = new Order({
    user: new mongoose.Types.ObjectId(),
    items: [{ product: new mongoose.Types.ObjectId(), name: 'Snapshot', quantity: 1, unitPrice: 15, totalPrice: 15 }],
    totalPrice: 15,
  });
  await assert.doesNotReject(order.validate());
});
