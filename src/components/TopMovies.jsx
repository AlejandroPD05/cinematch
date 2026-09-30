import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRating } from '../utils/ratings.js';
import Poster from './Poster.jsx';
import SectionHeading from './SectionHeading.jsx';

function ScrollButtons({ trackRef }) {
  const scroll = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
  };
  const btn =
    'grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:border-brand/60 hover:text-brand-bright';
  return (
    <div className="hidden gap-2 sm:flex">
      <button type="button" className={btn} onClick={() => scroll(-1)} aria-label="Anteriores">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" className={btn} onClick={() => scroll(1)} aria-label="Siguientes">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Ranking por nota media. El número es un ranking real, por eso se muestra. */
export default function TopMovies({ movies, onOpen }) {
  const trackRef = useRef(null);
  if (!movies || movies.length === 0) return null;

  return (
    <section id="top" aria-labelledby="top-title" className="scroll-mt-32">
      <SectionHeading
        id="top-title"
        title={`Las mejor valoradas: top ${movies.length}`}
        description="Ordenadas por nuestra nota media. Si hay empate, manda el orden de la hoja."
        action={<ScrollButtons trackRef={trackRef} />}
      />

      <ol
        ref={trackRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
      >
        {movies.map((movie, index) => (
          <motion.li
            key={movie.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05 }}
            className="w-36 shrink-0 snap-start sm:w-44 lg:w-48"
          >
            <button
              type="button"
              onClick={() => onOpen(movie)}
              className="group block w-full rounded-xl text-left"
              aria-label={`Puesto ${index + 1}: ${movie.title}, media ${formatRating(movie.average)}`}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-brand/60 group-hover:shadow-[0_18px_40px_-14px_rgb(0_210_106/0.5)]">
                <Poster src={movie.poster} title={movie.title} />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-black via-black/70 to-transparent px-3 pt-10 pb-2.5">
                  <span className="font-display text-4xl leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_#00ff88]">
                    {index + 1}
                  </span>
                  <span className="font-display text-lg font-semibold text-brand-bright tabular">
                    {formatRating(movie.average)}
                  </span>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-fg/90 group-hover:text-fg">
                {movie.title}
              </p>
            </button>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
