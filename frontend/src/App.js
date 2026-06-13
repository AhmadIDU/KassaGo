import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Layout from './components/common/Layout';
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

// Himoyalangan route
function HimoyalananRoute({ children, adminKerak }) {
  const { foydalanuvchi, token } = useAuthStore();

  if (!token || !foydalanuvchi) {
    return <Navigate to="/login" replace />;
  }

  if (adminKerak && foydalanuvchi.rol !== 'admin') {
    return <Navigate to="/kassa" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Dashboard faqat admin uchun
function DashboardRoute() {
  const { foydalanuvchi, token } = useAuthStore();
  if (!token || !foydalanuvchi) return <Navigate to="/login" replace />;
  if (foydalanuvchi.rol !== 'admin') return <Navigate to="/kassa" replace />;
  return <Layout><Dashboard /></Layout>;
}

// Asosiy yo'naltirish — admin → dashboard, kassir → kassa
function AsosiyYonaltirish() {
  const { foydalanuvchi, token } = useAuthStore();
  if (!token || !foydalanuvchi) return <Navigate to="/login" replace />;
  if (foydalanuvchi.rol === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/kassa" replace />;
}

export default function App() {
  const { token } = useAuthStore();

  // Offline savdolarni sync qilish (online bo'lganda)
  useEffect(() => {
    const syncQilish = async () => {
      if (!navigator.onLine || !token) return;

      try {
        const offlineSavdolar = await offlineSavdolarniOlish();
        if (offlineSavdolar.length > 0) {
          await api.post('/savdo/sync/offline', { savdolar: offlineSavdolar });
          console.log(`✅ ${offlineSavdolar.length} ta offline savdo sync qilindi`);
        }
      } catch (err) {
        console.log('Sync xatosi:', err);
      }
    };

    window.addEventListener('online', syncQilish);
    syncQilish(); // Darhol tekshirish

    return () => window.removeEventListener('online', syncQilish);
  }, [token]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '8px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<DashboardRoute />} />

        <Route path="/kassa" element={
          <HimoyalananRoute><Kassa /></HimoyalananRoute>
        } />
        <Route path="/mahsulotlar" element={
          <HimoyalananRoute><Mahsulotlar /></HimoyalananRoute>
        } />
        <Route path="/ombor" element={
          <HimoyalananRoute><Ombor /></HimoyalananRoute>
        } />
        <Route path="/hisobotlar" element={
          <HimoyalananRoute><Hisobotlar /></HimoyalananRoute>
        } />
        <Route path="/qarzdarlar" element={
          <HimoyalananRoute><Qarzdarlar /></HimoyalananRoute>
        } />
        <Route path="/foydalanuvchilar" element={
          <HimoyalananRoute adminKerak={true}><Foydalanuvchilar /></HimoyalananRoute>
        } />

        <Route path="/" element={<AsosiyYonaltirish />} />
        <Route path="*" element={<AsosiyYonaltirish />} />
      </Routes>
    </BrowserRouter>
  );
}
