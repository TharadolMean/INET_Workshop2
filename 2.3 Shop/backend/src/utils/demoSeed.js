const DEMO_CONFIRMATION = 'local-demo-only';

const buildDemoAccounts = (env = process.env) => {
  if (String(env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('demo account seeding is disabled in production');
  }
  if (env.DEMO_SEED_CONFIRM !== DEMO_CONFIRMATION) {
    throw new Error(`set DEMO_SEED_CONFIRM=${DEMO_CONFIRMATION} to confirm local demo seeding`);
  }

  const accounts = [
    { key: 'ADMIN', role: 'admin', name: env.DEMO_ADMIN_NAME || 'ElectroHub Demo Admin' },
    { key: 'CUSTOMER', role: 'user', name: env.DEMO_CUSTOMER_NAME || 'ElectroHub Demo Customer' },
  ].map(({ key, role, name }) => {
    const email = String(env[`DEMO_${key}_EMAIL`] || '').trim().toLowerCase();
    const password = String(env[`DEMO_${key}_PASSWORD`] || '');
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`DEMO_${key}_EMAIL must be a valid email address`);
    }
    if (password.length < 12 || password.length > 72 || /^(replace|change|example|password)[-_]/i.test(password)) {
      throw new Error(`DEMO_${key}_PASSWORD must be a unique non-placeholder password between 12 and 72 characters`);
    }
    return { email, password, name, role, isApproved: true };
  });
  if (accounts[0].email === accounts[1].email) throw new Error('demo admin and customer emails must be different');
  return accounts;
};

const seedDemoAccounts = async (UserModel, env = process.env) => {
  const accounts = buildDemoAccounts(env);
  const results = [];
  const existingAccounts = await Promise.all(accounts.map((account) => UserModel.findOne({ email: account.email })));
  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    const existing = existingAccounts[index];
    if (existing) {
      if (existing.role !== account.role) throw new Error(`${account.email} already exists with a different role; no account was changed`);
    }
  }
  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    const existing = existingAccounts[index];
    if (!existing) await UserModel.create(account);
    results.push({ email: account.email, role: account.role, created: !existing });
  }
  return results;
};

module.exports = { DEMO_CONFIRMATION, buildDemoAccounts, seedDemoAccounts };
