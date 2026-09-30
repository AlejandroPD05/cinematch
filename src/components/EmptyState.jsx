import { motion } from 'framer-motion';
import { Popcorn, RotateCcw } from 'lucide-react';

export default function EmptyState({
  title = 'No hemos encontrado ninguna película.',
  description = 'Prueba con otro nombre o quita algún filtro.',
  actionLabel = 'Limpiar filtros',
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center"
    >
      <Popcorn className="h-10 w-10 text-brand" strokeWidth={1.4} aria-hidden="true" />
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-bright"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
