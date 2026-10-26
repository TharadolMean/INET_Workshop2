const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');
const Product = require('../models/Product');
const { validateCoupon } = require('../utils/couponRules');
const r = require('../utils/response');

const normalizeCode = (value) => String(value || '').trim().toUpperCase();
const validateCouponBody = (body, { partial = false } = {}) => {
  const allowed = ['code', 'description', 'discountType', 'discountValue', 'minSubtotal', 'maxDiscount', 'startsAt', 'expiresAt', 'usageLimit', 'perUserLimit', 'isActive'];
  if (Object.keys(body).some((field) => !allowed.includes(field))) return 'coupon contains unsupported fields';
  const fields = ['code', 'discountType', 'discountValue'];
  if (!partial && fields.some((field) => body[field] === undefined)) return 'code, discountType and discountValue are required';
  if (body.code !== undefined && !/^[A-Z0-9_-]{3,40}$/i.test(String(body.code).trim())) return 'code must be 3-40 letters, digits, _ or -';
  if (body.discountType !== undefined && !['percent', 'fixed'].includes(body.discountType)) return 'discountType must be percent or fixed';
  if (body.discountValue !== undefined && (!Number.isFinite(Number(body.discountValue)) || Number(body.discountValue) <= 0 ||
    (body.discountType === 'percent' && Number(body.discountValue) > 100))) return 'discountValue is invalid';
  for (const field of ['minSubtotal', 'maxDiscount']) {
    if (body[field] !== undefined && body[field] !== null && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) {
      return `${field} must be a number >= 0`;
    }
  }
  for (const field of ['usageLimit', 'perUserLimit']) {
    if (field === 'perUserLimit' && body[field] === null) return 'perUserLimit must be an integer >= 1';
    if (body[field] !== undefined && body[field] !== null && (!Number.isInteger(Number(body[field])) || Number(body[field]) < 1)) {
      return `${field} must be an integer >= 1`;
    }
  }
  for (const field of ['startsAt', 'expiresAt']) {
    if (body[field] !== undefined && body[field] !== null && !Number.isFinite(new Date(body[field]).getTime())) return `${field} must be a valid date`;
  }
  const startsAt = body.startsAt === undefined ? null : body.startsAt && new Date(body.startsAt);
  const expiresAt = body.expiresAt === undefined ? null : body.expiresAt && new Date(body.expiresAt);
  if (startsAt && expiresAt && startsAt >= expiresAt) return 'expiresAt must be after startsAt';
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') return 'isActive must be boolean';
  return null;
};

const quoteCoupon = async ({ code, items, userId }) => {
  if (typeof code !== 'string' || !normalizeCode(code)) return { error: 'coupon code is required', status: 400 };
  if (!Array.isArray(items) || !items.length || items.length > 100) return { error: 'items must be a non-empty array', status: 400 };
  const quantities = new Map();
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.product) || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: 'each item requires a valid product and quantity >= 1', status: 400 };
    }
    const id = String(item.product);
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);
  }
  const products = await Product.find({ _id: { $in: [...quantities.keys()] }, isArchived: { $ne: true } }).select('price stock');
  if (products.length !== quantities.size) return { error: 'one or more products were not found or are archived', status: 400 };
  let subtotalCents = 0;
  for (const product of products) {
    const quantity = quantities.get(String(product._id));
    if (product.stock < quantity) return { error: 'one or more products do not have enough stock', status: 409 };
    subtotalCents += Math.round(product.price * quantity * 100);
  }
  const subtotalPrice = subtotalCents / 100;
  const coupon = await Coupon.findOne({ code: normalizeCode(code) });
  const userUseCount = coupon ? await CouponRedemption.countDocuments({ coupon: coupon._id, user: userId }) : 0;
  const result = validateCoupon(coupon, subtotalPrice, { userUseCount });
  if (result.error) return { error: result.error, status: 400 };
  return {
    coupon,
    subtotalPrice,
    discountAmount: result.discountAmount,
    totalPrice: result.totalPrice,
    couponCode: coupon.code,
  };
};

exports.validateForCustomer = async (req, res) => {
  const quote = await quoteCoupon({ ...req.body, userId: req.user._id });
  if (quote.error) return quote.status === 409 ? r.conflict(res, quote.error) : r.badRequest(res, quote.error);
  return r.ok(res, {
    couponCode: quote.couponCode,
    subtotalPrice: quote.subtotalPrice,
    discountAmount: quote.discountAmount,
    totalPrice: quote.totalPrice,
  });
};

exports.listAdmin = async (_req, res) => r.ok(res, await Coupon.find().sort({ createdAt: -1 }));

exports.create = async (req, res) => {
  const error = validateCouponBody(req.body || {});
  if (error) return r.badRequest(res, error);
  const payload = { ...req.body, code: normalizeCode(req.body.code) };
  try {
    return r.created(res, await Coupon.create(payload));
  } catch (createError) {
    if (createError.code === 11000) return r.conflict(res, 'coupon code already exists');
    throw createError;
  }
};

exports.update = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid coupon id');
  const error = validateCouponBody(req.body || {}, { partial: true });
  if (error) return r.badRequest(res, error);
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return r.notFound(res, 'coupon not found');
  if (coupon.usageCount > 0 && ['discountType', 'discountValue', 'code'].some((field) => req.body[field] !== undefined)) {
    return r.conflict(res, 'used coupons cannot change code or discount terms; deactivate it and create a new coupon');
  }
  const update = { ...req.body };
  if (update.code !== undefined) update.code = normalizeCode(update.code);
  Object.assign(coupon, update);
  try {
    await coupon.save();
    return r.ok(res, coupon);
  } catch (saveError) {
    if (saveError.code === 11000) return r.conflict(res, 'coupon code already exists');
    throw saveError;
  }
};

exports.remove = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid coupon id');
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return r.notFound(res, 'coupon not found');
  if (coupon.usageCount > 0 || await CouponRedemption.exists({ coupon: coupon._id })) {
    coupon.isActive = false;
    await coupon.save();
    return r.ok(res, coupon, 'coupon deactivated; historical orders are preserved');
  }
  await coupon.deleteOne();
  return r.ok(res, null, 'coupon deleted');
};

exports.quoteCoupon = quoteCoupon;
exports.validateCouponBody = validateCouponBody;
