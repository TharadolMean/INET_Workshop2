const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDemoAccounts, seedDemoAccounts } = require('../src/utils/demoSeed');

const demoEnv = (overrides = {}) => ({
  NODE_ENV: 'development',
  DEMO_SEED_CONFIRM: 'local-demo-only',
  DEMO_ADMIN_EMAIL: 'admin@example.local',
  DEMO_ADMIN_PASSWORD: 'local-admin-secret-2026',
  DEMO_CUSTOMER_EMAIL: 'customer@example.local',
  DEMO_CUSTOMER_PASSWORD: 'local-customer-secret-2026',
  ...overrides,
});

test('development demo seed requires explicit opt-in and strong unique credentials', () => {
  assert.equal(buildDemoAccounts(demoEnv()).length, 2);
  assert.throws(() => buildDemoAccounts(demoEnv({ NODE_ENV: 'production' })), /disabled in production/);
  assert.throws(() => buildDemoAccounts(demoEnv({ DEMO_SEED_CONFIRM: '' })), /DEMO_SEED_CONFIRM/);
  assert.throws(() => buildDemoAccounts(demoEnv({ DEMO_CUSTOMER_PASSWORD: 'short' })), /DEMO_CUSTOMER_PASSWORD/);
});

test('demo seed is idempotent and refuses to change existing account roles', async () => {
  const stored = new Map();
  const fakeUsers = {
    async findOne({ email }) { return stored.get(email) || null; },
    async create(account) { stored.set(account.email, { role: account.role }); },
  };
  const created = await seedDemoAccounts(fakeUsers, demoEnv());
  assert.deepEqual(created.map(({ created: isCreated }) => isCreated), [true, true]);
  const kept = await seedDemoAccounts(fakeUsers, demoEnv());
  assert.deepEqual(kept.map(({ created: isCreated }) => isCreated), [false, false]);
  stored.set('customer@example.local', { role: 'admin' });
  await assert.rejects(seedDemoAccounts(fakeUsers, demoEnv()), /different role/);
});
