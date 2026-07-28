import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { fm, fmtDate } from '@/lib/format'
import { MONTHS } from '@/routes/comercial/data'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { FacturacionResumen, FacturacionMes, PagoPendiente } from '@/lib/types'

const CUR_Y = new Date().getFullYear()

const TIPO_LABEL: Record<string, string> = {
  diagnostico: 'Diagnóstico',
  setup_50: 'Setup 50% inicial',
  setup_resto: 'Setup 50% restante',
  mantenimiento: 'Mantenimiento',
}

export function FacturacionTab() {
  const [resumen, setResumen] = useState<FacturacionResumen | null>(null)
  const [meses, setMeses] = useState<FacturacionMes[] | null>(null)
  const [pendientes, setPendientes] = useState<PagoPendiente[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.rpc('ceo_facturacion_resumen'),
      supabase.rpc('ceo_facturacion_mensual', { p_meses: 12 }),
      supabase.rpc('ceo_pagos_pendientes'),
    ]).then(([r, m, p]) => {
      if (cancelled) return
      setResumen((r.data?.[0] as FacturacionResumen | undefined) ?? null)
      setMeses((m.data as FacturacionMes[]) ?? [])
      setPendientes((p.data as PagoPendiente[]) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const desglose = resumen
    ? [
        { tipo: 'diagnostico', monto: Number(resumen.cobrado_diagnostico) || 0 },
        { tipo: 'setup_50', monto: Number(resumen.cobrado_setup_50) || 0 },
        { tipo: 'setup_resto', monto: Number(resumen.cobrado_setup_resto) || 0 },
        { tipo: 'mantenimiento', monto: Number(resumen.cobrado_mantenimiento) || 0 },
      ]
    : []
  const desgloseTotal = desglose.reduce((s, d) => s + d.monto, 0)
  const maxMes = meses?.reduce((mx, m) => Math.max(mx, Number(m.cobrado) || 0), 0) ?? 0

  const comercialesPrueba = Number(resumen?.comerciales_prueba ?? 0)
  const comisionesPrueba = Number(resumen?.comisiones_prueba ?? 0)

  return (
    <div>
      {comercialesPrueba > 0 && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-sm font-bold text-amber-500">
            Hay datos de prueba en el tablero
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {comercialesPrueba} comercial{comercialesPrueba === 1 ? '' : 'es'} sembrado
            {comercialesPrueba === 1 ? '' : 's'} para que el equipo vea competencia en el ranking.
            Sus {fm(comisionesPrueba)} de comisiones quedan fuera del neto de aquí abajo, pero sí
            aparecen en la pestaña Comerciales (marcados como «prueba») y en el ranking que ven los
            comerciales.
          </p>
        </div>
      )}

      {/* Cifras principales: KPI row, no un gráfico. */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Cobrado total</div>
          <div className="text-2xl font-extrabold text-emerald-500">
            {resumen ? fm(Number(resumen.cobrado_total)) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">pagos confirmados</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Cobrado este mes</div>
          <div className="text-2xl font-extrabold">
            {resumen ? fm(Number(resumen.cobrado_mes)) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {MONTHS[new Date().getMonth()]} {CUR_Y}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Pendiente de cobro</div>
          <div className="text-2xl font-extrabold text-amber-500">
            {resumen ? fm(Number(resumen.pendiente_total)) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">facturado, sin cobrar</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Neto</div>
          <div className="text-2xl font-extrabold">{resumen ? fm(Number(resumen.neto)) : '—'}</div>
          <div className="text-xs text-muted-foreground">
            tras {resumen ? fm(Number(resumen.comisiones_devengadas)) : '—'} de comisiones
          </div>
        </Card>
      </div>

      {/* Evolución mensual: una sola serie -> un solo tono, sin leyenda. */}
      <Card className="mb-5 p-5">
        <div className="text-sm font-bold">Facturación cobrada · últimos 12 meses</div>
        <div className="mb-5 text-xs text-muted-foreground">
          Agrupada por el mes del cobro. Pasa el cursor por una barra para ver el importe.
        </div>
        {!meses ? (
          <EmptyList>Cargando…</EmptyList>
        ) : maxMes === 0 ? (
          <EmptyList>Todavía no hay cobros registrados.</EmptyList>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {meses.map((m) => {
              const val = Number(m.cobrado) || 0
              const pct = maxMes > 0 ? (val / maxMes) * 100 : 0
              const d = new Date(m.mes + 'T00:00:00')
              const label = MONTHS[d.getMonth()]
              return (
                <div
                  key={m.mes}
                  className="group flex flex-1 flex-col items-center gap-2"
                  title={`${label} ${d.getFullYear()}: ${fm(val)} cobrado`}
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-emerald-500/80 transition-colors group-hover:bg-emerald-400"
                      style={{ height: `${Math.max(pct, val > 0 ? 2 : 0)}%` }}
                    />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
                      {fm(val)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Desglose por tipo: 4 valores -> filas etiquetadas, no un gráfico. */}
      <Card className="mb-5 p-5">
        <div className="mb-4 text-sm font-bold">Desglose de lo cobrado por tipo</div>
        {!resumen ? (
          <EmptyList>Cargando…</EmptyList>
        ) : desgloseTotal === 0 ? (
          <EmptyList>Todavía no hay cobros registrados.</EmptyList>
        ) : (
          <div className="flex flex-col gap-3">
            {desglose.map((d) => {
              const pct = desgloseTotal > 0 ? (d.monto / desgloseTotal) * 100 : 0
              return (
                <div key={d.tipo}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>{TIPO_LABEL[d.tipo] ?? d.tipo}</span>
                    <span className="font-bold">
                      {fm(d.monto)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {Math.round(pct)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-emerald-500/80" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Pendiente de cobro: muchas filas -> tabla. */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-bold">Pendiente de cobro</div>
          <div className="text-xs text-muted-foreground">
            {pendientes ? `${pendientes.length} pago${pendientes.length === 1 ? '' : 's'}` : '—'}
          </div>
        </div>
        {!pendientes ? (
          <EmptyList>Cargando…</EmptyList>
        ) : pendientes.length === 0 ? (
          <EmptyList>Nada pendiente de cobro.</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {pendientes.map((p) => (
              <div
                key={p.pago_id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.nombre_empresa}</div>
                  <div className="text-xs text-muted-foreground">
                    {TIPO_LABEL[p.tipo] ?? p.tipo}
                    {p.comercial_name ? ` · ${p.comercial_name}` : ''}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</div>
                <div className="text-sm font-bold text-amber-500">{fm(Number(p.monto))}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
