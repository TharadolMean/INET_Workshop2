const Category = require('../models/Category');
const Product = require('../models/Product');
const r = require('../utils/response');

const toSlug = (value) => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '-')
  .replace(/^-+|-+$/g, '');

const findDuplicate = async (name, slug, id) => {
  const query = {
    $or: [{ name }, { slug }],
  };
  if (id) query._id = { $ne: id };
  return Category.findOne(query);
};

exports.list = async (_req, res) => {
  const categories = await Category.find().sort({ isActive: -1, name: 1 });
  return r.ok(res, categories);
};

exports.create = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const slug = toSlug(req.body?.slug || name);
  if (!name) return r.badRequest(res, 'name is required');
  if (!slug) return r.badRequest(res, 'slug is required');

  if (await findDuplicate(name, slug)) {
    return r.badRequest(res, 'category name or slug already exists');
  }

  const category = await Category.create({ name, slug });
  return r.created(res, category);
};

exports.update = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return r.badRequest(res, 'category not found');

  const update = {};
  if (req.body?.name !== undefined) {
    update.name = String(req.body.name).trim();
    if (!update.name) return r.badRequest(res, 'name must not be empty');
  }
  if (req.body?.slug !== undefined) {
    update.slug = toSlug(req.body.slug);
    if (!update.slug) return r.badRequest(res, 'slug must not be empty');
  }
  if (req.body?.isActive !== undefined) {
    if (typeof req.body.isActive !== 'boolean') return r.badRequest(res, 'isActive must be boolean');
    update.isActive = req.body.isActive;
  }

  const duplicate = await findDuplicate(
    update.name || category.name,
    update.slug || category.slug,
    category._id
  );
  if (duplicate) return r.badRequest(res, 'category name or slug already exists');

  Object.assign(category, update);
  await category.save();
  return r.ok(res, category);
};

exports.remove = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return r.badRequest(res, 'category not found');

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return r.badRequest(res, 'cannot delete a category assigned to products');
  }

  await category.deleteOne();
  return r.ok(res, category, 'deleted');
};
