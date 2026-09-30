import { AnimatePresence, motion } from 'framer-motion';
import { Hash, X } from 'lucide-react';
import { PEOPLE } from '../config/config.js';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { formatPoints, matchPercent } from '../utils/ratings.js';
import Poster from './Poster.jsx';
import { ScoreDuel } from './Rating.jsx';

const EASE = [0.2, 0.8, 0.2, 1];

function AgreementLine({ movie }) {
  if (movie.difference === null) {
    const missing = PEOPLE.filter((p) => typeof movie.ratings[p.key] !== 'number').map((p) => p.name);
    if (missing.length === PEOPLE.length) return <p className="text-sm text-muted">Todavía sin notas.</p>;
    return <p className="text-sm text-muted">Falta la nota de {missing.join(' y ')}.</p>;
  }
  if (movie.difference === 0) {
    return <p className="text-sm font-semibold text-brand-bright">Match 100%: misma nota exacta.</p>;
  }
  return (
    <p className="text-sm text-muted">
      <span className="font-semibold text-fg">Match {matchPercent(movie.difference)}%</span>, con{' '}
      {formatPoints(movie.difference)} de diferencia.
    </p>
  );
}

function ModalContent({ movie, rank, onClose }) {
  const containerRef = useModalA11y(true, onClose);
  const titleId = `modal-title-${movie.id}`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Fondo: click fuera para cerrar */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-ink-900 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] sm:rounded-3xl"
      >
        {/* Fondo de la ficha: la propia carátula desenfocada */}
        {movie.poster && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 scale-125 bg-cover bg-center opacity-30 blur-3xl"
              style={{ backgroundImage: `url("${movie.poster.replace(/"/g, '%22')}")` }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-ink-900/40 via-ink-900/85 to-ink-900" />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          data-autofocus
          className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-fg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/80 hover:text-brand-bright"
          aria-label="Cerrar ficha"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.05 }}
            className="mx-auto aspect-[2/3] w-44 overflow-hidden rounded-2xl shadow-[0_24px_60px_-18px_rgb(0_210_106/0.35)] ring-1 ring-white/10 sm:w-56 md:w-full"
          >
            <Poster src={movie.poster} title={movie.title} eager />
          </motion.div>

          <div className="flex min-w-0 flex-col">
            {rank && (
              <p className="flex items-center gap-1 text-xs font-semibold text-brand">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                {rank.position} de {rank.of} en nuestra lista
              </p>
            )}
            <h2
              id={titleId}
              className="mt-2 pr-10 font-display text-2xl leading-tight font-semibold text-balance sm:text-3xl"
            >
              {movie.title}
            </h2>

            <div className="mt-7 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
              <ScoreDuel ratings={movie.ratings} average={movie.average} size="lg" />
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                <AgreementLine movie={movie} />
              </div>
            </div>

            {movie.extra.length > 0 && (
              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {movie.extra.map((item) => (
                  <div key={item.key} className={item.value.length > 60 ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs font-semibold text-muted">{item.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-fg/90">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MovieModal({ movie, rank, onClose }) {
  return (
    <AnimatePresence>
      {movie && <ModalContent key={movie.id} movie={movie} rank={rank} onClose={onClose} />}
    </AnimatePresence>
  );
}
