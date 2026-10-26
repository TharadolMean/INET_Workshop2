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
    uri.pathname = `/${databaseName}_dashboard_test`;
    return uri.toString();
  } catch { return ''; }
})();
const safeTestDatabase = Boolean(testUri);

test('admin dashboard aggregates orders, value, statuses, products and date filters', {
  skip: !(testUri && safeTestDatabase) && 'Set MONGO_TEST_URI to a disposable MongoDB test database (database name must include test)',
}, async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  const app = require('../src/app');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Order = require('../src/models/Order');
  const ids = { users: [], products: [], orders: [] };
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (ids.orders.length) await Order.deleteMany({ _id: { $in: ids.orders } });
    if (ids.products.length) await Product.deleteMany({ _id: { $in: ids.products } });
    if (ids.users.length) await User.deleteMany({ _id: { $in: ids.users } });
    await mongoose.disconnect();
  });

  const customer = await User.create({
    name: 'Dashboard test customer',
    email: `dashboard-user-${crypto.randomUUID()}@example.test`,
    password: 'dashboard-integration-password',
    role: 'user',
    isApproved: true,
  });
  ids.users.push(customer._id);
  const admin = await User.create({
    name: 'Dashboard test admin',
    email: `dashboard-admin-${crypto.randomUUID()}@example.test`,
    password: 'dashboard-integration-password',
    role: 'admin',
    isApproved: true,
  });
  ids.users.push(admin._id);
  const userToken = jwt.sign({ id: customer._id, role: 'user' }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET);

  const product = await Product.create({ name: 'Dashboard integration product', price: 60, stock: 3 });
  const archivedProduct = await Product.create({ name: 'Archived dashboard product', price: 80, stock: 100, isArchived: true });
  ids.products.push(product._id, archivedProduct._id);
  const now = new Date();
  const activeOrder = await Order.create({
    user: customer._id,
    status: 'pending',
    totalPrice: 120,
    items: [{ product: product._id, name: product.name, quantity: 2, unitPrice: 60, totalPrice: 120 }],
  });
  const cancelledOrder = await Order.create({
    user: customer._id,
    status: 'cancelled',
    totalPrice: 990,
    items: [{ product: product._id, name: product.name, quantity: 99, unitPrice: 10, totalPrice: 990 }],
  });
  ids.orders.push(activeOrder._id, cancelledOrder._id);

  const legacyId = new mongoose.Types.ObjectId();
  ids.orders.push(legacyId);
  await Order.collection.insertOne({
    _id: legacyId,
    user: customer._id,
    product: product._id,
    quantity: 1,
    unitPrice: 20,
    totalPrice: 20,
    createdAt: now,
    updatedAt: now,
  });

  const request = async (token, query = '') => {
    const response = await fetch(`${baseUrl}/admin/dashboard${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { status: response.status, body: await response.json() };
  };
  const today = now.toISOString().slice(0, 10);
  const response = await request(adminToken, `?from=${today}&to=${today}&interval=day`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.metrics.orderCount, 3);
  assert.equal(response.body.data.metrics.activeOrderCount, 2);
  assert.equal(response.body.data.metrics.cancelledOrderCount, 1);
  assert.equal(response.body.data.metrics.simulatedOrderValue, 140);
  assert.equal(response.body.data.metrics.customerCount, 1);
  assert.equal(response.body.data.metrics.newCustomerCount, 1);
  assert.equal(response.body.data.metrics.activeProductCount, 1);
  assert.equal(response.body.data.metrics.archivedProductCount, 1);
  assert.equal(response.body.data.metrics.totalStockUnits, 3);
  assert.equal(response.body.data.bestSellingProducts[0].quantity, 3);
  assert.equal(response.body.data.bestSellingProducts[0].name, 'Dashboard integration product');
  assert.equal(response.body.data.statusDistribution.find((item) => item.status === 'delivered').count, 1);
  assert.equal(response.body.data.trends.length, 1);
  assert.equal(response.body.data.trends[0].simulatedOrderValue, 140);
  assert.equal(response.body.data.lowStockProducts.length, 1);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const threeMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0));
  const monthly = await request(adminToken, `?from=${monthStart.toISOString().slice(0, 10)}&to=${threeMonthEnd.toISOString().slice(0, 10)}&interval=month`);
  assert.equal(monthly.status, 200);
  assert.equal(monthly.body.data.trends.length, 3);
  assert.equal(monthly.body.data.trends.reduce((sum, item) => sum + item.activeOrderCount, 0), 2);
  assert.equal(monthly.body.data.trends[1].activeOrderCount, 0);
  assert.equal(monthly.body.data.trends[2].activeOrderCount, 0);

  const invalidDate = await request(adminToken, '?from=2026-02-30&to=2026-03-01');
  assert.equal(invalidDate.status, 400);
  const forbidden = await request(userToken, `?from=${today}&to=${today}`);
  assert.equal(forbidden.status, 403);
});
