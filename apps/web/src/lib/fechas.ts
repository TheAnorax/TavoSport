const dia = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const hora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });

export const fmtFecha = (iso: string) => dia.format(new Date(iso));
export const fmtHora = (iso: string) => hora.format(new Date(iso));
export const fmtFechaHora = (iso: string) =>
  `${dia.format(new Date(iso))} · ${hora.format(new Date(iso))}`;

/** Convierte un ISO a "YYYY-MM-DDTHH:mm" para <input type="datetime-local">. */
export const paraInputDateTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const paraInputDate = (iso: string) => paraInputDateTime(iso).slice(0, 10);
