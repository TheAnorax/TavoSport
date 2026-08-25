import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { fmtFecha } from '../lib/fechas';
import Modal from '../componentes/Modal';
import { IconoBorrar, IconoMas, IconoRayo, IconoCalendario } from '../componentes/Iconos';
import type { Jornada, Temporada } from '../lib/tipos';

export default function Jornadas() {
  const { esAdmin } = useSesion();
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [temporadaId, setTemporadaId] = useState('');
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalGenerar, setModalGenerar] = useState(false);
  const [modalManual, setModalManual] = useState(false);
  const [generando, setGenerando] = useState(false);

  const [cfg, setCfg] = useState({
    fechaPrimeraJornada: '',
    diasEntreJornadas: 7,
    horaInicio: 10,
    horasEntrePartidos: 2,
    canchas: 'Cancha 1, Cancha 2, Cancha 3',
    idaYVuelta: false,
    reemplazar: false,
  });
  const [manual, setManual] = useState({ numero: 1, fecha: '' });

  useEffect(() => {
    api.get<Temporada[]>('/temporadas').then((t) => {
      setTemporadas(t);
      if (t[0]) {
        setTemporadaId(t[0].id);
        setCfg((c) => ({ ...c, fechaPrimeraJornada: t[0]!.fechaInicio.slice(0, 10) }));
      }
    });
  }, []);

  const cargar = (id: string) => {
    setCargando(true);
    api
      .get<Jornada[]>(`/jornadas?temporadaId=${id}`)
      .then(setJornadas)
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (temporadaId) cargar(temporadaId);
  }, [temporadaId]);

  const generar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGenerando(true);
    try {
      const r = await api.post<{ jornadas: number; partidos: number }>('/calendario/generar', {
        temporadaId,
        fechaPrimeraJornada: cfg.fechaPrimeraJornada,
        diasEntreJornadas: Number(cfg.diasEntreJornadas),
        horaInicio: Number(cfg.horaInicio),
        horasEntrePartidos: Number(cfg.horasEntrePartidos),
        canchas: cfg.canchas
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        idaYVuelta: cfg.idaYVuelta,
        reemplazar: cfg.reemplazar,
      });
      setModalGenerar(false);
      alert(`Calendario generado: ${r.jornadas} jornadas, ${r.partidos} partidos.`);
      cargar(temporadaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setGenerando(false);
    }
  };

  const crearManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/jornadas', {
        temporadaId,
        numero: Number(manual.numero),
        fecha: manual.fecha,
      });
      setModalManual(false);
      cargar(temporadaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const eliminar = async (j: Jornada) => {
    if (!confirm(`¿Eliminar la jornada ${j.numero} y sus partidos?`)) return;
    try {
      await api.delete(`/jornadas/${j.id}`);
      cargar(temporadaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Jornadas</h1>
          <p className="text-sm text-slate-500">{jornadas.length} programadas</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
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
            <>
              <button
                className="btn-secundario"
                onClick={() => {
                  setError('');
                  setModalManual(true);
                }}
              >
                <IconoMas /> Jornada
              </button>
              <button
                className="btn-primario"
                onClick={() => {
                  setError('');
                  setModalGenerar(true);
                }}
              >
                <IconoRayo /> Generar calendario
              </button>
            </>
          )}
        </div>
      </div>

      {cargando ? (
        <p className="text-slate-500">Cargando…</p>
      ) : jornadas.length === 0 ? (
        <div className="tarjeta text-center">
          <p className="text-slate-500">Esta temporada no tiene jornadas.</p>
          {esAdmin && (
            <p className="mt-2 text-sm text-slate-400">
              Usa <strong>Generar calendario</strong> para crear todas de una vez con round-robin.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jornadas.map((j) => (
            <div key={j.id} className="tarjeta flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">Jornada {j.numero}</h3>
                  <span className="insignia-gris">{j._count?.partidos ?? 0} partidos</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-slate-500">
                  <IconoCalendario size={14} /> {fmtFecha(j.fecha)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/jornadas/${j.id}`} className="btn-secundario flex-1">
                  Ver partidos
                </Link>
                {esAdmin && (
                  <button
                    className="btn-icono-peligro"
                    title="Eliminar jornada"
                    aria-label="Eliminar jornada"
                    onClick={() => eliminar(j)}
                  >
                    <IconoBorrar />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        titulo="Generar calendario automático"
        abierto={modalGenerar}
        onCerrar={() => setModalGenerar(false)}
      >
        <form onSubmit={generar} className="space-y-4">
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Round-robin: cada equipo activo juega contra todos los demás una vez. Con N equipos
            salen N−1 jornadas.
          </p>
          <div>
            <label className="etiqueta">Fecha de la primera jornada</label>
            <input
              className="input"
              type="date"
              value={cfg.fechaPrimeraJornada}
              onChange={(e) => setCfg({ ...cfg, fechaPrimeraJornada: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="etiqueta">Días entre</label>
              <input
                className="input"
                type="number"
                min={1}
                max={30}
                value={cfg.diasEntreJornadas}
                onChange={(e) => setCfg({ ...cfg, diasEntreJornadas: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="etiqueta">Hora inicio</label>
              <input
                className="input"
                type="number"
                min={0}
                max={23}
                value={cfg.horaInicio}
                onChange={(e) => setCfg({ ...cfg, horaInicio: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="etiqueta">Hrs/partido</label>
              <input
                className="input"
                type="number"
                min={1}
                max={6}
                value={cfg.horasEntrePartidos}
                onChange={(e) => setCfg({ ...cfg, horasEntrePartidos: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="etiqueta">Canchas (separadas por coma)</label>
            <input
              className="input"
              value={cfg.canchas}
              onChange={(e) => setCfg({ ...cfg, canchas: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cfg.idaYVuelta}
                onChange={(e) => setCfg({ ...cfg, idaYVuelta: e.target.checked })}
              />
              Ida y vuelta (duplica las jornadas invirtiendo localía)
            </label>
            <label className="flex items-center gap-2 text-sm text-red-700">
              <input
                type="checkbox"
                checked={cfg.reemplazar}
                onChange={(e) => setCfg({ ...cfg, reemplazar: e.target.checked })}
              />
              Reemplazar el calendario existente
            </label>
          </div>
          {error && <p className="aviso-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModalGenerar(false)}>
              Cancelar
            </button>
            <button className="btn-primario" disabled={generando}>
              {generando ? 'Generando…' : 'Generar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal titulo="Nueva jornada" abierto={modalManual} onCerrar={() => setModalManual(false)}>
        <form onSubmit={crearManual} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta">Número</label>
              <input
                className="input"
                type="number"
                min={1}
                value={manual.numero}
                onChange={(e) => setManual({ ...manual, numero: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="etiqueta">Fecha</label>
              <input
                className="input"
                type="date"
                value={manual.fecha}
                onChange={(e) => setManual({ ...manual, fecha: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="aviso-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => setModalManual(false)}>
              Cancelar
            </button>
            <button className="btn-primario">Crear</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
