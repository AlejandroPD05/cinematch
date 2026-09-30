import { APP_NAME } from '../config/config.js';

/** Marca: dos lentes que se cruzan (dos personas, una misma película). */
export function LogoMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#050505" />
      <circle cx="12.5" cy="16" r="7" fill="none" stroke="#00D26A" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="7" fill="none" stroke="#00D26A" strokeWidth="2.4" />
      <path d="M16 10.3a7 7 0 0 1 0 11.4a7 7 0 0 1 0-11.4Z" fill="#00FF88" />
    </svg>
  );
}

export default function Logo({ onClick }) {
  return (
    <a
      href="#inicio"
      onClick={onClick}
      className="group flex shrink-0 items-center gap-2.5 rounded-lg"
      aria-label={`${APP_NAME}, ir al inicio`}
    >
      <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:rotate-[-8deg]" />
      <span className="font-display text-[15px] font-semibold tracking-[0.08em] text-fg sm:text-base">
        {APP_NAME}
      </span>
    </a>
  );
}
