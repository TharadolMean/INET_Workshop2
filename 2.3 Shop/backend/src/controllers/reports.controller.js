const Order = require('../models/Order');
const { getDashboardQuery } = require('../utils/dashboardQuery');
const { csvRow } = require('../utils/csv');
const r = require('../utils/response');

const waitForDrain = (res) => new Promise((resolve) => res.once('drain', resolve));

exports.ordersCsv = async (req, res) => {
  const range = getDashboardQuery({ ...req.query, interval: 'day' });
  if (range.error) return r.badRequest(res, range.error);
  const filename = `electrohub-orders-${range.fromDate}-to-${range.toDate}.csv`;
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  });
  res.write('\uFEFF');
  res.write(csvRow(['order_id', 'created_at', 'status', 'customer_id', 'items', 'subtotal', 'discount', 'coupon', 'simulated_order_value']));
  const cursor = Order.find({ createdAt: { $gte: range.from, $lt: range.toExclusive } })
    .select('_id user items product name quantity unitPrice totalPrice subtotalPrice discountAmount couponCode status createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .cursor({ batchSize: 500 });
  try {
    for await (const order of cursor) {
      const items = Array.isArray(order.items) && order.items.length
        ? order.items.map((item) => `${item.name || item.product}:${item.quantity} x ${item.unitPrice}`).join(' | ')
        : `${order.name || order.product}:${order.quantity} x ${order.unitPrice}`;
      const subtotal = order.subtotalPrice === undefined ? order.totalPrice : order.subtotalPrice;
      const status = order.status || 'delivered';
      const row = csvRow([
        order._id,
        order.createdAt?.toISOString(),
        status,
        order.user,
        items,
        subtotal,
        order.discountAmount || 0,
        order.couponCode || '',
        status === 'cancelled' ? 0 : order.totalPrice,
      ]);
      if (!res.write(row)) await waitForDrain(res);
    }
    res.end();
  } catch (error) {
    cursor.close();
    if (res.headersSent) return res.destroy(error);
    throw error;
  }
};
