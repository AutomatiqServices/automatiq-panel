import { supabase } from '@/lib/supabase'
import type { Carpeta } from '@/lib/types'

export interface Sale {
  id: string
  client_name: string
  created_at: string
  estado: string
  commission: number
  cobrada: number
  pendiente: number
}

export function carpetaToSale(c: Carpeta): Sale {
  return {
    id: c.cliente_id,
    client_name: c.nombre_empresa,
    created_at: c.created_at,
    estado: c.estado,
    commission: Number(c.comision_total) || 0,
    cobrada: Number(c.comision_cobrada) || 0,
    pendiente: Number(c.comision_pendiente) || 0,
  }
}

export async function loadSales(comercialId: string): Promise<Sale[]> {
  const { data, error } = await supabase.rpc('get_carpetas_comercial', {
    p_comercial_id: comercialId,
  })
  if (error) return []
  return ((data as Carpeta[]) ?? [])
    .map(carpetaToSale)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function getMonthSales(sales: Sale[], month: number, year: number): Sale[] {
  return sales.filter((s) => {
    const d = new Date(s.created_at)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const GOAL = 8
