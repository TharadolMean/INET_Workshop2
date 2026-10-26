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
    uri.pathname = `/${databaseName}_advanced_test`;
    return uri.toString();
  } catch { return ''; }
})();

test('server catalog pagination, audited inventory adjustments and CSV order export', {
  skip: !testUri && 'Set MONGO_TEST_URI to a disposable MongoDB test database (database name must include test)',
}, async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  const app = require('../src/app');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Order = require('../src/models/Order');
  const InventoryAdjustment = require('../src/models/InventoryAdjustment');
  const ids = { users: [], products: [], orders: [], adjustments: [] };
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (ids.adjustments.length) await InventoryAdjustment.deleteMany({ _id: { $in: ids.adjustments } });
    if (ids.orders.length) await Order.deleteMany({ _id: { $in: ids.orders } });
    if (ids.products.length) await Product.deleteMany({ _id: { $in: ids.products } });
    if (ids.users.length) await User.deleteMany({ _id: { $in: ids.users } });
    await mongoose.disconnect();
  });

  const admin = await User.create({ name: 'Advanced admin', email: `advanced-${crypto.randomUUID()}@example.test`, password: 'advanced-integration-password', role: 'admin', isApproved: true });
  const customer = await User.create({ name: 'Advanced customer', email: `advanced-user-${crypto.randomUUID()}@example.test`, password: 'advanced-integration-password', role: 'user', isApproved: true });
  ids.users.push(admin._id, customer._id);
  const adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET);
  const customerToken = jwt.sign({ id: customer._id, role: 'user' }, process.env.JWT_SECRET);
  const product = await Product.create({ name: 'Advanced catalog alpha', description: 'wireless keyboard', price: 120, stock: 5, specifications: [{ name: 'Switch', value: 'linear' }] });
  const second = await Product.create({ name: 'Advanced catalog beta', price: 80, stock: 2 });
  ids.products.push(product._id, second._id);
  const request = (path, token, options = {}) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  const paged = await request('/products?q=linear&paged=true&limit=1', null).then((response) => response.json());
  assert.equal(paged.data.items.length, 1);
  assert.equal(paged.data.pagination.totalItems, 1);
  const adminLowStock = await request('/products?includeArchived=true&paged=true&stockStatus=low', adminToken).then((response) => response.json());
  assert.equal(adminLowStock.data.summary.lowStockCount, 2);
  assert.equal(adminLowStock.data.items.length, 2);
  const invalidPage = await request('/products?limit=101', null).then((response) => response.json());
  assert.equal(invalidPage.status, 400);

  const adjustedResponse = await request('/inventory/adjustments', adminToken, {
    method: 'POST', body: JSON.stringify({ product: String(product._id), delta: 3, reason: 'received shipment' }),
  });
  assert.equal(adjustedResponse.status, 201);
  const adjustment = await adjustedResponse.json();
  ids.adjustments.push(new mongoose.Types.ObjectId(adjustment.data._id));
  assert.equal(adjustment.data.stockBefore, 5);
  assert.equal(adjustment.data.stockAfter, 8);
  const refreshedLowStock = await request('/products?includeArchived=true&paged=true&stockStatus=low', adminToken).then((response) => response.json());
  assert.equal(refreshedLowStock.data.summary.lowStockCount, 1);
  assert.equal(refreshedLowStock.data.items[0].name, 'Advanced catalog beta');
  const insufficient = await request('/inventory/adjustments', adminToken, {
    method: 'POST', body: JSON.stringify({ product: String(product._id), delta: -9, reason: 'invalid shrink' }),
  });
  assert.equal(insufficient.status, 409);
  const directStockEdit = await request(`/products/${product._id}`, adminToken, {
    method: 'PUT', body: JSON.stringify({ stock: 9 }),
  });
  assert.equal(directStockEdit.status, 200);
  assert.equal((await Product.findById(product._id)).stock, 9);
  const forbidden = await request('/inventory/adjustments', customerToken, {
    method: 'POST', body: JSON.stringify({ product: String(product._id), delta: 1, reason: 'must be denied' }),
  });
  assert.equal(forbidden.status, 403);
  const historyResponse = await request(`/inventory/adjustments?product=${product._id}`, adminToken);
  const history = await historyResponse.json();
  assert.equal(historyResponse.status, 200);
  assert.equal(history.data.items.length, 2);
  assert.deepEqual(history.data.items.map((item) => item.quantityDelta).sort(), [1, 3]);
  const legacyAdjustment = history.data.items.find((item) => item.reason === 'Stock updated through compatible product API');
  assert.ok(legacyAdjustment);
  ids.adjustments.push(new mongoose.Types.ObjectId(legacyAdjustment._id));
  const invalidHistory = await request('/inventory/adjustments?product=bad', adminToken).then((response) => response.json());
  assert.equal(invalidHistory.status, 400);

  const order = await Order.create({
    user: customer._id,
    items: [{ product: product._id, name: '=SUM(A1:A2)', quantity: 1, unitPrice: 120, totalPrice: 120 }],
    totalPrice: 120,
    status: 'pending',
  });
  ids.orders.push(order._id);
  const today = new Date().toISOString().slice(0, 10);
  const csvResponse = await request(`/admin/reports/orders.csv?from=${today}&to=${today}`, adminToken);
  assert.equal(csvResponse.status, 200);
  assert.match(csvResponse.headers.get('content-type'), /text\/csv/);
  const csv = await csvResponse.text();
  assert.match(csv, /order_id,|"order_id"/);
  assert.match(csv, /"'=SUM\(A1:A2\):1 x 120"/);
});
