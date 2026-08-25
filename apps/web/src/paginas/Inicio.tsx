import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import type { Division, Liga, Temporada } from '../lib/tipos';

export default function Inicio() {
  const { usuario } = useSesion();
  const [liga, setLiga] = useState<Liga | null>(null);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);

  useEffect(() => {
    api.get<Liga>('/liga').then(setLiga).catch(() => {});
    api.get<Division[]>('/divisiones').then(setDivisiones).catch(() => {});
    api.get<Temporada[]>('/temporadas').then(setTemporadas).catch(() => {});
  }, []);

  const equipos = temporadas.reduce((s, t) => s + (t._count?.equipos ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{liga?.nombre ?? 'Cargando…'}</h1>
        <p className="text-sm text-slate-500">Hola, {usuario?.nombre}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { titulo: 'Divisiones', valor: divisiones.length },
          { titulo: 'Temporadas', valor: temporadas.length },
          { titulo: 'Equipos', valor: equipos },
        ].map((k) => (
          <div key={k.titulo} className="tarjeta">
            <p className="text-sm text-slate-500">{k.titulo}</p>
            <p className="mt-1 text-3xl font-bold text-cancha-700">{k.valor}</p>
          </div>
        ))}
      </div>

      {liga && (
        <div className="tarjeta flex flex-wrap items-center justify-between gap-3 bg-cancha-50 ring-cancha-100">
          <div>
            <p className="font-semibold text-cancha-900">Vista pública</p>
            <p className="text-sm text-cancha-800">
              Enlace abierto para jugadores y aficionados: posiciones y resultados sin cuenta.
            </p>
          </div>
          <a href={`/publico/${liga.slug}`} target="_blank" rel="noreferrer" className="btn-primario">
            Abrir /publico/{liga.slug}
          </a>
        </div>
      )}

      <div className="tarjeta">
        <h2 className="mb-3 font-semibold">Temporadas</h2>
        {temporadas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay temporadas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {temporadas.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{t.nombre}</p>
                  <p className="text-xs text-slate-500">{t.division?.nombre}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{t._count?.equipos ?? 0} equipos</p>
                  <p>{t._count?.jornadas ?? 0} jornadas</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
