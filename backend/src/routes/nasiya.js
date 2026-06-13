const express = require('express');
const router = express.Router();
const {
  barchaMijozlar, bittaMijoz, mijozQoshish, mijozTahrirlash,
  nasiyaQoshish, nasiyalarRoyxati, tolovQilish, nasiyaStatistika
} = require('../controllers/nasiyaController');
const { authMiddleware } = require('../middleware/auth');

// Statistika
router.get('/statistika', authMiddleware, nasiyaStatistika);

// Mijozlar
router.get('/mijozlar', authMiddleware, barchaMijozlar);
router.get('/mijozlar/:id', authMiddleware, bittaMijoz);
router.post('/mijozlar', authMiddleware, mijozQoshish);
router.put('/mijozlar/:id', authMiddleware, mijozTahrirlash);

// Nasiyalar
router.get('/', authMiddleware, nasiyalarRoyxati);
router.post('/', authMiddleware, nasiyaQoshish);
router.post('/tolov', authMiddleware, tolovQilish);

module.exports = router;
