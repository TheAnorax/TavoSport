import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Division, Temporada } from '../lib/tipos';

export default function Temporadas() {
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);

  useEffect(() => {
    api.get<Division[]>('/divisiones').then(setDivisiones);
    api.get<Temporada[]>('/temporadas').then(setTemporadas);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estructura de la liga</h1>

      {divisiones.map((d) => (
        <div key={d.id} className="tarjeta">
          <h2 className="font-semibold">{d.nombre}</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {temporadas
              .filter((t) => t.divisionId === d.id)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {t.nombre}{' '}
                    {t.activa && (
                      <span className="ml-1 rounded-full bg-cancha-50 px-2 py-0.5 text-xs text-cancha-700">
                        activa
                      </span>
                    )}
                  </span>
                  <span className="text-slate-500">
                    {t._count?.equipos ?? 0} equipos · {t._count?.jornadas ?? 0} jornadas
                  </span>
                </li>
              ))}
            {temporadas.filter((t) => t.divisionId === d.id).length === 0 && (
              <li className="py-2 text-sm text-slate-400">Sin temporadas</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
