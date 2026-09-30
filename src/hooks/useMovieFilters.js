import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { DEFAULT_FILTERS, applyFilters, isDefaultFilters } from '../utils/movieFilters.js';

export function useMovieFilters(movies) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const deferredQuery = useDeferredValue(filters.query);

  const results = useMemo(
    () => applyFilters(movies, { ...filters, query: deferredQuery }),
    [movies, filters, deferredQuery],
  );

  const setQuery = useCallback((query) => setFilters((f) => ({ ...f, query })), []);
  const setTier = useCallback((tier) => setFilters((f) => ({ ...f, tier })), []);
  const setSort = useCallback((sort) => setFilters((f) => ({ ...f, sort })), []);
  const setFacet = useCallback(
    (key, value) => setFilters((f) => ({ ...f, facets: { ...f.facets, [key]: value } })),
    [],
  );
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    filters,
    results,
    isDefault: isDefaultFilters(filters),
    setQuery,
    setTier,
    setSort,
    setFacet,
    reset,
  };
}
