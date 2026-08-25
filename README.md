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

**Credenciales del seed** — liga `demo`:

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

## Configuración por liga

`Liga.config` (JSON, validado por `configLigaSchema`) — editable desde **Configuración** en la UI:

| Ajuste | Default | Qué hace |
|---|---|---|
| `permitirCapturaEncargado` | `true` | Si es `false`, solo el ADMIN captura resultados |
| `horasParaCorregir` | `48` | Plazo del encargado para corregir un marcador. `0` = solo el ADMIN corrige |
| `contacto` | — | Contacto del organizador |

El plazo se cuenta **desde la hora del partido**, no desde la captura: así no se
reinicia cada vez que alguien edita. El ADMIN nunca tiene límite.

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
| CRUD | `/api/jornadas` | autenticado · ADMIN para escribir |
| CRUD | `/api/partidos` | autenticado · ADMIN para escribir |
| POST | `/api/calendario/generar` | ADMIN — round-robin automático |
| PUT · DELETE | `/api/partidos/:id/resultado` | ADMIN o encargado de un equipo del partido |
| GET | `/api/temporadas/:id/posiciones` | autenticado |
| GET | `/api/publico/:slug` | **sin login** |
| GET | `/api/publico/:slug/temporadas/:id/posiciones` | **sin login** |
| GET | `/api/publico/:slug/temporadas/:id/jornadas` | **sin login** |
| GET | `/api/dashboard` | autenticado |
| DELETE | `/api/temporadas/:id` | ADMIN — bloqueado si hay resultados |
| POST · DELETE | `/api/equipos/:id/escudo` | ADMIN o encargado del equipo |

## Estado del plan

- [x] Sesión 1 — monorepo, schema, auth, CRUD equipos/jugadores
- [x] Sesión 2 — jornadas, partidos, generador de calendario, asignación de encargados
- [x] Sesión 3 — captura de resultados, tabla de posiciones y vista pública · **MVP demo-able**
- [x] Sesión 4 — ventana de corrección configurable, dashboard y bitácora de capturas
- [x] Sesión 5 — alta de divisiones y temporadas, escudos, estados vacíos
- [ ] Sesión 6 — deploy
- [ ] Sesión 7 — cierre

## Reglas de negocio ya aplicadas

- Un equipo no juega contra sí mismo ni dos veces en la misma jornada.
- Los dos equipos de un partido deben pertenecer a la temporada de esa jornada.
- No se borra una jornada ni un partido con resultado ya capturado.
- El generador de calendario es transaccional: o crea todo, o no crea nada.
- No se repite el dorsal dentro de un mismo equipo.
- Un encargado solo captura resultados de partidos donde juega su equipo.
- Toda captura registra `capturadoPor` y `capturadoEn`.
- La tabla de posiciones se deriva de los partidos FINALIZADOS en cada consulta: no hay estado que se desincronice.

## Escudos

Se suben a `apps/api/subidas/` y se sirven en `/subidas/…`. Máximo 1 MB; PNG, JPG, WEBP o SVG.
El nombre del archivo lleva el `ligaId` como prefijo y un UUID. Al reemplazar un escudo se borra el anterior.

> [!warning] Antes del deploy
> En Railway y Render el disco es efímero: **los escudos desaparecen en cada deploy**
> salvo que se contrate un volumen persistente. Si se va a hosting gestionado sin volumen,
> hay que mover esto a un servicio de imágenes. En un VPS con disco propio no hay problema.

## Tests

```bash
pnpm test    # 25 tests: posiciones, round-robin y config de liga
```

Cubren puntuación configurable, los cinco criterios de desempate, invariantes
(GF total = GC total, diferencia total = 0) y las propiedades del round-robin.
