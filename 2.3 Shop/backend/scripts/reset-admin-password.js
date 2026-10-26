require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const resetAdminPassword = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This development-only command cannot run in production');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  const email = String(process.env.RESET_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.RESET_ADMIN_PASSWORD || '');
  if (!email) throw new Error('Set RESET_ADMIN_EMAIL to the existing admin account email');
  if (password.length < 12 || password.length > 72 || password === 'admin1234') {
    throw new Error('RESET_ADMIN_PASSWORD must be 12–72 characters and cannot be the workshop default');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) throw new Error('No admin account matches RESET_ADMIN_EMAIL');

  admin.password = await bcrypt.hash(password, 10);
  await admin.save();
  console.log('Admin password updated. Remove RESET_ADMIN_PASSWORD from the environment.');
};

resetAdminPassword()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
