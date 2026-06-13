const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  barchaMahsulotlar, bittaMahsulot, barkodBilan,
  mahsulotQoshish, mahsulotTahrirlash, mahsulotOchirish,
  kategoriyalar, kategoriyaQoshish, kamQoldiqlar
} = require('../controllers/mahsulotlarController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Rasm yuklash sozlamasi
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Kategoriyalar
router.get('/kategoriyalar', authMiddleware, kategoriyalar);
router.post('/kategoriyalar', authMiddleware, adminMiddleware, kategoriyaQoshish);

// Mahsulotlar
router.get('/', authMiddleware, barchaMahsulotlar);
router.get('/kam-qoldiq', authMiddleware, kamQoldiqlar);
router.get('/barkod/:barkod', authMiddleware, barkodBilan);
router.get('/:id', authMiddleware, bittaMahsulot);
router.post('/', authMiddleware, adminMiddleware, upload.single('rasm'), mahsulotQoshish);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('rasm'), mahsulotTahrirlash);
router.delete('/:id', authMiddleware, adminMiddleware, mahsulotOchirish);

module.exports = router;
