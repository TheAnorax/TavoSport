import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ESTATUS_EQUIPO } from '@liga/shared';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import Modal from '../componentes/Modal';
import Escudo from '../componentes/Escudo';
import type { Equipo, Temporada, Usuario } from '../lib/tipos';

const vacio = { nombre: '', estatus: 'ACTIVO' as string, encargadoId: '' };

export default function Equipos() {
  const { esAdmin } = useSesion();
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [encargados, setEncargados] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Temporada[]>('/temporadas').then((t) => {
      setTemporadas(t);
      if (t[0]) setTemporadaId(t[0].id);
    });
    if (esAdmin) {
      api
        .get<Usuario[]>('/auth/usuarios')
        .then((u) => setEncargados(u.filter((x) => x.rol === 'ENCARGADO')))
        .catch(() => {});
    }
  }, [esAdmin]);

  const cargar = (id: string) => {
    setCargando(true);
    api.get<Equipo[]>(`/equipos?temporadaId=${id}`).then(setEquipos).finally(() => setCargando(false));
  };

  useEffect(() => {
    if (temporadaId) cargar(temporadaId);
  }, [temporadaId]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(vacio);
    setError('');
    setModal(true);
  };

  const abrirEditar = (eq: Equipo) => {
    setEditandoId(eq.id);
    setForm({ nombre: eq.nombre, estatus: eq.estatus, encargadoId: eq.encargadoId ?? '' });
    setError('');
    setModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cuerpo = {
      nombre: form.nombre,
      estatus: form.estatus,
      encargadoId: form.encargadoId || null,
    };
    try {
      if (editandoId) await api.patch(`/equipos/${editandoId}`, cuerpo);
      else await api.post('/equipos', { ...cuerpo, temporadaId });
      setModal(false);
      cargar(temporadaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const eliminar = async (eq: Equipo) => {
    if (!confirm(`¿Eliminar el equipo "${eq.nombre}" y toda su plantilla?`)) return;
    try {
      await api.delete(`/equipos/${eq.id}`);
      cargar(temporadaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
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
            <select className="input" value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
              {temporadas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.division?.nombre} — {t.nombre}
                </option>
              ))}
            </select>
          </div>
          {esAdmin && <button className="btn-primario" onClick={abrirNuevo}>+ Nuevo equipo</button>}
        </div>
      </div>

      {cargando ? (
        <p className="text-slate-500">Cargando…</p>
      ) : temporadas.length === 0 ? (
        <div className="tarjeta space-y-3 text-center">
          <p className="text-3xl">📋</p>
          <p className="font-semibold">Primero necesitas una temporada</p>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            Los equipos viven dentro de una temporada. Créala en <strong>Temporadas</strong> y regresa aquí.
          </p>
          <Link to="/temporadas" className="btn-primario">Ir a Temporadas</Link>
        </div>
      ) : equipos.length === 0 ? (
        <div className="tarjeta text-center text-slate-500">No hay equipos en esta temporada todavía.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map((eq) => (
            <div key={eq.id} className="tarjeta flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Escudo nombre={eq.nombre} url={eq.escudoUrl} tam={28} />
                    <h3 className="font-semibold">{eq.nombre}</h3>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      eq.estatus === 'ACTIVO' ? 'bg-cancha-50 text-cancha-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {eq.estatus}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{eq._count?.jugadores ?? 0} jugadores</p>
                <p className="text-xs text-slate-400">
                  Encargado: {eq.encargado?.nombre ?? 'sin asignar'}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/equipos/${eq.id}`} className="btn-secundario flex-1">Plantilla</Link>
                {esAdmin && (
                  <>
                    <button className="btn-secundario" onClick={() => abrirEditar(eq)}>Editar</button>
                    <button className="btn-peligro" onClick={() => eliminar(eq)}>✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        titulo={editandoId ? 'Editar equipo' : 'Nuevo equipo'}
        abierto={modal}
        onCerrar={() => setModal(false)}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre del equipo</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="etiqueta">Encargado</label>
            <select className="input" value={form.encargadoId} onChange={(e) => setForm({ ...form, encargadoId: e.target.value })}>
              <option value="">Sin asignar</option>
              {encargados.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} — {u.email}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              El encargado puede editar este equipo y su plantilla, nada más.
            </p>
          </div>
          {editandoId && (
            <div>
              <label className="etiqueta">Estatus</label>
              <select className="input" value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value })}>
                {ESTATUS_EQUIPO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primario">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
