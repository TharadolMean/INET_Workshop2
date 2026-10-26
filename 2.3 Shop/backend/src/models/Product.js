const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    specifications: {
      type: [{ name: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } }],
      default: [],
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image: {
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      path: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    images: {
      type: [{
        filename: { type: String, default: '' },
        originalName: { type: String, default: '' },
        path: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Product', productSchema);
