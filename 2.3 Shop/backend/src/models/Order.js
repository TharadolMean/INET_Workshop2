const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderStatusValues = ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled'];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: orderStatusValues, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Legacy single-product Order fields. Keep them readable for Workshop 01 data.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    items: { type: [orderItemSchema], default: undefined },
    totalPrice: { type: Number, required: true, min: 0 },
    // New orders set pending explicitly; old status-less records default closed to prevent unsafe restocks.
    status: { type: String, enum: orderStatusValues, default: 'delivered', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    statusUpdatedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

orderSchema.pre('validate', function validateOrder() {
  const hasItems = Array.isArray(this.items) && this.items.length > 0;
  const hasLegacyProduct = this.product && this.quantity && this.unitPrice !== undefined;

  if (!hasItems && !hasLegacyProduct) {
    throw new Error('order must contain items or a legacy product');
  }
});

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.orderStatusValues = orderStatusValues;
