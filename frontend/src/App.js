import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Layout from './components/common/Layout';
import KassirLayout from './components/common/KassirLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kassa from './pages/Kassa';
import Mahsulotlar from './pages/Mahsulotlar';
import Ombor from './pages/Ombor';
import Hisobotlar from './pages/Hisobotlar';
import Foydalanuvchilar from './pages/Foydalanuvchilar';
import Qarzdarlar from './pages/Qarzdarlar';
import { offlineSavdolarniOlish } from './services/offlineDB';
import api from './utils/api';

// Rol bo'yicha to'g'ri layout tanlash
function RolLayout({ children, adminKerak }) {
  const { foydalanuvchi, token } = useAuthStore();

  if (!token || !foydalanuvchi) {
    return <Navigate to="/login" replace />;
  }

  if (adminKerak && foydalanuvchi.rol !== 'admin') {
    return <Navigate to="/kassa" replace />;
  }

  // Admin → qora sidebar Layout
  // Kassir → ko'k header + pastki tab KassirLayout
  if (foydalanuvchi.rol === 'admin') {
    return <Layout>{children}</Layout>;
  }
  return <KassirLayout>{children}</KassirLayout>;
}

// Dashboard faqat admin uchun
function DashboardRoute() {
  const { foydalanuvchi, token } = useAuthStore();
  if (!token || !foydalanuvchi) return <Navigate to="/login" replace />;
  if (foydalanuvchi.rol !== 'admin') return <Navigate to="/kassa" replace />;
  return <Layout><Dashboard /></Layout>;
}

// Asosiy yo'naltirish
function AsosiyYonaltirish() {
  const { foydalanuvchi, token } = useAuthStore();
  if (!token || !foydalanuvchi) return <Navigate to="/login" replace />;
  if (foydalanuvchi.rol === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/kassa" replace />;
}

export default function App() {
  const { token } = useAuthStore();

  // Offline sync
  useEffect(() => {
    const syncQilish = async () => {
      if (!navigator.onLine || !token) return;
      try {
        const offlineSavdolar = await offlineSavdolarniOlish();
        if (offlineSavdolar.length > 0) {
          await api.post('/savdo/sync/offline', { savdolar: offlineSavdolar });
        }
      } catch {}
    };
    window.addEventListener('online', syncQilish);
    syncQilish();
    return () => window.removeEventListener('online', syncQilish);
  }, [token]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', fontSize: '14px', fontWeight: '500' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRoute />} />

        <Route path="/kassa" element={
          <RolLayout><Kassa /></RolLayout>
        } />
        <Route path="/mahsulotlar" element={
          <RolLayout><Mahsulotlar /></RolLayout>
        } />
        <Route path="/ombor" element={
          <RolLayout><Ombor /></RolLayout>
        } />
        <Route path="/hisobotlar" element={
          <RolLayout><Hisobotlar /></RolLayout>
        } />
        <Route path="/qarzdarlar" element={
          <RolLayout><Qarzdarlar /></RolLayout>
        } />
        <Route path="/foydalanuvchilar" element={
          <RolLayout adminKerak={true}><Foydalanuvchilar /></RolLayout>
        } />

        <Route path="/" element={<AsosiyYonaltirish />} />
        <Route path="*" element={<AsosiyYonaltirish />} />
      </Routes>
    </BrowserRouter>
  );
}
