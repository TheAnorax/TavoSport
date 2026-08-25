import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'Falta DATABASE_URL en apps/api/.env'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
