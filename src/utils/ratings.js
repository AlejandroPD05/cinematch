import { PEOPLE, RATING_MAX, RATING_TIERS } from '../config/config.js';

// Separador entre temporadas: "8/10 - 10/10 - 7/10" (guion normal, medio o largo).
const SEASON_SEPARATOR = /\s*[-–—]\s*/;

/**
 * Normaliza UNA nota del Sheets a número o null.
 * "10/10" → 10 · "7.5/10" → 7.5 · "7,5" → 7.5 · "8" → 8 · "" → null · "?/10" → null
 */
function parseSingleRating(raw) {
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

/**
 * Notas por temporada: "8/10 - ?/10 - 7/10" → [8, null, 7].
 * Una película → [nota]. Celda vacía → [].
 */
export function parseSeasonRatings(raw) {
  if (raw === null || raw === undefined) return [];
  if (typeof raw === 'number') return [parseSingleRating(raw)];
  const text = String(raw).trim();
  if (!text) return [];
  return text.split(SEASON_SEPARATOR).map(parseSingleRating);
}

/**
 * Nota de una película o serie, como número o null.
 * Película: su nota. Serie con varias temporadas: la media de las que tienen nota.
 */
export function parseRating(raw) {
  const seasons = parseSeasonRatings(raw);
  if (seasons.length <= 1) return seasons[0] ?? null;
  return averageOf(seasons);
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