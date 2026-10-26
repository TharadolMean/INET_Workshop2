const mongoose = require('mongoose');

const inventoryAdjustmentSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantityDelta: { type: Number, required: true, validate: Number.isInteger },
  stockBefore: { type: Number, required: true, min: 0 },
  stockAfter: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
}, { timestamps: true });

inventoryAdjustmentSchema.index({ createdAt: -1 });
inventoryAdjustmentSchema.index({ product: 1, createdAt: -1 });

inventoryAdjustmentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
