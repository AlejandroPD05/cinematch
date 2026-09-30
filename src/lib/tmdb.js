const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'cinematch_posters_v7';
const MAX_PARALELAS = 4;

/**
 * Películas que TMDB no encuentra bien buscando solo por el nombre del Sheets.
 * Clave: el título como está en el Sheets, en minúsculas y sin acentos.
 * Valor: puede ser
 *   - un número: el ID de TMDB (themoviedb.org/movie/ID-nombre)
 *   - { q: 'título oficial', year: 2016 }: búsqueda por título y año de estreno
 */
const OVERRIDES = {
  'jurassic park 1': 329,
  'jurassic park 2': 330,
  'jurassic park 3': 331,
  'jurassic world': 135397,
  'jurassic world 2': 351286,
  'jurassic world 3': 507086,
  'ice age': 425,
  'ice age 2': 950,
  'ice age 3': 8355,
  'ice age 4': 57800,
  'rompe ralph rompe internet': 404368,

  'ice age 5': { q: 'Ice Age: Collision Course', year: 2016 },
  mowgli: { q: 'Mowgli: Legend of the Jungle', year: 2018 },
  'del reves 2': { q: 'Inside Out 2', year: 2024 },
  'detective pikachu': { q: 'Pokémon Detective Pikachu', year: 2019 },
  'hotel transilvania 3': { q: 'Hotel Transylvania 3: Summer Vacation', year: 2018 },
  'hotel transilvania 4': { q: 'Hotel Transylvania: Transformania', year: 2022 },
  'la sirenita': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 1': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 3': { q: "The Little Mermaid: Ariel's Beginning", year: 2008 },
};

// "El Diario de Noa!" → "el diario de noa"
const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

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
  activas++;
  tarea().finally(() => {
    activas--;
    siguiente();
  });
}

function encolar(fn) {
  return new Promise((resolve) => {
    cola.push(() => fn().then(resolve));
    siguiente();
  });
}

async function pedir(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
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

// Solo acepta una coincidencia EXACTA del título; si no, prefiere no poner póster.
async function posterPorBusqueda(titulo) {
  const data = await pedir(
    'https://api.themoviedb.org/3/search/movie?language=es-ES&include_adult=false&query=' +
      encodeURIComponent(titulo),
  );
  const buscado = normalizar(titulo);
  const exacta = (data.results ?? []).find(
    (r) =>
      r.poster_path &&
      (normalizar(r.title) === buscado || normalizar(r.original_title) === buscado),
  );
  return exacta ? exacta.poster_path : '';
}

function buscarPath(titulo, override) {
  if (typeof override === 'number') return posterPorId(override);
  if (override && override.q) return posterPorTituloYAnio(override);
  return posterPorBusqueda(titulo);
}

// Devuelve la URL completa del póster, o null si no se encuentra
export async function obtenerPoster(titulo) {
  if (!titulo || !TOKEN) return null;

  const k = normalizar(titulo);
  const cache = leerCache();
  if (k in cache) return cache[k] ? IMG_BASE + cache[k] : null;

  return encolar(async () => {
    try {
      const path = await buscarPath(titulo, OVERRIDES[k]);
      const cacheActual = leerCache();
      cacheActual[k] = path;
      guardarCache(cacheActual);
      if (!path) {
        console.warn(`[CINEMATCH] Sin póster en TMDB: "${k}" → añádelo a OVERRIDES`);
      }
      return path ? IMG_BASE + path : null;
    } catch {
      // Fallo puntual de red: no se guarda en caché para reintentar la próxima vez
      return null;
    }
  });
}