const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Foydalanuvchilar jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS foydalanuvchilar (
        id SERIAL PRIMARY KEY,
        ism VARCHAR(100) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        parol VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'kassir' CHECK (rol IN ('admin', 'kassir')),
        faol BOOLEAN DEFAULT true,
        yaratilgan TIMESTAMP DEFAULT NOW(),
        yangilangan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Kategoriyalar jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS kategoriyalar (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        tavsif TEXT,
        faol BOOLEAN DEFAULT true,
        yaratilgan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Mahsulotlar jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS mahsulotlar (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(200) NOT NULL,
        barkod VARCHAR(50) UNIQUE,
        kategoriya_id INTEGER REFERENCES kategoriyalar(id),
        sotish_narxi DECIMAL(12,2) NOT NULL DEFAULT 0,
        sotib_olish_narxi DECIMAL(12,2) DEFAULT 0,
        qoldiq INTEGER DEFAULT 0,
        min_qoldiq INTEGER DEFAULT 5,
        birlik VARCHAR(20) DEFAULT 'dona',
        rasm VARCHAR(255),
        faol BOOLEAN DEFAULT true,
        yaratilgan TIMESTAMP DEFAULT NOW(),
        yangilangan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Savdolar jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS savdolar (
        id SERIAL PRIMARY KEY,
        chek_raqam VARCHAR(50) UNIQUE NOT NULL,
        kassir_id INTEGER REFERENCES foydalanuvchilar(id),
        jami_summa DECIMAL(12,2) NOT NULL DEFAULT 0,
        chegirma DECIMAL(12,2) DEFAULT 0,
        tolov_turi VARCHAR(20) DEFAULT 'naqd' CHECK (tolov_turi IN ('naqd', 'karta', 'nasiya')),
        tolov_summasi DECIMAL(12,2) DEFAULT 0,
        qaytim DECIMAL(12,2) DEFAULT 0,
        holat VARCHAR(20) DEFAULT 'yakunlangan' CHECK (holat IN ('yakunlangan', 'bekor')),
        offline_id VARCHAR(100),
        synced BOOLEAN DEFAULT true,
        yaratilgan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Savdo elementlari jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS savdo_elementlari (
        id SERIAL PRIMARY KEY,
        savdo_id INTEGER REFERENCES savdolar(id) ON DELETE CASCADE,
        mahsulot_id INTEGER REFERENCES mahsulotlar(id),
        mahsulot_nom VARCHAR(200),
        miqdor INTEGER NOT NULL DEFAULT 1,
        narx DECIMAL(12,2) NOT NULL,
        chegirma DECIMAL(12,2) DEFAULT 0,
        jami DECIMAL(12,2) NOT NULL
      );
    `);

    // Ombor kirim/chiqim jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS ombor_harakatlari (
        id SERIAL PRIMARY KEY,
        mahsulot_id INTEGER REFERENCES mahsulotlar(id),
        harakat_turi VARCHAR(20) CHECK (harakat_turi IN ('kirim', 'chiqim', 'tuzatish')),
        miqdor INTEGER NOT NULL,
        narx DECIMAL(12,2),
        sabab TEXT,
        foydalanuvchi_id INTEGER REFERENCES foydalanuvchilar(id),
        yaratilgan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Mijozlar (nasiya uchun)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mijozlar (
        id SERIAL PRIMARY KEY,
        ism VARCHAR(100) NOT NULL,
        telefon VARCHAR(20),
        nasiya_summasi DECIMAL(12,2) DEFAULT 0,
        faol BOOLEAN DEFAULT true,
        yaratilgan TIMESTAMP DEFAULT NOW()
      );
    `);

    // Nastoyalar jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS nastoyalar (
        id SERIAL PRIMARY KEY,
        kalit VARCHAR(100) UNIQUE NOT NULL,
        qiymat TEXT,
        tavsif VARCHAR(255)
      );
    `);

    // Default nastoyalar
    await client.query(`
      INSERT INTO nastoyalar (kalit, qiymat, tavsif) VALUES
        ('dokon_nomi', 'Baraka Do''kon', 'Do''kon nomi'),
        ('dokon_manzili', 'Toshkent, O''zbekiston', 'Do''kon manzili'),
        ('dokon_telefon', '+998 90 000 00 00', 'Do''kon telefoni'),
        ('valyuta', 'so''m', 'Valyuta'),
        ('chek_izoh', 'Xaridingiz uchun rahmat!', 'Chek pastki yozuv')
      ON CONFLICT (kalit) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Barcha jadvallar muvaffaqiyatli yaratildi!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration xatosi:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

createTables().catch(console.error);
