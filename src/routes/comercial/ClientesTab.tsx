import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { fm } from '@/lib/format'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { Carpeta, LinkPago } from '@/lib/types'

const ESTADOS: Record<string, [string, string]> = {
  nuevo: ['Nuevo', 'text-muted-foreground'],
  diagnostico_pagado: ['Diagnóstico pagado', 'text-emerald-500'],
  diagnostico_entregado: ['Diagnóstico entregado', 'text-emerald-500'],
  setup_elegido: ['Setup elegido', 'text-amber-500'],
  setup_pagado_50: ['Setup 50% pagado', 'text-amber-500'],
  setup_entregado: ['Setup entregado', 'text-amber-500'],
  setup_pagado_100: ['Setup 100% pagado', 'text-emerald-500'],
  mantenimiento_activo: ['Mantenimiento activo', 'text-emerald-500'],
}

export function ClientesTab({ comercialId }: { comercialId: string }) {
  const [carpetas, setCarpetas] = useState<Carpeta[] | null>(null)
  const [openCliente, setOpenCliente] = useState<Carpeta | null>(null)
  const [links, setLinks] = useState<LinkPago[] | null>(null)

  useEffect(() => {
    supabase
      .rpc('get_carpetas_comercial', { p_comercial_id: comercialId })
      .then(({ data, error }) => {
        if (error) return
        setCarpetas((data as Carpeta[]) ?? [])
      })
  }, [comercialId])

  async function verLinks(c: Carpeta) {
    setOpenCliente(c)
    setLinks(null)
    const { data, error } = await supabase.rpc('get_links_pago', {
      p_cliente_id: c.cliente_id,
      p_comercial_id: comercialId,
    })
    if (error) {
      setLinks([])
      return
    }
    setLinks((data as LinkPago[]) ?? [])
  }

  return (
    <div>
      <Card className="mb-5 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="text-sm font-semibold">Carpetas de cliente</div>
          <div className="text-xs text-muted-foreground">
            {carpetas ? `${carpetas.length} cliente${carpetas.length === 1 ? '' : 's'}` : '—'}
          </div>
        </div>
        {!carpetas ? (
          <EmptyList>Cargando…</EmptyList>
        ) : carpetas.length === 0 ? (
          <EmptyList>Aún no hay clientes. Comparte tu link de referido para captar el primero.</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {carpetas.map((c) => {
              const [label, color] = ESTADOS[c.estado] ?? [c.estado, 'text-muted-foreground']
              return (
                <button
                  key={c.cliente_id}
                  onClick={() => verLinks(c)}
                  // Móvil: importes en segunda línea. sm+: fila de 4 columnas.
                  className="grid grid-cols-[36px_1fr] items-center gap-x-3 gap-y-2 rounded-lg border p-3 text-left hover:bg-muted/40 sm:grid-cols-[36px_1fr_auto_auto]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                    {(c.nombre_empresa || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.nombre_empresa}</div>
                    <div className={`text-xs ${color}`}>{label}</div>
                  </div>
                  <div className="col-start-2 flex gap-6 sm:col-start-auto sm:block sm:text-right">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Diagnóstico</div>
                      <div className="text-sm font-bold whitespace-nowrap">
                        {c.precio_fuera_de_rango && (
                          <span title="Precio fuera de rango 200-400€" className="text-amber-500">
                            ⚠︎{' '}
                          </span>
                        )}
                        {c.diagnostico_precio ? fm(c.diagnostico_precio) : '—'}
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <div className="text-[10px] text-muted-foreground">Tu comisión</div>
                      <div className="text-sm font-bold whitespace-nowrap text-emerald-500">
                        {fm(c.comision_total || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] text-muted-foreground">Tu comisión</div>
                    <div className="text-sm font-bold whitespace-nowrap text-emerald-500">
                      {fm(c.comision_total || 0)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {openCliente && (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 text-sm font-semibold">
              🔗 Links de pago · {openCliente.nombre_empresa}
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setOpenCliente(null)}>
              Cerrar
            </Button>
          </div>
          {!links ? (
            <EmptyList>Cargando…</EmptyList>
          ) : links.length === 0 ? (
            <EmptyList>Todavía no hay links de pago para este cliente.</EmptyList>
          ) : (
            <div className="flex flex-col gap-2">
              {links.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{l.etiqueta}</div>
                    <div className="text-xs">
                      {l.pagado ? (
                        <span className="text-emerald-500">✓ Pagado</span>
                      ) : (
                        <span className="text-amber-500">Pendiente</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold whitespace-nowrap">{fm(l.monto || 0)}</div>
                  <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                    {!l.pagado && l.url && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(l.url!)}>
                          Copiar
                        </Button>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener"
                          className="rounded-full border px-3 py-1 text-xs"
                        >
                          Abrir
                        </a>
                      </>
                    )}
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
