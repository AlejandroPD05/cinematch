import IDS from './tmdbIds.json';
import { OVERRIDES, UMBRAL, normalizar, puntuar } from './tmdbMatch.js';

const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'cinematch_posters_v10';
const MAX_PARALELAS = 6;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Caché en localStorage: { "titulo normalizado": "/abc123.jpg" | "" }
function leerCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function guardarCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Si el navegador no deja guardar, seguimos sin caché.
  }
}

// Cola sencilla para no lanzar muchas peticiones a la vez
let activas = 0;
const cola = [];

function siguiente() {
  if (activas >= MAX_PARALELAS || cola.length === 0) return;
  const tarea = cola.shift();
  activas += 1;
  tarea().finally(() => {
    activas -= 1;
    siguiente();
  });
}

function encolar(fn) {
  return new Promise((resolve) => {
    cola.push(() => fn().then(resolve));
    siguiente();
  });
}

// Petición a TMDB con reintentos (útil con conexiones móviles flojas o límite de peticiones).
async function pedir(url, intento = 0) {
  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
    });
  } catch (error) {
    if (intento < 2) {
      await esperar(700 * (intento + 1));
      return pedir(url, intento + 1);
    }
    throw error;
  }

  if (res.status === 429 && intento < 2) {
    await esperar(1000 * (intento + 1));
    return pedir(url, intento + 1);
  }
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

async function posterPorId(id) {
  const data = await pedir(`https://api.themoviedb.org/3/movie/${id}?language=es-ES`);
  return data.poster_path || '';
}

// Búsqueda con año de estreno: se queda con el primer resultado que tenga póster.
async function posterPorTituloYAnio({ q, year }) {
  const data = await pedir(
    'https://api.themoviedb.org/3/search/movie?language=es-ES&include_adult=false' +
      `&primary_release_year=${year}&query=${encodeURIComponent(q)}`,
  );
  const primera = (data.results ?? []).find((r) => r.poster_path);
  return primera ? primera.poster_path : '';
}

// Búsqueda por nombre: elige el resultado más parecido; si ninguno llega al umbral, no pone póster.
async function posterPorBusqueda(titulo) {
  const data = await pedir(
    'https://api.themoviedb.org/3/search/movie?language=es-ES&include_adult=false&query=' +
      encodeURIComponent(titulo),
  );
  const buscado = normalizar(titulo);

  const candidatos = (data.results ?? [])
    .filter((r) => r.poster_path)
    .map((r) => ({ r, puntos: puntuar(buscado, r) }))
    .filter((c) => c.puntos >= UMBRAL)
    .sort((a, b) => b.puntos - a.puntos || (b.r.vote_count || 0) - (a.r.vote_count || 0));

  const elegido = candidatos[0];

  if (import.meta.env.DEV) {
    const anio = elegido ? (elegido.r.release_date || '').slice(0, 4) : '';
    console.info(
      elegido
        ? `[CINEMATCH] "${buscado}" → "${elegido.r.title}" (${anio}) [${elegido.puntos.toFixed(2)}]`
        : `[CINEMATCH] "${buscado}" → sin coincidencia`,
    );
  }

  return elegido ? elegido.r.poster_path : '';
}

function buscarPath(titulo, k) {
  const fijo = IDS[k];
  if (fijo && fijo.id) return posterPorId(fijo.id);

  const override = OVERRIDES[k];
  if (typeof override === 'number') return posterPorId(override);
  if (override && override.q) return posterPorTituloYAnio(override);
  return posterPorBusqueda(titulo);
}

// Devuelve la URL completa del póster, o null si no se encuentra
export async function obtenerPoster(titulo) {
  if (!titulo) return null;

  const k = normalizar(titulo);

  // 1. Guardado en tmdbIds.json: no necesita ninguna petición ni token.
  const fijo = IDS[k];
  if (fijo && fijo.poster) return IMG_BASE + fijo.poster;

  // 2. Resto: se busca en TMDB (necesita token)
  if (!TOKEN) return null;

  const cache = leerCache();
  if (k in cache) return cache[k] ? IMG_BASE + cache[k] : null;

  return encolar(async () => {
    try {
      const path = await buscarPath(titulo, k);
      const cacheActual = leerCache();
      cacheActual[k] = path;
      guardarCache(cacheActual);
      if (!path) {
        console.warn(`[CINEMATCH] Sin póster en TMDB: "${k}" → ejecuta el script o añádelo a OVERRIDES`);
      }
      return path ? IMG_BASE + path : null;
    } catch {
      // Fallo de red tras los reintentos: no se guarda en caché para volver a intentarlo
      return null;
    }
  });
}