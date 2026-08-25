# Guía para desarrolladores

Cómo levantar el proyecto y cómo está organizado por dentro.

---

## Requisitos

| Herramienta | Versión    | Nota                                                         |
| ----------- | ---------- | ------------------------------------------------------------ |
| Node.js     | 20+        | Obligatorio                                                  |
| pnpm        | 10+        | `corepack enable && corepack prepare pnpm@latest --activate` |
| PostgreSQL  | 14+        | Corriendo en local                                           |
| Git         | cualquiera |                                                              |

Docker no hace falta.

---

## Primer arranque

```bash
git clone https://github.com/TheAnorax/TavoSport.git
cd TavoSport
cp apps/api/.env.example apps/api/.env   # ajusta DATABASE_URL con tu usuario de Postgres
bash arranque.sh
```

`arranque.sh` crea la base `liga_dev`, instala dependencias, genera el cliente Prisma,
aplica la migración inicial y siembra datos de prueba.

Luego:

```bash
pnpm dev     # API en :3000 y web en :5173
```

Credenciales del seed — liga `demo`: `admin@liga.mx` / `Password123`.

> **Nota sobre pnpm 11:** bloquea los postinstall de dependencias por seguridad.
> Los permisos necesarios (Prisma, esbuild) están declarados en `allowBuilds`
> dentro de `pnpm-workspace.yaml`. Si ves `ERR_PNPM_IGNORED_BUILDS`, corre `pnpm rebuild`.

---

## Comandos

```bash
pnpm dev            # API + web en paralelo
pnpm dev:api        # solo API
pnpm dev:web        # solo web
pnpm test           # tests unitarios
pnpm -r typecheck   # TypeScript en los tres paquetes
pnpm format         # Prettier
pnpm build          # bundle de producción
pnpm db:studio      # explorador visual de la base
pnpm db:reset       # borra y recrea la base + seed
pnpm db:migrate     # nueva migración tras cambiar el schema
```

---

## Cómo está organizado

```
apps/api        Fastify + Prisma
apps/web        React + Vite + Tailwind
packages/shared Tipos, esquemas Zod y lógica pura compartida
```

`packages/shared` es el contrato entre front y back. **Cualquier cambio de forma
de datos empieza ahí.** Contiene también la lógica que no toca la base:
cálculo de posiciones, generador de calendario y validación de configuración.
Por ser pura, es la parte que sí tiene tests.

---

## Decisiones que conviene entender antes de tocar el código

**Multi-tenant desde el día uno.** `Liga` es la raíz y toda tabla operativa lleva `ligaId`.
El JWT carga el `ligaId` y cada consulta filtra por él. Nunca escribas una query
sin ese filtro: es lo que sostiene el aislamiento entre clientes.

**La tabla de posiciones no existe como tabla.** Se calcula desde los partidos
finalizados en cada consulta (`apps/api/src/lib/tabla.ts` → `calcularPosiciones`).
Guardarla obligaría a mantenerla sincronizada y ahí es donde aparecen los bugs.

**Las reglas viven en JSON, no en el código.** Puntuación y desempates en
`Temporada.reglasPuntuacion`; plazos y permisos en `Liga.config`. Cada liga cliente
ajusta lo suyo sin desplegar nada.

**El API se empaqueta con tsup, no con tsc.** `@liga/shared` es TypeScript sin compilar:
`tsc` a secas genera un bundle que intenta importar `.ts` en runtime y no arranca.
`tsup` lo mete dentro del bundle; Prisma queda fuera por sus binarios nativos.

---

## Flujo de trabajo

1. Rama por tarea: `git checkout -b feat/goleadores`
2. Antes de subir: `pnpm format && pnpm -r typecheck && pnpm test`
3. Pull request contra `main`. El CI corre formato, typecheck, tests y build.

El CI levanta un Postgres limpio, así que detecta lo que solo funcionaba en tu máquina.

---

## Agregar una entidad nueva

1. Modelo en `apps/api/prisma/schema.prisma` **con `ligaId`**
2. `pnpm db:migrate`
3. Esquemas Zod en `packages/shared/src/schemas.ts`
4. Rutas en `apps/api/src/routes/`, siempre filtrando por `req.user.ligaId`
5. Pantalla en `apps/web/src/paginas/` y ruta en `App.tsx`
6. Si hay lógica de cálculo, va en `packages/shared` **con tests**

---

## Trampas conocidas

- **Escudos en disco.** Viven en `apps/api/subidas/`. En hosting con disco efímero
  (Railway, Render sin volumen) desaparecen en cada deploy.
- **`.env` no se versiona.** Cada quien mantiene el suyo a partir de `.env.example`.
- **`JWT_SECRET` de desarrollo.** Debe ser distinto y aleatorio en producción.
- **Alta de usuarios encargados.** Todavía solo existe por API (`POST /api/auth/usuarios`),
  no en la interfaz.
