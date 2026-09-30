import { PEOPLE, RATING_MAX, RATING_TIERS } from '../config/config.js';

/**
 * Normaliza una nota del Sheets a número o null.
 * "10/10" → 10 · "7.5/10" → 7.5 · "7,5" → 7.5 · "8" → 8 · "" → null · "abc" → null
 */
export function parseRating(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 && raw <= RATING_MAX ? raw : null;
  }

  const text = String(raw).trim().replace(',', '.');
  if (!text) return null;

  // Número inicial de 1 o 2 cifras (con decimales opcionales), no seguido de más cifras.
  const match = text.match(/^(\d{1,2}(?:\.\d+)?)(?![\d.])/);
  if (!match) return null;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0 || value > RATING_MAX) return null;
  return Math.round(value * 100) / 100;
}

/** Media de las notas existentes. Si no hay ninguna, null (nunca una media falsa). */
export function averageOf(values) {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

/** Diferencia absoluta entre las dos personas. Solo si ambas han puntuado. */
export function ratingDifference(ratings) {
  const [a, b] = PEOPLE.map((p) => ratings?.[p.key]);
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return Math.round(Math.abs(a - b) * 100) / 100;
}

/** 8.5 → "8.5" · 10 → "10" · null → "—" */
export function formatRating(value, { withMax = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return withMax ? `${text}/${RATING_MAX}` : text;
}

/** "1 punto" · "2.5 puntos" */
export function formatPoints(value) {
  const text = formatRating(value);
  return value === 1 ? `${text} punto` : `${text} puntos`;
}

/** Coincidencia de una película: 100% misma nota, 0% si se separan 10 puntos. */
export function matchPercent(difference) {
  if (typeof difference !== 'number') return null;
  return Math.max(0, Math.round(100 - (difference / RATING_MAX) * 100));
}

/** 'high' | 'mid' | 'low' | 'unrated' */
export function ratingTier(average) {
  if (typeof average !== 'number') return 'unrated';
  if (average >= RATING_TIERS.high) return 'high';
  if (average >= RATING_TIERS.mid) return 'mid';
  return 'low';
}
