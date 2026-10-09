/**
 * Fechas de la columna "Fecha" del Google Sheets.
 *
 * El CSV exporta la celda como se ve en la hoja, así que hay que admitir
 * varios formatos. Regla de oro: si el valor no se lee sin riesgo a
 * equivocarse, se devuelve null. Nunca una fecha inventada.
 *
 * Nota sobre el orden dd/mm: la hoja y la app son en español, así que
 * "05/01/2024" se lee como 5 de enero. Solo se asume ISO (aaaa-mm-dd) cuando
 * el primer grupo tiene 4 cifras, que es inequívoco.
 */

const MONTH_BY_NAME = {
  enero: 1,
  ene: 1,
  febrero: 2,
  feb: 2,
  marzo: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  jun: 6,
  julio: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  septiembre: 9,
  setiembre: 9,
  sep: 9,
  set: 9,
  octubre: 10,
  oct: 10,
  noviembre: 11,
  nov: 11,
  diciembre: 12,
  dic: 12,
};

// Los nombres completos primero: "septiembre" contiene "sep".
const MONTH_TOKENS = Object.keys(MONTH_BY_NAME).sort((a, b) => b.length - a.length);

const pad = (n) => String(n).padStart(2, '0');

/**
 * "05/01/2024" · "2024-01-05" · "5 ene 2024" · "de enero de 2024"
 *   → { year, month, day, iso, ts } | null
 */
export function parseWatchDate(raw) {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().toLowerCase();
  if (!text) return null;

  let year;
  let month;
  let day;

  // 1. ISO: aaaa-mm-dd (4 cifras al principio = inequívoco).
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [, year, month, day] = match.map(Number);
  }

  // 2. dd/mm/aa(aaa), con / · - o . como separador.
  if (!match) {
    match = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
    if (match) {
      [, day, month, year] = match.map(Number);
    }
  }

  // 3. Con nombre de mes: "5 de ene de 2024" · "ene 2024" · "enero de 2024".
  if (!match) {
    const token = MONTH_TOKENS.find((name) => text.includes(name));
    if (token) {
      month = MONTH_BY_NAME[token];
      const yearMatch = text.match(/\b(\d{4})\b/);
      // \b protege: dentro de "2024" no hay dos cifras con bordes de palabra.
      const dayMatch = text.match(/\b(\d{1,2})\b/);
      if (yearMatch) year = Number(yearMatch[1]);
      if (dayMatch) day = Number(dayMatch[1]);
    }
  }

  if (!year || !month) return null;
  if (!day) day = 1;
  // Años de 2 cifras: 00-68 → 2000-2068 (convención habitual).
  if (year < 100) year += year <= 68 ? 2000 : 1900;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Fechas imposibles (30 de febrero) ruedan de mes: se descartan.
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return { year, month, day, iso: `${year}-${pad(month)}-${pad(day)}`, ts: date.getTime() };
}

/** Clave de mes para agrupar: { year: 2024, month: 1 } → "2024-01". */
export function monthKey({ year, month }) {
  return `${year}-${pad(month)}`;
}

const monthFormatter = new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' });

/** "2024-01" → "ene 2024". */
export function formatMonth(key) {
  const [year, month] = key.split('-').map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1)).replace('.', '');
}

/** Clave de día: "2024-01-05". */
export function dayKey(watchedAt) {
  return watchedAt.iso;
}

const dayFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });

/** "2024-01-05" → "5 de enero de 2024". */
export function formatDay(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return dayFormatter.format(new Date(year, month - 1, day));
}
