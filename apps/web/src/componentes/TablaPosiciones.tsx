import type { FilaTabla } from '../lib/tipos';
import Escudo from './Escudo';

const cols: { k: keyof FilaTabla; t: string; ayuda: string }[] = [
  { k: 'pj', t: 'PJ', ayuda: 'Partidos jugados' },
  { k: 'pg', t: 'PG', ayuda: 'Ganados' },
  { k: 'pe', t: 'PE', ayuda: 'Empatados' },
  { k: 'pp', t: 'PP', ayuda: 'Perdidos' },
  { k: 'gf', t: 'GF', ayuda: 'Goles a favor' },
  { k: 'gc', t: 'GC', ayuda: 'Goles en contra' },
  { k: 'dif', t: 'DIF', ayuda: 'Diferencia de goles' },
];

export default function TablaPosiciones({ filas }: { filas: FilaTabla[] }) {
  if (filas.length === 0) {
    return <div className="tarjeta text-center text-slate-500">Todavía no hay equipos en esta temporada.</div>;
  }

  return (
    <div className="tarjeta overflow-x-auto p-0">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-2 py-3 text-center">#</th>
            <th className="px-3 py-3 text-left">Equipo</th>
            {cols.map((c) => (
              <th key={c.k} className="w-12 px-1 py-3 text-center" title={c.ayuda}>{c.t}</th>
            ))}
            <th className="w-14 px-2 py-3 text-center" title="Puntos">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((f) => (
            <tr key={f.equipoId} className="hover:bg-slate-50">
              <td className="px-2 py-3 text-center">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    f.posicion <= 4 ? 'bg-cancha-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {f.posicion}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Escudo nombre={f.equipoNombre} url={f.escudoUrl} tam={24} />
                  {f.equipoNombre}
                </span>
              </td>
              {cols.map((c) => (
                <td
                  key={c.k}
                  className={`px-1 py-3 text-center tabular-nums ${
                    c.k === 'dif' ? (f.dif > 0 ? 'text-cancha-700' : f.dif < 0 ? 'text-red-600' : 'text-slate-500') : 'text-slate-600'
                  }`}
                >
                  {c.k === 'dif' && f.dif > 0 ? `+${f.dif}` : (f[c.k] as number)}
                </td>
              ))}
              <td className="px-2 py-3 text-center text-base font-bold tabular-nums text-cancha-700">{f.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
