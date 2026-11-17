import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { fm, fmtDate } from '@/lib/format'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type {
  FacturacionResumen,
  PagoPendiente,
  ProspectosResumen,
  ResumenComercial,
  DiagnosticoPendiente,
} from '@/lib/types'

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'text-emerald-500' : tone === 'warn' ? 'text-amber-500' : ''
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}

/** Vista CEO: resumen en una pantalla de dinero, embudo, equipo y trabajo pendiente. */
export function CeoTab() {
  const [fac, setFac] = useState<FacturacionResumen | null>(null)
  const [pend, setPend] = useState<PagoPendiente[] | null>(null)
  const [pros, setPros] = useState<ProspectosResumen | null>(null)
  const [coms, setComs] = useState<ResumenComercial[] | null>(null)
  const [diag, setDiag] = useState<DiagnosticoPendiente[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.rpc('ceo_facturacion_resumen'),
      supabase.rpc('ceo_pagos_pendientes'),
      supabase.rpc('ceo_prospectos_resumen'),
      supabase.rpc('ceo_resumen_comerciales'),
      supabase.rpc('get_diagnosticos_pendientes'),
    ]).then(([f, p, r, c, d]) => {
      if (cancelled) return
      const one = <T,>(x: unknown) => (Array.isArray(x) ? (x[0] as T) : (x as T)) ?? null
      setFac(f.error ? null : one<FacturacionResumen>(f.data))
      setPend(p.error ? [] : ((p.data as PagoPendiente[]) ?? []))
      setPros(r.error ? null : one<ProspectosResumen>(r.data))
      setComs(c.error ? [] : ((c.data as ResumenComercial[]) ?? []))
      setDiag(d.error ? [] : ((d.data as DiagnosticoPendiente[]) ?? []))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const activos = coms?.filter((c) => !c.es_prueba && !c.invisible) ?? []
  const ranking = [...activos].sort((a, b) => Number(b.clientes_mes) - Number(a.clientes_mes)).slice(0, 5)
  const contactadosPct =
    pros && pros.total > 0 ? Math.round((pros.contactados / pros.total) * 100) : 0

  return (
    <div>
      <div className="mb-4 text-xs text-muted-foreground">Vista CEO · datos en vivo</div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Cobrado este mes" value={fac ? fm(Number(fac.cobrado_mes)) : '—'} tone="ok" />
        <Kpi label="Cobrado total" value={fac ? fm(Number(fac.cobrado_total)) : '—'} />
        <Kpi label="Pendiente de cobro" value={fac ? fm(Number(fac.pendiente_total)) : '—'} tone="warn" />
        <Kpi
          label="Neto tras comisiones"
          value={fac ? fm(Number(fac.neto)) : '—'}
          hint={fac ? `Comisiones: ${fm(Number(fac.comisiones_devengadas))}` : undefined}
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Mantenimiento cobrado" value={fac ? fm(Number(fac.cobrado_mantenimiento)) : '—'} hint="Ingreso recurrente" />
        <Kpi label="Leads en total" value={pros ? String(pros.total) : '—'} hint={pros ? `${pros.sin_asignar} sin asignar` : undefined} />
        <Kpi label="Leads contactados" value={pros ? `${contactadosPct}%` : '—'} hint={pros ? `${pros.contactados} de ${pros.total}` : undefined} />
        <Kpi label="Diagnósticos por revisar" value={diag ? String(diag.length) : '—'} tone={diag && diag.length > 0 ? 'warn' : undefined} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 text-sm font-bold">Equipo comercial (cierres este mes)</div>
          {!coms ? (
            <EmptyList>Cargando…</EmptyList>
          ) : ranking.length === 0 ? (
            <EmptyList>Sin comerciales activos.</EmptyList>
          ) : (
            <div className="flex flex-col gap-3">
              {ranking.map((c, i) => (
                <div key={c.comercial_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {i + 1}. {c.name}
                  </span>
                  <span className="font-bold">
                    {c.clientes_mes}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {c.clientes_total} en total
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 text-sm font-bold">Cobros pendientes más antiguos</div>
          {!pend ? (
            <EmptyList>Cargando…</EmptyList>
          ) : pend.length === 0 ? (
            <EmptyList>Nada pendiente.</EmptyList>
          ) : (
            <div className="flex flex-col gap-3">
              {[...pend]
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .slice(0, 5)
                .map((p) => (
                  <div key={p.pago_id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {p.nombre_empresa}
                      <span className="ml-2 text-xs text-muted-foreground">{fmtDate(p.created_at)}</span>
                    </span>
                    <span className="font-bold whitespace-nowrap text-amber-500">{fm(Number(p.monto))}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
