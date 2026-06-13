import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ login: '', parol: '' });
  const { login, yuklanmoqda } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.login || !form.parol) {
      toast.error('Login va parol kiritilishi shart!');
      return;
    }

    const natija = await login(form.login, form.parol);
    if (natija.muvaffaqiyat) {
      if (natija.demo) {
        toast.success('Xush kelibsiz! (Demo rejim)', { icon: '🎭' });
      } else {
        toast.success('Xush kelibsiz!');
      }
      navigate('/dashboard');
    } else {
      toast.error(natija.xato || 'Kirishda xato!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏬</div>
          <h1 className="text-3xl font-bold text-slate-800">Baraka</h1>
          <p className="text-slate-500 mt-1">Kassa tizimi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login
            </label>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              placeholder="loginni kiriting"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              type="password"
              value={form.parol}
              onChange={(e) => setForm({ ...form, parol: e.target.value })}
              placeholder="parolni kiriting"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={yuklanmoqda}
            className="btn-primary w-full py-3 text-base mt-2"
          >
            {yuklanmoqda ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Kirish...
              </span>
            ) : (
              'Kirish'
            )}
          </button>
        </form>

        {/* Test ma'lumotlar */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p className="font-medium mb-1">Test uchun:</p>
          <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
          <p>Kassir: <strong>kassir</strong> / <strong>kassir123</strong></p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Baraka POS v1.0.0
        </p>
      </div>
    </div>
  );
}
