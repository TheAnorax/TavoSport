import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fmtFecha, fmtFechaHora, fmtHora } from '../lib/fechas';
import type { FilaTabla, Liga, Partido } from '../lib/tipos';

interface Captura {
  id: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  capturadoEn: string | null;
  local: { id: string; nombre: string };
  visitante: { id: string; nombre: string };
  jornada: { numero: number };
  capturadoPor: { id: string; nombre: string; rol: string } | null;
}

interface Dashboard {
  temporada: { id: string; nombre: string } | null;
  proximaJornada: { id: string; numero: number; fecha: string; partidos: Partido[] } | null;
  top5: FilaTabla[];
  capturas: Captura[];
  pendientes: number;
}

export default function Inicio() {
  const { usuario } = useSesion();
  const [liga, setLiga] = useState<Liga | null>(null);
  const [d, setD] = useState<Dashboard | null>(null);

  useEffect(() => {
    api.get<Liga>('/liga').then(setLiga).catch(() => {});
    api.get<Dashboard>('/dashboard').then(setD).catch(() => {});
  }, []);

  if (!d) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{liga?.nombre ?? '—'}</h1>
        <p className="text-sm text-slate-500">
          Hola, {usuario?.nombre}
          {d.temporada && <> · {d.temporada.nombre}</>}
        </p>
      </div>

      {d.pendientes > 0 && (
        <div className="tarjeta flex flex-wrap items-center justify-between gap-3 bg-amber-50 ring-amber-200">
          <div>
            <p className="font-semibold text-amber-900">
              {d.pendientes} partido{d.pendientes > 1 ? 's' : ''} sin resultado
            </p>
            <p className="text-sm text-amber-800">Ya se jugaron y siguen sin marcador capturado.</p>
          </div>
          <Link to="/jornadas" className="btn-primario">Ir a capturar</Link>
        </div>
      )}

      {liga && (
        <div className="tarjeta flex flex-wrap items-center justify-between gap-3 bg-cancha-50 ring-cancha-100">
          <div>
            <p className="font-semibold text-cancha-900">Vista pública</p>
            <p className="text-sm text-cancha-800">
              Enlace abierto: posiciones y resultados sin cuenta.
            </p>
          </div>
          <a href={`/publico/${liga.slug}`} target="_blank" rel="noreferrer" className="btn-primario">
            Abrir /publico/{liga.slug}
          </a>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Próxima jornada */}
        <div className="tarjeta">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">
              {d.proximaJornada ? `Jornada ${d.proximaJornada.numero}` : 'Próxima jornada'}
            </h2>
            {d.proximaJornada && (
              <span className="text-xs capitalize text-slate-500">{fmtFecha(d.proximaJornada.fecha)}</span>
            )}
          </div>
          {d.proximaJornada ? (
            <>
              <div className="divide-y divide-slate-100">
                {d.proximaJornada.partidos.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="w-14 shrink-0 text-xs text-slate-500">{fmtHora(p.fechaHora)}</span>
                    <span className="flex-1 text-right">{p.local.nombre}</span>
                    <span className="shrink-0 text-xs text-slate-400">vs</span>
                    <span className="flex-1">{p.visitante.nombre}</span>
                    <span className="w-20 shrink-0 text-right text-xs text-slate-400">{p.cancha ?? '—'}</span>
                  </div>
                ))}
              </div>
              <Link
                to={`/jornadas/${d.proximaJornada.id}`}
                className="mt-3 inline-block text-sm text-cancha-700 hover:underline"
              >
                Ver jornada completa →
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-500">No hay partidos pendientes por jugar.</p>
          )}
        </div>

        {/* Top 5 */}
        <div className="tarjeta">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Top 5</h2>
            <Link to="/posiciones" className="text-sm text-cancha-700 hover:underline">Tabla completa →</Link>
          </div>
          {d.top5.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay datos.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {d.top5.map((f) => (
                  <tr key={f.equipoId}>
                    <td className="w-8 py-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cancha-600 text-xs font-bold text-white">
                        {f.posicion}
                      </span>
                    </td>
                    <td className="py-2 font-medium">{f.equipoNombre}</td>
                    <td className="w-12 py-2 text-center text-xs text-slate-500">{f.pj} PJ</td>
                    <td className="w-12 py-2 text-center text-xs tabular-nums text-slate-500">
                      {f.dif > 0 ? `+${f.dif}` : f.dif}
                    </td>
                    <td className="w-10 py-2 text-right font-bold tabular-nums text-cancha-700">{f.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bitácora */}
      <div className="tarjeta">
        <h2 className="mb-1 font-semibold">Capturas recientes</h2>
        <p className="mb-3 text-xs text-slate-500">
          Quién capturó cada marcador y cuándo. Sirve para resolver reclamos.
        </p>
        {d.capturas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no se captura ningún resultado.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {d.capturas.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="w-10 shrink-0 text-xs text-slate-400">J{c.jornada.numero}</span>
                <span className="flex-1 min-w-[180px]">
                  {c.local.nombre}{' '}
                  <strong className="tabular-nums">{c.golesLocal}–{c.golesVisitante}</strong>{' '}
                  {c.visitante.nombre}
                </span>
                <span className="text-xs text-slate-500">
                  {c.capturadoPor?.nombre ?? 'desconocido'}
                  {c.capturadoPor && (
                    <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                      {c.capturadoPor.rol}
                    </span>
                  )}
                </span>
                <span className="text-xs capitalize text-slate-400">
                  {c.capturadoEn ? fmtFechaHora(c.capturadoEn) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
