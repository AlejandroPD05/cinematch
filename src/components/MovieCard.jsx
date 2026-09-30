import { memo } from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import Poster from './Poster.jsx';
import { AverageBadge, ScoreDuel } from './Rating.jsx';

const EASE = [0.2, 0.8, 0.2, 1];
const posterVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.035, y: -4 },
  tap: { scale: 0.98 },
};

function MovieCard({ movie, index = 0, onOpen }) {
  const subtitle = movie.details.year || movie.details.saga || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, ease: EASE, delay: Math.min(index, 12) * 0.035 }}
    >
      <motion.button
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        type="button"
        onClick={() => onOpen(movie)}
        className="group block w-full rounded-xl text-left focus-visible:outline-none"
        aria-label={`Abrir ficha de ${movie.title}`}
      >
        <motion.div
          variants={posterVariants}
          transition={{ duration: 0.25, ease: EASE }}
          className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/10 transition-[box-shadow] duration-300 group-hover:shadow-[0_0_0_1px_rgb(0_210_106/0.55),0_22px_50px_-14px_rgb(0_210_106/0.5)] group-focus-visible:shadow-[0_0_0_2px_#00ff88,0_22px_50px_-14px_rgb(0_210_106/0.5)]"
        >
          <Poster src={movie.poster} title={movie.title} />

          <AverageBadge
            value={movie.average}
            className="absolute top-2 left-2 transition-opacity duration-200 group-hover:opacity-0"
          />

          {/* Información al pasar el ratón o al enfocar con teclado */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-linear-to-t from-black via-black/90 to-transparent px-3 pt-12 pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            <ScoreDuel ratings={movie.ratings} average={movie.average} size="sm" />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-brand-bright">
              <Maximize2 className="h-3 w-3" aria-hidden="true" />
              Ver ficha
            </p>
          </div>
        </motion.div>

        <span className="mt-2.5 line-clamp-2 text-[13px] leading-snug font-semibold text-fg/90 transition-colors group-hover:text-fg sm:text-sm">
          {movie.title}
        </span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-muted">{subtitle}</span>}
      </motion.button>
    </motion.div>
  );
}

export default memo(MovieCard);
