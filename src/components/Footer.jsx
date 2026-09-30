import { APP_NAME, APP_TAGLINE } from '../config/config.js';
import { LogoMark } from './Logo.jsx';

const timeFormat = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

export default function Footer({ fetchedAt }) {
  return (
    <footer className="mt-20 border-t border-white/[0.06]">
      <div className="film-edge mx-auto h-1.5 max-w-[1680px] opacity-40" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.08em]">{APP_NAME}</p>
            <p className="text-sm text-muted">{APP_TAGLINE}</p>
          </div>
        </div>
        <p className="text-xs text-faint">
          {fetchedAt ? `Datos leídos de Google Sheets a las ${timeFormat.format(fetchedAt)}. ` : ''}
          {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
