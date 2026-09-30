import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck } from 'lucide-react';

const MESSAGES = {
  updated: { icon: CircleCheck, text: 'Colección actualizada desde Google Sheets.' },
  failed: { icon: CircleAlert, text: 'No se ha podido actualizar. Se muestran los últimos datos cargados.' },
};

export default function RefreshNotice({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  const config = notice ? MESSAGES[notice.type] : null;
  const Icon = config?.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {config && (
          <motion.div
            key={notice.at}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-ink-800/95 px-4 py-2.5 text-sm text-fg shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur"
          >
            <Icon
              className={`h-4 w-4 ${notice.type === 'updated' ? 'text-brand-bright' : 'text-fg/70'}`}
              aria-hidden="true"
            />
            {config.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
