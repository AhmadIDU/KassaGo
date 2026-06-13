# 🏬 Baraka POS — Kassa Tizimi

**Baraka do'koni uchun to'liq Hybrid POS tizimi**
Online + Offline ishlaydi | O'zbek tili | Chiroyli interfeys

---

## 📁 Loyiha strukturasi

```
baraka-pos/
├── backend/          → Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── config/   → Database, migration, seed
│   │   ├── controllers/ → Biznes logika
│   │   ├── middleware/  → Auth, error handler
│   │   ├── routes/   → API yo'llari
│   │   └── server.js → Asosiy server
│   └── package.json
└── frontend/         → React + Tailwind CSS
    ├── src/
    │   ├── pages/    → Login, Dashboard, Kassa, Mahsulotlar, Ombor, Hisobotlar
    │   ├── components/ → Layout, common components
    │   ├── store/    → Zustand state management
    │   ├── services/ → IndexedDB (offline)
    │   └── utils/    → API, format helpers
    └── package.json
```

---

## 🚀 Ishga tushirish

### 1. PostgreSQL database yaratish
```sql
CREATE DATABASE baraka_pos;
```

### 2. Backend sozlash
```bash
cd backend
cp .env.example .env
# .env faylida DB ma'lumotlarini to'ldiring

npm install
npm run db:migrate   # Jadvallar yaratish
npm run db:seed      # Test ma'lumotlar kiritish
npm run dev          # Server ishga tushirish (port: 5000)
```

### 3. Frontend sozlash
```bash
cd frontend
npm install
npm start            # (port: 3000)
```

---

## 🔐 Test foydalanuvchilar

| Login | Parol | Rol |
|-------|-------|-----|
| admin | admin123 | Admin |
| kassir | kassir123 | Kassir |

---

## 📋 Modullar

| Modul | Funksiya |
|-------|----------|
| 🔐 Login | JWT autentifikatsiya |
| 🏠 Dashboard | Kunlik statistika, grafiklar |
| 🛒 Kassa | Savdo, barkod, to'lov, chek |
| 📦 Mahsulotlar | CRUD, kategoriya, barkod |
| 🏪 Ombor | Kirim/chiqim, qoldiq hisobi |
| 📊 Hisobotlar | Kunlik/oylik grafiklar |
| 👥 Foydalanuvchilar | Admin panel |

---

## 🌐 API Endpointlar

```
POST   /api/auth/login              → Kirish
GET    /api/auth/men                → Joriy user
GET    /api/mahsulotlar             → Mahsulotlar ro'yxati
POST   /api/mahsulotlar             → Mahsulot qo'shish
GET    /api/mahsulotlar/barkod/:kod → Barkod qidirish
POST   /api/savdo                   → Savdo yaratish
GET    /api/savdo                   → Savdolar ro'yxati
POST   /api/ombor/kirim             → Tovar kirim
GET    /api/ombor/hisobot           → Ombor hisoboti
GET    /api/hisobot/dashboard       → Dashboard statistika
GET    /api/hisobot/kunlik          → Kunlik hisobot
GET    /api/hisobot/oylik           → Oylik hisobot
```

---

## 💡 Offline rejim

Internet uzilsa:
- Mahsulotlar **IndexedDB** cache'dan yuklanadi
- Savdolar **lokal** saqlanadi
- Internet qaytganda **avtomatik sync** bo'ladi

---

**Baraka POS v1.0.0** | Node.js + React + PostgreSQL
