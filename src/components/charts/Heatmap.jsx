import { formatDay } from '../../utils/dates.js';
import { ChartTable } from './ChartCard.jsx';

const WEEKS = 26; // medio año de retroceso

const INTENSITY = [
  'bg-white/[0.06]',
  'bg-brand/25',
  'bg-brand/45',
  'bg-brand/70',
  'bg-brand-bright',
];

const levelFor = (count, max) => {
  if (!count) return 0;
  if (max <= 1) return 4;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
};

/**
 * Calendario de noches de cine (estilo GitHub): cuadrícula de días, coloreada
 * por cuántas películas se vieron. Solo se monta si hay fechas en la hoja.
 */
export default function Heatmap({ calendar }) {
  if (!calendar || calendar.days.length === 0) return null;

  const { byDay, busiest, maxCount, latestIso } = calendar;

  // La ventana termina en la última noche con datos (o en hoy, lo que venga
  // antes). Anclarse solo a hoy dejaría el calendario vacío si la colección es
  // antigua. Se redondea hacia atrás al domingo de esa semana.
  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);
  if (latestIso) {
    const [y, m, d] = latestIso.split('-').map(Number);
    const last = new Date(y, m - 1, d);
    if (last < anchor) anchor.setTime(last.getTime());
  }
  const end = new Date(anchor);
  end.setDate(end.getDate() + (7 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - WEEKS * 7 + 1);

  const cells = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    cells.push({ iso, count: byDay.get(iso) ?? 0, future: d > anchor });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      <div className="overflow-visible pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: 'minmax(0, 1fr)' }}>
          {weeks.map((week) =>
            week.map((cell) => (
              <div
                key={cell.iso}
                className={`aspect-square w-full rounded-[3px] ${cell.future ? 'bg-transparent' : INTENSITY[levelFor(cell.count, maxCount)]}`}
                title={cell.future ? undefined : `${formatDay(cell.iso)}: ${cell.count} ${cell.count === 1 ? 'película' : 'películas'}`}
              />
            )),
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p>
          Días distintos con cine: <span className="font-semibold text-fg tabular">{calendar.distinctDays}</span>
        </p>
        {busiest && busiest.count > 1 && (
          <p className="text-faint">
            Día más intenso: {formatDay(busiest.iso)} ({busiest.count} {busiest.count === 1 ? 'película' : 'películas'})
          </p>
        )}
      </div>

      <ChartTable
        caption="Películas vistas por día"
        headers={['Fecha', 'Películas']}
        rows={calendar.days.map((day) => [formatDay(day.iso), String(day.count)])}
      />
    </div>
  );
}
