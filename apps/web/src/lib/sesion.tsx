import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, borrarToken, guardarToken, leerToken } from './api';
import type { Liga, Usuario } from './tipos';

interface Contexto {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string, ligaSlug: string) => Promise<void>;
  salir: () => void;
  esAdmin: boolean;
}

const SesionCtx = createContext<Contexto | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!leerToken()) {
      setCargando(false);
      return;
    }
    api
      .get<Usuario>('/auth/yo')
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  const valor = useMemo<Contexto>(
    () => ({
      usuario,
      cargando,
      esAdmin: usuario?.rol === 'ADMIN',
      entrar: async (email, password, ligaSlug) => {
        const r = await api.post<{ token: string; usuario: Usuario; liga: Liga }>(
          '/auth/login',
          { email, password, ligaSlug },
        );
        guardarToken(r.token);
        setUsuario(r.usuario);
      },
      salir: () => {
        borrarToken();
        setUsuario(null);
      },
    }),
    [usuario, cargando],
  );

  return <SesionCtx.Provider value={valor}>{children}</SesionCtx.Provider>;
}

export function useSesion() {
  const ctx = useContext(SesionCtx);
  if (!ctx) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return ctx;
}
