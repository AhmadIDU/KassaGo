const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ xato: 'Token topilmadi. Iltimos, tizimga kiring.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'baraka_secret');
    req.foydalanuvchi = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ xato: 'Token yaroqsiz yoki muddati tugagan.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.foydalanuvchi?.rol !== 'admin') {
    return res.status(403).json({ xato: 'Bu amalni faqat admin bajarishi mumkin.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
