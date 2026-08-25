import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // @liga/shared es TypeScript sin compilar: se empaqueta dentro del bundle.
  // Sin esto, el server compilado intentaría importar .ts en runtime y reventaría.
  noExternal: ['@liga/shared'],
  // Prisma trae binarios nativos: se deja fuera y se resuelve desde node_modules.
  external: ['@prisma/client', '.prisma/client'],
});
