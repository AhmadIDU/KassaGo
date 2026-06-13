import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { onlineMi } from '../../services/offlineDB';

export default function Layout({ children }) {
  const [sidebarOchiq, setSidebarOchiq] = useState(true);
  const [hozirgiVaqt, setHozirgiVaqt] = useState(new Date());
  const { foydalanuvchi, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = onlineMi();
  const isAdmin = foydalanuvchi?.rol === 'admin';

  // ⏰ Har soniyada vaqtni yangilash
  useEffect(() => {
    const interval = setInterval(() => {
      setHozirgiVaqt(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const chiqish = () => {
    logout();
    navigate('/login');
  };

  // Rol bo'yicha menu
  const menuItems = [
    // Bosh sahifa faqat adminga ko'rinadi
    ...(isAdmin ? [{ path: '/dashboard', label: 'Bosh sahifa', icon: '🏠' }] : []),
    { path: '/kassa', label: 'Kassa', icon: '🛒' },
    { path: '/mahsulotlar', label: 'Mahsulotlar', icon: '📦' },
    { path: '/ombor', label: 'Ombor', icon: '🏪' },
    { path: '/qarzdarlar', label: 'Qarzdarlar', icon: '💳' },
    { path: '/hisobotlar', label: 'Hisobotlar', icon: '📊' },
  ];

  const adminItems = [
    { path: '/foydalanuvchilar', label: 'Foydalanuvchilar', icon: '👥' },
  ];

  // Vaqt formatlash
  const vaqtStr = hozirgiVaqt.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const sanStr = hozirgiVaqt.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOchiq ? 'w-56' : 'w-16'} bg-slate-800 text-white flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <span className="text-2xl">🏬</span>
          {sidebarOchiq && (
            <div>
              <h1 className="font-bold text-lg leading-tight">Baraka</h1>
              <p className="text-xs text-slate-400">POS Tizim</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOchiq && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Admin bo'limi */}
          {isAdmin && (
            <>
              {sidebarOchiq && (
                <p className="text-xs text-slate-500 px-3 pt-3 pb-1 uppercase tracking-wider">
                  Admin
                </p>
              )}
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOchiq && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-700">
          {sidebarOchiq && (
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isAdmin ? 'bg-yellow-500' : 'bg-blue-600'
              }`}>
                {foydalanuvchi?.ism?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{foydalanuvchi?.ism}</p>
                <p className={`text-xs capitalize font-medium ${
                  isAdmin ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {isAdmin ? '👑 Admin' : '💼 Kassir'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={chiqish}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-red-400 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <span>🚪</span>
            {sidebarOchiq && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setSidebarOchiq(!sidebarOchiq)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            ☰
          </button>

          <div className="flex items-center gap-3">
            {/* Online/Offline */}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {online ? 'Online' : 'Offline'}
            </div>

            {/* ⏰ Sana va vaqt */}
            <div className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-400">{sanStr}</span>
              <span className="text-sm font-bold font-mono tracking-wider text-green-400">
                {vaqtStr}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
