import {
  CACHE_MINUTES,
  GOOGLE_SHEET_CSV_URL,
  GOOGLE_SHEET_GID,
  GOOGLE_SHEET_ID,
} from '../config/config.js';
import { parseMoviesCsv } from '../utils/movieParser.js';

/**
 * Lee el Google Sheets como CSV. Solo lectura: la web nunca escribe en la hoja.
 *
 * Orden de intento:
 *   1. VITE_GOOGLE_SHEET_CSV_URL (si existe)
 *   2. /export?format=csv    → valores exactos tal y como se ven en la hoja
 *   3. /gviz/tq?tqx=out:csv  → respaldo con CORS muy estable
 */

const CACHE_KEY = `cinematch:sheet:${GOOGLE_SHEET_CSV_URL || `${GOOGLE_SHEET_ID}:${GOOGLE_SHEET_GID}`}`;
const REQUEST_TIMEOUT_MS = 15000;

export class SheetConfigError extends Error {}

export function isSheetConfigured() {
  return Boolean(GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_ID);
}

export function getSheetUrls() {
  const urls = [];
  if (GOOGLE_SHEET_CSV_URL) urls.push(GOOGLE_SHEET_CSV_URL);
  if (GOOGLE_SHEET_ID) {
    const id = encodeURIComponent(GOOGLE_SHEET_ID);
    const gid = encodeURIComponent(GOOGLE_SHEET_GID || '0');
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`);
  }
  return urls;
}

function withCacheBuster(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(withCacheBuster(url), {
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
    const text = await response.text();
    // Si la hoja no es pública, Google devuelve una página de login en HTML.
    if (/^\s*<(!doctype|html)/i.test(text)) {
      throw new Error(`La respuesta de ${url} es HTML, no CSV. ¿La hoja está compartida como "Cualquier persona con el enlace"?`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.csv || Date.now() - cached.savedAt > CACHE_MINUTES * 60 * 1000) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(csv) {
  const entry = { csv, savedAt: Date.now() };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Sin sessionStorage (modo privado estricto): la app funciona igual, solo sin caché.
  }
  return entry;
}

/**
 * Devuelve { movies, columns, fetchedAt, fromCache }.
 * force = true ignora la caché (botón "Actualizar").
 */
export async function loadMovies({ force = false } = {}) {
  if (!isSheetConfigured()) {
    throw new SheetConfigError(
      'Falta VITE_GOOGLE_SHEET_ID en el archivo .env (o en las variables de entorno de Vercel).',
    );
  }

  if (!force) {
    const cached = readCache();
    if (cached) {
      const parsed = parseMoviesCsv(cached.csv);
      if (parsed.movies.length > 0) return { ...parsed, fetchedAt: cached.savedAt, fromCache: true };
    }
  }

  const errors = [];
  for (const url of getSheetUrls()) {
    try {
      const csv = await fetchText(url);
      const parsed = parseMoviesCsv(csv);
      if (parsed.columns?.title === -1) {
        throw new Error('No se ha encontrado una columna con los nombres de las películas.');
      }
      const entry = writeCache(csv);
      if (import.meta.env?.DEV) {
        console.info(`[CINEMATCH] ${parsed.movies.length} películas leídas desde ${url}`, parsed.columns);
      }
      return { ...parsed, fetchedAt: entry.savedAt, fromCache: false };
    } catch (error) {
      errors.push(error);
      console.warn('[CINEMATCH] Fallo al leer', url, error);
    }
  }

  const finalError = new Error('No se ha podido leer el Google Sheets.');
  finalError.causes = errors;
  throw finalError;
}
