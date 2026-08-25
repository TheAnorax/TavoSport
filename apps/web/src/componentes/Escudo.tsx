/** Escudo del equipo, con iniciales como respaldo cuando no hay imagen. */
export default function Escudo({
  nombre,
  url,
  tam = 32,
}: {
  nombre: string;
  url?: string | null;
  tam?: number;
}) {
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  if (url) {
    return (
      <img
        src={url}
        alt={nombre}
        width={tam}
        height={tam}
        className="shrink-0 rounded-full object-cover ring-1 ring-slate-200"
        style={{ width: tam, height: tam }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-500"
      style={{ width: tam, height: tam, fontSize: tam * 0.36 }}
    >
      {iniciales}
    </span>
  );
}
