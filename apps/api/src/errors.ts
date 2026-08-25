export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public detalles?: unknown,
  ) {
    super(message);
  }
}

export const noEncontrado = (que: string) => new HttpError(404, `${que} no encontrado`);
export const prohibido = (msg = 'No tienes permiso para esta acción') => new HttpError(403, msg);
export const conflicto = (msg: string) => new HttpError(409, msg);
export const malaPeticion = (msg: string, detalles?: unknown) => new HttpError(400, msg, detalles);
