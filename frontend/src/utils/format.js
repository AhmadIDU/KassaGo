// Pul formati: 25000 → "25 000 so'm"
export const pulFormat = (summa) => {
  if (!summa && summa !== 0) return "0 so'm";
  return Number(summa).toLocaleString('uz-UZ') + " so'm";
};

// Sana formati
export const sanaFormat = (sana) => {
  if (!sana) return '';
  return new Date(sana).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Sana va vaqt formati
export const sanaVaqtFormat = (sana) => {
  if (!sana) return '';
  return new Date(sana).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Foiz hisoblash
export const foizHisob = (qism, jami) => {
  if (!jami || jami === 0) return 0;
  return ((qism / jami) * 100).toFixed(1);
};

// Bugungi sana ISO format
export const bugungiSana = () => {
  return new Date().toISOString().slice(0, 10);
};
