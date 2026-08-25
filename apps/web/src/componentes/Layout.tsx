import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';

const enlaces = [
  { a: '/', texto: 'Inicio', soloAdmin: false },
  { a: '/equipos', texto: 'Equipos', soloAdmin: false },
  { a: '/jornadas', texto: 'Jornadas', soloAdmin: false },
  { a: '/posiciones', texto: 'Posiciones', soloAdmin: false },
  { a: '/temporadas', texto: 'Temporadas', soloAdmin: true },
  { a: '/configuracion', texto: 'Configuración', soloAdmin: true },
];

export default function Layout() {
  const { usuario, salir, esAdmin } = useSesion();
  const navegar = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="shrink-0 text-lg font-bold text-cancha-700">⚽ Liga</span>
            {/* En móvil la barra se desliza en vez de romper el layout. */}
            <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {enlaces
                .filter((e) => !e.soloAdmin || esAdmin)
                .map((e) => (
                  <NavLink
                    key={e.a}
                    to={e.a}
                    end={e.a === '/'}
                    className={({ isActive }) =>
                      `shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                        isActive
                          ? 'bg-cancha-50 text-cancha-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    {e.texto}
                  </NavLink>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{usuario?.nombre}</p>
              <p className="text-xs text-slate-500">{usuario?.rol}</p>
            </div>
            <button
              className="btn-secundario"
              onClick={() => {
                salir();
                navegar('/login');
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
