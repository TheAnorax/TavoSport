# Plataforma Liga de Fútbol

Monorepo TypeScript multi-tenant para administrar ligas de fútbol.
Stack: **React + Vite + Tailwind** · **Fastify + Prisma + PostgreSQL** · tipos y validaciones compartidos con **Zod**.

## Arranque (una sola vez)

```bash
bash arranque.sh
```

Eso crea `liga_dev`, instala dependencias, genera el cliente Prisma, aplica la migración inicial y siembra datos de prueba.

## Día a día

```bash
pnpm dev          # API (3000) + Web (5173) en paralelo
pnpm dev:api
pnpm dev:web
pnpm db:studio    # explorador visual de la BD
pnpm db:reset     # borra y recrea la BD + seed
```

**Credenciales del seed** — liga `santul`:

| Rol | Email | Password |
|---|---|---|
| ADMIN | admin@liga.mx | Password123 |
| ENCARGADO | encargado1@liga.mx | Password123 |

## Estructura

```
apps/
  api/                 Fastify + Prisma
    prisma/schema.prisma   modelo de datos (fuente de verdad)
    prisma/seed.ts         datos de prueba + calendario round-robin
    src/plugins/auth.ts    JWT + middleware de roles
    src/routes/            auth · catalogo · equipos
  web/                 React + Vite + Tailwind
    src/lib/             cliente API, sesión, tipos de UI
    src/paginas/         Login, Inicio, Equipos, EquipoDetalle, Temporadas
    src/componentes/     Layout, RutaProtegida, Modal
packages/
  shared/              enums, reglas de puntuación y esquemas Zod (front + back)
```

## Multi-tenant

`Liga` es la raíz del tenant y **toda** tabla operativa lleva `ligaId`.
El JWT carga `ligaId`; cada query del API filtra por él. Una instalación sirve a N ligas.

## Reglas de puntuación

Viven en `Temporada.reglasPuntuacion` (JSON), validadas por `reglasPuntuacionSchema`.
Cada liga define puntos por victoria/empate/derrota y el orden de los criterios de desempate
sin tocar código.

## API (v1)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/login` | público |
| GET | `/api/auth/yo` | autenticado |
| POST · GET | `/api/auth/usuarios` | ADMIN |
| GET · PATCH | `/api/liga` | autenticado · ADMIN |
| CRUD | `/api/divisiones` | ADMIN |
| GET · POST · PATCH | `/api/temporadas` | autenticado · ADMIN |
| CRUD | `/api/equipos` | ADMIN (encargado edita el suyo) |
| CRUD | `/api/jugadores` | ADMIN o encargado del equipo |

## Estado del plan

- [x] Sesión 1 — monorepo, schema, auth, CRUD equipos/jugadores
- [ ] Sesión 2 — jornadas y partidos
- [ ] Sesión 3 — resultados y tabla de posiciones (MVP demo-able)
