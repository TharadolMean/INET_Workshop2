const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const testUri = (() => {
  if (!process.env.MONGO_TEST_URI) return '';
  try {
    const uri = new URL(process.env.MONGO_TEST_URI);
    const databaseName = uri.pathname.replace(/^\//, '').split('/')[0];
    if (!/(?:^|[_-])test(?:[_-]|$)/i.test(databaseName)) return '';
    uri.pathname = `/${databaseName}_orders_test`;
    return uri.toString();
  } catch { return ''; }
})();
const canRunIntegration = Boolean(testUri);

test('transactional checkout, status transitions, and idempotent stock restoration', {
  skip: !canRunIntegration && 'Set MONGO_TEST_URI to a disposable MongoDB test database (database name must include test)',
}, async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });

  const app = require('../src/app');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Order = require('../src/models/Order');
  const InventoryMovement = require('../src/models/InventoryMovement');
  const ids = { users: [], products: [], orders: [] };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (ids.orders.length) {
      await InventoryMovement.deleteMany({ order: { $in: ids.orders } });
      await Order.deleteMany({ _id: { $in: ids.orders } });
    }
    if (ids.products.length) await Product.deleteMany({ _id: { $in: ids.products } });
    if (ids.users.length) await User.deleteMany({ _id: { $in: ids.users } });
    await mongoose.disconnect();
  });

  const createUser = async (role) => {
    const user = await User.create({
      name: `Phase 1 ${role}`,
      email: `phase1-${role}-${crypto.randomUUID()}@example.test`,
      password: 'integration-test-only-password',
      role,
      isApproved: true,
    });
    ids.users.push(user._id);
    return { user, token: jwt.sign({ id: user._id, role }, process.env.JWT_SECRET) };
  };
  const request = async (token, path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    return { status: response.status, body: await response.json() };
  };

  const customer = await createUser('user');
  const otherCustomer = await createUser('user');
  const admin = await createUser('admin');
  const product = await Product.create({ name: 'Phase 1 integration item', price: 25, stock: 8 });
  ids.products.push(product._id);

  const packingOrderResponse = await request(customer.token, '/orders', {
    method: 'POST',
    body: JSON.stringify({ items: [{ product: String(product._id), quantity: 2 }] }),
  });
  assert.equal(packingOrderResponse.status, 201);
  const packingOrder = packingOrderResponse.body.data;
  ids.orders.push(new mongoose.Types.ObjectId(packingOrder._id));
  assert.equal(packingOrder.status, 'pending');
  assert.equal(packingOrder.statusHistory[0].status, 'pending');

  const invalidJump = await request(admin.token, `/orders/${packingOrder._id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'shipped' }),
  });
  assert.equal(invalidJump.status, 409);

  for (const status of ['confirmed', 'packing']) {
    const updated = await request(admin.token, `/orders/${packingOrder._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.status, status);
  }

  const lateCustomerCancel = await request(customer.token, `/orders/${packingOrder._id}/cancel`, { method: 'POST' });
  assert.equal(lateCustomerCancel.status, 409);
  assert.equal((await Product.findById(product._id)).stock, 6);

  const adminCancelledResponse = await request(customer.token, '/orders', {
    method: 'POST',
    body: JSON.stringify({ items: [{ product: String(product._id), quantity: 1 }] }),
  });
  assert.equal(adminCancelledResponse.status, 201);
  const adminCancelledOrder = adminCancelledResponse.body.data;
  ids.orders.push(new mongoose.Types.ObjectId(adminCancelledOrder._id));
  const foreignCancel = await request(otherCustomer.token, `/orders/${adminCancelledOrder._id}/cancel`, { method: 'POST' });
  assert.equal(foreignCancel.status, 404);
  const adminCancel = await request(admin.token, `/orders/${adminCancelledOrder._id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled', note: 'Test admin cancellation' }),
  });
  assert.equal(adminCancel.status, 200);
  assert.equal(adminCancel.body.data.status, 'cancelled');
  assert.equal((await Product.findById(product._id)).stock, 6);

  const cancellableResponse = await request(customer.token, `/products/${product._id}/orders`, {
    method: 'POST',
    body: JSON.stringify({ quantity: 1 }),
  });
  assert.equal(cancellableResponse.status, 201);
  const cancellableOrder = cancellableResponse.body.data;
  ids.orders.push(new mongoose.Types.ObjectId(cancellableOrder._id));
  const confirmLegacyOrder = await request(admin.token, `/orders/${cancellableOrder._id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'confirmed' }),
  });
  assert.equal(confirmLegacyOrder.status, 200);
  assert.equal(confirmLegacyOrder.body.data.status, 'confirmed');

  const cancellations = await Promise.all([
    request(customer.token, `/orders/${cancellableOrder._id}/cancel`, { method: 'POST' }),
    request(customer.token, `/orders/${cancellableOrder._id}/cancel`, { method: 'POST' }),
  ]);
  assert.deepEqual(cancellations.map((result) => result.status), [200, 200]);
  assert.equal((await Product.findById(product._id)).stock, 6);
  assert.equal(await InventoryMovement.countDocuments({ order: cancellableOrder._id, type: 'order_cancelled' }), 1);

  const movements = await request(admin.token, `/inventory/movements?order=${cancellableOrder._id}`);
  assert.equal(movements.status, 200);
  assert.deepEqual(movements.body.data.map((movement) => movement.type).sort(), ['order_cancelled', 'order_placed']);

  const scarceProduct = await Product.create({ name: 'Phase 1 concurrency item', price: 10, stock: 1 });
  ids.products.push(scarceProduct._id);
  const concurrentCheckouts = await Promise.all([
    request(customer.token, '/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ product: String(scarceProduct._id), quantity: 1 }] }),
    }),
    request(customer.token, '/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ product: String(scarceProduct._id), quantity: 1 }] }),
    }),
  ]);
  const created = concurrentCheckouts.filter((result) => result.status === 201);
  assert.equal(created.length, 1);
  assert.equal(concurrentCheckouts.filter((result) => result.status === 409).length, 1);
  ids.orders.push(new mongoose.Types.ObjectId(created[0].body.data._id));
  assert.equal((await Product.findById(scarceProduct._id)).stock, 0);
});
