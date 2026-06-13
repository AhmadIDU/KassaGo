const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Statik fayllar (rasmlar)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mahsulotlar', require('./routes/mahsulotlar'));
app.use('/api/savdo', require('./routes/savdo'));
app.use('/api/ombor', require('./routes/ombor'));
app.use('/api/hisobot', require('./routes/hisobot'));

// Asosiy test route
app.get('/api', (req, res) => {
  res.json({
    xabar: '✅ Baraka POS API ishlayapti!',
    versiya: '1.0.0',
    sana: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ xato: 'Bu yo\'l topilmadi.' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================== 🚀');
  console.log(`✅  Baraka POS Server ishlamoqda`);
  console.log(`🌐  Port: http://localhost:${PORT}`);
  console.log(`📦  Muhit: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 ========================== 🚀');
  console.log('');
});

module.exports = app;
