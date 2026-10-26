const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const r = require('../utils/response');

const addressFields = ['label', 'recipient', 'phone', 'line1', 'line2', 'subdistrict', 'district', 'province', 'postalCode'];
const normalizeAddress = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'address must be an object' };
  const address = {};
  for (const key of addressFields) {
    const value = body[key] === undefined && key === 'line2' ? '' : body[key];
    if (typeof value !== 'string' || (key !== 'line2' && !value.trim())) return { error: `${key} is required` };
    const maxLength = { label: 60, recipient: 120, phone: 30, line1: 200, line2: 200, subdistrict: 100, district: 100, province: 100, postalCode: 12 }[key];
    if (value.length > maxLength) {
      return { error: `${key} is too long` };
    }
    address[key] = value.trim();
  }
  if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean') return { error: 'isDefault must be boolean' };
  address.isDefault = Boolean(body.isDefault);
  return { address };
};

exports.getProfile = async (req, res) => r.ok(res, {
  _id: req.user._id,
  name: req.user.name,
  email: req.user.email,
  role: req.user.role,
  isApproved: req.user.isApproved,
  phone: req.user.phone || '',
  createdAt: req.user.createdAt,
});

exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone'];
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).some((key) => !allowed.includes(key))) {
    return r.badRequest(res, 'only name and phone can be updated');
  }
  if (req.body.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.length > 120)) {
    return r.badRequest(res, 'name must be a non-empty string up to 120 characters');
  }
  if (req.body.phone !== undefined && (typeof req.body.phone !== 'string' || req.body.phone.length > 30)) {
    return r.badRequest(res, 'phone must be a string up to 30 characters');
  }
  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name.trim();
  if (req.body.phone !== undefined) update.phone = req.body.phone.trim();
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { returnDocument: 'after', runValidators: true });
  return r.ok(res, user);
};

exports.listAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  return r.ok(res, user.addresses);
};

exports.createAddress = async (req, res) => {
  const { address, error } = normalizeAddress(req.body);
  if (error) return r.badRequest(res, error);
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) return r.conflict(res, 'up to 10 saved addresses are allowed');
  if (address.isDefault || user.addresses.length === 0) user.addresses.forEach((entry) => { entry.isDefault = false; });
  address.isDefault = address.isDefault || user.addresses.length === 0;
  user.addresses.push(address);
  await user.save();
  return r.created(res, user.addresses[user.addresses.length - 1]);
};

exports.updateAddress = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.addressId)) return r.badRequest(res, 'invalid address id');
  const { address, error } = normalizeAddress(req.body);
  if (error) return r.badRequest(res, error);
  const user = await User.findById(req.user._id);
  const existing = user.addresses.id(req.params.addressId);
  if (!existing) return r.notFound(res, 'address not found');
  if (address.isDefault) user.addresses.forEach((entry) => { entry.isDefault = false; });
  Object.assign(existing, address);
  if (!user.addresses.some((entry) => entry.isDefault)) user.addresses[0].isDefault = true;
  await user.save();
  return r.ok(res, existing);
};

exports.deleteAddress = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.addressId)) return r.badRequest(res, 'invalid address id');
  const user = await User.findById(req.user._id);
  const existing = user.addresses.id(req.params.addressId);
  if (!existing) return r.notFound(res, 'address not found');
  const wasDefault = existing.isDefault;
  user.addresses.pull(req.params.addressId);
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  return r.ok(res, null, 'address deleted');
};

exports.getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    match: { isArchived: { $ne: true } },
    populate: { path: 'category', select: 'name slug' },
  });
  return r.ok(res, wishlist?.products || []);
};

exports.addWishlistItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) return r.badRequest(res, 'invalid product id');
  const product = await Product.findOne({ _id: req.params.productId, isArchived: { $ne: true } }).select('_id');
  if (!product) return r.notFound(res, 'product not found');
  let wishlist;
  try {
    wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id }, $setOnInsert: { user: req.user._id } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    ).populate({ path: 'products', select: 'name price stock image images category', populate: { path: 'category', select: 'name slug' } });
  } catch (error) {
    if (error.code !== 11000) throw error;
    wishlist = await Wishlist.findOneAndUpdate({ user: req.user._id }, { $addToSet: { products: product._id } }, { returnDocument: 'after' })
      .populate({ path: 'products', select: 'name price stock image images category', populate: { path: 'category', select: 'name slug' } });
  }
  return r.ok(res, wishlist.products, 'product added to wishlist');
};

exports.removeWishlistItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) return r.badRequest(res, 'invalid product id');
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { returnDocument: 'after' }
  ).populate('products', 'name price stock image images category');
  return r.ok(res, wishlist?.products || [], 'product removed from wishlist');
};

exports.normalizeAddress = normalizeAddress;
