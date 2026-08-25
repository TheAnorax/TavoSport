import { describe, it, expect } from 'vitest';
import { leerConfigLiga, ventanaAbierta, CONFIG_DEFAULT } from '../configLiga.js';

describe('leerConfigLiga', () => {
  it('cae al default si el JSON guardado es basura', () => {
    expect(leerConfigLiga(null)).toEqual(CONFIG_DEFAULT);
    expect(leerConfigLiga('no soy un objeto')).toEqual(CONFIG_DEFAULT);
    expect(leerConfigLiga({ horasParaCorregir: -5 })).toEqual(CONFIG_DEFAULT);
  });

  it('rellena lo que falta y respeta lo que sí viene', () => {
    const c = leerConfigLiga({ horasParaCorregir: 12 });
    expect(c.horasParaCorregir).toBe(12);
    expect(c.permitirCapturaEncargado).toBe(true);
  });

  it('usa 48 horas por defecto', () => {
    expect(CONFIG_DEFAULT.horasParaCorregir).toBe(48);
  });
});

describe('ventanaAbierta', () => {
  const partido = new Date('2026-09-06T10:00:00Z');
  const mas = (h: number) => new Date(partido.getTime() + h * 3_600_000);

  it('está abierta dentro del plazo', () => {
    expect(ventanaAbierta(partido, 48, mas(1))).toBe(true);
    expect(ventanaAbierta(partido, 48, mas(47.9))).toBe(true);
  });

  it('se cierra justo al pasar el plazo', () => {
    expect(ventanaAbierta(partido, 48, mas(48))).toBe(true);
    expect(ventanaAbierta(partido, 48, mas(48.1))).toBe(false);
  });

  it('con 0 horas nunca abre', () => {
    expect(ventanaAbierta(partido, 0, partido)).toBe(false);
  });

  it('se cuenta desde el partido, no desde la captura', () => {
    // Aunque se capture tardísimo, la ventana ya venció.
    expect(ventanaAbierta(partido, 2, mas(72))).toBe(false);
  });
});
