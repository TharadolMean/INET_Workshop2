const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const r = require('../utils/response');

// POST /api/v1/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return r.badRequest(res, 'name, email and password are required');
  }
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return r.badRequest(res, 'name and a valid email are required');
  }
  if (String(password).length < 6) {
    return r.badRequest(res, 'password must be at least 6 characters');
  }
  if (String(password).length > 72) return r.badRequest(res, 'password must be at most 72 characters');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return r.badRequest(res, 'email already registered');

  const hashed = await bcrypt.hash(String(password), 10);
  // สมัครใหม่เป็น user และยังไม่ Approve เสมอ (ต้องให้ admin approve)
  let user;
  try {
    user = await User.create({ name: name.trim(), email: email.trim(), password: hashed, role: 'user', isApproved: false });
  } catch (error) {
    if (error.code === 11000) return r.badRequest(res, 'email already registered');
    throw error;
  }

  return r.created(res, user, 'registered, waiting for admin approval');
};

// POST /api/v1/login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return r.badRequest(res, 'email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) return r.unauthorized(res, 'invalid email or password');

  const match = await bcrypt.compare(String(password), user.password);
  if (!match) return r.unauthorized(res, 'invalid email or password');

  // ยังไม่ชัดเจนว่า user ที่ยังไม่ Approve ควรได้ status อะไร (ตอนนี้ใช้ 401)
  if (!user.isApproved) return r.unauthorized(res, 'user is not approved');

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return r.ok(res, { token, user }, 'login success');
};
