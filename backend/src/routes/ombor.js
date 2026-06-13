const express = require('express');
const router = express.Router();
const { harakatlarRoyxati, kirimQoshish, qoldiqTuzatish, omborHisoboti } = require('../controllers/omborController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, harakatlarRoyxati);
router.get('/hisobot', authMiddleware, omborHisoboti);
router.post('/kirim', authMiddleware, kirimQoshish);
router.post('/tuzatish', authMiddleware, adminMiddleware, qoldiqTuzatish);

module.exports = router;
