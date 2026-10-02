import { readFile, writeFile } from 'node:fs/promises';
import { parseMoviesCsv } from '../src/utils/movieParser.js';
import {
  OVERRIDES,
  OVERRIDES_SERIES,
  UMBRAL,
  normalizar,
  puntuar,
} from '../src/lib/tmdbMatch.js';

const API = 'https://api.themoviedb.org/3';
const ES_SERIE = process.argv.includes('--series');
const TIPO = ES_SERIE ? 'tv' : 'movie';
const NOMBRE_PLURAL = ES_SERIE ? 'series' : 'películas';

const TOKEN = process.env.VITE_TMDB_TOKEN;
const SHEET_ID = process.env.VITE_GOOGLE_SHEET_ID;
const SHEET_GID =
  (ES_SERIE ? process.env.VITE_GOOGLE_SHEET_GID_SERIES : process.env.VITE_GOOGLE_SHEET_GID) || '0';
const CSV_URL = ES_SERIE
  ? process.env.VITE_GOOGLE_SHEET_CSV_URL_SERIES
  : process.env.VITE_GOOGLE_SHEET_CSV_URL;

const OVERRIDES_USADOS = ES_SERIE ? OVERRIDES_SERIES : OVERRIDES;
const ARCHIVO = ES_SERIE ? 'src/lib/tmdbIdsSeries.json' : 'src/lib/tmdbIds.json';
const SALIDA = new URL(`../${ARCHIVO}`, import.meta.url);
// En TMDB el filtro de año se llama distinto en películas y en series.
const PARAM_ANIO = ES_SERIE ? 'first_air_date_year' : 'primary_release_year';

function salir(mensaje) {
  console.error(`\n✖ ${mensaje}\n`);
  process.exit(1);
}

if (!TOKEN) salir('Falta VITE_TMDB_TOKEN en el archivo .env');
if (!CSV_URL && !SHEET_ID) salir('Falta VITE_GOOGLE_SHEET_ID (o una URL CSV) en el archivo .env');

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

// Lo que se guarda por título: ID, título, año y ruta del póster.
// (Las películas usan "title" y "release_date"; las series, "name" y "first_air_date".)
const entrada = (d, extra = {}) => ({
  id: d.id,
  titulo: d.title ?? d.name,
  anio: anioDe(d.release_date ?? d.first_air_date),
  poster: d.poster_path || null,
  ...extra,
});

async function leerTitulos() {
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

// Decide qué resultado de TMDB corresponde a cada título del Sheets.
async function resolver(item, k, previo) {
  // 1. Corregido a mano: se respeta el ID y solo se refrescan los datos.
  if (previo?.manual && previo.id) {
    return entrada(await pedir(`${API}/${TIPO}/${previo.id}?language=es-ES`), { manual: true });
  }

  const override = OVERRIDES_USADOS[k];

  // 2. Override por ID
  if (typeof override === 'number') {
    return entrada(await pedir(`${API}/${TIPO}/${override}?language=es-ES`));
  }

  // 3. Override por título y año
  if (override && override.q) {
    const data = await pedir(
      `${API}/search/${TIPO}?language=es-ES&include_adult=false&${PARAM_ANIO}=${override.year}` +
        `&query=${encodeURIComponent(override.q)}`,
    );
    const primera = (data.results ?? []).find((r) => r.poster_path);
    return primera ? entrada(primera) : null;
  }

  // 4. Búsqueda por parecido de título (con el año del Sheets si existe esa columna)
  const anioSheet = String(item.details?.year ?? '').match(/\d{4}/)?.[0];
  const data = await pedir(
    `${API}/search/${TIPO}?language=es-ES&include_adult=false` +
      (anioSheet ? `&${PARAM_ANIO}=${anioSheet}` : '') +
      `&query=${encodeURIComponent(item.title)}`,
  );

  const candidatos = (data.results ?? [])
    .filter((r) => r.poster_path)
    .map((r) => ({ r, puntos: puntuar(k, r) }))
    .filter((c) => c.puntos >= UMBRAL)
    .sort((a, b) => b.puntos - a.puntos || (b.r.vote_count || 0) - (a.r.vote_count || 0));

  const [mejor, segundo] = candidatos;
  if (!mejor) return null;

  // Dudosa si el parecido no es casi exacto, o si hay otra igual de parecida.
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

  const items = await leerTitulos();
  console.log(`\nLeídas ${items.length} ${NOMBRE_PLURAL} del Sheets. Buscando en TMDB...\n`);

  const resultado = {};
  const dudosas = [];
  const sinCoincidencia = [];

  for (const item of items) {
    const k = normalizar(item.title);
    if (!k || k in resultado) continue;

    try {
      const dato = await resolver(item, k, existentes[k]);
      if (dato) {
        resultado[k] = dato;
        if (dato.revisar) {
          dudosas.push({ sheets: item.title, tmdb: `${dato.titulo} (${dato.anio})`, id: dato.id });
        }
      } else {
        sinCoincidencia.push(item.title);
      }
    } catch (error) {
      sinCoincidencia.push(`${item.title} (error: ${error.message})`);
    }
    await esperar(120);
  }

  await writeFile(SALIDA, `${JSON.stringify(resultado, null, 2)}\n`, 'utf8');

  const total = Object.keys(resultado).length;
  console.log(`✔ Guardadas ${total} ${NOMBRE_PLURAL} en ${ARCHIVO}`);
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