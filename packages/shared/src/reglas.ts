import { z } from 'zod';

/** Criterios de desempate disponibles, en el orden que la liga decida. */
export const CRITERIOS_DESEMPATE = [
  'DIFERENCIA_GOLES',
  'GOLES_FAVOR',
  'ENFRENTAMIENTO_DIRECTO',
  'PARTIDOS_GANADOS',
  'MENOS_GOLES_CONTRA',
  'SORTEO',
] as const;
export type CriterioDesempate = (typeof CRITERIOS_DESEMPATE)[number];

export const reglasPuntuacionSchema = z.object({
  puntosVictoria: z.number().int().min(0).default(3),
  puntosEmpate: z.number().int().min(0).default(1),
  puntosDerrota: z.number().int().min(0).default(0),
  /** Puntos otorgados al equipo que gana por default (no se presentó el rival). */
  puntosDefault: z.number().int().min(0).default(3),
  /** Marcador con el que se registra un partido ganado por default. */
  golesDefault: z.number().int().min(0).default(3),
  desempates: z
    .array(z.enum(CRITERIOS_DESEMPATE))
    .default(['DIFERENCIA_GOLES', 'GOLES_FAVOR', 'ENFRENTAMIENTO_DIRECTO']),
});

export type ReglasPuntuacion = z.infer<typeof reglasPuntuacionSchema>;

export const REGLAS_DEFAULT: ReglasPuntuacion = reglasPuntuacionSchema.parse({});
