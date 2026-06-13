import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { pulFormat, sanaVaqtFormat } from '../utils/format';
import toast from 'react-hot-toast';

export default function Ombor() {
  const [tab, setTab] = useState('hisobot'); // hisobot | harakatlar | kirim
  const [omborMalumot, setOmborMalumot] = useState(null);
  const [harakatlar, setHarakatlar] = useState([]);
  const [mahsulotlar, setMahsulotlar] = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [kirimForm, setKirimForm] = useState({ mahsulot_id: '', miqdor: '', narx: '', sabab: '' });

  useEffect(() => {
    malumotYuklash();
  }, []);

  useEffect(() => {
    if (tab === 'harakatlar') harakatlarYuklash();
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
      // Demo data
      const demoMahsulotlar = [
        { id: 1,  nom: 'Non (oq)',          barkod: '4600001', sotish_narxi: 3000,  sotib_olish_narxi: 2200,  qoldiq: 80,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Non-novvot', kam_qoldiq: false, ombor_qiymati: 176000 },
        { id: 5,  nom: 'Qand (1kg)',         barkod: '4600005', sotish_narxi: 15000, sotib_olish_narxi: 12000, qoldiq: 50,  min_qoldiq: 10, birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 600000 },
        { id: 6,  nom: 'Tuz (1kg)',          barkod: '4600006', sotish_narxi: 5000,  sotib_olish_narxi: 3500,  qoldiq: 45,  min_qoldiq: 5,  birlik: 'kg',   kategoriya_nom: 'Quruq ozuqa', kam_qoldiq: false, ombor_qiymati: 157500 },
        { id: 14, nom: 'O\'simlik yog\'i (1L)', barkod: '4600014', sotish_narxi: 25000, sotib_olish_narxi: 20000, qoldiq: 40, min_qoldiq: 5, birlik: 'litr', kategoriya_nom: 'Yog\'-moy', kam_qoldiq: false, ombor_qiymati: 800000 },
        { id: 17, nom: 'Sut (1L)',           barkod: '4600017', sotish_narxi: 12000, sotib_olish_narxi: 9000,  qoldiq: 35,  min_qoldiq: 10, birlik: 'litr', kategoriya_nom: 'Sut mahsulot', kam_qoldiq: false, ombor_qiymati: 315000 },
        { id: 27, nom: 'Suv (0.5L)',         barkod: '4600027', sotish_narxi: 2500,  sotib_olish_narxi: 1800,  qoldiq: 100, min_qoldiq: 20, birlik: 'dona', kategoriya_nom: 'Ichimlik', kam_qoldiq: false, ombor_qiymati: 180000 },
        { id: 29, nom: 'Coca-Cola (0.5L)',   barkod: '4600029', sotish_narxi: 9000,  sotib_olish_narxi: 7000,  qoldiq: 48,  min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik', kam_qoldiq: false, ombor_qiymati: 336000 },
        { id: 60, nom: 'Mustak pivo (0.5L)', barkod: '4600060', sotish_narxi: 2000,  sotib_olish_narxi: 1500,  qoldiq: 3,   min_qoldiq: 10, birlik: 'dona', kategoriya_nom: 'Ichimlik', kam_qoldiq: true,  ombor_qiymati: 4500 },
      ];
      setOmborMalumot({
        mahsulotlar: demoMahsulotlar,
        statistika: {
          jami_mahsulotlar: 60,
          kam_qoldiqlar: 4,
          jami_ombor_qiymati: 12500000,
        }
      });
      setMahsulotlar(demoMahsulotlar);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const harakatlarYuklash = async () => {
    try {
      const res = await api.get('/ombor?limit=100');
      setHarakatlar(res.data);
    } catch { toast.error('Harakatlar yuklanmadi'); }
  };

  const kirimYuborish = async (e) => {
    e.preventDefault();
    if (!kirimForm.mahsulot_id || !kirimForm.miqdor) {
      toast.error('Mahsulot va miqdor kiritilishi shart!');
      return;
    }
    try {
      const res = await api.post('/ombor/kirim', kirimForm);
      toast.success(`✅ ${kirimForm.miqdor} ta tovar kirim qilindi! Yangi qoldiq: ${res.data.yangi_qoldiq}`);
      setKirimForm({ mahsulot_id: '', miqdor: '', narx: '', sabab: '' });
      malumotYuklash();
    } catch (err) {
      toast.error(err.response?.data?.xato || 'Kirim qo\'shishda xato!');
    }
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
      <div className="flex gap-2 border-b">
        {[
          { id: 'hisobot', label: '📊 Qoldiqlar' },
          { id: 'kirim', label: '📥 Kirim qo\'shish' },
          { id: 'harakatlar', label: '📋 Harakatlar' },
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

      {/* Qoldiqlar */}
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
                      {m.kam_qoldiq ? <span className="badge-red">⚠️ Kam</span> : <span className="badge-green">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kirim */}
      {tab === 'kirim' && (
        <div className="card max-w-md">
          <h3 className="font-bold text-gray-800 mb-4">📥 Tovar kirim qo'shish</h3>
          <form onSubmit={kirimYuborish} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mahsulot *</label>
              <select
                className="input-field mt-1"
                value={kirimForm.mahsulot_id}
                onChange={e => setKirimForm({...kirimForm, mahsulot_id: e.target.value})}
              >
                <option value="">Mahsulot tanlang</option>
                {mahsulotlar.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nom} (Qoldiq: {m.qoldiq} {m.birlik})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Miqdor *</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={kirimForm.miqdor}
                  onChange={e => setKirimForm({...kirimForm, miqdor: e.target.value})}
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Narx (ixtiyoriy)</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={kirimForm.narx}
                  onChange={e => setKirimForm({...kirimForm, narx: e.target.value})}
                  placeholder="Sotib olish narxi"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sabab</label>
              <input
                className="input-field mt-1"
                value={kirimForm.sabab}
                onChange={e => setKirimForm({...kirimForm, sabab: e.target.value})}
                placeholder="Tovar kirim sababi"
              />
            </div>
            <button type="submit" className="btn-success w-full">
              ✅ Kirim qo'shish
            </button>
          </form>
        </div>
      )}

      {/* Harakatlar */}
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
                  <tr><td colSpan="6" className="text-center py-12 text-gray-400">Harakatlar yo'q</td></tr>
                ) : harakatlar.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{sanaVaqtFormat(h.yaratilgan)}</td>
                    <td className="px-4 py-3 font-medium">{h.mahsulot_nom}</td>
                    <td className="px-4 py-3 text-center">
                      {h.harakat_turi === 'kirim' ? (
                        <span className="badge-green">📥 Kirim</span>
                      ) : h.harakat_turi === 'chiqim' ? (
                        <span className="badge-red">📤 Chiqim</span>
                      ) : (
                        <span className="badge-blue">✏️ Tuzatish</span>
                      )}
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
    </div>
  );
}
