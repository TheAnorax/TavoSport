import {
  calcularPosiciones,
  reglasPuntuacionSchema,
  REGLAS_DEFAULT,
  type FilaTabla,
} from '@liga/shared';
import { prisma } from '../prisma.js';

/**
 * Arma la tabla de posiciones de una temporada.
 * La tabla NO se almacena: se deriva de los partidos FINALIZADOS en cada consulta,
 * así nunca puede desincronizarse de los resultados.
 */
export async function tablaDeTemporada(temporadaId: string): Promise<FilaTabla[] | null> {
  const temporada = await prisma.temporada.findUnique({
    where: { id: temporadaId },
    select: { reglasPuntuacion: true },
  });
  if (!temporada) return null;

  const [equipos, partidos] = await Promise.all([
    prisma.equipo.findMany({
      where: { temporadaId, estatus: { not: 'INACTIVO' } },
      select: { id: true, nombre: true, escudoUrl: true },
    }),
    prisma.partido.findMany({
      where: {
        jornada: { temporadaId },
        estado: 'FINALIZADO',
        golesLocal: { not: null },
        golesVisitante: { not: null },
      },
      select: { localId: true, visitanteId: true, golesLocal: true, golesVisitante: true },
    }),
  ]);

  // Si la liga guardó reglas inválidas o vacías, se cae al default en vez de reventar.
  const reglas = reglasPuntuacionSchema.safeParse(temporada.reglasPuntuacion);

  return calcularPosiciones(
    equipos,
    partidos.map((p) => ({
      localId: p.localId,
      visitanteId: p.visitanteId,
      golesLocal: p.golesLocal!,
      golesVisitante: p.golesVisitante!,
    })),
    reglas.success ? reglas.data : REGLAS_DEFAULT,
  );
}
