import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import estaticos from '@fastify/static';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './env.js';
import { prisma } from './prisma.js';
import authPlugin from './plugins/auth.js';
import { rutasAuth } from './routes/auth.js';
import { rutasCatalogo } from './routes/catalogo.js';
import { rutasEquipos } from './routes/equipos.js';
import { rutasCalendario } from './routes/calendario.js';
import { rutasResultados } from './routes/resultados.js';
import { rutasPublicas } from './routes/publico.js';
import { rutasDashboard } from './routes/dashboard.js';
import { rutasEscudos, DIR_SUBIDAS } from './routes/escudos.js';

const esDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  // En dev solo se loguean warnings/errores: el log de cada request tapaba lo importante.
  logger: { level: esDev ? 'warn' : 'info' },
});

await app.register(cors, {
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
});
// Cabeceras de seguridad. crossOriginResourcePolicy se relaja para que el front
// (otro puerto en desarrollo) pueda mostrar los escudos servidos por el API.
await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Freno global; el login lleva uno mucho más estricto en su propia ruta.
await app.register(rateLimit, {
  max: 300,
  timeWindow: '1 minute',
  errorResponseBuilder: (_req, contexto) => ({
    error: `Demasiadas peticiones. Intenta de nuevo en ${contexto.after}.`,
  }),
});

await app.register(multipart, { limits: { fileSize: 1_000_000, files: 1 } });
await app.register(authPlugin);

// Errores de validación Zod -> 400 con detalle por campo
app.setErrorHandler((error, _req, reply) => {
  // Se extraen ANTES del narrowing: tras `instanceof ZodError`, TS reduce
  // el tipo del else a `never` y pierde statusCode/message.
  const { statusCode, message } = error as { statusCode?: number; message: string };

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Datos inválidos',
      campos: error.flatten().fieldErrors,
    });
  }

  app.log.error(error as Error);
  const code = statusCode ?? 500;
  return reply.code(code).send({ error: code === 500 ? 'Error interno' : message });
});

// Los escudos se sirven como archivos estáticos desde el disco del servidor.
await app.register(estaticos, {
  root: DIR_SUBIDAS,
  prefix: '/subidas/',
  // Los archivos subidos NUNCA se ejecutan en el navegador: se fuerza a que se
  // traten como datos opacos. Sin esto, un SVG malicioso abierto directamente
  // podría correr JavaScript en el mismo origen que la API (XSS almacenado).
  setHeaders: (res) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
});

app.get('/salud', async () => ({ ok: true, hora: new Date().toISOString() }));

await app.register(rutasAuth, { prefix: '/api/auth' });
await app.register(rutasCatalogo, { prefix: '/api' });
await app.register(rutasEquipos, { prefix: '/api' });
await app.register(rutasCalendario, { prefix: '/api' });
await app.register(rutasResultados, { prefix: '/api' });
await app.register(rutasDashboard, { prefix: '/api' });
await app.register(rutasEscudos, { prefix: '/api' });
await app.register(rutasPublicas, { prefix: '/api/publico' });

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
