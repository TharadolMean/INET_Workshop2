const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductReview = require('../models/ProductReview');
const { getOrderLines } = require('../utils/orderRules');
const r = require('../utils/response');

const canReviewProduct = async (userId, productId) => {
  const orders = await Order.find({
    user: userId,
    $and: [
      { $or: [{ product: productId }, { 'items.product': productId }] },
      { $or: [{ status: 'delivered' }, { status: { $exists: false } }] },
    ],
  }).select('product items quantity status');
  return orders.find((order) => getOrderLines(order).some((line) => String(line.productId) === String(productId))) || null;
};

const validateReview = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'review must be an object';
  if (!partial || body.rating !== undefined) {
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return 'rating must be an integer between 1 and 5';
  }
  if (body.comment !== undefined && (typeof body.comment !== 'string' || body.comment.length > 2000)) return 'comment must be a string up to 2000 characters';
  if (partial && body.rating === undefined && body.comment === undefined) return 'rating or comment is required';
  return null;
};

exports.listForProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid product id');
  const product = await Product.findOne({ _id: req.params.id, isArchived: { $ne: true } }).select('_id');
  if (!product) return r.notFound(res, 'product not found');
  const [items, stats] = await Promise.all([
    ProductReview.find({ product: product._id }).populate('user', 'name').sort({ createdAt: -1 }).limit(100),
    ProductReview.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);
  return r.ok(res, {
    items,
    summary: { averageRating: stats[0]?.averageRating || 0, count: stats[0]?.count || 0 },
  });
};

exports.createOrUpdate = async (req, res) => {
  if (req.user.role !== 'user') return r.forbidden(res, 'customer account required');
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid product id');
  const error = validateReview(req.body);
  if (error) return r.badRequest(res, error);
  const product = await Product.findOne({ _id: req.params.id, isArchived: { $ne: true } }).select('_id');
  if (!product) return r.notFound(res, 'product not found');
  const eligibleOrder = await canReviewProduct(req.user._id, product._id);
  if (!eligibleOrder) return r.forbidden(res, 'a delivered purchase is required before reviewing this product');
  const review = await ProductReview.findOneAndUpdate(
    { product: product._id, user: req.user._id },
    {
      $set: {
        order: eligibleOrder._id,
        rating: req.body.rating,
        comment: String(req.body.comment || '').trim(),
      },
    },
    { returnDocument: 'after', upsert: true, runValidators: true }
  ).populate('user', 'name');
  return r.ok(res, review, 'review saved');
};

exports.updateMine = async (req, res) => {
  if (req.user.role !== 'user') return r.forbidden(res, 'customer account required');
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid review id');
  const error = validateReview(req.body, { partial: true });
  if (error) return r.badRequest(res, error);
  const review = await ProductReview.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) return r.notFound(res, 'review not found');
  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment.trim();
  await review.save();
  await review.populate('user', 'name');
  return r.ok(res, review);
};

exports.deleteMine = async (req, res) => {
  if (req.user.role !== 'user') return r.forbidden(res, 'customer account required');
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid review id');
  const review = await ProductReview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!review) return r.notFound(res, 'review not found');
  return r.ok(res, null, 'review deleted');
};

exports.canReviewProduct = canReviewProduct;
exports.validateReview = validateReview;
