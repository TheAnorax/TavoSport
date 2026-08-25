import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import TablaPosiciones from '../componentes/TablaPosiciones';
import type { FilaTabla, Temporada } from '../lib/tipos';

export default function Posiciones() {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [filas, setFilas] = useState<FilaTabla[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<Temporada[]>('/temporadas').then((t) => {
      setTemporadas(t);
      if (t[0]) setTemporadaId(t[0].id);
      else setCargando(false);
    });
  }, []);

  useEffect(() => {
    if (!temporadaId) return;
    setCargando(true);
    api
      .get<FilaTabla[]>(`/temporadas/${temporadaId}/posiciones`)
      .then(setFilas)
      .finally(() => setCargando(false));
  }, [temporadaId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tabla de posiciones</h1>
          <p className="text-sm text-slate-500">Se recalcula sola con cada resultado capturado.</p>
        </div>
        <div>
          <label className="etiqueta">Temporada</label>
          <select className="input" value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>{t.division?.nombre} — {t.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? <p className="text-slate-500">Cargando…</p> : <TablaPosiciones filas={filas} />}
    </div>
  );
}
