const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const res_ = require('../utils/response');

// ตรวจ JWT + ตรวจว่า user ยังมีอยู่และได้รับ Approve แล้ว
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const parts = header.trim().split(/\s+/);
    const [scheme, token] = parts;
    if (scheme !== 'Bearer' || !token || parts.length !== 2) {
      return res_.unauthorized(res, 'missing or invalid authorization header');
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res_.unauthorized(res, 'invalid or expired token');
    }

    if (!mongoose.isValidObjectId(payload.id)) return res_.unauthorized(res, 'invalid token subject');

    const user = await User.findById(payload.id);
    if (!user) return res_.unauthorized(res, 'user not found');
    if (!user.isApproved) return res_.unauthorized(res, 'user is not approved');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res_.forbidden(res, 'admin only');
  next();
};

const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuthenticate, requireAdmin };
