import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../componentes/Modal';
import { IconoEditar, IconoBorrar, IconoMas, IconoBalon } from '../componentes/Iconos';
import type { Division, Temporada } from '../lib/tipos';

const hoy = () => new Date().toISOString().slice(0, 10);
const enMeses = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

export default function Temporadas() {
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalDiv, setModalDiv] = useState(false);
  const [divEditando, setDivEditando] = useState<Division | null>(null);
  const [formDiv, setFormDiv] = useState({ nombre: '', orden: 0 });

  const [modalTemp, setModalTemp] = useState(false);
  const [tempEditando, setTempEditando] = useState<Temporada | null>(null);
  const [formTemp, setFormTemp] = useState({
    divisionId: '',
    nombre: '',
    fechaInicio: hoy(),
    fechaFin: enMeses(4),
    activa: true,
  });

  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    const [d, t] = await Promise.all([
      api.get<Division[]>('/divisiones'),
      api.get<Temporada[]>('/temporadas'),
    ]);
    setDivisiones(d);
    setTemporadas(t);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  /* ---- divisiones ---- */
  const abrirDiv = (d?: Division) => {
    setDivEditando(d ?? null);
    setFormDiv({ nombre: d?.nombre ?? '', orden: d?.orden ?? divisiones.length + 1 });
    setError('');
    setModalDiv(true);
  };

  const guardarDiv = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const cuerpo = { nombre: formDiv.nombre, orden: Number(formDiv.orden) };
      if (divEditando) await api.patch(`/divisiones/${divEditando.id}`, cuerpo);
      else await api.post('/divisiones', cuerpo);
      setModalDiv(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const borrarDiv = async (d: Division) => {
    if (
      !confirm(`¿Eliminar la división "${d.nombre}"? Se borran sus temporadas, equipos y partidos.`)
    )
      return;
    try {
      await api.delete(`/divisiones/${d.id}`);
      cargar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  /* ---- temporadas ---- */
  const abrirTemp = (divisionId: string, t?: Temporada) => {
    setTempEditando(t ?? null);
    setFormTemp({
      divisionId,
      nombre: t?.nombre ?? '',
      fechaInicio: t?.fechaInicio.slice(0, 10) ?? hoy(),
      fechaFin: t?.fechaFin.slice(0, 10) ?? enMeses(4),
      activa: t?.activa ?? true,
    });
    setError('');
    setModalTemp(true);
  };

  const guardarTemp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (tempEditando) {
        await api.patch(`/temporadas/${tempEditando.id}`, {
          nombre: formTemp.nombre,
          fechaInicio: formTemp.fechaInicio,
          fechaFin: formTemp.fechaFin,
          activa: formTemp.activa,
        });
      } else {
        await api.post('/temporadas', formTemp);
      }
      setModalTemp(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const borrarTemp = async (t: Temporada) => {
    if (!confirm(`¿Eliminar la temporada "${t.nombre}"?`)) return;
    try {
      await api.delete(`/temporadas/${t.id}`);
      cargar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  if (cargando) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estructura de la liga</h1>
          <p className="text-sm text-slate-500">Divisiones y sus temporadas.</p>
        </div>
        <button className="btn-primario" onClick={() => abrirDiv()}>
          <IconoMas /> Nueva división
        </button>
      </div>

      {divisiones.length === 0 ? (
        <div className="tarjeta space-y-3 text-center">
          <p className="text-3xl">🏆</p>
          <p className="font-semibold">Empieza por crear una división</p>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            Una división agrupa temporadas (por ejemplo <em>Primera Varonil</em> o <em>Femenil</em>
            ). Dentro de cada temporada van los equipos, las jornadas y los partidos.
          </p>
          <button className="btn-primario" onClick={() => abrirDiv()}>
            <IconoMas /> Crear la primera división
          </button>
        </div>
      ) : (
        divisiones.map((d) => {
          const suyas = temporadas.filter((t) => t.divisionId === d.id);
          return (
            <div key={d.id} className="tarjeta">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cancha-50 text-cancha-700">
                    <IconoBalon size={17} />
                  </span>
                  {d.nombre}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    className="btn-icono"
                    title="Editar división"
                    aria-label="Editar división"
                    onClick={() => abrirDiv(d)}
                  >
                    <IconoEditar />
                  </button>
                  <button
                    className="btn-icono-peligro"
                    title="Eliminar división"
                    aria-label="Eliminar división"
                    onClick={() => borrarDiv(d)}
                  >
                    <IconoBorrar />
                  </button>
                  <button className="btn-secundario btn-sm" onClick={() => abrirTemp(d.id)}>
                    <IconoMas size={14} /> Temporada
                  </button>
                </div>
              </div>

              <ul className="mt-2 divide-y divide-slate-100">
                {suyas.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {t.nombre}
                      {t.activa ? (
                        <span className="insignia-verde">activa</span>
                      ) : (
                        <span className="insignia-gris">cerrada</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {t._count?.equipos ?? 0} equipos · {t._count?.jornadas ?? 0} jornadas
                      </span>
                      <button
                        className="btn-icono"
                        title="Editar temporada"
                        aria-label="Editar temporada"
                        onClick={() => abrirTemp(d.id, t)}
                      >
                        <IconoEditar />
                      </button>
                      <button
                        className="btn-icono-peligro"
                        title="Eliminar temporada"
                        aria-label="Eliminar temporada"
                        onClick={() => borrarTemp(t)}
                      >
                        <IconoBorrar />
                      </button>
                    </span>
                  </li>
                ))}
                {suyas.length === 0 && (
                  <li className="py-2 text-sm text-slate-400">
                    Sin temporadas. Crea una para poder registrar equipos.
                  </li>
                )}
              </ul>
            </div>
          );
        })
      )}

      <Modal
        titulo={divEditando ? 'Editar división' : 'Nueva división'}
        abierto={modalDiv}
        onCerrar={() => setModalDiv(false)}
      >
        <form onSubmit={guardarDiv} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre</label>
            <input
              className="input"
              value={formDiv.nombre}
              autoFocus
              onChange={(e) => setFormDiv({ ...formDiv, nombre: e.target.value })}
              placeholder="Primera Varonil"
            />
          </div>
          <div>
            <label className="etiqueta">Orden</label>
            <input
              className="input"
              type="number"
              min={0}
              value={formDiv.orden}
              onChange={(e) => setFormDiv({ ...formDiv, orden: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-slate-400">
              Define en qué orden se listan las divisiones.
            </p>
          </div>
          {error && <p className="aviso-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModalDiv(false)}>
              Cancelar
            </button>
            <button className="btn-primario">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo={tempEditando ? 'Editar temporada' : 'Nueva temporada'}
        abierto={modalTemp}
        onCerrar={() => setModalTemp(false)}
      >
        <form onSubmit={guardarTemp} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre</label>
            <input
              className="input"
              value={formTemp.nombre}
              autoFocus
              onChange={(e) => setFormTemp({ ...formTemp, nombre: e.target.value })}
              placeholder="Apertura 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta">Inicio</label>
              <input
                className="input"
                type="date"
                value={formTemp.fechaInicio}
                onChange={(e) => setFormTemp({ ...formTemp, fechaInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="etiqueta">Fin</label>
              <input
                className="input"
                type="date"
                value={formTemp.fechaFin}
                onChange={(e) => setFormTemp({ ...formTemp, fechaFin: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formTemp.activa}
              onChange={(e) => setFormTemp({ ...formTemp, activa: e.target.checked })}
            />
            Temporada activa (aparece en la vista pública)
          </label>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Se crea con puntuación 3-1-0 y desempate por diferencia de goles, goles a favor y
            enfrentamiento directo. Se puede ajustar después.
          </p>
          {error && <p className="aviso-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModalTemp(false)}>
              Cancelar
            </button>
            <button className="btn-primario">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
