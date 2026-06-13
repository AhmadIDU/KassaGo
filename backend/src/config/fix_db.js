const pool = require('./database');

const fixDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // mijozlar jadvaliga yangilangan ustunini qo'shish (agar yo'q bo'lsa)
    await client.query(`
      ALTER TABLE mijozlar
      ADD COLUMN IF NOT EXISTS yangilangan TIMESTAMP DEFAULT NOW();
    `);

    // mijozlar jadvaliga manzil va izoh ustunlarini qo'shish (agar yo'q bo'lsa)
    await client.query(`
      ALTER TABLE mijozlar
      ADD COLUMN IF NOT EXISTS manzil VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE mijozlar
      ADD COLUMN IF NOT EXISTS izoh TEXT;
    `);

    // savdolar jadvaliga mijoz_id ustunini qo'shish (agar yo'q bo'lsa)
    await client.query(`
      ALTER TABLE savdolar
      ADD COLUMN IF NOT EXISTS mijoz_id INTEGER REFERENCES mijozlar(id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database muvaffaqiyatli yangilandi!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Xato:', err.message);
  } finally {
    client.release();
    pool.end();
  }
};

fixDatabase();
