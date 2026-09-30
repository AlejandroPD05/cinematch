import { useId } from 'react';
import { PEOPLE, RATING_MAX } from '../config/config.js';
import { formatRating, ratingTier } from '../utils/ratings.js';

const tierText = {
  high: 'text-brand-bright',
  mid: 'text-brand',
  low: 'text-fg/80',
  unrated: 'text-faint',
};

/** Pastilla pequeña con la media, siempre visible sobre el póster. */
export function AverageBadge({ value, className = '' }) {
  if (typeof value !== 'number') return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2 py-1 font-display text-[11px] font-semibold text-fg ring-1 ring-white/10 backdrop-blur-md tabular ${className}`}
      aria-label={`Nota media ${formatRating(value)} sobre ${RATING_MAX}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${value >= 8 ? 'bg-brand-bright' : 'bg-brand'}`} aria-hidden="true" />
      {formatRating(value)}
    </span>
  );
}

/** Anillo con la media (el elemento central del "duelo"). */
export function AverageRing({ value, size = 'md' }) {
  const gradientId = `cm-ring-${useId().replace(/:/g, '')}`;
  const hasValue = typeof value === 'number';
  const pct = hasValue ? Math.max(0, Math.min(1, value / RATING_MAX)) : 0;
  const dims = { sm: 44, md: 64, lg: 92 }[size];
  const stroke = size === 'lg' ? 4 : 3;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const text = { sm: 'text-sm', md: 'text-lg', lg: 'text-[28px]' }[size];

  return (
    <div className="relative shrink-0" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} className="-rotate-90" aria-hidden="true">
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        {hasValue && (
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
          />
        )}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00D26A" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display font-semibold leading-none tabular ${text} ${tierText[ratingTier(value)]}`}>
          {formatRating(value)}
        </span>
        {size !== 'sm' && <span className="mt-1 text-[10px] font-medium text-muted">media</span>}
      </div>
    </div>
  );
}

function PersonScore({ name, value, align, size }) {
  const valueSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size];
  return (
    <div className={`min-w-0 flex-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="truncate text-[11px] font-semibold text-muted sm:text-xs">{name}</p>
      <p className={`mt-0.5 font-display font-semibold leading-none tabular ${valueSize} ${tierText[ratingTier(value)]}`}>
        {formatRating(value)}
        {typeof value === 'number' && <span className="ml-0.5 text-[0.45em] font-medium text-faint">/{RATING_MAX}</span>}
      </p>
    </div>
  );
}

/**
 * El "duelo": nota de cada persona a los lados y la media en el centro.
 * Es el elemento de identidad de la app.
 */
export function ScoreDuel({ ratings, average, size = 'md' }) {
  const [left, right] = PEOPLE;
  return (
    <div role="group" className="flex items-center gap-3" aria-label={
      `${left.name}: ${formatRating(ratings[left.key])}. ${right.name}: ${formatRating(ratings[right.key])}. Media: ${formatRating(average)}.`
    }>
      <PersonScore name={left.name} value={ratings[left.key]} align="left" size={size} />
      <AverageRing value={average} size={size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'} />
      <PersonScore name={right.name} value={ratings[right.key]} align="right" size={size} />
    </div>
  );
}
