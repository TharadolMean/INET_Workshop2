const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const r = require('../utils/response');
const { parseProductQuery } = require('../utils/productQuery');

const isTransactionUnavailable = (error) => error.code === 20 || error.codeName === 'IllegalOperation' ||
  /transaction numbers are only allowed|replica set|mongos|transactions are not supported/i.test(error.message || '');

const validateProductBody = (body, { partial = false } = {}) => {
  const { name, price, stock } = body || {};
  if (!partial) {
    if (!name) return 'name is required';
    if (price === undefined) return 'price is required';
  }
  if (name !== undefined && !String(name).trim()) return 'name must not be empty';
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
    return 'price must be a number >= 0';
  }
  if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
    return 'stock must be an integer >= 0';
  }
  if (body.specifications !== undefined) {
    let specifications = body.specifications;
    if (typeof specifications === 'string') {
      try { specifications = JSON.parse(specifications); } catch { return 'specifications must be a JSON array'; }
    }
    if (!Array.isArray(specifications) || specifications.length > 30 || specifications.some((entry) =>
      !entry || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 80 ||
      typeof entry.value !== 'string' || !entry.value.trim() || entry.value.length > 300
    )) return 'specifications must contain valid name and value entries';
  }
  return null;
};

const getCategory = async (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (!mongoose.isValidObjectId(value)) return undefined;
  return Category.findOne({ _id: value, isActive: true });
};

const imageFromFile = (file) => (file ? {
  filename: file.filename,
  originalName: file.originalname,
  path: `/uploads/products/${file.filename}`,
  mimeType: file.mimetype,
  size: file.size,
} : null);

const filesFromRequest = (req) => [
  ...(req.files?.images || []),
  ...(req.files?.image || []),
].map(imageFromFile).filter(Boolean);

const existingImages = (product) => [
  ...(product.images || []),
  ...(product.image?.filename ? [product.image] : []),
].filter((image, index, images) => image.filename && images.findIndex((entry) => entry.filename === image.filename) === index);

const removeImageFile = async (image) => {
  if (!image?.filename) return;
  try {
    await fs.unlink(path.join(__dirname, '../../uploads/products', image.filename));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error);
  }
};

// GET /api/v1/products
exports.list = async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const parsed = parseProductQuery(req.query, isAdmin);
  if (parsed.error) return r.badRequest(res, parsed.error);
  const find = Product.find(parsed.filter)
    .populate('category', 'name slug isActive')
    .sort(parsed.sort);
  if (!parsed.paged) return r.ok(res, await find);
  const totalItems = await Product.countDocuments(parsed.filter);
  const totalPages = Math.ceil(totalItems / parsed.pagination.limit);
  const page = Math.min(parsed.pagination.page, totalPages || 1);
  const products = await find.skip((page - 1) * parsed.pagination.limit).limit(parsed.pagination.limit);
  const pagination = {
    page,
    limit: parsed.pagination.limit,
    totalItems,
    totalPages,
  };
  if (!isAdmin) return r.ok(res, { items: products, pagination });
  const [activeProductCount, archivedProductCount, lowStockCount, outOfStockCount] = await Promise.all([
    Product.countDocuments({ isArchived: { $ne: true } }),
    Product.countDocuments({ isArchived: true }),
    Product.countDocuments({ isArchived: { $ne: true }, stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ isArchived: { $ne: true }, stock: { $lte: 0 } }),
  ]);
  return r.ok(res, {
    items: products,
    pagination,
    summary: { activeProductCount, archivedProductCount, lowStockCount, outOfStockCount },
  });
};

// GET /api/v1/products/:id
exports.getOne = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isArchived: { $ne: true } })
    .populate('category', 'name slug isActive');
  if (!product) return r.badRequest(res, 'product not found');
  return r.ok(res, product);
};

// POST /api/v1/products
exports.create = async (req, res) => {
  const images = filesFromRequest(req);
  const error = validateProductBody(req.body);
  if (error) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, error);
  }
  const category = await getCategory(req.body.category);
  if (req.body.category && !category) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'category not found or inactive');
  }

  if (images.length > 8) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'up to 8 product images are allowed');
  }
  const image = images[0] || null;
  let specifications = req.body.specifications;
  if (typeof specifications === 'string') specifications = JSON.parse(specifications);
  try {
    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      specifications,
      price: Number(req.body.price),
      stock: Number(req.body.stock || 0),
      category: category?._id || null,
      image: image || undefined,
      images,
    });
    await product.populate('category', 'name slug isActive');
    return r.created(res, product);
  } catch (createError) {
    await Promise.all(images.map(removeImageFile));
    throw createError;
  }
};

// PUT /api/v1/products/:id
exports.update = async (req, res) => {
  const images = filesFromRequest(req);
  const error = validateProductBody(req.body, { partial: true });
  if (error) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, error);
  }
  if (req.body.stockAdjustmentReason !== undefined &&
    (typeof req.body.stockAdjustmentReason !== 'string' || req.body.stockAdjustmentReason.trim().length < 3 || req.body.stockAdjustmentReason.trim().length > 500)) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'stockAdjustmentReason must contain 3 to 500 characters');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'product not found');
  }
  const stockBefore = product.stock;
  const oldImages = existingImages(product);
  const category = await getCategory(req.body.category);
  if (req.body.category !== undefined && req.body.category !== '' && !category) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'category not found or inactive');
  }

  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.description !== undefined) update.description = req.body.description;
  if (req.body.specifications !== undefined) {
    update.specifications = typeof req.body.specifications === 'string'
      ? JSON.parse(req.body.specifications)
      : req.body.specifications;
  }
  if (req.body.price !== undefined) update.price = Number(req.body.price);
  if (req.body.stock !== undefined) update.stock = Number(req.body.stock);
  if (req.body.category !== undefined) update.category = category?._id || null;

  Object.assign(product, update);
  if (images.length > 8) {
    await Promise.all(images.map(removeImageFile));
    return r.badRequest(res, 'up to 8 product images are allowed');
  }
  if (images.length) {
    product.images = images;
    product.image = images[0];
  }
  if (req.body.removeImage === 'true' && !images.length) {
    product.images = [];
    product.image = {};
  }

  const stockChanged = req.body.stock !== undefined && Number(req.body.stock) !== stockBefore;
  try {
    if (stockChanged) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await product.save({ session });
          await InventoryAdjustment.create([{
            product: product._id,
            actor: req.user._id,
            quantityDelta: product.stock - stockBefore,
            stockBefore,
            stockAfter: product.stock,
            reason: req.body.stockAdjustmentReason?.trim() || 'Stock updated through compatible product API',
          }], { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      await product.save();
    }
  } catch (updateError) {
    await Promise.all(images.map(removeImageFile));
    if (isTransactionUnavailable(updateError)) return r.serviceUnavailable(res, 'stock updates require MongoDB replica set or mongos to record inventory history');
    throw updateError;
  }

  if (images.length || req.body.removeImage === 'true') await Promise.all(oldImages.map(removeImageFile));
  await product.populate('category', 'name slug isActive');
  return r.ok(res, product);
};

// DELETE /api/v1/products/:id - archive product; historical orders remain intact
exports.remove = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isArchived: { $ne: true } },
    { $set: { isArchived: true, archivedAt: new Date() } },
    { new: true }
  );
  if (!product) return r.badRequest(res, 'product not found');
  return r.ok(res, product, 'archived');
};

// POST /api/v1/products/:id/restore
exports.restore = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isArchived: true },
    { $set: { isArchived: false, archivedAt: null } },
    { new: true }
  );
  if (!product) return r.badRequest(res, 'archived product not found');
  return r.ok(res, product, 'restored');
};

exports.validateProductBody = validateProductBody;
