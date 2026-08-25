import { z } from 'zod';

/**
 * Configuración por liga (columna `Liga.config`, JSON).
 * Cada cliente ajusta esto sin que nadie toque código.
 */
export const configLigaSchema = z.object({
  /**
   * Horas después de la hora del partido durante las que un ENCARGADO
   * puede seguir corrigiendo el marcador. 0 = solo el ADMIN corrige.
   * El ADMIN nunca tiene límite.
   */
  horasParaCorregir: z.number().int().min(0).max(720).default(48),
  /** Si es false, solo el ADMIN captura resultados. */
  permitirCapturaEncargado: z.boolean().default(true),
  /** Contacto que se muestra en la vista pública. */
  contacto: z.string().trim().max(120).optional().nullable(),
});

export type ConfigLiga = z.infer<typeof configLigaSchema>;
export const CONFIG_DEFAULT: ConfigLiga = configLigaSchema.parse({});

/** Lee la config guardada tolerando valores viejos o corruptos. */
export function leerConfigLiga(valor: unknown): ConfigLiga {
  const r = configLigaSchema.safeParse(valor);
  return r.success ? r.data : CONFIG_DEFAULT;
}

/**
 * ¿Sigue abierta la ventana para corregir este partido?
 * Se cuenta desde la hora del partido, no desde la captura:
 * así la ventana no se reinicia cada vez que alguien edita.
 */
export function ventanaAbierta(
  fechaPartido: Date | string,
  horasParaCorregir: number,
  ahora: Date = new Date(),
): boolean {
  if (horasParaCorregir <= 0) return false;
  const limite = new Date(fechaPartido).getTime() + horasParaCorregir * 3_600_000;
  return ahora.getTime() <= limite;
}
