import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema, registroSchema } from '@liga/shared';
import { prisma } from '../prisma.js';

export const rutasAuth: FastifyPluginAsync = async (app) => {
  app.post(
    '/login',
    {
      // Sin esto, la contraseña de cualquier usuario se puede adivinar por fuerza bruta.
      config: { rateLimit: { max: 10, timeWindow: '5 minutes' } },
    },
    async (req, reply) => {
      const datos = loginSchema.parse(req.body);

      const liga = await prisma.liga.findUnique({ where: { slug: datos.ligaSlug } });
      if (!liga) return reply.code(401).send({ error: 'Credenciales inválidas' });

      const usuario = await prisma.usuario.findUnique({
        where: { ligaId_email: { ligaId: liga.id, email: datos.email } },
      });
      if (!usuario || !usuario.activo) {
        return reply.code(401).send({ error: 'Credenciales inválidas' });
      }

      const valido = await bcrypt.compare(datos.password, usuario.passwordHash);
      if (!valido) return reply.code(401).send({ error: 'Credenciales inválidas' });

      const token = app.jwt.sign({
        sub: usuario.id,
        ligaId: usuario.ligaId,
        rol: usuario.rol,
        email: usuario.email,
        nombre: usuario.nombre,
      });

      return {
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
          ligaId: usuario.ligaId,
        },
        liga: { id: liga.id, nombre: liga.nombre, slug: liga.slug, logoUrl: liga.logoUrl },
      };
    },
  );

  /** Alta de usuarios dentro de la liga del ADMIN autenticado. */
  app.post('/usuarios', { preHandler: app.exigirRol('ADMIN') }, async (req, reply) => {
    const datos = registroSchema.omit({ ligaSlug: true }).parse(req.body);
    const ligaId = req.user.ligaId;

    const existe = await prisma.usuario.findUnique({
      where: { ligaId_email: { ligaId, email: datos.email } },
    });
    if (existe) return reply.code(409).send({ error: 'Ese email ya existe en la liga' });

    const usuario = await prisma.usuario.create({
      data: {
        ligaId,
        email: datos.email,
        nombre: datos.nombre,
        rol: datos.rol,
        passwordHash: await bcrypt.hash(datos.password, 10),
      },
      select: { id: true, email: true, nombre: true, rol: true, ligaId: true },
    });
    return reply.code(201).send(usuario);
  });

  app.get('/usuarios', { preHandler: app.exigirRol('ADMIN') }, async (req) =>
    prisma.usuario.findMany({
      where: { ligaId: req.user.ligaId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
      orderBy: { nombre: 'asc' },
    }),
  );

  app.get('/yo', { preHandler: app.autenticar }, async (req) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, nombre: true, rol: true, ligaId: true },
    });
    return usuario;
  });
};
