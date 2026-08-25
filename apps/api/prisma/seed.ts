import 'dotenv/config';
import { PrismaClient, Posicion } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const REGLAS_DEFAULT = {
  puntosVictoria: 3,
  puntosEmpate: 1,
  puntosDerrota: 0,
  puntosDefault: 3,
  golesDefault: 3,
  desempates: ['DIFERENCIA_GOLES', 'GOLES_FAVOR', 'ENFRENTAMIENTO_DIRECTO'],
};

const NOMBRES = [
  'Miguel Ángel Ruiz',
  'Jorge Luis Ramírez',
  'Carlos Alberto Mena',
  'Diego Armando Sosa',
  'Luis Fernando Ortiz',
  'Juan Pablo Herrera',
  'Óscar Iván Delgado',
  'Ricardo Nájera',
  'Sergio Alonso Vidal',
  'Emilio Cárdenas',
  'Andrés Felipe Rojas',
  'Hugo Barrera',
  'Iván Montoya',
  'Raúl Espinoza',
  'Marco Antonio Lira',
  'Fernando Quiroz',
];

const POSICIONES: Posicion[] = [
  'PORTERO',
  'DEFENSA',
  'DEFENSA',
  'DEFENSA',
  'MEDIO',
  'MEDIO',
  'MEDIO',
  'DELANTERO',
  'DELANTERO',
  'DELANTERO',
  'MEDIO',
  'DEFENSA',
  'PORTERO',
  'DELANTERO',
  'MEDIO',
  'DEFENSA',
];

/** Round-robin (algoritmo del círculo). Devuelve jornadas con pares [local, visitante]. */
function calendarioRoundRobin<T>(equipos: T[]): [T, T][][] {
  const lista = [...equipos];
  if (lista.length % 2 !== 0) lista.push(null as unknown as T); // bye
  const n = lista.length;
  const jornadas: [T, T][][] = [];
  for (let ronda = 0; ronda < n - 1; ronda++) {
    const pares: [T, T][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i]!;
      const b = lista[n - 1 - i]!;
      if (a && b) pares.push(ronda % 2 === 0 ? [a, b] : [b, a]);
    }
    jornadas.push(pares);
    // rotar dejando fijo el primero
    lista.splice(1, 0, lista.pop()!);
  }
  return jornadas;
}

async function main() {
  console.log('🌱 Limpiando datos previos...');
  await prisma.partido.deleteMany();
  await prisma.jornada.deleteMany();
  await prisma.jugador.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.temporada.deleteMany();
  await prisma.division.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.liga.deleteMany();

  console.log('🏆 Creando liga (tenant)...');
  const liga = await prisma.liga.create({
    data: { nombre: 'Liga Demo', slug: 'demo', config: {} },
  });

  console.log('👤 Creando usuarios...');
  const hash = await bcrypt.hash('Password123', 10);
  const admin = await prisma.usuario.create({
    data: {
      ligaId: liga.id,
      email: 'admin@liga.mx',
      passwordHash: hash,
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  });
  const encargados = await Promise.all(
    [1, 2, 3, 4].map((i) =>
      prisma.usuario.create({
        data: {
          ligaId: liga.id,
          email: `encargado${i}@liga.mx`,
          passwordHash: hash,
          nombre: `Encargado ${i}`,
          rol: 'ENCARGADO',
        },
      }),
    ),
  );

  console.log('📂 Creando divisiones...');
  const divisiones = await Promise.all(
    [
      { nombre: 'Primera Varonil', orden: 1 },
      { nombre: 'Segunda Varonil', orden: 2 },
      { nombre: 'Femenil', orden: 3 },
    ].map((d) => prisma.division.create({ data: { ...d, ligaId: liga.id } })),
  );
  const primera = divisiones[0]!;

  console.log('📅 Creando temporada...');
  const temporada = await prisma.temporada.create({
    data: {
      ligaId: liga.id,
      divisionId: primera.id,
      nombre: 'Apertura 2026',
      fechaInicio: new Date('2026-09-06'),
      fechaFin: new Date('2026-12-13'),
      activa: true,
      reglasPuntuacion: REGLAS_DEFAULT,
    },
  });

  console.log('⚽ Creando equipos y jugadores...');
  const nombresEquipos = [
    'Deportivo Norte',
    'Águilas FC',
    'Real Progreso',
    'Atlético Centro',
    'Halcones Unidos',
    'Club Libertad',
  ];
  const equipos = [];
  for (const [i, nombre] of nombresEquipos.entries()) {
    const equipo = await prisma.equipo.create({
      data: {
        ligaId: liga.id,
        temporadaId: temporada.id,
        nombre,
        estatus: 'ACTIVO',
        encargadoId: encargados[i]?.id ?? null,
      },
    });
    await prisma.jugador.createMany({
      data: Array.from({ length: 12 }, (_, j) => ({
        ligaId: liga.id,
        equipoId: equipo.id,
        nombre: `${NOMBRES[(i * 12 + j) % NOMBRES.length]}`,
        numero: j + 1,
        posicion: POSICIONES[j % POSICIONES.length]!,
        estatus: 'ACTIVO' as const,
      })),
    });
    equipos.push(equipo);
  }

  console.log('🗓  Generando calendario round-robin...');
  const rondas = calendarioRoundRobin(equipos);
  const inicio = new Date('2026-09-06T10:00:00');
  const canchas = ['Cancha 1', 'Cancha 2', 'Cancha 3'];

  for (const [r, pares] of rondas.entries()) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + r * 7);
    const jornada = await prisma.jornada.create({
      data: { ligaId: liga.id, temporadaId: temporada.id, numero: r + 1, fecha },
    });

    for (const [p, [local, visitante]] of pares.entries()) {
      const fechaHora = new Date(fecha);
      fechaHora.setHours(10 + p * 2);
      // Las primeras 3 jornadas ya tienen resultado; el resto quedan programadas
      const jugado = r < 3;
      await prisma.partido.create({
        data: {
          ligaId: liga.id,
          jornadaId: jornada.id,
          localId: local.id,
          visitanteId: visitante.id,
          cancha: canchas[p % canchas.length]!,
          fechaHora,
          estado: jugado ? 'FINALIZADO' : 'PROGRAMADO',
          golesLocal: jugado ? Math.floor(Math.random() * 5) : null,
          golesVisitante: jugado ? Math.floor(Math.random() * 4) : null,
          capturadoPorId: jugado ? admin.id : null,
          capturadoEn: jugado ? new Date() : null,
        },
      });
    }
  }

  const totales = {
    liga: liga.nombre,
    usuarios: await prisma.usuario.count(),
    divisiones: await prisma.division.count(),
    equipos: await prisma.equipo.count(),
    jugadores: await prisma.jugador.count(),
    jornadas: await prisma.jornada.count(),
    partidos: await prisma.partido.count(),
  };

  console.log('\n✅ Seed completo:', totales);
  console.log('\n🔑 Credenciales de prueba (liga slug: "demo"):');
  console.log('   ADMIN      admin@liga.mx        / Password123');
  console.log('   ENCARGADO  encargado1@liga.mx   / Password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
