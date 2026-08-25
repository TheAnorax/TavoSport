import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ESTADO_PARTIDO } from '@liga/shared';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fmtFecha, fmtHora, paraInputDateTime } from '../lib/fechas';
import Modal from '../componentes/Modal';
import Escudo from '../componentes/Escudo';
import { IconoEditar, IconoBorrar, IconoMas, IconoSilbato } from '../componentes/Iconos';
import type { Equipo, Jornada, Partido } from '../lib/tipos';

const claseEstado: Record<string, string> = {
  PROGRAMADO: 'insignia-gris',
  EN_CURSO: 'insignia-ambar',
  FINALIZADO: 'insignia-verde',
  SUSPENDIDO: 'insignia-ambar',
  CANCELADO: 'insignia-roja',
};

export default function JornadaDetalle() {
  const { id = '' } = useParams();
  const { usuario, esAdmin } = useSesion();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    localId: '',
    visitanteId: '',
    cancha: '',
    fechaHora: '',
    estado: 'PROGRAMADO',
  });
  const [error, setError] = useState('');

  const [marcador, setMarcador] = useState<Partido | null>(null);
  const [goles, setGoles] = useState({ local: 0, visitante: 0 });
  const [errorMarcador, setErrorMarcador] = useState('');

  const cargar = () => api.get<Jornada>(`/jornadas/${id}`).then(setJornada);
  useEffect(() => {
    cargar();
  }, [id]);

  useEffect(() => {
    if (jornada?.temporadaId) {
      api.get<Equipo[]>(`/equipos?temporadaId=${jornada.temporadaId}`).then(setEquipos);
    }
  }, [jornada?.temporadaId]);

  // Un encargado solo captura los partidos donde juega su equipo.
  const miEquipoId = equipos.find((e) => e.encargadoId === usuario?.id)?.id;

  const abrirNuevo = () => {
    setEditandoId(null);
    const base = jornada ? paraInputDateTime(jornada.fecha) : '';
    setForm({ localId: '', visitanteId: '', cancha: '', fechaHora: base, estado: 'PROGRAMADO' });
    setError('');
    setModal(true);
  };

  const abrirEditar = (p: Partido) => {
    setEditandoId(p.id);
    setForm({
      localId: p.localId,
      visitanteId: p.visitanteId,
      cancha: p.cancha ?? '',
      fechaHora: paraInputDateTime(p.fechaHora),
      estado: p.estado,
    });
    setError('');
    setModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cuerpo = {
      localId: form.localId,
      visitanteId: form.visitanteId,
      cancha: form.cancha || null,
      fechaHora: new Date(form.fechaHora).toISOString(),
      estado: form.estado,
    };
    try {
      if (editandoId) await api.patch(`/partidos/${editandoId}`, cuerpo);
      else await api.post('/partidos', { ...cuerpo, jornadaId: id });
      setModal(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const puedeCapturar = (p: Partido) =>
    esAdmin || p.local.id === miEquipoId || p.visitante.id === miEquipoId;

  const abrirMarcador = (p: Partido) => {
    setGoles({ local: p.golesLocal ?? 0, visitante: p.golesVisitante ?? 0 });
    setErrorMarcador('');
    setMarcador(p);
  };

  const guardarMarcador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcador) return;
    setErrorMarcador('');
    try {
      await api.put(`/partidos/${marcador.id}/resultado`, {
        golesLocal: Number(goles.local),
        golesVisitante: Number(goles.visitante),
        estado: 'FINALIZADO',
      });
      setMarcador(null);
      cargar();
    } catch (err) {
      setErrorMarcador(err instanceof Error ? err.message : 'Error');
    }
  };

  const borrarMarcador = async (p: Partido) => {
    if (!confirm('¿Borrar el marcador y regresar el partido a PROGRAMADO?')) return;
    try {
      await api.delete(`/partidos/${p.id}/resultado`);
      cargar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const eliminar = async (p: Partido) => {
    if (!confirm(`¿Eliminar ${p.local.nombre} vs ${p.visitante.nombre}?`)) return;
    try {
      await api.delete(`/partidos/${p.id}`);
      cargar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  if (!jornada) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-5">
      <Link to="/jornadas" className="text-sm text-cancha-700 hover:underline">
        ← Jornadas
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Jornada {jornada.numero}</h1>
          <p className="text-sm capitalize text-slate-500">
            {fmtFecha(jornada.fecha)} · {jornada.temporada?.nombre}
          </p>
        </div>
        {esAdmin && (
          <button className="btn-primario" onClick={abrirNuevo}>
            <IconoMas /> Programar partido
          </button>
        )}
      </div>

      <div className="space-y-2">
        {(jornada.partidos ?? []).map((p) => (
          <div key={p.id} className="tarjeta flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <span className="w-14 shrink-0 text-sm font-bold tabular text-slate-500">
              {fmtHora(p.fechaHora)}
            </span>

            <div className="flex min-w-[260px] flex-1 items-center gap-2">
              <span className="flex flex-1 items-center justify-end gap-2 text-right font-semibold">
                <span className="truncate">{p.local.nombre}</span>
                <Escudo nombre={p.local.nombre} url={p.local.escudoUrl} tam={26} />
              </span>
              <span
                className={`w-[68px] shrink-0 rounded-lg py-1 text-center text-base font-extrabold tabular ${
                  p.estado === 'FINALIZADO'
                    ? 'bg-cancha-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {p.estado === 'FINALIZADO' ? `${p.golesLocal}-${p.golesVisitante}` : 'vs'}
              </span>
              <span className="flex flex-1 items-center gap-2 font-semibold">
                <Escudo nombre={p.visitante.nombre} url={p.visitante.escudoUrl} tam={26} />
                <span className="truncate">{p.visitante.nombre}</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-slate-400">{p.cancha ?? '—'}</span>
              <span className={claseEstado[p.estado]}>{p.estado}</span>
              {puedeCapturar(p) && p.estado !== 'CANCELADO' && (
                <button
                  className={
                    p.estado === 'FINALIZADO' ? 'btn-secundario btn-sm' : 'btn-primario btn-sm'
                  }
                  onClick={() => abrirMarcador(p)}
                >
                  <IconoSilbato size={14} />
                  {p.estado === 'FINALIZADO' ? 'Corregir' : 'Capturar'}
                </button>
              )}
              {esAdmin && (
                <>
                  {p.estado === 'FINALIZADO' && (
                    <button
                      className="btn-icono"
                      title="Borrar marcador"
                      aria-label="Borrar marcador"
                      onClick={() => borrarMarcador(p)}
                    >
                      <IconoSilbato />
                    </button>
                  )}
                  <button
                    className="btn-icono"
                    title="Editar partido"
                    aria-label="Editar partido"
                    onClick={() => abrirEditar(p)}
                  >
                    <IconoEditar />
                  </button>
                  <button
                    className="btn-icono-peligro"
                    title="Eliminar partido"
                    aria-label="Eliminar partido"
                    onClick={() => eliminar(p)}
                  >
                    <IconoBorrar />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {(jornada.partidos ?? []).length === 0 && (
          <div className="tarjeta text-center text-slate-500">Sin partidos programados.</div>
        )}
      </div>

      <Modal
        titulo="Capturar resultado"
        abierto={marcador !== null}
        onCerrar={() => setMarcador(null)}
      >
        {marcador && (
          <form onSubmit={guardarMarcador} className="space-y-4">
            <div className="flex items-end justify-center gap-3">
              <div className="flex-1 text-center">
                <p className="mb-2 text-sm font-medium">{marcador.local.nombre}</p>
                <input
                  className="input text-center text-2xl font-bold"
                  type="number"
                  min={0}
                  max={99}
                  autoFocus
                  value={goles.local}
                  onChange={(e) => setGoles({ ...goles, local: Number(e.target.value) })}
                />
              </div>
              <span className="pb-3 text-xl text-slate-400">–</span>
              <div className="flex-1 text-center">
                <p className="mb-2 text-sm font-medium">{marcador.visitante.nombre}</p>
                <input
                  className="input text-center text-2xl font-bold"
                  type="number"
                  min={0}
                  max={99}
                  value={goles.visitante}
                  onChange={(e) => setGoles({ ...goles, visitante: Number(e.target.value) })}
                />
              </div>
            </div>
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Al guardar, el partido queda <strong>FINALIZADO</strong> y la tabla de posiciones se
              recalcula sola. Se registra quién capturó y cuándo.
            </p>
            {errorMarcador && <p className="aviso-error">{errorMarcador}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secundario" onClick={() => setMarcador(null)}>
                Cancelar
              </button>
              <button className="btn-primario">Guardar resultado</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        titulo={editandoId ? 'Editar partido' : 'Programar partido'}
        abierto={modal}
        onCerrar={() => setModal(false)}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="etiqueta">Local</label>
            <select
              className="input"
              value={form.localId}
              onChange={(e) => setForm({ ...form, localId: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Visitante</label>
            <select
              className="input"
              value={form.visitanteId}
              onChange={(e) => setForm({ ...form, visitanteId: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {equipos
                .filter((eq) => eq.id !== form.localId)
                .map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta">Fecha y hora</label>
              <input
                className="input"
                type="datetime-local"
                value={form.fechaHora}
                onChange={(e) => setForm({ ...form, fechaHora: e.target.value })}
              />
            </div>
            <div>
              <label className="etiqueta">Cancha</label>
              <input
                className="input"
                value={form.cancha}
                onChange={(e) => setForm({ ...form, cancha: e.target.value })}
                placeholder="Cancha 1"
              />
            </div>
          </div>
          {editandoId && (
            <div>
              <label className="etiqueta">Estado</label>
              <select
                className="input"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                {ESTADO_PARTIDO.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="aviso-error">{error}</p>}
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
