const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const { upload } = require('../middlewares/uploadProductImage');

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const product = require('../controllers/product.controller');
const category = require('../controllers/category.controller');
const order = require('../controllers/order.controller');

// Auth (public)
router.post('/register', auth.register);
router.post('/login', auth.login);

// ต้อง login และถูก Approve แล้วเท่านั้น
router.use(authenticate);

// Users (admin)
router.get('/users', requireAdmin, user.list);
router.put('/users/:id/approve', requireAdmin, validateId, user.approve);

// Orders (admin ดูรายการทั้งหมด, user สร้าง Order ได้)
router.get('/orders', requireAdmin, order.listAll);
router.post('/orders', order.createBatch);

// Products (ทุก role อ่านได้, admin เท่านั้นที่จัดการ)
router.get('/products', product.list);
router.post('/products', requireAdmin, upload.single('image'), product.create);
router.get('/products/:id', validateId, product.getOne);
router.put('/products/:id', requireAdmin, validateId, upload.single('image'), product.update);
router.delete('/products/:id', requireAdmin, validateId, product.remove);

// Categories (ทุก role อ่านได้, admin เท่านั้นที่จัดการ)
router.get('/categories', category.list);
router.post('/categories', requireAdmin, category.create);
router.put('/categories/:id', requireAdmin, validateId, category.update);
router.delete('/categories/:id', requireAdmin, validateId, category.remove);

// Orders ใน Product (admin ดูประวัติ, user สร้าง Order)
router.get('/products/:id/orders', requireAdmin, validateId, order.listByProduct);
router.post('/products/:id/orders', validateId, order.create);

module.exports = router;
