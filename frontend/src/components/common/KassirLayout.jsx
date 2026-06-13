import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { onlineMi } from '../../services/offlineDB';

const tabItems = [
  { path: '/kassa',      label: 'Kassa',      icon: '🛒' },
  { path: '/qarzdarlar', label: 'Qarzdarlar', icon: '💳' },
  { path: '/ombor',      label: 'Ombor',      icon: '🏪' },
  { path: '/mahsulotlar',label: 'Mahsulotlar',icon: '📦' },
  { path: '/hisobotlar', label: 'Hisobotlar', icon: '📊' },
];

export default function KassirLayout({ children }) {
  const [vaqt, setVaqt] = useState(new Date());
  const { foydalanuvchi, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = onlineMi();

  useEffect(() => {
    const t = setInterval(() => setVaqt(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const chiqish = () => { logout(); navigate('/login'); };

  const soat = vaqt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const sana = vaqt.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* ===== TEPA HEADER ===== */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">

          {/* Chap: Logo + Kassir ismi */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">
              {foydalanuvchi?.ism?.[0] || 'K'}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{foydalanuvchi?.ism}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-blue-200">💼 Kassir</span>
                <span className="text-blue-400">•</span>
                <span className={`text-xs flex items-center gap-1 ${online ? 'text-green-300' : 'text-red-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* O'rta: Baraka nomi */}
          <div className="text-center hidden sm:block">
            <p className="font-bold text-lg tracking-wide">🏬 Baraka</p>
            <p className="text-xs text-blue-200">POS Tizim</p>
          </div>

          {/* O'ng: Soat + Sana + Chiqish */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xl font-bold font-mono tracking-widest text-green-300">{soat}</p>
              <p className="text-xs text-blue-200">{sana}</p>
            </div>
            <button
              onClick={chiqish}
              className="bg-white/10 hover:bg-red-500/80 transition-colors p-2 rounded-xl text-white"
              title="Chiqish"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ===== ASOSIY KONTENT ===== */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>

      {/* ===== PASTKI TAB BAR ===== */}
      <nav className="bg-white border-t border-gray-200 shadow-lg flex-shrink-0 safe-area-bottom">
        <div className="flex">
          {tabItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all ${
                  isActive
                    ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-gray-600 border-t-2 border-transparent'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
