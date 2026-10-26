const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const r = require('../utils/response');

const isTransactionUnavailable = (error) => error.code === 20 || error.codeName === 'IllegalOperation' ||
  /transaction numbers are only allowed|replica set|mongos|transactions are not supported/i.test(error.message || '');

exports.adjust = async (req, res) => {
  const { product, delta, reason } = req.body || {};
  if (!mongoose.isValidObjectId(product)) return r.badRequest(res, 'product must be a valid id');
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000000) {
    return r.badRequest(res, 'delta must be a non-zero integer between -1000000 and 1000000');
  }
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) {
    return r.badRequest(res, 'reason must contain 3 to 500 characters');
  }

  const session = await mongoose.startSession();
  let adjustment;
  try {
    await session.withTransaction(async () => {
      const stockCondition = delta < 0 ? { $gte: -delta } : { $gte: 0 };
      const updated = await Product.findOneAndUpdate(
        { _id: product, isArchived: { $ne: true }, stock: stockCondition },
        { $inc: { stock: delta } },
        { returnDocument: 'after', session, runValidators: true }
      );
      if (!updated) {
        const exists = await Product.exists({ _id: product, isArchived: { $ne: true } }).session(session);
        const error = new Error(exists ? 'adjustment would make stock negative' : 'active product not found');
        error.httpStatus = exists ? 409 : 404;
        throw error;
      }
      [adjustment] = await InventoryAdjustment.create([{
        product: updated._id,
        actor: req.user._id,
        quantityDelta: delta,
        stockBefore: updated.stock - delta,
        stockAfter: updated.stock,
        reason: reason.trim(),
      }], { session });
    });
  } catch (error) {
    if (isTransactionUnavailable(error)) return r.serviceUnavailable(res, 'inventory adjustments require MongoDB replica set or mongos');
    if (error.httpStatus === 404) return r.notFound(res, error.message);
    if (error.httpStatus === 409) return r.conflict(res, error.message);
    throw error;
  } finally {
    await session.endSession();
  }
  await adjustment.populate([{ path: 'product', select: 'name stock' }, { path: 'actor', select: 'name email role' }]);
  return r.created(res, adjustment, 'inventory adjusted');
};

exports.listAdjustments = async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 25 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1 || page > 100000) return r.badRequest(res, 'page must be a positive integer');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return r.badRequest(res, 'limit must be an integer between 1 and 100');
  const filter = {};
  if (req.query.product !== undefined) {
    if (!mongoose.isValidObjectId(req.query.product)) return r.badRequest(res, 'product must be a valid id');
    filter.product = req.query.product;
  }
  const [items, totalItems] = await Promise.all([
    InventoryAdjustment.find(filter)
      .populate('product', 'name')
      .populate('actor', 'name email role')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    InventoryAdjustment.countDocuments(filter),
  ]);
  return r.ok(res, { items, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
};
