import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { pulFormat, sanaVaqtFormat } from '../utils/format';
import toast from 'react-hot-toast';
import BarkodScanner from '../components/common/BarkodScanner';

const DEMO_MAHSULOTLAR = [
  { id: 1,  nom: 'Non (oq)',             barkod: '4600001', sotish_narxi: 3000,  sotib_olish_narxi: 2200,  qoldiq: 80,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Non-novvot',  kam_qoldiq: false, ombor_qiymati: 176000 },
  { id: 5,  nom: 'Qand (1kg)',            barkod: '4600005', sotish_narxi: 15000, sotib_olish_narxi: 12000, qoldiq: 50,  min_qoldiq: 10, birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 600000 },
  { id: 6,  nom: 'Tuz (1kg)',             barkod: '4600006', sotish_narxi: 5000,  sotib_olish_narxi: 3500,  qoldiq: 45,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 157500 },
  { id: 7,  nom: 'Un (2kg)',              barkod: '4600007', sotish_narxi: 18000, sotib_olish_narxi: 14000, qoldiq: 35,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 490000 },
  { id: 8,  nom: 'Guruch (1kg)',          barkod: '4600008', sotish_narxi: 12000, sotib_olish_narxi: 9000,  qoldiq: 60,  min_qoldiq: 10, birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 540000 },
  { id: 14, nom: 'O\'simlik yog\'i (1L)', barkod: '4600014', sotish_narxi: 25000, sotib_olish_narxi: 20000, qoldiq: 40,  min_qoldiq: 5,  birlik: 'litr', kategoriya_nom: 'Yog\'-moy',   kam_qoldiq: false, ombor_qiymati: 800000 },
  { id: 17, nom: 'Sut (1L)',              barkod: '4600017', sotish_narxi: 12000, sotib_olish_narxi: 9000,  qoldiq: 35,  min_qoldiq: 10, birlik: 'litr', kategoriya_nom: 'Sut mahsulot',kam_qoldiq: false, ombor_qiymati: 315000 },
  { id: 27, nom: 'Suv (0.5L)',            barkod: '4600027', sotish_narxi: 2500,  sotib_olish_narxi: 1800,  qoldiq: 100, min_qoldiq: 20, birlik: 'dona', kategoriya_nom: 'Ichimlik',    kam_qoldiq: false, ombor_qiymati: 180000 },
  { id: 29, nom: 'Coca-Cola (0.5L)',      barkod: '4600029', sotish_narxi: 9000,  sotib_olish_narxi: 7000,  qoldiq: 48,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik',    kam_qoldiq: false, ombor_qiymati: 336000 },
  { id: 60, nom: 'Mustak pivo (0.5L)',    barkod: '4600060', sotish_narxi: 2000,  sotib_olish_narxi: 1500,  qoldiq: 3,   min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik',    kam_qoldiq: true,  ombor_qiymati: 4500   },
];

export default function Ombor() {
  const [tab, setTab] = useState('hisobot');
  const [omborMalumot, setOmborMalumot] = useState(null);
  const [harakatlar, setHarakatlar] = useState([]);
  const [mahsulotlar, setMahsulotlar] = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [scannerOchiq, setScannerOchiq] = useState(false);

  // Kirim ro'yxati — bir sessiyadagi barcha skanerlangan/qo'shilgan tovarlar
  const [kirimRoyxati, setKirimRoyxati] = useState([]);
  // Hozir tahrirlayotgan qator id
  const [tahrirlash, setTahrirlash] = useState(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const miqdorInputRef = useRef(null);

  useEffect(() => { malumotYuklash(); }, []);
  useEffect(() => { if (tab === 'harakatlar') harakatlarYuklash(); }, [tab]);

  // Kirim tabiga o'tganda inputga focus
  useEffect(() => {
    if (tab === 'kirim') setTimeout(() => miqdorInputRef.current?.focus(), 100);
  }, [tab]);

  const malumotYuklash = async () => {
    try {
      const [omborRes, mRes] = await Promise.all([
        api.get('/ombor/hisobot'),
        api.get('/mahsulotlar'),
      ]);
      setOmborMalumot(omborRes.data);
      setMahsulotlar(mRes.data);
    } catch {
      setOmborMalumot({
        mahsulotlar: DEMO_MAHSULOTLAR,
        statistika: { jami_mahsulotlar: 60, kam_qoldiqlar: 4, jami_ombor_qiymati: 12500000 }
      });
      setMahsulotlar(DEMO_MAHSULOTLAR);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const harakatlarYuklash = async () => {
    try {
      const res = await api.get('/ombor?limit=100');
      setHarakatlar(res.data);
    } catch {
      setHarakatlar([]);
    }
  };

  // ===================== SCANNER =====================

  // Barkod skanerlanganda — mahsulotni topib ro'yxatga qo'shadi
  const barkodSkanerlandi = async (barkod) => {
    setScannerOchiq(false);

    // Avval ro'yxatda bormi?
    const mavjudIndex = kirimRoyxati.findIndex(k => k.barkod === barkod);
    if (mavjudIndex !== -1) {
      // Bor bo'lsa miqdorini +1 qiladi
      setKirimRoyxati(prev =>
        prev.map((k, i) => i === mavjudIndex ? { ...k, miqdor: k.miqdor + 1 } : k)
      );
      toast.success(`✅ ${kirimRoyxati[mavjudIndex].nom} — miqdor: ${kirimRoyxati[mavjudIndex].miqdor + 1}`, { duration: 1500 });
      return;
    }

    // Mahsulotlar ichidan qidirish
    let mahsulot = mahsulotlar.find(m => m.barkod === barkod);

    // Backend dan qidirish
    if (!mahsulot) {
      try {
        const res = await api.get(`/mahsulotlar/barkod/${barkod}`);
        mahsulot = res.data;
      } catch {}
    }

    if (mahsulot) {
      setKirimRoyxati(prev => [...prev, {
        uid: Date.now(),
        mahsulot_id: mahsulot.id,
        nom: mahsulot.nom,
        barkod: mahsulot.barkod,
        birlik: mahsulot.birlik,
        narx: mahsulot.sotib_olish_narxi || '',
        miqdor: 1,
        sabab: 'Tovar kirim',
      }]);
      toast.success(`📦 ${mahsulot.nom} ro'yxatga qo'shildi`, { duration: 1500 });
    } else {
      // Topilmasa — yangi tovar sifatida qo'shish imkoniyati
      toast(`⚠️ Barkod: ${barkod} — topilmadi`, {
        icon: '❓',
        duration: 3000,
      });
    }
  };

  // Qo'lda mahsulot tanlash
  const mahsulotQoshish = (mahsulotId) => {
    const mahsulot = mahsulotlar.find(m => m.id === parseInt(mahsulotId));
    if (!mahsulot) return;

    const mavjud = kirimRoyxati.find(k => k.mahsulot_id === mahsulot.id);
    if (mavjud) {
      setKirimRoyxati(prev =>
        prev.map(k => k.mahsulot_id === mahsulot.id ? { ...k, miqdor: k.miqdor + 1 } : k)
      );
      toast.success(`${mahsulot.nom} +1`, { duration: 1000 });
      return;
    }

    setKirimRoyxati(prev => [...prev, {
      uid: Date.now(),
      mahsulot_id: mahsulot.id,
      nom: mahsulot.nom,
      barkod: mahsulot.barkod,
      birlik: mahsulot.birlik,
      narx: mahsulot.sotib_olish_narxi || '',
      miqdor: 1,
      sabab: 'Tovar kirim',
    }]);
  };

  // Qatorni yangilash
  const qatorYangilash = (uid, maydon, qiymat) => {
    setKirimRoyxati(prev =>
      prev.map(k => k.uid === uid ? { ...k, [maydon]: qiymat } : k)
    );
  };

  // Qatorni o'chirish
  const qatorOchirish = (uid) => {
    setKirimRoyxati(prev => prev.filter(k => k.uid !== uid));
  };

  // Jami hisob
  const jamiMiqdor = kirimRoyxati.reduce((s, k) => s + (parseInt(k.miqdor) || 0), 0);
  const jamiSumma = kirimRoyxati.reduce((s, k) => s + (parseFloat(k.narx) || 0) * (parseInt(k.miqdor) || 0), 0);

  // Barcha kirimlarni saqlash
  const hammasiniSaqlash = async () => {
    if (kirimRoyxati.length === 0) {
      toast.error('Ro\'yxat bo\'sh!');
      return;
    }
    const xato = kirimRoyxati.find(k => !k.miqdor || parseInt(k.miqdor) <= 0);
    if (xato) {
      toast.error(`"${xato.nom}" uchun miqdor kiritilishi shart!`);
      return;
    }

    setYuborilmoqda(true);
    let muvaffaqiyat = 0;
    let xatolar = 0;

    for (const kirim of kirimRoyxati) {
      try {
        await api.post('/ombor/kirim', {
          mahsulot_id: kirim.mahsulot_id,
          miqdor: parseInt(kirim.miqdor),
          narx: kirim.narx ? parseFloat(kirim.narx) : undefined,
          sabab: kirim.sabab || 'Tovar kirim',
        });
        muvaffaqiyat++;
      } catch {
        xatolar++;
      }
    }

    setYuborilmoqda(false);

    if (muvaffaqiyat > 0) {
      toast.success(`✅ ${muvaffaqiyat} ta tovar kirim qilindi!`);
      setKirimRoyxati([]);
      malumotYuklash();
    }
    if (xatolar > 0) {
      toast.error(`${xatolar} ta tovar kirimda xato!`);
    }
  };

  // Demo rejim uchun
  const demoSaqlash = () => {
    toast.success(`✅ ${jamiMiqdor} ta tovar kirim qilindi! (Demo rejim)`);
    setKirimRoyxati([]);
  };

  if (yuklanmoqda) {
    return <div className="text-center py-16 text-gray-400">⏳ Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">🏪 Ombor</h1>

      {/* Statistika */}
      {omborMalumot && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{omborMalumot.statistika.jami_mahsulotlar}</p>
            <p className="text-sm text-gray-500">Jami mahsulotlar</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-500">{omborMalumot.statistika.kam_qoldiqlar}</p>
            <p className="text-sm text-gray-500">Kam qoldiq</p>
          </div>
          <div className="card text-center">
            <p className="text-xl font-bold text-green-600">{pulFormat(omborMalumot.statistika.jami_ombor_qiymati)}</p>
            <p className="text-sm text-gray-500">Ombor qiymati</p>
          </div>
        </div>
      )}

      {/* Tablar */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'hisobot',    label: '📊 Qoldiqlar' },
          { id: 'kirim',      label: `📥 Tovar kirim${kirimRoyxati.length > 0 ? ` (${kirimRoyxati.length})` : ''}` },
          { id: 'harakatlar', label: '📋 Tarix' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== QOLDIQLAR ===================== */}
      {tab === 'hisobot' && omborMalumot && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Mahsulot</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Kategoriya</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qoldiq</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Min</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Narx</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qiymat</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {omborMalumot.mahsulotlar.map(m => (
                  <tr key={m.id} className={`hover:bg-gray-50 ${m.kam_qoldiq ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{m.nom}</td>
                    <td className="px-4 py-3 text-gray-500">{m.kategoriya_nom || '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.kam_qoldiq ? 'text-red-600' : 'text-gray-700'}`}>
                      {m.qoldiq} {m.birlik}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{m.min_qoldiq}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{pulFormat(m.sotish_narxi)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{pulFormat(m.ombor_qiymati)}</td>
                    <td className="px-4 py-3 text-center">
                      {m.kam_qoldiq
                        ? <span className="badge-red">⚠️ Kam</span>
                        : <span className="badge-green">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TOVAR KIRIM ===================== */}
      {tab === 'kirim' && (
        <div className="space-y-4">

          {/* Yuqori amallar paneli */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Kamera scanner */}
            <button
              onClick={() => setScannerOchiq(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <span className="text-lg">📷</span>
              <span>Barkod skaner</span>
            </button>

            {/* Qo'lda tanlash */}
            <div className="flex gap-2 flex-1 min-w-0">
              <select
                className="input-field flex-1"
                defaultValue=""
                onChange={e => { if (e.target.value) { mahsulotQoshish(e.target.value); e.target.value = ''; } }}
              >
                <option value="">📦 Ro'yxatdan mahsulot tanlang...</option>
                {mahsulotlar.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nom} — {m.barkod || 'barkod yo\'q'} (Qoldiq: {m.qoldiq} {m.birlik})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ko'rsatma */}
          {kirimRoyxati.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-medium text-gray-500 mb-1">Tovar kirim ro'yxati bo'sh</p>
              <p className="text-sm">📷 <strong>Barkod skaner</strong> tugmasini bosib skanerlang</p>
              <p className="text-sm mt-1">yoki ro'yxatdan mahsulot tanlang</p>
            </div>
          )}

          {/* Kirim ro'yxati jadvali */}
          {kirimRoyxati.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <p className="text-sm font-medium text-green-700">
                  📋 Kirim ro'yxati — {kirimRoyxati.length} ta tovar
                </p>
                <button
                  onClick={() => setKirimRoyxati([])}
                  className="text-xs text-red-500 hover:underline"
                >
                  🗑️ Tozalash
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium w-8">#</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Mahsulot</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium w-24">Barkod</th>
                      <th className="text-center px-3 py-2 text-gray-600 font-medium w-28">Miqdor</th>
                      <th className="text-right px-3 py-2 text-gray-600 font-medium w-36">Narx (sotib ol.)</th>
                      <th className="text-right px-3 py-2 text-gray-600 font-medium w-32">Jami</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Sabab</th>
                      <th className="w-8 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {kirimRoyxati.map((k, i) => (
                      <tr key={k.uid} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {k.nom}
                          <span className="text-xs text-gray-400 ml-1">({k.birlik})</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{k.barkod || '—'}</td>

                        {/* Miqdor */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => qatorYangilash(k.uid, 'miqdor', Math.max(1, (parseInt(k.miqdor) || 1) - 1))}
                              className="w-6 h-6 bg-gray-200 hover:bg-red-200 rounded text-xs font-bold flex-shrink-0"
                            >−</button>
                            <input
                              type="number"
                              value={k.miqdor}
                              onChange={e => qatorYangilash(k.uid, 'miqdor', e.target.value)}
                              className="w-14 text-center border border-gray-200 rounded py-0.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-400"
                              min="1"
                            />
                            <button
                              onClick={() => qatorYangilash(k.uid, 'miqdor', (parseInt(k.miqdor) || 0) + 1)}
                              className="w-6 h-6 bg-gray-200 hover:bg-green-200 rounded text-xs font-bold flex-shrink-0"
                            >+</button>
                          </div>
                        </td>

                        {/* Narx */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={k.narx}
                            onChange={e => qatorYangilash(k.uid, 'narx', e.target.value)}
                            className="w-full text-right border border-gray-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="0"
                          />
                        </td>

                        {/* Jami */}
                        <td className="px-3 py-2 text-right font-bold text-green-600">
                          {k.narx ? pulFormat((parseFloat(k.narx) || 0) * (parseInt(k.miqdor) || 0)) : '—'}
                        </td>

                        {/* Sabab */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={k.sabab}
                            onChange={e => qatorYangilash(k.uid, 'sabab', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="Kirim sababi"
                          />
                        </td>

                        {/* O'chirish */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => qatorOchirish(k.uid)}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Jami qator */}
                  <tfoot className="bg-green-50 border-t-2 border-green-200">
                    <tr>
                      <td colSpan="3" className="px-3 py-3 text-sm font-bold text-gray-700">
                        Jami: {kirimRoyxati.length} xil tovar
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-blue-700">
                        {jamiMiqdor} ta
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-500">Jami summa:</td>
                      <td className="px-3 py-3 text-right font-bold text-green-700">
                        {pulFormat(jamiSumma)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Saqlash tugmasi */}
              <div className="p-4 bg-gray-50 border-t flex gap-3 justify-end">
                <button
                  onClick={() => setKirimRoyxati([])}
                  className="btn-secondary"
                >
                  🗑️ Bekor
                </button>
                <button
                  onClick={async () => {
                    try {
                      await hammasiniSaqlash();
                    } catch {
                      demoSaqlash();
                    }
                  }}
                  disabled={yuborilmoqda || kirimRoyxati.length === 0}
                  className="btn-success px-6"
                >
                  {yuborilmoqda
                    ? '⏳ Saqlanmoqda...'
                    : `✅ ${jamiMiqdor} ta tovarni kirim qilish`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== HARAKATLAR ===================== */}
      {tab === 'harakatlar' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Sana</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Mahsulot</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Tur</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Miqdor</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Sabab</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Foydalanuvchi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {harakatlar.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">
                      Harakatlar yo'q
                    </td>
                  </tr>
                ) : harakatlar.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{sanaVaqtFormat(h.yaratilgan)}</td>
                    <td className="px-4 py-3 font-medium">{h.mahsulot_nom}</td>
                    <td className="px-4 py-3 text-center">
                      {h.harakat_turi === 'kirim'
                        ? <span className="badge-green">📥 Kirim</span>
                        : h.harakat_turi === 'chiqim'
                          ? <span className="badge-red">📤 Chiqim</span>
                          : <span className="badge-blue">✏️ Tuzatish</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{h.miqdor}</td>
                    <td className="px-4 py-3 text-gray-500">{h.sabab || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{h.foydalanuvchi_ism || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {scannerOchiq && (
        <BarkodScanner
          onSkanerlandi={barkodSkanerlandi}
          yopish={() => setScannerOchiq(false)}
        />
      )}
    </div>
  );
}
