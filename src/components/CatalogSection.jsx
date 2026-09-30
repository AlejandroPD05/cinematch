import EmptyState from './EmptyState.jsx';
import FilterBar from './FilterBar.jsx';
import MovieGrid from './MovieGrid.jsx';
import { SkeletonGrid } from './SkeletonCard.jsx';

export default function CatalogSection({ loading, allCount, results, filterState, facets, hasUnrated, onOpen }) {
  const { filters, isDefault, setTier, setSort, setFacet, reset } = filterState;

  return (
    <section id="catalogo" aria-label="Catálogo de películas" className="scroll-mt-32">
      {loading ? (
        <>
          <div className="mb-5 flex gap-2" aria-hidden="true">
            {[72, 128, 120, 116].map((w) => (
              <div key={w} className="h-9 animate-pulse rounded-full bg-white/[0.05]" style={{ width: w }} />
            ))}
          </div>
          <SkeletonGrid count={12} />
        </>
      ) : allCount === 0 ? (
        <EmptyState
          title="Todavía no hay películas en la hoja."
          description="Añadid la primera en Google Sheets y pulsad el botón de actualizar."
        />
      ) : (
        <>
          <FilterBar
            filters={filters}
            onTierChange={setTier}
            onSortChange={setSort}
            onFacetChange={setFacet}
            onReset={reset}
            isDefault={isDefault}
            resultCount={results.length}
            hasUnrated={hasUnrated}
            facets={facets}
          />
          <div className="mt-4">
            {results.length > 0 ? (
              <MovieGrid movies={results} onOpen={onOpen} />
            ) : (
              <EmptyState onAction={reset} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
