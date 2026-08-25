import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';
import { IconoBalon } from '../componentes/Iconos';

export default function Login() {
  const { entrar, usuario, cargando } = useSesion();
  const navegar = useNavigate();
  const [form, setForm] = useState({
    email: 'admin@liga.mx',
    password: 'Password123',
    ligaSlug: 'demo',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (cargando) return null;
  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await entrar(form.email, form.password, form.ligaSlug);
      navegar('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Fondo de estadio: degradado profundo con dos luces de reflector. */}
      <div className="absolute inset-0 -z-10 bg-pizarra-950" />
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 20% 0%, rgb(3 152 85 / .45), transparent 70%),' +
            'radial-gradient(50% 45% at 85% 100%, rgb(163 230 53 / .22), transparent 70%)',
        }}
      />
      {/* Línea de medio campo, apenas insinuada. */}
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2
                      rounded-full border border-white/[0.06]"
      />

      <form
        onSubmit={enviar}
        className="vidrio w-full max-w-sm animate-entrada rounded-3xl bg-white/90 p-7"
      >
        <div className="mb-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cancha-600 text-white shadow-lg">
            <IconoBalon size={28} />
          </span>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight">Plataforma Liga</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="etiqueta">Liga</label>
            <input
              className="input"
              value={form.ligaSlug}
              onChange={(e) => setForm({ ...form, ligaSlug: e.target.value })}
              placeholder="demo"
            />
          </div>
          <div>
            <label className="etiqueta">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta">Contraseña</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="aviso-error mt-4">{error}</p>}

        <button className="btn-primario mt-6 w-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-5 text-center text-xs text-slate-400">
          Demo · admin@liga.mx / Password123
        </p>
      </form>
    </div>
  );
}
