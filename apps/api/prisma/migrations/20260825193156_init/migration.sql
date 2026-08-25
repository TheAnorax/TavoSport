-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ENCARGADO', 'PUBLICO');

-- CreateEnum
CREATE TYPE "EstatusEquipo" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstatusJugador" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoPartido" AS ENUM ('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'SUSPENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Posicion" AS ENUM ('PORTERO', 'DEFENSA', 'MEDIO', 'DELANTERO');

-- CreateTable
CREATE TABLE "liga" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ENCARGADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "division" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporada" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "reglasPuntuacion" JSONB NOT NULL DEFAULT '{}',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipo" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "escudoUrl" TEXT,
    "estatus" "EstatusEquipo" NOT NULL DEFAULT 'ACTIVO',
    "encargadoId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jugador" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "posicion" "Posicion",
    "estatus" "EstatusJugador" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jugador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornada" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jornada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partido" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "visitanteId" TEXT NOT NULL,
    "cancha" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPartido" NOT NULL DEFAULT 'PROGRAMADO',
    "golesLocal" INTEGER,
    "golesVisitante" INTEGER,
    "capturadoPorId" TEXT,
    "capturadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liga_slug_key" ON "liga"("slug");

-- CreateIndex
CREATE INDEX "usuario_ligaId_idx" ON "usuario"("ligaId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_ligaId_email_key" ON "usuario"("ligaId", "email");

-- CreateIndex
CREATE INDEX "division_ligaId_idx" ON "division"("ligaId");

-- CreateIndex
CREATE UNIQUE INDEX "division_ligaId_nombre_key" ON "division"("ligaId", "nombre");

-- CreateIndex
CREATE INDEX "temporada_ligaId_idx" ON "temporada"("ligaId");

-- CreateIndex
CREATE INDEX "temporada_divisionId_idx" ON "temporada"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "temporada_divisionId_nombre_key" ON "temporada"("divisionId", "nombre");

-- CreateIndex
CREATE INDEX "equipo_ligaId_idx" ON "equipo"("ligaId");

-- CreateIndex
CREATE INDEX "equipo_temporadaId_idx" ON "equipo"("temporadaId");

-- CreateIndex
CREATE INDEX "equipo_encargadoId_idx" ON "equipo"("encargadoId");

-- CreateIndex
CREATE UNIQUE INDEX "equipo_temporadaId_nombre_key" ON "equipo"("temporadaId", "nombre");

-- CreateIndex
CREATE INDEX "jugador_ligaId_idx" ON "jugador"("ligaId");

-- CreateIndex
CREATE INDEX "jugador_equipoId_idx" ON "jugador"("equipoId");

-- CreateIndex
CREATE UNIQUE INDEX "jugador_equipoId_numero_key" ON "jugador"("equipoId", "numero");

-- CreateIndex
CREATE INDEX "jornada_ligaId_idx" ON "jornada"("ligaId");

-- CreateIndex
CREATE INDEX "jornada_temporadaId_idx" ON "jornada"("temporadaId");

-- CreateIndex
CREATE UNIQUE INDEX "jornada_temporadaId_numero_key" ON "jornada"("temporadaId", "numero");

-- CreateIndex
CREATE INDEX "partido_ligaId_idx" ON "partido"("ligaId");

-- CreateIndex
CREATE INDEX "partido_jornadaId_idx" ON "partido"("jornadaId");

-- CreateIndex
CREATE INDEX "partido_localId_idx" ON "partido"("localId");

-- CreateIndex
CREATE INDEX "partido_visitanteId_idx" ON "partido"("visitanteId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "division" ADD CONSTRAINT "division_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporada" ADD CONSTRAINT "temporada_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporada" ADD CONSTRAINT "temporada_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "temporada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_encargadoId_fkey" FOREIGN KEY ("encargadoId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jugador" ADD CONSTRAINT "jugador_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jugador" ADD CONSTRAINT "jugador_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornada" ADD CONSTRAINT "jornada_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornada" ADD CONSTRAINT "jornada_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "temporada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partido" ADD CONSTRAINT "partido_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "liga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partido" ADD CONSTRAINT "partido_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "jornada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partido" ADD CONSTRAINT "partido_localId_fkey" FOREIGN KEY ("localId") REFERENCES "equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partido" ADD CONSTRAINT "partido_visitanteId_fkey" FOREIGN KEY ("visitanteId") REFERENCES "equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partido" ADD CONSTRAINT "partido_capturadoPorId_fkey" FOREIGN KEY ("capturadoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
