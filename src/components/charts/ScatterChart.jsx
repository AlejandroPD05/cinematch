import { motion } from 'framer-motion';
import { AGREEMENT_THRESHOLD, PEOPLE, RATING_MAX } from '../../config/config.js';
import { formatRating } from '../../utils/ratings.js';
import { ChartTable } from './ChartCard.jsx';

/* Proyección del plano: viewBox con margen para los ejes. */
const VIEW = { w: 340, h: 300, left: 40, right: 12, top: 12, bottom: 36 };
const PLOT = {
  x: VIEW.left,
  y: VIEW.top,
  w: VIEW.w - VIEW.left - VIEW.right,
  h: VIEW.h - VIEW.top - VIEW.bottom,
};

const sx = (v) => PLOT.x + (v / RATING_MAX) * PLOT.w;
const sy = (v) => PLOT.y + PLOT.h - (v / RATING_MAX) * PLOT.h;

const TICKS = [0, 2, 4, 6, 8, 10];

/* Color por cercanía a la diagonal: acuerdo = verde vivo, lejos = gris que se
   retira. La gráfica cuenta la historia sin leyenda larga. */
function pointColor(difference) {
  if (difference === 0) return '#00ff88';
  if (difference <= AGREEMENT_THRESHOLD) return '#00d26a';
  return '#5b6660';
}

const legend = [
  { color: '#00ff88', label: 'Misma nota' },
  { color: '#00d26a', label: `A ${AGREEMENT_THRESHOLD} punto o menos` },
  { color: '#5b6660', label: 'Más lejos' },
];

/**
 * El mapa de acuerdo: cada película con las dos notas es un punto en
 * (nota persona 1, nota persona 2). La diagonal es el acuerdo perfecto.
 */
export default function ScatterChart({ points, onOpen }) {
  const [a, b] = PEOPLE;

  if (!points || points.length === 0) return null;

  const handleKey = (event, movie) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(movie);
    }
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="h-[clamp(200px,26vw,340px)] w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Dispersión de notas: ${points.length} ${a.name} frente a ${b.name}. La diagonal marca el acuerdo.`}
      >
        {/* Rejilla */}
        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={sx(t)}
              y1={PLOT.y}
              x2={sx(t)}
              y2={PLOT.y + PLOT.h}
              stroke="rgb(255 255 255 / 0.05)"
              strokeWidth="1"
            />
            <line
              x1={PLOT.x}
              y1={sy(t)}
              x2={PLOT.x + PLOT.w}
              y2={sy(t)}
              stroke="rgb(255 255 255 / 0.05)"
              strokeWidth="1"
            />
            <text x={sx(t)} y={PLOT.y + PLOT.h + 16} textAnchor="middle" className="fill-faint text-[10px] tabular">
              {t}
            </text>
            <text x={PLOT.x - 8} y={sy(t) + 3} textAnchor="end" className="fill-faint text-[10px] tabular">
              {t}
            </text>
          </g>
        ))}

        {/* Diagonal: acuerdo perfecto (x = y) */}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(RATING_MAX)}
          y2={sy(RATING_MAX)}
          stroke="rgb(0 255 136 / 0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Puntos */}
        {points.map((point, index) => (
          <motion.circle
            key={point.id}
            cx={sx(point.x)}
            cy={sy(point.y)}
            r={5}
            fill={pointColor(point.agreement)}
            fillOpacity={0.85}
            stroke="transparent"
            strokeWidth={6}
            tabIndex={0}
            role="button"
            className="cursor-pointer transition-[stroke] duration-200 hover:stroke-white/25 focus-visible:stroke-brand-bright"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: Math.min(index, 20) * 0.02 }}
            onClick={() => onOpen(point.movie)}
            onKeyDown={(event) => handleKey(event, point.movie)}
          >
            <title>{`${point.movie.title} — ${a.name} ${formatRating(point.x)} · ${b.name} ${formatRating(point.y)}`}</title>
          </motion.circle>
        ))}

        {/* Títulos de eje */}
        <text
          x={PLOT.x + PLOT.w / 2}
          y={VIEW.h - 4}
          textAnchor="middle"
          className="fill-muted text-[11px] font-semibold"
        >
          {a.name}
        </text>
        <text
          x={12}
          y={PLOT.y + PLOT.h / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${PLOT.y + PLOT.h / 2})`}
          className="fill-muted text-[11px] font-semibold"
        >
          {b.name}
        </text>
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden="true">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-faint">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>

      <ChartTable
        caption={`Notas de ${a.name} y ${b.name} por película`}
        headers={['Película', a.name, b.name, 'Diferencia']}
        rows={points.map((p) => [
          p.movie.title,
          formatRating(p.x),
          formatRating(p.y),
          formatRating(p.agreement),
        ])}
      />
    </div>
  );
}
