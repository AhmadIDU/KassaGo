import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { onlineMi } from '../../services/offlineDB';

const tabItems = [
  { path: '/kassa',       label: 'Kassa',       icon: '🛒' },
  { path: '/qarzdarlar',  label: 'Qarzdarlar',  icon: '💳' },
  { path: '/ombor',       label: 'Ombor',        icon: '🏪' },
  { path: '/mahsulotlar', label: 'Mahsulotlar',  icon: '📦' },
  { path: '/hisobotlar',  label: 'Hisobotlar',   icon: '📊' },
];

export default function KassirLayout({ children }) {
  const [vaqt, setVaqt] = useState(new Date());
  const { foydalanuvchi, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const online = onlineMi();

  useEffect(() => {
    const t = setInterval(() => setVaqt(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const chiqish = () => {
    if (window.confirm('Tizimdan chiqmoqchimisiz?')) {
      logout();
      navigate('/login');
    }
  };

  const soat = vaqt.toLocaleTimeString('uz-UZ', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const sana = vaqt.toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Joriy sahifa nomi
  const joriyTab = tabItems.find(t => t.path === location.pathname);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f0fdf4' }}>

      {/* ===== TEPA HEADER ===== */}
      <header style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)' }}
        className="flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5">

          {/* Chap: Kassir info */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/25 rounded-xl flex items-center justify-center text-white font-bold text-base border border-white/30">
              {foydalanuvchi?.ism?.[0]?.toUpperCase() || 'K'}
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{foydalanuvchi?.ism}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-green-200 text-xs">💼 Kassir</span>
                <span className="text-green-400 text-xs">•</span>
                <span className={`text-xs flex items-center gap-1 ${online ? 'text-green-200' : 'text-red-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${online ? 'bg-green-300 animate-pulse' : 'bg-red-400'}`}></span>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* O'rta: Do'kon nomi + joriy sahifa */}
          <div className="text-center">
            <p className="font-extrabold text-white text-base tracking-wide">🏬 Baraka</p>
            <p className="text-green-200 text-xs">
              {joriyTab ? `${joriyTab.icon} ${joriyTab.label}` : 'POS Tizim'}
            </p>
          </div>

          {/* O'ng: Soat + Chiqish */}
          <div className="flex items-center gap-2">
            <div className="text-right bg-white/15 rounded-xl px-3 py-1.5 border border-white/20">
              <p className="text-xl font-bold font-mono tracking-widest text-white leading-tight">{soat}</p>
              <p className="text-green-200 text-xs text-right">{sana}</p>
            </div>
            <button
              onClick={chiqish}
              title="Chiqish"
              className="w-9 h-9 bg-white/15 hover:bg-red-500/70 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ===== ASOSIY KONTENT ===== */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* ===== PASTKI TAB BAR ===== */}
      <nav className="flex-shrink-0 bg-white border-t-2 border-green-100 shadow-lg">
        <div className="flex">
          {tabItems.map((item) => {
            const faol = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-all"
                style={{
                  color: faol ? '#16a34a' : '#9ca3af',
                  borderTop: faol ? '3px solid #16a34a' : '3px solid transparent',
                  background: faol ? '#f0fdf4' : 'white',
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
