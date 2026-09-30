import { useCallback, useEffect, useRef, useState } from 'react';
import { SheetConfigError, loadMovies } from '../services/googleSheets.js';

/**
 * status: 'loading' | 'ready' | 'error'
 * refreshing: true mientras se pulsa "Actualizar" con datos ya visibles.
 */
export function useMovies() {
  const [state, setState] = useState({
    status: 'loading',
    movies: [],
    fetchedAt: null,
    refreshing: false,
    configError: false,
    notice: null, // { type: 'updated' | 'failed', at: number } tras pulsar "Actualizar"
  });
  const requestId = useRef(0);

  const load = useCallback(async ({ force = false } = {}) => {
    const id = ++requestId.current;
    setState((prev) =>
      prev.status === 'ready'
        ? { ...prev, refreshing: true }
        : { ...prev, status: 'loading', refreshing: false },
    );

    try {
      const result = await loadMovies({ force });
      if (id !== requestId.current) return;
      setState({
        status: 'ready',
        movies: result.movies,
        fetchedAt: result.fetchedAt,
        refreshing: false,
        configError: false,
        notice: force ? { type: 'updated', at: Date.now() } : null,
      });
    } catch (error) {
      if (id !== requestId.current) return;
      console.error('[CINEMATCH] Error cargando la colección:', error, error.causes ?? '');
      setState((prev) =>
        prev.status === 'ready' && prev.movies.length > 0
          ? { ...prev, refreshing: false, notice: { type: 'failed', at: Date.now() } }
          : {
              status: 'error',
              movies: [],
              fetchedAt: null,
              refreshing: false,
              configError: error instanceof SheetConfigError,
              notice: null,
            },
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load({ force: true }), [load]);
  const dismissNotice = useCallback(() => setState((prev) => ({ ...prev, notice: null })), []);

  return { ...state, refresh, dismissNotice };
}
