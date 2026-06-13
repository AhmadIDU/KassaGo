const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Chek raqam generatsiya
const chekRaqamYaratish = () => {
  const sana = new Date();
  const kun = sana.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CHK-${kun}-${random}`;
};

// Yangi savdo yaratish
const savdoYaratish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { elementlar, tolov_turi, tolov_summasi, chegirma, offline_id, mijoz_id } = req.body;

    if (!elementlar || elementlar.length === 0) {
      return res.status(400).json({ xato: 'Savdo elementlari bo\'sh.' });
    }

    // Har bir mahsulotni tekshirish va narxini olish
    let jami_summa = 0;
    const tasdiqlanganElementlar = [];

    for (const el of elementlar) {
      const mRes = await client.query(
        'SELECT * FROM mahsulotlar WHERE id = $1 AND faol = true',
        [el.mahsulot_id]
      );

      if (mRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ xato: `Mahsulot topilmadi: ID ${el.mahsulot_id}` });
      }

      const mahsulot = mRes.rows[0];

      if (mahsulot.qoldiq < el.miqdor) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          xato: `"${mahsulot.nom}" mahsuloti yetarli emas. Qoldiq: ${mahsulot.qoldiq}`
        });
      }

      const elNarx = el.narx || mahsulot.sotish_narxi;
      const elChegirma = el.chegirma || 0;
      const elJami = (elNarx - elChegirma) * el.miqdor;
      jami_summa += elJami;

      tasdiqlanganElementlar.push({
        mahsulot_id: mahsulot.id,
        mahsulot_nom: mahsulot.nom,
        miqdor: el.miqdor,
        narx: elNarx,
        chegirma: elChegirma,
        jami: elJami,
      });
    }

    const umumiy_chegirma = chegirma || 0;
    const yakuniy_summa = jami_summa - umumiy_chegirma;
    const haqiqiy_tolov = tolov_summasi || yakuniy_summa;
    const qaytim = haqiqiy_tolov - yakuniy_summa;

    const chek_raqam = chekRaqamYaratish();

    // Savdo yaratish
    const savdoRes = await client.query(
      `INSERT INTO savdolar (chek_raqam, kassir_id, jami_summa, chegirma, tolov_turi, tolov_summasi, qaytim, offline_id, synced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [chek_raqam, req.foydalanuvchi.id, yakuniy_summa, umumiy_chegirma, tolov_turi || 'naqd', haqiqiy_tolov, Math.max(0, qaytim), offline_id || null, true]
    );

    const savdo = savdoRes.rows[0];

    // Elementlarni saqlash va qoldiqni kamaytirish
    for (const el of tasdiqlanganElementlar) {
      await client.query(
        `INSERT INTO savdo_elementlari (savdo_id, mahsulot_id, mahsulot_nom, miqdor, narx, chegirma, jami)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [savdo.id, el.mahsulot_id, el.mahsulot_nom, el.miqdor, el.narx, el.chegirma, el.jami]
      );

      // Qoldiqni kamaytirish
      await client.query(
        'UPDATE mahsulotlar SET qoldiq = qoldiq - $1, yangilangan = NOW() WHERE id = $2',
        [el.miqdor, el.mahsulot_id]
      );

      // Ombor harakati
      await client.query(
        `INSERT INTO ombor_harakatlari (mahsulot_id, harakat_turi, miqdor, sabab, foydalanuvchi_id)
         VALUES ($1, 'chiqim', $2, $3, $4)`,
        [el.mahsulot_id, el.miqdor, `Savdo #${chek_raqam}`, req.foydalanuvchi.id]
      );
    }

    await client.query('COMMIT');

    // ✅ Nasiya bo'lsa — qarzdarlar ro'yxatiga qo'shish
    if (tolov_turi === 'nasiya' && mijoz_id) {
      try {
        // Nasiya jadvaliga qo'shish
        await pool.query(
          `INSERT INTO nasiyalar (mijoz_id, savdo_id, summa, qolgan_summa, izoh, kassir_id)
           VALUES ($1, $2, $3, $3, $4, $5)`,
          [mijoz_id, savdo.id, yakuniy_summa, `Savdo #${chek_raqam}`, req.foydalanuvchi.id]
        );

        // Mijoz umumiy qarzini yangilash
        await pool.query(
          'UPDATE mijozlar SET nasiya_summasi = nasiya_summasi + $1, yangilangan = NOW() WHERE id = $2',
          [yakuniy_summa, mijoz_id]
        );
      } catch (nasiyaErr) {
        console.error('Nasiya yozishda xato:', nasiyaErr);
      }
    }

    // To'liq savdo ma'lumotini qaytarish
    const elementlarRes = await pool.query(
      'SELECT * FROM savdo_elementlari WHERE savdo_id = $1',
      [savdo.id]
    );

    res.status(201).json({
      savdo: { ...savdo, elementlar: elementlarRes.rows },
      xabar: 'Savdo muvaffaqiyatli amalga oshirildi!',
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Savdo xatosi:', err);
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Savdolar ro'yxati
const savdolarRoyxati = async (req, res) => {
  try {
    const { sana_dan, sana_gacha, kassir_id, tolov_turi, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT s.*, f.ism as kassir_ism
      FROM savdolar s
      LEFT JOIN foydalanuvchilar f ON s.kassir_id = f.id
      WHERE s.holat = 'yakunlangan'
    `;
    const params = [];
    let idx = 1;

    if (sana_dan) {
      query += ` AND s.yaratilgan >= $${idx++}`;
      params.push(sana_dan);
    }
    if (sana_gacha) {
      query += ` AND s.yaratilgan <= $${idx++}`;
      params.push(sana_gacha + ' 23:59:59');
    }
    if (kassir_id) {
      query += ` AND s.kassir_id = $${idx++}`;
      params.push(kassir_id);
    }
    if (tolov_turi) {
      query += ` AND s.tolov_turi = $${idx++}`;
      params.push(tolov_turi);
    }

    query += ` ORDER BY s.yaratilgan DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Bitta savdo
const bittaSavdo = async (req, res) => {
  try {
    const { id } = req.params;

    const savdoRes = await pool.query(
      `SELECT s.*, f.ism as kassir_ism
       FROM savdolar s
       LEFT JOIN foydalanuvchilar f ON s.kassir_id = f.id
       WHERE s.id = $1`,
      [id]
    );

    if (savdoRes.rows.length === 0) {
      return res.status(404).json({ xato: 'Savdo topilmadi.' });
    }

    const elementlarRes = await pool.query(
      'SELECT * FROM savdo_elementlari WHERE savdo_id = $1',
      [id]
    );

    res.json({ ...savdoRes.rows[0], elementlar: elementlarRes.rows });
  } catch (err) {
    res.status(500).json({ xato: 'Server xatosi.' });
  }
};

// Savdoni bekor qilish
const savdoBekorQilish = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const savdoRes = await client.query('SELECT * FROM savdolar WHERE id = $1', [id]);
    if (savdoRes.rows.length === 0) {
      return res.status(404).json({ xato: 'Savdo topilmadi.' });
    }

    if (savdoRes.rows[0].holat === 'bekor') {
      return res.status(400).json({ xato: 'Bu savdo allaqachon bekor qilingan.' });
    }

    // Qoldiqni qaytarish
    const elementlar = await client.query(
      'SELECT * FROM savdo_elementlari WHERE savdo_id = $1', [id]
    );

    for (const el of elementlar.rows) {
      await client.query(
        'UPDATE mahsulotlar SET qoldiq = qoldiq + $1 WHERE id = $2',
        [el.miqdor, el.mahsulot_id]
      );
    }

    await client.query('UPDATE savdolar SET holat = $1 WHERE id = $2', ['bekor', id]);
    await client.query('COMMIT');

    res.json({ xabar: 'Savdo bekor qilindi va qoldiqlar qaytarildi.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ xato: 'Server xatosi.' });
  } finally {
    client.release();
  }
};

// Offline savdolarni sync qilish
const offlineSyncQilish = async (req, res) => {
  const { savdolar } = req.body;
  const natijalar = [];

  for (const savdo of savdolar) {
    try {
      // offline_id mavjudligini tekshirish
      const mavjud = await pool.query(
        'SELECT id FROM savdolar WHERE offline_id = $1', [savdo.offline_id]
      );

      if (mavjud.rows.length > 0) {
        natijalar.push({ offline_id: savdo.offline_id, holat: 'mavjud', savdo_id: mavjud.rows[0].id });
        continue;
      }

      // Yangi savdo sifatida saqlash
      const fakeReq = { body: savdo, foydalanuvchi: req.foydalanuvchi };
      // Oddiy yozish (to'liq validatsiyasiz)
      const chek_raqam = savdo.chek_raqam || chekRaqamYaratish();
      const savdoRes = await pool.query(
        `INSERT INTO savdolar (chek_raqam, kassir_id, jami_summa, chegirma, tolov_turi, tolov_summasi, qaytim, offline_id, synced, yaratilgan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) RETURNING *`,
        [chek_raqam, req.foydalanuvchi.id, savdo.jami_summa, savdo.chegirma || 0,
         savdo.tolov_turi || 'naqd', savdo.tolov_summasi || savdo.jami_summa,
         savdo.qaytim || 0, savdo.offline_id, savdo.yaratilgan || new Date()]
      );

      natijalar.push({ offline_id: savdo.offline_id, holat: 'saqlandi', savdo_id: savdoRes.rows[0].id });
    } catch (err) {
      natijalar.push({ offline_id: savdo.offline_id, holat: 'xato', xato: err.message });
    }
  }

  res.json({ natijalar, xabar: `${natijalar.filter(n => n.holat === 'saqlandi').length} ta savdo sync qilindi.` });
};

module.exports = {
  savdoYaratish, savdolarRoyxati, bittaSavdo, savdoBekorQilish, offlineSyncQilish
};
