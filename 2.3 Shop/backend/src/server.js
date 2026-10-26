require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('./app');
const User = require('./models/User');
const { validateRuntimeConfig } = require('./config');

const PORT = process.env.PORT || 3000;

// สร้าง admin เริ่มต้นถ้ายังไม่มี (admin ต้องมีก่อน เพราะเป็นคน approve user)
const seedAdmin = async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email || !process.env.ADMIN_PASSWORD) {
    if (await User.exists({ role: 'admin' })) return;
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin account');
  }
  const exists = await User.findOne({ email });
  if (exists?.role === 'admin') return;
  if (exists) throw new Error('ADMIN_EMAIL is already assigned to a non-admin account');
  if (process.env.ADMIN_PASSWORD.length < 12 || process.env.ADMIN_PASSWORD.length > 72 ||
    process.env.ADMIN_PASSWORD === 'admin1234' || /^(replace|change|example)[-_]/i.test(process.env.ADMIN_PASSWORD)) {
    throw new Error('ADMIN_PASSWORD must be a unique, non-placeholder password between 12 and 72 characters');
  }

  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    password,
    role: 'admin',
    isApproved: true,
  });
  console.log('Seeded initial admin account from environment configuration');
};

const start = async () => {
  validateRuntimeConfig();
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  await seedAdmin();
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api/v1`));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
