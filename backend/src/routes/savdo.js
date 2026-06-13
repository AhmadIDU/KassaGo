const express = require('express');
const router = express.Router();
const { savdoYaratish, savdolarRoyxati, bittaSavdo, savdoBekorQilish, offlineSyncQilish } = require('../controllers/savdoController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, savdolarRoyxati);
router.get('/:id', authMiddleware, bittaSavdo);
router.post('/', authMiddleware, savdoYaratish);
router.put('/:id/bekor', authMiddleware, adminMiddleware, savdoBekorQilish);
router.post('/sync/offline', authMiddleware, offlineSyncQilish);

module.exports = router;
