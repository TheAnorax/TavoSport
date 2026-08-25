import { z } from 'zod';
import {
  ROLES,
  ESTATUS_EQUIPO,
  ESTATUS_JUGADOR,
  ESTADO_PARTIDO,
  POSICIONES,
} from './enums.js';
import { reglasPuntuacionSchema } from './reglas.js';
import { configLigaSchema } from './configLiga.js';

/* ---------- helpers ---------- */
const id = z.string().cuid();
const nombre = z.string().trim().min(2, 'Mínimo 2 caracteres').max(80);
export const idParamSchema = z.object({ id });

/* ---------- Auth ---------- */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  ligaSlug: z.string().trim().min(2),
});

export const registroSchema = loginSchema.extend({
  nombre,
  rol: z.enum(ROLES).default('ENCARGADO'),
});

export const usuarioPublicoSchema = z.object({
  id,
  email: z.string().email(),
  nombre: z.string(),
  rol: z.enum(ROLES),
  ligaId: id,
});

export const sesionSchema = z.object({
  token: z.string(),
  usuario: usuarioPublicoSchema,
});

/* ---------- Liga ---------- */
export const crearLigaSchema = z.object({
  nombre,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  logoUrl: z.string().url().optional().nullable(),
});
export const actualizarLigaSchema = crearLigaSchema
  .partial()
  .omit({ slug: true })
  .extend({ config: configLigaSchema.optional() });

/* ---------- Division ---------- */
export const crearDivisionSchema = z.object({
  nombre,
  orden: z.number().int().min(0).default(0),
});
export const actualizarDivisionSchema = crearDivisionSchema.partial();

/* ---------- Temporada ---------- */
export const crearTemporadaSchema = z
  .object({
    divisionId: id,
    nombre,
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
    activa: z.boolean().default(true),
    reglasPuntuacion: reglasPuntuacionSchema.default({}),
  })
  .refine((t) => t.fechaFin > t.fechaInicio, {
    message: 'La fecha fin debe ser posterior a la de inicio',
    path: ['fechaFin'],
  });

export const actualizarTemporadaSchema = z.object({
  nombre: nombre.optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  activa: z.boolean().optional(),
  reglasPuntuacion: reglasPuntuacionSchema.optional(),
});

/* ---------- Equipo ---------- */
export const crearEquipoSchema = z.object({
  temporadaId: id,
  nombre,
  escudoUrl: z.string().url().optional().nullable(),
  estatus: z.enum(ESTATUS_EQUIPO).default('ACTIVO'),
  encargadoId: id.optional().nullable(),
});
export const actualizarEquipoSchema = crearEquipoSchema.partial().omit({ temporadaId: true });

/* ---------- Jugador ---------- */
export const crearJugadorSchema = z.object({
  equipoId: id,
  nombre,
  numero: z.number().int().min(0).max(99),
  posicion: z.enum(POSICIONES).optional().nullable(),
  estatus: z.enum(ESTATUS_JUGADOR).default('ACTIVO'),
});
export const actualizarJugadorSchema = crearJugadorSchema.partial().omit({ equipoId: true });

/* ---------- Jornada ---------- */
export const crearJornadaSchema = z.object({
  temporadaId: id,
  numero: z.number().int().min(1),
  fecha: z.coerce.date(),
});
export const actualizarJornadaSchema = crearJornadaSchema.partial().omit({ temporadaId: true });

/* ---------- Partido ---------- */
export const crearPartidoSchema = z
  .object({
    jornadaId: id,
    localId: id,
    visitanteId: id,
    cancha: z.string().trim().max(60).optional().nullable(),
    fechaHora: z.coerce.date(),
    estado: z.enum(ESTADO_PARTIDO).default('PROGRAMADO'),
  })
  .refine((p) => p.localId !== p.visitanteId, {
    message: 'Un equipo no puede jugar contra sí mismo',
    path: ['visitanteId'],
  });

export const actualizarPartidoSchema = z.object({
  cancha: z.string().trim().max(60).optional().nullable(),
  fechaHora: z.coerce.date().optional(),
  estado: z.enum(ESTADO_PARTIDO).optional(),
  localId: id.optional(),
  visitanteId: id.optional(),
});

/** Genera jornadas + partidos automáticamente (round-robin) para una temporada. */
export const generarCalendarioSchema = z.object({
  temporadaId: id,
  fechaPrimeraJornada: z.coerce.date(),
  /** Días entre jornada y jornada (7 = semanal). */
  diasEntreJornadas: z.number().int().min(1).max(30).default(7),
  /** Hora de inicio del primer partido de cada jornada (0-23). */
  horaInicio: z.number().int().min(0).max(23).default(10),
  /** Horas entre un partido y el siguiente dentro de la jornada. */
  horasEntrePartidos: z.number().int().min(1).max(6).default(2),
  canchas: z.array(z.string().trim().min(1).max(60)).min(1).default(['Cancha 1']),
  /** Ida y vuelta: duplica las jornadas invirtiendo local/visitante. */
  idaYVuelta: z.boolean().default(false),
  /** Borra jornadas y partidos existentes de la temporada antes de generar. */
  reemplazar: z.boolean().default(false),
});

export const asignarEncargadoSchema = z.object({
  encargadoId: id.nullable(),
});

export const capturarResultadoSchema = z.object({
  golesLocal: z.number().int().min(0).max(99),
  golesVisitante: z.number().int().min(0).max(99),
  estado: z.enum(ESTADO_PARTIDO).default('FINALIZADO'),
});

/* ---------- Tabla de posiciones (calculada, no persistida) ---------- */
export const filaPosicionSchema = z.object({
  equipoId: id,
  equipoNombre: z.string(),
  escudoUrl: z.string().nullable(),
  pj: z.number().int(),
  pg: z.number().int(),
  pe: z.number().int(),
  pp: z.number().int(),
  gf: z.number().int(),
  gc: z.number().int(),
  dif: z.number().int(),
  pts: z.number().int(),
});

/* ---------- Tipos inferidos ---------- */
export type Login = z.infer<typeof loginSchema>;
export type Registro = z.infer<typeof registroSchema>;
export type UsuarioPublico = z.infer<typeof usuarioPublicoSchema>;
export type Sesion = z.infer<typeof sesionSchema>;
export type CrearLiga = z.infer<typeof crearLigaSchema>;
export type CrearDivision = z.infer<typeof crearDivisionSchema>;
export type CrearTemporada = z.infer<typeof crearTemporadaSchema>;
export type CrearEquipo = z.infer<typeof crearEquipoSchema>;
export type CrearJugador = z.infer<typeof crearJugadorSchema>;
export type CrearJornada = z.infer<typeof crearJornadaSchema>;
export type CrearPartido = z.infer<typeof crearPartidoSchema>;
export type ActualizarPartido = z.infer<typeof actualizarPartidoSchema>;
export type GenerarCalendario = z.infer<typeof generarCalendarioSchema>;
export type CapturarResultado = z.infer<typeof capturarResultadoSchema>;
export type FilaPosicion = z.infer<typeof filaPosicionSchema>;
