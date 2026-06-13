import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { pulFormat, bugungiSana } from '../utils/format';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Hisobotlar() {
  const [tab, setTab] = useState('kunlik');
  const [kunlikData, setKunlikData] = useState(null);
  const [oylikData, setOylikData] = useState(null);
  const [sana, setSana] = useState(bugungiSana());
  const [yil, setYil] = useState(new Date().getFullYear());
  const [oy, setOy] = useState(new Date().getMonth() + 1);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  useEffect(() => {
    if (tab === 'kunlik') kunlikHisobot();
    else if (tab === 'oylik') oylikHisobot();
  }, [tab, sana, yil, oy]);

  const kunlikHisobot = async () => {
    setYuklanmoqda(true);
    try {
      const res = await api.get(`/hisobot/kunlik?sana=${sana}`);
      setKunlikData(res.data);
    } catch { toast.error('Hisobot yuklanmadi'); }
    finally { setYuklanmoqda(false); }
  };

  const oylikHisobot = async () => {
    setYuklanmoqda(true);
    try {
      const res = await api.get(`/hisobot/oylik?yil=${yil}&oy=${oy}`);
      setOylikData(res.data);
    } catch { toast.error('Hisobot yuklanmadi'); }
    finally { setYuklanmoqda(false); }
  };

  const oylar = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">📊 Hisobotlar</h1>

      {/* Tablar */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'kunlik', label: '📅 Kunlik' },
          { id: 'oylik', label: '📆 Oylik' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Kunlik hisobot */}
      {tab === 'kunlik' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={sana}
              onChange={e => setSana(e.target.value)}
              className="input-field max-w-xs"
            />
            <button onClick={kunlikHisobot} className="btn-secondary">🔄 Yangilash</button>
          </div>

          {yuklanmoqda ? (
            <div className="text-center py-16 text-gray-400">⏳ Yuklanmoqda...</div>
          ) : kunlikData ? (
            <>
              {/* Statistika */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-600">{kunlikData.umumiy?.savdolar_soni || 0}</p>
                  <p className="text-sm text-gray-500">Savdolar soni</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-green-600">{pulFormat(kunlikData.umumiy?.jami_daromad)}</p>
                  <p className="text-sm text-gray-500">Jami daromad</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-emerald-600">{pulFormat(kunlikData.umumiy?.naqd)}</p>
                  <p className="text-sm text-gray-500">Naqd</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-purple-600">{pulFormat(kunlikData.umumiy?.karta)}</p>
                  <p className="text-sm text-gray-500">Karta</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Soat bo'yicha grafik */}
                {kunlikData.soat_boyicha?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold mb-3">⏰ Soat bo'yicha savdo</h3>
                    <Bar
                      data={{
                        labels: kunlikData.soat_boyicha.map(s => `${s.soat}:00`),
                        datasets: [{
                          label: 'Daromad',
                          data: kunlikData.soat_boyicha.map(s => s.daromad),
                          backgroundColor: 'rgba(59, 130, 246, 0.7)',
                          borderRadius: 4,
                        }],
                      }}
                      options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                  </div>
                )}

                {/* Top mahsulotlar */}
                {kunlikData.top_mahsulotlar?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold mb-3">🏆 Top mahsulotlar</h3>
                    <div className="space-y-2">
                      {kunlikData.top_mahsulotlar.slice(0, 8).map((m, i) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium">{m.mahsulot_nom}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{m.jami_miqdor} ta</p>
                            <p className="text-sm font-bold text-green-600">{pulFormat(m.jami_summa)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Oylik hisobot */}
      {tab === 'oylik' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={yil} onChange={e => setYil(e.target.value)} className="input-field w-28">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={oy} onChange={e => setOy(e.target.value)} className="input-field w-36">
              {oylar.map((o, i) => <option key={i+1} value={i+1}>{o}</option>)}
            </select>
            <button onClick={oylikHisobot} className="btn-secondary">🔄 Yangilash</button>
          </div>

          {yuklanmoqda ? (
            <div className="text-center py-16 text-gray-400">⏳ Yuklanmoqda...</div>
          ) : oylikData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-600">{oylikData.umumiy?.savdolar_soni || 0}</p>
                  <p className="text-sm text-gray-500">Savdolar</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-green-600">{pulFormat(oylikData.umumiy?.jami_daromad)}</p>
                  <p className="text-sm text-gray-500">Jami daromad</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-emerald-600">{pulFormat(oylikData.umumiy?.naqd)}</p>
                  <p className="text-sm text-gray-500">Naqd</p>
                </div>
                <div className="card text-center">
                  <p className="text-lg font-bold text-orange-500">{pulFormat(oylikData.umumiy?.nasiya)}</p>
                  <p className="text-sm text-gray-500">Nasiya</p>
                </div>
              </div>

              {/* Kunlik grafik */}
              {oylikData.kunlik_savdolar?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">📈 Kunlik savdo dinamikasi</h3>
                  <Bar
                    data={{
                      labels: oylikData.kunlik_savdolar.map(d =>
                        new Date(d.kun).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
                      ),
                      datasets: [{
                        label: 'Daromad',
                        data: oylikData.kunlik_savdolar.map(d => d.daromad),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderRadius: 4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { ticks: { callback: v => (v/1000).toFixed(0)+'K' } } }
                    }}
                  />
                </div>
              )}

              {/* Top mahsulotlar */}
              {oylikData.top_mahsulotlar?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">🏆 Oylik top mahsulotlar</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2">#</th>
                          <th className="text-left px-3 py-2">Mahsulot</th>
                          <th className="text-right px-3 py-2">Miqdor</th>
                          <th className="text-right px-3 py-2">Summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oylikData.top_mahsulotlar.map((m, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2 font-medium">{m.mahsulot_nom}</td>
                            <td className="px-3 py-2 text-right">{m.jami_miqdor} ta</td>
                            <td className="px-3 py-2 text-right font-bold text-green-600">{pulFormat(m.jami_summa)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
