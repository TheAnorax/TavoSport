#!/usr/bin/env bash
# Arranque de la Sesión 1 — Plataforma Liga
# Uso:  bash ~/Documents/Claude/Projects/liga/arranque.sh
set -e
cd "$(dirname "$0")"

echo "==> 1/6  Creando base de datos liga_dev (si no existe)"
createdb liga_dev 2>/dev/null && echo "    creada" || echo "    ya existía, ok"

echo "==> 2/6  Instalando dependencias (pnpm install)"
pnpm install

echo "==> 3/6  Compilando binarios nativos (Prisma / esbuild)"
pnpm rebuild

echo "==> 4/6  Generando cliente Prisma"
pnpm db:generate

echo "==> 5/6  Aplicando migración inicial"
pnpm --filter @liga/api exec prisma migrate dev --name init

echo "==> 6/6  Sembrando datos de prueba"
pnpm db:seed

echo ""
echo "======================================================"
echo " LISTO. Ahora corre:   pnpm dev"
echo "   API  -> http://localhost:3000/salud"
echo "   Web  -> http://localhost:5173"
echo "   Login: admin@liga.mx / Password123   (liga: demo)"
echo "======================================================"
