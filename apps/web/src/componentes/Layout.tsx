import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSesion } from '../lib/sesion';
import {
  IconoInicio,
  IconoEscudo,
  IconoCalendario,
  IconoTabla,
  IconoBalon,
  IconoEngrane,
  IconoSalir,
} from './Iconos';

const enlaces = [
  { a: '/', texto: 'Inicio', Icono: IconoInicio, soloAdmin: false },
  { a: '/equipos', texto: 'Equipos', Icono: IconoEscudo, soloAdmin: false },
  { a: '/jornadas', texto: 'Jornadas', Icono: IconoCalendario, soloAdmin: false },
  { a: '/posiciones', texto: 'Posiciones', Icono: IconoTabla, soloAdmin: false },
  { a: '/temporadas', texto: 'Temporadas', Icono: IconoBalon, soloAdmin: true },
  { a: '/configuracion', texto: 'Ajustes', Icono: IconoEngrane, soloAdmin: true },
];

export default function Layout() {
  const { usuario, salir, esAdmin } = useSesion();
  const navegar = useNavigate();
  const visibles = enlaces.filter((e) => !e.soloAdmin || esAdmin);

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Barra superior de vidrio: se queda fija y deja ver el contenido por debajo. */}
      <header className="sticky top-0 z-40 vidrio border-x-0 border-t-0 rounded-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-5">
            <span className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-cancha-800">
              <IconoBalon size={22} className="text-cancha-600" />
              <span className="hidden sm:inline">Liga</span>
            </span>

            {/* En escritorio la navegación va aquí; en móvil baja a la barra inferior. */}
            <nav className="hidden gap-1 sm:flex">
              {visibles.map(({ a, texto, Icono }) => (
                <NavLink
                  key={a}
                  to={a}
                  end={a === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-cancha-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/70 hover:text-cancha-800'
                    }`
                  }
                >
                  <Icono size={15} />
                  {texto}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{usuario?.nombre}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-cancha-700">
                {usuario?.rol}
              </p>
            </div>
            <button
              className="btn-icono"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              onClick={() => {
                salir();
                navegar('/login');
              }}
            >
              <IconoSalir />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      {/* Navegación inferior en móvil: el pulgar llega, la barra superior no. */}
      <nav className="vidrio fixed inset-x-0 bottom-0 z-40 grid grid-flow-col rounded-none border-x-0 border-b-0 px-1 py-1.5 sm:hidden">
        {visibles.map(({ a, texto, Icono }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-cancha-700' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`rounded-lg px-2.5 py-1 ${isActive ? 'bg-cancha-100' : ''}`}>
                  <Icono size={18} />
                </span>
                {texto}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
