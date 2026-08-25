import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env.js';
import { prisma } from './prisma.js';
import authPlugin from './plugins/auth.js';
import { rutasAuth } from './routes/auth.js';
import { rutasCatalogo } from './routes/catalogo.js';
import { rutasEquipos } from './routes/equipos.js';

const esDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  // En dev solo se loguean warnings/errores: el log de cada request tapaba lo importante.
  logger: { level: esDev ? 'warn' : 'info' },
});

await app.register(cors, {
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
});
await app.register(authPlugin);

// Errores de validación Zod -> 400 con detalle por campo
app.setErrorHandler((error, _req, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Datos inválidos',
      campos: error.flatten().fieldErrors,
    });
  }
  app.log.error(error);
  const code = error.statusCode ?? 500;
  return reply.code(code).send({ error: code === 500 ? 'Error interno' : error.message });
});

app.get('/salud', async () => ({ ok: true, hora: new Date().toISOString() }));

await app.register(rutasAuth, { prefix: '/api/auth' });
await app.register(rutasCatalogo, { prefix: '/api' });
await app.register(rutasEquipos, { prefix: '/api' });

const cerrar = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`\n🚀 API lista en http://localhost:${env.PORT}`);
  console.log(`   Salud: http://localhost:${env.PORT}/salud\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
