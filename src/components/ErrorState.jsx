import { motion } from 'framer-motion';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function ErrorState({ onRetry, retrying = false, configError = false }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-white/10 bg-ink-900 px-6 py-14 text-center"
    >
      <TriangleAlert className="h-10 w-10 text-brand" strokeWidth={1.4} aria-hidden="true" />
      <h2 className="mt-4 font-display text-lg font-semibold">No hemos podido cargar nuestra colección.</h2>
      <p className="mt-2 text-sm text-muted">
        {configError
          ? 'Falta indicar qué Google Sheets hay que leer. Revisa la configuración del proyecto (README, paso D).'
          : 'Comprueba la conexión y vuelve a intentarlo en unos segundos.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-bright disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
        Reintentar
      </button>
    </motion.div>
  );
}
