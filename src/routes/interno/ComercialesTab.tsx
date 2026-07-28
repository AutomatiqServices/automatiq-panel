import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { fm, fmtDate } from '@/lib/format'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { ResumenComercial, ClienteComercial } from '@/lib/types'

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  diagnostico_pagado: 'Diagnóstico pagado',
  diagnostico_entregado: 'Diagnóstico entregado',
  setup_elegido: 'Setup elegido',
  setup_pagado_50: 'Setup 50% pagado',
  setup_entregado: 'Setup entregado',
  setup_pagado_100: 'Setup 100% pagado',
  mantenimiento_activo: 'Mantenimiento activo',
}

export function ComercialesTab() {
  const [rows, setRows] = useState<ResumenComercial[] | null>(null)
  const [openComercial, setOpenComercial] = useState<ResumenComercial | null>(null)
  const [clientes, setClientes] = useState<ClienteComercial[] | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('ceo_resumen_comerciales').then(({ data, error }) => {
      if (cancelled || error) return
      setRows((data as ResumenComercial[]) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function verClientes(c: ResumenComercial) {
    setOpenComercial(c)
    setClientes(null)
    const { data, error } = await supabase.rpc('ceo_clientes_comercial', {
      p_comercial_id: c.comercial_id,
    })
    setClientes(error ? [] : ((data as ClienteComercial[]) ?? []))
  }

  const totales = rows?.reduce(
    (acc, r) => ({
      clientes: acc.clientes + Number(r.clientes_total),
      mes: acc.mes + Number(r.clientes_mes),
      cobrada: acc.cobrada + Number(r.comision_cobrada),
      pendiente: acc.pendiente + Number(r.comision_pendiente),
    }),
    { clientes: 0, mes: 0, cobrada: 0, pendiente: 0 },
  )

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Comerciales</div>
          <div className="text-2xl font-extrabold">{rows ? rows.length : '—'}</div>
          <div className="text-xs text-muted-foreground">dados de alta</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Clientes totales</div>
          <div className="text-2xl font-extrabold">{totales ? totales.clientes : '—'}</div>
          <div className="text-xs text-muted-foreground">
            {totales ? `${totales.mes} este mes` : ''}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Comisión pagada</div>
          <div className="text-2xl font-extrabold text-emerald-500">
            {totales ? fm(totales.cobrada) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">ya abonada</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide text-muted-foreground uppercase">Comisión a pagar</div>
          <div className="text-2xl font-extrabold text-amber-500">
            {totales ? fm(totales.pendiente) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">pendiente de abonar</div>
        </Card>
      </div>

      <Card className="mb-5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-bold">Equipo comercial</div>
          <div className="text-xs text-muted-foreground">
            Pulsa un comercial para ver sus clientes
          </div>
        </div>
        {!rows ? (
          <EmptyList>Cargando…</EmptyList>
        ) : rows.length === 0 ? (
          <EmptyList>No hay comerciales dados de alta.</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <button
                key={r.comercial_id}
                onClick={() => verClientes(r)}
                className="grid grid-cols-[36px_1fr_auto_auto_auto] items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                  {(r.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{r.name}</span>
                    {r.es_prueba && (
                      <Badge variant="outline" className="border-amber-500/40 text-xs text-amber-500">
                        prueba
                      </Badge>
                    )}
                    {r.invisible && (
                      <Badge variant="secondary" className="text-xs">
                        oculto
                      </Badge>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.ultimo_cierre
                      ? `Último cierre: ${fmtDate(r.ultimo_cierre)}`
                      : 'Sin cierres todavía'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Clientes</div>
                  <div className="text-sm font-bold">
                    {r.clientes_total}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({r.clientes_mes} mes)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Cobrada</div>
                  <div className="text-sm font-bold text-emerald-500">
                    {fm(Number(r.comision_cobrada))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">A pagar</div>
                  <div className="text-sm font-bold text-amber-500">
                    {fm(Number(r.comision_pendiente))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {openComercial && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-bold">Clientes de {openComercial.name}</div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-xs"
              onClick={() => setOpenComercial(null)}
            >
              Cerrar
            </Button>
          </div>
          {!clientes ? (
            <EmptyList>Cargando…</EmptyList>
          ) : clientes.length === 0 ? (
            <EmptyList>Este comercial todavía no tiene clientes.</EmptyList>
          ) : (
            <div className="flex flex-col gap-2">
              {clientes.map((c) => (
                <div
                  key={c.cliente_id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.nombre_empresa}</div>
                    <div className="text-xs text-muted-foreground">
                      {ESTADO_LABEL[c.estado] ?? c.estado} · {fmtDate(c.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Diagnóstico</div>
                    <div className="text-sm font-bold">
                      {c.diagnostico_precio ? fm(Number(c.diagnostico_precio)) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Cobrado</div>
                    <div className="text-sm font-bold text-emerald-500">{fm(Number(c.cobrado))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Comisión</div>
                    <div className="text-sm font-bold">{fm(Number(c.comision_total))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
