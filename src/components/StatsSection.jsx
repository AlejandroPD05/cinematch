import { motion } from 'framer-motion';
import { AGREEMENT_THRESHOLD, RATING_MAX } from '../config/config.js';
import { formatPoints, formatRating } from '../utils/ratings.js';
import { AverageRing } from './Rating.jsx';
import SectionHeading from './SectionHeading.jsx';

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.06 } }),
};

function Tile({ index, label, value, note, className = '' }) {
  return (
    <motion.div
      variants={reveal}
      custom={index}
      className={`flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-ink-900 p-5 ${className}`}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="mt-4">
        <p className="font-display text-3xl leading-none font-semibold tabular sm:text-[34px]">{value}</p>
        {note && <p className="mt-2 text-xs text-faint">{note}</p>}
      </div>
    </motion.div>
  );
}

export default function StatsSection({ stats }) {
  if (!stats || stats.total === 0) return null;

  const [first, second] = stats.people;
  const tiles = [
    { label: 'Películas en la colección', value: stats.total, note: `${stats.ratedCount} con al menos una nota` },
    stats.agreementRate !== null && {
      label: 'Nivel de sintonía',
      value: `${stats.agreementRate}%`,
      note: `Películas en las que nos separa ${formatPoints(AGREEMENT_THRESHOLD)} o menos`,
    },
    stats.sharedCount > 0 && {
      label: 'Dieces de los dos',
      value: stats.perfectTens,
      note: `${stats.exactMatches} con la misma nota exacta`,
    },
    stats.averageDifference !== null && {
      label: 'Diferencia media en puntos',
      value: formatRating(stats.averageDifference),
      note: stats.strictest ? `${stats.strictest.name} es quien puntúa más bajo` : 'Puntuamos parecido',
    },
  ].filter(Boolean);

  return (
    <section id="estadisticas" aria-labelledby="stats-title" className="scroll-mt-32">
      <SectionHeading
        id="stats-title"
        title="Nuestros números"
        description="Calculado con las notas reales de la hoja. Se actualiza al añadir o editar películas."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
      >
        {/* Bloque principal: media de la colección y la de cada uno */}
        <motion.div
          variants={reveal}
          className="relative overflow-hidden rounded-2xl border border-brand/25 bg-ink-800 p-6 sm:col-span-2 lg:row-span-2"
        >
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
          />
          <p className="relative text-sm font-medium text-muted">Nota media de la colección</p>
          <div className="relative mt-5 flex items-center gap-5">
            <AverageRing value={stats.collectionAverage} size="lg" />
            <p className="max-w-[16rem] text-sm leading-relaxed text-muted">
              La media de las medias de {stats.ratedCount} películas valoradas, sobre {RATING_MAX}.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-3">
            {[first, second].map((person) => (
              <div key={person.key} className="rounded-xl bg-black/30 p-4 ring-1 ring-white/[0.06]">
                <p className="truncate text-sm font-semibold text-fg/90">Media de {person.name}</p>
                <p className="mt-2 font-display text-3xl leading-none font-semibold text-brand-bright tabular">
                  {formatRating(person.average)}
                  <span className="ml-1 text-sm font-medium text-faint">/{RATING_MAX}</span>
                </p>
                <p className="mt-2 text-xs text-faint">
                  {person.count === 1 ? '1 película puntuada' : `${person.count} películas puntuadas`}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {tiles.map((tile, i) => (
          <Tile key={tile.label} index={i + 1} {...tile} />
        ))}
      </motion.div>
    </section>
  );
}
