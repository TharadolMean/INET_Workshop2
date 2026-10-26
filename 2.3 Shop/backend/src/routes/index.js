const router = require('express').Router();
const { authenticate, optionalAuthenticate, requireAdmin, requireCustomer } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const { upload } = require('../middlewares/uploadProductImage');

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const product = require('../controllers/product.controller');
const category = require('../controllers/category.controller');
const order = require('../controllers/order.controller');
const dashboard = require('../controllers/dashboard.controller');
const inventory = require('../controllers/inventory.controller');
const reports = require('../controllers/reports.controller');
const customer = require('../controllers/customer.controller');
const coupon = require('../controllers/coupon.controller');
const review = require('../controllers/review.controller');

// Auth (public)
router.post('/register', auth.register);
router.post('/login', auth.login);

// Public catalog reads; purchasing, cart state and administration remain protected.
router.get('/products', optionalAuthenticate, product.list);
router.get('/products/:id', optionalAuthenticate, validateId, product.getOne);
router.get('/categories', optionalAuthenticate, category.list);
router.get('/products/:id/reviews', review.listForProduct);

// ต้อง login และถูก Approve แล้วเท่านั้น
router.use(authenticate);

// Customer-owned resources
router.get('/customers/me', requireCustomer, customer.getProfile);
router.patch('/customers/me', requireCustomer, customer.updateProfile);
router.get('/customers/me/addresses', requireCustomer, customer.listAddresses);
router.post('/customers/me/addresses', requireCustomer, customer.createAddress);
router.put('/customers/me/addresses/:addressId', requireCustomer, customer.updateAddress);
router.delete('/customers/me/addresses/:addressId', requireCustomer, customer.deleteAddress);
router.get('/wishlist', requireCustomer, customer.getWishlist);
router.post('/wishlist/:productId', requireCustomer, customer.addWishlistItem);
router.delete('/wishlist/:productId', requireCustomer, customer.removeWishlistItem);
router.post('/coupons/validate', requireCustomer, coupon.validateForCustomer);
router.post('/products/:id/reviews', validateId, requireCustomer, review.createOrUpdate);
router.put('/reviews/:id', requireCustomer, review.updateMine);
router.delete('/reviews/:id', requireCustomer, review.deleteMine);

// Users (admin)
router.get('/users', requireAdmin, user.list);
router.put('/users/:id/approve', requireAdmin, validateId, user.approve);

// Orders (admin ดูรายการทั้งหมด, user สร้าง Order ได้)
router.get('/orders/mine', order.listMine);
router.get('/orders', requireAdmin, order.listAll);
router.post('/orders', order.createBatch);
router.post('/orders/:id/cancel', validateId, order.cancelMine);
router.patch('/orders/:id/status', requireAdmin, validateId, order.updateStatus);
router.get('/inventory/movements', requireAdmin, order.listInventoryMovements);
router.get('/inventory/adjustments', requireAdmin, inventory.listAdjustments);
router.post('/inventory/adjustments', requireAdmin, inventory.adjust);
router.get('/admin/dashboard', requireAdmin, dashboard.getOverview);
router.get('/admin/reports/orders.csv', requireAdmin, reports.ordersCsv);
router.get('/admin/coupons', requireAdmin, coupon.listAdmin);
router.post('/admin/coupons', requireAdmin, coupon.create);
router.put('/admin/coupons/:id', requireAdmin, coupon.update);
router.delete('/admin/coupons/:id', requireAdmin, coupon.remove);

// Products (ทุก role อ่านได้, admin เท่านั้นที่จัดการ)
const productImages = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 8 }]);
router.post('/products', requireAdmin, productImages, product.create);
router.put('/products/:id', requireAdmin, validateId, productImages, product.update);
router.post('/products/:id/restore', requireAdmin, validateId, product.restore);
router.delete('/products/:id', requireAdmin, validateId, product.remove);

// Categories (ทุก role อ่านได้, admin เท่านั้นที่จัดการ)
router.post('/categories', requireAdmin, category.create);
router.put('/categories/:id', requireAdmin, validateId, category.update);
router.delete('/categories/:id', requireAdmin, validateId, category.remove);

// Orders ใน Product (admin ดูประวัติ, user สร้าง Order)
router.get('/products/:id/orders', requireAdmin, validateId, order.listByProduct);
router.post('/products/:id/orders', validateId, order.create);

module.exports = router;
