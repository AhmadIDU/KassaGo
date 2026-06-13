import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { sanaFormat } from '../utils/format';
import toast from 'react-hot-toast';

export default function Foydalanuvchilar() {
  const [foydalanuvchilar, setFoydalanuvchilar] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ism: '', login: '', parol: '', rol: 'kassir' });
  const [yuklanmoqda, setYuklanmoqda] = useState(true);

  useEffect(() => {
    yuklash();
  }, []);

  const yuklash = async () => {
    try {
      const res = await api.get('/auth/foydalanuvchilar');
      setFoydalanuvchilar(res.data);
    } catch { toast.error('Yuklanmadi'); }
    finally { setYuklanmoqda(false); }
  };

  const saqlash = async (e) => {
    e.preventDefault();
    if (!form.ism || !form.login || !form.parol) {
      toast.error('Barcha maydonlar to\'ldirilishi shart!');
      return;
    }
    try {
      await api.post('/auth/foydalanuvchilar', form);
      toast.success('Foydalanuvchi qo\'shildi!');
      setModal(false);
      setForm({ ism: '', login: '', parol: '', rol: 'kassir' });
      yuklash();
    } catch (err) {
      toast.error(err.response?.data?.xato || 'Xato!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">👥 Foydalanuvchilar</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Yangi</button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Ism</th>
              <th className="text-left px-4 py-3 text-gray-600">Login</th>
              <th className="text-center px-4 py-3 text-gray-600">Rol</th>
              <th className="text-center px-4 py-3 text-gray-600">Holat</th>
              <th className="text-left px-4 py-3 text-gray-600">Qo'shilgan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {yuklanmoqda ? (
              <tr><td colSpan="5" className="text-center py-12 text-gray-400">⏳ Yuklanmoqda...</td></tr>
            ) : foydalanuvchilar.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{f.ism}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{f.login}</td>
                <td className="px-4 py-3 text-center">
                  <span className={f.rol === 'admin' ? 'badge-blue' : 'badge-green'}>
                    {f.rol === 'admin' ? '👑 Admin' : '💼 Kassir'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={f.faol ? 'badge-green' : 'badge-red'}>
                    {f.faol ? 'Faol' : 'Bloklangan'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{sanaFormat(f.yaratilgan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Yangi foydalanuvchi</h3>
              <button onClick={() => setModal(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={saqlash} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Ism *</label>
                <input className="input-field mt-1" value={form.ism} onChange={e => setForm({...form, ism: e.target.value})} placeholder="To'liq ism" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Login *</label>
                <input className="input-field mt-1" value={form.login} onChange={e => setForm({...form, login: e.target.value})} placeholder="login" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Parol *</label>
                <input type="password" className="input-field mt-1" value={form.parol} onChange={e => setForm({...form, parol: e.target.value})} placeholder="parol" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select className="input-field mt-1" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                  <option value="kassir">Kassir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
                <button type="submit" className="btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
