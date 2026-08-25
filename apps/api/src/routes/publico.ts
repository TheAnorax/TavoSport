import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma.js';
import { tablaDeTemporada } from '../lib/tabla.js';

/**
 * Rutas SIN autenticación, pensadas para jugadores y aficionados.
 * Se entra por el slug de la liga, así el multi-tenant se mantiene:
 * /publico/:slug/... solo expone datos de esa liga y nada más.
 * Nunca se devuelven emails, roles ni datos de usuarios.
 */
export const rutasPublicas: FastifyPluginAsync = async (app) => {
  const ligaPorSlug = (slug: string) =>
    prisma.liga.findUnique({
      where: { slug },
      select: { id: true, nombre: true, slug: true, logoUrl: true },
    });

  app.get<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
    const liga = await ligaPorSlug(req.params.slug);
    if (!liga) return reply.code(404).send({ error: 'Liga no encontrada' });

    const temporadas = await prisma.temporada.findMany({
      where: { ligaId: liga.id, activa: true },
      orderBy: { fechaInicio: 'desc' },
      select: {
        id: true,
        nombre: true,
        fechaInicio: true,
        fechaFin: true,
        division: { select: { id: true, nombre: true, orden: true } },
        _count: { select: { equipos: true, jornadas: true } },
      },
    });

    return { liga, temporadas };
  });

  app.get<{ Params: { slug: string; temporadaId: string } }>(
    '/:slug/temporadas/:temporadaId/posiciones',
    async (req, reply) => {
      const liga = await ligaPorSlug(req.params.slug);
      if (!liga) return reply.code(404).send({ error: 'Liga no encontrada' });

      const temporada = await prisma.temporada.findFirst({
        where: { id: req.params.temporadaId, ligaId: liga.id },
        select: { id: true },
      });
      if (!temporada) return reply.code(404).send({ error: 'Temporada no encontrada' });

      return tablaDeTemporada(temporada.id);
    },
  );

  app.get<{ Params: { slug: string; temporadaId: string } }>(
    '/:slug/temporadas/:temporadaId/jornadas',
    async (req, reply) => {
      const liga = await ligaPorSlug(req.params.slug);
      if (!liga) return reply.code(404).send({ error: 'Liga no encontrada' });

      return prisma.jornada.findMany({
        where: { temporadaId: req.params.temporadaId, ligaId: liga.id },
        orderBy: { numero: 'asc' },
        select: {
          id: true,
          numero: true,
          fecha: true,
          partidos: {
            orderBy: { fechaHora: 'asc' },
            select: {
              id: true,
              fechaHora: true,
              cancha: true,
              estado: true,
              golesLocal: true,
              golesVisitante: true,
              local: { select: { id: true, nombre: true, escudoUrl: true } },
              visitante: { select: { id: true, nombre: true, escudoUrl: true } },
            },
          },
        },
      });
    },
  );
};
