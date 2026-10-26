const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCoupon } = require('../src/utils/couponRules');
const { validateCouponBody } = require('../src/controllers/coupon.controller');
const { normalizeAddress } = require('../src/controllers/customer.controller');
const { validateReview } = require('../src/controllers/review.controller');

test('coupon rules calculate fixed and percentage discounts with caps', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const percentage = validateCoupon({ isActive: true, discountType: 'percent', discountValue: 20, maxDiscount: 25, minSubtotal: 50, usageCount: 0, perUserLimit: 1 }, 200, { now });
  assert.deepEqual(percentage, { discountAmount: 25, totalPrice: 175 });
  const fixed = validateCoupon({ isActive: true, discountType: 'fixed', discountValue: 30, minSubtotal: 0, usageCount: 0, perUserLimit: 1 }, 20, { now });
  assert.deepEqual(fixed, { discountAmount: 20, totalPrice: 0 });
});

test('coupon rules enforce activity, dates, minimums, and usage limits', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const base = { isActive: true, discountType: 'fixed', discountValue: 10, minSubtotal: 50, usageCount: 0, perUserLimit: 1 };
  assert.equal(validateCoupon({ ...base, isActive: false }, 100, { now }).error, 'coupon is not available');
  assert.equal(validateCoupon({ ...base, startsAt: new Date('2026-07-01') }, 100, { now }).error, 'coupon is not active yet');
  assert.equal(validateCoupon({ ...base, expiresAt: new Date('2026-05-01') }, 100, { now }).error, 'coupon has expired');
  assert.equal(validateCoupon(base, 40, { now }).error, 'order does not meet the coupon minimum subtotal');
  assert.equal(validateCoupon({ ...base, usageLimit: 2, usageCount: 2 }, 100, { now }).error, 'coupon usage limit has been reached');
  assert.equal(validateCoupon(base, 100, { now, userUseCount: 1 }).error, 'coupon usage limit reached for this customer');
});

test('coupon API validation rejects client-controlled usage counters and invalid terms', () => {
  assert.equal(validateCouponBody({ code: 'save10', discountType: 'percent', discountValue: 10 }), null);
  assert.match(validateCouponBody({ code: 'SAVE', discountType: 'percent', discountValue: 110 }), /discountValue/);
  assert.match(validateCouponBody({ code: 'SAVE10', discountType: 'fixed', discountValue: 5, usageCount: 100 }), /unsupported/);
});

test('address and review input validators reject malformed customer data', () => {
  const address = { label: 'Home', recipient: 'Customer', phone: '0812345678', line1: '123 Main Road', line2: '', subdistrict: 'Central', district: 'District', province: 'Province', postalCode: '10000' };
  assert.equal(normalizeAddress(address).error, undefined);
  assert.equal(normalizeAddress({ ...address, isDefault: 'yes' }).error, 'isDefault must be boolean');
  assert.equal(validateReview({ rating: 5, comment: 'Good product' }), null);
  assert.equal(validateReview({ rating: 5.5 }).startsWith('rating'), true);
});
