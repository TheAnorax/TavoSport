/**
 * Iconos en línea (sin dependencias). Trazo de 1.75 para que se lean bien a 16px.
 * Todos heredan color con `currentColor`.
 */
type Props = { size?: number; className?: string };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

export const IconoEditar = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const IconoBorrar = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconoMas = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconoCerrar = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconoBalon = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7 3.5 2.5-1.3 4.1H9.8L8.5 9.5 12 7Z" />
    <path d="M12 3v4M4.2 9.5l4.3 0M19.8 9.5l-4.3 0M7.8 20l2-6.4M16.2 20l-2-6.4" />
  </svg>
);

export const IconoSilbato = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M3 12a5 5 0 0 0 10 0h8l-2 4a4 4 0 0 1-3.6 2.2H8A5 5 0 0 1 3 13Z" />
    <circle cx="8" cy="12" r="1.5" />
  </svg>
);

export const IconoCalendario = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconoTabla = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const IconoEscudo = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z" />
  </svg>
);

export const IconoEngrane = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </svg>
);

export const IconoInicio = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M9 21v-7h6v7" />
  </svg>
);

export const IconoAbrir = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M15 3h6v6M21 3l-9 9" />
    <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </svg>
);

export const IconoRayo = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const IconoSalir = ({ size = 16, className }: Props) => (
  <svg {...base(size, className)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
);
