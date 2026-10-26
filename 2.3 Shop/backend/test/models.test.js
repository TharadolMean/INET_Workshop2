const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const { validateProductBody } = require('../src/controllers/product.controller');

test('legacy product documents default to active without a migration', () => {
  const product = new Product({ name: 'Legacy item', price: 10, stock: 2 });
  assert.equal(product.isArchived, false);
  assert.equal(product.archivedAt, null);
  assert.deepEqual(product.specifications, []);
  assert.deepEqual(product.images, []);
});

test('product specifications accept structured display data without changing legacy fields', async () => {
  const product = new Product({
    name: 'Spec item',
    price: 10,
    stock: 2,
    specifications: [{ name: 'Processor', value: '8-core' }],
  });
  await assert.doesNotReject(product.validate());
  assert.deepEqual(product.specifications.map(({ name, value }) => ({ name, value })), [
    { name: 'Processor', value: '8-core' },
  ]);
});

test('product API specifications accept JSON and reject invalid or oversized entries', () => {
  assert.equal(validateProductBody({ specifications: '[{"name":"CPU","value":"8-core"}]' }, { partial: true }), null);
  assert.equal(validateProductBody({ specifications: '{broken' }, { partial: true }), 'specifications must be a JSON array');
  assert.equal(validateProductBody({ specifications: [{ name: 'CPU', value: '' }] }, { partial: true }), 'specifications must contain valid name and value entries');
  assert.equal(validateProductBody({ specifications: Array.from({ length: 31 }, (_, index) => ({ name: `Spec ${index}`, value: 'x' })) }, { partial: true }), 'specifications must contain valid name and value entries');
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
