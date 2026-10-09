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

const orderSchema = new mongoose.Schema(
  {
    // Legacy single-product Order fields. Keep them readable for Workshop 01 data.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    items: { type: [orderItemSchema], default: undefined },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

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
