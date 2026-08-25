import type { FastifyPluginAsync } from 'fastify';
import { capturarResultadoSchema, leerConfigLiga, ventanaAbierta } from '@liga/shared';
import { prisma } from '../prisma.js';
import { tablaDeTemporada } from '../lib/tabla.js';

export const rutasResultados: FastifyPluginAsync = async (app) => {
  /** Captura o corrige el marcador de un partido. Deja rastro de quién y cuándo. */
  app.put<{ Params: { id: string } }>(
    '/partidos/:id/resultado',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const datos = capturarResultadoSchema.parse(req.body);

      const partido = await prisma.partido.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: { local: true, visitante: true },
      });
      if (!partido) return reply.code(404).send({ error: 'Partido no encontrado' });

      if (partido.estado === 'CANCELADO') {
        return reply.code(409).send({ error: 'No se puede capturar un partido cancelado' });
      }

      if (req.user.rol !== 'ADMIN') {
        const liga = await prisma.liga.findUnique({
          where: { id: req.user.ligaId },
          select: { config: true },
        });
        const config = leerConfigLiga(liga?.config);

        if (!config.permitirCapturaEncargado) {
          return reply.code(403).send({ error: 'En esta liga solo el administrador captura resultados' });
        }

        // Solo partidos donde juega su equipo.
        const suyo =
          partido.local.encargadoId === req.user.sub ||
          partido.visitante.encargadoId === req.user.sub;
        if (!suyo) {
          return reply.code(403).send({ error: 'Solo puedes capturar partidos de tu equipo' });
        }

        // Corregir un marcador ya capturado tiene fecha de caducidad.
        const esCorreccion = partido.estado === 'FINALIZADO';
        if (esCorreccion && !ventanaAbierta(partido.fechaHora, config.horasParaCorregir)) {
          return reply.code(403).send({
            error:
              config.horasParaCorregir === 0
                ? 'Solo el administrador puede corregir un resultado ya capturado'
                : `El plazo para corregir venció (${config.horasParaCorregir} h después del partido). Pide el cambio al administrador.`,
          });
        }
      }

      return prisma.partido.update({
        where: { id: partido.id },
        data: {
          golesLocal: datos.golesLocal,
          golesVisitante: datos.golesVisitante,
          estado: datos.estado,
          capturadoPorId: req.user.sub,
          capturadoEn: new Date(),
        },
        include: {
          local: { select: { id: true, nombre: true, escudoUrl: true } },
          visitante: { select: { id: true, nombre: true, escudoUrl: true } },
          capturadoPor: { select: { id: true, nombre: true } },
        },
      });
    },
  );

  /** Borra el marcador y regresa el partido a PROGRAMADO. Solo ADMIN. */
  app.delete<{ Params: { id: string } }>(
    '/partidos/:id/resultado',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const r = await prisma.partido.updateMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        data: {
          golesLocal: null,
          golesVisitante: null,
          estado: 'PROGRAMADO',
          capturadoPorId: null,
          capturadoEn: null,
        },
      });
      if (r.count === 0) return reply.code(404).send({ error: 'Partido no encontrado' });
      return reply.code(204).send();
    },
  );

  /** Tabla de posiciones de una temporada (calculada al vuelo). */
  app.get<{ Params: { id: string } }>(
    '/temporadas/:id/posiciones',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const temporada = await prisma.temporada.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        select: { id: true },
      });
      if (!temporada) return reply.code(404).send({ error: 'Temporada no encontrada' });

      return tablaDeTemporada(temporada.id);
    },
  );
};
