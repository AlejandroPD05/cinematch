import { memo, useCallback, useEffect, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { obtenerPoster } from '../lib/tmdb.js';

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
 * Orden: póster de TMDB → (si no hay o falla) carátula del Sheets → placeholder.
 * stage: 'tmdb' | 'sheet' | 'failed'
 */
function PosterInner({ src, title, eager = false, compact = false, className = '' }) {
  const [stage, setStage] = useState('tmdb');
  const [tmdbUrl, setTmdbUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Busca el póster en TMDB; si no hay, pasa a la carátula del Sheets.
  useEffect(() => {
    if (stage !== 'tmdb') return undefined;
    let cancelled = false;
    obtenerPoster(title).then((url) => {
      if (cancelled) return;
      if (url) setTmdbUrl(url);
      else setStage(src ? 'sheet' : 'failed');
    });
    return () => {
      cancelled = true;
    };
  }, [stage, title, src]);

  const finalSrc = stage === 'tmdb' ? tmdbUrl : stage === 'sheet' ? src : null;

  const handleLoad = useCallback(() => setLoaded(true), []);

  const handleError = useCallback(() => {
    setLoaded(false);
    setStage((current) => {
      if (current === 'tmdb') return src ? 'sheet' : 'failed';
      return 'failed';
    });
  }, [src]);

  // Imágenes ya en caché pueden estar completas antes de enganchar onLoad.
  const imgRef = useCallback(
    (node) => {
      if (!node?.complete) return;
      if (node.naturalWidth > 0) setLoaded(true);
      else handleError();
    },
    [handleError],
  );

  if (stage === 'failed') return <PosterPlaceholder title={title} compact={compact} />;

  return (
    <div className={`relative h-full w-full bg-ink-800 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
      )}
      {finalSrc && (
        <img
          ref={imgRef}
          src={finalSrc}
          alt={`Carátula de ${title}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={handleLoad}
          onError={handleError}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

// La "key" reinicia el estado si cambia la película o su URL.
function Poster(props) {
  return <PosterInner key={`${props.src ?? ''}|${props.title}`} {...props} />;
}

export default memo(Poster);