const express = require('express');
const router = express.Router();
const { kunlikHisobot, oylikHisobot, dashboardStatistika, kassirHisoboti } = require('../controllers/hisobotController');
const { authMiddleware } = require('../middleware/auth');

router.get('/dashboard', authMiddleware, dashboardStatistika);
router.get('/kunlik', authMiddleware, kunlikHisobot);
router.get('/oylik', authMiddleware, oylikHisobot);
router.get('/kassirlar', authMiddleware, kassirHisoboti);

module.exports = router;
