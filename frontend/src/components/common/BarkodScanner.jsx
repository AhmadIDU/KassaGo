import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarkodScanner({ onSkanerlandi, yopish }) {
  const [xato, setXato] = useState(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [kameralar, setKameralar] = useState([]);
  const [tanlanganKamera, setTanlanganKamera] = useState(null);
  const scannerRef = useRef(null);
  const scannerId = 'baraka-barkod-scanner';

  useEffect(() => {
    kameralarniYuklash();
    return () => {
      scannerniToxtatish();
    };
  }, []);

  const kameralarniYuklash = async () => {
    try {
      const qurilmalar = await Html5Qrcode.getCameras();
      setKameralar(qurilmalar);
      if (qurilmalar.length > 0) {
        // Orqa kamerani tanlash (telefon uchun)
        const orqaKamera = qurilmalar.find(k =>
          k.label.toLowerCase().includes('back') ||
          k.label.toLowerCase().includes('orqa') ||
          k.label.toLowerCase().includes('environment')
        );
        setTanlanganKamera(orqaKamera?.id || qurilmalar[0].id);
      }
    } catch (err) {
      setXato('Kameraga ruxsat berilmadi. Brauzер sozlamalaridan ruxsat bering.');
    }
  };

  const scannerniBoshlash = async (kameraId) => {
    if (ishlamoqda) return;

    try {
      setXato(null);
      scannerRef.current = new Html5Qrcode(scannerId);

      await scannerRef.current.start(
        kameraId || tanlanganKamera,
        {
          fps: 15,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Muvaffaqiyatli skanerlandi
          scannerniToxtatish();
          onSkanerlandi(decodedText.trim());
        },
        () => {
          // Har bir frame da xato — ignore
        }
      );
      setIshlamoqda(true);
    } catch (err) {
      setXato('Kamerani ishga tushirishda xato: ' + err.message);
      setIshlamoqda(false);
    }
  };

  const scannerniToxtatish = async () => {
    try {
      if (scannerRef.current && ishlamoqda) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch {}
    setIshlamoqda(false);
  };

  useEffect(() => {
    if (tanlanganKamera) {
      scannerniBoshlash(tanlanganKamera);
    }
  }, [tanlanganKamera]);

  const kameraAlmashtirish = async (kameraId) => {
    await scannerniToxtatish();
    setTanlanganKamera(kameraId);
    setTimeout(() => scannerniBoshlash(kameraId), 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="font-bold text-sm">Barkod / QR Scanner</h3>
              <p className="text-xs text-slate-300">Mahsulotni kameraga tutib turing</p>
            </div>
          </div>
          <button
            onClick={() => { scannerniToxtatish(); yopish(); }}
            className="w-8 h-8 bg-slate-700 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Kamera tanlash */}
        {kameralar.length > 1 && (
          <div className="px-4 pt-3">
            <select
              value={tanlanganKamera || ''}
              onChange={e => kameraAlmashtirish(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50"
            >
              {kameralar.map(k => (
                <option key={k.id} value={k.id}>
                  📹 {k.label || `Kamera ${k.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner oynasi */}
        <div className="p-4">
          {xato ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📵</div>
              <p className="text-sm text-red-600 font-medium mb-3">{xato}</p>
              <button
                onClick={kameralarniYuklash}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg"
              >
                🔄 Qayta urinish
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Scanner div */}
              <div
                id={scannerId}
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '220px' }}
              />

              {/* Agar ishlamoqda bo'lsa — maqsad chiziqlari */}
              {ishlamoqda && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-36">
                    {/* Burchak chiziqlari */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                    {/* Skanerlash chizig'i animatsiyasi */}
                    <div className="absolute left-2 right-2 h-0.5 bg-green-400 opacity-80 animate-scan-line" />
                  </div>
                </div>
              )}

              {/* Yuklanmoqda */}
              {!ishlamoqda && !xato && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="text-white text-center">
                    <div className="text-3xl mb-2 animate-pulse">📷</div>
                    <p className="text-sm">Kamera yuklanmoqda...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Qo'lda kiritish */}
        <div className="px-4 pb-4">
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 text-center mb-2">— yoki qo'lda kiriting —</p>
            <ManualBarkod onKiritildi={(val) => { scannerniToxtatish(); onSkanerlandi(val); }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 8px; }
          50% { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Qo'lda barkod kiritish
function ManualBarkod({ onKiritildi }) {
  const [qiymat, setQiymat] = useState('');

  const yuborish = (e) => {
    e.preventDefault();
    if (qiymat.trim()) {
      onKiritildi(qiymat.trim());
      setQiymat('');
    }
  };

  return (
    <form onSubmit={yuborish} className="flex gap-2">
      <input
        type="text"
        value={qiymat}
        onChange={e => setQiymat(e.target.value)}
        placeholder="Barkodni kiriting..."
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!qiymat.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        ✓
      </button>
    </form>
  );
}
