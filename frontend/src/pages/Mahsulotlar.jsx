import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { pulFormat, sanaFormat } from '../utils/format';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function MahsulotModal({ mahsulot, kategoriyalar, yopish, saqlash }) {
  const [form, setForm] = useState(mahsulot || {
    nom: '', barkod: '', kategoriya_id: '', sotish_narxi: '',
    sotib_olish_narxi: '', qoldiq: 0, min_qoldiq: 5, birlik: 'dona'
  });

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
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">{mahsulot ? 'Mahsulot tahrirlash' : 'Yangi mahsulot'}</h3>
          <button onClick={yopish} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Nomi *</label>
            <input className="input-field mt-1" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Mahsulot nomi" />
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
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={yopish} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" className="btn-primary flex-1">Saqlash</button>
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
    } catch { toast.error('Ma\'lumot yuklanmadi'); }
    finally { setYuklanmoqda(false); }
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
                      <td className="px-4 py-3 font-medium text-gray-800">{m.nom}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{m.barkod || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{m.kategoriya_nom || '—'}</td>
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
