const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'cinematch_posters_v9';
const MAX_PARALELAS = 6;
const UMBRAL = 0.7; // parecido mínimo de título para aceptar un póster

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
  'del reves': { q: 'Inside Out', year: 2015 },
  'del reves 2': { q: 'Inside Out 2', year: 2024 },
  'detective pikachu': { q: 'Pokémon Detective Pikachu', year: 2019 },
  'hotel transilvania 3': { q: 'Hotel Transylvania 3: Summer Vacation', year: 2018 },
  'hotel transilvania 4': { q: 'Hotel Transylvania: Transformania', year: 2022 },
  'la sirenita': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 1': { q: 'The Little Mermaid', year: 1989 },
  'la sirenita 3': { q: "The Little Mermaid: Ariel's Beginning", year: 2008 },

  'las guerreras kpop': { q: 'KPop Demon Hunters', year: 2025 },
  'mamma mia 2': { q: 'Mamma Mia! Here We Go Again', year: 2018 },
  'tod y tobby': { q: 'The Fox and the Hound', year: 1981 },
  'tod y tobby 2': { q: 'The Fox and the Hound 2', year: 2006 },
  'el libro de la selva la': { q: 'The Jungle Book', year: 2016 },
  'el libro de la selva live action': { q: 'The Jungle Book', year: 2016 },
  'barbie princesa de las hadas': { q: 'Barbie: Mariposa & the Fairy Princess', year: 2013 },
  'barbie popstars': { q: 'Barbie: The Princess & the Popstar', year: 2012 },
};

// "El Diario de Noa!" → "el diario de noa"
const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Números de un título ("ice age 2" → "2"), para no confundir secuelas.
const numeros = (texto) => (texto.match(/\d+/g) || []).join(' ');

// Parecido entre dos textos de 0 a 1 (coeficiente de Dice sobre pares de letras).
function parecido(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const pares = new Map();
  for (let i = 0; i < a.length - 1; i += 1) {
    const par = a.slice(i, i + 2);
    pares.set(par, (pares.get(par) || 0) + 1);
  }
  let comunes = 0;
  for (let i = 0; i < b.length - 1; i += 1) {
    const par = b.slice(i, i + 2);
    const restantes = pares.get(par) || 0;
    if (restantes > 0) {
      pares.set(par, restantes - 1);
      comunes += 1;
    }
  }
  return (2 * comunes) / (a.length + b.length - 2);
}

// Puntúa un resultado de TMDB frente al título buscado (usa título en español y original).
function puntuar(buscado, resultado) {
  const nombres = [resultado.title, resultado.original_title].map(normalizar).filter(Boolean);
  let mejor = 0;
  nombres.forEach((nombre) => {
    let puntos;
    if (nombre === buscado) {
      puntos = 1;
    } else {
      puntos = nombre.startsWith(`${buscado} `) ? 0.9 : parecido(buscado, nombre);
      // Si los números no coinciden (Ice age 2 vs Ice age 3), casi seguro es otra película.
      if (numeros(buscado) !== numeros(nombre)) puntos -= 0.3;
    }
    if (puntos > mejor) mejor = puntos;
  });
  return mejor;
}

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
      // Fallo de red tras los reintentos: no se guarda en caché para volver a intentarlo
      return null;
    }
  });
}