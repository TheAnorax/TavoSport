import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma.js';
import { tablaDeTemporada } from '../lib/tabla.js';

const equipoBreve = { select: { id: true, nombre: true, escudoUrl: true } } as const;

export const rutasDashboard: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { temporadaId?: string } }>(
    '/dashboard',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const ligaId = req.user.ligaId;

      // Sin temporada explícita, se toma la activa más reciente.
      const temporada = req.query.temporadaId
        ? await prisma.temporada.findFirst({ where: { id: req.query.temporadaId, ligaId } })
        : await prisma.temporada.findFirst({
            where: { ligaId, activa: true },
            orderBy: { fechaInicio: 'desc' },
          });

      if (!temporada) {
        return reply.send({
          temporada: null,
          proximaJornada: null,
          top5: [],
          capturas: [],
          pendientes: 0,
        });
      }

      const ahora = new Date();

      const [proximaJornada, tabla, capturas, pendientes] = await Promise.all([
        // La próxima jornada con al menos un partido aún no jugado.
        prisma.jornada.findFirst({
          where: {
            temporadaId: temporada.id,
            partidos: { some: { estado: { in: ['PROGRAMADO', 'EN_CURSO'] } } },
          },
          orderBy: { numero: 'asc' },
          include: {
            partidos: {
              orderBy: { fechaHora: 'asc' },
              include: { local: equipoBreve, visitante: equipoBreve },
            },
          },
        }),

        tablaDeTemporada(temporada.id),

        // Bitácora: últimas capturas, con quién y cuándo.
        prisma.partido.findMany({
          where: { jornada: { temporadaId: temporada.id }, capturadoEn: { not: null } },
          orderBy: { capturadoEn: 'desc' },
          take: 10,
          select: {
            id: true,
            golesLocal: true,
            golesVisitante: true,
            capturadoEn: true,
            estado: true,
            local: equipoBreve,
            visitante: equipoBreve,
            jornada: { select: { numero: true } },
            capturadoPor: { select: { id: true, nombre: true, rol: true } },
          },
        }),

        // Partidos que ya pasaron y siguen sin marcador.
        prisma.partido.count({
          where: {
            jornada: { temporadaId: temporada.id },
            estado: { in: ['PROGRAMADO', 'EN_CURSO'] },
            fechaHora: { lt: ahora },
          },
        }),
      ]);

      return {
        temporada: { id: temporada.id, nombre: temporada.nombre },
        proximaJornada,
        top5: (tabla ?? []).slice(0, 5),
        capturas,
        pendientes,
      };
    },
  );
};
