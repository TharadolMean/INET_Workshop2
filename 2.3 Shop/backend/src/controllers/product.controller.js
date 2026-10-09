const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const r = require('../utils/response');

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

const removeImageFile = async (image) => {
  if (!image?.filename) return;
  try {
    await fs.unlink(path.join(__dirname, '../../uploads/products', image.filename));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error);
  }
};

// GET /api/v1/products
exports.list = async (_req, res) => {
  const products = await Product.find()
    .populate('category', 'name slug isActive')
    .sort({ createdAt: -1 });
  return r.ok(res, products);
};

// GET /api/v1/products/:id
exports.getOne = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug isActive');
  if (!product) return r.badRequest(res, 'product not found');
  return r.ok(res, product);
};

// POST /api/v1/products
exports.create = async (req, res) => {
  const error = validateProductBody(req.body);
  if (error) return r.badRequest(res, error);

  const category = await getCategory(req.body.category);
  if (req.body.category && !category) return r.badRequest(res, 'category not found or inactive');

  const image = imageFromFile(req.file);
  try {
    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      stock: Number(req.body.stock || 0),
      category: category?._id || null,
      image: image || undefined,
    });
    await product.populate('category', 'name slug isActive');
    return r.created(res, product);
  } catch (createError) {
    await removeImageFile(image);
    throw createError;
  }
};

// PUT /api/v1/products/:id
exports.update = async (req, res) => {
  const error = validateProductBody(req.body, { partial: true });
  if (error) return r.badRequest(res, error);

  const product = await Product.findById(req.params.id);
  if (!product) return r.badRequest(res, 'product not found');

  const oldImage = product.image;
  const category = await getCategory(req.body.category);
  if (req.body.category !== undefined && req.body.category !== '' && !category) {
    return r.badRequest(res, 'category not found or inactive');
  }

  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.description !== undefined) update.description = req.body.description;
  if (req.body.price !== undefined) update.price = Number(req.body.price);
  if (req.body.stock !== undefined) update.stock = Number(req.body.stock);
  if (req.body.category !== undefined) update.category = category?._id || null;

  Object.assign(product, update);
  if (req.file) product.image = imageFromFile(req.file);
  if (req.body.removeImage === 'true') product.image = {};

  try {
    await product.save();
  } catch (updateError) {
    await removeImageFile(imageFromFile(req.file));
    throw updateError;
  }

  if (req.file || req.body.removeImage === 'true') await removeImageFile(oldImage);
  await product.populate('category', 'name slug isActive');
  return r.ok(res, product);
};

// DELETE /api/v1/products/:id  (ลบ Order ของ product นั้นด้วย)
exports.remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return r.badRequest(res, 'product not found');
  await removeImageFile(product.image);
  await Order.deleteMany({
    $or: [{ product: product._id }, { 'items.product': product._id }],
  });
  return r.ok(res, product, 'deleted');
};
