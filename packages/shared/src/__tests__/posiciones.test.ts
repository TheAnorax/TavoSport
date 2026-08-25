import { describe, it, expect } from 'vitest';
import { calcularPosiciones } from '../posiciones.js';
import { reglasPuntuacionSchema, REGLAS_DEFAULT } from '../reglas.js';
import type { PartidoComputable, EquipoBase } from '../posiciones.js';

const equipos: EquipoBase[] = [
  { id: 'a', nombre: 'Alfa' },
  { id: 'b', nombre: 'Bravo' },
  { id: 'c', nombre: 'Charlie' },
];

const p = (l: string, v: string, gl: number, gv: number): PartidoComputable => ({
  localId: l,
  visitanteId: v,
  golesLocal: gl,
  golesVisitante: gv,
});

describe('calcularPosiciones', () => {
  it('arranca con todos en cero cuando no hay partidos', () => {
    const tabla = calcularPosiciones(equipos, []);
    expect(tabla).toHaveLength(3);
    expect(tabla.every((f) => f.pj === 0 && f.pts === 0)).toBe(true);
    // Sin datos, el orden es alfabético estable
    expect(tabla.map((f) => f.equipoNombre)).toEqual(['Alfa', 'Bravo', 'Charlie']);
  });

  it('cuenta victoria, empate y derrota con 3-1-0', () => {
    const tabla = calcularPosiciones(equipos, [p('a', 'b', 2, 0), p('b', 'c', 1, 1)]);
    const alfa = tabla.find((f) => f.equipoId === 'a')!;
    const bravo = tabla.find((f) => f.equipoId === 'b')!;
    const charlie = tabla.find((f) => f.equipoId === 'c')!;

    expect(alfa).toMatchObject({ pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dif: 2, pts: 3 });
    expect(bravo).toMatchObject({ pj: 2, pg: 0, pe: 1, pp: 1, gf: 1, gc: 3, dif: -2, pts: 1 });
    expect(charlie).toMatchObject({ pj: 1, pg: 0, pe: 1, pp: 0, gf: 1, gc: 1, dif: 0, pts: 1 });
  });

  it('ordena por puntos antes que por cualquier desempate', () => {
    const tabla = calcularPosiciones(equipos, [p('c', 'a', 1, 0), p('c', 'b', 1, 0)]);
    expect(tabla[0]!.equipoId).toBe('c');
    expect(tabla[0]!.posicion).toBe(1);
  });

  it('desempata por diferencia de goles', () => {
    // Alfa y Bravo terminan con 3 pts; Alfa ganó por más goles.
    const tabla = calcularPosiciones(equipos, [p('a', 'c', 5, 0), p('b', 'c', 1, 0)]);
    expect(tabla.map((f) => f.equipoId)).toEqual(['a', 'b', 'c']);
  });

  it('desempata por goles a favor cuando la diferencia es igual', () => {
    // Ambos +1 de diferencia, pero Bravo marcó más.
    const tabla = calcularPosiciones(equipos, [p('a', 'c', 1, 0), p('b', 'c', 3, 2)]);
    expect(tabla[0]!.equipoId).toBe('b');
  });

  it('respeta el enfrentamiento directo cuando así lo pide la liga', () => {
    const reglas = reglasPuntuacionSchema.parse({
      desempates: ['ENFRENTAMIENTO_DIRECTO', 'DIFERENCIA_GOLES'],
    });
    const cuatro: EquipoBase[] = [...equipos, { id: 'd', nombre: 'Delta' }];
    // Alfa y Bravo quedan idénticos en puntos, diferencia y goles a favor.
    // Lo único que los separa: Bravo le ganó a Alfa.
    const partidos = [
      p('b', 'a', 1, 0), // head-to-head: gana Bravo
      p('a', 'c', 1, 0), // Alfa suma 3 contra Charlie
      p('d', 'b', 1, 0), // Bravo pierde 3 contra Delta -> quedan igualados
    ];
    const tabla = calcularPosiciones(cuatro, partidos, reglas);
    const alfa = tabla.find((f) => f.equipoId === 'a')!;
    const bravo = tabla.find((f) => f.equipoId === 'b')!;

    expect(alfa.pts).toBe(bravo.pts);
    expect(alfa.dif).toBe(bravo.dif);
    expect(alfa.gf).toBe(bravo.gf);
    expect(bravo.posicion).toBeLessThan(alfa.posicion);
  });

  it('sin enfrentamiento directo entre ellos, el criterio no los reordena', () => {
    // Mismo escenario pero SIN el partido entre Alfa y Bravo:
    // el head-to-head no aporta nada y el desempate cae al siguiente criterio.
    const reglas = reglasPuntuacionSchema.parse({ desempates: ['ENFRENTAMIENTO_DIRECTO'] });
    const tabla = calcularPosiciones(equipos, [p('a', 'c', 1, 0)], reglas);
    expect(tabla[0]!.equipoId).toBe('a');
  });

  it('acepta reglas de puntuación distintas (2-1-0)', () => {
    const reglas = reglasPuntuacionSchema.parse({ puntosVictoria: 2 });
    const tabla = calcularPosiciones(equipos, [p('a', 'b', 1, 0)], reglas);
    expect(tabla.find((f) => f.equipoId === 'a')!.pts).toBe(2);
  });

  it('ignora partidos de equipos que ya no están en la tabla', () => {
    const tabla = calcularPosiciones([{ id: 'a', nombre: 'Alfa' }], [p('a', 'z', 3, 0)]);
    expect(tabla).toHaveLength(1);
    expect(tabla[0]!.pj).toBe(0);
  });

  it('la suma de goles a favor iguala la de goles en contra', () => {
    const partidos = [p('a', 'b', 2, 1), p('b', 'c', 0, 3), p('c', 'a', 1, 1)];
    const tabla = calcularPosiciones(equipos, partidos);
    const gf = tabla.reduce((s, f) => s + f.gf, 0);
    const gc = tabla.reduce((s, f) => s + f.gc, 0);
    expect(gf).toBe(gc);
    expect(tabla.reduce((s, f) => s + f.dif, 0)).toBe(0);
  });

  it('asigna posiciones consecutivas desde 1', () => {
    const tabla = calcularPosiciones(equipos, [p('a', 'b', 1, 0)]);
    expect(tabla.map((f) => f.posicion)).toEqual([1, 2, 3]);
  });

  it('usa 3-1-0 por defecto', () => {
    expect(REGLAS_DEFAULT.puntosVictoria).toBe(3);
    expect(REGLAS_DEFAULT.puntosEmpate).toBe(1);
    expect(REGLAS_DEFAULT.puntosDerrota).toBe(0);
  });
});
