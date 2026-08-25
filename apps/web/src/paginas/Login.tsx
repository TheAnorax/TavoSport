import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';

export default function Login() {
  const { entrar, usuario, cargando } = useSesion();
  const navegar = useNavigate();
  const [form, setForm] = useState({ email: 'admin@liga.mx', password: 'Password123', ligaSlug: 'demo' });
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={enviar} className="tarjeta w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-3xl">⚽</p>
          <h1 className="mt-2 text-xl font-bold">Plataforma Liga</h1>
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

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primario mt-6 w-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@liga.mx / Password123
        </p>
      </form>
    </div>
  );
}
