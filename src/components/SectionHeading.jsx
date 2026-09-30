export default function SectionHeading({ id, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div>
        <h2 id={id} className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1.5 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
