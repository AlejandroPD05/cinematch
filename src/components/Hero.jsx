import { motion } from 'framer-motion';
import { COLLECTION_DESCRIPTION, COLLECTION_NAME, RATING_MAX } from '../config/config.js';
import { getLabels } from '../utils/labels.js';
import { formatRating } from '../utils/ratings.js';
import FeaturedMovie from './FeaturedMovie.jsx';

/**
 * Cabecera compacta: la colección a la izquierda, la película destacada a la derecha.
 * El fondo es la carátula destacada desenfocada (sin imagen rota si falla: es un background CSS).
 */
export default function Hero({
  total,
  collectionAverage,
  featured,
  onOpen,
  loading,
  labels = getLabels('movies'),
}) {
  const backdrop = featured?.poster;

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden border-b border-white/[0.06]">
      {backdrop && (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-2xl"
          style={{ backgroundImage: `url("${backdrop.replace(/"/g, '%22')}")` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-void via-void/85 to-void/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-void to-transparent" />

      <div className="relative mx-auto grid max-w-[1680px] items-center gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[1fr_minmax(380px,460px)] lg:gap-12 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <p className="text-sm font-semibold text-brand">{COLLECTION_NAME}</p>
          <h1
            id="hero-title"
            className="mt-2 max-w-2xl font-display text-[28px] leading-[1.08] font-semibold tracking-tight text-balance sm:text-4xl xl:text-5xl"
          >
            {loading ? (
              <span className="inline-block h-[1em] w-64 animate-pulse rounded-lg bg-white/[0.06] align-middle" />
            ) : total === 1 ? (
              `1 ${labels.singular} que hemos visto juntos.`
            ) : (
              `${total} ${labels.plural} que hemos visto juntos.`
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{COLLECTION_DESCRIPTION}</p>
          {!loading && typeof collectionAverage === 'number' && (
            <p className="mt-4 text-sm text-fg/80">
              Nota media de la colección{' '}
              <span className="font-display font-semibold text-brand-bright tabular">{formatRating(collectionAverage)}</span>
              <span className="text-faint">/{RATING_MAX}</span>
            </p>
          )}
        </motion.div>

        {!loading && <FeaturedMovie movie={featured} onOpen={onOpen} labels={labels} />}
      </div>
    </section>
  );
}