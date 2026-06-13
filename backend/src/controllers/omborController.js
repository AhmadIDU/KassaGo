const pool = require('../config/database');

// Ombor harakatlari ro'yxati
const harakatlarRoyxati = async (req, res) => {
  try {
    const { mahsulot_id, harakat_turi, sana_dan, sana_gacha, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT oh.*, m.nom as mahsulot_nom, f.ism as foydalanuvchi_ism
      FROM ombor_harakatlari oh
      LEFT JOIN mahsulotlar m ON oh.mahsulot_id = m.id
      LEFT JOIN foydalanuvchilar f ON oh.foydalanuvchi_id = f.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (mahsulot_id) {
      query += ` AND oh.mahsulot_id = $${idx++}`;
      params.push(mahsulot_id);
    }
    if (harakat_turi) {
      query += ` AND oh.harakat_turi = $${idx++}`;
      params.push(harakat_turi);
    }
    if (sana_dan) {
      query += ` AND oh.yaratilgan >= $${idx++}`;
      params.push(sana_dan);
    }
    if (sana_gacha) {
      query += ` AND oh.yaratilgan <= $${idx++}`;
      params.push(sana_gacha + ' 23:59:59');
    }

    query += ` ORDER BY oh.yaratilgan DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Kirim qo'shish
const kirimQoshish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { mahsulot_id, miqdor, narx, sabab } = req.body;

    if (!mahsulot_id || !miqdor || miqdor <= 0) {
      return res.status(400).json({ xato: 'Mahsulot va miqdor kiritilishi shart.' });
    }

    // Mahsulot qoldiqni oshirish
    const mRes = await client.query(
      'UPDATE mahsulotlar SET qoldiq = qoldiq + $1, yangilangan = NOW() WHERE id = $2 RETURNING *',
      [miqdor, mahsulot_id]
    );

    if (mRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ xato: 'Mahsulot topilmadi.' });
    }

    // Agar narx berilsa, sotib olish narxini yangilash
    if (narx) {
      await client.query(
        'UPDATE mahsulotlar SET sotib_olish_narxi = $1 WHERE id = $2',
        [narx, mahsulot_id]
      );
    }

    // Harakat yozish
    const harakatRes = await client.query(
      `INSERT INTO ombor_harakatlari (mahsulot_id, harakat_turi, miqdor, narx, sabab, foydalanuvchi_id)
       VALUES ($1, 'kirim', $2, $3, $4, $5) RETURNING *`,
      [mahsulot_id, miqdor, narx || mRes.rows[0].sotib_olish_narxi, sabab || 'Tovar kirim', req.foydalanuvchi.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      harakat: harakatRes.rows[0],
      yangi_qoldiq: mRes.rows[0].qoldiq,
      xabar: `${miqdor} ta tovar muvaffaqiyatli kirim qilindi.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Qoldiqni tuzatish
const qoldiqTuzatish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { mahsulot_id, yangi_qoldiq, sabab } = req.body;

    if (!mahsulot_id || yangi_qoldiq === undefined) {
      return res.status(400).json({ xato: 'Mahsulot va yangi qoldiq kiritilishi shart.' });
    }

    const mRes = await client.query('SELECT * FROM mahsulotlar WHERE id = $1', [mahsulot_id]);
    if (mRes.rows.length === 0) {
      return res.status(404).json({ xato: 'Mahsulot topilmadi.' });
    }

    const eskiQoldiq = mRes.rows[0].qoldiq;
    const farq = yangi_qoldiq - eskiQoldiq;

    await client.query(
      'UPDATE mahsulotlar SET qoldiq = $1, yangilangan = NOW() WHERE id = $2',
      [yangi_qoldiq, mahsulot_id]
    );

    await client.query(
      `INSERT INTO ombor_harakatlari (mahsulot_id, harakat_turi, miqdor, sabab, foydalanuvchi_id)
       VALUES ($1, 'tuzatish', $2, $3, $4)`,
      [mahsulot_id, Math.abs(farq), sabab || `Qoldiq tuzatildi: ${eskiQoldiq} → ${yangi_qoldiq}`, req.foydalanuvchi.id]
    );

    await client.query('COMMIT');

    res.json({
      eski_qoldiq: eskiQoldiq,
      yangi_qoldiq: yangi_qoldiq,
      xabar: 'Qoldiq muvaffaqiyatli tuzatildi.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Ombor hisoboti
const omborHisoboti = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id, m.nom, m.barkod, m.qoldiq, m.min_qoldiq, m.birlik,
        m.sotish_narxi, m.sotib_olish_narxi,
        (m.qoldiq * m.sotib_olish_narxi) as ombor_qiymati,
        k.nom as kategoriya_nom,
        CASE WHEN m.qoldiq <= m.min_qoldiq THEN true ELSE false END as kam_qoldiq
      FROM mahsulotlar m
      LEFT JOIN kategoriyalar k ON m.kategoriya_id = k.id
      WHERE m.faol = true
      ORDER BY m.nom
    `);

    const jami_qiymat = result.rows.reduce((sum, m) => sum + parseFloat(m.ombor_qiymati || 0), 0);
    const kam_qoldiqlar = result.rows.filter(m => m.kam_qoldiq).length;

    res.json({
      mahsulotlar: result.rows,
      statistika: {
        jami_mahsulotlar: result.rows.length,
        kam_qoldiqlar,
        jami_ombor_qiymati: jami_qiymat,
      }
    });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

module.exports = { harakatlarRoyxati, kirimQoshish, qoldiqTuzatish, omborHisoboti };
