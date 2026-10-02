import { motion } from 'framer-motion';
import { ArrowDownUp, RotateCcw } from 'lucide-react';
import { getLabels } from '../utils/labels.js';
import { SORT_OPTIONS, TIER_OPTIONS } from '../utils/movieFilters.js';

function Select({ label, value, onChange, children, icon: Icon }) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">{label}</span>
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" aria-hidden="true" />
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 appearance-none rounded-full border border-white/10 bg-white/[0.03] pr-8 text-[13px] font-medium text-fg transition-colors outline-none hover:border-white/20 focus:border-brand/70 ${
          Icon ? 'pl-8' : 'pl-3.5'
        }`}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 h-3 w-3 text-muted" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  );
}

export default function FilterBar({
  filters,
  onTierChange,
  onSortChange,
  onFacetChange,
  onReset,
  isDefault,
  resultCount,
  hasUnrated,
  facets,
  labels = getLabels('movies'),
}) {
  const tiers = TIER_OPTIONS.filter((t) => !t.onlyIfPresent || hasUnrated);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filtrar por valoración"
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {tiers.map((tier) => {
            const active = filters.tier === tier.value;
            return (
              <button
                key={tier.value}
                type="button"
                aria-pressed={active}
                title={tier.hint}
                onClick={() => onTierChange(tier.value)}
                className={`relative h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                  active ? 'text-black' : 'text-muted hover:bg-white/[0.05] hover:text-fg'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tier-pill"
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{tier.label}</span>
              </button>
            );
          })}
        </div>

        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {facets.map((facet) => (
            <Select
              key={facet.key}
              label={`Filtrar por ${facet.label.toLowerCase()}`}
              value={filters.facets[facet.key] ?? ''}
              onChange={(value) => onFacetChange(facet.key, value)}
            >
              <option value="">{facet.label}: todas</option>
              {facet.values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          ))}
          <Select label="Ordenar por" value={filters.sort} onChange={onSortChange} icon={ArrowDownUp}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex min-h-7 items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-semibold text-fg tabular">{resultCount}</span>{' '}
          {resultCount === 1 ? `${labels.singular} encontrada` : `${labels.plural} encontradas`}
        </p>
        {!isDefault && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold text-brand transition-colors hover:bg-brand/10 hover:text-brand-bright"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros
          </motion.button>
        )}
      </div>
    </div>
  );
}