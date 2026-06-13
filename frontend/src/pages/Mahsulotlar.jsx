import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { pulFormat, sanaFormat } from '../utils/format';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// Demo mahsulotlar (backend bo'lmaganda)
const DEMO_MAHSULOTLAR = [
  { id: 1,  nom: 'Non (oq)',          barkod: '4600001', sotish_narxi: 3000,   sotib_olish_narxi: 2200,  qoldiq: 80,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Non-novvot' },
  { id: 2,  nom: 'Non (qora)',         barkod: '4600002', sotish_narxi: 3500,   sotib_olish_narxi: 2500,  qoldiq: 60,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Non-novvot' },
  { id: 3,  nom: 'Lavash',             barkod: '4600003', sotish_narxi: 5000,   sotib_olish_narxi: 3500,  qoldiq: 40,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Non-novvot' },
  { id: 4,  nom: 'Bulochka',           barkod: '4600004', sotish_narxi: 2000,   sotib_olish_narxi: 1500,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Non-novvot' },
  { id: 5,  nom: 'Qand (1kg)',         barkod: '4600005', sotish_narxi: 15000,  sotib_olish_narxi: 12000, qoldiq: 50,  min_qoldiq: 10, birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 6,  nom: 'Tuz (1kg)',          barkod: '4600006', sotish_narxi: 5000,   sotib_olish_narxi: 3500,  qoldiq: 45,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 7,  nom: 'Un (2kg)',           barkod: '4600007', sotish_narxi: 18000,  sotib_olish_narxi: 14000, qoldiq: 35,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 8,  nom: 'Guruch (1kg)',       barkod: '4600008', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 60,  min_qoldiq: 10, birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 9,  nom: 'Makaron (450g)',     barkod: '4600009', sotish_narxi: 8000,   sotib_olish_narxi: 6000,  qoldiq: 55,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Quruq ozuqa' },
  { id: 10, nom: 'Grechixa (800g)',    barkod: '4600010', sotish_narxi: 14000,  sotib_olish_narxi: 11000, qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Quruq ozuqa' },
  { id: 11, nom: 'Loviya (1kg)',       barkod: '4600011', sotish_narxi: 16000,  sotib_olish_narxi: 12000, qoldiq: 20,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 12, nom: 'No\'xat (1kg)',      barkod: '4600012', sotish_narxi: 18000,  sotib_olish_narxi: 14000, qoldiq: 20,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 13, nom: 'Mosh (1kg)',         barkod: '4600013', sotish_narxi: 15000,  sotib_olish_narxi: 12000, qoldiq: 18,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa' },
  { id: 14, nom: 'O\'simlik yog\'i (1L)',  barkod: '4600014', sotish_narxi: 25000, sotib_olish_narxi: 20000, qoldiq: 40, min_qoldiq: 5, birlik: 'litr', kategoriya_nom: 'Yog\'-moy' },
  { id: 15, nom: 'O\'simlik yog\'i (5L)',  barkod: '4600015', sotish_narxi: 110000,sotib_olish_narxi: 90000, qoldiq: 15, min_qoldiq: 3, birlik: 'litr', kategoriya_nom: 'Yog\'-moy' },
  { id: 16, nom: 'Margarin (200g)',    barkod: '4600016', sotish_narxi: 9000,   sotib_olish_narxi: 7000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Yog\'-moy' },
  { id: 17, nom: 'Sut (1L)',           barkod: '4600017', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 35,  min_qoldiq: 10, birlik: 'litr', kategoriya_nom: 'Sut mahsulot' },
  { id: 18, nom: 'Kefir (1L)',         barkod: '4600018', sotish_narxi: 13000,  sotib_olish_narxi: 10000, qoldiq: 25,  min_qoldiq: 5,  birlik: 'litr', kategoriya_nom: 'Sut mahsulot' },
  { id: 19, nom: 'Qatiq (0.5L)',       barkod: '4600019', sotish_narxi: 8000,   sotib_olish_narxi: 6000,  qoldiq: 20,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Sut mahsulot' },
  { id: 20, nom: 'Pishloq (200g)',     barkod: '4600020', sotish_narxi: 28000,  sotib_olish_narxi: 22000, qoldiq: 15,  min_qoldiq: 3,  birlik: 'dona', kategoriya_nom: 'Sut mahsulot' },
  { id: 21, nom: 'Sariyog\' (200g)',   barkod: '4600021', sotish_narxi: 22000,  sotib_olish_narxi: 17000, qoldiq: 20,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Sut mahsulot' },
  { id: 22, nom: 'Tuxum (10 dona)',    barkod: '4600022', sotish_narxi: 20000,  sotib_olish_narxi: 16000, qoldiq: 40,  min_qoldiq: 5,  birlik: 'quti', kategoriya_nom: 'Tuxum' },
  { id: 23, nom: 'Tuxum (30 dona)',    barkod: '4600023', sotish_narxi: 55000,  sotib_olish_narxi: 44000, qoldiq: 20,  min_qoldiq: 3,  birlik: 'quti', kategoriya_nom: 'Tuxum' },
  { id: 24, nom: 'Choy qora (100g)',   barkod: '4600024', sotish_narxi: 22000,  sotib_olish_narxi: 17000, qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Choy-qahva' },
  { id: 25, nom: 'Choy yashil (100g)', barkod: '4600025', sotish_narxi: 25000,  sotib_olish_narxi: 19000, qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Choy-qahva' },
  { id: 26, nom: 'Nescafe (95g)',      barkod: '4600026', sotish_narxi: 45000,  sotib_olish_narxi: 36000, qoldiq: 20,  min_qoldiq: 3,  birlik: 'dona', kategoriya_nom: 'Choy-qahva' },
  { id: 27, nom: 'Suv (0.5L)',         barkod: '4600027', sotish_narxi: 2500,   sotib_olish_narxi: 1800,  qoldiq: 100, min_qoldiq: 20, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 28, nom: 'Suv (1.5L)',         barkod: '4600028', sotish_narxi: 4000,   sotib_olish_narxi: 3000,  qoldiq: 80,  min_qoldiq: 15, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 29, nom: 'Coca-Cola (0.5L)',   barkod: '4600029', sotish_narxi: 9000,   sotib_olish_narxi: 7000,  qoldiq: 48,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 30, nom: 'Pepsi (0.5L)',       barkod: '4600030', sotish_narxi: 8000,   sotib_olish_narxi: 6500,  qoldiq: 36,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 31, nom: 'Fanta (0.5L)',       barkod: '4600031', sotish_narxi: 8000,   sotib_olish_narxi: 6500,  qoldiq: 30,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 32, nom: 'Sharbat (1L)',       barkod: '4600032', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Ichimlik' },
  { id: 33, nom: 'Pechenye (300g)',    barkod: '4600033', sotish_narxi: 15000,  sotib_olish_narxi: 11000, qoldiq: 35,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Shirinlik' },
  { id: 34, nom: 'Konfet (1kg)',       barkod: '4600034', sotish_narxi: 40000,  sotib_olish_narxi: 32000, qoldiq: 20,  min_qoldiq: 3,  birlik: 'kg',   kategoriya_nom: 'Shirinlik' },
  { id: 35, nom: 'Vafel tort',         barkod: '4600035', sotish_narxi: 18000,  sotib_olish_narxi: 14000, qoldiq: 15,  min_qoldiq: 3,  birlik: 'dona', kategoriya_nom: 'Shirinlik' },
  { id: 36, nom: 'Zefir (200g)',       barkod: '4600036', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 20,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Shirinlik' },
  { id: 37, nom: 'Chips (100g)',       barkod: '4600037', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 40,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Snack' },
  { id: 38, nom: 'Yeryong\'oq (150g)', barkod: '4600038', sotish_narxi: 10000,  sotib_olish_narxi: 7500,  qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Snack' },
  { id: 39, nom: 'Semichka (200g)',    barkod: '4600039', sotish_narxi: 8000,   sotib_olish_narxi: 6000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Snack' },
  { id: 40, nom: 'Pomidor pasta (380g)',barkod: '4600040', sotish_narxi: 12000, sotib_olish_narxi: 9000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Konserva' },
  { id: 41, nom: 'Tuna konserva',      barkod: '4600041', sotish_narxi: 22000,  sotib_olish_narxi: 17000, qoldiq: 20,  min_qoldiq: 3,  birlik: 'dona', kategoriya_nom: 'Konserva' },
  { id: 42, nom: 'Mayonez (200g)',     barkod: '4600042', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Sous' },
  { id: 43, nom: 'Ketchup (350g)',     barkod: '4600043', sotish_narxi: 14000,  sotib_olish_narxi: 11000, qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Sous' },
  { id: 44, nom: 'Qalampir (50g)',     barkod: '4600044', sotish_narxi: 6000,   sotib_olish_narxi: 4500,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Ziravorlar' },
  { id: 45, nom: 'Zira (50g)',         barkod: '4600045', sotish_narxi: 8000,   sotib_olish_narxi: 6000,  qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Ziravorlar' },
  { id: 46, nom: 'Kir yuvish kukuni (450g)', barkod: '4600046', sotish_narxi: 18000, sotib_olish_narxi: 14000, qoldiq: 25, min_qoldiq: 5, birlik: 'dona', kategoriya_nom: 'Uy-ro\'zg\'or' },
  { id: 47, nom: 'Idish yuvish (500ml)',barkod: '4600047', sotish_narxi: 12000, sotib_olish_narxi: 9000,  qoldiq: 30,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Uy-ro\'zg\'or' },
  { id: 48, nom: 'Supurgi',            barkod: '4600048', sotish_narxi: 25000,  sotib_olish_narxi: 18000, qoldiq: 10,  min_qoldiq: 2,  birlik: 'dona', kategoriya_nom: 'Uy-ro\'zg\'or' },
  { id: 49, nom: 'Paket (100 dona)',   barkod: '4600049', sotish_narxi: 5000,   sotib_olish_narxi: 3500,  qoldiq: 50,  min_qoldiq: 5,  birlik: 'quti', kategoriya_nom: 'Uy-ro\'zg\'or' },
  { id: 50, nom: 'Shampun (200ml)',    barkod: '4600050', sotish_narxi: 35000,  sotib_olish_narxi: 27000, qoldiq: 20,  min_qoldiq: 3,  birlik: 'dona', kategoriya_nom: 'Gigiena' },
  { id: 51, nom: 'Sovun (90g)',        barkod: '4600051', sotish_narxi: 5000,   sotib_olish_narxi: 3500,  qoldiq: 40,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Gigiena' },
  { id: 52, nom: 'Tish pastasi',       barkod: '4600052', sotish_narxi: 15000,  sotib_olish_narxi: 11000, qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Gigiena' },
  { id: 53, nom: 'Gugurt',             barkod: '4600053', sotish_narxi: 1500,   sotib_olish_narxi: 1000,  qoldiq: 100, min_qoldiq: 20, birlik: 'dona', kategoriya_nom: 'Boshqa' },
  { id: 54, nom: 'Sham (10 dona)',     barkod: '4600054', sotish_narxi: 8000,   sotib_olish_narxi: 6000,  qoldiq: 20,  min_qoldiq: 5,  birlik: 'quti', kategoriya_nom: 'Boshqa' },
  { id: 55, nom: 'Batareya (AA x2)',   barkod: '4600055', sotish_narxi: 12000,  sotib_olish_narxi: 9000,  qoldiq: 15,  min_qoldiq: 3,  birlik: 'quti', kategoriya_nom: 'Boshqa' },
  { id: 56, nom: 'Selofan paket (S)',  barkod: '4600056', sotish_narxi: 500,    sotib_olish_narxi: 300,   qoldiq: 200, min_qoldiq: 50, birlik: 'dona', kategoriya_nom: 'Boshqa' },
  { id: 57, nom: 'Selofan paket (L)',  barkod: '4600057', sotish_narxi: 1000,   sotib_olish_narxi: 700,   qoldiq: 150, min_qoldiq: 30, birlik: 'dona', kategoriya_nom: 'Boshqa' },
  { id: 58, nom: 'Limon kislota (10g)',barkod: '4600058', sotish_narxi: 3000,   sotib_olish_narxi: 2000,  qoldiq: 40,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Ziravorlar' },
  { id: 59, nom: 'Vinegar (500ml)',    barkod: '4600059', sotish_narxi: 6000,   sotib_olish_narxi: 4500,  qoldiq: 25,  min_qoldiq: 5,  birlik: 'dona', kategoriya_nom: 'Ziravorlar' },
  { id: 60, nom: 'Mustak pivo (0.5L)',  barkod: '4600060', sotish_narxi: 2000,  sotib_olish_narxi: 1500,  qoldiq: 3,   min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik' },
];

function MahsulotModal({ mahsulot, kategoriyalar, yopish, saqlash }) {
  const [form, setForm] = useState(mahsulot || {
    nom: '', barkod: '', kategoriya_id: '', sotish_narxi: '',
    sotib_olish_narxi: '', qoldiq: 0, min_qoldiq: 5, birlik: 'dona'
  });
  const [rasmPreview, setRasmPreview] = useState(mahsulot?.rasm || null);
  const rasmInputRef = React.useRef(null);

  const rasmTanlash = (e) => {
    const fayl = e.target.files[0];
    if (!fayl) return;
    if (fayl.size > 2 * 1024 * 1024) {
      toast.error('Rasm hajmi 2MB dan oshmasligi kerak!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRasmPreview(ev.target.result);
      setForm(prev => ({ ...prev, rasm: ev.target.result }));
    };
    reader.readAsDataURL(fayl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nom || !form.sotish_narxi) {
      toast.error('Nom va narx kiritilishi shart!');
      return;
    }
    saqlash(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">{mahsulot ? '✏️ Mahsulot tahrirlash' : '➕ Yangi mahsulot'}</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">

          {/* Rasm yuklash */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">📸 Mahsulot rasmi</label>
            <div className="flex items-center gap-3">
              {/* Rasm ko'rinishi */}
              <div
                onClick={() => rasmInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center bg-gray-50 transition-colors flex-shrink-0"
              >
                {rasmPreview ? (
                  <img
                    src={rasmPreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-2xl">📷</div>
                    <div className="text-xs mt-0.5">Rasm</div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => rasmInputRef.current?.click()}
                  className="btn-secondary text-sm w-full"
                >
                  {rasmPreview ? '🔄 Rasmni o\'zgartirish' : '📤 Rasm yuklash'}
                </button>
                {rasmPreview && (
                  <button
                    type="button"
                    onClick={() => { setRasmPreview(null); setForm(p => ({ ...p, rasm: null })); }}
                    className="text-xs text-red-500 hover:underline mt-1 w-full text-center block"
                  >
                    🗑️ Rasmni o'chirish
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG • Max 2MB</p>
              </div>
            </div>
            <input
              ref={rasmInputRef}
              type="file"
              accept="image/*"
              onChange={rasmTanlash}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Nomi *</label>
            <input className="input-field mt-1" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Mahsulot nomi" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Barkod</label>
              <input className="input-field mt-1" value={form.barkod || ''} onChange={e => setForm({...form, barkod: e.target.value})} placeholder="Barkod" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Kategoriya</label>
              <select className="input-field mt-1" value={form.kategoriya_id || ''} onChange={e => setForm({...form, kategoriya_id: e.target.value})}>
                <option value="">Tanlang</option>
                {kategoriyalar.map(k => <option key={k.id} value={k.id}>{k.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Sotish narxi *</label>
              <input type="number" className="input-field mt-1" value={form.sotish_narxi} onChange={e => setForm({...form, sotish_narxi: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sotib olish narxi</label>
              <input type="number" className="input-field mt-1" value={form.sotib_olish_narxi || ''} onChange={e => setForm({...form, sotib_olish_narxi: e.target.value})} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Qoldiq</label>
              <input type="number" className="input-field mt-1" value={form.qoldiq} onChange={e => setForm({...form, qoldiq: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Min qoldiq</label>
              <input type="number" className="input-field mt-1" value={form.min_qoldiq} onChange={e => setForm({...form, min_qoldiq: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Birlik</label>
              <select className="input-field mt-1" value={form.birlik} onChange={e => setForm({...form, birlik: e.target.value})}>
                <option value="dona">dona</option>
                <option value="kg">kg</option>
                <option value="litr">litr</option>
                <option value="metr">metr</option>
                <option value="paket">paket</option>
                <option value="quti">quti</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={yopish} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" className="btn-primary flex-1">💾 Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Mahsulotlar() {
  const [mahsulotlar, setMahsulotlar] = useState([]);
  const [kategoriyalar, setKategoriyalar] = useState([]);
  const [qidiruv, setQidiruv] = useState('');
  const [filtrKat, setFiltrKat] = useState('');
  const [modal, setModal] = useState(null); // null | 'yangi' | mahsulot_obj
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const { foydalanuvchi } = useAuthStore();

  useEffect(() => {
    malumotYuklash();
  }, []);

  const malumotYuklash = async () => {
    try {
      const [mRes, kRes] = await Promise.all([
        api.get('/mahsulotlar'),
        api.get('/mahsulotlar/kategoriyalar'),
      ]);
      setMahsulotlar(mRes.data);
      setKategoriyalar(kRes.data);
    } catch {
      // Demo data
      setMahsulotlar(DEMO_MAHSULOTLAR);
      const demoKat = [...new Set(DEMO_MAHSULOTLAR.map(m => m.kategoriya_nom))]
        .map((nom, i) => ({ id: i + 1, nom }));
      setKategoriyalar(demoKat);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const filtrlangan = mahsulotlar.filter(m => {
    const qidiruvMos = !qidiruv || m.nom.toLowerCase().includes(qidiruv.toLowerCase()) || m.barkod?.includes(qidiruv);
    const katMos = !filtrKat || m.kategoriya_id === parseInt(filtrKat);
    return qidiruvMos && katMos;
  });

  const saqlash = async (form) => {
    try {
      if (modal === 'yangi') {
        await api.post('/mahsulotlar', form);
        toast.success('Mahsulot qo\'shildi!');
      } else {
        await api.put(`/mahsulotlar/${modal.id}`, form);
        toast.success('Mahsulot yangilandi!');
      }
      setModal(null);
      malumotYuklash();
    } catch (err) {
      toast.error(err.response?.data?.xato || 'Xato!');
    }
  };

  const ochirish = async (id, nom) => {
    if (!window.confirm(`"${nom}" mahsulotini o'chirasizmi?`)) return;
    try {
      await api.delete(`/mahsulotlar/${id}`);
      toast.success('Mahsulot o\'chirildi!');
      malumotYuklash();
    } catch { toast.error('O\'chirishda xato!'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">📦 Mahsulotlar</h1>
        {foydalanuvchi?.rol === 'admin' && (
          <button onClick={() => setModal('yangi')} className="btn-primary">
            + Yangi mahsulot
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={qidiruv}
          onChange={e => setQidiruv(e.target.value)}
          placeholder="🔍 Qidirish..."
          className="input-field max-w-xs"
        />
        <select value={filtrKat} onChange={e => setFiltrKat(e.target.value)} className="input-field max-w-xs">
          <option value="">Barcha kategoriyalar</option>
          {kategoriyalar.map(k => <option key={k.id} value={k.id}>{k.nom}</option>)}
        </select>
        <span className="flex items-center text-sm text-gray-500">
          Jami: {filtrlangan.length} ta
        </span>
      </div>

      {/* Jadval */}
      {yuklanmoqda ? (
        <div className="text-center py-16 text-gray-400">⏳ Yuklanmoqda...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Mahsulot</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Barkod</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Kategoriya</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Narx</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qoldiq</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Holat</th>
                  {foydalanuvchi?.rol === 'admin' && (
                    <th className="text-center px-4 py-3 text-gray-600 font-medium">Amal</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrlangan.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      Mahsulot topilmadi
                    </td>
                  </tr>
                ) : (
                  filtrlangan.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Rasm yoki emoji */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                            {m.rasm ? (
                              <img
                                src={m.rasm.startsWith('data:') ? m.rasm : `http://localhost:5000${m.rasm}`}
                                alt={m.nom}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg">
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
                                 m.kategoriya_nom?.includes('Ziravori') ? '🌶️' :
                                 m.kategoriya_nom?.includes('Tuxum') ? '🥚' : '📦'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{m.nom}</p>
                            <p className="text-xs text-gray-400">{m.kategoriya_nom || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{m.barkod || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.kategoriya_nom || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">{pulFormat(m.sotish_narxi)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={m.qoldiq <= m.min_qoldiq ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {m.qoldiq} {m.birlik}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.qoldiq <= 0 ? (
                          <span className="badge-red">Tugagan</span>
                        ) : m.qoldiq <= m.min_qoldiq ? (
                          <span className="badge-yellow">Kam</span>
                        ) : (
                          <span className="badge-green">Yetarli</span>
                        )}
                      </td>
                      {foydalanuvchi?.rol === 'admin' && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => setModal(m)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => ochirish(m.id, m.nom)}
                              className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <MahsulotModal
          mahsulot={modal === 'yangi' ? null : modal}
          kategoriyalar={kategoriyalar}
          yopish={() => setModal(null)}
          saqlash={saqlash}
        />
      )}
    </div>
  );
}
