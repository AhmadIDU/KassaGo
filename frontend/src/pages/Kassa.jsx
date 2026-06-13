import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { pulFormat } from '../utils/format';
import { onlineMi, offlineSavdoSaqlash, mahsulotlarCacheSaqlash, mahsulotlarCacheOlish, barkodBilanTopish } from '../services/offlineDB';
import toast from 'react-hot-toast';

export default function Kassa() {
  const [mahsulotlar, setMahsulotlar] = useState([]);
  const [savat, setSavat] = useState([]);
  const [qidiruv, setQidiruv] = useState('');
  const [filtrMahsulotlar, setFiltrMahsulotlar] = useState([]);
  const [tolovTuri, setTolovTuri] = useState('naqd');
  const [tolovSummasi, setTolovSummasi] = useState('');
  const [chegirma, setChegirma] = useState(0);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [chekModal, setChekModal] = useState(null);
  const qidiruvRef = useRef(null);

  useEffect(() => {
    mahsulotlarYuklash();
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
          { id: 1, nom: 'Non', barkod: '4600001', sotish_narxi: 3000, qoldiq: 50, birlik: 'dona', min_qoldiq: 5 },
          { id: 2, nom: 'Qand (1kg)', barkod: '4600002', sotish_narxi: 15000, qoldiq: 30, birlik: 'kg', min_qoldiq: 5 },
          { id: 3, nom: 'Tuz (1kg)', barkod: '4600003', sotish_narxi: 5000, qoldiq: 20, birlik: 'kg', min_qoldiq: 5 },
          { id: 4, nom: 'Yog\' (1L)', barkod: '4600004', sotish_narxi: 25000, qoldiq: 15, birlik: 'litr', min_qoldiq: 5 },
          { id: 5, nom: 'Guruch (1kg)', barkod: '4600005', sotish_narxi: 12000, qoldiq: 40, birlik: 'kg', min_qoldiq: 5 },
          { id: 6, nom: 'Un (2kg)', barkod: '4600006', sotish_narxi: 18000, qoldiq: 25, birlik: 'kg', min_qoldiq: 5 },
          { id: 7, nom: 'Makaron', barkod: '4600007', sotish_narxi: 8000, qoldiq: 35, birlik: 'dona', min_qoldiq: 5 },
          { id: 8, nom: 'Choy (100g)', barkod: '4600008', sotish_narxi: 22000, qoldiq: 18, birlik: 'dona', min_qoldiq: 3 },
          { id: 9, nom: 'Suv (1.5L)', barkod: '4600009', sotish_narxi: 4000, qoldiq: 60, birlik: 'dona', min_qoldiq: 10 },
          { id: 10, nom: 'Shampun', barkod: '4600010', sotish_narxi: 35000, qoldiq: 12, birlik: 'dona', min_qoldiq: 3 },
        ];
        setMahsulotlar(demoMahsulotlar);
        toast('🎭 Demo rejim — namuna mahsulotlar', { icon: '⚠️' });
      }
    }
  };

  // Barkod scanner uchun
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

        {/* Qidiruv */}
        <div className="relative">
          <input
            ref={qidiruvRef}
            type="text"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value)}
            onKeyDown={barkodSkanerlash}
            placeholder="🔍 Mahsulot nomi yoki barkod (Enter = skanerlash)"
            className="input-field pl-4 pr-10 py-3 text-base"
          />
          {qidiruv && (
            <button
              onClick={() => setQidiruv('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
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
                  onClick={() => setTolovTuri(tur)}
                  className={`py-2 text-xs rounded-lg font-medium transition-colors ${
                    tolovTuri === tur
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tur === 'naqd' ? '💵 Naqd' : tur === 'karta' ? '💳 Karta' : '📝 Nasiya'}
                </button>
              ))}
            </div>

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
