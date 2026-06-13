import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { pulFormat, sanaVaqtFormat } from '../utils/format';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  useEffect(() => {
    malumotlarOlish();
  }, []);

  const malumotlarOlish = async () => {
    try {
      const res = await api.get('/hisobot/dashboard');
      setStatistika(res.data);
    } catch (err) {
      toast.error('Ma\'lumot yuklanmadi');
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
        <button onClick={malumotlarOlish} className="btn-secondary text-sm">
          🔄 Yangilash
        </button>
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
