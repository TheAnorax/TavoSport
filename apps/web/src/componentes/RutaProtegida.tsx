import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Rol } from '@liga/shared';
import { useSesion } from '../lib/sesion';

export default function RutaProtegida({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Rol[];
}) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return <div className="p-10 text-center text-slate-500">Cargando…</div>;
  }
  if (!usuario) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="tarjeta mx-auto mt-10 max-w-md text-center">
        <p className="text-lg font-semibold">Sin acceso</p>
        <p className="mt-1 text-sm text-slate-500">Tu rol ({usuario.rol}) no puede ver esta sección.</p>
      </div>
    );
  }
  return <>{children}</>;
}
