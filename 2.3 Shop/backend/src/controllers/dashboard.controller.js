const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const r = require('../utils/response');
const { getDashboardQuery } = require('../utils/dashboardQuery');

const LOW_STOCK_THRESHOLD = 5;

const orderDateMatch = (range) => ({
  createdAt: { $gte: range.from, $lt: range.toExclusive },
});

const activeOrderExpression = {
  $ne: [{ $ifNull: ['$status', 'delivered'] }, 'cancelled'],
};

const emptyOverview = () => ({
  orderCount: 0,
  activeOrderCount: 0,
  cancelledOrderCount: 0,
  simulatedOrderValue: 0,
});

const emptyProducts = () => ({
  activeProductCount: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  totalStockUnits: 0,
});

const fillTrendPeriods = (range, rows) => {
  const byPeriod = new Map(rows.map((row) => [row.period, row]));
  const trends = [];
  const cursor = new Date(range.from);
  if (range.interval === 'month') cursor.setUTCDate(1);
  while (cursor < range.toExclusive) {
    const period = range.interval === 'month'
      ? cursor.toISOString().slice(0, 7)
      : cursor.toISOString().slice(0, 10);
    trends.push(byPeriod.get(period) || {
      period,
      activeOrderCount: 0,
      cancelledOrderCount: 0,
      simulatedOrderValue: 0,
    });
    if (range.interval === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return trends;
};

exports.getOverview = async (req, res) => {
  const range = getDashboardQuery(req.query);
  if (range.error) return r.badRequest(res, range.error);

  const match = orderDateMatch(range);
  const trendFormat = range.interval === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const [
    orderOverviewRows,
    statusDistribution,
    trendRows,
    recentOrders,
    bestSellingProducts,
    customerCount,
    newCustomerCount,
    productRows,
    archivedProductCount,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          activeOrderCount: { $sum: { $cond: [activeOrderExpression, 1, 0] } },
          cancelledOrderCount: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$status', 'delivered'] }, 'cancelled'] }, 1, 0] },
          },
          simulatedOrderValue: {
            $sum: { $cond: [activeOrderExpression, { $ifNull: ['$totalPrice', 0] }, 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: { $ifNull: ['$status', 'delivered'] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: trendFormat, date: '$createdAt', timezone: 'UTC' } },
          activeOrderCount: { $sum: { $cond: [activeOrderExpression, 1, 0] } },
          cancelledOrderCount: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$status', 'delivered'] }, 'cancelled'] }, 1, 0] },
          },
          simulatedOrderValue: {
            $sum: { $cond: [activeOrderExpression, { $ifNull: ['$totalPrice', 0] }, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, period: '$_id', activeOrderCount: 1, cancelledOrderCount: 1, simulatedOrderValue: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
      { $lookup: { from: User.collection.name, localField: 'user', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          totalPrice: 1,
          status: { $ifNull: ['$status', 'delivered'] },
          customer: { _id: '$customer._id', name: '$customer.name', email: '$customer.email' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...match, status: { $ne: 'cancelled' } } },
      {
        $project: {
          lines: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] },
              {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: {
                    product: '$$item.product',
                    name: '$$item.name',
                    quantity: '$$item.quantity',
                    totalPrice: '$$item.totalPrice',
                  },
                },
              },
              {
                $cond: [
                  { $and: [{ $ne: ['$product', null] }, { $gt: ['$quantity', 0] }] },
                  [{ product: '$product', name: '', quantity: '$quantity', totalPrice: '$totalPrice' }],
                  [],
                ],
              },
            ],
          },
        },
      },
      { $unwind: '$lines' },
      { $match: { 'lines.product': { $ne: null } } },
      {
        $group: {
          _id: '$lines.product',
          snapshotName: { $first: '$lines.name' },
          quantity: { $sum: '$lines.quantity' },
          simulatedOrderValue: { $sum: { $ifNull: ['$lines.totalPrice', 0] } },
          orderCount: { $sum: 1 },
        },
      },
      { $lookup: { from: Product.collection.name, localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: {
            $ifNull: [
              { $cond: [{ $eq: [{ $ifNull: ['$snapshotName', ''] }, ''] }, '$product.name', '$snapshotName'] },
              'สินค้าเก่า',
            ],
          },
          quantity: 1,
          orderCount: 1,
          simulatedOrderValue: 1,
        },
      },
      { $sort: { quantity: -1, simulatedOrderValue: -1, name: 1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: range.from, $lt: range.toExclusive } }),
    Product.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          activeProductCount: { $sum: 1 },
          lowStockCount: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', LOW_STOCK_THRESHOLD] }] }, 1, 0] },
          },
          outOfStockCount: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          totalStockUnits: { $sum: { $ifNull: ['$stock', 0] } },
        },
      },
    ]),
    Product.countDocuments({ isArchived: true }),
    Product.find({ isArchived: { $ne: true }, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .select('name stock price')
      .sort({ stock: 1, name: 1 })
      .limit(8)
      .lean(),
  ]);

  const orderOverview = orderOverviewRows[0] || emptyOverview();
  const productOverview = productRows[0] || emptyProducts();
  return r.ok(res, {
    range: { from: range.fromDate, to: range.toDate, interval: range.interval },
    metrics: {
      ...orderOverview,
      customerCount,
      newCustomerCount,
      ...productOverview,
      archivedProductCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
    recentOrders,
    bestSellingProducts,
    statusDistribution,
    trends: fillTrendPeriods(range, trendRows),
    lowStockProducts,
  });
};
