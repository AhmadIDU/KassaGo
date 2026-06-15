import React, { useEffect, useRef, useState } from 'react';

export default function BarkodScanner({ onSkanerlandi, yopish }) {
  const [rejim, setRejim] = useState('auto'); // auto | kamera | qolda
  const [xato, setXato] = useState(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [kameralar, setKameralar] = useState([]);
  const [tanlanganKamera, setTanlanganKamera] = useState(null);
  const [qolda, setQolda] = useState('');
  const scannerRef = useRef(null);
  const inputRef = useRef(null);
  const scannerId = 'baraka-scanner-div';

  // HTTPS yoki localhost da kamera ishlaydi
  const httpsOrLocal = window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  useEffect(() => {
    if (httpsOrLocal) {
      // Kamera rejimini urinib ko'ramiz
      kameralarniYuklash();
    } else {
      // HTTP da — qo'lda kiritish rejimi
      setRejim('qolda');
      setXato('HTTP da kamera ishlamaydi. Qo\'lda kiriting yoki USB scanner ishlating.');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => scannerniToxtatish();
  }, []);

  useEffect(() => {
    if (rejim === 'qolda') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [rejim]);

  const kameralarniYuklash = async () => {
    try {
      // html5-qrcode ni dinamik yuklash
      const { Html5Qrcode } = await import('html5-qrcode');
      const qurilmalar = await Html5Qrcode.getCameras();
      if (qurilmalar.length > 0) {
        setKameralar(qurilmalar);
        const orqa = qurilmalar.find(k =>
          k.label.toLowerCase().includes('back') ||
          k.label.toLowerCase().includes('environment')
        );
        setTanlanganKamera(orqa?.id || qurilmalar[0].id);
        setRejim('kamera');
      } else {
        setRejim('qolda');
      }
    } catch {
      setRejim('qolda');
    }
  };

  useEffect(() => {
    if (rejim === 'kamera' && tanlanganKamera) {
      scannerniBoshlash(tanlanganKamera);
    }
  }, [rejim, tanlanganKamera]);

  const scannerniBoshlash = async (kameraId) => {
    if (ishlamoqda) return;
    try {
      setXato(null);
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerRef.current = new Html5Qrcode(scannerId);
      await scannerRef.current.start(
        kameraId,
        { fps: 15, qrbox: { width: 250, height: 150 } },
        (text) => { scannerniToxtatish(); onSkanerlandi(text.trim()); },
        () => {}
      );
      setIshlamoqda(true);
    } catch (err) {
      setXato('Kamera ishlamadi: ' + err.message);
      setRejim('qolda');
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

  // USB Scanner / qo'lda kiritish
  const qoldaYuborish = (e) => {
    e.preventDefault();
    const val = qolda.trim();
    if (val) {
      scannerniToxtatish();
      onSkanerlandi(val);
      setQolda('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">📷</span>
            <div>
              <p className="font-bold text-sm">Barkod / QR Scanner</p>
              <p className="text-xs text-green-200">
                {rejim === 'kamera' ? 'Kamera orqali skanerlash' : 'Qo\'lda yoki USB scanner'}
              </p>
            </div>
          </div>
          <button onClick={() => { scannerniToxtatish(); yopish(); }}
            className="w-8 h-8 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Rejim tanlash */}
        <div className="flex border-b">
          <button
            onClick={() => { scannerniToxtatish(); setRejim('kamera'); kameralarniYuklash(); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rejim === 'kamera'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📷 Kamera
          </button>
          <button
            onClick={() => { scannerniToxtatish(); setRejim('qolda'); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rejim === 'qolda'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⌨️ Qo'lda / USB
          </button>
        </div>

        <div className="p-4">

          {/* KAMERA REJIMI */}
          {rejim === 'kamera' && (
            <div>
              {kameralar.length > 1 && (
                <select
                  value={tanlanganKamera || ''}
                  onChange={e => {
                    scannerniToxtatish();
                    setTanlanganKamera(e.target.value);
                    setTimeout(() => scannerniBoshlash(e.target.value), 500);
                  }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mb-3 bg-gray-50"
                >
                  {kameralar.map(k => (
                    <option key={k.id} value={k.id}>
                      📹 {k.label || `Kamera ${k.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}

              {xato ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <p className="text-sm text-orange-700 font-medium mb-2">{xato}</p>
                  <button onClick={() => setRejim('qolda')}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg font-medium">
                    ⌨️ Qo'lda kiritishga o'tish
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div id={scannerId} className="w-full rounded-xl overflow-hidden bg-black"
                    style={{ minHeight: '200px' }} />
                  {ishlamoqda && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-52 h-32">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-green-400 rounded-tl" style={{ borderWidth: '3px' }} />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-green-400 rounded-tr" style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-green-400 rounded-bl" style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-green-400 rounded-br" style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
                      </div>
                    </div>
                  )}
                  {!ishlamoqda && !xato && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                      <div className="text-white text-center">
                        <div className="text-3xl mb-1 animate-pulse">📷</div>
                        <p className="text-sm">Kamera yuklanmoqda...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!xato && !httpsOrLocal && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-700">
                  ⚠️ HTTP da kamera ishlamaydi. HTTPS yoki localhost da ishlaydi.
                </div>
              )}
            </div>
          )}

          {/* QO'LDA / USB REJIMI */}
          {rejim === 'qolda' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-2xl mb-1">⌨️</p>
                <p className="text-sm font-medium text-blue-700">Qo'lda kiritish yoki USB Scanner</p>
                <p className="text-xs text-blue-500 mt-1">
                  USB barkod scanner ulangan bo'lsa — pastdagi maydonga skanerlang
                </p>
              </div>

              <form onSubmit={qoldaYuborish} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Barkod / QR kod raqami:
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={qolda}
                    onChange={e => setQolda(e.target.value)}
                    placeholder="Barkodni kiriting yoki skanerlang..."
                    className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-base font-mono focus:outline-none"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!qolda.trim()}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                >
                  ✅ Tasdiqlash
                </button>
              </form>

              <div className="border-t pt-3">
                <p className="text-xs text-gray-400 text-center mb-2">💡 Maslahatlar:</p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p>• USB scanner ulasangiz — avtomatik skanerlaydi</p>
                  <p>• Telefondan HTTPS kerak bo'ladi kamera uchun</p>
                  <p>• Barkodni qo'lda ham yozsa bo'ladi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
