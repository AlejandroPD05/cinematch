import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import AgreementSection from './components/AgreementSection.jsx';
import CatalogSection from './components/CatalogSection.jsx';
import ErrorState from './components/ErrorState.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import MovieModal from './components/MovieModal.jsx';
import RefreshNotice from './components/RefreshNotice.jsx';
import StatsSection from './components/StatsSection.jsx';
import TopMovies from './components/TopMovies.jsx';
import { APP_NAME, APP_TAGLINE, DUEL_LIMIT, TOP_LIMIT } from './config/config.js';
import { useMovieFilters } from './hooks/useMovieFilters.js';
import { useMovies } from './hooks/useMovies.js';
import { getAvailableFacets } from './utils/movieFilters.js';
import {
  computeStats,
  getAgreements,
  getDisagreements,
  getFeaturedMovie,
  getRank,
  getTopRated,
} from './utils/statistics.js';

/** Si el catálogo está lejos al empezar a escribir, baja hasta él. */
function scrollToCatalogIfNeeded() {
  const catalog = document.getElementById('catalogo');
  if (!catalog) return;
  const top = catalog.getBoundingClientRect().top;
  if (top > window.innerHeight * 0.6 || top < -catalog.offsetHeight + 200) {
    catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function App() {
  const { status, movies, fetchedAt, refreshing, configError, notice, refresh, dismissNotice } = useMovies();
  const filterState = useMovieFilters(movies);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = `${APP_NAME} | ${APP_TAGLINE}`;
  }, []);

  const derived = useMemo(
    () => ({
      stats: computeStats(movies),
      featured: getFeaturedMovie(movies),
      top: getTopRated(movies, TOP_LIMIT),
      agreements: getAgreements(movies, DUEL_LIMIT),
      disagreements: getDisagreements(movies, DUEL_LIMIT),
      facets: getAvailableFacets(movies),
      hasUnrated: movies.some((m) => m.average === null),
    }),
    [movies],
  );

  const openMovie = useCallback((movie) => setSelected(movie), []);
  const closeMovie = useCallback(() => setSelected(null), []);

  const { filters, setQuery } = filterState;
  const handleQueryChange = useCallback(
    (value) => {
      if (!filters.query && value) scrollToCatalogIfNeeded();
      setQuery(value);
    },
    [filters.query, setQuery],
  );

  // Si al actualizar la película abierta cambia o desaparece, la ficha usa los datos nuevos.
  const selectedMovie = useMemo(() => {
    if (!selected) return null;
    return movies.find((m) => m.id === selected.id) ?? movies.find((m) => m.title === selected.title) ?? selected;
  }, [selected, movies]);

  const loading = status === 'loading';
  const ready = status === 'ready';

  return (
    <MotionConfig reducedMotion="user">
      <div className="screen-glow min-h-dvh">
        <a
          href="#catalogo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
        >
          Saltar al catálogo
        </a>

        <Header
          query={filters.query}
          onQueryChange={handleQueryChange}
          onRefresh={refresh}
          refreshing={refreshing || (loading && fetchedAt !== null)}
          canRefresh={status !== 'loading'}
        />

        <main>
          {status === 'error' ? (
            <div className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-10">
              <ErrorState onRetry={refresh} configError={configError} />
            </div>
          ) : (
            <>
              <Hero
                loading={loading}
                total={movies.length}
                collectionAverage={derived.stats.collectionAverage}
                featured={derived.featured}
                onOpen={openMovie}
              />

              <div className="mx-auto max-w-[1680px] space-y-16 px-4 pt-6 sm:px-6 lg:space-y-20 lg:px-10">
                <CatalogSection
                  loading={loading}
                  allCount={movies.length}
                  results={filterState.results}
                  filterState={filterState}
                  facets={derived.facets}
                  hasUnrated={derived.hasUnrated}
                  onOpen={openMovie}
                />

                {ready && movies.length > 0 && (
                  <>
                    <StatsSection stats={derived.stats} />
                    <TopMovies movies={derived.top} onOpen={openMovie} />
                    <AgreementSection
                      agreements={derived.agreements}
                      disagreements={derived.disagreements}
                      onOpen={openMovie}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </main>

        <Footer fetchedAt={fetchedAt} />

        <MovieModal
          movie={selectedMovie}
          rank={selectedMovie ? getRank(movies, selectedMovie.id) : null}
          onClose={closeMovie}
        />
        <RefreshNotice notice={notice} onDismiss={dismissNotice} />
      </div>
    </MotionConfig>
  );
}
