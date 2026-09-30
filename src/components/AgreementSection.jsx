import { motion } from 'framer-motion';
import { Handshake, Swords } from 'lucide-react';
import { PEOPLE } from '../config/config.js';
import { formatPoints, formatRating, matchPercent } from '../utils/ratings.js';
import Poster from './Poster.jsx';

function DuelRow({ movie, mode, onOpen, index }) {
  const [a, b] = PEOPLE;
  const badge =
    mode === 'agree'
      ? `Match ${matchPercent(movie.difference)}%`
      : `${formatPoints(movie.difference)}`;

  return (
    <motion.li
      initial={{ opacity: 0, x: mode === 'agree' ? -10 : 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <button
        type="button"
        onClick={() => onOpen(movie)}
        className="group flex w-full items-center gap-4 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04]"
      >
        <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10 sm:w-14">
          <Poster src={movie.poster} title={movie.title} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg/90 group-hover:text-fg">{movie.title}</p>
          <p className="mt-1 text-xs text-muted tabular">
            {a.name} <span className="font-display font-semibold text-fg">{formatRating(movie.ratings[a.key])}</span>
            <span className="mx-2 text-faint">vs</span>
            {b.name} <span className="font-display font-semibold text-fg">{formatRating(movie.ratings[b.key])}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular ${
            mode === 'agree' ? 'bg-brand/15 text-brand-bright' : 'bg-white/[0.06] text-fg/85'
          }`}
        >
          {badge}
        </span>
      </button>
    </motion.li>
  );
}

function Column({ icon: Icon, title, description, movies, mode, onOpen }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-900 p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3 px-2">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
      </div>
      <ul className="space-y-1">
        {movies.map((movie, i) => (
          <DuelRow key={movie.id} movie={movie} mode={mode} onOpen={onOpen} index={i} />
        ))}
      </ul>
    </div>
  );
}

/** Donde más coincidimos y donde más discrepamos. Solo películas con las dos notas. */
export default function AgreementSection({ agreements, disagreements, onOpen }) {
  if (agreements.length === 0 && disagreements.length === 0) return null;

  return (
    <section aria-label="Coincidencias y discrepancias" className="grid gap-4 lg:grid-cols-2">
      {agreements.length > 0 && (
        <Column
          icon={Handshake}
          title="En las que más coincidimos"
          description="La menor diferencia entre nuestras notas."
          movies={agreements}
          mode="agree"
          onOpen={onOpen}
        />
      )}
      {disagreements.length > 0 && (
        <Column
          icon={Swords}
          title="Las que nos hicieron discutir"
          description="Donde más discrepamos: la mayor diferencia de puntos."
          movies={disagreements}
          mode="disagree"
          onOpen={onOpen}
        />
      )}
    </section>
  );
}
