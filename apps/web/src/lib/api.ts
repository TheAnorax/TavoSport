const TOKEN_KEY = 'liga.token';

export const guardarToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const leerToken = () => localStorage.getItem(TOKEN_KEY);
export const borrarToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public campos?: Record<string, string[]>,
  ) {
    super(message);
  }
}

async function peticion<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const token = leerToken();
  const res = await fetch(`/api${ruta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const cuerpo = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) borrarToken();
    // Si el API devolvió errores por campo, los muestra en el mensaje.
    const detalle = cuerpo.campos
      ? Object.entries(cuerpo.campos as Record<string, string[]>)
          .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
          .join(' · ')
      : null;
    throw new ApiError(
      res.status,
      detalle ? `${cuerpo.error}. ${detalle}` : (cuerpo.error ?? 'Error de servidor'),
      cuerpo.campos,
    );
  }
  return cuerpo as T;
}

export const api = {
  get: <T>(ruta: string) => peticion<T>(ruta),
  post: <T>(ruta: string, body: unknown) =>
    peticion<T>(ruta, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(ruta: string, body: unknown) =>
    peticion<T>(ruta, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(ruta: string, body: unknown) =>
    peticion<T>(ruta, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(ruta: string) => peticion<T>(ruta, { method: 'DELETE' }),
};
