const test = require('node:test');
const assert = require('node:assert/strict');
const {
  statuses,
  getOrderStatus,
  canTransition,
  canCustomerCancel,
  isStockRestoredForCancellation,
  getOrderLines,
  aggregateOrderQuantities,
} = require('../src/utils/orderRules');

test('order states allow only the declared forward transitions', () => {
  assert.deepEqual(statuses, ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled']);
  assert.equal(canTransition('pending', 'confirmed'), true);
  assert.equal(canTransition('confirmed', 'packing'), true);
  assert.equal(canTransition('packing', 'pending'), false);
  assert.equal(canTransition('shipped', 'cancelled'), false);
  assert.equal(canTransition('delivered', 'cancelled'), false);
});

test('legacy orders without a status are treated as closed to prevent accidental stock restoration', () => {
  assert.equal(getOrderStatus({}), 'delivered');
  assert.equal(canCustomerCancel(getOrderStatus({})), false);
  assert.equal(canCustomerCancel('packing'), false);
});

test('stock restoration marker is complete only after cancellation', () => {
  assert.equal(isStockRestoredForCancellation({ status: 'cancelled', stockRestored: true }), true);
  assert.equal(isStockRestoredForCancellation({ status: 'cancelled', stockRestored: false }), false);
  assert.equal(isStockRestoredForCancellation({ status: 'pending', stockRestored: true }), false);
});

test('legacy single-item orders and multi-item orders produce stock lines', () => {
  assert.deepEqual(getOrderLines({ product: 'p1', quantity: 2, unitPrice: 10 }), [
    { productId: 'p1', name: '', quantity: 2, unitPrice: 10, totalPrice: 20 },
  ]);
  assert.deepEqual(aggregateOrderQuantities([
    { productId: 'p1', quantity: 2 },
    { productId: 'p1', quantity: 1 },
    { productId: 'p2', quantity: 4 },
  ]), [
    { productId: 'p1', quantity: 3 },
    { productId: 'p2', quantity: 4 },
  ]);
});
