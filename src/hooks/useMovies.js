import { useCallback, useEffect, useRef, useState } from 'react';
import { SheetConfigError, loadMovies } from '../services/googleSheets.js';

const INITIAL_STATE = {
  status: 'loading',
  movies: [],
  fetchedAt: null,
  refreshing: false,
  configError: false,
  notice: null, // { type: 'updated' | 'failed', at: number } tras pulsar "Actualizar"
};

/**
 * kind: 'movies' | 'series' (qué pestaña del Sheets se carga)
 * status: 'loading' | 'ready' | 'error'
 * refreshing: true mientras se pulsa "Actualizar" con datos ya visibles.
 */
export function useMovies(kind = 'movies') {
  const [state, setState] = useState(INITIAL_STATE);
  const requestId = useRef(0);

  const load = useCallback(
    async ({ force = false, reset = false } = {}) => {
      const id = ++requestId.current;
      setState((prev) => {
        if (reset) return INITIAL_STATE;
        return prev.status === 'ready'
          ? { ...prev, refreshing: true }
          : { ...prev, status: 'loading', refreshing: false };
      });

      try {
        const result = await loadMovies({ force, kind });
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
    },
    [kind],
  );

  // Al empezar o al cambiar entre películas y series, se vacía la lista y se carga la pestaña.
  useEffect(() => {
    load({ reset: true });
  }, [load]);

  const refresh = useCallback(() => load({ force: true }), [load]);
  const dismissNotice = useCallback(() => setState((prev) => ({ ...prev, notice: null })), []);

  return { ...state, refresh, dismissNotice };
}