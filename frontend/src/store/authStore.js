import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  foydalanuvchi: JSON.parse(localStorage.getItem('baraka_user')) || null,
  token: localStorage.getItem('baraka_token') || null,
  yuklanmoqda: false,
  xato: null,

  login: async (login, parol) => {
    set({ yuklanmoqda: true, xato: null });
    try {
      const res = await api.post('/auth/login', { login, parol });
      const { token, foydalanuvchi } = res.data;

      localStorage.setItem('baraka_token', token);
      localStorage.setItem('baraka_user', JSON.stringify(foydalanuvchi));

      set({ token, foydalanuvchi, yuklanmoqda: false });
      return { muvaffaqiyat: true };
    } catch (err) {
      const xato = err.response?.data?.xato || 'Tizimga kirishda xato.';
      set({ xato, yuklanmoqda: false });
      return { muvaffaqiyat: false, xato };
    }
  },

  logout: () => {
    localStorage.removeItem('baraka_token');
    localStorage.removeItem('baraka_user');
    set({ foydalanuvchi: null, token: null });
  },

  xatoTozalash: () => set({ xato: null }),
}));

export default useAuthStore;
