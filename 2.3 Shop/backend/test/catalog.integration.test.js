const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const testUri = (() => {
  if (!process.env.MONGO_TEST_URI) return '';
  try {
    const uri = new URL(process.env.MONGO_TEST_URI);
    const databaseName = uri.pathname.replace(/^\//, '').split('/')[0];
    if (!/(?:^|[_-])test(?:[_-]|$)/i.test(databaseName)) return '';
    uri.pathname = `/${databaseName}_catalog_test`;
    return uri.toString();
  } catch { return ''; }
})();

test('public catalog reads preserve archived-product and protected-order rules', {
  skip: !testUri && 'Set MONGO_TEST_URI to a disposable MongoDB test database (database name must include test)',
}, async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });

  const app = require('../src/app');
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const Category = require('../src/models/Category');
  const ids = { users: [], products: [], categories: [] };
  const uploadedFiles = [];
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (ids.products.length) await Product.deleteMany({ _id: { $in: ids.products } });
    if (ids.categories.length) await Category.deleteMany({ _id: { $in: ids.categories } });
    if (ids.users.length) await User.deleteMany({ _id: { $in: ids.users } });
    await Promise.all(uploadedFiles.map((filename) =>
      fs.unlink(path.join(__dirname, '../uploads/products', filename)).catch(() => {})));
    await mongoose.disconnect();
  });

  const activeCategory = await Category.create({
    name: `Phase 3 active ${crypto.randomUUID()}`,
    slug: `phase3-active-${crypto.randomUUID()}`,
  });
  const inactiveCategory = await Category.create({
    name: `Phase 3 inactive ${crypto.randomUUID()}`,
    slug: `phase3-inactive-${crypto.randomUUID()}`,
    isActive: false,
  });
  ids.categories.push(activeCategory._id, inactiveCategory._id);
  const active = await Product.create({ name: 'Public catalog item', price: 50, stock: 3, category: activeCategory._id });
  const archived = await Product.create({ name: 'Archived catalog item', price: 99, stock: 2, isArchived: true });
  ids.products.push(active._id, archived._id);

  const guestProducts = await fetch(`${baseUrl}/products`).then((response) => response.json());
  assert.equal(guestProducts.status, 200);
  assert.deepEqual(guestProducts.data.map((item) => item.name), ['Public catalog item']);
  const guestProduct = await fetch(`${baseUrl}/products/${active._id}`).then((response) => response.json());
  assert.equal(guestProduct.data._id, String(active._id));
  const guestCategories = await fetch(`${baseUrl}/categories`).then((response) => response.json());
  assert.equal(guestCategories.data.some((category) => String(category._id) === String(inactiveCategory._id)), false);

  const admin = await User.create({
    name: 'Phase 3 admin',
    email: `phase3-${crypto.randomUUID()}@example.test`,
    password: 'integration-test-only-password',
    role: 'admin',
    isApproved: true,
  });
  ids.users.push(admin._id);
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
  const form = new FormData();
  form.set('name', 'Gallery upload item');
  form.set('price', '120');
  form.set('stock', '4');
  form.set('specifications', JSON.stringify([{ name: 'Processor', value: '8-core' }]));
  form.append('images', new Blob(['first image bytes'], { type: 'image/png' }), 'front.png');
  form.append('images', new Blob(['second image bytes'], { type: 'image/png' }), 'side.png');
  const created = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.data.images.length, 2);
  assert.equal(createdBody.data.image.path, createdBody.data.images[0].path);
  assert.deepEqual(createdBody.data.specifications.map(({ name, value }) => ({ name, value })), [
    { name: 'Processor', value: '8-core' },
  ]);
  ids.products.push(new mongoose.Types.ObjectId(createdBody.data._id));
  uploadedFiles.push(...createdBody.data.images.map((image) => image.filename));

  const adminProducts = await fetch(`${baseUrl}/products?includeArchived=true`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => response.json());
  assert.equal(adminProducts.data.some((item) => String(item._id) === String(archived._id)), true);
  const adminCategories = await fetch(`${baseUrl}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => response.json());
  assert.equal(adminCategories.data.some((category) => String(category._id) === String(inactiveCategory._id)), true);

  const protectedOrders = await fetch(`${baseUrl}/orders`);
  assert.equal(protectedOrders.status, 401);
});
