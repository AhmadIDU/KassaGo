import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { pulFormat } from '../utils/format';
import { onlineMi, offlineSavdoSaqlash, mahsulotlarCacheSaqlash, mahsulotlarCacheOlish, barkodBilanTopish } from '../services/offlineDB';
import toast from 'react-hot-toast';
import BarkodScanner from '../components/common/BarkodScanner';

const DEMO_MIJOZLAR = [
  { id: 1, ism: 'Karimov Sardor', telefon: '+998901234567', nasiya_summasi: 150000 },
  { id: 2, ism: 'Rahimova Malika', telefon: '+998909876543', nasiya_summasi: 75000 },
  { id: 3, ism: 'Toshmatov Jasur', telefon: '+998911112233', nasiya_summasi: 320000 },
  { id: 4, ism: 'Yusupova Dilnoza', telefon: '+998935556677', nasiya_summasi: 0 },
];

// Yangi mijoz qo'shish mini modali
function YangiMijozModal({ yopish, saqlash }) {
  const [form, setForm] = useState({ ism: '', telefon: '', manzil: '' });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-base">👤 Yangi qarzdar qo'shish</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Ism familiya *</label>
            <input
              className="input-field mt-1"
              value={form.ism}
              onChange={e => setForm({ ...form, ism: e.target.value })}
              placeholder="Mijoz ismi"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Telefon raqam</label>
            <input
              className="input-field mt-1"
              value={form.telefon}
              onChange={e => setForm({ ...form, telefon: e.target.value })}
              placeholder="+998 90 000 00 00"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Manzil</label>
            <input
              className="input-field mt-1"
              value={form.manzil}
              onChange={e => setForm({ ...form, manzil: e.target.value })}
              placeholder="Yashash joyi (ixtiyoriy)"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={yopish} className="btn-secondary flex-1 text-sm">Bekor</button>
            <button
              onClick={() => {
                if (!form.ism.trim()) { toast.error('Ism kiritilishi shart!'); return; }
                saqlash(form);
              }}
              className="btn-primary flex-1 text-sm"
            >
              ✅ Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mijoz tanlash komponenti (nasiya uchun)
function MijozTanlash({ tanlangan, onTanlash, mijozlar, onMijozQoshildi }) {
  const [qidiruv, setQidiruv] = useState('');
  const [ochiq, setOchiq] = useState(false);
  const [yangiMijozModal, setYangiMijozModal] = useState(false);

  const filtrlangan = mijozlar.filter(m =>
    !qidiruv ||
    m.ism.toLowerCase().includes(qidiruv.toLowerCase()) ||
    m.telefon?.includes(qidiruv)
  );

  const yangiMijozSaqlash = async (form) => {
    try {
      const res = await api.post('/nasiya/mijozlar', form);
      const yangiMijoz = res.data.mijoz;
      toast.success(`✅ ${yangiMijoz.ism} qo'shildi va tanlandi!`);
      onMijozQoshildi(yangiMijoz);
      onTanlash(yangiMijoz);
      setYangiMijozModal(false);
      setOchiq(false);
    } catch {
      // Demo rejim
      const demoMijoz = {
        id: Date.now(),
        ism: form.ism,
        telefon: form.telefon,
        manzil: form.manzil,
        nasiya_summasi: 0,
      };
      toast.success(`✅ ${demoMijoz.ism} qo'shildi! (Demo)`);
      onMijozQoshildi(demoMijoz);
      onTanlash(demoMijoz);
      setYangiMijozModal(false);
      setOchiq(false);
    }
  };

  return (
    <div className="relative">
      <label className="text-xs text-gray-500 font-medium mb-1 block">
        📝 Mijoz (nasiya uchun) *
      </label>
      {tanlangan ? (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-medium text-orange-800">{tanlangan.ism}</p>
            <p className="text-xs text-orange-500">
              {tanlangan?.telefon || '—'} • Mavjud qarz: {pulFormat(tanlangan.nasiya_summasi)}
            </p>
          </div>
          <button
            onClick={() => onTanlash(null)}
            className="text-orange-400 hover:text-orange-600 ml-2 text-lg"
          >✕</button>
        </div>
      ) : (
        <div>
          <div className="relative">
            <input
              type="text"
              value={qidiruv}
              onChange={e => { setQidiruv(e.target.value); setOchiq(true); }}
              onFocus={() => setOchiq(true)}
              placeholder="Mijoz ism yoki telefon qidiring..."
              className="input-field text-sm pr-10"
              autoFocus
            />
          </div>

          {ochiq && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden">
              {/* Yangi qarzdar qo'shish tugmasi — har doim ko'rinadi */}
              <button
                onClick={() => { setYangiMijozModal(true); setOchiq(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm border-b border-blue-100 transition-colors"
              >
                <span className="text-base">➕</span>
                <span>Yangi qarzdar qo'shish</span>
              </button>

              {/* Mavjud mijozlar */}
              <div className="max-h-44 overflow-y-auto">
                {filtrlangan.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Mijoz topilmadi</p>
                ) : (
                  filtrlangan.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { onTanlash(m); setOchiq(false); setQidiruv(''); }}
                      className="w-full flex justify-between items-center px-3 py-2 hover:bg-orange-50 text-left border-b last:border-0 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{m.ism}</p>
                        <p className="text-xs text-gray-400">{m.telefon || '—'}</p>
                      </div>
                      <div className="text-right ml-2">
                        {m.nasiya_summasi > 0 ? (
                          <span className="text-xs text-red-500 font-medium badge-red">
                            {pulFormat(m.nasiya_summasi)}
                          </span>
                        ) : (
                          <span className="text-xs text-green-500">Qarz yo'q</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yangi mijoz modali */}
      {yangiMijozModal && (
        <YangiMijozModal
          yopish={() => setYangiMijozModal(false)}
          saqlash={yangiMijozSaqlash}
        />
      )}
    </div>
  );
}

export default function Kassa() {
  const [mahsulotlar, setMahsulotlar] = useState([]);
  const [mijozlar, setMijozlar] = useState([]);
  const [tanlanganMijoz, setTanlanganMijoz] = useState(null);
  const [savat, setSavat] = useState([]);
  const [qidiruv, setQidiruv] = useState('');
  const [filtrMahsulotlar, setFiltrMahsulotlar] = useState([]);
  const [tolovTuri, setTolovTuri] = useState('naqd');
  const [tolovSummasi, setTolovSummasi] = useState('');
  const [chegirma, setChegirma] = useState(0);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [chekModal, setChekModal] = useState(null);
  const [scannerOchiq, setScannerOchiq] = useState(false);
  const qidiruvRef = useRef(null);

  useEffect(() => {
    mahsulotlarYuklash();
    mijozlarYuklash();
    qidiruvRef.current?.focus();
  }, []);

  useEffect(() => {
    if (qidiruv.length >= 1) {
      const filtr = mahsulotlar.filter(m =>
        m.nom.toLowerCase().includes(qidiruv.toLowerCase()) ||
        m.barkod?.includes(qidiruv)
      );
      setFiltrMahsulotlar(filtr.slice(0, 20));
    } else {
      setFiltrMahsulotlar([]);
    }
  }, [qidiruv, mahsulotlar]);

  const mahsulotlarYuklash = async () => {
    try {
      if (onlineMi()) {
        const res = await api.get('/mahsulotlar');
        setMahsulotlar(res.data);
        await mahsulotlarCacheSaqlash(res.data);
      } else {
        const cache = await mahsulotlarCacheOlish();
        setMahsulotlar(cache);
        toast('📴 Offline rejim - cache ma\'lumotlar ishlatilmoqda', { icon: '⚠️' });
      }
    } catch {
      // Backend yo'q — demo mahsulotlar
      const cache = await mahsulotlarCacheOlish();
      if (cache.length > 0) {
        setMahsulotlar(cache);
      } else {
        const demoMahsulotlar = [
          // 🍞 Non-novvot
          { id: 1,  nom: 'Non (oq)',         barkod: '4600001', sotish_narxi: 3000,  qoldiq: 80,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Non-novvot' },
          { id: 2,  nom: 'Non (qora)',        barkod: '4600002', sotish_narxi: 3500,  qoldiq: 60,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Non-novvot' },
          { id: 3,  nom: 'Lavash',            barkod: '4600003', sotish_narxi: 5000,  qoldiq: 40,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Non-novvot' },
          { id: 4,  nom: 'Bulochka',          barkod: '4600004', sotish_narxi: 2000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Non-novvot' },
          // 🧂 Quruq ozuqalar
          { id: 5,  nom: 'Qand (1kg)',        barkod: '4600005', sotish_narxi: 15000, qoldiq: 50,  birlik: 'kg',   min_qoldiq: 10, kategoriya_nom: 'Quruq ozuqa' },
          { id: 6,  nom: 'Tuz (1kg)',         barkod: '4600006', sotish_narxi: 5000,  qoldiq: 45,  birlik: 'kg',   min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          { id: 7,  nom: 'Un (2kg)',          barkod: '4600007', sotish_narxi: 18000, qoldiq: 35,  birlik: 'kg',   min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          { id: 8,  nom: 'Guruch (1kg)',      barkod: '4600008', sotish_narxi: 12000, qoldiq: 60,  birlik: 'kg',   min_qoldiq: 10, kategoriya_nom: 'Quruq ozuqa' },
          { id: 9,  nom: 'Makaron (450g)',    barkod: '4600009', sotish_narxi: 8000,  qoldiq: 55,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Quruq ozuqa' },
          { id: 10, nom: 'Grechixa (800g)',   barkod: '4600010', sotish_narxi: 14000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          { id: 11, nom: 'Loviya (1kg)',      barkod: '4600011', sotish_narxi: 16000, qoldiq: 20,  birlik: 'kg',   min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          { id: 12, nom: 'No\'xat (1kg)',     barkod: '4600012', sotish_narxi: 18000, qoldiq: 20,  birlik: 'kg',   min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          { id: 13, nom: 'Mosh (1kg)',        barkod: '4600013', sotish_narxi: 15000, qoldiq: 18,  birlik: 'kg',   min_qoldiq: 5,  kategoriya_nom: 'Quruq ozuqa' },
          // 🛢️ Yog'-moylar
          { id: 14, nom: 'O\'simlik yog\'i (1L)',  barkod: '4600014', sotish_narxi: 25000, qoldiq: 40, birlik: 'litr', min_qoldiq: 5, kategoriya_nom: 'Yog\'-moy' },
          { id: 15, nom: 'O\'simlik yog\'i (5L)',  barkod: '4600015', sotish_narxi: 110000,qoldiq: 15, birlik: 'litr', min_qoldiq: 3, kategoriya_nom: 'Yog\'-moy' },
          { id: 16, nom: 'Margarin (200g)',    barkod: '4600016', sotish_narxi: 9000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Yog\'-moy' },
          // 🥛 Sut mahsulotlari
          { id: 17, nom: 'Sut (1L)',          barkod: '4600017', sotish_narxi: 12000, qoldiq: 35,  birlik: 'litr', min_qoldiq: 10, kategoriya_nom: 'Sut mahsulot' },
          { id: 18, nom: 'Kefir (1L)',        barkod: '4600018', sotish_narxi: 13000, qoldiq: 25,  birlik: 'litr', min_qoldiq: 5,  kategoriya_nom: 'Sut mahsulot' },
          { id: 19, nom: 'Qatiq (0.5L)',      barkod: '4600019', sotish_narxi: 8000,  qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Sut mahsulot' },
          { id: 20, nom: 'Pishloq (200g)',    barkod: '4600020', sotish_narxi: 28000, qoldiq: 15,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Sut mahsulot' },
          { id: 21, nom: 'Sariyog\' (200g)',  barkod: '4600021', sotish_narxi: 22000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Sut mahsulot' },
          // 🥚 Tuxum
          { id: 22, nom: 'Tuxum (10 dona)',   barkod: '4600022', sotish_narxi: 20000, qoldiq: 40,  birlik: 'quti', min_qoldiq: 5,  kategoriya_nom: 'Tuxum' },
          { id: 23, nom: 'Tuxum (30 dona)',   barkod: '4600023', sotish_narxi: 55000, qoldiq: 20,  birlik: 'quti', min_qoldiq: 3,  kategoriya_nom: 'Tuxum' },
          // ☕ Choy-qahva
          { id: 24, nom: 'Choy qora (100g)',  barkod: '4600024', sotish_narxi: 22000, qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Choy-qahva' },
          { id: 25, nom: 'Choy yashil (100g)',barkod: '4600025', sotish_narxi: 25000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Choy-qahva' },
          { id: 26, nom: 'Nescafe (95g)',     barkod: '4600026', sotish_narxi: 45000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Choy-qahva' },
          { id: 27, nom: 'Qahva (250g)',      barkod: '4600027', sotish_narxi: 65000, qoldiq: 12,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Choy-qahva' },
          // 🥤 Ichimliklar
          { id: 28, nom: 'Suv (0.5L)',        barkod: '4600028', sotish_narxi: 2500,  qoldiq: 100, birlik: 'dona', min_qoldiq: 20, kategoriya_nom: 'Ichimlik' },
          { id: 29, nom: 'Suv (1.5L)',        barkod: '4600029', sotish_narxi: 4000,  qoldiq: 80,  birlik: 'dona', min_qoldiq: 15, kategoriya_nom: 'Ichimlik' },
          { id: 30, nom: 'Coca-Cola (0.5L)',  barkod: '4600030', sotish_narxi: 9000,  qoldiq: 48,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Ichimlik' },
          { id: 31, nom: 'Pepsi (0.5L)',      barkod: '4600031', sotish_narxi: 8000,  qoldiq: 36,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Ichimlik' },
          { id: 32, nom: 'Fanta (0.5L)',      barkod: '4600032', sotish_narxi: 8000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Ichimlik' },
          { id: 33, nom: 'Lipton (0.5L)',     barkod: '4600033', sotish_narxi: 7000,  qoldiq: 24,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ichimlik' },
          { id: 34, nom: 'Sharbat (1L)',      barkod: '4600034', sotish_narxi: 12000, qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ichimlik' },
          { id: 35, nom: 'Kompot (3L)',       barkod: '4600035', sotish_narxi: 25000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ichimlik' },
          // 🍫 Shirinliklar
          { id: 36, nom: 'Shakar (Alenka)',   barkod: '4600036', sotish_narxi: 8000,  qoldiq: 40,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Shirinlik' },
          { id: 37, nom: 'Pechenye (300g)',   barkod: '4600037', sotish_narxi: 15000, qoldiq: 35,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Shirinlik' },
          { id: 38, nom: 'Konfet (1kg)',      barkod: '4600038', sotish_narxi: 40000, qoldiq: 20,  birlik: 'kg',   min_qoldiq: 3,  kategoriya_nom: 'Shirinlik' },
          { id: 39, nom: 'Vafel tort',        barkod: '4600039', sotish_narxi: 18000, qoldiq: 15,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Shirinlik' },
          { id: 40, nom: 'Zefir (200g)',      barkod: '4600040', sotish_narxi: 12000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Shirinlik' },
          // 🧹 Uy-ro'zg'or
          { id: 41, nom: 'Kir yuvish kukunи (450g)', barkod: '4600041', sotish_narxi: 18000, qoldiq: 25, birlik: 'dona', min_qoldiq: 5, kategoriya_nom: 'Uy-ro\'zg\'or' },
          { id: 42, nom: 'Idish yuvish (500ml)',     barkod: '4600042', sotish_narxi: 12000, qoldiq: 30, birlik: 'dona', min_qoldiq: 5, kategoriya_nom: 'Uy-ro\'zg\'or' },
          { id: 43, nom: 'Supurgi',                  barkod: '4600043', sotish_narxi: 25000, qoldiq: 10, birlik: 'dona', min_qoldiq: 2, kategoriya_nom: 'Uy-ro\'zg\'or' },
          { id: 44, nom: 'Latta (xo\'l)',             barkod: '4600044', sotish_narxi: 8000,  qoldiq: 15, birlik: 'dona', min_qoldiq: 3, kategoriya_nom: 'Uy-ro\'zg\'or' },
          { id: 45, nom: 'Paket (100 dona)',          barkod: '4600045', sotish_narxi: 5000,  qoldiq: 50, birlik: 'quti', min_qoldiq: 5, kategoriya_nom: 'Uy-ro\'zg\'or' },
          // 🧴 Gigiena
          { id: 46, nom: 'Shampun (200ml)',    barkod: '4600046', sotish_narxi: 35000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Gigiena' },
          { id: 47, nom: 'Sovun (90g)',        barkod: '4600047', sotish_narxi: 5000,  qoldiq: 40,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Gigiena' },
          { id: 48, nom: 'Tish pastasi',       barkod: '4600048', sotish_narxi: 15000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Gigiena' },
          { id: 49, nom: 'Dez. (roll-on)',     barkod: '4600049', sotish_narxi: 28000, qoldiq: 15,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Gigiena' },
          { id: 50, nom: 'Hajm krem (75ml)',   barkod: '4600050', sotish_narxi: 22000, qoldiq: 12,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Gigiena' },
          // 🌶️ Ziravorlar
          { id: 51, nom: 'Qalampir (50g)',     barkod: '4600051', sotish_narxi: 6000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ziravorlar' },
          { id: 52, nom: 'Zira (50g)',         barkod: '4600052', sotish_narxi: 8000,  qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ziravorlar' },
          { id: 53, nom: 'Koriander (50g)',    barkod: '4600053', sotish_narxi: 7000,  qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ziravorlar' },
          { id: 54, nom: 'Lavr yaprog\'i',     barkod: '4600054', sotish_narxi: 4000,  qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ziravorlar' },
          { id: 55, nom: 'Osh uchun ziravorlar',barkod: '4600055', sotish_narxi: 9000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Ziravorlar' },
          // 🥫 Konservalar
          { id: 56, nom: 'Pomidor pasta (380g)',barkod: '4600056', sotish_narxi: 12000, qoldiq: 30, birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Konserva' },
          { id: 57, nom: 'Tuna konserva',      barkod: '4600057', sotish_narxi: 22000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Konserva' },
          { id: 58, nom: 'Makkajo\'xori konserva',barkod: '4600058', sotish_narxi: 14000,qoldiq: 25, birlik: 'dona', min_qoldiq: 5, kategoriya_nom: 'Konserva' },
          { id: 59, nom: 'Nok mevasi konserva',barkod: '4600059', sotish_narxi: 18000, qoldiq: 15,  birlik: 'dona', min_qoldiq: 3,  kategoriya_nom: 'Konserva' },
          // 🍝 Sous-mayonez
          { id: 60, nom: 'Mayonez (200g)',     barkod: '4600060', sotish_narxi: 12000, qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Sous-mayonez' },
          { id: 61, nom: 'Ketchup (350g)',     barkod: '4600061', sotish_narxi: 14000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Sous-mayonez' },
          { id: 62, nom: 'Smetana (400g)',     barkod: '4600062', sotish_narxi: 16000, qoldiq: 20,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Sous-mayonez' },
          // 🍬 Mexmonlar uchun
          { id: 63, nom: 'Chipsи (100g)',      barkod: '4600063', sotish_narxi: 12000, qoldiq: 40,  birlik: 'dona', min_qoldiq: 10, kategoriya_nom: 'Snack' },
          { id: 64, nom: 'Cracker (125g)',     barkod: '4600064', sotish_narxi: 9000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Snack' },
          { id: 65, nom: 'Yeryong\'oq (150g)', barkod: '4600065', sotish_narxi: 10000, qoldiq: 25,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Snack' },
          { id: 66, nom: 'Semichka (200g)',    barkod: '4600066', sotish_narxi: 8000,  qoldiq: 30,  birlik: 'dona', min_qoldiq: 5,  kategoriya_nom: 'Snack' },
          // 🔦 Boshqa
          { id: 67, nom: 'Gugurt',             barkod: '4600067', sotish_narxi: 1500,  qoldiq: 100, birlik: 'dona', min_qoldiq: 20, kategoriya_nom: 'Boshqa' },
          { id: 68, nom: 'Sham (10 dona)',     barkod: '4600068', sotish_narxi: 8000,  qoldiq: 20,  birlik: 'quti', min_qoldiq: 5,  kategoriya_nom: 'Boshqa' },
          { id: 69, nom: 'Batareya (AA x2)',   barkod: '4600069', sotish_narxi: 12000, qoldiq: 15,  birlik: 'quti', min_qoldiq: 3,  kategoriya_nom: 'Boshqa' },
          { id: 70, nom: 'Selofan paket (S)',  barkod: '4600070', sotish_narxi: 500,   qoldiq: 200, birlik: 'dona', min_qoldiq: 50, kategoriya_nom: 'Boshqa' },
        ];
        setMahsulotlar(demoMahsulotlar);
        toast('🎭 Demo rejim — namuna mahsulotlar', { icon: '⚠️' });
      }
    }
  };

  const mijozlarYuklash = async () => {
    try {
      const res = await api.get('/nasiya/mijozlar');
      setMijozlar(res.data);
    } catch {
      setMijozlar(DEMO_MIJOZLAR);
    }
  };

  // Yangi mijoz qo'shilganda ro'yxatga qo'shish
  const mijozQoshildi = (yangiMijoz) => {
    setMijozlar(prev => [yangiMijoz, ...prev]);
  };

  // Kamera orqali barkod skanerlanganda
  const barkodSkanerlandi = async (barkod) => {
    setScannerOchiq(false);

    // Mahsulotlar ichidan qidirish
    let mahsulot = mahsulotlar.find(m => m.barkod === barkod);

    // Topilmasa backend dan qidirish
    if (!mahsulot && onlineMi()) {
      try {
        const res = await api.get(`/mahsulotlar/barkod/${barkod}`);
        mahsulot = res.data;
      } catch {}
    }

    // Offline cache dan qidirish
    if (!mahsulot) {
      mahsulot = await barkodBilanTopish(barkod);
    }

    if (mahsulot) {
      savatGaQoshish(mahsulot);
      toast.success(`✅ ${mahsulot.nom} savatga qo'shildi!`, { duration: 1500 });
    } else {
      toast.error(`❌ "${barkod}" barkodi topilmadi!`);
    }
    qidiruvRef.current?.focus();
  };

  // Barkod scanner uchun (klaviatura)
  const barkodSkanerlash = async (e) => {
    if (e.key === 'Enter' && qidiruv) {
      // Aniq barkod qidirish
      let mahsulot = mahsulotlar.find(m => m.barkod === qidiruv);

      if (!mahsulot && !onlineMi()) {
        mahsulot = await barkodBilanTopish(qidiruv);
      }

      if (mahsulot) {
        savatGaQoshish(mahsulot);
        setQidiruv('');
        setFiltrMahsulotlar([]);
      } else {
        toast.error(`"${qidiruv}" barkodi topilmadi`);
      }
    }
  };

  const savatGaQoshish = (mahsulot) => {
    if (mahsulot.qoldiq <= 0) {
      toast.error(`"${mahsulot.nom}" qoldig'i yo'q!`);
      return;
    }

    setSavat(prev => {
      const mavjud = prev.find(el => el.mahsulot_id === mahsulot.id);
      if (mavjud) {
        if (mavjud.miqdor >= mahsulot.qoldiq) {
          toast.error('Qoldiqdan ko\'p miqdor kiritib bo\'lmaydi!');
          return prev;
        }
        return prev.map(el =>
          el.mahsulot_id === mahsulot.id
            ? { ...el, miqdor: el.miqdor + 1, jami: (el.miqdor + 1) * el.narx }
            : el
        );
      }
      return [...prev, {
        mahsulot_id: mahsulot.id,
        mahsulot_nom: mahsulot.nom,
        narx: mahsulot.sotish_narxi,
        miqdor: 1,
        jami: mahsulot.sotish_narxi,
        max_qoldiq: mahsulot.qoldiq,
      }];
    });

    setQidiruv('');
    setFiltrMahsulotlar([]);
    qidiruvRef.current?.focus();
  };

  const miqdorOzgartirish = (mahsulot_id, yangi_miqdor) => {
    if (yangi_miqdor <= 0) {
      savatdanOchirish(mahsulot_id);
      return;
    }
    setSavat(prev =>
      prev.map(el =>
        el.mahsulot_id === mahsulot_id
          ? { ...el, miqdor: yangi_miqdor, jami: yangi_miqdor * el.narx }
          : el
      )
    );
  };

  const savatdanOchirish = (mahsulot_id) => {
    setSavat(prev => prev.filter(el => el.mahsulot_id !== mahsulot_id));
  };

  const savatTozalash = () => {
    setSavat([]);
    setTolovSummasi('');
    setChegirma(0);
    setTanlanganMijoz(null);
    setTolovTuri('naqd');
    qidiruvRef.current?.focus();
  };

  // Hisob-kitob
  const jamiSumma = savat.reduce((sum, el) => sum + el.jami, 0);
  const yakuniySumma = jamiSumma - (chegirma || 0);
  const qaytim = (parseFloat(tolovSummasi) || 0) - yakuniySumma;

  const savdoYakunlash = async () => {
    if (savat.length === 0) {
      toast.error('Savat bo\'sh!');
      return;
    }
    if (tolovTuri === 'naqd' && parseFloat(tolovSummasi) < yakuniySumma) {
      toast.error('To\'lov summasi yetarli emas!');
      return;
    }
    if (tolovTuri === 'nasiya' && !tanlanganMijoz) {
      toast.error('Nasiya uchun mijoz tanlanishi shart!');
      return;
    }

    setYuklanmoqda(true);

    const savdoMalumot = {
      elementlar: savat.map(el => ({
        mahsulot_id: el.mahsulot_id,
        miqdor: el.miqdor,
        narx: el.narx,
        chegirma: 0,
      })),
      tolov_turi: tolovTuri,
      tolov_summasi: parseFloat(tolovSummasi) || yakuniySumma,
      chegirma: chegirma || 0,
      mijoz_id: tanlanganMijoz?.id || null,
    };

    try {
      if (onlineMi()) {
        try {
          const res = await api.post('/savdo', savdoMalumot);
          setChekModal(res.data.savdo);
          savatTozalash();
          toast.success('✅ Savdo amalga oshirildi!');
          mahsulotlarYuklash();
        } catch {
          // Backend yo'q — demo rejimda saqlash
          const demoChek = {
            chek_raqam: 'CHK-' + Date.now(),
            jami_summa: yakuniySumma,
            tolov_turi: tolovTuri,
            tolov_summasi: parseFloat(tolovSummasi) || yakuniySumma,
            qaytim: Math.max(0, qaytim),
            mijoz_ism: tanlanganMijoz?.ism || null,
          };
          setChekModal(demoChek);
          savatTozalash();
          toast.success('✅ Savdo saqlandi! (Demo rejim)');
        }
      } else {
        // Offline saqlash
        const offlineSavdo = await offlineSavdoSaqlash({
          ...savdoMalumot,
          jami_summa: yakuniySumma,
          qaytim: Math.max(0, qaytim),
        });
        toast.success('💾 Savdo offline saqlandi!');
        setChekModal({ ...offlineSavdo, chek_raqam: 'OFFLINE-' + Date.now() });
        savatTozalash();
      }
    } catch (err) {
      toast.error(err.response?.data?.xato || 'Savdoda xato!');
    } finally {
      setYuklanmoqda(false);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Chap: Mahsulot qidiruv */}
      <div className="flex-1 flex flex-col space-y-4">
        <h1 className="text-xl font-bold text-gray-800">🛒 Kassa</h1>

        {/* Qidiruv + Scanner tugma */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={qidiruvRef}
              type="text"
              value={qidiruv}
              onChange={(e) => setQidiruv(e.target.value)}
              onKeyDown={barkodSkanerlash}
              placeholder="🔍 Mahsulot nomi yoki barkod (Enter = qidirish)"
              className="input-field pl-4 pr-10 py-3 text-base w-full"
            />
            {qidiruv && (
              <button
                onClick={() => setQidiruv('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >✕</button>
            )}
          </div>

          {/* Kamera scanner tugma */}
          <button
            onClick={() => setScannerOchiq(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors whitespace-nowrap"
            title="Kamera orqali skanerlash"
          >
            <span className="text-xl">📷</span>
            <span className="hidden sm:inline text-sm">Skaner</span>
          </button>
        </div>

        {/* Qidiruv natijalari */}
        {filtrMahsulotlar.length > 0 && (
          <div className="card max-h-80 overflow-y-auto">
            {filtrMahsulotlar.map(m => (
              <button
                key={m.id}
                onClick={() => savatGaQoshish(m)}
                className="w-full flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg transition-colors text-left border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800">{m.nom}</p>
                  <p className="text-xs text-gray-400">{m.barkod || 'Barkod yo\'q'} • Qoldiq: {m.qoldiq} {m.birlik}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{pulFormat(m.sotish_narxi)}</p>
                  {m.qoldiq <= m.min_qoldiq && (
                    <span className="badge-yellow text-xs">Kam</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tezkor mahsulotlar */}
        {!qidiruv && (
          <div className="card flex-1 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-3">Barcha mahsulotlar ({mahsulotlar.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mahsulotlar.slice(0, 30).map(m => (
                <button
                  key={m.id}
                  onClick={() => savatGaQoshish(m)}
                  disabled={m.qoldiq <= 0}
                  className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Rasm */}
                  <div className="w-full h-16 mb-2 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {m.rasm ? (
                      <img
                        src={m.rasm.startsWith('data:') ? m.rasm : `http://localhost:5000${m.rasm}`}
                        alt={m.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">
                        {m.kategoriya_nom?.includes('Non') ? '🍞' :
                         m.kategoriya_nom?.includes('Ichimlik') ? '🥤' :
                         m.kategoriya_nom?.includes('Sut') ? '🥛' :
                         m.kategoriya_nom?.includes('Yog') ? '🫙' :
                         m.kategoriya_nom?.includes('Choy') ? '☕' :
                         m.kategoriya_nom?.includes('Gigiena') ? '🧴' :
                         m.kategoriya_nom?.includes('Uy') ? '🧹' :
                         m.kategoriya_nom?.includes('Shirinlik') ? '🍫' :
                         m.kategoriya_nom?.includes('Snack') ? '🍿' :
                         m.kategoriya_nom?.includes('Konserva') ? '🥫' :
                         m.kategoriya_nom?.includes('Tuxum') ? '🥚' : '📦'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{m.nom}</p>
                  <p className="text-xs text-blue-600 font-bold">{pulFormat(m.sotish_narxi)}</p>
                  <p className="text-xs text-gray-400">Qoldiq: {m.qoldiq}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* O'ng: Savat */}
      <div className="w-80 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-gray-800">🛒 Savat ({savat.length})</h2>
          {savat.length > 0 && (
            <button onClick={savatTozalash} className="text-red-500 text-sm hover:underline">
              Tozalash
            </button>
          )}
        </div>

        {/* Savat elementlari */}
        <div className="card flex-1 overflow-y-auto max-h-72 space-y-2">
          {savat.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">Savat bo'sh</p>
              <p className="text-xs">Mahsulot qo'shing</p>
            </div>
          ) : (
            savat.map(el => (
              <div key={el.mahsulot_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{el.mahsulot_nom}</p>
                  <p className="text-xs text-gray-500">{pulFormat(el.narx)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => miqdorOzgartirish(el.mahsulot_id, el.miqdor - 1)}
                    className="w-6 h-6 bg-gray-200 hover:bg-red-200 rounded text-xs font-bold"
                  >-</button>
                  <span className="w-8 text-center text-sm font-bold">{el.miqdor}</span>
                  <button
                    onClick={() => miqdorOzgartirish(el.mahsulot_id, el.miqdor + 1)}
                    className="w-6 h-6 bg-gray-200 hover:bg-green-200 rounded text-xs font-bold"
                  >+</button>
                </div>
                <p className="text-sm font-bold text-blue-600 w-20 text-right">{pulFormat(el.jami)}</p>
              </div>
            ))
          )}
        </div>

        {/* Hisob-kitob */}
        {savat.length > 0 && (
          <div className="card space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jami:</span>
              <span className="font-bold">{pulFormat(jamiSumma)}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 w-20">Chegirma:</label>
              <input
                type="number"
                value={chegirma}
                onChange={(e) => setChegirma(Number(e.target.value))}
                className="input-field py-1 text-sm"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>To'lash kerak:</span>
              <span className="text-green-600">{pulFormat(yakuniySumma)}</span>
            </div>

            {/* To'lov turi */}
            <div className="grid grid-cols-3 gap-1">
              {['naqd', 'karta', 'nasiya'].map(tur => (
                <button
                  key={tur}
                  onClick={() => { setTolovTuri(tur); setTanlanganMijoz(null); }}
                  className={`py-2 text-xs rounded-lg font-medium transition-colors ${
                    tolovTuri === tur
                      ? tur === 'nasiya' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tur === 'naqd' ? '💵 Naqd' : tur === 'karta' ? '💳 Karta' : '📝 Nasiya'}
                </button>
              ))}
            </div>

            {/* Naqd — qaytim */}
            {tolovTuri === 'naqd' && (
              <div>
                <input
                  type="number"
                  value={tolovSummasi}
                  onChange={(e) => setTolovSummasi(e.target.value)}
                  className="input-field py-2 text-base"
                  placeholder="Qabul qilingan summa"
                />
                {parseFloat(tolovSummasi) > 0 && (
                  <p className="text-sm text-center mt-1">
                    Qaytim: <strong className="text-green-600">{pulFormat(Math.max(0, qaytim))}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Nasiya — mijoz tanlash */}
            {tolovTuri === 'nasiya' && (
              <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                <MijozTanlash
                  tanlangan={tanlanganMijoz}
                  onTanlash={setTanlanganMijoz}
                  mijozlar={mijozlar}
                  onMijozQoshildi={mijozQoshildi}
                />
                {tanlanganMijoz && (
                  <div className="text-xs text-orange-700 bg-orange-100 rounded p-2">
                    ⚠️ <strong>{pulFormat(yakuniySumma)}</strong> nasiyaga yoziladi
                  </div>
                )}
                {!tanlanganMijoz && (
                  <p className="text-xs text-orange-500 text-center">
                    Nasiya uchun mijoz tanlanishi shart
                  </p>
                )}
              </div>
            )}

            {/* Karta */}
            {tolovTuri === 'karta' && (
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-600 font-medium">
                  💳 Karta orqali: <strong>{pulFormat(yakuniySumma)}</strong>
                </p>
              </div>
            )}

            <button
              onClick={savdoYakunlash}
              disabled={yuklanmoqda || savat.length === 0}
              className="btn-success w-full py-3 text-base font-bold"
            >
              {yuklanmoqda ? '⏳ Saqlanmoqda...' : '✅ Savdoni Yakunlash'}
            </button>
          </div>
        )}
      </div>

      {/* Barkod Scanner Modal */}
      {scannerOchiq && (
        <BarkodScanner
          onSkanerlandi={barkodSkanerlandi}
          yopish={() => setScannerOchiq(false)}
        />
      )}

      {/* Chek Modal */}
      {chekModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-2xl">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Savdo amalga oshirildi!</h3>
            <p className="text-sm text-gray-500 mb-4">Chek: {chekModal.chek_raqam}</p>

            <div className="bg-gray-50 rounded-lg p-3 text-left space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span>Jami:</span>
                <strong>{pulFormat(chekModal.jami_summa)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>To'lov:</span>
                <span className="capitalize">{chekModal.tolov_turi}</span>
              </div>
              {chekModal.tolov_turi === 'nasiya' && chekModal.mijoz_ism && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Mijoz:</span>
                  <strong>{chekModal.mijoz_ism}</strong>
                </div>
              )}
              {chekModal.qaytim > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Qaytim:</span>
                  <strong>{pulFormat(chekModal.qaytim)}</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary"
              >
                🖨️ Chop etish
              </button>
              <button
                onClick={() => { setChekModal(null); qidiruvRef.current?.focus(); }}
                className="btn-primary"
              >
                Yangi savdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
