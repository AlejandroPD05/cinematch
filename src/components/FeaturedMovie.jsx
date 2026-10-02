import { motion } from 'framer-motion';
import { Play, Trophy } from 'lucide-react';
import { getLabels } from '../utils/labels.js';
import Poster from './Poster.jsx';
import { ScoreDuel } from './Rating.jsx';

/** La mejor valorada de la colección. Si no hay notas, no se muestra. */
export default function FeaturedMovie({ movie, onOpen, labels = getLabels('movies') }) {
  if (!movie) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
      className="flex items-stretch gap-4 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-md sm:gap-5 sm:p-4"
    >
      <button
        type="button"
        onClick={() => onOpen(movie)}
        className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-32"
        aria-label={`Abrir ficha de ${movie.title}`}
      >
        <Poster src={movie.poster} title={movie.title} eager compact />
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-bright">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            La mejor valorada
          </p>
          <h2 className="mt-1.5 line-clamp-2 font-display text-lg leading-tight font-semibold sm:text-xl">
            {movie.title}
          </h2>
        </div>

        <div className="mt-3 max-w-xs">
          <ScoreDuel ratings={movie.ratings} average={movie.average} size="sm" />
        </div>

        <button
          type="button"
          onClick={() => onOpen(movie)}
          className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-brand-bright"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          Ver {labels.singular}
        </button>
      </div>
    </motion.div>
  );
}