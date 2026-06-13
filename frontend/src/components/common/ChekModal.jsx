import React, { useRef } from 'react';
import { pulFormat, sanaVaqtFormat } from '../../utils/format';
import useAuthStore from '../../store/authStore';

export default function ChekModal({ chek, yopish, yangiSavdo }) {
  const printRef = useRef(null);
  const { foydalanuvchi } = useAuthStore();

  if (!chek) return null;

  const chopEtish = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=350,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Chek - ${chek.chek_raqam}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 300px;
              padding: 10px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .title { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0; }
            .small { font-size: 10px; color: #555; }
            .total { font-size: 14px; font-weight: bold; }
            .badge {
              display: inline-block;
              padding: 1px 6px;
              border: 1px solid #000;
              border-radius: 4px;
              font-size: 10px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
  };

  const tolovRangi = chek.tolov_turi === 'naqd'
    ? '#16a34a' : chek.tolov_turi === 'karta'
    ? '#2563eb' : '#ea580c';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Yashil tasdiqlash banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-4 text-center">
          <div className="text-4xl mb-1">✅</div>
          <p className="font-bold text-lg">Savdo muvaffaqiyatli!</p>
          <p className="text-green-100 text-sm">{chek.chek_raqam}</p>
        </div>

        {/* Chek matni (print uchun) */}
        <div ref={printRef} className="px-5 py-4 font-mono text-sm">
          {/* Chek boshi */}
          <div className="text-center mb-3">
            <p className="text-xl font-bold tracking-wide">🏬 BARAKA</p>
            <p className="text-xs text-gray-500">Do'kon kassa cheki</p>
            <p className="text-xs text-gray-400 mt-1">{sanaVaqtFormat(chek.yaratilgan || new Date())}</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Chek raqam */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Chek raqami:</span>
            <span className="font-bold text-gray-700">{chek.chek_raqam}</span>
          </div>

          {/* Kassir */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>Kassir:</span>
            <span className="font-medium text-gray-700">{foydalanuvchi?.ism || chek.kassir_ism || '—'}</span>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Mahsulotlar */}
          {chek.elementlar && chek.elementlar.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-600 mb-2">MAHSULOTLAR:</p>
              <div className="space-y-1.5">
                {chek.elementlar.map((el, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-800 truncate">{el.mahsulot_nom}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{el.miqdor} × {pulFormat(el.narx)}</span>
                      <span className="font-bold text-gray-700">{pulFormat(el.jami)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Jami */}
          <div className="space-y-1.5 mb-3">
            {chek.chegirma > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Chegirma:</span>
                <span className="text-red-500">- {pulFormat(chek.chegirma)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">JAMI:</span>
              <span className="text-xl font-bold text-green-600">{pulFormat(chek.jami_summa)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">To'lov turi:</span>
              <span
                className="font-bold px-2 py-0.5 rounded-full text-white text-xs"
                style={{ backgroundColor: tolovRangi }}
              >
                {chek.tolov_turi === 'naqd' ? '💵 Naqd' :
                 chek.tolov_turi === 'karta' ? '💳 Karta' : '📝 Nasiya'}
              </span>
            </div>
            {chek.tolov_turi === 'naqd' && chek.tolov_summasi > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Qabul qilindi:</span>
                  <span className="font-medium">{pulFormat(chek.tolov_summasi)}</span>
                </div>
                {chek.qaytim > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Qaytim:</span>
                    <span className="font-bold text-green-600">{pulFormat(chek.qaytim)}</span>
                  </div>
                )}
              </>
            )}
            {chek.tolov_turi === 'nasiya' && chek.mijoz_ism && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Mijoz:</span>
                <span className="font-bold text-orange-600">{chek.mijoz_ism}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Pastki izoh */}
          <p className="text-center text-xs text-gray-400 mt-2">
            ⭐ Xaridingiz uchun rahmat! ⭐
          </p>
          <p className="text-center text-xs text-gray-300 mt-1">
            Baraka Do'kon • +998 90 000 00 00
          </p>
        </div>

        {/* Tugmalar */}
        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          <button
            onClick={chopEtish}
            className="flex flex-col items-center gap-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <span className="text-xl">🖨️</span>
            <span className="text-xs font-medium text-gray-600">Chop</span>
          </button>
          <button
            onClick={yangiSavdo}
            className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-bold shadow-md"
          >
            <span>🛒</span>
            <span>Yangi savdo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
