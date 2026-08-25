import type { FastifyPluginAsync } from 'fastify';
import {
  crearEquipoSchema,
  actualizarEquipoSchema,
  crearJugadorSchema,
  actualizarJugadorSchema,
} from '@liga/shared';
import { prisma } from '../prisma.js';

/**
 * Verifica que el encargado exista, sea de ESTA liga y tenga el rol correcto.
 * Sin esta comprobación, un admin podría asignar (o adivinar) el id de un usuario
 * de otra liga y darle acceso a un equipo que no le corresponde.
 */
async function encargadoValido(encargadoId: string, ligaId: string) {
  const u = await prisma.usuario.findFirst({
    where: { id: encargadoId, ligaId, rol: 'ENCARGADO', activo: true },
    select: { id: true },
  });
  return u !== null;
}

export const rutasEquipos: FastifyPluginAsync = async (app) => {
  /* ---------- Equipos ---------- */
  app.get<{ Querystring: { temporadaId?: string } }>(
    '/equipos',
    { preHandler: app.autenticar },
    async (req) =>
      prisma.equipo.findMany({
        where: {
          ligaId: req.user.ligaId,
          ...(req.query.temporadaId ? { temporadaId: req.query.temporadaId } : {}),
        },
        orderBy: { nombre: 'asc' },
        include: {
          encargado: { select: { id: true, nombre: true, email: true } },
          _count: { select: { jugadores: true } },
        },
      }),
  );

  app.get<{ Params: { id: string } }>(
    '/equipos/:id',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const equipo = await prisma.equipo.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: {
          encargado: { select: { id: true, nombre: true, email: true } },
          jugadores: { orderBy: { numero: 'asc' } },
          temporada: { select: { id: true, nombre: true } },
        },
      });
      if (!equipo) return reply.code(404).send({ error: 'Equipo no encontrado' });
      return equipo;
    },
  );

  app.post('/equipos', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = crearEquipoSchema.parse(req.body);
    const temporada = await prisma.temporada.findFirst({
      where: { id: datos.temporadaId, ligaId: req.user.ligaId },
    });
    if (!temporada) return reply.code(404).send({ error: 'Temporada no encontrada' });

    const existe = await prisma.equipo.findFirst({
      where: { temporadaId: datos.temporadaId, nombre: datos.nombre },
    });
    if (existe)
      return reply.code(409).send({ error: 'Ya existe un equipo con ese nombre en la temporada' });

    const equipo = await prisma.equipo.create({ data: { ...datos, ligaId: req.user.ligaId } });
    return reply.code(201).send(equipo);
  });

  app.patch<{ Params: { id: string } }>(
    '/equipos/:id',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const datos = actualizarEquipoSchema.parse(req.body);
      const equipo = await prisma.equipo.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (!equipo) return reply.code(404).send({ error: 'Equipo no encontrado' });

      // Un ENCARGADO solo toca su propio equipo, y no puede reasignar el encargado.
      if (req.user.rol !== 'ADMIN') {
        if (equipo.encargadoId !== req.user.sub) {
          return reply.code(403).send({ error: 'Solo puedes editar tu propio equipo' });
        }
        delete (datos as Record<string, unknown>).encargadoId;
      } else if (
        datos.encargadoId &&
        !(await encargadoValido(datos.encargadoId, req.user.ligaId))
      ) {
        return reply.code(400).send({ error: 'El encargado indicado no existe en esta liga' });
      }

      return prisma.equipo.update({ where: { id: equipo.id }, data: datos });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/equipos/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const r = await prisma.equipo.deleteMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (r.count === 0) return reply.code(404).send({ error: 'Equipo no encontrado' });
      return reply.code(204).send();
    },
  );

  /* ---------- Jugadores ---------- */
  app.get<{ Querystring: { equipoId?: string } }>(
    '/jugadores',
    { preHandler: app.autenticar },
    async (req) =>
      prisma.jugador.findMany({
        where: {
          ligaId: req.user.ligaId,
          ...(req.query.equipoId ? { equipoId: req.query.equipoId } : {}),
        },
        orderBy: [{ equipoId: 'asc' }, { numero: 'asc' }],
      }),
  );

  app.post('/jugadores', { preHandler: app.autenticar }, async (req, reply) => {
    const datos = crearJugadorSchema.parse(req.body);
    const equipo = await prisma.equipo.findFirst({
      where: { id: datos.equipoId, ligaId: req.user.ligaId },
    });
    if (!equipo) return reply.code(404).send({ error: 'Equipo no encontrado' });
    if (req.user.rol !== 'ADMIN' && equipo.encargadoId !== req.user.sub) {
      return reply.code(403).send({ error: 'Solo puedes gestionar la plantilla de tu equipo' });
    }

    const dorsalOcupado = await prisma.jugador.findFirst({
      where: { equipoId: datos.equipoId, numero: datos.numero },
    });
    if (dorsalOcupado) {
      return reply
        .code(409)
        .send({ error: `El dorsal ${datos.numero} ya está ocupado en este equipo` });
    }

    const jugador = await prisma.jugador.create({ data: { ...datos, ligaId: req.user.ligaId } });
    return reply.code(201).send(jugador);
  });

  app.patch<{ Params: { id: string } }>(
    '/jugadores/:id',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const datos = actualizarJugadorSchema.parse(req.body);
      const jugador = await prisma.jugador.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: { equipo: true },
      });
      if (!jugador) return reply.code(404).send({ error: 'Jugador no encontrado' });
      if (req.user.rol !== 'ADMIN' && jugador.equipo.encargadoId !== req.user.sub) {
        return reply.code(403).send({ error: 'Solo puedes gestionar la plantilla de tu equipo' });
      }
      if (datos.numero !== undefined && datos.numero !== jugador.numero) {
        const ocupado = await prisma.jugador.findFirst({
          where: { equipoId: jugador.equipoId, numero: datos.numero },
        });
        if (ocupado)
          return reply.code(409).send({ error: `El dorsal ${datos.numero} ya está ocupado` });
      }
      return prisma.jugador.update({ where: { id: jugador.id }, data: datos });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/jugadores/:id',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const jugador = await prisma.jugador.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: { equipo: true },
      });
      if (!jugador) return reply.code(404).send({ error: 'Jugador no encontrado' });
      if (req.user.rol !== 'ADMIN' && jugador.equipo.encargadoId !== req.user.sub) {
        return reply.code(403).send({ error: 'Solo puedes gestionar la plantilla de tu equipo' });
      }
      await prisma.jugador.delete({ where: { id: jugador.id } });
      return reply.code(204).send();
    },
  );
};
