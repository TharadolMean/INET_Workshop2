const router = require('express').Router();
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const { upload } = require('../middlewares/uploadProductImage');

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const product = require('../controllers/product.controller');
const category = require('../controllers/category.controller');
const order = require('../controllers/order.controller');
const dashboard = require('../controllers/dashboard.controller');

// Auth (public)
router.post('/register', auth.register);
router.post('/login', auth.login);

// Public catalog reads; purchasing, cart state and administration remain protected.
router.get('/products', optionalAuthenticate, product.list);
router.get('/products/:id', optionalAuthenticate, validateId, product.getOne);
router.get('/categories', optionalAuthenticate, category.list);

// ต้อง login และถูก Approve แล้วเท่านั้น
router.use(authenticate);

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
router.get('/admin/dashboard', requireAdmin, dashboard.getOverview);

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
