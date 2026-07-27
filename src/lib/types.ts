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

export interface DiagnosticoPendiente {
  diagnostico_id: string
  cliente_id: string
  nombre_empresa: string
  precio_final: number | null
  precio_fuera_de_rango: boolean
  respuestas_tally: unknown
  pdf_url: string | null
  contenido_json: unknown
  diag_estado: string
  cliente_estado: string
  created_at: string
}
