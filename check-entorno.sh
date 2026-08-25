#!/usr/bin/env bash
# Diagnóstico de entorno — Plataforma Liga
# Uso:  bash check-entorno.sh

echo "==============================================="
echo "  DIAGNOSTICO DE ENTORNO - Plataforma Liga"
echo "==============================================="
echo ""

ok()   { printf "  [OK]    %s\n" "$1"; }
bad()  { printf "  [FALTA] %s\n" "$1"; }
warn() { printf "  [AVISO] %s\n" "$1"; }

# --- 1. Node ---
echo "1) Node.js (OBLIGATORIO, se requiere v20 o superior)"
if command -v node >/dev/null 2>&1; then
  V=$(node -v)
  MAJOR=$(echo "$V" | sed 's/v//' | cut -d. -f1)
  if [ "$MAJOR" -ge 20 ]; then ok "node $V"; else bad "node $V — necesitas v20+"; fi
else
  bad "node no instalado  ->  brew install node   (o https://nodejs.org)"
fi
echo ""

# --- 2. pnpm ---
echo "2) pnpm (gestor del monorepo)"
if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm $(pnpm -v)"
else
  bad "pnpm no instalado  ->  corepack enable && corepack prepare pnpm@latest --activate"
fi
echo ""

# --- 3. Git ---
echo "3) Git (control de versiones)"
if command -v git >/dev/null 2>&1; then
  ok "$(git --version)"
else
  bad "git no instalado  ->  xcode-select --install"
fi
echo ""

# --- 4. PostgreSQL ---
echo "4) PostgreSQL (OBLIGATORIO, se recomienda v14+)"
if command -v psql >/dev/null 2>&1; then
  ok "cliente: $(psql --version)"
else
  bad "psql no encontrado  ->  brew install postgresql@16"
fi

echo "   Probando conexion al servidor..."
if command -v pg_isready >/dev/null 2>&1; then
  if pg_isready -q 2>/dev/null; then
    ok "servidor Postgres respondiendo en localhost:5432"
  else
    warn "servidor NO responde  ->  brew services start postgresql@16"
  fi
else
  warn "pg_isready no disponible; no se pudo probar el servidor"
fi

echo "   Probando login con tu usuario del sistema ($USER)..."
if command -v psql >/dev/null 2>&1; then
  if psql -U "$USER" -d postgres -c "select version();" >/dev/null 2>&1; then
    ok "login OK como '$USER' sin password"
    echo "        DATABASE_URL sugerida:"
    echo "        postgresql://$USER@localhost:5432/liga_dev?schema=public"
  else
    warn "no se pudo entrar como '$USER'. Necesito que me digas usuario/password de Postgres."
  fi
fi
echo ""

# --- 5. Extras informativos ---
echo "5) Opcionales (NO son requisito)"
command -v docker >/dev/null 2>&1 && ok "docker $(docker -v 2>/dev/null | cut -d, -f1)" || warn "docker no instalado (no hace falta: usaremos tu Postgres local)"
echo ""
echo "==============================================="
echo "Copia y pega TODO este resultado en el chat."
echo "==============================================="
