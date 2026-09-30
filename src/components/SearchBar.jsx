import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

/** Buscador en tiempo real. Atajo: tecla "/" para enfocarlo. */
export default function SearchBar({ value, onChange, className = '', id = 'buscar' }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName;
      if (event.key !== '/' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (inputRef.current?.offsetParent === null) return; // oculto en este tamaño de pantalla
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Buscar película
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
        placeholder="Buscar película"
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-full border border-white/10 bg-white/[0.04] pr-10 pl-10 text-sm text-fg placeholder:text-faint transition-colors outline-none hover:border-white/20 focus:border-brand/70 focus:bg-white/[0.06] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-fg"
          aria-label="Borrar búsqueda"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-white/10 px-1.5 text-[11px] text-faint lg:block">
          /
        </kbd>
      )}
    </div>
  );
}
