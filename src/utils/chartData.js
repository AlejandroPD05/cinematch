import { EXTRA_FIELDS, PEOPLE } from '../config/config.js';
import { averageOf } from './ratings.js';

/**
 * Datos para las gráficas, calculados como funciones puras (mismo espíritu que
 * statistics.js). Ninguna función dibuja: solo transforman películas en series
 * listas para el SVG.
 */

const hasNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

/* ─────────────── Mapa de acuerdo (dispersión) ─────────────── */

/**
 * Cada película con las DOS notas, como punto (x, y) en el plano.
 * `agreement` = cercanía a la diagonal (0 = misma nota, 10 = máximo desacuerdo).
 * Solo tiene sentido graficar si ambas personas han puntuado.
 */
export function getScatterPoints(movies) {
  const [a, b] = PEOPLE;
  return movies
    .filter((m) => hasNumber(m.ratings[a.key]) && hasNumber(m.ratings[b.key]))
    .map((m) => ({
      id: m.id,
      movie: m,
      x: m.ratings[a.key],
      y: m.ratings[b.key],
      agreement: m.difference ?? 0,
    }));
}

/* ─────────────── Evolución del gusto (línea) ─────────────── */

/**
 * Media móvil de la nota de cada persona a lo largo de la colección.
 * Sin columna de fecha usa `order` (cronológico: fila más abajo = más nuevo);
 * si TODAS las valoradas tienen fecha, el eje X pasa a ser tiempo real.
 *
 * Devuelve los puntos ya suavizados: `{ x, label, person1, person2, count }`.
 */
export function getRatingTimeline(movies, { window = 12 } = {}) {
  const [a, b] = PEOPLE;
  const rated = movies.filter((m) => hasNumber(m.average)).sort((x, y) => x.order - y.order);
  if (rated.length === 0) return { points: [], byDate: false };

  const byDate = rated.every((m) => m.watchedAt);

  // Serie cruda: un punto por película (order) o por mes (fecha).
  const buckets = new Map();
  rated.forEach((movie, index) => {
    const key = byDate ? `${movie.watchedAt.year}-${String(movie.watchedAt.month).padStart(2, '0')}` : index;
    if (!buckets.has(key)) buckets.set(key, { key, values: { [a.key]: [], [b.key]: [] } });
    const bucket = buckets.get(key);
    [a, b].forEach((person) => {
      const value = movie.ratings[person.key];
      if (hasNumber(value)) bucket.values[person.key].push(value);
    });
  });

  const series = [...buckets.values()];
  const points = series.map((bucket, index) => {
    // Media móvil centrada hacia atrás: cada punto mira hacia atrás `window` posiciones.
    const from = Math.max(0, index - window + 1);
    const windowed = series.slice(from, index + 1);
    return {
      x: index,
      label: byDate ? formatSeriesLabel(bucket.key) : String(index + 1),
      person1: averageOf(windowed.flatMap((w) => w.values[a.key])),
      person2: averageOf(windowed.flatMap((w) => w.values[b.key])),
      count: windowed.length,
    };
  });

  return { points, byDate };
}

function formatSeriesLabel(key) {
  const [year, month] = key.split('-').map(Number);
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${names[month - 1]} ${year}`;
}

/* ─────────────── Géneros / sagas / plataformas (barras) ─────────────── */

/** Mismo separador que getAvailableFacets: una celda puede listar varios valores. */
const MULTI_SEPARATOR = /[,;/|]/;

function splitValues(raw) {
  return String(raw)
    .split(MULTI_SEPARATOR)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Recuento por categoría de un campo extra (genre, saga, platform...).
 * Un mismo valor repetido en una película cuenta una sola vez.
 * Devuelve las `topN` primeras y agrupa el resto en "Otras".
 */
export function getFacetBreakdown(movies, key, { topN = 8 } = {}) {
  const counts = new Map();
  let total = 0;

  movies.forEach((movie) => {
    const raw = movie.details?.[key];
    if (!raw) return;
    total += 1;
    const unique = new Set(splitValues(raw));
    unique.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  });

  if (total === 0) return { total: 0, bars: [], restCount: 0 };

  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((x, y) => y.count - x.count || collator.compare(x.label, y.label));

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const restCount = rest.reduce((acc, r) => acc + r.count, 0);

  return {
    total,
    bars: top.map((bar) => ({ ...bar, pct: (bar.count / total) * 100 })),
    restCount: rest.length > 0 ? { count: restCount, categories: rest.length, pct: (restCount / total) * 100 } : null,
  };
}

/** Campos facet que tienen datos en esta colección (para el conmutador de la gráfica). */
export function getChartableFacets(movies) {
  return EXTRA_FIELDS.filter((field) => field.facet).filter((field) =>
    movies.some((movie) => Boolean(movie.details?.[field.key])),
  );
}

/* ─────────────── Futuro: noches de cine (calendario) ─────────────── */

/**
 * Recuento de películas por día a partir de la columna Fecha.
 * Devuelve null si no hay fechas: la gráfica del calendario se oculta sola.
 */
export function getWatchCalendar(movies) {
  const byDay = new Map();
  let dated = 0;

  movies.forEach((movie) => {
    if (!movie.watchedAt) return;
    dated += 1;
    const key = movie.watchedAt.iso;
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  });

  if (dated === 0) return null;

  const days = [...byDay.entries()].map(([iso, count]) => ({ iso, count }));
  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
  const maxCount = busiest.count;
  // Los ISO son YYYY-MM-DD: ordenar lexicográficamente es orden cronológico.
  const latestIso = days.reduce((latest, day) => (day.iso > latest ? day.iso : latest), days[0].iso);

  return { days, byDay, dated, distinctDays: days.length, busiest, maxCount, latestIso };
}
