import { describe, it, expect } from 'vitest';
import { generarRoundRobin } from '../roundRobin.js';

const equipos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `e${i + 1}` }));

describe('generarRoundRobin', () => {
  it('con N par genera N-1 jornadas de N/2 partidos', () => {
    const r = generarRoundRobin(equipos(6));
    expect(r).toHaveLength(5);
    expect(r.every((j) => j.length === 3)).toBe(true);
  });

  it('con N impar genera N jornadas y un equipo descansa cada una', () => {
    const r = generarRoundRobin(equipos(5));
    expect(r).toHaveLength(5);
    expect(r.every((j) => j.length === 2)).toBe(true);
  });

  it('cada par de equipos se enfrenta exactamente una vez', () => {
    const r = generarRoundRobin(equipos(6));
    const vistos = new Set<string>();
    for (const jornada of r) {
      for (const [l, v] of jornada) {
        const clave = [l.id, v.id].sort().join('-');
        expect(vistos.has(clave)).toBe(false);
        vistos.add(clave);
      }
    }
    expect(vistos.size).toBe(15); // C(6,2)
  });

  it('ningún equipo juega dos veces en la misma jornada', () => {
    for (const jornada of generarRoundRobin(equipos(8))) {
      const ids = jornada.flatMap(([l, v]) => [l.id, v.id]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ida y vuelta duplica las jornadas e invierte la localía', () => {
    const solaIda = generarRoundRobin(equipos(4));
    const completo = generarRoundRobin(equipos(4), true);
    expect(completo).toHaveLength(solaIda.length * 2);

    const [l, v] = solaIda[0]![0]!;
    const [l2, v2] = completo[solaIda.length]![0]!;
    expect(l2.id).toBe(v.id);
    expect(v2.id).toBe(l.id);
  });

  it('devuelve vacío con menos de 2 equipos', () => {
    expect(generarRoundRobin(equipos(1))).toEqual([]);
    expect(generarRoundRobin([])).toEqual([]);
  });
});
