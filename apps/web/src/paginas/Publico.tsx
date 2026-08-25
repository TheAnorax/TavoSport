import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtFecha, fmtHora } from '../lib/fechas';
import TablaPosiciones from '../componentes/TablaPosiciones';
import type { FilaTabla, Liga, Partido } from '../lib/tipos';

interface TemporadaPublica {
  id: string;
  nombre: string;
  division: { id: string; nombre: string; orden: number };
  _count: { equipos: number; jornadas: number };
}

interface JornadaPublica {
  id: string;
  numero: number;
  fecha: string;
  partidos: Partido[];
}

/** Vista abierta: cualquiera con el enlace la ve, sin cuenta ni contraseña. */
export default function Publico() {
  const { slug = '' } = useParams();
  const [liga, setLiga] = useState<Liga | null>(null);
  const [temporadas, setTemporadas] = useState<TemporadaPublica[]>([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [pestana, setPestana] = useState<'tabla' | 'resultados'>('tabla');
  const [filas, setFilas] = useState<FilaTabla[]>([]);
  const [jornadas, setJornadas] = useState<JornadaPublica[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ liga: Liga; temporadas: TemporadaPublica[] }>(`/publico/${slug}`)
      .then((r) => {
        setLiga(r.liga);
        setTemporadas(r.temporadas);
        if (r.temporadas[0]) setTemporadaId(r.temporadas[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la liga'));
  }, [slug]);

  useEffect(() => {
    if (!temporadaId) return;
    api.get<FilaTabla[]>(`/publico/${slug}/temporadas/${temporadaId}/posiciones`).then(setFilas);
    api.get<JornadaPublica[]>(`/publico/${slug}/temporadas/${temporadaId}/jornadas`).then(setJornadas);
  }, [slug, temporadaId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="tarjeta max-w-sm text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-semibold">{error}</p>
          <p className="mt-1 text-sm text-slate-500">Revisa el enlace con el organizador de tu liga.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-cancha-700 text-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-3xl">⚽</p>
          <h1 className="mt-1 text-2xl font-bold">{liga?.nombre ?? 'Cargando…'}</h1>
          {temporadas.length > 0 && (
            <select
              className="mt-3 rounded-lg border-0 bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur
                         focus:ring-2 focus:ring-white/50 [&>option]:text-slate-900"
              value={temporadaId}
              onChange={(e) => setTemporadaId(e.target.value)}
            >
              {temporadas.map((t) => (
                <option key={t.id} value={t.id}>{t.division.nombre} — {t.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['tabla', 'resultados'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPestana(p)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                pestana === p ? 'bg-white text-cancha-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {p === 'tabla' ? 'Posiciones' : 'Resultados'}
            </button>
          ))}
        </div>

        {pestana === 'tabla' ? (
          <TablaPosiciones filas={filas} />
        ) : (
          <div className="space-y-4">
            {jornadas.map((j) => (
              <div key={j.id} className="tarjeta">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-semibold">Jornada {j.numero}</h2>
                  <span className="text-xs capitalize text-slate-500">{fmtFecha(j.fecha)}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {j.partidos.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 py-2.5 text-sm">
                      <span className="flex-1 text-right font-medium">{p.local.nombre}</span>
                      <span
                        className={`w-16 shrink-0 rounded-md py-1 text-center font-bold tabular-nums ${
                          p.estado === 'FINALIZADO' ? 'bg-cancha-50 text-cancha-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.estado === 'FINALIZADO'
                          ? `${p.golesLocal}-${p.golesVisitante}`
                          : fmtHora(p.fechaHora)}
                      </span>
                      <span className="flex-1 font-medium">{p.visitante.nombre}</span>
                    </div>
                  ))}
                  {j.partidos.length === 0 && (
                    <p className="py-3 text-center text-sm text-slate-400">Sin partidos</p>
                  )}
                </div>
              </div>
            ))}
            {jornadas.length === 0 && (
              <div className="tarjeta text-center text-slate-500">Todavía no hay calendario publicado.</div>
            )}
          </div>
        )}
      </div>

      <footer className="py-8 text-center text-xs text-slate-400">
        Actualizado en tiempo real conforme se capturan los resultados.
      </footer>
    </div>
  );
}
