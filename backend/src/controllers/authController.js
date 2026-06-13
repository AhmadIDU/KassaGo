const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Tizimga kirish
const login = async (req, res) => {
  try {
    const { login, parol } = req.body;

    if (!login || !parol) {
      return res.status(400).json({ xato: 'Login va parol kiritilishi shart.' });
    }

    const result = await pool.query(
      'SELECT * FROM foydalanuvchilar WHERE login = $1 AND faol = true',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ xato: 'Login yoki parol noto\'g\'ri.' });
    }

    const foydalanuvchi = result.rows[0];
    const parolTog_ri = await bcrypt.compare(parol, foydalanuvchi.parol);

    if (!parolTog_ri) {
      return res.status(401).json({ xato: 'Login yoki parol noto\'g\'ri.' });
    }

    const token = jwt.sign(
      {
        id: foydalanuvchi.id,
        login: foydalanuvchi.login,
        ism: foydalanuvchi.ism,
        rol: foydalanuvchi.rol,
      },
      process.env.JWT_SECRET || 'baraka_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      foydalanuvchi: {
        id: foydalanuvchi.id,
        ism: foydalanuvchi.ism,
        login: foydalanuvchi.login,
        rol: foydalanuvchi.rol,
      },
      xabar: `Xush kelibsiz, ${foydalanuvchi.ism}!`,
    });
  } catch (err) {
    console.error('Login xatosi:', err);
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Joriy foydalanuvchi ma'lumoti
const menHaqimda = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, ism, login, rol, yaratilgan FROM foydalanuvchilar WHERE id = $1',
      [req.foydalanuvchi.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ xato: 'Foydalanuvchi topilmadi.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Parol o'zgartirish
const parolOzgartirish = async (req, res) => {
  try {
    const { eski_parol, yangi_parol } = req.body;

    if (!eski_parol || !yangi_parol) {
      return res.status(400).json({ xato: 'Eski va yangi parol kiritilishi shart.' });
    }

    if (yangi_parol.length < 6) {
      return res.status(400).json({ xato: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    const result = await pool.query(
      'SELECT * FROM foydalanuvchilar WHERE id = $1',
      [req.foydalanuvchi.id]
    );

    const foydalanuvchi = result.rows[0];
    const parolTog_ri = await bcrypt.compare(eski_parol, foydalanuvchi.parol);

    if (!parolTog_ri) {
      return res.status(400).json({ xato: 'Eski parol noto\'g\'ri.' });
    }

    const hashParol = await bcrypt.hash(yangi_parol, 10);
    await pool.query(
      'UPDATE foydalanuvchilar SET parol = $1, yangilangan = NOW() WHERE id = $2',
      [hashParol, req.foydalanuvchi.id]
    );

    res.json({ xabar: 'Parol muvaffaqiyatli o\'zgartirildi.' });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Foydalanuvchilar ro'yxati (admin uchun)
const foydalanuvchilarRoyxati = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, ism, login, rol, faol, yaratilgan FROM foydalanuvchilar ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Yangi foydalanuvchi qo'shish (admin uchun)
const foydalanuvchiQoshish = async (req, res) => {
  try {
    const { ism, login, parol, rol } = req.body;

    if (!ism || !login || !parol) {
      return res.status(400).json({ xato: 'Ism, login va parol kiritilishi shart.' });
    }

    const hashParol = await bcrypt.hash(parol, 10);
    const result = await pool.query(
      'INSERT INTO foydalanuvchilar (ism, login, parol, rol) VALUES ($1, $2, $3, $4) RETURNING id, ism, login, rol',
      [ism, login, hashParol, rol || 'kassir']
    );

    res.status(201).json({
      foydalanuvchi: result.rows[0],
      xabar: 'Foydalanuvchi muvaffaqiyatli qo\'shildi.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ xato: 'Bu login allaqachon mavjud.' });
    }
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

module.exports = { login, menHaqimda, parolOzgartirish, foydalanuvchilarRoyxati, foydalanuvchiQoshish };
