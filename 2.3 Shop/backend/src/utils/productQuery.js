const mongoose = require('mongoose');

const sorts = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  'name-asc': { name: 1, _id: 1 },
  'name-desc': { name: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: -1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseProductQuery = (query = {}, isAdmin = false) => {
  const search = query.q === undefined ? '' : query.q;
  if (typeof search !== 'string' || search.trim().length > 100) return { error: 'q must be a string up to 100 characters' };
  const filter = {};
  if (!(isAdmin && query.includeArchived === 'true')) filter.isArchived = { $ne: true };
  if (query.category !== undefined && query.category !== '') {
    if (!mongoose.isValidObjectId(query.category)) return { error: 'category must be a valid id' };
    filter.category = query.category;
  }
  for (const field of ['minPrice', 'maxPrice']) {
    if (query[field] !== undefined && (query[field] === '' || !Number.isFinite(Number(query[field])) || Number(query[field]) < 0)) {
      return { error: `${field} must be a non-negative number` };
    }
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
    if (filter.price.$gte !== undefined && filter.price.$lte !== undefined && filter.price.$gte > filter.price.$lte) {
      return { error: 'minPrice must be less than or equal to maxPrice' };
    }
  }
  if (query.inStock !== undefined) {
    if (!['true', 'false'].includes(query.inStock)) return { error: 'inStock must be true or false' };
    if (query.inStock === 'true') filter.stock = { $gt: 0 };
  }
  if (query.stockStatus !== undefined) {
    if (!isAdmin || !['all', 'normal', 'low', 'out'].includes(query.stockStatus)) return { error: 'stockStatus must be all, normal, low or out' };
    if (query.stockStatus === 'normal') filter.stock = { $gt: 5 };
    if (query.stockStatus === 'low') filter.stock = { $gt: 0, $lte: 5 };
    if (query.stockStatus === 'out') filter.stock = { $lte: 0 };
  }
  if (search.trim()) {
    const expression = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { name: expression },
      { description: expression },
      { 'specifications.name': expression },
      { 'specifications.value': expression },
    ];
  }
  const sort = query.sort === undefined ? 'newest' : query.sort;
  if (!Object.hasOwn(sorts, sort)) return { error: `sort must be one of: ${Object.keys(sorts).join(', ')}` };
  const paged = query.paged === 'true' || query.page !== undefined || query.limit !== undefined;
  if (query.paged !== undefined && !['true', 'false'].includes(query.paged)) return { error: 'paged must be true or false' };
  let pagination;
  if (paged) {
    const page = query.page === undefined ? 1 : Number(query.page);
    const limit = query.limit === undefined ? 24 : Number(query.limit);
    if (!Number.isInteger(page) || page < 1 || page > 100000) return { error: 'page must be an integer between 1 and 100000' };
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return { error: 'limit must be an integer between 1 and 100' };
    pagination = { page, limit, skip: (page - 1) * limit };
  }
  return { filter, sort: sorts[sort], paged, pagination };
};

module.exports = { parseProductQuery, sorts };
