export const ROLES = ['ADMIN', 'ENCARGADO', 'PUBLICO'] as const;
export type Rol = (typeof ROLES)[number];

export const ESTATUS_EQUIPO = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'] as const;
export type EstatusEquipo = (typeof ESTATUS_EQUIPO)[number];

export const ESTATUS_JUGADOR = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'BAJA'] as const;
export type EstatusJugador = (typeof ESTATUS_JUGADOR)[number];

export const ESTADO_PARTIDO = [
  'PROGRAMADO',
  'EN_CURSO',
  'FINALIZADO',
  'SUSPENDIDO',
  'CANCELADO',
] as const;
export type EstadoPartido = (typeof ESTADO_PARTIDO)[number];

export const POSICIONES = ['PORTERO', 'DEFENSA', 'MEDIO', 'DELANTERO'] as const;
export type Posicion = (typeof POSICIONES)[number];
