import { create } from 'zustand';
import api from '../utils/api';

// Demo foydalanuvchilar (backend bo'lmaganda)
const DEMO_USERS = [
  { id: 1, ism: 'Administrator', login: 'admin', parol: 'admin123', rol: 'admin' },
  { id: 2, ism: 'Kassir 1', login: 'kassir', parol: 'kassir123', rol: 'kassir' },
];

const useAuthStore = create((set) => ({
  foydalanuvchi: JSON.parse(localStorage.getItem('baraka_user')) || null,
  token: localStorage.getItem('baraka_token') || null,
  yuklanmoqda: false,
  xato: null,
  demoRejim: false,

  login: async (loginVal, parol) => {
    set({ yuklanmoqda: true, xato: null });
    try {
      // Avval real backend ga urinib ko'ramiz
      const res = await api.post('/auth/login', { login: loginVal, parol });
      const { token, foydalanuvchi } = res.data;

      localStorage.setItem('baraka_token', token);
      localStorage.setItem('baraka_user', JSON.stringify(foydalanuvchi));

      set({ token, foydalanuvchi, yuklanmoqda: false, demoRejim: false });
      return { muvaffaqiyat: true };
    } catch (err) {
      // Backend ishlamasa — demo rejimda kirish
      const demoUser = DEMO_USERS.find(
        u => u.login === loginVal && u.parol === parol
      );

      if (demoUser) {
        const fakeToken = 'demo_token_' + Date.now();
        const foydalanuvchi = {
          id: demoUser.id,
          ism: demoUser.ism,
          login: demoUser.login,
          rol: demoUser.rol,
        };

        localStorage.setItem('baraka_token', fakeToken);
        localStorage.setItem('baraka_user', JSON.stringify(foydalanuvchi));
        localStorage.setItem('baraka_demo', 'true');

        set({ token: fakeToken, foydalanuvchi, yuklanmoqda: false, demoRejim: true });
        return { muvaffaqiyat: true, demo: true };
      }

      const xato = err.response?.data?.xato || 'Login yoki parol noto\'g\'ri!';
      set({ xato, yuklanmoqda: false });
      return { muvaffaqiyat: false, xato };
    }
  },

  logout: () => {
    localStorage.removeItem('baraka_token');
    localStorage.removeItem('baraka_user');
    localStorage.removeItem('baraka_demo');
    set({ foydalanuvchi: null, token: null, demoRejim: false });
  },

  xatoTozalash: () => set({ xato: null }),
}));

export default useAuthStore;
