import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { IconoCerrar } from './Iconos';

/**
 * Diálogo modal.
 * Se monta con portal en <body>: si viviera dentro del layout, cualquier ancestro
 * con transform o filter lo recortaría y el encabezado quedaría sin oscurecer.
 * Cierra con Escape y bloquea el scroll de fondo mientras está abierto.
 */
export default function Modal({
  titulo,
  descripcion,
  abierto,
  onCerrar,
  children,
  ancho = 'md',
}: {
  titulo: string;
  descripcion?: string;
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = scrollPrevio;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const anchos = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto
                 bg-pizarra-950/50 p-0 backdrop-blur-sm animate-aparecer sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // Solo cierra si el clic empezó en el fondo, no al arrastrar desde dentro.
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`vidrio w-full ${anchos[ancho]} animate-entrada rounded-t-3xl bg-white/90 p-6
                    sm:rounded-2xl`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-slate-900">{titulo}</h2>
            {descripcion && <p className="ayuda">{descripcion}</p>}
          </div>
          <button
            onClick={onCerrar}
            className="btn-icono shrink-0"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
