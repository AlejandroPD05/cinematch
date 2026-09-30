import { memo, useCallback, useState } from 'react';
import { Clapperboard } from 'lucide-react';

/** Placeholder cuando no hay carátula o la imagen falla. Nunca se ve una imagen rota. */
export function PosterPlaceholder({ title, compact = false }) {
  return (
    <div
      role="img"
      aria-label={`Sin carátula: ${title}`}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-ink-800 px-3 text-center"
    >
      <div className="film-edge absolute inset-x-2 top-2 h-1.5 opacity-70" />
      <div className="film-edge absolute inset-x-2 bottom-2 h-1.5 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgb(0_210_106/0.14),transparent_65%)]" />
      <Clapperboard
        className={`relative text-brand ${compact ? 'h-5 w-5' : 'mb-3 h-9 w-9'}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {!compact && (
        <p className="relative line-clamp-4 font-display text-[13px] leading-snug font-medium text-fg/90 sm:text-sm">
          {title}
        </p>
      )}
    </div>
  );
}

/**
 * Carátula con carga diferida, fundido al cargar y fallback automático.
 * La URL NO es la identidad de la película: si falla, la película sigue ahí.
 */
function Poster({ src, title, eager = false, compact = false, className = '' }) {
  // El estado va ligado a la URL: si la URL cambia, vuelve a 'loading' sin efectos extra.
  const [result, setResult] = useState({ src: null, status: 'loading' });
  const status = !src ? 'error' : result.src === src ? result.status : 'loading';

  const markLoaded = useCallback(() => setResult({ src, status: 'loaded' }), [src]);
  const markFailed = useCallback(() => setResult({ src, status: 'error' }), [src]);

  // Imágenes ya en caché pueden estar completas antes de enganchar onLoad.
  const imgRef = useCallback(
    (node) => {
      if (!node?.complete) return;
      if (node.naturalWidth > 0) markLoaded();
      else markFailed();
    },
    [markLoaded, markFailed],
  );

  if (!src || status === 'error') return <PosterPlaceholder title={title} compact={compact} />;

  return (
    <div className={`relative h-full w-full bg-ink-800 ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={`Carátula de ${title}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={markLoaded}
        onError={markFailed}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default memo(Poster);
