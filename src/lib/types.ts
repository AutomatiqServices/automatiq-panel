export interface Perfil {
  id: string
  email: string
  rol: string
  nombre: string
}

export interface Seller {
  id: string
  name: string
  ref_code: string
  whatsapp: string | null
  email: string | null
}

export interface Carpeta {
  cliente_id: string
  nombre_empresa: string
  estado: string
  created_at: string
  diagnostico_estado: string | null
  diagnostico_precio: number | null
  diagnostico_pdf_url: string | null
  precio_fuera_de_rango: boolean
  comision_total: number
  comision_cobrada: number
  comision_pendiente: number
}

export interface RankingRow {
  seller_id: string
  name: string
  sales_count: number
  commission: number
}

export interface CalendarioMes {
  mes: string
  confirmado: number
  a_cobrar: number
}

export interface LinkPago {
  tipo: string
  etiqueta: string
  url: string | null
  monto: number | null
  pagado: boolean
  opcion: string | null
}

/** Cálculo de costos por nivel de Setup. Uso interno: no aparece en el PDF del cliente. */
export interface DesgloseNivel {
  nivel: string
  horas_implementacion: number
  tarifa_hora: number
  costos_recurrentes_mes: number
  horas_soporte_mes: number
  margen_aplicado: string
  precio_setup: number
  precio_mantenimiento: number
  justificacion_horas: string
}

export interface Desglose {
  niveles: DesgloseNivel[]
}

/** Precio fijado a mano por el equipo, que sustituye al que calculó la IA. */
export interface PrecioManual {
  nivel: string
  setup: number | null
  mantenimiento: number | null
}

/** Lo que WF-E1 guarda en diagnosticos.contenido_json (WF-E3 le suma el reprecio). */
export interface ContenidoDiagnostico {
  literal?: Record<string, string | null>
  html?: string
  /** HTML tal como lo redactó la IA, antes de tocar los precios a mano. */
  html_ia?: string
  desglose?: Desglose
  precios_manuales?: PrecioManual[]
  reprecio_en?: string
}

export interface DiagnosticoPendiente {
  diagnostico_id: string
  cliente_id: string
  nombre_empresa: string
  precio_final: number | null
  precio_fuera_de_rango: boolean
  respuestas_tally: unknown
  pdf_url: string | null
  contenido_json: ContenidoDiagnostico | null
  diag_estado: string
  cliente_estado: string
  created_at: string
}

export interface ResumenComercial {
  comercial_id: string
  name: string
  email: string | null
  invisible: boolean
  es_prueba: boolean
  clientes_total: number
  clientes_mes: number
  comision_total: number
  comision_cobrada: number
  comision_pendiente: number
  ultimo_cierre: string | null
}

export interface FacturacionResumen {
  cobrado_total: number
  pendiente_total: number
  cobrado_mes: number
  cobrado_diagnostico: number
  cobrado_setup_50: number
  cobrado_setup_resto: number
  cobrado_mantenimiento: number
  comisiones_devengadas: number
  neto: number
  comisiones_prueba: number
  comerciales_prueba: number
}

export interface FacturacionMes {
  mes: string
  cobrado: number
  pendiente: number
}

export interface PagoPendiente {
  pago_id: string
  cliente_id: string
  nombre_empresa: string
  comercial_name: string | null
  tipo: string
  monto: number
  created_at: string
}

export interface ClienteComercial {
  cliente_id: string
  nombre_empresa: string
  estado: string
  created_at: string
  diagnostico_precio: number | null
  comision_total: number
  cobrado: number
}

export interface Prospecto {
  id: string
  nombre_empresa: string
  sector: string | null
  ciudad: string | null
  pais: string
  telefono: string | null
  email: string | null
  web: string | null
  score: number
  importante: boolean
  score_motivo: string | null
  estado: string
  asignado_at: string | null
  contactado_at: string | null
}

export interface ProspectoAdmin {
  id: string
  nombre_empresa: string
  sector: string | null
  ciudad: string | null
  pais: string
  telefono: string | null
  email: string | null
  web: string | null
  score: number
  importante: boolean
  score_motivo: string | null
  estado: string
  comercial_id: string | null
  comercial_nombre: string | null
  asignado_at: string | null
  contactado_at: string | null
  motivo_descarte: string | null
  nota_descarte: string | null
  descartado_at: string | null
  created_at: string
}

export interface ProspectosResumen {
  total: number
  sin_asignar: number
  asignados: number
  contactados: number
  descartados: number
  importantes: number
}

export interface ProspectosPorComercial {
  comercial_id: string
  comercial_nombre: string
  total: number
  sin_contactar: number
  contactados: number
  importantes: number
}

/** Recuento de descartes por motivo, para ver qué falla en la captación. */
export interface MotivoDescarteRecuento {
  motivo: string
  total: number
  importantes: number
}
