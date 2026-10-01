import { readFile, writeFile } from 'node:fs/promises';
import { parseMoviesCsv } from '../src/utils/movieParser.js';
import { OVERRIDES, UMBRAL, normalizar, puntuar } from '../src/lib/tmdbMatch.js';

const API = 'https://api.themoviedb.org/3';
const TOKEN = process.env.VITE_TMDB_TOKEN;
const SHEET_ID = process.env.VITE_GOOGLE_SHEET_ID;
const SHEET_GID = process.env.VITE_GOOGLE_SHEET_GID || '0';
const CSV_URL = process.env.VITE_GOOGLE_SHEET_CSV_URL;
const SALIDA = new URL('../src/lib/tmdbIds.json', import.meta.url);

function salir(mensaje) {
  console.error(`\n✖ ${mensaje}\n`);
  process.exit(1);
}

if (!TOKEN) salir('Falta VITE_TMDB_TOKEN en el archivo .env');
if (!CSV_URL && !SHEET_ID) salir('Falta VITE_GOOGLE_SHEET_ID (o VITE_GOOGLE_SHEET_CSV_URL) en el archivo .env');

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const anioDe = (fecha) => (fecha || '').slice(0, 4);

async function pedir(url, intento = 0) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (res.status === 429 && intento < 3) {
    await esperar(1000 * (intento + 1));
    return pedir(url, intento + 1);
  }
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

// Lo que se guarda por película: ID, título, año y ruta del póster.
const entrada = (d, extra = {}) => ({
  id: d.id,
  titulo: d.title,
  anio: anioDe(d.release_date),
  poster: d.poster_path || null,
  ...extra,
});

async function leerPeliculas() {
  const url =
    CSV_URL ||
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/export?format=csv&gid=${encodeURIComponent(SHEET_GID)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) salir(`No se pudo leer el Sheets (HTTP ${res.status}).`);
  const texto = await res.text();
  if (/^\s*<(!doctype|html)/i.test(texto)) {
    salir('El Sheets devolvió una página HTML. ¿Está compartido como "Cualquier persona con el enlace"?');
  }
  return parseMoviesCsv(texto).movies;
}

// Decide qué película de TMDB corresponde a cada título del Sheets.
async function resolver(pelicula, k, previo) {
  // 1. Corregida a mano: se respeta el ID y solo se refrescan los datos.
  if (previo?.manual && previo.id) {
    return entrada(await pedir(`${API}/movie/${previo.id}?language=es-ES`), { manual: true });
  }

  const override = OVERRIDES[k];

  // 2. Override por ID
  if (typeof override === 'number') {
    return entrada(await pedir(`${API}/movie/${override}?language=es-ES`));
  }

  // 3. Override por título y año
  if (override && override.q) {
    const data = await pedir(
      `${API}/search/movie?language=es-ES&include_adult=false&primary_release_year=${override.year}` +
        `&query=${encodeURIComponent(override.q)}`,
    );
    const primera = (data.results ?? []).find((r) => r.poster_path);
    return primera ? entrada(primera) : null;
  }

  // 4. Búsqueda por parecido de título (con el año del Sheets si existe esa columna)
  const anioSheet = String(pelicula.details?.year ?? '').match(/\d{4}/)?.[0];
  const data = await pedir(
    `${API}/search/movie?language=es-ES&include_adult=false` +
      (anioSheet ? `&primary_release_year=${anioSheet}` : '') +
      `&query=${encodeURIComponent(pelicula.title)}`,
  );

  const candidatos = (data.results ?? [])
    .filter((r) => r.poster_path)
    .map((r) => ({ r, puntos: puntuar(k, r) }))
    .filter((c) => c.puntos >= UMBRAL)
    .sort((a, b) => b.puntos - a.puntos || (b.r.vote_count || 0) - (a.r.vote_count || 0));

  const [mejor, segundo] = candidatos;
  if (!mejor) return null;

  // Dudosa si el parecido no es casi exacto, o si hay otra película igual de parecida.
  const dudosa =
    mejor.puntos < 0.9 ||
    Boolean(segundo && segundo.r.id !== mejor.r.id && segundo.puntos >= mejor.puntos - 0.02);

  return entrada(mejor.r, dudosa ? { revisar: true } : {});
}

async function main() {
  let existentes = {};
  try {
    existentes = JSON.parse(await readFile(SALIDA, 'utf8'));
  } catch {
    // Primera vez: aún no hay archivo
  }

  const peliculas = await leerPeliculas();
  console.log(`\nLeídas ${peliculas.length} películas del Sheets. Buscando en TMDB...\n`);

  const resultado = {};
  const dudosas = [];
  const sinCoincidencia = [];

  for (const pelicula of peliculas) {
    const k = normalizar(pelicula.title);
    if (!k || k in resultado) continue;

    try {
      const dato = await resolver(pelicula, k, existentes[k]);
      if (dato) {
        resultado[k] = dato;
        if (dato.revisar) dudosas.push({ sheets: pelicula.title, tmdb: `${dato.titulo} (${dato.anio})`, id: dato.id });
      } else {
        sinCoincidencia.push(pelicula.title);
      }
    } catch (error) {
      sinCoincidencia.push(`${pelicula.title} (error: ${error.message})`);
    }
    await esperar(120);
  }

  await writeFile(SALIDA, `${JSON.stringify(resultado, null, 2)}\n`, 'utf8');

  const total = Object.keys(resultado).length;
  console.log(`✔ Guardadas ${total} películas en src/lib/tmdbIds.json`);
  console.log(`  · ${total - dudosas.length} seguras, ${dudosas.length} a revisar, ${sinCoincidencia.length} sin coincidencia\n`);

  if (dudosas.length > 0) {
    console.log('A REVISAR (comprueba que el título de TMDB es el que quieres):');
    console.table(dudosas);
  }
  if (sinCoincidencia.length > 0) {
    console.log('SIN COINCIDENCIA (añádelas a OVERRIDES en tmdbMatch.js o ponles el ID a mano):');
    sinCoincidencia.forEach((t) => console.log(`  - ${t}`));
  }
}

main().catch((error) => salir(error.message));