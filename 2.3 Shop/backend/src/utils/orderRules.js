const statuses = ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled'];

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const getOrderStatus = (order) => order?.status || 'delivered';

const canTransition = (from, to) => Boolean(transitions[from]?.includes(to));

const canCustomerCancel = (status) => status === 'pending' || status === 'confirmed';

const isStockRestoredForCancellation = (order) =>
  getOrderStatus(order) === 'cancelled' && order?.stockRestored === true;

const getOrderLines = (order) => {
  if (Array.isArray(order?.items) && order.items.length) {
    return order.items.map((item) => ({
      productId: String(item.product?._id || item.product),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));
  }

  if (!order?.product || !Number.isInteger(order.quantity) || order.quantity < 1) return [];
  return [{
    productId: String(order.product?._id || order.product),
    name: order.product?.name || '',
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalPrice: order.unitPrice * order.quantity,
  }];
};

const aggregateOrderQuantities = (lines) => {
  const quantities = new Map();
  for (const line of lines) {
    quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
};

module.exports = {
  statuses,
  transitions,
  getOrderStatus,
  canTransition,
  canCustomerCancel,
  isStockRestoredForCancellation,
  getOrderLines,
  aggregateOrderQuantities,
};
