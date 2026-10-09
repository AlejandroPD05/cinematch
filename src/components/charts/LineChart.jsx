import { motion } from 'framer-motion';
import { PEOPLE, RATING_MAX } from '../../config/config.js';
import { formatRating } from '../../utils/ratings.js';
import { ChartTable } from './ChartCard.jsx';

/* El lienzo es casi cuadrado para que la tarjeta quede a la misma altura que
   la del mapa del acuerdo, que comparte fila. */
const VIEW = { w: 340, h: 290, left: 30, right: 12, top: 14, bottom: 34 };
const PLOT = {
  x: VIEW.left,
  y: VIEW.top,
  w: VIEW.w - VIEW.left - VIEW.right,
  h: VIEW.h - VIEW.top - VIEW.bottom,
};

const TICKS = [0, 2, 4, 6, 8, 10];

const COLORS = { person1: '#00ff88', person2: '#8d9a93' };

/**
 * Evolución del gusto: media móvil de la nota de cada persona.
 * El eje X es el orden de la hoja, o el tiempo real si hay fechas.
 */
export default function LineChart({ timeline }) {
  const [a, b] = PEOPLE;
  const { points, byDate } = timeline;
  if (!points || points.length < 2) return null;

  const sx = (i) => PLOT.x + (i / (points.length - 1)) * PLOT.w;
  const sy = (v) => PLOT.y + PLOT.h - (v / RATING_MAX) * PLOT.h;

  const line = (key) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p[key] ?? 0).toFixed(1)}`)
      .join(' ');

  // Solo unas pocas etiquetas del eje X para no saturar.
  const labelCount = 4;
  const labelIndexes = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i * (points.length - 1)) / (labelCount - 1)),
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="h-[clamp(200px,26vw,340px)] w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Evolución de la nota media de ${a.name} y ${b.name} en ${points.length} ${byDate ? 'meses' : 'películas'}.`}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PLOT.x}
              y1={sy(t)}
              x2={PLOT.x + PLOT.w}
              y2={sy(t)}
              stroke="rgb(255 255 255 / 0.05)"
              strokeWidth="1"
            />
            <text x={PLOT.x - 6} y={sy(t) + 3} textAnchor="end" className="fill-faint text-[10px] tabular">
              {t}
            </text>
          </g>
        ))}

        {labelIndexes.map((i, slot) => {
          // La primera y la última se anclan a su borde para no cortarse contra
          // el margen del lienzo; las intermedias van centradas.
          const anchor = slot === 0 ? 'start' : slot === labelIndexes.length - 1 ? 'end' : 'middle';
          const x = slot === 0 ? PLOT.x : slot === labelIndexes.length - 1 ? PLOT.x + PLOT.w : sx(i);
          return (
            <text key={i} x={x} y={PLOT.y + PLOT.h + 16} textAnchor={anchor} className="fill-faint text-[10px] tabular">
              {points[i].label}
            </text>
          );
        })}

        {/* Línea de cada persona */}
        {[a, b].map((person, index) => (
          <motion.path
            key={person.key}
            d={line(person.key)}
            fill="none"
            stroke={index === 0 ? COLORS.person1 : COLORS.person2}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden="true">
        {[a, b].map((person, index) => (
          <li key={person.key} className="flex items-center gap-1.5 text-[11px] text-faint">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: index === 0 ? COLORS.person1 : COLORS.person2 }}
            />
            {person.name}
          </li>
        ))}
      </ul>

      <ChartTable
        caption={`Media móvil de las notas: ${a.name} y ${b.name}`}
        headers={['Punto', a.name, b.name]}
        rows={points.map((p, i) => [p.label, formatRating(p.person1), formatRating(p.person2)])}
      />
    </div>
  );
}
