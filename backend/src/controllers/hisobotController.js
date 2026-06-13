const pool = require('../config/database');

// Kunlik hisobot
const kunlikHisobot = async (req, res) => {
  try {
    const { sana } = req.query;
    const hisobotSana = sana || new Date().toISOString().slice(0, 10);

    const result = await pool.query(`
      SELECT
        COUNT(*) as savdolar_soni,
        COALESCE(SUM(jami_summa), 0) as jami_daromad,
        COALESCE(SUM(CASE WHEN tolov_turi = 'naqd' THEN jami_summa ELSE 0 END), 0) as naqd,
        COALESCE(SUM(CASE WHEN tolov_turi = 'karta' THEN jami_summa ELSE 0 END), 0) as karta,
        COALESCE(SUM(CASE WHEN tolov_turi = 'nasiya' THEN jami_summa ELSE 0 END), 0) as nasiya,
        COALESCE(SUM(chegirma), 0) as jami_chegirma
      FROM savdolar
      WHERE DATE(yaratilgan) = $1 AND holat = 'yakunlangan'
    `, [hisobotSana]);

    // Eng ko'p sotiladigan mahsulotlar
    const topMahsulotlar = await pool.query(`
      SELECT
        se.mahsulot_nom,
        SUM(se.miqdor) as jami_miqdor,
        SUM(se.jami) as jami_summa
      FROM savdo_elementlari se
      JOIN savdolar s ON se.savdo_id = s.id
      WHERE DATE(s.yaratilgan) = $1 AND s.holat = 'yakunlangan'
      GROUP BY se.mahsulot_nom
      ORDER BY jami_miqdor DESC
      LIMIT 10
    `, [hisobotSana]);

    // Soat bo'yicha savdo
    const soatBoyicha = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM yaratilgan) as soat,
        COUNT(*) as savdolar_soni,
        COALESCE(SUM(jami_summa), 0) as daromad
      FROM savdolar
      WHERE DATE(yaratilgan) = $1 AND holat = 'yakunlangan'
      GROUP BY soat
      ORDER BY soat
    `, [hisobotSana]);

    res.json({
      sana: hisobotSana,
      umumiy: result.rows[0],
      top_mahsulotlar: topMahsulotlar.rows,
      soat_boyicha: soatBoyicha.rows,
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Oylik hisobot
const oylikHisobot = async (req, res) => {
  try {
    const { yil, oy } = req.query;
    const hozir = new Date();
    const hisobotYil = yil || hozir.getFullYear();
    const hisobotOy = oy || (hozir.getMonth() + 1);

    const result = await pool.query(`
      SELECT
        COUNT(*) as savdolar_soni,
        COALESCE(SUM(jami_summa), 0) as jami_daromad,
        COALESCE(SUM(CASE WHEN tolov_turi = 'naqd' THEN jami_summa ELSE 0 END), 0) as naqd,
        COALESCE(SUM(CASE WHEN tolov_turi = 'karta' THEN jami_summa ELSE 0 END), 0) as karta,
        COALESCE(SUM(CASE WHEN tolov_turi = 'nasiya' THEN jami_summa ELSE 0 END), 0) as nasiya
      FROM savdolar
      WHERE EXTRACT(YEAR FROM yaratilgan) = $1
        AND EXTRACT(MONTH FROM yaratilgan) = $2
        AND holat = 'yakunlangan'
    `, [hisobotYil, hisobotOy]);

    // Kunlik savdolar
    const kunliklar = await pool.query(`
      SELECT
        DATE(yaratilgan) as kun,
        COUNT(*) as savdolar_soni,
        COALESCE(SUM(jami_summa), 0) as daromad
      FROM savdolar
      WHERE EXTRACT(YEAR FROM yaratilgan) = $1
        AND EXTRACT(MONTH FROM yaratilgan) = $2
        AND holat = 'yakunlangan'
      GROUP BY kun
      ORDER BY kun
    `, [hisobotYil, hisobotOy]);

    // Top mahsulotlar
    const topMahsulotlar = await pool.query(`
      SELECT
        se.mahsulot_nom,
        SUM(se.miqdor) as jami_miqdor,
        SUM(se.jami) as jami_summa
      FROM savdo_elementlari se
      JOIN savdolar s ON se.savdo_id = s.id
      WHERE EXTRACT(YEAR FROM s.yaratilgan) = $1
        AND EXTRACT(MONTH FROM s.yaratilgan) = $2
        AND s.holat = 'yakunlangan'
      GROUP BY se.mahsulot_nom
      ORDER BY jami_summa DESC
      LIMIT 10
    `, [hisobotYil, hisobotOy]);

    res.json({
      yil: hisobotYil,
      oy: hisobotOy,
      umumiy: result.rows[0],
      kunlik_savdolar: kunliklar.rows,
      top_mahsulotlar: topMahsulotlar.rows,
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Dashboard statistika
const dashboardStatistika = async (req, res) => {
  try {
    const bugun = new Date().toISOString().slice(0, 10);

    // Bugungi savdo
    const bugunSavdo = await pool.query(`
      SELECT COUNT(*) as soni, COALESCE(SUM(jami_summa), 0) as summa
      FROM savdolar
      WHERE DATE(yaratilgan) = $1 AND holat = 'yakunlangan'
    `, [bugun]);

    // Jami mahsulotlar
    const mahsulotlar = await pool.query(`
      SELECT COUNT(*) as jami, SUM(CASE WHEN qoldiq <= min_qoldiq THEN 1 ELSE 0 END) as kam_qoldiq
      FROM mahsulotlar WHERE faol = true
    `);

    // Oxirgi 7 kunlik savdo
    const haftalik = await pool.query(`
      SELECT
        DATE(yaratilgan) as kun,
        COALESCE(SUM(jami_summa), 0) as daromad,
        COUNT(*) as soni
      FROM savdolar
      WHERE yaratilgan >= NOW() - INTERVAL '7 days' AND holat = 'yakunlangan'
      GROUP BY kun
      ORDER BY kun
    `);

    // Oxirgi 5 ta savdo
    const oxirgiSavdolar = await pool.query(`
      SELECT s.*, f.ism as kassir_ism
      FROM savdolar s
      LEFT JOIN foydalanuvchilar f ON s.kassir_id = f.id
      WHERE s.holat = 'yakunlangan'
      ORDER BY s.yaratilgan DESC
      LIMIT 5
    `);

    res.json({
      bugun: bugunSavdo.rows[0],
      mahsulotlar: mahsulotlar.rows[0],
      haftalik_savdo: haftalik.rows,
      oxirgi_savdolar: oxirgiSavdolar.rows,
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Kassir hisoboti
const kassirHisoboti = async (req, res) => {
  try {
    const { sana_dan, sana_gacha } = req.query;
    const dan = sana_dan || new Date().toISOString().slice(0, 10);
    const gacha = sana_gacha || new Date().toISOString().slice(0, 10);

    const result = await pool.query(`
      SELECT
        f.id, f.ism,
        COUNT(s.id) as savdolar_soni,
        COALESCE(SUM(s.jami_summa), 0) as jami_summa
      FROM foydalanuvchilar f
      LEFT JOIN savdolar s ON f.id = s.kassir_id
        AND DATE(s.yaratilgan) BETWEEN $1 AND $2
        AND s.holat = 'yakunlangan'
      WHERE f.faol = true
      GROUP BY f.id, f.ism
      ORDER BY jami_summa DESC
    `, [dan, gacha]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

module.exports = { kunlikHisobot, oylikHisobot, dashboardStatistika, kassirHisoboti };
