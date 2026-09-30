import { EXTRA_FIELDS, RATING_TIERS } from '../config/config.js';
import { ratingTier } from './ratings.js';
import { normalizeText } from './text.js';
import { byAverageDesc } from './statistics.js';

export const DEFAULT_FILTERS = {
  query: '',
  tier: 'all',
  sort: 'original',
  facets: {},
};

export const TIER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: 'Mejor valoradas', hint: `Media de ${RATING_TIERS.high} o más` },
  { value: 'mid', label: 'Valoración media', hint: `Media entre ${RATING_TIERS.mid} y ${RATING_TIERS.high}` },
  { value: 'low', label: 'Valoración baja', hint: `Media por debajo de ${RATING_TIERS.mid}` },
  { value: 'unrated', label: 'Sin nota', hint: 'Todavía sin valorar', onlyIfPresent: true },
];

export const SORT_OPTIONS = [
  { value: 'original', label: 'Orden del Sheets' },
  { value: 'rating', label: 'Nota media' },
  { value: 'az', label: 'Nombre A-Z' },
  { value: 'za', label: 'Nombre Z-A' },
];

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

const SEARCHABLE_DETAILS = ['saga', 'genre', 'director'];

function haystack(movie) {
  const parts = [movie.title, ...SEARCHABLE_DETAILS.map((k) => movie.details?.[k] ?? '')];
  return normalizeText(parts.join(' '));
}

/** Facets (saga, género...) disponibles en los datos. Solo aparecen si la columna existe. */
export function getAvailableFacets(movies) {
  return EXTRA_FIELDS.filter((field) => field.facet)
    .map((field) => {
      const values = new Set();
      movies.forEach((m) => {
        const raw = m.details?.[field.key];
        if (!raw) return;
        raw.split(/[,;/|]/).map((v) => v.trim()).filter(Boolean).forEach((v) => values.add(v));
      });
      return { ...field, values: [...values].sort(collator.compare) };
    })
    .filter((facet) => facet.values.length > 0);
}

function matchesFacet(movie, key, value) {
  if (!value) return true;
  const raw = movie.details?.[key];
  if (!raw) return false;
  return raw
    .split(/[,;/|]/)
    .map((v) => v.trim())
    .some((v) => collator.compare(v, value) === 0);
}

export function applyFilters(movies, filters) {
  const needle = normalizeText(filters.query);
  const facetEntries = Object.entries(filters.facets ?? {}).filter(([, v]) => v);

  const result = movies.filter((movie) => {
    if (needle && !haystack(movie).includes(needle)) return false;
    if (filters.tier !== 'all' && ratingTier(movie.average) !== filters.tier) return false;
    return facetEntries.every(([key, value]) => matchesFacet(movie, key, value));
  });

  switch (filters.sort) {
    case 'az':
      return result.sort((a, b) => collator.compare(a.title, b.title));
    case 'za':
      return result.sort((a, b) => collator.compare(b.title, a.title));
    case 'rating':
      return result.sort(byAverageDesc);
    default:
      return result.sort((a, b) => a.order - b.order);
  }
}

export function isDefaultFilters(filters) {
  return (
    !filters.query.trim() &&
    filters.tier === DEFAULT_FILTERS.tier &&
    filters.sort === DEFAULT_FILTERS.sort &&
    Object.values(filters.facets ?? {}).every((v) => !v)
  );
}
