const errorHandler = (err, req, res, next) => {
  console.error('❌ Server xatosi:', err.stack);

  if (err.code === '23505') {
    return res.status(400).json({ xato: 'Bu ma\'lumot allaqachon mavjud.' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ xato: 'Bog\'liq ma\'lumot topilmadi.' });
  }

  res.status(err.status || 500).json({
    xato: err.message || 'Server ichki xatosi yuz berdi.',
  });
};

module.exports = errorHandler;
