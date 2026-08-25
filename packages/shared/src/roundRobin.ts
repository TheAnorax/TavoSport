/**
 * Calendario round-robin (algoritmo del círculo).
 * Con N equipos genera N-1 jornadas (o N si N es impar, con descanso).
 * Alterna la localía por ronda para repartir partidos en casa.
 */
export function generarRoundRobin<T>(equipos: T[], idaYVuelta = false): [T, T][][] {
  if (equipos.length < 2) return [];

  const lista: (T | null)[] = [...equipos];
  if (lista.length % 2 !== 0) lista.push(null); // descanso
  const n = lista.length;

  const ida: [T, T][][] = [];
  for (let ronda = 0; ronda < n - 1; ronda++) {
    const pares: [T, T][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i];
      const b = lista[n - 1 - i];
      if (a && b) pares.push(ronda % 2 === 0 ? [a, b] : [b, a]);
    }
    ida.push(pares);
    lista.splice(1, 0, lista.pop()!); // rotar dejando fijo el primero
  }

  if (!idaYVuelta) return ida;
  const vuelta = ida.map((pares) => pares.map(([l, v]) => [v, l] as [T, T]));
  return [...ida, ...vuelta];
}
