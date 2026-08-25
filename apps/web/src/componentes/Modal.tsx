import type { ReactNode } from 'react';

export default function Modal({
  titulo,
  abierto,
  onCerrar,
  children,
}: {
  titulo: string;
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
}) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
