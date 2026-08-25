import type { Rol, EstatusEquipo, EstatusJugador, Posicion, EstadoPartido } from '@liga/shared';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  ligaId: string;
}

export interface Liga {
  id: string;
  nombre: string;
  slug: string;
  logoUrl: string | null;
}

export interface Division {
  id: string;
  nombre: string;
  orden: number;
  _count?: { temporadas: number };
}

export interface Temporada {
  id: string;
  nombre: string;
  divisionId: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  division?: { id: string; nombre: string };
  _count?: { equipos: number; jornadas: number };
}

export interface Equipo {
  id: string;
  nombre: string;
  escudoUrl: string | null;
  estatus: EstatusEquipo;
  temporadaId: string;
  encargadoId: string | null;
  encargado?: { id: string; nombre: string; email: string } | null;
  _count?: { jugadores: number };
  jugadores?: Jugador[];
  temporada?: { id: string; nombre: string };
}

export interface Jugador {
  id: string;
  nombre: string;
  numero: number;
  posicion: Posicion | null;
  estatus: EstatusJugador;
  equipoId: string;
}

export interface Jornada {
  id: string;
  numero: number;
  fecha: string;
  temporadaId: string;
  _count?: { partidos: number };
  partidos?: Partido[];
  temporada?: { id: string; nombre: string };
}

export interface Partido {
  id: string;
  jornadaId: string;
  localId: string;
  visitanteId: string;
  cancha: string | null;
  fechaHora: string;
  estado: EstadoPartido;
  golesLocal: number | null;
  golesVisitante: number | null;
  local: { id: string; nombre: string; escudoUrl: string | null };
  visitante: { id: string; nombre: string; escudoUrl: string | null };
  jornada?: { id: string; numero: number; fecha: string };
}

export interface FilaTabla {
  posicion: number;
  equipoId: string;
  equipoNombre: string;
  escudoUrl: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}
