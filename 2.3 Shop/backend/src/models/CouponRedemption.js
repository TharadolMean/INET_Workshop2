const mongoose = require('mongoose');

const couponRedemptionSchema = new mongoose.Schema({
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  discountAmount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

couponRedemptionSchema.index({ coupon: 1, user: 1 });

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema);
