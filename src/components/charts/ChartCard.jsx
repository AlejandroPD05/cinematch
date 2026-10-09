import { motion } from 'framer-motion';

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.06 },
  }),
};

/**
 * Tarjeta contenedora de una gráfica: mismo lenguaje visual que las tiles de
 * StatsSection (borde white/[0.08], fondo ink-900, radio 2xl).
 * Espera estar dentro de un contenedor con initial/whileInView de framer-motion.
 */
export default function ChartCard({ title, description, index = 0, children, className = '' }) {
  return (
    <motion.figure
      variants={reveal}
      custom={index}
      className={`flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900 p-5 ${className}`}
    >
      <figcaption>
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
      </figcaption>
      <div className="mt-4">{children}</div>
    </motion.figure>
  );
}

/** Datos ocultos visualmente pero legibles por lectores de pantalla. */
export function ChartTable({ caption, headers, rows }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
