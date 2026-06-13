const pool = require('./database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Admin foydalanuvchi yaratish
    const parol = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO foydalanuvchilar (ism, login, parol, rol)
      VALUES ('Administrator', 'admin', $1, 'admin')
      ON CONFLICT (login) DO NOTHING;
    `, [parol]);

    // Kassir yaratish
    const kassirParol = await bcrypt.hash('kassir123', 10);
    await client.query(`
      INSERT INTO foydalanuvchilar (ism, login, parol, rol)
      VALUES ('Kassir 1', 'kassir', $1, 'kassir')
      ON CONFLICT (login) DO NOTHING;
    `, [kassirParol]);

    // Kategoriyalar yaratish
    const kategoriyalar = ['Oziq-ovqat', 'Ichimliklar', 'Sanoat mollari', 'Kosmetika', 'Boshqa'];
    for (const kat of kategoriyalar) {
      await client.query(`
        INSERT INTO kategoriyalar (nom) VALUES ($1)
        ON CONFLICT DO NOTHING;
      `, [kat]);
    }

    // Namuna mahsulotlar
    const katRes = await client.query('SELECT id FROM kategoriyalar LIMIT 1');
    const katId = katRes.rows[0]?.id;

    if (katId) {
      const mahsulotlar = [
        { nom: 'Non', barkod: '4600001', narx: 3000, sotib_olish: 2500, qoldiq: 50 },
        { nom: 'Qand', barkod: '4600002', narx: 15000, sotib_olish: 12000, qoldiq: 30 },
        { nom: 'Tuz (1kg)', barkod: '4600003', narx: 5000, sotib_olish: 3500, qoldiq: 20 },
        { nom: 'Yog\' (1L)', barkod: '4600004', narx: 25000, sotib_olish: 20000, qoldiq: 15 },
        { nom: 'Guruch (1kg)', barkod: '4600005', narx: 12000, sotib_olish: 9000, qoldiq: 40 },
      ];

      for (const m of mahsulotlar) {
        await client.query(`
          INSERT INTO mahsulotlar (nom, barkod, kategoriya_id, sotish_narxi, sotib_olish_narxi, qoldiq)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (barkod) DO NOTHING;
        `, [m.nom, m.barkod, katId, m.narx, m.sotib_olish, m.qoldiq]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Test ma\'lumotlar muvaffaqiyatli kiritildi!');
    console.log('👤 Admin: login=admin, parol=admin123');
    console.log('👤 Kassir: login=kassir, parol=kassir123');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed xatosi:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

seedData().catch(console.error);
