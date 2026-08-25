import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma.js';

const TIPOS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const MAX_BYTES = 1_000_000; // 1 MB

export const DIR_SUBIDAS = path.resolve(process.cwd(), 'subidas');

export const rutasEscudos: FastifyPluginAsync = async (app) => {
  await mkdir(DIR_SUBIDAS, { recursive: true });

  app.post<{ Params: { id: string } }>(
    '/equipos/:id/escudo',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const equipo = await prisma.equipo.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (!equipo) return reply.code(404).send({ error: 'Equipo no encontrado' });
      if (req.user.rol !== 'ADMIN' && equipo.encargadoId !== req.user.sub) {
        return reply.code(403).send({ error: 'Solo puedes editar tu propio equipo' });
      }

      const archivo = await req.file();
      if (!archivo) return reply.code(400).send({ error: 'No se recibió ningún archivo' });

      const extension = TIPOS[archivo.mimetype];
      if (!extension) {
        return reply.code(400).send({ error: 'Formato no permitido. Usa PNG, JPG, WEBP o SVG.' });
      }

      const bytes = await archivo.toBuffer();
      // El límite también está en el plugin, pero se revisa aquí para dar un mensaje claro.
      if (bytes.byteLength > MAX_BYTES) {
        return reply.code(413).send({ error: 'La imagen supera 1 MB' });
      }

      // El nombre incluye ligaId: aunque alguien adivine una URL, no puede deducir las de otra liga.
      const nombre = `${equipo.ligaId}-${randomUUID()}${extension}`;
      await writeFile(path.join(DIR_SUBIDAS, nombre), bytes);

      // Se borra el escudo anterior para que la carpeta no crezca sin control.
      const anterior = equipo.escudoUrl?.split('/').pop();
      if (anterior) await unlink(path.join(DIR_SUBIDAS, anterior)).catch(() => {});

      return prisma.equipo.update({
        where: { id: equipo.id },
        data: { escudoUrl: `/subidas/${nombre}` },
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/equipos/:id/escudo',
    { preHandler: app.autenticar },
    async (req, reply) => {
      const equipo = await prisma.equipo.findFirst({
        where: { id: req.params.id, ligaId: req.user.ligaId },
      });
      if (!equipo) return reply.code(404).send({ error: 'Equipo no encontrado' });
      if (req.user.rol !== 'ADMIN' && equipo.encargadoId !== req.user.sub) {
        return reply.code(403).send({ error: 'Solo puedes editar tu propio equipo' });
      }

      const archivo = equipo.escudoUrl?.split('/').pop();
      if (archivo) await unlink(path.join(DIR_SUBIDAS, archivo)).catch(() => {});

      await prisma.equipo.update({ where: { id: equipo.id }, data: { escudoUrl: null } });
      return reply.code(204).send();
    },
  );
};
