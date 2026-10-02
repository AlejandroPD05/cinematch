import { COLUMN_ALIASES, EXTRA_FIELDS, PEOPLE } from '../config/config.js';
import { parseCsv } from './csv.js';
import { averageOf, parseRating, parseSeasonRatings, ratingDifference } from './ratings.js';
import { containsPhrase, extractUrl, isUrlLike, normalizeText, slugify } from './text.js';

/**
 * Modelo de película o serie:
 * {
 *   id: string,              // estable dentro de la carga (título + fila)
 *   order: number,           // posición original en el Sheets
 *   title: string,
 *   poster: string | null,   // URL; si falla, la web muestra un placeholder
 *   ratings: { person1: number|null, person2: number|null },   // series: media de temporadas
 *   seasons: [{ number, ratings: { person1, person2 } }],      // solo series con 2+ temporadas
 *   average: number | null,
 *   difference: number | null,
 *   details: { saga?, genre?, year?, ... }   // solo si existe la columna
 *   extra: [{ label, value }]                 // TODAS las columnas adicionales con valor
 * }
 */

const HEADER_SCAN_ROWS = 10;

const cellAt = (row, index) => (index >= 0 && row ? String(row[index] ?? '').trim() : '');

const personMatchers = PEOPLE.map((person) => ({
  key: person.key,
  phrases: [person.name, ...(person.aliases ?? [])].map(normalizeText).filter(Boolean),
}));

function headerMatchesAny(normalizedHeader, phrases) {
  return phrases.some((phrase) => containsPhrase(normalizedHeader, phrase));
}

function isKnownHeader(normalizedHeader) {
  if (!normalizedHeader) return false;
  if (personMatchers.some((m) => headerMatchesAny(normalizedHeader, m.phrases))) return true;
  if (headerMatchesAny(normalizedHeader, COLUMN_ALIASES.title)) return true;
  if (headerMatchesAny(normalizedHeader, COLUMN_ALIASES.poster)) return true;
  if (containsPhrase(normalizedHeader, 'nota')) return true;
  return false;
}

/** Busca la fila de cabeceras entre las primeras filas. -1 si no hay cabecera reconocible. */
function findHeaderRow(rows) {
  const limit = Math.min(rows.length, HEADER_SCAN_ROWS);
  for (let r = 0; r < limit; r += 1) {
    const normalized = rows[r].map(normalizeText);
    if (normalized.some(isKnownHeader)) return r;
  }
  return -1;
}

function columnValues(dataRows, index) {
  return dataRows.map((row) => cellAt(row, index)).filter(Boolean);
}

function countWhere(values, predicate) {
  return values.reduce((acc, v) => (predicate(v) ? acc + 1 : acc), 0);
}

/** Decide qué columna es cada campo, primero por cabecera y después por contenido. */
function detectColumns(headers, dataRows) {
  const columnCount = Math.max(headers.length, ...dataRows.map((r) => r.length), 0);
  const normalized = Array.from({ length: columnCount }, (_, i) => normalizeText(headers[i]));
  const taken = new Set();
  const map = { title: -1, poster: -1, people: {}, extras: [] };

  const free = () => Array.from({ length: columnCount }, (_, i) => i).filter((i) => !taken.has(i));

  // 1. Columnas ignoradas (p. ej. "FALTA POR AÑADIR")
  normalized.forEach((header, i) => {
    if (header && headerMatchesAny(header, COLUMN_ALIASES.ignore)) taken.add(i);
  });

  // 2. Notas de cada persona por cabecera
  personMatchers.forEach((matcher) => {
    const index = free().find((i) => headerMatchesAny(normalized[i], matcher.phrases));
    if (index !== undefined) {
      map.people[matcher.key] = index;
      taken.add(index);
    }
  });

  // 3. Carátula por cabecera: si hay varias candidatas, la que más URLs contenga
  const posterCandidates = free().filter((i) => headerMatchesAny(normalized[i], COLUMN_ALIASES.poster));
  if (posterCandidates.length > 0) {
    const best = [...posterCandidates].sort(
      (a, b) => countWhere(columnValues(dataRows, b), isUrlLike) - countWhere(columnValues(dataRows, a), isUrlLike),
    )[0];
    map.poster = best;
    taken.add(best);
  }

  // 4. Título por cabecera: la candidata con más valores de texto
  const titleCandidates = free().filter((i) => headerMatchesAny(normalized[i], COLUMN_ALIASES.title));
  if (titleCandidates.length > 0) {
    const best = [...titleCandidates].sort(
      (a, b) => columnValues(dataRows, b).length - columnValues(dataRows, a).length,
    )[0];
    map.title = best;
    taken.add(best);
  }

  // 5. Campos extra conocidos (saga, género, año...)
  EXTRA_FIELDS.forEach((field) => {
    const index = free().find((i) => normalized[i] && headerMatchesAny(normalized[i], field.aliases));
    if (index !== undefined) {
      map.extras.push({ key: field.key, label: field.label, index });
      taken.add(index);
    }
  });

  // 6. Respaldo por contenido si faltan cabeceras
  if (map.poster === -1) {
    const scored = free()
      .map((i) => ({ i, urls: countWhere(columnValues(dataRows, i), isUrlLike) }))
      .filter((c) => c.urls > 0)
      .sort((a, b) => b.urls - a.urls);
    if (scored[0]) {
      map.poster = scored[0].i;
      taken.add(scored[0].i);
    }
  }

  PEOPLE.forEach((person) => {
    if (map.people[person.key] !== undefined) return;
    const index = free().find((i) => {
      const values = columnValues(dataRows, i);
      return values.length > 0 && countWhere(values, (v) => parseRating(v) !== null) / values.length >= 0.6;
    });
    if (index !== undefined) {
      map.people[person.key] = index;
      taken.add(index);
    }
  });

  if (map.title === -1) {
    const scored = free()
      .map((i) => ({ i, texts: countWhere(columnValues(dataRows, i), (v) => !isUrlLike(v)) }))
      .filter((c) => c.texts > 0)
      .sort((a, b) => b.texts - a.texts || a.i - b.i);
    if (scored[0]) {
      map.title = scored[0].i;
      taken.add(scored[0].i);
    }
  }

  // 7. Cualquier otra columna con cabecera se conserva como dato adicional
  free().forEach((i) => {
    const label = String(headers[i] ?? '').trim().replace(/:\s*$/, '');
    if (label) map.extras.push({ key: `col_${i}`, label, index: i, generic: true });
  });

  return map;
}

function rowToMovie(row, map, order) {
  const title = cellAt(row, map.title).replace(/\s+/g, ' ');
  if (!title) return null;

  const ratings = {};
  const seasonLists = {};
  PEOPLE.forEach((person) => {
    const index = map.people[person.key];
    const raw = index === undefined ? '' : cellAt(row, index);
    // Si hay varias temporadas ("8/10 - 10/10"), la nota es la media de ellas.
    ratings[person.key] = index === undefined ? null : parseRating(raw);
    seasonLists[person.key] = parseSeasonRatings(raw);
  });

  // Desglose por temporada: solo si alguien tiene 2 o más notas en la celda.
  const seasonCount = Math.max(0, ...PEOPLE.map((p) => seasonLists[p.key].length));
  const seasons =
    seasonCount > 1
      ? Array.from({ length: seasonCount }, (_, i) => ({
          number: i + 1,
          ratings: Object.fromEntries(PEOPLE.map((p) => [p.key, seasonLists[p.key][i] ?? null])),
        }))
      : [];

  const details = {};
  const extra = [];
  map.extras.forEach(({ key, label, index, generic }) => {
    const value = cellAt(row, index);
    if (!value) return;
    if (!generic) details[key] = value;
    extra.push({ key, label, value });
  });

  return {
    id: `${slugify(title)}-${order}`,
    order,
    title,
    poster: extractUrl(cellAt(row, map.poster)),
    ratings,
    seasons,
    average: averageOf(Object.values(ratings)),
    difference: ratingDifference(ratings),
    details,
    extra,
  };
}

/**
 * CSV del Sheets → { movies, columns }
 * Nunca lanza por una fila mal formada: las filas sin título se ignoran.
 */
export function parseMoviesCsv(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ''));
  if (rows.length === 0) return { movies: [], columns: null };

  const headerIndex = findHeaderRow(rows);
  const headers = headerIndex >= 0 ? rows[headerIndex] : [];
  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;

  const columns = detectColumns(headers, dataRows);
  if (columns.title === -1) return { movies: [], columns };

  const movies = [];
  dataRows.forEach((row, i) => {
    try {
      const movie = rowToMovie(row, columns, i);
      if (movie) movies.push(movie);
    } catch (error) {
      console.warn(`[CINEMATCH] Fila ${i + 1} ignorada:`, error);
    }
  });

  return { movies, columns };
}