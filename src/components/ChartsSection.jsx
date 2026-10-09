import { useState } from 'react';
import { motion } from 'framer-motion';
import { CHARTS_ENABLED, PEOPLE } from '../config/config.js';
import { getLabels } from '../utils/labels.js';
import BarChart from './charts/BarChart.jsx';
import ChartCard from './charts/ChartCard.jsx';
import Heatmap from './charts/Heatmap.jsx';
import LineChart from './charts/LineChart.jsx';
import ScatterChart from './charts/ScatterChart.jsx';
import SectionHeading from './SectionHeading.jsx';

/** Conmutador discreto entre los facets disponibles (género, saga...). */
function FacetSwitch({ facets, value, onChange }) {
  if (facets.length <= 1) return null;
  return (
    <div role="group" aria-label="Categoría de la gráfica" className="mb-3 flex flex-wrap gap-1">
      {facets.map((facet) => {
        const active = facet.key === value;
        return (
          <button
            key={facet.key}
            type="button"
            onClick={() => onChange(facet.key)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              active ? 'bg-brand text-black' : 'text-muted hover:bg-white/[0.05] hover:text-fg'
            }`}
          >
            {facet.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * El apartado de gráficas: mapa de acuerdo, evolución del gusto, reparto por
 * categorías y (si hay fechas) calendario de noches de cine.
 * Se oculta entero si no hay datos que mostrar.
 */
export default function ChartsSection({ charts, onOpen, labels = getLabels('movies') }) {
  const { scatter, timeline, breakdowns, facets, calendar } = charts;
  const [facetKey, setFacetKey] = useState(facets[0]?.key ?? null);

  const activeFacet = facets.find((f) => f.key === facetKey) ?? facets[0];
  const activeBreakdown = activeFacet ? breakdowns[activeFacet.key] : null;

  const showScatter = CHARTS_ENABLED.scatter && scatter.length > 0;
  const showTimeline = CHARTS_ENABLED.timeline && timeline.points.length > 1;
  const showBreakdown = CHARTS_ENABLED.breakdown && Boolean(activeBreakdown);
  const showCalendar = CHARTS_ENABLED.calendar && Boolean(calendar);

  const hasContent = showScatter || showTimeline || showBreakdown || showCalendar;
  if (!hasContent) return null;

  return (
    <section id="graficos" aria-labelledby="charts-title" className="scroll-mt-32">
      <SectionHeading
        id="charts-title"
        title="Nuestras gráficas"
        description={`Cómo se reparten y evolucionan nuestras notas en ${labels.plural}. Cada punto y cada barra sale de la hoja.`}
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-3 lg:grid-cols-2"
      >
        {showScatter && (
          <ChartCard
            title="El mapa del acuerdo"
            description={`Cada ${labels.singular} es un punto: horizontal, la nota de ${PEOPLE[0].name}; vertical, la de ${PEOPLE[1].name}. La diagonal es la misma nota.`}
            index={0}
          >
            <ScatterChart points={scatter} onOpen={onOpen} />
          </ChartCard>
        )}

        {showBreakdown && (
          <ChartCard
            title="Cómo se reparte"
            description={`Nuestra colección por ${activeFacet.label.toLowerCase()}, de más a menos.`}
            index={1}
          >
            <FacetSwitch facets={facets} value={facetKey} onChange={setFacetKey} />
            <BarChart breakdown={activeBreakdown} />
          </ChartCard>
        )}

        {showTimeline && (
          <ChartCard
            title="Nuestro gusto en el tiempo"
            description={`Media móvil de nuestras notas: ¿nos ponemos más duros o más generosos con ${labels.plural}?`}
            index={2}
          >
            <LineChart timeline={timeline} />
          </ChartCard>
        )}

        {showCalendar && (
          <ChartCard
            title="Calendario de noches de cine"
            description="Cada cuadrado es un día; cuanto más verde, más visteis ese día."
            index={3}
            className="lg:col-span-2"
          >
            <Heatmap calendar={calendar} />
          </ChartCard>
        )}
      </motion.div>
    </section>
  );
}
