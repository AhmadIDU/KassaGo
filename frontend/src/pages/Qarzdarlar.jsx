import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { pulFormat, sanaFormat, sanaVaqtFormat } from '../utils/format';
import toast from 'react-hot-toast';

// Demo ma'lumotlar (backend bo'lmaganda)
const DEMO_MIJOZLAR = [
  { id: 1, ism: 'Karimov Sardor', telefon: '+998901234567', manzil: 'Yunusobod', nasiya_summasi: 150000, jami_qarz: 150000 },
  { id: 2, ism: 'Rahimova Malika', telefon: '+998909876543', manzil: 'Chilonzor', nasiya_summasi: 75000, jami_qarz: 75000 },
  { id: 3, ism: 'Toshmatov Jasur', telefon: '+998911112233', manzil: 'Shayxontohur', nasiya_summasi: 320000, jami_qarz: 320000 },
  { id: 4, ism: 'Yusupova Dilnoza', telefon: '+998935556677', manzil: 'Mirzo Ulugbek', nasiya_summasi: 0, jami_qarz: 0 },
];

const DEMO_STATISTIKA = {
  statistika: { jami_mijozlar: 4, qarzdor_mijozlar: 3, jami_qarz: 545000, ochiq_nasiyalar: 5, muddati_otgan: 1 },
  top_qarzdorlar: [
    { id: 3, ism: 'Toshmatov Jasur', telefon: '+998911112233', qarz: 320000 },
    { id: 1, ism: 'Karimov Sardor', telefon: '+998901234567', qarz: 150000 },
    { id: 2, ism: 'Rahimova Malika', telefon: '+998909876543', qarz: 75000 },
  ],
};

// ===================== MIJOZ MODAL =====================
function MijozModal({ mijoz, yopish, saqlash }) {
  const [form, setForm] = useState(
    mijoz || { ism: '', telefon: '', manzil: '', izoh: '' }
  );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">{mijoz ? '✏️ Mijoz tahrirlash' : '👤 Yangi mijoz'}</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Ism familiya *</label>
            <input
              className="input-field mt-1"
              value={form.ism}
              onChange={e => setForm({ ...form, ism: e.target.value })}
              placeholder="Mijoz ismi"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Telefon raqam</label>
            <input
              className="input-field mt-1"
              value={form.telefon || ''}
              onChange={e => setForm({ ...form, telefon: e.target.value })}
              placeholder="+998 90 000 00 00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Manzil</label>
            <input
              className="input-field mt-1"
              value={form.manzil || ''}
              onChange={e => setForm({ ...form, manzil: e.target.value })}
              placeholder="Yashash manzili"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Izoh</label>
            <textarea
              className="input-field mt-1 resize-none"
              rows={2}
              value={form.izoh || ''}
              onChange={e => setForm({ ...form, izoh: e.target.value })}
              placeholder="Qo'shimcha ma'lumot"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={yopish} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => {
                if (!form.ism.trim()) { toast.error('Ism kiritilishi shart!'); return; }
                saqlash(form);
              }}
              className="btn-primary flex-1"
            >
              💾 Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== TO'LOV MODAL =====================
function TolovModal({ mijoz, nasiyalar, yopish, saqlash }) {
  const [tanlangan, setTanlangan] = useState(nasiyalar[0]?.id || '');
  const [summa, setSumma] = useState('');
  const [izoh, setIzoh] = useState('');

  const tanlanganNasiya = nasiyalar.find(n => n.id === parseInt(tanlangan));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">💵 To'lov qabul qilish</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Mijoz */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-medium text-blue-800">👤 {mijoz.ism}</p>
            <p className="text-sm text-blue-600">{mijoz.telefon || 'Telefon yo\'q'}</p>
            <p className="text-sm font-bold text-red-600 mt-1">
              Jami qarz: {pulFormat(mijoz.jami_qarz || mijoz.nasiya_summasi)}
            </p>
          </div>

          {/* Nasiya tanlash */}
          {nasiyalar.length > 1 && (
            <div>
              <label className="text-sm font-medium text-gray-700">Qaysi nasiya uchun</label>
              <select
                className="input-field mt-1"
                value={tanlangan}
                onChange={e => setTanlangan(e.target.value)}
              >
                {nasiyalar.map(n => (
                  <option key={n.id} value={n.id}>
                    {pulFormat(n.qolgan_summa)} — {sanaFormat(n.yaratilgan)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tanlanganNasiya && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
              Qolgan qarz: <strong className="text-red-600">{pulFormat(tanlanganNasiya.qolgan_summa)}</strong>
            </div>
          )}

          {/* Summa */}
          <div>
            <label className="text-sm font-medium text-gray-700">To'lov summasi *</label>
            <input
              type="number"
              className="input-field mt-1 text-lg font-bold"
              value={summa}
              onChange={e => setSumma(e.target.value)}
              placeholder="0"
              autoFocus
            />
            {tanlanganNasiya && (
              <button
                onClick={() => setSumma(tanlanganNasiya.qolgan_summa)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                To'liq summa: {pulFormat(tanlanganNasiya.qolgan_summa)}
              </button>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Izoh</label>
            <input
              className="input-field mt-1"
              value={izoh}
              onChange={e => setIzoh(e.target.value)}
              placeholder="To'lov izohi (ixtiyoriy)"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={yopish} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => {
                if (!summa || parseFloat(summa) <= 0) {
                  toast.error('Summa kiritilishi shart!');
                  return;
                }
                saqlash({ nasiya_id: parseInt(tanlangan), summa: parseFloat(summa), izoh });
              }}
              className="btn-success flex-1"
            >
              ✅ To'lovni qabul qil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== MIJOZ DETAIL MODAL =====================
function MijozDetailModal({ mijozId, yopish, tolovQilish }) {
  const [malumot, setMalumot] = useState(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);

  useEffect(() => {
    yuklash();
  }, [mijozId]);

  const yuklash = async () => {
    try {
      const res = await api.get(`/nasiya/mijozlar/${mijozId}`);
      setMalumot(res.data);
    } catch {
      // Demo
      const demo = DEMO_MIJOZLAR.find(m => m.id === mijozId);
      setMalumot({
        mijoz: demo,
        nasiyalar: [
          { id: 1, summa: 150000, qolgan_summa: demo?.nasiya_summasi || 0, holat: 'ochiq', yaratilgan: new Date().toISOString(), izoh: 'Oziq-ovqat' },
        ],
        tolovlar: [],
      });
    } finally {
      setYuklanmoqda(false);
    }
  };

  if (yuklanmoqda) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center">⏳ Yuklanmoqda...</div>
    </div>
  );

  const { mijoz, nasiyalar, tolovlar } = malumot || {};
  const ochiqNasiyalar = nasiyalar?.filter(n => n.holat === 'ochiq') || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">👤 {mijoz?.ism}</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Mijoz ma'lumotlari */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Telefon</p>
              <p className="font-medium">{mijoz?.telefon || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Manzil</p>
              <p className="font-medium">{mijoz?.manzil || '—'}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-red-500">Jami qarz</p>
              <p className="text-xl font-bold text-red-600">{pulFormat(mijoz?.nasiya_summasi)}</p>
            </div>
          </div>

          {/* Ochiq nasiyalar */}
          {ochiqNasiyalar.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700">📋 Ochiq nasiyalar</h4>
                <button
                  onClick={() => tolovQilish(mijoz, ochiqNasiyalar)}
                  className="btn-success text-sm py-1.5"
                >
                  💵 To'lov qilish
                </button>
              </div>
              <div className="space-y-2">
                {ochiqNasiyalar.map(n => (
                  <div key={n.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Dastlabki qarz: {pulFormat(n.summa)}</p>
                        <p className="font-bold text-red-600">Qolgan: {pulFormat(n.qolgan_summa)}</p>
                        {n.izoh && <p className="text-xs text-gray-400 mt-0.5">📝 {n.izoh}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{sanaFormat(n.yaratilgan)}</p>
                        {n.muddati && (
                          <p className={`text-xs font-medium ${new Date(n.muddati) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                            Muddat: {sanaFormat(n.muddati)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* To'lovlar tarixi */}
          {tolovlar?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">✅ To'lovlar tarixi</h4>
              <div className="space-y-2">
                {tolovlar.map(t => (
                  <div key={t.id} className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                    <div>
                      <p className="font-bold text-green-600">{pulFormat(t.summa)}</p>
                      {t.izoh && <p className="text-xs text-gray-400">{t.izoh}</p>}
                    </div>
                    <p className="text-xs text-gray-400">{sanaVaqtFormat(t.yaratilgan)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ochiqNasiyalar.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p>Ochiq nasiya yo'q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== ASOSIY SAHIFA =====================
export default function Qarzdarlar() {
  const [tab, setTab] = useState('mijozlar');
  const [mijozlar, setMijozlar] = useState([]);
  const [statistika, setStatistika] = useState(null);
  const [qidiruv, setQidiruv] = useState('');
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [mijozModal, setMijozModal] = useState(null); // null | 'yangi' | mijoz_obj
  const [tolovModal, setTolovModal] = useState(null); // { mijoz, nasiyalar }
  const [detailModal, setDetailModal] = useState(null); // mijoz_id
  const [demoRejim, setDemoRejim] = useState(false);

  useEffect(() => {
    malumotYuklash();
  }, []);

  const malumotYuklash = async () => {
    setYuklanmoqda(true);
    try {
      const [mRes, sRes] = await Promise.all([
        api.get('/nasiya/mijozlar'),
        api.get('/nasiya/statistika'),
      ]);
      setMijozlar(mRes.data);
      setStatistika(sRes.data);
      setDemoRejim(false);
    } catch {
      setMijozlar(DEMO_MIJOZLAR);
      setStatistika(DEMO_STATISTIKA);
      setDemoRejim(true);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const mijozSaqlash = async (form) => {
    try {
      if (mijozModal === 'yangi') {
        await api.post('/nasiya/mijozlar', form);
        toast.success('✅ Mijoz qo\'shildi!');
      } else {
        await api.put(`/nasiya/mijozlar/${mijozModal.id}`, form);
        toast.success('✅ Mijoz yangilandi!');
      }
      setMijozModal(null);
      malumotYuklash();
    } catch (err) {
      if (demoRejim) {
        toast.success('✅ Saqlandi! (Demo rejim)');
        setMijozModal(null);
      } else {
        toast.error(err.response?.data?.xato || 'Xato!');
      }
    }
  };

  const tolovSaqlash = async (tolovMalumot) => {
    try {
      const res = await api.post('/nasiya/tolov', tolovMalumot);
      toast.success(res.data.xabar || '✅ To\'lov qabul qilindi!');
      setTolovModal(null);
      setDetailModal(null);
      malumotYuklash();
    } catch (err) {
      if (demoRejim) {
        toast.success('✅ To\'lov qabul qilindi! (Demo rejim)');
        setTolovModal(null);
        setDetailModal(null);
      } else {
        toast.error(err.response?.data?.xato || 'Xato!');
      }
    }
  };

  const filtrlangan = mijozlar.filter(m =>
    !qidiruv ||
    m.ism.toLowerCase().includes(qidiruv.toLowerCase()) ||
    m.telefon?.includes(qidiruv)
  );

  const stat = statistika?.statistika;

  return (
    <div className="space-y-4">
      {/* Sarlavha */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">💳 Qarzdarlar</h1>
          {demoRejim && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              🎭 Demo
            </span>
          )}
        </div>
        <button onClick={() => setMijozModal('yangi')} className="btn-primary">
          + Yangi mijoz
        </button>
      </div>

      {/* Statistika kartalar */}
      {stat && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{stat.jami_mijozlar}</p>
            <p className="text-xs text-gray-500">Jami mijozlar</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-500">{stat.qarzdor_mijozlar}</p>
            <p className="text-xs text-gray-500">Qarzdorlar</p>
          </div>
          <div className="card text-center col-span-2">
            <p className="text-xl font-bold text-red-600">{pulFormat(stat.jami_qarz)}</p>
            <p className="text-xs text-gray-500">Jami qarz summasi</p>
          </div>
        </div>
      )}

      {/* Tablar */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'mijozlar', label: '👥 Barcha mijozlar' },
          { id: 'qarzdorlar', label: '⚠️ Qarzdorlar' },
          { id: 'top', label: '🏆 Top qarzdorlar' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Qidiruv */}
      <div className="flex gap-3">
        <input
          type="text"
          value={qidiruv}
          onChange={e => setQidiruv(e.target.value)}
          placeholder="🔍 Ism yoki telefon..."
          className="input-field max-w-xs"
        />
        <button onClick={malumotYuklash} className="btn-secondary">🔄</button>
      </div>

      {/* Mijozlar jadvali */}
      {(tab === 'mijozlar' || tab === 'qarzdorlar') && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Mijoz</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Manzil</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qarz</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {yuklanmoqda ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">⏳ Yuklanmoqda...</td>
                  </tr>
                ) : filtrlangan
                    .filter(m => tab === 'qarzdorlar' ? m.nasiya_summasi > 0 : true)
                    .length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">
                      {tab === 'qarzdorlar' ? '✅ Qarzdor mijoz yo\'q!' : 'Mijoz topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filtrlangan
                    .filter(m => tab === 'qarzdorlar' ? m.nasiya_summasi > 0 : true)
                    .map(m => (
                      <tr key={m.id} className={`hover:bg-gray-50 ${m.nasiya_summasi > 0 ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetailModal(m.id)}
                            className="font-medium text-blue-600 hover:underline text-left"
                          >
                            {m.ism}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {m.telefon ? (
                            <a href={`tel:${m.telefon}`} className="hover:text-blue-600">
                              📞 {m.telefon}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.manzil || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {m.nasiya_summasi > 0 ? (
                            <span className="font-bold text-red-600">{pulFormat(m.nasiya_summasi)}</span>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">✅ Qarz yo'q</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => setDetailModal(m.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                              title="Batafsil"
                            >
                              👁️
                            </button>
                            {m.nasiya_summasi > 0 && (
                              <button
                                onClick={() => {
                                  setTolovModal({
                                    mijoz: m,
                                    nasiyalar: [{ id: 1, summa: m.nasiya_summasi, qolgan_summa: m.nasiya_summasi, holat: 'ochiq', yaratilgan: new Date().toISOString() }]
                                  });
                                }}
                                className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs"
                                title="To'lov qilish"
                              >
                                💵
                              </button>
                            )}
                            <button
                              onClick={() => setMijozModal(m)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs"
                              title="Tahrirlash"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top qarzdorlar */}
      {tab === 'top' && (
        <div className="card max-w-lg">
          <h3 className="font-semibold text-gray-700 mb-4">🏆 Eng ko'p qarzdorlar</h3>
          {statistika?.top_qarzdorlar?.length > 0 ? (
            <div className="space-y-3">
              {statistika.top_qarzdorlar.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{m.ism}</p>
                    <p className="text-xs text-gray-500">{m.telefon || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{pulFormat(m.qarz)}</p>
                    <button
                      onClick={() => setDetailModal(m.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Batafsil →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">✅ Qarzdor yo'q!</p>
          )}
        </div>
      )}

      {/* Modalar */}
      {mijozModal && (
        <MijozModal
          mijoz={mijozModal === 'yangi' ? null : mijozModal}
          yopish={() => setMijozModal(null)}
          saqlash={mijozSaqlash}
        />
      )}

      {tolovModal && (
        <TolovModal
          mijoz={tolovModal.mijoz}
          nasiyalar={tolovModal.nasiyalar}
          yopish={() => setTolovModal(null)}
          saqlash={tolovSaqlash}
        />
      )}

      {detailModal && (
        <MijozDetailModal
          mijozId={detailModal}
          yopish={() => setDetailModal(null)}
          tolovQilish={(mijoz, nasiyalar) => {
            setDetailModal(null);
            setTolovModal({ mijoz, nasiyalar });
          }}
        />
      )}
    </div>
  );
}
