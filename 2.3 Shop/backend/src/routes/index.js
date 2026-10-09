const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const product = require('../controllers/product.controller');
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
router.post('/products', requireAdmin, product.create);
router.get('/products/:id', validateId, product.getOne);
router.put('/products/:id', requireAdmin, validateId, product.update);
router.delete('/products/:id', requireAdmin, validateId, product.remove);

// Orders ใน Product (admin ดูประวัติ, user สร้าง Order)
router.get('/products/:id/orders', requireAdmin, validateId, order.listByProduct);
router.post('/products/:id/orders', validateId, order.create);

module.exports = router;
