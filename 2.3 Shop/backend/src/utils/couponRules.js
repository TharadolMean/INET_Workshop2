const validateCoupon = (coupon, subtotal, { now = new Date(), userUseCount = 0 } = {}) => {
  if (!coupon || !coupon.isActive) return { error: 'coupon is not available' };
  if (coupon.startsAt && now < coupon.startsAt) return { error: 'coupon is not active yet' };
  if (coupon.expiresAt && now > coupon.expiresAt) return { error: 'coupon has expired' };
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    return { error: 'coupon usage limit has been reached' };
  }
  if (userUseCount >= coupon.perUserLimit) return { error: 'coupon usage limit reached for this customer' };
  if (subtotal < coupon.minSubtotal) return { error: 'order does not meet the coupon minimum subtotal' };

  const rawDiscount = coupon.discountType === 'percent'
    ? subtotal * coupon.discountValue / 100
    : coupon.discountValue;
  const cappedDiscount = coupon.maxDiscount === null || coupon.maxDiscount === undefined
    ? rawDiscount
    : Math.min(rawDiscount, coupon.maxDiscount);
  const discountAmount = Math.min(subtotal, Math.round(cappedDiscount * 100) / 100);
  if (discountAmount <= 0) return { error: 'coupon does not apply to this order' };
  return { discountAmount, totalPrice: Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100) };
};

module.exports = { validateCoupon };
