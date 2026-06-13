import { openDB } from 'idb';

const DB_NOMI = 'baraka-pos-offline';
const DB_VERSIYA = 1;

// IndexedDB ochish
export const dbOchish = async () => {
  return openDB(DB_NOMI, DB_VERSIYA, {
    upgrade(db) {
      // Offline savdolar
      if (!db.objectStoreNames.contains('offline_savdolar')) {
        const store = db.createObjectStore('offline_savdolar', { keyPath: 'offline_id' });
        store.createIndex('synced', 'synced');
      }

      // Mahsulotlar cache
      if (!db.objectStoreNames.contains('mahsulotlar_cache')) {
        db.createObjectStore('mahsulotlar_cache', { keyPath: 'id' });
      }

      // Kategoriyalar cache
      if (!db.objectStoreNames.contains('kategoriyalar_cache')) {
        db.createObjectStore('kategoriyalar_cache', { keyPath: 'id' });
      }
    },
  });
};

// Offline savdo saqlash
export const offlineSavdoSaqlash = async (savdo) => {
  const db = await dbOchish();
  const offline_id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const savdoMalumot = {
    ...savdo,
    offline_id,
    synced: false,
    yaratilgan: new Date().toISOString(),
  };
  await db.put('offline_savdolar', savdoMalumot);
  return savdoMalumot;
};

// Sync bo'lmagan savdolarni olish
export const offlineSavdolarniOlish = async () => {
  const db = await dbOchish();
  return db.getAllFromIndex('offline_savdolar', 'synced', false);
};

// Savdoni sync deb belgilash
export const savdoSyncBelgilash = async (offline_id) => {
  const db = await dbOchish();
  const savdo = await db.get('offline_savdolar', offline_id);
  if (savdo) {
    await db.put('offline_savdolar', { ...savdo, synced: true });
  }
};

// Mahsulotlarni cache ga saqlash
export const mahsulotlarCacheSaqlash = async (mahsulotlar) => {
  const db = await dbOchish();
  const tx = db.transaction('mahsulotlar_cache', 'readwrite');
  await tx.objectStore('mahsulotlar_cache').clear();
  for (const m of mahsulotlar) {
    await tx.objectStore('mahsulotlar_cache').put(m);
  }
  await tx.done;
};

// Cache dan mahsulotlarni olish
export const mahsulotlarCacheOlish = async () => {
  const db = await dbOchish();
  return db.getAll('mahsulotlar_cache');
};

// Barkod bo'yicha mahsulot topish (cache dan)
export const barkodBilanTopish = async (barkod) => {
  const mahsulotlar = await mahsulotlarCacheOlish();
  return mahsulotlar.find(m => m.barkod === barkod) || null;
};

// Online holatni tekshirish
export const onlineMi = () => navigator.onLine;
