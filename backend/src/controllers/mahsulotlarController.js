const pool = require('../config/database');

// Barcha mahsulotlar
const barchaMahsulotlar = async (req, res) => {
  try {
    const { kategoriya, qidiruv, faol } = req.query;
    let query = `
      SELECT m.*, k.nom as kategoriya_nom
      FROM mahsulotlar m
      LEFT JOIN kategoriyalar k ON m.kategoriya_id = k.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (kategoriya) {
      query += ` AND m.kategoriya_id = $${idx++}`;
      params.push(kategoriya);
    }

    if (qidiruv) {
      query += ` AND (m.nom ILIKE $${idx} OR m.barkod ILIKE $${idx})`;
      params.push(`%${qidiruv}%`);
      idx++;
    }

    if (faol !== undefined) {
      query += ` AND m.faol = $${idx++}`;
      params.push(faol === 'true');
    } else {
      query += ` AND m.faol = true`;
    }

    query += ' ORDER BY m.nom';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Barkod bo'yicha mahsulot
const barkodBilan = async (req, res) => {
  try {
    const { barkod } = req.params;
    const result = await pool.query(
      `SELECT m.*, k.nom as kategoriya_nom
       FROM mahsulotlar m
       LEFT JOIN kategoriyalar k ON m.kategoriya_id = k.id
       WHERE m.barkod = $1 AND m.faol = true`,
      [barkod]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ xato: 'Mahsulot topilmadi.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Bitta mahsulot
const bittaMahsulot = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT m.*, k.nom as kategoriya_nom
       FROM mahsulotlar m
       LEFT JOIN kategoriyalar k ON m.kategoriya_id = k.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ xato: 'Mahsulot topilmadi.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Mahsulot qo'shish
const mahsulotQoshish = async (req, res) => {
  try {
    const { nom, barkod, kategoriya_id, sotish_narxi, sotib_olish_narxi, qoldiq, min_qoldiq, birlik } = req.body;

    if (!nom || !sotish_narxi) {
      return res.status(400).json({ xato: 'Nom va sotish narxi kiritilishi shart.' });
    }

    const rasm = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO mahsulotlar (nom, barkod, kategoriya_id, sotish_narxi, sotib_olish_narxi, qoldiq, min_qoldiq, birlik, rasm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nom, barkod || null, kategoriya_id || null, sotish_narxi, sotib_olish_narxi || 0, qoldiq || 0, min_qoldiq || 5, birlik || 'dona', rasm]
    );

    res.status(201).json({ mahsulot: result.rows[0], xabar: 'Mahsulot muvaffaqiyatli qo\'shildi.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ xato: 'Bu barkod allaqachon mavjud.' });
    }
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Mahsulot tahrirlash
const mahsulotTahrirlash = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, barkod, kategoriya_id, sotish_narxi, sotib_olish_narxi, min_qoldiq, birlik, faol } = req.body;

    const mavjud = await pool.query('SELECT * FROM mahsulotlar WHERE id = $1', [id]);
    if (mavjud.rows.length === 0) {
      return res.status(404).json({ xato: 'Mahsulot topilmadi.' });
    }

    const rasm = req.file ? `/uploads/${req.file.filename}` : mavjud.rows[0].rasm;

    const result = await pool.query(
      `UPDATE mahsulotlar
       SET nom=$1, barkod=$2, kategoriya_id=$3, sotish_narxi=$4, sotib_olish_narxi=$5,
           min_qoldiq=$6, birlik=$7, faol=$8, rasm=$9, yangilangan=NOW()
       WHERE id=$10
       RETURNING *`,
      [
        nom || mavjud.rows[0].nom,
        barkod || mavjud.rows[0].barkod,
        kategoriya_id || mavjud.rows[0].kategoriya_id,
        sotish_narxi || mavjud.rows[0].sotish_narxi,
        sotib_olish_narxi ?? mavjud.rows[0].sotib_olish_narxi,
        min_qoldiq ?? mavjud.rows[0].min_qoldiq,
        birlik || mavjud.rows[0].birlik,
        faol !== undefined ? faol : mavjud.rows[0].faol,
        rasm,
        id,
      ]
    );

    res.json({ mahsulot: result.rows[0], xabar: 'Mahsulot yangilandi.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ xato: 'Bu barkod allaqachon mavjud.' });
    }
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Mahsulot o'chirish (soft delete)
const mahsulotOchirish = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE mahsulotlar SET faol = false WHERE id = $1', [id]);
    res.json({ xabar: 'Mahsulot o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Kategoriyalar
const kategoriyalar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kategoriyalar WHERE faol = true ORDER BY nom');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

const kategoriyaQoshish = async (req, res) => {
  try {
    const { nom, tavsif } = req.body;
    if (!nom) return res.status(400).json({ xato: 'Kategoriya nomi kiritilishi shart.' });

    const result = await pool.query(
      'INSERT INTO kategoriyalar (nom, tavsif) VALUES ($1, $2) RETURNING *',
      [nom, tavsif || null]
    );
    res.status(201).json({ kategoriya: result.rows[0], xabar: 'Kategoriya qo\'shildi.' });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Kam qoldiq mahsulotlar
const kamQoldiqlar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM mahsulotlar
       WHERE qoldiq <= min_qoldiq AND faol = true
       ORDER BY qoldiq ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

module.exports = {
  barchaMahsulotlar, bittaMahsulot, barkodBilan,
  mahsulotQoshish, mahsulotTahrirlash, mahsulotOchirish,
  kategoriyalar, kategoriyaQoshish, kamQoldiqlar
};
