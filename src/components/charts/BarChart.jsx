import { motion } from 'framer-motion';
import { ChartTable } from './ChartCard.jsx';

/**
 * Barras horizontales para el reparto por categorías (género, saga...).
 * `breakdown` viene de getFacetBreakdown: { total, bars, restCount }.
 */
export default function BarChart({ breakdown }) {
  if (!breakdown || breakdown.bars.length === 0) return null;

  const { total, bars, restCount } = breakdown;

  return (
    <div>
      <ul className="space-y-2.5">
        {bars.map((bar, index) => (
          <li key={bar.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-medium text-fg/90">{bar.label}</span>
              <span className="shrink-0 text-xs text-muted tabular">
                {bar.count}
                <span className="ml-1 text-faint">({Math.round(bar.pct)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-brand to-brand-bright"
                initial={{ width: 0 }}
                whileInView={{ width: `${bar.pct}%` }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>

      {restCount && (
        <p className="mt-3 text-xs text-faint">
          +{restCount.categories} categorías más con {restCount.count} {restCount.count === 1 ? 'película' : 'películas'}.
        </p>
      )}

      <ChartTable
        caption={`Reparto por categorías (sobre ${total})`}
        headers={['Categoría', 'Películas', 'Porcentaje']}
        rows={[
          ...bars.map((bar) => [bar.label, String(bar.count), `${Math.round(bar.pct)}%`]),
          ...(restCount ? [['Otras', String(restCount.count), `${Math.round(restCount.pct)}%`]] : []),
        ]}
      />
    </div>
  );
}
