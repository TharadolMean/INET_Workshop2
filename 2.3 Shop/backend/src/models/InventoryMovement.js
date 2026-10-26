const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    type: { type: String, enum: ['order_placed', 'order_cancelled'], required: true },
    quantityDelta: { type: Number, required: true, validate: Number.isInteger },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ order: 1, product: 1, type: 1 }, { unique: true });
inventoryMovementSchema.index({ product: 1, createdAt: -1 });

inventoryMovementSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
