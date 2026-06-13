import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { pulFormat, sanaVaqtFormat } from '../utils/format';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Demo ma'lumotlar (backend bo'lmaganda)
const DEMO_STATISTIKA = {
  bugun: { soni: 12, summa: 345000 },
  mahsulotlar: { jami: 48, kam_qoldiq: 3 },
  haftalik_savdo: [
    { kun: '2026-06-07', daromad: 280000, soni: 9 },
    { kun: '2026-06-08', daromad: 420000, soni: 14 },
    { kun: '2026-06-09', daromad: 310000, soni: 10 },
    { kun: '2026-06-10', daromad: 190000, soni: 6 },
    { kun: '2026-06-11', daromad: 520000, soni: 17 },
    { kun: '2026-06-12', daromad: 390000, soni: 13 },
    { kun: '2026-06-13', daromad: 345000, soni: 12 },
  ],
  oxirgi_savdolar: [
    { id: 1, chek_raqam: 'CHK-20260613-1234', jami_summa: 45000, tolov_turi: 'naqd', yaratilgan: new Date().toISOString() },
    { id: 2, chek_raqam: 'CHK-20260613-1233', jami_summa: 72000, tolov_turi: 'karta', yaratilgan: new Date(Date.now()-3600000).toISOString() },
    { id: 3, chek_raqam: 'CHK-20260613-1232', jami_summa: 28500, tolov_turi: 'naqd', yaratilgan: new Date(Date.now()-7200000).toISOString() },
    { id: 4, chek_raqam: 'CHK-20260613-1231', jami_summa: 156000, tolov_turi: 'nasiya', yaratilgan: new Date(Date.now()-10800000).toISOString() },
    { id: 5, chek_raqam: 'CHK-20260613-1230', jami_summa: 43500, tolov_turi: 'naqd', yaratilgan: new Date(Date.now()-14400000).toISOString() },
  ],
};

function StatCard({ icon, sarlavha, qiymat, rang, izoh }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`text-3xl p-3 rounded-xl ${rang}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{sarlavha}</p>
        <p className="text-2xl font-bold text-gray-800">{qiymat}</p>
        {izoh && <p className="text-xs text-gray-400 mt-0.5">{izoh}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [statistika, setStatistika] = useState(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [demoRejim, setDemoRejim] = useState(false);

  useEffect(() => {
    malumotlarOlish();
  }, []);

  const malumotlarOlish = async () => {
    try {
      const res = await api.get('/hisobot/dashboard');
      setStatistika(res.data);
      setDemoRejim(false);
    } catch (err) {
      // Backend yo'q — demo ma'lumot ko'rsatamiz
      setStatistika(DEMO_STATISTIKA);
      setDemoRejim(true);
    } finally {
      setYuklanmoqda(false);
    }
  };

  if (yuklanmoqda) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const haftalikData = {
    labels: statistika?.haftalik_savdo?.map(d =>
      new Date(d.kun).toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' })
    ) || [],
    datasets: [{
      label: 'Daromad (so\'m)',
      data: statistika?.haftalik_savdo?.map(d => d.daromad) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 6,
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🏠 Bosh sahifa</h1>
        <div className="flex items-center gap-3">
          {demoRejim && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              🎭 Demo rejim — Backend ulanmagan
            </span>
          )}
          <button onClick={malumotlarOlish} className="btn-secondary text-sm">
            🔄 Yangilash
          </button>
        </div>
      </div>

      {/* Stat kartalar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          sarlavha="Bugungi savdo"
          qiymat={pulFormat(statistika?.bugun?.summa)}
          rang="bg-blue-50"
          izoh={`${statistika?.bugun?.soni} ta chek`}
        />
        <StatCard
          icon="📦"
          sarlavha="Jami mahsulotlar"
          qiymat={statistika?.mahsulotlar?.jami || 0}
          rang="bg-green-50"
          izoh="Faol mahsulotlar"
        />
        <StatCard
          icon="⚠️"
          sarlavha="Kam qoldiq"
          qiymat={statistika?.mahsulotlar?.kam_qoldiq || 0}
          rang="bg-yellow-50"
          izoh="Tovar tugayapti"
        />
        <StatCard
          icon="🧾"
          sarlavha="Oxirgi savdolar"
          qiymat={statistika?.oxirgi_savdolar?.length || 0}
          rang="bg-purple-50"
          izoh="So'nggi 5 ta"
        />
      </div>

      {/* Grafik va jadval */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Grafik */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-700 mb-4">📈 Haftalik savdo</h2>
          {statistika?.haftalik_savdo?.length > 0 ? (
            <Bar
              data={haftalikData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => (value / 1000).toFixed(0) + 'K',
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Hali savdo ma'lumotlari yo'q
            </div>
          )}
        </div>

        {/* Oxirgi savdolar */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">🧾 Oxirgi savdolar</h2>
          {statistika?.oxirgi_savdolar?.length > 0 ? (
            <div className="space-y-3">
              {statistika.oxirgi_savdolar.map((savdo) => (
                <div key={savdo.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{savdo.chek_raqam}</p>
                    <p className="text-xs text-gray-400">{sanaVaqtFormat(savdo.yaratilgan)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{pulFormat(savdo.jami_summa)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      savdo.tolov_turi === 'naqd' ? 'bg-green-100 text-green-700' :
                      savdo.tolov_turi === 'karta' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {savdo.tolov_turi}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Savdo yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}
