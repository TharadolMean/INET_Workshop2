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
    const name = uri.pathname.replace(/^\//, '').split('/')[0];
    if (!/(?:^|[_-])test(?:[_-]|$)/i.test(name)) return '';
    uri.pathname = '/' + name + '_customer_test';
    return uri.toString();
  } catch { return ''; }
})();

test('customer-owned data, coupon snapshots and verified-purchase reviews', {
  skip: !testUri && 'Set MONGO_TEST_URI to a disposable MongoDB test database (database name must include test)',
}, async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  const app = require('../src/app');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Order = require('../src/models/Order');
  const Coupon = require('../src/models/Coupon');
  const CouponRedemption = require('../src/models/CouponRedemption');
  const Wishlist = require('../src/models/Wishlist');
  const ProductReview = require('../src/models/ProductReview');
  const InventoryMovement = require('../src/models/InventoryMovement');
  const ids = { users: [], products: [], orders: [], coupons: [] };
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (ids.orders.length) {
      await InventoryMovement.deleteMany({ order: { $in: ids.orders } });
      await CouponRedemption.deleteMany({ order: { $in: ids.orders } });
      await ProductReview.deleteMany({ order: { $in: ids.orders } });
      await Order.deleteMany({ _id: { $in: ids.orders } });
    }
    if (ids.users.length) {
      await Wishlist.deleteMany({ user: { $in: ids.users } });
      await User.deleteMany({ _id: { $in: ids.users } });
    }
    if (ids.products.length) await Product.deleteMany({ _id: { $in: ids.products } });
    if (ids.coupons.length) await Coupon.deleteMany({ _id: { $in: ids.coupons } });
    await mongoose.disconnect();
  });

  const makeUser = async (role) => {
    const user = await User.create({ name: role, email: role + '-' + crypto.randomUUID() + '@example.test', password: 'integration-test-password', role, isApproved: true });
    ids.users.push(user._id);
    return { user, token: jwt.sign({ id: user._id, role }, process.env.JWT_SECRET) };
  };
  const call = async (token, path, options = {}) => {
    const response = await fetch(base + path, {
      ...options,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    return { status: response.status, body: await response.json() };
  };

  const customer = await makeUser('user');
  const other = await makeUser('user');
  const admin = await makeUser('admin');
  const product = await Product.create({ name: 'Phase 4 customer item', price: 100, stock: 10 });
  ids.products.push(product._id);

  assert.equal((await call(customer.token, '/customers/me')).body.data.password, undefined);
  assert.equal((await call(customer.token, '/customers/me', { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })).status, 400);
  const addressPayload = { label: 'Home', recipient: 'Buyer', phone: '0812345678', line1: '123 Main', line2: '', subdistrict: 'Central', district: 'Metro', province: 'Bangkok', postalCode: '10000', isDefault: true };
  const address = await call(customer.token, '/customers/me/addresses', { method: 'POST', body: JSON.stringify(addressPayload) });
  assert.equal(address.status, 201);
  assert.equal((await call(other.token, '/customers/me/addresses/' + address.body.data._id, { method: 'PUT', body: JSON.stringify(addressPayload) })).status, 404);

  assert.equal((await call(customer.token, '/wishlist/' + product._id, { method: 'POST' })).status, 200);
  assert.equal((await call(other.token, '/wishlist')).body.data.length, 0);
  const couponResult = await call(admin.token, '/admin/coupons', { method: 'POST', body: JSON.stringify({ code: 'PHASE4SAVE', discountType: 'percent', discountValue: 10, minSubtotal: 100, usageLimit: 3, perUserLimit: 1 }) });
  assert.equal(couponResult.status, 201);
  const couponId = couponResult.body.data._id;
  ids.coupons.push(new mongoose.Types.ObjectId(couponId));
  assert.equal((await call(customer.token, '/admin/coupons')).status, 403);

  const items = [{ product: String(product._id), quantity: 2 }];
  const quotePayload = JSON.stringify({ code: 'phase4save', items });
  const quote = await call(customer.token, '/coupons/validate', { method: 'POST', body: quotePayload });
  assert.deepEqual([quote.body.data.subtotalPrice, quote.body.data.discountAmount, quote.body.data.totalPrice], [200, 20, 180]);
  const checkout = () => call(customer.token, '/orders', { method: 'POST', body: JSON.stringify({ items, couponCode: 'PHASE4SAVE', addressId: address.body.data._id }) });
  const first = await checkout();
  assert.equal(first.status, 201);
  ids.orders.push(new mongoose.Types.ObjectId(first.body.data._id));
  assert.deepEqual([first.body.data.subtotalPrice, first.body.data.discountAmount, first.body.data.totalPrice], [200, 20, 180]);
  assert.equal(first.body.data.shippingAddress.recipient, 'Buyer');
  assert.equal((await call(customer.token, '/products/' + product._id + '/reviews', { method: 'POST', body: JSON.stringify({ rating: 5 }) })).status, 403);
  assert.equal((await call(customer.token, '/orders/' + first.body.data._id + '/cancel', { method: 'POST', body: '{}' })).status, 200);
  assert.equal((await Coupon.findById(couponId)).usageCount, 0);

  const second = await checkout();
  assert.equal(second.status, 201);
  ids.orders.push(new mongoose.Types.ObjectId(second.body.data._id));
  for (const status of ['confirmed', 'packing', 'shipped', 'delivered']) {
    assert.equal((await call(admin.token, '/orders/' + second.body.data._id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) })).status, 200);
  }
  const review = await call(customer.token, '/products/' + product._id + '/reviews', { method: 'POST', body: JSON.stringify({ rating: 5, comment: 'Verified purchase' }) });
  assert.equal(review.status, 200);
  assert.equal(String(review.body.data.order), second.body.data._id);
  assert.equal((await call(other.token, '/products/' + product._id + '/reviews', { method: 'POST', body: JSON.stringify({ rating: 4 }) })).status, 403);
  const publicReviews = await call(null, '/products/' + product._id + '/reviews');
  assert.deepEqual([publicReviews.body.data.summary.averageRating, publicReviews.body.data.summary.count], [5, 1]);
  assert.equal((await call(other.token, '/reviews/' + review.body.data._id, { method: 'DELETE' })).status, 404);

  const limitedCoupon = await call(admin.token, '/admin/coupons', { method: 'POST', body: JSON.stringify({ code: 'PHASE4ONCE', discountType: 'fixed', discountValue: 5, usageLimit: 1, perUserLimit: 1 }) });
  assert.equal(limitedCoupon.status, 201);
  ids.coupons.push(new mongoose.Types.ObjectId(limitedCoupon.body.data._id));
  const concurrentOrders = await Promise.all([customer, other].map((account) => call(account.token, '/orders', {
    method: 'POST',
    body: JSON.stringify({ items: [{ product: String(product._id), quantity: 1 }], couponCode: 'PHASE4ONCE' }),
  })));
  assert.deepEqual(concurrentOrders.map((result) => result.status).sort(), [201, 400]);
  const concurrentSuccess = concurrentOrders.find((result) => result.status === 201);
  ids.orders.push(new mongoose.Types.ObjectId(concurrentSuccess.body.data._id));
  assert.equal((await Coupon.findById(limitedCoupon.body.data._id)).usageCount, 1);
});
