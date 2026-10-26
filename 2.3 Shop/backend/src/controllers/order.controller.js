const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryMovement = require('../models/InventoryMovement');
const r = require('../utils/response');
const {
  statuses,
  getOrderStatus,
  canTransition,
  canCustomerCancel,
  isStockRestoredForCancellation,
  getOrderLines,
  aggregateOrderQuantities,
} = require('../utils/orderRules');

const initialOrderStatus = (userId, at = new Date()) => ({
  status: 'pending',
  statusUpdatedAt: at,
  statusHistory: [{ status: 'pending', changedAt: at, changedBy: userId, note: 'Order placed' }],
  stockRestored: false,
});

const isTransactionUnavailable = (error) => {
  const message = [
    error.message,
    error.originalError?.message,
    error.errorResponse?.errmsg,
    error.errorResponse?.originalError?.message,
  ].filter(Boolean).join(' ');
  return error.code === 20 || error.codeName === 'IllegalOperation' ||
    /transaction numbers are only allowed|replica set|mongos|does not support retryable writes|transactions are not supported/i
      .test(message);
};

const transactionErrorResponse = (res) => r.serviceUnavailable(
  res,
  'order inventory workflows require MongoDB replica set or mongos'
);

const statusMatch = (orderId, currentStatus, extra = {}) => {
  const query = { _id: orderId, ...extra };
  if (currentStatus === 'pending') {
    query.$or = [{ status: 'pending' }, { status: { $exists: false } }];
  } else {
    query.status = currentStatus;
  }
  return query;
};

const populateOrder = async (order) => {
  await order.populate([
    { path: 'product', select: 'name price' },
    { path: 'items.product', select: 'name price' },
    { path: 'statusHistory.changedBy', select: 'name role' },
    { path: 'cancelledBy', select: 'name role' },
  ]);
  return order;
};

// GET /api/v1/orders - all orders (admin only)
exports.listAll = async (_req, res) => {
  const orders = await Order.find()
    .populate('product', 'name price')
    .populate('items.product', 'name price')
    .populate('user', 'name email')
    .populate('statusHistory.changedBy', 'name role')
    .populate('cancelledBy', 'name role')
    .sort({ createdAt: -1 });
  return r.ok(res, orders);
};

// GET /api/v1/orders/mine - only the authenticated customer's orders
exports.listMine = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('product', 'name price')
    .populate('items.product', 'name price')
    .populate('statusHistory.changedBy', 'name role')
    .populate('cancelledBy', 'name role')
    .sort({ createdAt: -1 });
  return r.ok(res, orders);
};

// GET /api/v1/products/:id/orders - admin order history for a product
exports.listByProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return r.notFound(res, 'product not found');

  const orders = await Order.find({
    $or: [{ product: product._id }, { 'items.product': product._id }],
  })
    .populate('items.product', 'name price')
    .populate('user', 'name email')
    .populate('statusHistory.changedBy', 'name role')
    .sort({ createdAt: -1 });
  return r.ok(res, orders);
};

// POST /api/v1/orders - atomic multi-item checkout
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

  const products = await Product.find({ _id: { $in: [...productIds] }, isArchived: { $ne: true } })
    .select('name price stock')
    .lean();
  if (products.length !== productIds.size) {
    return r.badRequest(res, 'one or more products were not found or are archived');
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      const movements = [];
      let totalPrice = 0;

      for (const requested of normalizedItems) {
        const product = await Product.findOneAndUpdate(
          { _id: requested.product, isArchived: { $ne: true }, stock: { $gte: requested.quantity } },
          { $inc: { stock: -requested.quantity } },
          { returnDocument: 'after', session }
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
        movements.push({
          product: product._id,
          type: 'order_placed',
          quantityDelta: -requested.quantity,
          stockBefore: product.stock + requested.quantity,
          stockAfter: product.stock,
        });
      }

      const now = new Date();
      const [order] = await Order.create([{
        user: req.user._id,
        items: orderItems,
        totalPrice,
        ...initialOrderStatus(req.user._id, now),
      }], { session });
      createdOrder = order;

      await InventoryMovement.insertMany(movements.map((movement) => ({
        ...movement,
        order: order._id,
        actor: req.user._id,
        reason: 'Stock reserved for order',
      })), { session });
    });
  } catch (error) {
    if (error.isBatchOrderValidation) return r.conflict(res, error.message);
    if (isTransactionUnavailable(error)) return transactionErrorResponse(res);
    throw error;
  } finally {
    await session.endSession();
  }

  await populateOrder(createdOrder);
  return r.created(res, createdOrder);
};

// POST /api/v1/products/:id/orders - legacy single-product checkout
exports.create = async (req, res) => {
  const { quantity } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 1) {
    return r.badRequest(res, 'quantity must be an integer >= 1');
  }

  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, isArchived: { $ne: true }, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { returnDocument: 'after', session }
      );
      if (!product) {
        const error = new Error('product not found, archived or stock is insufficient');
        error.httpStatus = 409;
        throw error;
      }

      const now = new Date();
      const [order] = await Order.create([{
        product: product._id,
        user: req.user._id,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        ...initialOrderStatus(req.user._id, now),
      }], { session });
      createdOrder = order;

      await InventoryMovement.create([{
        product: product._id,
        order: order._id,
        type: 'order_placed',
        quantityDelta: -quantity,
        stockBefore: product.stock + quantity,
        stockAfter: product.stock,
        actor: req.user._id,
        reason: 'Stock reserved for order',
      }], { session });
    });
  } catch (error) {
    if (isTransactionUnavailable(error)) return transactionErrorResponse(res);
    if (error.httpStatus) return r.conflict(res, error.message);
    throw error;
  } finally {
    await session.endSession();
  }

  await populateOrder(createdOrder);
  return r.created(res, createdOrder);
};

const cancelOrderWithStockRestore = async (req, orderId, { admin = false } = {}) => {
  const session = await mongoose.startSession();
  let resultOrder;
  let alreadyCancelled = false;

  try {
    await session.withTransaction(async () => {
      const ownership = admin ? {} : { user: req.user._id };
      const order = await Order.findOne({ _id: orderId, ...ownership }).session(session);
      if (!order) {
        const error = new Error('order not found');
        error.httpStatus = 404;
        throw error;
      }

      const currentStatus = getOrderStatus(order);
      if (isStockRestoredForCancellation(order)) {
        resultOrder = order;
        alreadyCancelled = true;
        return;
      }
      if (!canCustomerCancel(currentStatus)) {
        const error = new Error('order can only be cancelled before packing');
        error.httpStatus = 409;
        throw error;
      }

      const now = new Date();
      const actorId = req.user._id;
      const filter = statusMatch(order._id, currentStatus, {
        ...ownership,
        stockRestored: { $ne: true },
      });
      const cancelledOrder = await Order.findOneAndUpdate(filter, {
        $set: {
          status: 'cancelled',
          statusUpdatedAt: now,
          cancelledAt: now,
          cancelledBy: actorId,
          stockRestored: true,
        },
        $push: {
          statusHistory: {
            status: 'cancelled',
            changedAt: now,
            changedBy: actorId,
            note: String(req.body?.note || (admin ? 'Cancelled by admin' : 'Cancelled by customer')).trim().slice(0, 500),
          },
        },
      }, { returnDocument: 'after', session });

      if (!cancelledOrder) {
        const error = new Error('order status changed; reload and try again');
        error.httpStatus = 409;
        throw error;
      }

      const lines = getOrderLines(order);
      if (lines.length === 0) {
        const error = new Error('order has no recoverable product lines');
        error.httpStatus = 409;
        throw error;
      }

      const movements = [];
      for (const line of aggregateOrderQuantities(lines)) {
        const product = await Product.findOneAndUpdate(
          { _id: line.productId },
          { $inc: { stock: line.quantity } },
          { returnDocument: 'after', session }
        );
        if (!product) {
          const error = new Error('an order product is missing; stock restoration was rolled back');
          error.httpStatus = 409;
          throw error;
        }
        movements.push({
          product: product._id,
          order: order._id,
          type: 'order_cancelled',
          quantityDelta: line.quantity,
          stockBefore: product.stock - line.quantity,
          stockAfter: product.stock,
          actor: actorId,
          reason: 'Stock restored after order cancellation',
        });
      }

      await InventoryMovement.insertMany(movements, { session });
      resultOrder = cancelledOrder;
    });
  } catch (error) {
    if (isTransactionUnavailable(error)) return { error: { status: 503, message: 'order cancellation requires MongoDB replica set or mongos' } };
    if (error.httpStatus) return { error: { status: error.httpStatus, message: error.message } };
    throw error;
  } finally {
    await session.endSession();
  }

  await populateOrder(resultOrder);
  return { order: resultOrder, alreadyCancelled };
};

// POST /api/v1/orders/:id/cancel - customer cancels their own order before packing
exports.cancelMine = async (req, res) => {
  if (req.body?.note !== undefined && (typeof req.body.note !== 'string' || req.body.note.length > 500)) {
    return r.badRequest(res, 'note must be a string up to 500 characters');
  }
  const result = await cancelOrderWithStockRestore(req, req.params.id);
  if (result.error) {
    if (result.error.status === 404) return r.notFound(res, result.error.message);
    if (result.error.status === 503) return r.serviceUnavailable(res, result.error.message);
    return r.conflict(res, result.error.message);
  }
  return r.ok(res, result.order, result.alreadyCancelled ? 'order already cancelled' : 'order cancelled');
};

// PATCH /api/v1/orders/:id/status - admin-only state transition
exports.updateStatus = async (req, res) => {
  const { status, note } = req.body || {};
  if (!statuses.includes(status)) return r.badRequest(res, `status must be one of: ${statuses.join(', ')}`);
  if (note !== undefined && (typeof note !== 'string' || note.length > 500)) {
    return r.badRequest(res, 'note must be a string up to 500 characters');
  }

  if (status === 'cancelled') {
    const result = await cancelOrderWithStockRestore(req, req.params.id, { admin: true });
    if (result.error) {
      if (result.error.status === 404) return r.notFound(res, result.error.message);
      if (result.error.status === 503) return r.serviceUnavailable(res, result.error.message);
      return r.conflict(res, result.error.message);
    }
    return r.ok(res, result.order, result.alreadyCancelled ? 'order already cancelled' : 'order cancelled');
  }

  const order = await Order.findById(req.params.id);
  if (!order) return r.notFound(res, 'order not found');
  const currentStatus = getOrderStatus(order);
  if (status === currentStatus) return r.ok(res, await populateOrder(order), 'order status unchanged');
  if (!canTransition(currentStatus, status)) {
    return r.conflict(res, `invalid order status transition: ${currentStatus} -> ${status}`);
  }

  const now = new Date();
  const updatedOrder = await Order.findOneAndUpdate(
    statusMatch(order._id, currentStatus),
    {
      $set: { status, statusUpdatedAt: now },
      $push: {
        statusHistory: {
          status,
          changedAt: now,
          changedBy: req.user._id,
          note: String(note || '').trim(),
        },
      },
    },
    { returnDocument: 'after', runValidators: true }
  );
  if (!updatedOrder) return r.conflict(res, 'order status changed; reload and try again');
  await populateOrder(updatedOrder);
  return r.ok(res, updatedOrder, 'order status updated');
};

// GET /api/v1/inventory/movements - admin audit view
exports.listInventoryMovements = async (req, res) => {
  const filter = {};
  for (const key of ['product', 'order']) {
    if (req.query[key] !== undefined) {
      if (!mongoose.isValidObjectId(req.query[key])) return r.badRequest(res, `${key} must be a valid id`);
      filter[key] = req.query[key];
    }
  }
  const requestedLimit = Number(req.query.limit || 100);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 500) {
    return r.badRequest(res, 'limit must be an integer between 1 and 500');
  }
  const movements = await InventoryMovement.find(filter)
    .populate('product', 'name')
    .populate('order', 'status user createdAt')
    .populate('actor', 'name email role')
    .sort({ createdAt: -1 })
    .limit(requestedLimit);
  return r.ok(res, movements);
};
