import { useEffect, useState } from 'react';
import { leerConfigLiga, type ConfigLiga } from '@liga/shared';
import { api } from '../lib/api';
import type { Liga } from '../lib/tipos';

interface LigaConConfig extends Liga {
  config: unknown;
}

export default function Configuracion() {
  const [liga, setLiga] = useState<LigaConConfig | null>(null);
  const [cfg, setCfg] = useState<ConfigLiga | null>(null);
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'guardado'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<LigaConConfig>('/liga').then((l) => {
      setLiga(l);
      setNombre(l.nombre);
      setCfg(leerConfigLiga(l.config));
    });
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg) return;
    setError('');
    setEstado('guardando');
    try {
      await api.patch('/liga', { nombre, config: cfg });
      setEstado('guardado');
      setTimeout(() => setEstado('idle'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setEstado('idle');
    }
  };

  if (!liga || !cfg) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Configuración de la liga</h1>
        <p className="text-sm text-slate-500">
          Estas reglas se aplican sin tocar código. Cada liga cliente define las suyas.
        </p>
      </div>

      <form onSubmit={guardar} className="space-y-5">
        <div className="tarjeta space-y-4">
          <div>
            <label className="etiqueta">Nombre de la liga</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="etiqueta">Identificador público</label>
            <input className="input bg-slate-50" value={liga.slug} disabled />
            <p className="mt-1 text-xs text-slate-400">
              La vista abierta vive en /publico/{liga.slug}. No se puede cambiar: rompería los
              enlaces ya repartidos.
            </p>
          </div>
        </div>

        <div className="tarjeta space-y-4">
          <h2 className="font-semibold">Captura de resultados</h2>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={cfg.permitirCapturaEncargado}
              onChange={(e) => setCfg({ ...cfg, permitirCapturaEncargado: e.target.checked })}
            />
            <span>
              <strong>Los encargados pueden capturar</strong>
              <span className="block text-xs text-slate-500">
                Solo de los partidos donde juega su equipo. Si lo apagas, únicamente el
                administrador captura.
              </span>
            </span>
          </label>

          <div>
            <label className="etiqueta">Horas para corregir un resultado</label>
            <input
              className="input"
              type="number"
              min={0}
              max={720}
              value={cfg.horasParaCorregir}
              onChange={(e) => setCfg({ ...cfg, horasParaCorregir: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-slate-500">
              Se cuenta desde la hora del partido, no desde la captura — así el plazo no se reinicia
              cada vez que alguien edita. <strong>0 = solo el administrador corrige.</strong> El
              administrador nunca tiene límite.
            </p>
          </div>
        </div>

        <div className="tarjeta">
          <label className="etiqueta">Contacto para la vista pública</label>
          <input
            className="input"
            value={cfg.contacto ?? ''}
            onChange={(e) => setCfg({ ...cfg, contacto: e.target.value || null })}
            placeholder="WhatsApp o correo del organizador"
          />
        </div>

        {error && <p className="aviso-error">{error}</p>}

        <div className="flex items-center gap-3">
          <button className="btn-primario" disabled={estado === 'guardando'}>
            {estado === 'guardando' ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {estado === 'guardado' && <span className="text-sm text-cancha-700">Guardado ✓</span>}
        </div>
      </form>
    </div>
  );
}
