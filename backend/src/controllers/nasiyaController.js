const pool = require('../config/database');

// ===================== MIJOZLAR =====================

// Barcha mijozlar
const barchaMijozlar = async (req, res) => {
  try {
    const { qidiruv } = req.query;
    let query = `
      SELECT m.*,
        (SELECT COALESCE(SUM(n.qolgan_summa), 0) FROM nasiyalar n WHERE n.mijoz_id = m.id AND n.holat = 'ochiq') as jami_qarz
      FROM mijozlar m
      WHERE m.faol = true
    `;
    const params = [];
    if (qidiruv) {
      query += ` AND (m.ism ILIKE $1 OR m.telefon ILIKE $1)`;
      params.push(`%${qidiruv}%`);
    }
    query += ' ORDER BY m.ism';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Bitta mijoz
const bittaMijoz = async (req, res) => {
  try {
    const { id } = req.params;
    const mijoz = await pool.query('SELECT * FROM mijozlar WHERE id = $1', [id]);
    if (!mijoz.rows.length) return res.status(404).json({ xato: 'Mijoz topilmadi.' });

    const nasiyalar = await pool.query(
      `SELECT n.*, f.ism as kassir_ism
       FROM nasiyalar n
       LEFT JOIN foydalanuvchilar f ON n.kassir_id = f.id
       WHERE n.mijoz_id = $1
       ORDER BY n.yaratilgan DESC`,
      [id]
    );

    // Har bir nasiya uchun savdo elementlarini ham olish
    const nasiyalarMahsulotlar = [];
    for (const nasiya of nasiyalar.rows) {
      if (nasiya.savdo_id) {
        const elementlar = await pool.query(
          `SELECT se.mahsulot_nom, se.miqdor, se.narx, se.jami
           FROM savdo_elementlari se
           WHERE se.savdo_id = $1`,
          [nasiya.savdo_id]
        );
        nasiyalarMahsulotlar.push({
          ...nasiya,
          mahsulotlar: elementlar.rows,
        });
      } else {
        nasiyalarMahsulotlar.push({ ...nasiya, mahsulotlar: [] });
      }
    }

    const tolovlar = await pool.query(
      `SELECT t.*, f.ism as kassir_ism
       FROM nasiya_tolovlar t
       LEFT JOIN foydalanuvchilar f ON t.kassir_id = f.id
       WHERE t.mijoz_id = $1
       ORDER BY t.yaratilgan DESC`,
      [id]
    );

    res.json({
      mijoz: mijoz.rows[0],
      nasiyalar: nasiyalarMahsulotlar,
      tolovlar: tolovlar.rows,
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Mijoz qo'shish
const mijozQoshish = async (req, res) => {
  try {
    const { ism, telefon, manzil, izoh } = req.body;
    if (!ism) return res.status(400).json({ xato: 'Ism kiritilishi shart.' });

    const result = await pool.query(
      `INSERT INTO mijozlar (ism, telefon, manzil, izoh)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ism, telefon || null, manzil || null, izoh || null]
    );
    res.status(201).json({ mijoz: result.rows[0], xabar: 'Mijoz qo\'shildi.' });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Mijoz tahrirlash
const mijozTahrirlash = async (req, res) => {
  try {
    const { id } = req.params;
    const { ism, telefon, manzil, izoh } = req.body;
    const result = await pool.query(
      `UPDATE mijozlar SET ism=$1, telefon=$2, manzil=$3, izoh=$4, yangilangan=NOW()
       WHERE id=$5 RETURNING *`,
      [ism, telefon || null, manzil || null, izoh || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ xato: 'Mijoz topilmadi.' });
    res.json({ mijoz: result.rows[0], xabar: 'Mijoz yangilandi.' });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// ===================== NASIYALAR =====================

// Nasiya qo'shish (savdo bilan birga)
const nasiyaQoshish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { mijoz_id, savdo_id, summa, muddati, izoh } = req.body;

    if (!mijoz_id || !summa) {
      return res.status(400).json({ xato: 'Mijoz va summa kiritilishi shart.' });
    }

    // Mijoz mavjudmi?
    const mijoz = await client.query('SELECT * FROM mijozlar WHERE id = $1', [mijoz_id]);
    if (!mijoz.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ xato: 'Mijoz topilmadi.' });
    }

    // Nasiya yaratish
    const nasiya = await client.query(
      `INSERT INTO nasiyalar (mijoz_id, savdo_id, summa, qolgan_summa, muddati, izoh, kassir_id)
       VALUES ($1, $2, $3, $3, $4, $5, $6) RETURNING *`,
      [mijoz_id, savdo_id || null, summa, muddati || null, izoh || null, req.foydalanuvchi.id]
    );

    // Mijoz jami qarzini yangilash
    await client.query(
      'UPDATE mijozlar SET nasiya_summasi = nasiya_summasi + $1, yangilangan=NOW() WHERE id = $2',
      [summa, mijoz_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ nasiya: nasiya.rows[0], xabar: 'Nasiya qo\'shildi.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Nasiyalar ro'yxati
const nasiyalarRoyxati = async (req, res) => {
  try {
    const { holat, mijoz_id } = req.query;
    let query = `
      SELECT n.*, m.ism as mijoz_ism, m.telefon as mijoz_telefon, f.ism as kassir_ism
      FROM nasiyalar n
      LEFT JOIN mijozlar m ON n.mijoz_id = m.id
      LEFT JOIN foydalanuvchilar f ON n.kassir_id = f.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (holat) { query += ` AND n.holat = $${idx++}`; params.push(holat); }
    if (mijoz_id) { query += ` AND n.mijoz_id = $${idx++}`; params.push(mijoz_id); }
    query += ' ORDER BY n.yaratilgan DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// To'lov qilish
const tolovQilish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nasiya_id, summa, izoh } = req.body;

    if (!nasiya_id || !summa || summa <= 0) {
      return res.status(400).json({ xato: 'Nasiya va summa kiritilishi shart.' });
    }

    const nasiya = await client.query('SELECT * FROM nasiyalar WHERE id = $1', [nasiya_id]);
    if (!nasiya.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ xato: 'Nasiya topilmadi.' });
    }

    const n = nasiya.rows[0];
    if (n.holat === 'yopiq') {
      await client.query('ROLLBACK');
      return res.status(400).json({ xato: 'Bu nasiya allaqachon to\'liq to\'langan.' });
    }

    const tolovSumma = Math.min(parseFloat(summa), parseFloat(n.qolgan_summa));
    const yangiQolgan = parseFloat(n.qolgan_summa) - tolovSumma;
    const yangiHolat = yangiQolgan <= 0 ? 'yopiq' : 'ochiq';

    // Nasiyani yangilash
    await client.query(
      `UPDATE nasiyalar SET qolgan_summa=$1, holat=$2, yangilangan=NOW() WHERE id=$3`,
      [yangiQolgan, yangiHolat, nasiya_id]
    );

    // To'lov yozish
    const tolov = await client.query(
      `INSERT INTO nasiya_tolovlar (nasiya_id, mijoz_id, summa, izoh, kassir_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nasiya_id, n.mijoz_id, tolovSumma, izoh || null, req.foydalanuvchi.id]
    );

    // Mijoz umumiy qarzini kamaytirish
    await client.query(
      'UPDATE mijozlar SET nasiya_summasi = GREATEST(nasiya_summasi - $1, 0), yangilangan=NOW() WHERE id = $2',
      [tolovSumma, n.mijoz_id]
    );

    await client.query('COMMIT');
    res.json({
      tolov: tolov.rows[0],
      qolgan_summa: yangiQolgan,
      holat: yangiHolat,
      xabar: yangiHolat === 'yopiq'
        ? '✅ Nasiya to\'liq to\'landi!'
        : `✅ To'lov qabul qilindi. Qolgan qarz: ${yangiQolgan.toLocaleString()} so'm`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Umumiy nasiya statistikasi
const nasiyaStatistika = async (req, res) => {
  try {
    const stat = await pool.query(`
      SELECT
        COUNT(DISTINCT m.id) as jami_mijozlar,
        COUNT(DISTINCT CASE WHEN m.nasiya_summasi > 0 THEN m.id END) as qarzdor_mijozlar,
        COALESCE(SUM(m.nasiya_summasi), 0) as jami_qarz,
        COUNT(CASE WHEN n.holat = 'ochiq' THEN 1 END) as ochiq_nasiyalar,
        COUNT(CASE WHEN n.muddati < NOW() AND n.holat = 'ochiq' THEN 1 END) as muddati_otgan
      FROM mijozlar m
      LEFT JOIN nasiyalar n ON m.id = n.mijoz_id
      WHERE m.faol = true
    `);

    // Eng ko'p qarzdorlar
    const topQarzdorlar = await pool.query(`
      SELECT m.id, m.ism, m.telefon, m.nasiya_summasi as qarz
      FROM mijozlar m
      WHERE m.nasiya_summasi > 0 AND m.faol = true
      ORDER BY m.nasiya_summasi DESC
      LIMIT 5
    `);

    res.json({
      statistika: stat.rows[0],
      top_qarzdorlar: topQarzdorlar.rows,
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

module.exports = {
  barchaMijozlar, bittaMijoz, mijozQoshish, mijozTahrirlash,
  nasiyaQoshish, nasiyalarRoyxati, tolovQilish, nasiyaStatistika
};
