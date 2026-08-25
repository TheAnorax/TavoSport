import type { FastifyPluginAsync } from 'fastify';
import {
  crearDivisionSchema,
  actualizarDivisionSchema,
  crearTemporadaSchema,
  actualizarTemporadaSchema,
  actualizarLigaSchema,
  REGLAS_DEFAULT,
} from '@liga/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

/** Liga, División y Temporada. Todo scopeado al tenant del token. */
export const rutasCatalogo: FastifyPluginAsync = async (app) => {
  /* ---------- Liga ---------- */
  app.get('/liga', { preHandler: app.autenticar }, async (req) =>
    prisma.liga.findUnique({ where: { id: req.user.ligaId } }),
  );

  app.patch('/liga', { preHandler: app.exigirRol('ADMIN') }, async (req) => {
    const datos = actualizarLigaSchema.parse(req.body);
    return prisma.liga.update({ where: { id: req.user.ligaId }, data: datos });
  });

  /* ---------- Divisiones ---------- */
  app.get('/divisiones', { preHandler: app.autenticar }, async (req) =>
    prisma.division.findMany({
      where: { ligaId: req.user.ligaId },
      orderBy: { orden: 'asc' },
      include: { _count: { select: { temporadas: true } } },
    }),
  );

  app.post('/divisiones', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = crearDivisionSchema.parse(req.body);
    const division = await prisma.division.create({
      data: { ...datos, ligaId: req.user.ligaId },
    });
    return reply.code(201).send(division);
  });

  app.patch<{ Params: { id: string } }>(
    '/divisiones/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const datos = actualizarDivisionSchema.parse(req.body);
      const r = await prisma.division.updateMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        data: datos,
      });
      if (r.count === 0) return reply.code(404).send({ error: 'División no encontrada' });
      return prisma.division.findUnique({ where: { id: req.params.id } });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/divisiones/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const r = await prisma.division.deleteMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (r.count === 0) return reply.code(404).send({ error: 'División no encontrada' });
      return reply.code(204).send();
    },
  );

  /* ---------- Temporadas ---------- */
  app.get<{ Querystring: { divisionId?: string; activa?: string } }>(
    '/temporadas',
    { preHandler: app.autenticar },
    async (req) =>
      prisma.temporada.findMany({
        where: {
          ligaId: req.user.ligaId,
          ...(req.query.divisionId ? { divisionId: req.query.divisionId } : {}),
          ...(req.query.activa !== undefined ? { activa: req.query.activa === 'true' } : {}),
        },
        orderBy: { fechaInicio: 'desc' },
        include: {
          division: { select: { id: true, nombre: true } },
          _count: { select: { equipos: true, jornadas: true } },
        },
      }),
  );

  app.post('/temporadas', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = crearTemporadaSchema.parse(req.body);

    const division = await prisma.division.findFirst({
      where: { id: datos.divisionId, ligaId: req.user.ligaId },
    });
    if (!division) return reply.code(404).send({ error: 'División no encontrada' });

    const temporada = await prisma.temporada.create({
      data: {
        ligaId: req.user.ligaId,
        divisionId: datos.divisionId,
        nombre: datos.nombre,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        activa: datos.activa,
        reglasPuntuacion: (datos.reglasPuntuacion ?? REGLAS_DEFAULT) as unknown as Prisma.InputJsonValue,
      },
    });
    return reply.code(201).send(temporada);
  });

  app.patch<{ Params: { id: string } }>(
    '/temporadas/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const { reglasPuntuacion, ...resto } = actualizarTemporadaSchema.parse(req.body);
      const r = await prisma.temporada.updateMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        data: {
          ...resto,
          ...(reglasPuntuacion
            ? { reglasPuntuacion: reglasPuntuacion as unknown as Prisma.InputJsonValue }
            : {}),
        },
      });
      if (r.count === 0) return reply.code(404).send({ error: 'Temporada no encontrada' });
      return prisma.temporada.findUnique({ where: { id: req.params.id } });
    },
  );
};
