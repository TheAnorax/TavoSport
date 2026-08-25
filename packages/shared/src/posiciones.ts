import type { ReglasPuntuacion, CriterioDesempate } from './reglas.js';
import { REGLAS_DEFAULT } from './reglas.js';

/** Partido finalizado, reducido a lo mínimo que necesita el cálculo. */
export interface PartidoComputable {
  localId: string;
  visitanteId: string;
  golesLocal: number;
  golesVisitante: number;
}

export interface EquipoBase {
  id: string;
  nombre: string;
  escudoUrl?: string | null;
}

export interface FilaTabla {
  posicion: number;
  equipoId: string;
  equipoNombre: string;
  escudoUrl: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

function filaVacia(equipo: EquipoBase): Omit<FilaTabla, 'posicion'> {
  return {
    equipoId: equipo.id,
    equipoNombre: equipo.nombre,
    escudoUrl: equipo.escudoUrl ?? null,
    pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0,
  };
}

/**
 * Compara dos equipos por enfrentamiento directo (solo los partidos entre ellos).
 * Devuelve >0 si `b` va arriba, <0 si `a` va arriba, 0 si siguen empatados.
 */
function enfrentamientoDirecto(
  aId: string,
  bId: string,
  partidos: PartidoComputable[],
  reglas: ReglasPuntuacion,
): number {
  let ptsA = 0;
  let ptsB = 0;
  let golesA = 0;
  let golesB = 0;

  for (const p of partidos) {
    const esEntreEllos =
      (p.localId === aId && p.visitanteId === bId) || (p.localId === bId && p.visitanteId === aId);
    if (!esEntreEllos) continue;

    const [gA, gB] = p.localId === aId
      ? [p.golesLocal, p.golesVisitante]
      : [p.golesVisitante, p.golesLocal];

    golesA += gA;
    golesB += gB;
    if (gA > gB) { ptsA += reglas.puntosVictoria; ptsB += reglas.puntosDerrota; }
    else if (gA < gB) { ptsB += reglas.puntosVictoria; ptsA += reglas.puntosDerrota; }
    else { ptsA += reglas.puntosEmpate; ptsB += reglas.puntosEmpate; }
  }

  if (ptsA !== ptsB) return ptsB - ptsA;
  return golesB - golesA;
}

/**
 * Calcula la tabla general a partir de los partidos FINALIZADOS.
 * No consulta la base: es una función pura y por eso es testeable y siempre consistente.
 */
export function calcularPosiciones(
  equipos: EquipoBase[],
  partidos: PartidoComputable[],
  reglas: ReglasPuntuacion = REGLAS_DEFAULT,
): FilaTabla[] {
  const mapa = new Map<string, Omit<FilaTabla, 'posicion'>>();
  for (const eq of equipos) mapa.set(eq.id, filaVacia(eq));

  for (const p of partidos) {
    const local = mapa.get(p.localId);
    const visitante = mapa.get(p.visitanteId);
    if (!local || !visitante) continue; // partido de un equipo que ya no está en la tabla

    local.pj++; visitante.pj++;
    local.gf += p.golesLocal; local.gc += p.golesVisitante;
    visitante.gf += p.golesVisitante; visitante.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg++; local.pts += reglas.puntosVictoria;
      visitante.pp++; visitante.pts += reglas.puntosDerrota;
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.pg++; visitante.pts += reglas.puntosVictoria;
      local.pp++; local.pts += reglas.puntosDerrota;
    } else {
      local.pe++; visitante.pe++;
      local.pts += reglas.puntosEmpate; visitante.pts += reglas.puntosEmpate;
    }
  }

  for (const fila of mapa.values()) fila.dif = fila.gf - fila.gc;

  type Fila = Omit<FilaTabla, 'posicion'>;
  const criterio = (c: CriterioDesempate, a: Fila, b: Fila): number => {
    switch (c) {
      case 'DIFERENCIA_GOLES': return b.dif - a.dif;
      case 'GOLES_FAVOR': return b.gf - a.gf;
      case 'MENOS_GOLES_CONTRA': return a.gc - b.gc;
      case 'PARTIDOS_GANADOS': return b.pg - a.pg;
      case 'ENFRENTAMIENTO_DIRECTO': return enfrentamientoDirecto(a.equipoId, b.equipoId, partidos, reglas);
      case 'SORTEO': return 0;
    }
  };

  const filas: Fila[] = [...mapa.values()];

  filas.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    for (const c of reglas.desempates) {
      const r = criterio(c, a, b);
      if (r !== 0) return r;
    }
    // Último recurso estable: alfabético, para que la tabla no baile entre recargas.
    return a.equipoNombre.localeCompare(b.equipoNombre, 'es');
  });

  return filas.map((f, i) => ({ posicion: i + 1, ...f }));
}
