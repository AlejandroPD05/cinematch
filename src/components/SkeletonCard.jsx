function Shimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/[0.05] to-transparent" />
    </div>
  );
}

export default function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5">
        <Shimmer />
        <div className="film-edge absolute inset-x-2 top-2 h-1.5 opacity-40" />
        <div className="film-edge absolute inset-x-2 bottom-2 h-1.5 opacity-40" />
      </div>
      <div className="relative mt-3 h-3 w-4/5 overflow-hidden rounded bg-ink-700">
        <Shimmer />
      </div>
      <div className="relative mt-2 h-3 w-2/5 overflow-hidden rounded bg-ink-800">
        <Shimmer />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      <span className="sr-only">Preparando la colección</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
