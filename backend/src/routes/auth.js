const express = require('express');
const router = express.Router();
const { login, menHaqimda, parolOzgartirish, foydalanuvchilarRoyxati, foydalanuvchiQoshish } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/login', login);
router.get('/men', authMiddleware, menHaqimda);
router.put('/parol', authMiddleware, parolOzgartirish);

// Admin uchun
router.get('/foydalanuvchilar', authMiddleware, adminMiddleware, foydalanuvchilarRoyxati);
router.post('/foydalanuvchilar', authMiddleware, adminMiddleware, foydalanuvchiQoshish);

module.exports = router;
