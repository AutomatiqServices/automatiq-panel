/**
 * Los motivos por los que un comercial descarta un lead.
 *
 * Viven aquí y no en cada pestaña porque los escriben los comerciales y los lee
 * el CEO: si las etiquetas divergen, el recuento del panel interno deja de
 * significar lo que el comercial creía estar marcando. Las claves son las
 * mismas que valida el CHECK de `prospectos.motivo_descarte`.
 */
export const MOTIVOS_DESCARTE = [
  { valor: 'no_contesta', etiqueta: 'No contesta / ilocalizable' },
  { valor: 'fuera_territorio', etiqueta: 'No es mi territorio' },
  { valor: 'sin_presupuesto', etiqueta: 'Sin presupuesto' },
  { valor: 'ya_tiene', etiqueta: 'Ya tiene el servicio' },
  { valor: 'no_interesa', etiqueta: 'No le interesa' },
  { valor: 'datos_erroneos', etiqueta: 'Empresa cerrada / datos erróneos' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const

export type MotivoDescarte = (typeof MOTIVOS_DESCARTE)[number]['valor']

/** El motivo pide nota obligatoria: sin ella "otro" no explica nada. */
export const MOTIVO_EXIGE_NOTA: MotivoDescarte = 'otro'

const ETIQUETAS: Record<string, string> = {
  ...Object.fromEntries(MOTIVOS_DESCARTE.map((m) => [m.valor, m.etiqueta])),
  // Descartes anteriores a que el motivo existiera. La RPC los agrupa así.
  sin_motivo: 'Sin motivo registrado',
}

export function etiquetaMotivo(valor: string | null): string {
  if (!valor) return ETIQUETAS.sin_motivo
  return ETIQUETAS[valor] ?? valor
}
