import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import Logo from './Logo.jsx';
import SearchBar from './SearchBar.jsx';

const NAV = [
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#top', label: 'Top' },
  { href: '#estadisticas', label: 'Estadísticas' },
];

export default function Header({ query, onQueryChange, onRefresh, refreshing, canRefresh }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? 'border-b border-white/[0.06] bg-void/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-void/40 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />

        <nav aria-label="Secciones" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchBar
            id="buscar-escritorio"
            value={query}
            onChange={onQueryChange}
            className="hidden w-64 sm:block lg:w-80"
          />

          <a
            href="#estadisticas"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-fg md:hidden"
            aria-label="Ir a estadísticas"
          >
            <BarChart3 className="h-[18px] w-[18px]" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!canRefresh || refreshing}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:border-brand/60 hover:text-brand-bright disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={refreshing ? 'Actualizando datos' : 'Actualizar datos desde Google Sheets'}
            title="Actualizar desde Google Sheets"
          >
            <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Buscador a ancho completo en móvil */}
      <div className="mx-auto max-w-[1680px] px-4 pb-3 sm:hidden">
        <SearchBar id="buscar-movil" value={query} onChange={onQueryChange} />
      </div>
    </header>
  );
}
