const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const r = require('../utils/response');

// GET /api/v1/orders - Order ทุกรายการ
exports.listAll = async (_req, res) => {
  const orders = await Order.find()
    .populate('product', 'name price')
    .populate('items.product', 'name price')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  return r.ok(res, orders);
};

// GET /api/v1/products/:id/orders - Order ทั้งหมดของ Product
exports.listByProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return r.badRequest(res, 'product not found');

  const orders = await Order.find({
    $or: [{ product: product._id }, { 'items.product': product._id }],
  })
    .populate('items.product', 'name price')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  return r.ok(res, orders);
};

// POST /api/v1/orders - สร้าง Order เดียวจากสินค้าหลายรายการ
exports.createBatch = async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return r.badRequest(res, 'items must be a non-empty array');
  }

  const normalizedItems = [];
  const productIds = new Set();
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.product) ||
      !Number.isInteger(item.quantity) || item.quantity < 1) {
      return r.badRequest(res, 'each item requires a valid product and quantity >= 1');
    }
    const productId = String(item.product);
    if (productIds.has(productId)) return r.badRequest(res, 'duplicate product in order');
    productIds.add(productId);
    normalizedItems.push({ product: item.product, quantity: item.quantity });
  }

  const products = await Product.find({ _id: { $in: [...productIds] } })
    .select('name price stock')
    .lean();
  if (products.length !== productIds.size) {
    return r.badRequest(res, 'one or more products were not found');
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let totalPrice = 0;

      for (const requested of normalizedItems) {
        const product = await Product.findOneAndUpdate(
          { _id: requested.product, stock: { $gte: requested.quantity } },
          { $inc: { stock: -requested.quantity } },
          { new: true, session }
        );

        if (!product) {
          const original = productMap.get(String(requested.product));
          const stockError = new Error(
            `cannot create order: quantity exceeds stock for ${original?.name || requested.product}`
          );
          stockError.isBatchOrderValidation = true;
          throw stockError;
        }

        const lineTotal = product.price * requested.quantity;
        totalPrice += lineTotal;
        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: requested.quantity,
          unitPrice: product.price,
          totalPrice: lineTotal,
        });
      }

      const orders = await Order.create([{
        user: req.user._id,
        items: orderItems,
        totalPrice,
      }], { session });
      [createdOrder] = orders;
    });
  } catch (error) {
    if (error.isBatchOrderValidation) return r.badRequest(res, error.message);
    const transactionErrorMessage = [
      error.message,
      error.originalError?.message,
      error.errorResponse?.errmsg,
      error.errorResponse?.originalError?.message,
    ].filter(Boolean).join(' ');
    if (error.code === 20 || error.codeName === 'IllegalOperation' ||
      /transaction numbers are only allowed|replica set|mongos|does not support retryable writes/i
        .test(transactionErrorMessage)) {
      return res.status(503).json({
        status: 503,
        message: 'multi-item checkout requires MongoDB replica set',
        data: null,
      });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  await createdOrder.populate('items.product', 'name price');
  return r.created(res, createdOrder);
};

// POST /api/v1/products/:id/orders - เพิ่ม Order และหักออกจาก stock
exports.create = async (req, res) => {
  const { quantity } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 1) {
    return r.badRequest(res, 'quantity must be an integer >= 1');
  }

  // หัก stock แบบ atomic: จะสำเร็จเฉพาะตอน stock >= quantity
  // ป้องกัน race condition กรณีมีหลาย request สั่งพร้อมกัน
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );

  if (!product) {
    // แยกสาเหตุ: ไม่พบ product หรือ stock ไม่พอ
    const exists = await Product.exists({ _id: req.params.id });
    return r.badRequest(res, exists ? 'cannot create order: quantity exceeds stock' : 'product not found');
  }

  try {
    const order = await Order.create({
      product: product._id,
      user: req.user._id,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    });
    return r.created(res, order);
  } catch (err) {
    // บันทึก Order ไม่สำเร็จ -> คืน stock
    await Product.updateOne({ _id: product._id }, { $inc: { stock: quantity } });
    throw err;
  }
};
