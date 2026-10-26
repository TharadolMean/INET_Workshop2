require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { buildDemoAccounts, seedDemoAccounts } = require('../src/utils/demoSeed');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  buildDemoAccounts(process.env);
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const results = await seedDemoAccounts(User, process.env);
    for (const account of results) {
      console.log(`${account.created ? 'Created' : 'Kept existing'} development ${account.role}: ${account.email}`);
    }
    console.log('Demo account passwords are never changed by this command.');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('Demo seed failed:', error.message);
  process.exitCode = 1;
});
