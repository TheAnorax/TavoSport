import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { POSICIONES } from '@liga/shared';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import Modal from '../componentes/Modal';
import type { Equipo, Jugador } from '../lib/tipos';

const vacio = { nombre: '', numero: 1, posicion: '' as string };

export default function EquipoDetalle() {
  const { id = '' } = useParams();
  const { usuario, esAdmin } = useSesion();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');

  const cargar = () => api.get<Equipo>(`/equipos/${id}`).then(setEquipo);
  useEffect(() => {
    cargar();
  }, [id]);

  const puedeEditar = esAdmin || equipo?.encargadoId === usuario?.id;

  const abrirNuevo = () => {
    const usados = new Set(equipo?.jugadores?.map((j) => j.numero));
    let libre = 1;
    while (usados.has(libre)) libre++;
    setEditandoId(null);
    setForm({ ...vacio, numero: libre });
    setError('');
    setModal(true);
  };

  const abrirEditar = (j: Jugador) => {
    setEditandoId(j.id);
    setForm({ nombre: j.nombre, numero: j.numero, posicion: j.posicion ?? '' });
    setError('');
    setModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cuerpo = {
      nombre: form.nombre,
      numero: Number(form.numero),
      posicion: form.posicion || null,
    };
    try {
      if (editandoId) await api.patch(`/jugadores/${editandoId}`, cuerpo);
      else await api.post('/jugadores', { ...cuerpo, equipoId: id });
      setModal(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const eliminar = async (j: Jugador) => {
    if (!confirm(`¿Dar de baja a ${j.nombre}?`)) return;
    await api.delete(`/jugadores/${j.id}`);
    cargar();
  };

  if (!equipo) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-5">
      <Link to="/equipos" className="text-sm text-cancha-700 hover:underline">
        ← Equipos
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{equipo.nombre}</h1>
          <p className="text-sm text-slate-500">
            {equipo.temporada?.nombre} · Encargado: {equipo.encargado?.nombre ?? 'sin asignar'}
          </p>
        </div>
        {puedeEditar && (
          <button className="btn-primario" onClick={abrirNuevo}>
            + Agregar jugador
          </button>
        )}
      </div>

      <div className="tarjeta overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3">Posición</th>
              <th className="px-4 py-3">Estatus</th>
              {puedeEditar && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(equipo.jugadores ?? []).map((j) => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-cancha-700">{j.numero}</td>
                <td className="px-4 py-3 font-medium">{j.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{j.posicion ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{j.estatus}</td>
                {puedeEditar && (
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-cancha-700 hover:underline"
                      onClick={() => abrirEditar(j)}
                    >
                      Editar
                    </button>
                    <button
                      className="ml-3 text-sm text-red-600 hover:underline"
                      onClick={() => eliminar(j)}
                    >
                      Baja
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {(equipo.jugadores ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Sin jugadores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        titulo={editandoId ? 'Editar jugador' : 'Nuevo jugador'}
        abierto={modal}
        onCerrar={() => setModal(false)}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre completo</label>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta">Dorsal</label>
              <input
                className="input"
                type="number"
                min={0}
                max={99}
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="etiqueta">Posición</label>
              <select
                className="input"
                value={form.posicion}
                onChange={(e) => setForm({ ...form, posicion: e.target.value })}
              >
                <option value="">—</option>
                {POSICIONES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn-primario">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
