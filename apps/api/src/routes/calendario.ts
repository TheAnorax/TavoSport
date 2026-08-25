import type { FastifyPluginAsync } from 'fastify';
import {
  crearJornadaSchema,
  actualizarJornadaSchema,
  crearPartidoSchema,
  actualizarPartidoSchema,
  generarCalendarioSchema,
  generarRoundRobin,
} from '@liga/shared';
import { prisma } from '../prisma.js';

const incluirPartido = {
  local: { select: { id: true, nombre: true, escudoUrl: true } },
  visitante: { select: { id: true, nombre: true, escudoUrl: true } },
} as const;

export const rutasCalendario: FastifyPluginAsync = async (app) => {
  /* ---------------- Jornadas ---------------- */

  app.get<{ Querystring: { temporadaId?: string } }>(
    '/jornadas',
    { preHandler: app.autenticar },
    async (req) =>
      prisma.jornada.findMany({
        where: {
          ligaId: req.user.ligaId,
          ...(req.query.temporadaId ? { temporadaId: req.query.temporadaId } : {}),
        },
        orderBy: { numero: 'asc' },
        include: { _count: { select: { partidos: true } } },
      }),
  );

  app.get<{ Params: { id: string } }>(
    '/jornadas/:id',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const jornada = await prisma.jornada.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: {
          partidos: { orderBy: { fechaHora: 'asc' }, include: incluirPartido },
          temporada: { select: { id: true, nombre: true } },
        },
      });
      if (!jornada) return reply.code(404).send({ error: 'Jornada no encontrada' });
      return jornada;
    },
  );

  app.post('/jornadas', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = crearJornadaSchema.parse(req.body);

    const temporada = await prisma.temporada.findFirst({
      where: { id: datos.temporadaId, ligaId: req.user.ligaId },
    });
    if (!temporada) return reply.code(404).send({ error: 'Temporada no encontrada' });

    const repetida = await prisma.jornada.findFirst({
      where: { temporadaId: datos.temporadaId, numero: datos.numero },
    });
    if (repetida) {
      return reply.code(409).send({ error: `La jornada ${datos.numero} ya existe en esta temporada` });
    }

    const jornada = await prisma.jornada.create({
      data: { ...datos, ligaId: req.user.ligaId },
    });
    return reply.code(201).send(jornada);
  });

  app.patch<{ Params: { id: string } }>(
    '/jornadas/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const datos = actualizarJornadaSchema.parse(req.body);
      const r = await prisma.jornada.updateMany({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        data: datos,
      });
      if (r.count === 0) return reply.code(404).send({ error: 'Jornada no encontrada' });
      return prisma.jornada.findUnique({ where: { id: req.params.id } });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/jornadas/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const jornada = await prisma.jornada.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
        include: { _count: { select: { partidos: true } } },
      });
      if (!jornada) return reply.code(404).send({ error: 'Jornada no encontrada' });

      const jugados = await prisma.partido.count({
        where: { jornadaId: jornada.id, estado: 'FINALIZADO' },
      });
      if (jugados > 0) {
        return reply.code(409).send({
          error: `No se puede borrar: la jornada tiene ${jugados} partido(s) con resultado capturado`,
        });
      }
      await prisma.jornada.delete({ where: { id: jornada.id } });
      return reply.code(204).send();
    },
  );

  /* ---------------- Partidos ---------------- */

  app.get<{ Querystring: { jornadaId?: string; temporadaId?: string; equipoId?: string } }>(
    '/partidos',
    { preHandler: app.autenticar },
    async (req) => {
      const { jornadaId, temporadaId, equipoId } = req.query;
      return prisma.partido.findMany({
        where: {
          ligaId: req.user.ligaId,
          ...(jornadaId ? { jornadaId } : {}),
          ...(temporadaId ? { jornada: { temporadaId } } : {}),
          ...(equipoId ? { OR: [{ localId: equipoId }, { visitanteId: equipoId }] } : {}),
        },
        orderBy: [{ jornada: { numero: 'asc' } }, { fechaHora: 'asc' }],
        include: {
          ...incluirPartido,
          jornada: { select: { id: true, numero: true, fecha: true } },
        },
      });
    },
  );

  app.post('/partidos', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = crearPartidoSchema.parse(req.body);

    const jornada = await prisma.jornada.findFirst({
      where: { id: datos.jornadaId, ligaId: req.user.ligaId },
    });
    if (!jornada) return reply.code(404).send({ error: 'Jornada no encontrada' });

    // Ambos equipos deben existir y pertenecer a la temporada de la jornada.
    const equipos = await prisma.equipo.findMany({
      where: {
        id: { in: [datos.localId, datos.visitanteId] },
        ligaId: req.user.ligaId,
        temporadaId: jornada.temporadaId,
      },
    });
    if (equipos.length !== 2) {
      return reply.code(400).send({ error: 'Ambos equipos deben pertenecer a la temporada de la jornada' });
    }

    // Un equipo no juega dos veces en la misma jornada.
    const yaProgramado = await prisma.partido.findFirst({
      where: {
        jornadaId: datos.jornadaId,
        OR: [
          { localId: { in: [datos.localId, datos.visitanteId] } },
          { visitanteId: { in: [datos.localId, datos.visitanteId] } },
        ],
      },
      include: incluirPartido,
    });
    if (yaProgramado) {
      return reply.code(409).send({
        error: `Uno de los equipos ya juega en esta jornada (${yaProgramado.local.nombre} vs ${yaProgramado.visitante.nombre})`,
      });
    }

    const partido = await prisma.partido.create({
      data: { ...datos, ligaId: req.user.ligaId },
      include: incluirPartido,
    });
    return reply.code(201).send(partido);
  });

  app.patch<{ Params: { id: string } }>(
    '/partidos/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const datos = actualizarPartidoSchema.parse(req.body);
      const partido = await prisma.partido.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (!partido) return reply.code(404).send({ error: 'Partido no encontrado' });

      const local = datos.localId ?? partido.localId;
      const visitante = datos.visitanteId ?? partido.visitanteId;
      if (local === visitante) {
        return reply.code(400).send({ error: 'Un equipo no puede jugar contra sí mismo' });
      }

      return prisma.partido.update({
        where: { id: partido.id },
        data: datos,
        include: incluirPartido,
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/partidos/:id',
    { preHandler: app.exigirRol('ADMIN') },
    async (req, reply) => {
      const partido = await prisma.partido.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (!partido) return reply.code(404).send({ error: 'Partido no encontrado' });
      if (partido.estado === 'FINALIZADO') {
        return reply.code(409).send({ error: 'No se puede borrar un partido con resultado capturado' });
      }
      await prisma.partido.delete({ where: { id: partido.id } });
      return reply.code(204).send();
    },
  );

  /* ---------------- Generador de calendario ---------------- */

  app.post('/calendario/generar', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const cfg = generarCalendarioSchema.parse(req.body);

    const temporada = await prisma.temporada.findFirst({
      where: { id: cfg.temporadaId, ligaId: req.user.ligaId },
    });
    if (!temporada) return reply.code(404).send({ error: 'Temporada no encontrada' });

    const equipos = await prisma.equipo.findMany({
      where: { temporadaId: cfg.temporadaId, estatus: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
      select: { id: true },
    });
    if (equipos.length < 2) {
      return reply.code(400).send({ error: 'Se necesitan al menos 2 equipos activos' });
    }

    const existentes = await prisma.jornada.count({ where: { temporadaId: cfg.temporadaId } });
    if (existentes > 0 && !cfg.reemplazar) {
      return reply.code(409).send({
        error: `La temporada ya tiene ${existentes} jornada(s). Marca "reemplazar" para regenerarlas.`,
      });
    }

    const conResultado = await prisma.partido.count({
      where: { jornada: { temporadaId: cfg.temporadaId }, estado: 'FINALIZADO' },
    });
    if (conResultado > 0) {
      return reply.code(409).send({
        error: `No se puede regenerar: hay ${conResultado} partido(s) con resultado capturado`,
      });
    }

    const rondas = generarRoundRobin(equipos, cfg.idaYVuelta);

    // Todo o nada: si algo falla, no queda un calendario a medias.
    const resumen = await prisma.$transaction(async (tx) => {
      if (cfg.reemplazar) {
        await tx.partido.deleteMany({ where: { jornada: { temporadaId: cfg.temporadaId } } });
        await tx.jornada.deleteMany({ where: { temporadaId: cfg.temporadaId } });
      }

      let partidos = 0;
      for (const [i, pares] of rondas.entries()) {
        const fecha = new Date(cfg.fechaPrimeraJornada);
        fecha.setDate(fecha.getDate() + i * cfg.diasEntreJornadas);
        fecha.setHours(cfg.horaInicio, 0, 0, 0);

        const jornada = await tx.jornada.create({
          data: {
            ligaId: req.user.ligaId,
            temporadaId: cfg.temporadaId,
            numero: i + 1,
            fecha,
          },
        });

        for (const [p, [local, visitante]] of pares.entries()) {
          const fechaHora = new Date(fecha);
          fechaHora.setHours(cfg.horaInicio + p * cfg.horasEntrePartidos, 0, 0, 0);
          await tx.partido.create({
            data: {
              ligaId: req.user.ligaId,
              jornadaId: jornada.id,
              localId: local.id,
              visitanteId: visitante.id,
              cancha: cfg.canchas[p % cfg.canchas.length]!,
              fechaHora,
              estado: 'PROGRAMADO',
            },
          });
          partidos++;
        }
      }
      return { jornadas: rondas.length, partidos };
    });

    return reply.code(201).send(resumen);
  });
};
