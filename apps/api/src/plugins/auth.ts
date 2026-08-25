import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../env.js';
import type { Rol } from '@liga/shared';

export interface SesionJWT {
  sub: string;
  ligaId: string;
  rol: Rol;
  email: string;
  nombre: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Exige sesión válida. */
    autenticar: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Exige sesión válida Y uno de los roles indicados. */
    exigirRol: (...roles: Rol[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: SesionJWT;
    user: SesionJWT;
  }
}

export default fp(async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '12h' },
  });

  app.decorate('autenticar', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'No autenticado' });
    }
  });

  app.decorate(
    'exigirRol',
    (...roles: Rol[]) =>
      async (req: FastifyRequest, reply: FastifyReply) => {
        try {
          await req.jwtVerify();
        } catch {
          return reply.code(401).send({ error: 'No autenticado' });
        }
        if (!roles.includes(req.user.rol)) {
          return reply.code(403).send({ error: 'No tienes permiso para esta acción' });
        }
      },
  );
});
