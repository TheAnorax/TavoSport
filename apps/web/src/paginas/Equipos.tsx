import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import Modal from '../componentes/Modal';
import type { Equipo, Temporada } from '../lib/tipos';

export default function Equipos() {
  const { esAdmin } = useSesion();
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Temporada[]>('/temporadas').then((t) => {
      setTemporadas(t);
      if (t[0]) setTemporadaId(t[0].id);
    });
  }, []);

  const cargar = (id: string) => {
    setCargando(true);
    api
      .get<Equipo[]>(`/equipos?temporadaId=${id}`)
      .then(setEquipos)
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (temporadaId) cargar(temporadaId);
  }, [temporadaId]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/equipos', { temporadaId, nombre });
      setNombre('');
      setModal(false);
      cargar(temporadaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const eliminar = async (id: string, nom: string) => {
    if (!confirm(`¿Eliminar el equipo "${nom}" y toda su plantilla?`)) return;
    await api.delete(`/equipos/${id}`);
    cargar(temporadaId);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <p className="text-sm text-slate-500">{equipos.length} registrados</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="etiqueta">Temporada</label>
            <select
              className="input"
              value={temporadaId}
              onChange={(e) => setTemporadaId(e.target.value)}
            >
              {temporadas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.division?.nombre} — {t.nombre}
                </option>
              ))}
            </select>
          </div>
          {esAdmin && (
            <button className="btn-primario" onClick={() => setModal(true)}>
              + Nuevo equipo
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <p className="text-slate-500">Cargando…</p>
      ) : equipos.length === 0 ? (
        <div className="tarjeta text-center text-slate-500">
          No hay equipos en esta temporada todavía.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map((eq) => (
            <div key={eq.id} className="tarjeta flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{eq.nombre}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      eq.estatus === 'ACTIVO'
                        ? 'bg-cancha-50 text-cancha-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {eq.estatus}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {eq._count?.jugadores ?? 0} jugadores
                </p>
                <p className="text-xs text-slate-400">
                  Encargado: {eq.encargado?.nombre ?? 'sin asignar'}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/equipos/${eq.id}`} className="btn-secundario flex-1">
                  Plantilla
                </Link>
                {esAdmin && (
                  <button className="btn-peligro" onClick={() => eliminar(eq.id, eq.nombre)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal titulo="Nuevo equipo" abierto={modal} onCerrar={() => setModal(false)}>
        <form onSubmit={crear} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre del equipo</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primario">Crear</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
